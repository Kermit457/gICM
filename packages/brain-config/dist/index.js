// src/types.ts
import { z } from "zod";
var EffortLevelSchema = z.enum(["low", "medium", "high"]);
var EFFORT_DESCRIPTIONS = {
  low: "Fast responses, minimal reasoning. Best for simple queries. ~76% token savings.",
  medium: "Balanced quality and efficiency. Recommended default. ~50% token savings.",
  high: "Maximum quality, thorough reasoning. For complex tasks. Full token usage."
};
var EFFORT_TOKEN_MULTIPLIER = {
  low: 0.25,
  medium: 0.5,
  high: 1
};
var ExtendedThinkingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  budgetTokens: z.number().min(1e3).max(128e3).default(8e3),
  preserveHistory: z.boolean().default(true)
  // Keep thinking blocks in context
});
var ToolSearchConfigSchema = z.object({
  enabled: z.boolean().default(false),
  maxToolsPerRequest: z.number().min(1).max(50).default(10),
  catalogPath: z.string().optional(),
  // Path to tool catalog
  lazyLoad: z.boolean().default(true)
  // Load tools on-demand
});
var MemoryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["local", "redis", "supabase"]).default("local"),
  maxEntries: z.number().min(10).max(1e4).default(1e3),
  ttlSeconds: z.number().min(60).max(86400 * 30).default(86400),
  // 1 day default
  autoSummarize: z.boolean().default(true)
  // Summarize before context overflow
});
var ContextManagementSchema = z.object({
  maxContextTokens: z.number().min(1e3).max(1e6).default(2e5),
  warningThreshold: z.number().min(0.5).max(0.95).default(0.8),
  // Warn at 80%
  autoTruncate: z.boolean().default(true),
  truncationStrategy: z.enum(["oldest_first", "summary", "sliding_window"]).default("sliding_window"),
  preserveSystemPrompt: z.boolean().default(true)
});
var ModelPricingSchema = z.object({
  inputPer1M: z.number(),
  // $ per 1M input tokens
  outputPer1M: z.number(),
  // $ per 1M output tokens
  cachedInputPer1M: z.number().optional()
  // $ per 1M cached input tokens
});
var MODEL_PRICING = {
  "claude-opus-4-5-20251101": { inputPer1M: 5, outputPer1M: 25, cachedInputPer1M: 0.5 },
  "claude-sonnet-4-20250514": { inputPer1M: 3, outputPer1M: 15, cachedInputPer1M: 0.3 },
  "claude-haiku-3-5-20241022": { inputPer1M: 0.25, outputPer1M: 1.25, cachedInputPer1M: 0.025 },
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gemini-1.5-pro": { inputPer1M: 1.25, outputPer1M: 5 },
  "gemini-2.0-flash": { inputPer1M: 0.075, outputPer1M: 0.3 }
};
var BudgetConfigSchema = z.object({
  enabled: z.boolean().default(true),
  dailyLimitUSD: z.number().min(0).default(10),
  monthlyLimitUSD: z.number().min(0).default(100),
  alertThreshold: z.number().min(0.5).max(1).default(0.8),
  // Alert at 80% usage
  pauseOnLimit: z.boolean().default(false)
  // Pause operations on limit
});
var BrainConfigSchema = z.object({
  // Model selection
  provider: z.enum(["anthropic", "openai", "gemini"]).default("anthropic"),
  model: z.string().default("claude-opus-4-5-20251101"),
  // Token efficiency
  effort: EffortLevelSchema.default("medium"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(64e3).default(8192),
  // Advanced features
  extendedThinking: ExtendedThinkingConfigSchema.optional(),
  toolSearch: ToolSearchConfigSchema.optional(),
  memory: MemoryConfigSchema.optional(),
  context: ContextManagementSchema.optional(),
  budget: BudgetConfigSchema.optional(),
  // Prompt caching (90% savings on repeated prompts)
  promptCaching: z.object({
    enabled: z.boolean().default(true),
    minCacheableTokens: z.number().min(100).default(1024)
  }).optional(),
  // Batch processing (50% savings)
  batchProcessing: z.object({
    enabled: z.boolean().default(false),
    maxBatchSize: z.number().min(1).max(100).default(10),
    maxWaitMs: z.number().min(100).max(6e4).default(5e3)
  }).optional()
});

// src/presets.ts
var PRESET_TURBO = {
  id: "turbo",
  name: "Turbo Mode",
  description: "Maximum speed, minimal tokens. Fast responses for simple tasks.",
  icon: "Zap",
  tags: ["speed", "cost-saving", "simple-tasks"],
  config: {
    provider: "anthropic",
    model: "claude-haiku-3-5-20241022",
    effort: "low",
    temperature: 0.3,
    maxTokens: 2048,
    promptCaching: { enabled: true, minCacheableTokens: 512 }
  },
  estimatedSavings: "~85% cost reduction vs Opus high",
  bestFor: ["Quick queries", "Simple code fixes", "Data formatting", "Status checks"]
};
var PRESET_BALANCED = {
  id: "balanced",
  name: "Balanced",
  description: "Optimal balance of quality, speed, and cost. Recommended default.",
  icon: "Scale",
  tags: ["recommended", "balanced", "default"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "medium",
    temperature: 0.7,
    maxTokens: 8192,
    promptCaching: { enabled: true, minCacheableTokens: 1024 },
    context: {
      maxContextTokens: 2e5,
      warningThreshold: 0.8,
      autoTruncate: true,
      truncationStrategy: "sliding_window",
      preserveSystemPrompt: true
    }
  },
  estimatedSavings: "~50% token savings vs high effort",
  bestFor: ["Daily coding", "Code reviews", "Research", "Documentation"]
};
var PRESET_POWERHOUSE = {
  id: "powerhouse",
  name: "Powerhouse",
  description: "Maximum intelligence with Opus 4.5. For complex reasoning tasks.",
  icon: "Brain",
  tags: ["max-quality", "complex", "reasoning"],
  config: {
    provider: "anthropic",
    model: "claude-opus-4-5-20251101",
    effort: "high",
    temperature: 0.5,
    maxTokens: 16384,
    extendedThinking: {
      enabled: true,
      budgetTokens: 16e3,
      preserveHistory: true
    },
    promptCaching: { enabled: true, minCacheableTokens: 1024 }
  },
  estimatedSavings: "Full token usage, maximum quality",
  bestFor: ["Architecture decisions", "Complex debugging", "Algorithm design", "Security audits"]
};
var PRESET_TRADING = {
  id: "trading",
  name: "Trading Agent",
  description: "Optimized for DeFi trading decisions. Fast, precise, risk-aware.",
  icon: "TrendingUp",
  tags: ["trading", "defi", "fast-decisions"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "medium",
    temperature: 0.2,
    // Low for consistency
    maxTokens: 4096,
    memory: {
      enabled: true,
      provider: "local",
      maxEntries: 500,
      ttlSeconds: 3600,
      // 1 hour for trading context
      autoSummarize: true
    },
    budget: {
      enabled: true,
      dailyLimitUSD: 20,
      monthlyLimitUSD: 200,
      alertThreshold: 0.8,
      pauseOnLimit: false
    }
  },
  estimatedSavings: "~40% vs unoptimized",
  bestFor: ["Token analysis", "Risk assessment", "Trade execution", "Market monitoring"]
};
var PRESET_HUNTER = {
  id: "hunter",
  name: "Hunter Agent",
  description: "Optimized for opportunity discovery. Broad search, quick analysis.",
  icon: "Search",
  tags: ["discovery", "research", "scanning"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "low",
    // Fast scanning
    temperature: 0.5,
    maxTokens: 2048,
    toolSearch: {
      enabled: true,
      maxToolsPerRequest: 15,
      lazyLoad: true
    },
    batchProcessing: {
      enabled: true,
      maxBatchSize: 20,
      maxWaitMs: 3e3
    }
  },
  estimatedSavings: "~70% with batch processing",
  bestFor: ["Token discovery", "Trend analysis", "Social scanning", "GitHub monitoring"]
};
var PRESET_BUILDER = {
  id: "builder",
  name: "Builder Agent",
  description: "Optimized for code generation. High quality, extended thinking.",
  icon: "Code",
  tags: ["coding", "generation", "quality"],
  config: {
    provider: "anthropic",
    model: "claude-opus-4-5-20251101",
    effort: "high",
    temperature: 0.3,
    maxTokens: 32e3,
    extendedThinking: {
      enabled: true,
      budgetTokens: 24e3,
      preserveHistory: true
    },
    context: {
      maxContextTokens: 2e5,
      warningThreshold: 0.75,
      autoTruncate: true,
      truncationStrategy: "summary",
      preserveSystemPrompt: true
    }
  },
  estimatedSavings: "Quality over cost",
  bestFor: ["Feature development", "Refactoring", "Test generation", "Architecture"]
};
var PRESET_GROWTH = {
  id: "growth",
  name: "Growth Engine",
  description: "Optimized for content generation. Creative, consistent, cost-effective.",
  icon: "Megaphone",
  tags: ["content", "marketing", "social"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "medium",
    temperature: 0.8,
    // Higher for creativity
    maxTokens: 4096,
    batchProcessing: {
      enabled: true,
      maxBatchSize: 10,
      maxWaitMs: 1e4
    },
    budget: {
      enabled: true,
      dailyLimitUSD: 5,
      monthlyLimitUSD: 50,
      alertThreshold: 0.9,
      pauseOnLimit: true
    }
  },
  estimatedSavings: "~60% with batching",
  bestFor: ["Blog posts", "Tweets", "SEO content", "Discord messages"]
};
var PRESET_AUTONOMY = {
  id: "autonomy",
  name: "Autonomy Engine",
  description: "Optimized for autonomous operations. Careful reasoning, bounded actions.",
  icon: "Shield",
  tags: ["autonomy", "safety", "oversight"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "medium",
    temperature: 0.3,
    // Low for predictability
    maxTokens: 4096,
    extendedThinking: {
      enabled: true,
      budgetTokens: 8e3,
      preserveHistory: true
    },
    memory: {
      enabled: true,
      provider: "local",
      maxEntries: 1e3,
      ttlSeconds: 86400,
      autoSummarize: true
    }
  },
  estimatedSavings: "~45% vs unoptimized",
  bestFor: ["Risk classification", "Boundary checking", "Decision routing", "Audit logging"]
};
var PRESET_DEEP_RESEARCH = {
  id: "deep-research",
  name: "Deep Research",
  description: "Maximum context for research. 1M token context window.",
  icon: "BookOpen",
  tags: ["research", "analysis", "long-context"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    // 1M context available
    effort: "high",
    temperature: 0.5,
    maxTokens: 16384,
    context: {
      maxContextTokens: 1e6,
      // 1M tokens!
      warningThreshold: 0.9,
      autoTruncate: false,
      truncationStrategy: "summary",
      preserveSystemPrompt: true
    },
    memory: {
      enabled: true,
      provider: "local",
      maxEntries: 5e3,
      ttlSeconds: 604800,
      // 1 week
      autoSummarize: true
    }
  },
  estimatedSavings: "Context-heavy, quality-focused",
  bestFor: ["Codebase analysis", "Documentation review", "Audit reports", "Trend research"]
};
var PRESET_ULTRA_SAVER = {
  id: "ultra-saver",
  name: "Ultra Saver",
  description: "Maximum cost savings. For high-volume, low-complexity tasks.",
  icon: "PiggyBank",
  tags: ["budget", "high-volume", "cost"],
  config: {
    provider: "gemini",
    model: "gemini-2.0-flash",
    effort: "low",
    temperature: 0.3,
    maxTokens: 1024,
    batchProcessing: {
      enabled: true,
      maxBatchSize: 50,
      maxWaitMs: 1e4
    },
    budget: {
      enabled: true,
      dailyLimitUSD: 1,
      monthlyLimitUSD: 10,
      alertThreshold: 0.7,
      pauseOnLimit: true
    }
  },
  estimatedSavings: "~95% vs Opus high",
  bestFor: ["Data extraction", "Simple formatting", "Bulk processing", "Validation"]
};
var ALL_PRESETS = [
  // Efficiency
  PRESET_TURBO,
  PRESET_BALANCED,
  PRESET_POWERHOUSE,
  // Use cases
  PRESET_TRADING,
  PRESET_HUNTER,
  PRESET_BUILDER,
  PRESET_GROWTH,
  PRESET_AUTONOMY,
  // Special
  PRESET_DEEP_RESEARCH,
  PRESET_ULTRA_SAVER
];
var PRESETS_BY_ID = Object.fromEntries(
  ALL_PRESETS.map((p) => [p.id, p])
);
function getPresetById(id) {
  return PRESETS_BY_ID[id];
}
function getPresetsByTag(tag) {
  return ALL_PRESETS.filter((p) => p.tags.includes(tag));
}
function getRecommendedPreset(useCase) {
  const lowerCase = useCase.toLowerCase();
  if (lowerCase.includes("trad") || lowerCase.includes("defi")) return PRESET_TRADING;
  if (lowerCase.includes("hunt") || lowerCase.includes("discover")) return PRESET_HUNTER;
  if (lowerCase.includes("build") || lowerCase.includes("code")) return PRESET_BUILDER;
  if (lowerCase.includes("growth") || lowerCase.includes("content")) return PRESET_GROWTH;
  if (lowerCase.includes("research") || lowerCase.includes("analyz")) return PRESET_DEEP_RESEARCH;
  if (lowerCase.includes("budget") || lowerCase.includes("cheap")) return PRESET_ULTRA_SAVER;
  if (lowerCase.includes("fast") || lowerCase.includes("quick")) return PRESET_TURBO;
  if (lowerCase.includes("complex") || lowerCase.includes("reason")) return PRESET_POWERHOUSE;
  return PRESET_BALANCED;
}
function createCustomPreset(base, overrides, meta) {
  return {
    ...base,
    id: `custom-${Date.now()}`,
    name: meta.name,
    description: meta.description,
    tags: [...base.tags, "custom"],
    config: { ...base.config, ...overrides }
  };
}

// src/brain-manager.ts
import { EventEmitter } from "eventemitter3";
var BrainManager = class _BrainManager extends EventEmitter {
  config;
  usageHistory = [];
  dailyUsageUSD = 0;
  monthlyUsageUSD = 0;
  lastDayReset;
  lastMonthReset;
  constructor(initialConfig) {
    super();
    this.config = BrainConfigSchema.parse({
      ...PRESET_BALANCED.config,
      ...initialConfig
    });
    this.lastDayReset = /* @__PURE__ */ new Date();
    this.lastMonthReset = /* @__PURE__ */ new Date();
  }
  // ===========================================================================
  // CONFIG MANAGEMENT
  // ===========================================================================
  getConfig() {
    return { ...this.config };
  }
  updateConfig(updates) {
    this.config = BrainConfigSchema.parse({ ...this.config, ...updates });
    this.emit("config:updated", this.config);
    return this.config;
  }
  applyPreset(presetId) {
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
  recordUsage(metrics) {
    this.resetBudgetsIfNeeded();
    const pricing = MODEL_PRICING[metrics.model] ?? { inputPer1M: 5, outputPer1M: 25 };
    const inputCost = metrics.inputTokens / 1e6 * pricing.inputPer1M;
    const outputCost = metrics.outputTokens / 1e6 * pricing.outputPer1M;
    const cachedCost = metrics.cachedInputTokens ? metrics.cachedInputTokens / 1e6 * (pricing.cachedInputPer1M ?? pricing.inputPer1M * 0.1) : 0;
    const thinkingCost = metrics.thinkingTokens ? metrics.thinkingTokens / 1e6 * pricing.outputPer1M : 0;
    const costUSD = inputCost + outputCost + cachedCost + thinkingCost;
    const highEffortMultiplier = EFFORT_TOKEN_MULTIPLIER.high;
    const actualMultiplier = EFFORT_TOKEN_MULTIPLIER[metrics.effort];
    const potentialTokens = (metrics.inputTokens + metrics.outputTokens) * (highEffortMultiplier / actualMultiplier);
    const tokensSaved = Math.max(0, potentialTokens - (metrics.inputTokens + metrics.outputTokens));
    const costSavedUSD = tokensSaved / 1e6 * ((pricing.inputPer1M + pricing.outputPer1M) / 2);
    const fullMetrics = {
      ...metrics,
      costUSD,
      tokensSaved,
      costSavedUSD
    };
    this.usageHistory.push(fullMetrics);
    this.dailyUsageUSD += costUSD;
    this.monthlyUsageUSD += costUSD;
    this.emit("usage:recorded", fullMetrics);
    this.checkBudgetLimits();
    return fullMetrics;
  }
  resetBudgetsIfNeeded() {
    const now = /* @__PURE__ */ new Date();
    if (now.toDateString() !== this.lastDayReset.toDateString()) {
      this.dailyUsageUSD = 0;
      this.lastDayReset = now;
    }
    if (now.getMonth() !== this.lastMonthReset.getMonth()) {
      this.monthlyUsageUSD = 0;
      this.lastMonthReset = now;
    }
  }
  checkBudgetLimits() {
    const budget = this.config.budget;
    if (!budget?.enabled) return;
    const dailyThreshold = budget.dailyLimitUSD * budget.alertThreshold;
    if (this.dailyUsageUSD >= budget.dailyLimitUSD) {
      this.emit("budget:exceeded", this.dailyUsageUSD, budget.dailyLimitUSD, "daily");
    } else if (this.dailyUsageUSD >= dailyThreshold) {
      this.emit("budget:warning", this.dailyUsageUSD, budget.dailyLimitUSD, "daily");
    }
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
  getUsageMetrics() {
    return [...this.usageHistory];
  }
  getAggregatedMetrics(period) {
    const now = /* @__PURE__ */ new Date();
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
    const byModel = {};
    const byEffort = {
      low: { requests: 0, tokens: 0, costUSD: 0 },
      medium: { requests: 0, tokens: 0, costUSD: 0 },
      high: { requests: 0, tokens: 0, costUSD: 0 }
    };
    let totalLatency = 0;
    let totalTokensSaved = 0;
    let totalCostSavedUSD = 0;
    for (const m of filtered) {
      const tokens = m.inputTokens + m.outputTokens + (m.thinkingTokens ?? 0);
      if (!byModel[m.model]) {
        byModel[m.model] = { requests: 0, tokens: 0, costUSD: 0 };
      }
      byModel[m.model].requests++;
      byModel[m.model].tokens += tokens;
      byModel[m.model].costUSD += m.costUSD;
      byEffort[m.effort].requests++;
      byEffort[m.effort].tokens += tokens;
      byEffort[m.effort].costUSD += m.costUSD;
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
      byEffort
    };
  }
  getCurrentBudgetStatus() {
    this.resetBudgetsIfNeeded();
    const budget = this.config.budget ?? { dailyLimitUSD: 10, monthlyLimitUSD: 100 };
    return {
      daily: {
        used: this.dailyUsageUSD,
        limit: budget.dailyLimitUSD,
        percent: this.dailyUsageUSD / budget.dailyLimitUSD * 100
      },
      monthly: {
        used: this.monthlyUsageUSD,
        limit: budget.monthlyLimitUSD,
        percent: this.monthlyUsageUSD / budget.monthlyLimitUSD * 100
      }
    };
  }
  // ===========================================================================
  // COST ESTIMATION
  // ===========================================================================
  estimateCost(inputTokens, outputTokens, model, options) {
    const modelId = model ?? this.config.model;
    const pricing = MODEL_PRICING[modelId] ?? { inputPer1M: 5, outputPer1M: 25 };
    let cost = 0;
    cost += inputTokens / 1e6 * pricing.inputPer1M;
    cost += outputTokens / 1e6 * pricing.outputPer1M;
    if (options?.thinking) {
      cost += options.thinking / 1e6 * pricing.outputPer1M;
    }
    if (options?.cached && pricing.cachedInputPer1M) {
      cost += options.cached / 1e6 * pricing.cachedInputPer1M;
    }
    return cost;
  }
  estimateSavings(inputTokens, outputTokens, fromEffort, toEffort, model) {
    const fromMultiplier = EFFORT_TOKEN_MULTIPLIER[fromEffort];
    const toMultiplier = EFFORT_TOKEN_MULTIPLIER[toEffort];
    const originalTokens = inputTokens + outputTokens;
    const newTokens = originalTokens * (toMultiplier / fromMultiplier);
    const tokensSaved = Math.max(0, originalTokens - newTokens);
    const modelId = model ?? this.config.model;
    const pricing = MODEL_PRICING[modelId] ?? { inputPer1M: 5, outputPer1M: 25 };
    const avgPricePer1M = (pricing.inputPer1M + pricing.outputPer1M) / 2;
    const costSavedUSD = tokensSaved / 1e6 * avgPricePer1M;
    const percentSaved = originalTokens > 0 ? tokensSaved / originalTokens * 100 : 0;
    return { tokensSaved, costSavedUSD, percentSaved };
  }
  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================
  toJSON() {
    return {
      config: this.config,
      budgetStatus: this.getCurrentBudgetStatus(),
      recentMetrics: this.getAggregatedMetrics("day")
    };
  }
  static fromJSON(data) {
    return new _BrainManager(data.config);
  }
};
var defaultManager = null;
function getDefaultBrainManager() {
  if (!defaultManager) {
    defaultManager = new BrainManager();
  }
  return defaultManager;
}
function setDefaultBrainManager(manager) {
  defaultManager = manager;
}
export {
  ALL_PRESETS,
  BrainConfigSchema,
  BrainManager,
  BudgetConfigSchema,
  ContextManagementSchema,
  EFFORT_DESCRIPTIONS,
  EFFORT_TOKEN_MULTIPLIER,
  EffortLevelSchema,
  ExtendedThinkingConfigSchema,
  MODEL_PRICING,
  MemoryConfigSchema,
  ModelPricingSchema,
  PRESETS_BY_ID,
  PRESET_AUTONOMY,
  PRESET_BALANCED,
  PRESET_BUILDER,
  PRESET_DEEP_RESEARCH,
  PRESET_GROWTH,
  PRESET_HUNTER,
  PRESET_POWERHOUSE,
  PRESET_TRADING,
  PRESET_TURBO,
  PRESET_ULTRA_SAVER,
  ToolSearchConfigSchema,
  createCustomPreset,
  getDefaultBrainManager,
  getPresetById,
  getPresetsByTag,
  getRecommendedPreset,
  setDefaultBrainManager
};
//# sourceMappingURL=index.js.map