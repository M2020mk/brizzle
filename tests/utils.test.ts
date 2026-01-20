import { describe, it, expect } from "vitest";
import {
  toPascalCase,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  pluralize,
  singularize,
  parseFields,
  validateModelName,
  validateFieldDefinition,
  createModelContext,
  drizzleType,
  getTableFunction,
  getIdColumn,
  getDrizzleImport,
} from "../src/utils";

// ============================================================================
// String Transformations
// ============================================================================

describe("toPascalCase", () => {
  it("converts simple words", () => {
    expect(toPascalCase("user")).toBe("User");
    expect(toPascalCase("post")).toBe("Post");
  });

  it("converts camelCase", () => {
    expect(toPascalCase("userName")).toBe("UserName");
    expect(toPascalCase("blogPost")).toBe("BlogPost");
  });

  it("converts snake_case", () => {
    expect(toPascalCase("user_name")).toBe("UserName");
    expect(toPascalCase("blog_post")).toBe("BlogPost");
  });

  it("converts kebab-case", () => {
    expect(toPascalCase("user-name")).toBe("UserName");
    expect(toPascalCase("blog-post")).toBe("BlogPost");
  });
});

describe("toCamelCase", () => {
  it("converts simple words", () => {
    expect(toCamelCase("User")).toBe("user");
    expect(toCamelCase("Post")).toBe("post");
  });

  it("converts PascalCase", () => {
    expect(toCamelCase("UserName")).toBe("userName");
    expect(toCamelCase("BlogPost")).toBe("blogPost");
  });

  it("converts snake_case", () => {
    expect(toCamelCase("user_name")).toBe("userName");
    expect(toCamelCase("blog_post")).toBe("blogPost");
  });
});

describe("toSnakeCase", () => {
  it("converts simple words", () => {
    expect(toSnakeCase("user")).toBe("user");
    expect(toSnakeCase("User")).toBe("user");
  });

  it("converts camelCase", () => {
    expect(toSnakeCase("userName")).toBe("user_name");
    expect(toSnakeCase("blogPost")).toBe("blog_post");
  });

  it("converts PascalCase", () => {
    expect(toSnakeCase("UserName")).toBe("user_name");
    expect(toSnakeCase("BlogPost")).toBe("blog_post");
  });
});

describe("toKebabCase", () => {
  it("converts simple words", () => {
    expect(toKebabCase("user")).toBe("user");
    expect(toKebabCase("User")).toBe("user");
  });

  it("converts camelCase", () => {
    expect(toKebabCase("userName")).toBe("user-name");
    expect(toKebabCase("blogPost")).toBe("blog-post");
  });

  it("converts PascalCase", () => {
    expect(toKebabCase("UserName")).toBe("user-name");
    expect(toKebabCase("BlogPost")).toBe("blog-post");
  });
});

// ============================================================================
// Pluralize / Singularize
// ============================================================================

describe("pluralize", () => {
  it("adds 's' to regular words", () => {
    expect(pluralize("user")).toBe("users");
    expect(pluralize("post")).toBe("posts");
    expect(pluralize("comment")).toBe("comments");
  });

  it("handles words ending in 'y'", () => {
    expect(pluralize("category")).toBe("categories");
    expect(pluralize("company")).toBe("companies");
  });

  it("handles words ending in 'y' with vowel before", () => {
    expect(pluralize("day")).toBe("days");
    expect(pluralize("key")).toBe("keys");
  });

  it("handles words ending in 's', 'x', 'ch', 'sh'", () => {
    expect(pluralize("class")).toBe("classes");
    expect(pluralize("box")).toBe("boxes");
    expect(pluralize("watch")).toBe("watches");
    expect(pluralize("wish")).toBe("wishes");
  });
});

describe("singularize", () => {
  it("removes 's' from regular plurals", () => {
    expect(singularize("users")).toBe("user");
    expect(singularize("posts")).toBe("post");
    expect(singularize("comments")).toBe("comment");
  });

  it("handles words ending in 'ies'", () => {
    expect(singularize("categories")).toBe("category");
    expect(singularize("companies")).toBe("company");
  });

  it("handles words ending in 'es'", () => {
    expect(singularize("classes")).toBe("class");
    expect(singularize("boxes")).toBe("box");
    expect(singularize("watches")).toBe("watch");
  });

  it("doesn't modify words ending in 'ss'", () => {
    expect(singularize("class")).toBe("class");
  });
});

// ============================================================================
// Validation
// ============================================================================

