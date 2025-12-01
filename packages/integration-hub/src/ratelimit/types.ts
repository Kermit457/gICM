/**
 * Rate Limiter Types
 * Phase 13B: Rate Limiting
 */

import { z } from "zod";

// =============================================================================
// Rate Limit Algorithms
// =============================================================================

export const RateLimitAlgorithmSchema = z.enum([
  "token_bucket",
  "sliding_window",
  "fixed_window",
  "leaky_bucket",
]);
export type RateLimitAlgorithm = z.infer<typeof RateLimitAlgorithmSchema>;

// =============================================================================
// Token Bucket Config
// =============================================================================

export const TokenBucketConfigSchema = z.object({
  algorithm: z.literal("token_bucket"),
  capacity: z.number().min(1).describe("Maximum tokens in bucket"),
  refillRate: z.number().min(0).describe("Tokens added per interval"),
  refillIntervalMs: z.number().min(1).default(1000).describe("Refill interval"),
});
export type TokenBucketConfig = z.infer<typeof TokenBucketConfigSchema>;

// =============================================================================
// Sliding Window Config
// =============================================================================

export const SlidingWindowConfigSchema = z.object({
  algorithm: z.literal("sliding_window"),
  windowMs: z.number().min(1).describe("Window duration in ms"),
  maxRequests: z.number().min(1).describe("Max requests per window"),
  precision: z.number().min(1).default(10).describe("Number of sub-windows"),
});
export type SlidingWindowConfig = z.infer<typeof SlidingWindowConfigSchema>;

// =============================================================================
// Fixed Window Config
// =============================================================================

export const FixedWindowConfigSchema = z.object({
  algorithm: z.literal("fixed_window"),
  windowMs: z.number().min(1).describe("Window duration in ms"),
  maxRequests: z.number().min(1).describe("Max requests per window"),
});
export type FixedWindowConfig = z.infer<typeof FixedWindowConfigSchema>;

// =============================================================================
// Leaky Bucket Config
// =============================================================================

export const LeakyBucketConfigSchema = z.object({
  algorithm: z.literal("leaky_bucket"),
  capacity: z.number().min(1).describe("Bucket capacity"),
  leakRate: z.number().min(0).describe("Requests leaked per interval"),
  leakIntervalMs: z.number().min(1).default(1000).describe("Leak interval"),
});
export type LeakyBucketConfig = z.infer<typeof LeakyBucketConfigSchema>;

// =============================================================================
// Combined Algorithm Config
// =============================================================================

export const AlgorithmConfigSchema = z.discriminatedUnion("algorithm", [
  TokenBucketConfigSchema,
  SlidingWindowConfigSchema,
  FixedWindowConfigSchema,
  LeakyBucketConfigSchema,
]);
export type AlgorithmConfig = z.infer<typeof AlgorithmConfigSchema>;

// =============================================================================
// Rate Limit Rule
// =============================================================================

export const RateLimitRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().default(0).describe("Higher = evaluated first"),
  match: z.object({
    path: z.string().optional().describe("Path pattern (glob)"),
    method: z.array(z.string()).optional(),
    headers: z.record(z.string()).optional(),
    clientId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  config: AlgorithmConfigSchema,
  actions: z.object({
    onLimit: z.enum(["reject", "queue", "throttle"]).default("reject"),
    retryAfterMs: z.number().optional(),
    queueTimeoutMs: z.number().optional(),
    customResponse: z.object({
      statusCode: z.number().default(429),
      message: z.string().default("Too many requests"),
      headers: z.record(z.string()).optional(),
    }).optional(),
  }),
});
export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;

// =============================================================================
// Rate Limit Result
// =============================================================================

export const RateLimitResultSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number(),
  limit: z.number(),
  resetMs: z.number().describe("Ms until limit resets"),
  retryAfterMs: z.number().optional(),
  rule: z.string().optional().describe("Matched rule ID"),
  queuePosition: z.number().optional(),
});
export type RateLimitResult = z.infer<typeof RateLimitResultSchema>;

// =============================================================================
// Rate Limit Request
// =============================================================================

export const RateLimitRequestSchema = z.object({
  key: z.string().describe("Unique identifier for rate limiting"),
  path: z.string().optional(),
  method: z.string().optional(),
  headers: z.record(z.string()).optional(),
  clientId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  cost: z.number().default(1).describe("Request cost (tokens consumed)"),
  timestamp: z.number().optional(),
});
export type RateLimitRequest = z.infer<typeof RateLimitRequestSchema>;

// =============================================================================
// Rate Limiter State
// =============================================================================

