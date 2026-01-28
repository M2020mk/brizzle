import type { Dialect, Field } from "../types";

/**
 * SQLite type mappings for Drizzle ORM.
 */
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

/**
 * PostgreSQL type mappings for Drizzle ORM.
 */
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

/**
 * MySQL type mappings for Drizzle ORM.
 */
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

/**
 * Gets the Drizzle type definition for a field based on the dialect.
 *
 * @param field - The field definition
 * @param dialect - The database dialect (sqlite, postgresql, mysql)
 * @returns The Drizzle type function/definition name
 */
export function drizzleType(field: Field, dialect: Dialect = "sqlite"): string {
  const typeMap =
    dialect === "postgresql"
      ? POSTGRESQL_TYPE_MAP
      : dialect === "mysql"
        ? MYSQL_TYPE_MAP
        : SQLITE_TYPE_MAP;
  return typeMap[field.type] || "text";
}
