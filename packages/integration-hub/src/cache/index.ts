/**
 * Cache Module - Advanced Caching Layer
 * Phase 9C: Enterprise Security
 */

// Types & Schemas
export {
  // Strategies & Policies
  CacheStrategySchema,
  CacheStrategy,
  EvictionPolicySchema,
  EvictionPolicy,

  // Entry & Options
  CacheEntrySchema,
  CacheEntry,
  CacheOptionsSchema,
  CacheOptions,
  CacheResultSchema,
  CacheResult,

  // Stats
  CacheStatsSchema,
  CacheStats,

  // Config
  MemoryCacheConfigSchema,
  MemoryCacheConfig,
  RedisCacheConfigSchema,
  RedisCacheConfig,
  CacheManagerConfigSchema,
  CacheManagerConfig,

  // Key Patterns
  CacheKeyPatternSchema,
  CacheKeyPattern,

  // Events
  CacheEvents,

  // Decorators
  CacheDecoratorOptions,

  // Helpers
  CacheKeys,
  TTL,
  CacheTags,
} from "./types.js";

// Manager
export {
  CacheManager,
  getCacheManager,
  createCacheManager,
} from "./cache-manager.js";

// Middleware
export {
  cacheMiddleware,
  createCacheMiddleware,
  CacheMiddlewareOptions,
} from "./middleware.js";
