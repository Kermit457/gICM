/**
 * Pipeline Scheduler Types
 *
 * Zod schemas and TypeScript types for cron-based pipeline scheduling.
 */

import { z } from "zod";

// =========================================================================
// ZOD SCHEMAS
// =========================================================================

/**
 * Cron expression validation
 * Supports: minute hour day-of-month month day-of-week
 */
export const CronExpressionSchema = z
  .string()
  .regex(
    /^(\*|([0-5]?\d)(,([0-5]?\d))*(-([0-5]?\d))?|(\*\/([0-5]?\d)))\s+(\*|([01]?\d|2[0-3])(,([01]?\d|2[0-3]))*(-([01]?\d|2[0-3]))?|(\*\/([01]?\d|2[0-3])))\s+(\*|([1-9]|[12]\d|3[01])(,([1-9]|[12]\d|3[01]))*(-([1-9]|[12]\d|3[01]))?|(\*\/([1-9]|[12]\d|3[01])))\s+(\*|(1[0-2]|[1-9])(,(1[0-2]|[1-9]))*(-(1[0-2]|[1-9]))?|(\*\/(1[0-2]|[1-9])))\s+(\*|[0-6](,[0-6])*(-[0-6])?|(\*\/[0-6]))$/,
    { message: "Invalid cron expression" }
  )
  .describe("Cron expression (minute hour day-of-month month day-of-week)");

export const TimezoneSchema = z
  .string()
  .default("UTC")
  .describe("IANA timezone identifier");

export const ScheduleStatusSchema = z.enum(["active", "paused", "disabled", "error"]);

export const ScheduleConfigSchema = z.object({
  pipelineId: z.string().min(1),
  pipelineName: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  cronExpression: CronExpressionSchema,
  timezone: TimezoneSchema,
  enabled: z.boolean().default(true),
  inputs: z.record(z.unknown()).default({}),
  maxRetries: z.number().int().min(0).max(10).default(3),
  timeoutMs: z.number().int().min(1000).max(3600000).default(300000),
  webhookUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const ScheduleSchema = ScheduleConfigSchema.extend({
  id: z.string().uuid(),
  status: ScheduleStatusSchema.default("active"),
  nextRun: z.date().nullable(),
  lastRun: z.date().nullable(),
  lastStatus: z.enum(["completed", "failed", "cancelled"]).nullable(),
  runCount: z.number().int().default(0),
  consecutiveFailures: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ScheduledRunSchema = z.object({
  scheduleId: z.string().uuid(),
  scheduleName: z.string(),
  pipelineId: z.string(),
  pipelineName: z.string(),
  scheduledTime: z.date(),
  cronExpression: z.string(),
  timezone: z.string(),
  inputs: z.record(z.unknown()),
});

export const ScheduleExecutionSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  pipelineId: z.string(),
  executionId: z.string().nullable(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  scheduledAt: z.date(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  error: z.string().nullable(),
  attempt: z.number().int().default(1),
  result: z.unknown().nullable(),
});

export const ScheduleStatsSchema = z.object({
  totalSchedules: z.number().int(),
  activeSchedules: z.number().int(),
  pausedSchedules: z.number().int(),
  totalRuns: z.number().int(),
  successfulRuns: z.number().int(),
  failedRuns: z.number().int(),
  successRate: z.number(),
  avgDurationMs: z.number(),
  nextScheduledRuns: z.array(ScheduledRunSchema),
});

// =========================================================================
// TYPES
// =========================================================================

export type CronExpression = z.infer<typeof CronExpressionSchema>;
export type Timezone = z.infer<typeof TimezoneSchema>;
export type ScheduleStatus = z.infer<typeof ScheduleStatusSchema>;
export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type ScheduledRun = z.infer<typeof ScheduledRunSchema>;
export type ScheduleExecution = z.infer<typeof ScheduleExecutionSchema>;
export type ScheduleStats = z.infer<typeof ScheduleStatsSchema>;

// =========================================================================
// EVENT TYPES
// =========================================================================

export interface SchedulerEvents {
  "schedule:created": (schedule: Schedule) => void;
  "schedule:updated": (schedule: Schedule) => void;
  "schedule:deleted": (scheduleId: string) => void;
  "schedule:enabled": (schedule: Schedule) => void;
  "schedule:disabled": (schedule: Schedule) => void;
  "schedule:paused": (schedule: Schedule) => void;
  "schedule:resumed": (schedule: Schedule) => void;
  "run:scheduled": (run: ScheduledRun) => void;
  "run:started": (execution: ScheduleExecution) => void;
  "run:completed": (execution: ScheduleExecution) => void;
  "run:failed": (execution: ScheduleExecution, error: Error) => void;
  "run:cancelled": (execution: ScheduleExecution) => void;
  "error": (error: Error) => void;
}

// =========================================================================
// COMMON CRON PRESETS
// =========================================================================

export const CRON_PRESETS = {
  everyMinute: "* * * * *",
  every5Minutes: "*/5 * * * *",
  every15Minutes: "*/15 * * * *",
  every30Minutes: "*/30 * * * *",
  hourly: "0 * * * *",
  every2Hours: "0 */2 * * *",
  every4Hours: "0 */4 * * *",
  every6Hours: "0 */6 * * *",
  every12Hours: "0 */12 * * *",
  daily: "0 0 * * *",
  dailyAt9am: "0 9 * * *",
  dailyAt6pm: "0 18 * * *",
  weekly: "0 0 * * 0",
  weekdays: "0 9 * * 1-5",
  weekends: "0 10 * * 0,6",
  monthly: "0 0 1 * *",
  quarterly: "0 0 1 */3 *",
} as const;

export type CronPreset = keyof typeof CRON_PRESETS;
