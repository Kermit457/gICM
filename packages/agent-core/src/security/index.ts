/**
 * Security utilities for gICM platform
 *
 * Provides:
 * - Secrets management
 * - Rate limiting
 * - API authentication
 * - Security headers
 */

// Secrets Manager
export {
  SecretsManager,
  EnvSecretBackend,
  MemorySecretBackend,
  CompositeSecretBackend,
  generateSecretKey,
  generateApiKey,
  isValidApiKey,
  redactSecrets,
  createSecretsManager,
} from "./secrets.js";

export type {
  SecretMetadata,
  SecretValue,
  SecretBackend,
  SecretsManagerConfig,
} from "./secrets.js";

// Rate Limiter
export {
  RateLimiter,
  RateLimitError,
  TokenBucketLimiter,
  SlidingWindowLimiter,
  FixedWindowLimiter,
  MultiTierRateLimiter,
  createApiRateLimiter,
  createLLMRateLimiter,
  createRateLimitHeaders,
} from "./rate-limiter.js";

export type {
  RateLimitConfig,
  RateLimitResult,
  RateLimitStats,
  TierConfig,
} from "./rate-limiter.js";

// Authentication
export {
  JwtManager,
  ApiKeyManager,
  SessionManager,
  AuthMiddleware,
  hasScope,
  parseAuthHeader,
  createAuthGuard,
  hashPassword,
  verifyPassword,
} from "./auth.js";

export type {
  AuthConfig,
  TokenPayload,
  AuthResult,
  Session,
  ApiKeyInfo,
  AuthRequest,
} from "./auth.js";

// Security Headers
export {
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
  createStaticFileHeaders,
} from "./headers.js";

export type {
  CspDirectives,
  CorsConfig,
  SecurityHeadersConfig,
  CorsHeaders,
  HttpRequest,
  HttpResponse,
} from "./headers.js";
