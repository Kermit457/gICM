/**
 * Rate Limiter Implementation
 * Phase 13B: Rate Limiting
 */

import { EventEmitter } from "eventemitter3";
import {
  type RateLimiterConfig,
  RateLimiterConfigSchema,
  type RateLimitRule,
  type RateLimitRequest,
  type RateLimitResult,
  type RateLimitStats,
  type LimiterState,
  type TokenBucketState,
  type SlidingWindowState,
  type FixedWindowState,
  type LeakyBucketState,
  type AlgorithmConfig,
  type RateLimitEvents,
  type RateLimitStorage,
  type RateLimitQueue,
} from "./types.js";

// =============================================================================
// Errors
// =============================================================================

export class RateLimitExceededError extends Error {
  constructor(
    public readonly key: string,
    public readonly result: RateLimitResult
  ) {
    super(`Rate limit exceeded for ${key}`);
    this.name = "RateLimitExceededError";
  }
}

// =============================================================================
// In-Memory Storage
// =============================================================================

class MemoryStorage implements RateLimitStorage {
  private store = new Map<string, { state: LimiterState; expiresAt?: number }>();

  async get(key: string): Promise<LimiterState | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.state;
  }

  async set(key: string, state: LimiterState, ttlMs?: number): Promise<void> {
    this.store.set(key, {
      state,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async increment(_key: string, _field: string, _amount: number): Promise<number> {
    // Not used for in-memory storage
    return 0;
  }

  async getMulti(keys: string[]): Promise<Map<string, LimiterState>> {
    const result = new Map<string, LimiterState>();
    for (const key of keys) {
      const state = await this.get(key);
      if (state) result.set(key, state);
    }
    return result;
  }

  async setMulti(entries: Map<string, LimiterState>, ttlMs?: number): Promise<void> {
    for (const [key, state] of entries) {
      await this.set(key, state, ttlMs);
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// =============================================================================
// In-Memory Queue
// =============================================================================

class MemoryQueue implements RateLimitQueue {
  private queues = new Map<string, RateLimitRequest[]>();

  async enqueue(key: string, request: RateLimitRequest): Promise<number> {
    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }
    const queue = this.queues.get(key)!;
    queue.push(request);
    return queue.length;
  }

  async dequeue(key: string): Promise<RateLimitRequest | null> {
    const queue = this.queues.get(key);
    if (!queue || queue.length === 0) return null;
    return queue.shift()!;
  }

  async peek(key: string): Promise<RateLimitRequest | null> {
    const queue = this.queues.get(key);
    if (!queue || queue.length === 0) return null;
    return queue[0];
  }

  async size(key: string): Promise<number> {
    return this.queues.get(key)?.length ?? 0;
  }

  async clear(key: string): Promise<void> {
    this.queues.delete(key);
  }
}

// =============================================================================
// Algorithm Implementations
// =============================================================================

function processTokenBucket(
  state: TokenBucketState | null,
  config: AlgorithmConfig & { algorithm: "token_bucket" },
  cost: number,
  now: number
): { newState: TokenBucketState; result: RateLimitResult } {
  // Initialize state if needed
  if (!state) {
    state = {
      algorithm: "token_bucket",
      tokens: config.capacity,
      lastRefill: now,
    };
  }

  // Calculate tokens to add based on time elapsed
  const elapsed = now - state.lastRefill;
  const tokensToAdd = Math.floor(elapsed / config.refillIntervalMs) * config.refillRate;
  const newTokens = Math.min(config.capacity, state.tokens + tokensToAdd);
  const lastRefill = tokensToAdd > 0 ? now : state.lastRefill;

  // Check if we can consume
  const allowed = newTokens >= cost;
  const remaining = allowed ? newTokens - cost : newTokens;

  // Calculate reset time (when bucket will be full again)
  const tokensNeeded = config.capacity - remaining;
  const intervalsNeeded = Math.ceil(tokensNeeded / config.refillRate);
  const resetMs = intervalsNeeded * config.refillIntervalMs;

  return {
    newState: {
      algorithm: "token_bucket",
      tokens: allowed ? remaining : newTokens,
      lastRefill,
    },
    result: {
      allowed,
      remaining: Math.floor(remaining),
      limit: config.capacity,
      resetMs,
      retryAfterMs: allowed ? undefined : Math.ceil((cost - newTokens) / config.refillRate * config.refillIntervalMs),
    },
  };
}

function processSlidingWindow(
  state: SlidingWindowState | null,
  config: AlgorithmConfig & { algorithm: "sliding_window" },
  cost: number,
  now: number
): { newState: SlidingWindowState; result: RateLimitResult } {
  const subWindowMs = config.windowMs / config.precision;

  // Initialize state if needed
  if (!state) {
    state = {
      algorithm: "sliding_window",
      windows: [],
    };
  }

  // Clean up old windows
  const windowStart = now - config.windowMs;
  const windows = state.windows.filter(w => w.start >= windowStart);

  // Calculate current count with weighted average
  let currentCount = 0;
  for (const window of windows) {
    const age = now - window.start;
    const weight = 1 - (age / config.windowMs);
    currentCount += window.count * weight;
  }

  // Check if we can add
  const allowed = currentCount + cost <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentCount - (allowed ? cost : 0));

  // Add to current sub-window if allowed
  if (allowed) {
    const currentSubWindow = Math.floor(now / subWindowMs) * subWindowMs;
    const existingWindow = windows.find(w => w.start === currentSubWindow);
    if (existingWindow) {
      existingWindow.count += cost;
    } else {
      windows.push({ start: currentSubWindow, count: cost });
    }
  }

  // Calculate reset time (when oldest relevant request will expire)
  const oldestWindow = windows.length > 0 ? Math.min(...windows.map(w => w.start)) : now;
  const resetMs = Math.max(0, (oldestWindow + config.windowMs) - now);

  return {
    newState: {
      algorithm: "sliding_window",
      windows,
    },
    result: {
      allowed,
      remaining: Math.floor(remaining),
      limit: config.maxRequests,
      resetMs,
      retryAfterMs: allowed ? undefined : resetMs,
    },
  };
}

function processFixedWindow(
  state: FixedWindowState | null,
  config: AlgorithmConfig & { algorithm: "fixed_window" },
  cost: number,
  now: number
): { newState: FixedWindowState; result: RateLimitResult } {
  const currentWindow = Math.floor(now / config.windowMs) * config.windowMs;

  // Initialize or reset state if needed
  if (!state || state.windowStart !== currentWindow) {
    state = {
      algorithm: "fixed_window",
      windowStart: currentWindow,
      count: 0,
    };
  }

  // Check if we can add
  const allowed = state.count + cost <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - state.count - (allowed ? cost : 0));
  const resetMs = (currentWindow + config.windowMs) - now;

  return {
    newState: {
      algorithm: "fixed_window",
      windowStart: currentWindow,
      count: allowed ? state.count + cost : state.count,
    },
    result: {
      allowed,
      remaining: Math.floor(remaining),
      limit: config.maxRequests,
      resetMs,
      retryAfterMs: allowed ? undefined : resetMs,
    },
  };
}

function processLeakyBucket(
  state: LeakyBucketState | null,
  config: AlgorithmConfig & { algorithm: "leaky_bucket" },
  cost: number,
  now: number
): { newState: LeakyBucketState; result: RateLimitResult } {
  // Initialize state if needed
  if (!state) {
    state = {
      algorithm: "leaky_bucket",
      level: 0,
      lastLeak: now,
    };
  }

  // Calculate leaked amount based on time elapsed
  const elapsed = now - state.lastLeak;
  const leaked = Math.floor(elapsed / config.leakIntervalMs) * config.leakRate;
  const newLevel = Math.max(0, state.level - leaked);
  const lastLeak = leaked > 0 ? now : state.lastLeak;

  // Check if we can add
  const allowed = newLevel + cost <= config.capacity;
  const remaining = Math.max(0, config.capacity - newLevel - (allowed ? cost : 0));

  // Calculate reset time (when bucket will be empty)
  const intervalsToEmpty = Math.ceil(newLevel / config.leakRate);
  const resetMs = intervalsToEmpty * config.leakIntervalMs;

  return {
    newState: {
      algorithm: "leaky_bucket",
      level: allowed ? newLevel + cost : newLevel,
      lastLeak,
    },
    result: {
      allowed,
      remaining: Math.floor(remaining),
      limit: config.capacity,
      resetMs,
      retryAfterMs: allowed ? undefined : Math.ceil((newLevel + cost - config.capacity) / config.leakRate * config.leakIntervalMs),
    },
  };
}

// =============================================================================
// Rate Limiter
// =============================================================================

export class RateLimiter extends EventEmitter<RateLimitEvents> {
  private config: RateLimiterConfig;
  private storage: RateLimitStorage;
  private queue: RateLimitQueue;
  private stats = new Map<string, RateLimitStats>();
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    super();
    this.config = RateLimiterConfigSchema.parse(config);
    this.storage = new MemoryStorage();
    this.queue = new MemoryQueue();

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      if (this.storage instanceof MemoryStorage) {
        this.storage.cleanup();
      }
      this.cleanupStats();
    }, 60000); // Every minute
  }

  // ---------------------------------------------------------------------------
  // Core Methods
  // ---------------------------------------------------------------------------

  async check(request: RateLimitRequest): Promise<RateLimitResult> {
    const now = request.timestamp ?? Date.now();
    const rule = this.findMatchingRule(request);
    const config = rule?.config ?? this.config.defaultRule;

    if (!config) {
      // No rate limiting configured
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetMs: 0,
      };
    }

    const stateKey = this.getStateKey(request.key, rule?.id);
    const currentState = await this.storage.get(stateKey);

    const { newState, result } = this.processRequest(currentState, config, request.cost, now);

    // Update state
    await this.storage.set(stateKey, newState, this.getStateTTL(config));

    // Add rule info to result
    result.rule = rule?.id;

    // Update stats
    if (this.config.enableStats) {
      this.updateStats(request.key, rule?.id ?? "default", result);
    }

    // Emit events
    if (result.allowed) {
      this.emit("allowed", request.key, result);
    } else {
      this.emit("rejected", request.key, result);
      this.emit("limitReached", request.key, rule?.id ?? "default");
    }

    if (rule) {
      this.emit("ruleMatched", request.key, rule.id);
    }

    return result;
  }

  async consume(request: RateLimitRequest): Promise<RateLimitResult> {
    const result = await this.check(request);

    if (!result.allowed) {
      const rule = this.findMatchingRule(request);

      if (rule?.actions.onLimit === "queue" && this.config.queueConfig) {
        const queueKey = `queue:${request.key}`;
        const position = await this.queue.enqueue(queueKey, request);

        if (position <= this.config.queueConfig.maxSize) {
          this.emit("queued", request.key, position);
          return {
            ...result,
            queuePosition: position,
          };
        }
      }

      throw new RateLimitExceededError(request.key, result);
    }

    return result;
  }

  async acquire(request: RateLimitRequest): Promise<RateLimitResult> {
    return this.consume(request);
  }

  // ---------------------------------------------------------------------------
  // Rule Management
  // ---------------------------------------------------------------------------

  addRule(rule: RateLimitRule): void {
    const existing = this.config.rules.findIndex(r => r.id === rule.id);
    if (existing >= 0) {
      this.config.rules[existing] = rule;
      this.emit("ruleUpdated", rule);
    } else {
      this.config.rules.push(rule);
      this.config.rules.sort((a, b) => b.priority - a.priority);
      this.emit("ruleAdded", rule);
    }
  }

  removeRule(ruleId: string): boolean {
    const index = this.config.rules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.config.rules.splice(index, 1);
      this.emit("ruleRemoved", ruleId);
      return true;
    }
    return false;
  }

  getRule(ruleId: string): RateLimitRule | undefined {
    return this.config.rules.find(r => r.id === ruleId);
  }

  getRules(): RateLimitRule[] {
    return [...this.config.rules];
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  getStats(key?: string): RateLimitStats[] {
    if (key) {
      const stat = this.stats.get(key);
      return stat ? [stat] : [];
    }
    return Array.from(this.stats.values());
  }

  resetStats(key?: string): void {
    if (key) {
      this.stats.delete(key);
    } else {
      this.stats.clear();
    }
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  async reset(key: string, ruleId?: string): Promise<void> {
    const stateKey = this.getStateKey(key, ruleId);
    await this.storage.delete(stateKey);
    this.emit("limitReset", key, ruleId ?? "default");
  }

  async getState(key: string, ruleId?: string): Promise<LimiterState | null> {
    const stateKey = this.getStateKey(key, ruleId);
    return this.storage.get(stateKey);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.removeAllListeners();
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private findMatchingRule(request: RateLimitRequest): RateLimitRule | undefined {
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;

      // Check path match
      if (rule.match.path && request.path) {
        if (!this.matchPath(request.path, rule.match.path)) continue;
      }

      // Check method match
      if (rule.match.method && request.method) {
        if (!rule.match.method.includes(request.method.toUpperCase())) continue;
      }

      // Check client ID match
      if (rule.match.clientId && request.clientId) {
        if (rule.match.clientId !== request.clientId) continue;
      }

      // Check tags match
      if (rule.match.tags && request.tags) {
        const hasAllTags = rule.match.tags.every(t => request.tags!.includes(t));
        if (!hasAllTags) continue;
      }

      // Check headers match
      if (rule.match.headers && request.headers) {
        const headersMatch = Object.entries(rule.match.headers).every(
          ([key, value]) => request.headers![key] === value
        );
        if (!headersMatch) continue;
      }

      return rule;
    }
    return undefined;
  }

  private matchPath(path: string, pattern: string): boolean {
    // Simple glob matching
    const regex = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${regex}$`).test(path);
  }

  private getStateKey(key: string, ruleId?: string): string {
    return ruleId ? `${key}:${ruleId}` : key;
  }

  private getStateTTL(config: AlgorithmConfig): number {
    switch (config.algorithm) {
      case "token_bucket":
        return config.refillIntervalMs * Math.ceil(config.capacity / config.refillRate) * 2;
      case "sliding_window":
        return config.windowMs * 2;
      case "fixed_window":
        return config.windowMs * 2;
      case "leaky_bucket":
        return config.leakIntervalMs * Math.ceil(config.capacity / config.leakRate) * 2;
    }
  }

  private processRequest(
    state: LimiterState | null,
    config: AlgorithmConfig,
    cost: number,
    now: number
  ): { newState: LimiterState; result: RateLimitResult } {
    switch (config.algorithm) {
      case "token_bucket":
        return processTokenBucket(
          state as TokenBucketState | null,
          config,
          cost,
          now
        );
      case "sliding_window":
        return processSlidingWindow(
          state as SlidingWindowState | null,
          config,
          cost,
          now
        );
      case "fixed_window":
        return processFixedWindow(
          state as FixedWindowState | null,
          config,
          cost,
          now
        );
      case "leaky_bucket":
        return processLeakyBucket(
          state as LeakyBucketState | null,
          config,
          cost,
          now
        );
    }
  }

  private updateStats(key: string, ruleId: string, result: RateLimitResult): void {
    const statsKey = `${key}:${ruleId}`;
    let stat = this.stats.get(statsKey);

    if (!stat) {
      stat = {
        key,
        rule: ruleId,
        totalRequests: 0,
        allowedRequests: 0,
        rejectedRequests: 0,
        queuedRequests: 0,
        averageWaitMs: 0,
        peakUsage: 0,
        lastRequest: Date.now(),
      };
      this.stats.set(statsKey, stat);
    }

    stat.totalRequests++;
    if (result.allowed) {
      stat.allowedRequests++;
    } else {
      stat.rejectedRequests++;
    }
    if (result.queuePosition) {
      stat.queuedRequests++;
    }
    stat.lastRequest = Date.now();

    // Calculate peak usage
    const usage = 1 - (result.remaining / result.limit);
    if (usage > stat.peakUsage) {
      stat.peakUsage = usage;
    }
  }

  private cleanupStats(): void {
    const cutoff = Date.now() - this.config.statsRetentionMs;
    for (const [key, stat] of this.stats) {
      if (stat.lastRequest < cutoff) {
        this.stats.delete(key);
      }
    }
  }
}

// =============================================================================
// Rate Limiter Registry
// =============================================================================

export class RateLimiterRegistry {
  private limiters = new Map<string, RateLimiter>();

  create(name: string, config: Partial<RateLimiterConfig> = {}): RateLimiter {
    if (this.limiters.has(name)) {
      throw new Error(`Rate limiter '${name}' already exists`);
    }

    const limiter = new RateLimiter(config);
    this.limiters.set(name, limiter);
    return limiter;
  }

  get(name: string): RateLimiter | undefined {
    return this.limiters.get(name);
  }

  getOrCreate(name: string, config: Partial<RateLimiterConfig> = {}): RateLimiter {
    const existing = this.limiters.get(name);
    if (existing) return existing;
    return this.create(name, config);
  }

  remove(name: string): boolean {
    const limiter = this.limiters.get(name);
    if (limiter) {
      limiter.destroy();
      this.limiters.delete(name);
      return true;
    }
    return false;
  }

  list(): string[] {
    return Array.from(this.limiters.keys());
  }

  destroy(): void {
    for (const limiter of this.limiters.values()) {
      limiter.destroy();
    }
    this.limiters.clear();
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultRegistry: RateLimiterRegistry | null = null;

export function getRateLimiterRegistry(): RateLimiterRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new RateLimiterRegistry();
  }
  return defaultRegistry;
}

export function createRateLimiterRegistry(): RateLimiterRegistry {
  return new RateLimiterRegistry();
}

export function createRateLimiter(config: Partial<RateLimiterConfig> = {}): RateLimiter {
  return new RateLimiter(config);
}

// =============================================================================
// Decorator / Wrapper
// =============================================================================

export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  limiter: RateLimiter,
  keyFn: (...args: Parameters<T>) => string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args);
    await limiter.acquire({ key });
    return fn(...args);
  }) as T;
}

// =============================================================================
// Presets
// =============================================================================

export const RATE_LIMIT_PRESETS = {
  api: {
    algorithm: "token_bucket" as const,
    capacity: 100,
    refillRate: 10,
    refillIntervalMs: 1000,
  },
  burst: {
    algorithm: "token_bucket" as const,
    capacity: 50,
    refillRate: 1,
    refillIntervalMs: 1000,
  },
  strict: {
    algorithm: "fixed_window" as const,
    windowMs: 60000,
    maxRequests: 60,
  },
  smooth: {
    algorithm: "leaky_bucket" as const,
    capacity: 100,
    leakRate: 10,
    leakIntervalMs: 1000,
  },
} as const;
