---
id: cli-reference
title: CLI Reference
sidebar_position: 5
---

# CLI Reference

## Commands

### `drizzle-gen model`

Creates a Drizzle schema model.

```bash
drizzle-gen model <name> [fields...]
```

**Arguments:**
- `name` - Model name (singular, e.g., `user`, `post`)
- `fields` - Field definitions (see [Field Types](/field-types))

**Example:**
```bash
drizzle-gen model user name:string email:string:unique
```

---

### `drizzle-gen actions`

Creates server actions for an existing model.

```bash
drizzle-gen actions <name>
```

**Arguments:**
- `name` - Model name (must exist in schema)

**Example:**
```bash
drizzle-gen actions user
```

---

### `drizzle-gen resource`

Creates model + actions (no UI pages).

```bash
drizzle-gen resource <name> [fields...]
```

**Arguments:**
- `name` - Model name
- `fields` - Field definitions

**Example:**
```bash
drizzle-gen resource session token:uuid userId:references:user
```

---

### `drizzle-gen scaffold`

Creates model + actions + CRUD pages.

```bash
drizzle-gen scaffold <name> [fields...]
```

**Arguments:**
- `name` - Model name
- `fields` - Field definitions

**Example:**
```bash
drizzle-gen scaffold product name:string price:float description:text?
```

---

### `drizzle-gen api`

Creates model + REST API routes.

```bash
drizzle-gen api <name> [fields...]
```

**Arguments:**
- `name` - Model name
- `fields` - Field definitions

**Example:**
```bash
drizzle-gen api webhook url:string secret:string:unique
```

---

### `drizzle-gen destroy`

Removes generated files (does not modify schema).

```bash
drizzle-gen destroy <type> <name>
```

**Arguments:**
- `type` - Generator type (`scaffold`, `api`, `actions`, `resource`)
- `name` - Model name

**Example:**
```bash
drizzle-gen destroy scaffold post
drizzle-gen destroy api product --dry-run
```

---

### `drizzle-gen config`

Shows detected project configuration.

```bash
drizzle-gen config
```

**Output:**
```
Project Configuration:
  Structure: app/
  Path alias: @
  DB path: db
  Dialect: sqlite
```

## Global Options

These options work with all generator commands:

| Option | Short | Description |
|--------|-------|-------------|
| `--force` | `-f` | Overwrite existing files |
| `--dry-run` | `-n` | Preview changes without writing |
| `--uuid` | `-u` | Use UUID for primary key |
| `--no-timestamps` | | Skip createdAt/updatedAt fields |
| `--help` | `-h` | Show help for command |

## Examples

### Dry Run

Preview what would be generated:

```bash
drizzle-gen scaffold post title:string --dry-run
```

### Force Overwrite

Regenerate files even if they exist:

```bash
drizzle-gen scaffold post title:string body:text --force
```

### UUID Primary Keys

Use UUIDs instead of auto-incrementing integers:

```bash
drizzle-gen scaffold post title:string --uuid
```

### Skip Timestamps

Create model without createdAt/updatedAt:

```bash
drizzle-gen model setting key:string value:text --no-timestamps
```
