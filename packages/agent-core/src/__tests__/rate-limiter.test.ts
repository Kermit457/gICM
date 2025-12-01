import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  RateLimiter,
  RateLimitError,
  TokenBucketLimiter,
  SlidingWindowLimiter,
  FixedWindowLimiter,
  MultiTierRateLimiter,
  createApiRateLimiter,
  createLLMRateLimiter,
  createRateLimitHeaders,
} from "../security/rate-limiter.js";

describe("TokenBucketLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within bucket capacity", () => {
    const limiter = new TokenBucketLimiter({
      maxRequests: 10,
      windowMs: 1000,
      algorithm: "token-bucket",
    });

    const result = limiter.check("user:1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(9);
  });

  it("blocks requests when bucket is empty", () => {
    const limiter = new TokenBucketLimiter({
      maxRequests: 2,
      windowMs: 1000,
      algorithm: "token-bucket",
    });

    limiter.check("user:1");
    limiter.check("user:1");
    const result = limiter.check("user:1");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("refills tokens over time", () => {
    const limiter = new TokenBucketLimiter({
      maxRequests: 10,
      windowMs: 1000,
      algorithm: "token-bucket",
    });

    // Use all tokens
    for (let i = 0; i < 10; i++) {
      limiter.check("user:1");
    }

    // Should be blocked
    expect(limiter.check("user:1").allowed).toBe(false);

    // Advance time
    vi.advanceTimersByTime(500);

    // Should have some tokens now
    const result = limiter.check("user:1");
    expect(result.allowed).toBe(true);
  });

  it("respects burst size", () => {
    const limiter = new TokenBucketLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "token-bucket",
      burstSize: 3,
    });

    // Only 3 allowed initially (burst size)
    expect(limiter.check("user:1").allowed).toBe(true);
    expect(limiter.check("user:1").allowed).toBe(true);
    expect(limiter.check("user:1").allowed).toBe(true);
    expect(limiter.check("user:1").allowed).toBe(false);
  });

  it("isolates keys", () => {
    const limiter = new TokenBucketLimiter({
      maxRequests: 2,
      windowMs: 1000,
      algorithm: "token-bucket",
    });

    limiter.check("user:1");
    limiter.check("user:1");
    expect(limiter.check("user:1").allowed).toBe(false);

    // Different key should still work
    expect(limiter.check("user:2").allowed).toBe(true);
  });

  it("reset clears bucket for key", () => {
    const limiter = new TokenBucketLimiter({
      maxRequests: 2,
      windowMs: 1000,
      algorithm: "token-bucket",
    });

    limiter.check("user:1");
    limiter.check("user:1");
    expect(limiter.check("user:1").allowed).toBe(false);

    limiter.reset("user:1");
    expect(limiter.check("user:1").allowed).toBe(true);
  });

  it("clear removes all buckets", () => {
    const limiter = new TokenBucketLimiter({
      maxRequests: 1,
      windowMs: 1000,
      algorithm: "token-bucket",
    });

    limiter.check("user:1");
    limiter.check("user:2");

    limiter.clear();

    expect(limiter.check("user:1").allowed).toBe(true);
    expect(limiter.check("user:2").allowed).toBe(true);
  });
});

