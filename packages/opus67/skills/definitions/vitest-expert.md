# Vitest Testing Expert

> **ID:** `vitest-expert`
> **Tier:** 2
> **Token Cost:** 5000
> **MCP Connections:** None

## 🎯 What This Skill Does

Vitest is a blazing-fast test framework powered by Vite. It provides Jest-compatible APIs with native ESM support, TypeScript without configuration, and instant watch mode with HMR-like updates.

**Core Value:**
- 10-100x faster than Jest (Vite-powered)
- Zero config TypeScript support
- Jest-compatible API (easy migration)
- In-source testing for co-located tests
- Native ESM, CJS, and TypeScript support

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** vitest, test, unit test, coverage, mock, vi.mock
- **File Types:** .test.ts, .spec.ts, .test.tsx, .spec.tsx
- **Directories:** __tests__, tests/, test/

**Use Vitest when:**
- Building Vite-based projects (instant integration)
- Need fast test execution and watch mode
- Want Jest compatibility without Jest overhead
- Testing TypeScript without extra config
- Need modern ESM/CJS interop

## 🚀 Core Capabilities

### 1. Jest-Compatible API

Vitest provides near-perfect Jest compatibility for easy migration.

**Best Practices:**
- Use `describe` for test suites, `test`/`it` for individual tests
- Leverage `beforeEach`/`afterEach` for setup/teardown
- Use `vi.mock()` for mocking (same as `jest.mock()`)
- Prefer `expect.extend()` for custom matchers

**Common Patterns:**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Basic test structure
describe('UserService', () => {
  let userService: UserService
  let mockDb: MockDatabase

  beforeEach(() => {
    mockDb = createMockDatabase()
    userService = new UserService(mockDb)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create a new user', async () => {
    const user = { email: 'test@example.com', name: 'Test User' }
    const result = await userService.create(user)

    expect(result).toMatchObject(user)
    expect(result.id).toBeDefined()
    expect(mockDb.insert).toHaveBeenCalledWith('users', user)
  })

  it('should throw error for duplicate email', async () => {
    mockDb.findOne.mockResolvedValue({ id: '123', email: 'test@example.com' })

    await expect(
      userService.create({ email: 'test@example.com', name: 'Test' })
    ).rejects.toThrow('Email already exists')
  })
})

// Snapshot testing
describe('Component rendering', () => {
  it('should render correctly', () => {
    const { container } = render(<UserCard user={mockUser} />)
    expect(container).toMatchSnapshot()
  })

  it('should match inline snapshot', () => {
    expect({ id: '123', name: 'Test' }).toMatchInlineSnapshot(`
      {
        "id": "123",
        "name": "Test",
      }
    `)
  })
})

// Async testing
describe('API calls', () => {
  it('should fetch user data', async () => {
    const data = await fetchUser('123')
    expect(data).toBeDefined()
  })

  it('should handle errors', async () => {
    await expect(fetchUser('invalid')).rejects.toThrow('Not found')
  })

  it('should resolve promise', () => {
    return expect(Promise.resolve('value')).resolves.toBe('value')
  })
})

// Parameterized tests
describe.each([
  { input: 1, expected: 2 },
  { input: 2, expected: 4 },
  { input: 3, expected: 6 },
])('doubleNumber($input)', ({ input, expected }) => {
  it(`returns ${expected}`, () => {
    expect(doubleNumber(input)).toBe(expected)
  })
})

// Concurrent tests (run in parallel)
describe.concurrent('Parallel tests', () => {
  it('test 1', async () => {
    await someAsyncOperation()
    expect(true).toBe(true)
  })

  it('test 2', async () => {
    await anotherAsyncOperation()
    expect(true).toBe(true)
  })
})
```

**Advanced Matchers:**

```typescript
// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    }
  },
})

// Usage
expect(50).toBeWithinRange(40, 60)

// Asymmetric matchers
expect(response).toEqual({
  id: expect.any(String),
  createdAt: expect.any(Date),
  user: expect.objectContaining({
    name: 'Test User'
  }),
  tags: expect.arrayContaining(['important'])
})

