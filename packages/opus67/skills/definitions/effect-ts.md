# Effect-TS Expert

> **ID:** `effect-ts`
> **Tier:** 2
> **Token Cost:** 7000
> **MCP Connections:** None

## 🎯 What This Skill Does

Effect-TS is a functional programming library for TypeScript that brings type-safe error handling, dependency injection, and fiber-based concurrency. It eliminates runtime exceptions, makes side effects explicit, and provides powerful composition primitives.

**Core Value:**
- Type-safe error handling (no try-catch hell)
- Explicit dependency injection via Layers
- Fiber-based concurrency (structured parallelism)
- Railway-oriented programming for error flows

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** effect-ts, effect/io, pipe, Effect.gen, Layer, Context
- **File Types:** .ts files with Effect imports
- **Directories:** Projects using `@effect/*` packages

**Use Effect-TS when:**
- Building complex async workflows with error handling
- Need explicit dependency injection without frameworks
- Want type-safe error propagation
- Building retry logic, timeouts, or concurrent operations
- Replacing Promise chains with composable Effects

## 🚀 Core Capabilities

### 1. Type-Safe Error Handling

Effect makes errors part of the type signature, eliminating runtime surprises.

**Best Practices:**
- Always type your errors explicitly (never use `unknown`)
- Use tagged unions for discriminated error types
- Leverage `Effect.all` for parallel error collection
- Use `Effect.either` to convert to `Either<E, A>` when needed

**Common Patterns:**

```typescript
import { Effect, pipe } from "effect"

// Define error types as tagged unions
class NetworkError {
  readonly _tag = "NetworkError"
  constructor(readonly message: string) {}
}

class ValidationError {
  readonly _tag = "ValidationError"
  constructor(readonly field: string, readonly message: string) {}
}

class NotFoundError {
  readonly _tag = "NotFoundError"
  constructor(readonly id: string) {}
}

// Type-safe API call with explicit errors
const fetchUser = (id: string): Effect.Effect<User, NetworkError | NotFoundError> =>
  Effect.tryPromise({
    try: () => fetch(`/api/users/${id}`).then(r => r.json()),
    catch: (error) => new NetworkError(String(error))
  }).pipe(
    Effect.flatMap(data =>
      data ? Effect.succeed(data) : Effect.fail(new NotFoundError(id))
    )
  )

// Validate with explicit errors
const validateUser = (user: unknown): Effect.Effect<User, ValidationError> =>
  Effect.gen(function* () {
    if (!user || typeof user !== 'object') {
      return yield* Effect.fail(new ValidationError('user', 'Invalid user object'))
    }
    if (!('id' in user)) {
      return yield* Effect.fail(new ValidationError('id', 'Missing user id'))
    }
    return user as User
  })

// Compose with full error tracking
const getUserSafely = (id: string): Effect.Effect<
  User,
  NetworkError | NotFoundError | ValidationError
> =>
  pipe(
    fetchUser(id),
    Effect.flatMap(validateUser)
  )

// Handle errors with pattern matching
const program = pipe(
  getUserSafely("123"),
  Effect.catchTags({
    NetworkError: (error) =>
      Effect.succeed({ id: "fallback", name: "Offline User" }),
    NotFoundError: (error) =>
      Effect.fail(new ValidationError('id', `User ${error.id} not found`)),
    ValidationError: (error) =>
      Effect.log(`Validation failed: ${error.field} - ${error.message}`)
        .pipe(Effect.andThen(Effect.succeed({ id: "default", name: "Guest" })))
  })
)
```

**Advanced Error Recovery:**

```typescript
// Retry with exponential backoff
const fetchWithRetry = (url: string) =>
  pipe(
    Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) => new NetworkError(String(error))
    }),
    Effect.retry({
      schedule: Schedule.exponential("100 millis", 2).pipe(
        Schedule.intersect(Schedule.recurs(3))
      )
    })
  )

// Fallback chain
const getUserWithFallbacks = (id: string) =>
  pipe(
    fetchUser(id),
    Effect.orElse(() => fetchUserFromCache(id)),
    Effect.orElse(() => Effect.succeed(defaultUser))
  )

// Collect all errors (don't fail fast)
const validateAllFields = (data: FormData) =>
  Effect.all({
    name: validateName(data.name),
    email: validateEmail(data.email),
    age: validateAge(data.age)
  }, { mode: "validate" }) // Collects all errors
```

