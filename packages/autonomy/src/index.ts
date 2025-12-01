/**
 * @gicm/autonomy - Level 2+ Autonomy System
 *
 * Provides bounded autonomous execution with human oversight:
 * - Risk classification and decision routing
 * - Auto-execution within safe boundaries
 * - Approval queue for higher-risk actions
 * - Complete audit trail
 */

import { EventEmitter } from "eventemitter3";
import type {
  Action,
  Decision,
  ExecutionResult,
  ApprovalRequest,
  AutonomyConfig,
  Boundaries,
} from "./core/types.js";
import { createConfig, loadConfigFromEnv } from "./core/config.js";
import { DecisionRouter } from "./decision/decision-router.js";
import { AutoExecutor } from "./execution/auto-executor.js";
import { ApprovalQueue } from "./approval/approval-queue.js";
import { NotificationManager } from "./approval/notification-manager.js";
import { BatchApproval } from "./approval/batch-approval.js";
import { AuditLogger } from "./audit/audit-logger.js";
import { Logger } from "./utils/logger.js";

export interface AutonomyEngineEvents {
  "started": () => void;
  "stopped": () => void;
  "action:received": (action: Action) => void;
  "decision:made": (decision: Decision) => void;
  "execution:completed": (result: ExecutionResult) => void;
  "execution:failed": (result: ExecutionResult) => void;
  "approval:queued": (request: ApprovalRequest) => void;
  "approval:granted": (request: ApprovalRequest) => void;
  "approval:rejected": (request: ApprovalRequest, reason: string) => void;
  "escalation": (request: ApprovalRequest) => void;
}

/**
 * Main Autonomy Engine
 *
 * Orchestrates all autonomy components:
 * - Decision routing
 * - Auto-execution
 * - Approval queue
 * - Notifications
 * - Audit logging
 */
export class AutonomyEngine extends EventEmitter<AutonomyEngineEvents> {
  private logger: Logger;
  private config: AutonomyConfig;
  private router: DecisionRouter;
  private executor: AutoExecutor;
  private approvalQueue: ApprovalQueue;
  private batchApproval: BatchApproval;
  private notifications: NotificationManager;
  private audit: AuditLogger;
  private running = false;

  constructor(config?: Partial<AutonomyConfig>) {
    super();
    this.logger = new Logger("AutonomyEngine");

    // Merge config with env vars and defaults
    const envConfig = loadConfigFromEnv();
    this.config = createConfig({ ...envConfig, ...config });

    // Initialize components
    this.router = new DecisionRouter({
      autonomyLevel: this.config.level as 1 | 2 | 3 | 4,
      boundaries: this.config.boundaries,
    });

    this.executor = new AutoExecutor();

    this.approvalQueue = new ApprovalQueue({
      maxPendingItems: this.config.approval.maxPendingItems,
      autoExpireHours: this.config.approval.autoExpireHours,
    });

    this.batchApproval = new BatchApproval(this.approvalQueue);

    this.notifications = new NotificationManager({
      channels: this.config.notifications.channels,
      rateLimitPerMinute: this.config.notifications.rateLimitPerMinute,
    });

    this.audit = new AuditLogger({
      retentionDays: this.config.audit.retentionDays,
    });

    // Wire up events
    this.setupEventHandlers();
  }

  /**
   * Start the autonomy engine
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    this.logger.info("Autonomy engine started", {
      level: this.config.level,
      notificationsConfigured: this.notifications.isConfigured(),
    });

    this.emit("started");
  }

  /**
   * Stop the autonomy engine
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;
    this.approvalQueue.stop();
    this.logger.info("Autonomy engine stopped");

    this.emit("stopped");
  }

  /**
   * Route an action through the autonomy system
   */
  async route(action: Action): Promise<Decision> {
    if (!this.running) {
      throw new Error("Autonomy engine not running");
    }

    this.emit("action:received", action);
    this.audit.logActionReceived(action);

    // Route through decision system
    const decision = await this.router.route(action);

    this.audit.logRiskAssessed(action, decision);
    this.audit.logDecisionMade(decision);
    this.emit("decision:made", decision);

    // Handle based on outcome
    switch (decision.outcome) {
      case "auto_execute":
        await this.handleAutoExecute(decision);
        break;

      case "queue_approval":
        await this.handleQueueApproval(decision);
        break;

      case "escalate":
        await this.handleEscalate(decision);
        break;

      case "reject":
        this.logger.info(`Rejected: ${action.type}`, { reason: decision.reason });
        this.audit.logBoundaryViolation(action, [decision.reason]);
        break;
    }

    return decision;
  }

  /**
   * Approve a pending request
   */
  async approve(
    requestId: string,
    approvedBy = "human",
    feedback?: string
  ): Promise<ApprovalRequest | null> {
    const request = this.approvalQueue.approve(requestId, approvedBy, feedback);

    if (request) {
      this.audit.logApproved(request);
      this.emit("approval:granted", request);

      // Notify
      await this.notifications.notifyApprovalDecision(request, true);

      // Execute the approved action
      await this.handleAutoExecute(request.decision);
    }

    return request;
  }

