/**
 * LLM Cost Tracker Types
 * Phase 16A: AI Operations - Cost Tracking & Budgeting
 */

import { z } from "zod";

// =============================================================================
// Model & Provider Definitions
// =============================================================================

export const LLMProviderSchema = z.enum([
  "openai",
  "anthropic",
  "google",
  "cohere",
  "mistral",
  "azure",
  "aws_bedrock",
  "groq",
  "together",
  "perplexity",
  "replicate",
  "huggingface",
  "local",
  "custom",
]);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

export const ModelTierSchema = z.enum([
  "free",
  "standard",
  "premium",
  "enterprise",
]);
export type ModelTier = z.infer<typeof ModelTierSchema>;

export const ModelCapabilitySchema = z.enum([
  "text",
  "chat",
  "code",
  "vision",
  "audio",
  "embedding",
  "image_generation",
  "function_calling",
  "streaming",
]);
export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

export const ModelDefinitionSchema = z.object({
  id: z.string(),
  provider: LLMProviderSchema,
  name: z.string(),
  displayName: z.string().optional(),
  tier: ModelTierSchema.default("standard"),
  capabilities: z.array(ModelCapabilitySchema).default(["text"]),

  // Token limits
  contextWindow: z.number().describe("Max context length in tokens"),
  maxOutputTokens: z.number().optional(),

  // Pricing (per 1M tokens)
  inputPricePerMillion: z.number().describe("USD per 1M input tokens"),
  outputPricePerMillion: z.number().describe("USD per 1M output tokens"),
  cachedInputPricePerMillion: z.number().optional().describe("USD per 1M cached input tokens"),

  // Image pricing (for vision models)
  imagePricePerUnit: z.number().optional(),

  // Additional costs
  requestBaseCost: z.number().default(0).describe("Fixed cost per request"),

  // Metadata
  deprecated: z.boolean().default(false),
  deprecationDate: z.string().optional(),
  releaseDate: z.string().optional(),
  description: z.string().optional(),
});
export type ModelDefinition = z.infer<typeof ModelDefinitionSchema>;

// =============================================================================
// Usage Tracking
// =============================================================================

export const TokenUsageSchema = z.object({
  inputTokens: z.number().default(0),
  outputTokens: z.number().default(0),
  cachedTokens: z.number().default(0),
  totalTokens: z.number().default(0),
});
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const LLMRequestSchema = z.object({
  id: z.string(),
  timestamp: z.number(),

  // Model info
  provider: LLMProviderSchema,
  model: z.string(),

  // Request details
  requestType: z.enum(["completion", "chat", "embedding", "image", "audio", "function"]).default("chat"),
  streaming: z.boolean().default(false),

  // Token usage
  usage: TokenUsageSchema,

  // Cost calculation
  inputCost: z.number(),
  outputCost: z.number(),
  cachedCost: z.number().default(0),
  additionalCosts: z.number().default(0),
  totalCost: z.number(),

  // Latency
  latencyMs: z.number().optional(),
  timeToFirstTokenMs: z.number().optional(),

  // Context
  projectId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),

  // Status
  success: z.boolean().default(true),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});
export type LLMRequest = z.infer<typeof LLMRequestSchema>;

// =============================================================================
// Cost Aggregation
// =============================================================================

export const AggregationPeriodSchema = z.enum([
  "hour",
  "day",
  "week",
  "month",
  "quarter",
  "year",
]);
export type AggregationPeriod = z.infer<typeof AggregationPeriodSchema>;

export const CostAggregationSchema = z.object({
  period: AggregationPeriodSchema,
  startTime: z.number(),
  endTime: z.number(),

  // Totals
  totalRequests: z.number(),
  totalTokens: z.number(),
  totalInputTokens: z.number(),
  totalOutputTokens: z.number(),
  totalCachedTokens: z.number(),
  totalCost: z.number(),

  // By provider
  byProvider: z.record(z.object({
    requests: z.number(),
    tokens: z.number(),
    cost: z.number(),
  })),

  // By model
  byModel: z.record(z.object({
    requests: z.number(),
    tokens: z.number(),
    cost: z.number(),
  })),

  // By project
  byProject: z.record(z.object({
    requests: z.number(),
    tokens: z.number(),
    cost: z.number(),
  })),

  // By user
  byUser: z.record(z.object({
    requests: z.number(),
    tokens: z.number(),
    cost: z.number(),
  })),

  // Averages
  avgCostPerRequest: z.number(),
  avgTokensPerRequest: z.number(),
  avgLatencyMs: z.number().optional(),

  // Success rate
  successRate: z.number(),
  errorCount: z.number(),
});
export type CostAggregation = z.infer<typeof CostAggregationSchema>;

