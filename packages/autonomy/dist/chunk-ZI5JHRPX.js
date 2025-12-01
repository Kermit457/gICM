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

// src/integration/workflow-adapter.ts
import { EventEmitter as EventEmitter2 } from "eventemitter3";

// src/integration/workflow-types.ts
import { z } from "zod";
var ClaudeCodeActionType = {
  // Safe actions (auto-execute)
  ADD_TEST: "claude_add_test",
  FIX_LINT: "claude_fix_lint",
  UPDATE_DOCS: "claude_update_docs",
  ADD_COMMENTS: "claude_add_comments",
  FORMAT_CODE: "claude_format_code",
  ADD_TYPE: "claude_add_type",
  UPDATE_README: "claude_update_readme",
  ADD_EXAMPLE: "claude_add_example",
  // Medium risk (may queue)
  MODIFY_FUNCTION: "claude_modify_function",
  ADD_FEATURE: "claude_add_feature",
  REFACTOR: "claude_refactor",
  // High risk (queue/escalate)
  CHANGE_API: "claude_change_api",
  MODIFY_CORE: "claude_modify_core",
  MODIFY_CONFIG: "claude_modify_config",
  // Critical (escalate/reject)
  PRODUCTION_DEPLOY: "claude_production_deploy",
  DELETE_DATA: "claude_delete_data",
  MODIFY_AUTH: "claude_modify_auth"
};
var ClaudeCodeContextSchema = z.object({
  /** File being modified */
  filePath: z.string(),
  /** Package name if in a package */
  packageName: z.string().optional(),
  /** Is this a core infrastructure file? */
  isCore: z.boolean().default(false),
  /** Is this a test file? */
  isTest: z.boolean().default(false),
  /** Lines added */
  linesAdded: z.number().default(0),
  /** Lines removed */
  linesRemoved: z.number().default(0),
  /** Affects public API? */
  affectsPublicApi: z.boolean().default(false),
  /** Affects database? */
  affectsDatabase: z.boolean().default(false),
  /** Affects authentication? */
  affectsAuth: z.boolean().default(false),
  /** Affects production? */
  affectsProduction: z.boolean().default(false),
  /** Number of files changed */
  filesChanged: z.number().default(1)
});
var WorkflowActionType = {
  WORKFLOW_CREATE: "workflow_create",
  WORKFLOW_RUN: "workflow_run",
  WORKFLOW_STEP: "workflow_step",
  WORKFLOW_COMPLETE: "workflow_complete"
};
var WorkflowContextSchema = z.object({
  workflowId: z.string(),
  workflowName: z.string(),
  executionId: z.string().optional(),
  stepId: z.string().optional(),
  stepAgent: z.string().optional(),
  aggregateRiskScore: z.number().default(0),
  steps: z.array(
    z.object({
      agent: z.string(),
      riskScore: z.number()
    })
  ).optional()
});
var DailyImprovementSchema = z.object({
  id: z.string(),
  actionType: z.string(),
  title: z.string(),
  description: z.string().optional(),
  value: z.number().default(1),
  autoExecuted: z.boolean(),
  timestamp: z.number(),
  filePath: z.string().optional(),
  packageName: z.string().optional()
});
var ImprovementStatsSchema = z.object({
  date: z.string(),
  totalImprovements: z.number(),
  autoExecuted: z.number(),
  queued: z.number(),
  escalated: z.number(),
  totalValue: z.number(),
  byType: z.record(z.number()),
  byPackage: z.record(z.number())
});

