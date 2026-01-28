import { toPascalCase } from "../../lib/strings";
import type { Field } from "../../lib/types";
import type { GeneratorOptions } from "../../lib/types";

/**
 * Generates the show (detail) page for a scaffold.
 *
 * @param pascalName - Model name in PascalCase (e.g., "Post")
 * @param camelName - Model name in camelCase (e.g., "post")
 * @param kebabPlural - Plural model name in kebab-case (e.g., "posts")
 * @param fields - Array of field definitions
 * @param options - Generator options
 * @returns The page component source code
 */
export function generateShowPage(
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

  return `import { notFound } from "next/navigation";
import Link from "next/link";
import { get${pascalName} } from "../actions";

export default async function ${pascalName}Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  ${idHandling}

  if (!${camelName}) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">${pascalName}</h1>
        <div className="flex gap-3">
          <Link
            href={\`/${kebabPlural}/\${${camelName}.id}/edit\`}
            className="flex h-10 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Edit
          </Link>
          <Link
            href="/${kebabPlural}"
            className="flex h-10 items-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back
          </Link>
        </div>
      </div>

      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
${fields
  .map(
    (f) => `        <div className="py-3">
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">${toPascalCase(f.name)}</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-50">{${camelName}.${f.name}}</dd>
        </div>`
  )
  .join("\n")}${
    options.noTimestamps
      ? ""
      : `
        <div className="py-3">
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">Created At</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-50">{${camelName}.createdAt.toLocaleString()}</dd>
        </div>`
  }
      </dl>
    </div>
  );
}
`;
}
