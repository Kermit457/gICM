# TypeScript Senior

> **ID:** `typescript-senior`
> **Tier:** 1
> **Token Cost:** 8000
> **MCP Connections:** None

## 🎯 What This Skill Does

- Design complex type systems with advanced generic patterns
- Implement type-safe APIs with branded types and discriminated unions
- Master conditional types, mapped types, and template literals
- Configure TypeScript for optimal strictness and performance
- Debug complex type errors with systematic approaches
- Build reusable type utilities for domain-specific problems

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** typescript, types, generics, interface, type error, infer, conditional type, mapped type
- **File Types:** .ts, .tsx, tsconfig.json
- **Directories:** N/A

## 🚀 Core Capabilities

### 1. Design Complex Type Systems

Building maintainable type hierarchies that enforce business logic at compile time.

**Best Practices:**
- Use branded types to prevent primitive obsession
- Leverage discriminated unions for state machines
- Apply the principle of least privilege with `readonly` and `const`
- Prefer type composition over inheritance
- Use intersection types for mixins and feature flags

**Common Patterns:**

```typescript
// Branded Types - Prevent mixing incompatible primitives
type Brand<K, T> = K & { __brand: T };
type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;
type Lamports = Brand<number, 'Lamports'>;
type SOL = Brand<number, 'SOL'>;

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUser(id: UserId): User {
  // Compile error if you pass PostId
  return db.users.find(id);
}

// Convert between units safely
function lamportsToSol(lamports: Lamports): SOL {
  return (lamports / 1_000_000_000) as SOL;
}

// Discriminated Unions - Type-safe state machines
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

function handleState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'idle':
      return <div>Not started</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>{state.data}</div>; // TS knows data exists
    case 'error':
      return <div>Error: {state.error.message}</div>; // TS knows error exists
  }
}

// Builder Pattern with Fluent Types
type HasName = { name: string };
type HasEmail = { email: string };
type HasAge = { age: number };

class UserBuilder<T = {}> {
  private data: Partial<HasName & HasEmail & HasAge> = {};

  withName(name: string): UserBuilder<T & HasName> {
    this.data.name = name;
    return this as any;
  }

  withEmail(email: string): UserBuilder<T & HasEmail> {
    this.data.email = email;
    return this as any;
  }

  withAge(age: number): UserBuilder<T & HasAge> {
    this.data.age = age;
    return this as any;
  }

  // Only callable when T has name and email
  build(this: UserBuilder<HasName & HasEmail>): User {
    return this.data as User;
  }
}

// Usage:
const user = new UserBuilder()
  .withName('Alice')
  .withEmail('alice@example.com')
  .build(); // OK

const invalid = new UserBuilder()
  .withName('Bob')
  .build(); // Error: email required
```

**Gotchas:**
- Branded types are erased at runtime - add runtime validation
- Discriminated unions require a literal type discriminant
- Builder pattern type tracking can cause TS performance issues with deep chains

### 2. Implement Generics and Utility Types

Creating reusable, type-safe abstractions that adapt to different data shapes.

**Best Practices:**
- Constrain generics with `extends` for better intellisense
- Use default type parameters for common cases
- Leverage built-in utility types before creating custom ones
- Name type parameters descriptively (not just `T`)

**Common Patterns:**

```typescript
// Constrained Generics
interface Repository<Entity extends { id: string }> {
  findById(id: string): Promise<Entity | null>;
  save(entity: Entity): Promise<Entity>;
  delete(id: string): Promise<void>;
}

// Works for any entity with an id
class UserRepository implements Repository<User> {
  async findById(id: string): Promise<User | null> {
    return db.users.findUnique({ where: { id } });
  }
  // ...
}

// Multiple Type Parameters with Constraints
type ApiResponse<Data, Error = { message: string }> =
  | { success: true; data: Data }
  | { success: false; error: Error };

async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: { message: String(error) } };
  }
}

// Advanced: Recursive Types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Utility: Extract function argument types
type ArgumentTypes<F extends Function> =
  F extends (...args: infer A) => any ? A : never;

type ReturnTypeAsync<F extends (...args: any) => Promise<any>> =
  F extends (...args: any) => Promise<infer R> ? R : never;

// Example usage
async function createUser(name: string, email: string): Promise<User> {
  // ...
}

type CreateUserArgs = ArgumentTypes<typeof createUser>; // [string, string]
type CreatedUser = ReturnTypeAsync<typeof createUser>; // User

// Custom Utility: Require at least one property
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

type UpdateUserInput = RequireAtLeastOne<{
  name?: string;
  email?: string;
  age?: number;
}, 'name' | 'email'>;

// Must have at least name OR email
const update1: UpdateUserInput = { name: 'Alice' }; // OK
const update2: UpdateUserInput = { email: 'alice@example.com' }; // OK
const update3: UpdateUserInput = { age: 30 }; // Error
```

