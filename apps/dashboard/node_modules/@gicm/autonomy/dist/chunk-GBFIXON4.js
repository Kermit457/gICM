import {
  Logger
} from "./chunk-ZB2ZVSPL.js";

// src/integration/engine-adapter.ts
import { EventEmitter } from "eventemitter3";
var EngineAdapter = class extends EventEmitter {
  logger;
  config;
  actionCount = 0;
  constructor(config) {
    super();
    this.config = config;
    this.logger = new Logger(`Adapter:${config.engineName}`);
  }
  /**
   * Create an action from engine-specific data
   */
  createAction(params) {
    this.actionCount++;
    const action = {
      id: `${this.config.engineType}_${Date.now()}_${this.actionCount}`,
      engine: this.config.engineType,
      category: this.getCategoryForType(params.type),
      type: params.type,
      description: params.description,
      params: params.payload,
      metadata: {
        estimatedValue: params.estimatedValue,
        reversible: params.reversible ?? true,
        urgency: params.urgency ?? "normal",
        linesChanged: params.linesChanged,
        filesChanged: params.filesChanged
      },
      timestamp: Date.now()
    };
    this.emit("action:submitted", action);
    return action;
  }
  /**
   * Map action type to category (override in subclasses)
   */
  getCategoryForType(actionType) {
    return this.config.defaultCategory;
  }
  /**
   * Get engine name
   */
  getEngineName() {
    return this.config.engineName;
  }
  /**
   * Get engine type
   */
  getEngineType() {
    return this.config.engineType;
  }
  /**
   * Get action count
   */
  getActionCount() {
    return this.actionCount;
  }
};

// src/integration/money-adapter.ts
var MoneyEngineAdapter = class extends EngineAdapter {
  constructor() {
    super({
      engineName: "money-engine",
      engineType: "money",
      defaultCategory: "trading"
    });
  }
  /**
   * Create DCA trade action
   */
  createDCAAction(params) {
    return this.createAction({
      type: "dca_buy",
      description: `DCA buy $${params.amount} of ${params.token}`,
      payload: {
        token: params.token,
        amount: params.amount,
        botType: params.botType ?? "dca"
      },
      estimatedValue: params.amount,
      reversible: false,
      // Trades are not reversible
      urgency: "normal"
    });
  }
  /**
   * Create token swap action
   */
  createSwapAction(params) {
    return this.createAction({
      type: "token_swap",
      description: `Swap ${params.amount} ${params.fromToken} to ${params.toToken}`,
      payload: {
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount
      },
      estimatedValue: params.amount,
      reversible: false,
      urgency: "normal"
    });
  }
  /**
   * Create expense payment action
   */
  createExpenseAction(params) {
    return this.createAction({
      type: params.recurring ? "recurring_expense" : "one_time_expense",
      description: `Pay expense: ${params.description} ($${params.amount})`,
      payload: {
        category: params.category,
        description: params.description,
        amount: params.amount,
        recurring: params.recurring
      },
      estimatedValue: params.amount,
      reversible: false,
      urgency: "normal"
    });
  }
  /**
   * Create rebalance action
   */
  createRebalanceAction(targetAllocations) {
    const totalPercent = Object.values(targetAllocations).reduce((a, b) => a + b, 0);
    return this.createAction({
      type: "treasury_rebalance",
      description: `Rebalance treasury allocations`,
      payload: { targetAllocations },
      reversible: true,
      urgency: "low"
    });
  }
  getCategoryForType(actionType) {
    if (actionType.includes("expense")) return "configuration";
    if (actionType.includes("rebalance")) return "configuration";
    return "trading";
  }
};

