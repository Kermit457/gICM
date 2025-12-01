/**
 * Cache Manager Implementation
 * Phase 9C: Advanced Caching Layer
 */

import { EventEmitter } from "eventemitter3";
import {
  CacheEntry,
  CacheEvents,
  CacheManagerConfig,
  CacheOptions,
  CacheResult,
  CacheStats,
  CacheStrategy,
  EvictionPolicy,
  TTL,
} from "./types.js";

// ============================================================================
// MEMORY CACHE (L1)
// ============================================================================

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = []; // For LRU
  private maxSize: number;
  private maxMemory: number;
  private evictionPolicy: EvictionPolicy;
  private currentMemory = 0;

  constructor(config: { maxSize: number; maxMemory: number; evictionPolicy: EvictionPolicy }) {
    this.maxSize = config.maxSize;
    this.maxMemory = config.maxMemory;
    this.evictionPolicy = config.evictionPolicy;
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (entry.metadata.expiresAt && Date.now() > entry.metadata.expiresAt) {
      this.delete(key);
      return undefined;
    }

    // Update access tracking
    entry.metadata.accessedAt = Date.now();
    entry.metadata.accessCount++;

    // Update LRU order
    const idx = this.accessOrder.indexOf(key);
    if (idx > -1) {
      this.accessOrder.splice(idx, 1);
    }
    this.accessOrder.push(key);

    return entry;
  }

  set(key: string, value: unknown, options?: CacheOptions): void {
    const size = this.estimateSize(value);

    // Evict if needed
    while (
      this.cache.size >= this.maxSize ||
      this.currentMemory + size > this.maxMemory
    ) {
      if (!this.evict()) break;
    }

    const now = Date.now();
    const entry: CacheEntry = {
      key,
      value,
      metadata: {
        createdAt: now,
        accessedAt: now,
        expiresAt: options?.ttl ? now + options.ttl * 1000 : undefined,
        ttl: options?.ttl,
        accessCount: 0,
        size,
        tags: options?.tags || [],
      },
    };

    // Remove old entry if exists
    const existing = this.cache.get(key);
    if (existing) {
      this.currentMemory -= existing.metadata.size || 0;
    }

    this.cache.set(key, entry);
    this.currentMemory += size;
    this.accessOrder.push(key);
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.currentMemory -= entry.metadata.size || 0;

    const idx = this.accessOrder.indexOf(key);
    if (idx > -1) {
      this.accessOrder.splice(idx, 1);
    }

    return true;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.metadata.expiresAt && Date.now() > entry.metadata.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentMemory = 0;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  memoryUsage(): number {
    return this.currentMemory;
  }

  deleteByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.tags.includes(tag)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  deleteByPattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  private evict(): boolean {
    if (this.cache.size === 0) return false;

    let keyToEvict: string | null = null;

    switch (this.evictionPolicy) {
      case "lru":
        keyToEvict = this.accessOrder[0] || null;
        break;

      case "lfu":
        let minAccess = Infinity;
        for (const [key, entry] of this.cache.entries()) {
          if (entry.metadata.accessCount < minAccess) {
            minAccess = entry.metadata.accessCount;
            keyToEvict = key;
          }
        }
        break;

      case "fifo":
        keyToEvict = this.cache.keys().next().value || null;
        break;

      case "ttl":
        let earliestExpiry = Infinity;
        for (const [key, entry] of this.cache.entries()) {
          const expiry = entry.metadata.expiresAt || Infinity;
          if (expiry < earliestExpiry) {
            earliestExpiry = expiry;
            keyToEvict = key;
          }
        }
        break;

      case "random":
        const keys = Array.from(this.cache.keys());
        keyToEvict = keys[Math.floor(Math.random() * keys.length)] || null;
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
      return true;
    }

    return false;
  }

  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate in bytes
    } catch {
      return 1024; // Default 1KB
    }
  }

  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.expiresAt && entry.metadata.expiresAt < now) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// ============================================================================
// REDIS CACHE (L2) - Mock implementation
// ============================================================================

