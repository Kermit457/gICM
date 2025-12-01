"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  FileWorkflowStorage: () => FileWorkflowStorage,
  Scheduler: () => Scheduler,
  StepExecutor: () => StepExecutor,
  StepResultSchema: () => StepResultSchema,
  WorkflowDefinitionSchema: () => WorkflowDefinitionSchema,
  WorkflowEngine: () => WorkflowEngine,
  WorkflowExecutionSchema: () => WorkflowExecutionSchema,
  WorkflowStepSchema: () => WorkflowStepSchema,
  getTemplate: () => getTemplate,
  listTemplates: () => listTemplates,
  templates: () => templates
});
module.exports = __toCommonJS(index_exports);

// src/engine.ts
var import_eventemitter32 = require("eventemitter3");
var import_uuid = require("uuid");
var import_pino = __toESM(require("pino"), 1);

// src/types.ts
var import_zod = require("zod");
var ErrorStrategySchema = import_zod.z.enum(["fail", "skip", "retry"]);
var WorkflowStepSchema = import_zod.z.object({
  id: import_zod.z.string(),
  agent: import_zod.z.string(),
  // Agent ID to execute
  input: import_zod.z.record(import_zod.z.unknown()).default({}),
  dependsOn: import_zod.z.array(import_zod.z.string()).optional(),
  // Step IDs for dependency ordering
  condition: import_zod.z.string().optional(),
  // JavaScript expression for conditional execution
  onError: ErrorStrategySchema.default("fail"),
  retryCount: import_zod.z.number().default(3),
  timeout: import_zod.z.number().default(3e4)
  // 30s default
});
var TriggerTypeSchema = import_zod.z.enum(["manual", "schedule", "event", "webhook"]);
var WorkflowTriggerSchema = import_zod.z.object({
  type: TriggerTypeSchema,
  config: import_zod.z.record(import_zod.z.unknown()).optional()
});
var WorkflowDefinitionSchema = import_zod.z.object({
  id: import_zod.z.string(),
  name: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  version: import_zod.z.string().default("1.0.0"),
  steps: import_zod.z.array(WorkflowStepSchema),
  triggers: import_zod.z.array(WorkflowTriggerSchema).optional(),
  variables: import_zod.z.record(import_zod.z.unknown()).optional(),
  // Shared variables across steps
  createdAt: import_zod.z.string().optional(),
  updatedAt: import_zod.z.string().optional()
});
var StepStatusSchema = import_zod.z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
  "cancelled"
]);
var StepResultSchema = import_zod.z.object({
  stepId: import_zod.z.string(),
  status: StepStatusSchema,
  output: import_zod.z.unknown().optional(),
  error: import_zod.z.string().optional(),
  startedAt: import_zod.z.string().optional(),
  completedAt: import_zod.z.string().optional(),
  duration: import_zod.z.number().optional(),
  // ms
  retries: import_zod.z.number().default(0)
});
var ExecutionStatusSchema = import_zod.z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "paused"
]);
var WorkflowExecutionSchema = import_zod.z.object({
  id: import_zod.z.string(),
  workflowId: import_zod.z.string(),
  workflowName: import_zod.z.string(),
  status: ExecutionStatusSchema,
  input: import_zod.z.record(import_zod.z.unknown()).optional(),
  output: import_zod.z.record(import_zod.z.unknown()).optional(),
  stepResults: import_zod.z.array(StepResultSchema).default([]),
  startedAt: import_zod.z.string(),
  completedAt: import_zod.z.string().optional(),
  duration: import_zod.z.number().optional(),
  // ms
  error: import_zod.z.string().optional()
});

