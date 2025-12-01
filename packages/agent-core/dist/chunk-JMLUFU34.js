import {
  __require
} from "./chunk-DGUM43GV.js";

// src/security/secrets.ts
import { z } from "zod";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
var SecretMetadataSchema = z.object({
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  expiresAt: z.number().optional(),
  rotationDue: z.number().optional(),
  tags: z.array(z.string()).optional(),
  version: z.number().default(1)
});
var EnvSecretBackend = class {
  name = "env";
  prefix;
  constructor(prefix = "") {
    this.prefix = prefix;
  }
  getEnvKey(key) {
    const normalized = key.toUpperCase().replace(/[.-]/g, "_");
    return this.prefix ? `${this.prefix}_${normalized}` : normalized;
  }
  async get(key) {
    return process.env[this.getEnvKey(key)] ?? null;
  }
  async set(key, value) {
    process.env[this.getEnvKey(key)] = value;
  }
  async delete(key) {
    const envKey = this.getEnvKey(key);
    if (process.env[envKey]) {
      delete process.env[envKey];
      return true;
    }
    return false;
  }
  async list() {
    const keys = [];
    const prefixLen = this.prefix ? this.prefix.length + 1 : 0;
    for (const key of Object.keys(process.env)) {
      if (!this.prefix || key.startsWith(`${this.prefix}_`)) {
        keys.push(key.slice(prefixLen).toLowerCase().replace(/_/g, "-"));
      }
    }
    return keys;
  }
  async exists(key) {
    return this.getEnvKey(key) in process.env;
  }
};
var MemorySecretBackend = class {
  name = "memory";
  secrets = /* @__PURE__ */ new Map();
  key;
  constructor(encryptionKey) {
    this.key = encryptionKey ? Buffer.from(encryptionKey, "hex") : randomBytes(32);
    if (this.key.length !== 32) {
      throw new Error("Encryption key must be 32 bytes (64 hex characters)");
    }
  }
  encrypt(value) {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final()
    ]);
    return { encrypted, iv };
  }
  decrypt(encrypted, iv) {
    const decipher = createDecipheriv("aes-256-cbc", this.key, iv);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString("utf8");
  }
  async get(key) {
    const secret = this.secrets.get(key);
    if (!secret) return null;
    if (secret.metadata.expiresAt && Date.now() > secret.metadata.expiresAt) {
      this.secrets.delete(key);
      return null;
    }
    return this.decrypt(secret.encrypted, secret.iv);
  }
  async set(key, value, metadata) {
    const existing = this.secrets.get(key);
    const { encrypted, iv } = this.encrypt(value);
    const now = Date.now();
    const fullMetadata = {
      name: key,
      createdAt: existing?.metadata.createdAt ?? now,
      updatedAt: now,
      version: (existing?.metadata.version ?? 0) + 1,
      ...metadata
    };
    this.secrets.set(key, { encrypted, iv, metadata: fullMetadata });
  }
  async delete(key) {
    return this.secrets.delete(key);
  }
  async list() {
    return Array.from(this.secrets.keys());
  }
  async exists(key) {
    return this.secrets.has(key);
  }
  getMetadata(key) {
    return this.secrets.get(key)?.metadata ?? null;
  }
};
var CompositeSecretBackend = class {
  name = "composite";
  backends;
  constructor(backends) {
    this.backends = backends;
  }
  async get(key) {
    for (const backend of this.backends) {
      const value = await backend.get(key);
      if (value !== null) {
        return value;
      }
    }
    return null;
  }
  async set(key, value, metadata) {
    if (this.backends.length > 0) {
      await this.backends[0].set(key, value, metadata);
    }
  }
  async delete(key) {
    let deleted = false;
    for (const backend of this.backends) {
      if (await backend.delete(key)) {
        deleted = true;
      }
    }
    return deleted;
  }
  async list() {
    const keys = /* @__PURE__ */ new Set();
    for (const backend of this.backends) {
      for (const key of await backend.list()) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  }
  async exists(key) {
    for (const backend of this.backends) {
      if (await backend.exists(key)) {
        return true;
      }
    }
    return false;
  }
};
var SecretsManager = class {
  backend;
  envBackend;
  cache = /* @__PURE__ */ new Map();
  config;
  constructor(config) {
    this.config = {
      encryptionKey: config?.encryptionKey ?? randomBytes(32).toString("hex"),
      cacheTtl: config?.cacheTtl ?? 5 * 60 * 1e3,
      // 5 minutes
      envPrefix: config?.envPrefix ?? "",
      onAccess: config?.onAccess,
      onMissing: config?.onMissing
    };
    this.envBackend = new EnvSecretBackend(this.config.envPrefix);
    this.backend = config?.backend ?? new MemorySecretBackend(this.config.encryptionKey);
  }
  /**
   * Get a secret by key
   * Tries: cache -> environment -> backend
   */
  async get(key) {
    this.config.onAccess?.(key);
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }
    const envValue = await this.envBackend.get(key);
    if (envValue !== null) {
      this.cacheValue(key, envValue);
      return envValue;
    }
    const backendValue = await this.backend.get(key);
    if (backendValue !== null) {
      this.cacheValue(key, backendValue);
      return backendValue;
    }
    this.config.onMissing?.(key);
    return null;
  }
  /**
   * Get a secret or throw if not found
   */
  async require(key) {
    const value = await this.get(key);
    if (value === null) {
      throw new Error(`Required secret not found: ${key}`);
    }
    return value;
  }
  /**
   * Get a secret or return a default value
   */
  async getOrDefault(key, defaultValue) {
    const value = await this.get(key);
    return value ?? defaultValue;
  }
  /**
   * Get multiple secrets at once
   */
  async getMany(keys) {
    const results = /* @__PURE__ */ new Map();
    await Promise.all(
      keys.map(async (key) => {
        results.set(key, await this.get(key));
      })
    );
    return results;
  }
  /**
   * Set a secret
   */
  async set(key, value, metadata) {
    await this.backend.set(key, value, metadata);
    this.cacheValue(key, value);
  }
  /**
   * Delete a secret
   */
  async delete(key) {
    this.cache.delete(key);
    return this.backend.delete(key);
  }
  /**
   * Check if a secret exists
   */
  async exists(key) {
    return await this.envBackend.exists(key) || await this.backend.exists(key);
  }
  /**
   * List all secret keys
   */
  async list() {
    const envKeys = await this.envBackend.list();
    const backendKeys = await this.backend.list();
    return [.../* @__PURE__ */ new Set([...envKeys, ...backendKeys])];
  }
  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Invalidate a specific cached value
   */
  invalidate(key) {
    this.cache.delete(key);
  }
  /**
   * Get masked version of a secret (for logging)
   */
  async getMasked(key, visibleChars = 4) {
    const value = await this.get(key);
    if (!value) return null;
    if (value.length <= visibleChars * 2) {
      return "*".repeat(value.length);
    }
    const start = value.slice(0, visibleChars);
    const end = value.slice(-visibleChars);
    const middle = "*".repeat(Math.min(value.length - visibleChars * 2, 8));
    return `${start}${middle}${end}`;
  }
  /**
   * Hash a secret (for comparison without exposing)
   */
  async getHash(key) {
    const value = await this.get(key);
    if (!value) return null;
    return createHash("sha256").update(value).digest("hex");
  }
  /**
   * Validate that required secrets are present
   */
  async validate(requiredKeys) {
    const missing = [];
    for (const key of requiredKeys) {
      if (!await this.exists(key)) {
        missing.push(key);
      }
    }
    return {
      valid: missing.length === 0,
      missing
    };
  }
  cacheValue(key, value) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.config.cacheTtl
    });
  }
};
function generateSecretKey(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}
function generateApiKey(prefix = "gicm") {
  const random = randomBytes(24).toString("base64url");
  return `${prefix}_${random}`;
}
function isValidApiKey(key, prefix = "gicm") {
  const pattern = new RegExp(`^${prefix}_[A-Za-z0-9_-]{32}$`);
  return pattern.test(key);
}
function redactSecrets(obj, sensitiveKeys = [
  "password",
  "secret",
  "key",
  "token",
  "api_key",
  "apiKey",
  "private",
  "credential"
]) {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive.toLowerCase()))) {
      result[key] = "[REDACTED]";
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = redactSecrets(
        result[key],
        sensitiveKeys
      );
    }
  }
  return result;
}
function createSecretsManager(preset = "development") {
  switch (preset) {
    case "production":
      return new SecretsManager({
        envPrefix: "GICM",
        cacheTtl: 60 * 1e3,
        // 1 minute (shorter for rotation)
        onMissing: (key) => {
          console.warn(`[SECRETS] Missing required secret: ${key}`);
        }
      });
    case "test":
      return new SecretsManager({
        backend: new MemorySecretBackend(),
        cacheTtl: 0
        // No caching in tests
      });
    case "development":
    default:
      return new SecretsManager({
        envPrefix: "GICM",
        cacheTtl: 5 * 60 * 1e3
        // 5 minutes
      });
  }
}