describe("SlidingWindowLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within window limit", () => {
    const limiter = new SlidingWindowLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    for (let i = 0; i < 5; i++) {
      expect(limiter.check("key").allowed).toBe(true);
    }
  });

  it("blocks requests exceeding window limit", () => {
    const limiter = new SlidingWindowLimiter({
      maxRequests: 3,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    limiter.check("key");
    limiter.check("key");
    limiter.check("key");

    const result = limiter.check("key");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("allows requests after window slides", () => {
    const limiter = new SlidingWindowLimiter({
      maxRequests: 2,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    limiter.check("key");
    limiter.check("key");
    expect(limiter.check("key").allowed).toBe(false);

    // Advance past window
    vi.advanceTimersByTime(1001);

    expect(limiter.check("key").allowed).toBe(true);
  });

  it("supports weighted requests", () => {
    const limiter = new SlidingWindowLimiter({
      maxRequests: 10,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    // Use 8 of 10
    limiter.check("key", 8);

    // Should allow 2 more
    expect(limiter.check("key", 2).allowed).toBe(true);

    // Should block 1 more
    expect(limiter.check("key", 1).allowed).toBe(false);
  });

  it("cleanup removes expired entries", () => {
    const limiter = new SlidingWindowLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    limiter.check("key1");
    limiter.check("key2");

    vi.advanceTimersByTime(2000);

    limiter.cleanup();

    // Keys should be removed, fresh start
    expect(limiter.check("key1").remaining).toBe(4);
  });
});

describe("FixedWindowLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within fixed window", () => {
    const limiter = new FixedWindowLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "fixed-window",
    });

    for (let i = 0; i < 5; i++) {
      expect(limiter.check("key").allowed).toBe(true);
    }
  });

  it("blocks requests exceeding fixed window limit", () => {
    const limiter = new FixedWindowLimiter({
      maxRequests: 2,
      windowMs: 1000,
      algorithm: "fixed-window",
    });

    limiter.check("key");
    limiter.check("key");

    const result = limiter.check("key");
    expect(result.allowed).toBe(false);
  });

  it("resets at window boundary", () => {
    const limiter = new FixedWindowLimiter({
      maxRequests: 2,
      windowMs: 1000,
      algorithm: "fixed-window",
    });

    limiter.check("key");
    limiter.check("key");
    expect(limiter.check("key").allowed).toBe(false);

    // Advance to next window
    vi.advanceTimersByTime(1000);

    expect(limiter.check("key").allowed).toBe(true);
  });

  it("supports weighted requests", () => {
    const limiter = new FixedWindowLimiter({
      maxRequests: 10,
      windowMs: 1000,
      algorithm: "fixed-window",
    });

    limiter.check("key", 7);
    expect(limiter.check("key", 3).allowed).toBe(true);
    expect(limiter.check("key", 1).allowed).toBe(false);
  });
});

describe("RateLimiter (unified interface)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses sliding window by default", () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    });

    expect(limiter.getConfig().algorithm).toBe("sliding-window");
  });

  it("check returns rate limit result", () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    const result = limiter.check("user:1");

    expect(result).toHaveProperty("allowed");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("resetAt");
  });

  it("limit throws RateLimitError when exceeded", () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    limiter.limit("user:1");

    expect(() => limiter.limit("user:1")).toThrow(RateLimitError);
  });

  it("RateLimitError contains retry information", () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    limiter.limit("user:1");

    try {
      limiter.limit("user:1");
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).retryAfter).toBeGreaterThanOrEqual(0);
      expect((e as RateLimitError).key).toBe("user:1");
    }
  });

  it("limitAsync resolves when allowed", async () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    const result = await limiter.limitAsync("user:1");
    expect(result.allowed).toBe(true);
  });

  it("limitAsync throws when exceeded without wait", async () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    await limiter.limitAsync("user:1");
    await expect(limiter.limitAsync("user:1")).rejects.toThrow(RateLimitError);
  });

  it("limitAsync waits when wait option is true", async () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 100,
      algorithm: "sliding-window",
    });

    await limiter.limitAsync("user:1");

    // Start waiting
    const waitPromise = limiter.limitAsync("user:1", { wait: true });

    // Advance time
    vi.advanceTimersByTime(101);

    const result = await waitPromise;
    expect(result.allowed).toBe(true);
  });

  it("wrap executes function when allowed", async () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    const result = await limiter.wrap("user:1", async () => "success");
    expect(result).toBe("success");
  });

  it("wrap rejects when rate limited", async () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    await limiter.wrap("user:1", async () => "first");
    await expect(limiter.wrap("user:1", async () => "second")).rejects.toThrow(
      RateLimitError
    );
  });

  it("tracks statistics", () => {
    const limiter = new RateLimiter({
      maxRequests: 2,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    limiter.check("user:1");
    limiter.check("user:1");
    limiter.check("user:1"); // blocked
    limiter.check("user:2");

    const stats = limiter.getStats();
    expect(stats.totalRequests).toBe(4);
    expect(stats.allowedRequests).toBe(3);
    expect(stats.blockedRequests).toBe(1);
    expect(stats.uniqueKeys).toBe(2);
  });

  it("reset clears limit for key", () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    limiter.check("user:1");
    expect(limiter.check("user:1").allowed).toBe(false);

    limiter.reset("user:1");
    expect(limiter.check("user:1").allowed).toBe(true);
  });

  it("clear resets everything", () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
      algorithm: "sliding-window",
    });

    limiter.check("user:1");
    limiter.check("user:2");

    limiter.clear();

    expect(limiter.check("user:1").allowed).toBe(true);
    expect(limiter.check("user:2").allowed).toBe(true);
    expect(limiter.getStats().totalRequests).toBe(2); // Only new requests counted
  });

  it("respects key prefix", () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "sliding-window",
      keyPrefix: "custom",
    });

    expect(limiter.getConfig().keyPrefix).toBe("custom");
  });

  it("supports token bucket algorithm", () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "token-bucket",
    });

    expect(limiter.getConfig().algorithm).toBe("token-bucket");
    expect(limiter.check("user:1").allowed).toBe(true);
  });

  it("supports fixed window algorithm", () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
      algorithm: "fixed-window",
    });

    expect(limiter.getConfig().algorithm).toBe("fixed-window");
    expect(limiter.check("user:1").allowed).toBe(true);
  });
});

