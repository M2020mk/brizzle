import { program } from "commander";
import { createRequire } from "module";
import { generateModel } from "./generators/model";
import { generateActions } from "./generators/actions";
import { generateScaffold } from "./generators/scaffold";
import { generateResource } from "./generators/resource";
import { generateApi } from "./generators/api";
import { destroyScaffold, destroyResource, destroyApi } from "./generators/destroy";
import { log, detectProjectConfig, detectDialect, GeneratorOptions, DestroyType } from "./lib";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

function handleError(error: unknown): void {
  if (error instanceof Error) {
    log.error(error.message);
  } else {
    log.error(String(error));
  }
  process.exit(1);
}

program.name("brizzle").description("Rails-like generators for Next.js + Drizzle").version(version);

// ============================================================================
// Generate commands
// ============================================================================

// Commander's --no-timestamps flag sets timestamps to false
interface CommanderOptions extends GeneratorOptions {
  timestamps?: boolean;
}

program
  .command("model <name> [fields...]")
  .description(
    `Generate a Drizzle schema model

  Examples:
    brizzle model user name:string email:string:unique
    brizzle model post title:string body:text published:boolean
    brizzle model order total:decimal status:enum:pending,paid,shipped
    brizzle model token value:uuid --uuid --no-timestamps
    brizzle model comment content:text? author:string`
  )
  .option("-f, --force", "Overwrite existing files")
  .option("-n, --dry-run", "Preview changes without writing files")
  .option("-u, --uuid", "Use UUID for primary key instead of auto-increment")
  .option("--no-timestamps", "Skip createdAt/updatedAt fields")
  .action((name: string, fields: string[], opts: CommanderOptions) => {
    try {
      generateModel(name, fields, {
        ...opts,
        noTimestamps: opts.timestamps === false,
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command("actions <name>")
  .description(
    `Generate server actions for an existing model

  Examples:
    brizzle actions user
    brizzle actions post --force`
  )
  .option("-f, --force", "Overwrite existing files")
  .option("-n, --dry-run", "Preview changes without writing files")
  .action((name: string, opts: CommanderOptions) => {
    try {
      generateActions(name, opts);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command("resource <name> [fields...]")
  .description(
    `Generate model and actions (no views)

  Examples:
    brizzle resource user name:string email:string:unique
    brizzle resource session token:uuid userId:references:user --uuid`
  )
  .option("-f, --force", "Overwrite existing files")
  .option("-n, --dry-run", "Preview changes without writing files")
  .option("-u, --uuid", "Use UUID for primary key instead of auto-increment")
  .option("--no-timestamps", "Skip createdAt/updatedAt fields")
  .action((name: string, fields: string[], opts: CommanderOptions) => {
    try {
      generateResource(name, fields, {
        ...opts,
        noTimestamps: opts.timestamps === false,
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command("scaffold <name> [fields...]")
  .description(
    `Generate model, actions, and pages (full CRUD)

  Examples:
    brizzle scaffold post title:string body:text published:boolean
    brizzle scaffold product name:string price:float description:text?
    brizzle scaffold order status:enum:pending,processing,shipped,delivered`
  )
  .option("-f, --force", "Overwrite existing files")
  .option("-n, --dry-run", "Preview changes without writing files")
  .option("-u, --uuid", "Use UUID for primary key instead of auto-increment")
  .option("--no-timestamps", "Skip createdAt/updatedAt fields")
  .action((name: string, fields: string[], opts: CommanderOptions) => {
    try {
      generateScaffold(name, fields, {
        ...opts,
        noTimestamps: opts.timestamps === false,
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command("api <name> [fields...]")
  .description(
    `Generate model and API route handlers (REST)

  Examples:
    brizzle api product name:string price:float
    brizzle api webhook url:string secret:string:unique --uuid`
  )
  .option("-f, --force", "Overwrite existing files")
  .option("-n, --dry-run", "Preview changes without writing files")
  .option("-u, --uuid", "Use UUID for primary key instead of auto-increment")
  .option("--no-timestamps", "Skip createdAt/updatedAt fields")
  .action((name: string, fields: string[], opts: CommanderOptions) => {
    try {
      generateApi(name, fields, {
        ...opts,
        noTimestamps: opts.timestamps === false,
      });
    } catch (error) {
      handleError(error);
    }
  });

// ============================================================================
// Destroy commands
// ============================================================================

program
  .command("destroy <type> <name>")
  .alias("d")
  .description(
    `Remove generated files (scaffold, resource, api)

  Examples:
    brizzle destroy scaffold post
    brizzle d api product --dry-run`
  )
  .option("-f, --force", "Skip confirmation prompt")
  .option("-n, --dry-run", "Preview changes without deleting files")
  .action(async (type: string, name: string, opts: CommanderOptions) => {
    try {
      const validTypes: DestroyType[] = ["scaffold", "resource", "api"];
      if (!validTypes.includes(type as DestroyType)) {
        throw new Error(`Unknown type "${type}". Use: scaffold, resource, or api`);
      }

      const destroyType = type as DestroyType;
      switch (destroyType) {
        case "scaffold":
          await destroyScaffold(name, opts);
          break;
        case "resource":
          await destroyResource(name, opts);
          break;
        case "api":
          await destroyApi(name, opts);
          break;
      }
    } catch (error) {
      handleError(error);
    }
  });

// ============================================================================
// Config command
// ============================================================================

program
  .command("config")
  .description("Show detected project configuration")
  .action(() => {
    const config = detectProjectConfig();
    const dialect = detectDialect();

    console.log("\nDetected project configuration:\n");
    console.log(
      `  Project structure:  ${config.useSrc ? "src/ (e.g., src/app/, src/db/)" : "root (e.g., app/, db/)"}`
    );
    console.log(`  Path alias:         ${config.alias}/`);
    console.log(`  App directory:      ${config.appPath}/`);
    console.log(`  DB directory:       ${config.dbPath}/`);
    console.log(`  Database dialect:   ${dialect}`);
    console.log();
    console.log("Imports will use:");
    console.log(`  DB:     ${config.alias}/${config.dbPath.replace(/^src\//, "")}`);
    console.log(`  Schema: ${config.alias}/${config.dbPath.replace(/^src\//, "")}/schema`);
    console.log();
  });

program.parse();
