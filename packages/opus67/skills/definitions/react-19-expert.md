# React 19 Expert

> **ID:** `react-19-expert`
> **Tier:** 2  
> **Token Cost:** 8000
> **MCP Connections:** context7

## 🎯 What This Skill Does

Master React 19 groundbreaking features: Server Components (RSC), Server Actions, use() hook, useOptimistic, useFormStatus, and useActionState. Build modern, performant apps with seamless server-client integration.

## 📚 When to Use

Automatically loaded for:
- **Keywords:** react 19, server components, server actions, useOptimistic, use hook, RSC, useFormStatus, useActionState
- **File Types:** .tsx, .jsx, page.tsx, layout.tsx  
- **Directories:** app/, components/, actions/

## 🚀 Core Capabilities

### 1. Server Components (RSC)

React Server Components run exclusively on server, reducing bundle size and enabling direct DB/API access.

**Architecture:**
- Async by default, no useState/useEffect/browser APIs
- Direct database queries without API routes
- Zero JS sent to client for static content
- Automatic code splitting at boundaries
- Streaming with Suspense

**Best Practices:**
- Default to Server Components (Next.js 13+ default)
- Keep interactive parts as Client Components  
- Pass Server Components as children to Client
- Fetch data at component level
- Use Suspense for loading states

**Patterns:**
```typescript
// app/dashboard/page.tsx - Server Component
import { db } from '@/lib/db'

export default async function Dashboard() {
  const user = await db.user.findUnique({ where: { id: userId }})
  const posts = await db.post.findMany({ where: { authorId: userId }})
  
  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <ClientCounter initialCount={posts.length} />
    </div>
  )
}
```

**Gotchas:**
- No hooks or browser APIs (window, document)
- Props must be serializable (no functions)
- Async components need parent await
- Event handlers require Client Component wrap

