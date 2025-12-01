/**
 * @gicm/workflow-engine
 * Multi-agent workflow orchestration engine
 */

// Core exports
export { WorkflowEngine } from "./engine.js";
export { StepExecutor, type ExecutionContext } from "./executor.js";
export { Scheduler } from "./scheduler.js";
export { FileWorkflowStorage } from "./storage.js";

// Types
export {
  type WorkflowDefinition,
  type WorkflowExecution,
  type WorkflowStep,
  type WorkflowTrigger,
  type StepResult,
  type StepStatus,
  type ExecutionStatus,
  type ErrorStrategy,
  type TriggerType,
  type WorkflowEvents,
  type AgentExecutor,
  type WorkflowStorage,
  type CreateWorkflowInput,
  type RunWorkflowInput,
  // Schemas for validation
  WorkflowDefinitionSchema,
  WorkflowStepSchema,
  StepResultSchema,
  WorkflowExecutionSchema,
} from "./types.js";

// Templates
export { templates, getTemplate, listTemplates } from "./templates/index.js";
