/**
 * WebSocket Event Types
 *
 * Zod schemas and TypeScript types for WebSocket events.
 */

import { z } from "zod";

// =========================================================================
// EVENT TYPES
// =========================================================================

export const WSEventTypeSchema = z.enum([
  // Pipeline events
  "pipeline:started",
  "pipeline:progress",
  "pipeline:step:started",
  "pipeline:step:completed",
  "pipeline:step:failed",
  "pipeline:completed",
  "pipeline:failed",
  "pipeline:cancelled",

  // Queue events
  "queue:job:added",
  "queue:job:started",
  "queue:job:completed",
  "queue:job:failed",
  "queue:stats",

  // Analytics events
  "analytics:update",
  "analytics:cost:threshold",

  // Schedule events
  "schedule:triggered",
  "schedule:completed",
  "schedule:failed",

  // System events
  "system:connected",
  "system:heartbeat",
  "system:error",

  // Room management
  "room:joined",
  "room:left",
]);

export type WSEventType = z.infer<typeof WSEventTypeSchema>;

// =========================================================================
// EVENT PAYLOADS
// =========================================================================

// Pipeline Events
export const PipelineStartedPayloadSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  pipelineName: z.string(),
  startedAt: z.string().datetime(),
  steps: z.array(z.object({
    id: z.string(),
    tool: z.string(),
    status: z.enum(["pending", "running", "completed", "failed"]),
  })),
});

export const PipelineProgressPayloadSchema = z.object({
  executionId: z.string(),
  progress: z.number().min(0).max(100),
  currentStep: z.string().optional(),
  message: z.string().optional(),
});

export const PipelineStepEventPayloadSchema = z.object({
  executionId: z.string(),
  stepId: z.string(),
  tool: z.string(),
  status: z.enum(["started", "completed", "failed"]),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  duration: z.number().optional(),
  tokens: z.number().optional(),
  cost: z.number().optional(),
  error: z.string().optional(),
  result: z.unknown().optional(),
});

export const PipelineCompletedPayloadSchema = z.object({
  executionId: z.string(),
  pipelineId: z.string(),
  status: z.enum(["completed", "failed", "cancelled"]),
  completedAt: z.string().datetime(),
  duration: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),
  steps: z.array(z.object({
    id: z.string(),
    tool: z.string(),
    status: z.enum(["completed", "failed", "skipped"]),
    duration: z.number().optional(),
    tokens: z.number().optional(),
  })),
  error: z.string().optional(),
  result: z.unknown().optional(),
});

// Queue Events
export const QueueJobPayloadSchema = z.object({
  jobId: z.string(),
  pipelineId: z.string(),
  pipelineName: z.string(),
  status: z.enum(["waiting", "active", "completed", "failed", "delayed"]),
  progress: z.number().optional(),
  priority: z.enum(["critical", "high", "normal", "low"]).optional(),
  addedAt: z.string().datetime().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

export const QueueStatsPayloadSchema = z.object({
  waiting: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
  delayed: z.number(),
  total: z.number(),
  throughput: z.number().optional(), // jobs per minute
});

// Analytics Events
export const AnalyticsUpdatePayloadSchema = z.object({
  period: z.enum(["day", "hour", "minute"]),
  executions: z.number(),
  successful: z.number(),
  failed: z.number(),
  tokens: z.number(),
  cost: z.number(),
  avgDuration: z.number(),
});

export const CostThresholdPayloadSchema = z.object({
  budgetId: z.string(),
  budgetName: z.string(),
  threshold: z.number(),
  currentSpend: z.number(),
  limit: z.number(),
  percentUsed: z.number(),
  triggeredAt: z.string().datetime(),
});

// Schedule Events
export const ScheduleEventPayloadSchema = z.object({
  scheduleId: z.string(),
  scheduleName: z.string(),
  pipelineId: z.string(),
  pipelineName: z.string(),
  executionId: z.string().optional(),
  status: z.enum(["triggered", "completed", "failed"]),
  scheduledAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

// System Events
export const SystemConnectedPayloadSchema = z.object({
  clientId: z.string(),
  connectedAt: z.string().datetime(),
  rooms: z.array(z.string()),
});

export const SystemHeartbeatPayloadSchema = z.object({
  timestamp: z.string().datetime(),
  serverTime: z.number(),
  uptime: z.number(),
});

export const SystemErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

// Room Events
export const RoomEventPayloadSchema = z.object({
  room: z.string(),
  clientId: z.string(),
  timestamp: z.string().datetime(),
});

// =========================================================================
// UNIFIED EVENT SCHEMA
// =========================================================================

export const WSEventSchema = z.object({
  type: WSEventTypeSchema,
  payload: z.unknown(),
  timestamp: z.string().datetime(),
  room: z.string().optional(),
});

export type WSEvent = z.infer<typeof WSEventSchema>;

// =========================================================================
// CLIENT MESSAGES
// =========================================================================

export const ClientMessageSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("subscribe"),
    rooms: z.array(z.string()),
  }),
  z.object({
    action: z.literal("unsubscribe"),
    rooms: z.array(z.string()),
  }),
  z.object({
    action: z.literal("ping"),
  }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// =========================================================================
// ROOM PATTERNS
// =========================================================================

export const ROOM_PATTERNS = {
  // Pipeline room: pipeline:{executionId}
  pipeline: (executionId: string) => `pipeline:${executionId}`,

  // Queue room: queue:status (global queue updates)
  queue: () => "queue:status",

  // Analytics room: analytics:live (real-time metrics)
  analytics: () => "analytics:live",

  // User room: user:{userId}
  user: (userId: string) => `user:${userId}`,

  // Schedule room: schedule:{scheduleId}
  schedule: (scheduleId: string) => `schedule:${scheduleId}`,

  // Global room: all events
  global: () => "global",
} as const;

// =========================================================================
// PAYLOAD TYPE MAP
// =========================================================================

export type PipelineStartedPayload = z.infer<typeof PipelineStartedPayloadSchema>;
export type PipelineProgressPayload = z.infer<typeof PipelineProgressPayloadSchema>;
export type PipelineStepEventPayload = z.infer<typeof PipelineStepEventPayloadSchema>;
export type PipelineCompletedPayload = z.infer<typeof PipelineCompletedPayloadSchema>;
export type QueueJobPayload = z.infer<typeof QueueJobPayloadSchema>;
export type QueueStatsPayload = z.infer<typeof QueueStatsPayloadSchema>;
export type AnalyticsUpdatePayload = z.infer<typeof AnalyticsUpdatePayloadSchema>;
export type CostThresholdPayload = z.infer<typeof CostThresholdPayloadSchema>;
export type ScheduleEventPayload = z.infer<typeof ScheduleEventPayloadSchema>;
export type SystemConnectedPayload = z.infer<typeof SystemConnectedPayloadSchema>;
export type SystemHeartbeatPayload = z.infer<typeof SystemHeartbeatPayloadSchema>;
export type SystemErrorPayload = z.infer<typeof SystemErrorPayloadSchema>;
export type RoomEventPayload = z.infer<typeof RoomEventPayloadSchema>;
