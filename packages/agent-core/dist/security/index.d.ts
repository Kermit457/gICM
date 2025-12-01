import { z } from 'zod';

/**
 * Secrets Manager for gICM platform
 *
 * Secure handling of API keys, credentials, and sensitive configuration.
 * Supports multiple backends: environment variables, encrypted files, external stores.
 */

declare const SecretMetadataSchema: z.ZodObject<{
    name: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    rotationDue: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    version: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    createdAt: number;
    updatedAt: number;
    version: number;
    expiresAt?: number | undefined;
    rotationDue?: number | undefined;
    tags?: string[] | undefined;
}, {
    name: string;
    createdAt: number;
    updatedAt: number;
    expiresAt?: number | undefined;
    rotationDue?: number | undefined;
    tags?: string[] | undefined;
    version?: number | undefined;
}>;
type SecretMetadata = z.infer<typeof SecretMetadataSchema>;
interface SecretValue {
    value: string;
    metadata: SecretMetadata;
}
interface SecretBackend {
    name: string;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
    delete(key: string): Promise<boolean>;
    list(): Promise<string[]>;
    exists(key: string): Promise<boolean>;
}
interface SecretsManagerConfig {
    /** Primary backend for secrets */
    backend?: SecretBackend;
    /** Encryption key for in-memory caching (32 bytes hex) */
    encryptionKey?: string;
    /** Cache TTL in ms (default: 5 minutes) */
    cacheTtl?: number;
    /** Prefix for environment variable lookups */
    envPrefix?: string;
    /** Callback when secret is accessed */
    onAccess?: (key: string) => void;
    /** Callback when secret is missing */
    onMissing?: (key: string) => void;
}
/**
 * Backend that reads secrets from environment variables
 */
declare class EnvSecretBackend implements SecretBackend {
    name: string;
    private prefix;
    constructor(prefix?: string);
    private getEnvKey;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<boolean>;
    list(): Promise<string[]>;
    exists(key: string): Promise<boolean>;
}
/**
 * In-memory backend with AES-256 encryption
 */
declare class MemorySecretBackend implements SecretBackend {
    name: string;
    private secrets;
    private key;
    constructor(encryptionKey?: string);
    private encrypt;
    private decrypt;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
    delete(key: string): Promise<boolean>;
    list(): Promise<string[]>;
    exists(key: string): Promise<boolean>;
    getMetadata(key: string): SecretMetadata | null;
}
/**
 * Backend that tries multiple backends in order
 */
declare class CompositeSecretBackend implements SecretBackend {
    name: string;
    private backends;
    constructor(backends: SecretBackend[]);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
    delete(key: string): Promise<boolean>;
    list(): Promise<string[]>;
    exists(key: string): Promise<boolean>;
}
/**
 * SecretsManager handles secure storage and retrieval of secrets
 *
 * @example
 * const secrets = new SecretsManager({
 *   envPrefix: 'GICM',
 * });
 *
 * // Get API key (tries env, then backend)
 * const apiKey = await secrets.get('OPENAI_API_KEY');
 *
 * // Require a secret (throws if missing)
 * const requiredKey = await secrets.require('DATABASE_URL');
 *
 * // Get with default
 * const optional = await secrets.getOrDefault('LOG_LEVEL', 'info');
 */
