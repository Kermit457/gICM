/**
 * Pipeline Queue Workers
 *
 * Background workers that process pipeline execution jobs.
 * Integrates with AnalyticsManager for cost/token tracking.
 */

import { EventEmitter } from "eventemitter3";
import type { PipelineJob, PipelineStep, JobProgress, PipelineQueue, BullPipelineQueue } from "./pipeline-queue.js";
import type { AnalyticsManager } from "../analytics.js";

// =========================================================================
// TYPES
// =========================================================================

export interface WorkerConfig {
  /** Analytics manager for tracking */
  analytics?: AnalyticsManager;
  /** Tool execution function */
  toolExecutor?: ToolExecutor;
  /** Max step duration in ms (default: 60000) */
  stepTimeout?: number;
  /** Enable parallel step execution (default: true) */
  parallelSteps?: boolean;
}

export type ToolExecutor = (
  tool: string,
  inputs: Record<string, unknown>,
  context: ExecutionContext
) => Promise<ToolResult>;

export interface ToolResult {
  success: boolean;
  output: unknown;
  error?: string;
  tokens?: {
    input: number;
    output: number;
  };
  duration?: number;
}

export interface ExecutionContext {
  jobId: string;
  executionId: string;
  pipelineId: string;
  stepResults: Map<string, ToolResult>;
  metadata: Record<string, unknown>;
}

export interface WorkerEvents {
  "step:started": (jobId: string, stepId: string, tool: string) => void;
  "step:completed": (jobId: string, stepId: string, result: ToolResult) => void;
  "step:failed": (jobId: string, stepId: string, error: Error) => void;
  "pipeline:started": (jobId: string, executionId: string) => void;
  "pipeline:completed": (jobId: string, result: PipelineResult) => void;
  "pipeline:failed": (jobId: string, error: Error) => void;
}

export interface PipelineResult {
  executionId: string;
  pipelineId: string;
  status: "completed" | "failed" | "partial";
  stepResults: Record<string, ToolResult>;
  totalDuration: number;
  totalTokens: { input: number; output: number; total: number };
  completedSteps: string[];
  failedSteps: string[];
}

// =========================================================================
// DEFAULT TOOL EXECUTOR (SIMULATION)
// =========================================================================

/**
 * Default tool executor that simulates tool execution.
 * Replace with real tool implementations in production.
 */
const defaultToolExecutor: ToolExecutor = async (tool, inputs, context) => {
  // Simulate processing time
  const duration = 500 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, duration));

  // Simulate token usage
  const tokens = {
    input: Math.floor(300 + Math.random() * 700),
    output: Math.floor(100 + Math.random() * 400),
  };

  // Simulate occasional failures (5% chance)
  if (Math.random() < 0.05) {
    return {
      success: false,
      output: null,
      error: `Simulated failure for tool: ${tool}`,
      tokens,
      duration,
    };
  }

  // Generate mock output based on tool type
  let output: unknown;
  switch (tool) {
    case "hunter_discover":
      output = {
        opportunities: [
          { name: "Token A", score: 85, source: "twitter" },
          { name: "Token B", score: 72, source: "github" },
        ],
      };
      break;
    case "hunter_score":
      output = {
        scored: (inputs.opportunities as unknown[])?.map((o, i) => ({
          ...o,
          finalScore: 80 - i * 5,
        })),
      };
      break;
    case "growth_generate_blog":
      output = {
        title: inputs.topic || "Generated Blog Post",
        content: "Lorem ipsum dolor sit amet...",
        wordCount: 1500,
      };
      break;
    case "growth_keyword_research":
      output = {
        keywords: ["crypto", "blockchain", "defi", "web3"],
        volumes: [10000, 8000, 5000, 3000],
      };
      break;
    case "money_dca_trade":
      output = {
        executed: true,
        amount: inputs.amount,
        asset: inputs.asset,
        txId: `tx_${Date.now()}`,
      };
      break;
    case "money_treasury_status":
      output = {
        balance: { SOL: 100, USDC: 5000 },
        allocations: { trading: 40, growth: 30, reserve: 30 },
      };
      break;
    case "autonomy_classify_risk":
      output = {
        riskScore: 35,
        level: "low",
        factors: { financial: 20, reversibility: 5, visibility: 10 },
      };
      break;
    default:
      output = {
        tool,
        inputs,
        executedAt: new Date().toISOString(),
      };
  }

  return {
    success: true,
    output,
    tokens,
    duration,
  };
};

