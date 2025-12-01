import { B as BrainConfig, a as BrainPreset, U as UsageMetrics, A as AggregatedMetrics, E as EffortLevel } from './presets-vta9C8LD.js';
export { y as ALL_PRESETS, o as BrainConfigSchema, n as BudgetConfig, m as BudgetConfigSchema, i as ContextManagement, C as ContextManagementSchema, c as EFFORT_DESCRIPTIONS, d as EFFORT_TOKEN_MULTIPLIER, b as EffortLevelSchema, f as ExtendedThinkingConfig, e as ExtendedThinkingConfigSchema, l as MODEL_PRICING, h as MemoryConfig, M as MemoryConfigSchema, k as ModelPricing, j as ModelPricingSchema, z as PRESETS_BY_ID, v as PRESET_AUTONOMY, p as PRESET_BALANCED, t as PRESET_BUILDER, w as PRESET_DEEP_RESEARCH, u as PRESET_GROWTH, s as PRESET_HUNTER, q as PRESET_POWERHOUSE, r as PRESET_TRADING, P as PRESET_TURBO, x as PRESET_ULTRA_SAVER, g as ToolSearchConfig, T as ToolSearchConfigSchema, H as createCustomPreset, D as getPresetById, F as getPresetsByTag, G as getRecommendedPreset } from './presets-vta9C8LD.js';
import { EventEmitter } from 'eventemitter3';
import 'zod';

/**
 * gICM Brain Manager
 * Central management for AI configuration, metrics tracking, and cost optimization
 */

interface BrainManagerEvents {
    "config:updated": (config: BrainConfig) => void;
    "config:preset-applied": (preset: BrainPreset) => void;
    "usage:recorded": (metrics: UsageMetrics) => void;
    "budget:warning": (used: number, limit: number, type: "daily" | "monthly") => void;
    "budget:exceeded": (used: number, limit: number, type: "daily" | "monthly") => void;
    "context:warning": (used: number, max: number) => void;
    "error": (error: Error) => void;
}
declare class BrainManager extends EventEmitter<BrainManagerEvents> {
    private config;
    private usageHistory;
    private dailyUsageUSD;
    private monthlyUsageUSD;
    private lastDayReset;
    private lastMonthReset;
    constructor(initialConfig?: Partial<BrainConfig>);
    getConfig(): BrainConfig;
    updateConfig(updates: Partial<BrainConfig>): BrainConfig;
    applyPreset(presetId: string): BrainConfig;
    recordUsage(metrics: Omit<UsageMetrics, "costUSD" | "tokensSaved" | "costSavedUSD">): UsageMetrics;
    private resetBudgetsIfNeeded;
    private checkBudgetLimits;
    getUsageMetrics(): UsageMetrics[];
    getAggregatedMetrics(period: "day" | "week" | "month"): AggregatedMetrics;
    getCurrentBudgetStatus(): {
        daily: {
            used: number;
            limit: number;
            percent: number;
        };
        monthly: {
            used: number;
            limit: number;
            percent: number;
        };
    };
    estimateCost(inputTokens: number, outputTokens: number, model?: string, options?: {
        thinking?: number;
        cached?: number;
    }): number;
    estimateSavings(inputTokens: number, outputTokens: number, fromEffort: EffortLevel, toEffort: EffortLevel, model?: string): {
        tokensSaved: number;
        costSavedUSD: number;
        percentSaved: number;
    };
    toJSON(): {
        config: BrainConfig;
        budgetStatus: ReturnType<BrainManager["getCurrentBudgetStatus"]>;
        recentMetrics: AggregatedMetrics;
    };
    static fromJSON(data: {
        config: BrainConfig;
    }): BrainManager;
}
declare function getDefaultBrainManager(): BrainManager;
declare function setDefaultBrainManager(manager: BrainManager): void;

export { AggregatedMetrics, BrainConfig, BrainManager, type BrainManagerEvents, BrainPreset, EffortLevel, UsageMetrics, getDefaultBrainManager, setDefaultBrainManager };