declare class SecretsManager {
    private backend;
    private envBackend;
    private cache;
    private readonly config;
    constructor(config?: SecretsManagerConfig);
    /**
     * Get a secret by key
     * Tries: cache -> environment -> backend
     */
    get(key: string): Promise<string | null>;
    /**
     * Get a secret or throw if not found
     */
    require(key: string): Promise<string>;
    /**
     * Get a secret or return a default value
     */
    getOrDefault(key: string, defaultValue: string): Promise<string>;
    /**
     * Get multiple secrets at once
     */
    getMany(keys: string[]): Promise<Map<string, string | null>>;
    /**
     * Set a secret
     */
    set(key: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
    /**
     * Delete a secret
     */
    delete(key: string): Promise<boolean>;
    /**
     * Check if a secret exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * List all secret keys
     */
    list(): Promise<string[]>;
    /**
     * Clear the cache
     */
    clearCache(): void;
    /**
     * Invalidate a specific cached value
     */
    invalidate(key: string): void;
    /**
     * Get masked version of a secret (for logging)
     */
    getMasked(key: string, visibleChars?: number): Promise<string | null>;
    /**
     * Hash a secret (for comparison without exposing)
     */
    getHash(key: string): Promise<string | null>;
    /**
     * Validate that required secrets are present
     */
    validate(requiredKeys: string[]): Promise<{
        valid: boolean;
        missing: string[];
    }>;
    private cacheValue;
}
/**
 * Generate a secure random key
 */
declare function generateSecretKey(bytes?: number): string;
/**
 * Generate a secure API key with prefix
 */
declare function generateApiKey(prefix?: string): string;
/**
 * Validate API key format
 */
declare function isValidApiKey(key: string, prefix?: string): boolean;
/**
 * Redact sensitive values from an object (for logging)
 */
declare function redactSecrets<T extends Record<string, unknown>>(obj: T, sensitiveKeys?: string[]): T;
/**
 * Create a secrets manager with common presets
 */
declare function createSecretsManager(preset?: "development" | "production" | "test"): SecretsManager;

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

declare const RateLimitConfigSchema: z.ZodObject<{
    /** Maximum requests per window */
    maxRequests: z.ZodNumber;
    /** Window duration in milliseconds */
    windowMs: z.ZodNumber;
    /** Algorithm to use */
    algorithm: z.ZodDefault<z.ZodEnum<["token-bucket", "sliding-window", "fixed-window"]>>;
    /** Burst allowance (for token bucket) */
    burstSize: z.ZodOptional<z.ZodNumber>;
    /** Key prefix for storage */
    keyPrefix: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    maxRequests: number;
    windowMs: number;
    algorithm: "token-bucket" | "sliding-window" | "fixed-window";
    keyPrefix: string;
    burstSize?: number | undefined;
}, {
    maxRequests: number;
    windowMs: number;
    algorithm?: "token-bucket" | "sliding-window" | "fixed-window" | undefined;
    burstSize?: number | undefined;
    keyPrefix?: string | undefined;
}>;
type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}
interface RateLimitStats {
    totalRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    uniqueKeys: number;
}
declare class RateLimitError extends Error {
    readonly retryAfter: number;
    readonly key?: string | undefined;
    constructor(message: string, retryAfter: number, key?: string | undefined);
}
declare class TokenBucketLimiter {
    private buckets;
    private readonly maxTokens;
    private readonly refillRate;
    private readonly burstSize;
    constructor(config: RateLimitConfig);
    check(key: string, tokens?: number): RateLimitResult;
    reset(key: string): void;
    clear(): void;
}
declare class SlidingWindowLimiter {
    private windows;
    private readonly maxRequests;
    private readonly windowMs;
    constructor(config: RateLimitConfig);
    check(key: string, weight?: number): RateLimitResult;
    reset(key: string): void;
    clear(): void;
    cleanup(): void;
}
declare class FixedWindowLimiter {
    private windows;
    private readonly maxRequests;
    private readonly windowMs;
    constructor(config: RateLimitConfig);
    check(key: string, weight?: number): RateLimitResult;
    reset(key: string): void;
    clear(): void;
}
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
declare class RateLimiter {
    private limiter;
    private stats;
    private seenKeys;
    private readonly keyPrefix;
    private readonly normalizedConfig;
    constructor(config: RateLimitConfig);
    /**
     * Check if a request is allowed
     */
    check(key: string, weight?: number): RateLimitResult;
    /**
     * Limit a request - throws if rate limited
     */
    limit(key: string, weight?: number): void;
    /**
     * Async limit with optional wait
     */
    limitAsync(key: string, options?: {
        wait?: boolean;
        maxWait?: number;
    }): Promise<RateLimitResult>;
    /**
     * Wrap an async function with rate limiting
     */
    wrap<T>(key: string, fn: () => Promise<T>, options?: {
        wait?: boolean;
        maxWait?: number;
    }): Promise<T>;
    /**
     * Reset rate limit for a key
     */
    reset(key: string): void;
    /**
     * Clear all rate limits
     */
    clear(): void;
    /**
     * Get current stats
     */
    getStats(): RateLimitStats;
    /**
     * Get configuration
     */
    getConfig(): RateLimitConfig;
}
interface TierConfig {
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
declare class MultiTierRateLimiter {
    private tiers;
    constructor(tiers: TierConfig[]);
    check(key: string): {
        allowed: boolean;
        failedTier?: string;
        result: RateLimitResult;
    };
    limit(key: string): void;
    reset(key: string): void;
    clear(): void;
    getStats(): Map<string, RateLimitStats>;
}
/**
 * Create a rate limiter for API requests
 */
declare function createApiRateLimiter(requestsPerMinute: number): RateLimiter;
/**
 * Create a rate limiter for LLM API calls
 */
declare function createLLMRateLimiter(config?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
}): MultiTierRateLimiter;
/**
 * Create rate limiter headers for HTTP responses
 */
