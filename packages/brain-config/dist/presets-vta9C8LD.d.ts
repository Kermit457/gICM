import { z } from 'zod';

/**
 * gICM Brain Configuration Types
 * Opus 4.5 optimizations for token efficiency, extended thinking, and tool management
 */

declare const EffortLevelSchema: z.ZodEnum<["low", "medium", "high"]>;
type EffortLevel = z.infer<typeof EffortLevelSchema>;
declare const EFFORT_DESCRIPTIONS: Record<EffortLevel, string>;
declare const EFFORT_TOKEN_MULTIPLIER: Record<EffortLevel, number>;
declare const ExtendedThinkingConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    budgetTokens: z.ZodDefault<z.ZodNumber>;
    preserveHistory: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    budgetTokens: number;
    preserveHistory: boolean;
}, {
    enabled?: boolean | undefined;
    budgetTokens?: number | undefined;
    preserveHistory?: boolean | undefined;
}>;
type ExtendedThinkingConfig = z.infer<typeof ExtendedThinkingConfigSchema>;
declare const ToolSearchConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    maxToolsPerRequest: z.ZodDefault<z.ZodNumber>;
    catalogPath: z.ZodOptional<z.ZodString>;
    lazyLoad: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    maxToolsPerRequest: number;
    lazyLoad: boolean;
    catalogPath?: string | undefined;
}, {
    enabled?: boolean | undefined;
    maxToolsPerRequest?: number | undefined;
    catalogPath?: string | undefined;
    lazyLoad?: boolean | undefined;
}>;
type ToolSearchConfig = z.infer<typeof ToolSearchConfigSchema>;
declare const MemoryConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    provider: z.ZodDefault<z.ZodEnum<["local", "redis", "supabase"]>>;
    maxEntries: z.ZodDefault<z.ZodNumber>;
    ttlSeconds: z.ZodDefault<z.ZodNumber>;
    autoSummarize: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    provider: "local" | "redis" | "supabase";
    maxEntries: number;
    ttlSeconds: number;
    autoSummarize: boolean;
}, {
    enabled?: boolean | undefined;
    provider?: "local" | "redis" | "supabase" | undefined;
    maxEntries?: number | undefined;
    ttlSeconds?: number | undefined;
    autoSummarize?: boolean | undefined;
}>;
type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
declare const ContextManagementSchema: z.ZodObject<{
    maxContextTokens: z.ZodDefault<z.ZodNumber>;
    warningThreshold: z.ZodDefault<z.ZodNumber>;
    autoTruncate: z.ZodDefault<z.ZodBoolean>;
    truncationStrategy: z.ZodDefault<z.ZodEnum<["oldest_first", "summary", "sliding_window"]>>;
    preserveSystemPrompt: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    maxContextTokens: number;
    warningThreshold: number;
    autoTruncate: boolean;
    truncationStrategy: "oldest_first" | "summary" | "sliding_window";
    preserveSystemPrompt: boolean;
}, {
    maxContextTokens?: number | undefined;
    warningThreshold?: number | undefined;
    autoTruncate?: boolean | undefined;
    truncationStrategy?: "oldest_first" | "summary" | "sliding_window" | undefined;
    preserveSystemPrompt?: boolean | undefined;
}>;
type ContextManagement = z.infer<typeof ContextManagementSchema>;
declare const ModelPricingSchema: z.ZodObject<{
    inputPer1M: z.ZodNumber;
    outputPer1M: z.ZodNumber;
    cachedInputPer1M: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    inputPer1M: number;
    outputPer1M: number;
    cachedInputPer1M?: number | undefined;
}, {
    inputPer1M: number;
    outputPer1M: number;
    cachedInputPer1M?: number | undefined;
}>;
type ModelPricing = z.infer<typeof ModelPricingSchema>;
declare const MODEL_PRICING: Record<string, ModelPricing>;
declare const BudgetConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    dailyLimitUSD: z.ZodDefault<z.ZodNumber>;
    monthlyLimitUSD: z.ZodDefault<z.ZodNumber>;
    alertThreshold: z.ZodDefault<z.ZodNumber>;
    pauseOnLimit: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    dailyLimitUSD: number;
    monthlyLimitUSD: number;
    alertThreshold: number;
    pauseOnLimit: boolean;
}, {
    enabled?: boolean | undefined;
    dailyLimitUSD?: number | undefined;
    monthlyLimitUSD?: number | undefined;
    alertThreshold?: number | undefined;
    pauseOnLimit?: boolean | undefined;
}>;
type BudgetConfig = z.infer<typeof BudgetConfigSchema>;
declare const BrainConfigSchema: z.ZodObject<{
    provider: z.ZodDefault<z.ZodEnum<["anthropic", "openai", "gemini"]>>;
    model: z.ZodDefault<z.ZodString>;
    effort: z.ZodDefault<z.ZodEnum<["low", "medium", "high"]>>;
    temperature: z.ZodDefault<z.ZodNumber>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    extendedThinking: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        budgetTokens: z.ZodDefault<z.ZodNumber>;
        preserveHistory: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        budgetTokens: number;
        preserveHistory: boolean;
    }, {
        enabled?: boolean | undefined;
        budgetTokens?: number | undefined;
        preserveHistory?: boolean | undefined;
    }>>;
    toolSearch: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        maxToolsPerRequest: z.ZodDefault<z.ZodNumber>;
        catalogPath: z.ZodOptional<z.ZodString>;
        lazyLoad: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        maxToolsPerRequest: number;
        lazyLoad: boolean;
        catalogPath?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        maxToolsPerRequest?: number | undefined;
        catalogPath?: string | undefined;
        lazyLoad?: boolean | undefined;
    }>>;
    memory: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        provider: z.ZodDefault<z.ZodEnum<["local", "redis", "supabase"]>>;
        maxEntries: z.ZodDefault<z.ZodNumber>;
        ttlSeconds: z.ZodDefault<z.ZodNumber>;
        autoSummarize: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        provider: "local" | "redis" | "supabase";
        maxEntries: number;
        ttlSeconds: number;
        autoSummarize: boolean;
    }, {
        enabled?: boolean | undefined;
        provider?: "local" | "redis" | "supabase" | undefined;
        maxEntries?: number | undefined;
        ttlSeconds?: number | undefined;
        autoSummarize?: boolean | undefined;
    }>>;
    context: z.ZodOptional<z.ZodObject<{
        maxContextTokens: z.ZodDefault<z.ZodNumber>;
        warningThreshold: z.ZodDefault<z.ZodNumber>;
        autoTruncate: z.ZodDefault<z.ZodBoolean>;
        truncationStrategy: z.ZodDefault<z.ZodEnum<["oldest_first", "summary", "sliding_window"]>>;
        preserveSystemPrompt: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        maxContextTokens: number;
        warningThreshold: number;
        autoTruncate: boolean;
        truncationStrategy: "oldest_first" | "summary" | "sliding_window";
        preserveSystemPrompt: boolean;
    }, {
        maxContextTokens?: number | undefined;
        warningThreshold?: number | undefined;
        autoTruncate?: boolean | undefined;
        truncationStrategy?: "oldest_first" | "summary" | "sliding_window" | undefined;
        preserveSystemPrompt?: boolean | undefined;
    }>>;
    budget: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        dailyLimitUSD: z.ZodDefault<z.ZodNumber>;
        monthlyLimitUSD: z.ZodDefault<z.ZodNumber>;
        alertThreshold: z.ZodDefault<z.ZodNumber>;
        pauseOnLimit: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        dailyLimitUSD: number;
        monthlyLimitUSD: number;
        alertThreshold: number;
        pauseOnLimit: boolean;
    }, {
        enabled?: boolean | undefined;
        dailyLimitUSD?: number | undefined;
        monthlyLimitUSD?: number | undefined;
        alertThreshold?: number | undefined;
        pauseOnLimit?: boolean | undefined;
    }>>;
    promptCaching: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        minCacheableTokens: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        minCacheableTokens: number;
    }, {
        enabled?: boolean | undefined;
        minCacheableTokens?: number | undefined;
    }>>;
    batchProcessing: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        maxBatchSize: z.ZodDefault<z.ZodNumber>;
        maxWaitMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        maxBatchSize: number;
        maxWaitMs: number;
    }, {
        enabled?: boolean | undefined;
        maxBatchSize?: number | undefined;
        maxWaitMs?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    provider: "anthropic" | "openai" | "gemini";
    model: string;
    effort: "low" | "medium" | "high";
    temperature: number;
    maxTokens: number;
    extendedThinking?: {
        enabled: boolean;
        budgetTokens: number;
        preserveHistory: boolean;
    } | undefined;
    toolSearch?: {
        enabled: boolean;
        maxToolsPerRequest: number;
        lazyLoad: boolean;
        catalogPath?: string | undefined;
    } | undefined;
    memory?: {
        enabled: boolean;
        provider: "local" | "redis" | "supabase";
        maxEntries: number;
        ttlSeconds: number;
        autoSummarize: boolean;
    } | undefined;
    context?: {
        maxContextTokens: number;
        warningThreshold: number;
        autoTruncate: boolean;
        truncationStrategy: "oldest_first" | "summary" | "sliding_window";
        preserveSystemPrompt: boolean;
    } | undefined;
    budget?: {
        enabled: boolean;
        dailyLimitUSD: number;
        monthlyLimitUSD: number;
        alertThreshold: number;
        pauseOnLimit: boolean;
    } | undefined;
    promptCaching?: {
        enabled: boolean;
        minCacheableTokens: number;
    } | undefined;
    batchProcessing?: {
        enabled: boolean;
        maxBatchSize: number;
        maxWaitMs: number;
    } | undefined;
}, {
    provider?: "anthropic" | "openai" | "gemini" | undefined;
    model?: string | undefined;
    effort?: "low" | "medium" | "high" | undefined;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    extendedThinking?: {
        enabled?: boolean | undefined;
        budgetTokens?: number | undefined;
        preserveHistory?: boolean | undefined;
    } | undefined;
    toolSearch?: {
        enabled?: boolean | undefined;
        maxToolsPerRequest?: number | undefined;
        catalogPath?: string | undefined;
        lazyLoad?: boolean | undefined;
    } | undefined;
    memory?: {
        enabled?: boolean | undefined;
        provider?: "local" | "redis" | "supabase" | undefined;
        maxEntries?: number | undefined;
        ttlSeconds?: number | undefined;
        autoSummarize?: boolean | undefined;
    } | undefined;
    context?: {
        maxContextTokens?: number | undefined;
        warningThreshold?: number | undefined;
        autoTruncate?: boolean | undefined;
        truncationStrategy?: "oldest_first" | "summary" | "sliding_window" | undefined;
        preserveSystemPrompt?: boolean | undefined;
    } | undefined;
    budget?: {
        enabled?: boolean | undefined;
        dailyLimitUSD?: number | undefined;
        monthlyLimitUSD?: number | undefined;
        alertThreshold?: number | undefined;
        pauseOnLimit?: boolean | undefined;
    } | undefined;
    promptCaching?: {
        enabled?: boolean | undefined;
        minCacheableTokens?: number | undefined;
    } | undefined;
    batchProcessing?: {
        enabled?: boolean | undefined;
        maxBatchSize?: number | undefined;
        maxWaitMs?: number | undefined;
    } | undefined;
}>;
type BrainConfig = z.infer<typeof BrainConfigSchema>;
interface UsageMetrics {
    requestId: string;
    timestamp: Date;
    model: string;
    effort: EffortLevel;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    cachedInputTokens?: number;
    costUSD: number;
    latencyMs: number;
    tokensSaved?: number;
    costSavedUSD?: number;
}
interface AggregatedMetrics {
    period: "day" | "week" | "month";
    startDate: Date;
    endDate: Date;
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUSD: number;
    totalTokensSaved: number;
    totalCostSavedUSD: number;
    avgLatencyMs: number;
    avgTokensPerRequest: number;
    byModel: Record<string, {
        requests: number;
        tokens: number;
        costUSD: number;
    }>;
    byEffort: Record<EffortLevel, {
        requests: number;
        tokens: number;
        costUSD: number;
    }>;
}
interface BrainPreset {
    id: string;
    name: string;
    description: string;
    icon: string;
    tags: string[];
    config: Partial<BrainConfig>;
    estimatedSavings: string;
    bestFor: string[];
}

