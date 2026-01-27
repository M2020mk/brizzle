import pluralizeLib from "pluralize";
import type { ModelContext } from "./types";

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

export function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function pluralize(str: string): string {
  return pluralizeLib.plural(str);
}

export function singularize(str: string): string {
  return pluralizeLib.singular(str);
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
