/**
 * gICM Brain Manager
 * Central management for AI configuration, metrics tracking, and cost optimization
 */

import { EventEmitter } from "eventemitter3";
import {
  type BrainConfig,
  type UsageMetrics,
  type AggregatedMetrics,
  type EffortLevel,
  BrainConfigSchema,
  MODEL_PRICING,
  EFFORT_TOKEN_MULTIPLIER,
} from "./types.js";
import { PRESET_BALANCED, getPresetById, type BrainPreset } from "./presets.js";

// =============================================================================
// EVENTS
// =============================================================================

export interface BrainManagerEvents {
  "config:updated": (config: BrainConfig) => void;
  "config:preset-applied": (preset: BrainPreset) => void;
  "usage:recorded": (metrics: UsageMetrics) => void;
  "budget:warning": (used: number, limit: number, type: "daily" | "monthly") => void;
  "budget:exceeded": (used: number, limit: number, type: "daily" | "monthly") => void;
  "context:warning": (used: number, max: number) => void;
  "error": (error: Error) => void;
}

// =============================================================================
// BRAIN MANAGER
// =============================================================================

export class BrainManager extends EventEmitter<BrainManagerEvents> {
  private config: BrainConfig;
  private usageHistory: UsageMetrics[] = [];
  private dailyUsageUSD = 0;
  private monthlyUsageUSD = 0;
  private lastDayReset: Date;
  private lastMonthReset: Date;

  constructor(initialConfig?: Partial<BrainConfig>) {
    super();
    this.config = BrainConfigSchema.parse({
      ...PRESET_BALANCED.config,
      ...initialConfig,
    });
    this.lastDayReset = new Date();
    this.lastMonthReset = new Date();
  }

  // ===========================================================================
  // CONFIG MANAGEMENT
  // ===========================================================================

