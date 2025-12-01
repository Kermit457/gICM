/**
 * Rate Limiter for gICM platform
 *
 * Multiple algorithms:
 * - Token bucket (smooth rate limiting)
 * - Sliding window (accurate rate limiting)
 * - Fixed window (simple rate limiting)
 *
 * Features:
 * - Per-key rate limiting
 * - Configurable limits
 * - Burst allowance
 * - Statistics tracking
 */

import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export const RateLimitConfigSchema = z.object({
  /** Maximum requests per window */
  maxRequests: z.number().min(1),
  /** Window duration in milliseconds */
  windowMs: z.number().min(1),
  /** Algorithm to use */
  algorithm: z.enum(["token-bucket", "sliding-window", "fixed-window"]).default("sliding-window"),
  /** Burst allowance (for token bucket) */
  burstSize: z.number().optional(),
  /** Key prefix for storage */
  keyPrefix: z.string().default("ratelimit"),
});

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  uniqueKeys: number;
}

// ============================================================================
// RateLimitError
// ============================================================================

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number,
    public readonly key?: string
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

// ============================================================================
// Token Bucket Algorithm
// ============================================================================

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class TokenBucketLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms
  private readonly burstSize: number;

  constructor(config: RateLimitConfig) {
    this.maxTokens = config.maxRequests;
    this.refillRate = config.maxRequests / config.windowMs;
    this.burstSize = config.burstSize ?? config.maxRequests;
  }

  check(key: string, tokens = 1): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.burstSize, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const elapsed = now - bucket.lastRefill;
    const refillAmount = elapsed * this.refillRate;
    bucket.tokens = Math.min(this.burstSize, bucket.tokens + refillAmount);
    bucket.lastRefill = now;

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: now + Math.ceil((this.burstSize - bucket.tokens) / this.refillRate),
      };
    }

    const retryAfter = Math.ceil((tokens - bucket.tokens) / this.refillRate);
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + retryAfter,
      retryAfter,
    };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  clear(): void {
    this.buckets.clear();
  }
}

// ============================================================================
// Sliding Window Algorithm
// ============================================================================

interface WindowEntry {
  timestamp: number;
  count: number;
}

export class SlidingWindowLimiter {
  private windows: Map<string, WindowEntry[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  check(key: string, weight = 1): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create window entries
    let entries = this.windows.get(key) ?? [];

    // Remove expired entries
    entries = entries.filter((e) => e.timestamp > windowStart);

    // Count requests in current window
    const currentCount = entries.reduce((sum, e) => sum + e.count, 0);

    if (currentCount + weight <= this.maxRequests) {
      entries.push({ timestamp: now, count: weight });
      this.windows.set(key, entries);

      return {
        allowed: true,
        remaining: this.maxRequests - currentCount - weight,
        resetAt: entries.length > 0 ? entries[0].timestamp + this.windowMs : now + this.windowMs,
      };
    }

    // Find when oldest entry will expire
    const oldestEntry = entries[0];
    const retryAfter = oldestEntry
      ? oldestEntry.timestamp + this.windowMs - now
      : this.windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetAt: now + retryAfter,
      retryAfter,
    };
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  clear(): void {
    this.windows.clear();
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, entries] of this.windows) {
      const filtered = entries.filter((e) => e.timestamp > windowStart);
      if (filtered.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, filtered);
      }
    }
  }
}

// ============================================================================
// Fixed Window Algorithm
// ============================================================================

interface FixedWindow {
  count: number;
  windowStart: number;
}

