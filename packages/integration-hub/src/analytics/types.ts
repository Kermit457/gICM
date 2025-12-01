/**
 * Token Analytics Types
 * Phase 16B: AI Operations - Deep Token Usage Analytics
 */

import { z } from "zod";

// =============================================================================
// Token Classification
// =============================================================================

export const TokenCategorySchema = z.enum([
  "system_prompt",
  "user_input",
  "assistant_output",
  "function_call",
  "function_result",
  "context",
  "examples",
  "instructions",
  "cached",
  "padding",
  "special",
  "unknown",
]);
export type TokenCategory = z.infer<typeof TokenCategorySchema>;

export const TokenBreakdownSchema = z.object({
  total: z.number(),
  byCategory: z.record(TokenCategorySchema, z.number()),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cachedTokens: z.number(),
  wastedTokens: z.number().describe("Tokens that didn't contribute to output"),
});
export type TokenBreakdown = z.infer<typeof TokenBreakdownSchema>;

// =============================================================================
// Efficiency Metrics
// =============================================================================

export const EfficiencyMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  benchmark: z.number().optional(),
  rating: z.enum(["excellent", "good", "fair", "poor", "critical"]),
  description: z.string().optional(),
});
export type EfficiencyMetric = z.infer<typeof EfficiencyMetricSchema>;

export const TokenEfficiencySchema = z.object({
  // Input/Output Ratio
  inputOutputRatio: z.number().describe("Input tokens / Output tokens"),

  // Useful token ratio
  usefulTokenRatio: z.number().describe("Useful tokens / Total tokens"),

  // Cache hit rate
  cacheHitRate: z.number().describe("Cached tokens / Total input"),

  // Context utilization
  contextUtilization: z.number().describe("Used context / Max context window"),

  // Token cost efficiency
  costPerUsefulToken: z.number().describe("Cost per useful output token"),

  // Compression ratio (if applicable)
  compressionRatio: z.number().optional().describe("Original length / Token count"),

  // Throughput
  tokensPerSecond: z.number().optional(),

  // Latency per token
  latencyPerToken: z.number().optional().describe("ms per output token"),

  // Overall efficiency score (0-100)
  overallScore: z.number(),
});
export type TokenEfficiency = z.infer<typeof TokenEfficiencySchema>;

// =============================================================================
// Usage Patterns
// =============================================================================

export const UsagePatternTypeSchema = z.enum([
  "consistent",
  "bursty",
  "growing",
  "declining",
  "cyclical",
  "erratic",
]);
export type UsagePatternType = z.infer<typeof UsagePatternTypeSchema>;

export const UsagePatternSchema = z.object({
  type: UsagePatternTypeSchema,
  confidence: z.number().min(0).max(1),
  description: z.string(),

  // Statistics
  mean: z.number(),
  median: z.number(),
  stdDev: z.number(),
  min: z.number(),
  max: z.number(),

  // Trend
  trend: z.enum(["increasing", "stable", "decreasing"]),
  trendStrength: z.number().min(0).max(1),

  // Seasonality
  hasSeasonality: z.boolean(),
  seasonalPeriod: z.string().optional().describe("e.g., 'daily', 'weekly'"),
  peakHours: z.array(z.number()).optional(),
  peakDays: z.array(z.number()).optional(),
});
export type UsagePattern = z.infer<typeof UsagePatternSchema>;

// =============================================================================
// Anomaly Detection
// =============================================================================

export const TokenAnomalyTypeSchema = z.enum([
  "spike",
  "drop",
  "unusual_ratio",
  "excessive_input",
  "minimal_output",
  "high_waste",
  "context_overflow",
  "repetition",
  "encoding_issue",
]);
export type TokenAnomalyType = z.infer<typeof TokenAnomalyTypeSchema>;

export const TokenAnomalySchema = z.object({
  id: z.string(),
  type: TokenAnomalyTypeSchema,
  severity: z.enum(["low", "medium", "high", "critical"]),
  timestamp: z.number(),

  // Detection
  expected: z.number(),
  actual: z.number(),
  deviation: z.number().describe("Standard deviations from mean"),

  // Context
  model: z.string().optional(),
  requestId: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),

  // Details
  description: z.string(),
  possibleCauses: z.array(z.string()),
  recommendations: z.array(z.string()),

  // Status
  acknowledged: z.boolean().default(false),
  resolvedAt: z.number().optional(),
});
export type TokenAnomaly = z.infer<typeof TokenAnomalySchema>;

// =============================================================================
// Model Comparison
// =============================================================================

