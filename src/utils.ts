import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Types
// ============================================================================

export interface Field {
  name: string;
  type: string;
  isReference: boolean;
  referenceTo?: string;
  isEnum: boolean;
  enumValues?: string[];
  nullable: boolean;
  unique: boolean;
}

export interface GeneratorOptions {
  force?: boolean;
  dryRun?: boolean;
  uuid?: boolean;
  noTimestamps?: boolean;
}

export interface ModelContext {
  name: string;
  singularName: string;
  pluralName: string;
  pascalName: string;
  pascalPlural: string;
  camelName: string;
  camelPlural: string;
  snakeName: string;
  snakePlural: string;
  kebabName: string;
  kebabPlural: string;
  tableName: string;
}

const VALID_FIELD_TYPES = [
  "string",
  "text",
  "integer",
  "int",
  "bigint",
  "boolean",
  "bool",
  "datetime",
  "timestamp",
  "date",
  "float",
  "decimal",
  "json",
  "uuid",
] as const;

// ============================================================================
// Dialect Detection
// ============================================================================

export type Dialect = "sqlite" | "postgresql" | "mysql";

export function detectDialect(): Dialect {
  const configPath = path.join(process.cwd(), "drizzle.config.ts");

  if (!fs.existsSync(configPath)) {
    return "sqlite"; // default
  }

  const content = fs.readFileSync(configPath, "utf-8");

  // Match dialect: "value" or dialect: 'value'
  const match = content.match(/dialect:\s*["'](\w+)["']/);

  if (match) {
    const dialect = match[1];
    if (["postgresql", "postgres", "pg"].includes(dialect)) {
      return "postgresql";
    }
    if (["mysql", "mysql2"].includes(dialect)) {
      return "mysql";
    }
  }

  // turso, sqlite, libsql, better-sqlite3 are all SQLite-based
  return "sqlite";
}

// ============================================================================
// Project Configuration Detection
// ============================================================================

export interface ProjectConfig {
  /** Whether the project uses src/ directory (e.g., src/app/) */
  useSrc: boolean;
  /** Path alias prefix (e.g., "@", "~", "@src") */
  alias: string;
  /** Relative path to db directory from project root (e.g., "db", "src/db", "lib/db") */
  dbPath: string;
  /** Relative path to app directory from project root (e.g., "app", "src/app") */
  appPath: string;
}

let cachedProjectConfig: ProjectConfig | null = null;

export function detectProjectConfig(): ProjectConfig {
  if (cachedProjectConfig) {
    return cachedProjectConfig;
  }

  const cwd = process.cwd();

  // Detect if src/ directory is used
  const useSrc = fs.existsSync(path.join(cwd, "src", "app"));

  // Detect path alias from tsconfig.json
  let alias = "@";
  const tsconfigPath = path.join(cwd, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    try {
      const content = fs.readFileSync(tsconfigPath, "utf-8");
      // Remove comments for parsing (simple approach for single-line comments)
      const cleanContent = content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      const tsconfig = JSON.parse(cleanContent);

      // Look for path aliases like "@/*", "~/*", "@src/*"
      const paths = tsconfig?.compilerOptions?.paths;
      if (paths) {
        for (const key of Object.keys(paths)) {
          // Match patterns like "@/*" or "~/*"
          const match = key.match(/^(@\w*|~)\//);
          if (match) {
            alias = match[1];
            break;
          }
        }
      }
    } catch {
      // Ignore parse errors, use default
    }
  }

  // Detect db path - check common locations
  let dbPath = useSrc ? "src/db" : "db";
  const possibleDbPaths = useSrc
    ? ["src/db", "src/lib/db", "src/server/db"]
    : ["db", "lib/db", "server/db"];

  for (const possiblePath of possibleDbPaths) {
    if (fs.existsSync(path.join(cwd, possiblePath))) {
      dbPath = possiblePath;
      break;
    }
  }

  // App path
  const appPath = useSrc ? "src/app" : "app";

  cachedProjectConfig = { useSrc, alias, dbPath, appPath };
  return cachedProjectConfig;
}

/** Get import path for db (e.g., "@/db" or "~/db") */
export function getDbImport(): string {
  const config = detectProjectConfig();
  // Convert path like "src/db" to just "db" for the alias
  const importPath = config.dbPath.replace(/^src\//, "");
  return `${config.alias}/${importPath}`;
}

/** Get import path for db schema (e.g., "@/db/schema") */
export function getSchemaImport(): string {
  return `${getDbImport()}/schema`;
}

/** Get full filesystem path to app directory */
export function getAppPath(): string {
  const config = detectProjectConfig();
  return path.join(process.cwd(), config.appPath);
}

/** Get full filesystem path to db directory */
export function getDbPath(): string {
  const config = detectProjectConfig();
  return path.join(process.cwd(), config.dbPath);
}

/** Reset cached config (useful for testing) */
export function resetProjectConfig(): void {
  cachedProjectConfig = null;
}

// ============================================================================
// Logging
// ============================================================================

export const log = {
  create: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`      \x1b[32mcreate\x1b[0m  ${relative}`);
  },
  force: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`       \x1b[33mforce\x1b[0m  ${relative}`);
  },
  skip: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`        \x1b[33mskip\x1b[0m  ${relative}`);
  },
  remove: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`      \x1b[31mremove\x1b[0m  ${relative}`);
  },
  notFound: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`   \x1b[33mnot found\x1b[0m  ${relative}`);
  },
  wouldCreate: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`\x1b[36mwould create\x1b[0m  ${relative}`);
  },
  wouldForce: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(` \x1b[36mwould force\x1b[0m  ${relative}`);
  },
  wouldRemove: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`\x1b[36mwould remove\x1b[0m  ${relative}`);
  },
  error: (message: string) => {
    console.error(`\x1b[31mError:\x1b[0m ${message}`);
  },
  info: (message: string) => {
    console.log(message);
  },
};

