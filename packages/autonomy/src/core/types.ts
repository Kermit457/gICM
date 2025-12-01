/**
 * Core Types for Level 2 Autonomy
 *
 * Zod schemas + TypeScript types for actions, decisions, boundaries
 */

import { z } from "zod";

// ============================================================================
// RISK & DECISION TYPES
// ============================================================================

export const RiskLevelSchema = z.enum(["safe", "low", "medium", "high", "critical"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const DecisionOutcomeSchema = z.enum([
  "auto_execute",    // Execute immediately without human review
  "queue_approval",  // Add to approval queue for batch review
  "escalate",        // Notify human immediately
  "reject",          // Reject the action
]);
export type DecisionOutcome = z.infer<typeof DecisionOutcomeSchema>;

export const ActionCategorySchema = z.enum([
  "trading",         // Financial operations (DCA, swaps)
  "content",         // Content creation (tweets, blogs)
  "build",           // Code generation
  "deployment",      // Publishing/deploying
  "configuration",   // System settings
]);
export type ActionCategory = z.infer<typeof ActionCategorySchema>;

export const EngineTypeSchema = z.enum([
  "money",
  "growth",
  "product",
  "orchestrator",
]);
export type EngineType = z.infer<typeof EngineTypeSchema>;

export const UrgencySchema = z.enum(["low", "normal", "high", "critical"]);
export type Urgency = z.infer<typeof UrgencySchema>;

// ============================================================================
// ACTION SCHEMA
// ============================================================================

export const ActionMetadataSchema = z.object({
  estimatedValue: z.number().optional(),
  reversible: z.boolean(),
  urgency: UrgencySchema,
  dependencies: z.array(z.string()).optional(),
  linesChanged: z.number().optional(),
  filesChanged: z.number().optional(),
});
export type ActionMetadata = z.infer<typeof ActionMetadataSchema>;

export const ActionSchema = z.object({
  id: z.string(),
  engine: EngineTypeSchema,
  category: ActionCategorySchema,
  type: z.string(),
  description: z.string(),
  params: z.record(z.unknown()),
  metadata: ActionMetadataSchema,
  timestamp: z.number(),
});
export type Action = z.infer<typeof ActionSchema>;

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export const RiskFactorSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(1),
  value: z.number(),
  threshold: z.number(),
  exceeded: z.boolean(),
  reason: z.string(),
});
export type RiskFactor = z.infer<typeof RiskFactorSchema>;

export const RiskAssessmentSchema = z.object({
  actionId: z.string(),
  level: RiskLevelSchema,
  score: z.number().min(0).max(100),
  factors: z.array(RiskFactorSchema),
  recommendation: DecisionOutcomeSchema,
  constraints: z.array(z.string()),
  timestamp: z.number(),
});
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

// ============================================================================
// DECISION
// ============================================================================

export const DecisionSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  action: ActionSchema,
  assessment: RiskAssessmentSchema,
  outcome: DecisionOutcomeSchema,
  reason: z.string(),
  policyId: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.number().optional(),
  executedAt: z.number().optional(),
  rollbackAvailable: z.boolean(),
  timestamp: z.number(),
});
export type Decision = z.infer<typeof DecisionSchema>;

// ============================================================================
// BOUNDARIES
// ============================================================================

export const FinancialBoundariesSchema = z.object({
  maxAutoExpense: z.number().default(50),
  maxQueuedExpense: z.number().default(200),
  maxDailySpend: z.number().default(100),
  maxTradeSize: z.number().default(500),
  maxDailyTradingLossPercent: z.number().default(5),
  minTreasuryBalance: z.number().default(1000),
});
export type FinancialBoundaries = z.infer<typeof FinancialBoundariesSchema>;

export const ContentBoundariesSchema = z.object({
  maxAutoPostsPerDay: z.number().default(10),
  maxAutoBlogsPerWeek: z.number().default(3),
  requireReviewForTopics: z.array(z.string()).default(["financial_advice", "controversial"]),
});
export type ContentBoundaries = z.infer<typeof ContentBoundariesSchema>;

export const DevelopmentBoundariesSchema = z.object({
  maxAutoCommitLines: z.number().default(100),
  maxAutoFilesChanged: z.number().default(5),
  requireReviewForPaths: z.array(z.string()).default(["src/core/", "src/config/", ".env"]),
  autoDeployToStaging: z.boolean().default(true),
  autoDeployToProduction: z.boolean().default(false),
});
export type DevelopmentBoundaries = z.infer<typeof DevelopmentBoundariesSchema>;

