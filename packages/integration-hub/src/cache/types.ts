/**
 * Cache Types & Schemas
 * Phase 9C: Advanced Caching Layer
 */

import { z } from "zod";

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

export const CacheStrategySchema = z.enum([
  "none",           // No caching
  "memory",         // In-memory only
  "redis",          // Redis only
  "tiered",         // Memory + Redis (L1 + L2)
  "distributed",    // Distributed cache with replication
]);
export type CacheStrategy = z.infer<typeof CacheStrategySchema>;

// ============================================================================
// EVICTION POLICIES
// ============================================================================

export const EvictionPolicySchema = z.enum([
  "lru",            // Least Recently Used
  "lfu",            // Least Frequently Used
  "fifo",           // First In First Out
  "ttl",            // Time To Live only
  "random",         // Random eviction
]);
export type EvictionPolicy = z.infer<typeof EvictionPolicySchema>;

// ============================================================================
// CACHE ENTRY
// ============================================================================

export const CacheEntrySchema = z.object({
  key: z.string(),
  value: z.unknown(),
  metadata: z.object({
    createdAt: z.number(),
    accessedAt: z.number(),
    expiresAt: z.number().optional(),
    ttl: z.number().optional(),
    accessCount: z.number().default(0),
    size: z.number().optional(),
    tags: z.array(z.string()).default([]),
  }),
});
export type CacheEntry = z.infer<typeof CacheEntrySchema>;

// ============================================================================
// CACHE OPTIONS
// ============================================================================

export const CacheOptionsSchema = z.object({
  ttl: z.number().optional(),               // Time to live in seconds
  tags: z.array(z.string()).optional(),     // Tags for invalidation
  compress: z.boolean().optional(),         // Compress large values
  skipL1: z.boolean().optional(),           // Skip memory cache
  skipL2: z.boolean().optional(),           // Skip Redis cache
  staleWhileRevalidate: z.number().optional(), // Serve stale while refreshing
  onMiss: z.function().optional(),          // Function to call on cache miss
});
export type CacheOptions = z.infer<typeof CacheOptionsSchema>;

// ============================================================================
// CACHE RESULT
// ============================================================================

export const CacheResultSchema = z.object({
  hit: z.boolean(),
  value: z.unknown().optional(),
  source: z.enum(["memory", "redis", "origin"]).optional(),
  stale: z.boolean().default(false),
  latencyMs: z.number(),
});
export type CacheResult = z.infer<typeof CacheResultSchema>;

// ============================================================================
// CACHE STATS
// ============================================================================

export const CacheStatsSchema = z.object({
  hits: z.number(),
  misses: z.number(),
  hitRate: z.number(),
  entries: z.number(),
  memoryUsage: z.number(),
  evictions: z.number(),
  latency: z.object({
    avg: z.number(),
    p50: z.number(),
    p95: z.number(),
    p99: z.number(),
  }),
  byTag: z.record(z.object({
    hits: z.number(),
    misses: z.number(),
    entries: z.number(),
  })).optional(),
});
export type CacheStats = z.infer<typeof CacheStatsSchema>;

// ============================================================================
// CACHE CONFIG
// ============================================================================

export const MemoryCacheConfigSchema = z.object({
  maxSize: z.number().default(1000),        // Max entries
  maxMemory: z.number().default(100 * 1024 * 1024), // 100MB
  evictionPolicy: EvictionPolicySchema.default("lru"),
  checkPeriod: z.number().default(60000),   // Cleanup interval
});
export type MemoryCacheConfig = z.infer<typeof MemoryCacheConfigSchema>;

export const RedisCacheConfigSchema = z.object({
  url: z.string().default("redis://localhost:6379"),
  prefix: z.string().default("gicm:cache:"),
  maxRetriesPerRequest: z.number().default(3),
  enableOfflineQueue: z.boolean().default(true),
  connectTimeout: z.number().default(5000),
  commandTimeout: z.number().default(5000),
});
export type RedisCacheConfig = z.infer<typeof RedisCacheConfigSchema>;

export const CacheManagerConfigSchema = z.object({
  strategy: CacheStrategySchema.default("memory"),
  defaultTtl: z.number().default(300),      // 5 minutes
  memory: MemoryCacheConfigSchema.optional(),
  redis: RedisCacheConfigSchema.optional(),
  compression: z.object({
    enabled: z.boolean().default(false),
    threshold: z.number().default(1024),    // Min size to compress
  }).optional(),
  metrics: z.object({
    enabled: z.boolean().default(true),
    sampleRate: z.number().default(1),      // 0-1
  }).optional(),
});
export type CacheManagerConfig = z.infer<typeof CacheManagerConfigSchema>;