declare function createRateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string>;

/**
 * API Authentication for gICM platform
 *
 * Features:
 * - API key authentication
 * - JWT token handling
 * - Bearer token middleware
 * - Session management
 * - Token refresh
 */

declare const AuthConfigSchema: z.ZodObject<{
    /** JWT secret for signing tokens */
    jwtSecret: z.ZodOptional<z.ZodString>;
    /** Token expiration in seconds */
    tokenExpiration: z.ZodDefault<z.ZodNumber>;
    /** Refresh token expiration in seconds */
    refreshExpiration: z.ZodDefault<z.ZodNumber>;
    /** API key prefix for validation */
    apiKeyPrefix: z.ZodDefault<z.ZodString>;
    /** Enable API key authentication */
    enableApiKey: z.ZodDefault<z.ZodBoolean>;
    /** Enable JWT authentication */
    enableJwt: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    tokenExpiration: number;
    refreshExpiration: number;
    apiKeyPrefix: string;
    enableApiKey: boolean;
    enableJwt: boolean;
    jwtSecret?: string | undefined;
}, {
    jwtSecret?: string | undefined;
    tokenExpiration?: number | undefined;
    refreshExpiration?: number | undefined;
    apiKeyPrefix?: string | undefined;
    enableApiKey?: boolean | undefined;
    enableJwt?: boolean | undefined;
}>;
type AuthConfig = z.infer<typeof AuthConfigSchema>;
interface TokenPayload {
    sub: string;
    iat: number;
    exp: number;
    scope?: string[];
    metadata?: Record<string, unknown>;
}
interface AuthResult {
    authenticated: boolean;
    userId?: string;
    scope?: string[];
    expiresAt?: number;
    error?: string;
}
interface Session {
    id: string;
    userId: string;
    createdAt: number;
    expiresAt: number;
    lastActive: number;
    metadata?: Record<string, unknown>;
}
/**
 * Simple JWT encoder/decoder
 * Note: For production, consider using a proper JWT library
 */
declare class JwtManager {
    private readonly secret;
    private readonly algorithm;
    constructor(secret: string);
    /**
     * Sign a JWT token
     */
    sign(payload: TokenPayload): string;
    /**
     * Verify and decode a JWT token
     */
    verify(token: string): TokenPayload | null;
    /**
     * Decode without verification (use only for debugging)
     */
    decode(token: string): TokenPayload | null;
    private createSignature;
}
interface ApiKeyInfo {
    id: string;
    key: string;
    hashedKey: string;
    userId: string;
    name: string;
    scope: string[];
    createdAt: number;
    expiresAt?: number;
    lastUsed?: number;
    metadata?: Record<string, unknown>;
}
/**
 * API Key Manager for creating and validating API keys
 */
