/**
 * Ingestion Scheduler
 *
 * Schedules data source fetching using node-cron.
 */

import cron from "node-cron";
import { Logger } from "../utils/logger.js";

interface ScheduledTask {
  name: string;
  interval: number;
  task: () => Promise<void>;
  cronJob?: cron.ScheduledTask;
  lastRun?: number;
  running: boolean;
}

export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private logger = new Logger("Scheduler");
  private isRunning = false;

  /**
   * Schedule a task to run at interval
   */
  schedule(
    name: string,
    intervalMs: number,
    task: () => Promise<void>
  ): void {
    this.tasks.set(name, {
      name,
      interval: intervalMs,
      task,
      running: false,
    });
    this.logger.info(`Scheduled task: ${name} (every ${this.formatInterval(intervalMs)})`);
  }

  /**
   * Start all scheduled tasks
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    for (const [name, scheduledTask] of this.tasks) {
      // Convert interval to cron expression (approximate)
      const cronExpr = this.intervalToCron(scheduledTask.interval);

      scheduledTask.cronJob = cron.schedule(cronExpr, async () => {
        if (scheduledTask.running) {
          this.logger.warn(`Task ${name} already running, skipping`);
          return;
        }

        scheduledTask.running = true;
        const start = Date.now();

        try {
          await scheduledTask.task();
          scheduledTask.lastRun = Date.now();
          this.logger.debug(`Task ${name} completed in ${Date.now() - start}ms`);
        } catch (error) {
          this.logger.error(`Task ${name} failed: ${error}`);
        } finally {
          scheduledTask.running = false;
        }
      });

      this.logger.info(`Started task: ${name}`);
    }

    this.logger.info(`Scheduler started with ${this.tasks.size} tasks`);
  }

  /**
   * Stop all tasks
   */
  stop(): void {
    for (const [name, task] of this.tasks) {
      if (task.cronJob) {
        task.cronJob.stop();
        this.logger.info(`Stopped task: ${name}`);
      }
    }
    this.isRunning = false;
    this.logger.info("Scheduler stopped");
  }

  /**
   * Run a specific task immediately
   */
  async runNow(name: string): Promise<void> {
    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Task not found: ${name}`);
    }

    if (task.running) {
      this.logger.warn(`Task ${name} already running`);
      return;
    }

    task.running = true;
    try {
      await task.task();
      task.lastRun = Date.now();
    } finally {
      task.running = false;
    }
  }

  /**
   * Run all tasks immediately
   */
  async runAll(): Promise<void> {
    const tasks = Array.from(this.tasks.keys());
    await Promise.all(tasks.map((name) => this.runNow(name)));
  }

  /**
   * Get task status
   */
  getStatus(): { name: string; lastRun?: number; running: boolean; interval: number }[] {
    return Array.from(this.tasks.values()).map((task) => ({
      name: task.name,
      lastRun: task.lastRun,
      running: task.running,
      interval: task.interval,
    }));
  }

  /**
   * Convert interval (ms) to cron expression
   */
  private intervalToCron(intervalMs: number): string {
    const minutes = Math.floor(intervalMs / 60000);

    if (minutes < 1) {
      // Run every minute for sub-minute intervals
      return "* * * * *";
    } else if (minutes < 60) {
      // Every N minutes
      return `*/${minutes} * * * *`;
    } else {
      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        // Every N hours
        return `0 */${hours} * * *`;
      } else {
        // Every day at midnight
        return "0 0 * * *";
      }
    }
  }

  /**
   * Format interval for display
   */
  private formatInterval(ms: number): string {
    if (ms < 60000) return `${ms / 1000}s`;
    if (ms < 3600000) return `${ms / 60000}m`;
    return `${ms / 3600000}h`;
  }
}