// Negation
expect(value).not.toBe(null)
expect(array).not.toContain('unwanted')

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()
```

**Gotchas:**
- `vi.mock()` must be at top level (like Jest)
- Use `vi.hoisted()` for variables used in mocks
- Async tests need `await` or `return` promise
- `vi.useFakeTimers()` affects all timers globally

### 2. In-Source Testing

Vitest allows tests to live alongside source code.

**Best Practices:**
- Use `if (import.meta.vitest)` guards
- Keep in-source tests small and focused
- Use for unit tests, not integration tests
- Exclude from production builds automatically

**Common Patterns:**

```typescript
// src/utils/math.ts
export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}

// In-source test (same file)
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest

  it('add', () => {
    expect(add(1, 2)).toBe(3)
    expect(add(-1, 1)).toBe(0)
  })

  it('multiply', () => {
    expect(multiply(2, 3)).toBe(6)
    expect(multiply(0, 100)).toBe(0)
  })
}
```

**Configuration:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    includeSource: ['src/**/*.{js,ts}'], // Enable in-source testing
    coverage: {
      exclude: ['**/*.test.ts', '**/*.spec.ts']
    }
  },
  define: {
    'import.meta.vitest': 'undefined', // Remove in production
  },
})
```

**Real-World Example:**

```typescript
// src/services/validator.ts
export class Validator {
  static isEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  static isStrongPassword(password: string): boolean {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password)
  }
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest

  describe('Validator', () => {
    describe('isEmail', () => {
      it('validates correct emails', () => {
        expect(Validator.isEmail('test@example.com')).toBe(true)
        expect(Validator.isEmail('user+tag@domain.co.uk')).toBe(true)
      })

      it('rejects invalid emails', () => {
        expect(Validator.isEmail('notanemail')).toBe(false)
        expect(Validator.isEmail('@example.com')).toBe(false)
        expect(Validator.isEmail('user@')).toBe(false)
      })
    })

    describe('isStrongPassword', () => {
      it('validates strong passwords', () => {
        expect(Validator.isStrongPassword('Passw0rd')).toBe(true)
        expect(Validator.isStrongPassword('MyP@ssw0rd123')).toBe(true)
      })

      it('rejects weak passwords', () => {
        expect(Validator.isStrongPassword('short')).toBe(false)
        expect(Validator.isStrongPassword('nouppercase1')).toBe(false)
        expect(Validator.isStrongPassword('NOLOWERCASE1')).toBe(false)
        expect(Validator.isStrongPassword('NoNumbers')).toBe(false)
      })
    })
  })
}
```

**Gotchas:**
- In-source tests increase bundle size if not properly excluded
- Don't put integration tests in-source (keep those separate)
- TypeScript may need `"types": ["vitest/importMeta"]` in tsconfig
- In-source tests run in watch mode by default

### 3. Coverage Reports

Vitest provides built-in coverage via c8 or istanbul.

**Best Practices:**
- Set minimum coverage thresholds
- Exclude generated code and types
- Use HTML reports for visual inspection
- Track coverage over time in CI

**Common Patterns:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      // Per-file thresholds
      perFile: true,
      // Include/exclude specific patterns
      include: ['src/**/*.{ts,tsx}'],
      all: true, // Include all files, even untested ones
    },
  },
})
```

**Running Coverage:**

```bash
# Generate coverage report
vitest run --coverage

# Watch mode with coverage
vitest watch --coverage

# Coverage for specific files
vitest run --coverage src/services

# Update snapshots and generate coverage
vitest run -u --coverage
```

**CI Integration:**

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:coverage

      # Upload coverage to Codecov
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      # Or upload to Coveralls
      - uses: coverallsapp/github-action@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          path-to-lcov: ./coverage/lcov.info
```

**Custom Coverage Reporter:**

```typescript
// custom-reporter.ts
import { Reporter } from 'vitest/reporters'

export default class CustomReporter implements Reporter {
  onInit() {
    console.log('Tests starting...')
  }

  onFinished(files, errors) {
    if (errors.length === 0) {
      console.log('All tests passed!')
    } else {
      console.log(`${errors.length} test(s) failed`)
    }
  }

  onCoverageReport(coverage) {
    const { lines, statements, branches, functions } = coverage
    console.log(`Coverage: ${lines.pct}% lines, ${branches.pct}% branches`)
  }
}
```

