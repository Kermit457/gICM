/**
 * Queue Module Tests
 * Phase 17B: Core Module Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  PipelineQueue,
  type PipelineJob,
  type JobProgress,
} from "../queue/pipeline-queue.js";
import { PipelineWorker, type ToolResult, type ExecutionContext } from "../queue/workers.js";

describe("PipelineQueue", () => {
  let queue: PipelineQueue;

  beforeEach(async () => {
    queue = new PipelineQueue({
      concurrency: 2,
      defaultTimeout: 5000,
    });
    await queue.initialize();
  });

  afterEach(async () => {
    await queue.close();
  });

  // ===========================================================================
  // INITIALIZATION TESTS
  // ===========================================================================

  describe("initialization", () => {
    it("should initialize with default config", async () => {
      const defaultQueue = new PipelineQueue();
      await defaultQueue.initialize();

      expect(defaultQueue).toBeDefined();
      await defaultQueue.close();
    });

    it("should emit queue:ready on initialize", async () => {
      const newQueue = new PipelineQueue();
      const handler = vi.fn();
      newQueue.on("queue:ready", handler);

      await newQueue.initialize();

      expect(handler).toHaveBeenCalled();
      await newQueue.close();
    });

    it("should accept custom config", () => {
      const customQueue = new PipelineQueue({
        queueName: "test-queue",
        concurrency: 10,
        defaultTimeout: 10000,
        maxRetries: 5,
      });

      expect(customQueue).toBeDefined();
    });
  });

  // ===========================================================================
  // ADD JOB TESTS
  // ===========================================================================

  describe("addJob", () => {
    it("should add a job and return job ID", async () => {
      const jobId = await queue.addJob({
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: { foo: "bar" },
        steps: [{ id: "step-1", tool: "test_tool" }],
      });

      expect(jobId).toMatch(/^job_\d+_\d+$/);
    });

    it("should emit job:added event", async () => {
      const handler = vi.fn();
      queue.on("job:added", handler);

      await queue.addJob({
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [],
      });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].pipelineName).toBe("Test Pipeline");
    });

    it("should initialize job progress as waiting", async () => {
      const jobId = await queue.addJob({
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [],
      });

      const progress = queue.getProgress(jobId);
      expect(progress?.status).toBe("waiting");
      expect(progress?.progress).toBe(0);
      expect(progress?.completedSteps).toEqual([]);
      expect(progress?.failedSteps).toEqual([]);
    });

    it("should assign default normal priority", async () => {
      const jobId = await queue.addJob({
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [],
      });

      const job = queue.getJob(jobId);
      expect(job?.priority).toBe("normal");
    });

    it("should respect custom priority", async () => {
      const jobId = await queue.addJob({
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [],
        priority: "critical",
      });

      const job = queue.getJob(jobId);
      expect(job?.priority).toBe("critical");
    });
  });

  // ===========================================================================
  // BULK ADD TESTS
  // ===========================================================================

  describe("addBulk", () => {
    it("should add multiple jobs at once", async () => {
      const jobIds = await queue.addBulk([
        { pipelineId: "p1", pipelineName: "P1", inputs: {}, steps: [] },
        { pipelineId: "p2", pipelineName: "P2", inputs: {}, steps: [] },
        { pipelineId: "p3", pipelineName: "P3", inputs: {}, steps: [] },
      ]);

      expect(jobIds).toHaveLength(3);
      expect(queue.getStats().total).toBe(3);
    });
  });

  // ===========================================================================
  // RETRIEVAL TESTS
  // ===========================================================================

  describe("getJob", () => {
    it("should return job by ID", async () => {
      const jobId = await queue.addJob({
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: { key: "value" },
        steps: [{ id: "s1", tool: "tool1" }],
      });

      const job = queue.getJob(jobId);

      expect(job).toBeDefined();
      expect(job?.pipelineId).toBe("pipeline-1");
      expect(job?.inputs).toEqual({ key: "value" });
    });

    it("should return undefined for non-existent job", () => {
      const job = queue.getJob("non-existent-id");
      expect(job).toBeUndefined();
    });
  });

  describe("getProgress", () => {
    it("should return progress for existing job", async () => {
      const jobId = await queue.addJob({
        pipelineId: "pipeline-1",
        pipelineName: "Test",
        inputs: {},
        steps: [],
      });

      const progress = queue.getProgress(jobId);

      expect(progress).toBeDefined();
      expect(progress?.jobId).toBe(jobId);
    });

    it("should return undefined for non-existent job", () => {
      const progress = queue.getProgress("non-existent");
      expect(progress).toBeUndefined();
    });
  });

  describe("getJobsByStatus", () => {
    it("should filter jobs by status", async () => {
      await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });
      await queue.addJob({
        pipelineId: "p2",
        pipelineName: "P2",
        inputs: {},
        steps: [],
      });

      const waitingJobs = queue.getJobsByStatus("waiting");
      expect(waitingJobs.length).toBeGreaterThanOrEqual(2);
    });

    it("should return empty array when no jobs match", () => {
      const completedJobs = queue.getJobsByStatus("completed");
      expect(completedJobs).toEqual([]);
    });
  });

  // ===========================================================================
  // STATISTICS TESTS
  // ===========================================================================

  describe("getStats", () => {
    it("should return correct initial stats", () => {
      const stats = queue.getStats();

      expect(stats).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
      });
    });

    it("should update stats when jobs are added", async () => {
      await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      const stats = queue.getStats();
      expect(stats.waiting).toBe(1);
      expect(stats.total).toBe(1);
    });
  });

  // ===========================================================================
  // PAUSE/RESUME TESTS
  // ===========================================================================

  describe("pause", () => {
    it("should emit queue:paused event", async () => {
      const handler = vi.fn();
      queue.on("queue:paused", handler);

      await queue.pause();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("resume", () => {
    it("should emit queue:resumed event", async () => {
      const handler = vi.fn();
      queue.on("queue:resumed", handler);

      await queue.pause();
      await queue.resume();

      expect(handler).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // REMOVE JOB TESTS
  // ===========================================================================

  describe("removeJob", () => {
    it("should remove job from queue", async () => {
      const jobId = await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      const result = await queue.removeJob(jobId);

      expect(result).toBe(true);
      expect(queue.getJob(jobId)).toBeUndefined();
      expect(queue.getProgress(jobId)).toBeUndefined();
    });

    it("should return true even for non-existent job", async () => {
      const result = await queue.removeJob("non-existent");
      expect(result).toBe(true);
    });
  });

  // ===========================================================================
  // RETRY JOB TESTS
  // ===========================================================================

  describe("retryJob", () => {
    it("should return false for non-failed job", async () => {
      const jobId = await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      const result = await queue.retryJob(jobId);
      expect(result).toBe(false);
    });

    it("should return false for non-existent job", async () => {
      const result = await queue.retryJob("non-existent");
      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // CLEAN TESTS
  // ===========================================================================

  describe("clean", () => {
    it("should return 0 when no old jobs to clean", async () => {
      await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      const removed = await queue.clean(86400000); // 24 hours
      expect(removed).toBe(0);
    });
  });

  // ===========================================================================
  // PROCESS TESTS
  // ===========================================================================

  describe("process", () => {
    it("should register processor and start processing", async () => {
      const processor = vi.fn().mockResolvedValue({ success: true });

      queue.process(processor);

      const jobId = await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(processor).toHaveBeenCalled();
    });

    it("should emit job:started when processing begins", async () => {
      const handler = vi.fn();
      queue.on("job:started", handler);

      queue.process(vi.fn().mockResolvedValue({ success: true }));

      await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalled();
    });

    it("should emit job:completed on successful processing", async () => {
      const handler = vi.fn();
      queue.on("job:completed", handler);

      queue.process(vi.fn().mockResolvedValue({ result: "done" }));

      await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalled();
    });

    it("should emit job:failed on processing error", async () => {
      const handler = vi.fn();
      queue.on("job:failed", handler);

      queue.process(vi.fn().mockRejectedValue(new Error("Test error")));

      await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalled();
    });

    it("should update progress to completed on success", async () => {
      queue.process(vi.fn().mockResolvedValue({ result: "done" }));

      const jobId = await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const progress = queue.getProgress(jobId);
      expect(progress?.status).toBe("completed");
      expect(progress?.progress).toBe(100);
    });

    it("should update progress to failed on error", async () => {
      queue.process(vi.fn().mockRejectedValue(new Error("Test error")));

      const jobId = await queue.addJob({
        pipelineId: "p1",
        pipelineName: "P1",
        inputs: {},
        steps: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const progress = queue.getProgress(jobId);
      expect(progress?.status).toBe("failed");
      expect(progress?.error).toBe("Test error");
    });
  });

  // ===========================================================================
  // PRIORITY ORDERING TESTS
  // ===========================================================================

  describe("priority ordering", () => {
    it("should process critical jobs before normal jobs", async () => {
      const processedOrder: string[] = [];

      // Add jobs before registering processor
      await queue.pause();

      await queue.addJob({
        pipelineId: "normal-1",
        pipelineName: "Normal 1",
        inputs: {},
        steps: [],
        priority: "normal",
      });

      await queue.addJob({
        pipelineId: "critical-1",
        pipelineName: "Critical 1",
        inputs: {},
        steps: [],
        priority: "critical",
      });

      // Register processor that records order
      queue.process(async (job) => {
        processedOrder.push(job.pipelineId);
        return { success: true };
      });

      await queue.resume();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Critical should be processed first
      expect(processedOrder[0]).toBe("critical-1");
    });
  });

  // ===========================================================================
  // CONCURRENCY TESTS
  // ===========================================================================

  describe("concurrency", () => {
    it("should respect concurrency limit", async () => {
      let activeJobs = 0;
      let maxActive = 0;

      queue.process(async () => {
        activeJobs++;
        maxActive = Math.max(maxActive, activeJobs);
        await new Promise((resolve) => setTimeout(resolve, 100));
        activeJobs--;
        return { success: true };
      });

      // Add more jobs than concurrency limit
      await queue.addBulk([
        { pipelineId: "p1", pipelineName: "P1", inputs: {}, steps: [] },
        { pipelineId: "p2", pipelineName: "P2", inputs: {}, steps: [] },
        { pipelineId: "p3", pipelineName: "P3", inputs: {}, steps: [] },
        { pipelineId: "p4", pipelineName: "P4", inputs: {}, steps: [] },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should never exceed concurrency limit of 2
      expect(maxActive).toBeLessThanOrEqual(2);
    });
  });
});

// =============================================================================
// PIPELINE WORKER TESTS
// =============================================================================

describe("PipelineWorker", () => {
  let queue: PipelineQueue;
  let worker: PipelineWorker;

  beforeEach(async () => {
    queue = new PipelineQueue({ concurrency: 1 });
    await queue.initialize();
    worker = new PipelineWorker({
      stepTimeout: 5000,
      parallelSteps: false,
    });
  });

  afterEach(async () => {
    await queue.close();
  });

  // ===========================================================================
  // REGISTRATION TESTS
  // ===========================================================================

  describe("register", () => {
    it("should register with a queue", () => {
      worker.register(queue);
      // Worker is registered (processor is set on queue)
      expect(worker).toBeDefined();
    });
  });

  // ===========================================================================
  // JOB PROCESSING TESTS
  // ===========================================================================

  describe("processJob", () => {
    it("should emit pipeline:started event", async () => {
      const handler = vi.fn();

      const mockToolExecutor = vi.fn().mockResolvedValue({
        success: true,
        output: { data: "test" },
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
      });
      workerWithExecutor.on("pipeline:started", handler);

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [{ id: "step-1", tool: "test_tool" }],
      };

      const updateProgress = vi.fn();

      await workerWithExecutor.processJob(job, updateProgress);

      expect(handler).toHaveBeenCalled();
    });

    it("should execute all steps in order", async () => {
      const executionOrder: string[] = [];
      const mockToolExecutor = vi.fn().mockImplementation(async (tool) => {
        executionOrder.push(tool);
        return { success: true, output: {} };
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
        parallelSteps: false,
      });

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [
          { id: "step-1", tool: "tool_a" },
          { id: "step-2", tool: "tool_b", dependsOn: ["step-1"] },
          { id: "step-3", tool: "tool_c", dependsOn: ["step-2"] },
        ],
      };

      const updateProgress = vi.fn();
      const result = await workerWithExecutor.processJob(job, updateProgress);

      expect(executionOrder).toEqual(["tool_a", "tool_b", "tool_c"]);
      expect(result.completedSteps).toHaveLength(3);
    });

    it("should handle step failures", async () => {
      const mockToolExecutor = vi.fn().mockImplementation(async (tool) => {
        if (tool === "failing_tool") {
          return { success: false, output: null, error: "Tool failed" };
        }
        return { success: true, output: {} };
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
      });

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [
          { id: "step-1", tool: "good_tool" },
          { id: "step-2", tool: "failing_tool" },
        ],
      };

      const updateProgress = vi.fn();
      const result = await workerWithExecutor.processJob(job, updateProgress);

      expect(result.completedSteps).toContain("step-1");
      expect(result.failedSteps).toContain("step-2");
      expect(result.status).toBe("partial");
    });

    it("should resolve inputs from previous steps", async () => {
      let capturedInputs: Record<string, unknown> = {};

      const mockToolExecutor = vi.fn().mockImplementation(async (tool, inputs) => {
        if (tool === "second_tool") {
          capturedInputs = inputs;
        }
        return {
          success: true,
          output: { result: "first_result", nested: { value: 42 } },
        };
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
        parallelSteps: false,
      });

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [
          { id: "step-1", tool: "first_tool" },
          {
            id: "step-2",
            tool: "second_tool",
            dependsOn: ["step-1"],
            inputs: {
              fromPrevious: "$step-1.result",
              nestedValue: "$step-1.nested.value",
              static: "static_value",
            },
          },
        ],
      };

      const updateProgress = vi.fn();
      await workerWithExecutor.processJob(job, updateProgress);

      expect(capturedInputs).toEqual({
        fromPrevious: "first_result",
        nestedValue: 42,
        static: "static_value",
      });
    });

    it("should track token usage", async () => {
      const mockToolExecutor = vi.fn().mockResolvedValue({
        success: true,
        output: {},
        tokens: { input: 100, output: 50 },
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
      });

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [
          { id: "step-1", tool: "tool_1" },
          { id: "step-2", tool: "tool_2" },
        ],
      };

      const updateProgress = vi.fn();
      const result = await workerWithExecutor.processJob(job, updateProgress);

      expect(result.totalTokens.input).toBe(200);
      expect(result.totalTokens.output).toBe(100);
      expect(result.totalTokens.total).toBe(300);
    });

    it("should emit step events", async () => {
      const stepStartedHandler = vi.fn();
      const stepCompletedHandler = vi.fn();

      const mockToolExecutor = vi.fn().mockResolvedValue({
        success: true,
        output: {},
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
      });

      workerWithExecutor.on("step:started", stepStartedHandler);
      workerWithExecutor.on("step:completed", stepCompletedHandler);

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [{ id: "step-1", tool: "test_tool" }],
      };

      const updateProgress = vi.fn();
      await workerWithExecutor.processJob(job, updateProgress);

      expect(stepStartedHandler).toHaveBeenCalledWith("job-1", "step-1", "test_tool");
      expect(stepCompletedHandler).toHaveBeenCalled();
    });

    it("should emit pipeline:completed event", async () => {
      const handler = vi.fn();

      const mockToolExecutor = vi.fn().mockResolvedValue({
        success: true,
        output: {},
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
      });
      workerWithExecutor.on("pipeline:completed", handler);

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [{ id: "step-1", tool: "test_tool" }],
      };

      const updateProgress = vi.fn();
      await workerWithExecutor.processJob(job, updateProgress);

      expect(handler).toHaveBeenCalled();
      const [jobId, result] = handler.mock.calls[0];
      expect(jobId).toBe("job-1");
      expect(result.status).toBe("completed");
    });

    it("should detect circular dependencies", async () => {
      const mockToolExecutor = vi.fn().mockResolvedValue({
        success: true,
        output: {},
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
      });

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [
          { id: "step-1", tool: "tool_a", dependsOn: ["step-2"] },
          { id: "step-2", tool: "tool_b", dependsOn: ["step-1"] },
        ],
      };

      const updateProgress = vi.fn();

      await expect(
        workerWithExecutor.processJob(job, updateProgress)
      ).rejects.toThrow("Circular dependency");
    });

    it("should call updateProgress during execution", async () => {
      const mockToolExecutor = vi.fn().mockResolvedValue({
        success: true,
        output: {},
      });

      const workerWithExecutor = new PipelineWorker({
        toolExecutor: mockToolExecutor,
      });

      const job: PipelineJob = {
        id: "job-1",
        pipelineId: "pipeline-1",
        pipelineName: "Test Pipeline",
        inputs: {},
        steps: [
          { id: "step-1", tool: "tool_1" },
          { id: "step-2", tool: "tool_2" },
        ],
      };

      const updateProgress = vi.fn();
      await workerWithExecutor.processJob(job, updateProgress);

      expect(updateProgress).toHaveBeenCalled();
      // Should have been called with progress updates
      const lastCall = updateProgress.mock.calls[updateProgress.mock.calls.length - 1][0];
      expect(lastCall.progress).toBe(100);
    });
  });
});
