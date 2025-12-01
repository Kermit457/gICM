import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SecretsManager,
  EnvSecretBackend,
  MemorySecretBackend,
  CompositeSecretBackend,
  generateSecretKey,
  generateApiKey,
  isValidApiKey,
  redactSecrets,
  createSecretsManager,
} from "../security/secrets.js";

describe("EnvSecretBackend", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("gets value from environment variable", async () => {
    process.env.TEST_API_KEY = "secret123";
    const backend = new EnvSecretBackend();

    const value = await backend.get("test-api-key");
    expect(value).toBe("secret123");
  });

  it("returns null for missing variable", async () => {
    const backend = new EnvSecretBackend();
    const value = await backend.get("nonexistent");
    expect(value).toBeNull();
  });

  it("respects prefix", async () => {
    process.env.GICM_DATABASE_URL = "postgres://localhost";
    const backend = new EnvSecretBackend("GICM");

    const value = await backend.get("database-url");
    expect(value).toBe("postgres://localhost");
  });

  it("sets environment variable", async () => {
    const backend = new EnvSecretBackend();
    await backend.set("new-key", "new-value");

    expect(process.env.NEW_KEY).toBe("new-value");
  });

  it("deletes environment variable", async () => {
    process.env.TO_DELETE = "value";
    const backend = new EnvSecretBackend();

    const deleted = await backend.delete("to-delete");
    expect(deleted).toBe(true);
    expect(process.env.TO_DELETE).toBeUndefined();
  });

  it("exists returns true for existing variable", async () => {
    process.env.EXISTS_TEST = "yes";
    const backend = new EnvSecretBackend();

    expect(await backend.exists("exists-test")).toBe(true);
  });
});

describe("MemorySecretBackend", () => {
  it("stores and retrieves secrets", async () => {
    const backend = new MemorySecretBackend();

    await backend.set("my-secret", "super-secret-value");
    const value = await backend.get("my-secret");

    expect(value).toBe("super-secret-value");
  });

  it("encrypts values in memory", async () => {
    const backend = new MemorySecretBackend();
    await backend.set("encrypted", "plaintext");

    // The value should be encrypted internally (we can't easily verify this
    // without accessing private members, but we verify decrypt works)
    const value = await backend.get("encrypted");
    expect(value).toBe("plaintext");
  });

  it("returns null for missing keys", async () => {
    const backend = new MemorySecretBackend();
    expect(await backend.get("missing")).toBeNull();
  });

  it("deletes secrets", async () => {
    const backend = new MemorySecretBackend();
    await backend.set("to-delete", "value");

    const deleted = await backend.delete("to-delete");
    expect(deleted).toBe(true);
    expect(await backend.get("to-delete")).toBeNull();
  });

  it("lists all keys", async () => {
    const backend = new MemorySecretBackend();
    await backend.set("key1", "value1");
    await backend.set("key2", "value2");

    const keys = await backend.list();
    expect(keys).toContain("key1");
    expect(keys).toContain("key2");
  });

  it("tracks metadata", async () => {
    const backend = new MemorySecretBackend();
    await backend.set("versioned", "v1", { tags: ["api"] });

    const metadata = backend.getMetadata("versioned");
    expect(metadata?.version).toBe(1);
    expect(metadata?.tags).toContain("api");
  });

  it("increments version on update", async () => {
    const backend = new MemorySecretBackend();
    await backend.set("versioned", "v1");
    await backend.set("versioned", "v2");

    const metadata = backend.getMetadata("versioned");
    expect(metadata?.version).toBe(2);
  });

  it("respects expiration", async () => {
    const backend = new MemorySecretBackend();
    await backend.set("expiring", "value", {
      expiresAt: Date.now() - 1000, // Already expired
    });

    expect(await backend.get("expiring")).toBeNull();
  });

  it("throws on invalid encryption key length", () => {
    expect(() => new MemorySecretBackend("tooshort")).toThrow(
      "Encryption key must be 32 bytes"
    );
  });
});

