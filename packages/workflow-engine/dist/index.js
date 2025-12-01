import {
  getTemplate,
  listTemplates,
  templates
} from "./chunk-LQAGR5U4.js";

// src/engine.ts
import { EventEmitter as EventEmitter2 } from "eventemitter3";
import { v4 as uuid } from "uuid";
import pino from "pino";

// src/types.ts
import { z } from "zod";
var ErrorStrategySchema = z.enum(["fail", "skip", "retry"]);
var WorkflowStepSchema = z.object({
  id: z.string(),
  agent: z.string(),
  // Agent ID to execute
  input: z.record(z.unknown()).default({}),
  dependsOn: z.array(z.string()).optional(),
  // Step IDs for dependency ordering
  condition: z.string().optional(),
  // JavaScript expression for conditional execution
  onError: ErrorStrategySchema.default("fail"),
  retryCount: z.number().default(3),
  timeout: z.number().default(3e4)
  // 30s default
});
var TriggerTypeSchema = z.enum(["manual", "schedule", "event", "webhook"]);
var WorkflowTriggerSchema = z.object({
  type: TriggerTypeSchema,
  config: z.record(z.unknown()).optional()
});
var WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string().default("1.0.0"),
  steps: z.array(WorkflowStepSchema),
  triggers: z.array(WorkflowTriggerSchema).optional(),
  variables: z.record(z.unknown()).optional(),
  // Shared variables across steps
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
var StepStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
  "cancelled"
]);
var StepResultSchema = z.object({
  stepId: z.string(),
  status: StepStatusSchema,
  output: z.unknown().optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  duration: z.number().optional(),
  // ms
  retries: z.number().default(0)
});
var ExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "paused"
]);
var WorkflowExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  workflowName: z.string(),
  status: ExecutionStatusSchema,
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  stepResults: z.array(StepResultSchema).default([]),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  duration: z.number().optional(),
  // ms
  error: z.string().optional()
});

