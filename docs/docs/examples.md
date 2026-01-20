---
id: examples
title: Examples
sidebar_position: 6
---

# Examples

## Blog Application

### Posts with Categories

```bash
# Create category model
drizzle-gen model category name:string slug:string:unique

# Create posts with full CRUD UI
drizzle-gen scaffold post title:string slug:string:unique body:text published:boolean categoryId:references:category

# Create comments
drizzle-gen scaffold comment content:text authorName:string postId:references:post
```

### Tags (Many-to-Many)

```bash
# Tags
drizzle-gen model tag name:string:unique

# Join table
drizzle-gen model postTag postId:references:post tagId:references:tag
```

## E-Commerce

### Products and Orders

```bash
# Products
drizzle-gen scaffold product name:string description:text? price:decimal sku:string:unique inStock:boolean

# Orders
drizzle-gen scaffold order status:enum:pending,paid,shipped,delivered total:decimal customerEmail:string

# Order items (resource - no UI needed)
drizzle-gen resource orderItem orderId:references:order productId:references:product quantity:integer price:decimal
```

## User Management

### Users with Sessions

```bash
# Users
drizzle-gen scaffold user email:string:unique name:string role:enum:admin,user passwordHash:string

# Sessions (backend only)
drizzle-gen resource session token:uuid:unique userId:references:user expiresAt:datetime --uuid
```

## API-First Application

### External Webhooks

```bash
# Webhooks API
drizzle-gen api webhook url:string secret:string:unique events:json active:boolean

# Webhook deliveries (for logging)
drizzle-gen resource webhookDelivery webhookId:references:webhook payload:json responseCode:integer? responseBody:text? deliveredAt:datetime?
```

## Content Management

### Pages with Metadata

```bash
# Pages
drizzle-gen scaffold page title:string slug:string:unique content:text metaTitle:string? metaDescription:text? publishedAt:datetime?

# Media library
drizzle-gen scaffold media filename:string url:string mimeType:string size:integer alt:text?
```

## Audit Logging

```bash
# Audit logs (no UI, just for querying)
drizzle-gen resource auditLog action:enum:create,update,delete entityType:string entityId:integer userId:references:user changes:json ipAddress:string? userAgent:text?
```

## Full Example: Task Manager

```bash
# Users
drizzle-gen scaffold user email:string:unique name:string avatarUrl:string?

# Projects
drizzle-gen scaffold project name:string description:text? ownerId:references:user

# Tasks
drizzle-gen scaffold task title:string description:text? status:enum:todo,in_progress,done priority:enum:low,medium,high dueDate:date? projectId:references:project assigneeId:references:user?

# Comments on tasks
drizzle-gen scaffold taskComment content:text taskId:references:task authorId:references:user

# Project members (join table)
drizzle-gen resource projectMember projectId:references:project userId:references:user role:enum:viewer,editor,admin
```

After running these commands:

1. Push the schema to your database:
   ```bash
   pnpm db:push
   ```

2. Start the dev server:
   ```bash
   pnpm dev
   ```

3. Visit the generated pages:
   - `/users` - User management
   - `/projects` - Project management
   - `/tasks` - Task management
   - `/task-comments` - Task comments
