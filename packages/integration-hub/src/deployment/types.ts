/**
 * Deployment Manager Types
 * Phase 15D: Deployment Automation
 */

import { z } from "zod";

// =============================================================================
// Deployment Strategy Types
// =============================================================================

export const DeploymentStrategySchema = z.enum([
  "rolling", // Rolling update (replace instances gradually)
  "blue_green", // Blue/green deployment (switch between two environments)
  "canary", // Canary deployment (gradual traffic shift)
  "recreate", // Recreate (stop old, start new)
  "shadow", // Shadow deployment (duplicate traffic)
  "feature_flag", // Feature flag controlled
]);
export type DeploymentStrategy = z.infer<typeof DeploymentStrategySchema>;

export const DeploymentStatusSchema = z.enum([
  "pending", // Waiting to start
  "running", // In progress
  "paused", // Manually paused
  "completed", // Successfully finished
  "failed", // Failed
  "rolled_back", // Rolled back
  "cancelled", // Cancelled by user
]);
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;

// =============================================================================
// Version & Artifact
// =============================================================================

export const SemanticVersionSchema = z.string().regex(
  /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/,
  "Must be valid semver"
);
export type SemanticVersion = z.infer<typeof SemanticVersionSchema>;

export const ArtifactTypeSchema = z.enum([
  "docker", // Docker image
  "npm", // NPM package
  "binary", // Binary executable
  "archive", // Archive (zip, tar)
  "serverless", // Serverless function
]);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

export const ArtifactSchema = z.object({
  id: z.string(),
  type: ArtifactTypeSchema,
  name: z.string(),
  version: SemanticVersionSchema,
  digest: z.string().optional().describe("SHA256 digest"),
  size: z.number().optional().describe("Size in bytes"),
  registry: z.string().optional(),
  url: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.number(),
});
export type Artifact = z.infer<typeof ArtifactSchema>;

// =============================================================================
// Environment & Target
// =============================================================================

export const DeploymentEnvironmentSchema = z.enum([
  "development",
  "staging",
  "production",
  "canary",
  "preview",
]);
export type DeploymentEnvironment = z.infer<typeof DeploymentEnvironmentSchema>;

export const DeploymentTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["kubernetes", "ecs", "lambda", "vm", "container", "static"]),
  environment: DeploymentEnvironmentSchema,
  region: z.string().optional(),
  cluster: z.string().optional(),
  namespace: z.string().optional(),
  replicas: z.number().optional(),
  config: z.record(z.unknown()).optional(),
});
export type DeploymentTarget = z.infer<typeof DeploymentTargetSchema>;

// =============================================================================
// Deployment Configuration
// =============================================================================

export const RollingConfigSchema = z.object({
  maxSurge: z.number().default(25).describe("Max % of instances above desired"),
  maxUnavailable: z.number().default(25).describe("Max % unavailable during update"),
  minReadySeconds: z.number().default(30),
});
export type RollingConfig = z.infer<typeof RollingConfigSchema>;

export const BlueGreenConfigSchema = z.object({
  blueTarget: z.string().describe("Blue environment target ID"),
  greenTarget: z.string().describe("Green environment target ID"),
  switchTrafficPercent: z.number().default(100).describe("Traffic % to switch"),
  warmupSeconds: z.number().default(60),
});
export type BlueGreenConfig = z.infer<typeof BlueGreenConfigSchema>;

export const CanaryConfigSchema = z.object({
  steps: z.array(z.object({
    percent: z.number().min(0).max(100),
    durationSeconds: z.number(),
    pauseForAnalysis: z.boolean().default(false),
  })),
  analysisInterval: z.number().default(60).describe("Analysis interval in seconds"),
  successThreshold: z.number().default(95).describe("Success rate threshold %"),
  errorThreshold: z.number().default(5).describe("Error rate threshold %"),
  latencyThreshold: z.number().default(500).describe("P99 latency threshold in ms"),
});
export type CanaryConfig = z.infer<typeof CanaryConfigSchema>;

export const StrategyConfigSchema = z.object({
  rolling: RollingConfigSchema.optional(),
  blueGreen: BlueGreenConfigSchema.optional(),
  canary: CanaryConfigSchema.optional(),
});
export type StrategyConfig = z.infer<typeof StrategyConfigSchema>;

// =============================================================================
// Deployment Definition
// =============================================================================