export const TokenBucketStateSchema = z.object({
  algorithm: z.literal("token_bucket"),
  tokens: z.number(),
  lastRefill: z.number(),
});
export type TokenBucketState = z.infer<typeof TokenBucketStateSchema>;

export const SlidingWindowStateSchema = z.object({
  algorithm: z.literal("sliding_window"),
  windows: z.array(z.object({
    start: z.number(),
    count: z.number(),
  })),
});
export type SlidingWindowState = z.infer<typeof SlidingWindowStateSchema>;

export const FixedWindowStateSchema = z.object({
  algorithm: z.literal("fixed_window"),
  windowStart: z.number(),
  count: z.number(),
});
export type FixedWindowState = z.infer<typeof FixedWindowStateSchema>;

export const LeakyBucketStateSchema = z.object({
  algorithm: z.literal("leaky_bucket"),
  level: z.number(),
  lastLeak: z.number(),
});
export type LeakyBucketState = z.infer<typeof LeakyBucketStateSchema>;

export const LimiterStateSchema = z.discriminatedUnion("algorithm", [
  TokenBucketStateSchema,
  SlidingWindowStateSchema,
  FixedWindowStateSchema,
  LeakyBucketStateSchema,
]);
export type LimiterState = z.infer<typeof LimiterStateSchema>;

// =============================================================================
// Rate Limit Stats
// =============================================================================

export const RateLimitStatsSchema = z.object({
  key: z.string(),
  rule: z.string(),
  totalRequests: z.number(),
  allowedRequests: z.number(),
  rejectedRequests: z.number(),
  queuedRequests: z.number(),
  averageWaitMs: z.number(),
  peakUsage: z.number(),
  lastRequest: z.number(),
});
export type RateLimitStats = z.infer<typeof RateLimitStatsSchema>;

// =============================================================================
// Rate Limiter Config
// =============================================================================

export const RateLimiterConfigSchema = z.object({
  defaultRule: AlgorithmConfigSchema.optional(),
  rules: z.array(RateLimitRuleSchema).default([]),
  enableStats: z.boolean().default(true),
  statsRetentionMs: z.number().default(24 * 60 * 60 * 1000), // 24 hours
  enableDistributed: z.boolean().default(false),
  redis: z.object({
    host: z.string().default("localhost"),
    port: z.number().default(6379),
    keyPrefix: z.string().default("ratelimit:"),
    password: z.string().optional(),
  }).optional(),
  queueConfig: z.object({
    maxSize: z.number().default(1000),
    defaultTimeoutMs: z.number().default(30000),
  }).optional(),
});
export type RateLimiterConfig = z.infer<typeof RateLimiterConfigSchema>;

// =============================================================================
// Distributed Sync
// =============================================================================

export const DistributedSyncSchema = z.object({
  nodeId: z.string(),
  timestamp: z.number(),
  states: z.record(LimiterStateSchema),
});
export type DistributedSync = z.infer<typeof DistributedSyncSchema>;

// =============================================================================
// Events
// =============================================================================

export type RateLimitEvents = {
  // Request Events
  allowed: (key: string, result: RateLimitResult) => void;
  rejected: (key: string, result: RateLimitResult) => void;
  queued: (key: string, position: number) => void;
  dequeued: (key: string, waitMs: number) => void;

  // Rule Events
  ruleMatched: (key: string, ruleId: string) => void;
  ruleAdded: (rule: RateLimitRule) => void;
  ruleRemoved: (ruleId: string) => void;
  ruleUpdated: (rule: RateLimitRule) => void;

  // State Events
  limitReached: (key: string, rule: string) => void;
  limitReset: (key: string, rule: string) => void;

  // Distributed Events
  syncStarted: (nodeId: string) => void;
  syncCompleted: (nodeId: string, keysSync: number) => void;
  syncError: (nodeId: string, error: Error) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface RateLimitStorage {
  get(key: string): Promise<LimiterState | null>;
  set(key: string, state: LimiterState, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string, field: string, amount: number): Promise<number>;
  getMulti(keys: string[]): Promise<Map<string, LimiterState>>;
  setMulti(entries: Map<string, LimiterState>, ttlMs?: number): Promise<void>;
}

// =============================================================================
// Queue Interface
// =============================================================================

export interface RateLimitQueue {
  enqueue(key: string, request: RateLimitRequest): Promise<number>;
  dequeue(key: string): Promise<RateLimitRequest | null>;
  peek(key: string): Promise<RateLimitRequest | null>;
  size(key: string): Promise<number>;
  clear(key: string): Promise<void>;
}