// =============================================================================
// Budgets & Alerts
// =============================================================================

export const BudgetPeriodSchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
]);
export type BudgetPeriod = z.infer<typeof BudgetPeriodSchema>;

export const BudgetScopeSchema = z.enum([
  "global",
  "provider",
  "model",
  "project",
  "user",
  "tag",
]);
export type BudgetScope = z.infer<typeof BudgetScopeSchema>;

export const BudgetDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Scope
  scope: BudgetScopeSchema,
  scopeId: z.string().optional().describe("Provider/model/project/user ID when scope is not global"),

  // Period
  period: BudgetPeriodSchema,
  customPeriodDays: z.number().optional(),
  startDate: z.number().optional(),

  // Limits
  budgetAmount: z.number().describe("Budget limit in USD"),
  softLimitPercent: z.number().default(80).describe("Percentage for soft warning"),
  hardLimitPercent: z.number().default(100).describe("Percentage for hard limit"),

  // Actions
  alertOnSoftLimit: z.boolean().default(true),
  alertOnHardLimit: z.boolean().default(true),
  blockOnHardLimit: z.boolean().default(false).describe("Block requests when hard limit reached"),

  // Rollover
  rolloverEnabled: z.boolean().default(false),
  maxRolloverPercent: z.number().default(25),

  // Status
  enabled: z.boolean().default(true),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type BudgetDefinition = z.infer<typeof BudgetDefinitionSchema>;

export const BudgetStatusSchema = z.enum([
  "under_budget",
  "soft_limit",
  "hard_limit",
  "exceeded",
]);
export type BudgetStatus = z.infer<typeof BudgetStatusSchema>;

export const BudgetStateSchema = z.object({
  budgetId: z.string(),
  periodStart: z.number(),
  periodEnd: z.number(),

  // Usage
  currentSpend: z.number(),
  remainingBudget: z.number(),
  percentUsed: z.number(),

  // Status
  status: BudgetStatusSchema,
  estimatedEndSpend: z.number().optional().describe("Projected spend by end of period"),

  // Rollover
  rolloverAmount: z.number().default(0),
  effectiveBudget: z.number().describe("Budget + rollover"),

  // History
  lastUpdated: z.number(),
  lastAlertSent: z.number().optional(),
});
export type BudgetState = z.infer<typeof BudgetStateSchema>;

export const CostAlertTypeSchema = z.enum([
  "soft_limit_reached",
  "hard_limit_reached",
  "budget_exceeded",
  "anomaly_detected",
  "spend_spike",
  "daily_summary",
  "weekly_summary",
]);
export type CostAlertType = z.infer<typeof CostAlertTypeSchema>;

export const CostAlertSchema = z.object({
  id: z.string(),
  type: CostAlertTypeSchema,
  severity: z.enum(["info", "warning", "critical"]),
  timestamp: z.number(),

  // Context
  budgetId: z.string().optional(),
  scope: BudgetScopeSchema.optional(),
  scopeId: z.string().optional(),

  // Details
  title: z.string(),
  message: z.string(),
  currentSpend: z.number(),
  threshold: z.number().optional(),
  percentUsed: z.number().optional(),

  // Recommendations
  recommendations: z.array(z.string()).default([]),

  // Status
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.number().optional(),
});
export type CostAlert = z.infer<typeof CostAlertSchema>;

// =============================================================================
// Cost Optimization
// =============================================================================

export const CostOptimizationTypeSchema = z.enum([
  "model_downgrade",
  "caching_opportunity",
  "batch_processing",
  "prompt_optimization",
  "provider_switch",
  "unused_capacity",
]);
export type CostOptimizationType = z.infer<typeof CostOptimizationTypeSchema>;

export const CostOptimizationSchema = z.object({
  id: z.string(),
  type: CostOptimizationTypeSchema,
  priority: z.enum(["low", "medium", "high"]),
  timestamp: z.number(),

  // Impact
  estimatedSavings: z.number().describe("USD savings per period"),
  savingsPercent: z.number(),
  effort: z.enum(["minimal", "moderate", "significant"]),

  // Details
  title: z.string(),
  description: z.string(),
  currentState: z.string(),
  recommendedAction: z.string(),

  // Context
  affectedModels: z.array(z.string()).default([]),
  affectedProjects: z.array(z.string()).default([]),

  // Implementation
  implemented: z.boolean().default(false),
  implementedAt: z.number().optional(),
  actualSavings: z.number().optional(),
});
export type CostOptimization = z.infer<typeof CostOptimizationSchema>;

