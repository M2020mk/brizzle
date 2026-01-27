import * as fs from "fs";
import * as path from "path";
import type { GeneratorOptions } from "./types";
import { log } from "./logger";
import { getDbPath } from "./config";

export function writeFile(filePath: string, content: string, options: GeneratorOptions = {}): boolean {
  const exists = fs.existsSync(filePath);

  if (exists && !options.force) {
    log.skip(filePath);
    return false;
  }

  if (options.dryRun) {
    if (exists && options.force) {
      log.wouldForce(filePath);
    } else {
      log.wouldCreate(filePath);
    }
    return true;
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content);

  if (exists && options.force) {
    log.force(filePath);
  } else {
    log.create(filePath);
  }

  return true;
}

export function deleteDirectory(dirPath: string, options: GeneratorOptions = {}): boolean {
  if (!fs.existsSync(dirPath)) {
    log.notFound(dirPath);
    return false;
  }

  if (options.dryRun) {
    log.wouldRemove(dirPath);
    return true;
  }

  fs.rmSync(dirPath, { recursive: true });
  log.remove(dirPath);
  return true;
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function modelExistsInSchema(tableName: string): boolean {
  const schemaPath = path.join(getDbPath(), "schema.ts");

  if (!fs.existsSync(schemaPath)) {
    return false;
  }

  const content = fs.readFileSync(schemaPath, "utf-8");
  // Check for table definition with any dialect: sqliteTable, pgTable, or mysqlTable
  const pattern = new RegExp(
    `(?:sqliteTable|pgTable|mysqlTable)\\s*\\(\\s*["']${escapeRegExp(tableName)}["']`
  );
  return pattern.test(content);
}

export function removeModelFromSchemaContent(content: string, tableName: string): string {
  const lines = content.split("\n");

  // Find the table definition: export const xxx = xxxTable("tableName", {
  const tablePattern = new RegExp(
    `^export\\s+const\\s+\\w+\\s*=\\s*(?:sqliteTable|pgTable|mysqlTable)\\s*\\(\\s*["']${escapeRegExp(tableName)}["']`
  );

  let startIdx = -1;
  let endIdx = -1;
  let braceCount = 0;
  let foundOpenBrace = false;

  for (let i = 0; i < lines.length; i++) {
    if (startIdx === -1) {
      if (tablePattern.test(lines[i])) {
        startIdx = i;
      } else {
        continue;
      }
    }

    for (const char of lines[i]) {
      if (char === "{") {
        braceCount++;
        foundOpenBrace = true;
      } else if (char === "}") {
        braceCount--;
      }
    }

    if (foundOpenBrace && braceCount === 0) {
      endIdx = i;
      break;
    }
  }

  if (startIdx === -1 || endIdx === -1) {
    return content;
  }

  lines.splice(startIdx, endIdx - startIdx + 1);

  // Clean up consecutive blank lines
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
