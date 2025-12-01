/**
 * gICM Brain Configuration Types
 * Opus 4.5 optimizations for token efficiency, extended thinking, and tool management
 */

import { z } from "zod";

// =============================================================================
// EFFORT LEVELS - Control token usage vs quality tradeoff
// =============================================================================

export const EffortLevelSchema = z.enum(["low", "medium", "high"]);
export type EffortLevel = z.infer<typeof EffortLevelSchema>;

export const EFFORT_DESCRIPTIONS: Record<EffortLevel, string> = {
  low: "Fast responses, minimal reasoning. Best for simple queries. ~76% token savings.",
  medium: "Balanced quality and efficiency. Recommended default. ~50% token savings.",
  high: "Maximum quality, thorough reasoning. For complex tasks. Full token usage.",
};

export const EFFORT_TOKEN_MULTIPLIER: Record<EffortLevel, number> = {
  low: 0.25,
  medium: 0.5,
  high: 1.0,
};

// =============================================================================
// EXTENDED THINKING - Deep reasoning for complex problems
// =============================================================================

export const ExtendedThinkingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  budgetTokens: z.number().min(1000).max(128000).default(8000),
  preserveHistory: z.boolean().default(true), // Keep thinking blocks in context
});
export type ExtendedThinkingConfig = z.infer<typeof ExtendedThinkingConfigSchema>;

// =============================================================================
// TOOL SEARCH - Dynamic tool loading for large tool libraries
// =============================================================================

export const ToolSearchConfigSchema = z.object({
  enabled: z.boolean().default(false),
  maxToolsPerRequest: z.number().min(1).max(50).default(10),
  catalogPath: z.string().optional(), // Path to tool catalog
  lazyLoad: z.boolean().default(true), // Load tools on-demand
});
export type ToolSearchConfig = z.infer<typeof ToolSearchConfigSchema>;

// =============================================================================
// MEMORY - External memory for long-running agents
// =============================================================================

export const MemoryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["local", "redis", "supabase"]).default("local"),
  maxEntries: z.number().min(10).max(10000).default(1000),
  ttlSeconds: z.number().min(60).max(86400 * 30).default(86400), // 1 day default
  autoSummarize: z.boolean().default(true), // Summarize before context overflow
});
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

// =============================================================================
// CONTEXT MANAGEMENT - Prevent context overflow
// =============================================================================

export const ContextManagementSchema = z.object({
  maxContextTokens: z.number().min(1000).max(1000000).default(200000),
  warningThreshold: z.number().min(0.5).max(0.95).default(0.8), // Warn at 80%
  autoTruncate: z.boolean().default(true),
  truncationStrategy: z.enum(["oldest_first", "summary", "sliding_window"]).default("sliding_window"),
  preserveSystemPrompt: z.boolean().default(true),
});
export type ContextManagement = z.infer<typeof ContextManagementSchema>;

// =============================================================================
// PRICING - Cost tracking and budgets
// =============================================================================

export const ModelPricingSchema = z.object({
  inputPer1M: z.number(), // $ per 1M input tokens
  outputPer1M: z.number(), // $ per 1M output tokens
  cachedInputPer1M: z.number().optional(), // $ per 1M cached input tokens
});
export type ModelPricing = z.infer<typeof ModelPricingSchema>;

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-5-20251101": { inputPer1M: 5, outputPer1M: 25, cachedInputPer1M: 0.5 },
  "claude-sonnet-4-20250514": { inputPer1M: 3, outputPer1M: 15, cachedInputPer1M: 0.3 },
  "claude-haiku-3-5-20241022": { inputPer1M: 0.25, outputPer1M: 1.25, cachedInputPer1M: 0.025 },
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gemini-1.5-pro": { inputPer1M: 1.25, outputPer1M: 5 },
  "gemini-2.0-flash": { inputPer1M: 0.075, outputPer1M: 0.3 },
};

export const BudgetConfigSchema = z.object({
  enabled: z.boolean().default(true),
  dailyLimitUSD: z.number().min(0).default(10),
  monthlyLimitUSD: z.number().min(0).default(100),
  alertThreshold: z.number().min(0.5).max(1).default(0.8), // Alert at 80% usage
  pauseOnLimit: z.boolean().default(false), // Pause operations on limit
});
export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;

// =============================================================================
// BRAIN CONFIG - Master configuration
// =============================================================================

export const BrainConfigSchema = z.object({
  // Model selection
  provider: z.enum(["anthropic", "openai", "gemini"]).default("anthropic"),
  model: z.string().default("claude-opus-4-5-20251101"),

  // Token efficiency
  effort: EffortLevelSchema.default("medium"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(64000).default(8192),

  // Advanced features
  extendedThinking: ExtendedThinkingConfigSchema.optional(),
  toolSearch: ToolSearchConfigSchema.optional(),
  memory: MemoryConfigSchema.optional(),
  context: ContextManagementSchema.optional(),
  budget: BudgetConfigSchema.optional(),

  // Prompt caching (90% savings on repeated prompts)
  promptCaching: z.object({
    enabled: z.boolean().default(true),
    minCacheableTokens: z.number().min(100).default(1024),
  }).optional(),

  // Batch processing (50% savings)
  batchProcessing: z.object({
    enabled: z.boolean().default(false),
    maxBatchSize: z.number().min(1).max(100).default(10),
    maxWaitMs: z.number().min(100).max(60000).default(5000),
  }).optional(),
});

export type BrainConfig = z.infer<typeof BrainConfigSchema>;

// =============================================================================
// USAGE METRICS
// =============================================================================

export interface UsageMetrics {
  requestId: string;
  timestamp: Date;
  model: string;
  effort: EffortLevel;

  // Token counts
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
  cachedInputTokens?: number;

  // Cost
  costUSD: number;

  // Performance
  latencyMs: number;

  // Savings vs high effort
  tokensSaved?: number;
  costSavedUSD?: number;
}

export interface AggregatedMetrics {
  period: "day" | "week" | "month";
  startDate: Date;
  endDate: Date;

  // Totals
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;

  // Savings
  totalTokensSaved: number;
  totalCostSavedUSD: number;

  // Averages
  avgLatencyMs: number;
  avgTokensPerRequest: number;

  // By model
  byModel: Record<string, {
    requests: number;
    tokens: number;
    costUSD: number;
  }>;

  // By effort level
  byEffort: Record<EffortLevel, {
    requests: number;
    tokens: number;
    costUSD: number;
  }>;
}

// =============================================================================
// PRESET TYPES
// =============================================================================

export interface BrainPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  config: Partial<BrainConfig>;
  estimatedSavings: string; // e.g., "~65% token savings"
  bestFor: string[];
}
