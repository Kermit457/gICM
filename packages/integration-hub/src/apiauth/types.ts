/**
 * API Authentication Types
 * Phase 13C: API Authentication
 */

import { z } from "zod";

// =============================================================================
// Authentication Methods
// =============================================================================

export const AuthMethodSchema = z.enum([
  "api_key",
  "jwt",
  "oauth2",
  "basic",
  "bearer",
  "custom",
]);
export type AuthMethod = z.infer<typeof AuthMethodSchema>;

// =============================================================================
// API Key Authentication
// =============================================================================

export const ApiKeyLocationSchema = z.enum(["header", "query", "cookie"]);
export type ApiKeyLocation = z.infer<typeof ApiKeyLocationSchema>;

export const ApiKeyConfigSchema = z.object({
  method: z.literal("api_key"),
  location: ApiKeyLocationSchema.default("header"),
  name: z.string().default("X-API-Key"),
  prefix: z.string().optional(),
  hashAlgorithm: z.enum(["sha256", "sha512", "none"]).default("sha256"),
});
export type ApiKeyConfig = z.infer<typeof ApiKeyConfigSchema>;

export const ApiKeySchema = z.object({
  id: z.string(),
  key: z.string().describe("The hashed key (or plain if hash is none)"),
  name: z.string(),
  description: z.string().optional(),
  clientId: z.string().optional(),
  scopes: z.array(z.string()).default([]),
  rateLimit: z.number().optional().describe("Requests per hour"),
  expiresAt: z.number().optional(),
  createdAt: z.number(),
  lastUsedAt: z.number().optional(),
  enabled: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

// =============================================================================
// JWT Authentication
// =============================================================================

export const JwtAlgorithmSchema = z.enum([
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512",
  "PS256",
  "PS384",
  "PS512",
]);
export type JwtAlgorithm = z.infer<typeof JwtAlgorithmSchema>;

export const JwtConfigSchema = z.object({
  method: z.literal("jwt"),
  algorithm: JwtAlgorithmSchema.default("RS256"),
  secret: z.string().optional().describe("For HS* algorithms"),
  publicKey: z.string().optional().describe("For RS*/ES*/PS* algorithms"),
  privateKey: z.string().optional().describe("For signing"),
  issuer: z.string().optional(),
  audience: z.union([z.string(), z.array(z.string())]).optional(),
  clockTolerance: z.number().default(60).describe("Seconds"),
  maxAge: z.number().optional().describe("Max token age in seconds"),
  jwksUri: z.string().optional().describe("JWKS endpoint for key rotation"),
  jwksCacheTtl: z.number().default(3600).describe("Cache TTL in seconds"),
});
export type JwtConfig = z.infer<typeof JwtConfigSchema>;

export const JwtPayloadSchema = z.object({
  sub: z.string().optional(),
  iss: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  exp: z.number().optional(),
  nbf: z.number().optional(),
  iat: z.number().optional(),
  jti: z.string().optional(),
  // Custom claims
  scopes: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  clientId: z.string().optional(),
}).passthrough();
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// =============================================================================
// OAuth2 Authentication
// =============================================================================

export const OAuth2GrantTypeSchema = z.enum([
  "authorization_code",
  "client_credentials",
  "refresh_token",
  "password",
  "device_code",
]);
export type OAuth2GrantType = z.infer<typeof OAuth2GrantTypeSchema>;

export const OAuth2ConfigSchema = z.object({
  method: z.literal("oauth2"),
  clientId: z.string(),
  clientSecret: z.string().optional(),
  authorizationUrl: z.string().optional(),
  tokenUrl: z.string(),
  userInfoUrl: z.string().optional(),
  jwksUri: z.string().optional(),
  scopes: z.array(z.string()).default([]),
  redirectUri: z.string().optional(),
  grantTypes: z.array(OAuth2GrantTypeSchema).default(["authorization_code"]),
  pkce: z.boolean().default(true),
  state: z.boolean().default(true),
});
export type OAuth2Config = z.infer<typeof OAuth2ConfigSchema>;

export const OAuth2TokenSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string().default("Bearer"),
  expiresIn: z.number().optional(),
  refreshToken: z.string().optional(),
  scope: z.string().optional(),
  idToken: z.string().optional(),
});
export type OAuth2Token = z.infer<typeof OAuth2TokenSchema>;