**Gotchas:**
- Effect errors must be explicitly handled - unhandled errors are type errors
- `Effect.promise` loses error information - use `tryPromise` instead
- Don't mix Promise and Effect - convert Promises immediately
- Errors in `Effect.gen` must be yielded with `yield* Effect.fail(error)`

### 2. Effect Composition

Effect provides powerful composition operators for building complex workflows.

**Best Practices:**
- Use `pipe` for sequential operations
- Use `Effect.gen` for imperative-style async/await
- Prefer `flatMap` over nested `map` calls
- Use `Effect.all` for parallel operations

**Common Patterns:**

```typescript
// Sequential composition with pipe
const processOrder = (orderId: string) =>
  pipe(
    fetchOrder(orderId),
    Effect.flatMap(validateOrder),
    Effect.flatMap(applyDiscount),
    Effect.flatMap(calculateTax),
    Effect.flatMap(saveOrder),
    Effect.tap(order => Effect.log(`Order ${order.id} processed`))
  )

// Generator-style (async/await-like)
const processOrderGen = (orderId: string) =>
  Effect.gen(function* () {
    const order = yield* fetchOrder(orderId)
    const validated = yield* validateOrder(order)
    const discounted = yield* applyDiscount(validated)
    const withTax = yield* calculateTax(discounted)
    const saved = yield* saveOrder(withTax)
    yield* Effect.log(`Order ${saved.id} processed`)
    return saved
  })

// Parallel execution
const loadDashboard = (userId: string) =>
  Effect.all({
    user: fetchUser(userId),
    orders: fetchOrders(userId),
    stats: fetchStats(userId),
    notifications: fetchNotifications(userId)
  }, { concurrency: "unbounded" })

// Conditional branching
const processPayment = (order: Order) =>
  pipe(
    order.total > 1000
      ? processLargePayment(order)
      : processRegularPayment(order),
    Effect.flatMap(notifyUser)
  )

// Tapping (side effects without changing value)
const pipeline = pipe(
  fetchData(),
  Effect.tap(data => Effect.log(`Received: ${data.length} items`)),
  Effect.map(transform),
  Effect.tap(result => saveToCache(result)),
  Effect.map(format)
)

// Resource management with acquire/release
const withDatabase = <A, E>(
  use: (db: Database) => Effect.Effect<A, E>
): Effect.Effect<A, E | DbError> =>
  Effect.acquireUseRelease(
    openDatabase(), // acquire
    use, // use
    db => closeDatabase(db) // release (always runs)
  )
```

**Advanced Composition:**

```typescript
// Racing effects
const fetchWithTimeout = (url: string, ms: number) =>
  Effect.race(
    fetchData(url),
    pipe(
      Effect.sleep(ms),
      Effect.andThen(Effect.fail(new TimeoutError()))
    )
  )

// Interrupt on first success
const fetchFromMultipleSources = (id: string) =>
  Effect.raceAll([
    fetchFromPrimary(id),
    fetchFromSecondary(id),
    fetchFromCache(id)
  ])

// Fibonacci-style merging
const processStream = (items: string[]) =>
  items.reduce(
    (acc, item) => pipe(acc, Effect.zipWith(processItem(item), combine)),
    Effect.succeed(initialValue)
  )

// Forking and joining (structured concurrency)
const processInBackground = (data: Data) =>
  Effect.gen(function* () {
    const fiber = yield* Effect.fork(longRunningTask(data))
    yield* doOtherWork()
    const result = yield* Fiber.join(fiber)
    return result
  })
```

**Gotchas:**
- `Effect.map` is for pure transformations - use `flatMap` for nested Effects
- `Effect.all` with `concurrency: "unbounded"` can overwhelm resources
- Forgetting to `yield*` in `Effect.gen` returns wrapped Effect
- `tap` doesn't change the value - use `flatMap` if you need to

### 3. Dependency Injection with Layers

Layers provide compile-time-checked dependency injection without runtime reflection.

**Best Practices:**
- Define services with Context.Tag for type safety
- Use Layers to construct service implementations
- Compose Layers with `Layer.merge` and `Layer.provide`
- Keep business logic separate from service construction

**Common Patterns:**

