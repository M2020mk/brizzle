import { toPascalCase, escapeString } from "./strings";
import type { Field } from "./types";

/**
 * Context object for form field generation.
 */
export interface FieldContext {
  field: Field;
  label: string;
  optionalLabel: string;
  required: string;
  defaultValue: string;
}

/**
 * Creates a context object for form field generation.
 *
 * @param field - The field definition
 * @param camelName - The model name in camelCase (for default value references)
 * @param withDefault - Whether to include default value attribute
 * @returns Context object with computed properties for form generation
 */
export function createFieldContext(
  field: Field,
  camelName: string,
  withDefault: boolean
): FieldContext {
  return {
    field,
    label: toPascalCase(field.name),
    optionalLabel: field.nullable
      ? ` <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>`
      : "",
    required: field.nullable ? "" : " required",
    defaultValue: withDefault ? ` defaultValue={${camelName}.${field.name}}` : "",
  };
}

function generateTextareaField(ctx: FieldContext): string {
  const { field, label, optionalLabel, required, defaultValue } = ctx;
  const rows = field.type === "json" ? 6 : 4;
  const placeholder = field.type === "json" ? ` placeholder="{}"` : "";
  return `        <div>
          <label htmlFor="${field.name}" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ${label}${optionalLabel}
          </label>
          <textarea
            id="${field.name}"
            name="${field.name}"
            rows={${rows}}
            className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 resize-none"${defaultValue}${placeholder}${required}
          />
        </div>`;
}

function generateCheckboxField(ctx: FieldContext, camelName: string, withDefault: boolean): string {
  const { field, label } = ctx;
  const defaultChecked = withDefault ? ` defaultChecked={${camelName}.${field.name}}` : "";
  return `        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="${field.name}"
            name="${field.name}"
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"${defaultChecked}
          />
          <label htmlFor="${field.name}" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ${label}
          </label>
        </div>`;
}

function generateNumberField(ctx: FieldContext, step?: string): string {
  const { field, label, optionalLabel, required, defaultValue } = ctx;
  const stepAttr = step ? `\n            step="${step}"` : "";
  return `        <div>
          <label htmlFor="${field.name}" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ${label}${optionalLabel}
          </label>
          <input
            type="number"${stepAttr}
            id="${field.name}"
            name="${field.name}"
            className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"${defaultValue}${required}
          />
        </div>`;
}

function generateDateField(ctx: FieldContext, camelName: string, withDefault: boolean): string {
  const { field, label, optionalLabel, required } = ctx;
  const dateDefault = withDefault
    ? ` defaultValue={${camelName}.${field.name}?.toISOString().split("T")[0]}`
    : "";
  return `        <div>
          <label htmlFor="${field.name}" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ${label}${optionalLabel}
          </label>
          <input
            type="date"
            id="${field.name}"
            name="${field.name}"
            className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"${dateDefault}${required}
          />
        </div>`;
}

function generateDatetimeField(ctx: FieldContext, camelName: string, withDefault: boolean): string {
  const { field, label, optionalLabel, required } = ctx;
  const dateDefault = withDefault
    ? ` defaultValue={${camelName}.${field.name}?.toISOString().slice(0, 16)}`
    : "";
  return `        <div>
          <label htmlFor="${field.name}" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ${label}${optionalLabel}
          </label>
          <input
            type="datetime-local"
            id="${field.name}"
            name="${field.name}"
            className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"${dateDefault}${required}
          />
        </div>`;
}

function generateSelectField(ctx: FieldContext): string {
  const { field, label, optionalLabel, required, defaultValue } = ctx;
  const options = field
    .enumValues!.map(
      (v) => `            <option value="${escapeString(v)}">${toPascalCase(v)}</option>`
    )
    .join("\n");
  return `        <div>
          <label htmlFor="${field.name}" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ${label}${optionalLabel}
          </label>
          <select
            id="${field.name}"
            name="${field.name}"
            className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500"${defaultValue}${required}
          >
${options}
          </select>
        </div>`;
}

function generateTextField(ctx: FieldContext): string {
  const { field, label, optionalLabel, required, defaultValue } = ctx;
  return `        <div>
          <label htmlFor="${field.name}" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ${label}${optionalLabel}
          </label>
          <input
            type="text"
            id="${field.name}"
            name="${field.name}"
            className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"${defaultValue}${required}
          />
        </div>`;
}

/**
 * Generates an HTML form field based on the field type.
 *
 * @param field - The field definition
 * @param camelName - The model name in camelCase
 * @param withDefault - Whether to include default value from existing data
 * @returns HTML string for the form field
 */
export function generateFormField(field: Field, camelName: string, withDefault = false): string {
  const ctx = createFieldContext(field, camelName, withDefault);

  switch (field.type) {
    case "text":
    case "json":
      return generateTextareaField(ctx);

    case "boolean":
    case "bool":
      return generateCheckboxField(ctx, camelName, withDefault);

    case "integer":
    case "int":
    case "bigint":
      return generateNumberField(ctx);

    case "float":
      return generateNumberField(ctx, "any");

    case "decimal":
      return generateNumberField(ctx, "0.01");

    case "date":
      return generateDateField(ctx, camelName, withDefault);

    case "datetime":
    case "timestamp":
      return generateDatetimeField(ctx, camelName, withDefault);

    default:
      if (field.isEnum && field.enumValues) {
        return generateSelectField(ctx);
      }
      return generateTextField(ctx);
  }
}

/**
 * Generates code to extract and convert a form field value from FormData.
 *
 * @param field - The field definition
 * @returns JavaScript code string for extracting the value
 */
export function formDataValue(field: Field): string {
  const getValue = `formData.get("${field.name}")`;
  const asString = `${getValue} as string`;

  // Handle nullable fields
  if (field.nullable) {
    if (field.type === "boolean" || field.type === "bool") {
      return `${getValue} === "on" ? true : null`;
    }
    if (field.type === "integer" || field.type === "int" || field.type === "bigint") {
      return `${getValue} ? parseInt(${asString}) : null`;
    }
    if (field.type === "float") {
      return `${getValue} ? parseFloat(${asString}) : null`;
    }
    if (field.type === "decimal") {
      // Keep as string to preserve precision
      return `${getValue} ? ${asString} : null`;
    }
    if (field.type === "datetime" || field.type === "timestamp" || field.type === "date") {
      return `${getValue} ? new Date(${asString}) : null`;
    }
    if (field.type === "json") {
      return `${getValue} ? JSON.parse(${asString}) : null`;
    }
    return `${getValue} ? ${asString} : null`;
  }

  // Required fields
  if (field.type === "boolean" || field.type === "bool") {
    return `${getValue} === "on"`;
  }
  if (field.type === "integer" || field.type === "int" || field.type === "bigint") {
    return `parseInt(${asString})`;
  }
  if (field.type === "float") {
    return `parseFloat(${asString})`;
  }
  if (field.type === "decimal") {
    // Keep as string to preserve precision
    return asString;
  }
  if (field.type === "datetime" || field.type === "timestamp" || field.type === "date") {
    return `new Date(${asString})`;
  }
  if (field.type === "json") {
    return `JSON.parse(${asString})`;
  }
  return asString;
}
