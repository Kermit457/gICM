/**
 * API Authentication Manager
 * Phase 13C: API Authentication
 */

import { EventEmitter } from "eventemitter3";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import {
  type ApiAuthManagerConfig,
  ApiAuthManagerConfigSchema,
  type ApiAuthConfig,
  type ApiAuthRequest,
  type ApiAuthResult,
  type ApiAuthProvider,
  type ApiAuthStorage,
  type ApiKey,
  type StoredToken,
  type ApiSession,
  type ApiAuthAuditEntry,
  type ApiAuthEvents,
  type AuthMethod,
  type OAuth2Token,
} from "./types.js";

// =============================================================================
// Errors
// =============================================================================

export class AuthenticationError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message = "Token has expired") {
    super("TOKEN_EXPIRED", message);
    this.name = "TokenExpiredError";
  }
}

export class TokenRevokedError extends AuthenticationError {
  constructor(message = "Token has been revoked") {
    super("TOKEN_REVOKED", message);
    this.name = "TokenRevokedError";
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(message = "Invalid credentials") {
    super("INVALID_CREDENTIALS", message);
    this.name = "InvalidCredentialsError";
  }
}

// =============================================================================
// In-Memory Storage
// =============================================================================

class MemoryAuthStorage implements ApiAuthStorage {
  private apiKeys = new Map<string, ApiKey>();
  private apiKeysByHash = new Map<string, ApiKey>();
  private tokens = new Map<string, StoredToken>();
  private sessions = new Map<string, ApiSession>();
  private credentials = new Map<string, { id: string; username: string; passwordHash: string; scopes: string[]; enabled: boolean; createdAt: number; lastLoginAt?: number }>();

  async getApiKey(id: string): Promise<ApiKey | null> {
    return this.apiKeys.get(id) ?? null;
  }

  async getApiKeyByHash(hash: string): Promise<ApiKey | null> {
    return this.apiKeysByHash.get(hash) ?? null;
  }

  async saveApiKey(apiKey: ApiKey): Promise<void> {
    this.apiKeys.set(apiKey.id, apiKey);
    this.apiKeysByHash.set(apiKey.key, apiKey);
  }

  async deleteApiKey(id: string): Promise<void> {
    const apiKey = this.apiKeys.get(id);
    if (apiKey) {
      this.apiKeysByHash.delete(apiKey.key);
      this.apiKeys.delete(id);
    }
  }

  async listApiKeys(clientId?: string): Promise<ApiKey[]> {
    const keys = Array.from(this.apiKeys.values());
    return clientId ? keys.filter(k => k.clientId === clientId) : keys;
  }

  async getToken(id: string): Promise<StoredToken | null> {
    return this.tokens.get(id) ?? null;
  }

  async saveToken(token: StoredToken): Promise<void> {
    this.tokens.set(token.id, token);
  }

  async deleteToken(id: string): Promise<void> {
    this.tokens.delete(id);
  }

  async deleteTokensByPrincipal(principalId: string): Promise<void> {
    for (const [id, token] of this.tokens) {
      if (token.principalId === principalId) {
        this.tokens.delete(id);
      }
    }
  }

  async getSession(id: string): Promise<ApiSession | null> {
    const session = this.sessions.get(id);
    if (session && session.expiresAt < Date.now()) {
      this.sessions.delete(id);
      return null;
    }
    return session ?? null;
  }

  async saveSession(session: ApiSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async deleteSessionsByPrincipal(principalId: string): Promise<void> {
    for (const [id, session] of this.sessions) {
      if (session.principalId === principalId) {
        this.sessions.delete(id);
      }
    }
  }

  async getCredentials(username: string): Promise<{ id: string; username: string; passwordHash: string; scopes: string[]; enabled: boolean; createdAt: number; lastLoginAt?: number } | null> {
    return this.credentials.get(username) ?? null;
  }

  async saveCredentials(credentials: { id: string; username: string; passwordHash: string; scopes: string[]; enabled: boolean; createdAt: number; lastLoginAt?: number }): Promise<void> {
    this.credentials.set(credentials.username, credentials);
  }

  async deleteCredentials(username: string): Promise<void> {
    this.credentials.delete(username);
  }
}

// =============================================================================
// API Key Provider
// =============================================================================

class ApiKeyProvider implements ApiAuthProvider {
  readonly method: AuthMethod = "api_key";

