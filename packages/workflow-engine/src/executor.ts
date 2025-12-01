/**
 * Step Executor
 * Handles execution of individual workflow steps with retry logic
 */

import { EventEmitter } from "eventemitter3";
import type {
  WorkflowStep,
  StepResult,
  StepStatus,
  AgentExecutor,
} from "./types.js";

interface ExecutorEvents {
  stepStarted: (stepId: string) => void;
  stepCompleted: (result: StepResult) => void;
  stepFailed: (result: StepResult) => void;
  stepRetrying: (stepId: string, attempt: number) => void;
}

export interface ExecutionContext {
  variables: Record<string, unknown>;
  stepResults: Map<string, StepResult>;
}

export class StepExecutor extends EventEmitter<ExecutorEvents> {
  private agentExecutor: AgentExecutor;

  constructor(agentExecutor: AgentExecutor) {
    super();
    this.agentExecutor = agentExecutor;
  }

  /**
   * Execute a single step with retry logic
   */
  async execute(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<StepResult> {
    const startedAt = new Date().toISOString();
    let lastError: Error | null = null;
    let retries = 0;

    // Check condition if present
    if (step.condition) {
      const shouldRun = this.evaluateCondition(step.condition, context);
      if (!shouldRun) {
        return {
          stepId: step.id,
          status: "skipped",
          startedAt,
          completedAt: new Date().toISOString(),
          duration: 0,
          retries: 0,
        };
      }
    }

    this.emit("stepStarted", step.id);

    // Retry loop
    while (retries <= step.retryCount) {
      try {
        // Prepare input with variable substitution
        const preparedInput = this.prepareInput(step.input, context);

        // Execute with timeout
        const output = await this.executeWithTimeout(
          step.agent,
          preparedInput,
          step.timeout
        );

        const completedAt = new Date().toISOString();
        const result: StepResult = {
          stepId: step.id,
          status: "completed",
          output,
          startedAt,
          completedAt,
          duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
          retries,
        };

        this.emit("stepCompleted", result);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;

        if (retries <= step.retryCount) {
          this.emit("stepRetrying", step.id, retries);
          await this.delay(Math.min(1000 * Math.pow(2, retries), 10000)); // Exponential backoff
        }
      }
    }

    // All retries exhausted
    const completedAt = new Date().toISOString();
    const result: StepResult = {
      stepId: step.id,
      status: step.onError === "skip" ? "skipped" : "failed",
      error: lastError?.message || "Unknown error",
      startedAt,
      completedAt,
      duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      retries: retries - 1,
    };

    this.emit("stepFailed", result);
    return result;
  }

  /**
   * Execute agent with timeout
   */
  private async executeWithTimeout(
    agentId: string,
    input: Record<string, unknown>,
    timeout: number
  ): Promise<unknown> {
    return Promise.race([
      this.agentExecutor.execute(agentId, input),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Step timed out after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(
    condition: string,
    context: ExecutionContext
  ): boolean {
    try {
      // Create a safe evaluation context
      const evalContext = {
        variables: context.variables,
        results: Object.fromEntries(
          Array.from(context.stepResults.entries()).map(([k, v]) => [k, v.output])
        ),
      };

      // Simple expression evaluation (can be extended for more complex cases)
      const func = new Function(
        "ctx",
        `with(ctx) { return Boolean(${condition}); }`
      );
      return func(evalContext);
    } catch {
      // If condition evaluation fails, default to true
      return true;
    }
  }

  /**
   * Prepare input with variable substitution
   */
  private prepareInput(
    input: Record<string, unknown>,
    context: ExecutionContext
  ): Record<string, unknown> {
    const prepared: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "string") {
        // Substitute variables: ${variableName} or ${results.stepId.field}
        prepared[key] = this.substituteVariables(value, context);
      } else if (typeof value === "object" && value !== null) {
        prepared[key] = this.prepareInput(
          value as Record<string, unknown>,
          context
        );
      } else {
        prepared[key] = value;
      }
    }

    return prepared;
  }

  /**
   * Substitute variables in string
   */
  private substituteVariables(
    value: string,
    context: ExecutionContext
  ): string {
    return value.replace(/\$\{([^}]+)\}/g, (_, path) => {
      try {
        const parts = path.split(".");
        let current: unknown = {
          variables: context.variables,
          results: Object.fromEntries(
            Array.from(context.stepResults.entries()).map(([k, v]) => [k, v.output])
          ),
        };

        for (const part of parts) {
          if (current && typeof current === "object" && part in current) {
            current = (current as Record<string, unknown>)[part];
          } else {
            return `\${${path}}`; // Return original if not found
          }
        }

        return String(current);
      } catch {
        return `\${${path}}`;
      }
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
