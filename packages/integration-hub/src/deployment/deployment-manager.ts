/**
 * Deployment Manager Implementation
 * Phase 15D: Deployment Automation
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  DeploymentStrategy,
  DeploymentStatus,
  DeploymentEnvironment,
  DeploymentPhase,
  Artifact,
  ArtifactSchema,
  DeploymentTarget,
  DeploymentDefinition,
  DeploymentDefinitionSchema,
  DeploymentState,
  CheckResult,
  Approval,
  ApprovalStatus,
  DeploymentMetrics,
  AnalysisResult,
  Rollback,
  RollbackReason,
  DeploymentManagerConfig,
  DeploymentManagerConfigSchema,
  DeploymentEvents,
  DeploymentStorage,
  CanaryConfig,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemoryDeploymentStorage implements DeploymentStorage {
  private deployments = new Map<string, DeploymentDefinition>();
  private states = new Map<string, DeploymentState>();
  private approvals = new Map<string, Approval>();
  private checks = new Map<string, CheckResult[]>();
  private metrics = new Map<string, DeploymentMetrics[]>();
  private rollbacks = new Map<string, Rollback[]>();
  private artifacts = new Map<string, Artifact>();

  async getDeployment(id: string): Promise<DeploymentDefinition | null> {
    return this.deployments.get(id) ?? null;
  }

  async saveDeployment(deployment: DeploymentDefinition): Promise<void> {
    this.deployments.set(deployment.id, deployment);
  }

  async listDeployments(filters?: {
    environment?: DeploymentEnvironment;
    status?: DeploymentStatus;
  }): Promise<DeploymentDefinition[]> {
    let results = Array.from(this.deployments.values());

    if (filters?.environment) {
      results = results.filter(d => d.environment === filters.environment);
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  async getState(deploymentId: string): Promise<DeploymentState | null> {
    return this.states.get(deploymentId) ?? null;
  }

  async saveState(state: DeploymentState): Promise<void> {
    this.states.set(state.deploymentId, state);
  }

  async getApproval(deploymentId: string): Promise<Approval | null> {
    return this.approvals.get(deploymentId) ?? null;
  }

  async saveApproval(approval: Approval): Promise<void> {
    this.approvals.set(approval.deploymentId, approval);
  }

  async saveCheckResult(deploymentId: string, result: CheckResult): Promise<void> {
    const checks = this.checks.get(deploymentId) ?? [];
    const idx = checks.findIndex(c => c.id === result.id);
    if (idx >= 0) {
      checks[idx] = result;
    } else {
      checks.push(result);
    }
    this.checks.set(deploymentId, checks);
  }

  async getCheckResults(deploymentId: string): Promise<CheckResult[]> {
    return this.checks.get(deploymentId) ?? [];
  }

  async saveMetrics(metrics: DeploymentMetrics): Promise<void> {
    const existing = this.metrics.get(metrics.deploymentId) ?? [];
    existing.push(metrics);
    this.metrics.set(metrics.deploymentId, existing);
  }

  async getMetrics(deploymentId: string, startTime: number, endTime: number): Promise<DeploymentMetrics[]> {
    const all = this.metrics.get(deploymentId) ?? [];
    return all.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  async saveRollback(rollback: Rollback): Promise<void> {
    const existing = this.rollbacks.get(rollback.deploymentId) ?? [];
    const idx = existing.findIndex(r => r.id === rollback.id);
    if (idx >= 0) {
      existing[idx] = rollback;
    } else {
      existing.push(rollback);
    }
    this.rollbacks.set(rollback.deploymentId, existing);
  }

  async getRollback(id: string): Promise<Rollback | null> {
    for (const rollbacks of this.rollbacks.values()) {
      const found = rollbacks.find(r => r.id === id);
      if (found) return found;
    }
    return null;
  }

  async listRollbacks(deploymentId: string): Promise<Rollback[]> {
    return this.rollbacks.get(deploymentId) ?? [];
  }

  async getArtifact(id: string): Promise<Artifact | null> {
    return this.artifacts.get(id) ?? null;
  }

  async saveArtifact(artifact: Artifact): Promise<void> {
    this.artifacts.set(artifact.id, artifact);
  }

  async listArtifacts(name: string): Promise<Artifact[]> {
    return Array.from(this.artifacts.values())
      .filter(a => a.name === name)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

// =============================================================================
// Deployment Manager
// =============================================================================

export class DeploymentManager extends EventEmitter<DeploymentEvents> {
  private config: DeploymentManagerConfig;
  private storage: DeploymentStorage;
  private activeDeployments = new Map<string, NodeJS.Timeout>();
  private running = false;

  constructor(config: Partial<DeploymentManagerConfig> = {}) {
    super();
    this.config = DeploymentManagerConfigSchema.parse(config);
    this.storage = new InMemoryDeploymentStorage();
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setStorage(storage: DeploymentStorage): void {
    this.storage = storage;
  }

  // ---------------------------------------------------------------------------
  // Artifact Management
  // ---------------------------------------------------------------------------

  async registerArtifact(input: Omit<Artifact, "id" | "createdAt">): Promise<Artifact> {
    const artifact = ArtifactSchema.parse({
      ...input,
      id: randomUUID(),
      createdAt: Date.now(),
    });

    await this.storage.saveArtifact(artifact);
    return artifact;
  }

  async getArtifact(id: string): Promise<Artifact | null> {
    return this.storage.getArtifact(id);
  }

  async listArtifacts(name: string): Promise<Artifact[]> {
    return this.storage.listArtifacts(name);
  }

  // ---------------------------------------------------------------------------
  // Deployment CRUD
  // ---------------------------------------------------------------------------

  async createDeployment(
    input: Omit<DeploymentDefinition, "id" | "createdAt">
  ): Promise<DeploymentDefinition> {
    const deployment = DeploymentDefinitionSchema.parse({
      ...input,
      id: randomUUID(),
      createdAt: Date.now(),
    });

    await this.storage.saveDeployment(deployment);

    // Initialize state
    const state: DeploymentState = {
      deploymentId: deployment.id,
      status: "pending",
      phase: "validation",
      startedAt: Date.now(),
      updatedAt: Date.now(),
      progress: 0,
      currentStep: 0,
      totalSteps: this.calculateTotalSteps(deployment),
      trafficPercent: 0,
      totalInstances: 0,
      updatedInstances: 0,
      healthyInstances: 0,
      unhealthyInstances: 0,
      errors: [],
      logs: [],
    };

    await this.storage.saveState(state);
    this.emit("deploymentCreated", deployment);

    return deployment;
  }

  async getDeployment(id: string): Promise<DeploymentDefinition | null> {
    return this.storage.getDeployment(id);
  }

  async listDeployments(filters?: {
    environment?: DeploymentEnvironment;
    status?: DeploymentStatus;
  }): Promise<DeploymentDefinition[]> {
    return this.storage.listDeployments(filters);
  }

  async getState(deploymentId: string): Promise<DeploymentState | null> {
    return this.storage.getState(deploymentId);
  }

  private calculateTotalSteps(deployment: DeploymentDefinition): number {
    let steps = 3; // validation, deploying, finalization
    if (deployment.requiresApproval) steps++;
    if (deployment.preDeploymentChecks.length > 0) steps++;
    if (deployment.postDeploymentChecks.length > 0) steps++;
    if (deployment.strategy === "canary") {
      steps += (deployment.strategyConfig?.canary?.steps.length ?? 0);
    }
    return steps;
  }

  // ---------------------------------------------------------------------------
  // Deployment Execution
  // ---------------------------------------------------------------------------

  async startDeployment(deploymentId: string): Promise<void> {
    const deployment = await this.storage.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const state = await this.storage.getState(deploymentId);
    if (!state || state.status !== "pending") {
      throw new Error("Deployment is not in pending state");
    }

    await this.updateState(deploymentId, { status: "running" });
    this.emit("deploymentStarted", deploymentId);

    // Run deployment async
    this.runDeployment(deployment).catch(error => {
      this.emit("deploymentFailed", deploymentId, error);
    });
  }

  private async runDeployment(deployment: DeploymentDefinition): Promise<void> {
    const deploymentId = deployment.id;

    try {
      // Phase 1: Validation
      await this.runPhase(deploymentId, "validation", async () => {
        await this.validateDeployment(deployment);
      });

      // Phase 2: Approval (if required)
      if (deployment.requiresApproval) {
        await this.runPhase(deploymentId, "approval", async () => {
          await this.waitForApproval(deploymentId);
        });
      }

      // Phase 3: Preparation
      await this.runPhase(deploymentId, "preparation", async () => {
        await this.prepareDeployment(deployment);
      });

      // Phase 4: Pre-deployment checks
      if (deployment.preDeploymentChecks.length > 0) {
        await this.runPhase(deploymentId, "pre_checks", async () => {
          await this.runChecks(deploymentId, deployment.preDeploymentChecks, "pre");
        });
      }

      // Phase 5: Deploying
      await this.runPhase(deploymentId, "deploying", async () => {
        await this.executeDeployment(deployment);
      });

      // Phase 6: Post-deployment checks
      if (deployment.postDeploymentChecks.length > 0) {
        await this.runPhase(deploymentId, "post_checks", async () => {
          await this.runChecks(deploymentId, deployment.postDeploymentChecks, "post");
        });
      }

      // Phase 7: Finalization
      await this.runPhase(deploymentId, "finalization", async () => {
        await this.finalizeDeployment(deployment);
      });

      // Complete
      const state = await this.storage.getState(deploymentId);
      const duration = Date.now() - (state?.startedAt ?? Date.now());

      await this.updateState(deploymentId, {
        status: "completed",
        progress: 100,
        completedAt: Date.now(),
      });

      this.emit("deploymentCompleted", deploymentId, duration);
    } catch (error) {
      await this.handleDeploymentFailure(deployment, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async runPhase(
    deploymentId: string,
    phase: DeploymentPhase,
    execute: () => Promise<void>
  ): Promise<void> {
    const state = await this.storage.getState(deploymentId);
    if (!state || state.status !== "running") return;

    await this.updateState(deploymentId, { phase });
    this.emit("phaseStarted", deploymentId, phase);

    try {
      await execute();
      this.emit("phaseCompleted", deploymentId, phase);
    } catch (error) {
      this.emit("phaseFailed", deploymentId, phase, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    // Update progress
    const currentState = await this.storage.getState(deploymentId);
    if (currentState) {
      await this.updateState(deploymentId, {
        currentStep: currentState.currentStep + 1,
        progress: Math.round(((currentState.currentStep + 1) / currentState.totalSteps) * 100),
      });
    }
  }

  private async validateDeployment(deployment: DeploymentDefinition): Promise<void> {
    // Validate artifact exists
    if (!deployment.artifact) {
      throw new Error("No artifact specified");
    }

    // Validate targets
    if (!deployment.targets || deployment.targets.length === 0) {
      throw new Error("No deployment targets specified");
    }

    // Validate strategy config
    if (deployment.strategy === "canary" && !deployment.strategyConfig?.canary) {
      throw new Error("Canary strategy requires canary configuration");
    }

    if (deployment.strategy === "blue_green" && !deployment.strategyConfig?.blueGreen) {
      throw new Error("Blue/green strategy requires blueGreen configuration");
    }

    await this.addLog(deployment.id, "info", "Deployment validation completed");
  }

  private async prepareDeployment(deployment: DeploymentDefinition): Promise<void> {
    // In real implementation: pull artifacts, prepare resources
    await this.addLog(deployment.id, "info", `Preparing artifact: ${deployment.artifact.name}:${deployment.artifact.version}`);
    await this.sleep(500); // Simulate preparation
  }

  private async executeDeployment(deployment: DeploymentDefinition): Promise<void> {
    switch (deployment.strategy) {
      case "rolling":
        await this.executeRollingDeployment(deployment);
        break;
      case "blue_green":
        await this.executeBlueGreenDeployment(deployment);
        break;
      case "canary":
        await this.executeCanaryDeployment(deployment);
        break;
      case "recreate":
        await this.executeRecreateDeployment(deployment);
        break;
      default:
        await this.executeRollingDeployment(deployment);
    }
  }

  private async executeRollingDeployment(deployment: DeploymentDefinition): Promise<void> {
    const totalInstances = deployment.targets.reduce((sum, t) => sum + (t.replicas ?? 1), 0);
    await this.updateState(deployment.id, { totalInstances });

    for (let i = 0; i < totalInstances; i++) {
      await this.addLog(deployment.id, "info", `Updating instance ${i + 1}/${totalInstances}`);
      await this.sleep(100); // Simulate instance update

      await this.updateState(deployment.id, {
        updatedInstances: i + 1,
        healthyInstances: i + 1,
      });

      this.emit("instanceUpdated", deployment.id, `instance-${i}`, true);
    }
  }

  private async executeBlueGreenDeployment(deployment: DeploymentDefinition): Promise<void> {
    const config = deployment.strategyConfig?.blueGreen;
    if (!config) return;

    await this.addLog(deployment.id, "info", "Deploying to green environment");
    await this.sleep(500);

    await this.addLog(deployment.id, "info", "Warming up green environment");
    await this.sleep(config.warmupSeconds * 10); // Accelerated for demo

    await this.addLog(deployment.id, "info", `Switching ${config.switchTrafficPercent}% traffic to green`);
    await this.updateState(deployment.id, { trafficPercent: config.switchTrafficPercent });
    this.emit("trafficShifted", deployment.id, config.switchTrafficPercent);
  }

  private async executeCanaryDeployment(deployment: DeploymentDefinition): Promise<void> {
    const config = deployment.strategyConfig?.canary;
    if (!config) return;

    for (const step of config.steps) {
      await this.addLog(deployment.id, "info", `Shifting ${step.percent}% traffic to canary`);
      await this.updateState(deployment.id, { trafficPercent: step.percent, phase: "canary_analysis" });
      this.emit("trafficShifted", deployment.id, step.percent);

      // Run analysis
      await this.sleep(step.durationSeconds * 10); // Accelerated

      const metrics = await this.collectMetrics(deployment.id);
      const analysis = this.analyzeMetrics(deployment.id, metrics, config);

      this.emit("analysisCompleted", analysis);

      if (analysis.verdict === "fail") {
        throw new Error(`Canary analysis failed at ${step.percent}%: ${analysis.violations.map(v => v.metric).join(", ")}`);
      }

      if (step.pauseForAnalysis) {
        await this.addLog(deployment.id, "info", "Paused for manual analysis review");
      }
    }

    await this.updateState(deployment.id, { trafficPercent: 100 });
  }

  private async executeRecreateDeployment(deployment: DeploymentDefinition): Promise<void> {
    await this.addLog(deployment.id, "info", "Stopping existing instances");
    await this.updateState(deployment.id, { healthyInstances: 0 });
    await this.sleep(300);

    await this.addLog(deployment.id, "info", "Starting new instances");
    const totalInstances = deployment.targets.reduce((sum, t) => sum + (t.replicas ?? 1), 0);
    await this.updateState(deployment.id, {
      totalInstances,
      updatedInstances: totalInstances,
      healthyInstances: totalInstances,
    });
  }

  private async runChecks(deploymentId: string, checkNames: string[], phase: "pre" | "post"): Promise<void> {
    for (const checkName of checkNames) {
      const check: CheckResult = {
        id: randomUUID(),
        name: checkName,
        type: "custom",
        status: "running",
        startedAt: Date.now(),
      };

      await this.storage.saveCheckResult(deploymentId, check);
      this.emit("checkStarted", deploymentId, check.id);

      await this.sleep(200); // Simulate check execution

      check.status = "passed";
      check.completedAt = Date.now();
      check.duration = check.completedAt - check.startedAt!;

      await this.storage.saveCheckResult(deploymentId, check);
      this.emit("checkCompleted", deploymentId, check);
    }
  }

  private async finalizeDeployment(deployment: DeploymentDefinition): Promise<void> {
    await this.addLog(deployment.id, "info", "Finalizing deployment");
    await this.sleep(200);

    // In real implementation: cleanup old resources, update DNS, etc.
  }

  private async collectMetrics(deploymentId: string): Promise<DeploymentMetrics> {
    const metrics: DeploymentMetrics = {
      deploymentId,
      timestamp: Date.now(),
      requestCount: Math.floor(Math.random() * 1000) + 100,
      errorCount: Math.floor(Math.random() * 10),
      errorRate: Math.random() * 2, // 0-2%
      latencyP50: Math.random() * 100 + 20,
      latencyP95: Math.random() * 200 + 50,
      latencyP99: Math.random() * 300 + 100,
    };

    await this.storage.saveMetrics(metrics);
    return metrics;
  }

  private analyzeMetrics(deploymentId: string, metrics: DeploymentMetrics, config: CanaryConfig): AnalysisResult {
    const violations: Array<{ metric: string; expected: number; actual: number }> = [];

    if (metrics.errorRate > config.errorThreshold) {
      violations.push({ metric: "errorRate", expected: config.errorThreshold, actual: metrics.errorRate });
    }

    if (metrics.latencyP99 > config.latencyThreshold) {
      violations.push({ metric: "latencyP99", expected: config.latencyThreshold, actual: metrics.latencyP99 });
    }

    const successRate = 100 - metrics.errorRate;
    if (successRate < config.successThreshold) {
      violations.push({ metric: "successRate", expected: config.successThreshold, actual: successRate });
    }

    return {
      deploymentId,
      timestamp: Date.now(),
      verdict: violations.length === 0 ? "pass" : "fail",
      score: Math.max(0, 100 - violations.length * 25),
      metrics,
      thresholds: {
        errorThreshold: config.errorThreshold,
        latencyThreshold: config.latencyThreshold,
        successThreshold: config.successThreshold,
      },
      violations,
    };
  }

  // ---------------------------------------------------------------------------
  // Approval
  // ---------------------------------------------------------------------------

  async requestApproval(deploymentId: string, requestedBy?: string): Promise<Approval> {
    const approval: Approval = {
      id: randomUUID(),
      deploymentId,
      status: "pending",
      requestedAt: Date.now(),
      requestedBy,
      expiresAt: Date.now() + this.config.approvalTimeoutSeconds * 1000,
    };

    await this.storage.saveApproval(approval);
    this.emit("approvalRequested", approval);
    return approval;
  }

  async approveDeployment(deploymentId: string, respondedBy: string, comment?: string): Promise<void> {
    const approval = await this.storage.getApproval(deploymentId);
    if (!approval || approval.status !== "pending") {
      throw new Error("No pending approval found");
    }

    approval.status = "approved";
    approval.respondedAt = Date.now();
    approval.respondedBy = respondedBy;
    approval.comment = comment;

    await this.storage.saveApproval(approval);
    this.emit("approvalReceived", approval);
  }

  async rejectDeployment(deploymentId: string, respondedBy: string, comment?: string): Promise<void> {
    const approval = await this.storage.getApproval(deploymentId);
    if (!approval || approval.status !== "pending") {
      throw new Error("No pending approval found");
    }

    approval.status = "rejected";
    approval.respondedAt = Date.now();
    approval.respondedBy = respondedBy;
    approval.comment = comment;

    await this.storage.saveApproval(approval);
    this.emit("approvalReceived", approval);
  }

  private async waitForApproval(deploymentId: string): Promise<void> {
    const approval = await this.requestApproval(deploymentId);

    // Poll for approval
    const startTime = Date.now();
    while (Date.now() - startTime < this.config.approvalTimeoutSeconds * 1000) {
      const current = await this.storage.getApproval(deploymentId);

      if (current?.status === "approved") {
        return;
      }

      if (current?.status === "rejected") {
        throw new Error(`Deployment rejected: ${current.comment ?? "No reason provided"}`);
      }

      await this.sleep(5000);
    }

    throw new Error("Approval timeout");
  }

  // ---------------------------------------------------------------------------
  // Rollback
  // ---------------------------------------------------------------------------

  async rollback(deploymentId: string, reason: RollbackReason, initiatedBy?: string): Promise<Rollback> {
    const deployment = await this.storage.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    if (!deployment.previousArtifact) {
      throw new Error("No previous artifact to rollback to");
    }

    const rollback: Rollback = {
      id: randomUUID(),
      deploymentId,
      reason,
      initiatedAt: Date.now(),
      status: "in_progress",
      targetArtifact: deployment.previousArtifact,
      initiatedBy,
    };

    await this.storage.saveRollback(rollback);
    await this.updateState(deploymentId, { status: "rolled_back" });
    this.emit("rollbackStarted", rollback);

    try {
      // Execute rollback
      await this.addLog(deploymentId, "warn", `Initiating rollback: ${reason}`);

      // Create rollback deployment
      const rollbackDeployment = await this.createDeployment({
        ...deployment,
        name: `${deployment.name} (rollback)`,
        artifact: deployment.previousArtifact,
        previousArtifact: deployment.artifact,
        requiresApproval: false,
      });

      await this.startDeployment(rollbackDeployment.id);

      rollback.status = "completed";
      rollback.completedAt = Date.now();
      await this.storage.saveRollback(rollback);
      this.emit("rollbackCompleted", rollback);
    } catch (error) {
      rollback.status = "failed";
      await this.storage.saveRollback(rollback);
      this.emit("rollbackFailed", rollback, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    return rollback;
  }

  private async handleDeploymentFailure(deployment: DeploymentDefinition, error: Error): Promise<void> {
    const state = await this.storage.getState(deployment.id);

    await this.updateState(deployment.id, {
      status: "failed",
      errors: [...(state?.errors ?? []), {
        timestamp: Date.now(),
        phase: state?.phase ?? "deploying",
        message: error.message,
      }],
    });

    this.emit("deploymentFailed", deployment.id, error);

    // Auto-rollback if enabled
    if (deployment.autoRollback && deployment.previousArtifact) {
      await this.addLog(deployment.id, "warn", "Auto-rollback triggered");
      await this.rollback(deployment.id, "failed_checks");
    }
  }

  // ---------------------------------------------------------------------------
  // Cancel
  // ---------------------------------------------------------------------------

  async cancelDeployment(deploymentId: string): Promise<void> {
    const state = await this.storage.getState(deploymentId);
    if (!state || state.status !== "running") {
      throw new Error("Deployment is not running");
    }

    await this.updateState(deploymentId, { status: "cancelled" });
    this.emit("deploymentCancelled", deploymentId);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async updateState(deploymentId: string, updates: Partial<DeploymentState>): Promise<void> {
    const state = await this.storage.getState(deploymentId);
    if (!state) return;

    const updated: DeploymentState = {
      ...state,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.storage.saveState(updated);

    if (updates.progress !== undefined) {
      this.emit("progressUpdated", deploymentId, updates.progress);
    }
  }

  private async addLog(deploymentId: string, level: "debug" | "info" | "warn" | "error", message: string): Promise<void> {
    const state = await this.storage.getState(deploymentId);
    if (!state) return;

    state.logs.push({ timestamp: Date.now(), level, message });
    await this.storage.saveState(state);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async start(): Promise<void> {
    this.running = true;
  }

  async stop(): Promise<void> {
    this.running = false;
    for (const [id, timeout] of this.activeDeployments) {
      clearTimeout(timeout);
    }
    this.activeDeployments.clear();
  }

  isRunning(): boolean {
    return this.running;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultManager: DeploymentManager | null = null;

export function getDeploymentManager(): DeploymentManager {
  if (!defaultManager) {
    defaultManager = new DeploymentManager();
  }
  return defaultManager;
}

export function createDeploymentManager(config?: Partial<DeploymentManagerConfig>): DeploymentManager {
  return new DeploymentManager(config);
}