// src/security/rate-limiter.ts
import { z as z2 } from "zod";
var RateLimitConfigSchema = z2.object({
  /** Maximum requests per window */
  maxRequests: z2.number().min(1),
  /** Window duration in milliseconds */
  windowMs: z2.number().min(1),
  /** Algorithm to use */
  algorithm: z2.enum(["token-bucket", "sliding-window", "fixed-window"]).default("sliding-window"),
  /** Burst allowance (for token bucket) */
  burstSize: z2.number().optional(),
  /** Key prefix for storage */
  keyPrefix: z2.string().default("ratelimit")
});
var RateLimitError = class extends Error {
  constructor(message, retryAfter, key) {
    super(message);
    this.retryAfter = retryAfter;
    this.key = key;
    this.name = "RateLimitError";
  }
};
var TokenBucketLimiter = class {
  buckets = /* @__PURE__ */ new Map();
  maxTokens;
  refillRate;
  // tokens per ms
  burstSize;
  constructor(config) {
    this.maxTokens = config.maxRequests;
    this.refillRate = config.maxRequests / config.windowMs;
    this.burstSize = config.burstSize ?? config.maxRequests;
  }
  check(key, tokens = 1) {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.burstSize, lastRefill: now };
      this.buckets.set(key, bucket);
    }
    const elapsed = now - bucket.lastRefill;
    const refillAmount = elapsed * this.refillRate;
    bucket.tokens = Math.min(this.burstSize, bucket.tokens + refillAmount);
    bucket.lastRefill = now;
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: now + Math.ceil((this.burstSize - bucket.tokens) / this.refillRate)
      };
    }
    const retryAfter = Math.ceil((tokens - bucket.tokens) / this.refillRate);
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + retryAfter,
      retryAfter
    };
  }
  reset(key) {
    this.buckets.delete(key);
  }
  clear() {
    this.buckets.clear();
  }
};
var SlidingWindowLimiter = class {
  windows = /* @__PURE__ */ new Map();
  maxRequests;
  windowMs;
  constructor(config) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }
  check(key, weight = 1) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let entries = this.windows.get(key) ?? [];
    entries = entries.filter((e) => e.timestamp > windowStart);
    const currentCount = entries.reduce((sum, e) => sum + e.count, 0);
    if (currentCount + weight <= this.maxRequests) {
      entries.push({ timestamp: now, count: weight });
      this.windows.set(key, entries);
      return {
        allowed: true,
        remaining: this.maxRequests - currentCount - weight,
        resetAt: entries.length > 0 ? entries[0].timestamp + this.windowMs : now + this.windowMs
      };
    }
    const oldestEntry = entries[0];
    const retryAfter = oldestEntry ? oldestEntry.timestamp + this.windowMs - now : this.windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + retryAfter,
      retryAfter
    };
  }
  reset(key) {
    this.windows.delete(key);
  }
  clear() {
    this.windows.clear();
  }
  // Cleanup old entries periodically
  cleanup() {
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
};
var FixedWindowLimiter = class {
  windows = /* @__PURE__ */ new Map();
  maxRequests;
  windowMs;
  constructor(config) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }
  check(key, weight = 1) {
    const now = Date.now();
    const currentWindowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const windowEnd = currentWindowStart + this.windowMs;
    let window = this.windows.get(key);
    if (!window || window.windowStart !== currentWindowStart) {
      window = { count: 0, windowStart: currentWindowStart };
      this.windows.set(key, window);
    }
    if (window.count + weight <= this.maxRequests) {
      window.count += weight;
      return {
        allowed: true,
        remaining: this.maxRequests - window.count,
        resetAt: windowEnd
      };
    }
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd,
      retryAfter: windowEnd - now
    };
  }
  reset(key) {
    this.windows.delete(key);
  }
  clear() {
    this.windows.clear();
  }
};
var RateLimiter = class {
  limiter;
  stats = {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    uniqueKeys: 0
  };
  seenKeys = /* @__PURE__ */ new Set();
  keyPrefix;
  normalizedConfig;
  constructor(config) {
    this.normalizedConfig = {
      ...config,
      algorithm: config.algorithm ?? "sliding-window",
      keyPrefix: config.keyPrefix ?? "ratelimit"
    };
    this.keyPrefix = this.normalizedConfig.keyPrefix;
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
  check(key, weight = 1) {
    const prefixedKey = `${this.keyPrefix}:${key}`;
    const result = this.limiter.check(prefixedKey, weight);
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
  limit(key, weight = 1) {
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
  async limitAsync(key, options) {
    const result = this.check(key);
    if (result.allowed) {
      return result;
    }
    if (options?.wait && result.retryAfter) {
      const waitTime = options.maxWait ? Math.min(result.retryAfter, options.maxWait) : result.retryAfter;
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
  wrap(key, fn, options) {
    return this.limitAsync(key, options).then(() => fn());
  }
  /**
   * Reset rate limit for a key
   */
  reset(key) {
    const prefixedKey = `${this.keyPrefix}:${key}`;
    this.limiter.reset(prefixedKey);
  }
  /**
   * Clear all rate limits
   */
  clear() {
    this.limiter.clear();
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      uniqueKeys: 0
    };
    this.seenKeys.clear();
  }
  /**
   * Get current stats
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.normalizedConfig };
  }
};
var MultiTierRateLimiter = class {
  tiers = /* @__PURE__ */ new Map();
  constructor(tiers) {
    for (const tier of tiers) {
      this.tiers.set(tier.name, new RateLimiter(tier.config));
    }
  }
  check(key) {
    let finalResult = {
      allowed: true,
      remaining: Infinity,
      resetAt: 0
    };
    for (const [name, limiter] of this.tiers) {
      const result = limiter.check(key);
      if (!result.allowed) {
        return { allowed: false, failedTier: name, result };
      }
      if (result.remaining < finalResult.remaining) {
        finalResult = result;
      }
    }
    return { allowed: true, result: finalResult };
  }
  limit(key) {
    const { allowed, failedTier, result } = this.check(key);
    if (!allowed) {
      throw new RateLimitError(
        `Rate limit exceeded (${failedTier}) for ${key}`,
        result.retryAfter ?? 0,
        key
      );
    }
  }
  reset(key) {
    for (const limiter of this.tiers.values()) {
      limiter.reset(key);
    }
  }
  clear() {
    for (const limiter of this.tiers.values()) {
      limiter.clear();
    }
  }
  getStats() {
    const stats = /* @__PURE__ */ new Map();
    for (const [name, limiter] of this.tiers) {
      stats.set(name, limiter.getStats());
    }
    return stats;
  }
};
function createApiRateLimiter(requestsPerMinute) {
  return new RateLimiter({
    maxRequests: requestsPerMinute,
    windowMs: 60 * 1e3,
    algorithm: "sliding-window",
    keyPrefix: "api"
  });
}
function createLLMRateLimiter(config) {
  return new MultiTierRateLimiter([
    {
      name: "requests",
      config: {
        maxRequests: config?.requestsPerMinute ?? 60,
        windowMs: 60 * 1e3,
        algorithm: "sliding-window",
        keyPrefix: "llm-requests"
      }
    },
    {
      name: "tokens",
      config: {
        maxRequests: config?.tokensPerMinute ?? 1e5,
        windowMs: 60 * 1e3,
        algorithm: "sliding-window",
        keyPrefix: "llm-tokens"
      }
    }
  ]);
}
function createRateLimitHeaders(result, limit) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1e3)),
    ...result.retryAfter && { "Retry-After": String(Math.ceil(result.retryAfter / 1e3)) }
  };
}