**Gotchas:**
- Recursive types have a depth limit (~50 levels)
- Mapped types over unions distribute differently than expected
- `infer` only works in conditional type extends clauses

### 3. Configure tsconfig for Different Targets

Optimizing TypeScript for Node.js, browser, libraries, and monorepos.

**Best Practices:**
- Start with `"strict": true` and disable specific checks only when necessary
- Use project references for monorepos
- Separate `tsconfig.json` for source and tests
- Enable `skipLibCheck` for faster builds
- Use path mapping for clean imports

**Common Patterns:**

```json
// tsconfig.json - Strict Node.js backend
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",

    // Strict mode (all checks enabled)
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,

    // Output
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // Import helpers
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,

    // Path mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@utils/*": ["src/utils/*"]
    },

    // Performance
    "skipLibCheck": true,
    "incremental": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}

// tsconfig.build.json - Library build config
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "esnext",
    "target": "ES2020",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",

    // No emit on error for CI
    "noEmitOnError": true,

    // Remove comments in production
    "removeComments": true
  },
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "scripts"]
}

// tsconfig.test.json - Test configuration
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "node"],
    "noEmit": true
  },
  "include": ["src/**/*.test.ts", "src/**/*.spec.ts"]
}

// Monorepo: packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true, // Enable project references
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../shared" } // Depend on other packages
  ]
}

// Root tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

**Gotchas:**
- `"moduleResolution": "node"` vs `"bundler"` affects import resolution
- Path mappings don't emit to compiled JS - use `tsc-alias` or a bundler
- `composite: true` requires explicit `references` and affects incremental builds

### 4. Build Type-Safe APIs

Ensuring end-to-end type safety from client to server.

**Best Practices:**
- Use Zod for runtime validation with type inference
- Generate types from OpenAPI/GraphQL schemas
- Leverage tRPC for full-stack type safety
- Validate environment variables at startup

**Common Patterns:**

```typescript
// Zod + Type Inference
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.date(),
});

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;

// Parse and validate
function createUser(input: unknown): User {
  return UserSchema.parse(input); // Throws on invalid input
}

// Safe parsing
function tryCreateUser(input: unknown): User | null {
  const result = UserSchema.safeParse(input);
  return result.success ? result.data : null;
}

// API Handler with validation
import { Request, Response } from 'express';

const CreateUserInputSchema = UserSchema.omit({
  id: true,
  createdAt: true
});

async function handleCreateUser(req: Request, res: Response) {
  const input = CreateUserInputSchema.safeParse(req.body);

  if (!input.success) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: input.error.issues
    });
  }

  const user = await db.users.create({
    data: {
      ...input.data,
      id: randomUUID(),
      createdAt: new Date(),
    },
  });

  return res.json(user);
}

// tRPC - Full-stack type safety
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  createUser: t.procedure
    .input(CreateUserInputSchema)
    .mutation(async ({ input }) => {
      return db.users.create({
        data: {
          ...input,
          id: randomUUID(),
          createdAt: new Date(),
        },
      });
    }),

  getUser: t.procedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.users.findUnique({ where: { id: input.id } });
    }),
});

export type AppRouter = typeof appRouter;

// Client-side (fully typed!)
import { createTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from './server';

const client = createTRPCProxyClient<AppRouter>({
  // ...
});

// Full autocomplete and type checking
const user = await client.createUser.mutate({
  email: 'alice@example.com',
  name: 'Alice',
  role: 'user',
});

// Environment Variables
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  JWT_SECRET: z.string().min(32),
});

