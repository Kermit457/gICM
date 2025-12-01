/**
 * Config Manager Implementation
 * Phase 15B: Dynamic Configuration Management
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  ConfigValueType,
  ConfigSourceType,
  ConfigSource,
  ConfigDefinition,
  ConfigEntry,
  ConfigChange,
  ConfigSnapshot,
  Environment,
  WatchCallback,
  WatchOptions,
  ConfigValidationResult,
  ConfigManagerConfig,
  ConfigManagerConfigSchema,
  ConfigEvents,
  ConfigStorage,
  ConfigSourceProvider,
  DEFAULT_ENVIRONMENTS,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemoryConfigStorage implements ConfigStorage {
  private entries = new Map<string, ConfigEntry>();
  private history = new Map<string, ConfigChange[]>();
  private snapshots = new Map<string, ConfigSnapshot>();
  private definitions = new Map<string, ConfigDefinition>();

  private getKey(key: string, environment: string): string {
    return `${environment}:${key}`;
  }

  async get(key: string, environment: string): Promise<ConfigEntry | null> {
    return this.entries.get(this.getKey(key, environment)) ?? null;
  }

  async set(entry: ConfigEntry): Promise<void> {
    this.entries.set(this.getKey(entry.key, entry.environment), entry);
  }

  async delete(key: string, environment: string): Promise<void> {
    this.entries.delete(this.getKey(key, environment));
  }

  async list(filters?: {
    environment?: string;
    prefix?: string;
    namespace?: string;
  }): Promise<ConfigEntry[]> {
    let results = Array.from(this.entries.values());

    if (filters) {
      if (filters.environment) {
        results = results.filter(e => e.environment === filters.environment);
      }
      if (filters.prefix) {
        results = results.filter(e => e.key.startsWith(filters.prefix!));
      }
      if (filters.namespace) {
        results = results.filter(e => e.key.startsWith(`${filters.namespace}:`));
      }
    }

    return results;
  }

  async addChange(change: ConfigChange): Promise<void> {
    const key = `${change.environment}:${change.key}`;
    const changes = this.history.get(key) ?? [];
    changes.unshift(change);
    // Keep only last 100 changes per key
    if (changes.length > 100) {
      changes.pop();
    }
    this.history.set(key, changes);
  }

  async getHistory(key: string, environment: string, limit = 50): Promise<ConfigChange[]> {
    const changes = this.history.get(`${environment}:${key}`) ?? [];
    return changes.slice(0, limit);
  }

  async saveSnapshot(snapshot: ConfigSnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  async getSnapshot(id: string): Promise<ConfigSnapshot | null> {
    return this.snapshots.get(id) ?? null;
  }

  async listSnapshots(environment: string): Promise<ConfigSnapshot[]> {
    return Array.from(this.snapshots.values())
      .filter(s => s.environment === environment)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteSnapshot(id: string): Promise<void> {
    this.snapshots.delete(id);
  }

  async getDefinition(key: string): Promise<ConfigDefinition | null> {
    return this.definitions.get(key) ?? null;
  }

  async saveDefinition(definition: ConfigDefinition): Promise<void> {
    this.definitions.set(definition.key, definition);
  }

  async listDefinitions(): Promise<ConfigDefinition[]> {
    return Array.from(this.definitions.values());
  }
}

// =============================================================================
// Environment Source Provider
// =============================================================================

class EnvSourceProvider implements ConfigSourceProvider {
  readonly type: ConfigSourceType = "env";
  readonly name: string;
  private prefix: string;

  constructor(name: string, prefix = "") {
    this.name = name;
    this.prefix = prefix;
  }

  async load(): Promise<Map<string, unknown>> {
    const result = new Map<string, unknown>();

    for (const [key, value] of Object.entries(process.env)) {
      if (value === undefined) continue;

      if (this.prefix && !key.startsWith(this.prefix)) continue;

      const configKey = this.prefix
        ? key.slice(this.prefix.length).toLowerCase().replace(/_/g, ".")
        : key.toLowerCase().replace(/_/g, ".");

      // Try to parse JSON, otherwise keep as string
      try {
        result.set(configKey, JSON.parse(value));
      } catch {
        result.set(configKey, value);
      }
    }

    return result;
  }
}

// =============================================================================
// Memory Source Provider
// =============================================================================

class MemorySourceProvider implements ConfigSourceProvider {
  readonly type: ConfigSourceType = "memory";
  readonly name: string;
  private values: Map<string, unknown>;
  private watchers: Array<(changes: Map<string, unknown>) => void> = [];

  constructor(name: string, values: Record<string, unknown> = {}) {
    this.name = name;
    this.values = new Map(Object.entries(values));
  }

  async load(): Promise<Map<string, unknown>> {
    return new Map(this.values);
  }

  async set(key: string, value: unknown): Promise<void> {
    this.values.set(key, value);
    const changes = new Map([[key, value]]);
    for (const watcher of this.watchers) {
      watcher(changes);
    }
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
    const changes = new Map([[key, undefined]]);
    for (const watcher of this.watchers) {
      watcher(changes);
    }
  }

  watch(callback: (changes: Map<string, unknown>) => void): () => void {
    this.watchers.push(callback);
    return () => {
      const idx = this.watchers.indexOf(callback);
      if (idx >= 0) this.watchers.splice(idx, 1);
    };
  }
}

// =============================================================================
// Config Manager
// =============================================================================

export class ConfigManager extends EventEmitter<ConfigEvents> {
  private config: ConfigManagerConfig;
  private storage: ConfigStorage;
  private sources = new Map<string, ConfigSourceProvider>();
  private cache = new Map<string, { value: unknown; fetchedAt: number }>();
  private watchers = new Map<string, Set<WatchCallback>>();
  private environments: Environment[];
  private currentEnvironment: string;
  private hotReloadInterval?: NodeJS.Timeout;
  private running = false;

  constructor(config: Partial<ConfigManagerConfig> = {}) {
    super();
    this.config = ConfigManagerConfigSchema.parse(config);
    this.storage = new InMemoryConfigStorage();
    this.environments = this.config.environments.length > 0
      ? this.config.environments
      : DEFAULT_ENVIRONMENTS;
    this.currentEnvironment = this.config.environment;

    // Register default sources
    this.registerSource(new MemorySourceProvider("defaults", this.config.defaults));
    this.registerSource(new EnvSourceProvider("env"));
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setStorage(storage: ConfigStorage): void {
    this.storage = storage;
  }

  registerSource(provider: ConfigSourceProvider): void {
    this.sources.set(provider.name, provider);
  }

  setEnvironment(environment: string): void {
    if (!this.environments.find(e => e.name === environment)) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    this.currentEnvironment = environment;
    this.cache.clear();
  }

  getEnvironment(): string {
    return this.currentEnvironment;
  }

  listEnvironments(): Environment[] {
    return [...this.environments];
  }

  // ---------------------------------------------------------------------------
  // Get Config Values
  // ---------------------------------------------------------------------------

  async get<T = unknown>(key: string, defaultValue?: T): Promise<T> {
    // Check cache
    if (this.config.cache?.enabled) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.fetchedAt < (this.config.cache.ttlSeconds ?? 60) * 1000) {
        return cached.value as T;
      }
    }

    // Check storage
    const entry = await this.storage.get(key, this.currentEnvironment);
    if (entry) {
      this.updateCache(key, entry.value);
      return entry.value as T;
    }

    // Check environment inheritance
    const inheritedValue = await this.getInheritedValue<T>(key);
    if (inheritedValue !== undefined) {
      this.updateCache(key, inheritedValue);
      return inheritedValue;
    }

    // Use default
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // Check definition for default
    const definition = await this.storage.getDefinition(key);
    if (definition?.defaultValue !== undefined) {
      return definition.defaultValue as T;
    }

    return undefined as T;
  }

  async getString(key: string, defaultValue = ""): Promise<string> {
    const value = await this.get(key, defaultValue);
    return String(value);
  }

  async getNumber(key: string, defaultValue = 0): Promise<number> {
    const value = await this.get(key, defaultValue);
    return typeof value === "number" ? value : Number(value) || defaultValue;
  }

  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const value = await this.get(key, defaultValue);
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true" || value === "1";
    return Boolean(value);
  }

  async getJSON<T>(key: string, defaultValue: T): Promise<T> {
    const value = await this.get(key, defaultValue);
    if (typeof value === "object") return value as T;
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  async getArray<T>(key: string, defaultValue: T[] = []): Promise<T[]> {
    const value = await this.get(key, defaultValue);
    return Array.isArray(value) ? value : defaultValue;
  }

  private async getInheritedValue<T>(key: string): Promise<T | undefined> {
    const currentEnv = this.environments.find(e => e.name === this.currentEnvironment);
    if (!currentEnv?.parentId) return undefined;

    let parentId: string | undefined = currentEnv.parentId;
    while (parentId) {
      const entry = await this.storage.get(key, parentId);
      if (entry) {
        return entry.value as T;
      }

      const parentEnv = this.environments.find(e => e.id === parentId);
      parentId = parentEnv?.parentId;
    }

    return undefined;
  }

  private updateCache(key: string, value: unknown): void {
    if (this.config.cache?.enabled) {
      this.cache.set(key, { value, fetchedAt: Date.now() });
    }
  }

  // ---------------------------------------------------------------------------
  // Set Config Values
  // ---------------------------------------------------------------------------

  async set(key: string, value: unknown, options: { type?: ConfigValueType; changedBy?: string; reason?: string } = {}): Promise<void> {
    const oldEntry = await this.storage.get(key, this.currentEnvironment);
    const oldValue = oldEntry?.value;
    const isNew = !oldEntry;

    const entry: ConfigEntry = {
      key,
      value,
      type: options.type ?? this.inferType(value),
      source: "memory",
      environment: this.currentEnvironment,
      version: (oldEntry?.version ?? 0) + 1,
      updatedAt: Date.now(),
      updatedBy: options.changedBy,
      encrypted: false,
    };

    // Validate
    await this.validateEntry(entry);

    // Save
    await this.storage.set(entry);
    this.updateCache(key, value);

    // Record change
    if (this.config.history?.enabled) {
      const change: ConfigChange = {
        id: randomUUID(),
        timestamp: Date.now(),
        key,
        type: isNew ? "created" : "updated",
        previousValue: oldValue,
        newValue: value,
        source: "memory",
        environment: this.currentEnvironment,
        changedBy: options.changedBy,
        reason: options.reason,
      };
      await this.storage.addChange(change);
    }

    // Notify
    this.notifyWatchers(key, value, oldValue);

    if (isNew) {
      this.emit("created", key, value);
    } else {
      this.emit("updated", key, value, oldValue);
    }
    this.emit("changed", key, value, oldValue);
  }

  async delete(key: string, options: { changedBy?: string; reason?: string } = {}): Promise<boolean> {
    const entry = await this.storage.get(key, this.currentEnvironment);
    if (!entry) return false;

    await this.storage.delete(key, this.currentEnvironment);
    this.cache.delete(key);

    // Record change
    if (this.config.history?.enabled) {
      const change: ConfigChange = {
        id: randomUUID(),
        timestamp: Date.now(),
        key,
        type: "deleted",
        previousValue: entry.value,
        source: "memory",
        environment: this.currentEnvironment,
        changedBy: options.changedBy,
        reason: options.reason,
      };
      await this.storage.addChange(change);
    }

    this.notifyWatchers(key, undefined, entry.value);
    this.emit("deleted", key, entry.value);

    return true;
  }

  private inferType(value: unknown): ConfigValueType {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "string";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "json";
    return "string";
  }

  // ---------------------------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------------------------

  async setMany(values: Record<string, unknown>, options: { changedBy?: string } = {}): Promise<void> {
    for (const [key, value] of Object.entries(values)) {
      await this.set(key, value, options);
    }
  }

  async getMany(keys: string[]): Promise<Map<string, unknown>> {
    const result = new Map<string, unknown>();
    await Promise.all(keys.map(async key => {
      result.set(key, await this.get(key));
    }));
    return result;
  }

  async list(filters?: { prefix?: string; namespace?: string }): Promise<ConfigEntry[]> {
    return this.storage.list({ environment: this.currentEnvironment, ...filters });
  }

  // ---------------------------------------------------------------------------
  // Watching
  // ---------------------------------------------------------------------------

  watch(callback: WatchCallback, options: WatchOptions = {}): () => void {
    const watchKey = options.keys?.join(",") ?? options.prefix ?? options.namespace ?? "*";

    let watchers = this.watchers.get(watchKey);
    if (!watchers) {
      watchers = new Set();
      this.watchers.set(watchKey, watchers);
    }
    watchers.add(callback);

    return () => {
      watchers?.delete(callback);
    };
  }

  private notifyWatchers(key: string, newValue: unknown, oldValue: unknown | undefined): void {
    // Global watchers
    const globalWatchers = this.watchers.get("*");
    if (globalWatchers) {
      for (const callback of globalWatchers) {
        try {
          callback(key, newValue, oldValue);
        } catch (error) {
          this.emit("error", error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    // Prefix watchers
    for (const [watchKey, watchers] of this.watchers) {
      if (watchKey === "*") continue;
      if (key.startsWith(watchKey) || watchKey.includes(key)) {
        for (const callback of watchers) {
          try {
            callback(key, newValue, oldValue);
          } catch (error) {
            this.emit("error", error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  private async validateEntry(entry: ConfigEntry): Promise<void> {
    const definition = await this.storage.getDefinition(entry.key);
    if (!definition) return;

    const result = await this.validateValue(entry.key, entry.value, definition);
    if (!result.valid) {
      const errorMessages = result.errors.map(e => e.message).join(", ");
      throw new Error(`Validation failed for ${entry.key}: ${errorMessages}`);
    }
  }

  private async validateValue(
    key: string,
    value: unknown,
    definition: ConfigDefinition
  ): Promise<ConfigValidationResult> {
    const errors: Array<{ key: string; message: string; value?: unknown }> = [];
    const warnings: Array<{ key: string; message: string }> = [];

    if (definition.deprecated) {
      warnings.push({
        key,
        message: definition.deprecationMessage ?? `Config ${key} is deprecated`,
      });
    }

    const validation = definition.validation;
    if (!validation) {
      return { valid: true, errors, warnings };
    }

    // Required check
    if (validation.required && (value === undefined || value === null || value === "")) {
      errors.push({ key, message: `${key} is required`, value });
    }

    // Type-specific validation
    if (value !== undefined && value !== null) {
      if (typeof value === "number") {
        if (validation.min !== undefined && value < validation.min) {
          errors.push({ key, message: `${key} must be >= ${validation.min}`, value });
        }
        if (validation.max !== undefined && value > validation.max) {
          errors.push({ key, message: `${key} must be <= ${validation.max}`, value });
        }
      }

      if (typeof value === "string") {
        if (validation.minLength !== undefined && value.length < validation.minLength) {
          errors.push({ key, message: `${key} must be at least ${validation.minLength} characters`, value });
        }
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          errors.push({ key, message: `${key} must be at most ${validation.maxLength} characters`, value });
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          errors.push({ key, message: `${key} must match pattern ${validation.pattern}`, value });
        }
      }

      if (validation.enum && !validation.enum.includes(value)) {
        errors.push({ key, message: `${key} must be one of: ${validation.enum.join(", ")}`, value });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async validate(): Promise<ConfigValidationResult> {
    const definitions = await this.storage.listDefinitions();
    const allErrors: Array<{ key: string; message: string; value?: unknown }> = [];
    const allWarnings: Array<{ key: string; message: string }> = [];

    for (const def of definitions) {
      const value = await this.get(def.key);
      const result = await this.validateValue(def.key, value, def);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    const result = {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };

    if (!result.valid) {
      this.emit("validationFailed", result);
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Definitions
  // ---------------------------------------------------------------------------

  async defineConfig(definition: ConfigDefinition): Promise<void> {
    await this.storage.saveDefinition(definition);
  }

  async getDefinition(key: string): Promise<ConfigDefinition | null> {
    return this.storage.getDefinition(key);
  }

  async listDefinitions(): Promise<ConfigDefinition[]> {
    return this.storage.listDefinitions();
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  async getHistory(key: string, limit?: number): Promise<ConfigChange[]> {
    return this.storage.getHistory(key, this.currentEnvironment, limit);
  }

  // ---------------------------------------------------------------------------
  // Snapshots
  // ---------------------------------------------------------------------------

  async createSnapshot(name?: string, description?: string): Promise<ConfigSnapshot> {
    const entries = await this.storage.list({ environment: this.currentEnvironment });

    const snapshot: ConfigSnapshot = {
      id: randomUUID(),
      name,
      description,
      timestamp: Date.now(),
      environment: this.currentEnvironment,
      entries,
    };

    await this.storage.saveSnapshot(snapshot);
    return snapshot;
  }

  async listSnapshots(): Promise<ConfigSnapshot[]> {
    return this.storage.listSnapshots(this.currentEnvironment);
  }

  async rollback(snapshotId: string): Promise<string[]> {
    const snapshot = await this.storage.getSnapshot(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const rolledBackKeys: string[] = [];

    for (const entry of snapshot.entries) {
      await this.set(entry.key, entry.value, { reason: `Rollback to snapshot ${snapshotId}` });
      rolledBackKeys.push(entry.key);
    }

    this.emit("rolledBack", snapshotId, rolledBackKeys);
    return rolledBackKeys;
  }

  // ---------------------------------------------------------------------------
  // Source Loading
  // ---------------------------------------------------------------------------

  async loadFromSources(): Promise<void> {
    const sortedSources = [...this.config.sources]
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const sourceConfig of sortedSources) {
      const provider = this.sources.get(sourceConfig.name);
      if (!provider) continue;

      try {
        const values = await provider.load();
        let count = 0;

        for (const [key, value] of values) {
          await this.storage.set({
            key,
            value,
            type: this.inferType(value),
            source: provider.type,
            environment: this.currentEnvironment,
            version: 1,
            updatedAt: Date.now(),
            encrypted: false,
          });
          this.updateCache(key, value);
          count++;
        }

        this.emit("sourceLoaded", sourceConfig, count);
      } catch (error) {
        this.emit("sourceError", sourceConfig, error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.emit("reloaded", Array.from(this.cache.keys()));
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Load from sources
    await this.loadFromSources();

    // Start hot reload
    if (this.config.hotReload?.enabled) {
      this.hotReloadInterval = setInterval(() => {
        this.loadFromSources().catch(err => this.emit("error", err));
      }, (this.config.hotReload.intervalSeconds ?? 30) * 1000);
    }

    this.emit("initialized");
  }

  async stop(): Promise<void> {
    this.running = false;

    if (this.hotReloadInterval) {
      clearInterval(this.hotReloadInterval);
      this.hotReloadInterval = undefined;
    }

    this.emit("shutDown");
  }

  isRunning(): boolean {
    return this.running;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultManager: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!defaultManager) {
    defaultManager = new ConfigManager();
  }
  return defaultManager;
}

export function createConfigManager(config?: Partial<ConfigManagerConfig>): ConfigManager {
  return new ConfigManager(config);
}
