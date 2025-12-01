import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  JwtManager,
  ApiKeyManager,
  SessionManager,
  AuthMiddleware,
  hasScope,
  parseAuthHeader,
  createAuthGuard,
  hashPassword,
  verifyPassword,
} from "../security/auth.js";

describe("JwtManager", () => {
  const secret = "test-secret-key-that-is-at-least-32-chars";

  it("throws if secret is too short", () => {
    expect(() => new JwtManager("short")).toThrow(
      "JWT secret must be at least 32 characters"
    );
  });

  it("signs and verifies a token", () => {
    const jwt = new JwtManager(secret);
    const payload = {
      sub: "user-123",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = jwt.sign(payload);
    expect(token).toBeDefined();
    expect(token.split(".").length).toBe(3);

    const verified = jwt.verify(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("user-123");
  });

  it("rejects expired tokens", () => {
    const jwt = new JwtManager(secret);
    const payload = {
      sub: "user-123",
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    };

    const token = jwt.sign(payload);
    const verified = jwt.verify(token);
    expect(verified).toBeNull();
  });

  it("rejects tampered tokens", () => {
    const jwt = new JwtManager(secret);
    const payload = {
      sub: "user-123",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    let token = jwt.sign(payload);
    // Tamper with the token
    token = token.slice(0, -5) + "xxxxx";

    const verified = jwt.verify(token);
    expect(verified).toBeNull();
  });

  it("rejects malformed tokens", () => {
    const jwt = new JwtManager(secret);

    expect(jwt.verify("not.a.token.at.all")).toBeNull();
    expect(jwt.verify("")).toBeNull();
    expect(jwt.verify("single")).toBeNull();
  });

  it("decode returns payload without verification", () => {
    const jwt = new JwtManager(secret);
    const payload = {
      sub: "user-123",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      scope: ["read", "write"],
    };

    const token = jwt.sign(payload);
    const decoded = jwt.decode(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("user-123");
    expect(decoded?.scope).toContain("read");
  });

  it("preserves metadata in token", () => {
    const jwt = new JwtManager(secret);
    const payload = {
      sub: "user-123",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      metadata: { role: "admin", team: "engineering" },
    };

    const token = jwt.sign(payload);
    const verified = jwt.verify(token);

    expect(verified?.metadata).toEqual({ role: "admin", team: "engineering" });
  });
});

describe("ApiKeyManager", () => {
  it("generates valid API keys", () => {
    const manager = new ApiKeyManager("test");
    const keyInfo = manager.generate({
      userId: "user-123",
      name: "Test Key",
    });

    expect(keyInfo.key.startsWith("test_")).toBe(true);
    expect(keyInfo.id).toBeDefined();
    expect(keyInfo.userId).toBe("user-123");
    expect(keyInfo.name).toBe("Test Key");
  });

  it("validates generated keys", () => {
    const manager = new ApiKeyManager("gicm");
    const keyInfo = manager.generate({
      userId: "user-123",
      name: "Valid Key",
      scope: ["read", "write"],
    });

    const validated = manager.validate(keyInfo.key);
    expect(validated).not.toBeNull();
    expect(validated?.userId).toBe("user-123");
    expect(validated?.scope).toContain("read");
    expect(validated?.key).toBe(""); // Key should not be returned
  });

  it("rejects invalid keys", () => {
    const manager = new ApiKeyManager("gicm");

    expect(manager.validate("wrong_prefix_key")).toBeNull();
    expect(manager.validate("gicm_nonexistent")).toBeNull();
    expect(manager.validate("")).toBeNull();
  });

  it("tracks last used time", () => {
    const manager = new ApiKeyManager("gicm");
    const keyInfo = manager.generate({
      userId: "user-123",
      name: "Tracked Key",
    });

    // First validation
    const validated1 = manager.validate(keyInfo.key);
    expect(validated1?.lastUsed).toBeGreaterThan(0);
  });

  it("respects expiration", async () => {
    vi.useFakeTimers();

    const manager = new ApiKeyManager("gicm");
    const keyInfo = manager.generate({
      userId: "user-123",
      name: "Expiring Key",
      expiresIn: 1, // 1 second
    });

    // Should be valid now
    expect(manager.validate(keyInfo.key)).not.toBeNull();

    // Advance time past expiration
    vi.advanceTimersByTime(2000);

    // Should be expired
    expect(manager.validate(keyInfo.key)).toBeNull();

    vi.useRealTimers();
  });

  it("revokes keys by ID", () => {
    const manager = new ApiKeyManager("gicm");
    const keyInfo = manager.generate({
      userId: "user-123",
      name: "To Revoke",
    });

    expect(manager.validate(keyInfo.key)).not.toBeNull();

    const revoked = manager.revoke(keyInfo.id);
    expect(revoked).toBe(true);

    expect(manager.validate(keyInfo.key)).toBeNull();
  });

  it("lists keys for user", () => {
    const manager = new ApiKeyManager("gicm");

    manager.generate({ userId: "user-1", name: "Key 1" });
    manager.generate({ userId: "user-1", name: "Key 2" });
    manager.generate({ userId: "user-2", name: "Key 3" });

    const user1Keys = manager.listForUser("user-1");
    expect(user1Keys.length).toBe(2);
    expect(user1Keys.every((k) => !("key" in k && k.key))).toBe(true);
  });

  it("exports and registers keys", () => {
    const manager = new ApiKeyManager("gicm");
    const keyInfo = manager.generate({
      userId: "user-123",
      name: "Exportable",
    });

    const exported = manager.export();
    expect(exported.length).toBe(1);
    expect(exported[0].hashedKey).toBeDefined();

    // Create new manager and register
    const newManager = new ApiKeyManager("gicm");
    newManager.register(exported[0]);

    // Key should work in new manager
    const validated = newManager.validate(keyInfo.key);
    expect(validated).not.toBeNull();
  });
});

describe("SessionManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates sessions", () => {
    const manager = new SessionManager(3600);
    const session = manager.create("user-123");

    expect(session.id).toBeDefined();
    expect(session.userId).toBe("user-123");
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it("retrieves valid sessions", () => {
    const manager = new SessionManager(3600);
    const session = manager.create("user-123", undefined, { role: "admin" });

    const retrieved = manager.get(session.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.userId).toBe("user-123");
    expect(retrieved?.metadata?.role).toBe("admin");
  });

  it("returns null for expired sessions", () => {
    const manager = new SessionManager(1); // 1 second TTL
    const session = manager.create("user-123");

    expect(manager.get(session.id)).not.toBeNull();

    vi.advanceTimersByTime(2000);

    expect(manager.get(session.id)).toBeNull();
  });

  it("extends session expiration", () => {
    const manager = new SessionManager(60); // 60 second TTL
    const session = manager.create("user-123");

    vi.advanceTimersByTime(30000); // 30 seconds

    const extended = manager.extend(session.id);
    expect(extended).not.toBeNull();

    vi.advanceTimersByTime(50000); // 50 more seconds (80 total)

    // Should still be valid due to extension
    expect(manager.get(session.id)).not.toBeNull();
  });

  it("destroys sessions", () => {
    const manager = new SessionManager(3600);
    const session = manager.create("user-123");

    expect(manager.get(session.id)).not.toBeNull();

    manager.destroy(session.id);

    expect(manager.get(session.id)).toBeNull();
  });

  it("destroys all sessions for user", () => {
    const manager = new SessionManager(3600);
    manager.create("user-123");
    manager.create("user-123");
    manager.create("user-456");

    const count = manager.destroyAllForUser("user-123");
    expect(count).toBe(2);

    expect(manager.listForUser("user-123").length).toBe(0);
    expect(manager.listForUser("user-456").length).toBe(1);
  });

  it("cleans up expired sessions", () => {
    const manager = new SessionManager(1);
    manager.create("user-1");
    manager.create("user-2");

    vi.advanceTimersByTime(2000);

    const cleaned = manager.cleanup();
    expect(cleaned).toBe(2);
  });

  it("tracks active session count", () => {
    const manager = new SessionManager(3600);
    manager.create("user-1");
    manager.create("user-2");
    manager.create("user-3");

    expect(manager.activeCount).toBe(3);
  });
});

describe("AuthMiddleware", () => {
  const secret = "test-secret-key-that-is-at-least-32-chars";

  it("authenticates valid JWT bearer token", () => {
    const middleware = new AuthMiddleware({
      jwtSecret: secret,
      enableJwt: true,
    });

    const token = middleware.generateToken("user-123", {
      scope: ["read", "write"],
    });

    const result = middleware.authenticate({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(result.authenticated).toBe(true);
    expect(result.userId).toBe("user-123");
    expect(result.scope).toContain("read");
  });

  it("authenticates valid API key", () => {
    const middleware = new AuthMiddleware({
      enableApiKey: true,
      apiKeyPrefix: "test",
    });

    const keyInfo = middleware.generateApiKey({
      userId: "user-123",
      name: "Test Key",
      scope: ["admin"],
    });

    const result = middleware.authenticate({
      headers: { authorization: `ApiKey ${keyInfo?.key}` },
    });

    expect(result.authenticated).toBe(true);
    expect(result.userId).toBe("user-123");
  });

  it("rejects missing credentials", () => {
    const middleware = new AuthMiddleware({ jwtSecret: secret });

    const result = middleware.authenticate({
      headers: {},
    });

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe("No valid credentials provided");
  });

  it("rejects invalid bearer token", () => {
    const middleware = new AuthMiddleware({ jwtSecret: secret });

    const result = middleware.authenticate({
      headers: { authorization: "Bearer invalid.token.here" },
    });

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe("Invalid or expired token");
  });

  it("authenticates via session cookie", () => {
    const middleware = new AuthMiddleware({ jwtSecret: secret });

    const session = middleware.createSession("user-123");

    const result = middleware.authenticate({
      headers: {},
      cookies: { session: session?.id },
    });

    expect(result.authenticated).toBe(true);
    expect(result.userId).toBe("user-123");
  });

  it("generates refresh token", () => {
    const middleware = new AuthMiddleware({ jwtSecret: secret });
    const refreshToken = middleware.generateRefreshToken("user-123");

    expect(refreshToken).toBeDefined();
    expect(refreshToken.length).toBe(64); // 32 bytes hex
  });

  it("revokes API keys", () => {
    const middleware = new AuthMiddleware({ enableApiKey: true });
    const keyInfo = middleware.generateApiKey({
      userId: "user-123",
      name: "To Revoke",
    });

    expect(keyInfo).not.toBeNull();

    const revoked = middleware.revokeApiKey(keyInfo!.id);
    expect(revoked).toBe(true);
  });

  it("destroys sessions", () => {
    const middleware = new AuthMiddleware({ jwtSecret: secret });
    const session = middleware.createSession("user-123");

    expect(middleware.destroySession(session!.id)).toBe(true);

    const result = middleware.authenticate({
      headers: {},
      cookies: { session: session?.id },
    });

    expect(result.authenticated).toBe(false);
  });
});

describe("hasScope", () => {
  it("returns true for exact match", () => {
    expect(hasScope(["read", "write"], "read")).toBe(true);
    expect(hasScope(["read", "write"], "write")).toBe(true);
  });

  it("returns false for missing scope", () => {
    expect(hasScope(["read"], "write")).toBe(false);
    expect(hasScope([], "read")).toBe(false);
  });

  it("handles wildcard scope", () => {
    expect(hasScope(["*"], "anything")).toBe(true);
    expect(hasScope(["admin"], "anything")).toBe(true);
  });

  it("handles hierarchical scopes", () => {
    expect(hasScope(["read:*"], "read:users")).toBe(true);
    expect(hasScope(["read:*"], "read:posts")).toBe(true);
    expect(hasScope(["read:*"], "write:users")).toBe(false);
  });

  it("checks multiple required scopes", () => {
    expect(hasScope(["read", "write"], ["read", "write"])).toBe(true);
    expect(hasScope(["read"], ["read", "write"])).toBe(false);
  });
});

describe("parseAuthHeader", () => {
  it("parses bearer tokens", () => {
    const result = parseAuthHeader("Bearer eyJhbGciOiJIUzI1NiJ9");
    expect(result?.type).toBe("bearer");
    expect(result?.value).toBe("eyJhbGciOiJIUzI1NiJ9");
  });

  it("parses API keys", () => {
    const result = parseAuthHeader("ApiKey gicm_abc123");
    expect(result?.type).toBe("apikey");
    expect(result?.value).toBe("gicm_abc123");
  });

  it("parses basic auth", () => {
    const result = parseAuthHeader("Basic dXNlcjpwYXNz");
    expect(result?.type).toBe("basic");
    expect(result?.value).toBe("dXNlcjpwYXNz");
  });

  it("detects raw API keys", () => {
    const result = parseAuthHeader("gicm_abc123");
    expect(result?.type).toBe("apikey");
  });

  it("returns null for empty header", () => {
    expect(parseAuthHeader("")).toBeNull();
  });
});

describe("createAuthGuard", () => {
  const secret = "test-secret-key-that-is-at-least-32-chars";

  it("creates working guard", () => {
    const middleware = new AuthMiddleware({ jwtSecret: secret });
    const guard = createAuthGuard(middleware);

    const token = middleware.generateToken("user-123");
    const result = guard({ headers: { authorization: `Bearer ${token}` } });

    expect(result.authenticated).toBe(true);
  });

  it("enforces required scope", () => {
    const middleware = new AuthMiddleware({ jwtSecret: secret });
    const guard = createAuthGuard(middleware, { requiredScope: ["admin"] });

    const token = middleware.generateToken("user-123", { scope: ["read"] });
    const result = guard({ headers: { authorization: `Bearer ${token}` } });

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe("Insufficient permissions");
  });

  it("allows with matching scope", () => {
    const middleware = new AuthMiddleware({ jwtSecret: secret });
    const guard = createAuthGuard(middleware, { requiredScope: ["admin"] });

    const token = middleware.generateToken("user-123", { scope: ["admin"] });
    const result = guard({ headers: { authorization: `Bearer ${token}` } });

    expect(result.authenticated).toBe(true);
  });
});

describe("hashPassword and verifyPassword", () => {
  it("hashes and verifies passwords", async () => {
    const password = "securePassword123!";
    const { hash, salt } = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(salt).toBeDefined();
    expect(hash.length).toBe(128); // SHA-512 hex

    const isValid = await verifyPassword(password, hash, salt);
    expect(isValid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const { hash, salt } = await hashPassword("correctPassword");
    const isValid = await verifyPassword("wrongPassword", hash, salt);

    expect(isValid).toBe(false);
  });

  it("generates different hashes for same password", async () => {
    const password = "testPassword";
    const result1 = await hashPassword(password);
    const result2 = await hashPassword(password);

    expect(result1.salt).not.toBe(result2.salt);
    expect(result1.hash).not.toBe(result2.hash);
  });

  it("uses provided salt", async () => {
    const password = "testPassword";
    const customSalt = "0123456789abcdef0123456789abcdef";

    const result1 = await hashPassword(password, customSalt);
    const result2 = await hashPassword(password, customSalt);

    expect(result1.salt).toBe(customSalt);
    expect(result1.hash).toBe(result2.hash);
  });
});
