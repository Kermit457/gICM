/**
 * SDK Types & Schemas
 * Phase 9E: SDK Generation
 */

import { z } from "zod";

// ============================================================================
// SDK CONFIG
// ============================================================================

export const SDKConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  headers: z.record(z.string()).optional(),
});
export type SDKConfig = z.infer<typeof SDKConfigSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    ok: z.boolean(),
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
  });

// ============================================================================
// RESOURCE SCHEMAS (for SDK client generation)
// ============================================================================

// Pipeline
export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]),
  steps: z.array(z.object({
    id: z.string(),
    tool: z.string(),
    name: z.string().optional(),
    inputs: z.record(z.unknown()),
    dependsOn: z.array(z.string()).optional(),
  })),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Pipeline = z.infer<typeof PipelineSchema>;

// Pipeline Execution
export const ExecutionSchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  pipelineName: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  progress: z.number(),
  currentStep: z.string().nullable(),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["pending", "running", "completed", "failed", "skipped"]),
    startedAt: z.number().nullable(),
    completedAt: z.number().nullable(),
    output: z.unknown().nullable(),
    error: z.string().nullable(),
  })),
  startedAt: z.number(),
  completedAt: z.number().nullable(),
  result: z.unknown().nullable(),
  error: z.string().nullable(),
});
export type Execution = z.infer<typeof ExecutionSchema>;

// Schedule
export const ScheduleSchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  cron: z.string(),
  timezone: z.string(),
  status: z.enum(["active", "paused", "disabled"]),
  nextRunAt: z.string().optional(),
  lastRunAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

// Budget
export const BudgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  limit: z.number(),
  spent: z.number(),
  period: z.enum(["daily", "weekly", "monthly"]),
  scope: z.enum(["global", "pipeline", "user"]),
  scopeId: z.string().optional(),
  status: z.enum(["active", "paused", "exceeded"]),
  alertThresholds: z.array(z.number()),
  autoPause: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Budget = z.infer<typeof BudgetSchema>;

// Webhook
export const WebhookSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  enabled: z.boolean(),
  lastTriggeredAt: z.string().optional(),
  lastStatus: z.number().optional(),
  failureCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Webhook = z.infer<typeof WebhookSchema>;

// Analytics Summary
export const AnalyticsSummarySchema = z.object({
  period: z.string(),
  totalExecutions: z.number(),
  successRate: z.number(),
  avgDuration: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),
  executionTrend: z.number(),
  costTrend: z.number(),
  topPipelines: z.array(z.object({
    id: z.string(),
    name: z.string(),
    count: z.number(),
    successRate: z.number(),
  })),
});
export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;

// Queue Job
export const QueueJobSchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  pipelineName: z.string(),
  status: z.enum(["waiting", "active", "completed", "failed", "delayed"]),
  priority: z.enum(["low", "normal", "high", "critical"]),
  progress: z.number(),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});
export type QueueJob = z.infer<typeof QueueJobSchema>;

// Organization
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  plan: z.enum(["free", "pro", "team", "enterprise"]),
  settings: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

// Member
export const MemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().optional(),
  role: z.enum(["owner", "admin", "editor", "viewer"]),
  status: z.enum(["active", "inactive", "suspended"]),
  joinedAt: z.string(),
  lastActiveAt: z.string().optional(),
});
export type Member = z.infer<typeof MemberSchema>;

// Audit Event
export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  category: z.string(),
  action: z.string(),
  severity: z.enum(["debug", "info", "warning", "error", "critical"]),
  result: z.enum(["success", "failure", "partial", "pending"]),
  description: z.string(),
  context: z.object({
    userId: z.string().optional(),
    userEmail: z.string().optional(),
    orgId: z.string().optional(),
    ipAddress: z.string().optional(),
  }),
  resource: z.object({
    type: z.string(),
    id: z.string(),
    name: z.string().optional(),
  }).optional(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ============================================================================
// REQUEST TYPES
// ============================================================================

// Pipeline Create/Update
export const CreatePipelineInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    tool: z.string(),
    name: z.string().optional(),
    inputs: z.record(z.unknown()),
    dependsOn: z.array(z.string()).optional(),
  })),
});
export type CreatePipelineInput = z.infer<typeof CreatePipelineInputSchema>;

// Execute Pipeline
export const ExecutePipelineInputSchema = z.object({
  pipelineId: z.string(),
  inputs: z.record(z.unknown()).optional(),
});
export type ExecutePipelineInput = z.infer<typeof ExecutePipelineInputSchema>;

// Schedule Create
export const CreateScheduleInputSchema = z.object({
  pipelineId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  cron: z.string(),
  timezone: z.string().optional(),
});
export type CreateScheduleInput = z.infer<typeof CreateScheduleInputSchema>;

// Budget Create
export const CreateBudgetInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  limit: z.number().positive(),
  period: z.enum(["daily", "weekly", "monthly"]),
  scope: z.enum(["global", "pipeline", "user"]).optional(),
  scopeId: z.string().optional(),
  alertThresholds: z.array(z.number()).optional(),
  autoPause: z.boolean().optional(),
});
export type CreateBudgetInput = z.infer<typeof CreateBudgetInputSchema>;

// Webhook Create
export const CreateWebhookInputSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.string()),
  enabled: z.boolean().optional(),
});
export type CreateWebhookInput = z.infer<typeof CreateWebhookInputSchema>;

// Queue Job Create
export const CreateQueueJobInputSchema = z.object({
  pipelineId: z.string(),
  pipelineName: z.string(),
  inputs: z.record(z.unknown()).optional(),
  steps: z.array(z.object({
    id: z.string(),
    tool: z.string(),
    inputs: z.record(z.unknown()).optional(),
    dependsOn: z.array(z.string()).optional(),
  })),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  webhookUrl: z.string().url().optional(),
});
export type CreateQueueJobInput = z.infer<typeof CreateQueueJobInputSchema>;

// Invite Member
export const InviteMemberInputSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
  message: z.string().optional(),
});
export type InviteMemberInput = z.infer<typeof InviteMemberInputSchema>;
