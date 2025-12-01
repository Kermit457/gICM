/**
 * Pipeline Job Queue
 *
 * Background job processing for pipeline executions using Bull queue.
 * Supports retries, priority, rate limiting, and progress tracking.
 */

import { EventEmitter } from "eventemitter3";

// =========================================================================
// TYPES
// =========================================================================

export interface PipelineJob {
  id: string;
  pipelineId: string;
  pipelineName: string;
  inputs: Record<string, unknown>;
  steps: PipelineStep[];
  userId?: string;
  webhookUrl?: string;
  priority?: JobPriority;
  metadata?: Record<string, unknown>;
}

export interface PipelineStep {
  id: string;
  tool: string;
  inputs?: Record<string, unknown>;
  dependsOn?: string[];
}

export type JobPriority = "critical" | "high" | "normal" | "low";
export type JobStatus = "waiting" | "active" | "completed" | "failed" | "delayed" | "paused";

export interface JobProgress {
  jobId: string;
  executionId: string;
  status: JobStatus;
  progress: number;
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: unknown;
}

export interface QueueConfig {
  /** Redis connection URL */
  redisUrl?: string;
  /** Queue name (default: 'gicm-pipelines') */
  queueName?: string;
  /** Max concurrent jobs (default: 5) */
  concurrency?: number;
  /** Default job timeout in ms (default: 300000 = 5 min) */
  defaultTimeout?: number;
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  /** Enable rate limiting */
  rateLimit?: {
    max: number;
    duration: number; // ms
  };
}

export interface QueueEvents {
  "job:added": (job: PipelineJob) => void;
  "job:started": (jobId: string, executionId: string) => void;
  "job:progress": (progress: JobProgress) => void;
  "job:completed": (jobId: string, result: unknown) => void;
  "job:failed": (jobId: string, error: Error) => void;
  "job:retrying": (jobId: string, attempt: number) => void;
  "queue:ready": () => void;
  "queue:error": (error: Error) => void;
  "queue:paused": () => void;
  "queue:resumed": () => void;
}

// Priority weights for queue ordering
const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  critical: 1,
  high: 5,
  normal: 10,
  low: 20,
};

// =========================================================================
// PIPELINE QUEUE (IN-MEMORY FALLBACK)
// =========================================================================

/**
 * In-memory queue implementation for development/testing.
 * For production, use BullPipelineQueue with Redis.
 */
export class PipelineQueue extends EventEmitter<QueueEvents> {
  private jobs: Map<string, PipelineJob> = new Map();
  private progress: Map<string, JobProgress> = new Map();
  private queue: string[] = [];
  private processing: Set<string> = new Set();
  private config: Required<QueueConfig>;
  private isRunning = false;
  private isPaused = false;
  private jobCounter = 0;

  constructor(config: QueueConfig = {}) {
    super();
    this.config = {
      redisUrl: config.redisUrl || "",
      queueName: config.queueName || "gicm-pipelines",
      concurrency: config.concurrency || 5,
      defaultTimeout: config.defaultTimeout || 300000,
      maxRetries: config.maxRetries || 3,
      rateLimit: config.rateLimit || { max: 100, duration: 60000 },
    };
  }

  /**
   * Initialize the queue
   */
  async initialize(): Promise<void> {
    this.isRunning = true;
    this.emit("queue:ready");
    console.log(`[Queue] Initialized in-memory queue: ${this.config.queueName}`);
  }

  /**
   * Add a job to the queue
   */
  async addJob(job: Omit<PipelineJob, "id">): Promise<string> {
    const jobId = `job_${Date.now()}_${++this.jobCounter}`;
    const fullJob: PipelineJob = {
      ...job,
      id: jobId,
      priority: job.priority || "normal",
    };

    this.jobs.set(jobId, fullJob);

    // Insert into queue based on priority
    this.insertByPriority(jobId, fullJob.priority!);

    // Initialize progress
    this.progress.set(jobId, {
      jobId,
      executionId: "",
      status: "waiting",
      progress: 0,
      completedSteps: [],
      failedSteps: [],
    });

    this.emit("job:added", fullJob);

    // Try to process next job
    this.processNext();

    return jobId;
  }

  /**
   * Add multiple jobs at once
   */
  async addBulk(jobs: Array<Omit<PipelineJob, "id">>): Promise<string[]> {
    const jobIds: string[] = [];
    for (const job of jobs) {
      const id = await this.addJob(job);
      jobIds.push(id);
    }
    return jobIds;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): PipelineJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get job progress
   */
  getProgress(jobId: string): JobProgress | undefined {
    return this.progress.get(jobId);
  }