export class FixedWindowLimiter {
  private windows: Map<string, FixedWindow> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  check(key: string, weight = 1): RateLimitResult {
    const now = Date.now();
    const currentWindowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const windowEnd = currentWindowStart + this.windowMs;

    let window = this.windows.get(key);

    // Reset if in new window
    if (!window || window.windowStart !== currentWindowStart) {
      window = { count: 0, windowStart: currentWindowStart };
      this.windows.set(key, window);
    }

    if (window.count + weight <= this.maxRequests) {
      window.count += weight;
      return {
        allowed: true,
        remaining: this.maxRequests - window.count,
        resetAt: windowEnd,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd,
      retryAfter: windowEnd - now,
    };
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  clear(): void {
    this.windows.clear();
  }
}

// ============================================================================
// RateLimiter (unified interface)
// ============================================================================

/**
 * RateLimiter with multiple algorithm support
 *
 * @example
 * const limiter = new RateLimiter({
 *   maxRequests: 100,
 *   windowMs: 60 * 1000, // 1 minute
 *   algorithm: 'sliding-window',
 * });
 *
 * // Check if request is allowed
 * const result = limiter.check('user:123');
 * if (!result.allowed) {
 *   throw new RateLimitError('Too many requests', result.retryAfter!);
 * }
 *
 * // Or use the convenience method
 * await limiter.limit('user:123'); // throws if rate limited
 */
export class RateLimiter {
  private limiter: TokenBucketLimiter | SlidingWindowLimiter | FixedWindowLimiter;
  private stats: RateLimitStats = {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    uniqueKeys: 0,
  };
  private seenKeys: Set<string> = new Set();
  private readonly keyPrefix: string;
  private readonly normalizedConfig: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    // Apply defaults for optional fields
    this.normalizedConfig = {
      ...config,
      algorithm: config.algorithm ?? "sliding-window",
      keyPrefix: config.keyPrefix ?? "ratelimit",
    };
    this.keyPrefix = this.normalizedConfig.keyPrefix!;

    switch (this.normalizedConfig.algorithm) {
      case "token-bucket":
        this.limiter = new TokenBucketLimiter(this.normalizedConfig);
        break;
      case "fixed-window":
        this.limiter = new FixedWindowLimiter(this.normalizedConfig);
        break;
      case "sliding-window":
      default:
        this.limiter = new SlidingWindowLimiter(this.normalizedConfig);
    }
  }

  /**
   * Check if a request is allowed
   */
  check(key: string, weight = 1): RateLimitResult {
    const prefixedKey = `${this.keyPrefix}:${key}`;
    const result = this.limiter.check(prefixedKey, weight);

    // Update stats
    this.stats.totalRequests++;
    if (result.allowed) {
      this.stats.allowedRequests++;
    } else {
      this.stats.blockedRequests++;
    }
    if (!this.seenKeys.has(key)) {
      this.seenKeys.add(key);
      this.stats.uniqueKeys++;
    }

    return result;
  }

  /**
   * Limit a request - throws if rate limited
   */
  limit(key: string, weight = 1): void {
    const result = this.check(key, weight);
    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded for ${key}`,
        result.retryAfter ?? 0,
        key
      );
    }
  }

  /**
   * Async limit with optional wait
   */
  async limitAsync(
    key: string,
    options?: { wait?: boolean; maxWait?: number }
  ): Promise<RateLimitResult> {
    const result = this.check(key);

    if (result.allowed) {
      return result;
    }

    if (options?.wait && result.retryAfter) {
      const waitTime = options.maxWait
        ? Math.min(result.retryAfter, options.maxWait)
        : result.retryAfter;

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.check(key);
      }
    }

    throw new RateLimitError(
      `Rate limit exceeded for ${key}`,
      result.retryAfter ?? 0,
      key
    );
  }

  /**
   * Wrap an async function with rate limiting
   */
  wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: { wait?: boolean; maxWait?: number }
  ): Promise<T> {
    return this.limitAsync(key, options).then(() => fn());
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    const prefixedKey = `${this.keyPrefix}:${key}`;
    this.limiter.reset(prefixedKey);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.limiter.clear();
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      uniqueKeys: 0,
    };
    this.seenKeys.clear();
  }

  /**
   * Get current stats
   */
  getStats(): RateLimitStats {
    return { ...this.stats };
  }

  /**
   * Get configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.normalizedConfig };
  }
}

// ============================================================================
// Multi-tier Rate Limiter
// ============================================================================

export interface TierConfig {
  name: string;
  config: RateLimitConfig;
}

/**
 * Multi-tier rate limiter for different limit levels
 *
 * @example
 * const limiter = new MultiTierRateLimiter([
 *   { name: 'per-second', config: { maxRequests: 10, windowMs: 1000, algorithm: 'sliding-window' } },
 *   { name: 'per-minute', config: { maxRequests: 100, windowMs: 60000, algorithm: 'sliding-window' } },
 *   { name: 'per-hour', config: { maxRequests: 1000, windowMs: 3600000, algorithm: 'sliding-window' } },
 * ]);
 *
 * // All tiers must pass
 * limiter.limit('user:123');
 */
export class MultiTierRateLimiter {
  private tiers: Map<string, RateLimiter> = new Map();

  constructor(tiers: TierConfig[]) {
    for (const tier of tiers) {
      this.tiers.set(tier.name, new RateLimiter(tier.config));
    }
  }

  check(key: string): { allowed: boolean; failedTier?: string; result: RateLimitResult } {
    let finalResult: RateLimitResult = {
      allowed: true,
      remaining: Infinity,
      resetAt: 0,
    };

    for (const [name, limiter] of this.tiers) {
      const result = limiter.check(key);

      if (!result.allowed) {
        return { allowed: false, failedTier: name, result };
      }

      // Track the most restrictive limit
      if (result.remaining < finalResult.remaining) {
        finalResult = result;
      }
    }

    return { allowed: true, result: finalResult };
  }

  limit(key: string): void {
    const { allowed, failedTier, result } = this.check(key);
    if (!allowed) {
      throw new RateLimitError(
        `Rate limit exceeded (${failedTier}) for ${key}`,
        result.retryAfter ?? 0,
        key
      );
    }
  }

  reset(key: string): void {
    for (const limiter of this.tiers.values()) {
      limiter.reset(key);
    }
  }

  clear(): void {
    for (const limiter of this.tiers.values()) {
      limiter.clear();
    }
  }

  getStats(): Map<string, RateLimitStats> {
    const stats = new Map<string, RateLimitStats>();
    for (const [name, limiter] of this.tiers) {
      stats.set(name, limiter.getStats());
    }
    return stats;
  }
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Create a rate limiter for API requests
 */
export function createApiRateLimiter(
  requestsPerMinute: number
): RateLimiter {
  return new RateLimiter({
    maxRequests: requestsPerMinute,
    windowMs: 60 * 1000,
    algorithm: "sliding-window",
    keyPrefix: "api",
  });
}

/**
 * Create a rate limiter for LLM API calls
 */
export function createLLMRateLimiter(config?: {
  requestsPerMinute?: number;
  tokensPerMinute?: number;
}): MultiTierRateLimiter {
  return new MultiTierRateLimiter([
    {
      name: "requests",
      config: {
        maxRequests: config?.requestsPerMinute ?? 60,
        windowMs: 60 * 1000,
        algorithm: "sliding-window",
        keyPrefix: "llm-requests",
      },
    },
    {
      name: "tokens",
      config: {
        maxRequests: config?.tokensPerMinute ?? 100000,
        windowMs: 60 * 1000,
        algorithm: "sliding-window",
        keyPrefix: "llm-tokens",
      },
    },
  ]);
}

/**
 * Create rate limiter headers for HTTP responses
 */
export function createRateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfter && { "Retry-After": String(Math.ceil(result.retryAfter / 1000)) }),
  };
}