// src/integration/workflow-constants.ts
var CLAUDE_ACTION_BASE_RISK = {
  // Safe actions (0-15)
  [ClaudeCodeActionType.ADD_TEST]: 5,
  [ClaudeCodeActionType.FIX_LINT]: 5,
  [ClaudeCodeActionType.UPDATE_DOCS]: 10,
  [ClaudeCodeActionType.ADD_COMMENTS]: 5,
  [ClaudeCodeActionType.FORMAT_CODE]: 3,
  [ClaudeCodeActionType.ADD_TYPE]: 8,
  [ClaudeCodeActionType.UPDATE_README]: 10,
  [ClaudeCodeActionType.ADD_EXAMPLE]: 12,
  // Medium risk (20-45)
  [ClaudeCodeActionType.MODIFY_FUNCTION]: 30,
  [ClaudeCodeActionType.ADD_FEATURE]: 35,
  [ClaudeCodeActionType.REFACTOR]: 40,
  // High risk (50-70)
  [ClaudeCodeActionType.CHANGE_API]: 55,
  [ClaudeCodeActionType.MODIFY_CORE]: 65,
  [ClaudeCodeActionType.MODIFY_CONFIG]: 60,
  // Critical (80-100)
  [ClaudeCodeActionType.PRODUCTION_DEPLOY]: 85,
  [ClaudeCodeActionType.DELETE_DATA]: 95,
  [ClaudeCodeActionType.MODIFY_AUTH]: 90
};
var CONTEXT_RISK_MODIFIERS = {
  /** File is in core infrastructure */
  isCore: 20,
  /** Change affects public API */
  affectsPublicApi: 15,
  /** Change affects database */
  affectsDatabase: 25,
  /** Change affects authentication */
  affectsAuth: 30,
  /** Change affects production */
  affectsProduction: 35,
  /** Large change (>100 lines) */
  largeChange: 10,
  /** Multi-file change (>5 files) */
  multiFile: 15
};
var SAFE_CLAUDE_ACTIONS = [
  ClaudeCodeActionType.ADD_TEST,
  ClaudeCodeActionType.FIX_LINT,
  ClaudeCodeActionType.UPDATE_DOCS,
  ClaudeCodeActionType.ADD_COMMENTS,
  ClaudeCodeActionType.FORMAT_CODE,
  ClaudeCodeActionType.ADD_TYPE,
  ClaudeCodeActionType.UPDATE_README,
  ClaudeCodeActionType.ADD_EXAMPLE
];
var DANGEROUS_CLAUDE_ACTIONS = [
  ClaudeCodeActionType.DELETE_DATA,
  ClaudeCodeActionType.MODIFY_AUTH,
  ClaudeCodeActionType.PRODUCTION_DEPLOY
];
var DEFAULT_WORKFLOW_BOUNDARIES = {
  /** Max auto improvements per day */
  maxDailyAutoImprovements: 50,
  /** Max auto test additions per day */
  maxDailyAutoTests: 100,
  /** Max auto lint fixes per day */
  maxDailyAutoLintFixes: 200,
  /** Max auto doc updates per day */
  maxDailyAutoDocUpdates: 30,
  /** Max lines changed for auto-execute */
  maxAutoLinesChanged: 100,
  /** Max files changed for auto-execute */
  maxAutoFilesChanged: 5,
  /** Max concurrent workflows */
  maxConcurrentWorkflows: 3,
  /** Max steps in a workflow */
  maxWorkflowSteps: 10,
  /** Restricted paths require approval */
  restrictedPaths: [
    "src/core/",
    "src/config/",
    ".env",
    "packages/agent-core/src/",
    "packages/autonomy/src/core/",
    "packages/money-engine/src/core/"
  ],
  /** Restricted packages require approval */
  restrictedPackages: [
    "@gicm/agent-core",
    "@gicm/autonomy",
    "@gicm/money-engine",
    "@gicm/mcp-server"
  ]
};
var IMPROVEMENT_VALUE = {
  [ClaudeCodeActionType.ADD_TEST]: 50,
  [ClaudeCodeActionType.FIX_LINT]: 5,
  [ClaudeCodeActionType.UPDATE_DOCS]: 25,
  [ClaudeCodeActionType.ADD_COMMENTS]: 10,
  [ClaudeCodeActionType.FORMAT_CODE]: 2,
  [ClaudeCodeActionType.ADD_TYPE]: 15,
  [ClaudeCodeActionType.MODIFY_FUNCTION]: 30,
  [ClaudeCodeActionType.ADD_FEATURE]: 100,
  [ClaudeCodeActionType.REFACTOR]: 40,
  [ClaudeCodeActionType.CHANGE_API]: 60
};
var RISK_THRESHOLDS = {
  /** Safe: auto-execute */
  safe: 20,
  /** Low: auto-execute with logging */
  low: 40,
  /** Medium: queue for approval */
  medium: 60,
  /** High: escalate */
  high: 80,
  /** Critical: reject or escalate */
  critical: 100
};