  constructor(
    private config: ApiAuthConfig & { method: "api_key" },
    private storage: ApiAuthStorage
  ) {}

  async authenticate(request: ApiAuthRequest): Promise<ApiAuthResult> {
    // Extract API key from request
    let rawKey: string | undefined;

    switch (this.config.location) {
      case "header":
        rawKey = request.headers?.[this.config.name.toLowerCase()];
        break;
      case "query":
        rawKey = request.query?.[this.config.name];
        break;
      case "cookie":
        rawKey = request.cookies?.[this.config.name];
        break;
    }

    if (!rawKey) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "NO_API_KEY", message: "API key not provided" },
      };
    }

    // Remove prefix if configured
    if (this.config.prefix && rawKey.startsWith(this.config.prefix)) {
      rawKey = rawKey.slice(this.config.prefix.length);
    }

    // Hash the key
    const keyHash = this.config.hashAlgorithm === "none"
      ? rawKey
      : createHash(this.config.hashAlgorithm).update(rawKey).digest("hex");

    // Look up API key
    const apiKey = await this.storage.getApiKeyByHash(keyHash);

    if (!apiKey) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "INVALID_API_KEY", message: "Invalid API key" },
      };
    }

    if (!apiKey.enabled) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "API_KEY_DISABLED", message: "API key is disabled" },
      };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "API_KEY_EXPIRED", message: "API key has expired" },
      };
    }

    // Update last used
    apiKey.lastUsedAt = Date.now();
    await this.storage.saveApiKey(apiKey);

    return {
      authenticated: true,
      method: this.method,
      principal: {
        id: apiKey.clientId ?? apiKey.id,
        type: "api_key",
        name: apiKey.name,
        scopes: apiKey.scopes,
        roles: [],
        metadata: apiKey.metadata,
      },
    };
  }
}

// =============================================================================
// Basic Auth Provider
// =============================================================================

class BasicAuthProvider implements ApiAuthProvider {
  readonly method: AuthMethod = "basic";

  constructor(
    private config: ApiAuthConfig & { method: "basic" },
    private storage: ApiAuthStorage
  ) {}

  async authenticate(request: ApiAuthRequest): Promise<ApiAuthResult> {
    const authHeader = request.headers?.["authorization"];
    if (!authHeader?.startsWith("Basic ")) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "NO_CREDENTIALS", message: "Basic auth credentials not provided" },
      };
    }

    const encoded = authHeader.slice(6);
    let decoded: string;
    try {
      decoded = Buffer.from(encoded, "base64").toString("utf8");
    } catch {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "INVALID_ENCODING", message: "Invalid base64 encoding" },
      };
    }

    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "INVALID_FORMAT", message: "Invalid credentials format" },
      };
    }

    const username = decoded.slice(0, colonIndex);
    const password = decoded.slice(colonIndex + 1);

    const credentials = await this.storage.getCredentials(username);
    if (!credentials) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" },
      };
    }

    if (!credentials.enabled) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "ACCOUNT_DISABLED", message: "Account is disabled" },
      };
    }

    // Verify password (simple hash comparison for now)
    const passwordHash = this.config.hashAlgorithm === "none"
      ? password
      : createHash("sha256").update(password).digest("hex");

    // Use timing-safe comparison
    const expected = Buffer.from(credentials.passwordHash);
    const actual = Buffer.from(passwordHash);

    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" },
      };
    }

    // Update last login
    credentials.lastLoginAt = Date.now();
    await this.storage.saveCredentials(credentials);

    return {
      authenticated: true,
      method: this.method,
      principal: {
        id: credentials.id,
        type: "user",
        name: credentials.username,
        scopes: credentials.scopes,
        roles: [],
      },
    };
  }
}

// =============================================================================
// Bearer Token Provider
// =============================================================================

class BearerTokenProvider implements ApiAuthProvider {
  readonly method: AuthMethod = "bearer";

  constructor(
    private _config: ApiAuthConfig & { method: "bearer" },
    private storage: ApiAuthStorage
  ) {}