export const env = EnvSchema.parse(process.env);

// Now env is fully typed and validated
const port = env.PORT; // number
```

**Gotchas:**
- Zod schemas add runtime overhead - cache parsed results
- tRPC serializes Date objects as strings - use transformers
- Environment validation should happen before app initialization

### 5. Handle Conditional Types and Mapped Types

Advanced type manipulation for library authors and framework builders.

**Best Practices:**
- Use conditional types to branch type logic
- Combine mapped types with template literals for DX magic
- Leverage `infer` for extracting nested types
- Test complex types with `Expect<Equal<A, B>>` utilities

**Common Patterns:**

```typescript
// Conditional Types
type IsString<T> = T extends string ? true : false;
type A = IsString<'hello'>; // true
type B = IsString<42>; // false

// Exclude nullish values
type NonNullable<T> = T extends null | undefined ? never : T;

// Extract function types
type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

interface Person {
  name: string;
  age: number;
  greet(): void;
  walk(): void;
}

type PersonMethods = FunctionPropertyNames<Person>; // 'greet' | 'walk'

// Mapped Types with Template Literals
type Getters<T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K];
};

type Setters<T> = {
  [K in keyof T & string as `set${Capitalize<K>}`]: (value: T[K]) => void;
};

type User = {
  name: string;
  age: number;
};

type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number; }

type UserSetters = Setters<User>;
// { setName: (value: string) => void; setAge: (value: number) => void; }

// Event Handler Pattern
type EventMap = {
  click: { x: number; y: number };
  keypress: { key: string };
  focus: { target: string };
};

type EventHandlers = {
  [K in keyof EventMap as `on${Capitalize<string & K>}`]: (
    event: EventMap[K]
  ) => void;
};

// Results in:
// {
//   onClick: (event: { x: number; y: number }) => void;
//   onKeypress: (event: { key: string }) => void;
//   onFocus: (event: { target: string }) => void;
// }

// Advanced: Path to nested property
type PathToProperty<T, Path extends string> =
  Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? PathToProperty<T[Key], Rest>
      : never
    : Path extends keyof T
      ? T[Path]
      : never;

type Config = {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
};

type Host = PathToProperty<Config, 'database.host'>; // string
type Username = PathToProperty<Config, 'database.credentials.username'>; // string

// Type-safe get function
function get<T, Path extends string>(
  obj: T,
  path: Path
): PathToProperty<T, Path> {
  return path.split('.').reduce((acc: any, key) => acc?.[key], obj);
}

const config: Config = {
  database: {
    host: 'localhost',
    port: 5432,
    credentials: { username: 'admin', password: 'secret' },
  },
};

const host = get(config, 'database.host'); // Typed as string
```

**Gotchas:**
- Template literal types only work with string keys
- Distributive conditional types distribute over unions
- Mapped types with `as` clause require `& string` for template literals

### 6. Debug Complex Type Errors

Systematic approaches to understanding and fixing TypeScript errors.

**Best Practices:**
- Break complex types into smaller, testable pieces
- Use type assertions to isolate error locations
- Leverage `@ts-expect-error` to document known issues
- Create type tests with `Expect` utilities

**Common Patterns:**

```typescript
// Type Testing Utilities
type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
    ? true
    : false;

// Write tests for your types
type Tests = [
  Expect<Equal<DeepPartial<{ a: string }>, { a?: string }>>,
  Expect<Equal<NonNullable<string | null>, string>>,
];

// Debug: Reveal type at a specific point
type Debug<T> = { [K in keyof T]: T[K] };

type MyComplexType = Debug<DeepPartial<User>>;
// Hover over MyComplexType to see expanded form

// Annotate intermediate steps
type Step1<T> = { /* ... */ };
type Step2<T> = Step1<T> & { /* ... */ };
type Step3<T> = Step2<T> | { /* ... */ };

// Document with comments
type MyType<T> =
  T extends string
    ? `prefix-${T}` // Case 1: String gets prefixed
    : T extends number
      ? `num-${T}` // Case 2: Number gets stringified
      : never; // Case 3: Reject other types

