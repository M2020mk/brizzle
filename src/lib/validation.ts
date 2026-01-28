import { VALID_FIELD_TYPES, type Field } from "./types";
import { log } from "./logger";
import { fileExists, readFile } from "./files";
import { getDbPath } from "./config";
import { pluralize, toSnakeCase } from "./strings";
import * as path from "path";

// SQL reserved words that could cause issues when used as column names
const SQL_RESERVED_WORDS = [
  // SQL keywords
  "select",
  "from",
  "where",
  "insert",
  "update",
  "delete",
  "drop",
  "create",
  "alter",
  "index",
  "table",
  "column",
  "database",
  "schema",
  "and",
  "or",
  "not",
  "null",
  "true",
  "false",
  "order",
  "by",
  "group",
  "having",
  "limit",
  "offset",
  "join",
  "left",
  "right",
  "inner",
  "outer",
  "on",
  "as",
  "in",
  "between",
  "like",
  "is",
  "case",
  "when",
  "then",
  "else",
  "end",
  "exists",
  "distinct",
  "all",
  "any",
  "union",
  "intersect",
  "except",
  "primary",
  "foreign",
  "key",
  "references",
  "unique",
  "default",
  "check",
  "constraint",
  // Common type names that might conflict
  "int",
  "integer",
  "float",
  "double",
  "decimal",
  "numeric",
  "boolean",
  "bool",
  "text",
  "varchar",
  "char",
  "date",
  "time",
  "timestamp",
  "datetime",
];

/**
 * Validates a model name for use in code generation.
 *
 * Model names must:
 * - Start with a letter
 * - Contain only letters and numbers
 * - Not be a reserved word (model, schema, db, database, table)
 *
 * @param name - The model name to validate
 * @throws {Error} If name is empty, invalid format, or reserved
 * @example
 * validateModelName("Post") // OK
 * validateModelName("123") // Error: Must start with a letter
 * validateModelName("table") // Error: Reserved word
 */
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

/**
 * Validates a field definition string.
 *
 * Field names must:
 * - Start with a lowercase letter (camelCase)
 * - Contain only letters and numbers
 * - Not be a SQL reserved word
 *
 * Field types must be one of the valid types or special types (enum, references).
 * Enum fields must have comma-separated values.
 *
 * @param fieldDef - The field definition string (e.g., "title:string", "status:enum:draft,published")
 * @throws {Error} If field definition is invalid
 * @example
 * validateFieldDefinition("title:string") // OK
 * validateFieldDefinition("Status:string") // Error: Must be camelCase
 * validateFieldDefinition("select:string") // Error: SQL reserved word
 */
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
  if (SQL_RESERVED_WORDS.includes(name.toLowerCase())) {
    throw new Error(
      `Field name "${name}" is a SQL reserved word. Consider renaming to "${name}Value" or "${name}Field".`
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

    const values = enumValues.split(",");

    for (const value of values) {
      if (!value) {
        throw new Error(`Enum field "${name}" has an empty value. Values must not be empty.`);
      }
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
        throw new Error(
          `Invalid enum value "${value}" for field "${name}". Values must start with a letter and contain only letters, numbers, underscores, or hyphens.`
        );
      }
    }

    const unique = new Set(values);
    if (unique.size !== values.length) {
      throw new Error(`Enum field "${name}" has duplicate values.`);
    }
  }
}

/**
 * Validates that referenced models exist in the schema.
 * Emits warnings for references to non-existent models.
 *
 * @param fields - Array of parsed field definitions
 */
export function validateReferences(fields: Field[]): void {
  const schemaPath = path.join(getDbPath(), "schema.ts");

  if (!fileExists(schemaPath)) {
    // No schema yet, can't validate references
    return;
  }

  const schemaContent = readFile(schemaPath);

  for (const field of fields) {
    if (field.isReference && field.referenceTo) {
      const tableName = toSnakeCase(pluralize(field.referenceTo));
      // Check if the table exists in the schema
      if (!schemaContent.includes(`"${tableName}"`)) {
        log.warn(
          `Referenced model "${field.referenceTo}" (table "${tableName}") not found in schema. ` +
            `Make sure to create it before running migrations.`
        );
      }
    }
  }
}
