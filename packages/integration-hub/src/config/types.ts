/**
 * Config Manager Types
 * Phase 15B: Dynamic Configuration Management
 */

import { z } from "zod";

// =============================================================================
// Config Value Types
// =============================================================================

export const ConfigValueTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "json",
  "secret", // Encrypted/sensitive value
  "array",
  "enum",
]);
export type ConfigValueType = z.infer<typeof ConfigValueTypeSchema>;

export const ConfigValueSchema = z.object({
  type: ConfigValueTypeSchema,
  value: z.unknown(),
  encrypted: z.boolean().default(false),
});
export type ConfigValue = z.infer<typeof ConfigValueSchema>;

// =============================================================================
// Config Sources
// =============================================================================

export const ConfigSourceTypeSchema = z.enum([
  "env", // Environment variables
  "file", // Config files (JSON, YAML, etc.)
  "remote", // Remote config service
  "vault", // Secret vault (HashiCorp Vault, AWS Secrets Manager, etc.)
  "database", // Database-stored config
  "memory", // In-memory (bootstrap/defaults)
]);
export type ConfigSourceType = z.infer<typeof ConfigSourceTypeSchema>;

export const ConfigSourceSchema = z.object({
  type: ConfigSourceTypeSchema,
  name: z.string(),
  priority: z.number().default(0).describe("Higher priority overrides lower"),
  enabled: z.boolean().default(true),

  // Source-specific config
  config: z.record(z.unknown()).optional(),
});
export type ConfigSource = z.infer<typeof ConfigSourceSchema>;

// =============================================================================
// Config Definition
// =============================================================================

export const ConfigValidationSchema = z.object({
  required: z.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  enum: z.array(z.unknown()).optional(),
  custom: z.string().optional().describe("Custom validation function name"),
});
export type ConfigValidation = z.infer<typeof ConfigValidationSchema>;

export const ConfigDefinitionSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: ConfigValueTypeSchema,
  defaultValue: z.unknown().optional(),
  validation: ConfigValidationSchema.optional(),

  // Environment overrides
  environmentOverrides: z.record(z.unknown()).optional().describe("Override values per environment"),

  // Metadata
  category: z.string().default("general"),
  tags: z.array(z.string()).default([]),
  sensitive: z.boolean().default(false),
  deprecated: z.boolean().default(false),
  deprecationMessage: z.string().optional(),

  // Documentation
  examples: z.array(z.unknown()).optional(),
  links: z.array(z.string()).optional(),
});
export type ConfigDefinition = z.infer<typeof ConfigDefinitionSchema>;

// =============================================================================
// Config Entry (Runtime Value)
// =============================================================================

export const ConfigEntrySchema = z.object({
  key: z.string(),
  value: z.unknown(),
  type: ConfigValueTypeSchema,
  source: ConfigSourceTypeSchema,
  environment: z.string(),
  version: z.number().default(1),
  updatedAt: z.number(),
  updatedBy: z.string().optional(),
  encrypted: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});
export type ConfigEntry = z.infer<typeof ConfigEntrySchema>;

// =============================================================================
// Config Change
// =============================================================================

export const ConfigChangeTypeSchema = z.enum([
  "created",
  "updated",
  "deleted",
  "rolled_back",
]);
export type ConfigChangeType = z.infer<typeof ConfigChangeTypeSchema>;

export const ConfigChangeSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  key: z.string(),
  type: ConfigChangeTypeSchema,
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  source: ConfigSourceTypeSchema,
  environment: z.string(),
  changedBy: z.string().optional(),
  reason: z.string().optional(),
});
export type ConfigChange = z.infer<typeof ConfigChangeSchema>;

// =============================================================================
// Config Snapshot (for rollback)
// =============================================================================

export const ConfigSnapshotSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  timestamp: z.number(),
  environment: z.string(),
  entries: z.array(ConfigEntrySchema),
  createdBy: z.string().optional(),
});
export type ConfigSnapshot = z.infer<typeof ConfigSnapshotSchema>;

// =============================================================================
// Environment
// =============================================================================

export const EnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  isProduction: z.boolean().default(false),
  parentId: z.string().optional().describe("Inherit from parent environment"),
  locked: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

// =============================================================================
// Config Namespace
// =============================================================================

export const ConfigNamespaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  prefix: z.string().describe("Key prefix for namespaced configs"),
  owner: z.string().optional(),
  locked: z.boolean().default(false),
});
export type ConfigNamespace = z.infer<typeof ConfigNamespaceSchema>;

// =============================================================================
// Watch & Hot Reload
// =============================================================================

export const WatchCallbackSchema = z.function()
  .args(z.string(), z.unknown(), z.unknown().optional())
  .returns(z.void());
export type WatchCallback = (key: string, newValue: unknown, oldValue?: unknown) => void;

export const WatchOptionsSchema = z.object({
  keys: z.array(z.string()).optional().describe("Specific keys to watch"),
  prefix: z.string().optional().describe("Watch keys with prefix"),
  namespace: z.string().optional(),
  debounceMs: z.number().default(100),
});
export type WatchOptions = z.infer<typeof WatchOptionsSchema>;

