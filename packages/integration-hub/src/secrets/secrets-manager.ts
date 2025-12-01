/**
 * Secrets Manager
 * Phase 13A: Security & Secrets
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import {
  type SecretProvider,
  type SecretValue,
  type SecretMetadata,
  type ProviderConfig,
  type SecretLease,
  type SecretAccess,
  type SecretsManagerConfig,
  type SecretsEvents,
  type SecretReference,
  type EncryptedSecret,
  SecretsManagerConfigSchema,
  SECRET_REFERENCE_PATTERN,
} from "./types.js";

// ============================================================================
// Secret Provider Interface
// ============================================================================

export interface ISecretProvider {
  readonly name: SecretProvider;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get(name: string, version?: number): Promise<string | undefined>;
  set(name: string, value: string): Promise<void>;
  delete(name: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  exists(name: string): Promise<boolean>;
}

// ============================================================================
// Secrets Manager Error
// ============================================================================

export class SecretsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly secretName?: string,
    public readonly provider?: SecretProvider
  ) {
    super(message);
    this.name = "SecretsError";
  }
}

// ============================================================================
// Built-in Providers
// ============================================================================

// Environment Variable Provider
class EnvProvider implements ISecretProvider {
  readonly name: SecretProvider = "env";
  private prefix: string;
  private transform: "none" | "uppercase" | "lowercase";

  constructor(config: { prefix?: string; transform?: "none" | "uppercase" | "lowercase" }) {
    this.prefix = config.prefix ?? "";
    this.transform = config.transform ?? "uppercase";
  }

  async connect(): Promise<void> {
    // No connection needed for env vars
  }

  async disconnect(): Promise<void> {
    // No disconnection needed
  }

  async get(name: string): Promise<string | undefined> {
    const key = this.transformKey(name);
    return process.env[key];
  }

  async set(name: string, value: string): Promise<void> {
    const key = this.transformKey(name);
    process.env[key] = value;
  }

  async delete(name: string): Promise<void> {
    const key = this.transformKey(name);
    delete process.env[key];
  }

  async list(prefix?: string): Promise<string[]> {
    const fullPrefix = this.prefix + (prefix ?? "");
    return Object.keys(process.env)
      .filter((key) => key.startsWith(fullPrefix))
      .map((key) => key.slice(this.prefix.length));
  }

  async exists(name: string): Promise<boolean> {
    const key = this.transformKey(name);
    return key in process.env;
  }

  private transformKey(name: string): string {
    let key = this.prefix + name.replace(/[.\-\/]/g, "_");
    switch (this.transform) {
      case "uppercase":
        return key.toUpperCase();
      case "lowercase":
        return key.toLowerCase();
      default:
        return key;
    }
  }
}

// In-Memory Provider (for testing/development)
class MemoryProvider implements ISecretProvider {
  readonly name: SecretProvider = "memory";
  private secrets: Map<string, string> = new Map();
  private encrypted: boolean;
  private encryptionKey?: Buffer;

  constructor(config: { encrypted?: boolean; encryptionKey?: string }) {
    this.encrypted = config.encrypted ?? false;
    if (config.encryptionKey) {
      this.encryptionKey = Buffer.from(config.encryptionKey, "base64");
    }
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {
    this.secrets.clear();
  }

  async get(name: string): Promise<string | undefined> {
    const value = this.secrets.get(name);
    if (!value) return undefined;

    if (this.encrypted && this.encryptionKey) {
      return this.decrypt(value);
    }
    return value;
  }

  async set(name: string, value: string): Promise<void> {
    if (this.encrypted && this.encryptionKey) {
      this.secrets.set(name, this.encrypt(value));
    } else {
      this.secrets.set(name, value);
    }
  }

  async delete(name: string): Promise<void> {
    this.secrets.delete(name);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.secrets.keys());
    if (prefix) {
      return keys.filter((k) => k.startsWith(prefix));
    }
    return keys;
  }

  async exists(name: string): Promise<boolean> {
    return this.secrets.has(name);
  }

  private encrypt(value: string): string {
    if (!this.encryptionKey) throw new Error("No encryption key");
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      iv: iv.toString("base64"),
      ciphertext: encrypted.toString("base64"),
      authTag: authTag.toString("base64"),
    });
  }

  private decrypt(encryptedData: string): string {
    if (!this.encryptionKey) throw new Error("No encryption key");
    const { iv, ciphertext, authTag } = JSON.parse(encryptedData);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.encryptionKey,
      Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }
}

// ============================================================================
// Secrets Manager Class
// ============================================================================

export class SecretsManager extends EventEmitter<SecretsEvents> {
  private config: Required<SecretsManagerConfig>;
  private providers: Map<SecretProvider, ISecretProvider> = new Map();
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private leases: Map<string, SecretLease> = new Map();
  private accessLog: SecretAccess[] = [];
  private versions: Map<string, number> = new Map();

  constructor(config: Partial<SecretsManagerConfig>) {
    super();
    this.config = SecretsManagerConfigSchema.parse(config) as Required<SecretsManagerConfig>;

    // Initialize providers
    this.initializeProviders();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get a secret value
   */
  async get(name: string, options?: { provider?: SecretProvider; version?: number }): Promise<string> {
    const provider = options?.provider ?? this.config.defaultProvider;

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(`${provider}:${name}`);
      if (cached && cached.expiresAt > Date.now()) {
        this.logAccess(name, "system", "read", true);
        this.emit("secretAccessed", name, "system");
        return cached.value;
      }
    }

    // Get from provider
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new SecretsError(
        `Provider not configured: ${provider}`,
        "PROVIDER_NOT_FOUND",
        name,
        provider
      );
    }

    const value = await providerInstance.get(name, options?.version);
    if (value === undefined) {
      throw new SecretsError(
        `Secret not found: ${name}`,
        "SECRET_NOT_FOUND",
        name,
        provider
      );
    }

    // Cache the value
    if (this.config.cacheEnabled) {
      this.cache.set(`${provider}:${name}`, {
        value,
        expiresAt: Date.now() + this.config.cacheTTL,
      });
    }

    this.logAccess(name, "system", "read", true);
    this.emit("secretAccessed", name, "system");

    return value;
  }

  /**
   * Get a secret with type coercion
   */
  async getTyped<T>(
    name: string,
    parser: (value: string) => T,
    options?: { provider?: SecretProvider }
  ): Promise<T> {
    const value = await this.get(name, options);
    return parser(value);
  }

  /**
   * Get a JSON secret
   */
  async getJSON<T = unknown>(
    name: string,
    options?: { provider?: SecretProvider; key?: string }
  ): Promise<T> {
    const value = await this.get(name, options);
    const parsed = JSON.parse(value);

    if (options?.key) {
      const keys = options.key.split(".");
      let result = parsed;
      for (const k of keys) {
        result = result?.[k];
      }
      return result as T;
    }

    return parsed as T;
  }

  /**
   * Set a secret value
   */
  async set(
    name: string,
    value: string,
    options?: { provider?: SecretProvider }
  ): Promise<void> {
    const provider = options?.provider ?? this.config.defaultProvider;

    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new SecretsError(
        `Provider not configured: ${provider}`,
        "PROVIDER_NOT_FOUND",
        name,
        provider
      );
    }

    const exists = await providerInstance.exists(name);
    await providerInstance.set(name, value);

    // Update version
    const currentVersion = this.versions.get(name) ?? 0;
    this.versions.set(name, currentVersion + 1);

    // Invalidate cache
    this.cache.delete(`${provider}:${name}`);

    this.logAccess(name, "system", "write", true);

    if (exists) {
      this.emit("secretUpdated", name, currentVersion + 1);
    } else {
      this.emit("secretCreated", name);
    }
  }

  /**
   * Delete a secret
   */
  async delete(name: string, options?: { provider?: SecretProvider }): Promise<void> {
    const provider = options?.provider ?? this.config.defaultProvider;

    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new SecretsError(
        `Provider not configured: ${provider}`,
        "PROVIDER_NOT_FOUND",
        name,
        provider
      );
    }

    await providerInstance.delete(name);

    // Invalidate cache
    this.cache.delete(`${provider}:${name}`);

    this.logAccess(name, "system", "delete", true);
    this.emit("secretDeleted", name);
  }

  /**
   * Check if a secret exists
   */
  async exists(name: string, options?: { provider?: SecretProvider }): Promise<boolean> {
    const provider = options?.provider ?? this.config.defaultProvider;

    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      return false;
    }

    return providerInstance.exists(name);
  }

  /**
   * List secrets
   */
  async list(options?: { provider?: SecretProvider; prefix?: string }): Promise<string[]> {
    const provider = options?.provider ?? this.config.defaultProvider;

    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      return [];
    }

    return providerInstance.list(options?.prefix);
  }

  /**
   * Resolve secret references in a string
   * Format: ${secret:name} or ${secret:provider/name} or ${secret:name#key}
   */
  async resolveReferences(template: string): Promise<string> {
    let result = template;
    let match;

    // Reset regex
    SECRET_REFERENCE_PATTERN.lastIndex = 0;

    while ((match = SECRET_REFERENCE_PATTERN.exec(template)) !== null) {
      const [fullMatch, path, keyPart] = match;
      const key = keyPart?.slice(1); // Remove # prefix

      let provider: SecretProvider | undefined;
      let name: string;

      if (path.includes("/")) {
        [provider, name] = path.split("/") as [SecretProvider, string];
      } else {
        name = path;
      }

      try {
        let value: string;
        if (key) {
          value = await this.getJSON(name, { provider, key });
        } else {
          value = await this.get(name, { provider });
        }
        result = result.replace(fullMatch, value);
      } catch {
        // Leave reference as-is if secret not found
      }
    }

    return result;
  }

  /**
   * Rotate a secret
   */
  async rotate(
    name: string,
    newValue: string,
    options?: { provider?: SecretProvider }
  ): Promise<number> {
    const provider = options?.provider ?? this.config.defaultProvider;

    // Set new value
    await this.set(name, newValue, { provider });

    const newVersion = this.versions.get(name) ?? 1;

    this.emit("secretRotated", name, newVersion);

    return newVersion;
  }

  /**
   * Create a lease for a secret
   */
  createLease(
    secretName: string,
    options?: { duration?: number; renewable?: boolean; maxRenewals?: number }
  ): SecretLease {
    const now = new Date();
    const duration = options?.duration ?? 3600; // 1 hour default

    const lease: SecretLease = {
      id: randomUUID(),
      secretName,
      duration,
      renewable: options?.renewable ?? true,
      createdAt: now,
      expiresAt: new Date(now.getTime() + duration * 1000),
      renewCount: 0,
      maxRenewals: options?.maxRenewals,
    };

    this.leases.set(lease.id, lease);
    this.emit("leaseCreated", lease);

    return lease;
  }

  /**
   * Renew a lease
   */
  renewLease(leaseId: string): SecretLease {
    const lease = this.leases.get(leaseId);
    if (!lease) {
      throw new SecretsError("Lease not found", "LEASE_NOT_FOUND");
    }

    if (!lease.renewable) {
      throw new SecretsError("Lease is not renewable", "LEASE_NOT_RENEWABLE");
    }

    if (lease.maxRenewals && lease.renewCount >= lease.maxRenewals) {
      throw new SecretsError("Max renewals reached", "MAX_RENEWALS_REACHED");
    }

    const now = new Date();
    lease.renewedAt = now;
    lease.expiresAt = new Date(now.getTime() + lease.duration * 1000);
    lease.renewCount++;

    this.leases.set(leaseId, lease);
    this.emit("leaseRenewed", lease);

    return lease;
  }

  /**
   * Revoke a lease
   */
  revokeLease(leaseId: string): boolean {
    const lease = this.leases.get(leaseId);
    if (!lease) {
      return false;
    }

    this.leases.delete(leaseId);
    this.emit("leaseExpired", lease);

    return true;
  }

  /**
   * Get active leases
   */
  getActiveLeases(): SecretLease[] {
    const now = Date.now();
    return Array.from(this.leases.values()).filter(
      (lease) => lease.expiresAt.getTime() > now
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get access log
   */
  getAccessLog(options?: { limit?: number; secretName?: string }): SecretAccess[] {
    let log = [...this.accessLog];

    if (options?.secretName) {
      log = log.filter((a) => a.secretName === options.secretName);
    }

    if (options?.limit) {
      log = log.slice(-options.limit);
    }

    return log;
  }

  /**
   * Register a custom provider
   */
  registerProvider(provider: ISecretProvider): void {
    this.providers.set(provider.name, provider);
    this.emit("providerConnected", provider.name);
  }

  /**
   * Get summary
   */
  getSummary(): {
    providers: SecretProvider[];
    cacheSize: number;
    activeLeases: number;
    accessLogSize: number;
  } {
    return {
      providers: Array.from(this.providers.keys()),
      cacheSize: this.cache.size,
      activeLeases: this.getActiveLeases().length,
      accessLogSize: this.accessLog.length,
    };
  }

  /**
   * Dispose
   */
  async dispose(): Promise<void> {
    for (const provider of this.providers.values()) {
      try {
        await provider.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
    this.providers.clear();
    this.cache.clear();
    this.leases.clear();
    this.removeAllListeners();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeProviders(): void {
    for (const providerConfig of this.config.providers) {
      const provider = this.createProvider(providerConfig);
      this.providers.set(provider.name, provider);
    }
  }

  private createProvider(config: ProviderConfig): ISecretProvider {
    switch (config.provider) {
      case "env":
        return new EnvProvider({
          prefix: config.prefix,
          transform: config.transform,
        });

      case "memory":
        return new MemoryProvider({
          encrypted: config.encrypted,
          encryptionKey: config.encryptionKey,
        });

      case "vault":
      case "aws":
      case "azure":
      case "gcp":
        // These would require actual SDK implementations
        // For now, return a mock that throws
        return {
          name: config.provider,
          connect: async () => {},
          disconnect: async () => {},
          get: async () => {
            throw new SecretsError(
              `Provider ${config.provider} not implemented`,
              "PROVIDER_NOT_IMPLEMENTED"
            );
          },
          set: async () => {
            throw new SecretsError(
              `Provider ${config.provider} not implemented`,
              "PROVIDER_NOT_IMPLEMENTED"
            );
          },
          delete: async () => {
            throw new SecretsError(
              `Provider ${config.provider} not implemented`,
              "PROVIDER_NOT_IMPLEMENTED"
            );
          },
          list: async () => [],
          exists: async () => false,
        };

      default:
        throw new SecretsError(`Unknown provider: ${config.provider}`, "UNKNOWN_PROVIDER");
    }
  }

  private logAccess(
    secretName: string,
    accessor: string,
    action: "read" | "write" | "delete" | "rotate",
    allowed: boolean,
    reason?: string
  ): void {
    if (!this.config.auditEnabled) {
      return;
    }

    const access: SecretAccess = {
      secretName,
      accessor,
      action,
      timestamp: new Date(),
      allowed,
      reason,
    };

    this.accessLog.push(access);

    // Trim log if too large
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-5000);
    }

    if (!allowed) {
      this.emit("accessDenied", access);
    }
  }
}

// ============================================================================
// Singleton & Factory
// ============================================================================

let secretsManagerInstance: SecretsManager | null = null;

export function getSecretsManager(config?: Partial<SecretsManagerConfig>): SecretsManager {
  if (!secretsManagerInstance) {
    secretsManagerInstance = new SecretsManager(
      config ?? { providers: [{ provider: "env" }] }
    );
  }
  return secretsManagerInstance;
}

export function createSecretsManager(config: Partial<SecretsManagerConfig>): SecretsManager {
  return new SecretsManager(config);
}