// src/security/auth.ts
import { z as z3 } from "zod";
import { createHash as createHash2, randomBytes as randomBytes2, createHmac, timingSafeEqual } from "crypto";
var AuthConfigSchema = z3.object({
  /** JWT secret for signing tokens */
  jwtSecret: z3.string().min(32).optional(),
  /** Token expiration in seconds */
  tokenExpiration: z3.number().default(3600),
  // 1 hour
  /** Refresh token expiration in seconds */
  refreshExpiration: z3.number().default(604800),
  // 7 days
  /** API key prefix for validation */
  apiKeyPrefix: z3.string().default("gicm"),
  /** Enable API key authentication */
  enableApiKey: z3.boolean().default(true),
  /** Enable JWT authentication */
  enableJwt: z3.boolean().default(true)
});
function base64urlEncode(data) {
  const base64 = Buffer.from(data).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64urlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}
var JwtManager = class {
  secret;
  algorithm = "HS256";
  constructor(secret) {
    if (secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters");
    }
    this.secret = secret;
  }
  /**
   * Sign a JWT token
   */
  sign(payload) {
    const header = { alg: this.algorithm, typ: "JWT" };
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  /**
   * Verify and decode a JWT token
   */
  verify(token) {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`
    );
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }
    try {
      const payload = JSON.parse(base64urlDecode(encodedPayload));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
  /**
   * Decode without verification (use only for debugging)
   */
  decode(token) {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    try {
      return JSON.parse(base64urlDecode(parts[1]));
    } catch {
      return null;
    }
  }
  createSignature(data) {
    const hmac = createHmac("sha256", this.secret);
    hmac.update(data);
    return base64urlEncode(hmac.digest());
  }
};
var ApiKeyManager = class {
  keys = /* @__PURE__ */ new Map();
  prefix;
  constructor(prefix = "gicm") {
    this.prefix = prefix;
  }
  /**
   * Generate a new API key
   */
  generate(options) {
    const id = randomBytes2(8).toString("hex");
    const keyBytes = randomBytes2(24);
    const key = `${this.prefix}_${keyBytes.toString("hex")}`;
    const hashedKey = this.hashKey(key);
    const now = Date.now();
    const info = {
      id,
      key,
      // Only returned on creation
      hashedKey,
      userId: options.userId,
      name: options.name,
      scope: options.scope ?? ["read"],
      createdAt: now,
      expiresAt: options.expiresIn ? now + options.expiresIn * 1e3 : void 0,
      metadata: options.metadata
    };
    this.keys.set(hashedKey, info);
    return info;
  }
  /**
   * Validate an API key
   */
  validate(key) {
    if (!key.startsWith(`${this.prefix}_`)) {
      return null;
    }
    const hashedKey = this.hashKey(key);
    const info = this.keys.get(hashedKey);
    if (!info) {
      return null;
    }
    if (info.expiresAt && info.expiresAt < Date.now()) {
      return null;
    }
    info.lastUsed = Date.now();
    return { ...info, key: "" };
  }
  /**
   * Revoke an API key by ID
   */
  revoke(id) {
    for (const [hash, info] of this.keys) {
      if (info.id === id) {
        this.keys.delete(hash);
        return true;
      }
    }
    return false;
  }
  /**
   * List all keys for a user (without actual key values)
   */
  listForUser(userId) {
    const result = [];
    for (const info of this.keys.values()) {
      if (info.userId === userId) {
        const { key: _, hashedKey: __, ...rest } = info;
        result.push(rest);
      }
    }
    return result;
  }
  /**
   * Register an existing hashed key (for loading from storage)
   */
  register(info) {
    this.keys.set(info.hashedKey, { ...info, key: "" });
  }
  /**
   * Export all keys (hashed) for persistence
   */
  export() {
    return Array.from(this.keys.values()).map(({ key: _, ...rest }) => rest);
  }
  hashKey(key) {
    return createHash2("sha256").update(key).digest("hex");
  }
};
var SessionManager = class {
  sessions = /* @__PURE__ */ new Map();
  defaultTtl;
  constructor(defaultTtlSeconds = 3600) {
    this.defaultTtl = defaultTtlSeconds * 1e3;
  }
  /**
   * Create a new session
   */
  create(userId, ttl, metadata) {
    const id = randomBytes2(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.defaultTtl);
    const session = {
      id,
      userId,
      createdAt: now,
      expiresAt,
      lastActive: now,
      metadata
    };
    this.sessions.set(id, session);
    return session;
  }
  /**
   * Get a session by ID
   */
  get(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    session.lastActive = Date.now();
    return session;
  }
  /**
   * Extend session expiration
   */
  extend(sessionId, additionalMs) {
    const session = this.get(sessionId);
    if (!session) {
      return null;
    }
    session.expiresAt = Date.now() + (additionalMs ?? this.defaultTtl);
    return session;
  }
  /**
   * Destroy a session
   */
  destroy(sessionId) {
    return this.sessions.delete(sessionId);
  }
  /**
   * Destroy all sessions for a user
   */
  destroyAllForUser(userId) {
    let count = 0;
    for (const [id, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(id);
        count++;
      }
    }
    return count;
  }
  /**
   * List active sessions for a user
   */
  listForUser(userId) {
    const now = Date.now();
    const result = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.expiresAt > now) {
        result.push(session);
      }
    }
    return result;
  }
  /**
   * Clean up expired sessions
   */
  cleanup() {
    const now = Date.now();
    let count = 0;
    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
        count++;
      }
    }
    return count;
  }
  /**
   * Get total active sessions count
   */
  get activeCount() {
    const now = Date.now();
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.expiresAt > now) {
        count++;
      }
    }
    return count;
  }
};
var AuthMiddleware = class {
  config;
  jwtManager;
  apiKeyManager;
  sessionManager;
  constructor(config = {}) {
    this.config = AuthConfigSchema.parse(config);
    if (this.config.enableJwt && this.config.jwtSecret) {
      this.jwtManager = new JwtManager(this.config.jwtSecret);
    }
    if (this.config.enableApiKey) {
      this.apiKeyManager = new ApiKeyManager(this.config.apiKeyPrefix);
    }
    this.sessionManager = new SessionManager(this.config.tokenExpiration);
  }
  /**
   * Authenticate a request
   */
  authenticate(request) {
    const authHeader = request.headers.authorization || request.headers.Authorization;
    if (authHeader?.startsWith("Bearer ") && this.jwtManager) {
      const token = authHeader.slice(7);
      const payload = this.jwtManager.verify(token);
      if (payload) {
        return {
          authenticated: true,
          userId: payload.sub,
          scope: payload.scope,
          expiresAt: payload.exp * 1e3
        };
      }
      return { authenticated: false, error: "Invalid or expired token" };
    }
    if (authHeader && this.apiKeyManager) {
      const key = authHeader.startsWith("ApiKey ") ? authHeader.slice(7) : authHeader;
      const info = this.apiKeyManager.validate(key);
      if (info) {
        return {
          authenticated: true,
          userId: info.userId,
          scope: info.scope,
          expiresAt: info.expiresAt
        };
      }
    }
    const sessionId = request.cookies?.session;
    if (sessionId && this.sessionManager) {
      const session = this.sessionManager.get(sessionId);
      if (session) {
        return {
          authenticated: true,
          userId: session.userId,
          expiresAt: session.expiresAt
        };
      }
    }
    return { authenticated: false, error: "No valid credentials provided" };
  }
  /**
   * Generate a JWT token for a user
   */
  generateToken(userId, options) {
    if (!this.jwtManager) {
      return null;
    }
    const now = Math.floor(Date.now() / 1e3);
    const payload = {
      sub: userId,
      iat: now,
      exp: now + this.config.tokenExpiration,
      scope: options?.scope,
      metadata: options?.metadata
    };
    return this.jwtManager.sign(payload);
  }
  /**
   * Generate a refresh token
   */
  generateRefreshToken(userId) {
    const token = randomBytes2(32).toString("hex");
    return token;
  }
  /**
   * Generate an API key
   */
  generateApiKey(options) {
    if (!this.apiKeyManager) {
      return null;
    }
    return this.apiKeyManager.generate(options);
  }
  /**
   * Revoke an API key
   */
  revokeApiKey(keyId) {
    return this.apiKeyManager?.revoke(keyId) ?? false;
  }
  /**
   * Create a session
   */
  createSession(userId, metadata) {
    if (!this.sessionManager) {
      return null;
    }
    return this.sessionManager.create(userId, this.config.tokenExpiration, metadata);
  }
  /**
   * Destroy a session
   */
  destroySession(sessionId) {
    return this.sessionManager?.destroy(sessionId) ?? false;
  }
  /**
   * Get the JWT manager (for custom operations)
   */
  getJwtManager() {
    return this.jwtManager;
  }
  /**
   * Get the API key manager
   */
  getApiKeyManager() {
    return this.apiKeyManager;
  }
  /**
   * Get the session manager
   */
  getSessionManager() {
    return this.sessionManager;
  }
};
function hasScope(userScope, required) {
  const requiredScopes = Array.isArray(required) ? required : [required];
  if (userScope.includes("*") || userScope.includes("admin")) {
    return true;
  }
  return requiredScopes.every((scope) => {
    if (userScope.includes(scope)) {
      return true;
    }
    const [action, resource] = scope.split(":");
    if (resource && userScope.includes(`${action}:*`)) {
      return true;
    }
    return false;
  });
}
function parseAuthHeader(header) {
  if (!header) {
    return null;
  }
  const lower = header.toLowerCase();
  if (lower.startsWith("bearer ")) {
    return { type: "bearer", value: header.slice(7) };
  }
  if (lower.startsWith("apikey ")) {
    return { type: "apikey", value: header.slice(7) };
  }
  if (lower.startsWith("basic ")) {
    return { type: "basic", value: header.slice(6) };
  }
  if (header.includes("_")) {
    return { type: "apikey", value: header };
  }
  return { type: "unknown", value: header };
}
function createAuthGuard(middleware, options) {
  return (request) => {
    const result = middleware.authenticate(request);
    if (!result.authenticated) {
      return result;
    }
    if (options?.requiredScope && result.scope && !hasScope(result.scope, options.requiredScope)) {
      return {
        authenticated: false,
        error: "Insufficient permissions"
      };
    }
    return result;
  };
}
async function hashPassword(password, salt) {
  const crypto = await import("crypto");
  const useSalt = salt ?? crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, useSalt, 1e5, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      else
        resolve({
          hash: derivedKey.toString("hex"),
          salt: useSalt
        });
    });
  });
}
async function verifyPassword(password, hash, salt) {
  const result = await hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(result.hash), Buffer.from(hash));
}

// src/security/headers.ts
import { z as z4 } from "zod";
var CspDirectiveSchema = z4.object({
  "default-src": z4.array(z4.string()).optional(),
  "script-src": z4.array(z4.string()).optional(),
  "style-src": z4.array(z4.string()).optional(),
  "img-src": z4.array(z4.string()).optional(),
  "font-src": z4.array(z4.string()).optional(),
  "connect-src": z4.array(z4.string()).optional(),
  "media-src": z4.array(z4.string()).optional(),
  "object-src": z4.array(z4.string()).optional(),
  "frame-src": z4.array(z4.string()).optional(),
  "frame-ancestors": z4.array(z4.string()).optional(),
  "form-action": z4.array(z4.string()).optional(),
  "base-uri": z4.array(z4.string()).optional(),
  "worker-src": z4.array(z4.string()).optional(),
  "manifest-src": z4.array(z4.string()).optional(),
  "upgrade-insecure-requests": z4.boolean().optional(),
  "block-all-mixed-content": z4.boolean().optional(),
  "report-uri": z4.string().optional(),
  "report-to": z4.string().optional()
});
var CorsConfigSchema = z4.object({
  /** Allowed origins (use '*' for any, or array of specific origins) */
  allowedOrigins: z4.union([z4.literal("*"), z4.array(z4.string())]).default("*"),
  /** Allowed HTTP methods */
  allowedMethods: z4.array(z4.string()).default(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]),
  /** Allowed headers */
  allowedHeaders: z4.array(z4.string()).default(["Content-Type", "Authorization", "X-Requested-With"]),
  /** Exposed headers */
  exposedHeaders: z4.array(z4.string()).optional(),
  /** Allow credentials */
  credentials: z4.boolean().default(false),
  /** Max age for preflight cache (seconds) */
  maxAge: z4.number().default(86400)
});
var SecurityHeadersConfigSchema = z4.object({
  /** Content Security Policy */
  csp: CspDirectiveSchema.optional(),
  /** Report-only CSP (for testing) */
  cspReportOnly: z4.boolean().default(false),
  /** CORS configuration */
  cors: CorsConfigSchema.optional(),
  /** HTTP Strict Transport Security */
  hsts: z4.object({
    maxAge: z4.number().default(31536e3),
    // 1 year
    includeSubDomains: z4.boolean().default(true),
    preload: z4.boolean().default(false)
  }).optional(),
  /** X-Content-Type-Options */
  noSniff: z4.boolean().default(true),
  /** X-Frame-Options */
  frameOptions: z4.enum(["DENY", "SAMEORIGIN"]).default("DENY"),
  /** X-XSS-Protection (legacy but still useful) */
  xssProtection: z4.boolean().default(true),
  /** Referrer-Policy */
  referrerPolicy: z4.enum([
    "no-referrer",
    "no-referrer-when-downgrade",
    "origin",
    "origin-when-cross-origin",
    "same-origin",
    "strict-origin",
    "strict-origin-when-cross-origin",
    "unsafe-url"
  ]).default("strict-origin-when-cross-origin"),
  /** Permissions-Policy */
  permissionsPolicy: z4.record(z4.array(z4.string())).optional(),
  /** Cross-Origin-Embedder-Policy */
  coep: z4.enum(["require-corp", "credentialless", "unsafe-none"]).optional(),
  /** Cross-Origin-Opener-Policy */
  coop: z4.enum(["same-origin", "same-origin-allow-popups", "unsafe-none"]).optional(),
  /** Cross-Origin-Resource-Policy */
  corp: z4.enum(["same-site", "same-origin", "cross-origin"]).optional()
});
function buildCspString(directives) {
  const parts = [];
  for (const [key, value] of Object.entries(directives)) {
    if (value === void 0) continue;
    if (typeof value === "boolean") {
      if (value) {
        parts.push(key);
      }
    } else if (typeof value === "string") {
      parts.push(`${key} ${value}`);
    } else if (Array.isArray(value) && value.length > 0) {
      parts.push(`${key} ${value.join(" ")}`);
    }
  }
  return parts.join("; ");
}
var CSP_PRESETS = {
  strict: {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'"],
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "upgrade-insecure-requests": true
  },
  moderate: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "https:"],
    "connect-src": ["'self'", "https:"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'self'"],
    "upgrade-insecure-requests": true
  },
  relaxed: {
    "default-src": ["'self'", "https:"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
    "style-src": ["'self'", "'unsafe-inline'", "https:"],
    "img-src": ["*", "data:", "blob:"],
    "font-src": ["*", "data:"],
    "connect-src": ["*"],
    "object-src": ["'none'"]
  },
  api: {
    "default-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'none'"]
  }
};
function generateCorsHeaders(origin, config, isPreflight = false) {
  let allowedOrigin = null;
  if (config.allowedOrigins === "*") {
    allowedOrigin = config.credentials ? origin ?? "*" : "*";
  } else if (origin && config.allowedOrigins.includes(origin)) {
    allowedOrigin = origin;
  } else if (origin && config.allowedOrigins.some((o) => o.endsWith("*"))) {
    for (const pattern of config.allowedOrigins) {
      if (pattern.endsWith("*")) {
        const prefix = pattern.slice(0, -1);
        if (origin.startsWith(prefix)) {
          allowedOrigin = origin;
          break;
        }
      }
    }
  }
  if (!allowedOrigin) {
    return null;
  }
  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin
  };
  if (config.credentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  if (isPreflight) {
    headers["Access-Control-Allow-Methods"] = config.allowedMethods.join(", ");
    headers["Access-Control-Allow-Headers"] = config.allowedHeaders.join(", ");
    headers["Access-Control-Max-Age"] = String(config.maxAge);
  }
  if (config.exposedHeaders && config.exposedHeaders.length > 0) {
    headers["Access-Control-Expose-Headers"] = config.exposedHeaders.join(", ");
  }
  return headers;
}
function generateSecurityHeaders(config, options) {
  const headers = {};
  if (config.csp) {
    const cspString = buildCspString(config.csp);
    if (cspString) {
      const headerName = config.cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
      headers[headerName] = cspString;
    }
  }
  if (config.cors) {
    const corsHeaders = generateCorsHeaders(
      options?.origin,
      config.cors,
      options?.isPreflight
    );
    if (corsHeaders) {
      Object.assign(headers, corsHeaders);
    }
  }
  if (config.hsts) {
    let hsts = `max-age=${config.hsts.maxAge}`;
    if (config.hsts.includeSubDomains) {
      hsts += "; includeSubDomains";
    }
    if (config.hsts.preload) {
      hsts += "; preload";
    }
    headers["Strict-Transport-Security"] = hsts;
  }
  if (config.noSniff) {
    headers["X-Content-Type-Options"] = "nosniff";
  }
  if (config.frameOptions) {
    headers["X-Frame-Options"] = config.frameOptions;
  }
  if (config.xssProtection) {
    headers["X-XSS-Protection"] = "1; mode=block";
  }
  if (config.referrerPolicy) {
    headers["Referrer-Policy"] = config.referrerPolicy;
  }
  if (config.permissionsPolicy) {
    const policy = Object.entries(config.permissionsPolicy).map(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        return `${feature}=()`;
      }
      return `${feature}=(${allowlist.join(" ")})`;
    }).join(", ");
    headers["Permissions-Policy"] = policy;
  }
  if (config.coep) {
    headers["Cross-Origin-Embedder-Policy"] = config.coep;
  }
  if (config.coop) {
    headers["Cross-Origin-Opener-Policy"] = config.coop;
  }
  if (config.corp) {
    headers["Cross-Origin-Resource-Policy"] = config.corp;
  }
  return headers;
}
var SecurityHeadersMiddleware = class {
  config;
  constructor(config) {
    this.config = SecurityHeadersConfigSchema.parse(config ?? {});
  }
  /**
   * Apply security headers to a response
   */
  apply(request, response) {
    const origin = request.headers.origin ?? request.headers.Origin;
    const isPreflight = request.method === "OPTIONS";
    const securityHeaders = generateSecurityHeaders(this.config, {
      origin,
      isPreflight
    });
    return {
      ...response,
      headers: {
        ...response.headers,
        ...securityHeaders
      }
    };
  }
  /**
   * Handle CORS preflight request
   */
  handlePreflight(request) {
    if (request.method !== "OPTIONS") {
      return null;
    }
    const origin = request.headers.origin ?? request.headers.Origin;
    if (!this.config.cors || !origin) {
      return null;
    }
    const corsHeaders = generateCorsHeaders(origin, this.config.cors, true);
    if (!corsHeaders) {
      return { headers: {}, statusCode: 403 };
    }
    const headers = {};
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (value !== void 0) {
        headers[key] = value;
      }
    }
    return {
      headers,
      statusCode: 204
    };
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
};
var SECURITY_PRESETS = {
  /** Strict security for production APIs */
  strictApi: {
    csp: CSP_PRESETS.api,
    hsts: { maxAge: 31536e3, includeSubDomains: true, preload: true },
    noSniff: true,
    frameOptions: "DENY",
    xssProtection: true,
    referrerPolicy: "no-referrer",
    coep: "require-corp",
    coop: "same-origin",
    corp: "same-origin"
  },
  /** Moderate security for web applications */
  webApp: {
    csp: CSP_PRESETS.moderate,
    hsts: { maxAge: 31536e3, includeSubDomains: true },
    noSniff: true,
    frameOptions: "SAMEORIGIN",
    xssProtection: true,
    referrerPolicy: "strict-origin-when-cross-origin"
  },
  /** Relaxed for development */
  development: {
    csp: CSP_PRESETS.relaxed,
    cspReportOnly: true,
    cors: {
      allowedOrigins: "*",
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["*"],
      credentials: true
    },
    noSniff: true,
    frameOptions: "SAMEORIGIN",
    xssProtection: true,
    referrerPolicy: "no-referrer-when-downgrade"
  },
  /** For public APIs with CORS */
  publicApi: {
    csp: CSP_PRESETS.api,
    cors: {
      allowedOrigins: "*",
      allowedMethods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    hsts: { maxAge: 31536e3, includeSubDomains: true },
    noSniff: true,
    frameOptions: "DENY",
    xssProtection: true,
    referrerPolicy: "no-referrer"
  }
};
function generateNonce() {
  const crypto = globalThis.crypto ?? __require("crypto");
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
}
function addNonceToCsp(directives, nonce, targets = ["script-src", "style-src"]) {
  const result = { ...directives };
  const nonceValue = `'nonce-${nonce}'`;
  for (const target of targets) {
    const current = result[target] ?? [];
    result[target] = [...current, nonceValue];
  }
  return result;
}
function mergeCspDirectives(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value !== void 0) {
      const k = key;
      if (Array.isArray(value) && Array.isArray(result[k])) {
        result[k] = [
          ...result[k],
          ...value
        ];
      } else {
        result[k] = value;
      }
    }
  }
  return result;
}
function isOriginAllowed(origin, allowedOrigins) {
  if (allowedOrigins === "*") {
    return true;
  }
  for (const allowed of allowedOrigins) {
    if (allowed === origin) {
      return true;
    }
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2);
      const originDomain = new URL(origin).hostname;
      if (originDomain === domain || originDomain.endsWith(`.${domain}`)) {
        return true;
      }
    }
  }
  return false;
}
function createStaticFileHeaders(contentType) {
  const headers = {
    "X-Content-Type-Options": "nosniff"
  };
  if (contentType.startsWith("image/") || contentType.startsWith("font/") || contentType === "application/javascript" || contentType === "text/css") {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  }
  if (contentType === "text/html") {
    headers["X-Frame-Options"] = "SAMEORIGIN";
    headers["X-XSS-Protection"] = "1; mode=block";
  }
  return headers;
}

export {
  EnvSecretBackend,
  MemorySecretBackend,
  CompositeSecretBackend,
  SecretsManager,
  generateSecretKey,
  generateApiKey,
  isValidApiKey,
  redactSecrets,
  createSecretsManager,
  RateLimitError,
  TokenBucketLimiter,
  SlidingWindowLimiter,
  FixedWindowLimiter,
  RateLimiter,
  MultiTierRateLimiter,
  createApiRateLimiter,
  createLLMRateLimiter,
  createRateLimitHeaders,
  JwtManager,
  ApiKeyManager,
  SessionManager,
  AuthMiddleware,
  hasScope,
  parseAuthHeader,
  createAuthGuard,
  hashPassword,
  verifyPassword,
  buildCspString,
  CSP_PRESETS,
  generateCorsHeaders,
  generateSecurityHeaders,
  SecurityHeadersMiddleware,
  SECURITY_PRESETS,
  generateNonce,
  addNonceToCsp,
  mergeCspDirectives,
  isOriginAllowed,
  createStaticFileHeaders
};
//# sourceMappingURL=chunk-JMLUFU34.js.map