// ============================================================================
// Validation
// ============================================================================

export function validateModelName(name: string): void {
  if (!name) {
    throw new Error("Model name is required");
  }
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
    throw new Error(
      `Invalid model name "${name}". Must start with a letter and contain only letters and numbers.`
    );
  }
  const reserved = ["model", "schema", "db", "database", "table"];
  if (reserved.includes(name.toLowerCase())) {
    throw new Error(`"${name}" is a reserved word and cannot be used as a model name.`);
  }
}

export function validateFieldDefinition(fieldDef: string): void {
  const parts = fieldDef.split(":");
  let name = parts[0];
  let type = parts[1] || "string";

  // Strip nullable modifier for validation
  if (name.endsWith("?")) {
    name = name.slice(0, -1);
  }
  if (type.endsWith("?")) {
    type = type.slice(0, -1);
  }

  if (!name) {
    throw new Error(`Invalid field definition "${fieldDef}". Field name is required.`);
  }
  if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
    throw new Error(
      `Invalid field name "${name}". Must be camelCase (start with lowercase letter).`
    );
  }
  if (type && !type.startsWith("references") && type !== "enum" && type !== "unique") {
    if (!VALID_FIELD_TYPES.includes(type as (typeof VALID_FIELD_TYPES)[number])) {
      throw new Error(
        `Invalid field type "${type}". Valid types: ${VALID_FIELD_TYPES.join(", ")}, enum`
      );
    }
  }
  // Validate enum has values
  if (type === "enum") {
    const enumValues = parts[2];
    if (!enumValues || enumValues === "unique") {
      throw new Error(
        `Enum field "${name}" requires values. Example: ${name}:enum:draft,published,archived`
      );
    }
  }
}

// ============================================================================
// Parsing
// ============================================================================