// =============================================================================
// Validation Result
// =============================================================================

export const ConfigValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    key: z.string(),
    message: z.string(),
    value: z.unknown().optional(),
  })),
  warnings: z.array(z.object({
    key: z.string(),
    message: z.string(),
  })),
});
export type ConfigValidationResult = z.infer<typeof ConfigValidationResultSchema>;

// =============================================================================
// Configuration
// =============================================================================

export const ConfigManagerConfigSchema = z.object({
  // Environment
  environment: z.string().default("development"),
  environments: z.array(EnvironmentSchema).default([]),

  // Sources
  sources: z.array(ConfigSourceSchema).default([]),

  // Hot reload
  hotReload: z.object({
    enabled: z.boolean().default(false),
    intervalSeconds: z.number().default(30),
    watchFiles: z.array(z.string()).default([]),
  }).optional(),

  // Validation
  validation: z.object({
    strict: z.boolean().default(false),
    failOnWarning: z.boolean().default(false),
  }).optional(),

  // Encryption
  encryption: z.object({
    enabled: z.boolean().default(false),
    keyId: z.string().optional(),
    algorithm: z.enum(["aes-256-gcm", "aes-256-cbc"]).default("aes-256-gcm"),
  }).optional(),

  // Caching
  cache: z.object({
    enabled: z.boolean().default(true),
    ttlSeconds: z.number().default(60),
  }).optional(),

  // History
  history: z.object({
    enabled: z.boolean().default(true),
    maxEntries: z.number().default(100),
    retentionDays: z.number().default(30),
  }).optional(),

  // Defaults
  defaults: z.record(z.unknown()).default({}),
});
export type ConfigManagerConfig = z.infer<typeof ConfigManagerConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type ConfigEvents = {
  // Config changes
  changed: (key: string, newValue: unknown, oldValue: unknown | undefined) => void;
  created: (key: string, value: unknown) => void;
  updated: (key: string, newValue: unknown, oldValue: unknown) => void;
  deleted: (key: string, oldValue: unknown) => void;

  // Bulk operations
  reloaded: (keys: string[]) => void;
  rolledBack: (snapshotId: string, keys: string[]) => void;

  // Sources
  sourceLoaded: (source: ConfigSource, count: number) => void;
  sourceError: (source: ConfigSource, error: Error) => void;

  // Validation
  validationFailed: (result: ConfigValidationResult) => void;

  // Lifecycle
  initialized: () => void;
  shutDown: () => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface ConfigStorage {
  // Entries
  get(key: string, environment: string): Promise<ConfigEntry | null>;
  set(entry: ConfigEntry): Promise<void>;
  delete(key: string, environment: string): Promise<void>;
  list(filters?: { environment?: string; prefix?: string; namespace?: string }): Promise<ConfigEntry[]>;

  // History
  addChange(change: ConfigChange): Promise<void>;
  getHistory(key: string, environment: string, limit?: number): Promise<ConfigChange[]>;

  // Snapshots
  saveSnapshot(snapshot: ConfigSnapshot): Promise<void>;
  getSnapshot(id: string): Promise<ConfigSnapshot | null>;
  listSnapshots(environment: string): Promise<ConfigSnapshot[]>;
  deleteSnapshot(id: string): Promise<void>;

  // Definitions
  getDefinition(key: string): Promise<ConfigDefinition | null>;
  saveDefinition(definition: ConfigDefinition): Promise<void>;
  listDefinitions(): Promise<ConfigDefinition[]>;
}

// =============================================================================
// Source Provider Interface
// =============================================================================

export interface ConfigSourceProvider {
  readonly type: ConfigSourceType;
  readonly name: string;
  load(): Promise<Map<string, unknown>>;
  watch?(callback: (changes: Map<string, unknown>) => void): () => void;
  set?(key: string, value: unknown): Promise<void>;
  delete?(key: string): Promise<void>;
}

// =============================================================================
// Default Environments
// =============================================================================

export const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: "development",
    name: "development",
    displayName: "Development",
    description: "Local development environment",
    isProduction: false,
    locked: false,
  },
  {
    id: "staging",
    name: "staging",
    displayName: "Staging",
    description: "Pre-production testing environment",
    isProduction: false,
    parentId: "development",
    locked: false,
  },
  {
    id: "production",
    name: "production",
    displayName: "Production",
    description: "Live production environment",
    isProduction: true,
    parentId: "staging",
    locked: true,
  },
];

// =============================================================================
// Config Categories
// =============================================================================

export const CONFIG_CATEGORIES = {
  general: "General",
  database: "Database",
  cache: "Cache",
  security: "Security",
  api: "API",
  features: "Features",
  limits: "Limits & Quotas",
  notifications: "Notifications",
  integrations: "Integrations",
  experimental: "Experimental",
} as const;

export type ConfigCategory = keyof typeof CONFIG_CATEGORIES;
