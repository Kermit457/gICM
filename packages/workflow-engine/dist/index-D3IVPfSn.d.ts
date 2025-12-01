import { z } from 'zod';

/**
 * Workflow Engine Types
 * Core type definitions for multi-agent workflows
 */

declare const ErrorStrategySchema: z.ZodEnum<["fail", "skip", "retry"]>;
type ErrorStrategy = z.infer<typeof ErrorStrategySchema>;
declare const WorkflowStepSchema: z.ZodObject<{
    id: z.ZodString;
    agent: z.ZodString;
    input: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    condition: z.ZodOptional<z.ZodString>;
    onError: z.ZodDefault<z.ZodEnum<["fail", "skip", "retry"]>>;
    retryCount: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    agent: string;
    input: Record<string, unknown>;
    onError: "fail" | "skip" | "retry";
    retryCount: number;
    timeout: number;
    dependsOn?: string[] | undefined;
    condition?: string | undefined;
}, {
    id: string;
    agent: string;
    input?: Record<string, unknown> | undefined;
    dependsOn?: string[] | undefined;
    condition?: string | undefined;
    onError?: "fail" | "skip" | "retry" | undefined;
    retryCount?: number | undefined;
    timeout?: number | undefined;
}>;
type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
declare const TriggerTypeSchema: z.ZodEnum<["manual", "schedule", "event", "webhook"]>;
type TriggerType = z.infer<typeof TriggerTypeSchema>;
declare const WorkflowTriggerSchema: z.ZodObject<{
    type: z.ZodEnum<["manual", "schedule", "event", "webhook"]>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "manual" | "schedule" | "event" | "webhook";
    config?: Record<string, unknown> | undefined;
}, {
    type: "manual" | "schedule" | "event" | "webhook";
    config?: Record<string, unknown> | undefined;
}>;
type WorkflowTrigger = z.infer<typeof WorkflowTriggerSchema>;
declare const WorkflowDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        agent: z.ZodString;
        input: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        condition: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodEnum<["fail", "skip", "retry"]>>;
        retryCount: z.ZodDefault<z.ZodNumber>;
        timeout: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        agent: string;
        input: Record<string, unknown>;
        onError: "fail" | "skip" | "retry";
        retryCount: number;
        timeout: number;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
    }, {
        id: string;
        agent: string;
        input?: Record<string, unknown> | undefined;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        onError?: "fail" | "skip" | "retry" | undefined;
        retryCount?: number | undefined;
        timeout?: number | undefined;
    }>, "many">;
    triggers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["manual", "schedule", "event", "webhook"]>;
        config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type: "manual" | "schedule" | "event" | "webhook";
        config?: Record<string, unknown> | undefined;
    }, {
        type: "manual" | "schedule" | "event" | "webhook";
        config?: Record<string, unknown> | undefined;
    }>, "many">>;
    variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    version: string;
    steps: {
        id: string;
        agent: string;
        input: Record<string, unknown>;
        onError: "fail" | "skip" | "retry";
        retryCount: number;
        timeout: number;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
    }[];
    description?: string | undefined;
    triggers?: {
        type: "manual" | "schedule" | "event" | "webhook";
        config?: Record<string, unknown> | undefined;
    }[] | undefined;
    variables?: Record<string, unknown> | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    id: string;
    name: string;
    steps: {
        id: string;
        agent: string;
        input?: Record<string, unknown> | undefined;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        onError?: "fail" | "skip" | "retry" | undefined;
        retryCount?: number | undefined;
        timeout?: number | undefined;
    }[];
    description?: string | undefined;
    version?: string | undefined;
    triggers?: {
        type: "manual" | "schedule" | "event" | "webhook";
        config?: Record<string, unknown> | undefined;
    }[] | undefined;
    variables?: Record<string, unknown> | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