export function parseFields(fields: string[]): Field[] {
  return fields.map((field) => {
    validateFieldDefinition(field);

    const parts = field.split(":");
    let name = parts[0];
    let type = parts[1] || "string";

    // Check for nullable modifier (?)
    const nullable = name.endsWith("?") || type.endsWith("?");
    if (name.endsWith("?")) {
      name = name.slice(0, -1);
    }
    if (type.endsWith("?")) {
      type = type.slice(0, -1);
    }

    // Check for unique modifier
    const unique = parts.includes("unique");

    if (type === "references") {
      return {
        name,
        type: "integer",
        isReference: true,
        referenceTo: parts[2],
        isEnum: false,
        nullable,
        unique,
      };
    }

    if (type === "enum") {
      const enumValues = parts[2]?.split(",") || [];
      return {
        name,
        type: "enum",
        isReference: false,
        isEnum: true,
        enumValues,
        nullable,
        unique,
      };
    }

    return { name, type, isReference: false, isEnum: false, nullable, unique };
  });
}

// ============================================================================
// String Transformations
// ============================================================================

export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

export function toKebabCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, "-");
}

export function pluralize(str: string): string {
  if (str.endsWith("y") && !/[aeiou]y$/.test(str)) {
    return str.slice(0, -1) + "ies";
  }
  if (str.endsWith("s") || str.endsWith("x") || str.endsWith("ch") || str.endsWith("sh")) {
    return str + "es";
  }
  return str + "s";
}

export function singularize(str: string): string {
  if (str.endsWith("ies")) {
    return str.slice(0, -3) + "y";
  }
  if (str.endsWith("es") && (str.endsWith("xes") || str.endsWith("ches") || str.endsWith("shes") || str.endsWith("sses"))) {
    return str.slice(0, -2);
  }
  if (str.endsWith("s") && !str.endsWith("ss")) {
    return str.slice(0, -1);
  }
  return str;
}

export function createModelContext(name: string): ModelContext {
  const singularName = singularize(name);
  const pluralName = pluralize(singularName);

  return {
    name,
    singularName,
    pluralName,
    pascalName: toPascalCase(singularName),
    pascalPlural: toPascalCase(pluralName),
    camelName: toCamelCase(singularName),
    camelPlural: toCamelCase(pluralName),
    snakeName: toSnakeCase(singularName),
    snakePlural: toSnakeCase(pluralName),
    kebabName: toKebabCase(singularName),
    kebabPlural: toKebabCase(pluralName),
    tableName: pluralize(toSnakeCase(singularName)),
  };
}

// ============================================================================
// Type Mappings
// ============================================================================

const SQLITE_TYPE_MAP: Record<string, string> = {
  string: "text",
  text: "text",
  integer: "integer",
  int: "integer",
  bigint: "integer", // SQLite doesn't distinguish
  boolean: 'integer({ mode: "boolean" })',
  bool: 'integer({ mode: "boolean" })',
  datetime: 'integer({ mode: "timestamp" })',
  timestamp: 'integer({ mode: "timestamp" })',
  date: 'integer({ mode: "timestamp" })',
  float: "real",
  decimal: "text", // SQLite has no native decimal
  json: "text", // Store as JSON string
  uuid: "text", // Store as text
};

const POSTGRESQL_TYPE_MAP: Record<string, string> = {
  string: "text",
  text: "text",
  integer: "integer",
  int: "integer",
  bigint: "bigint",
  boolean: "boolean",
  bool: "boolean",
  datetime: "timestamp",
  timestamp: "timestamp",
  date: "date",
  float: "doublePrecision",
  decimal: "numeric",
  json: "jsonb",
  uuid: "uuid",
};

const MYSQL_TYPE_MAP: Record<string, string> = {
  string: "varchar",
  text: "text",
  integer: "int",
  int: "int",
  bigint: "bigint",
  boolean: "boolean",
  bool: "boolean",
  datetime: "datetime",
  timestamp: "timestamp",
  date: "date",
  float: "double",
  decimal: "decimal",
  json: "json",
  uuid: "varchar", // Store as varchar(36)
};

