/**
 * Plugin System Types & Schemas
 * Phase 9D: Enterprise Plugin Architecture
 */

import { z } from "zod";

// ============================================================================
// PLUGIN METADATA
// ============================================================================

export const PluginMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  keywords: z.array(z.string()).default([]),
  category: z.enum([
    "integration",    // External service integrations
    "tool",           // Pipeline tools
    "transform",      // Data transformers
    "notification",   // Notification channels
    "analytics",      // Analytics extensions
    "security",       // Security features
    "ui",             // UI components
    "other",
  ]).default("other"),
});
export type PluginMetadata = z.infer<typeof PluginMetadataSchema>;

// ============================================================================
// PLUGIN CAPABILITIES
// ============================================================================

export const PluginCapabilitySchema = z.enum([
  "tools",            // Provides pipeline tools
  "hooks",            // Provides lifecycle hooks
  "routes",           // Provides API routes
  "middleware",       // Provides middleware
  "storage",          // Provides storage adapters
  "notifications",    // Provides notification channels
  "transforms",       // Provides data transformers
  "validators",       // Provides validators
  "ui_components",    // Provides UI components
]);
export type PluginCapability = z.infer<typeof PluginCapabilitySchema>;

// ============================================================================
// PLUGIN STATUS
// ============================================================================

export const PluginStatusSchema = z.enum([
  "registered",       // Plugin registered but not installed
  "installing",       // Plugin being installed
  "installed",        // Plugin installed but not enabled
  "enabled",          // Plugin enabled and active
  "disabled",         // Plugin disabled
  "error",            // Plugin in error state
  "uninstalling",     // Plugin being uninstalled
]);
export type PluginStatus = z.infer<typeof PluginStatusSchema>;

// ============================================================================
// PLUGIN CONFIG
// ============================================================================

export const PluginConfigFieldSchema = z.object({
  key: z.string(),
  type: z.enum(["string", "number", "boolean", "select", "multiselect", "secret"]),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});
export type PluginConfigField = z.infer<typeof PluginConfigFieldSchema>;

export const PluginConfigSchema = z.object({
  fields: z.array(PluginConfigFieldSchema),
  values: z.record(z.unknown()).default({}),
});
export type PluginConfig = z.infer<typeof PluginConfigSchema>;

// ============================================================================
// PLUGIN HOOK
// ============================================================================

export const PluginHookTypeSchema = z.enum([
  // Lifecycle hooks
  "onInit",
  "onStart",
  "onStop",
  "onDestroy",

  // Pipeline hooks
  "beforePipelineExecute",
  "afterPipelineExecute",
  "onPipelineError",

  // Step hooks
  "beforeStepExecute",
  "afterStepExecute",
  "onStepError",

  // Tool hooks
  "beforeToolCall",
  "afterToolCall",
  "onToolError",

  // Auth hooks
  "onLogin",
  "onLogout",
  "onPermissionCheck",

  // Data hooks
  "beforeSave",
  "afterSave",
  "beforeDelete",
  "afterDelete",

  // Custom hooks
  "custom",
]);
export type PluginHookType = z.infer<typeof PluginHookTypeSchema>;

export const PluginHookSchema = z.object({
  type: PluginHookTypeSchema,
  priority: z.number().default(100),
  handler: z.function().args(z.unknown()).returns(z.promise(z.unknown())),
});
export type PluginHook = z.infer<typeof PluginHookSchema>;

// ============================================================================
// PLUGIN TOOL
// ============================================================================

export const PluginToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().default("custom"),
  inputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(true),
    default: z.unknown().optional(),
  })),
  outputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
  })).optional(),
  execute: z.function().args(z.unknown()).returns(z.promise(z.unknown())),
});
export type PluginTool = z.infer<typeof PluginToolSchema>;

// ============================================================================
// PLUGIN ROUTE
// ============================================================================

export const PluginRouteMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);
export type PluginRouteMethod = z.infer<typeof PluginRouteMethodSchema>;

export const PluginRouteSchema = z.object({
  method: PluginRouteMethodSchema,
  path: z.string(),
  handler: z.function().args(z.unknown(), z.unknown()).returns(z.promise(z.unknown())),
  auth: z.boolean().default(true),
  permissions: z.array(z.string()).optional(),
});
export type PluginRoute = z.infer<typeof PluginRouteSchema>;

// ============================================================================
// PLUGIN DEFINITION
// ============================================================================