// Narrow down errors
function problematicFunction<T>(arg: T) {
  // Type error somewhere in here

  // Add assertions to isolate
  const step1 = processStep1(arg);
  type Check1 = Expect<Equal<typeof step1, ExpectedType>>;

  const step2 = processStep2(step1);
  type Check2 = Expect<Equal<typeof step2, ExpectedType2>>;

  return step2;
}

// Use `satisfies` for validation without widening
const config = {
  endpoint: '/api/users',
  method: 'GET',
  timeout: 5000,
} satisfies ApiConfig;

// config.method is still 'GET', not string

// Disable specific errors when necessary
// @ts-expect-error - We know this is a valid JSON-RPC call
const result = await client.request('unknown_method', params);

// Better: Document why
// @ts-expect-error: Legacy API doesn't have type definitions
const legacyResult = await oldApi.call();
```

**Gotchas:**
- Hovering shows simplified types - use Debug<T> for full expansion
- Type errors cascade - fix the first error first
- `any` breaks type checking silently - use `unknown` instead

## 💡 Real-World Examples

### Example 1: Type-Safe Event Emitter

```typescript
import { EventEmitter } from 'events';

type EventMap = {
  'user:created': { id: string; name: string };
  'user:updated': { id: string; changes: Partial<User> };
  'user:deleted': { id: string };
};

class TypedEventEmitter<T extends Record<string, any>> {
  private emitter = new EventEmitter();

  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): this {
    this.emitter.on(event as string, handler);
    return this;
  }

  emit<K extends keyof T>(event: K, data: T[K]): boolean {
    return this.emitter.emit(event as string, data);
  }

  off<K extends keyof T>(event: K, handler: (data: T[K]) => void): this {
    this.emitter.off(event as string, handler);
    return this;
  }
}

const events = new TypedEventEmitter<EventMap>();

// Fully typed!
events.on('user:created', (data) => {
  console.log(data.id, data.name); // TS knows the shape
});

events.emit('user:created', {
  id: '123',
  name: 'Alice'
}); // Type-checked

events.emit('user:created', {
  id: '123'
}); // Error: missing 'name'
```

### Example 2: Type-Safe Database Query Builder

```typescript
type Table = {
  users: {
    id: string;
    name: string;
    email: string;
    age: number;
  };
  posts: {
    id: string;
    title: string;
    content: string;
    authorId: string;
  };
};

class QueryBuilder<T extends Table, TableName extends keyof T> {
  constructor(private table: TableName) {}

  select<K extends keyof T[TableName]>(
    ...columns: K[]
  ): QueryResult<Pick<T[TableName], K>> {
    // Implementation
    return null as any;
  }

  where<K extends keyof T[TableName]>(
    column: K,
    value: T[TableName][K]
  ): QueryBuilder<T, TableName> {
    // Implementation
    return this;
  }
}

class QueryResult<Row> {
  async execute(): Promise<Row[]> {
    // Implementation
    return [];
  }
}

function table<T extends Table, K extends keyof T>(
  name: K
): QueryBuilder<T, K> {
  return new QueryBuilder(name);
}

// Usage (fully typed)
const users = await table<Table, 'users'>('users')
  .select('id', 'name', 'email') // Autocomplete!
  .where('age', 25) // Type-checked value
  .execute();

// users: Array<{ id: string; name: string; email: string }>
users[0].id; // OK
users[0].age; // Error: age not selected
```

## 🔗 Related Skills

- **solana-anchor-expert** - Rust-inspired type patterns in TS clients
- **nextjs-14-expert** - TypeScript in React Server Components
- **rust-systems** - Similar type system concepts
- **nodejs-backend-patterns** - Type-safe API development

## 📖 Further Reading

- [TypeScript Handbook - Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [Type Challenges](https://github.com/type-challenges/type-challenges) - Practice advanced patterns
- [Matt Pocock's TypeScript Tips](https://www.totaltypescript.com/)
- [ts-reset](https://github.com/total-typescript/ts-reset) - Better defaults for TS
- [Zod Documentation](https://zod.dev/) - Schema validation with type inference

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
