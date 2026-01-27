import * as path from "path";
import { confirm, isCancel } from "@clack/prompts";
import {
  validateModelName,
  createModelContext,
  deleteDirectory,
  fileExists,
  readFile,
  writeFile,
  modelExistsInSchema,
  removeModelFromSchemaContent,
  getAppPath,
  getDbPath,  log,
  GeneratorOptions,
  ModelContext,
} from "../lib";

type PathBuilder = (ctx: ModelContext) => string;

async function destroy(
  name: string,
  type: string,
  buildPath: PathBuilder,
  options: GeneratorOptions = {}
): Promise<void> {
  validateModelName(name);

  const ctx = createModelContext(name);
  const prefix = options.dryRun ? "[dry-run] " : "";

  log.info(`\n${prefix}Destroying ${type} ${ctx.pascalName}...\n`);

  const basePath = buildPath(ctx);

  if (!options.dryRun && !options.force && fileExists(basePath)) {
    const confirmed = await confirm({
      message: `Delete ${basePath}?`,
    });

    if (isCancel(confirmed) || !confirmed) {
      log.info("Aborted.");
      return;
    }
  }

  deleteDirectory(basePath, options);
  removeFromSchema(ctx.tableName, options);
}

function removeFromSchema(tableName: string, options: GeneratorOptions): void {
  if (!modelExistsInSchema(tableName)) {
    return;
  }

  const schemaPath = path.join(getDbPath(), "schema.ts");
  const content = readFile(schemaPath);
  const cleaned = removeModelFromSchemaContent(content, tableName);
  writeFile(schemaPath, cleaned, { force: true, dryRun: options.dryRun });
}

export async function destroyScaffold(name: string, options: GeneratorOptions = {}): Promise<void> {
  return destroy(name, "scaffold", (ctx) => path.join(getAppPath(), ctx.kebabPlural), options);
}

export async function destroyResource(name: string, options: GeneratorOptions = {}): Promise<void> {
  return destroy(name, "resource", (ctx) => path.join(getAppPath(), ctx.kebabPlural), options);
}

export async function destroyApi(name: string, options: GeneratorOptions = {}): Promise<void> {
  return destroy(name, "API", (ctx) => path.join(getAppPath(), "api", ctx.kebabPlural), options);
}