export const PluginDefinitionSchema = z.object({
  // Metadata
  metadata: PluginMetadataSchema,

  // Capabilities
  capabilities: z.array(PluginCapabilitySchema).default([]),

  // Dependencies
  dependencies: z.array(z.object({
    pluginId: z.string(),
    version: z.string().optional(),
    optional: z.boolean().default(false),
  })).default([]),

  // Configuration schema
  configSchema: PluginConfigSchema.optional(),

  // Resources provided
  tools: z.array(PluginToolSchema).optional(),
  hooks: z.array(PluginHookSchema).optional(),
  routes: z.array(PluginRouteSchema).optional(),

  // Lifecycle methods
  onInstall: z.function().returns(z.promise(z.void())).optional(),
  onUninstall: z.function().returns(z.promise(z.void())).optional(),
  onEnable: z.function().returns(z.promise(z.void())).optional(),
  onDisable: z.function().returns(z.promise(z.void())).optional(),
  onConfigChange: z.function().args(z.unknown()).returns(z.promise(z.void())).optional(),
});
export type PluginDefinition = z.infer<typeof PluginDefinitionSchema>;

// ============================================================================
// INSTALLED PLUGIN
// ============================================================================

export const InstalledPluginSchema = z.object({
  id: z.string(),
  metadata: PluginMetadataSchema,
  status: PluginStatusSchema,
  capabilities: z.array(PluginCapabilitySchema),
  config: z.record(z.unknown()).default({}),
  installedAt: z.date(),
  enabledAt: z.date().optional(),
  lastError: z.string().optional(),
  stats: z.object({
    hooksCalled: z.number().default(0),
    toolsExecuted: z.number().default(0),
    routesHit: z.number().default(0),
    errors: z.number().default(0),
  }).default({}),
});
export type InstalledPlugin = z.infer<typeof InstalledPluginSchema>;

// ============================================================================
// PLUGIN EVENTS
// ============================================================================

export interface PluginEvents {
  "plugin:registered": (pluginId: string) => void;
  "plugin:installed": (pluginId: string) => void;
  "plugin:enabled": (pluginId: string) => void;
  "plugin:disabled": (pluginId: string) => void;
  "plugin:uninstalled": (pluginId: string) => void;
  "plugin:error": (pluginId: string, error: Error) => void;
  "plugin:config_changed": (pluginId: string, config: Record<string, unknown>) => void;
  "hook:executed": (pluginId: string, hookType: PluginHookType) => void;
  "tool:executed": (pluginId: string, toolId: string) => void;
}

// ============================================================================
// PLUGIN REGISTRY ENTRY
// ============================================================================

export const PluginRegistryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string(),
  version: z.string(),
  category: z.string(),
  downloads: z.number().default(0),
  rating: z.number().min(0).max(5).default(0),
  verified: z.boolean().default(false),
  featured: z.boolean().default(false),
  packageUrl: z.string().url(),
  iconUrl: z.string().url().optional(),
  capabilities: z.array(PluginCapabilitySchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PluginRegistryEntry = z.infer<typeof PluginRegistryEntrySchema>;

// ============================================================================
// PLUGIN MANAGER CONFIG
// ============================================================================

export const PluginManagerConfigSchema = z.object({
  // Storage location for plugins
  pluginsDir: z.string().default("./plugins"),

  // Registry URL for discovering plugins
  registryUrl: z.string().url().optional(),

  // Auto-enable plugins on install
  autoEnable: z.boolean().default(false),

  // Sandbox plugin execution
  sandboxed: z.boolean().default(true),

  // Max plugins allowed
  maxPlugins: z.number().default(50),

  // Plugin timeout (ms)
  timeout: z.number().default(30000),
});
export type PluginManagerConfig = z.infer<typeof PluginManagerConfigSchema>;

// ============================================================================
// HOOK CONTEXT
// ============================================================================

export interface HookContext {
  pluginId: string;
  hookType: PluginHookType;
  timestamp: number;
  data: unknown;
  metadata: Record<string, unknown>;
}

// ============================================================================
// TOOL EXECUTION CONTEXT
// ============================================================================

export interface ToolExecutionContext {
  pluginId: string;
  toolId: string;
  inputs: Record<string, unknown>;
  executionId: string;
  pipelineId?: string;
  stepId?: string;
  userId?: string;
  orgId?: string;
}