**Gotchas:**
- V8 coverage is faster but less accurate than Istanbul
- Coverage thresholds fail CI if not met
- Exclude test files from coverage (they're always 100%)
- `--coverage` slows down tests significantly

### 4. TypeScript Without Config

Vitest works with TypeScript out of the box.

**Best Practices:**
- Use `.ts` extensions for tests
- Leverage type inference in tests
- Mock with proper types
- Use `satisfies` operator for type-safe mocks

**Common Patterns:**

```typescript
// No special config needed - just write TypeScript!

import { describe, it, expect, vi } from 'vitest'
import type { User, Database } from './types'

// Type-safe mocks
const createMockUser = (overrides?: Partial<User>): User => ({
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date(),
  ...overrides,
})

// Type-safe service mocking
const mockDatabase: Database = {
  findOne: vi.fn(),
  findMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

// Generic test utilities
function expectType<T>(value: unknown): asserts value is T {
  // Runtime type checking here
}

describe('UserService', () => {
  it('returns typed user', async () => {
    const user = await service.getUser('123')

    // TypeScript knows the shape of user
    expectType<User>(user)
    expect(user.email).toBe('test@example.com')
  })

  it('handles generic types', async () => {
    interface ApiResponse<T> {
      data: T
      status: number
    }

    const response: ApiResponse<User[]> = await api.getUsers()

    expect(response.data).toHaveLength(5)
    expect(response.status).toBe(200)
  })
})

// Type-safe mock with satisfies
const mockConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
} satisfies Config

// Branded types testing
type UserId = string & { readonly __brand: 'UserId' }
type Email = string & { readonly __brand: 'Email' }

function createUserId(id: string): UserId {
  return id as UserId
}

describe('Branded types', () => {
  it('works with branded types', () => {
    const userId = createUserId('123')
    const user = service.getUser(userId)

    expect(user.id).toBe(userId)
  })
})
```

**Advanced Type Testing:**

```typescript
import { describe, it, expectTypeOf } from 'vitest'

// Type-level testing
describe('Type checking', () => {
  it('checks function signatures', () => {
    expectTypeOf(myFunction).parameter(0).toBeString()
    expectTypeOf(myFunction).returns.toBeNumber()
  })

  it('checks object shapes', () => {
    expectTypeOf<User>().toHaveProperty('email')
    expectTypeOf<User>().not.toHaveProperty('password')
  })

  it('checks generic constraints', () => {
    function process<T extends { id: string }>(item: T): T {
      return item
    }

    expectTypeOf(process).parameter(0).toMatchTypeOf<{ id: string }>()
  })

  it('checks conditional types', () => {
    type IsString<T> = T extends string ? true : false

    expectTypeOf<IsString<'hello'>>().toEqualTypeOf<true>()
    expectTypeOf<IsString<number>>().toEqualTypeOf<false>()
  })
})
```

**Mock Factory with Types:**

```typescript
// test/factories.ts
import { vi } from 'vitest'
import type { User, Post, Comment } from '@/types'

export const factories = {
  user: (overrides?: Partial<User>): User => ({
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    ...overrides,
  }),

  post: (overrides?: Partial<Post>): Post => ({
    id: crypto.randomUUID(),
    title: 'Test Post',
    content: 'This is test content',
    authorId: crypto.randomUUID(),
    published: false,
    createdAt: new Date(),
    ...overrides,
  }),

  comment: (overrides?: Partial<Comment>): Comment => ({
    id: crypto.randomUUID(),
    content: 'Test comment',
    postId: crypto.randomUUID(),
    authorId: crypto.randomUUID(),
    createdAt: new Date(),
    ...overrides,
  }),
}

// Usage in tests
const user = factories.user({ role: 'admin' })
const post = factories.post({ authorId: user.id, published: true })
```

**Gotchas:**
- TypeScript type checking doesn't run during tests (use `tsc --noEmit`)
- Generic mock types can be tricky - use `vi.fn<Args, Return>()`
- `expectTypeOf` only checks types at compile time
- Branded types may need explicit casting in mocks

## 💡 Real-World Examples

### Example 1: React Component Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserProfile } from './UserProfile'

describe('UserProfile', () => {
  const mockUser = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
  }

  it('renders user information', () => {
    render(<UserProfile user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByAltText('John Doe')).toHaveAttribute('src', mockUser.avatar)
  })

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn()
    render(<UserProfile user={mockUser} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    await waitFor(() => {
      expect(onEdit).toHaveBeenCalledWith(mockUser.id)
    })
  })

  it('shows loading state', () => {
    render(<UserProfile user={mockUser} isLoading />)

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('handles missing avatar', () => {
    const userWithoutAvatar = { ...mockUser, avatar: undefined }
    render(<UserProfile user={userWithoutAvatar} />)

    expect(screen.getByTestId('default-avatar')).toBeInTheDocument()
  })
})
```

### Example 2: API Client Testing

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ApiClient } from './api-client'

describe('ApiClient', () => {
  let client: ApiClient
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
    client = new ApiClient('https://api.example.com')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('makes GET request with correct headers', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    })

    await client.get('/users')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('retries on network failure', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      })

    const result = await client.get('/users', { retries: 3 })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ data: 'test' })
  })

  it('throws on HTTP error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(client.get('/users/999')).rejects.toThrow('Not Found')
  })

  it('includes auth token when provided', async () => {
    client.setAuthToken('secret-token')
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    })

    await client.get('/protected')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token',
        }),
      })
    )
  })
})
```

### Example 3: State Management Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from './store'
import type { Store, User } from './types'

describe('UserStore', () => {
  let store: Store

  beforeEach(() => {
    store = createStore()
  })

  it('initializes with empty state', () => {
    expect(store.getState().users).toEqual([])
    expect(store.getState().loading).toBe(false)
    expect(store.getState().error).toBeNull()
  })

  it('adds user to state', () => {
    const user: User = { id: '1', name: 'John', email: 'john@example.com' }

    store.addUser(user)

    expect(store.getState().users).toHaveLength(1)
    expect(store.getState().users[0]).toEqual(user)
  })

  it('removes user from state', () => {
    const user1: User = { id: '1', name: 'John', email: 'john@example.com' }
    const user2: User = { id: '2', name: 'Jane', email: 'jane@example.com' }

    store.addUser(user1)
    store.addUser(user2)
    store.removeUser('1')

    expect(store.getState().users).toHaveLength(1)
    expect(store.getState().users[0].id).toBe('2')
  })

  it('updates user in state', () => {
    const user: User = { id: '1', name: 'John', email: 'john@example.com' }
    store.addUser(user)

    store.updateUser('1', { name: 'John Doe' })

    expect(store.getState().users[0].name).toBe('John Doe')
    expect(store.getState().users[0].email).toBe('john@example.com')
  })

  it('sets loading state', () => {
    store.setLoading(true)
    expect(store.getState().loading).toBe(true)

    store.setLoading(false)
    expect(store.getState().loading).toBe(false)
  })

  it('sets error state', () => {
    const error = new Error('Failed to fetch')
    store.setError(error)

    expect(store.getState().error).toBe(error)
  })

  it('subscribes to state changes', () => {
    const subscriber = vi.fn()
    const unsubscribe = store.subscribe(subscriber)

    store.addUser({ id: '1', name: 'John', email: 'john@example.com' })

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(subscriber).toHaveBeenCalledWith(store.getState())

    unsubscribe()
    store.addUser({ id: '2', name: 'Jane', email: 'jane@example.com' })

    expect(subscriber).toHaveBeenCalledTimes(1) // Not called again
  })
})
```

### Example 4: Async Utilities Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { retry, timeout, debounce, throttle } from './async-utils'

describe('Async Utilities', () => {
  describe('retry', () => {
    it('retries failed operations', async () => {
      let attempts = 0
      const operation = vi.fn(async () => {
        attempts++
        if (attempts < 3) throw new Error('Failed')
        return 'success'
      })

      const result = await retry(operation, { maxAttempts: 3, delay: 10 })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('throws after max attempts', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Always fails')
      })

      await expect(
        retry(operation, { maxAttempts: 3, delay: 10 })
      ).rejects.toThrow('Always fails')

      expect(operation).toHaveBeenCalledTimes(3)
    })
  })

  describe('timeout', () => {
    it('resolves if operation completes in time', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return 'done'
      }

      const result = await timeout(operation(), 100)
      expect(result).toBe('done')
    })

    it('rejects if operation takes too long', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return 'done'
      }

      await expect(timeout(operation(), 100)).rejects.toThrow('Timeout')
    })
  })

  describe('debounce', () => {
    it('debounces rapid calls', async () => {
      vi.useFakeTimers()

      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('throttle', () => {
    it('throttles rapid calls', async () => {
      vi.useFakeTimers()

      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled() // Called immediately
      throttled() // Ignored
      throttled() // Ignored

      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      throttled() // Called again

      expect(fn).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })
})
```

### Example 5: Database Integration Testing

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createTestDatabase, clearDatabase } from './test-helpers'
import { UserRepository } from './user-repository'
import type { Database } from './types'

