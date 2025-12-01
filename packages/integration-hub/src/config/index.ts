/**
 * Config Manager Module
 * Phase 15B: Dynamic Configuration Management
 */

// Types & Schemas
export {
  // Value Types
  ConfigValueTypeSchema,
  type ConfigValueType,
  ConfigValueSchema,
  type ConfigValue,

  // Sources
  ConfigSourceTypeSchema,
  type ConfigSourceType,
  ConfigSourceSchema,
  type ConfigSource,

  // Validation
  ConfigValidationSchema,
  type ConfigValidation,

  // Definition
  ConfigDefinitionSchema,
  type ConfigDefinition,

  // Entry
  ConfigEntrySchema,
  type ConfigEntry,

  // Changes
  ConfigChangeTypeSchema,
  type ConfigChangeType,
  ConfigChangeSchema,
  type ConfigChange,

  // Snapshots
  ConfigSnapshotSchema,
  type ConfigSnapshot,

  // Environment
  EnvironmentSchema,
  type Environment,

  // Namespace
  ConfigNamespaceSchema,
  type ConfigNamespace,

  // Watch
  type WatchCallback,
  WatchOptionsSchema,
  type WatchOptions,

  // Validation Result
  ConfigValidationResultSchema,
  type ConfigValidationResult,

  // Config
  ConfigManagerConfigSchema,
  type ConfigManagerConfig,

  // Events & Interfaces
  type ConfigEvents,
  type ConfigStorage,
  type ConfigSourceProvider,

  // Constants
  DEFAULT_ENVIRONMENTS,
  CONFIG_CATEGORIES,
  type ConfigCategory,
} from "./types.js";

// Config Manager
export {
  ConfigManager,
  getConfigManager,
  createConfigManager,
} from "./config-manager.js";
