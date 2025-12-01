/**
 * Rate Limiter Module
 * Phase 13B: Rate Limiting
 */

// Types & Schemas
export {
  // Algorithms
  RateLimitAlgorithmSchema,
  type RateLimitAlgorithm,

  // Algorithm Configs
  TokenBucketConfigSchema,
  type TokenBucketConfig,
  SlidingWindowConfigSchema,
  type SlidingWindowConfig,
  FixedWindowConfigSchema,
  type FixedWindowConfig,
  LeakyBucketConfigSchema,
  type LeakyBucketConfig,
  AlgorithmConfigSchema,
  type AlgorithmConfig,

  // Rules
  RateLimitRuleSchema,
  type RateLimitRule,

  // Request/Result
  RateLimitRequestSchema,
  type RateLimitRequest,
  RateLimitResultSchema,
  type RateLimitResult,

  // State
  TokenBucketStateSchema,
  type TokenBucketState,
  SlidingWindowStateSchema,
  type SlidingWindowState,
  FixedWindowStateSchema,
  type FixedWindowState,
  LeakyBucketStateSchema,
  type LeakyBucketState,
  LimiterStateSchema,
  type LimiterState,

  // Stats
  RateLimitStatsSchema,
  type RateLimitStats,

  // Config
  RateLimiterConfigSchema,
  type RateLimiterConfig,

  // Distributed
  DistributedSyncSchema,
  type DistributedSync,

  // Events & Interfaces
  type RateLimitEvents,
  type RateLimitStorage,
  type RateLimitQueue,
} from "./types.js";

// Rate Limiter
export {
  RateLimiter,
  RateLimiterRegistry,
  RateLimitExceededError,
  getRateLimiterRegistry,
  createRateLimiterRegistry,
  createRateLimiter,
  withRateLimit,
  RATE_LIMIT_PRESETS,
} from "./rate-limiter.js";
