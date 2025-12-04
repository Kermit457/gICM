# Caching Expert

> **ID:** `caching-expert`
> **Tier:** 2
> **Token Cost:** 5500
> **MCP Connections:** None

## What This Skill Does

Master caching strategies for high-performance web applications. Implement multi-layer caching with Redis, in-memory stores, CDN edge caching, and browser caching for optimal response times and reduced server load.

- Redis caching patterns (cache-aside, write-through, write-behind)
- Cache invalidation strategies
- CDN configuration and edge caching
- Multi-layer caching architecture
- HTTP caching headers (Cache-Control, ETag, stale-while-revalidate)
- In-memory caching (LRU, TTL-based)
- Database query caching
- Cache warming and preloading
- Distributed cache synchronization

## When to Use

This skill is automatically loaded when:

- **Keywords:** cache, redis, cdn, invalidation, memcached, lru
- **File Types:** redis.ts, cache.ts
- **Directories:** /cache, /services

## Core Capabilities

### 1. Redis Caching Patterns

Redis provides fast in-memory data storage with persistence options.

**Redis Client Setup:**

```typescript
// src/lib/redis.ts
import { Redis } from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export { redis };
```

**Cache-Aside Pattern (Lazy Loading):**

```typescript
// src/lib/cache/cache-aside.ts
import { redis } from '../redis';

interface CacheOptions {
  ttl?: number; // seconds
  prefix?: string;
}

export class CacheAside<T> {
  private prefix: string;
  private defaultTtl: number;

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || 'cache';
    this.defaultTtl = options.ttl || 3600; // 1 hour
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get(key: string): Promise<T | null> {
    const cached = await redis.get(this.getKey(key));
    if (!cached) return null;
    return JSON.parse(cached) as T;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await redis.setex(this.getKey(key), ttl || this.defaultTtl, serialized);
  }

  async getOrSet(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  async invalidate(key: string): Promise<void> {
    await redis.del(this.getKey(key));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(`${this.prefix}:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Usage
const userCache = new CacheAside<User>({ prefix: 'users', ttl: 1800 });

async function getUser(id: string): Promise<User> {
  return userCache.getOrSet(`user:${id}`, async () => {
    return db.user.findUnique({ where: { id } });
  });
}
```

**Write-Through Pattern:**

```typescript
// src/lib/cache/write-through.ts
export class WriteThroughCache<T> {
  private cache: CacheAside<T>;
  private writer: (key: string, value: T) => Promise<void>;

  constructor(
    cacheOptions: CacheOptions,
    writer: (key: string, value: T) => Promise<void>
  ) {
    this.cache = new CacheAside<T>(cacheOptions);
    this.writer = writer;
  }

  async get(key: string): Promise<T | null> {
    return this.cache.get(key);
  }

  async set(key: string, value: T): Promise<void> {
    // Write to cache and database together
    await Promise.all([
      this.cache.set(key, value),
      this.writer(key, value),
    ]);
  }
}

// Usage
const settingsCache = new WriteThroughCache<Settings>(
  { prefix: 'settings' },
  async (key, value) => {
    await db.settings.upsert({
      where: { key },
      update: value,
      create: { key, ...value },
    });
  }
);
```

**Best Practices:**
- Use appropriate TTLs based on data volatility
- Implement cache stampede protection with locks
- Monitor cache hit/miss ratios
- Use Redis Cluster for high availability
- Serialize data efficiently (consider MessagePack for large objects)

**Gotchas:**
- Redis is single-threaded - avoid blocking operations
- Memory limits can cause eviction - set maxmemory policy
- Key expiration is lazy - expired keys may still consume memory briefly
- Connection pooling is essential for high concurrency

### 2. Cache Invalidation

The hardest problem in computer science - strategies for keeping cache consistent.

**Tag-Based Invalidation:**

```typescript
// src/lib/cache/tagged-cache.ts
import { redis } from '../redis';

