/**
 * Safe Actions Registry
 *
 * Defines pre-approved action types and their execution handlers
 */

import type { Action } from "../core/types.js";
import { SAFE_ACTION_TYPES, DANGEROUS_ACTION_TYPES } from "../core/constants.js";
import { Logger } from "../utils/logger.js";

export type ActionHandler = (action: Action) => Promise<unknown>;

export interface SafeActionsConfig {
  /** Additional action types to consider safe */
  additionalSafeTypes?: string[];
  /** Override dangerous action list */
  dangerousTypes?: string[];
  /** Engine connections for real execution */
  engines?: {
    money?: MoneyEngineInterface;
    growth?: GrowthEngineInterface;
    product?: ProductEngineInterface;
  };
}

// Engine interfaces for type safety
export interface MoneyEngineInterface {
  executeDCA?(params: { asset: string; amount: number }): Promise<{ txHash?: string; success: boolean }>;
  getBalance?(): Promise<{ sol: number; usdc: number }>;
  transfer?(params: { to: string; amount: number; token: string }): Promise<{ txHash?: string; success: boolean }>;
}

export interface GrowthEngineInterface {
  generateTweet?(params: { topic?: string }): Promise<{ content: string; id?: string }>;
  postTweet?(content: string): Promise<{ tweetId: string; success: boolean }>;
  generateBlog?(params: { topic: string }): Promise<{ title: string; content: string }>;
  publishBlog?(blog: { title: string; content: string }): Promise<{ url: string; success: boolean }>;
}

export interface ProductEngineInterface {
  runDiscovery?(): Promise<{ opportunities: unknown[]; count: number }>;
  buildFromOpportunity?(opportunityId: string): Promise<{ buildId: string; status: string }>;
  getBacklog?(): Promise<{ items: unknown[]; count: number }>;
}

export class SafeActions {
  private logger: Logger;
  private handlers: Map<string, ActionHandler>;
  private safeTypes: Set<string>;
  private dangerousTypes: Set<string>;
  private engines: SafeActionsConfig["engines"];

  constructor(config: SafeActionsConfig = {}) {
    this.logger = new Logger("SafeActions");
    this.handlers = new Map();
    this.safeTypes = new Set([
      ...SAFE_ACTION_TYPES,
      ...(config.additionalSafeTypes ?? []),
    ]);
    this.dangerousTypes = new Set(
      config.dangerousTypes ?? [...DANGEROUS_ACTION_TYPES]
    );
    this.engines = config.engines;

    // Register default handlers
    this.registerDefaultHandlers();
  }

  /**
   * Register a handler for an action type
   */
  registerHandler(actionType: string, handler: ActionHandler): void {
    this.handlers.set(actionType, handler);
    this.logger.info(`Handler registered for: ${actionType}`);
  }