// =============================================================================
// Reports
// =============================================================================

export const CostReportTypeSchema = z.enum([
  "summary",
  "detailed",
  "comparison",
  "forecast",
  "optimization",
]);
export type CostReportType = z.infer<typeof CostReportTypeSchema>;

export const CostReportSchema = z.object({
  id: z.string(),
  type: CostReportTypeSchema,
  generatedAt: z.number(),
  period: AggregationPeriodSchema,
  startTime: z.number(),
  endTime: z.number(),

  // Summary
  totalCost: z.number(),
  totalRequests: z.number(),
  totalTokens: z.number(),

  // Breakdown
  aggregation: CostAggregationSchema,

  // Comparison (if applicable)
  previousPeriodCost: z.number().optional(),
  costChange: z.number().optional(),
  costChangePercent: z.number().optional(),

  // Forecast (if applicable)
  forecastedCost: z.number().optional(),
  forecastConfidence: z.number().optional(),

  // Top consumers
  topModels: z.array(z.object({
    model: z.string(),
    cost: z.number(),
    percent: z.number(),
  })).default([]),
  topProjects: z.array(z.object({
    projectId: z.string(),
    cost: z.number(),
    percent: z.number(),
  })).default([]),
  topUsers: z.array(z.object({
    userId: z.string(),
    cost: z.number(),
    percent: z.number(),
  })).default([]),

  // Optimizations
  optimizations: z.array(CostOptimizationSchema).default([]),
  potentialSavings: z.number().default(0),

  // Alerts in period
  alertCount: z.number().default(0),
  budgetExceededCount: z.number().default(0),
});
export type CostReport = z.infer<typeof CostReportSchema>;

// =============================================================================
// Configuration
// =============================================================================

