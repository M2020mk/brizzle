import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

vi.mock("fs");
vi.mock("@clack/prompts", () => ({
  confirm: vi.fn().mockResolvedValue(true),
  isCancel: vi.fn().mockReturnValue(false),
}));

import { confirm } from "@clack/prompts";
import { destroyScaffold, destroyResource, destroyApi } from "../destroy";
import { resetProjectConfig } from "../../lib";

describe("destroy generators", () => {
  const mockCwd = "/test/project";

  beforeEach(() => {
    vi.clearAllMocks();
    resetProjectConfig();
    vi.spyOn(process, "cwd").mockReturnValue(mockCwd);
    // Mock existsSync to return false for src/app (no src directory) but true for delete checks
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const pathStr = String(p);
      // Return false for src/app detection, true for delete directory checks
      if (pathStr.includes("src/app")) return false;
      return true;
    });
    vi.mocked(fs.rmSync).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("destroyScaffold", () => {
    it("deletes scaffold directory", async () => {
      await destroyScaffold("post");

      expect(fs.rmSync).toHaveBeenCalledWith(
        path.join(mockCwd, "app", "posts"),
        { recursive: true }
      );
    });

    it("uses kebab-case for directory name", async () => {
      await destroyScaffold("blogPost");

      expect(fs.rmSync).toHaveBeenCalledWith(
        path.join(mockCwd, "app", "blog-posts"),
        { recursive: true }
      );
    });

    it("handles plural model names", async () => {
      await destroyScaffold("users");

      expect(fs.rmSync).toHaveBeenCalledWith(
        path.join(mockCwd, "app", "users"),
        { recursive: true }
      );
    });

    it("does not delete in dry run mode", async () => {
      await destroyScaffold("post", { dryRun: true });

      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it("throws error for invalid model name", async () => {
      await expect(destroyScaffold("123invalid")).rejects.toThrow("Invalid model name");
    });

    it("throws error for reserved model name", async () => {
      await expect(destroyScaffold("model")).rejects.toThrow("reserved word");
    });
  });

  describe("destroyResource", () => {
    it("deletes resource directory", async () => {
      await destroyResource("post");

      expect(fs.rmSync).toHaveBeenCalledWith(
        path.join(mockCwd, "app", "posts"),
        { recursive: true }
      );
    });

    it("uses kebab-case for directory name", async () => {
      await destroyResource("blogPost");

      expect(fs.rmSync).toHaveBeenCalledWith(
        path.join(mockCwd, "app", "blog-posts"),
        { recursive: true }
      );
    });

    it("does not delete in dry run mode", async () => {
      await destroyResource("post", { dryRun: true });

      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it("throws error for invalid model name", async () => {
      await expect(destroyResource("123invalid")).rejects.toThrow("Invalid model name");
    });
  });

  describe("destroyApi", () => {
    it("deletes API directory", async () => {
      await destroyApi("post");

      expect(fs.rmSync).toHaveBeenCalledWith(
        path.join(mockCwd, "app", "api", "posts"),
        { recursive: true }
      );
    });

    it("uses kebab-case for directory name", async () => {
      await destroyApi("blogPost");

      expect(fs.rmSync).toHaveBeenCalledWith(
        path.join(mockCwd, "app", "api", "blog-posts"),
        { recursive: true }
      );
    });

    it("does not delete in dry run mode", async () => {
      await destroyApi("post", { dryRun: true });

      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it("throws error for invalid model name", async () => {
      await expect(destroyApi("123invalid")).rejects.toThrow("Invalid model name");
    });

    it("throws error for reserved model name", async () => {
      await expect(destroyApi("model")).rejects.toThrow("reserved word");
    });
  });

  describe("confirmation prompt", () => {
    it("prompts for confirmation before deleting", async () => {
      await destroyScaffold("post");

      expect(confirm).toHaveBeenCalledWith({
        message: expect.stringContaining("posts"),
      });
      expect(fs.rmSync).toHaveBeenCalled();
    });

    it("aborts when user declines confirmation", async () => {
      vi.mocked(confirm).mockResolvedValueOnce(false);

      await destroyScaffold("post");

      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it("skips prompt with --force", async () => {
      await destroyScaffold("post", { force: true });

      expect(confirm).not.toHaveBeenCalled();
      expect(fs.rmSync).toHaveBeenCalled();
    });

    it("skips prompt with --dry-run", async () => {
      await destroyScaffold("post", { dryRun: true });

      expect(confirm).not.toHaveBeenCalled();
    });
  });

  describe("schema cleanup", () => {
    const existingSchema = `import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});
`;

    beforeEach(() => {
      vi.mocked(fs.readFileSync).mockReturnValue(existingSchema);
    });

    it("removes model from schema when destroying", async () => {
      await destroyScaffold("post", { force: true });

      const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const schemaWrite = writeCalls.find((c) => String(c[0]).includes("schema.ts"));

      expect(schemaWrite).toBeDefined();
      const content = schemaWrite![1] as string;
      expect(content).not.toContain('sqliteTable("posts"');
      expect(content).toContain('sqliteTable("users"');
    });

    it("does not write schema if model is not in schema", async () => {
      await destroyScaffold("comment", { force: true });

      const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const schemaWrite = writeCalls.find((c) => String(c[0]).includes("schema.ts"));

      expect(schemaWrite).toBeUndefined();
    });
  });

  describe("non-existent directories", () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
    });

    it("does not call rmSync if directory does not exist", async () => {
      await destroyScaffold("post");

      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it("does not call rmSync for resource if directory does not exist", async () => {
      await destroyResource("post");

      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it("does not call rmSync for api if directory does not exist", async () => {
      await destroyApi("post");

      expect(fs.rmSync).not.toHaveBeenCalled();
    });
  });
});