export class TaggedCache {
  private prefix: string;

  constructor(prefix: string = 'cache') {
    this.prefix = prefix;
  }

  private getCacheKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private getTagKey(tag: string): string {
    return `${this.prefix}:tag:${tag}`;
  }

  async set<T>(key: string, value: T, tags: string[], ttl: number = 3600): Promise<void> {
    const cacheKey = this.getCacheKey(key);

    const multi = redis.multi();

    // Set the cached value
    multi.setex(cacheKey, ttl, JSON.stringify(value));

    // Associate key with tags
    for (const tag of tags) {
      multi.sadd(this.getTagKey(tag), cacheKey);
    }

    await multi.exec();
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(this.getCacheKey(key));
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateTag(tag: string): Promise<number> {
    const tagKey = this.getTagKey(tag);
    const keys = await redis.smembers(tagKey);

    if (keys.length === 0) return 0;

    const multi = redis.multi();
    for (const key of keys) {
      multi.del(key);
    }
    multi.del(tagKey);

    await multi.exec();
    return keys.length;
  }

  async invalidateTags(tags: string[]): Promise<number> {
    let count = 0;
    for (const tag of tags) {
      count += await this.invalidateTag(tag);
    }
    return count;
  }
}

// Usage
const cache = new TaggedCache();

// Cache product with tags
await cache.set(
  `product:${productId}`,
  product,
  [`category:${product.categoryId}`, `brand:${product.brandId}`, 'products'],
  3600
);

// Invalidate all products in a category
await cache.invalidateTag(`category:${categoryId}`);
```

**Event-Based Invalidation:**

```typescript
// src/lib/cache/event-invalidator.ts
import { EventEmitter } from 'events';

interface CacheEvent {
  type: 'create' | 'update' | 'delete';
  entity: string;
  id: string;
  data?: unknown;
}

class CacheInvalidator extends EventEmitter {
  private handlers: Map<string, (event: CacheEvent) => Promise<void>> = new Map();

  registerHandler(entity: string, handler: (event: CacheEvent) => Promise<void>): void {
    this.handlers.set(entity, handler);
  }

  async emit(event: CacheEvent): Promise<void> {
    const handler = this.handlers.get(event.entity);
    if (handler) {
      await handler(event);
    }

    // Also emit to any listeners
    super.emit('cache:invalidate', event);
  }
}

export const cacheInvalidator = new CacheInvalidator();

// Register handlers
cacheInvalidator.registerHandler('product', async (event) => {
  await cache.invalidate(`product:${event.id}`);

  if (event.type === 'update' && event.data) {
    const product = event.data as Product;
    await cache.invalidateTag(`category:${product.categoryId}`);
  }

  // Invalidate listing caches
  await cache.invalidateTag('product-listings');
});

// Emit events from service layer
async function updateProduct(id: string, data: ProductUpdate): Promise<Product> {
  const product = await db.product.update({ where: { id }, data });

  await cacheInvalidator.emit({
    type: 'update',
    entity: 'product',
    id,
    data: product,
  });

  return product;
}
```

**Best Practices:**
- Prefer event-based invalidation over TTL-only approaches
- Group related invalidations in transactions
- Log cache invalidations for debugging
- Implement gradual rollout for invalidation changes
- Consider soft deletes with grace periods

**Gotchas:**
- Cascading invalidations can cause cache stampedes
- Distributed systems need consistent invalidation
- Race conditions between write and invalidate
- Over-invalidation hurts performance more than stale data

### 3. CDN Configuration

Leverage edge caching for static assets and API responses.

**Vercel Edge Config:**

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};
```

**Edge-Cached API Route:**

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 60; // ISR revalidation

export async function GET() {
  const products = await getProducts();

  return NextResponse.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'CDN-Cache-Control': 'public, max-age=60',
      'Vercel-CDN-Cache-Control': 'public, max-age=3600',
    },
  });
}
```

**Cache-Control Header Builder:**

```typescript
// src/lib/cache-headers.ts
interface CacheControlOptions {
  public?: boolean;
  private?: boolean;
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  immutable?: boolean;
}

