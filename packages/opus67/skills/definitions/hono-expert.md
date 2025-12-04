# Hono Expert - Ultrafast Edge Web Framework

## Skill Metadata
- **ID**: hono-expert
- **Category**: Backend Development
- **Complexity**: Intermediate
- **Prerequisites**: TypeScript, HTTP fundamentals
- **Last Updated**: 2025-12-04
- **Version**: 1.0.0

## Overview
Master Hono.js - the ultrafast, lightweight web framework for building modern APIs on the edge. Learn multi-runtime support (Cloudflare Workers, Deno, Bun, Node.js), RPC-style type-safe endpoints, middleware patterns, and production-ready patterns.

## Why Hono?

### The Performance Edge
```typescript
// Hono is 4x faster than Express
// Request/sec comparison:
// - Express: ~50k req/s
// - Fastify: ~70k req/s
// - Hono: ~200k req/s

// Ultra-small bundle: ~14KB (Express: ~500KB)
```

### Multi-Runtime Support
```typescript
// Same codebase runs on:
// - Cloudflare Workers
// - Deno
// - Bun
// - Node.js
// - AWS Lambda
// - Vercel Edge Functions
```

## Installation & Setup

### Basic Setup
```bash
# Create new Hono project
npm create hono@latest my-api

# Or add to existing project
npm install hono

# For Node.js adapter
npm install @hono/node-server

# For Cloudflare Workers
npm install -D wrangler
```

### Project Structure
```
my-api/
├── src/
│   ├── index.ts           # Entry point
│   ├── routes/
│   │   ├── auth.ts        # Auth routes
│   │   ├── users.ts       # User CRUD
│   │   └── posts.ts       # Post routes
│   ├── middleware/
│   │   ├── auth.ts        # Auth middleware
│   │   ├── validation.ts  # Zod validation
│   │   └── logger.ts      # Request logging
│   ├── lib/
│   │   ├── db.ts          # Database client
│   │   └── utils.ts       # Utilities
│   └── types/
│       └── env.ts         # Environment types
├── wrangler.toml          # Cloudflare config
└── package.json
```

## Core Concepts

### 1. Basic Application
```typescript
// src/index.ts
import { Hono } from 'hono'

const app = new Hono()

// Simple route
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// JSON response
app.get('/api/status', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

// Dynamic route
app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ userId: id })
})

// Query parameters
app.get('/search', (c) => {
  const query = c.req.query('q')
  const page = c.req.query('page') ?? '1'
  return c.json({ query, page })
})

export default app
```

### 2. Type-Safe Context
```typescript
// src/types/env.ts
export type Bindings = {
  DATABASE: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  API_KEY: string
}

export type Variables = {
  userId: string
  isAdmin: boolean
}

// src/index.ts
import { Hono } from 'hono'
import type { Bindings, Variables } from './types/env'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.get('/data', async (c) => {
  // Fully typed!
  const db = c.env.DATABASE
  const userId = c.get('userId')

  return c.json({ userId })
})
```

### 3. Middleware Patterns
```typescript
// src/middleware/logger.ts
import { MiddlewareHandler } from 'hono'

export const logger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    console.log(`${c.req.method} ${c.req.url} - ${ms}ms`)
  }
}

// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

export const auth = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  // Verify token (example with JWT)
  const payload = await verifyToken(token)
  c.set('userId', payload.sub)
  c.set('isAdmin', payload.role === 'admin')

  await next()
})

// Usage
app.use('/api/*', logger())
app.use('/api/admin/*', auth)
```

### 4. Zod Validation
```typescript
// src/middleware/validation.ts
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

// Schema
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().int().positive().optional()
})

// Route with validation
app.post('/users', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json') // Fully typed!

  // data is { email: string, name: string, age?: number }
  const user = await createUser(data)

  return c.json(user, 201)
})

// Query validation
const searchSchema = z.object({
  q: z.string().min(1),
  page: z.string().regex(/^\d+$/).transform(Number).default('1')
})

app.get('/search', zValidator('query', searchSchema), (c) => {
  const { q, page } = c.req.valid('query')
  return c.json({ q, page })
})
```

## Advanced Patterns

### 1. RPC-Style Type Safety
```typescript
// src/routes/users.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const users = new Hono()
  .get('/', (c) => {
    return c.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ])
  })
  .post(
    '/',
    zValidator('json', z.object({ name: z.string() })),
    (c) => {
      const { name } = c.req.valid('json')
      return c.json({ id: 3, name }, 201)
    }
  )
  .get('/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id, name: 'Alice' })
  })

export type UsersAPI = typeof users

// Client-side (with hono/client)
import { hc } from 'hono/client'
import type { UsersAPI } from './routes/users'

const client = hc<UsersAPI>('http://localhost:3000')

// Fully typed!
const res = await client.users.$get()
const users = await res.json() // { id: number, name: string }[]
```

### 2. Database Integration (D1)
```typescript
// src/lib/db.ts
import { D1Database } from '@cloudflare/workers-types'

export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export class Database {
  constructor(private db: D1Database) {}

  async getUser(id: number): Promise<User | null> {
    return await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>()
  }

  async createUser(email: string, name: string): Promise<User> {
    const result = await this.db
      .prepare('INSERT INTO users (email, name) VALUES (?, ?) RETURNING *')
      .bind(email, name)
      .first<User>()

    if (!result) throw new Error('Failed to create user')
    return result
  }

  async listUsers(limit = 10, offset = 0): Promise<User[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM users LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<User>()

    return results
  }
}

// src/routes/users.ts
import { Hono } from 'hono'
import { Database } from '../lib/db'

const users = new Hono<{ Bindings: { DATABASE: D1Database } }>()

users.get('/', async (c) => {
  const db = new Database(c.env.DATABASE)
  const users = await db.listUsers()
  return c.json(users)
})

users.get('/:id', async (c) => {
  const db = new Database(c.env.DATABASE)
  const id = parseInt(c.req.param('id'))
  const user = await db.getUser(id)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(user)
})
```

### 3. KV Storage
```typescript
// src/lib/cache.ts
import { KVNamespace } from '@cloudflare/workers-types'

export class Cache {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, 'json
