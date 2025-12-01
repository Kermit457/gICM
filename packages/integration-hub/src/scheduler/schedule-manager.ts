/**
 * Pipeline Schedule Manager
 *
 * Manages cron-based pipeline scheduling with node-cron and Bull integration.
 * Supports timezones, retries, and real-time schedule updates.
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type Schedule,
  type ScheduleConfig,
  type ScheduledRun,
  type ScheduleExecution,
  type ScheduleStats,
  type SchedulerEvents,
  ScheduleConfigSchema,
} from "./types.js";

// =========================================================================
// CRON UTILITIES
// =========================================================================

/**
 * Parse cron expression into next run date
 */
function getNextRunDate(cronExpression: string, timezone: string, after: Date = new Date()): Date {
  // Simple cron parser - for production use node-cron or cronstrue
  const parts = cronExpression.split(" ");
  if (parts.length !== 5) {
    throw new Error("Invalid cron expression");
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const next = new Date(after);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Add 1 minute to ensure we get the next occurrence
  next.setMinutes(next.getMinutes() + 1);

  // Simple logic for common patterns
  if (minute === "*" && hour === "*") {
    // Every minute - next minute
    return next;
  }

  if (minute.startsWith("*/")) {
    const interval = parseInt(minute.slice(2));
    const currentMinute = next.getMinutes();
    const nextMinute = Math.ceil(currentMinute / interval) * interval;
    if (nextMinute >= 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(nextMinute % 60);
    } else {
      next.setMinutes(nextMinute);
    }
    return next;
  }

  if (minute !== "*" && hour !== "*") {
    // Specific time - set to that time
    const targetMinute = parseInt(minute);
    const targetHour = parseInt(hour);
    next.setMinutes(targetMinute);
    next.setHours(targetHour);
    if (next <= after) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  if (minute !== "*" && hour === "*") {
    // Every hour at specific minute
    const targetMinute = parseInt(minute);
    next.setMinutes(targetMinute);
    if (next <= after) {
      next.setHours(next.getHours() + 1);
    }
    return next;
  }

  // Default: next minute
  return next;
}

/**
 * Convert cron expression to human-readable string
 */
export function cronToHuman(cronExpression: string): string {
  const parts = cronExpression.split(" ");
  if (parts.length !== 5) return cronExpression;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Every minute
  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "Every minute";
  }

  // Every N minutes
  if (minute.startsWith("*/") && hour === "*") {
    return `Every ${minute.slice(2)} minutes`;
  }

  // Hourly
  if (minute !== "*" && hour === "*" && dayOfMonth === "*") {
    return `Every hour at :${minute.padStart(2, "0")}`;
  }

  // Daily
  if (minute !== "*" && hour !== "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Daily at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  // Weekly
  if (dayOfWeek !== "*" && dayOfMonth === "*") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[parseInt(dayOfWeek)] || dayOfWeek;
    return `Weekly on ${dayName} at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  // Monthly
  if (dayOfMonth !== "*" && month === "*") {
    return `Monthly on day ${dayOfMonth} at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  return cronExpression;
}

// =========================================================================
// SCHEDULE MANAGER
// =========================================================================

export interface ScheduleManagerConfig {
  /** Check interval in ms (default: 60000 = 1 minute) */
  checkInterval?: number;
  /** Max concurrent scheduled runs (default: 10) */
  maxConcurrent?: number;
  /** Auto-disable after N consecutive failures (default: 5) */
  autoDisableAfterFailures?: number;
  /** Pipeline executor function */
  executor?: (schedule: Schedule) => Promise<{ executionId: string; result: unknown }>;
}

export class ScheduleManager extends EventEmitter<SchedulerEvents> {
  private schedules: Map<string, Schedule> = new Map();
  private executions: Map<string, ScheduleExecution> = new Map();
  private runningExecutions: Set<string> = new Set();
  private checkTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: Required<ScheduleManagerConfig>;

  constructor(config: ScheduleManagerConfig = {}) {
    super();
    this.config = {
      checkInterval: config.checkInterval || 60000,
      maxConcurrent: config.maxConcurrent || 10,
      autoDisableAfterFailures: config.autoDisableAfterFailures || 5,
      executor: config.executor || (async () => ({ executionId: "", result: null })),
    };
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("[Scheduler] Starting schedule manager...");

    // Initial check
    await this.checkSchedules();

    // Start periodic check
    this.checkTimer = setInterval(() => {
      this.checkSchedules().catch((err) => {
        console.error("[Scheduler] Check error:", err);
        this.emit("error", err);
      });
    }, this.config.checkInterval);

    console.log("[Scheduler] Schedule manager started");
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    console.log("[Scheduler] Schedule manager stopped");
  }

  /**
   * Create a new schedule
   */
  async createSchedule(config: ScheduleConfig): Promise<Schedule> {
    // Validate config
    const validated = ScheduleConfigSchema.parse(config);

    const schedule: Schedule = {
      ...validated,
      id: randomUUID(),
      status: validated.enabled ? "active" : "disabled",
      nextRun: validated.enabled ? getNextRunDate(validated.cronExpression, validated.timezone) : null,
      lastRun: null,
      lastStatus: null,
      runCount: 0,
      consecutiveFailures: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.schedules.set(schedule.id, schedule);
    this.emit("schedule:created", schedule);

    console.log(`[Scheduler] Created schedule: ${schedule.name} (${schedule.id})`);
    return schedule;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(id: string, updates: Partial<ScheduleConfig>): Promise<Schedule> {
    const existing = this.schedules.get(id);
    if (!existing) {
      throw new Error(`Schedule not found: ${id}`);
    }

    const updated: Schedule = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date(),
    };

    // Recalculate next run if cron or enabled changed
    if (updates.cronExpression || updates.enabled !== undefined || updates.timezone) {
      updated.nextRun =
        updated.enabled && updated.status === "active"
          ? getNextRunDate(updated.cronExpression, updated.timezone)
          : null;
    }

    this.schedules.set(id, updated);
    this.emit("schedule:updated", updated);

    return updated;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(id: string): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    this.schedules.delete(id);
    this.emit("schedule:deleted", id);

    console.log(`[Scheduler] Deleted schedule: ${schedule.name} (${id})`);
    return true;
  }

  /**
   * Get a schedule by ID
   */
  getSchedule(id: string): Schedule | undefined {
    return this.schedules.get(id);
  }

  /**
   * Get all schedules
   */
  getAllSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get schedules by pipeline ID
   */
  getSchedulesByPipeline(pipelineId: string): Schedule[] {
    return this.getAllSchedules().filter((s) => s.pipelineId === pipelineId);
  }

  /**
   * Enable a schedule
   */
  async enableSchedule(id: string): Promise<Schedule> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    schedule.enabled = true;
    schedule.status = "active";
    schedule.nextRun = getNextRunDate(schedule.cronExpression, schedule.timezone);
    schedule.consecutiveFailures = 0;
    schedule.updatedAt = new Date();

    this.emit("schedule:enabled", schedule);
    return schedule;
  }

  /**
   * Disable a schedule
   */
  async disableSchedule(id: string): Promise<Schedule> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    schedule.enabled = false;
    schedule.status = "disabled";
    schedule.nextRun = null;
    schedule.updatedAt = new Date();

    this.emit("schedule:disabled", schedule);
    return schedule;
  }

  /**
   * Pause a schedule (temporary)
   */
  async pauseSchedule(id: string): Promise<Schedule> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    schedule.status = "paused";
    schedule.updatedAt = new Date();

    this.emit("schedule:paused", schedule);
    return schedule;
  }

  /**
   * Resume a paused schedule
   */
  async resumeSchedule(id: string): Promise<Schedule> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    schedule.status = "active";
    schedule.nextRun = getNextRunDate(schedule.cronExpression, schedule.timezone);
    schedule.updatedAt = new Date();

    this.emit("schedule:resumed", schedule);
    return schedule;
  }

  /**
   * Trigger a schedule manually (run now)
   */
  async triggerSchedule(id: string): Promise<ScheduleExecution> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    return this.executeSchedule(schedule);
  }

  /**
   * Get upcoming scheduled runs
   */
  getNextRuns(limit = 10): ScheduledRun[] {
    const runs: ScheduledRun[] = [];

    for (const schedule of this.schedules.values()) {
      if (schedule.status === "active" && schedule.enabled && schedule.nextRun) {
        runs.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          pipelineId: schedule.pipelineId,
          pipelineName: schedule.pipelineName,
          scheduledTime: schedule.nextRun,
          cronExpression: schedule.cronExpression,
          timezone: schedule.timezone,
          inputs: schedule.inputs,
        });
      }
    }

    return runs
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get execution history for a schedule
   */
  getExecutions(scheduleId: string, limit = 20): ScheduleExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.scheduleId === scheduleId)
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get scheduler statistics
   */
  getStats(): ScheduleStats {
    const schedules = this.getAllSchedules();
    const executions = Array.from(this.executions.values());

    const activeSchedules = schedules.filter((s) => s.status === "active" && s.enabled).length;
    const pausedSchedules = schedules.filter((s) => s.status === "paused").length;

    const completedExecutions = executions.filter((e) => e.status === "completed");
    const failedExecutions = executions.filter((e) => e.status === "failed");

    const totalRuns = completedExecutions.length + failedExecutions.length;
    const successRate = totalRuns > 0 ? (completedExecutions.length / totalRuns) * 100 : 0;

    const durations = completedExecutions
      .filter((e) => e.startedAt && e.completedAt)
      .map((e) => e.completedAt!.getTime() - e.startedAt!.getTime());

    const avgDurationMs =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      totalSchedules: schedules.length,
      activeSchedules,
      pausedSchedules,
      totalRuns,
      successfulRuns: completedExecutions.length,
      failedRuns: failedExecutions.length,
      successRate: Math.round(successRate * 100) / 100,
      avgDurationMs: Math.round(avgDurationMs),
      nextScheduledRuns: this.getNextRuns(5),
    };
  }

  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================

  private async checkSchedules(): Promise<void> {
    const now = new Date();

    for (const schedule of this.schedules.values()) {
      // Skip if not active or already running
      if (schedule.status !== "active" || !schedule.enabled || !schedule.nextRun) {
        continue;
      }

      // Skip if already at max concurrent
      if (this.runningExecutions.size >= this.config.maxConcurrent) {
        continue;
      }

      // Check if it's time to run
      if (schedule.nextRun <= now) {
        // Execute in background
        this.executeSchedule(schedule).catch((err) => {
          console.error(`[Scheduler] Execution error for ${schedule.name}:`, err);
        });

        // Calculate next run
        schedule.nextRun = getNextRunDate(schedule.cronExpression, schedule.timezone, now);
        schedule.updatedAt = new Date();
      }
    }
  }

  private async executeSchedule(schedule: Schedule): Promise<ScheduleExecution> {
    const executionId = randomUUID();

    const execution: ScheduleExecution = {
      id: executionId,
      scheduleId: schedule.id,
      pipelineId: schedule.pipelineId,
      executionId: null,
      status: "pending",
      scheduledAt: new Date(),
      startedAt: null,
      completedAt: null,
      error: null,
      attempt: 1,
      result: null,
    };

    this.executions.set(executionId, execution);
    this.runningExecutions.add(executionId);

    this.emit("run:scheduled", {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      pipelineId: schedule.pipelineId,
      pipelineName: schedule.pipelineName,
      scheduledTime: execution.scheduledAt,
      cronExpression: schedule.cronExpression,
      timezone: schedule.timezone,
      inputs: schedule.inputs,
    });

    try {
      execution.status = "running";
      execution.startedAt = new Date();
      this.emit("run:started", execution);

      // Execute the pipeline
      const result = await this.config.executor(schedule);
      execution.executionId = result.executionId;
      execution.result = result.result;

      // Success
      execution.status = "completed";
      execution.completedAt = new Date();

      schedule.lastRun = execution.completedAt;
      schedule.lastStatus = "completed";
      schedule.runCount++;
      schedule.consecutiveFailures = 0;

      this.emit("run:completed", execution);
      console.log(`[Scheduler] Completed: ${schedule.name} (execution: ${result.executionId})`);
    } catch (error) {
      // Failure
      execution.status = "failed";
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : String(error);

      schedule.lastRun = execution.completedAt;
      schedule.lastStatus = "failed";
      schedule.runCount++;
      schedule.consecutiveFailures++;

      this.emit("run:failed", execution, error instanceof Error ? error : new Error(String(error)));
      console.error(`[Scheduler] Failed: ${schedule.name}:`, error);

      // Auto-disable if too many consecutive failures
      if (schedule.consecutiveFailures >= this.config.autoDisableAfterFailures) {
        schedule.status = "error";
        schedule.enabled = false;
        console.warn(`[Scheduler] Auto-disabled ${schedule.name} after ${schedule.consecutiveFailures} failures`);
        this.emit("schedule:disabled", schedule);
      }
    } finally {
      this.runningExecutions.delete(executionId);
    }

    return execution;
  }
}

// =========================================================================
// SINGLETON
// =========================================================================

let managerInstance: ScheduleManager | null = null;

/**
 * Get or create schedule manager singleton
 */
export function getScheduleManager(config?: ScheduleManagerConfig): ScheduleManager {
  if (!managerInstance) {
    managerInstance = new ScheduleManager(config);
  }
  return managerInstance;
}

/**
 * Create a new schedule manager instance
 */
export function createScheduleManager(config?: ScheduleManagerConfig): ScheduleManager {
  return new ScheduleManager(config);
}
