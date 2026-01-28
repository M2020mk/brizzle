import type { Dialect, Field, GeneratorOptions } from "../types";
import { drizzleType } from "./types";
import { getTableFunction } from "./columns";

/**
 * Gets the Drizzle ORM import path for the dialect.
 *
 * @param dialect - The database dialect
 * @returns The npm import path for Drizzle ORM
 */
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

/**
 * Extracts existing Drizzle imports from schema content.
 *
 * @param content - The schema file content
 * @returns Array of import names found in the schema
 */
export function extractImportsFromSchema(content: string): string[] {
  const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*["']drizzle-orm\/[^"']+["']/);
  if (!importMatch) {
    return [];
  }
  return importMatch[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Updates schema imports by merging existing imports with new required imports.
 *
 * @param content - The schema file content
 * @param newImports - Array of new import names to add
 * @param dialect - The database dialect
 * @returns Updated schema content with merged imports
 */
export function updateSchemaImports(
  content: string,
  newImports: string[],
  dialect: Dialect
): string {
  const existingImports = extractImportsFromSchema(content);
  const mergedImports = Array.from(new Set([...existingImports, ...newImports]));
  const drizzleImport = getDrizzleImport(dialect);
  const newImportLine = `import { ${mergedImports.join(", ")} } from "${drizzleImport}";`;

  // Replace the existing import line
  const importRegex = /import\s*\{[^}]+\}\s*from\s*["']drizzle-orm\/[^"']+["'];?/;
  if (importRegex.test(content)) {
    return content.replace(importRegex, newImportLine);
  }

  // No existing import, prepend it
  return newImportLine + "\n" + content;
}

/**
 * Determines the required Drizzle imports for a set of fields.
 *
 * @param fields - Array of field definitions
 * @param dialect - The database dialect
 * @param options - Generation options
 * @returns Array of required import names
 */
export function getRequiredImports(
  fields: Field[],
  dialect: Dialect,
  options: GeneratorOptions = {}
): string[] {
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

  // SQLite enums use text() with enum option, but enum fields are skipped
  // in the loop above, so add text explicitly when needed
  if (dialect === "sqlite" && hasEnums) {
    types.add("text");
  }

  return Array.from(types);
}
