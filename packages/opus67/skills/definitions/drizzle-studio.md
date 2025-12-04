# Drizzle ORM Expert

> **ID:** `drizzle-studio`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** supabase

## 🎯 What This Skill Does

Master type-safe database operations with Drizzle ORM - the TypeScript-first ORM that provides SQL-like query builders with full type inference. This skill covers schema design, migrations, query building, and integration with modern serverless databases.

**Core Capabilities:**
- TypeScript-first schema definitions with automatic type generation
- Type-safe query builders with SQL-like syntax
- Drizzle Kit for schema migrations and introspection
- Drizzle Studio - visual database browser
- Support for PostgreSQL, MySQL, SQLite
- Serverless-ready with connection pooling
- Relations and joins with type inference
- Transaction management

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** drizzle, drizzle-orm, drizzle-kit, pgTable, mysqlTable, sqliteTable, drizzle-studio
- **File Types:** schema.ts, db.ts, migrate.ts
- **Directories:** db/, drizzle/

## 🚀 Core Capabilities

### 1. Installation & Setup

**Install Drizzle ORM:**

```bash
# Core package
npm install drizzle-orm

# Database driver (choose one)
npm install @neondatabase/serverless  # Neon
npm install @planetscale/database     # PlanetScale
npm install postgres                  # PostgreSQL
npm install @libsql/client            # Turso/SQLite
npm install mysql2                    # MySQL

# Development tools
npm install -D drizzle-kit            # Migrations & Studio
```

**Project Structure:**

```
project/
├── db/
│   ├── schema/
│   │   ├── users.ts          # User table schema
│   │   ├── posts.ts          # Posts table schema
│   │   ├── comments.ts       # Comments table schema
│   │   └── index.ts          # Export all schemas
│   ├── index.ts              # Database client
│   ├── migrate.ts            # Migration runner
│   └── seed.ts               # Seed data
├── drizzle/
│   ├── 0000_xxx.sql          # Generated migrations
│   └── meta/                 # Migration metadata
├── drizzle.config.ts         # Drizzle Kit config
└── lib/
    └── db-queries.ts         # Reusable queries
```

**Configuration:**

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

**Environment Variables:**

```bash
# .env
DATABASE_URL="postgresql://user:password@host:5432/database"

# For serverless (Neon)
DATABASE_URL="postgres://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# For PlanetScale
DATABASE_URL="mysql://user:password@aws.connect.psdb.cloud/database?ssl={"rejectUnauthorized":true}"
```

### 2. TypeScript-First Schema Definitions

**PostgreSQL Schema:**

