/**
 * Secrets Manager for gICM platform
 *
 * Secure handling of API keys, credentials, and sensitive configuration.
 * Supports multiple backends: environment variables, encrypted files, external stores.
 */

import { z } from "zod";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

// ============================================================================
// Types
// ============================================================================

export const SecretMetadataSchema = z.object({
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  expiresAt: z.number().optional(),
  rotationDue: z.number().optional(),
  tags: z.array(z.string()).optional(),
  version: z.number().default(1),
});

export type SecretMetadata = z.infer<typeof SecretMetadataSchema>;

export interface SecretValue {
  value: string;
  metadata: SecretMetadata;
}

export interface SecretBackend {
  name: string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(): Promise<string[]>;
  exists(key: string): Promise<boolean>;
}

export interface SecretsManagerConfig {
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

// ============================================================================
// Environment Backend
// ============================================================================

/**
 * Backend that reads secrets from environment variables
 */
export class EnvSecretBackend implements SecretBackend {
  name = "env";
  private prefix: string;

  constructor(prefix = "") {
    this.prefix = prefix;
  }

  private getEnvKey(key: string): string {
    const normalized = key.toUpperCase().replace(/[.-]/g, "_");
    return this.prefix ? `${this.prefix}_${normalized}` : normalized;
  }

  async get(key: string): Promise<string | null> {
    return process.env[this.getEnvKey(key)] ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    process.env[this.getEnvKey(key)] = value;
  }

  async delete(key: string): Promise<boolean> {
    const envKey = this.getEnvKey(key);
    if (process.env[envKey]) {
      delete process.env[envKey];
      return true;
    }
    return false;
  }

  async list(): Promise<string[]> {
    const keys: string[] = [];
    const prefixLen = this.prefix ? this.prefix.length + 1 : 0;

    for (const key of Object.keys(process.env)) {
      if (!this.prefix || key.startsWith(`${this.prefix}_`)) {
        keys.push(key.slice(prefixLen).toLowerCase().replace(/_/g, "-"));
      }
    }
    return keys;
  }

  async exists(key: string): Promise<boolean> {
    return this.getEnvKey(key) in process.env;
  }
}

// ============================================================================
// Memory Backend (with encryption)
// ============================================================================

/**
 * In-memory backend with AES-256 encryption
 */
export class MemorySecretBackend implements SecretBackend {
  name = "memory";
  private secrets: Map<string, { encrypted: Buffer; iv: Buffer; metadata: SecretMetadata }> =
    new Map();
  private key: Buffer;

  constructor(encryptionKey?: string) {
    // Use provided key or generate one
    this.key = encryptionKey
      ? Buffer.from(encryptionKey, "hex")
      : randomBytes(32);

    if (this.key.length !== 32) {
      throw new Error("Encryption key must be 32 bytes (64 hex characters)");
    }
  }

  private encrypt(value: string): { encrypted: Buffer; iv: Buffer } {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    return { encrypted, iv };
  }

  private decrypt(encrypted: Buffer, iv: Buffer): string {
    const decipher = createDecipheriv("aes-256-cbc", this.key, iv);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }

  async get(key: string): Promise<string | null> {
    const secret = this.secrets.get(key);
    if (!secret) return null;

    // Check expiration
    if (secret.metadata.expiresAt && Date.now() > secret.metadata.expiresAt) {
      this.secrets.delete(key);
      return null;
    }

    return this.decrypt(secret.encrypted, secret.iv);
  }

  async set(
    key: string,
    value: string,
    metadata?: Partial<SecretMetadata>
  ): Promise<void> {
    const existing = this.secrets.get(key);
    const { encrypted, iv } = this.encrypt(value);

    const now = Date.now();
    const fullMetadata: SecretMetadata = {
      name: key,
      createdAt: existing?.metadata.createdAt ?? now,
      updatedAt: now,
      version: (existing?.metadata.version ?? 0) + 1,
      ...metadata,
    };

    this.secrets.set(key, { encrypted, iv, metadata: fullMetadata });
  }

  async delete(key: string): Promise<boolean> {
    return this.secrets.delete(key);
  }

  async list(): Promise<string[]> {
    return Array.from(this.secrets.keys());
  }

  async exists(key: string): Promise<boolean> {
    return this.secrets.has(key);
  }

  getMetadata(key: string): SecretMetadata | null {
    return this.secrets.get(key)?.metadata ?? null;
  }
}

// ============================================================================
// Composite Backend (fallback chain)
// ============================================================================

/**
 * Backend that tries multiple backends in order
 */
export class CompositeSecretBackend implements SecretBackend {
  name = "composite";
  private backends: SecretBackend[];

  constructor(backends: SecretBackend[]) {
    this.backends = backends;
  }

  async get(key: string): Promise<string | null> {
    for (const backend of this.backends) {
      const value = await backend.get(key);
      if (value !== null) {
        return value;
      }
    }
    return null;
  }