describe("validateModelName", () => {
  it("accepts valid model names", () => {
    expect(() => validateModelName("User")).not.toThrow();
    expect(() => validateModelName("BlogPost")).not.toThrow();
    expect(() => validateModelName("user")).not.toThrow();
    expect(() => validateModelName("post123")).not.toThrow();
  });

  it("rejects empty names", () => {
    expect(() => validateModelName("")).toThrow("Model name is required");
  });

  it("rejects names starting with numbers", () => {
    expect(() => validateModelName("123user")).toThrow("Invalid model name");
  });

  it("rejects names with special characters", () => {
    expect(() => validateModelName("user-name")).toThrow("Invalid model name");
    expect(() => validateModelName("user_name")).toThrow("Invalid model name");
    expect(() => validateModelName("user.name")).toThrow("Invalid model name");
  });

  it("rejects reserved words", () => {
    expect(() => validateModelName("model")).toThrow("reserved word");
    expect(() => validateModelName("schema")).toThrow("reserved word");
    expect(() => validateModelName("db")).toThrow("reserved word");
    expect(() => validateModelName("database")).toThrow("reserved word");
    expect(() => validateModelName("table")).toThrow("reserved word");
  });
});

describe("validateFieldDefinition", () => {
  it("accepts valid field definitions", () => {
    expect(() => validateFieldDefinition("name:string")).not.toThrow();
    expect(() => validateFieldDefinition("age:integer")).not.toThrow();
    expect(() => validateFieldDefinition("active:boolean")).not.toThrow();
    expect(() => validateFieldDefinition("title")).not.toThrow(); // defaults to string
  });

  it("accepts nullable fields", () => {
    expect(() => validateFieldDefinition("bio:text?")).not.toThrow();
    expect(() => validateFieldDefinition("nickname?")).not.toThrow();
  });

  it("accepts unique modifier", () => {
    expect(() => validateFieldDefinition("email:string:unique")).not.toThrow();
  });

  it("accepts enum fields", () => {
    expect(() => validateFieldDefinition("status:enum:draft,published")).not.toThrow();
  });

  it("accepts reference fields", () => {
    expect(() => validateFieldDefinition("userId:references:user")).not.toThrow();
  });

  it("rejects invalid field names", () => {
    expect(() => validateFieldDefinition("UserName:string")).toThrow("Invalid field name");
    expect(() => validateFieldDefinition("user-name:string")).toThrow("Invalid field name");
    expect(() => validateFieldDefinition("123name:string")).toThrow("Invalid field name");
  });

  it("rejects invalid field types", () => {
    expect(() => validateFieldDefinition("name:invalid")).toThrow("Invalid field type");
    expect(() => validateFieldDefinition("name:foo")).toThrow("Invalid field type");
  });

  it("rejects enum without values", () => {
    expect(() => validateFieldDefinition("status:enum")).toThrow("requires values");
  });
});

// ============================================================================
// Field Parsing
// ============================================================================

describe("parseFields", () => {
  it("parses simple fields with default type", () => {
    const fields = parseFields(["name"]);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({
      name: "name",
      type: "string",
      isReference: false,
      isEnum: false,
      nullable: false,
      unique: false,
    });
  });

  it("parses fields with explicit type", () => {
    const fields = parseFields(["name:string", "age:integer", "bio:text"]);
    expect(fields).toHaveLength(3);
    expect(fields[0].type).toBe("string");
    expect(fields[1].type).toBe("integer");
    expect(fields[2].type).toBe("text");
  });

  it("parses nullable fields with ? on name", () => {
    const fields = parseFields(["bio?"]);
    expect(fields[0]).toMatchObject({
      name: "bio",
      nullable: true,
    });
  });

  it("parses nullable fields with ? on type", () => {
    const fields = parseFields(["bio:text?"]);
    expect(fields[0]).toMatchObject({
      name: "bio",
      type: "text",
      nullable: true,
    });
  });

  it("parses unique fields", () => {
    const fields = parseFields(["email:string:unique"]);
    expect(fields[0]).toMatchObject({
      name: "email",
      type: "string",
      unique: true,
    });
  });

  it("parses enum fields", () => {
    const fields = parseFields(["status:enum:draft,published,archived"]);
    expect(fields[0]).toMatchObject({
      name: "status",
      type: "enum",
      isEnum: true,
      enumValues: ["draft", "published", "archived"],
    });
  });

  it("parses reference fields", () => {
    const fields = parseFields(["userId:references:user"]);
    expect(fields[0]).toMatchObject({
      name: "userId",
      type: "integer",
      isReference: true,
      referenceTo: "user",
    });
  });

  it("parses multiple fields", () => {
    const fields = parseFields([
      "title:string",
      "body:text",
      "published:boolean",
      "authorId:references:user",
    ]);
    expect(fields).toHaveLength(4);
  });
});

// ============================================================================
// Model Context
// ============================================================================