// =============================================================================
// Basic Authentication
// =============================================================================

export const BasicAuthConfigSchema = z.object({
  method: z.literal("basic"),
  realm: z.string().default("API"),
  hashAlgorithm: z.enum(["bcrypt", "argon2", "scrypt", "none"]).default("bcrypt"),
});
export type BasicAuthConfig = z.infer<typeof BasicAuthConfigSchema>;

export const BasicCredentialsSchema = z.object({
  id: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  scopes: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  createdAt: z.number(),
  lastLoginAt: z.number().optional(),
});
export type BasicCredentials = z.infer<typeof BasicCredentialsSchema>;

// =============================================================================
// Bearer Token
// =============================================================================

export const BearerConfigSchema = z.object({
  method: z.literal("bearer"),
  validateFn: z.string().optional().describe("Custom validation function name"),
  tokenFormat: z.enum(["opaque", "jwt"]).default("opaque"),
});
export type BearerConfig = z.infer<typeof BearerConfigSchema>;

// =============================================================================
// Custom Authentication
// =============================================================================

export const CustomAuthConfigSchema = z.object({
  method: z.literal("custom"),
  handler: z.string().describe("Handler function name"),
  config: z.record(z.unknown()).optional(),
});
export type CustomAuthConfig = z.infer<typeof CustomAuthConfigSchema>;

// =============================================================================
// Combined Auth Config
// =============================================================================

export const ApiAuthConfigSchema = z.discriminatedUnion("method", [
  ApiKeyConfigSchema,
  JwtConfigSchema,
  OAuth2ConfigSchema,
  BasicAuthConfigSchema,
  BearerConfigSchema,
  CustomAuthConfigSchema,
]);
export type ApiAuthConfig = z.infer<typeof ApiAuthConfigSchema>;

// =============================================================================
// Authentication Result
// =============================================================================