// src/executor.ts
import { EventEmitter } from "eventemitter3";
var StepExecutor = class extends EventEmitter {
  agentExecutor;
  constructor(agentExecutor) {
    super();
    this.agentExecutor = agentExecutor;
  }
  /**
   * Execute a single step with retry logic
   */
  async execute(step, context) {
    const startedAt = (/* @__PURE__ */ new Date()).toISOString();
    let lastError = null;
    let retries = 0;
    if (step.condition) {
      const shouldRun = this.evaluateCondition(step.condition, context);
      if (!shouldRun) {
        return {
          stepId: step.id,
          status: "skipped",
          startedAt,
          completedAt: (/* @__PURE__ */ new Date()).toISOString(),
          duration: 0,
          retries: 0
        };
      }
    }
    this.emit("stepStarted", step.id);
    while (retries <= step.retryCount) {
      try {
        const preparedInput = this.prepareInput(step.input, context);
        const output = await this.executeWithTimeout(
          step.agent,
          preparedInput,
          step.timeout
        );
        const completedAt2 = (/* @__PURE__ */ new Date()).toISOString();
        const result2 = {
          stepId: step.id,
          status: "completed",
          output,
          startedAt,
          completedAt: completedAt2,
          duration: new Date(completedAt2).getTime() - new Date(startedAt).getTime(),
          retries
        };
        this.emit("stepCompleted", result2);
        return result2;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;
        if (retries <= step.retryCount) {
          this.emit("stepRetrying", step.id, retries);
          await this.delay(Math.min(1e3 * Math.pow(2, retries), 1e4));
        }
      }
    }
    const completedAt = (/* @__PURE__ */ new Date()).toISOString();
    const result = {
      stepId: step.id,
      status: step.onError === "skip" ? "skipped" : "failed",
      error: lastError?.message || "Unknown error",
      startedAt,
      completedAt,
      duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      retries: retries - 1
    };
    this.emit("stepFailed", result);
    return result;
  }
  /**
   * Execute agent with timeout
   */
  async executeWithTimeout(agentId, input, timeout) {
    return Promise.race([
      this.agentExecutor.execute(agentId, input),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Step timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }
  /**
   * Evaluate condition expression
   */
  evaluateCondition(condition, context) {
    try {
      const evalContext = {
        variables: context.variables,
        results: Object.fromEntries(
          Array.from(context.stepResults.entries()).map(([k, v]) => [k, v.output])
        )
      };
      const func = new Function(
        "ctx",
        `with(ctx) { return Boolean(${condition}); }`
      );
      return func(evalContext);
    } catch {
      return true;
    }
  }
  /**
   * Prepare input with variable substitution
   */
  prepareInput(input, context) {
    const prepared = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "string") {
        prepared[key] = this.substituteVariables(value, context);
      } else if (typeof value === "object" && value !== null) {
        prepared[key] = this.prepareInput(
          value,
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
  substituteVariables(value, context) {
    return value.replace(/\$\{([^}]+)\}/g, (_, path2) => {
      try {
        const parts = path2.split(".");
        let current = {
          variables: context.variables,
          results: Object.fromEntries(
            Array.from(context.stepResults.entries()).map(([k, v]) => [k, v.output])
          )
        };
        for (const part of parts) {
          if (current && typeof current === "object" && part in current) {
            current = current[part];
          } else {
            return `\${${path2}}`;
          }
        }
        return String(current);
      } catch {
        return `\${${path2}}`;
      }
    });
  }
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/scheduler.ts
var Scheduler = class {
  executor;
  options;
  constructor(executor, options = {}) {
    this.executor = executor;
    this.options = {
      maxConcurrency: options.maxConcurrency ?? 5
    };
  }
  /**
   * Schedule and execute all steps respecting dependencies
   */
  async execute(steps, context, onStepComplete) {
    const results = /* @__PURE__ */ new Map();
    const pending = new Set(steps.map((s) => s.id));
    const running = /* @__PURE__ */ new Set();
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    while (pending.size > 0) {
      const ready = Array.from(pending).filter((stepId) => {
        const step = stepMap.get(stepId);
        const deps = step.dependsOn || [];
        return deps.every((depId) => results.has(depId));
      });
      if (ready.length === 0 && running.size === 0) {
        throw new Error(
          `Workflow deadlock: Cannot resolve dependencies for steps: ${Array.from(pending).join(", ")}`
        );
      }
      const canRun = Math.min(
        ready.length,
        this.options.maxConcurrency - running.size
      );
      if (canRun > 0) {
        const toRun = ready.slice(0, canRun);
        const promises = toRun.map(async (stepId) => {
          pending.delete(stepId);
          running.add(stepId);
          const step = stepMap.get(stepId);
          const depFailed = (step.dependsOn || []).some((depId) => {
            const depResult = results.get(depId);
            return depResult?.status === "failed";
          });
          let result;
          if (depFailed && step.onError === "fail") {
            result = {
              stepId,
              status: "skipped",
              error: "Skipped due to failed dependency",
              startedAt: (/* @__PURE__ */ new Date()).toISOString(),
              completedAt: (/* @__PURE__ */ new Date()).toISOString(),
              duration: 0,
              retries: 0
            };
          } else {
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
        await Promise.race(promises);
      } else if (running.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return results;
  }
  /**
   * Build execution order (topological sort)
   */
  getExecutionOrder(steps) {
    const levels = [];
    const remaining = new Set(steps.map((s) => s.id));
    const completed = /* @__PURE__ */ new Set();
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    while (remaining.size > 0) {
      const level = [];
      for (const stepId of remaining) {
        const step = stepMap.get(stepId);
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
  validate(steps) {
    const errors = [];
    const stepIds = new Set(steps.map((s) => s.id));
    if (stepIds.size !== steps.length) {
      errors.push("Duplicate step IDs found");
    }
    for (const step of steps) {
      for (const depId of step.dependsOn || []) {
        if (!stepIds.has(depId)) {
          errors.push(`Step "${step.id}" depends on non-existent step "${depId}"`);
        }
      }
    }
    try {
      this.getExecutionOrder(steps);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Circular")) {
        errors.push(error.message);
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// src/storage.ts
import * as fs from "fs";
import * as path from "path";
var FileWorkflowStorage = class {
  basePath;
  workflowsPath;
  executionsPath;
  constructor(basePath) {
    this.basePath = basePath || path.join(process.cwd(), ".gicm");
    this.workflowsPath = path.join(this.basePath, "workflows");
    this.executionsPath = path.join(this.basePath, "workflow-executions");
    this.ensureDirectories();
  }
  ensureDirectories() {
    if (!fs.existsSync(this.workflowsPath)) {
      fs.mkdirSync(this.workflowsPath, { recursive: true });
    }
    if (!fs.existsSync(this.executionsPath)) {
      fs.mkdirSync(this.executionsPath, { recursive: true });
    }
  }
  /**
   * Save workflow definition
   */
  async saveWorkflow(workflow) {
    const filePath = path.join(this.workflowsPath, `${workflow.id}.json`);
    const data = {
      ...workflow,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: workflow.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
  /**
   * Load workflow by ID
   */
  async loadWorkflow(id) {
    const filePath = path.join(this.workflowsPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  }
  /**
   * List all workflows
   */
  async listWorkflows() {
    if (!fs.existsSync(this.workflowsPath)) {
      return [];
    }
    const files = fs.readdirSync(this.workflowsPath).filter((f) => f.endsWith(".json"));
    const workflows = [];
    for (const file of files) {
      try {
        const data = fs.readFileSync(path.join(this.workflowsPath, file), "utf-8");
        workflows.push(JSON.parse(data));
      } catch {
      }
    }
    return workflows.sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt || "";
      const bDate = b.updatedAt || b.createdAt || "";
      return bDate.localeCompare(aDate);
    });
  }
  /**
   * Delete workflow
   */
  async deleteWorkflow(id) {
    const filePath = path.join(this.workflowsPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return false;
    }
    fs.unlinkSync(filePath);
    return true;
  }
  /**
   * Save execution record
   */
  async saveExecution(execution) {
    const filePath = path.join(this.executionsPath, `${execution.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(execution, null, 2));
    await this.updateExecutionIndex(execution);
  }
  /**
   * Load execution by ID
   */
  async loadExecution(id) {
    const filePath = path.join(this.executionsPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  }
  /**
   * List executions
   */
  async listExecutions(workflowId, limit = 50) {
    const indexPath = path.join(this.executionsPath, "index.json");
    if (!fs.existsSync(indexPath)) {
      return [];
    }
    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    let filtered = index.executions;
    if (workflowId) {
      filtered = filtered.filter((e) => e.workflowId === workflowId);
    }
    filtered = filtered.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit);
    const executions = [];
    for (const entry of filtered) {
      const exec = await this.loadExecution(entry.id);
      if (exec) {
        executions.push(exec);
      }
    }
    return executions;
  }
  /**
   * Update execution index for quick listing
   */
  async updateExecutionIndex(execution) {
    const indexPath = path.join(this.executionsPath, "index.json");
    let index;
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    } else {
      index = { executions: [] };
    }
    index.executions = index.executions.filter((e) => e.id !== execution.id);
    index.executions.push({
      id: execution.id,
      workflowId: execution.workflowId,
      startedAt: execution.startedAt
    });
    if (index.executions.length > 1e3) {
      index.executions = index.executions.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 1e3);
    }
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }
  /**
   * Find workflow by name
   */
  async findWorkflowByName(name) {
    const workflows = await this.listWorkflows();
    return workflows.find((w) => w.name.toLowerCase() === name.toLowerCase()) || null;
  }
};

// src/engine.ts
var defaultAgentExecutor = {
  async execute(agentId, input) {
    await new Promise((r) => setTimeout(r, 500));
    return {
      agentId,
      input,
      result: `Simulated result from ${agentId}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
      "deployer-agent"
    ];
  },
  async getAgentInfo(agentId) {
    const agents = {
      "wallet-agent": { name: "Wallet Agent", description: "Execute token swaps and wallet operations" },
      "audit-agent": { name: "Audit Agent", description: "Smart contract security auditing" },
      "hunter-agent": { name: "Hunter Agent", description: "Find and analyze token opportunities" },
      "decision-agent": { name: "Decision Agent", description: "Trade decision making and analysis" },
      "defi-agent": { name: "DeFi Agent", description: "DeFi protocol interactions" },
      "builder-agent": { name: "Builder Agent", description: "Code generation and scaffolding" },
      "deployer-agent": { name: "Deployer Agent", description: "Deployment automation" }
    };
    return agents[agentId] || null;
  }
};
var WorkflowEngine = class extends EventEmitter2 {
  storage;
  stepExecutor;
  scheduler;
  activeExecutions;
  logger;
  constructor(options = {}) {
    super();
    this.storage = options.storage || new FileWorkflowStorage();
    this.stepExecutor = new StepExecutor(options.agentExecutor || defaultAgentExecutor);
    this.scheduler = new Scheduler(this.stepExecutor, {
      maxConcurrency: options.maxConcurrency ?? 5
    });
    this.activeExecutions = /* @__PURE__ */ new Map();
    this.logger = pino({
      level: options.logLevel || "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true }
      }
    });
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
  async createWorkflow(input) {
    const id = uuid().slice(0, 8);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const workflow = {
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
        timeout: s.timeout ?? 3e4
      })),
      triggers: input.triggers,
      variables: input.variables,
      createdAt: now,
      updatedAt: now
    };
    const parsed = WorkflowDefinitionSchema.safeParse(workflow);
    if (!parsed.success) {
      throw new Error(`Invalid workflow: ${parsed.error.message}`);
    }
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
  async runWorkflow(input) {
    let workflow = null;
    if (input.workflowId) {
      workflow = await this.storage.loadWorkflow(input.workflowId);
    } else if (input.workflowName) {
      workflow = await this.storage.findWorkflowByName(
        input.workflowName
      );
    }
    if (!workflow) {
      throw new Error(
        `Workflow not found: ${input.workflowId || input.workflowName}`
      );
    }
    const executionId = uuid().slice(0, 8);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const execution = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: "pending",
      input: input.input,
      stepResults: [],
      startedAt: now
    };
    this.activeExecutions.set(executionId, execution);
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
            dependsOn: s.dependsOn
          }))
        },
        completedAt: now,
        duration: 0
      };
    }
    execution.status = "running";
    await this.storage.saveExecution(execution);
    this.emit("started", execution);
    this.logger.info({ executionId, workflowId: workflow.id }, "Workflow started");
    try {
      const context = {
        variables: {
          ...workflow.variables,
          ...input.input
        },
        stepResults: /* @__PURE__ */ new Map()
      };
      const results = await this.scheduler.execute(
        workflow.steps,
        context,
        (result) => {
          execution.stepResults.push(result);
          this.storage.saveExecution(execution);
        }
      );
      const failed = Array.from(results.values()).filter(
        (r) => r.status === "failed"
      );
      execution.status = failed.length > 0 ? "failed" : "completed";
      execution.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
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
      execution.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
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
  async getWorkflow(idOrName) {
    let workflow = await this.storage.loadWorkflow(idOrName);
    if (!workflow) {
      workflow = await this.storage.findWorkflowByName(idOrName);
    }
    return workflow;
  }
  /**
   * List all workflows
   */
  async listWorkflows() {
    return this.storage.listWorkflows();
  }
  /**
   * Delete workflow
   */
  async deleteWorkflow(id) {
    return this.storage.deleteWorkflow(id);
  }
  /**
   * Get execution status
   */
  async getExecution(id) {
    if (this.activeExecutions.has(id)) {
      return this.activeExecutions.get(id);
    }
    return this.storage.loadExecution(id);
  }
  /**
   * List executions
   */
  async listExecutions(workflowId, limit) {
    return this.storage.listExecutions(workflowId, limit);
  }
  /**
   * Cancel running workflow
   */
  async cancelExecution(id) {
    const execution = this.activeExecutions.get(id);
    if (!execution || execution.status !== "running") {
      return false;
    }
    execution.status = "cancelled";
    execution.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
    await this.storage.saveExecution(execution);
    this.activeExecutions.delete(id);
    this.emit("cancelled", execution);
    this.logger.info({ executionId: id }, "Workflow cancelled");
    return true;
  }
  /**
   * Get active execution by step ID (for event forwarding)
   */
  getActiveExecution(stepId) {
    for (const execution of this.activeExecutions.values()) {
      if (execution.status === "running") {
        return execution;
      }
    }
    return void 0;
  }
  /**
   * Set custom agent executor
   */
  setAgentExecutor(executor) {
    this.stepExecutor = new StepExecutor(executor);
    this.scheduler = new Scheduler(this.stepExecutor);
  }
};
export {
  FileWorkflowStorage,
  Scheduler,
  StepExecutor,
  StepResultSchema,
  WorkflowDefinitionSchema,
  WorkflowEngine,
  WorkflowExecutionSchema,
  WorkflowStepSchema,
  getTemplate,
  listTemplates,
  templates
};
