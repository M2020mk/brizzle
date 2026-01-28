import { generateFormField, formDataValue } from "../../lib/forms";
import type { Field } from "../../lib/types";
import type { GeneratorOptions } from "../../lib/types";

/**
 * Generates the edit page for a scaffold.
 *
 * @param pascalName - Model name in PascalCase (e.g., "Post")
 * @param camelName - Model name in camelCase (e.g., "post")
 * @param kebabPlural - Plural model name in kebab-case (e.g., "posts")
 * @param fields - Array of field definitions
 * @param options - Generator options
 * @returns The page component source code
 */
export function generateEditPage(
  pascalName: string,
  camelName: string,
  kebabPlural: string,
  fields: Field[],
  options: GeneratorOptions = {}
): string {
  const idHandling = options.uuid
    ? `const ${camelName} = await get${pascalName}(id);`
    : `const numericId = Number(id);

  if (isNaN(numericId)) {
    notFound();
  }

  const ${camelName} = await get${pascalName}(numericId);`;

  const updateId = options.uuid ? "id" : "numericId";

  return `import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { get${pascalName}, update${pascalName} } from "../../actions";

export default async function Edit${pascalName}Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  ${idHandling}

  if (!${camelName}) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";

    await update${pascalName}(${updateId}, {
${fields.map((f) => `      ${f.name}: ${formDataValue(f)},`).join("\n")}
    });

    redirect("/${kebabPlural}");
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Edit ${pascalName}</h1>

      <form action={handleUpdate} className="space-y-5">
${fields.map((f) => generateFormField(f, camelName, true)).join("\n\n")}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex h-10 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Update ${pascalName}
          </button>
          <Link
            href="/${kebabPlural}"
            className="flex h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
`;
}
