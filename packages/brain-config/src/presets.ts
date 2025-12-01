/**
 * gICM Brain Presets
 * Pre-configured brain settings optimized for different use cases
 */

import type { BrainConfig, BrainPreset } from "./types.js";
export type { BrainPreset } from "./types.js";

// =============================================================================
// EFFICIENCY PRESETS - Optimize for cost/speed
// =============================================================================

export const PRESET_TURBO: BrainPreset = {
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
    promptCaching: { enabled: true, minCacheableTokens: 512 },
  },
  estimatedSavings: "~85% cost reduction vs Opus high",
  bestFor: ["Quick queries", "Simple code fixes", "Data formatting", "Status checks"],
};

export const PRESET_BALANCED: BrainPreset = {
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
      maxContextTokens: 200000,
      warningThreshold: 0.8,
      autoTruncate: true,
      truncationStrategy: "sliding_window",
      preserveSystemPrompt: true,
    },
  },
  estimatedSavings: "~50% token savings vs high effort",
  bestFor: ["Daily coding", "Code reviews", "Research", "Documentation"],
};

export const PRESET_POWERHOUSE: BrainPreset = {
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
      budgetTokens: 16000,
      preserveHistory: true,
    },
    promptCaching: { enabled: true, minCacheableTokens: 1024 },
  },
  estimatedSavings: "Full token usage, maximum quality",
  bestFor: ["Architecture decisions", "Complex debugging", "Algorithm design", "Security audits"],
};

// =============================================================================
// USE CASE PRESETS - Optimized for specific workflows
// =============================================================================

export const PRESET_TRADING: BrainPreset = {
  id: "trading",
  name: "Trading Agent",
  description: "Optimized for DeFi trading decisions. Fast, precise, risk-aware.",
  icon: "TrendingUp",
  tags: ["trading", "defi", "fast-decisions"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "medium",
    temperature: 0.2, // Low for consistency
    maxTokens: 4096,
    memory: {
      enabled: true,
      provider: "local",
      maxEntries: 500,
      ttlSeconds: 3600, // 1 hour for trading context
      autoSummarize: true,
    },
    budget: {
      enabled: true,
      dailyLimitUSD: 20,
      monthlyLimitUSD: 200,
      alertThreshold: 0.8,
      pauseOnLimit: false,
    },
  },
  estimatedSavings: "~40% vs unoptimized",
  bestFor: ["Token analysis", "Risk assessment", "Trade execution", "Market monitoring"],
};

export const PRESET_HUNTER: BrainPreset = {
  id: "hunter",
  name: "Hunter Agent",
  description: "Optimized for opportunity discovery. Broad search, quick analysis.",
  icon: "Search",
  tags: ["discovery", "research", "scanning"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "low", // Fast scanning
    temperature: 0.5,
    maxTokens: 2048,
    toolSearch: {
      enabled: true,
      maxToolsPerRequest: 15,
      lazyLoad: true,
    },
    batchProcessing: {
      enabled: true,
      maxBatchSize: 20,
      maxWaitMs: 3000,
    },
  },
  estimatedSavings: "~70% with batch processing",
  bestFor: ["Token discovery", "Trend analysis", "Social scanning", "GitHub monitoring"],
};

export const PRESET_BUILDER: BrainPreset = {
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
    maxTokens: 32000,
    extendedThinking: {
      enabled: true,
      budgetTokens: 24000,
      preserveHistory: true,
    },
    context: {
      maxContextTokens: 200000,
      warningThreshold: 0.75,
      autoTruncate: true,
      truncationStrategy: "summary",
      preserveSystemPrompt: true,
    },
  },
  estimatedSavings: "Quality over cost",
  bestFor: ["Feature development", "Refactoring", "Test generation", "Architecture"],
};

