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

import { z } from "zod";
import { createHash, randomBytes, createHmac, timingSafeEqual } from "crypto";

// ============================================================================
// Types
// ============================================================================

export const AuthConfigSchema = z.object({
  /** JWT secret for signing tokens */
  jwtSecret: z.string().min(32).optional(),
  /** Token expiration in seconds */
  tokenExpiration: z.number().default(3600), // 1 hour
  /** Refresh token expiration in seconds */
  refreshExpiration: z.number().default(604800), // 7 days
  /** API key prefix for validation */
  apiKeyPrefix: z.string().default("gicm"),
  /** Enable API key authentication */
  enableApiKey: z.boolean().default(true),
  /** Enable JWT authentication */
  enableJwt: z.boolean().default(true),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

export interface TokenPayload {
  sub: string; // Subject (user ID)
  iat: number; // Issued at
  exp: number; // Expiration
  scope?: string[]; // Permissions
  metadata?: Record<string, unknown>;
}

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  scope?: string[];
  expiresAt?: number;
  error?: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastActive: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// JWT Implementation (Simple base64url encoding without external deps)
// ============================================================================

function base64urlEncode(data: string | Buffer): string {
  const base64 = Buffer.from(data).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Simple JWT encoder/decoder
 * Note: For production, consider using a proper JWT library
 */
export class JwtManager {
  private readonly secret: string;
  private readonly algorithm = "HS256";

  constructor(secret: string) {
    if (secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters");
    }
    this.secret = secret;
  }

  /**
   * Sign a JWT token
   */
  sign(payload: TokenPayload): string {
    const header = { alg: this.algorithm, typ: "JWT" };
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));

    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode a JWT token
   */
  verify(token: string): TokenPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`
    );

    // Use timing-safe comparison
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    try {
      const payload = JSON.parse(base64urlDecode(encodedPayload)) as TokenPayload;

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
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
  decode(token: string): TokenPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    try {
      return JSON.parse(base64urlDecode(parts[1])) as TokenPayload;
    } catch {
      return null;
    }
  }

  private createSignature(data: string): string {
    const hmac = createHmac("sha256", this.secret);
    hmac.update(data);
    return base64urlEncode(hmac.digest());
  }
}

// ============================================================================
// API Key Manager
// ============================================================================

export interface ApiKeyInfo {
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
export class ApiKeyManager {
  private keys: Map<string, ApiKeyInfo> = new Map();
  private readonly prefix: string;

  constructor(prefix = "gicm") {
    this.prefix = prefix;
  }

  /**
   * Generate a new API key
   */
  generate(options: {
    userId: string;
    name: string;
    scope?: string[];
    expiresIn?: number;
    metadata?: Record<string, unknown>;
  }): ApiKeyInfo {
    const id = randomBytes(8).toString("hex");
    const keyBytes = randomBytes(24);
    const key = `${this.prefix}_${keyBytes.toString("hex")}`;
    const hashedKey = this.hashKey(key);

    const now = Date.now();
    const info: ApiKeyInfo = {
      id,
      key, // Only returned on creation
      hashedKey,
      userId: options.userId,
      name: options.name,
      scope: options.scope ?? ["read"],
      createdAt: now,
      expiresAt: options.expiresIn ? now + options.expiresIn * 1000 : undefined,
      metadata: options.metadata,
    };

    this.keys.set(hashedKey, info);
    return info;
  }

  /**
   * Validate an API key
   */
  validate(key: string): ApiKeyInfo | null {
    if (!key.startsWith(`${this.prefix}_`)) {
      return null;
    }

    const hashedKey = this.hashKey(key);
    const info = this.keys.get(hashedKey);

    if (!info) {
      return null;
    }

    // Check expiration
    if (info.expiresAt && info.expiresAt < Date.now()) {
      return null;
    }

    // Update last used
    info.lastUsed = Date.now();

    // Return without the actual key
    return { ...info, key: "" };
  }

  /**
   * Revoke an API key by ID
   */
  revoke(id: string): boolean {
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
  listForUser(userId: string): Omit<ApiKeyInfo, "key" | "hashedKey">[] {
    const result: Omit<ApiKeyInfo, "key" | "hashedKey">[] = [];
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
  register(info: Omit<ApiKeyInfo, "key">): void {
    this.keys.set(info.hashedKey, { ...info, key: "" });
  }

  /**
   * Export all keys (hashed) for persistence
   */
  export(): Omit<ApiKeyInfo, "key">[] {
    return Array.from(this.keys.values()).map(({ key: _, ...rest }) => rest);
  }

  private hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }
}

// ============================================================================
// Session Manager
// ============================================================================

/**
 * In-memory session manager
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly defaultTtl: number;

  constructor(defaultTtlSeconds = 3600) {
    this.defaultTtl = defaultTtlSeconds * 1000;
  }

  /**
   * Create a new session
   */
  create(userId: string, ttl?: number, metadata?: Record<string, unknown>): Session {
    const id = randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.defaultTtl);

    const session: Session = {
      id,
      userId,
      createdAt: now,
      expiresAt,
      lastActive: now,
      metadata,
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  get(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check expiration
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last active
    session.lastActive = Date.now();
    return session;
  }

  /**
   * Extend session expiration
   */
  extend(sessionId: string, additionalMs?: number): Session | null {
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
  destroy(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Destroy all sessions for a user
   */
  destroyAllForUser(userId: string): number {
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
  listForUser(userId: string): Session[] {
    const now = Date.now();
    const result: Session[] = [];
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
  cleanup(): number {
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
  get activeCount(): number {
    const now = Date.now();
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.expiresAt > now) {
        count++;
      }
    }
    return count;
  }
}

// ============================================================================
// Auth Middleware
// ============================================================================

export interface AuthRequest {
  headers: Record<string, string | undefined>;
  cookies?: Record<string, string | undefined>;
}

/**
 * Authentication middleware for handling requests
 */
export class AuthMiddleware {
  private readonly config: AuthConfig;
  private jwtManager?: JwtManager;
  private apiKeyManager?: ApiKeyManager;
  private sessionManager?: SessionManager;

  constructor(config: Partial<AuthConfig> = {}) {
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
  authenticate(request: AuthRequest): AuthResult {
    const authHeader = request.headers.authorization || request.headers.Authorization;

    // Try Bearer token (JWT)
    if (authHeader?.startsWith("Bearer ") && this.jwtManager) {
      const token = authHeader.slice(7);
      const payload = this.jwtManager.verify(token);

      if (payload) {
        return {
          authenticated: true,
          userId: payload.sub,
          scope: payload.scope,
          expiresAt: payload.exp * 1000,
        };
      }
      return { authenticated: false, error: "Invalid or expired token" };
    }

    // Try API key from header
    if (authHeader && this.apiKeyManager) {
      const key = authHeader.startsWith("ApiKey ")
        ? authHeader.slice(7)
        : authHeader;

      const info = this.apiKeyManager.validate(key);
      if (info) {
        return {
          authenticated: true,
          userId: info.userId,
          scope: info.scope,
          expiresAt: info.expiresAt,
        };
      }
    }

    // Try session cookie
    const sessionId = request.cookies?.session;
    if (sessionId && this.sessionManager) {
      const session = this.sessionManager.get(sessionId);
      if (session) {
        return {
          authenticated: true,
          userId: session.userId,
          expiresAt: session.expiresAt,
        };
      }
    }

    return { authenticated: false, error: "No valid credentials provided" };
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(
    userId: string,
    options?: { scope?: string[]; metadata?: Record<string, unknown> }
  ): string | null {
    if (!this.jwtManager) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: userId,
      iat: now,
      exp: now + this.config.tokenExpiration,
      scope: options?.scope,
      metadata: options?.metadata,
    };

    return this.jwtManager.sign(payload);
  }

  /**
   * Generate a refresh token
   */
  generateRefreshToken(userId: string): string {
    const token = randomBytes(32).toString("hex");
    // In production, store this in a database with userId and expiration
    return token;
  }

  /**
   * Generate an API key
   */
  generateApiKey(options: {
    userId: string;
    name: string;
    scope?: string[];
    expiresIn?: number;
  }): ApiKeyInfo | null {
    if (!this.apiKeyManager) {
      return null;
    }
    return this.apiKeyManager.generate(options);
  }

  /**
   * Revoke an API key
   */
  revokeApiKey(keyId: string): boolean {
    return this.apiKeyManager?.revoke(keyId) ?? false;
  }

  /**
   * Create a session
   */
  createSession(
    userId: string,
    metadata?: Record<string, unknown>
  ): Session | null {
    if (!this.sessionManager) {
      return null;
    }
    return this.sessionManager.create(userId, this.config.tokenExpiration, metadata);
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): boolean {
    return this.sessionManager?.destroy(sessionId) ?? false;
  }

  /**
   * Get the JWT manager (for custom operations)
   */
  getJwtManager(): JwtManager | undefined {
    return this.jwtManager;
  }

  /**
   * Get the API key manager
   */
  getApiKeyManager(): ApiKeyManager | undefined {
    return this.apiKeyManager;
  }

  /**
   * Get the session manager
   */
  getSessionManager(): SessionManager | undefined {
    return this.sessionManager;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a scope array includes the required permissions
 */
export function hasScope(userScope: string[], required: string | string[]): boolean {
  const requiredScopes = Array.isArray(required) ? required : [required];

  // Wildcard check
  if (userScope.includes("*") || userScope.includes("admin")) {
    return true;
  }

  return requiredScopes.every((scope) => {
    // Direct match
    if (userScope.includes(scope)) {
      return true;
    }

    // Hierarchical check (e.g., "read:users" matches "read:*")
    const [action, resource] = scope.split(":");
    if (resource && userScope.includes(`${action}:*`)) {
      return true;
    }

    return false;
  });
}

/**
 * Parse authorization header
 */
export function parseAuthHeader(
  header: string
): { type: "bearer" | "apikey" | "basic" | "unknown"; value: string } | null {
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

  // Might be a raw API key
  if (header.includes("_")) {
    return { type: "apikey", value: header };
  }

  return { type: "unknown", value: header };
}

/**
 * Create a simple authentication guard
 */
export function createAuthGuard(
  middleware: AuthMiddleware,
  options?: { requiredScope?: string[] }
) {
  return (request: AuthRequest): AuthResult => {
    const result = middleware.authenticate(request);

    if (!result.authenticated) {
      return result;
    }

    if (
      options?.requiredScope &&
      result.scope &&
      !hasScope(result.scope, options.requiredScope)
    ) {
      return {
        authenticated: false,
        error: "Insufficient permissions",
      };
    }

    return result;
  };
}

/**
 * Hash a password (simple bcrypt-like approach using PBKDF2)
 */
export async function hashPassword(
  password: string,
  salt?: string
): Promise<{ hash: string; salt: string }> {
  const crypto = await import("crypto");
  const useSalt = salt ?? crypto.randomBytes(16).toString("hex");

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, useSalt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      else
        resolve({
          hash: derivedKey.toString("hex"),
          salt: useSalt,
        });
    });
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  const result = await hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(result.hash), Buffer.from(hash));
}