/**
 * gICM Brain Presets
 * Pre-configured brain settings optimized for different use cases
 */

declare const PRESET_TURBO: BrainPreset;
declare const PRESET_BALANCED: BrainPreset;
declare const PRESET_POWERHOUSE: BrainPreset;
declare const PRESET_TRADING: BrainPreset;
declare const PRESET_HUNTER: BrainPreset;
declare const PRESET_BUILDER: BrainPreset;
declare const PRESET_GROWTH: BrainPreset;
declare const PRESET_AUTONOMY: BrainPreset;
declare const PRESET_DEEP_RESEARCH: BrainPreset;
declare const PRESET_ULTRA_SAVER: BrainPreset;
declare const ALL_PRESETS: BrainPreset[];
declare const PRESETS_BY_ID: Record<string, BrainPreset>;
declare function getPresetById(id: string): BrainPreset | undefined;
declare function getPresetsByTag(tag: string): BrainPreset[];
declare function getRecommendedPreset(useCase: string): BrainPreset;
declare function createCustomPreset(base: BrainPreset, overrides: Partial<BrainConfig>, meta: {
    name: string;
    description: string;
}): BrainPreset;

export { type AggregatedMetrics as A, type BrainConfig as B, ContextManagementSchema as C, getPresetById as D, type EffortLevel as E, getPresetsByTag as F, getRecommendedPreset as G, createCustomPreset as H, MemoryConfigSchema as M, PRESET_TURBO as P, ToolSearchConfigSchema as T, type UsageMetrics as U, type BrainPreset as a, EffortLevelSchema as b, EFFORT_DESCRIPTIONS as c, EFFORT_TOKEN_MULTIPLIER as d, ExtendedThinkingConfigSchema as e, type ExtendedThinkingConfig as f, type ToolSearchConfig as g, type MemoryConfig as h, type ContextManagement as i, ModelPricingSchema as j, type ModelPricing as k, MODEL_PRICING as l, BudgetConfigSchema as m, type BudgetConfig as n, BrainConfigSchema as o, PRESET_BALANCED as p, PRESET_POWERHOUSE as q, PRESET_TRADING as r, PRESET_HUNTER as s, PRESET_BUILDER as t, PRESET_GROWTH as u, PRESET_AUTONOMY as v, PRESET_DEEP_RESEARCH as w, PRESET_ULTRA_SAVER as x, ALL_PRESETS as y, PRESETS_BY_ID as z };
