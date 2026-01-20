---
id: model
title: Model Generator
sidebar_position: 1
---

# Model Generator

Creates a Drizzle schema model in `db/schema.ts`.

## Usage

```bash
drizzle-gen model <name> [fields...]
```

## Examples

### Basic Model

```bash
drizzle-gen model user name:string email:string
```

Generates in `db/schema.ts`:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

### With Unique Constraint

```bash
drizzle-gen model user name:string email:string:unique
```

### With Nullable Fields

```bash
drizzle-gen model user name:string bio:text? nickname?
```

The `?` modifier makes a field nullable.

### With Enum

```bash
drizzle-gen model order total:decimal status:enum:pending,paid,shipped
```

### With References

```bash
drizzle-gen model comment content:text authorId:references:user
```

Creates a foreign key reference to the `users` table.

### With UUID Primary Key

```bash
drizzle-gen model session token:string --uuid
```

Uses UUID instead of auto-incrementing integer for the primary key.

### Without Timestamps

```bash
drizzle-gen model setting key:string value:text --no-timestamps
```

Skips the `createdAt` and `updatedAt` fields.

## Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite if model exists |
| `-n, --dry-run` | Preview without writing |
| `-u, --uuid` | Use UUID for primary key |
| `--no-timestamps` | Skip createdAt/updatedAt |

## Database Dialects

The generated code adapts to your database dialect (detected from `drizzle.config.ts`):

### SQLite
- Uses `sqliteTable`
- Integers with mode for booleans/timestamps
- Text for UUIDs

### PostgreSQL
- Uses `pgTable`
- Native boolean, timestamp, uuid types
- `pgEnum` for enums

### MySQL
- Uses `mysqlTable`
- Native datetime, boolean types
- `mysqlEnum` for enums