export function buildCacheControl(options: CacheControlOptions): string {
  const directives: string[] = [];

  if (options.public) directives.push('public');
  if (options.private) directives.push('private');
  if (options.noCache) directives.push('no-cache');
  if (options.noStore) directives.push('no-store');
  if (options.mustRevalidate) directives.push('must-revalidate');
  if (options.immutable) directives.push('immutable');

  if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`);
  if (options.sMaxAge !== undefined) directives.push(`s-maxage=${options.sMaxAge}`);
  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  if (options.staleIfError !== undefined) {
    directives.push(`stale-if-error=${options.staleIfError}`);
  }

  return directives.join(', ');
}

// Presets
export const CachePresets = {
  // Static assets - cache forever
  immutable: buildCacheControl({ public: true, maxAge: 31536000, immutable: true }),

  // API responses - short cache with revalidation
  api: buildCacheControl({ public: true, sMaxAge: 60, staleWhileRevalidate: 300 }),

  // User-specific data - no shared caching
  private: buildCacheControl({ private: true, maxAge: 0, mustRevalidate: true }),

  // Dynamic HTML - edge cache with ISR
  isr: buildCacheControl({ public: true, sMaxAge: 3600, staleWhileRevalidate: 86400 }),
};
```

**Best Practices:**
- Use `s-maxage` for CDN caching, `max-age` for browser
- Implement `stale-while-revalidate` for better UX
- Version static assets for cache busting
- Use `immutable` for fingerprinted assets
- Set appropriate Vary headers for dynamic content

**Gotchas:**
- CDN caching can mask server issues
- Purging CDN cache takes time to propagate
- Query strings may bypass cache (configure CDN properly)
- Cookies can prevent caching - use proper Vary headers

### 4. Multi-Layer Caching

Combine multiple cache layers for optimal performance.

**Multi-Layer Cache Implementation:**

```typescript
// src/lib/cache/multi-layer.ts
interface CacheLayer<T> {
  name: string;
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

class InMemoryLayer<T> implements CacheLayer<T> {
  name = 'memory';
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: T, ttl: number = 60): Promise<void> {
    // Simple LRU: remove oldest if full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expiry: Date.now() + ttl * 1000 });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

class RedisLayer<T> implements CacheLayer<T> {
  name = 'redis';
  private prefix: string;

  constructor(prefix: string = 'cache') {
    this.prefix = prefix;
  }

  async get(key: string): Promise<T | null> {
    const cached = await redis.get(`${this.prefix}:${key}`);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: T, ttl: number = 3600): Promise<void> {
    await redis.setex(`${this.prefix}:${key}`, ttl, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await redis.del(`${this.prefix}:${key}`);
  }
}

export class MultiLayerCache<T> {
  private layers: CacheLayer<T>[];

  constructor(layers: CacheLayer<T>[]) {
    this.layers = layers; // Ordered from fastest to slowest
  }

  async get(key: string): Promise<{ value: T; layer: string } | null> {
    for (const layer of this.layers) {
      const value = await layer.get(key);
      if (value !== null) {
        // Populate faster layers
        await this.populateFasterLayers(key, value, layer);
        return { value, layer: layer.name };
      }
    }
    return null;
  }

  async set(key: string, value: T, ttls?: number[]): Promise<void> {
    await Promise.all(
      this.layers.map((layer, i) => layer.set(key, value, ttls?.[i]))
    );
  }

  async delete(key: string): Promise<void> {
    await Promise.all(this.layers.map((layer) => layer.delete(key)));
  }

  private async populateFasterLayers(key: string, value: T, hitLayer: CacheLayer<T>): Promise<void> {
    const hitIndex = this.layers.indexOf(hitLayer);
    const fasterLayers = this.layers.slice(0, hitIndex);

    await Promise.all(
      fasterLayers.map((layer) => layer.set(key, value))
    );
  }
}

// Usage
const productCache = new MultiLayerCache<Product>([
  new InMemoryLayer(500),    // L1: In-memory (fast, limited size)
  new RedisLayer('products'), // L2: Redis (larger, persistent)
]);

async function getProduct(id: string): Promise<Product> {
  const cached = await productCache.get(`product:${id}`);
  if (cached) {
    console.log(`Cache hit from ${cached.layer}`);
    return cached.value;
  }

  const product = await db.product.findUnique({ where: { id } });
  if (product) {
    await productCache.set(
      `product:${id}`,
      product,
      [60, 3600] // 60s in memory, 1hr in Redis
    );
  }

  return product;
}
```

**Best Practices:**
- Layer caches by speed and capacity
- Use shorter TTLs for faster layers
- Implement cache warming for cold starts
- Monitor each layer's hit rate
- Consider network latency in layer ordering

**Gotchas:**
- Inconsistency between layers during invalidation
- Memory pressure from in-process caches
- Thundering herd on cache miss across layers
- Complexity increases debugging difficulty

## Real-World Examples

### Example 1: E-commerce Product Cache

```typescript
// src/services/product-cache.ts
class ProductCacheService {
  private cache: MultiLayerCache<Product>;
  private listCache: TaggedCache;

  constructor() {
    this.cache = new MultiLayerCache([
      new InMemoryLayer(200),
      new RedisLayer('products'),
    ]);
    this.listCache = new TaggedCache('product-lists');
  }

  async getProduct(id: string): Promise<Product | null> {
    const result = await this.cache.get(`product:${id}`);
    if (result) return result.value;

    const product = await db.product.findUnique({
      where: { id },
      include: { category: true, brand: true },
    });

    if (product) {
      await this.cache.set(`product:${id}`, product, [30, 1800]);
    }

    return product;
  }

  async getProductList(categoryId: string, page: number): Promise<Product[]> {
    const cacheKey = `list:${categoryId}:${page}`;

    return this.listCache.getOrSet(
      cacheKey,
      async () => {
        return db.product.findMany({
          where: { categoryId },
          skip: (page - 1) * 20,
          take: 20,
        });
      },
      [`category:${categoryId}`, 'product-listings'],
      300 // 5 minute TTL
    );
  }

  async invalidateProduct(id: string, categoryId: string): Promise<void> {
    await this.cache.delete(`product:${id}`);
    await this.listCache.invalidateTag(`category:${categoryId}`);
  }
}
```

### Example 2: API Response Caching with SWR

```typescript
// src/lib/swr-cache.ts
import { unstable_cache } from 'next/cache';

export function createCachedFetcher<T>(
  fetcher: () => Promise<T>,
  keyParts: string[],
  options: { revalidate?: number; tags?: string[] } = {}
) {
  return unstable_cache(
    fetcher,
    keyParts,
    {
      revalidate: options.revalidate || 60,
      tags: options.tags,
    }
  );
}

// Usage in Server Component
const getProducts = createCachedFetcher(
  () => db.product.findMany({ take: 50 }),
  ['products', 'list'],
  { revalidate: 60, tags: ['products'] }
);

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}

// Revalidate on mutation
import { revalidateTag } from 'next/cache';

async function createProduct(data: ProductInput) {
  await db.product.create({ data });
  revalidateTag('products');
}
```

## Related Skills

- **redis-expert** - Advanced Redis patterns
- **nextjs-expert** - Next.js caching and ISR
- **database-optimization** - Query optimization and indexing
- **cdn-expert** - CDN configuration and optimization

## Further Reading

- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [HTTP Caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Vercel Edge Caching](https://vercel.com/docs/edge-network/caching)
- [Cache Invalidation Patterns](https://martinfowler.com/bliki/TwoHardThings.html)
- [Stale-While-Revalidate](https://web.dev/stale-while-revalidate/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
