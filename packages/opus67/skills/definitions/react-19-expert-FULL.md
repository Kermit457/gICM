# React 19 Expert

> **ID:** `react-19-expert`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** context7

## 🎯 What This Skill Does

Master React 19's groundbreaking features including Server Components, Server Actions, the new use hook, useOptimistic, useFormStatus, and useActionState. Build modern, performant applications with seamless server-client integration.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** react 19, server components, server actions, useOptimistic, use hook, RSC
- **File Types:** `.tsx`, `.jsx`, `page.tsx`, `layout.tsx`
- **Directories:** `app/`, `components/`, `actions/`

## 🚀 Core Capabilities

### 1. Server Components (RSC)

React Server Components run exclusively on the server, reducing bundle size and enabling direct database/API access.

**Architecture Principles:**
- Server Components are async by default
- No useState, useEffect, or browser APIs
- Direct database queries and API calls
- Zero JavaScript sent to client
- Automatic code splitting

**Best Practices:**
- Use Server Components by default in Next.js 13+
- Keep interactive components as Client Components
- Pass Server Component output as children
- Fetch data at component level
- Use Suspense boundaries for streaming

**Common Patterns:**
- Direct database access without API routes
- Async components with await
- Composition via children prop
- Streaming with Suspense
- Automatic request deduplication

**Gotchas:**
- No hooks allowed in Server Components
- No browser APIs available
- Props must be serializable
- Event handlers need Client Components

### 2. Server Actions

Server Actions are async functions that run on the server, callable from Client or Server Components.

**Core Concepts:**
- Marked with 'use server' directive
- Type-safe end-to-end
- Work with forms natively
- Automatic CSRF protection
- Built-in retries

**Best Practices:**
- Use for mutations (POST, PUT, DELETE)
- Validate input with Zod
- Return structured data
- Use revalidatePath after mutations
- Keep actions in separate files
- TypeScript for type safety

**Common Patterns:**
- Form submissions
- Optimistic updates
- Progressive enhancement
- File uploads
- Batch operations

**Gotchas:**
- Only serializable data
- Form actions get FormData
- Remember revalidatePath
- Can be called from Server Components too

### 3. use() Hook

The use hook unwraps promises and context in render.

**Core Concepts:**
- Suspends until promise resolves
- Can be called conditionally
- Works with Context
- Enables async in Client Components
- Throws to Error Boundary

**Best Practices:**
- Combine with Suspense
- Cache promises
- Use for conditional async
- Handle errors with boundaries
- Prefer Server Components for initial data

**Common Patterns:**
- Async client data fetching
- Conditional data loading
- Dynamic context access
- Parallel data fetching
- Waterfall dependencies

**Gotchas:**
- Promise must be stable
- Needs Suspense boundary
- Errors need Error Boundary
- Don't recreate promise

### 4. useOptimistic

Optimistic updates for instant UI feedback.

**Core Concepts:**
- Show expected result immediately
- Revert if action fails
- Works with useTransition
- Type-safe with TypeScript
- Automatic rollback

**Best Practices:**
- Use for expected-to-succeed operations
- Show visual feedback
- Handle rollback gracefully
- Combine with error toasts
- Keep state simple

**Common Patterns:**
- Like buttons
- Follow buttons
- Todo lists
- Cart updates
- Comment posting

**Gotchas:**
- State resets on prop change
- Handle failures gracefully
- Don't use for critical ops
- Reducer must be pure

### 5. useFormStatus and useActionState

New hooks for managing form state with Server Actions.

**Core Concepts:**
- useFormStatus: Access form pending/data
- useActionState: Manage action state
- Works with Server Actions
- Progressive enhancement
- Type-safe errors

**Best Practices:**
- Use useFormStatus in submit button
- Use useActionState for form-level state
- Return structured errors
- Show field-level errors
- Disable submit while pending

**Common Patterns:**
- Submit buttons with loading
- Form validation errors
- Multi-step forms
- File upload progress
- Success messages

**Gotchas:**
- useFormStatus in child of form
- useActionState replaces useFormState
- Action must be Server Action
- State persists across submissions

## 💡 Real-World Examples

### Example 1: Blog with Optimistic Interactions

Complete blog demonstrating Server Components, Server Actions, and optimistic updates.

### Example 2: E-commerce Cart with use() Hook

Advanced shopping cart with async data fetching using the use hook.

## 🔗 Related Skills

- nextjs-14-expert - Next.js 14+ App Router patterns
- typescript-senior - Advanced TypeScript for type-safe actions
- tanstack-query-expert - Client-side data fetching alternative
- prisma-drizzle-orm - Database access in Server Components
- react-hook-form-zod - Form validation alternatives

## 📖 Further Reading

- React 19 Official Docs: https://react.dev/blog/2024/12/05/react-19
- Server Components RFC: https://github.com/reactjs/rfcs
- Server Actions Deep Dive: https://nextjs.org/docs
- use() Hook Announcement: https://react.dev/reference/react/use
- React 19 Migration Guide: https://react.dev/blog

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