```typescript
// db/schema/users.ts
import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  emailVerified: timestamp('email_verified'),
  metadata: jsonb('metadata').$type<{
    preferences?: { theme?: string; notifications?: boolean };
    social?: { twitter?: string; github?: string };
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  sessions: many(sessions),
}));

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**Posts Schema with Relations:**

```typescript
// db/schema/posts.ts
import { pgTable, serial, varchar, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { comments } from './comments';

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  coverImage: text('cover_image'),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  viewCount: integer('view_count').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  authorIdx: index('author_idx').on(table.authorId),
  slugIdx: index('slug_idx').on(table.slug),
  statusIdx: index('status_idx').on(table.status),
  publishedAtIdx: index('published_at_idx').on(table.publishedAt),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  tags: many(postTags),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

**Comments with Self-Referencing:**

```typescript
// db/schema/comments.ts
import { pgTable, serial, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { posts } from './posts';

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id').references((): any => comments.id, { onDelete: 'cascade' }), // Self-reference
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  postIdx: index('comment_post_idx').on(table.postId),
  authorIdx: index('comment_author_idx').on(table.authorId),
  parentIdx: index('comment_parent_idx').on(table.parentId),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'replies',
  }),
  replies: many(comments, { relationName: 'replies' }),
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
```

**Many-to-Many Relations:**

```typescript
// db/schema/tags.ts
import { pgTable, serial, varchar, integer, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { posts } from './posts';

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const postTags = pgTable('post_tags', {
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
```

**Enum Support:**

```typescript
// db/schema/enums.ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin', 'moderator']);
export const statusEnum = pgEnum('status', ['draft', 'published', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent']);

// Usage in schema
import { roleEnum } from './enums';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  role: roleEnum('role').notNull().default('user'),
  // ...
});
```

**Schema Index File:**

```typescript
// db/schema/index.ts
export * from './users';
export * from './posts';
export * from './comments';
export * from './tags';
export * from './enums';
```

**Best Practices:**
- Use `serial()` for auto-incrementing primary keys in PostgreSQL
- Always define `notNull()` constraints explicitly
- Add indexes on foreign keys and frequently queried columns
- Use `$inferSelect` and `$inferInsert` for type safety
- Define relations in separate `relations()` calls
- Use JSONB for flexible structured data

**Gotchas:**
- Relations are NOT SQL constraints - they're for query building
- Self-referencing foreign keys need type assertion
- Enum changes require migrations (use varchar for flexibility)
- Timestamps default to database timezone (use UTC)

### 3. Database Client Setup

**PostgreSQL (Neon Serverless):**

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// For connection pooling
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const pooledDb = drizzle(pool, { schema });
```

**PostgreSQL (node-postgres):**

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
```

**PlanetScale (MySQL):**

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { Client } from '@planetscale/database';
import * as schema from './schema';

const client = new Client({
  url: process.env.DATABASE_URL,
});

export const db = drizzle(client, { schema });
```

**Turso/LibSQL (SQLite):**

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

### 4. Type-Safe Query Building

**Basic CRUD Operations:**

```typescript
// lib/db-queries.ts
import { db } from '@/db';
import { users, posts, comments, type NewUser, type NewPost } from '@/db/schema';
import { eq, and, or, not, like, gte, lte, desc, asc, sql } from 'drizzle-orm';

// CREATE
export async function createUser(data: NewUser) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function createPost(data: NewPost) {
  const [post] = await db.insert(posts).values(data).returning();
  return post;
}

// READ - Single
export async function getUserById(id: number) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

// READ - Multiple
export async function getActiveUsers() {
  return db.query.users.findMany({
    where: eq(users.isActive, true),
    orderBy: [desc(users.createdAt)],
    limit: 100,
  });
}

export async function getPublishedPosts() {
  return db.query.posts.findMany({
    where: and(
      eq(posts.isPublished, true),
      eq(posts.status, 'published')
    ),
    orderBy: [desc(posts.publishedAt)],
    with: {
      author: true, // Include author relation
    },
  });
}

// UPDATE
export async function updateUser(id: number, data: Partial<NewUser>) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated;
}

export async function incrementPostViews(postId: number) {
  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postId));
}

// DELETE
export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}

// DELETE with condition
export async function deleteOldPosts(days: number) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await db.delete(posts).where(lte(posts.createdAt, cutoff));
}
```

**Complex Queries with Joins:**

```typescript
// Relational queries (recommended)
export async function getPostsWithAuthors() {
  return db.query.posts.findMany({
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      comments: {
        limit: 5,
        orderBy: [desc(comments.createdAt)],
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      tags: {
        with: {
          tag: true,
        },
      },
    },
    where: eq(posts.isPublished, true),
    orderBy: [desc(posts.publishedAt)],
  });
}

// Manual joins (SQL-like)
export async function getPostsWithCommentCount() {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      authorName: users.name,
      commentCount: sql<number>`count(${comments.id})`,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .groupBy(posts.id, users.name)
    .orderBy(desc(posts.createdAt));
}
```

**Advanced Filtering:**

```typescript
// Search with multiple conditions
export async function searchPosts(query: string, status?: string) {
  return db.query.posts.findMany({
    where: and(
      or(
        like(posts.title, `%${query}%`),
        like(posts.content, `%${query}%`)
      ),
      status ? eq(posts.status, status) : undefined,
      eq(posts.isPublished, true)
    ),
    limit: 20,
  });
}

// Date range queries
export async function getPostsByDateRange(start: Date, end: Date) {
  return db.query.posts.findMany({
    where: and(
      gte(posts.createdAt, start),
      lte(posts.createdAt, end)
    ),
    orderBy: [desc(posts.createdAt)],
  });
}

// Pagination
export async function getPaginatedPosts(page: number, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;

  const [items, [{ count }]] = await Promise.all([
    db.query.posts.findMany({
      where: eq(posts.isPublished, true),
      limit: pageSize,
      offset,
      orderBy: [desc(posts.publishedAt)],
      with: {
        author: {
          columns: { id: true, name: true, avatarUrl: true },
        },
      },
    }),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.isPublished, true)),
  ]);

  return {
    items,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}
```

**Aggregations:**

```typescript
// Count, sum, avg, min, max
import { count, sum, avg, min, max } from 'drizzle-orm';