// ============================================================================
// CACHE KEY PATTERNS
// ============================================================================

export const CacheKeyPatternSchema = z.object({
  pattern: z.string(),
  ttl: z.number().optional(),
  tags: z.array(z.string()).optional(),
  compression: z.boolean().optional(),
});
export type CacheKeyPattern = z.infer<typeof CacheKeyPatternSchema>;

// ============================================================================
// CACHE EVENTS
// ============================================================================

export interface CacheEvents {
  "hit": (key: string, source: "memory" | "redis") => void;
  "miss": (key: string) => void;
  "set": (key: string, ttl?: number) => void;
  "delete": (key: string) => void;
  "evict": (key: string, reason: "ttl" | "memory" | "manual") => void;
  "invalidate": (pattern: string, count: number) => void;
  "error": (error: Error) => void;
  "connected": (backend: "redis") => void;
  "disconnected": (backend: "redis") => void;
}

// ============================================================================
// CACHE DECORATORS (for method caching)
// ============================================================================

export interface CacheDecoratorOptions {
  key?: string | ((...args: unknown[]) => string);
  ttl?: number;
  tags?: string[];
  condition?: (...args: unknown[]) => boolean;
  unless?: (result: unknown) => boolean;
}

// ============================================================================
// COMMON KEY BUILDERS
// ============================================================================

export const CacheKeys = {
  // Organization
  org: (orgId: string) => `org:${orgId}`,
  orgMembers: (orgId: string) => `org:${orgId}:members`,
  orgSettings: (orgId: string) => `org:${orgId}:settings`,

  // Pipeline
  pipeline: (pipelineId: string) => `pipeline:${pipelineId}`,
  pipelineList: (orgId: string) => `pipelines:${orgId}`,
  pipelineExecution: (executionId: string) => `execution:${executionId}`,

  // Schedule
  schedule: (scheduleId: string) => `schedule:${scheduleId}`,
  scheduleList: (orgId: string) => `schedules:${orgId}`,

  // Budget
  budget: (budgetId: string) => `budget:${budgetId}`,
  budgetList: (orgId: string) => `budgets:${orgId}`,
  budgetUsage: (budgetId: string) => `budget:${budgetId}:usage`,

  // Analytics
  analytics: (orgId: string, period: string) => `analytics:${orgId}:${period}`,
  analyticsSummary: (orgId: string) => `analytics:${orgId}:summary`,

  // User
  user: (userId: string) => `user:${userId}`,
  userPermissions: (userId: string, orgId: string) => `user:${userId}:perms:${orgId}`,

  // API
  apiRateLimit: (key: string) => `rate:${key}`,

  // Content
  content: (contentId: string) => `content:${contentId}`,
  contentList: (orgId: string, type: string) => `content:${orgId}:${type}`,

  // Marketplace
  marketplaceItem: (itemId: string) => `marketplace:${itemId}`,
  marketplaceList: (category: string) => `marketplace:list:${category}`,
};

// ============================================================================
// TTL PRESETS
// ============================================================================

export const TTL = {
  VERY_SHORT: 30,        // 30 seconds
  SHORT: 60,             // 1 minute
  MEDIUM: 300,           // 5 minutes
  LONG: 900,             // 15 minutes
  VERY_LONG: 3600,       // 1 hour
  DAY: 86400,            // 24 hours
  WEEK: 604800,          // 7 days

  // Specific use cases
  RATE_LIMIT: 60,
  SESSION: 86400,
  API_RESPONSE: 60,
  ANALYTICS: 300,
  USER_PERMISSIONS: 300,
  ORG_SETTINGS: 600,
  PIPELINE_LIST: 60,
  MARKETPLACE: 300,
};

// ============================================================================
// CACHE TAGS
// ============================================================================

export const CacheTags = {
  // Invalidation groups
  ORG: (orgId: string) => `org:${orgId}`,
  USER: (userId: string) => `user:${userId}`,
  PIPELINE: (pipelineId: string) => `pipeline:${pipelineId}`,
  SCHEDULE: (scheduleId: string) => `schedule:${scheduleId}`,
  BUDGET: (budgetId: string) => `budget:${budgetId}`,

  // Resource types
  PIPELINES: "type:pipelines",
  SCHEDULES: "type:schedules",
  BUDGETS: "type:budgets",
  ANALYTICS: "type:analytics",
  MARKETPLACE: "type:marketplace",
  CONTENT: "type:content",
};