declare class ApiKeyManager {
    private keys;
    private readonly prefix;
    constructor(prefix?: string);
    /**
     * Generate a new API key
     */
    generate(options: {
        userId: string;
        name: string;
        scope?: string[];
        expiresIn?: number;
        metadata?: Record<string, unknown>;
    }): ApiKeyInfo;
    /**
     * Validate an API key
     */
    validate(key: string): ApiKeyInfo | null;
    /**
     * Revoke an API key by ID
     */
    revoke(id: string): boolean;
    /**
     * List all keys for a user (without actual key values)
     */
    listForUser(userId: string): Omit<ApiKeyInfo, "key" | "hashedKey">[];
    /**
     * Register an existing hashed key (for loading from storage)
     */
    register(info: Omit<ApiKeyInfo, "key">): void;
    /**
     * Export all keys (hashed) for persistence
     */
    export(): Omit<ApiKeyInfo, "key">[];
    private hashKey;
}
/**
 * In-memory session manager
 */
declare class SessionManager {
    private sessions;
    private readonly defaultTtl;
    constructor(defaultTtlSeconds?: number);
    /**
     * Create a new session
     */
    create(userId: string, ttl?: number, metadata?: Record<string, unknown>): Session;
    /**
     * Get a session by ID
     */
    get(sessionId: string): Session | null;
    /**
     * Extend session expiration
     */
    extend(sessionId: string, additionalMs?: number): Session | null;
    /**
     * Destroy a session
     */
    destroy(sessionId: string): boolean;
    /**
     * Destroy all sessions for a user
     */
    destroyAllForUser(userId: string): number;
    /**
     * List active sessions for a user
     */
    listForUser(userId: string): Session[];
    /**
     * Clean up expired sessions
     */
    cleanup(): number;
    /**
     * Get total active sessions count
     */
    get activeCount(): number;
}
interface AuthRequest {
    headers: Record<string, string | undefined>;
    cookies?: Record<string, string | undefined>;
}
/**
 * Authentication middleware for handling requests
 */
declare class AuthMiddleware {
    private readonly config;
    private jwtManager?;
    private apiKeyManager?;
    private sessionManager?;
    constructor(config?: Partial<AuthConfig>);
    /**
     * Authenticate a request
     */
    authenticate(request: AuthRequest): AuthResult;
    /**
     * Generate a JWT token for a user
     */
    generateToken(userId: string, options?: {
        scope?: string[];
        metadata?: Record<string, unknown>;
    }): string | null;
    /**
     * Generate a refresh token
     */
    generateRefreshToken(userId: string): string;
    /**
     * Generate an API key
     */
    generateApiKey(options: {
        userId: string;
        name: string;
        scope?: string[];
        expiresIn?: number;
    }): ApiKeyInfo | null;
    /**
     * Revoke an API key
     */
    revokeApiKey(keyId: string): boolean;
    /**
     * Create a session
     */
    createSession(userId: string, metadata?: Record<string, unknown>): Session | null;
    /**
     * Destroy a session
     */
    destroySession(sessionId: string): boolean;
    /**
     * Get the JWT manager (for custom operations)
     */
    getJwtManager(): JwtManager | undefined;
    /**
     * Get the API key manager
     */
    getApiKeyManager(): ApiKeyManager | undefined;
    /**
     * Get the session manager
     */
    getSessionManager(): SessionManager | undefined;
}
/**
 * Check if a scope array includes the required permissions
 */
declare function hasScope(userScope: string[], required: string | string[]): boolean;
/**
 * Parse authorization header
 */
declare function parseAuthHeader(header: string): {
    type: "bearer" | "apikey" | "basic" | "unknown";
    value: string;
} | null;
/**
 * Create a simple authentication guard
 */
declare function createAuthGuard(middleware: AuthMiddleware, options?: {
    requiredScope?: string[];
}): (request: AuthRequest) => AuthResult;
/**
 * Hash a password (simple bcrypt-like approach using PBKDF2)
 */
declare function hashPassword(password: string, salt?: string): Promise<{
    hash: string;
    salt: string;
}>;
/**
 * Verify a password against a hash
 */
declare function verifyPassword(password: string, hash: string, salt: string): Promise<boolean>;

/**
 * Security Headers for gICM platform
 *
 * Features:
 * - Content Security Policy (CSP)
 * - Cross-Origin Resource Sharing (CORS)
 * - HTTP Strict Transport Security (HSTS)
 * - XSS Protection
 * - Content Type Options
 * - Frame Options
 * - Referrer Policy
 */