// src/integration/growth-adapter.ts
var GrowthEngineAdapter = class extends EngineAdapter {
  constructor() {
    super({
      engineName: "growth-engine",
      engineType: "growth",
      defaultCategory: "content"
    });
  }
  /**
   * Create tweet action
   */
  createTweetAction(params) {
    return this.createAction({
      type: params.threadId ? "tweet_reply" : "tweet_post",
      description: `Post tweet: "${params.content.substring(0, 50)}..."`,
      payload: {
        content: params.content,
        threadId: params.threadId,
        scheduledFor: params.scheduledFor
      },
      reversible: false,
      // Published tweets can't be auto-deleted
      urgency: "normal"
    });
  }
  /**
   * Create blog draft action
   */
  createBlogDraftAction(params) {
    return this.createAction({
      type: "blog_draft",
      description: `Generate blog draft: ${params.title}`,
      payload: {
        title: params.title,
        topic: params.topic,
        keywords: params.keywords
      },
      reversible: true,
      // Drafts can be deleted
      urgency: "low"
    });
  }
  /**
   * Create blog publish action
   */
  createBlogPublishAction(params) {
    return this.createAction({
      type: "blog_publish",
      description: `Publish blog: ${params.title}`,
      payload: {
        title: params.title,
        topic: params.topic,
        keywords: params.keywords
      },
      reversible: false,
      // Published blogs are public
      urgency: "normal"
    });
  }
  /**
   * Create Discord announcement action
   */
  createDiscordAction(params) {
    return this.createAction({
      type: "discord_announce",
      description: `Discord announcement to ${params.channel}`,
      payload: {
        channel: params.channel,
        message: params.message,
        embed: params.embed
      },
      reversible: false,
      urgency: "normal"
    });
  }
  /**
   * Create thread of tweets action
   */
  createTwitterThreadAction(tweets) {
    return this.createAction({
      type: "twitter_thread",
      description: `Post Twitter thread (${tweets.length} tweets)`,
      payload: {
        tweets,
        count: tweets.length
      },
      reversible: false,
      urgency: "normal"
    });
  }
  getCategoryForType(actionType) {
    return "content";
  }
};

// src/integration/product-adapter.ts
var ProductEngineAdapter = class extends EngineAdapter {
  constructor() {
    super({
      engineName: "product-engine",
      engineType: "product",
      defaultCategory: "build"
    });
  }
  /**
   * Create agent build action
   */
  createBuildAction(params) {
    return this.createAction({
      type: `build_${params.type}`,
      description: `Build ${params.type}: ${params.name}`,
      payload: {
        opportunityId: params.opportunityId,
        name: params.name,
        type: params.type,
        templateType: params.templateType
      },
      reversible: true,
      // Builds can be reverted
      urgency: "normal"
    });
  }
  /**
   * Create code commit action
   */
  createCommitAction(params) {
    const totalLines = params.linesAdded + params.linesRemoved;
    return this.createAction({
      type: "code_commit",
      description: `Commit: ${params.message}`,
      payload: {
        message: params.message,
        files: params.files,
        linesAdded: params.linesAdded,
        linesRemoved: params.linesRemoved,
        paths: params.files
      },
      linesChanged: totalLines,
      filesChanged: params.files.length,
      reversible: true,
      // Commits can be reverted
      urgency: "normal"
    });
  }
  /**
   * Create staging deployment action
   */
  createStagingDeployAction(params) {
    return this.createAction({
      type: "deploy_staging",
      description: `Deploy ${params.package}@${params.version} to staging`,
      payload: {
        target: "staging",
        package: params.package,
        version: params.version
      },
      reversible: true,
      // Can rollback staging
      urgency: "normal"
    });
  }
  /**
   * Create production deployment action
   */
  createProductionDeployAction(params) {
    return this.createAction({
      type: "deploy_production",
      description: `Deploy ${params.package}@${params.version} to PRODUCTION`,
      payload: {
        target: "production",
        package: params.package,
        version: params.version
      },
      reversible: true,
      // Can rollback, but risky
      urgency: "high"
    });
  }
  /**
   * Create quality gate action
   */
  createQualityGateAction(params) {
    return this.createAction({
      type: "quality_gate",
      description: `Quality gate check for ${params.package}`,
      payload: {
        package: params.package,
        testScore: params.testScore,
        reviewScore: params.reviewScore,
        passed: params.testScore >= 80 && params.reviewScore >= 70
      },
      reversible: true,
      urgency: "low"
    });
  }
  getCategoryForType(actionType) {
    if (actionType.includes("deploy")) return "deployment";
    if (actionType.includes("commit")) return "build";
    return "build";
  }
};

export {
  EngineAdapter,
  MoneyEngineAdapter,
  GrowthEngineAdapter,
  ProductEngineAdapter
};
//# sourceMappingURL=chunk-GBFIXON4.js.map