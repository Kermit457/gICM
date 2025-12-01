import { EventEmitter } from 'eventemitter3';
import { W as WorkflowEvents, a as WorkflowStorage, A as AgentExecutor, C as CreateWorkflowInput, b as WorkflowDefinition, R as RunWorkflowInput, c as WorkflowExecution, S as StepResult, d as WorkflowStep } from './index-D3IVPfSn.cjs';
export { g as ErrorStrategy, E as ExecutionStatus, j as StepResultSchema, f as StepStatus, T as TriggerType, h as WorkflowDefinitionSchema, k as WorkflowExecutionSchema, i as WorkflowStepSchema, e as WorkflowTrigger, l as getTemplate, m as listTemplates, t as templates } from './index-D3IVPfSn.cjs';
import 'zod';

/**
 * Workflow Engine
 * Main orchestrator for multi-agent workflows
 */

interface EngineOptions {
    storage?: WorkflowStorage;
    agentExecutor?: AgentExecutor;
    maxConcurrency?: number;
    logLevel?: string;
}
declare class WorkflowEngine extends EventEmitter<WorkflowEvents> {
    private storage;
    private stepExecutor;
    private scheduler;
    private activeExecutions;
    private logger;
    constructor(options?: EngineOptions);
    /**
     * Create a new workflow
     */
    createWorkflow(input: CreateWorkflowInput): Promise<WorkflowDefinition>;
    /**
     * Run a workflow
     */
    runWorkflow(input: RunWorkflowInput): Promise<WorkflowExecution>;
    /**
     * Get workflow by ID or name
     */
    getWorkflow(idOrName: string): Promise<WorkflowDefinition | null>;
    /**
     * List all workflows
     */
    listWorkflows(): Promise<WorkflowDefinition[]>;
    /**
     * Delete workflow
     */
    deleteWorkflow(id: string): Promise<boolean>;
    /**
     * Get execution status
     */
    getExecution(id: string): Promise<WorkflowExecution | null>;
    /**
     * List executions
     */
    listExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
    /**
     * Cancel running workflow
     */
    cancelExecution(id: string): Promise<boolean>;
    /**
     * Get active execution by step ID (for event forwarding)
     */
    private getActiveExecution;
    /**
     * Set custom agent executor
     */
    setAgentExecutor(executor: AgentExecutor): void;
}

/**
 * Step Executor
 * Handles execution of individual workflow steps with retry logic
 */

interface ExecutorEvents {
    stepStarted: (stepId: string) => void;
    stepCompleted: (result: StepResult) => void;
    stepFailed: (result: StepResult) => void;
    stepRetrying: (stepId: string, attempt: number) => void;
}
interface ExecutionContext {
    variables: Record<string, unknown>;
    stepResults: Map<string, StepResult>;
}
declare class StepExecutor extends EventEmitter<ExecutorEvents> {
    private agentExecutor;
    constructor(agentExecutor: AgentExecutor);
    /**
     * Execute a single step with retry logic
     */
    execute(step: WorkflowStep, context: ExecutionContext): Promise<StepResult>;
    /**
     * Execute agent with timeout
     */
    private executeWithTimeout;
    /**
     * Evaluate condition expression
     */
    private evaluateCondition;
    /**
     * Prepare input with variable substitution
     */
    private prepareInput;
    /**
     * Substitute variables in string
     */
    private substituteVariables;
    /**
     * Delay helper
     */
    private delay;
}

/**
 * Workflow Scheduler
 * Handles parallel execution and dependency resolution
 */

interface SchedulerOptions {
    maxConcurrency: number;
}
declare class Scheduler {
    private executor;
    private options;
    constructor(executor: StepExecutor, options?: Partial<SchedulerOptions>);
    /**
     * Schedule and execute all steps respecting dependencies
     */
    execute(steps: WorkflowStep[], context: ExecutionContext, onStepComplete?: (result: StepResult) => void): Promise<Map<string, StepResult>>;
    /**
     * Build execution order (topological sort)
     */
    getExecutionOrder(steps: WorkflowStep[]): string[][];
    /**
     * Validate workflow steps for dependency issues
     */
    validate(steps: WorkflowStep[]): {
        valid: boolean;
        errors: string[];
    };
}

/**
 * Workflow Storage
 * File-based storage for workflows and executions
 */

declare class FileWorkflowStorage implements WorkflowStorage {
    private basePath;
    private workflowsPath;
    private executionsPath;
    constructor(basePath?: string);
    private ensureDirectories;
    /**
     * Save workflow definition
     */
    saveWorkflow(workflow: WorkflowDefinition): Promise<void>;
    /**
     * Load workflow by ID
     */
    loadWorkflow(id: string): Promise<WorkflowDefinition | null>;
    /**
     * List all workflows
     */
    listWorkflows(): Promise<WorkflowDefinition[]>;
    /**
     * Delete workflow
     */
    deleteWorkflow(id: string): Promise<boolean>;
    /**
     * Save execution record
     */
    saveExecution(execution: WorkflowExecution): Promise<void>;
    /**
     * Load execution by ID
     */
    loadExecution(id: string): Promise<WorkflowExecution | null>;
    /**
     * List executions
     */
    listExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
    /**
     * Update execution index for quick listing
     */
    private updateExecutionIndex;
    /**
     * Find workflow by name
     */
    findWorkflowByName(name: string): Promise<WorkflowDefinition | null>;
}

export { AgentExecutor, CreateWorkflowInput, type ExecutionContext, FileWorkflowStorage, RunWorkflowInput, Scheduler, StepExecutor, StepResult, WorkflowDefinition, WorkflowEngine, WorkflowEvents, WorkflowExecution, WorkflowStep, WorkflowStorage };