declare const StepStatusSchema: z.ZodEnum<["pending", "running", "completed", "failed", "skipped", "cancelled"]>;
type StepStatus = z.infer<typeof StepStatusSchema>;
declare const StepResultSchema: z.ZodObject<{
    stepId: z.ZodString;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "skipped", "cancelled"]>;
    output: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "running" | "completed" | "failed" | "skipped" | "cancelled";
    stepId: string;
    retries: number;
    output?: unknown;
    error?: string | undefined;
    startedAt?: string | undefined;
    completedAt?: string | undefined;
    duration?: number | undefined;
}, {
    status: "pending" | "running" | "completed" | "failed" | "skipped" | "cancelled";
    stepId: string;
    output?: unknown;
    error?: string | undefined;
    startedAt?: string | undefined;
    completedAt?: string | undefined;
    duration?: number | undefined;
    retries?: number | undefined;
}>;
type StepResult = z.infer<typeof StepResultSchema>;
declare const ExecutionStatusSchema: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled", "paused"]>;
type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;
declare const WorkflowExecutionSchema: z.ZodObject<{
    id: z.ZodString;
    workflowId: z.ZodString;
    workflowName: z.ZodString;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled", "paused"]>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    stepResults: z.ZodDefault<z.ZodArray<z.ZodObject<{
        stepId: z.ZodString;
        status: z.ZodEnum<["pending", "running", "completed", "failed", "skipped", "cancelled"]>;
        output: z.ZodOptional<z.ZodUnknown>;
        error: z.ZodOptional<z.ZodString>;
        startedAt: z.ZodOptional<z.ZodString>;
        completedAt: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        retries: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "running" | "completed" | "failed" | "skipped" | "cancelled";
        stepId: string;
        retries: number;
        output?: unknown;
        error?: string | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
        duration?: number | undefined;
    }, {
        status: "pending" | "running" | "completed" | "failed" | "skipped" | "cancelled";
        stepId: string;
        output?: unknown;
        error?: string | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
        duration?: number | undefined;
        retries?: number | undefined;
    }>, "many">>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";
    id: string;
    startedAt: string;
    workflowId: string;
    workflowName: string;
    stepResults: {
        status: "pending" | "running" | "completed" | "failed" | "skipped" | "cancelled";
        stepId: string;
        retries: number;
        output?: unknown;
        error?: string | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
        duration?: number | undefined;
    }[];
    input?: Record<string, unknown> | undefined;
    output?: Record<string, unknown> | undefined;
    error?: string | undefined;
    completedAt?: string | undefined;
    duration?: number | undefined;
}, {
    status: "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";
    id: string;
    startedAt: string;
    workflowId: string;
    workflowName: string;
    input?: Record<string, unknown> | undefined;
    output?: Record<string, unknown> | undefined;
    error?: string | undefined;
    completedAt?: string | undefined;
    duration?: number | undefined;
    stepResults?: {
        status: "pending" | "running" | "completed" | "failed" | "skipped" | "cancelled";
        stepId: string;
        output?: unknown;
        error?: string | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
        duration?: number | undefined;
        retries?: number | undefined;
    }[] | undefined;
}>;
type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
interface WorkflowEvents {
    started: (execution: WorkflowExecution) => void;
    stepStarted: (stepId: string, execution: WorkflowExecution) => void;
    stepCompleted: (result: StepResult, execution: WorkflowExecution) => void;
    stepFailed: (result: StepResult, execution: WorkflowExecution) => void;
    completed: (execution: WorkflowExecution) => void;
    failed: (error: Error, execution: WorkflowExecution) => void;
    cancelled: (execution: WorkflowExecution) => void;
    paused: (execution: WorkflowExecution) => void;
    resumed: (execution: WorkflowExecution) => void;
}
interface AgentExecutor {
    execute(agentId: string, input: Record<string, unknown>): Promise<unknown>;
    listAgents(): Promise<string[]>;
    getAgentInfo(agentId: string): Promise<{
        name: string;
        description: string;
    } | null>;
}
interface WorkflowStorage {
    saveWorkflow(workflow: WorkflowDefinition): Promise<void>;
    loadWorkflow(id: string): Promise<WorkflowDefinition | null>;
    listWorkflows(): Promise<WorkflowDefinition[]>;
    deleteWorkflow(id: string): Promise<boolean>;
    saveExecution(execution: WorkflowExecution): Promise<void>;
    loadExecution(id: string): Promise<WorkflowExecution | null>;
    listExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
}
interface CreateWorkflowStepInput {
    id?: string;
    agent: string;
    input?: Record<string, unknown>;
    dependsOn?: string[];
    condition?: string;
    onError?: ErrorStrategy;
    retryCount?: number;
    timeout?: number;
}
interface CreateWorkflowInput {
    name: string;
    description?: string;
    steps: CreateWorkflowStepInput[];
    triggers?: WorkflowTrigger[];
    variables?: Record<string, unknown>;
}
interface RunWorkflowInput {
    workflowId?: string;
    workflowName?: string;
    input?: Record<string, unknown>;
    dryRun?: boolean;
}

/**
 * Audit-then-Deploy Workflow Template
 * audit-agent → decision-agent → deployer-agent
 */

declare const auditDeployTemplate: CreateWorkflowInput;

/**
 * Research-Decide-Trade Workflow Template
 * hunter-agent → decision-agent → wallet-agent
 */

declare const researchDecideTemplate: CreateWorkflowInput;

/**
 * Multi-Chain Scan Workflow Template
 * parallel(solana-scan, eth-scan, base-scan) → merge → decision → trade
 */

declare const scanAnalyzeTradeTemplate: CreateWorkflowInput;

/**
 * Built-in Workflow Templates
 */

declare const templates: Record<string, CreateWorkflowInput>;
declare function getTemplate(name: string): CreateWorkflowInput | undefined;
declare function listTemplates(): {
    name: string;
    description: string;
}[];

export { type AgentExecutor as A, type CreateWorkflowInput as C, type ExecutionStatus as E, type RunWorkflowInput as R, type StepResult as S, type TriggerType as T, type WorkflowEvents as W, type WorkflowStorage as a, type WorkflowDefinition as b, type WorkflowExecution as c, type WorkflowStep as d, type WorkflowTrigger as e, type StepStatus as f, type ErrorStrategy as g, WorkflowDefinitionSchema as h, WorkflowStepSchema as i, StepResultSchema as j, WorkflowExecutionSchema as k, getTemplate as l, listTemplates as m, auditDeployTemplate as n, researchDecideTemplate as r, scanAnalyzeTradeTemplate as s, templates as t };