export async function getUserStats(userId: number) {
  const [stats] = await db
    .select({
      totalPosts: count(posts.id),
      totalViews: sum(posts.viewCount),
      avgViews: avg(posts.viewCount),
      firstPost: min(posts.createdAt),
      latestPost: max(posts.createdAt),
    })
    .from(posts)
    .where(eq(posts.authorId, userId));

  return stats;
}
```

**Transactions:**

```typescript
// Atomic operations
export async function createPostWithTags(postData: NewPost, tagNames: string[]) {
  return db.transaction(async (tx) => {
    // Create post
    const [post] = await tx.insert(posts).values(postData).returning();

    // Find or create tags
    for (const tagName of tagNames) {
      let [tag] = await tx.select().from(tags).where(eq(tags.name, tagName));

      if (!tag) {
        [tag] = await tx.insert(tags).values({
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-'),
        }).returning();
      }

      // Link post to tag
      await tx.insert(postTags).values({
        postId: post.id,
        tagId: tag.id,
      });
    }

    return post;
  });
}

// Rollback on error
export async function transferCredits(fromUserId: number, toUserId: number, amount: number) {
  return db.transaction(async (tx) => {
    // Deduct from sender
    const [sender] = await tx
      .update(users)
      .set({ credits: sql`${users.credits} - ${amount}` })
      .where(eq(users.id, fromUserId))
      .returning();

    if (sender.credits < 0) {
      throw new Error('Insufficient credits');
    }

    // Add to receiver
    await tx
      .update(users)
      .set({ credits: sql`${users.credits} + ${amount}` })
      .where(eq(users.id, toUserId));

    return { success: true };
  });
}
```

**Best Practices:**
- Use relational queries (`db.query`) for most cases - cleaner syntax
- Use manual joins only for complex aggregations
- Always validate input before queries
- Use transactions for multi-step operations
- Prefer `returning()` to get inserted/updated data
- Use SQL tagged templates for custom SQL

**Gotchas:**
- `findFirst()` returns `undefined` if not found, not null
- Relations must be defined in schema to use `with`
- Transactions automatically rollback on thrown errors
- `like()` is case-sensitive (use `ilike()` for case-insensitive)

### 5. Migrations with Drizzle Kit

**Generate Migrations:**

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Or for MySQL
npx drizzle-kit generate:mysql

# Or for SQLite
npx drizzle-kit generate:sqlite
```

**Migration Runner:**

```typescript
// db/migrate.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log('Running migrations...');

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed!', err);
  process.exit(1);
});
```

**Run Migrations:**

```bash
# Add to package.json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "tsx db/migrate.ts",
    "db:push": "drizzle-kit push:pg",  // Push schema without migrations
    "db:studio": "drizzle-kit studio",  // Open Drizzle Studio
    "db:drop": "drizzle-kit drop",      // Drop migration
  }
}

# Generate and run
npm run db:generate
npm run db:migrate
```

**Drizzle Studio (Visual Database Browser):**

```bash
# Start Drizzle Studio
npx drizzle-kit studio

# Opens at https://local.drizzle.studio
# Features:
# - Browse all tables
# - Run queries
# - View relationships
# - Edit data inline
# - Generate TypeScript types
```

**Schema Introspection:**

```bash
# Generate schema from existing database
npx drizzle-kit introspect:pg

# This creates schema.ts from your database
```

**Best Practices:**
- Always review generated migrations before running
- Test migrations in development first
- Keep migrations in version control
- Use `db:push` for rapid prototyping (skips migrations)
- Use `db:generate` for production (creates migrations)
- Never edit generated migrations manually

**Gotchas:**
- Drizzle Kit doesn't support all database features (e.g., triggers)
- Schema changes must be in `schema.ts` to be detected
- Renaming columns creates drop + create (data loss)
- Use raw SQL migrations for complex changes

### 6. Drizzle with Next.js

**API Route:**

```typescript
// app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, type NewPost } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  authorId: z.number(),
});

export async function GET() {
  const allPosts = await db.query.posts.findMany({
    with: {
      author: {
        columns: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  });

  return NextResponse.json(allPosts);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createPostSchema.parse(body);

    const [post] = await db.insert(posts).values({
      ...data,
      slug: data.title.toLowerCase().replace(/\s+/g, '-'),
      status: 'draft',
    }).returning();

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Server Actions:**

```typescript
// app/actions/posts.ts
'use server';

import { db } from '@/db';
import { posts, comments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const authorId = parseInt(formData.get('authorId') as string);

  const [post] = await db.insert(posts).values({
    title,
    content,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    authorId,
    status: 'draft',
  }).returning();

  revalidatePath('/posts');
  return { success: true, postId: post.id };
}