describe("CompositeSecretBackend", () => {
  it("tries backends in order", async () => {
    const backend1 = new MemorySecretBackend();
    const backend2 = new MemorySecretBackend();
    await backend2.set("only-in-2", "from-backend-2");

    const composite = new CompositeSecretBackend([backend1, backend2]);
    const value = await composite.get("only-in-2");

    expect(value).toBe("from-backend-2");
  });

  it("returns first match", async () => {
    const backend1 = new MemorySecretBackend();
    const backend2 = new MemorySecretBackend();
    await backend1.set("key", "from-1");
    await backend2.set("key", "from-2");

    const composite = new CompositeSecretBackend([backend1, backend2]);
    expect(await composite.get("key")).toBe("from-1");
  });

  it("sets in first backend", async () => {
    const backend1 = new MemorySecretBackend();
    const backend2 = new MemorySecretBackend();

    const composite = new CompositeSecretBackend([backend1, backend2]);
    await composite.set("new-key", "value");

    expect(await backend1.get("new-key")).toBe("value");
    expect(await backend2.get("new-key")).toBeNull();
  });

  it("deletes from all backends", async () => {
    const backend1 = new MemorySecretBackend();
    const backend2 = new MemorySecretBackend();
    await backend1.set("key", "v1");
    await backend2.set("key", "v2");

    const composite = new CompositeSecretBackend([backend1, backend2]);
    await composite.delete("key");

    expect(await backend1.get("key")).toBeNull();
    expect(await backend2.get("key")).toBeNull();
  });

  it("lists keys from all backends", async () => {
    const backend1 = new MemorySecretBackend();
    const backend2 = new MemorySecretBackend();
    await backend1.set("key1", "v1");
    await backend2.set("key2", "v2");

    const composite = new CompositeSecretBackend([backend1, backend2]);
    const keys = await composite.list();

    expect(keys).toContain("key1");
    expect(keys).toContain("key2");
  });
});

describe("SecretsManager", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("gets from environment first", async () => {
    process.env.API_KEY = "env-value";
    const manager = new SecretsManager();

    const value = await manager.get("api-key");
    expect(value).toBe("env-value");
  });

  it("falls back to backend", async () => {
    const backend = new MemorySecretBackend();
    await backend.set("backend-key", "backend-value");

    const manager = new SecretsManager({ backend });
    const value = await manager.get("backend-key");

    expect(value).toBe("backend-value");
  });

  it("caches values", async () => {
    process.env.CACHED_KEY = "cached";
    const manager = new SecretsManager({ cacheTtl: 10000 });

    await manager.get("cached-key");
    delete process.env.CACHED_KEY;

    // Should still get cached value
    const value = await manager.get("cached-key");
    expect(value).toBe("cached");
  });

  it("require throws on missing secret", async () => {
    const manager = new SecretsManager();

    await expect(manager.require("missing")).rejects.toThrow(
      "Required secret not found"
    );
  });

  it("getOrDefault returns default for missing", async () => {
    const manager = new SecretsManager();
    const value = await manager.getOrDefault("missing", "default");

    expect(value).toBe("default");
  });

  it("getMany returns multiple values", async () => {
    process.env.KEY1 = "value1";
    process.env.KEY2 = "value2";
    const manager = new SecretsManager();

    const values = await manager.getMany(["key1", "key2", "key3"]);

    expect(values.get("key1")).toBe("value1");
    expect(values.get("key2")).toBe("value2");
    expect(values.get("key3")).toBeNull();
  });

  it("set stores in backend", async () => {
    const backend = new MemorySecretBackend();
    const manager = new SecretsManager({ backend });

    await manager.set("new-secret", "new-value");
    expect(await backend.get("new-secret")).toBe("new-value");
  });

  it("delete removes from backend", async () => {
    const backend = new MemorySecretBackend();
    await backend.set("to-delete", "value");
    const manager = new SecretsManager({ backend });

    await manager.delete("to-delete");
    expect(await backend.get("to-delete")).toBeNull();
  });

  it("getMasked returns masked value", async () => {
    process.env.SECRET = "verysecretvalue";
    const manager = new SecretsManager();

    const masked = await manager.getMasked("secret", 4);
    // 15 chars - 8 visible = 7 masked (capped at 8)
    expect(masked).toBe("very*******alue");
  });

  it("getHash returns SHA256 hash", async () => {
    process.env.HASH_TEST = "test";
    const manager = new SecretsManager();

    const hash = await manager.getHash("hash-test");
    expect(hash).toBe(
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    );
  });

  it("validate checks required keys", async () => {
    process.env.PRESENT = "yes";
    const manager = new SecretsManager();

    const result = await manager.validate(["present", "missing"]);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("missing");
  });

  it("calls onAccess callback", async () => {
    const onAccess = vi.fn();
    const manager = new SecretsManager({ onAccess });

    await manager.get("any-key");
    expect(onAccess).toHaveBeenCalledWith("any-key");
  });

  it("calls onMissing callback", async () => {
    const onMissing = vi.fn();
    const manager = new SecretsManager({ onMissing });

    await manager.get("missing-key");
    expect(onMissing).toHaveBeenCalledWith("missing-key");
  });

  it("clearCache clears all cached values", async () => {
    process.env.TEMP = "temp";
    const manager = new SecretsManager({ cacheTtl: 10000 });

    await manager.get("temp"); // Cache it
    manager.clearCache();
    delete process.env.TEMP;

    expect(await manager.get("temp")).toBeNull();
  });
});