export function drizzleType(field: Field, dialect: Dialect = "sqlite"): string {
  const typeMap =
    dialect === "postgresql"
      ? POSTGRESQL_TYPE_MAP
      : dialect === "mysql"
        ? MYSQL_TYPE_MAP
        : SQLITE_TYPE_MAP;
  return typeMap[field.type] || "text";
}

export function getDrizzleImport(dialect: Dialect): string {
  switch (dialect) {
    case "postgresql":
      return "drizzle-orm/pg-core";
    case "mysql":
      return "drizzle-orm/mysql-core";
    default:
      return "drizzle-orm/sqlite-core";
  }
}

export function getTableFunction(dialect: Dialect): string {
  switch (dialect) {
    case "postgresql":
      return "pgTable";
    case "mysql":
      return "mysqlTable";
    default:
      return "sqliteTable";
  }
}

export function getIdColumn(dialect: Dialect, useUuid = false): string {
  if (useUuid) {
    switch (dialect) {
      case "postgresql":
        return 'id: uuid("id").primaryKey().defaultRandom()';
      case "mysql":
        return 'id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID())';
      default:
        return 'id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID())';
    }
  }

  switch (dialect) {
    case "postgresql":
      return 'id: serial("id").primaryKey()';
    case "mysql":
      return 'id: int("id").primaryKey().autoincrement()';
    default:
      return 'id: integer("id").primaryKey({ autoIncrement: true })';
  }
}

export function getTimestampColumns(dialect: Dialect, noTimestamps = false): string | null {
  if (noTimestamps) {
    return null;
  }

  switch (dialect) {
    case "postgresql":
      return `createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()`;
    case "mysql":
      return `createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date())`;
    default:
      return `createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())`;
  }
}

export function getRequiredImports(fields: Field[], dialect: Dialect, options: GeneratorOptions = {}): string[] {
  const types = new Set<string>();

  // Add table function
  types.add(getTableFunction(dialect));

  // Add types needed for id
  if (options.uuid) {
    if (dialect === "postgresql") {
      types.add("uuid");
    } else if (dialect === "mysql") {
      types.add("varchar");
    } else {
      types.add("text");
    }
  } else {
    if (dialect === "postgresql") {
      types.add("serial");
    } else if (dialect === "mysql") {
      types.add("int");
    } else {
      types.add("integer");
    }
  }

  // Add types needed for timestamps (if not disabled)
  if (!options.noTimestamps) {
    if (dialect === "postgresql") {
      types.add("timestamp");
    } else if (dialect === "mysql") {
      types.add("datetime");
    }
    // SQLite uses integer which is already added
  }

  // Check for enum fields
  const hasEnums = fields.some((f) => f.isEnum);
  if (hasEnums) {
    if (dialect === "postgresql") {
      types.add("pgEnum");
    } else if (dialect === "mysql") {
      types.add("mysqlEnum");
    }
  }

  // Add types for user fields
  for (const field of fields) {
    // Skip enum fields - they're handled separately
    if (field.isEnum) continue;

    const drizzleTypeDef = drizzleType(field, dialect);
    // Extract the base type name (before any parentheses)
    const baseType = drizzleTypeDef.split("(")[0];
    types.add(baseType);
  }

  // Add text as it's commonly needed (except MySQL uses varchar for strings)
  // SQLite also needs text for enums
  if (dialect !== "mysql") {
    types.add("text");
  }

  return Array.from(types);
}

// ============================================================================
// File Operations
// ============================================================================

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

export function modelExistsInSchema(tableName: string): boolean {
  const schemaPath = path.join(process.cwd(), "db", "schema.ts");

  if (!fs.existsSync(schemaPath)) {
    return false;
  }

  const content = fs.readFileSync(schemaPath, "utf-8");
  // Check for table definition like: export const posts = sqliteTable("posts"
  const pattern = new RegExp(`sqliteTable\\s*\\(\\s*["']${tableName}["']`);
  return pattern.test(content);
}
