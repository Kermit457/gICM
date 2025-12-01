/**
 * API Authentication Module
 * Phase 13C: API Authentication
 */

// Types & Schemas
export {
  // Auth Methods
  AuthMethodSchema,
  type AuthMethod,

  // API Key
  ApiKeyLocationSchema,
  type ApiKeyLocation,
  ApiKeyConfigSchema,
  type ApiKeyConfig,
  ApiKeySchema,
  type ApiKey,

  // JWT
  JwtAlgorithmSchema,
  type JwtAlgorithm,
  JwtConfigSchema,
  type JwtConfig,
  JwtPayloadSchema,
  type JwtPayload,

  // OAuth2
  OAuth2GrantTypeSchema,
  type OAuth2GrantType,
  OAuth2ConfigSchema,
  type OAuth2Config,
  OAuth2TokenSchema,
  type OAuth2Token,

  // Basic Auth
  BasicAuthConfigSchema,
  type BasicAuthConfig,
  BasicCredentialsSchema,
  type BasicCredentials,

  // Bearer
  BearerConfigSchema,
  type BearerConfig,

  // Custom
  CustomAuthConfigSchema,
  type CustomAuthConfig,

  // Combined Config
  ApiAuthConfigSchema,
  type ApiAuthConfig,

  // Request/Result
  ApiAuthRequestSchema,
  type ApiAuthRequest,
  ApiAuthResultSchema,
  type ApiAuthResult,

  // Token & Session
  StoredTokenSchema,
  type StoredToken,
  ApiSessionSchema,
  type ApiSession,

  // Manager Config
  ApiAuthManagerConfigSchema,
  type ApiAuthManagerConfig,

  // Audit
  ApiAuthAuditEntrySchema,
  type ApiAuthAuditEntry,

  // Events & Interfaces
  type ApiAuthEvents,
  type ApiAuthProvider,
  type ApiAuthStorage,
} from "./types.js";

// Auth Manager
export {
  ApiAuthManager,
  AuthenticationError,
  TokenExpiredError,
  TokenRevokedError,
  InvalidCredentialsError,
  getApiAuthManager,
  createApiAuthManager,
} from "./auth-manager.js";