  async authenticate(request: ApiAuthRequest): Promise<ApiAuthResult> {
    const authHeader = request.headers?.["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "NO_TOKEN", message: "Bearer token not provided" },
      };
    }

    const token = authHeader.slice(7);
    return this.validate(token);
  }

  async validate(token: string): Promise<ApiAuthResult> {
    // Hash the token to look it up
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Look up all tokens and find match (in real impl, you'd have a proper index)
    // For now, just demonstrate the pattern
    const storedToken = await this.findToken(tokenHash);

    if (!storedToken) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "INVALID_TOKEN", message: "Invalid token" },
      };
    }

    if (storedToken.revokedAt) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "TOKEN_REVOKED", message: "Token has been revoked" },
      };
    }

    if (storedToken.expiresAt && storedToken.expiresAt < Date.now()) {
      return {
        authenticated: false,
        method: this.method,
        error: { code: "TOKEN_EXPIRED", message: "Token has expired" },
      };
    }

    return {
      authenticated: true,
      method: this.method,
      principal: {
        id: storedToken.principalId,
        type: "service",
        scopes: storedToken.scopes,
        roles: [],
        metadata: storedToken.metadata,
      },
      token: {
        raw: token,
        type: storedToken.tokenType,
        expiresAt: storedToken.expiresAt,
      },
    };
  }

  private async findToken(hash: string): Promise<StoredToken | null> {
    // In a real implementation, you'd have an index by hash
    // This is a simplified version
    const token = await this.storage.getToken(hash);
    return token;
  }
}

// =============================================================================
// API Authentication Manager
// =============================================================================

export class ApiAuthManager extends EventEmitter<ApiAuthEvents> {
  private config: ApiAuthManagerConfig;
  private storage: ApiAuthStorage;
  private providers = new Map<AuthMethod, ApiAuthProvider>();
  private auditLog: ApiAuthAuditEntry[] = [];

  constructor(
    config: Partial<ApiAuthManagerConfig> & { methods: ApiAuthConfig[] },
    storage?: ApiAuthStorage
  ) {
    super();
    this.config = ApiAuthManagerConfigSchema.parse(config);
    this.storage = storage ?? new MemoryAuthStorage();

    // Initialize providers
    this.initializeProviders();
  }

