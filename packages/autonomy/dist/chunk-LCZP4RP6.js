import {
  DANGEROUS_ACTION_TYPES,
  RATE_LIMITS,
  SAFE_ACTION_TYPES
} from "./chunk-TENKIGAJ.js";
import {
  Logger
} from "./chunk-ZB2ZVSPL.js";

// src/execution/auto-executor.ts
import { EventEmitter } from "eventemitter3";

// src/execution/safe-actions.ts
var SafeActions = class {
  logger;
  handlers;
  safeTypes;
  dangerousTypes;
  engines;
  constructor(config = {}) {
    this.logger = new Logger("SafeActions");
    this.handlers = /* @__PURE__ */ new Map();
    this.safeTypes = /* @__PURE__ */ new Set([
      ...SAFE_ACTION_TYPES,
      ...config.additionalSafeTypes ?? []
    ]);
    this.dangerousTypes = new Set(
      config.dangerousTypes ?? [...DANGEROUS_ACTION_TYPES]
    );
    this.engines = config.engines;
    this.registerDefaultHandlers();
  }
  /**
   * Register a handler for an action type
   */
  registerHandler(actionType, handler) {
    this.handlers.set(actionType, handler);
    this.logger.info(`Handler registered for: ${actionType}`);
  }
  /**
   * Connect engines for execution
   */
  connectEngines(engines) {
    this.engines = { ...this.engines, ...engines };
    this.logger.info("Engines connected", {
      money: !!engines?.money,
      growth: !!engines?.growth,
      product: !!engines?.product
    });
  }
  /**
   * Check if an action type is considered safe
   */
  isSafe(actionType) {
    if (this.safeTypes.has(actionType)) return true;
    for (const safe of this.safeTypes) {
      if (actionType.includes(safe)) return true;
    }
    return false;
  }
  /**
   * Check if an action type is dangerous
   */
  isDangerous(actionType) {
    if (this.dangerousTypes.has(actionType)) return true;
    for (const dangerous of this.dangerousTypes) {
      if (actionType.includes(dangerous)) return true;
    }
    return false;
  }
  /**
   * Get handler for an action type
   */
  getHandler(actionType) {
    if (this.handlers.has(actionType)) {
      return this.handlers.get(actionType);
    }
    for (const [type, handler] of this.handlers) {
      if (actionType.includes(type) || type.includes(actionType)) {
        return handler;
      }
    }
    return void 0;
  }
  /**
   * Execute an action using registered handler
   */
  async execute(action) {
    const handler = this.getHandler(action.type);
    if (!handler) {
      throw new Error(`No handler registered for action type: ${action.type}`);
    }
    this.logger.info(`Executing: ${action.type}`, { actionId: action.id });
    return handler(action);
  }
  /**
   * Get list of safe action types
   */
  getSafeTypes() {
    return Array.from(this.safeTypes);
  }
  /**
   * Get list of dangerous action types
   */
  getDangerousTypes() {
    return Array.from(this.dangerousTypes);
  }
  /**
   * Add an action type to safe list
   */
  addSafeType(actionType) {
    this.safeTypes.add(actionType);
    this.dangerousTypes.delete(actionType);
  }
  /**
   * Add an action type to dangerous list
   */
  addDangerousType(actionType) {
    this.dangerousTypes.add(actionType);
    this.safeTypes.delete(actionType);
  }
  /**
   * Register default handlers for common action types
   */
  registerDefaultHandlers() {
    this.handlers.set("log_only", async (action) => {
      this.logger.info(`[DRY RUN] Would execute: ${action.type}`, action.params);
      return { dryRun: true, action: action.type };
    });
    this.handlers.set("passthrough", async (action) => {
      return { passthrough: true, actionId: action.id };
    });
    this.handlers.set("generate_tweet", async (action) => {
      if (!this.engines?.growth?.generateTweet) {
        return { scheduled: true, type: action.type, message: "Growth engine not connected" };
      }
      const params = action.params;
      const result = await this.engines.growth.generateTweet({ topic: params?.topic });
      return { success: true, type: action.type, content: result.content };
    });
    this.handlers.set("post_tweet", async (action) => {
      if (!this.engines?.growth?.postTweet) {
        return { scheduled: true, type: action.type, message: "Growth engine not connected" };
      }
      const params = action.params;
      const result = await this.engines.growth.postTweet(params.content);
      return { success: result.success, type: action.type, tweetId: result.tweetId };
    });
    this.handlers.set("generate_blog", async (action) => {
      if (!this.engines?.growth?.generateBlog) {
        return { scheduled: true, type: action.type, message: "Growth engine not connected" };
      }
      const params = action.params;
      const result = await this.engines.growth.generateBlog({ topic: params.topic });
      return { success: true, type: action.type, title: result.title, contentLength: result.content.length };
    });
    this.handlers.set("publish_blog", async (action) => {
      if (!this.engines?.growth?.publishBlog) {
        return { scheduled: true, type: action.type, message: "Growth engine not connected" };
      }
      const params = action.params;
      const result = await this.engines.growth.publishBlog(params);
      return { success: result.success, type: action.type, url: result.url };
    });
    this.handlers.set("content", async (action) => {
      const subType = action.params?.subType;
      switch (subType) {
        case "tweet":
          return this.handlers.get("generate_tweet")(action);
        case "blog":
          return this.handlers.get("generate_blog")(action);
        default:
          return { scheduled: true, type: action.type, subType };
      }
    });
    this.handlers.set("dca_buy", async (action) => {
      if (!this.engines?.money?.executeDCA) {
        return { submitted: true, type: action.type, message: "Money engine not connected" };
      }
      const params = action.params;
      const result = await this.engines.money.executeDCA({
        asset: params.asset ?? "SOL",
        amount: params.amount ?? 10
      });
      return { success: result.success, type: action.type, txHash: result.txHash };
    });
    this.handlers.set("get_balance", async (action) => {
      if (!this.engines?.money?.getBalance) {
        return { submitted: true, type: action.type, message: "Money engine not connected" };
      }
      const result = await this.engines.money.getBalance();
      return { success: true, type: action.type, balances: result };
    });
    this.handlers.set("transfer", async (action) => {
      if (!this.engines?.money?.transfer) {
        return { submitted: true, type: action.type, message: "Money engine not connected" };
      }
      const params = action.params;
      const result = await this.engines.money.transfer(params);
      return { success: result.success, type: action.type, txHash: result.txHash };
    });
    this.handlers.set("trading", async (action) => {
      const subType = action.params?.subType;
      switch (subType) {
        case "dca":
          return this.handlers.get("dca_buy")(action);
        case "balance":
          return this.handlers.get("get_balance")(action);
        case "transfer":
          return this.handlers.get("transfer")(action);
        default:
          return { submitted: true, type: action.type, subType };
      }
    });
    this.handlers.set("run_discovery", async (action) => {
      if (!this.engines?.product?.runDiscovery) {
        return { queued: true, type: action.type, message: "Product engine not connected" };
      }
      const result = await this.engines.product.runDiscovery();
      return { success: true, type: action.type, count: result.count };
    });
    this.handlers.set("build_opportunity", async (action) => {
      if (!this.engines?.product?.buildFromOpportunity) {
        return { queued: true, type: action.type, message: "Product engine not connected" };
      }
      const params = action.params;
      const result = await this.engines.product.buildFromOpportunity(params.opportunityId);
      return { success: true, type: action.type, buildId: result.buildId, status: result.status };
    });
    this.handlers.set("get_backlog", async (action) => {
      if (!this.engines?.product?.getBacklog) {
        return { queued: true, type: action.type, message: "Product engine not connected" };
      }
      const result = await this.engines.product.getBacklog();
      return { success: true, type: action.type, count: result.count };
    });
    this.handlers.set("build", async (action) => {
      const subType = action.params?.subType;
      switch (subType) {
        case "discovery":
          return this.handlers.get("run_discovery")(action);
        case "opportunity":
          return this.handlers.get("build_opportunity")(action);
        case "backlog":
          return this.handlers.get("get_backlog")(action);
        default:
          return { queued: true, type: action.type, subType };
      }
    });
    this.handlers.set("status_check", async (action) => {
      return {
        success: true,
        type: action.type,
        timestamp: Date.now(),
        engines: {
          money: !!this.engines?.money,
          growth: !!this.engines?.growth,
          product: !!this.engines?.product
        }
      };
    });
    this.handlers.set("health_check", async (action) => {
      const healthResults = {};
      if (this.engines?.money?.getBalance) {
        try {
          await this.engines.money.getBalance();
          healthResults.money = true;
        } catch {
          healthResults.money = false;
        }
      }
      if (this.engines?.product?.getBacklog) {
        try {
          await this.engines.product.getBacklog();
          healthResults.product = true;
        } catch {
          healthResults.product = false;
        }
      }
      return {
        success: true,
        type: action.type,
        health: healthResults,
        timestamp: Date.now()
      };
    });
    this.handlers.set("notification", async (action) => {
      const params = action.params;
      this.logger.info(`[NOTIFICATION] ${params.channel}: ${params.message}`);
      return { sent: true, type: action.type, channel: params.channel };
    });
  }
};