describe("createModelContext", () => {
  it("creates context for simple model name", () => {
    const ctx = createModelContext("user");
    expect(ctx).toMatchObject({
      name: "user",
      singularName: "user",
      pluralName: "users",
      pascalName: "User",
      pascalPlural: "Users",
      camelName: "user",
      camelPlural: "users",
      snakeName: "user",
      snakePlural: "users",
      kebabName: "user",
      kebabPlural: "users",
      tableName: "users",
    });
  });

  it("creates context for plural model name", () => {
    const ctx = createModelContext("users");
    expect(ctx.singularName).toBe("user");
    expect(ctx.pluralName).toBe("users");
    expect(ctx.pascalName).toBe("User");
  });

  it("creates context for PascalCase model name", () => {
    const ctx = createModelContext("BlogPost");
    expect(ctx.singularName).toBe("BlogPost");
    expect(ctx.pascalName).toBe("BlogPost");
    expect(ctx.camelName).toBe("blogPost");
    expect(ctx.kebabPlural).toBe("blog-posts");
    expect(ctx.tableName).toBe("blog_posts");
  });
});

// ============================================================================
// Dialect-specific functions
// ============================================================================

describe("getTableFunction", () => {
  it("returns correct function for each dialect", () => {
    expect(getTableFunction("sqlite")).toBe("sqliteTable");
    expect(getTableFunction("postgresql")).toBe("pgTable");
    expect(getTableFunction("mysql")).toBe("mysqlTable");
  });
});

describe("getDrizzleImport", () => {
  it("returns correct import path for each dialect", () => {
    expect(getDrizzleImport("sqlite")).toBe("drizzle-orm/sqlite-core");
    expect(getDrizzleImport("postgresql")).toBe("drizzle-orm/pg-core");
    expect(getDrizzleImport("mysql")).toBe("drizzle-orm/mysql-core");
  });
});

describe("getIdColumn", () => {
  it("returns auto-increment id for default", () => {
    expect(getIdColumn("sqlite")).toContain("integer");
    expect(getIdColumn("sqlite")).toContain("primaryKey");
    expect(getIdColumn("sqlite")).toContain("autoIncrement");
  });

  it("returns serial for postgresql", () => {
    expect(getIdColumn("postgresql")).toContain("serial");
    expect(getIdColumn("postgresql")).toContain("primaryKey");
  });

  it("returns uuid when useUuid is true", () => {
    expect(getIdColumn("sqlite", true)).toContain("text");
    expect(getIdColumn("sqlite", true)).toContain("randomUUID");

    expect(getIdColumn("postgresql", true)).toContain("uuid");
    expect(getIdColumn("postgresql", true)).toContain("defaultRandom");

    expect(getIdColumn("mysql", true)).toContain("varchar");
    expect(getIdColumn("mysql", true)).toContain("randomUUID");
  });
});

describe("drizzleType", () => {
  const stringField = { name: "name", type: "string", isReference: false, isEnum: false, nullable: false, unique: false };
  const intField = { name: "age", type: "integer", isReference: false, isEnum: false, nullable: false, unique: false };
  const boolField = { name: "active", type: "boolean", isReference: false, isEnum: false, nullable: false, unique: false };
  const floatField = { name: "price", type: "float", isReference: false, isEnum: false, nullable: false, unique: false };
  const jsonField = { name: "data", type: "json", isReference: false, isEnum: false, nullable: false, unique: false };
  const uuidField = { name: "token", type: "uuid", isReference: false, isEnum: false, nullable: false, unique: false };

  describe("sqlite", () => {
    it("maps types correctly", () => {
      expect(drizzleType(stringField, "sqlite")).toBe("text");
      expect(drizzleType(intField, "sqlite")).toBe("integer");
      expect(drizzleType(boolField, "sqlite")).toContain("integer");
      expect(drizzleType(boolField, "sqlite")).toContain("boolean");
      expect(drizzleType(floatField, "sqlite")).toBe("real");
      expect(drizzleType(jsonField, "sqlite")).toBe("text");
      expect(drizzleType(uuidField, "sqlite")).toBe("text");
    });
  });

  describe("postgresql", () => {
    it("maps types correctly", () => {
      expect(drizzleType(stringField, "postgresql")).toBe("text");
      expect(drizzleType(intField, "postgresql")).toBe("integer");
      expect(drizzleType(boolField, "postgresql")).toBe("boolean");
      expect(drizzleType(floatField, "postgresql")).toBe("doublePrecision");
      expect(drizzleType(jsonField, "postgresql")).toBe("jsonb");
      expect(drizzleType(uuidField, "postgresql")).toBe("uuid");
    });
  });

  describe("mysql", () => {
    it("maps types correctly", () => {
      expect(drizzleType(stringField, "mysql")).toBe("varchar");
      expect(drizzleType(intField, "mysql")).toBe("int");
      expect(drizzleType(boolField, "mysql")).toBe("boolean");
      expect(drizzleType(floatField, "mysql")).toBe("double");
      expect(drizzleType(jsonField, "mysql")).toBe("json");
      expect(drizzleType(uuidField, "mysql")).toBe("varchar");
    });
  });
});