```typescript
import { Context, Layer, Effect } from "effect"

// Define service interfaces
interface Database {
  readonly query: (sql: string) => Effect.Effect<unknown[], DbError>
  readonly execute: (sql: string) => Effect.Effect<void, DbError>
}

interface Logger {
  readonly log: (message: string) => Effect.Effect<void>
  readonly error: (message: string) => Effect.Effect<void>
}

interface UserRepository {
  readonly findById: (id: string) => Effect.Effect<User, NotFoundError>
  readonly save: (user: User) => Effect.Effect<User, DbError>
}

// Create Context Tags
const Database = Context.GenericTag<Database>("Database")
const Logger = Context.GenericTag<Logger>("Logger")
const UserRepository = Context.GenericTag<UserRepository>("UserRepository")

// Implement services
const DatabaseLive = Layer.succeed(
  Database,
  {
    query: (sql) => Effect.tryPromise({
      try: () => db.query(sql),
      catch: (e) => new DbError(String(e))
    }),
    execute: (sql) => Effect.tryPromise({
      try: () => db.execute(sql),
      catch: (e) => new DbError(String(e))
    })
  }
)

const LoggerLive = Layer.succeed(
  Logger,
  {
    log: (message) => Effect.sync(() => console.log(message)),
    error: (message) => Effect.sync(() => console.error(message))
  }
)

// Service that depends on other services
const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const db = yield* Database
    const logger = yield* Logger

    return {
      findById: (id) =>
        pipe(
          db.query(`SELECT * FROM users WHERE id = '${id}'`),
          Effect.flatMap(rows =>
            rows[0]
              ? Effect.succeed(rows[0] as User)
              : Effect.fail(new NotFoundError(id))
          ),
          Effect.tap(user => logger.log(`Found user: ${user.id}`))
        ),

      save: (user) =>
        pipe(
          db.execute(`INSERT INTO users VALUES ...`),
          Effect.map(() => user),
          Effect.tap(() => logger.log(`Saved user: ${user.id}`))
        )
    }
  })
)

// Use services in business logic
const registerUser = (email: string, password: string) =>
  Effect.gen(function* () {
    const logger = yield* Logger
    const userRepo = yield* UserRepository

    yield* logger.log(`Registering user: ${email}`)
    const user = { id: generateId(), email, passwordHash: hash(password) }
    const saved = yield* userRepo.save(user)
    yield* logger.log(`User registered: ${saved.id}`)

    return saved
  })

// Compose and provide dependencies
const AppLive = Layer.mergeAll(
  DatabaseLive,
  LoggerLive
).pipe(Layer.provideMerge(UserRepositoryLive))

// Run with dependencies
const program = registerUser("user@example.com", "password")

// Provide dependencies and run
Effect.runPromise(
  program.pipe(Effect.provide(AppLive))
)
```

**Testing with Mock Layers:**

```typescript
// Mock implementations for testing
const DatabaseTest = Layer.succeed(
  Database,
  {
    query: (sql) => Effect.succeed([mockUser]),
    execute: (sql) => Effect.void
  }
)

const LoggerTest = Layer.succeed(
  Logger,
  {
    log: (message) => Effect.void,
    error: (message) => Effect.void
  }
)

const TestLive = Layer.mergeAll(DatabaseTest, LoggerTest)
  .pipe(Layer.provideMerge(UserRepositoryLive))

// Test with mock dependencies
const testProgram = registerUser("test@example.com", "pass")
await Effect.runPromise(testProgram.pipe(Effect.provide(TestLive)))
```

**Environment-based Configuration:**

```typescript
interface Config {
  readonly databaseUrl: string
  readonly apiKey: string
  readonly logLevel: string
}

const Config = Context.GenericTag<Config>("Config")

const ConfigLive = Layer.effect(
  Config,
  Effect.sync(() => ({
    databaseUrl: process.env.DATABASE_URL!,
    apiKey: process.env.API_KEY!,
    logLevel: process.env.LOG_LEVEL || "info"
  }))
)

const DatabaseLiveWithConfig = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config
    const connection = yield* Effect.tryPromise({
      try: () => connectToDb(config.databaseUrl),
      catch: (e) => new DbError(String(e))
    })

    return {
      query: (sql) => Effect.tryPromise({
        try: () => connection.query(sql),
        catch: (e) => new DbError(String(e))
      }),
      execute: (sql) => Effect.tryPromise({
        try: () => connection.execute(sql),
        catch: (e) => new DbError(String(e))
      })
    }
  })
)

// Layer composition
const AppLiveWithConfig = ConfigLive.pipe(
  Layer.provideMerge(DatabaseLiveWithConfig),
  Layer.provideMerge(LoggerLive),
  Layer.provideMerge(UserRepositoryLive)
)
```

