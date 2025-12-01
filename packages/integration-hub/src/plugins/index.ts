/**
 * Plugin System Module
 * Phase 9D: Enterprise Plugin Architecture
 */

// Types & Schemas
export {
  // Metadata
  PluginMetadataSchema,
  type PluginMetadata,

  // Capabilities
  PluginCapabilitySchema,
  type PluginCapability,

  // Status
  PluginStatusSchema,
  type PluginStatus,

  // Config
  PluginConfigFieldSchema,
  type PluginConfigField,
  PluginConfigSchema,
  type PluginConfig,

  // Hooks
  PluginHookTypeSchema,
  type PluginHookType,
  PluginHookSchema,
  type PluginHook,

  // Tools
  PluginToolSchema,
  type PluginTool,

  // Routes
  PluginRouteMethodSchema,
  type PluginRouteMethod,
  PluginRouteSchema,
  type PluginRoute,

  // Definition
  PluginDefinitionSchema,
  type PluginDefinition,

  // Installed Plugin
  InstalledPluginSchema,
  type InstalledPlugin,

  // Registry
  PluginRegistryEntrySchema,
  type PluginRegistryEntry,

  // Manager Config
  PluginManagerConfigSchema,
  type PluginManagerConfig,

  // Events
  type PluginEvents,

  // Context
  type HookContext,
  type ToolExecutionContext,
} from "./types.js";

// Manager
export {
  PluginManager,
  getPluginManager,
  createPluginManager,
} from "./plugin-manager.js";