export const ModelComparisonSchema = z.object({
  model: z.string(),
  provider: z.string(),

  // Volume
  totalRequests: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),

  // Efficiency
  avgInputTokens: z.number(),
  avgOutputTokens: z.number(),
  inputOutputRatio: z.number(),
  cacheHitRate: z.number(),

  // Performance
  avgLatencyMs: z.number(),
  tokensPerSecond: z.number(),
  successRate: z.number(),

  // Cost efficiency
  costPerRequest: z.number(),
  costPer1kTokens: z.number(),

  // Quality indicators
  avgResponseLength: z.number(),
  consistencyScore: z.number().describe("How consistent are response lengths"),
});
export type ModelComparison = z.infer<typeof ModelComparisonSchema>;

// =============================================================================
// Project Analytics
// =============================================================================

export const ProjectAnalyticsSchema = z.object({
  projectId: z.string(),
  periodStart: z.number(),
  periodEnd: z.number(),

  // Volume
  totalRequests: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),

  // Breakdown by model
  byModel: z.record(z.object({
    requests: z.number(),
    tokens: z.number(),
    cost: z.number(),
    avgLatency: z.number(),
  })),

  // Token categories
  tokenBreakdown: TokenBreakdownSchema,

  // Efficiency
  efficiency: TokenEfficiencySchema,

  // Pattern
  usagePattern: UsagePatternSchema,

  // Top endpoints/features
  topEndpoints: z.array(z.object({
    endpoint: z.string(),
    requests: z.number(),
    tokens: z.number(),
    cost: z.number(),
  })),

  // Anomalies
  anomalyCount: z.number(),
  recentAnomalies: z.array(TokenAnomalySchema),

  // Recommendations
  recommendations: z.array(z.object({
    type: z.string(),
    priority: z.enum(["low", "medium", "high"]),
    estimatedSavings: z.number(),
    description: z.string(),
  })),
});
export type ProjectAnalytics = z.infer<typeof ProjectAnalyticsSchema>;

// =============================================================================
// Time Series Data
// =============================================================================

export const TimeGranularitySchema = z.enum([
  "minute",
  "hour",
  "day",
  "week",
  "month",
]);
export type TimeGranularity = z.infer<typeof TimeGranularitySchema>;

export const TokenTimeSeriesPointSchema = z.object({
  timestamp: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cachedTokens: z.number(),
  totalTokens: z.number(),
  requests: z.number(),
  cost: z.number(),
  avgLatency: z.number().optional(),
});
export type TokenTimeSeriesPoint = z.infer<typeof TokenTimeSeriesPointSchema>;

export const TokenTimeSeriesSchema = z.object({
  granularity: TimeGranularitySchema,
  startTime: z.number(),
  endTime: z.number(),
  points: z.array(TokenTimeSeriesPointSchema),
});
export type TokenTimeSeries = z.infer<typeof TokenTimeSeriesSchema>;

// =============================================================================
// Forecasting
// =============================================================================

export const ForecastMethodSchema = z.enum([
  "linear",
  "exponential",
  "arima",
  "prophet",
  "lstm",
  "ensemble",
]);
export type ForecastMethod = z.infer<typeof ForecastMethodSchema>;

export const TokenForecastSchema = z.object({
  method: ForecastMethodSchema,
  periodDays: z.number(),
  generatedAt: z.number(),

  // Projections
  projectedTokens: z.number(),
  projectedCost: z.number(),
  projectedRequests: z.number(),

  // Confidence
  confidence: z.number().min(0).max(1),
  lowerBound: z.object({
    tokens: z.number(),
    cost: z.number(),
  }),
  upperBound: z.object({
    tokens: z.number(),
    cost: z.number(),
  }),

  // Daily breakdown
  dailyProjections: z.array(z.object({
    date: z.string(),
    tokens: z.number(),
    cost: z.number(),
  })),

  // Assumptions
  assumptions: z.array(z.string()),
  factors: z.array(z.object({
    name: z.string(),
    impact: z.enum(["positive", "negative", "neutral"]),
    weight: z.number(),
  })),
});
export type TokenForecast = z.infer<typeof TokenForecastSchema>;

// =============================================================================
// Optimization Recommendations
// =============================================================================

export const OptimizationImpactSchema = z.enum([
  "cost_reduction",
  "latency_improvement",
  "quality_improvement",
  "efficiency_improvement",
  "reliability_improvement",
]);
export type OptimizationImpact = z.infer<typeof OptimizationImpactSchema>;