export const PRESET_GROWTH: BrainPreset = {
  id: "growth",
  name: "Growth Engine",
  description: "Optimized for content generation. Creative, consistent, cost-effective.",
  icon: "Megaphone",
  tags: ["content", "marketing", "social"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "medium",
    temperature: 0.8, // Higher for creativity
    maxTokens: 4096,
    batchProcessing: {
      enabled: true,
      maxBatchSize: 10,
      maxWaitMs: 10000,
    },
    budget: {
      enabled: true,
      dailyLimitUSD: 5,
      monthlyLimitUSD: 50,
      alertThreshold: 0.9,
      pauseOnLimit: true,
    },
  },
  estimatedSavings: "~60% with batching",
  bestFor: ["Blog posts", "Tweets", "SEO content", "Discord messages"],
};

export const PRESET_AUTONOMY: BrainPreset = {
  id: "autonomy",
  name: "Autonomy Engine",
  description: "Optimized for autonomous operations. Careful reasoning, bounded actions.",
  icon: "Shield",
  tags: ["autonomy", "safety", "oversight"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    effort: "medium",
    temperature: 0.3, // Low for predictability
    maxTokens: 4096,
    extendedThinking: {
      enabled: true,
      budgetTokens: 8000,
      preserveHistory: true,
    },
    memory: {
      enabled: true,
      provider: "local",
      maxEntries: 1000,
      ttlSeconds: 86400,
      autoSummarize: true,
    },
  },
  estimatedSavings: "~45% vs unoptimized",
  bestFor: ["Risk classification", "Boundary checking", "Decision routing", "Audit logging"],
};

// =============================================================================
// SPECIAL PRESETS
// =============================================================================

export const PRESET_DEEP_RESEARCH: BrainPreset = {
  id: "deep-research",
  name: "Deep Research",
  description: "Maximum context for research. 1M token context window.",
  icon: "BookOpen",
  tags: ["research", "analysis", "long-context"],
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514", // 1M context available
    effort: "high",
    temperature: 0.5,
    maxTokens: 16384,
    context: {
      maxContextTokens: 1000000, // 1M tokens!
      warningThreshold: 0.9,
      autoTruncate: false,
      truncationStrategy: "summary",
      preserveSystemPrompt: true,
    },
    memory: {
      enabled: true,
      provider: "local",
      maxEntries: 5000,
      ttlSeconds: 604800, // 1 week
      autoSummarize: true,
    },
  },
  estimatedSavings: "Context-heavy, quality-focused",
  bestFor: ["Codebase analysis", "Documentation review", "Audit reports", "Trend research"],
};

export const PRESET_ULTRA_SAVER: BrainPreset = {
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
      maxWaitMs: 10000,
    },
    budget: {
      enabled: true,
      dailyLimitUSD: 1,
      monthlyLimitUSD: 10,
      alertThreshold: 0.7,
      pauseOnLimit: true,
    },
  },
  estimatedSavings: "~95% vs Opus high",
  bestFor: ["Data extraction", "Simple formatting", "Bulk processing", "Validation"],
};

// =============================================================================
// ALL PRESETS
// =============================================================================

export const ALL_PRESETS: BrainPreset[] = [
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
  PRESET_ULTRA_SAVER,
];

export const PRESETS_BY_ID: Record<string, BrainPreset> = Object.fromEntries(
  ALL_PRESETS.map((p) => [p.id, p])
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getPresetById(id: string): BrainPreset | undefined {
  return PRESETS_BY_ID[id];
}

export function getPresetsByTag(tag: string): BrainPreset[] {
  return ALL_PRESETS.filter((p) => p.tags.includes(tag));
}

export function getRecommendedPreset(useCase: string): BrainPreset {
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

export function createCustomPreset(
  base: BrainPreset,
  overrides: Partial<BrainConfig>,
  meta: { name: string; description: string }
): BrainPreset {
  return {
    ...base,
    id: `custom-${Date.now()}`,
    name: meta.name,
    description: meta.description,
    tags: [...base.tags, "custom"],
    config: { ...base.config, ...overrides },
  };
}
