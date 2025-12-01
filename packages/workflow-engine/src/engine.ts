/**
 * Workflow Engine
 * Main orchestrator for multi-agent workflows
 */

import { EventEmitter } from "eventemitter3";
import { v4 as uuid } from "uuid";
import pino from "pino";
import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStep,
  StepResult,
  WorkflowEvents,
  AgentExecutor,
  WorkflowStorage,
  CreateWorkflowInput,
  RunWorkflowInput,
} from "./types.js";
import { WorkflowDefinitionSchema } from "./types.js";
import { StepExecutor, ExecutionContext } from "./executor.js";
import { Scheduler } from "./scheduler.js";
import { FileWorkflowStorage } from "./storage.js";

interface EngineOptions {
  storage?: WorkflowStorage;
  agentExecutor?: AgentExecutor;
  maxConcurrency?: number;
  logLevel?: string;
}

// Default agent executor that simulates agent execution
const defaultAgentExecutor: AgentExecutor = {
  async execute(agentId: string, input: Record<string, unknown>) {
    // Simulate agent execution
    await new Promise((r) => setTimeout(r, 500));
    return {
      agentId,
      input,
      result: `Simulated result from ${agentId}`,
      timestamp: new Date().toISOString(),
    };
  },
  async listAgents() {
    return [
      "wallet-agent",
      "audit-agent",
      "hunter-agent",
      "decision-agent",
      "defi-agent",
      "builder-agent",
      "deployer-agent",
    ];
  },
  async getAgentInfo(agentId: string) {
    const agents: Record<string, { name: string; description: string }> = {
      "wallet-agent": { name: "Wallet Agent", description: "Execute token swaps and wallet operations" },
      "audit-agent": { name: "Audit Agent", description: "Smart contract security auditing" },
      "hunter-agent": { name: "Hunter Agent", description: "Find and analyze token opportunities" },
      "decision-agent": { name: "Decision Agent", description: "Trade decision making and analysis" },
      "defi-agent": { name: "DeFi Agent", description: "DeFi protocol interactions" },
      "builder-agent": { name: "Builder Agent", description: "Code generation and scaffolding" },
      "deployer-agent": { name: "Deployer Agent", description: "Deployment automation" },
    };
    return agents[agentId] || null;
  },
};

export class WorkflowEngine extends EventEmitter<WorkflowEvents> {
  private storage: WorkflowStorage;
  private stepExecutor: StepExecutor;
  private scheduler: Scheduler;
  private activeExecutions: Map<string, WorkflowExecution>;
  private logger: pino.Logger;

