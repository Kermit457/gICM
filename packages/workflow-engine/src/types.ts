/**
 * Workflow Engine Types
 * Core type definitions for multi-agent workflows
 */

import { z } from "zod";

// Error handling strategy
export const ErrorStrategySchema = z.enum(["fail", "skip", "retry"]);
export type ErrorStrategy = z.infer<typeof ErrorStrategySchema>;

// Workflow step definition
export const WorkflowStepSchema = z.object({
  id: z.string(),
  agent: z.string(), // Agent ID to execute
  input: z.record(z.unknown()).default({}),
  dependsOn: z.array(z.string()).optional(), // Step IDs for dependency ordering
  condition: z.string().optional(), // JavaScript expression for conditional execution
  onError: ErrorStrategySchema.default("fail"),
  retryCount: z.number().default(3),
  timeout: z.number().default(30000), // 30s default
});
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

// Workflow trigger types
export const TriggerTypeSchema = z.enum(["manual", "schedule", "event", "webhook"]);
export type TriggerType = z.infer<typeof TriggerTypeSchema>;

export const WorkflowTriggerSchema = z.object({
  type: TriggerTypeSchema,
  config: z.record(z.unknown()).optional(),
});
export type WorkflowTrigger = z.infer<typeof WorkflowTriggerSchema>;

// Complete workflow definition
export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string().default("1.0.0"),
  steps: z.array(WorkflowStepSchema),
  triggers: z.array(WorkflowTriggerSchema).optional(),
  variables: z.record(z.unknown()).optional(), // Shared variables across steps
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

// Step execution status
export const StepStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
  "cancelled",
]);
export type StepStatus = z.infer<typeof StepStatusSchema>;

// Step execution result
export const StepResultSchema = z.object({
  stepId: z.string(),
  status: StepStatusSchema,
  output: z.unknown().optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  duration: z.number().optional(), // ms
  retries: z.number().default(0),
});
export type StepResult = z.infer<typeof StepResultSchema>;

// Workflow execution status
export const ExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "paused",
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

// Workflow execution instance
export const WorkflowExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  workflowName: z.string(),
  status: ExecutionStatusSchema,
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  stepResults: z.array(StepResultSchema).default([]),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  duration: z.number().optional(), // ms
  error: z.string().optional(),
});
export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

// Workflow execution events
export interface WorkflowEvents {
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

// Agent executor interface
export interface AgentExecutor {
  execute(agentId: string, input: Record<string, unknown>): Promise<unknown>;
  listAgents(): Promise<string[]>;
  getAgentInfo(agentId: string): Promise<{ name: string; description: string } | null>;
}

// Workflow storage interface
export interface WorkflowStorage {
  saveWorkflow(workflow: WorkflowDefinition): Promise<void>;
  loadWorkflow(id: string): Promise<WorkflowDefinition | null>;
  listWorkflows(): Promise<WorkflowDefinition[]>;
  deleteWorkflow(id: string): Promise<boolean>;
  saveExecution(execution: WorkflowExecution): Promise<void>;
  loadExecution(id: string): Promise<WorkflowExecution | null>;
  listExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
}

// Create workflow step input (id, retryCount, timeout, onError optional)
export interface CreateWorkflowStepInput {
  id?: string;
  agent: string;
  input?: Record<string, unknown>;
  dependsOn?: string[];
  condition?: string;
  onError?: ErrorStrategy;
  retryCount?: number;
  timeout?: number;
}

// Create workflow input
export interface CreateWorkflowInput {
  name: string;
  description?: string;
  steps: CreateWorkflowStepInput[];
  triggers?: WorkflowTrigger[];
  variables?: Record<string, unknown>;
}

// Run workflow input
export interface RunWorkflowInput {
  workflowId?: string;
  workflowName?: string;
  input?: Record<string, unknown>;
  dryRun?: boolean;
}
