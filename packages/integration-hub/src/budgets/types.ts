/**
 * Cost Budgets & Alerts - Type Definitions
 */

import { z } from "zod";

// Budget period types
export const BudgetPeriodSchema = z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]);
export type BudgetPeriod = z.infer<typeof BudgetPeriodSchema>;

// Alert severity levels
export const AlertSeveritySchema = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

// Alert types
export const AlertTypeSchema = z.enum([
  "threshold_warning",    // Approaching budget limit
  "threshold_exceeded",   // Budget exceeded
  "anomaly_detected",     // Unusual spending pattern
  "pipeline_expensive",   // Single pipeline cost spike
  "rate_limit_warning",   // Approaching API rate limits
]);
export type AlertType = z.infer<typeof AlertTypeSchema>;

// Budget status
export const BudgetStatusSchema = z.enum(["active", "paused", "exceeded", "archived"]);
export type BudgetStatus = z.infer<typeof BudgetStatusSchema>;

// Threshold configuration
export const ThresholdConfigSchema = z.object({
  percentage: z.number().min(1).max(100),
  severity: AlertSeveritySchema,
  action: z.enum(["notify", "warn", "pause_pipelines"]).default("notify"),
});
export type ThresholdConfig = z.infer<typeof ThresholdConfigSchema>;

// Budget definition
export const BudgetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),

  // Budget limits
  limitAmount: z.number().positive(),
  currency: z.string().default("USD"),
  period: BudgetPeriodSchema,

  // Current spending
  currentSpend: z.number().default(0),
  periodStart: z.date(),
  periodEnd: z.date(),

  // Thresholds (multiple warning levels)
  thresholds: z.array(ThresholdConfigSchema).default([
    { percentage: 50, severity: "info", action: "notify" },
    { percentage: 80, severity: "warning", action: "warn" },
    { percentage: 100, severity: "critical", action: "pause_pipelines" },
  ]),

  // Scope - what this budget applies to
  scope: z.object({
    type: z.enum(["global", "pipeline", "user", "team", "tag"]),
    targetId: z.string().optional(), // Pipeline ID, user ID, etc.
    tags: z.array(z.string()).optional(),
  }),

  // Status & metadata
  status: BudgetStatusSchema.default("active"),
  autoPausePipelines: z.boolean().default(true),
  notifyOnExceed: z.boolean().default(true),
  rolloverUnused: z.boolean().default(false), // Carry unused budget to next period

  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
});
export type Budget = z.infer<typeof BudgetSchema>;

// Budget creation input
export const CreateBudgetSchema = BudgetSchema.omit({
  id: true,
  currentSpend: true,
  periodStart: true,
  periodEnd: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;

// Alert definition
export const AlertSchema = z.object({
  id: z.string().uuid(),
  budgetId: z.string().uuid(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,

  // Alert details
  title: z.string(),
  message: z.string(),

  // Context
  currentSpend: z.number(),
  budgetLimit: z.number(),
  percentageUsed: z.number(),

  // Related entities
  pipelineId: z.string().optional(),
  executionId: z.string().optional(),

  // Status
  acknowledged: z.boolean().default(false),
  acknowledgedAt: z.date().optional(),
  acknowledgedBy: z.string().optional(),

  // Actions taken
  actionsTaken: z.array(z.object({
    action: z.string(),
    timestamp: z.date(),
    result: z.string().optional(),
  })).default([]),

  createdAt: z.date(),
});
export type Alert = z.infer<typeof AlertSchema>;

// Spending record
export const SpendingRecordSchema = z.object({
  id: z.string().uuid(),
  budgetId: z.string().uuid(),

  // Cost details
  amount: z.number(),
  currency: z.string().default("USD"),

  // Source
  source: z.enum(["pipeline", "api_call", "storage", "compute", "other"]),
  pipelineId: z.string().optional(),
  executionId: z.string().optional(),
  stepId: z.string().optional(),

  // Breakdown
  breakdown: z.object({
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional(),
    model: z.string().optional(),
    duration: z.number().optional(), // ms
  }).optional(),

  // Metadata
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.date(),
});
export type SpendingRecord = z.infer<typeof SpendingRecordSchema>;

// Budget summary
export const BudgetSummarySchema = z.object({
  budget: BudgetSchema,

  // Usage stats
  percentageUsed: z.number(),
  remainingAmount: z.number(),
  averageDailySpend: z.number(),
  projectedEndOfPeriod: z.number(),
  daysRemaining: z.number(),

  // Trends
  trend: z.enum(["increasing", "stable", "decreasing"]),
  comparedToLastPeriod: z.number(), // percentage change

  // Top consumers
  topPipelines: z.array(z.object({
    pipelineId: z.string(),
    name: z.string(),
    totalSpend: z.number(),
    percentage: z.number(),
  })).max(5),

  // Recent alerts
  recentAlerts: z.array(AlertSchema).max(5),

  // Recommendations
  recommendations: z.array(z.object({
    type: z.enum(["reduce_usage", "optimize_model", "increase_budget", "review_pipeline"]),
    message: z.string(),
    potentialSavings: z.number().optional(),
  })),
});
export type BudgetSummary = z.infer<typeof BudgetSummarySchema>;

// Budget events
export interface BudgetEvents {
  "budget:created": (budget: Budget) => void;
  "budget:updated": (budget: Budget) => void;
  "budget:deleted": (budgetId: string) => void;
  "budget:exceeded": (budget: Budget, alert: Alert) => void;
  "budget:threshold": (budget: Budget, alert: Alert) => void;
  "spending:recorded": (record: SpendingRecord) => void;
  "alert:created": (alert: Alert) => void;
  "alert:acknowledged": (alert: Alert) => void;
  "pipelines:paused": (budgetId: string, pipelineIds: string[]) => void;
}

// Default thresholds
export const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  { percentage: 50, severity: "info", action: "notify" },
  { percentage: 80, severity: "warning", action: "warn" },
  { percentage: 100, severity: "critical", action: "pause_pipelines" },
];

// Period helpers
export const PERIOD_DAYS: Record<BudgetPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};