  async set(key: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void> {
    // Set in the first backend
    if (this.backends.length > 0) {
      await this.backends[0].set(key, value, metadata);
    }
  }

  async delete(key: string): Promise<boolean> {
    let deleted = false;
    for (const backend of this.backends) {
      if (await backend.delete(key)) {
        deleted = true;
      }
    }
    return deleted;
  }

  async list(): Promise<string[]> {
    const keys = new Set<string>();
    for (const backend of this.backends) {
      for (const key of await backend.list()) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  }

  async exists(key: string): Promise<boolean> {
    for (const backend of this.backends) {
      if (await backend.exists(key)) {
        return true;
      }
    }
    return false;
  }
}

// ============================================================================
// SecretsManager
// ============================================================================

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
export class SecretsManager {
  private backend: SecretBackend;
  private envBackend: EnvSecretBackend;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly config: Required<Omit<SecretsManagerConfig, "backend" | "onAccess" | "onMissing">> & {
    onAccess?: (key: string) => void;
    onMissing?: (key: string) => void;
  };

  constructor(config?: SecretsManagerConfig) {
    this.config = {
      encryptionKey: config?.encryptionKey ?? randomBytes(32).toString("hex"),
      cacheTtl: config?.cacheTtl ?? 5 * 60 * 1000, // 5 minutes
      envPrefix: config?.envPrefix ?? "",
      onAccess: config?.onAccess,
      onMissing: config?.onMissing,
    };

    this.envBackend = new EnvSecretBackend(this.config.envPrefix);
    this.backend = config?.backend ?? new MemorySecretBackend(this.config.encryptionKey);
  }

  /**
   * Get a secret by key
   * Tries: cache -> environment -> backend
   */
  async get(key: string): Promise<string | null> {
    this.config.onAccess?.(key);

    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    // Try environment first
    const envValue = await this.envBackend.get(key);
    if (envValue !== null) {
      this.cacheValue(key, envValue);
      return envValue;
    }

    // Try backend
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
  async require(key: string): Promise<string> {
    const value = await this.get(key);
    if (value === null) {
      throw new Error(`Required secret not found: ${key}`);
    }
    return value;
  }

  /**
   * Get a secret or return a default value
   */
  async getOrDefault(key: string, defaultValue: string): Promise<string> {
    const value = await this.get(key);
    return value ?? defaultValue;
  }

  /**
   * Get multiple secrets at once
   */
  async getMany(keys: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
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
  async set(key: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void> {
    await this.backend.set(key, value, metadata);
    this.cacheValue(key, value);
  }

  /**
   * Delete a secret
   */
  async delete(key: string): Promise<boolean> {
    this.cache.delete(key);
    return this.backend.delete(key);
  }

  /**
   * Check if a secret exists
   */
  async exists(key: string): Promise<boolean> {
    return (await this.envBackend.exists(key)) || (await this.backend.exists(key));
  }

  /**
   * List all secret keys
   */
  async list(): Promise<string[]> {
    const envKeys = await this.envBackend.list();
    const backendKeys = await this.backend.list();
    return [...new Set([...envKeys, ...backendKeys])];
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate a specific cached value
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get masked version of a secret (for logging)
   */
  async getMasked(key: string, visibleChars = 4): Promise<string | null> {
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
  async getHash(key: string): Promise<string | null> {
    const value = await this.get(key);
    if (!value) return null;
    return createHash("sha256").update(value).digest("hex");
  }

  /**
   * Validate that required secrets are present
   */
  async validate(requiredKeys: string[]): Promise<{
    valid: boolean;
    missing: string[];
  }> {
    const missing: string[] = [];

    for (const key of requiredKeys) {
      if (!(await this.exists(key))) {
        missing.push(key);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  private cacheValue(key: string, value: string): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.config.cacheTtl,
    });
  }
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Generate a secure random key
 */
export function generateSecretKey(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Generate a secure API key with prefix
 */
export function generateApiKey(prefix = "gicm"): string {
  const random = randomBytes(24).toString("base64url");
  return `${prefix}_${random}`;
}

/**
 * Validate API key format
 */
export function isValidApiKey(key: string, prefix = "gicm"): boolean {
  const pattern = new RegExp(`^${prefix}_[A-Za-z0-9_-]{32}$`);
  return pattern.test(key);
}

/**
 * Redact sensitive values from an object (for logging)
 */
export function redactSecrets<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys: string[] = [
    "password",
    "secret",
    "key",
    "token",
    "api_key",
    "apiKey",
    "private",
    "credential",
  ]
): T {
  const result = { ...obj };

  for (const key of Object.keys(result)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive.toLowerCase()))) {
      (result as Record<string, unknown>)[key] = "[REDACTED]";
    } else if (typeof result[key] === "object" && result[key] !== null) {
      (result as Record<string, unknown>)[key] = redactSecrets(
        result[key] as Record<string, unknown>,
        sensitiveKeys
      );
    }
  }

  return result;
}

/**
 * Create a secrets manager with common presets
 */
export function createSecretsManager(
  preset: "development" | "production" | "test" = "development"
): SecretsManager {
  switch (preset) {
    case "production":
      return new SecretsManager({
        envPrefix: "GICM",
        cacheTtl: 60 * 1000, // 1 minute (shorter for rotation)
        onMissing: (key) => {
          console.warn(`[SECRETS] Missing required secret: ${key}`);
        },
      });

    case "test":
      return new SecretsManager({
        backend: new MemorySecretBackend(),
        cacheTtl: 0, // No caching in tests
      });

    case "development":
    default:
      return new SecretsManager({
        envPrefix: "GICM",
        cacheTtl: 5 * 60 * 1000, // 5 minutes
      });
  }
}