describe('UserRepository Integration', () => {
  let db: Database
  let repo: UserRepository

  beforeAll(async () => {
    db = await createTestDatabase()
    repo = new UserRepository(db)
  })

  afterAll(async () => {
    await db.close()
  })

  beforeEach(async () => {
    await clearDatabase(db)
  })

  it('creates and retrieves user', async () => {
    const user = await repo.create({
      email: 'test@example.com',
      name: 'Test User',
    })

    expect(user.id).toBeDefined()

    const retrieved = await repo.findById(user.id)
    expect(retrieved).toEqual(user)
  })

  it('updates user', async () => {
    const user = await repo.create({
      email: 'test@example.com',
      name: 'Test User',
    })

    const updated = await repo.update(user.id, { name: 'Updated Name' })

    expect(updated.name).toBe('Updated Name')
    expect(updated.email).toBe('test@example.com')
  })

  it('deletes user', async () => {
    const user = await repo.create({
      email: 'test@example.com',
      name: 'Test User',
    })

    await repo.delete(user.id)

    const retrieved = await repo.findById(user.id)
    expect(retrieved).toBeNull()
  })

  it('finds users by email', async () => {
    await repo.create({ email: 'test1@example.com', name: 'User 1' })
    await repo.create({ email: 'test2@example.com', name: 'User 2' })

    const found = await repo.findByEmail('test1@example.com')

    expect(found).toBeDefined()
    expect(found?.name).toBe('User 1')
  })

  it('handles duplicate email error', async () => {
    await repo.create({ email: 'test@example.com', name: 'User 1' })

    await expect(
      repo.create({ email: 'test@example.com', name: 'User 2' })
    ).rejects.toThrow('Email already exists')
  })

  it('lists users with pagination', async () => {
    // Create 25 users
    for (let i = 0; i < 25; i++) {
      await repo.create({ email: `test${i}@example.com`, name: `User ${i}` })
    }

    const page1 = await repo.list({ page: 1, pageSize: 10 })
    expect(page1.data).toHaveLength(10)
    expect(page1.total).toBe(25)
    expect(page1.page).toBe(1)

    const page2 = await repo.list({ page: 2, pageSize: 10 })
    expect(page2.data).toHaveLength(10)
    expect(page2.page).toBe(2)

    const page3 = await repo.list({ page: 3, pageSize: 10 })
    expect(page3.data).toHaveLength(5)
    expect(page3.page).toBe(3)
  })
})
```

## 🔗 Related Skills

- **playwright-pro** - E2E testing with Playwright
- **typescript-advanced-types** - Advanced TypeScript for testing
- **react-testing-patterns** - React-specific testing patterns
- **nodejs-backend-patterns** - Testing Node.js backends

## 📖 Further Reading

- [Vitest Official Docs](https://vitest.dev/)
- [Vitest GitHub](https://github.com/vitest-dev/vitest)
- [Migrating from Jest to Vitest](https://vitest.dev/guide/migration.html)
- [Testing Library](https://testing-library.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