// src/integration/workflow-adapter.ts
function generateId() {
  return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
var ClaudeWorkflowAdapter = class {
  dailyImprovements = [];
  dailyCounters = {};
  lastResetDate = "";
  emitter = new EventEmitter2();
  boundaries = { ...DEFAULT_WORKFLOW_BOUNDARIES };
  actionCount = 0;
  constructor() {
    this.resetDailyCounters();
  }
  // ============================================================================
  // Adapter Info
  // ============================================================================
  getEngineName() {
    return "ClaudeWorkflow";
  }
  getEngineType() {
    return "workflow";
  }
  getCategoryForType(actionType) {
    if (actionType.includes("deploy")) return "deployment";
    if (actionType.includes("config")) return "configuration";
    if (actionType.includes("test") || actionType.includes("lint"))
      return "content";
    return "build";
  }
  // ============================================================================
  // Action Creator
  // ============================================================================
  createAction(params) {
    this.actionCount++;
    const action = {
      id: generateId(),
      engine: "product",
      // Use product engine type for workflow actions
      category: this.getCategoryForType(params.type),
      type: params.type,
      description: params.description,
      params: params.metadata || {},
      metadata: {
        estimatedValue: params.value,
        reversible: params.reversible ?? true,
        urgency: "normal"
      },
      timestamp: Date.now()
    };
    return action;
  }
  // ============================================================================
  // Claude Code Action Creators
  // ============================================================================
  createEditAction(params) {
    const context = ClaudeCodeContextSchema.parse({
      filePath: params.context.filePath || "",
      ...params.context
    });
    const riskScore = this.calculateClaudeRisk(params.actionType, context);
    return this.createAction({
      type: params.actionType,
      description: params.title,
      value: this.getImprovementValue(params.actionType),
      reversible: this.isReversibleAction(params.actionType),
      metadata: {
        ...params,
        context,
        riskScore,
        isSafe: this.isSafeAction(params.actionType, context, riskScore)
      }
    });
  }
  createAddTestAction(params) {
    return this.createEditAction({
      actionType: ClaudeCodeActionType.ADD_TEST,
      title: `Add ${params.testCount || 1} tests for ${params.targetFile}`,
      context: {
        filePath: params.testFile,
        isTest: true,
        linesAdded: (params.testCount || 1) * 20
      }
    });
  }
  createFixLintAction(params) {
    return this.createEditAction({
      actionType: ClaudeCodeActionType.FIX_LINT,
      title: `Fix ${params.issueCount || 1} lint issues in ${params.filePath}`,
      context: {
        filePath: params.filePath,
        linesAdded: params.issueCount || 1,
        linesRemoved: params.issueCount || 1
      }
    });
  }
  createUpdateDocsAction(params) {
    return this.createEditAction({
      actionType: ClaudeCodeActionType.UPDATE_DOCS,
      title: `Update docs: ${params.description || params.filePath}`,
      context: {
        filePath: params.filePath
      }
    });
  }
  createModifyFunctionAction(params) {
    return this.createEditAction({
      actionType: ClaudeCodeActionType.MODIFY_FUNCTION,
      title: `Modify function ${params.functionName}`,
      context: {
        ...params.context,
        filePath: params.filePath,
        linesAdded: params.linesChanged
      }
    });
  }
  createDeployAction(params) {
    const actionType = params.environment === "production" ? ClaudeCodeActionType.PRODUCTION_DEPLOY : ClaudeCodeActionType.MODIFY_CONFIG;
    return this.createEditAction({
      actionType,
      title: `Deploy to ${params.environment}${params.service ? `: ${params.service}` : ""}`,
      context: {
        filePath: "deployment",
        affectsProduction: params.environment === "production"
      }
    });
  }
  // ============================================================================
  // Workflow Action Creators
  // ============================================================================
  createWorkflowRunAction(params) {
    const aggregateRisk = params.steps ? Math.max(...params.steps.map((s) => s.riskScore)) : params.aggregateRiskScore;
    return this.createAction({
      type: "workflow_run",
      description: `Run workflow: ${params.workflowName}`,
      value: 10,
      reversible: true,
      metadata: {
        ...params,
        aggregateRiskScore: aggregateRisk
      }
    });
  }
  // ============================================================================
  // Risk Calculation
  // ============================================================================
  calculateClaudeRisk(actionType, context) {
    let risk = CLAUDE_ACTION_BASE_RISK[actionType] || 50;
    if (context.isCore) risk += CONTEXT_RISK_MODIFIERS.isCore;
    if (context.affectsPublicApi) risk += CONTEXT_RISK_MODIFIERS.affectsPublicApi;
    if (context.affectsDatabase) risk += CONTEXT_RISK_MODIFIERS.affectsDatabase;
    if (context.affectsAuth) risk += CONTEXT_RISK_MODIFIERS.affectsAuth;
    if (context.affectsProduction) risk += CONTEXT_RISK_MODIFIERS.affectsProduction;
    if (context.linesAdded + context.linesRemoved > 100)
      risk += CONTEXT_RISK_MODIFIERS.largeChange;
    if (context.filesChanged > 5) risk += CONTEXT_RISK_MODIFIERS.multiFile;
    if (this.isRestrictedPath(context.filePath)) risk += 25;
    if (context.packageName && this.isRestrictedPackage(context.packageName))
      risk += 20;
    return Math.min(100, risk);
  }
  isSafeAction(actionType, context, riskScore) {
    if (DANGEROUS_CLAUDE_ACTIONS.includes(actionType))
      return false;
    if (riskScore > RISK_THRESHOLDS.safe) return false;
    if (context.affectsProduction) return false;
    if (context.affectsAuth) return false;
    if (context.linesAdded + context.linesRemoved > this.boundaries.maxAutoLinesChanged)
      return false;
    if (context.filesChanged > this.boundaries.maxAutoFilesChanged) return false;
    if (!this.checkDailyLimit(actionType)) return false;
    return SAFE_CLAUDE_ACTIONS.includes(actionType);
  }
  isRestrictedPath(filePath) {
    return this.boundaries.restrictedPaths.some((p) => filePath.includes(p));
  }
  isRestrictedPackage(packageName) {
    return this.boundaries.restrictedPackages.includes(packageName);
  }
  isReversibleAction(actionType) {
    const nonReversible = [
      ClaudeCodeActionType.DELETE_DATA,
      ClaudeCodeActionType.PRODUCTION_DEPLOY
    ];
    return !nonReversible.includes(actionType);
  }
  getImprovementValue(actionType) {
    return IMPROVEMENT_VALUE[actionType] || 10;
  }
  // ============================================================================
  // Daily Tracking
  // ============================================================================
  resetDailyCounters() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (this.lastResetDate !== today) {
      this.dailyCounters = {};
      this.dailyImprovements = [];
      this.lastResetDate = today;
    }
  }
  checkDailyLimit(actionType) {
    this.resetDailyCounters();
    const current = this.dailyCounters[actionType] || 0;
    let limit;
    switch (actionType) {
      case ClaudeCodeActionType.ADD_TEST:
        limit = this.boundaries.maxDailyAutoTests;
        break;
      case ClaudeCodeActionType.FIX_LINT:
        limit = this.boundaries.maxDailyAutoLintFixes;
        break;
      case ClaudeCodeActionType.UPDATE_DOCS:
        limit = this.boundaries.maxDailyAutoDocUpdates;
        break;
      default:
        limit = this.boundaries.maxDailyAutoImprovements;
    }
    if (current >= limit) {
      this.emitter.emit("boundary:exceeded", actionType, current, limit);
      return false;
    }
    return true;
  }
  incrementDailyCounter(actionType) {
    this.dailyCounters[actionType] = (this.dailyCounters[actionType] || 0) + 1;
  }
  // ============================================================================
  // Improvement Recording
  // ============================================================================
  recordImprovement(action, autoExecuted) {
    this.resetDailyCounters();
    this.incrementDailyCounter(action.type);
    const params = action.params;
    const context = params.context;
    const improvement = DailyImprovementSchema.parse({
      id: generateId(),
      actionType: action.type,
      title: action.description,
      description: params.description,
      value: action.metadata?.estimatedValue || this.getImprovementValue(action.type),
      autoExecuted,
      timestamp: Date.now(),
      filePath: context?.filePath,
      packageName: context?.packageName
    });
    this.dailyImprovements.push(improvement);
    this.emitter.emit("improvement:recorded", improvement);
    const riskScore = params.riskScore || 50;
    if (riskScore <= RISK_THRESHOLDS.safe) {
      this.emitter.emit("action:safe", action.type, riskScore);
    } else {
      this.emitter.emit("action:risky", action.type, riskScore);
    }
    return improvement;
  }
  getImprovementStats() {
    this.resetDailyCounters();
    const byType = {};
    const byPackage = {};
    for (const imp of this.dailyImprovements) {
      byType[imp.actionType] = (byType[imp.actionType] || 0) + 1;
      if (imp.packageName) {
        byPackage[imp.packageName] = (byPackage[imp.packageName] || 0) + 1;
      }
    }
    return {
      date: this.lastResetDate,
      totalImprovements: this.dailyImprovements.length,
      autoExecuted: this.dailyImprovements.filter((i) => i.autoExecuted).length,
      queued: this.dailyImprovements.filter((i) => !i.autoExecuted).length,
      escalated: 0,
      totalValue: this.dailyImprovements.reduce((sum, i) => sum + i.value, 0),
      byType,
      byPackage
    };
  }
  getDailyImprovements() {
    this.resetDailyCounters();
    return [...this.dailyImprovements];
  }
  // ============================================================================
  // Boundary Management
  // ============================================================================
  updateBoundaries(newBoundaries) {
    this.boundaries = { ...this.boundaries, ...newBoundaries };
  }
  getBoundaries() {
    return { ...this.boundaries };
  }
  // ============================================================================
  // Event Emitter
  // ============================================================================
  on(event, listener) {
    this.emitter.on(event, listener);
    return this;
  }
  off(event, listener) {
    this.emitter.off(event, listener);
    return this;
  }
  getActionCount() {
    return this.actionCount;
  }
};
var workflowAdapter = null;
function getWorkflowAdapter() {
  if (!workflowAdapter) {
    workflowAdapter = new ClaudeWorkflowAdapter();
  }
  return workflowAdapter;
}

export {
  EngineAdapter,
  MoneyEngineAdapter,
  GrowthEngineAdapter,
  ProductEngineAdapter,
  ClaudeCodeActionType,
  ClaudeCodeContextSchema,
  WorkflowActionType,
  WorkflowContextSchema,
  DailyImprovementSchema,
  ImprovementStatsSchema,
  CLAUDE_ACTION_BASE_RISK,
  CONTEXT_RISK_MODIFIERS,
  SAFE_CLAUDE_ACTIONS,
  DANGEROUS_CLAUDE_ACTIONS,
  DEFAULT_WORKFLOW_BOUNDARIES,
  IMPROVEMENT_VALUE,
  RISK_THRESHOLDS,
  ClaudeWorkflowAdapter,
  getWorkflowAdapter
};
//# sourceMappingURL=chunk-ZI5JHRPX.js.map