**Gotchas:**
- Circular dependencies cause runtime errors - use `Layer.suspend` to break cycles
- Layer construction happens once - don't expect fresh instances per request
- Context.Tag names must be unique - use fully qualified names
- Missing dependencies cause compile errors (this is good!)

### 4. Fiber-Based Concurrency

Fibers are lightweight threads managed by Effect runtime, enabling structured concurrency.

**Best Practices:**
- Use `Effect.all` for simple parallel operations
- Fork fibers for background work
- Always join or interrupt forked fibers (structured concurrency)
- Use `Effect.raceAll` to cancel losing branches

**Common Patterns:**

```typescript
// Basic parallel execution
const loadPageData = Effect.all({
  user: fetchUser(),
  posts: fetchPosts(),
  comments: fetchComments()
}, { concurrency: "unbounded" })

// Forking for background work
const processWithNotification = (data: Data) =>
  Effect.gen(function* () {
    const fiber = yield* Effect.fork(
      sendNotification(data).pipe(
        Effect.retry({ times: 3 }),
        Effect.catchAll(() => Effect.void)
      )
    )

    const result = yield* processData(data)
    yield* Fiber.join(fiber) // Wait for notification
    return result
  })

// Interruption and cleanup
const cancellableTask = (signal: AbortSignal) =>
  Effect.gen(function* () {
    const fiber = yield* Effect.fork(longRunningTask())

    signal.addEventListener('abort', () => {
      Effect.runSync(Fiber.interrupt(fiber))
    })

    return yield* Fiber.join(fiber)
  })

// Racing with timeout
const fetchWithTimeout = <A, E>(
  effect: Effect.Effect<A, E>,
  ms: number
): Effect.Effect<A, E | TimeoutError> =>
  Effect.race(
    effect,
    Effect.sleep(ms).pipe(
      Effect.andThen(Effect.fail(new TimeoutError()))
    )
  )

// Parallel processing with batching
const processBatch = <A, E>(
  items: A[],
  process: (item: A) => Effect.Effect<unknown, E>,
  batchSize: number
): Effect.Effect<void, E> =>
  pipe(
    Effect.all(
      items.map(process),
      { concurrency: batchSize }
    ),
    Effect.map(() => undefined)
  )

// Worker pool pattern
const createWorkerPool = <A, B, E>(
  worker: (item: A) => Effect.Effect<B, E>,
  poolSize: number
) => {
  const queue = new Queue<A>()

  const workers = Array.from({ length: poolSize }, () =>
    Effect.gen(function* () {
      while (true) {
        const item = yield* Effect.promise(() => queue.dequeue())
        yield* worker(item)
      }
    })
  )

  return {
    submit: (item: A) => Effect.sync(() => queue.enqueue(item)),
    start: () => Effect.all(workers.map(Effect.fork)),
    stop: (fibers: Fiber.Fiber<void, E>[]) =>
      Effect.all(fibers.map(Fiber.interrupt))
  }
}
```

**Advanced Concurrency:**

```typescript
// Supervisor for fiber management
const supervisedTask = Effect.gen(function* () {
  const supervisor = yield* Supervisor.track

  yield* pipe(
    Effect.all([
      task1(),
      task2(),
      task3()
    ]),
    Effect.supervised(supervisor)
  )

  const fibers = yield* supervisor.value
  console.log(`Spawned ${fibers.length} fibers`)
})

// Semaphore for resource limiting
const withSemaphore = <A, E>(
  effect: Effect.Effect<A, E>,
  permits: number
): Effect.Effect<A, E> =>
  Effect.gen(function* () {
    const semaphore = yield* Effect.makeSemaphore(permits)
    return yield* semaphore.withPermit(effect)
  })

// Rate limiting
const rateLimit = <A, E>(
  effects: Effect.Effect<A, E>[],
  perSecond: number
): Effect.Effect<A[], E> => {
  const delay = 1000 / perSecond
  return Effect.all(
    effects.map((effect, i) =>
      Effect.sleep(i * delay).pipe(Effect.andThen(effect))
    ),
    { concurrency: "unbounded" }
  )
}

// Circuit breaker
class CircuitBreaker {
  private failures = 0
  private lastFailure = 0

  wrap<A, E>(
    effect: Effect.Effect<A, E>,
    threshold: number,
    resetMs: number
  ): Effect.Effect<A, E | CircuitOpenError> {
    if (this.failures >= threshold && Date.now() - this.lastFailure < resetMs) {
      return Effect.fail(new CircuitOpenError())
    }

    return pipe(
      effect,
      Effect.tap(() => Effect.sync(() => { this.failures = 0 })),
      Effect.catchAll(error => {
        this.failures++
        this.lastFailure = Date.now()
        return Effect.fail(error)
      })
    )
  }
}
```