export const TradingBoundariesSchema = z.object({
  allowedBots: z.array(z.string()).default(["dca"]),
  allowedTokens: z.array(z.string()).default(["SOL", "USDC"]),
  maxPositionPercent: z.number().default(20),
  requireApprovalForNewTokens: z.boolean().default(true),
});
export type TradingBoundaries = z.infer<typeof TradingBoundariesSchema>;

export const TimeBoundariesSchema = z.object({
  activeHoursStart: z.number().default(6),
  activeHoursEnd: z.number().default(22),
  quietHoursStart: z.number().default(23),
  quietHoursEnd: z.number().default(6),
});
export type TimeBoundaries = z.infer<typeof TimeBoundariesSchema>;

export const BoundariesSchema = z.object({
  financial: FinancialBoundariesSchema,
  content: ContentBoundariesSchema,
  development: DevelopmentBoundariesSchema,
  trading: TradingBoundariesSchema,
  time: TimeBoundariesSchema,
});
export type Boundaries = z.infer<typeof BoundariesSchema>;

// ============================================================================
// BOUNDARY CHECK RESULT
// ============================================================================

export const DailyUsageSchema = z.object({
  trades: z.number().default(0),
  content: z.number().default(0),
  builds: z.number().default(0),
  spending: z.number().default(0),
});
export type DailyUsage = z.infer<typeof DailyUsageSchema>;

export const BoundaryCheckResultSchema = z.object({
  passed: z.boolean(),
  violations: z.array(z.string()),
  warnings: z.array(z.string()),
  usageToday: DailyUsageSchema,
});
export type BoundaryCheckResult = z.infer<typeof BoundaryCheckResultSchema>;

// ============================================================================
// APPROVAL
// ============================================================================

export const ApprovalStatusSchema = z.enum(["pending", "approved", "rejected", "expired"]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const ApprovalRequestSchema = z.object({
  id: z.string(),
  decision: DecisionSchema,
  priority: z.number(),
  urgency: UrgencySchema,
  expiresAt: z.number(),
  notificationsSent: z.array(z.string()),
  status: ApprovalStatusSchema,
  reviewedBy: z.string().optional(),
  reviewedAt: z.number().optional(),
  feedback: z.string().optional(),
  createdAt: z.number(),
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

// ============================================================================
// EXECUTION
// ============================================================================

export const ExecutionResultSchema = z.object({
  actionId: z.string(),
  decisionId: z.string(),
  success: z.boolean(),
  output: z.unknown().optional(),
  error: z.string().optional(),
  executedAt: z.number(),
  duration: z.number(),
  rolledBack: z.boolean().default(false),
});
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const RollbackCheckpointSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  decisionId: z.string(),
  state: z.record(z.unknown()),
  createdAt: z.number(),
});
export type RollbackCheckpoint = z.infer<typeof RollbackCheckpointSchema>;

// ============================================================================
// AUDIT
// ============================================================================

export const AuditEntryTypeSchema = z.enum([
  "action_received",
  "risk_assessed",
  "decision_made",
  "queued_approval",
  "approved",
  "rejected",
  "executed",
  "execution_failed",
  "rolled_back",
  "boundary_violation",
  "escalated",
]);
export type AuditEntryType = z.infer<typeof AuditEntryTypeSchema>;

export const AuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: AuditEntryTypeSchema,
  actionId: z.string(),
  decisionId: z.string().optional(),
  data: z.record(z.unknown()),
  hash: z.string(),
  previousHash: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

// ============================================================================
// NOTIFICATION
// ============================================================================

export const NotificationChannelTypeSchema = z.enum(["discord", "telegram", "slack", "email"]);
export type NotificationChannelType = z.infer<typeof NotificationChannelTypeSchema>;

export const NotificationChannelSchema = z.object({
  type: NotificationChannelTypeSchema,
  enabled: z.boolean(),
  config: z.object({
    webhookUrl: z.string().optional(),
    botToken: z.string().optional(),
    chatId: z.string().optional(),
  }),
});
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

// ============================================================================
// CONFIG
// ============================================================================

export const AutonomyConfigSchema = z.object({
  enabled: z.boolean().default(true),
  level: z.number().min(1).max(4).default(2),
  boundaries: BoundariesSchema,
  notifications: z.object({
    channels: z.array(NotificationChannelSchema).default([]),
    rateLimitPerMinute: z.number().default(10),
  }),
  approval: z.object({
    maxPendingItems: z.number().default(50),
    autoExpireHours: z.number().default(24),
    notifyOnNewItem: z.boolean().default(true),
  }),
  audit: z.object({
    retentionDays: z.number().default(90),
    storageDir: z.string().default("./data/audit"),
  }),
});
export type AutonomyConfig = z.infer<typeof AutonomyConfigSchema>;