  private initializeProviders(): void {
    for (const methodConfig of this.config.methods) {
      switch (methodConfig.method) {
        case "api_key":
          this.providers.set("api_key", new ApiKeyProvider(methodConfig, this.storage));
          break;
        case "basic":
          this.providers.set("basic", new BasicAuthProvider(methodConfig, this.storage));
          break;
        case "bearer":
          this.providers.set("bearer", new BearerTokenProvider(methodConfig, this.storage));
          break;
        // JWT and OAuth2 would need additional dependencies
        // Adding stubs here for completeness
        case "jwt":
        case "oauth2":
        case "custom":
          // These would need more complex implementations
          break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  async authenticate(request: ApiAuthRequest): Promise<ApiAuthResult> {
    // Try each configured method in order
    for (const methodConfig of this.config.methods) {
      const provider = this.providers.get(methodConfig.method);
      if (!provider) continue;

      const result = await provider.authenticate(request);

      if (result.authenticated) {
        await this.logAudit(methodConfig.method, true, result, request);
        this.emit("authenticated", result);
        return result;
      }

      // If there's an error other than "not provided", log it
      if (result.error && !result.error.code.includes("NO_")) {
        await this.logAudit(methodConfig.method, false, result, request);
        this.emit("authFailed", result, request);
        return result;
      }
    }

    // No authentication method succeeded
    if (this.config.fallbackToAnonymous) {
      const result: ApiAuthResult = {
        authenticated: true,
        principal: {
          id: "anonymous",
          type: "anonymous",
          scopes: [],
          roles: [],
        },
      };
      return result;
    }

    const result: ApiAuthResult = {
      authenticated: false,
      error: { code: "NO_AUTH", message: "No valid authentication provided" },
    };

    await this.logAudit("custom", false, result, request);
    this.emit("authFailed", result, request);
    return result;
  }

  // ---------------------------------------------------------------------------
  // API Key Management
  // ---------------------------------------------------------------------------

  async createApiKey(options: {
    name: string;
    description?: string;
    clientId?: string;
    scopes?: string[];
    rateLimit?: number;
    expiresAt?: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const rawKey = randomBytes(32).toString("hex");

    // Get API key config
    const apiKeyConfig = this.config.methods.find(m => m.method === "api_key") as
      | (ApiAuthConfig & { method: "api_key" })
      | undefined;

    const hashAlgorithm = apiKeyConfig?.hashAlgorithm ?? "sha256";
    const keyHash = hashAlgorithm === "none"
      ? rawKey
      : createHash(hashAlgorithm).update(rawKey).digest("hex");

    const apiKey: ApiKey = {
      id: randomBytes(16).toString("hex"),
      key: keyHash,
      name: options.name,
      description: options.description,
      clientId: options.clientId,
      scopes: options.scopes ?? [],
      rateLimit: options.rateLimit,
      expiresAt: options.expiresAt,
      createdAt: Date.now(),
      enabled: true,
      metadata: options.metadata,
    };

    await this.storage.saveApiKey(apiKey);
    this.emit("apiKeyCreated", apiKey);

    return { apiKey, rawKey };
  }

  async revokeApiKey(id: string): Promise<boolean> {
    const apiKey = await this.storage.getApiKey(id);
    if (!apiKey) return false;

    apiKey.enabled = false;
    await this.storage.saveApiKey(apiKey);
    this.emit("apiKeyRevoked", id);
    return true;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const apiKey = await this.storage.getApiKey(id);
    if (!apiKey) return false;

    await this.storage.deleteApiKey(id);
    return true;
  }

  async listApiKeys(clientId?: string): Promise<ApiKey[]> {
    return this.storage.listApiKeys(clientId);
  }

  // ---------------------------------------------------------------------------
  // Token Management
  // ---------------------------------------------------------------------------

  async issueToken(options: {
    principalId: string;
    clientId?: string;
    scopes?: string[];
    tokenType?: "access" | "refresh" | "id";
    expiresIn?: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ token: StoredToken; rawToken: string }> {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    const token: StoredToken = {
      id: tokenHash, // Use hash as ID for lookup
      token: tokenHash,
      tokenType: options.tokenType ?? "access",
      principalId: options.principalId,
      clientId: options.clientId,
      scopes: options.scopes ?? [],
      issuedAt: Date.now(),
      expiresAt: options.expiresIn ? Date.now() + options.expiresIn * 1000 : undefined,
      metadata: options.metadata,
    };

    await this.storage.saveToken(token);
    this.emit("tokenIssued", token);

    return { token, rawToken };
  }

  async revokeToken(tokenId: string, reason?: string): Promise<boolean> {
    const token = await this.storage.getToken(tokenId);
    if (!token) return false;

    token.revokedAt = Date.now();
    await this.storage.saveToken(token);
    this.emit("tokenRevoked", tokenId, reason);
    return true;
  }

  async refreshToken(refreshToken: string): Promise<OAuth2Token | null> {
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const storedToken = await this.storage.getToken(tokenHash);

    if (!storedToken || storedToken.tokenType !== "refresh") {
      return null;
    }

    if (storedToken.revokedAt || (storedToken.expiresAt && storedToken.expiresAt < Date.now())) {
      return null;
    }

    // Issue new access token
    const { rawToken } = await this.issueToken({
      principalId: storedToken.principalId,
      clientId: storedToken.clientId,
      scopes: storedToken.scopes,
      tokenType: "access",
      expiresIn: 3600, // 1 hour
      metadata: storedToken.metadata,
    });

    const oldToken = refreshToken;
    const newStoredToken = await this.storage.getToken(
      createHash("sha256").update(rawToken).digest("hex")
    );

    if (newStoredToken) {
      this.emit("tokenRefreshed", oldToken, newStoredToken);
    }

    return {
      accessToken: rawToken,
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshToken,
    };
  }

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  async createSession(options: {
    principalId: string;
    ip?: string;
    userAgent?: string;
    data?: Record<string, unknown>;
  }): Promise<ApiSession> {
    const session: ApiSession = {
      id: randomBytes(32).toString("hex"),
      principalId: options.principalId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.config.sessionConfig?.ttlSeconds ?? 3600) * 1000,
      lastActivityAt: Date.now(),
      ip: options.ip,
      userAgent: options.userAgent,
      data: options.data ?? {},
    };

    await this.storage.saveSession(session);
    this.emit("sessionCreated", session);
    return session;
  }

  async getSession(sessionId: string): Promise<ApiSession | null> {
    const session = await this.storage.getSession(sessionId);
    if (!session) return null;

    if (session.expiresAt < Date.now()) {
      this.emit("sessionExpired", sessionId);
      await this.storage.deleteSession(sessionId);
      return null;
    }

    // Renew session if configured
    if (this.config.sessionConfig?.renewOnActivity) {
      session.lastActivityAt = Date.now();
      session.expiresAt = Date.now() + (this.config.sessionConfig.ttlSeconds ?? 3600) * 1000;
      await this.storage.saveSession(session);
    }

    return session;
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const session = await this.storage.getSession(sessionId);
    if (!session) return false;

    await this.storage.deleteSession(sessionId);
    this.emit("sessionDestroyed", sessionId);
    return true;
  }

  async destroyAllSessions(principalId: string): Promise<void> {
    await this.storage.deleteSessionsByPrincipal(principalId);
  }

  // ---------------------------------------------------------------------------
  // Audit
  // ---------------------------------------------------------------------------

  private async logAudit(
    method: AuthMethod,
    success: boolean,
    result: ApiAuthResult,
    request: ApiAuthRequest
  ): Promise<void> {
    if (!this.config.audit?.enabled) return;
    if (success && !this.config.audit.logSuccessful) return;
    if (!success && !this.config.audit.logFailed) return;

    const entry: ApiAuthAuditEntry = {
      id: randomBytes(16).toString("hex"),
      timestamp: Date.now(),
      method,
      success,
      principalId: result.principal?.id,
      ip: request.ip,
      userAgent: request.userAgent,
      path: request.path,
      errorCode: result.error?.code,
      errorMessage: result.error?.message,
    };

    this.auditLog.push(entry);
    this.emit("auditLogged", entry);

    // Keep audit log bounded
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  getAuditLog(options?: {
    limit?: number;
    offset?: number;
    method?: AuthMethod;
    success?: boolean;
    principalId?: string;
    since?: number;
  }): ApiAuthAuditEntry[] {
    let entries = [...this.auditLog];

    if (options?.method) {
      entries = entries.filter(e => e.method === options.method);
    }
    if (options?.success !== undefined) {
      entries = entries.filter(e => e.success === options.success);
    }
    if (options?.principalId) {
      entries = entries.filter(e => e.principalId === options.principalId);
    }
    if (options?.since) {
      entries = entries.filter(e => e.timestamp >= options.since!);
    }

    // Sort by timestamp descending
    entries.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 100;
    return entries.slice(offset, offset + limit);
  }

  // ---------------------------------------------------------------------------
  // Credential Management
  // ---------------------------------------------------------------------------

  async createCredentials(options: {
    username: string;
    password: string;
    scopes?: string[];
  }): Promise<void> {
    const basicConfig = this.config.methods.find(m => m.method === "basic") as
      | (ApiAuthConfig & { method: "basic" })
      | undefined;

    const hashAlgorithm = basicConfig?.hashAlgorithm ?? "bcrypt";
    const passwordHash = hashAlgorithm === "none"
      ? options.password
      : createHash("sha256").update(options.password).digest("hex");

    await this.storage.saveCredentials({
      id: randomBytes(16).toString("hex"),
      username: options.username,
      passwordHash,
      scopes: options.scopes ?? [],
      enabled: true,
      createdAt: Date.now(),
    });
  }

  async deleteCredentials(username: string): Promise<void> {
    await this.storage.deleteCredentials(username);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultManager: ApiAuthManager | null = null;

export function getApiAuthManager(): ApiAuthManager {
  if (!defaultManager) {
    throw new Error("API Auth Manager not initialized. Call createApiAuthManager first.");
  }
  return defaultManager;
}

export function createApiAuthManager(
  config: Partial<ApiAuthManagerConfig> & { methods: ApiAuthConfig[] },
  storage?: ApiAuthStorage
): ApiAuthManager {
  const manager = new ApiAuthManager(config, storage);
  if (!defaultManager) {
    defaultManager = manager;
  }
  return manager;
}
