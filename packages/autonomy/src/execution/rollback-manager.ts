/**
 * Rollback Manager
 *
 * Creates checkpoints before action execution
 * Enables undo/rollback for reversible actions
 */

import type { Action, Decision, RollbackCheckpoint } from "../core/types.js";
import { Logger } from "../utils/logger.js";

export type RollbackHandler = (checkpoint: RollbackCheckpoint) => Promise<void>;

export interface RollbackManagerConfig {
  /** Maximum checkpoints to keep in memory */
  maxCheckpoints?: number;
  /** Checkpoint TTL in milliseconds (default 24h) */
  checkpointTtl?: number;
}

export class RollbackManager {
  private logger: Logger;
  private checkpoints: Map<string, RollbackCheckpoint>;
  private handlers: Map<string, RollbackHandler>;
  private maxCheckpoints: number;
  private checkpointTtl: number;

  constructor(config: RollbackManagerConfig = {}) {
    this.logger = new Logger("RollbackManager");
    this.checkpoints = new Map();
    this.handlers = new Map();
    this.maxCheckpoints = config.maxCheckpoints ?? 100;
    this.checkpointTtl = config.checkpointTtl ?? 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Create a checkpoint before executing an action
   */
  async createCheckpoint(decision: Decision): Promise<RollbackCheckpoint> {
    const action = decision.action;

    // Only create checkpoint for reversible actions
    if (!action.metadata.reversible) {
      this.logger.warn(`Action ${action.type} is not reversible, no checkpoint created`);
      throw new Error("Cannot create checkpoint for irreversible action");
    }

    // Clean up old checkpoints
    this.cleanupExpired();

    // Enforce max checkpoints limit
    if (this.checkpoints.size >= this.maxCheckpoints) {
      this.removeOldest();
    }

    const checkpoint: RollbackCheckpoint = {
      id: `ckpt_${Date.now()}_${action.id}`,
      actionId: action.id,
      decisionId: decision.id,
      state: await this.captureState(action),
      createdAt: Date.now(),
    };

    this.checkpoints.set(checkpoint.id, checkpoint);
    this.logger.info(`Checkpoint created: ${checkpoint.id}`, {
      actionId: action.id,
      actionType: action.type,
    });

    return checkpoint;
  }

  /**
   * Restore state from a checkpoint (rollback)
   */
  async rollback(checkpointId: string): Promise<void> {
    const checkpoint = this.checkpoints.get(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    this.logger.info(`Rolling back checkpoint: ${checkpointId}`);

    // Find and execute rollback handler
    const handler = this.findHandler(checkpoint);
    if (handler) {
      await handler(checkpoint);
    } else {
      // Generic rollback (log only)
      this.logger.warn(`No rollback handler found, logging state only`, {
        checkpointId,
        state: checkpoint.state,
      });
    }

    // Remove checkpoint after rollback
    this.checkpoints.delete(checkpointId);

    this.logger.info(`Rollback complete: ${checkpointId}`);
  }

  /**
   * Rollback by action ID
   */
  async rollbackByActionId(actionId: string): Promise<void> {
    const checkpoint = this.findByActionId(actionId);

    if (!checkpoint) {
      throw new Error(`No checkpoint found for action: ${actionId}`);
    }

    await this.rollback(checkpoint.id);
  }

  /**
   * Register a rollback handler for an action type
   */
  registerHandler(actionType: string, handler: RollbackHandler): void {
    this.handlers.set(actionType, handler);
    this.logger.info(`Rollback handler registered for: ${actionType}`);
  }

  /**
   * Check if rollback is available for an action
   */
  canRollback(actionId: string): boolean {
    const checkpoint = this.findByActionId(actionId);
    if (!checkpoint) return false;

    // Check if checkpoint is still valid (not expired)
    const age = Date.now() - checkpoint.createdAt;
    return age < this.checkpointTtl;
  }

  /**
   * Get checkpoint for an action
   */
  getCheckpoint(checkpointId: string): RollbackCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Get checkpoint by action ID
   */
  findByActionId(actionId: string): RollbackCheckpoint | undefined {
    for (const checkpoint of this.checkpoints.values()) {
      if (checkpoint.actionId === actionId) {
        return checkpoint;
      }
    }
    return undefined;
  }

  /**
   * Get all active checkpoints
   */
  getActiveCheckpoints(): RollbackCheckpoint[] {
    this.cleanupExpired();
    return Array.from(this.checkpoints.values());
  }

  /**
   * Clear all checkpoints
   */
  clear(): void {
    this.checkpoints.clear();
    this.logger.info("All checkpoints cleared");
  }

  // Private methods

  /**
   * Capture state before action execution
   */
  private async captureState(action: Action): Promise<Record<string, unknown>> {
    // Generic state capture - actual implementation would depend on action type
    return {
      timestamp: Date.now(),
      actionType: action.type,
      category: action.category,
      params: { ...action.params },
      // Additional state would be captured by registered handlers
    };
  }

  /**
   * Find appropriate rollback handler for a checkpoint
   */
  private findHandler(checkpoint: RollbackCheckpoint): RollbackHandler | undefined {
    const actionType = checkpoint.state.actionType as string;

    // Direct match
    if (this.handlers.has(actionType)) {
      return this.handlers.get(actionType);
    }

    // Pattern match
    for (const [type, handler] of this.handlers) {
      if (actionType.includes(type)) {
        return handler;
      }
    }

    return undefined;
  }

  /**
   * Remove expired checkpoints
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, checkpoint] of this.checkpoints) {
      if (now - checkpoint.createdAt > this.checkpointTtl) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      this.checkpoints.delete(id);
    }

    if (expired.length > 0) {
      this.logger.debug(`Cleaned up ${expired.length} expired checkpoints`);
    }
  }

  /**
   * Remove oldest checkpoint
   */
  private removeOldest(): void {
    let oldest: RollbackCheckpoint | null = null;

    for (const checkpoint of this.checkpoints.values()) {
      if (!oldest || checkpoint.createdAt < oldest.createdAt) {
        oldest = checkpoint;
      }
    }

    if (oldest) {
      this.checkpoints.delete(oldest.id);
      this.logger.debug(`Removed oldest checkpoint: ${oldest.id}`);
    }
  }
}