export const ApiAuthResultSchema = z.object({
  authenticated: z.boolean(),
  method: AuthMethodSchema.optional(),
  principal: z.object({
    id: z.string(),
    type: z.enum(["user", "service", "api_key", "anonymous"]),
    name: z.string().optional(),
    email: z.string().optional(),
    scopes: z.array(z.string()).default([]),
    roles: z.array(z.string()).default([]),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
  token: z.object({
    raw: z.string(),
    type: z.string(),
    expiresAt: z.number().optional(),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});
export type ApiAuthResult = z.infer<typeof ApiAuthResultSchema>;

// =============================================================================
// Authentication Request
// =============================================================================

export const ApiAuthRequestSchema = z.object({
  headers: z.record(z.string()).optional(),
  query: z.record(z.string()).optional(),
  cookies: z.record(z.string()).optional(),
  body: z.record(z.unknown()).optional(),
  method: z.string().optional(),
  path: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});
export type ApiAuthRequest = z.infer<typeof ApiAuthRequestSchema>;

// =============================================================================
// Token Storage
// =============================================================================

export const StoredTokenSchema = z.object({
  id: z.string(),
  token: z.string(),
  tokenType: z.enum(["access", "refresh", "id"]),
  principalId: z.string(),
  clientId: z.string().optional(),
  scopes: z.array(z.string()).default([]),
  issuedAt: z.number(),
  expiresAt: z.number().optional(),
  revokedAt: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type StoredToken = z.infer<typeof StoredTokenSchema>;

// =============================================================================
// Session
// =============================================================================

export const ApiSessionSchema = z.object({
  id: z.string(),
  principalId: z.string(),
  createdAt: z.number(),
  expiresAt: z.number(),
  lastActivityAt: z.number(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  data: z.record(z.unknown()).default({}),
});
export type ApiSession = z.infer<typeof ApiSessionSchema>;

// =============================================================================
// Auth Manager Config
// =============================================================================

export const ApiAuthManagerConfigSchema = z.object({
  methods: z.array(ApiAuthConfigSchema).min(1),
  defaultMethod: AuthMethodSchema.optional(),
  fallbackToAnonymous: z.boolean().default(false),
  sessionConfig: z.object({
    enabled: z.boolean().default(false),
    ttlSeconds: z.number().default(3600),
    renewOnActivity: z.boolean().default(true),
    cookieName: z.string().default("session_id"),
    secure: z.boolean().default(true),
    sameSite: z.enum(["strict", "lax", "none"]).default("lax"),
  }).optional(),
  tokenRefresh: z.object({
    enabled: z.boolean().default(true),
    refreshThresholdSeconds: z.number().default(300),
  }).optional(),
  audit: z.object({
    enabled: z.boolean().default(true),
    logSuccessful: z.boolean().default(true),
    logFailed: z.boolean().default(true),
  }).optional(),
});
export type ApiAuthManagerConfig = z.infer<typeof ApiAuthManagerConfigSchema>;

// =============================================================================
// Audit Entry
// =============================================================================

export const ApiAuthAuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  method: AuthMethodSchema,
  success: z.boolean(),
  principalId: z.string().optional(),
  clientId: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  path: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type ApiAuthAuditEntry = z.infer<typeof ApiAuthAuditEntrySchema>;

// =============================================================================
// Events
// =============================================================================

export type ApiAuthEvents = {
  // Authentication Events
  authenticated: (result: ApiAuthResult) => void;
  authFailed: (result: ApiAuthResult, request: ApiAuthRequest) => void;
  tokenIssued: (token: StoredToken) => void;
  tokenRefreshed: (oldToken: string, newToken: StoredToken) => void;
  tokenRevoked: (tokenId: string, reason?: string) => void;

  // Session Events
  sessionCreated: (session: ApiSession) => void;
  sessionDestroyed: (sessionId: string) => void;
  sessionExpired: (sessionId: string) => void;

  // API Key Events
  apiKeyCreated: (apiKey: ApiKey) => void;
  apiKeyRevoked: (apiKeyId: string) => void;
  apiKeyUsed: (apiKeyId: string) => void;

  // Audit Events
  auditLogged: (entry: ApiAuthAuditEntry) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Provider Interface
// =============================================================================

export interface ApiAuthProvider {
  readonly method: AuthMethod;
  authenticate(request: ApiAuthRequest): Promise<ApiAuthResult>;
  validate?(token: string): Promise<ApiAuthResult>;
  refresh?(refreshToken: string): Promise<OAuth2Token | null>;
  revoke?(token: string): Promise<boolean>;
}

// =============================================================================
// Storage Interface
// =============================================================================

export interface ApiAuthStorage {
  // API Keys
  getApiKey(id: string): Promise<ApiKey | null>;
  getApiKeyByHash(hash: string): Promise<ApiKey | null>;
  saveApiKey(apiKey: ApiKey): Promise<void>;
  deleteApiKey(id: string): Promise<void>;
  listApiKeys(clientId?: string): Promise<ApiKey[]>;

  // Tokens
  getToken(id: string): Promise<StoredToken | null>;
  saveToken(token: StoredToken): Promise<void>;
  deleteToken(id: string): Promise<void>;
  deleteTokensByPrincipal(principalId: string): Promise<void>;

  // Sessions
  getSession(id: string): Promise<ApiSession | null>;
  saveSession(session: ApiSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
  deleteSessionsByPrincipal(principalId: string): Promise<void>;

  // Basic Credentials
  getCredentials(username: string): Promise<BasicCredentials | null>;
  saveCredentials(credentials: BasicCredentials): Promise<void>;
  deleteCredentials(username: string): Promise<void>;
}