declare const CspDirectiveSchema: z.ZodObject<{
    "default-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "script-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "style-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "img-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "font-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "connect-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "media-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "object-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "frame-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "frame-ancestors": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "form-action": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "base-uri": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "worker-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "manifest-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    "upgrade-insecure-requests": z.ZodOptional<z.ZodBoolean>;
    "block-all-mixed-content": z.ZodOptional<z.ZodBoolean>;
    "report-uri": z.ZodOptional<z.ZodString>;
    "report-to": z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    "default-src"?: string[] | undefined;
    "script-src"?: string[] | undefined;
    "style-src"?: string[] | undefined;
    "img-src"?: string[] | undefined;
    "font-src"?: string[] | undefined;
    "connect-src"?: string[] | undefined;
    "media-src"?: string[] | undefined;
    "object-src"?: string[] | undefined;
    "frame-src"?: string[] | undefined;
    "frame-ancestors"?: string[] | undefined;
    "form-action"?: string[] | undefined;
    "base-uri"?: string[] | undefined;
    "worker-src"?: string[] | undefined;
    "manifest-src"?: string[] | undefined;
    "upgrade-insecure-requests"?: boolean | undefined;
    "block-all-mixed-content"?: boolean | undefined;
    "report-uri"?: string | undefined;
    "report-to"?: string | undefined;
}, {
    "default-src"?: string[] | undefined;
    "script-src"?: string[] | undefined;
    "style-src"?: string[] | undefined;
    "img-src"?: string[] | undefined;
    "font-src"?: string[] | undefined;
    "connect-src"?: string[] | undefined;
    "media-src"?: string[] | undefined;
    "object-src"?: string[] | undefined;
    "frame-src"?: string[] | undefined;
    "frame-ancestors"?: string[] | undefined;
    "form-action"?: string[] | undefined;
    "base-uri"?: string[] | undefined;
    "worker-src"?: string[] | undefined;
    "manifest-src"?: string[] | undefined;
    "upgrade-insecure-requests"?: boolean | undefined;
    "block-all-mixed-content"?: boolean | undefined;
    "report-uri"?: string | undefined;
    "report-to"?: string | undefined;
}>;
type CspDirectives = z.infer<typeof CspDirectiveSchema>;
declare const CorsConfigSchema: z.ZodObject<{
    /** Allowed origins (use '*' for any, or array of specific origins) */
    allowedOrigins: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"*">, z.ZodArray<z.ZodString, "many">]>>;
    /** Allowed HTTP methods */
    allowedMethods: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Allowed headers */
    allowedHeaders: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Exposed headers */
    exposedHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Allow credentials */
    credentials: z.ZodDefault<z.ZodBoolean>;
    /** Max age for preflight cache (seconds) */
    maxAge: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    allowedOrigins: string[] | "*";
    allowedMethods: string[];
    allowedHeaders: string[];
    credentials: boolean;
    maxAge: number;
    exposedHeaders?: string[] | undefined;
}, {
    allowedOrigins?: string[] | "*" | undefined;
    allowedMethods?: string[] | undefined;
    allowedHeaders?: string[] | undefined;
    exposedHeaders?: string[] | undefined;
    credentials?: boolean | undefined;
    maxAge?: number | undefined;
}>;
type CorsConfig = z.infer<typeof CorsConfigSchema>;
declare const SecurityHeadersConfigSchema: z.ZodObject<{
    /** Content Security Policy */
    csp: z.ZodOptional<z.ZodObject<{
        "default-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "script-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "style-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "img-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "font-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "connect-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "media-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "object-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "frame-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "frame-ancestors": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "form-action": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "base-uri": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "worker-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "manifest-src": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        "upgrade-insecure-requests": z.ZodOptional<z.ZodBoolean>;
        "block-all-mixed-content": z.ZodOptional<z.ZodBoolean>;
        "report-uri": z.ZodOptional<z.ZodString>;
        "report-to": z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        "default-src"?: string[] | undefined;
        "script-src"?: string[] | undefined;
        "style-src"?: string[] | undefined;
        "img-src"?: string[] | undefined;
        "font-src"?: string[] | undefined;
        "connect-src"?: string[] | undefined;
        "media-src"?: string[] | undefined;
        "object-src"?: string[] | undefined;
        "frame-src"?: string[] | undefined;
        "frame-ancestors"?: string[] | undefined;
        "form-action"?: string[] | undefined;
        "base-uri"?: string[] | undefined;
        "worker-src"?: string[] | undefined;
        "manifest-src"?: string[] | undefined;
        "upgrade-insecure-requests"?: boolean | undefined;
        "block-all-mixed-content"?: boolean | undefined;
        "report-uri"?: string | undefined;
        "report-to"?: string | undefined;
    }, {
        "default-src"?: string[] | undefined;
        "script-src"?: string[] | undefined;
        "style-src"?: string[] | undefined;
        "img-src"?: string[] | undefined;
        "font-src"?: string[] | undefined;
        "connect-src"?: string[] | undefined;
        "media-src"?: string[] | undefined;
        "object-src"?: string[] | undefined;
        "frame-src"?: string[] | undefined;
        "frame-ancestors"?: string[] | undefined;
        "form-action"?: string[] | undefined;
        "base-uri"?: string[] | undefined;
        "worker-src"?: string[] | undefined;
        "manifest-src"?: string[] | undefined;
        "upgrade-insecure-requests"?: boolean | undefined;
        "block-all-mixed-content"?: boolean | undefined;
        "report-uri"?: string | undefined;
        "report-to"?: string | undefined;
    }>>;
    /** Report-only CSP (for testing) */
    cspReportOnly: z.ZodDefault<z.ZodBoolean>;
    /** CORS configuration */
    cors: z.ZodOptional<z.ZodObject<{
        /** Allowed origins (use '*' for any, or array of specific origins) */
        allowedOrigins: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"*">, z.ZodArray<z.ZodString, "many">]>>;
        /** Allowed HTTP methods */
        allowedMethods: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        /** Allowed headers */
        allowedHeaders: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        /** Exposed headers */
        exposedHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        /** Allow credentials */
        credentials: z.ZodDefault<z.ZodBoolean>;
        /** Max age for preflight cache (seconds) */
        maxAge: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        allowedOrigins: string[] | "*";
        allowedMethods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        maxAge: number;
        exposedHeaders?: string[] | undefined;
    }, {
        allowedOrigins?: string[] | "*" | undefined;
        allowedMethods?: string[] | undefined;
        allowedHeaders?: string[] | undefined;
        exposedHeaders?: string[] | undefined;
        credentials?: boolean | undefined;
        maxAge?: number | undefined;
    }>>;
    /** HTTP Strict Transport Security */
    hsts: z.ZodOptional<z.ZodObject<{
        maxAge: z.ZodDefault<z.ZodNumber>;
        includeSubDomains: z.ZodDefault<z.ZodBoolean>;
        preload: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    }, {
        maxAge?: number | undefined;
        includeSubDomains?: boolean | undefined;
        preload?: boolean | undefined;
    }>>;
    /** X-Content-Type-Options */
    noSniff: z.ZodDefault<z.ZodBoolean>;
    /** X-Frame-Options */
    frameOptions: z.ZodDefault<z.ZodEnum<["DENY", "SAMEORIGIN"]>>;
    /** X-XSS-Protection (legacy but still useful) */
    xssProtection: z.ZodDefault<z.ZodBoolean>;
    /** Referrer-Policy */
    referrerPolicy: z.ZodDefault<z.ZodEnum<["no-referrer", "no-referrer-when-downgrade", "origin", "origin-when-cross-origin", "same-origin", "strict-origin", "strict-origin-when-cross-origin", "unsafe-url"]>>;
    /** Permissions-Policy */
    permissionsPolicy: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    /** Cross-Origin-Embedder-Policy */
    coep: z.ZodOptional<z.ZodEnum<["require-corp", "credentialless", "unsafe-none"]>>;
    /** Cross-Origin-Opener-Policy */
    coop: z.ZodOptional<z.ZodEnum<["same-origin", "same-origin-allow-popups", "unsafe-none"]>>;
    /** Cross-Origin-Resource-Policy */
    corp: z.ZodOptional<z.ZodEnum<["same-site", "same-origin", "cross-origin"]>>;
}, "strip", z.ZodTypeAny, {
    cspReportOnly: boolean;
    noSniff: boolean;
    frameOptions: "DENY" | "SAMEORIGIN";
    xssProtection: boolean;
    referrerPolicy: "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url";
    csp?: {
        "default-src"?: string[] | undefined;
        "script-src"?: string[] | undefined;
        "style-src"?: string[] | undefined;
        "img-src"?: string[] | undefined;
        "font-src"?: string[] | undefined;
        "connect-src"?: string[] | undefined;
        "media-src"?: string[] | undefined;
        "object-src"?: string[] | undefined;
        "frame-src"?: string[] | undefined;
        "frame-ancestors"?: string[] | undefined;
        "form-action"?: string[] | undefined;
        "base-uri"?: string[] | undefined;
        "worker-src"?: string[] | undefined;
        "manifest-src"?: string[] | undefined;
        "upgrade-insecure-requests"?: boolean | undefined;
        "block-all-mixed-content"?: boolean | undefined;
        "report-uri"?: string | undefined;
        "report-to"?: string | undefined;
    } | undefined;
    cors?: {
        allowedOrigins: string[] | "*";
        allowedMethods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        maxAge: number;
        exposedHeaders?: string[] | undefined;
    } | undefined;
    hsts?: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    } | undefined;
    permissionsPolicy?: Record<string, string[]> | undefined;
    coep?: "require-corp" | "credentialless" | "unsafe-none" | undefined;
    coop?: "same-origin" | "unsafe-none" | "same-origin-allow-popups" | undefined;
    corp?: "same-origin" | "same-site" | "cross-origin" | undefined;
}, {
    csp?: {
        "default-src"?: string[] | undefined;
        "script-src"?: string[] | undefined;
        "style-src"?: string[] | undefined;
        "img-src"?: string[] | undefined;
        "font-src"?: string[] | undefined;
        "connect-src"?: string[] | undefined;
        "media-src"?: string[] | undefined;
        "object-src"?: string[] | undefined;
        "frame-src"?: string[] | undefined;
        "frame-ancestors"?: string[] | undefined;
        "form-action"?: string[] | undefined;
        "base-uri"?: string[] | undefined;
        "worker-src"?: string[] | undefined;
        "manifest-src"?: string[] | undefined;
        "upgrade-insecure-requests"?: boolean | undefined;
        "block-all-mixed-content"?: boolean | undefined;
        "report-uri"?: string | undefined;
        "report-to"?: string | undefined;
    } | undefined;
    cspReportOnly?: boolean | undefined;
    cors?: {
        allowedOrigins?: string[] | "*" | undefined;
        allowedMethods?: string[] | undefined;
        allowedHeaders?: string[] | undefined;
        exposedHeaders?: string[] | undefined;
        credentials?: boolean | undefined;
        maxAge?: number | undefined;
    } | undefined;
    hsts?: {
        maxAge?: number | undefined;
        includeSubDomains?: boolean | undefined;
        preload?: boolean | undefined;
    } | undefined;
    noSniff?: boolean | undefined;
    frameOptions?: "DENY" | "SAMEORIGIN" | undefined;
    xssProtection?: boolean | undefined;
    referrerPolicy?: "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url" | undefined;
    permissionsPolicy?: Record<string, string[]> | undefined;
    coep?: "require-corp" | "credentialless" | "unsafe-none" | undefined;
    coop?: "same-origin" | "unsafe-none" | "same-origin-allow-popups" | undefined;
    corp?: "same-origin" | "same-site" | "cross-origin" | undefined;
}>;
type SecurityHeadersConfig = z.infer<typeof SecurityHeadersConfigSchema>;
/**
 * Build a Content Security Policy string from directives
 */
