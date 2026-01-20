import * as path from "path";
import {
  writeFile,
  validateModelName,
  createModelContext,
  getAppPath,
  getDbImport,
  getSchemaImport,
  GeneratorOptions,
  ModelContext,
} from "../utils";

export function generateActions(name: string, options: GeneratorOptions = {}): void {
  validateModelName(name);

  const ctx = createModelContext(name);

  const actionsPath = path.join(
    getAppPath(),
    ctx.kebabPlural,
    "actions.ts"
  );

  const content = generateActionsContent(ctx);
  writeFile(actionsPath, content, options);
}

function generateActionsContent(ctx: ModelContext): string {
  const { pascalName, pascalPlural, camelPlural, kebabPlural } = ctx;
  const dbImport = getDbImport();
  const schemaImport = getSchemaImport();

  return `"use server";

import { db } from "${dbImport}";
import { ${camelPlural} } from "${schemaImport}";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ${pascalName} = typeof ${camelPlural}.$inferSelect;
export type New${pascalName} = typeof ${camelPlural}.$inferInsert;

export async function get${pascalPlural}() {
  return db.select().from(${camelPlural}).orderBy(desc(${camelPlural}.createdAt));
}

export async function get${pascalName}(id: number) {
  const result = await db
    .select()
    .from(${camelPlural})
    .where(eq(${camelPlural}.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function create${pascalName}(data: Omit<New${pascalName}, "id" | "createdAt" | "updatedAt">) {
  const result = await db.insert(${camelPlural}).values(data).returning();
  revalidatePath("/${kebabPlural}");
  return result[0];
}

export async function update${pascalName}(
  id: number,
  data: Partial<Omit<New${pascalName}, "id" | "createdAt" | "updatedAt">>
) {
  const result = await db
    .update(${camelPlural})
    .set({ ...data, updatedAt: new Date() })
    .where(eq(${camelPlural}.id, id))
    .returning();
  revalidatePath("/${kebabPlural}");
  return result[0];
}

export async function delete${pascalName}(id: number) {
  await db.delete(${camelPlural}).where(eq(${camelPlural}.id, id));
  revalidatePath("/${kebabPlural}");
}
`;
}
