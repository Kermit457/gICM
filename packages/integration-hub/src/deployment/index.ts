/**
 * Deployment Manager Module
 * Phase 15D: Deployment Automation
 */

// Types & Schemas
export {
  // Strategy
  DeploymentStrategySchema,
  type DeploymentStrategy,
  DeploymentStatusSchema,
  type DeploymentStatus,

  // Version & Artifact
  SemanticVersionSchema,
  type SemanticVersion,
  ArtifactTypeSchema,
  type ArtifactType,
  ArtifactSchema,
  type Artifact,

  // Environment & Target
  DeploymentEnvironmentSchema,
  type DeploymentEnvironment,
  DeploymentTargetSchema,
  type DeploymentTarget,

  // Strategy Configs
  RollingConfigSchema,
  type RollingConfig,
  BlueGreenConfigSchema,
  type BlueGreenConfig,
  CanaryConfigSchema,
  type CanaryConfig,
  StrategyConfigSchema,
  type StrategyConfig,

  // Definition
  DeploymentDefinitionSchema,
  type DeploymentDefinition,

  // State
  DeploymentPhaseSchema,
  type DeploymentPhase,
  DeploymentStateSchema,
  type DeploymentState,

  // Checks
  CheckResultSchema,
  type CheckResult,

  // Approval
  ApprovalStatusSchema,
  type ApprovalStatus,
  ApprovalSchema,
  type Approval,

  // Metrics & Analysis
  DeploymentMetricsSchema,
  type DeploymentMetrics,
  AnalysisResultSchema,
  type AnalysisResult,

  // Rollback
  RollbackReasonSchema,
  type RollbackReason,
  RollbackSchema,
  type Rollback,

  // Config
  DeploymentManagerConfigSchema,
  type DeploymentManagerConfig,

  // Events & Interfaces
  type DeploymentEvents,
  type DeploymentStorage,
} from "./types.js";

// Deployment Manager
export {
  DeploymentManager,
  getDeploymentManager,
  createDeploymentManager,
} from "./deployment-manager.js";