export const LLMCostTrackerConfigSchema = z.object({
  // Tracking
  enabled: z.boolean().default(true),
  trackingLevel: z.enum(["basic", "detailed", "full"]).default("detailed"),

  // Storage
  retentionDays: z.number().default(90),
  aggregationEnabled: z.boolean().default(true),

  // Budgets
  budgetsEnabled: z.boolean().default(true),
  defaultBudgetPeriod: BudgetPeriodSchema.default("monthly"),

  // Alerts
  alertsEnabled: z.boolean().default(true),
  alertCooldownMinutes: z.number().default(60),
  dailySummaryEnabled: z.boolean().default(true),
  dailySummaryHour: z.number().default(9).describe("Hour to send daily summary (0-23)"),

  // Optimization
  optimizationScanEnabled: z.boolean().default(true),
  optimizationScanIntervalHours: z.number().default(24),

  // Anomaly detection
  anomalyDetectionEnabled: z.boolean().default(true),
  anomalyThresholdPercent: z.number().default(200).describe("Percent above average to trigger anomaly"),

  // Currency
  currency: z.string().default("USD"),
  exchangeRateUpdateHours: z.number().default(24),

  // Custom model pricing
  customModelPricing: z.record(z.object({
    inputPricePerMillion: z.number(),
    outputPricePerMillion: z.number(),
  })).optional(),
});
export type LLMCostTrackerConfig = z.infer<typeof LLMCostTrackerConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type LLMCostEvents = {
  // Request tracking
  requestTracked: (request: LLMRequest) => void;
  requestFailed: (request: LLMRequest, error: Error) => void;

  // Budget
  budgetCreated: (budget: BudgetDefinition) => void;
  budgetUpdated: (budget: BudgetDefinition) => void;
  budgetDeleted: (budgetId: string) => void;
  softLimitReached: (budget: BudgetDefinition, state: BudgetState) => void;
  hardLimitReached: (budget: BudgetDefinition, state: BudgetState) => void;
  budgetExceeded: (budget: BudgetDefinition, state: BudgetState) => void;
  requestBlocked: (request: Partial<LLMRequest>, budget: BudgetDefinition) => void;

  // Alerts
  alertCreated: (alert: CostAlert) => void;
  alertAcknowledged: (alert: CostAlert) => void;

  // Optimization
  optimizationFound: (optimization: CostOptimization) => void;

  // Reports
  reportGenerated: (report: CostReport) => void;

  // Anomaly
  anomalyDetected: (model: string, currentCost: number, averageCost: number) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface LLMCostStorage {
  // Requests
  saveRequest(request: LLMRequest): Promise<void>;
  getRequests(filters: {
    startTime?: number;
    endTime?: number;
    provider?: LLMProvider;
    model?: string;
    projectId?: string;
    userId?: string;
  }): Promise<LLMRequest[]>;

  // Aggregations
  saveAggregation(aggregation: CostAggregation): Promise<void>;
  getAggregation(period: AggregationPeriod, startTime: number): Promise<CostAggregation | null>;
  getAggregations(period: AggregationPeriod, startTime: number, endTime: number): Promise<CostAggregation[]>;

  // Budgets
  saveBudget(budget: BudgetDefinition): Promise<void>;
  getBudget(id: string): Promise<BudgetDefinition | null>;
  deleteBudget(id: string): Promise<void>;
  listBudgets(): Promise<BudgetDefinition[]>;
  saveBudgetState(state: BudgetState): Promise<void>;
  getBudgetState(budgetId: string): Promise<BudgetState | null>;

  // Alerts
  saveAlert(alert: CostAlert): Promise<void>;
  getAlerts(filters?: { acknowledged?: boolean; type?: CostAlertType }): Promise<CostAlert[]>;
  acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void>;

  // Optimizations
  saveOptimization(optimization: CostOptimization): Promise<void>;
  getOptimizations(implemented?: boolean): Promise<CostOptimization[]>;

  // Reports
  saveReport(report: CostReport): Promise<void>;
  getReport(id: string): Promise<CostReport | null>;
  getReports(type?: CostReportType): Promise<CostReport[]>;
}

// =============================================================================
// Model Pricing Database (Common Models)
// =============================================================================

export const MODEL_PRICING: Record<string, Omit<ModelDefinition, "id">> = {
  // OpenAI
  "gpt-4o": {
    provider: "openai",
    name: "gpt-4o",
    displayName: "GPT-4o",
    tier: "premium",
    capabilities: ["chat", "vision", "function_calling", "streaming"],
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10,
    cachedInputPricePerMillion: 1.25,
    requestBaseCost: 0,
  },
  "gpt-4o-mini": {
    provider: "openai",
    name: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    tier: "standard",
    capabilities: ["chat", "vision", "function_calling", "streaming"],
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    cachedInputPricePerMillion: 0.075,
    requestBaseCost: 0,
  },
  "gpt-4-turbo": {
    provider: "openai",
    name: "gpt-4-turbo",
    displayName: "GPT-4 Turbo",
    tier: "premium",
    capabilities: ["chat", "vision", "function_calling", "streaming"],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPricePerMillion: 10,
    outputPricePerMillion: 30,
    requestBaseCost: 0,
  },
  "o1": {
    provider: "openai",
    name: "o1",
    displayName: "o1",
    tier: "enterprise",
    capabilities: ["chat", "code"],
    contextWindow: 200000,
    maxOutputTokens: 100000,
    inputPricePerMillion: 15,
    outputPricePerMillion: 60,
    cachedInputPricePerMillion: 7.5,
    requestBaseCost: 0,
  },
  "o1-mini": {
    provider: "openai",
    name: "o1-mini",
    displayName: "o1-mini",
    tier: "premium",
    capabilities: ["chat", "code"],
    contextWindow: 128000,
    maxOutputTokens: 65536,
    inputPricePerMillion: 3,
    outputPricePerMillion: 12,
    cachedInputPricePerMillion: 1.5,
    requestBaseCost: 0,
  },

  // Anthropic
  "claude-3-5-sonnet-20241022": {
    provider: "anthropic",
    name: "claude-3-5-sonnet-20241022",
    displayName: "Claude 3.5 Sonnet",
    tier: "premium",
    capabilities: ["chat", "vision", "code", "function_calling", "streaming"],
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    cachedInputPricePerMillion: 0.3,
    requestBaseCost: 0,
  },
  "claude-3-5-haiku-20241022": {
    provider: "anthropic",
    name: "claude-3-5-haiku-20241022",
    displayName: "Claude 3.5 Haiku",
    tier: "standard",
    capabilities: ["chat", "vision", "code", "function_calling", "streaming"],
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4,
    cachedInputPricePerMillion: 0.08,
    requestBaseCost: 0,
  },
  "claude-3-opus-20240229": {
    provider: "anthropic",
    name: "claude-3-opus-20240229",
    displayName: "Claude 3 Opus",
    tier: "enterprise",
    capabilities: ["chat", "vision", "code", "function_calling", "streaming"],
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputPricePerMillion: 15,
    outputPricePerMillion: 75,
    cachedInputPricePerMillion: 1.5,
    requestBaseCost: 0,
  },

  // Google
  "gemini-2.0-flash": {
    provider: "google",
    name: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    tier: "standard",
    capabilities: ["chat", "vision", "code", "audio", "function_calling", "streaming"],
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    inputPricePerMillion: 0.1,
    outputPricePerMillion: 0.4,
    requestBaseCost: 0,
  },
  "gemini-1.5-pro": {
    provider: "google",
    name: "gemini-1.5-pro",
    displayName: "Gemini 1.5 Pro",
    tier: "premium",
    capabilities: ["chat", "vision", "code", "audio", "function_calling", "streaming"],
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5,
    requestBaseCost: 0,
  },

  // Mistral
  "mistral-large-latest": {
    provider: "mistral",
    name: "mistral-large-latest",
    displayName: "Mistral Large",
    tier: "premium",
    capabilities: ["chat", "code", "function_calling", "streaming"],
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputPricePerMillion: 2,
    outputPricePerMillion: 6,
    requestBaseCost: 0,
  },
  "mistral-small-latest": {
    provider: "mistral",
    name: "mistral-small-latest",
    displayName: "Mistral Small",
    tier: "standard",
    capabilities: ["chat", "code", "function_calling", "streaming"],
    contextWindow: 32000,
    maxOutputTokens: 8192,
    inputPricePerMillion: 0.2,
    outputPricePerMillion: 0.6,
    requestBaseCost: 0,
  },

  // Groq
  "llama-3.3-70b-versatile": {
    provider: "groq",
    name: "llama-3.3-70b-versatile",
    displayName: "Llama 3.3 70B",
    tier: "standard",
    capabilities: ["chat", "code", "streaming"],
    contextWindow: 128000,
    maxOutputTokens: 32768,
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
    requestBaseCost: 0,
  },
  "mixtral-8x7b-32768": {
    provider: "groq",
    name: "mixtral-8x7b-32768",
    displayName: "Mixtral 8x7B",
    tier: "standard",
    capabilities: ["chat", "code", "streaming"],
    contextWindow: 32768,
    maxOutputTokens: 8192,
    inputPricePerMillion: 0.24,
    outputPricePerMillion: 0.24,
    requestBaseCost: 0,
  },

  // Embeddings
  "text-embedding-3-small": {
    provider: "openai",
    name: "text-embedding-3-small",
    displayName: "Text Embedding 3 Small",
    tier: "standard",
    capabilities: ["embedding"],
    contextWindow: 8191,
    inputPricePerMillion: 0.02,
    outputPricePerMillion: 0,
    requestBaseCost: 0,
  },
  "text-embedding-3-large": {
    provider: "openai",
    name: "text-embedding-3-large",
    displayName: "Text Embedding 3 Large",
    tier: "standard",
    capabilities: ["embedding"],
    contextWindow: 8191,
    inputPricePerMillion: 0.13,
    outputPricePerMillion: 0,
    requestBaseCost: 0,
  },
};

// =============================================================================
// Helpers
// =============================================================================

export function calculateRequestCost(
  model: string,
  usage: TokenUsage,
  customPricing?: { inputPricePerMillion: number; outputPricePerMillion: number }
): { inputCost: number; outputCost: number; cachedCost: number; totalCost: number } {
  const pricing = customPricing || MODEL_PRICING[model];

  if (!pricing) {
    return { inputCost: 0, outputCost: 0, cachedCost: 0, totalCost: 0 };
  }

  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPricePerMillion;
  const cachedCost = pricing.cachedInputPricePerMillion
    ? (usage.cachedTokens / 1_000_000) * pricing.cachedInputPricePerMillion
    : 0;
  const baseCost = "requestBaseCost" in pricing ? pricing.requestBaseCost || 0 : 0;

  return {
    inputCost,
    outputCost,
    cachedCost,
    totalCost: inputCost + outputCost + cachedCost + baseCost,
  };
}

export function getPeriodBounds(period: BudgetPeriod, referenceDate?: Date): { start: number; end: number } {
  const now = referenceDate || new Date();

  switch (period) {
    case "daily": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "weekly": {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "monthly": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "quarterly": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "yearly": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start: start.getTime(), end: end.getTime() };
    }
    default:
      return { start: now.getTime(), end: now.getTime() + 30 * 24 * 60 * 60 * 1000 };
  }
}

export function formatCost(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}
