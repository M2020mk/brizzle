import type { Field } from "./types";
import { validateFieldDefinition } from "./validation";

/**
 * Parses an array of field definition strings into Field objects.
 *
 * Field syntax: `name:type:modifier1:modifier2`
 *
 * Supported types: string, text, integer, int, bigint, boolean, bool,
 * datetime, timestamp, date, float, decimal, json, uuid, enum, references
 *
 * Modifiers:
 * - `?` after name or type: nullable field
 * - `unique`: unique constraint
 * - For enum: comma-separated values (e.g., `status:enum:draft,published`)
 * - For references: target model name (e.g., `userId:references:user`)
 *
 * @param fields - Array of field definition strings
 * @returns Array of parsed Field objects
 * @throws {Error} If any field definition is invalid
 * @example
 * parseFields(["title:string", "body:text?", "status:enum:draft,published"])
 * // Returns:
 * // [
 * //   { name: "title", type: "string", nullable: false, ... },
 * //   { name: "body", type: "text", nullable: true, ... },
 * //   { name: "status", type: "enum", enumValues: ["draft", "published"], ... }
 * // ]
 */
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