class RedisCache {
  private connected = false;
  private prefix: string;
  private mockStorage: Map<string, { value: string; expiresAt?: number }> = new Map();

  constructor(config: { url: string; prefix: string }) {
    this.prefix = config.prefix;
    // In production, connect to actual Redis
    this.connected = true;
  }

  async get(key: string): Promise<string | null> {
    const prefixedKey = this.prefix + key;
    const entry = this.mockStorage.get(prefixedKey);

    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.mockStorage.delete(prefixedKey);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const prefixedKey = this.prefix + key;
    this.mockStorage.set(prefixedKey, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<boolean> {
    const prefixedKey = this.prefix + key;
    return this.mockStorage.delete(prefixedKey);
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const regex = new RegExp((this.prefix + pattern).replace(/\*/g, ".*"));
    let count = 0;

    for (const key of this.mockStorage.keys()) {
      if (regex.test(key)) {
        this.mockStorage.delete(key);
        count++;
      }
    }

    return count;
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async clear(): Promise<void> {
    for (const key of this.mockStorage.keys()) {
      if (key.startsWith(this.prefix)) {
        this.mockStorage.delete(key);
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

export class CacheManager extends EventEmitter<CacheEvents> {
  private config: CacheManagerConfig;
  private memory: MemoryCache;
  private redis?: RedisCache;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    latencies: [] as number[],
  };
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config: Partial<CacheManagerConfig> = {}) {
    super();

    this.config = {
      strategy: config.strategy || "memory",
      defaultTtl: config.defaultTtl || TTL.MEDIUM,
      memory: {
        maxSize: config.memory?.maxSize || 1000,
        maxMemory: config.memory?.maxMemory || 100 * 1024 * 1024,
        evictionPolicy: config.memory?.evictionPolicy || "lru",
        checkPeriod: config.memory?.checkPeriod || 60000,
      },
      redis: config.redis,
      compression: config.compression,
      metrics: config.metrics,
    };

    // Initialize L1 (memory)
    this.memory = new MemoryCache({
      maxSize: this.config.memory!.maxSize,
      maxMemory: this.config.memory!.maxMemory,
      evictionPolicy: this.config.memory!.evictionPolicy,
    });

    // Initialize L2 (Redis) if configured
    if (this.config.strategy === "redis" || this.config.strategy === "tiered") {
      this.redis = new RedisCache({
        url: this.config.redis?.url || "redis://localhost:6379",
        prefix: this.config.redis?.prefix || "gicm:cache:",
      });
    }

    // Start cleanup timer
    this.startCleanup();
  }

  // ==========================================================================
  // CORE OPERATIONS
  // ==========================================================================

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<CacheResult> {
    const start = Date.now();

    try {
      // Try L1 (memory) first
      if (this.config.strategy !== "redis") {
        const memEntry = this.memory.get(key);
        if (memEntry) {
          this.recordHit(key, "memory", start);
          return {
            hit: true,
            value: memEntry.value as T,
            source: "memory",
            stale: false,
            latencyMs: Date.now() - start,
          };
        }
      }

      // Try L2 (Redis)
      if (this.redis && this.config.strategy !== "memory") {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          const value = JSON.parse(redisValue);

          // Promote to L1 if tiered
          if (this.config.strategy === "tiered") {
            this.memory.set(key, value);
          }

          this.recordHit(key, "redis", start);
          return {
            hit: true,
            value: value as T,
            source: "redis",
            stale: false,
            latencyMs: Date.now() - start,
          };
        }
      }

      // Cache miss
      this.recordMiss(key, start);
      return {
        hit: false,
        source: "origin",
        stale: false,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      this.emit("error", error as Error);
      return {
        hit: false,
        source: "origin",
        stale: false,
        latencyMs: Date.now() - start,
      };
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ?? this.config.defaultTtl;

    try {
      // Set in L1 (memory)
      if (this.config.strategy !== "redis" && !options?.skipL1) {
        this.memory.set(key, value, { ...options, ttl });
      }

      // Set in L2 (Redis)
      if (this.redis && this.config.strategy !== "memory" && !options?.skipL2) {
        const serialized = JSON.stringify(value);
        await this.redis.set(key, serialized, ttl);
      }

      this.emit("set", key, ttl);
    } catch (error) {
      this.emit("error", error as Error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    let deleted = false;

    // Delete from L1
    if (this.memory.delete(key)) {
      deleted = true;
    }

    // Delete from L2
    if (this.redis) {
      if (await this.redis.delete(key)) {
        deleted = true;
      }
    }

    if (deleted) {
      this.emit("delete", key);
    }

    return deleted;
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    if (this.memory.has(key)) return true;
    if (this.redis) {
      return await this.redis.exists(key);
    }
    return false;
  }

  /**
   * Get or set with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const result = await this.get<T>(key);

    if (result.hit) {
      return result.value as T;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memory.clear();
    if (this.redis) {
      await this.redis.clear();
    }
  }

  // ==========================================================================
  // INVALIDATION
  // ==========================================================================

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    let count = this.memory.deleteByTag(tag);

    // Note: Redis tag invalidation requires additional data structure
    // In production, use Redis Sets to track tags

    this.emit("invalidate", `tag:${tag}`, count);
    return count;
  }

  /**
   * Invalidate by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    let count = this.memory.deleteByPattern(pattern);

    if (this.redis) {
      count += await this.redis.deleteByPattern(pattern);
    }

    this.emit("invalidate", pattern, count);
    return count;
  }

  /**
   * Invalidate multiple keys
   */
  async invalidateMany(keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (await this.delete(key)) {
        count++;
      }
    }
    return count;
  }

  // ==========================================================================
  // STATS & MONITORING
  // ==========================================================================

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const latencies = [...this.stats.latencies].sort((a, b) => a - b);

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      entries: this.memory.size(),
      memoryUsage: this.memory.memoryUsage(),
      evictions: this.stats.evictions,
      latency: {
        avg: latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : 0,
        p50: this.percentile(latencies, 50),
        p95: this.percentile(latencies, 95),
        p99: this.percentile(latencies, 99),
      },
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      latencies: [],
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Wrap a function with caching
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    keyFn: (...args: Parameters<T>) => string,
    options?: CacheOptions
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = keyFn(...args);
      return this.getOrSet(key, () => fn(...args), options);
    }) as T;
  }

  /**
   * Create a memoized version of a function
   */
  memoize<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    options?: CacheOptions & { keyPrefix?: string }
  ): T {
    const prefix = options?.keyPrefix || fn.name || "memo";

    return this.wrap(
      fn,
      (...args) => `${prefix}:${JSON.stringify(args)}`,
      options
    );
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private recordHit(key: string, source: "memory" | "redis", startTime: number): void {
    this.stats.hits++;
    this.recordLatency(startTime);
    this.emit("hit", key, source);
  }

  private recordMiss(key: string, startTime: number): void {
    this.stats.misses++;
    this.recordLatency(startTime);
    this.emit("miss", key);
  }

  private recordLatency(startTime: number): void {
    const latency = Date.now() - startTime;
    this.stats.latencies.push(latency);

    // Keep only last 1000 latencies
    if (this.stats.latencies.length > 1000) {
      this.stats.latencies.shift();
    }
  }

  private percentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, Math.min(idx, sortedArr.length - 1))];
  }

  private startCleanup(): void {
    const checkPeriod = this.config.memory?.checkPeriod || 60000;

    this.cleanupTimer = setInterval(() => {
      const cleaned = this.memory.cleanup();
      if (cleaned > 0) {
        this.stats.evictions += cleaned;
      }
    }, checkPeriod);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Stop the cache manager
   */
  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    if (this.redis) {
      await this.redis.disconnect();
      this.emit("disconnected", "redis");
    }
  }

  /**
   * Get current strategy
   */
  getStrategy(): CacheStrategy {
    return this.config.strategy;
  }

  /**
   * Check Redis connection
   */
  isRedisConnected(): boolean {
    return this.redis?.isConnected() ?? false;
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

export function createCacheManager(config?: Partial<CacheManagerConfig>): CacheManager {
  return new CacheManager(config);
}