declare function buildCspString(directives: CspDirectives): string;
/**
 * CSP presets for common use cases
 */
declare const CSP_PRESETS: {
    strict: CspDirectives;
    moderate: CspDirectives;
    relaxed: CspDirectives;
    api: CspDirectives;
};
interface CorsHeaders {
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods"?: string;
    "Access-Control-Allow-Headers"?: string;
    "Access-Control-Expose-Headers"?: string;
    "Access-Control-Allow-Credentials"?: string;
    "Access-Control-Max-Age"?: string;
}
/**
 * Generate CORS headers for a request
 */
declare function generateCorsHeaders(origin: string | undefined, config: CorsConfig, isPreflight?: boolean): CorsHeaders | null;
/**
 * Generate all security headers based on configuration
 */
declare function generateSecurityHeaders(config: SecurityHeadersConfig, options?: {
    origin?: string;
    isPreflight?: boolean;
}): Record<string, string>;
interface HttpRequest {
    method: string;
    headers: Record<string, string | undefined>;
    url?: string;
}
interface HttpResponse {
    headers: Record<string, string>;
    statusCode?: number;
}
/**
 * SecurityHeadersMiddleware applies security headers to responses
 */
declare class SecurityHeadersMiddleware {
    private readonly config;
    constructor(config?: Partial<SecurityHeadersConfig>);
    /**
     * Apply security headers to a response
     */
    apply(request: HttpRequest, response: HttpResponse): HttpResponse;
    /**
     * Handle CORS preflight request
     */
    handlePreflight(request: HttpRequest): HttpResponse | null;
    /**
     * Get current configuration
     */
    getConfig(): SecurityHeadersConfig;
}
/**
 * Pre-configured security header profiles
 */
