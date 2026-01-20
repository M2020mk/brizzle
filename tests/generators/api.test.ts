import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

vi.mock("fs");

vi.mock("../../src/generators/model", () => ({
  generateModel: vi.fn(),
}));

import { generateApi } from "../../src/generators/api";
import { resetProjectConfig } from "../../src/utils";

describe("generateApi", () => {
  const mockCwd = "/test/project";

  beforeEach(() => {
    vi.clearAllMocks();
    resetProjectConfig();
    vi.spyOn(process, "cwd").mockReturnValue(mockCwd);
    // Mock existsSync to return false for src/app detection
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("route generation", () => {
    it("creates collection and member route files", () => {
      generateApi("post", ["title:string"]);

      const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const paths = writeCalls.map((call) => call[0]);

      expect(paths).toContainEqual(path.join(mockCwd, "app", "api", "posts", "route.ts"));
      expect(paths).toContainEqual(path.join(mockCwd, "app", "api", "posts", "[id]", "route.ts"));
    });

    it("uses kebab-case for directory names", () => {
      generateApi("blogPost", ["title:string"]);

      const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const paths = writeCalls.map((call) => call[0]);

      expect(paths.some((p) => String(p).includes("blog-posts"))).toBe(true);
    });
  });

  describe("collection route (route.ts)", () => {
    it("includes correct imports", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("posts/route.ts");

      expect(content).toContain('import { db } from "@/db"');
      expect(content).toContain('import { posts } from "@/db/schema"');
      expect(content).toContain('import { desc } from "drizzle-orm"');
      expect(content).toContain('import { NextResponse } from "next/server"');
    });

    it("generates GET handler for listing", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("posts/route.ts");

      expect(content).toContain("export async function GET()");
      expect(content).toContain(".select()");
      expect(content).toContain(".from(posts)");
      expect(content).toContain("orderBy(desc(posts.createdAt))");
      expect(content).toContain("NextResponse.json(data)");
    });

    it("generates POST handler for creating", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("posts/route.ts");

      expect(content).toContain("export async function POST(request: Request)");
      expect(content).toContain("request.json()");
      expect(content).toContain("db.insert(posts).values(body).returning()");
      expect(content).toContain("status: 201");
    });

    it("includes error handling", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("posts/route.ts");

      expect(content).toContain("catch");
      expect(content).toContain("status: 500");
      expect(content).toContain("Failed to fetch records");
      expect(content).toContain("Failed to create record");
    });
  });

  describe("member route ([id]/route.ts)", () => {
    it("includes correct imports", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("[id]/route.ts");

      expect(content).toContain('import { db } from "@/db"');
      expect(content).toContain('import { posts } from "@/db/schema"');
      expect(content).toContain('import { eq } from "drizzle-orm"');
      expect(content).toContain('import { NextResponse } from "next/server"');
    });

    it("defines Params type for Next.js 15", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("[id]/route.ts");

      expect(content).toContain("type Params = { params: Promise<{ id: string }> }");
    });

    it("generates GET handler for single record", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("[id]/route.ts");

      expect(content).toContain("export async function GET(request: Request, { params }: Params)");
      expect(content).toContain("const { id } = await params");
      expect(content).toContain("where(eq(posts.id, parseInt(id)))");
      expect(content).toContain("limit(1)");
      expect(content).toContain("status: 404");
    });

    it("generates PATCH handler for updating", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("[id]/route.ts");

      expect(content).toContain("export async function PATCH(request: Request, { params }: Params)");
      expect(content).toContain(".update(posts)");
      expect(content).toContain("updatedAt: new Date()");
      expect(content).toContain(".returning()");
    });

    it("generates DELETE handler", () => {
      generateApi("post", ["title:string"]);

      const content = getWrittenFile("[id]/route.ts");

      expect(content).toContain("export async function DELETE(request: Request, { params }: Params)");
      expect(content).toContain("db.delete(posts).where(eq(posts.id, parseInt(id)))");
      expect(content).toContain("status: 204");
    });
  });

  describe("naming conventions", () => {
    it("uses camelCase for table references", () => {
      generateApi("blogPost", ["title:string"]);

      const content = getWrittenFile("blog-posts/route.ts");

      expect(content).toContain("import { blogPosts } from");
      expect(content).toContain("from(blogPosts)");
    });

    it("uses kebab-case for paths", () => {
      generateApi("blogPost", ["title:string"]);

      const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const paths = writeCalls.map((call) => String(call[0]));

      expect(paths.some((p) => p.includes("/api/blog-posts/"))).toBe(true);
    });
  });

  describe("error handling", () => {
    it("throws error for invalid model name", () => {
      expect(() => generateApi("123invalid", [])).toThrow("Invalid model name");
    });

    it("throws error for reserved model name", () => {
      expect(() => generateApi("model", [])).toThrow("reserved word");
    });
  });

  // Helper function to get written file content
  function getWrittenFile(pathSuffix: string): string {
    const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
    const call = writeCalls.find((c) => String(c[0]).includes(pathSuffix));
    if (!call) {
      throw new Error(`File not found: ${pathSuffix}`);
    }
    return call[1] as string;
  }
});
