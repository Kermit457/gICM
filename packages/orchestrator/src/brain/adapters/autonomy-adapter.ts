/**
 * Autonomy Adapter
 *
 * Integrates the gICM Autonomy System with the Brain.
 * Routes all engine actions through bounded decision-making.
 */

import {
  AutonomySystem,
  type AutonomyConfig,
  type Action,
  type Boundaries,
  type DecisionRoute,
  type EngineType,
} from "@gicm/autonomy";

export interface AutonomyAdapterConfig extends AutonomyConfig {
  onAutoExecuted?: (action: Action) => void;
  onQueued?: (action: Action) => void;
  onEscalated?: (action: Action) => void;
  onApproved?: (action: Action) => void;
  onRejected?: (action: Action) => void;
  onExecuted?: (action: Action) => void;
  onFailed?: (action: Action, error: Error) => void;
}

export interface AutonomyAdapter {
  /**
   * Process an action through the autonomy system
   */
  processAction(params: {
    engine: EngineType;
    type: string;
    description?: string;
    params?: Record<string, unknown>;
    estimatedCost?: number;
  }): Promise<{ route: DecisionRoute; actionId: string }>;

  /**
   * Approve a queued action
   */
  approve(actionId: string, feedback?: string): Promise<boolean>;

  /**
   * Reject a queued action
   */
  reject(actionId: string, feedback?: string): boolean;

  /**
   * Get pending approvals
   */
  getPendingApprovals(): Array<{
    actionId: string;
    type: string;
    engine: EngineType;
    risk: { level: string; score: number };
    urgency: string;
    recommendation: string;
  }>;

  /**
   * Get current boundaries
   */
  getBoundaries(): Boundaries;

  /**
   * Update boundaries dynamically
   */
  updateBoundaries(newBoundaries: Partial<Boundaries>): void;

  /**
   * Get autonomy stats
   */
  getStats(): {
    queue: { pending: number; approved: number; rejected: number };
    audit: { total: number; successRate: number; totalCost: number };
    today: { autoExecuted: number; queued: number; escalated: number };
  };

  /**
   * Send daily summary notification
   */
  sendDailySummary(): Promise<void>;

  /**
   * Shutdown the autonomy system
   */
  shutdown(): void;
}

/**
 * Create an autonomy adapter
 */
export function createAutonomyAdapter(config: AutonomyAdapterConfig = {}): AutonomyAdapter {
  const system = new AutonomySystem({
    boundaries: config.boundaries,
    notifications: config.notifications,
    enableBatching: config.enableBatching,
  });

  // Wire up event handlers
  if (config.onAutoExecuted) {
    system.on("action:auto_executed", config.onAutoExecuted);
  }
  if (config.onQueued) {
    system.on("action:queued", config.onQueued);
  }
  if (config.onEscalated) {
    system.on("action:escalated", config.onEscalated);
  }
  if (config.onApproved) {
    system.on("action:approved", config.onApproved);
  }
  if (config.onRejected) {
    system.on("action:rejected", config.onRejected);
  }
  if (config.onExecuted) {
    system.on("action:executed", config.onExecuted);
  }
  if (config.onFailed) {
    system.on("action:failed", config.onFailed);
  }

  return {
    async processAction(params) {
      const result = await system.processAction({
        engine: params.engine,
        type: params.type,
        description: params.description,
        params: params.params,
        risk: params.estimatedCost
          ? {
              level: "safe",
              score: 0,
              factors: [],
              estimatedCost: params.estimatedCost,
              maxPotentialLoss: params.estimatedCost,
              reversible: true,
            }
          : undefined,
      });

      return {
        route: result.route,
        actionId: result.action.id,
      };
    },

    async approve(actionId, feedback) {
      return system.approveAction(actionId, feedback);
    },

    reject(actionId, feedback) {
      return system.rejectAction(actionId, feedback);
    },

    getPendingApprovals() {
      return system.getPendingApprovals().map((item) => ({
        actionId: item.action.id,
        type: item.action.type,
        engine: item.action.engine,
        risk: {
          level: item.action.risk.level,
          score: item.action.risk.score,
        },
        urgency: item.urgency,
        recommendation: item.recommendation,
      }));
    },

    getBoundaries() {
      return system.getBoundaries();
    },

    updateBoundaries(newBoundaries) {
      system.updateBoundaries(newBoundaries);
    },

    getStats() {
      const queueStats = system.getQueueStats();
      const auditSummary = system.getAuditSummary();
      const dailySummary = system.getDailySummary();

      return {
        queue: {
          pending: queueStats.pending,
          approved: queueStats.approved,
          rejected: queueStats.rejected,
        },
        audit: {
          total: auditSummary.total,
          successRate: auditSummary.successRate,
          totalCost: auditSummary.totalCost,
        },
        today: {
          autoExecuted: dailySummary.autoExecuted,
          queued: dailySummary.queued,
          escalated: dailySummary.escalated,
        },
      };
    },

    async sendDailySummary() {
      await system.sendDailySummary();
    },

    shutdown() {
      system.shutdown();
    },
  };
}