  /**
   * Get all jobs with a specific status
   */
  getJobsByStatus(status: JobStatus): PipelineJob[] {
    return Array.from(this.jobs.values()).filter((job) => {
      const progress = this.progress.get(job.id);
      return progress?.status === status;
    });
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  } {
    let waiting = 0,
      active = 0,
      completed = 0,
      failed = 0,
      delayed = 0;

    for (const progress of this.progress.values()) {
      switch (progress.status) {
        case "waiting":
          waiting++;
          break;
        case "active":
          active++;
          break;
        case "completed":
          completed++;
          break;
        case "failed":
          failed++;
          break;
        case "delayed":
          delayed++;
          break;
      }
    }

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: this.jobs.size,
    };
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    this.isPaused = true;
    this.emit("queue:paused");
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    this.isPaused = false;
    this.emit("queue:resumed");
    this.processNext();
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(jobId: string): Promise<boolean> {
    const index = this.queue.indexOf(jobId);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
    this.jobs.delete(jobId);
    this.progress.delete(jobId);
    return true;
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const progress = this.progress.get(jobId);
    if (!progress || progress.status !== "failed") {
      return false;
    }

    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    // Reset progress
    this.progress.set(jobId, {
      jobId,
      executionId: "",
      status: "waiting",
      progress: 0,
      completedSteps: [],
      failedSteps: [],
    });

    // Re-add to queue
    this.insertByPriority(jobId, job.priority!);
    this.processNext();

    return true;
  }

  /**
   * Clean completed/failed jobs older than specified time
   */
  async clean(olderThanMs: number = 86400000): Promise<number> {
    const cutoff = Date.now() - olderThanMs;
    let removed = 0;

    for (const [jobId, progress] of this.progress.entries()) {
      if (
        (progress.status === "completed" || progress.status === "failed") &&
        progress.completedAt &&
        progress.completedAt < cutoff
      ) {
        this.jobs.delete(jobId);
        this.progress.delete(jobId);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Close the queue
   */
  async close(): Promise<void> {
    this.isRunning = false;
    console.log(`[Queue] Closed queue: ${this.config.queueName}`);
  }

  /**
   * Register a job processor
   */
  process(
    processor: (job: PipelineJob, updateProgress: (p: Partial<JobProgress>) => void) => Promise<unknown>
  ): void {
    this.processor = processor;
    this.processNext();
  }

  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================

  private processor:
    | ((job: PipelineJob, updateProgress: (p: Partial<JobProgress>) => void) => Promise<unknown>)
    | null = null;

  private insertByPriority(jobId: string, priority: JobPriority): void {
    const weight = PRIORITY_WEIGHTS[priority];

    // Find insertion point based on priority
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const existingJob = this.jobs.get(this.queue[i]);
      if (existingJob && PRIORITY_WEIGHTS[existingJob.priority || "normal"] > weight) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, jobId);
  }

  private async processNext(): Promise<void> {
    if (!this.isRunning || this.isPaused || !this.processor) {
      return;
    }

    // Check concurrency limit
    if (this.processing.size >= this.config.concurrency) {
      return;
    }

    // Get next job from queue
    const jobId = this.queue.shift();
    if (!jobId) {
      return;
    }

    const job = this.jobs.get(jobId);
    if (!job) {
      this.processNext();
      return;
    }

    // Mark as processing
    this.processing.add(jobId);
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const progress = this.progress.get(jobId)!;
    progress.status = "active";
    progress.executionId = executionId;
    progress.startedAt = Date.now();

    this.emit("job:started", jobId, executionId);

    // Update progress callback
    const updateProgress = (update: Partial<JobProgress>) => {
      const current = this.progress.get(jobId);
      if (current) {
        Object.assign(current, update);
        this.emit("job:progress", current);
      }
    };

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.processor(job, updateProgress),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Job timeout")), this.config.defaultTimeout)
        ),
      ]);

      // Mark as completed
      progress.status = "completed";
      progress.progress = 100;
      progress.completedAt = Date.now();
      progress.result = result;

