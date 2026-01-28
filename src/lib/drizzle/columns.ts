import type { Dialect } from "../types";

/**
 * Gets the table function name for the dialect.
 *
 * @param dialect - The database dialect
 * @returns The Drizzle table function name (pgTable, mysqlTable, sqliteTable)
 */
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

/**
 * Gets the ID column definition for the dialect.
 *
 * @param dialect - The database dialect
 * @param useUuid - Whether to use UUID instead of auto-increment
 * @returns The ID column definition string
 */
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

/**
 * Gets the timestamp columns definition for the dialect.
 *
 * @param dialect - The database dialect
 * @param noTimestamps - If true, returns null (no timestamp columns)
 * @returns The timestamp columns definition string or null
 */
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