  /**
   * Reject a pending request
   */
  async reject(
    requestId: string,
    reason: string,
    rejectedBy = "human"
  ): Promise<ApprovalRequest | null> {
    const request = this.approvalQueue.reject(requestId, reason, rejectedBy);

    if (request) {
      this.audit.logRejected(request, reason);
      this.emit("approval:rejected", request, reason);

      // Notify
      await this.notifications.notifyApprovalDecision(request, false, reason);
    }

    return request;
  }

  /**
   * Get pending approval queue
   */
  getQueue(): ApprovalRequest[] {
    return this.approvalQueue.getPending();
  }

  /**
   * Get batch approval interface
   */
  getBatch(): BatchApproval {
    return this.batchApproval;
  }

  /**
   * Get current boundaries
   */
  getBoundaries(): Boundaries {
    return this.router.getBoundaryChecker().getBoundaries();
  }

  /**
   * Update boundaries at runtime
   */
  updateBoundaries(updates: Partial<Boundaries>): void {
    this.router.updateBoundaries(updates);
    this.logger.info("Boundaries updated");
  }

  /**
   * Get usage statistics for today
   */
  getUsageToday() {
    return this.router.getBoundaryChecker().getUsageToday();
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.approvalQueue.getStats();
  }

  /**
   * Get audit entries
   */
  getAuditLog() {
    return this.audit.getEntries();
  }

  /**
   * Get executor stats
   */
  getExecutorStats() {
    return this.executor.getStats();
  }

  /**
   * Check if engine is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get autonomy level
   */
  getLevel(): number {
    return this.config.level;
  }

  /**
   * Get full status
   */
  getStatus(): {
    running: boolean;
    level: number;
    queue: ReturnType<ApprovalQueue["getStats"]>;
    usage: import("./core/types.js").DailyUsage;
    executor: ReturnType<AutoExecutor["getStats"]>;
    audit: ReturnType<AuditLogger["getStats"]>;
  } {
    return {
      running: this.running,
      level: this.config.level,
      queue: this.approvalQueue.getStats(),
      usage: this.getUsageToday(),
      executor: this.executor.getStats(),
      audit: this.audit.getStats(),
    };
  }

  // Private methods

  private setupEventHandlers(): void {
    // Router events
    this.router.on("decision:auto_execute", (decision) => {
      this.logger.debug(`Auto-execute: ${decision.action.type}`);
    });

    this.router.on("boundary:violation", (action, violations) => {
      this.audit.logBoundaryViolation(action, violations);
    });

    // Approval queue events
    this.approvalQueue.on("item:escalated", async (request) => {
      this.audit.logEscalated(request);
      this.emit("escalation", request);
      await this.notifications.notifyEscalation(request);
    });

    // Executor events
    this.executor.on("execution:completed", (result) => {
      this.audit.logExecuted(result);
      this.emit("execution:completed", result);
    });

    this.executor.on("execution:failed", (result) => {
      this.audit.logExecutionFailed(result);
      this.emit("execution:failed", result);
    });

    this.executor.on("execution:rolled_back", (actionId) => {
      this.audit.logRolledBack(actionId, "");
    });
  }

  private async handleAutoExecute(decision: Decision): Promise<void> {
    this.logger.info(`Auto-executing: ${decision.action.type}`);

    const result = await this.executor.execute(decision);

    if (result.success) {
      // Record usage
      this.router.recordExecution(decision.action);
    }
  }

  private async handleQueueApproval(decision: Decision): Promise<void> {
    const request = this.approvalQueue.add(decision);

    this.audit.logQueuedApproval(request);
    this.emit("approval:queued", request);

    this.logger.info(`Queued for approval: ${decision.action.type}`, {
      requestId: request.id,
      priority: request.priority,
    });

    // Send notification
    if (this.config.approval.notifyOnNewItem) {
      await this.notifications.notifyApprovalNeeded(request);
      this.approvalQueue.markNotificationSent(request.id, "initial");
    }
  }

  private async handleEscalate(decision: Decision): Promise<void> {
    // Queue with high priority and immediate notification
    const request = this.approvalQueue.add(decision);

    this.audit.logEscalated(request);
    this.emit("escalation", request);

    this.logger.warn(`Escalated: ${decision.action.type}`, {
      requestId: request.id,
      riskLevel: decision.assessment.level,
    });

    // Send escalation notification immediately
    await this.notifications.notifyEscalation(request);
    this.approvalQueue.markNotificationSent(request.id, "escalation");
  }
}

// Singleton instance
let instance: AutonomyEngine | null = null;

/**
 * Get or create the autonomy engine singleton
 */
export function getAutonomy(config?: Partial<AutonomyConfig>): AutonomyEngine {
  if (!instance) {
    instance = new AutonomyEngine(config);
    instance.start();
  }
  return instance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetAutonomy(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}

// Re-export all modules
export * from "./core/types.js";
export * from "./core/config.js";
export * from "./core/constants.js";
export * from "./decision/index.js";
export * from "./execution/index.js";
export * from "./approval/index.js";
export * from "./audit/index.js";
export * from "./integration/index.js";
export { Logger } from "./utils/logger.js";

// Alias for backward compatibility
export { AutonomyEngine as AutonomySystem };