export async function deletePost(postId: number) {
  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath('/posts');
  return { success: true };
}

export async function addComment(postId: number, content: string, authorId: number) {
  const [comment] = await db.insert(comments).values({
    postId,
    content,
    authorId,
  }).returning();

  revalidatePath(`/posts/${postId}`);
  return comment;
}
```

**Server Component:**

```typescript
// app/posts/page.tsx
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function PostsPage() {
  const allPosts = await db.query.posts.findMany({
    where: eq(posts.isPublished, true),
    orderBy: [desc(posts.publishedAt)],
    with: {
      author: true,
      comments: {
        limit: 3,
        orderBy: [desc(comments.createdAt)],
      },
    },
  });

  return (
    <div>
      <h1>Posts</h1>
      {allPosts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>By {post.author.name}</p>
          <div>{post.excerpt}</div>
          <span>{post.comments.length} comments</span>
        </article>
      ))}
    </div>
  );
}
```

### 7. Performance Optimization

**Connection Pooling:**

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

// Close pool on shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
```

**Prepared Statements:**

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Prepared statement (cached query plan)
const prepared = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare('get_user_by_id');

export async function getUserByIdFast(id: number) {
  return prepared.execute({ id });
}
```

**Batch Operations:**

```typescript
// Insert multiple rows efficiently
export async function createUsers(usersData: NewUser[]) {
  return db.insert(users).values(usersData).returning();
}

// Update multiple rows
export async function activateUsers(userIds: number[]) {
  return db
    .update(users)
    .set({ isActive: true })
    .where(inArray(users.id, userIds));
}
```

**Partial Selects:**

```typescript
// Select only needed columns
export async function getUsersForList() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.isActive, true));
}
```

## 💡 Real-World Examples

### Example 1: Blog Platform

```typescript
// Complete blog implementation

// 1. Get post with all related data
export async function getPostBySlug(slug: string) {
  return db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
        },
      },
      comments: {
        where: eq(comments.parentId, null), // Top-level comments only
        orderBy: [desc(comments.createdAt)],
        with: {
          author: {
            columns: { id: true, name: true, avatarUrl: true },
          },
          replies: {
            with: {
              author: {
                columns: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      },
      tags: {
        with: { tag: true },
      },
    },
  });
}

// 2. Get related posts
export async function getRelatedPosts(postId: number, limit: number = 3) {
  // Get tags for current post
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { tags: { with: { tag: true } } },
  });

  if (!post) return [];

  const tagIds = post.tags.map(pt => pt.tag.id);

  // Find posts with overlapping tags
  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .leftJoin(postTags, eq(postTags.postId, posts.id))
    .where(
      and(
        inArray(postTags.tagId, tagIds),
        not(eq(posts.id, postId)),
        eq(posts.isPublished, true)
      )
    )
    .groupBy(posts.id)
    .limit(limit);
}
```

### Example 2: E-commerce Order System

```typescript
// Complex transaction for order creation
export async function createOrder(
  userId: number,
  items: Array<{ productId: number; quantity: number }>
) {
  return db.transaction(async (tx) => {
    // 1. Validate stock availability
    for (const item of items) {
      const product = await tx.query.products.findFirst({
        where: eq(products.id, item.productId),
      });

      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    // 2. Create order
    const [order] = await tx.insert(orders).values({
      userId,
      status: 'pending',
      total: 0, // Will update after calculating
      createdAt: new Date(),
    }).returning();

    // 3. Create order items and update stock
    let total = 0;
    for (const item of items) {
      const product = await tx.query.products.findFirst({
        where: eq(products.id, item.productId),
      });

      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: product!.price,
      });

      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(eq(products.id, item.productId));

      total += product!.price * item.quantity;
    }

    // 4. Update order total
    await tx.update(orders).set({ total }).where(eq(orders.id, order.id));

    return order;
  });
}
```

## 🔗 Related Skills

- **neon-postgres** - Serverless PostgreSQL provider (pairs perfectly with Drizzle)
- **clerk-auth-expert** - Use Clerk user IDs as foreign keys
- **tanstack-query-expert** - Cache Drizzle queries on client-side
- **zod** - Validate inputs before database operations
- **react-hook-form-zod** - Form handling with Drizzle schemas

## 📖 Further Reading

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [PostgreSQL with Drizzle](https://orm.drizzle.team/docs/get-started-postgresql)
- [Relations](https://orm.drizzle.team/docs/rqb)
- [Migrations Guide](https://orm.drizzle.team/docs/migrations)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
