import type { Field } from "../../lib/types";

/**
 * Generates the index (list) page for a scaffold.
 *
 * @param pascalName - Model name in PascalCase (e.g., "Post")
 * @param pascalPlural - Plural model name in PascalCase (e.g., "Posts")
 * @param camelName - Model name in camelCase (e.g., "post")
 * @param kebabPlural - Plural model name in kebab-case (e.g., "posts")
 * @param fields - Array of field definitions
 * @returns The page component source code
 */
export function generateIndexPage(
  pascalName: string,
  pascalPlural: string,
  camelName: string,
  kebabPlural: string,
  fields: Field[]
): string {
  const displayField = fields[0]?.name || "id";

  return `import Link from "next/link";
import { get${pascalPlural} } from "./actions";
import { delete${pascalName} } from "./actions";

export default async function ${pascalPlural}Page() {
  const ${camelName}s = await get${pascalPlural}();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">${pascalPlural}</h1>
        <Link
          href="/${kebabPlural}/new"
          className="flex h-10 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New ${pascalName}
        </Link>
      </div>

      {${camelName}s.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">No ${camelName}s yet.</p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {${camelName}s.map((${camelName}) => (
            <div
              key={${camelName}.id}
              className="flex items-center justify-between py-4"
            >
              <Link href={\`/${kebabPlural}/\${${camelName}.id}\`} className="font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300">
                {${camelName}.${displayField}}
              </Link>
              <div className="flex gap-4 text-sm">
                <Link
                  href={\`/${kebabPlural}/\${${camelName}.id}/edit\`}
                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Edit
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await delete${pascalName}(${camelName}.id);
                  }}
                >
                  <button type="submit" className="text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;
}
