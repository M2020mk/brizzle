import * as path from "path";
import { generateModel } from "./model";
import {
  writeFile,
  validateModelName,
  createModelContext,
  getAppPath,
  getDbImport,
  getSchemaImport,
  log,
  GeneratorOptions,
} from "../utils";

export function generateApi(name: string, fieldArgs: string[], options: GeneratorOptions = {}): void {
  validateModelName(name);

  const ctx = createModelContext(name);
  const prefix = options.dryRun ? "[dry-run] " : "";

  log.info(`\n${prefix}Generating API ${ctx.pascalName}...\n`);

  generateModel(ctx.singularName, fieldArgs, options);
  generateRoutes(ctx.camelPlural, ctx.kebabPlural, options);

  log.info(`\nNext steps:`);
  log.info(`  1. Run 'pnpm db:push' to update the database`);
  log.info(`  2. API available at /api/${ctx.kebabPlural}`);
}

function generateRoutes(camelPlural: string, kebabPlural: string, options: GeneratorOptions): void {
  const basePath = path.join(getAppPath(), "api", kebabPlural);

  writeFile(
    path.join(basePath, "route.ts"),
    generateCollectionRoute(camelPlural),
    options
  );

  writeFile(
    path.join(basePath, "[id]", "route.ts"),
    generateMemberRoute(camelPlural),
    options
  );
}

function generateCollectionRoute(camelPlural: string): string {
  const dbImport = getDbImport();
  const schemaImport = getSchemaImport();

  return `import { db } from "${dbImport}";
import { ${camelPlural} } from "${schemaImport}";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await db
      .select()
      .from(${camelPlural})
      .orderBy(desc(${camelPlural}.createdAt));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await db.insert(${camelPlural}).values(body).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}
`;
}

function generateMemberRoute(camelPlural: string): string {
  const dbImport = getDbImport();
  const schemaImport = getSchemaImport();

  return `import { db } from "${dbImport}";
import { ${camelPlural} } from "${schemaImport}";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await db
      .select()
      .from(${camelPlural})
      .where(eq(${camelPlural}.id, parseInt(id)))
      .limit(1);

    if (!result[0]) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch record" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await db
      .update(${camelPlural})
      .set({ ...body, updatedAt: new Date() })
      .where(eq(${camelPlural}.id, parseInt(id)))
      .returning();

    if (!result[0]) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await db.delete(${camelPlural}).where(eq(${camelPlural}.id, parseInt(id)));

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}
`;
}