export const DeploymentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // What to deploy
  artifact: ArtifactSchema,
  previousArtifact: ArtifactSchema.optional(),

  // Where to deploy
  targets: z.array(DeploymentTargetSchema),
  environment: DeploymentEnvironmentSchema,

  // How to deploy
  strategy: DeploymentStrategySchema,
  strategyConfig: StrategyConfigSchema.optional(),

  // Gates & Approvals
  requiresApproval: z.boolean().default(false),
  approvers: z.array(z.string()).default([]),
  preDeploymentChecks: z.array(z.string()).default([]),
  postDeploymentChecks: z.array(z.string()).default([]),

  // Rollback
  autoRollback: z.boolean().default(true),
  rollbackOnFailedChecks: z.boolean().default(true),

  // Notifications
  notifyChannels: z.array(z.string()).default([]),

  // Metadata
  labels: z.record(z.string()).default({}),
  annotations: z.record(z.string()).default({}),
  createdAt: z.number(),
  createdBy: z.string().optional(),
});
export type DeploymentDefinition = z.infer<typeof DeploymentDefinitionSchema>;

// =============================================================================
// Deployment State
// =============================================================================

export const DeploymentPhaseSchema = z.enum([
  "validation", // Validating deployment configuration
  "approval", // Waiting for approval
  "preparation", // Preparing artifacts
  "pre_checks", // Running pre-deployment checks
  "deploying", // Actively deploying
  "canary_analysis", // Analyzing canary metrics
  "traffic_shift", // Shifting traffic
  "post_checks", // Running post-deployment checks
  "cleanup", // Cleaning up old resources
  "finalization", // Finalizing deployment
]);
export type DeploymentPhase = z.infer<typeof DeploymentPhaseSchema>;

export const DeploymentStateSchema = z.object({
  deploymentId: z.string(),
  status: DeploymentStatusSchema,
  phase: DeploymentPhaseSchema,
  startedAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().optional(),

  // Progress
  progress: z.number().min(0).max(100),
  currentStep: z.number(),
  totalSteps: z.number(),

  // Traffic (for canary)
  trafficPercent: z.number().default(0),

  // Instances
  totalInstances: z.number().default(0),
  updatedInstances: z.number().default(0),
  healthyInstances: z.number().default(0),
  unhealthyInstances: z.number().default(0),

  // Errors
  errors: z.array(z.object({
    timestamp: z.number(),
    phase: DeploymentPhaseSchema,
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  })).default([]),

  // Logs
  logs: z.array(z.object({
    timestamp: z.number(),
    level: z.enum(["debug", "info", "warn", "error"]),
    message: z.string(),
  })).default([]),
});
export type DeploymentState = z.infer<typeof DeploymentStateSchema>;

// =============================================================================
// Check Results
// =============================================================================

export const CheckResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["health", "smoke", "load", "security", "custom"]),
  status: z.enum(["pending", "running", "passed", "failed", "skipped"]),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  duration: z.number().optional(),
  message: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

// =============================================================================
// Approval
// =============================================================================

