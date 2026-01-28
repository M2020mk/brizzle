import pluralizeLib from "pluralize";
import type { ModelContext } from "./types";

/**
 * Converts a string to PascalCase.
 *
 * @param str - Input string (can be camelCase, snake_case, or kebab-case)
 * @returns String in PascalCase
 * @example
 * toPascalCase("user_profile") // "UserProfile"
 * toPascalCase("blog-post") // "BlogPost"
 */
export function toPascalCase(str: string): string {
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Converts a string to camelCase.
 *
 * @param str - Input string (can be PascalCase, snake_case, or kebab-case)
 * @returns String in camelCase
 * @example
 * toCamelCase("UserProfile") // "userProfile"
 * toCamelCase("blog-post") // "blogPost"
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Converts a string to snake_case.
 *
 * @param str - Input string (can be PascalCase, camelCase, or kebab-case)
 * @returns String in snake_case
 * @example
 * toSnakeCase("UserProfile") // "user_profile"
 * toSnakeCase("blogPost") // "blog_post"
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

/**
 * Converts a string to kebab-case.
 *
 * @param str - Input string (can be PascalCase, camelCase, or snake_case)
 * @returns String in kebab-case
 * @example
 * toKebabCase("UserProfile") // "user-profile"
 * toKebabCase("blog_post") // "blog-post"
 */
export function toKebabCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, "-");
}

/**
 * Escapes special characters in a string for use in generated code.
 *
 * @param str - Input string to escape
 * @returns String with backslashes and quotes escaped
 * @example
 * escapeString('Hello "World"') // 'Hello \\"World\\"'
 */
export function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Converts a word to its plural form.
 *
 * @param str - Singular word
 * @returns Plural form of the word
 * @example
 * pluralize("post") // "posts"
 * pluralize("category") // "categories"
 */
export function pluralize(str: string): string {
  return pluralizeLib.plural(str);
}

/**
 * Converts a word to its singular form.
 *
 * @param str - Plural word
 * @returns Singular form of the word
 * @example
 * singularize("posts") // "post"
 * singularize("categories") // "category"
 */
export function singularize(str: string): string {
  return pluralizeLib.singular(str);
}

/**
 * Creates a ModelContext with all naming variations for a model.
 *
 * @param name - Model name (can be singular or plural, any case)
 * @returns Object containing all naming variations
 * @example
 * createModelContext("BlogPost")
 * // Returns:
 * // {
 * //   name: "BlogPost",
 * //   singularName: "blogPost",
 * //   pluralName: "blogPosts",
 * //   pascalName: "BlogPost",
 * //   pascalPlural: "BlogPosts",
 * //   camelName: "blogPost",
 * //   camelPlural: "blogPosts",
 * //   snakeName: "blog_post",
 * //   snakePlural: "blog_posts",
 * //   kebabName: "blog-post",
 * //   kebabPlural: "blog-posts",
 * //   tableName: "blog_posts"
 * // }
 */
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