describe("generateSecretKey", () => {
  it("generates 32-byte key by default", () => {
    const key = generateSecretKey();
    expect(key.length).toBe(64); // hex encoding
  });

  it("generates custom length key", () => {
    const key = generateSecretKey(16);
    expect(key.length).toBe(32);
  });
});

describe("generateApiKey", () => {
  it("generates key with prefix", () => {
    const key = generateApiKey("test");
    expect(key.startsWith("test_")).toBe(true);
  });

  it("uses gicm prefix by default", () => {
    const key = generateApiKey();
    expect(key.startsWith("gicm_")).toBe(true);
  });
});

describe("isValidApiKey", () => {
  it("validates correct format", () => {
    const key = generateApiKey("gicm");
    expect(isValidApiKey(key, "gicm")).toBe(true);
  });

  it("rejects wrong prefix", () => {
    const key = generateApiKey("other");
    expect(isValidApiKey(key, "gicm")).toBe(false);
  });

  it("rejects invalid format", () => {
    expect(isValidApiKey("not-a-key")).toBe(false);
  });
});

describe("redactSecrets", () => {
  it("redacts sensitive keys", () => {
    const obj = {
      apiKey: "secret123",
      password: "pass123",
      name: "John",
    };

    const redacted = redactSecrets(obj);

    expect(redacted.apiKey).toBe("[REDACTED]");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.name).toBe("John");
  });

  it("redacts nested objects", () => {
    const obj = {
      config: {
        api_key: "nested-secret",
        host: "localhost",
      },
    };

    const redacted = redactSecrets(obj);

    expect((redacted.config as Record<string, string>).api_key).toBe("[REDACTED]");
    expect((redacted.config as Record<string, string>).host).toBe("localhost");
  });

  it("handles custom sensitive keys", () => {
    const obj = {
      mySecret: "value",
      custom: "secret",
    };

    const redacted = redactSecrets(obj, ["custom"]);

    expect(redacted.mySecret).toBe("value");
    expect(redacted.custom).toBe("[REDACTED]");
  });
});

describe("createSecretsManager", () => {
  it("creates development preset", () => {
    const manager = createSecretsManager("development");
    expect(manager).toBeInstanceOf(SecretsManager);
  });

  it("creates production preset", () => {
    const manager = createSecretsManager("production");
    expect(manager).toBeInstanceOf(SecretsManager);
  });

  it("creates test preset", () => {
    const manager = createSecretsManager("test");
    expect(manager).toBeInstanceOf(SecretsManager);
  });
});
