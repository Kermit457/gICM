/**
 * Cache Middleware for Fastify
 * Phase 9C: Advanced Caching Layer
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { CacheManager, getCacheManager } from "./cache-manager.js";
import { CacheOptions, TTL, CacheKeys } from "./types.js";

// ============================================================================
// TYPES
// ============================================================================

export interface CacheMiddlewareOptions {
  // Cache manager instance (optional, uses singleton if not provided)
  cacheManager?: CacheManager;

  // Default TTL for cached responses
  defaultTtl?: number;

  // Methods to cache (default: GET only)
  methods?: string[];

  // Paths to exclude from caching
  excludePaths?: (string | RegExp)[];

  // Include user ID in cache key
  varyByUser?: boolean;

  // Include org ID in cache key
  varyByOrg?: boolean;

  // Custom key generator
  keyGenerator?: (request: FastifyRequest) => string;

  // Condition to check before caching
  condition?: (request: FastifyRequest) => boolean;

  // Response status codes to cache
  statusCodes?: number[];

  // Skip caching based on response headers
  skipIfHeader?: string;

  // Add cache status header
  addStatusHeader?: boolean;
}

const DEFAULT_OPTIONS: CacheMiddlewareOptions = {
  defaultTtl: TTL.SHORT,
  methods: ["GET"],
  excludePaths: ["/health", "/metrics", "/api/auth"],
  varyByUser: true,
  varyByOrg: true,
  statusCodes: [200],
  addStatusHeader: true,
};

// ============================================================================
// KEY GENERATION
// ============================================================================

function generateCacheKey(request: FastifyRequest, options: CacheMiddlewareOptions): string {
  if (options.keyGenerator) {
    return options.keyGenerator(request);
  }

  const parts: string[] = [
    request.method,
    request.url,
  ];

  // Add user variation
  if (options.varyByUser && (request as any).userId) {
    parts.push(`user:${(request as any).userId}`);
  }

  // Add org variation
  if (options.varyByOrg && (request as any).orgId) {
    parts.push(`org:${(request as any).orgId}`);
  }

  // Add query string
  const queryString = new URL(request.url, "http://localhost").search;
  if (queryString) {
    parts.push(queryString);
  }

  return `api:${parts.join(":")}`;
}

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

export function createCacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cache = opts.cacheManager || getCacheManager();

  return async function cacheMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // Skip if method not cacheable
    if (!opts.methods?.includes(request.method)) {
      return;
    }

    // Check excluded paths
    const url = request.url.split("?")[0];
    for (const pattern of opts.excludePaths || []) {
      if (typeof pattern === "string" && url.startsWith(pattern)) {
        return;
      }
      if (pattern instanceof RegExp && pattern.test(url)) {
        return;
      }
    }

    // Check custom condition
    if (opts.condition && !opts.condition(request)) {
      return;
    }

    // Generate cache key
    const cacheKey = generateCacheKey(request, opts);

    // Try to get from cache
    const result = await cache.get(cacheKey);

    if (result.hit) {
      // Add cache status header
      if (opts.addStatusHeader) {
        reply.header("X-Cache", "HIT");
        reply.header("X-Cache-Source", result.source || "unknown");
      }

      // Return cached response
      reply.send(result.value);
      return;
    }

    // Add cache status header for miss
    if (opts.addStatusHeader) {
      reply.header("X-Cache", "MISS");
    }

    // Store original send method
    const originalSend = reply.send.bind(reply);

    // Override send to cache the response
    reply.send = function (payload: unknown) {
      // Only cache successful responses
      if (opts.statusCodes?.includes(reply.statusCode)) {
        // Skip if specific header is set
        if (opts.skipIfHeader && reply.getHeader(opts.skipIfHeader)) {
          return originalSend(payload);
        }

        // Cache the response
        cache.set(cacheKey, payload, {
          ttl: opts.defaultTtl,
          tags: [(request as any).orgId ? `org:${(request as any).orgId}` : "global"],
        }).catch(() => {
          // Ignore cache errors
        });
      }

      return originalSend(payload);
    };
  };
}

// ============================================================================
// ROUTE-SPECIFIC CACHING
// ============================================================================

export interface RouteCacheOptions extends CacheOptions {
  // Override default TTL
  ttl?: number;

  // Add stale-while-revalidate behavior
  staleWhileRevalidate?: number;

  // Custom cache key parts
  keyParts?: string[];

  // Vary by specific headers
  varyByHeaders?: string[];
}

/**
 * Cache decorator for specific routes
 */