**Gotchas:**
- Unjoined fibers leak resources - always join or interrupt
- Interruption doesn't kill fibers instantly - cleanup may run
- `Effect.all` with sequential mode doesn't parallelize
- Fiber.await vs Fiber.join: await gets Exit, join unwraps to Effect

## 💡 Real-World Examples

### Example 1: API Client with Retry and Timeout

```typescript
import { Effect, pipe, Schedule, Duration } from "effect"

class ApiError {
  readonly _tag = "ApiError"
  constructor(readonly status: number, readonly message: string) {}
}

class TimeoutError {
  readonly _tag = "TimeoutError"
}

const apiRequest = <T>(url: string, options?: RequestInit) =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new ApiError(response.status, await response.text())
        }
        return response.json() as T
      },
      catch: (error) =>
        error instanceof ApiError ? error : new ApiError(500, String(error))
    }),
    Effect.timeout(Duration.seconds(30)),
    Effect.flatMap(result =>
      result._tag === "Some"
        ? Effect.succeed(result.value)
        : Effect.fail(new TimeoutError())
    ),
    Effect.retry({
      schedule: Schedule.exponential(Duration.millis(100)).pipe(
        Schedule.intersect(Schedule.recurs(3))
      ),
      while: error => error._tag === "ApiError" && error.status >= 500
    })
  )

// Usage
const getUser = (id: string) =>
  apiRequest<User>(`https://api.example.com/users/${id}`)

const program = pipe(
  getUser("123"),
  Effect.catchTags({
    ApiError: error => Effect.logError(`API Error: ${error.message}`),
    TimeoutError: () => Effect.logError("Request timed out")
  })
)
```

### Example 2: Database Transaction Manager

```typescript
import { Effect, Context, Layer } from "effect"

interface Transaction {
  readonly commit: () => Effect.Effect<void, DbError>
  readonly rollback: () => Effect.Effect<void>
}

interface Database {
  readonly beginTransaction: () => Effect.Effect<Transaction, DbError>
  readonly query: <T>(sql: string) => Effect.Effect<T[], DbError>
}

const Database = Context.GenericTag<Database>("Database")

const withTransaction = <A, E>(
  use: (tx: Transaction) => Effect.Effect<A, E>
): Effect.Effect<A, E | DbError> =>
  Effect.gen(function* () {
    const db = yield* Database
    const tx = yield* db.beginTransaction()

    const result = yield* use(tx).pipe(
      Effect.tapBoth({
        onFailure: () => tx.rollback(),
        onSuccess: () => tx.commit()
      }),
      Effect.onInterrupt(() => tx.rollback())
    )

    return result
  })

// Usage
const transferFunds = (from: string, to: string, amount: number) =>
  withTransaction(tx =>
    Effect.gen(function* () {
      const db = yield* Database

      yield* db.query(`UPDATE accounts SET balance = balance - ${amount} WHERE id = '${from}'`)
      yield* db.query(`UPDATE accounts SET balance = balance + ${amount} WHERE id = '${to}'`)
      yield* db.query(`INSERT INTO transfers (from_id, to_id, amount) VALUES ('${from}', '${to}', ${amount})`)

      return { from, to, amount }
    })
  )
```

### Example 3: Multi-Source Data Aggregator

```typescript
import { Effect, pipe } from "effect"

interface DataSource {
  readonly name: string
  readonly fetch: () => Effect.Effect<Data[], FetchError>
}

const aggregateData = (sources: DataSource[]) =>
  pipe(
    Effect.all(
      sources.map(source =>
        pipe(
          source.fetch(),
          Effect.map(data => ({ source: source.name, data })),
          Effect.catchAll(error =>
            Effect.succeed({ source: source.name, data: [], error })
          ),
          Effect.timeout(Duration.seconds(5)),
          Effect.map(result =>
            result._tag === "Some"
              ? result.value
              : { source: source.name, data: [], error: new TimeoutError() }
          )
        )
      ),
      { concurrency: "unbounded" }
    ),
    Effect.map(results => ({
      successful: results.filter(r => !r.error).flatMap(r => r.data),
      failed: results.filter(r => r.error),
      total: results.reduce((sum, r) => sum + r.data.length, 0)
    }))
  )