// =========================================================================
// PIPELINE WORKER
// =========================================================================

export class PipelineWorker extends EventEmitter<WorkerEvents> {
  private config: Required<WorkerConfig>;
  private isRunning = false;

  constructor(config: WorkerConfig = {}) {
    super();
    this.config = {
      analytics: config.analytics || undefined!,
      toolExecutor: config.toolExecutor || defaultToolExecutor,
      stepTimeout: config.stepTimeout || 60000,
      parallelSteps: config.parallelSteps !== false,
    };
  }

  /**
   * Register this worker with a queue
   */
  register(queue: PipelineQueue | BullPipelineQueue): void {
    queue.process(async (job, updateProgress) => {
      return this.processJob(job, updateProgress);
    });
    this.isRunning = true;
    console.log("[Worker] Registered with queue");
  }

  /**
   * Process a pipeline job
   */
  async processJob(
    job: PipelineJob,
    updateProgress: (p: Partial<JobProgress>) => void
  ): Promise<PipelineResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const startTime = Date.now();

    // Create execution context
    const context: ExecutionContext = {
      jobId: job.id,
      executionId,
      pipelineId: job.pipelineId,
      stepResults: new Map(),
      metadata: job.metadata || {},
    };

    // Start analytics tracking
    if (this.config.analytics) {
      this.config.analytics.startExecution(job.pipelineId, job.pipelineName, job.steps.length);
    }

    this.emit("pipeline:started", job.id, executionId);

    const completedSteps: string[] = [];
    const failedSteps: string[] = [];
    const stepResults: Record<string, ToolResult> = {};
    let totalTokens = { input: 0, output: 0, total: 0 };