  constructor(options: EngineOptions = {}) {
    super();
    this.storage = options.storage || new FileWorkflowStorage();
    this.stepExecutor = new StepExecutor(options.agentExecutor || defaultAgentExecutor);
    this.scheduler = new Scheduler(this.stepExecutor, {
      maxConcurrency: options.maxConcurrency ?? 5,
    });
    this.activeExecutions = new Map();
    this.logger = pino({
      level: options.logLevel || "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });

    // Wire up step executor events
    this.stepExecutor.on("stepStarted", (stepId) => {
      const execution = this.getActiveExecution(stepId);
      if (execution) {
        this.emit("stepStarted", stepId, execution);
      }
    });

    this.stepExecutor.on("stepCompleted", (result) => {
      const execution = this.getActiveExecution(result.stepId);
      if (execution) {
        this.emit("stepCompleted", result, execution);
      }
    });

    this.stepExecutor.on("stepFailed", (result) => {
      const execution = this.getActiveExecution(result.stepId);
      if (execution) {
        this.emit("stepFailed", result, execution);
      }
    });
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(input: CreateWorkflowInput): Promise<WorkflowDefinition> {
    const id = uuid().slice(0, 8);
    const now = new Date().toISOString();

    const workflow: WorkflowDefinition = {
      id,
      name: input.name,
      description: input.description,
      version: "1.0.0",
      steps: input.steps.map((s, i) => ({
        id: s.id || `step-${i + 1}`,
        agent: s.agent,
        input: s.input || {},
        dependsOn: s.dependsOn,
        condition: s.condition,
        onError: s.onError || "fail",
        retryCount: s.retryCount ?? 3,
        timeout: s.timeout ?? 30000,
      })),
      triggers: input.triggers,
      variables: input.variables,
      createdAt: now,
      updatedAt: now,
    };

    // Validate
    const parsed = WorkflowDefinitionSchema.safeParse(workflow);
    if (!parsed.success) {
      throw new Error(`Invalid workflow: ${parsed.error.message}`);
    }

    // Validate step dependencies
    const validation = this.scheduler.validate(workflow.steps);
    if (!validation.valid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join(", ")}`);
    }

    await this.storage.saveWorkflow(workflow);
    this.logger.info({ workflowId: id, name: input.name }, "Workflow created");

    return workflow;
  }

  /**
   * Run a workflow
   */
  async runWorkflow(input: RunWorkflowInput): Promise<WorkflowExecution> {
    // Find workflow
    let workflow: WorkflowDefinition | null = null;

    if (input.workflowId) {
      workflow = await this.storage.loadWorkflow(input.workflowId);
    } else if (input.workflowName) {
      workflow = await (this.storage as FileWorkflowStorage).findWorkflowByName(
        input.workflowName
      );
    }

    if (!workflow) {
      throw new Error(
        `Workflow not found: ${input.workflowId || input.workflowName}`
      );
    }

    const executionId = uuid().slice(0, 8);
    const now = new Date().toISOString();

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: "pending",
      input: input.input,
      stepResults: [],
      startedAt: now,
    };

    this.activeExecutions.set(executionId, execution);

    // Dry run mode
    if (input.dryRun) {
      const order = this.scheduler.getExecutionOrder(workflow.steps);
      return {
        ...execution,
        status: "completed",
        output: {
          dryRun: true,
          executionOrder: order,
          steps: workflow.steps.map((s) => ({
            id: s.id,
            agent: s.agent,
            dependsOn: s.dependsOn,
          })),
        },
        completedAt: now,
        duration: 0,
      };
    }

    // Start execution
    execution.status = "running";
    await this.storage.saveExecution(execution);
    this.emit("started", execution);
    this.logger.info({ executionId, workflowId: workflow.id }, "Workflow started");

    try {
      // Create execution context
      const context: ExecutionContext = {
        variables: {
          ...workflow.variables,
          ...input.input,
        },
        stepResults: new Map(),
      };

      // Execute all steps
      const results = await this.scheduler.execute(
        workflow.steps,
        context,
        (result) => {
          execution.stepResults.push(result);
          this.storage.saveExecution(execution); // Update in progress
        }
      );

      // Check for failures
      const failed = Array.from(results.values()).filter(
        (r) => r.status === "failed"
      );

      execution.status = failed.length > 0 ? "failed" : "completed";
      execution.completedAt = new Date().toISOString();
      execution.duration =
        new Date(execution.completedAt).getTime() -
        new Date(execution.startedAt).getTime();

      // Collect outputs
      execution.output = Object.fromEntries(
        Array.from(results.entries()).map(([k, v]) => [k, v.output])
      );

      if (failed.length > 0) {
        execution.error = `${failed.length} step(s) failed: ${failed.map((f) => f.stepId).join(", ")}`;
        this.emit("failed", new Error(execution.error), execution);
        this.logger.error({ executionId, error: execution.error }, "Workflow failed");
      } else {
        this.emit("completed", execution);
        this.logger.info({ executionId, duration: execution.duration }, "Workflow completed");
      }
    } catch (error) {
      execution.status = "failed";
      execution.completedAt = new Date().toISOString();
      execution.duration =
        new Date(execution.completedAt).getTime() -
        new Date(execution.startedAt).getTime();
      execution.error = error instanceof Error ? error.message : String(error);

      this.emit("failed", error instanceof Error ? error : new Error(String(error)), execution);
      this.logger.error({ executionId, error: execution.error }, "Workflow failed");
    } finally {
      await this.storage.saveExecution(execution);
      this.activeExecutions.delete(executionId);
    }

    return execution;
  }

  /**
   * Get workflow by ID or name
   */
  async getWorkflow(idOrName: string): Promise<WorkflowDefinition | null> {
    let workflow = await this.storage.loadWorkflow(idOrName);
    if (!workflow) {
      workflow = await (this.storage as FileWorkflowStorage).findWorkflowByName(idOrName);
    }
    return workflow;
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<WorkflowDefinition[]> {
    return this.storage.listWorkflows();
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    return this.storage.deleteWorkflow(id);
  }

  /**
   * Get execution status
   */
  async getExecution(id: string): Promise<WorkflowExecution | null> {
    // Check active first
    if (this.activeExecutions.has(id)) {
      return this.activeExecutions.get(id)!;
    }
    return this.storage.loadExecution(id);
  }

  /**
   * List executions
   */
  async listExecutions(
    workflowId?: string,
    limit?: number
  ): Promise<WorkflowExecution[]> {
    return this.storage.listExecutions(workflowId, limit);
  }

  /**
   * Cancel running workflow
   */
  async cancelExecution(id: string): Promise<boolean> {
    const execution = this.activeExecutions.get(id);
    if (!execution || execution.status !== "running") {
      return false;
    }

    execution.status = "cancelled";
    execution.completedAt = new Date().toISOString();
    execution.duration =
      new Date(execution.completedAt).getTime() -
      new Date(execution.startedAt).getTime();

    await this.storage.saveExecution(execution);
    this.activeExecutions.delete(id);
    this.emit("cancelled", execution);
    this.logger.info({ executionId: id }, "Workflow cancelled");

    return true;
  }

  /**
   * Get active execution by step ID (for event forwarding)
   */
  private getActiveExecution(stepId: string): WorkflowExecution | undefined {
    for (const execution of this.activeExecutions.values()) {
      // We don't have direct step tracking, return any active execution
      if (execution.status === "running") {
        return execution;
      }
    }
    return undefined;
  }

  /**
   * Set custom agent executor
   */
  setAgentExecutor(executor: AgentExecutor): void {
    this.stepExecutor = new StepExecutor(executor);
    this.scheduler = new Scheduler(this.stepExecutor);
  }
}