// Usage
const sources: DataSource[] = [
  { name: "Primary", fetch: fetchFromPrimary },
  { name: "Secondary", fetch: fetchFromSecondary },
  { name: "Cache", fetch: fetchFromCache }
]

const program = pipe(
  aggregateData(sources),
  Effect.tap(result =>
    Effect.log(`Aggregated ${result.total} items from ${sources.length - result.failed.length} sources`)
  )
)
```

### Example 4: Event Processing Pipeline

```typescript
import { Effect, Queue, Stream } from "effect"

interface Event {
  readonly id: string
  readonly type: string
  readonly data: unknown
}

const createEventProcessor = () =>
  Effect.gen(function* () {
    const queue = yield* Queue.unbounded<Event>()

    const processor = pipe(
      Stream.fromQueue(queue),
      Stream.mapEffect(event =>
        pipe(
          validateEvent(event),
          Effect.flatMap(enrichEvent),
          Effect.flatMap(persistEvent),
          Effect.flatMap(notifySubscribers),
          Effect.catchAll(error =>
            Effect.logError(`Failed to process event ${event.id}: ${error}`)
          )
        )
      ),
      Stream.runDrain
    )

    const fiber = yield* Effect.fork(processor)

    return {
      enqueue: (event: Event) => Queue.offer(queue, event),
      stop: () => Fiber.interrupt(fiber)
    }
  })

// Usage
const program = Effect.gen(function* () {
  const processor = yield* createEventProcessor()

  yield* processor.enqueue({ id: "1", type: "USER_CREATED", data: { userId: "123" } })
  yield* processor.enqueue({ id: "2", type: "ORDER_PLACED", data: { orderId: "456" } })

  yield* Effect.sleep(Duration.seconds(10))
  yield* processor.stop()
})
```

### Example 5: Caching Layer with TTL

```typescript
import { Effect, Context, Layer, Ref } from "effect"

interface Cache<K, V> {
  readonly get: (key: K) => Effect.Effect<V | null>
  readonly set: (key: K, value: V, ttlMs: number) => Effect.Effect<void>
  readonly delete: (key: K) => Effect.Effect<void>
}

const Cache = Context.GenericTag<Cache<string, unknown>>("Cache")

const CacheLive = Layer.effect(
  Cache,
  Effect.gen(function* () {
    const store = yield* Ref.make(new Map<string, { value: unknown, expiresAt: number }>())

    return {
      get: (key) =>
        pipe(
          Ref.get(store),
          Effect.map(map => {
            const entry = map.get(key)
            if (!entry || entry.expiresAt < Date.now()) {
              return null
            }
            return entry.value
          })
        ),

      set: (key, value, ttlMs) =>
        pipe(
          Ref.update(store, map =>
            new Map(map).set(key, {
              value,
              expiresAt: Date.now() + ttlMs
            })
          ),
          Effect.map(() => undefined)
        ),

      delete: (key) =>
        pipe(
          Ref.update(store, map => {
            const newMap = new Map(map)
            newMap.delete(key)
            return newMap
          }),
          Effect.map(() => undefined)
        )
    }
  })
)

// Usage with cache-aside pattern
const cachedFetch = <T>(key: string, fetch: () => Effect.Effect<T, Error>) =>
  Effect.gen(function* () {
    const cache = yield* Cache

    const cached = yield* cache.get(key)
    if (cached) {
      return cached as T
    }

    const value = yield* fetch()
    yield* cache.set(key, value, 60000) // 1 minute TTL
    return value
  })
```

## 🔗 Related Skills

- **vitest-expert** - Testing Effect-based code with Vitest
- **drizzle-studio** - Integrate Effect with Drizzle ORM
- **nodejs-backend-patterns** - Use Effect in Node.js backends
- **typescript-advanced-types** - Advanced typing for Effect programs

## 📖 Further Reading

- [Effect-TS Official Docs](https://effect.website/)
- [Effect-TS GitHub](https://github.com/Effect-TS/effect)
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/)
- [Algebraic Effects for the Rest of Us](https://overreacted.io/algebraic-effects-for-the-rest-of-us/)
- [Effect-TS Discord](https://discord.gg/effect-ts)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
