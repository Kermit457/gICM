// Orchestrator - Multi-agent coordination
export { Orchestrator } from "./orchestrator.js";

// Types
export {
  type OrchestratorConfig,
  type AgentType,
  type RegisteredAgent,
  type Workflow,
  type WorkflowStep,
  type WorkflowContext,
  type WorkflowResult,
  type StepResult,
  type WorkflowError,
  type Intent,
  type RoutingDecision,
  type MemoryEntry,
  OrchestratorConfigSchema,
} from "./types.js";

// Coordination
export { Router } from "./coordination/router.js";
export { SharedMemory } from "./coordination/memory.js";

// Pre-built Workflows
export { tradingWorkflows } from "./workflows/trading.js";
export { researchWorkflows } from "./workflows/research.js";
export { portfolioWorkflows } from "./workflows/portfolio.js";

// Brain - Autonomous control center
export {
  GoalSystemManager,
  goalSystem,
  DailyCycleManager,
  dailyCycle,
  GicmBrain,
  createGicmBrain,
  type GoalSystem,
  type CoreValue,
  type MetricTarget,
  type Competitor,
  type PhaseType,
  type PhaseResult,
  type ActionLog,
  type DailyCycleConfig,
  type EngineConnections,
  type GicmBrainConfig,
  type BrainStatus,
} from "./brain/index.js";