  /**
   * Connect engines for execution
   */
  connectEngines(engines: SafeActionsConfig["engines"]): void {
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
  isSafe(actionType: string): boolean {
    // Check explicit safe list
    if (this.safeTypes.has(actionType)) return true;

    // Check if matches any safe pattern
    for (const safe of this.safeTypes) {
      if (actionType.includes(safe)) return true;
    }

    return false;
  }

  /**
   * Check if an action type is dangerous
   */
  isDangerous(actionType: string): boolean {
    // Check explicit dangerous list
    if (this.dangerousTypes.has(actionType)) return true;

    // Check if matches any dangerous pattern
    for (const dangerous of this.dangerousTypes) {
      if (actionType.includes(dangerous)) return true;
    }

    return false;
  }

  /**
   * Get handler for an action type
   */
  getHandler(actionType: string): ActionHandler | undefined {
    // Direct match
    if (this.handlers.has(actionType)) {
      return this.handlers.get(actionType);
    }

    // Pattern match (e.g., "dca_buy" matches "dca" handler)
    for (const [type, handler] of this.handlers) {
      if (actionType.includes(type) || type.includes(actionType)) {
        return handler;
      }
    }

    return undefined;
  }

  /**
   * Execute an action using registered handler
   */
  async execute(action: Action): Promise<unknown> {
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
  getSafeTypes(): string[] {
    return Array.from(this.safeTypes);
  }

  /**
   * Get list of dangerous action types
   */
  getDangerousTypes(): string[] {
    return Array.from(this.dangerousTypes);
  }

  /**
   * Add an action type to safe list
   */
  addSafeType(actionType: string): void {
    this.safeTypes.add(actionType);
    this.dangerousTypes.delete(actionType);
  }

  /**
   * Add an action type to dangerous list
   */
  addDangerousType(actionType: string): void {
    this.dangerousTypes.add(actionType);
    this.safeTypes.delete(actionType);
  }

  /**
   * Register default handlers for common action types
   */
  private registerDefaultHandlers(): void {
    // ============================================================
    // UTILITY HANDLERS
    // ============================================================

    // Log-only handler (for testing or dry runs)
    this.handlers.set("log_only", async (action) => {
      this.logger.info(`[DRY RUN] Would execute: ${action.type}`, action.params);
      return { dryRun: true, action: action.type };
    });

    // Passthrough handler (assumes caller will execute)
    this.handlers.set("passthrough", async (action) => {
      return { passthrough: true, actionId: action.id };
    });

    // ============================================================
    // CONTENT HANDLERS (Growth Engine)
    // ============================================================

    // Generate tweet
    this.handlers.set("generate_tweet", async (action) => {
      if (!this.engines?.growth?.generateTweet) {
        return { scheduled: true, type: action.type, message: "Growth engine not connected" };
      }
      const params = action.params as { topic?: string } | undefined;
      const result = await this.engines.growth.generateTweet({ topic: params?.topic });
      return { success: true, type: action.type, content: result.content };
    });

    // Post tweet
    this.handlers.set("post_tweet", async (action) => {
      if (!this.engines?.growth?.postTweet) {
        return { scheduled: true, type: action.type, message: "Growth engine not connected" };
      }
      const params = action.params as { content: string };
      const result = await this.engines.growth.postTweet(params.content);
      return { success: result.success, type: action.type, tweetId: result.tweetId };
    });

    // Generate blog
    this.handlers.set("generate_blog", async (action) => {
      if (!this.engines?.growth?.generateBlog) {
        return { scheduled: true, type: action.type, message: "Growth engine not connected" };
      }
      const params = action.params as { topic: string };
      const result = await this.engines.growth.generateBlog({ topic: params.topic });
      return { success: true, type: action.type, title: result.title, contentLength: result.content.length };
    });

    // Publish blog
    this.handlers.set("publish_blog", async (action) => {
      if (!this.engines?.growth?.publishBlog) {
        return { scheduled: true, type: action.type, message: "Growth engine not connected" };
      }
      const params = action.params as { title: string; content: string };
      const result = await this.engines.growth.publishBlog(params);
      return { success: result.success, type: action.type, url: result.url };
    });

    // General content handler
    this.handlers.set("content", async (action) => {
      const subType = action.params?.subType as string;
      switch (subType) {
        case "tweet":
          return this.handlers.get("generate_tweet")!(action);
        case "blog":
          return this.handlers.get("generate_blog")!(action);
        default:
          return { scheduled: true, type: action.type, subType };
      }
    });

    // ============================================================
    // TRADING HANDLERS (Money Engine)
    // ============================================================

    // DCA buy
    this.handlers.set("dca_buy", async (action) => {
      if (!this.engines?.money?.executeDCA) {
        return { submitted: true, type: action.type, message: "Money engine not connected" };
      }
      const params = action.params as { asset: string; amount: number };
      const result = await this.engines.money.executeDCA({
        asset: params.asset ?? "SOL",
        amount: params.amount ?? 10,
      });
      return { success: result.success, type: action.type, txHash: result.txHash };
    });

    // Get balance
    this.handlers.set("get_balance", async (action) => {
      if (!this.engines?.money?.getBalance) {
        return { submitted: true, type: action.type, message: "Money engine not connected" };
      }
      const result = await this.engines.money.getBalance();
      return { success: true, type: action.type, balances: result };
    });

    // Transfer (requires higher approval)
    this.handlers.set("transfer", async (action) => {
      if (!this.engines?.money?.transfer) {
        return { submitted: true, type: action.type, message: "Money engine not connected" };
      }
      const params = action.params as { to: string; amount: number; token: string };
      const result = await this.engines.money.transfer(params);
      return { success: result.success, type: action.type, txHash: result.txHash };
    });

    // General trading handler
    this.handlers.set("trading", async (action) => {
      const subType = action.params?.subType as string;
      switch (subType) {
        case "dca":
          return this.handlers.get("dca_buy")!(action);
        case "balance":
          return this.handlers.get("get_balance")!(action);
        case "transfer":
          return this.handlers.get("transfer")!(action);
        default:
          return { submitted: true, type: action.type, subType };
      }
    });

    // ============================================================
    // BUILD HANDLERS (Product Engine)
    // ============================================================

    // Run discovery
    this.handlers.set("run_discovery", async (action) => {
      if (!this.engines?.product?.runDiscovery) {
        return { queued: true, type: action.type, message: "Product engine not connected" };
      }
      const result = await this.engines.product.runDiscovery();
      return { success: true, type: action.type, count: result.count };
    });

    // Build from opportunity
    this.handlers.set("build_opportunity", async (action) => {
      if (!this.engines?.product?.buildFromOpportunity) {
        return { queued: true, type: action.type, message: "Product engine not connected" };
      }
      const params = action.params as { opportunityId: string };
      const result = await this.engines.product.buildFromOpportunity(params.opportunityId);
      return { success: true, type: action.type, buildId: result.buildId, status: result.status };
    });

    // Get backlog
    this.handlers.set("get_backlog", async (action) => {
      if (!this.engines?.product?.getBacklog) {
        return { queued: true, type: action.type, message: "Product engine not connected" };
      }
      const result = await this.engines.product.getBacklog();
      return { success: true, type: action.type, count: result.count };
    });

    // General build handler
    this.handlers.set("build", async (action) => {
      const subType = action.params?.subType as string;
      switch (subType) {
        case "discovery":
          return this.handlers.get("run_discovery")!(action);
        case "opportunity":
          return this.handlers.get("build_opportunity")!(action);
        case "backlog":
          return this.handlers.get("get_backlog")!(action);
        default:
          return { queued: true, type: action.type, subType };
      }
    });

    // ============================================================
    // STATUS & INFO HANDLERS
    // ============================================================

    // Status check (always safe)
    this.handlers.set("status_check", async (action) => {
      return {
        success: true,
        type: action.type,
        timestamp: Date.now(),
        engines: {
          money: !!this.engines?.money,
          growth: !!this.engines?.growth,
          product: !!this.engines?.product,
        },
      };
    });

    // Health check
    this.handlers.set("health_check", async (action) => {
      const healthResults: Record<string, boolean> = {};

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
        timestamp: Date.now(),
      };
    });

    // Notification (safe, just sends alerts)
    this.handlers.set("notification", async (action) => {
      const params = action.params as { channel: string; message: string };
      this.logger.info(`[NOTIFICATION] ${params.channel}: ${params.message}`);
      return { sent: true, type: action.type, channel: params.channel };
    });
  }
}