export function cacheRoute(options: RouteCacheOptions = {}) {
  const cache = getCacheManager();

  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // Build cache key
    const keyParts = [
      request.method,
      request.url,
      ...(options.keyParts || []),
    ];

    // Add header variations
    for (const header of options.varyByHeaders || []) {
      const value = request.headers[header.toLowerCase()];
      if (value) {
        keyParts.push(`${header}:${value}`);
      }
    }

    const cacheKey = `route:${keyParts.join(":")}`;

    // Try cache
    const result = await cache.get(cacheKey);

    if (result.hit) {
      reply.header("X-Cache", "HIT");
      reply.send(result.value);
      return;
    }

    // Store original send
    const originalSend = reply.send.bind(reply);

    reply.send = function (payload: unknown) {
      if (reply.statusCode === 200) {
        cache.set(cacheKey, payload, {
          ttl: options.ttl || TTL.SHORT,
          tags: options.tags,
        }).catch(() => {});
      }
      return originalSend(payload);
    };
  };
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidate cache after mutations
 */
export async function invalidateOnMutation(
  resourceType: string,
  resourceId: string,
  orgId?: string
): Promise<void> {
  const cache = getCacheManager();

  // Invalidate specific resource
  await cache.delete(`${resourceType}:${resourceId}`);

  // Invalidate list caches
  if (orgId) {
    await cache.invalidateByPattern(`*${resourceType}*${orgId}*`);
  }

  // Invalidate by tag
  await cache.invalidateByTag(`type:${resourceType}s`);
}

/**
 * Create cache invalidation middleware for mutations
 */
export function invalidationMiddleware(
  resourceType: string,
  getResourceId: (request: FastifyRequest) => string | undefined,
  getOrgId?: (request: FastifyRequest) => string | undefined
) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // Only run after successful mutations
    reply.addHook("onSend", async (req, rep, payload) => {
      if (rep.statusCode >= 200 && rep.statusCode < 300) {
        const resourceId = getResourceId(request);
        const orgId = getOrgId?.(request);

        if (resourceId) {
          await invalidateOnMutation(resourceType, resourceId, orgId);
        }
      }
      return payload;
    });
  };
}

// ============================================================================
// FASTIFY PLUGIN
// ============================================================================

export async function cachePlugin(
  fastify: FastifyInstance,
  options: CacheMiddlewareOptions = {}
): Promise<void> {
  const cache = options.cacheManager || getCacheManager();

  // Add cache manager to request
  fastify.decorateRequest("cache", null);
  fastify.addHook("onRequest", async (request) => {
    (request as any).cache = cache;
  });

  // Add global cache middleware
  fastify.addHook("preHandler", createCacheMiddleware(options));

  // Add cache stats endpoint
  fastify.get("/api/cache/stats", async () => {
    return {
      ok: true,
      stats: cache.getStats(),
      strategy: cache.getStrategy(),
      redisConnected: cache.isRedisConnected(),
    };
  });

  // Add cache clear endpoint (admin only)
  fastify.delete("/api/cache", async (request, reply) => {
    // Check admin role
    if ((request as any).userRole !== "owner" && (request as any).userRole !== "admin") {
      reply.code(403);
      return { ok: false, error: "Admin access required" };
    }

    await cache.clear();
    return { ok: true, message: "Cache cleared" };
  });

  // Add pattern invalidation endpoint
  fastify.delete<{ Querystring: { pattern: string } }>(
    "/api/cache/invalidate",
    async (request, reply) => {
      if ((request as any).userRole !== "owner" && (request as any).userRole !== "admin") {
        reply.code(403);
        return { ok: false, error: "Admin access required" };
      }

      const { pattern } = request.query;
      if (!pattern) {
        reply.code(400);
        return { ok: false, error: "Pattern required" };
      }

      const count = await cache.invalidateByPattern(pattern);
      return { ok: true, invalidated: count };
    }
  );
}

// ============================================================================
// SINGLETON MIDDLEWARE
// ============================================================================

export const cacheMiddleware = createCacheMiddleware();