  getConfig(): BrainConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<BrainConfig>): BrainConfig {
    this.config = BrainConfigSchema.parse({ ...this.config, ...updates });
    this.emit("config:updated", this.config);
    return this.config;
  }

  applyPreset(presetId: string): BrainConfig {
    const preset = getPresetById(presetId);
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }
    this.config = BrainConfigSchema.parse({ ...this.config, ...preset.config });
    this.emit("config:preset-applied", preset);
    this.emit("config:updated", this.config);
    return this.config;
  }

  // ===========================================================================
  // USAGE TRACKING
  // ===========================================================================

  recordUsage(metrics: Omit<UsageMetrics, "costUSD" | "tokensSaved" | "costSavedUSD">): UsageMetrics {
    this.resetBudgetsIfNeeded();

    const pricing = MODEL_PRICING[metrics.model] ?? { inputPer1M: 5, outputPer1M: 25 };
    const inputCost = (metrics.inputTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (metrics.outputTokens / 1_000_000) * pricing.outputPer1M;
    const cachedCost = metrics.cachedInputTokens
      ? (metrics.cachedInputTokens / 1_000_000) * (pricing.cachedInputPer1M ?? pricing.inputPer1M * 0.1)
      : 0;
    const thinkingCost = metrics.thinkingTokens
      ? (metrics.thinkingTokens / 1_000_000) * pricing.outputPer1M
      : 0;

    const costUSD = inputCost + outputCost + cachedCost + thinkingCost;

    // Calculate savings vs high effort
    const highEffortMultiplier = EFFORT_TOKEN_MULTIPLIER.high;
    const actualMultiplier = EFFORT_TOKEN_MULTIPLIER[metrics.effort];
    const potentialTokens = (metrics.inputTokens + metrics.outputTokens) * (highEffortMultiplier / actualMultiplier);
    const tokensSaved = Math.max(0, potentialTokens - (metrics.inputTokens + metrics.outputTokens));
    const costSavedUSD = (tokensSaved / 1_000_000) * ((pricing.inputPer1M + pricing.outputPer1M) / 2);

    const fullMetrics: UsageMetrics = {
      ...metrics,
      costUSD,
      tokensSaved,
      costSavedUSD,
    };

    this.usageHistory.push(fullMetrics);
    this.dailyUsageUSD += costUSD;
    this.monthlyUsageUSD += costUSD;

    this.emit("usage:recorded", fullMetrics);
    this.checkBudgetLimits();

    return fullMetrics;
  }

  private resetBudgetsIfNeeded(): void {
    const now = new Date();

    // Reset daily
    if (now.toDateString() !== this.lastDayReset.toDateString()) {
      this.dailyUsageUSD = 0;
      this.lastDayReset = now;
    }

    // Reset monthly
    if (now.getMonth() !== this.lastMonthReset.getMonth()) {
      this.monthlyUsageUSD = 0;
      this.lastMonthReset = now;
    }
  }

  private checkBudgetLimits(): void {
    const budget = this.config.budget;
    if (!budget?.enabled) return;

    // Daily check
    const dailyThreshold = budget.dailyLimitUSD * budget.alertThreshold;
    if (this.dailyUsageUSD >= budget.dailyLimitUSD) {
      this.emit("budget:exceeded", this.dailyUsageUSD, budget.dailyLimitUSD, "daily");
    } else if (this.dailyUsageUSD >= dailyThreshold) {
      this.emit("budget:warning", this.dailyUsageUSD, budget.dailyLimitUSD, "daily");
    }

    // Monthly check
    const monthlyThreshold = budget.monthlyLimitUSD * budget.alertThreshold;
    if (this.monthlyUsageUSD >= budget.monthlyLimitUSD) {
      this.emit("budget:exceeded", this.monthlyUsageUSD, budget.monthlyLimitUSD, "monthly");
    } else if (this.monthlyUsageUSD >= monthlyThreshold) {
      this.emit("budget:warning", this.monthlyUsageUSD, budget.monthlyLimitUSD, "monthly");
    }
  }

  // ===========================================================================
  // METRICS & ANALYTICS
  // ===========================================================================

  getUsageMetrics(): UsageMetrics[] {
    return [...this.usageHistory];
  }

  getAggregatedMetrics(period: "day" | "week" | "month"): AggregatedMetrics {
    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const filtered = this.usageHistory.filter((m) => m.timestamp >= startDate);

    const byModel: Record<string, { requests: number; tokens: number; costUSD: number }> = {};
    const byEffort: Record<EffortLevel, { requests: number; tokens: number; costUSD: number }> = {
      low: { requests: 0, tokens: 0, costUSD: 0 },
      medium: { requests: 0, tokens: 0, costUSD: 0 },
      high: { requests: 0, tokens: 0, costUSD: 0 },
    };

    let totalLatency = 0;
    let totalTokensSaved = 0;
    let totalCostSavedUSD = 0;

    for (const m of filtered) {
      const tokens = m.inputTokens + m.outputTokens + (m.thinkingTokens ?? 0);

      // By model
      if (!byModel[m.model]) {
        byModel[m.model] = { requests: 0, tokens: 0, costUSD: 0 };
      }
      byModel[m.model].requests++;
      byModel[m.model].tokens += tokens;
      byModel[m.model].costUSD += m.costUSD;

      // By effort
      byEffort[m.effort].requests++;
      byEffort[m.effort].tokens += tokens;
      byEffort[m.effort].costUSD += m.costUSD;

      // Totals
      totalLatency += m.latencyMs;
      totalTokensSaved += m.tokensSaved ?? 0;
      totalCostSavedUSD += m.costSavedUSD ?? 0;
    }

    const totalTokens = filtered.reduce(
      (sum, m) => sum + m.inputTokens + m.outputTokens + (m.thinkingTokens ?? 0),
      0
    );

    return {
      period,
      startDate,
      endDate: now,
      totalRequests: filtered.length,
      totalInputTokens: filtered.reduce((sum, m) => sum + m.inputTokens, 0),
      totalOutputTokens: filtered.reduce((sum, m) => sum + m.outputTokens, 0),
      totalCostUSD: filtered.reduce((sum, m) => sum + m.costUSD, 0),
      totalTokensSaved,
      totalCostSavedUSD,
      avgLatencyMs: filtered.length > 0 ? totalLatency / filtered.length : 0,
      avgTokensPerRequest: filtered.length > 0 ? totalTokens / filtered.length : 0,
      byModel,
      byEffort,
    };
  }

  getCurrentBudgetStatus(): {
    daily: { used: number; limit: number; percent: number };
    monthly: { used: number; limit: number; percent: number };
  } {
    this.resetBudgetsIfNeeded();
    const budget = this.config.budget ?? { dailyLimitUSD: 10, monthlyLimitUSD: 100 };

    return {
      daily: {
        used: this.dailyUsageUSD,
        limit: budget.dailyLimitUSD,
        percent: (this.dailyUsageUSD / budget.dailyLimitUSD) * 100,
      },
      monthly: {
        used: this.monthlyUsageUSD,
        limit: budget.monthlyLimitUSD,
        percent: (this.monthlyUsageUSD / budget.monthlyLimitUSD) * 100,
      },
    };
  }

  // ===========================================================================
  // COST ESTIMATION
  // ===========================================================================

  estimateCost(
    inputTokens: number,
    outputTokens: number,
    model?: string,
    options?: { thinking?: number; cached?: number }
  ): number {
    const modelId = model ?? this.config.model;
    const pricing = MODEL_PRICING[modelId] ?? { inputPer1M: 5, outputPer1M: 25 };

    let cost = 0;
    cost += (inputTokens / 1_000_000) * pricing.inputPer1M;
    cost += (outputTokens / 1_000_000) * pricing.outputPer1M;

    if (options?.thinking) {
      cost += (options.thinking / 1_000_000) * pricing.outputPer1M;
    }
    if (options?.cached && pricing.cachedInputPer1M) {
      cost += (options.cached / 1_000_000) * pricing.cachedInputPer1M;
    }

    return cost;
  }

  estimateSavings(
    inputTokens: number,
    outputTokens: number,
    fromEffort: EffortLevel,
    toEffort: EffortLevel,
    model?: string
  ): { tokensSaved: number; costSavedUSD: number; percentSaved: number } {
    const fromMultiplier = EFFORT_TOKEN_MULTIPLIER[fromEffort];
    const toMultiplier = EFFORT_TOKEN_MULTIPLIER[toEffort];

    const originalTokens = inputTokens + outputTokens;
    const newTokens = originalTokens * (toMultiplier / fromMultiplier);
    const tokensSaved = Math.max(0, originalTokens - newTokens);

    const modelId = model ?? this.config.model;
    const pricing = MODEL_PRICING[modelId] ?? { inputPer1M: 5, outputPer1M: 25 };
    const avgPricePer1M = (pricing.inputPer1M + pricing.outputPer1M) / 2;
    const costSavedUSD = (tokensSaved / 1_000_000) * avgPricePer1M;

    const percentSaved = originalTokens > 0 ? (tokensSaved / originalTokens) * 100 : 0;

    return { tokensSaved, costSavedUSD, percentSaved };
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  toJSON(): {
    config: BrainConfig;
    budgetStatus: ReturnType<BrainManager["getCurrentBudgetStatus"]>;
    recentMetrics: AggregatedMetrics;
  } {
    return {
      config: this.config,
      budgetStatus: this.getCurrentBudgetStatus(),
      recentMetrics: this.getAggregatedMetrics("day"),
    };
  }

  static fromJSON(data: { config: BrainConfig }): BrainManager {
    return new BrainManager(data.config);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let defaultManager: BrainManager | null = null;

export function getDefaultBrainManager(): BrainManager {
  if (!defaultManager) {
    defaultManager = new BrainManager();
  }
  return defaultManager;
}

export function setDefaultBrainManager(manager: BrainManager): void {
  defaultManager = manager;
}