// src/executor.ts
var import_eventemitter3 = require("eventemitter3");
var StepExecutor = class extends import_eventemitter3.EventEmitter {
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
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
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
var WorkflowEngine = class extends import_eventemitter32.EventEmitter {
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
    this.logger = (0, import_pino.default)({
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
    const id = (0, import_uuid.v4)().slice(0, 8);
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
    const executionId = (0, import_uuid.v4)().slice(0, 8);
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

// src/templates/audit-deploy.ts
var auditDeployTemplate = {
  name: "audit-deploy",
  description: "Audit smart contract, get approval decision, then deploy if approved",
  steps: [
    {
      id: "audit",
      agent: "audit-agent",
      input: {
        contractPath: "${variables.contractPath}",
        severity: "${variables.severity || 'high'}"
      },
      onError: "fail",
      timeout: 12e4
      // 2 min for audit
    },
    {
      id: "decide",
      agent: "decision-agent",
      input: {
        context: "Contract audit results",
        auditResult: "${results.audit}",
        threshold: "${variables.approvalThreshold || 80}"
      },
      dependsOn: ["audit"],
      onError: "fail"
    },
    {
      id: "deploy",
      agent: "deployer-agent",
      input: {
        contractPath: "${variables.contractPath}",
        network: "${variables.network || 'devnet'}",
        auditReport: "${results.audit}",
        decisionReport: "${results.decide}"
      },
      dependsOn: ["decide"],
      condition: "results.decide.approved === true",
      onError: "fail"
    }
  ],
  variables: {
    contractPath: "",
    network: "devnet",
    severity: "high",
    approvalThreshold: 80
  }
};

// src/templates/research-decide.ts
var researchDecideTemplate = {
  name: "research-decide-trade",
  description: "Hunt for tokens, analyze with decision agent, execute trade if approved",
  steps: [
    {
      id: "hunt",
      agent: "hunter-agent",
      input: {
        sources: "${variables.sources || ['twitter', 'github']}",
        keywords: "${variables.keywords}",
        minScore: "${variables.minScore || 70}",
        limit: "${variables.limit || 10}"
      },
      onError: "fail",
      timeout: 6e4
    },
    {
      id: "decide",
      agent: "decision-agent",
      input: {
        opportunities: "${results.hunt}",
        strategy: "${variables.strategy || 'conservative'}",
        maxAllocation: "${variables.maxAllocation || 100}",
        riskTolerance: "${variables.riskTolerance || 'medium'}"
      },
      dependsOn: ["hunt"],
      onError: "fail"
    },
    {
      id: "trade",
      agent: "wallet-agent",
      input: {
        action: "swap",
        token: "${results.decide.selectedToken}",
        amount: "${results.decide.recommendedAmount}",
        slippage: "${variables.slippage || 1}",
        dryRun: "${variables.dryRun || true}"
      },
      dependsOn: ["decide"],
      condition: "results.decide.shouldTrade === true",
      onError: "skip"
    }
  ],
  variables: {
    sources: ["twitter", "github"],
    keywords: [],
    minScore: 70,
    limit: 10,
    strategy: "conservative",
    maxAllocation: 100,
    riskTolerance: "medium",
    slippage: 1,
    dryRun: true
  }
};

// src/templates/scan-analyze-trade.ts
var scanAnalyzeTradeTemplate = {
  name: "scan-all-chains",
  description: "Scan multiple chains in parallel, merge results, analyze and trade",
  steps: [
    // Parallel chain scans
    {
      id: "scan-solana",
      agent: "hunter-agent",
      input: {
        chain: "solana",
        scanType: "${variables.scanType || 'new-tokens'}",
        minLiquidity: "${variables.minLiquidity || 10000}",
        limit: "${variables.limit || 20}"
      },
      onError: "skip",
      timeout: 45e3
    },
    {
      id: "scan-eth",
      agent: "hunter-agent",
      input: {
        chain: "ethereum",
        scanType: "${variables.scanType || 'new-tokens'}",
        minLiquidity: "${variables.minLiquidity || 10000}",
        limit: "${variables.limit || 20}"
      },
      onError: "skip",
      timeout: 45e3
    },
    {
      id: "scan-base",
      agent: "hunter-agent",
      input: {
        chain: "base",
        scanType: "${variables.scanType || 'new-tokens'}",
        minLiquidity: "${variables.minLiquidity || 10000}",
        limit: "${variables.limit || 20}"
      },
      onError: "skip",
      timeout: 45e3
    },
    // Merge and analyze (waits for all scans)
    {
      id: "analyze",
      agent: "decision-agent",
      input: {
        solanaResults: "${results['scan-solana']}",
        ethResults: "${results['scan-eth']}",
        baseResults: "${results['scan-base']}",
        strategy: "${variables.strategy || 'multi-chain-diversified'}",
        maxPositions: "${variables.maxPositions || 3}",
        riskProfile: "${variables.riskProfile || 'balanced'}"
      },
      dependsOn: ["scan-solana", "scan-eth", "scan-base"],
      onError: "fail"
    },
    // Execute trades based on analysis
    {
      id: "execute",
      agent: "wallet-agent",
      input: {
        trades: "${results.analyze.recommendedTrades}",
        totalBudget: "${variables.budget || 500}",
        dryRun: "${variables.dryRun || true}"
      },
      dependsOn: ["analyze"],
      condition: "results.analyze.recommendedTrades && results.analyze.recommendedTrades.length > 0",
      onError: "skip"
    }
  ],
  variables: {
    scanType: "new-tokens",
    minLiquidity: 1e4,
    limit: 20,
    strategy: "multi-chain-diversified",
    maxPositions: 3,
    riskProfile: "balanced",
    budget: 500,
    dryRun: true
  }
};

// src/templates/index.ts
var templates = {
  "audit-deploy": auditDeployTemplate,
  "research-decide-trade": researchDecideTemplate,
  "scan-all-chains": scanAnalyzeTradeTemplate
};
function getTemplate(name) {
  return templates[name];
}
function listTemplates() {
  return Object.entries(templates).map(([name, template]) => ({
    name,
    description: template.description || ""
  }));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
