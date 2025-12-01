/**
 * @gicm/brain-config
 * gICM Brain Configuration - Opus 4.5 optimizations, token efficiency, and AI workflow management
 */

// Types
export {
  // Effort levels
  EffortLevelSchema,
  type EffortLevel,
  EFFORT_DESCRIPTIONS,
  EFFORT_TOKEN_MULTIPLIER,

  // Extended thinking
  ExtendedThinkingConfigSchema,
  type ExtendedThinkingConfig,

  // Tool search
  ToolSearchConfigSchema,
  type ToolSearchConfig,

  // Memory
  MemoryConfigSchema,
  type MemoryConfig,

  // Context management
  ContextManagementSchema,
  type ContextManagement,

  // Pricing
  ModelPricingSchema,
  type ModelPricing,
  MODEL_PRICING,
  BudgetConfigSchema,
  type BudgetConfig,

  // Brain config
  BrainConfigSchema,
  type BrainConfig,

  // Metrics
  type UsageMetrics,
  type AggregatedMetrics,
  type BrainPreset,
} from "./types.js";

// Presets
export {
  // Individual presets
  PRESET_TURBO,
  PRESET_BALANCED,
  PRESET_POWERHOUSE,
  PRESET_TRADING,
  PRESET_HUNTER,
  PRESET_BUILDER,
  PRESET_GROWTH,
  PRESET_AUTONOMY,
  PRESET_DEEP_RESEARCH,
  PRESET_ULTRA_SAVER,

  // Collections
  ALL_PRESETS,
  PRESETS_BY_ID,

  // Helpers
  getPresetById,
  getPresetsByTag,
  getRecommendedPreset,
  createCustomPreset,
} from "./presets.js";

// Brain Manager
export {
  BrainManager,
  type BrainManagerEvents,
  getDefaultBrainManager,
  setDefaultBrainManager,
} from "./brain-manager.js";