describe("MultiTierRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("checks all tiers", () => {
    const limiter = new MultiTierRateLimiter([
      {
        name: "per-second",
        config: { maxRequests: 2, windowMs: 1000, algorithm: "sliding-window" },
      },
      {
        name: "per-minute",
        config: { maxRequests: 10, windowMs: 60000, algorithm: "sliding-window" },
      },
    ]);

    const result = limiter.check("user:1");
    expect(result.allowed).toBe(true);
  });

  it("fails when any tier is exceeded", () => {
    const limiter = new MultiTierRateLimiter([
      {
        name: "per-second",
        config: { maxRequests: 2, windowMs: 1000, algorithm: "sliding-window" },
      },
      {
        name: "per-minute",
        config: { maxRequests: 100, windowMs: 60000, algorithm: "sliding-window" },
      },
    ]);

    limiter.check("user:1");
    limiter.check("user:1");

    const result = limiter.check("user:1");
    expect(result.allowed).toBe(false);
    expect(result.failedTier).toBe("per-second");
  });

  it("limit throws with tier info", () => {
    const limiter = new MultiTierRateLimiter([
      {
        name: "strict",
        config: { maxRequests: 1, windowMs: 1000, algorithm: "sliding-window" },
      },
    ]);

    limiter.limit("user:1");

    expect(() => limiter.limit("user:1")).toThrow(/strict/);
  });

  it("reset clears all tiers", () => {
    const limiter = new MultiTierRateLimiter([
      {
        name: "tier1",
        config: { maxRequests: 1, windowMs: 1000, algorithm: "sliding-window" },
      },
      {
        name: "tier2",
        config: { maxRequests: 1, windowMs: 1000, algorithm: "sliding-window" },
      },
    ]);

    limiter.check("user:1");
    expect(limiter.check("user:1").allowed).toBe(false);

    limiter.reset("user:1");
    expect(limiter.check("user:1").allowed).toBe(true);
  });

  it("clear resets all tiers", () => {
    const limiter = new MultiTierRateLimiter([
      {
        name: "tier1",
        config: { maxRequests: 1, windowMs: 1000, algorithm: "sliding-window" },
      },
    ]);

    limiter.check("user:1");
    limiter.check("user:2");

    limiter.clear();

    expect(limiter.check("user:1").allowed).toBe(true);
    expect(limiter.check("user:2").allowed).toBe(true);
  });

  it("getStats returns stats for all tiers", () => {
    const limiter = new MultiTierRateLimiter([
      {
        name: "tier1",
        config: { maxRequests: 5, windowMs: 1000, algorithm: "sliding-window" },
      },
      {
        name: "tier2",
        config: { maxRequests: 10, windowMs: 60000, algorithm: "sliding-window" },
      },
    ]);

    limiter.check("user:1");

    const stats = limiter.getStats();
    expect(stats.has("tier1")).toBe(true);
    expect(stats.has("tier2")).toBe(true);
  });
});

describe("createApiRateLimiter", () => {
  it("creates limiter with correct config", () => {
    const limiter = createApiRateLimiter(100);

    const config = limiter.getConfig();
    expect(config.maxRequests).toBe(100);
    expect(config.windowMs).toBe(60000);
    expect(config.algorithm).toBe("sliding-window");
    expect(config.keyPrefix).toBe("api");
  });
});

describe("createLLMRateLimiter", () => {
  it("creates multi-tier limiter with defaults", () => {
    const limiter = createLLMRateLimiter();

    const stats = limiter.getStats();
    expect(stats.has("requests")).toBe(true);
    expect(stats.has("tokens")).toBe(true);
  });

  it("respects custom config", () => {
    const limiter = createLLMRateLimiter({
      requestsPerMinute: 30,
      tokensPerMinute: 50000,
    });

    // Should work with custom limits
    expect(limiter.check("user:1").allowed).toBe(true);
  });
});

describe("createRateLimitHeaders", () => {
  it("creates standard rate limit headers", () => {
    const result = {
      allowed: true,
      remaining: 95,
      resetAt: Date.now() + 60000,
    };

    const headers = createRateLimitHeaders(result, 100);

    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBe("95");
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
  });

  it("includes Retry-After when rate limited", () => {
    const result = {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
      retryAfter: 30000,
    };

    const headers = createRateLimitHeaders(result, 100);

    expect(headers["Retry-After"]).toBe("30");
  });

  it("omits Retry-After when allowed", () => {
    const result = {
      allowed: true,
      remaining: 50,
      resetAt: Date.now() + 60000,
    };

    const headers = createRateLimitHeaders(result, 100);

    expect(headers["Retry-After"]).toBeUndefined();
  });
});