export const ApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const ApprovalSchema = z.object({
  id: z.string(),
  deploymentId: z.string(),
  status: ApprovalStatusSchema,
  requestedAt: z.number(),
  requestedBy: z.string().optional(),
  respondedAt: z.number().optional(),
  respondedBy: z.string().optional(),
  comment: z.string().optional(),
  expiresAt: z.number().optional(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

// =============================================================================
// Metrics & Analysis
// =============================================================================

export const DeploymentMetricsSchema = z.object({
  deploymentId: z.string(),
  timestamp: z.number(),
  requestCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  latencyP50: z.number(),
  latencyP95: z.number(),
  latencyP99: z.number(),
  cpuUsage: z.number().optional(),
  memoryUsage: z.number().optional(),
  custom: z.record(z.number()).optional(),
});
export type DeploymentMetrics = z.infer<typeof DeploymentMetricsSchema>;

export const AnalysisResultSchema = z.object({
  deploymentId: z.string(),
  timestamp: z.number(),
  verdict: z.enum(["pass", "fail", "inconclusive"]),
  score: z.number().min(0).max(100),
  metrics: DeploymentMetricsSchema,
  thresholds: z.record(z.number()),
  violations: z.array(z.object({
    metric: z.string(),
    expected: z.number(),
    actual: z.number(),
  })).default([]),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// =============================================================================
// Rollback
// =============================================================================

export const RollbackReasonSchema = z.enum([
  "manual", // Manual rollback
  "failed_checks", // Pre/post checks failed
  "error_threshold", // Error rate exceeded
  "latency_threshold", // Latency exceeded
  "health_check", // Health check failure
  "approval_rejected", // Approval was rejected
  "timeout", // Deployment timed out
]);
export type RollbackReason = z.infer<typeof RollbackReasonSchema>;

export const RollbackSchema = z.object({
  id: z.string(),
  deploymentId: z.string(),
  reason: RollbackReasonSchema,
  initiatedAt: z.number(),
  completedAt: z.number().optional(),
  status: z.enum(["in_progress", "completed", "failed"]),
  targetArtifact: ArtifactSchema,
  initiatedBy: z.string().optional(),
  message: z.string().optional(),
});
export type Rollback = z.infer<typeof RollbackSchema>;

// =============================================================================
// Configuration
// =============================================================================

export const DeploymentManagerConfigSchema = z.object({
  // Defaults
  defaultStrategy: DeploymentStrategySchema.default("rolling"),
  defaultEnvironment: DeploymentEnvironmentSchema.default("staging"),

  // Timeouts
  deploymentTimeoutSeconds: z.number().default(1800), // 30 min
  approvalTimeoutSeconds: z.number().default(86400), // 24 hours
  checkTimeoutSeconds: z.number().default(300), // 5 min

  // Analysis
  analysisIntervalSeconds: z.number().default(30),
  metricsRetentionDays: z.number().default(30),

  // Rollback
  autoRollbackEnabled: z.boolean().default(true),
  rollbackCooldownSeconds: z.number().default(300),

  // Notifications
  notifyOnStart: z.boolean().default(true),
  notifyOnComplete: z.boolean().default(true),
  notifyOnFailure: z.boolean().default(true),
  notifyOnRollback: z.boolean().default(true),

  // Integrations
  metricsProvider: z.enum(["prometheus", "datadog", "cloudwatch", "custom"]).optional(),
  notificationProvider: z.enum(["slack", "email", "webhook", "custom"]).optional(),
});
export type DeploymentManagerConfig = z.infer<typeof DeploymentManagerConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type DeploymentEvents = {
  // Lifecycle
  deploymentCreated: (deployment: DeploymentDefinition) => void;
  deploymentStarted: (deploymentId: string) => void;
  deploymentCompleted: (deploymentId: string, duration: number) => void;
  deploymentFailed: (deploymentId: string, error: Error) => void;
  deploymentCancelled: (deploymentId: string) => void;

  // Phases
  phaseStarted: (deploymentId: string, phase: DeploymentPhase) => void;
  phaseCompleted: (deploymentId: string, phase: DeploymentPhase) => void;
  phaseFailed: (deploymentId: string, phase: DeploymentPhase, error: Error) => void;

  // Progress
  progressUpdated: (deploymentId: string, progress: number) => void;
  trafficShifted: (deploymentId: string, percent: number) => void;
  instanceUpdated: (deploymentId: string, instanceId: string, healthy: boolean) => void;

  // Checks
  checkStarted: (deploymentId: string, checkId: string) => void;
  checkCompleted: (deploymentId: string, result: CheckResult) => void;

  // Approval
  approvalRequested: (approval: Approval) => void;
  approvalReceived: (approval: Approval) => void;

  // Analysis
  analysisCompleted: (result: AnalysisResult) => void;

  // Rollback
  rollbackStarted: (rollback: Rollback) => void;
  rollbackCompleted: (rollback: Rollback) => void;
  rollbackFailed: (rollback: Rollback, error: Error) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface DeploymentStorage {
  // Deployments
  getDeployment(id: string): Promise<DeploymentDefinition | null>;
  saveDeployment(deployment: DeploymentDefinition): Promise<void>;
  listDeployments(filters?: { environment?: DeploymentEnvironment; status?: DeploymentStatus }): Promise<DeploymentDefinition[]>;

  // State
  getState(deploymentId: string): Promise<DeploymentState | null>;
  saveState(state: DeploymentState): Promise<void>;

  // Approvals
  getApproval(deploymentId: string): Promise<Approval | null>;
  saveApproval(approval: Approval): Promise<void>;

  // Checks
  saveCheckResult(deploymentId: string, result: CheckResult): Promise<void>;
  getCheckResults(deploymentId: string): Promise<CheckResult[]>;

  // Metrics
  saveMetrics(metrics: DeploymentMetrics): Promise<void>;
  getMetrics(deploymentId: string, startTime: number, endTime: number): Promise<DeploymentMetrics[]>;

  // Rollbacks
  saveRollback(rollback: Rollback): Promise<void>;
  getRollback(id: string): Promise<Rollback | null>;
  listRollbacks(deploymentId: string): Promise<Rollback[]>;

  // Artifacts
  getArtifact(id: string): Promise<Artifact | null>;
  saveArtifact(artifact: Artifact): Promise<void>;
  listArtifacts(name: string): Promise<Artifact[]>;
}