declare const SECURITY_PRESETS: {
    /** Strict security for production APIs */
    strictApi: SecurityHeadersConfig;
    /** Moderate security for web applications */
    webApp: SecurityHeadersConfig;
    /** Relaxed for development */
    development: SecurityHeadersConfig;
    /** For public APIs with CORS */
    publicApi: SecurityHeadersConfig;
};
/**
 * Create a nonce for inline scripts/styles
 */
declare function generateNonce(): string;
/**
 * Add nonce to CSP directives
 */
declare function addNonceToCsp(directives: CspDirectives, nonce: string, targets?: ("script-src" | "style-src")[]): CspDirectives;
/**
 * Merge CSP directives
 */
declare function mergeCspDirectives(base: CspDirectives, override: Partial<CspDirectives>): CspDirectives;
/**
 * Validate an origin against allowed origins
 */
declare function isOriginAllowed(origin: string, allowedOrigins: string[] | "*"): boolean;
/**
 * Create security headers for static file serving
 */
declare function createStaticFileHeaders(contentType: string): Record<string, string>;

export { type ApiKeyInfo, ApiKeyManager, type AuthConfig, AuthMiddleware, type AuthRequest, type AuthResult, CSP_PRESETS, CompositeSecretBackend, type CorsConfig, type CorsHeaders, type CspDirectives, EnvSecretBackend, FixedWindowLimiter, type HttpRequest, type HttpResponse, JwtManager, MemorySecretBackend, MultiTierRateLimiter, type RateLimitConfig, RateLimitError, type RateLimitResult, type RateLimitStats, RateLimiter, SECURITY_PRESETS, type SecretBackend, type SecretMetadata, type SecretValue, SecretsManager, type SecretsManagerConfig, type SecurityHeadersConfig, SecurityHeadersMiddleware, type Session, SessionManager, SlidingWindowLimiter, type TierConfig, TokenBucketLimiter, type TokenPayload, addNonceToCsp, buildCspString, createApiRateLimiter, createAuthGuard, createLLMRateLimiter, createRateLimitHeaders, createSecretsManager, createStaticFileHeaders, generateApiKey, generateCorsHeaders, generateNonce, generateSecretKey, generateSecurityHeaders, hasScope, hashPassword, isOriginAllowed, isValidApiKey, mergeCspDirectives, parseAuthHeader, redactSecrets, verifyPassword };