export const TokenOptimizationSchema = z.object({
  id: z.string(),
  type: z.enum([
    "prompt_compression",
    "caching_strategy",
    "model_selection",
    "batching",
    "context_pruning",
    "response_streaming",
    "retry_optimization",
    "request_deduplication",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  timestamp: z.number(),

  // Impact
  impacts: z.array(OptimizationImpactSchema),
  estimatedSavings: z.object({
    tokens: z.number(),
    cost: z.number(),
    latencyMs: z.number(),
  }),

  // Details
  title: z.string(),
  description: z.string(),
  currentState: z.string(),
  recommendedAction: z.string(),
  implementation: z.string().optional().describe("How to implement"),

  // Effort
  effort: z.enum(["trivial", "easy", "moderate", "complex"]),
  riskLevel: z.enum(["none", "low", "medium", "high"]),

  // Status
  status: z.enum(["suggested", "accepted", "implemented", "rejected"]),
  implementedAt: z.number().optional(),
  actualSavings: z.object({
    tokens: z.number(),
    cost: z.number(),
  }).optional(),
});
export type TokenOptimization = z.infer<typeof TokenOptimizationSchema>;

// =============================================================================
// Dashboard Summary
// =============================================================================

export const TokenAnalyticsSummarySchema = z.object({
  period: z.object({
    start: z.number(),
    end: z.number(),
    granularity: TimeGranularitySchema,
  }),

  // Overview
  totalTokens: z.number(),
  totalCost: z.number(),
  totalRequests: z.number(),
  uniqueModels: z.number(),
  uniqueProjects: z.number(),

  // Changes from previous period
  tokenChange: z.number(),
  costChange: z.number(),
  requestChange: z.number(),

  // Efficiency
  overallEfficiency: TokenEfficiencySchema,
  efficiencyTrend: z.enum(["improving", "stable", "declining"]),

  // Top consumers
  topModels: z.array(ModelComparisonSchema),
  topProjects: z.array(z.object({
    projectId: z.string(),
    tokens: z.number(),
    cost: z.number(),
    efficiency: z.number(),
  })),

  // Anomalies
  activeAnomalies: z.number(),
  anomaliesByType: z.record(TokenAnomalyTypeSchema, z.number()),

  // Optimizations
  pendingOptimizations: z.number(),
  potentialSavings: z.number(),

  // Forecast
  forecast: TokenForecastSchema.optional(),
});
export type TokenAnalyticsSummary = z.infer<typeof TokenAnalyticsSummarySchema>;

// =============================================================================
// Configuration
// =============================================================================

export const TokenAnalyticsConfigSchema = z.object({
  // General
  enabled: z.boolean().default(true),
  retentionDays: z.number().default(90),

  // Anomaly detection
  anomalyDetectionEnabled: z.boolean().default(true),
  anomalyThresholdStdDev: z.number().default(2.5),
  anomalyMinSamples: z.number().default(10),

  // Forecasting
  forecastingEnabled: z.boolean().default(true),
  defaultForecastDays: z.number().default(30),
  forecastMethod: ForecastMethodSchema.default("linear"),

  // Optimization scanning
  optimizationScanEnabled: z.boolean().default(true),
  optimizationScanIntervalHours: z.number().default(24),

  // Pattern analysis
  patternAnalysisEnabled: z.boolean().default(true),
  patternMinDataPoints: z.number().default(50),

  // Alerts
  alertOnAnomalies: z.boolean().default(true),
  alertOnEfficiencyDrop: z.boolean().default(true),
  efficiencyDropThreshold: z.number().default(10).describe("Percentage drop"),

  // Time series
  defaultGranularity: TimeGranularitySchema.default("hour"),
  maxTimeSeriesPoints: z.number().default(1000),
});
export type TokenAnalyticsConfig = z.infer<typeof TokenAnalyticsConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type TokenAnalyticsEvents = {
  // Analysis
  analysisCompleted: (projectId: string, analytics: ProjectAnalytics) => void;
  summaryGenerated: (summary: TokenAnalyticsSummary) => void;

  // Anomalies
  anomalyDetected: (anomaly: TokenAnomaly) => void;
  anomalyResolved: (anomalyId: string) => void;

  // Optimizations
  optimizationFound: (optimization: TokenOptimization) => void;
  optimizationImplemented: (optimization: TokenOptimization) => void;

  // Forecasts
  forecastGenerated: (forecast: TokenForecast) => void;
  forecastExceeded: (forecast: TokenForecast, actual: number) => void;

  // Efficiency
  efficiencyDropDetected: (current: number, previous: number, threshold: number) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface TokenAnalyticsStorage {
  // Time series
  saveTimeSeriesPoint(point: TokenTimeSeriesPoint & { projectId?: string; model?: string }): Promise<void>;
  getTimeSeries(options: {
    granularity: TimeGranularity;
    startTime: number;
    endTime: number;
    projectId?: string;
    model?: string;
  }): Promise<TokenTimeSeries>;

  // Anomalies
  saveAnomaly(anomaly: TokenAnomaly): Promise<void>;
  getAnomalies(options?: {
    type?: TokenAnomalyType;
    severity?: string;
    acknowledged?: boolean;
    startTime?: number;
    endTime?: number;
  }): Promise<TokenAnomaly[]>;
  acknowledgeAnomaly(anomalyId: string): Promise<void>;
  resolveAnomaly(anomalyId: string): Promise<void>;

  // Optimizations
  saveOptimization(optimization: TokenOptimization): Promise<void>;
  getOptimizations(status?: string): Promise<TokenOptimization[]>;
  updateOptimizationStatus(id: string, status: string, actualSavings?: { tokens: number; cost: number }): Promise<void>;

  // Forecasts
  saveForecast(forecast: TokenForecast & { projectId?: string }): Promise<void>;
  getForecast(projectId?: string): Promise<TokenForecast | null>;

  // Project analytics
  saveProjectAnalytics(analytics: ProjectAnalytics): Promise<void>;
  getProjectAnalytics(projectId: string, periodStart?: number): Promise<ProjectAnalytics | null>;
}

// =============================================================================
// Efficiency Benchmarks
// =============================================================================

export const EFFICIENCY_BENCHMARKS = {
  inputOutputRatio: {
    excellent: 1.5,
    good: 3,
    fair: 5,
    poor: 10,
  },
  cacheHitRate: {
    excellent: 0.5,
    good: 0.3,
    fair: 0.15,
    poor: 0.05,
  },
  contextUtilization: {
    excellent: 0.7,
    good: 0.5,
    fair: 0.3,
    poor: 0.1,
  },
  costPerUsefulToken: {
    excellent: 0.00001,
    good: 0.00005,
    fair: 0.0001,
    poor: 0.0005,
  },
};

// =============================================================================
// Helpers
// =============================================================================

export function calculateEfficiencyRating(
  value: number,
  benchmarks: { excellent: number; good: number; fair: number; poor: number },
  lowerIsBetter: boolean = true
): "excellent" | "good" | "fair" | "poor" | "critical" {
  if (lowerIsBetter) {
    if (value <= benchmarks.excellent) return "excellent";
    if (value <= benchmarks.good) return "good";
    if (value <= benchmarks.fair) return "fair";
    if (value <= benchmarks.poor) return "poor";
    return "critical";
  } else {
    if (value >= benchmarks.excellent) return "excellent";
    if (value >= benchmarks.good) return "good";
    if (value >= benchmarks.fair) return "fair";
    if (value >= benchmarks.poor) return "poor";
    return "critical";
  }
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000_000) {
    return `${(tokens / 1_000_000_000).toFixed(2)}B`;
  }
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function calculateTokenEfficiency(data: {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  totalCost: number;
  contextWindow: number;
  usedContext: number;
  latencyMs?: number;
}): TokenEfficiency {
  const totalTokens = data.inputTokens + data.outputTokens;
  const usefulTokens = data.outputTokens; // Simplified: output is "useful"

  const inputOutputRatio = data.inputTokens / (data.outputTokens || 1);
  const usefulTokenRatio = usefulTokens / (totalTokens || 1);
  const cacheHitRate = data.cachedTokens / (data.inputTokens || 1);
  const contextUtilization = data.usedContext / (data.contextWindow || 1);
  const costPerUsefulToken = data.totalCost / (usefulTokens || 1);

  // Calculate overall score (0-100)
  const scores = [
    calculateEfficiencyRating(inputOutputRatio, EFFICIENCY_BENCHMARKS.inputOutputRatio),
    calculateEfficiencyRating(cacheHitRate, EFFICIENCY_BENCHMARKS.cacheHitRate, false),
    calculateEfficiencyRating(contextUtilization, EFFICIENCY_BENCHMARKS.contextUtilization, false),
    calculateEfficiencyRating(costPerUsefulToken, EFFICIENCY_BENCHMARKS.costPerUsefulToken),
  ];

  const scoreMap = { excellent: 100, good: 75, fair: 50, poor: 25, critical: 0 };
  const overallScore = scores.reduce((sum, s) => sum + scoreMap[s], 0) / scores.length;

  return {
    inputOutputRatio,
    usefulTokenRatio,
    cacheHitRate,
    contextUtilization,
    costPerUsefulToken,
    tokensPerSecond: data.latencyMs ? (data.outputTokens / data.latencyMs) * 1000 : undefined,
    latencyPerToken: data.latencyMs ? data.latencyMs / (data.outputTokens || 1) : undefined,
    overallScore,
  };
}