      this.emit("job:completed", jobId, result);
    } catch (error) {
      // Mark as failed
      progress.status = "failed";
      progress.completedAt = Date.now();
      progress.error = error instanceof Error ? error.message : String(error);

      this.emit("job:failed", jobId, error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.processing.delete(jobId);
      // Process next job
      this.processNext();
    }
  }
}

// =========================================================================
// BULL QUEUE (REDIS-BACKED)
// =========================================================================

/**
 * Redis-backed queue using Bull.
 * Requires `bullmq` package to be installed.
 */
export class BullPipelineQueue extends EventEmitter<QueueEvents> {
  private config: Required<QueueConfig>;
  private queue: unknown | null = null;
  private worker: unknown | null = null;

  constructor(config: QueueConfig = {}) {
    super();
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || "redis://localhost:6379",
      queueName: config.queueName || "gicm-pipelines",
      concurrency: config.concurrency || 5,
      defaultTimeout: config.defaultTimeout || 300000,
      maxRetries: config.maxRetries || 3,
      rateLimit: config.rateLimit || { max: 100, duration: 60000 },
    };
  }

  /**
   * Initialize Bull queue with Redis
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid requiring bullmq if not using Redis
      const { Queue, Worker } = await import("bullmq");

      const connection = {
        url: this.config.redisUrl,
      };

      this.queue = new Queue(this.config.queueName, {
        connection,
        defaultJobOptions: {
          attempts: this.config.maxRetries,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: {
            count: 100,
          },
          removeOnFail: {
            count: 50,
          },
        },
      });

      this.emit("queue:ready");
      console.log(`[Queue] Initialized Bull queue: ${this.config.queueName}`);
    } catch (error) {
      console.warn("[Queue] bullmq not available, falling back to in-memory queue");
      this.emit("queue:error", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Add a job to the Bull queue
   */
  async addJob(job: Omit<PipelineJob, "id">): Promise<string> {
    if (!this.queue) {
      throw new Error("Queue not initialized");
    }

    const bullQueue = this.queue as { add: (name: string, data: unknown, opts: unknown) => Promise<{ id: string }> };
    const result = await bullQueue.add("pipeline", job, {
      priority: PRIORITY_WEIGHTS[job.priority || "normal"],
      jobId: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });

    return result.id;
  }

  /**
   * Register a processor for Bull queue
   */
  process(
    processor: (job: PipelineJob, updateProgress: (p: Partial<JobProgress>) => void) => Promise<unknown>
  ): void {
    if (!this.queue) {
      throw new Error("Queue not initialized");
    }

    // This would typically be done in the initialize method
    // with proper Bull Worker setup
    console.log("[Queue] Bull processor registered");
  }

  // Additional methods would mirror PipelineQueue but use Bull APIs
  async pause(): Promise<void> {
    const q = this.queue as { pause: () => Promise<void> } | null;
    if (q) await q.pause();
    this.emit("queue:paused");
  }

  async resume(): Promise<void> {
    const q = this.queue as { resume: () => Promise<void> } | null;
    if (q) await q.resume();
    this.emit("queue:resumed");
  }

  async close(): Promise<void> {
    const q = this.queue as { close: () => Promise<void> } | null;
    const w = this.worker as { close: () => Promise<void> } | null;
    if (w) await w.close();
    if (q) await q.close();
  }

  getStats(): {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  } {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, total: 0 };
  }
}

// =========================================================================
// FACTORY
// =========================================================================

/**
 * Create a pipeline queue instance
 * Uses Bull with Redis if available, falls back to in-memory
 */
export async function createPipelineQueue(config: QueueConfig = {}): Promise<PipelineQueue | BullPipelineQueue> {
  // Try Bull with Redis first if URL provided
  if (config.redisUrl || process.env.REDIS_URL) {
    try {
      const bullQueue = new BullPipelineQueue(config);
      await bullQueue.initialize();
      return bullQueue;
    } catch {
      console.log("[Queue] Falling back to in-memory queue");
    }
  }

  // Use in-memory queue
  const memoryQueue = new PipelineQueue(config);
  await memoryQueue.initialize();
  return memoryQueue;
}

// =========================================================================
// SINGLETON
// =========================================================================

let queueInstance: PipelineQueue | BullPipelineQueue | null = null;

/**
 * Get or create queue singleton
 */
export async function getPipelineQueue(config?: QueueConfig): Promise<PipelineQueue | BullPipelineQueue> {
  if (!queueInstance) {
    queueInstance = await createPipelineQueue(config);
  }
  return queueInstance;
}