// src/execution/rollback-manager.ts
var RollbackManager = class {
  logger;
  checkpoints;
  handlers;
  maxCheckpoints;
  checkpointTtl;
  constructor(config = {}) {
    this.logger = new Logger("RollbackManager");
    this.checkpoints = /* @__PURE__ */ new Map();
    this.handlers = /* @__PURE__ */ new Map();
    this.maxCheckpoints = config.maxCheckpoints ?? 100;
    this.checkpointTtl = config.checkpointTtl ?? 24 * 60 * 60 * 1e3;
  }
  /**
   * Create a checkpoint before executing an action
   */
  async createCheckpoint(decision) {
    const action = decision.action;
    if (!action.metadata.reversible) {
      this.logger.warn(`Action ${action.type} is not reversible, no checkpoint created`);
      throw new Error("Cannot create checkpoint for irreversible action");
    }
    this.cleanupExpired();
    if (this.checkpoints.size >= this.maxCheckpoints) {
      this.removeOldest();
    }
    const checkpoint = {
      id: `ckpt_${Date.now()}_${action.id}`,
      actionId: action.id,
      decisionId: decision.id,
      state: await this.captureState(action),
      createdAt: Date.now()
    };
    this.checkpoints.set(checkpoint.id, checkpoint);
    this.logger.info(`Checkpoint created: ${checkpoint.id}`, {
      actionId: action.id,
      actionType: action.type
    });
    return checkpoint;
  }
  /**
   * Restore state from a checkpoint (rollback)
   */
  async rollback(checkpointId) {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }
    this.logger.info(`Rolling back checkpoint: ${checkpointId}`);
    const handler = this.findHandler(checkpoint);
    if (handler) {
      await handler(checkpoint);
    } else {
      this.logger.warn(`No rollback handler found, logging state only`, {
        checkpointId,
        state: checkpoint.state
      });
    }
    this.checkpoints.delete(checkpointId);
    this.logger.info(`Rollback complete: ${checkpointId}`);
  }
  /**
   * Rollback by action ID
   */
  async rollbackByActionId(actionId) {
    const checkpoint = this.findByActionId(actionId);
    if (!checkpoint) {
      throw new Error(`No checkpoint found for action: ${actionId}`);
    }
    await this.rollback(checkpoint.id);
  }
  /**
   * Register a rollback handler for an action type
   */
  registerHandler(actionType, handler) {
    this.handlers.set(actionType, handler);
    this.logger.info(`Rollback handler registered for: ${actionType}`);
  }
  /**
   * Check if rollback is available for an action
   */
  canRollback(actionId) {
    const checkpoint = this.findByActionId(actionId);
    if (!checkpoint) return false;
    const age = Date.now() - checkpoint.createdAt;
    return age < this.checkpointTtl;
  }
  /**
   * Get checkpoint for an action
   */
  getCheckpoint(checkpointId) {
    return this.checkpoints.get(checkpointId);
  }
  /**
   * Get checkpoint by action ID
   */
  findByActionId(actionId) {
    for (const checkpoint of this.checkpoints.values()) {
      if (checkpoint.actionId === actionId) {
        return checkpoint;
      }
    }
    return void 0;
  }
  /**
   * Get all active checkpoints
   */
  getActiveCheckpoints() {
    this.cleanupExpired();
    return Array.from(this.checkpoints.values());
  }
  /**
   * Clear all checkpoints
   */
  clear() {
    this.checkpoints.clear();
    this.logger.info("All checkpoints cleared");
  }
  // Private methods
  /**
   * Capture state before action execution
   */
  async captureState(action) {
    return {
      timestamp: Date.now(),
      actionType: action.type,
      category: action.category,
      params: { ...action.params }
      // Additional state would be captured by registered handlers
    };
  }
  /**
   * Find appropriate rollback handler for a checkpoint
   */
  findHandler(checkpoint) {
    const actionType = checkpoint.state.actionType;
    if (this.handlers.has(actionType)) {
      return this.handlers.get(actionType);
    }
    for (const [type, handler] of this.handlers) {
      if (actionType.includes(type)) {
        return handler;
      }
    }
    return void 0;
  }
  /**
   * Remove expired checkpoints
   */
  cleanupExpired() {
    const now = Date.now();
    const expired = [];
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
  removeOldest() {
    let oldest = null;
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
};

// src/execution/auto-executor.ts
var AutoExecutor = class extends EventEmitter {
  logger;
  safeActions;
  rollbackManager;
  config;
  executing;
  executionCount;
  lastExecutionTime;
  failedActions;
  // actionType -> lastFailureTime
  constructor(config = {}) {
    super();
    this.logger = new Logger("AutoExecutor");
    this.safeActions = new SafeActions();
    this.rollbackManager = new RollbackManager();
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 5,
      cooldownAfterFailureMs: config.cooldownAfterFailureMs ?? RATE_LIMITS.cooldownAfterFailureMs,
      autoRollback: config.autoRollback ?? true
    };
    this.executing = /* @__PURE__ */ new Set();
    this.executionCount = 0;
    this.lastExecutionTime = 0;
    this.failedActions = /* @__PURE__ */ new Map();
  }
  /**
   * Execute an approved action
   */
  async execute(decision) {
    const action = decision.action;
    if (decision.outcome !== "auto_execute") {
      return this.createFailedResult(
        decision,
        "Decision not approved for auto-execution"
      );
    }
    if (!this.checkRateLimit()) {
      this.emit("execution:rate_limited", action);
      return this.createFailedResult(decision, "Rate limit exceeded");
    }
    if (this.executing.size >= this.config.maxConcurrent) {
      return this.createFailedResult(
        decision,
        "Maximum concurrent executions reached"
      );
    }
    if (this.isInCooldown(action.type)) {
      return this.createFailedResult(
        decision,
        `Action type ${action.type} in cooldown after recent failure`
      );
    }
    if (this.executing.has(action.id)) {
      return this.createFailedResult(decision, "Action already executing");
    }
    this.executing.add(action.id);
    this.emit("execution:started", decision);
    const startTime = Date.now();
    this.logger.info(`Executing: ${action.type}`, {
      actionId: action.id,
      decisionId: decision.id
    });
    try {
      if (action.metadata.reversible) {
        await this.rollbackManager.createCheckpoint(decision);
      }
      const output = await this.safeActions.execute(action);
      const result = {
        actionId: action.id,
        decisionId: decision.id,
        success: true,
        output,
        executedAt: Date.now(),
        duration: Date.now() - startTime,
        rolledBack: false
      };
      this.executionCount++;
      this.lastExecutionTime = Date.now();
      this.logger.info(`Execution successful: ${action.type}`, {
        actionId: action.id,
        duration: result.duration
      });
      this.emit("execution:completed", result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Execution failed: ${action.type}`, {
        actionId: action.id,
        error: errorMessage
      });
      this.failedActions.set(action.type, Date.now());
      let rolledBack = false;
      if (this.config.autoRollback && action.metadata.reversible) {
        try {
          await this.rollbackManager.rollbackByActionId(action.id);
          rolledBack = true;
          this.emit("execution:rolled_back", action.id);
        } catch (rollbackError) {
          this.logger.error(`Rollback failed for ${action.id}`, {
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
          });
        }
      }
      const result = {
        actionId: action.id,
        decisionId: decision.id,
        success: false,
        error: errorMessage,
        executedAt: Date.now(),
        duration: Date.now() - startTime,
        rolledBack
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
  async executeBatch(decisions) {
    const success = [];
    const failed = [];
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
  registerHandler(actionType, handler) {
    this.safeActions.registerHandler(actionType, handler);
  }
  /**
   * Get execution statistics
   */
  getStats() {
    return {
      totalExecutions: this.executionCount,
      currentlyExecuting: this.executing.size,
      failedInCooldown: Array.from(this.failedActions.entries()).filter(
        ([, time]) => Date.now() - time < this.config.cooldownAfterFailureMs
      ).length
    };
  }
  /**
   * Check if rollback is available for an action
   */
  canRollback(actionId) {
    return this.rollbackManager.canRollback(actionId);
  }
  /**
   * Manually rollback an action
   */
  async rollback(actionId) {
    await this.rollbackManager.rollbackByActionId(actionId);
    this.emit("execution:rolled_back", actionId);
  }
  /**
   * Get safe actions registry
   */
  getSafeActions() {
    return this.safeActions;
  }
  /**
   * Get rollback manager
   */
  getRollbackManager() {
    return this.rollbackManager;
  }
  // Private methods
  checkRateLimit() {
    const hourlyLimit = RATE_LIMITS.maxAutoExecutionsPerHour;
    const timeSinceLastMs = Date.now() - this.lastExecutionTime;
    const minIntervalMs = 60 * 60 * 1e3 / hourlyLimit;
    return timeSinceLastMs >= minIntervalMs;
  }
  isInCooldown(actionType) {
    const lastFailure = this.failedActions.get(actionType);
    if (!lastFailure) return false;
    return Date.now() - lastFailure < this.config.cooldownAfterFailureMs;
  }
  createFailedResult(decision, error) {
    return {
      actionId: decision.actionId,
      decisionId: decision.id,
      success: false,
      error,
      executedAt: Date.now(),
      duration: 0,
      rolledBack: false
    };
  }
};

export {
  SafeActions,
  RollbackManager,
  AutoExecutor
};
//# sourceMappingURL=chunk-LCZP4RP6.js.map