    try {
      // Build dependency graph
      const stepMap = new Map(job.steps.map((s) => [s.id, s]));
      const completed = new Set<string>();
      const pending = new Set(job.steps.map((s) => s.id));

      while (pending.size > 0) {
        // Find steps that can run (all dependencies satisfied)
        const ready: PipelineStep[] = [];
        for (const stepId of pending) {
          const step = stepMap.get(stepId)!;
          const deps = step.dependsOn || [];
          if (deps.every((d) => completed.has(d))) {
            ready.push(step);
          }
        }

        if (ready.length === 0 && pending.size > 0) {
          throw new Error("Circular dependency detected or missing dependency");
        }

        // Execute ready steps
        const stepPromises = ready.map(async (step) => {
          // Resolve inputs from previous steps
          const resolvedInputs = this.resolveInputs(step.inputs || {}, context);

          this.emit("step:started", job.id, step.id, step.tool);

          // Record step start in analytics
          if (this.config.analytics) {
            this.config.analytics.recordStep(executionId, step.id, step.tool, "running");
          }

          try {
            // Execute tool with timeout
            const result = await Promise.race([
              this.config.toolExecutor(step.tool, resolvedInputs, context),
              new Promise<ToolResult>((_, reject) =>
                setTimeout(() => reject(new Error("Step timeout")), this.config.stepTimeout)
              ),
            ]);

            // Store result
            context.stepResults.set(step.id, result);
            stepResults[step.id] = result;

            if (result.success) {
              completedSteps.push(step.id);
              completed.add(step.id);

              // Track tokens
              if (result.tokens) {
                totalTokens.input += result.tokens.input;
                totalTokens.output += result.tokens.output;
                totalTokens.total += result.tokens.input + result.tokens.output;
              }

              // Record step completion in analytics
              if (this.config.analytics) {
                this.config.analytics.recordStep(
                  executionId,
                  step.id,
                  step.tool,
                  "completed",
                  result.tokens
                );
              }

              this.emit("step:completed", job.id, step.id, result);
            } else {
              failedSteps.push(step.id);
              completed.add(step.id); // Mark as done (failed)

              // Record step failure in analytics
              if (this.config.analytics) {
                this.config.analytics.recordStep(
                  executionId,
                  step.id,
                  step.tool,
                  "failed",
                  result.tokens,
                  result.error
                );
              }

              this.emit("step:failed", job.id, step.id, new Error(result.error || "Unknown error"));
            }

            return { step, result };
          } catch (error) {
            const errorResult: ToolResult = {
              success: false,
              output: null,
              error: error instanceof Error ? error.message : String(error),
            };

            context.stepResults.set(step.id, errorResult);
            stepResults[step.id] = errorResult;
            failedSteps.push(step.id);
            completed.add(step.id);

            // Record step failure in analytics
            if (this.config.analytics) {
              this.config.analytics.recordStep(
                executionId,
                step.id,
                step.tool,
                "failed",
                undefined,
                errorResult.error
              );
            }

            this.emit("step:failed", job.id, step.id, error instanceof Error ? error : new Error(String(error)));

            return { step, result: errorResult };
          } finally {
            pending.delete(step.id);
          }
        });

        // Execute in parallel or sequentially based on config
        if (this.config.parallelSteps) {
          await Promise.all(stepPromises);
        } else {
          for (const promise of stepPromises) {
            await promise;
          }
        }

        // Update progress
        const progress = Math.round((completed.size / job.steps.length) * 100);
        updateProgress({
          progress,
          completedSteps: [...completedSteps],
          failedSteps: [...failedSteps],
        });
      }

      // Determine final status
      const status: PipelineResult["status"] =
        failedSteps.length === 0
          ? "completed"
          : completedSteps.length > 0
          ? "partial"
          : "failed";

      const result: PipelineResult = {
        executionId,
        pipelineId: job.pipelineId,
        status,
        stepResults,
        totalDuration: Date.now() - startTime,
        totalTokens,
        completedSteps,
        failedSteps,
      };

      // Complete analytics tracking
      if (this.config.analytics) {
        this.config.analytics.completeExecution(
          executionId,
          status === "completed" ? "completed" : "failed",
          failedSteps.length > 0 ? `Failed steps: ${failedSteps.join(", ")}` : undefined
        );
      }

      this.emit("pipeline:completed", job.id, result);
      return result;
    } catch (error) {
      // Complete analytics tracking with error
      if (this.config.analytics) {
        this.config.analytics.completeExecution(
          executionId,
          "failed",
          error instanceof Error ? error.message : String(error)
        );
      }

      this.emit("pipeline:failed", job.id, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Resolve step inputs from previous step outputs
   */
  private resolveInputs(
    inputs: Record<string, unknown>,
    context: ExecutionContext
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === "string" && value.startsWith("$")) {
        // Reference to previous step output: $stepId.path.to.value
        const [stepId, ...path] = value.slice(1).split(".");
        const stepResult = context.stepResults.get(stepId);

        if (stepResult?.success && stepResult.output) {
          let val: unknown = stepResult.output;
          for (const p of path) {
            if (val && typeof val === "object" && p in val) {
              val = (val as Record<string, unknown>)[p];
            } else {
              val = undefined;
              break;
            }
          }
          resolved[key] = val;
        } else {
          resolved[key] = undefined;
        }
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }
}

// =========================================================================
// AGENT EXECUTOR INTEGRATION
// =========================================================================

/**
 * Create a tool executor backed by the AgentExecutor
 * This bridges the worker to real gICM agents
 */
export function createAgentToolExecutor(): ToolExecutor {
  // Lazy import to avoid circular dependencies
  return async (tool, inputs, context) => {
    const { getAgentExecutor } = await import("../execution/agent-executor.js");
    const executor = getAgentExecutor();

    const result = await executor.execute(tool, inputs, {
      executionId: context.executionId,
      stepId: tool, // Use tool as step ID for single execution
      pipelineId: context.pipelineId,
      inputs,
      previousResults: Object.fromEntries(context.stepResults),
    });

    return {
      success: result.success,
      output: result.data,
      error: result.error,
      tokens: result.tokensUsed
        ? { input: Math.floor(result.tokensUsed * 0.7), output: Math.floor(result.tokensUsed * 0.3) }
        : undefined,
      duration: result.duration,
    };
  };
}

// =========================================================================
// FACTORY
// =========================================================================

/**
 * Create and register a pipeline worker
 */
export function createPipelineWorker(
  queue: PipelineQueue | BullPipelineQueue,
  config: WorkerConfig = {}
): PipelineWorker {
  const worker = new PipelineWorker(config);
  worker.register(queue);
  return worker;
}

/**
 * Create a worker with real agent execution
 */
export function createAgentWorker(
  queue: PipelineQueue | BullPipelineQueue,
  config: Omit<WorkerConfig, "toolExecutor"> = {}
): PipelineWorker {
  const worker = new PipelineWorker({
    ...config,
    toolExecutor: createAgentToolExecutor(),
  });
  worker.register(queue);
  return worker;
}
