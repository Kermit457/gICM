/**
 * Auto-Executor for Level 2 Autonomy
 *
 * Executes approved actions with:
 * - Checkpoint creation for reversible actions
 * - Error handling with automatic rollback
 * - Event emission for monitoring
 */

import { EventEmitter } from "eventemitter3";
import type { Action, Decision, ExecutionResult } from "../core/types.js";
import { SafeActions, type ActionHandler } from "./safe-actions.js";
import { RollbackManager } from "./rollback-manager.js";
import { Logger } from "../utils/logger.js";
import { RATE_LIMITS } from "../core/constants.js";

export interface AutoExecutorConfig {
  /** Maximum concurrent executions */
  maxConcurrent?: number;
  /** Cooldown after failure in ms */
  cooldownAfterFailureMs?: number;
  /** Enable automatic rollback on failure */
  autoRollback?: boolean;
}

export interface AutoExecutorEvents {
  "execution:started": (decision: Decision) => void;
  "execution:completed": (result: ExecutionResult) => void;
  "execution:failed": (result: ExecutionResult) => void;
  "execution:rolled_back": (actionId: string) => void;
  "execution:rate_limited": (action: Action) => void;
}

export class AutoExecutor extends EventEmitter<AutoExecutorEvents> {
  private logger: Logger;
  private safeActions: SafeActions;
  private rollbackManager: RollbackManager;
  private config: Required<AutoExecutorConfig>;

  private executing: Set<string>;
  private executionCount: number;
  private lastExecutionTime: number;
  private failedActions: Map<string, number>; // actionType -> lastFailureTime

  constructor(config: AutoExecutorConfig = {}) {
    super();
    this.logger = new Logger("AutoExecutor");
    this.safeActions = new SafeActions();
    this.rollbackManager = new RollbackManager();

    this.config = {
      maxConcurrent: config.maxConcurrent ?? 5,
      cooldownAfterFailureMs:
        config.cooldownAfterFailureMs ?? RATE_LIMITS.cooldownAfterFailureMs,
      autoRollback: config.autoRollback ?? true,
    };

    this.executing = new Set();
    this.executionCount = 0;
    this.lastExecutionTime = 0;
    this.failedActions = new Map();
  }

  /**
   * Execute an approved action
   */
  async execute(decision: Decision): Promise<ExecutionResult> {
    const action = decision.action;

    // Validate decision is approved
    if (decision.outcome !== "auto_execute") {
      return this.createFailedResult(
        decision,
        "Decision not approved for auto-execution"
      );
    }

    // Check rate limiting
    if (!this.checkRateLimit()) {
      this.emit("execution:rate_limited", action);
      return this.createFailedResult(decision, "Rate limit exceeded");
    }

    // Check concurrent limit
    if (this.executing.size >= this.config.maxConcurrent) {
      return this.createFailedResult(
        decision,
        "Maximum concurrent executions reached"
      );
    }

    // Check cooldown for action type
    if (this.isInCooldown(action.type)) {
      return this.createFailedResult(
        decision,
        `Action type ${action.type} in cooldown after recent failure`
      );
    }

    // Prevent duplicate execution
    if (this.executing.has(action.id)) {
      return this.createFailedResult(decision, "Action already executing");
    }

    // Start execution
    this.executing.add(action.id);
    this.emit("execution:started", decision);
    const startTime = Date.now();

    this.logger.info(`Executing: ${action.type}`, {
      actionId: action.id,
      decisionId: decision.id,
    });

    try {
      // Create checkpoint for reversible actions
      if (action.metadata.reversible) {
        await this.rollbackManager.createCheckpoint(decision);
      }

      // Execute the action
      const output = await this.safeActions.execute(action);

      // Success!
      const result: ExecutionResult = {
        actionId: action.id,
        decisionId: decision.id,
        success: true,
        output,
        executedAt: Date.now(),
        duration: Date.now() - startTime,
        rolledBack: false,
      };

      this.executionCount++;
      this.lastExecutionTime = Date.now();

      this.logger.info(`Execution successful: ${action.type}`, {
        actionId: action.id,
        duration: result.duration,
      });

      this.emit("execution:completed", result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Execution failed: ${action.type}`, {
        actionId: action.id,
        error: errorMessage,
      });

      // Mark action type as failed
      this.failedActions.set(action.type, Date.now());

      // Attempt rollback if enabled
      let rolledBack = false;
      if (this.config.autoRollback && action.metadata.reversible) {
        try {
          await this.rollbackManager.rollbackByActionId(action.id);
          rolledBack = true;
          this.emit("execution:rolled_back", action.id);
        } catch (rollbackError) {
          this.logger.error(`Rollback failed for ${action.id}`, {
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }
      }

      const result: ExecutionResult = {
        actionId: action.id,
        decisionId: decision.id,
        success: false,
        error: errorMessage,
        executedAt: Date.now(),
        duration: Date.now() - startTime,
        rolledBack,
      };

      this.emit("execution:failed", result);
      return result;

    } finally {
      this.executing.delete(action.id);
    }
  }

  /**
   * Execute multiple decisions in sequence
   */
  async executeBatch(
    decisions: Decision[]
  ): Promise<{ success: ExecutionResult[]; failed: ExecutionResult[] }> {
    const success: ExecutionResult[] = [];
    const failed: ExecutionResult[] = [];

    for (const decision of decisions) {
      const result = await this.execute(decision);
      if (result.success) {
        success.push(result);
      } else {
        failed.push(result);
      }
    }

    return { success, failed };
  }

  /**
   * Register an action handler
   */
  registerHandler(actionType: string, handler: ActionHandler): void {
    this.safeActions.registerHandler(actionType, handler);
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    totalExecutions: number;
    currentlyExecuting: number;
    failedInCooldown: number;
  } {
    return {
      totalExecutions: this.executionCount,
      currentlyExecuting: this.executing.size,
      failedInCooldown: Array.from(this.failedActions.entries()).filter(
        ([, time]) => Date.now() - time < this.config.cooldownAfterFailureMs
      ).length,
    };
  }

  /**
   * Check if rollback is available for an action
   */
  canRollback(actionId: string): boolean {
    return this.rollbackManager.canRollback(actionId);
  }

  /**
   * Manually rollback an action
   */
  async rollback(actionId: string): Promise<void> {
    await this.rollbackManager.rollbackByActionId(actionId);
    this.emit("execution:rolled_back", actionId);
  }

  /**
   * Get safe actions registry
   */
  getSafeActions(): SafeActions {
    return this.safeActions;
  }

  /**
   * Get rollback manager
   */
  getRollbackManager(): RollbackManager {
    return this.rollbackManager;
  }

  // Private methods

  private checkRateLimit(): boolean {
    // Check per-hour limit
    const hourlyLimit = RATE_LIMITS.maxAutoExecutionsPerHour;
    // Simplified: just check time since last execution
    const timeSinceLastMs = Date.now() - this.lastExecutionTime;
    const minIntervalMs = (60 * 60 * 1000) / hourlyLimit;

    return timeSinceLastMs >= minIntervalMs;
  }

  private isInCooldown(actionType: string): boolean {
    const lastFailure = this.failedActions.get(actionType);
    if (!lastFailure) return false;

    return Date.now() - lastFailure < this.config.cooldownAfterFailureMs;
  }

  private createFailedResult(decision: Decision, error: string): ExecutionResult {
    return {
      actionId: decision.actionId,
      decisionId: decision.id,
      success: false,
      error,
      executedAt: Date.now(),
      duration: 0,
      rolledBack: false,
    };
  }
}
