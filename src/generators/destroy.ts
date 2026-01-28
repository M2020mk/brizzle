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
  getDbPath,
  log,
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

/**
 * Removes a scaffold (model + actions + pages) and its schema definition.
 *
 * Deletes the scaffold directory (app/[model]/) and removes the table
 * definition from the schema file. Prompts for confirmation unless --force is used.
 *
 * @param name - Model name to destroy (singular, e.g., "post")
 * @param options - Destroy options (force, dryRun)
 * @example
 * await destroyScaffold("post", { force: true });
 */
export async function destroyScaffold(name: string, options: GeneratorOptions = {}): Promise<void> {
  return destroy(name, "scaffold", (ctx) => path.join(getAppPath(), ctx.kebabPlural), options);
}

/**
 * Removes a resource (model + actions) and its schema definition.
 *
 * Deletes the resource directory (app/[model]/) and removes the table
 * definition from the schema file. Prompts for confirmation unless --force is used.
 *
 * @param name - Model name to destroy (singular, e.g., "session")
 * @param options - Destroy options (force, dryRun)
 * @example
 * await destroyResource("session", { force: true });
 */
export async function destroyResource(name: string, options: GeneratorOptions = {}): Promise<void> {
  return destroy(name, "resource", (ctx) => path.join(getAppPath(), ctx.kebabPlural), options);
}

/**
 * Removes an API (model + route handlers) and its schema definition.
 *
 * Deletes the API routes directory (app/api/[model]/) and removes the table
 * definition from the schema file. Prompts for confirmation unless --force is used.
 *
 * @param name - Model name to destroy (singular, e.g., "product")
 * @param options - Destroy options (force, dryRun)
 * @example
 * await destroyApi("product", { force: true });
 */
export async function destroyApi(name: string, options: GeneratorOptions = {}): Promise<void> {
  return destroy(name, "API", (ctx) => path.join(getAppPath(), "api", ctx.kebabPlural), options);
}
