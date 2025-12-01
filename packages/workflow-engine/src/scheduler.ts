/**
 * Workflow Scheduler
 * Handles parallel execution and dependency resolution
 */

import type { WorkflowStep, StepResult } from "./types.js";
import { StepExecutor, ExecutionContext } from "./executor.js";

interface SchedulerOptions {
  maxConcurrency: number;
}

export class Scheduler {
  private executor: StepExecutor;
  private options: SchedulerOptions;

  constructor(executor: StepExecutor, options: Partial<SchedulerOptions> = {}) {
    this.executor = executor;
    this.options = {
      maxConcurrency: options.maxConcurrency ?? 5,
    };
  }

  /**
   * Schedule and execute all steps respecting dependencies
   */
  async execute(
    steps: WorkflowStep[],
    context: ExecutionContext,
    onStepComplete?: (result: StepResult) => void
  ): Promise<Map<string, StepResult>> {
    const results = new Map<string, StepResult>();
    const pending = new Set(steps.map((s) => s.id));
    const running = new Set<string>();
    const stepMap = new Map(steps.map((s) => [s.id, s]));

    while (pending.size > 0) {
      // Find steps ready to run (all dependencies satisfied)
      const ready = Array.from(pending).filter((stepId) => {
        const step = stepMap.get(stepId)!;
        const deps = step.dependsOn || [];
        return deps.every((depId) => results.has(depId));
      });

      if (ready.length === 0 && running.size === 0) {
        // Circular dependency or invalid workflow
        throw new Error(
          `Workflow deadlock: Cannot resolve dependencies for steps: ${Array.from(pending).join(", ")}`
        );
      }

      // Limit concurrency
      const canRun = Math.min(
        ready.length,
        this.options.maxConcurrency - running.size
      );

      if (canRun > 0) {
        const toRun = ready.slice(0, canRun);

        // Start steps in parallel
        const promises = toRun.map(async (stepId) => {
          pending.delete(stepId);
          running.add(stepId);

          const step = stepMap.get(stepId)!;

          // Check if any dependency failed (for fail-fast behavior)
          const depFailed = (step.dependsOn || []).some((depId) => {
            const depResult = results.get(depId);
            return depResult?.status === "failed";
          });

          let result: StepResult;

          if (depFailed && step.onError === "fail") {
            // Skip this step due to failed dependency
            result = {
              stepId,
              status: "skipped",
              error: "Skipped due to failed dependency",
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              duration: 0,
              retries: 0,
            };
          } else {
            // Update context with current results
            context.stepResults = results;
            result = await this.executor.execute(step, context);
          }

          running.delete(stepId);
          results.set(stepId, result);

          if (onStepComplete) {
            onStepComplete(result);
          }

          return result;
        });

        // Wait for at least one to complete before checking for more
        await Promise.race(promises);
      } else if (running.size > 0) {
        // Wait a bit for running steps to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Build execution order (topological sort)
   */
  getExecutionOrder(steps: WorkflowStep[]): string[][] {
    const levels: string[][] = [];
    const remaining = new Set(steps.map((s) => s.id));
    const completed = new Set<string>();
    const stepMap = new Map(steps.map((s) => [s.id, s]));

    while (remaining.size > 0) {
      const level: string[] = [];

      for (const stepId of remaining) {
        const step = stepMap.get(stepId)!;
        const deps = step.dependsOn || [];

        if (deps.every((d) => completed.has(d))) {
          level.push(stepId);
        }
      }

      if (level.length === 0) {
        throw new Error(
          `Circular dependency detected in workflow steps: ${Array.from(remaining).join(", ")}`
        );
      }

      for (const stepId of level) {
        remaining.delete(stepId);
        completed.add(stepId);
      }

      levels.push(level);
    }

    return levels;
  }

  /**
   * Validate workflow steps for dependency issues
   */
  validate(steps: WorkflowStep[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const stepIds = new Set(steps.map((s) => s.id));

    // Check for duplicate IDs
    if (stepIds.size !== steps.length) {
      errors.push("Duplicate step IDs found");
    }

    // Check for missing dependencies
    for (const step of steps) {
      for (const depId of step.dependsOn || []) {
        if (!stepIds.has(depId)) {
          errors.push(`Step "${step.id}" depends on non-existent step "${depId}"`);
        }
      }
    }

    // Check for circular dependencies
    try {
      this.getExecutionOrder(steps);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Circular")) {
        errors.push(error.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
