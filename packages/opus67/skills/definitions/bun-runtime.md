# Bun Runtime Expert

> **ID:** `bun-runtime`
> **Tier:** 2
> **Token Cost:** 5000  
> **MCP Connections:** None

## 🎯 What This Skill Does

Master Bun - the all-in-one toolkit. Fast package manager, runtime, test runner, and bundler. Built from scratch for speed with native APIs.

## 📚 When to Use

- **Keywords:** bun, bun.serve, bun:sqlite, bunx, bun test, bun install
- **File Types:** .ts, .tsx, .js, .jsx
- **Directories:** Any TypeScript/JavaScript project

## 🚀 Core Capabilities

### 1. Bun.serve() HTTP Server

Ultra-fast HTTP server with Web standard APIs.

**Best Practices:**
- Use for high-performance APIs
- Leverage native WebSocket support
- Stream responses for large data
- Use Bun.file() for static files

**Patterns:**
```typescript
// server.ts
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)
    
    if (url.pathname === '/api/users') {
      const users = await db.query('SELECT * FROM users')
      return Response.json(users)
    }
    
    if (url.pathname === '/file') {
      return new Response(Bun.file('./large-file.pdf'))
    }
    
    return new Response('Not Found', { status: 404 })
  }
})
```

### 2. bun:sqlite Native Database

Built-in SQLite with zero dependencies.

**Patterns:**
```typescript
import { Database } from 'bun:sqlite'

const db = new Database('mydb.sqlite')

// Prepared statements
const insert = db.prepare('INSERT INTO users (name) VALUES (?)')
insert.run('Alice')

// Transactions
db.transaction(() => {
  insert.run('Bob')
  insert.run('Charlie')
})()
```

### 3. Fast Package Management

10-100x faster than npm/yarn.

**Commands:**
- `bun install` - Install dependencies
- `bun add <pkg>` - Add package
- `bun remove <pkg>` - Remove package  
- `bunx <cmd>` - Run package binary
- `bun pm cache rm` - Clear cache

### 4. TypeScript Without Config

Zero-config TypeScript support.

**Features:**
- Instant .ts/.tsx execution
- No tsconfig.json needed
- JSX auto-transform
- Import from URLs
- Node.js compatibility mode

**Gotchas:**
- Some Node.js APIs not yet supported
- npm packages may need compatibility layer
- Windows support improving

## 🔗 Related Skills

- hono-expert, nodejs-backend-patterns, vitest-expert

## 📖 Further Reading

- https://bun.sh/docs
- https://bun.sh/guides

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
