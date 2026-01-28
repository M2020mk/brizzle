import * as fs from "fs";
import * as path from "path";
import type { GeneratorOptions } from "./types";
import { log } from "./logger";
import { getDbPath } from "./config";

/**
 * Writes content to a file with logging and option handling.
 *
 * Handles file creation, directory creation, and respects force/dryRun options.
 * Logs the action taken (create, skip, force, or would create).
 *
 * @param filePath - Absolute path to the file to write
 * @param content - Content to write to the file
 * @param options - Generation options (force to overwrite, dryRun to preview)
 * @returns true if file was written (or would be in dry-run), false if skipped
 * @example
 * writeFile("/path/to/file.ts", "content", { force: true });
 */
export function writeFile(
  filePath: string,
  content: string,
  options: GeneratorOptions = {}
): boolean {
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

/**
 * Deletes a directory and its contents with logging.
 *
 * Respects dryRun option to preview deletion without actually deleting.
 *
 * @param dirPath - Absolute path to the directory to delete
 * @param options - Generation options (dryRun to preview)
 * @returns true if directory was deleted (or would be in dry-run), false if not found
 * @example
 * deleteDirectory("/path/to/directory", { dryRun: true });
 */
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

/**
 * Checks if a file exists at the given path.
 *
 * @param filePath - Absolute path to check
 * @returns true if file exists, false otherwise
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Reads and returns the contents of a file.
 *
 * @param filePath - Absolute path to the file to read
 * @returns File contents as a string
 * @throws {Error} If file does not exist or cannot be read
 */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks if a model (table) exists in the schema file.
 *
 * Searches for table definitions using any supported Drizzle table function
 * (sqliteTable, pgTable, or mysqlTable).
 *
 * @param tableName - The SQL table name to search for (e.g., "posts")
 * @returns true if the table definition exists in schema.ts
 * @example
 * modelExistsInSchema("posts") // true if posts table is defined
 */
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

/**
 * Removes a model (table) definition from schema content.
 *
 * Parses the schema content and removes the complete table definition,
 * including the export statement and all fields. Handles brace matching
 * to correctly identify the end of the definition.
 *
 * @param content - The schema file content
 * @param tableName - The SQL table name to remove (e.g., "posts")
 * @returns Schema content with the model removed, or original content if not found
 * @example
 * const newContent = removeModelFromSchemaContent(schemaContent, "posts");
 */
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
