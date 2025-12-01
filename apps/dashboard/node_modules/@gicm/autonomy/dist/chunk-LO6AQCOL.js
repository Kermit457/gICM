import {
  CATEGORY_BASE_RISK,
  DANGEROUS_ACTION_TYPES,
  FINANCIAL_RISK_THRESHOLDS,
  RISK_FACTOR_WEIGHTS,
  RISK_LEVEL_OUTCOMES,
  RISK_SCORE_THRESHOLDS,
  SAFE_ACTION_TYPES
} from "./chunk-TENKIGAJ.js";
import {
  Logger
} from "./chunk-ZB2ZVSPL.js";

// src/decision/risk-classifier.ts
var RiskClassifier = class {
  logger;
  config;
  constructor(config = {}) {
    this.logger = new Logger("RiskClassifier");
    this.config = config;
  }
  /**
   * Classify risk level for an action
   */
  classify(action) {
    const factors = this.calculateFactors(action);
    const score = this.calculateTotalScore(factors);
    const level = this.scoreToLevel(score);
    const recommendation = this.getRecommendation(action, level);
    const assessment = {
      actionId: action.id,
      level,
      score: Math.round(score),
      factors,
      recommendation,
      constraints: this.getConstraints(action, level),
      timestamp: Date.now()
    };
    this.logger.debug(`Risk assessed: ${action.type}`, {
      score: assessment.score,
      level: assessment.level,
      recommendation: assessment.recommendation
    });
    return assessment;
  }
  /**
   * Calculate all risk factors for an action
   */
  calculateFactors(action) {
    const factors = [];
    factors.push(this.calculateFinancialFactor(action));
    factors.push(this.calculateReversibilityFactor(action));
    factors.push(this.calculateCategoryFactor(action));
    factors.push(this.calculateUrgencyFactor(action));
    factors.push(this.calculateVisibilityFactor(action));
    return factors;
  }
  /**
   * Calculate financial risk factor
   */
  calculateFinancialFactor(action) {
    const value = action.metadata.estimatedValue ?? 0;
    let riskScore = 0;
    let exceeded = false;
    let reason = "No financial value";
    if (value > 0) {
      if (value > FINANCIAL_RISK_THRESHOLDS.critical) {
        riskScore = 100;
        exceeded = true;
        reason = `High value: $${value} exceeds critical threshold`;
      } else if (value > FINANCIAL_RISK_THRESHOLDS.high) {
        riskScore = 70;
        exceeded = true;
        reason = `Elevated value: $${value}`;
      } else if (value > FINANCIAL_RISK_THRESHOLDS.medium) {
        riskScore = 40;
        reason = `Moderate value: $${value}`;
      } else if (value > FINANCIAL_RISK_THRESHOLDS.low) {
        riskScore = 20;
        reason = `Low value: $${value}`;
      } else {
        riskScore = 5;
        reason = `Negligible value: $${value}`;
      }
    }
    return {
      name: "financialValue",
      weight: RISK_FACTOR_WEIGHTS.financialValue,
      value: riskScore,
      threshold: 70,
      // Above this is concerning
      exceeded,
      reason
    };
  }
  /**
   * Calculate reversibility factor
   */
  calculateReversibilityFactor(action) {
    const reversible = action.metadata.reversible;
    const riskScore = reversible ? 10 : 80;
    return {
      name: "reversibility",
      weight: RISK_FACTOR_WEIGHTS.reversibility,
      value: riskScore,
      threshold: 50,
      exceeded: !reversible,
      reason: reversible ? "Action can be reversed if needed" : "Action is IRREVERSIBLE"
    };
  }
  /**
   * Calculate category base risk factor
   */
  calculateCategoryFactor(action) {
    const baseRisk = this.config.categoryRiskOverrides?.[action.category] ?? CATEGORY_BASE_RISK[action.category] ?? 50;
    return {
      name: "categoryRisk",
      weight: RISK_FACTOR_WEIGHTS.categoryRisk,
      value: baseRisk,
      threshold: 60,
      exceeded: baseRisk >= 60,
      reason: `Category "${action.category}" has base risk ${baseRisk}`
    };
  }
  /**
   * Calculate urgency factor
   */
  calculateUrgencyFactor(action) {
    const urgencyScores = {
      low: 10,
      normal: 30,
      high: 60,
      critical: 90
    };
    const urgency = action.metadata.urgency;
    const riskScore = urgencyScores[urgency] ?? 30;
    return {
      name: "urgency",
      weight: RISK_FACTOR_WEIGHTS.urgency,
      value: riskScore,
      threshold: 60,
      exceeded: urgency === "critical",
      reason: `Urgency level: ${urgency}`
    };
  }
  /**
   * Calculate external visibility factor
   */
  calculateVisibilityFactor(action) {
    const publicActions = ["tweet", "blog", "post", "publish", "announce"];
    const isPublic = publicActions.some((p) => action.type.includes(p));
    const riskScore = isPublic ? 60 : 20;
    return {
      name: "externalVisibility",
      weight: RISK_FACTOR_WEIGHTS.externalVisibility,
      value: riskScore,
      threshold: 50,
      exceeded: isPublic,
      reason: isPublic ? "Action is publicly visible" : "Action is internal only"
    };
  }
  /**
   * Calculate total weighted score
   */
  calculateTotalScore(factors) {
    return factors.reduce((sum, factor) => {
      return sum + factor.value * factor.weight;
    }, 0);
  }
  /**
   * Convert score to risk level
   */
  scoreToLevel(score) {
    if (score <= RISK_SCORE_THRESHOLDS.safe) return "safe";
    if (score <= RISK_SCORE_THRESHOLDS.low) return "low";
    if (score <= RISK_SCORE_THRESHOLDS.medium) return "medium";
    if (score <= RISK_SCORE_THRESHOLDS.high) return "high";
    return "critical";
  }
  /**
   * Get recommendation based on action type and risk level
   */
  getRecommendation(action, level) {
    const safeActions = [
      ...SAFE_ACTION_TYPES,
      ...this.config.additionalSafeActions ?? []
    ];
    if (safeActions.some((s) => action.type.includes(s))) {
      return "auto_execute";
    }
    if (DANGEROUS_ACTION_TYPES.some((d) => action.type.includes(d))) {
      return "escalate";
    }
    return RISK_LEVEL_OUTCOMES[level];
  }
  /**
   * Get constraints that apply to this action
   */
  getConstraints(action, level) {
    const constraints = [];
    if (level === "critical" || level === "high") {
      constraints.push("Requires human approval");
    }
    if (!action.metadata.reversible) {
      constraints.push("Action cannot be reversed");
    }
    if (action.category === "trading") {
      constraints.push("Subject to trading limits");
    }
    if (action.category === "deployment") {
      constraints.push("Production deployment requires approval");
    }
    return constraints;
  }
};

// src/core/config.ts
var DEFAULT_BOUNDARIES = {
  financial: {
    maxAutoExpense: 50,
    maxQueuedExpense: 200,
    maxDailySpend: 100,
    maxTradeSize: 500,
    maxDailyTradingLossPercent: 5,
    minTreasuryBalance: 1e3
  },
  content: {
    maxAutoPostsPerDay: 10,
    maxAutoBlogsPerWeek: 3,
    requireReviewForTopics: ["financial_advice", "controversial", "competitor_criticism"]
  },
  development: {
    maxAutoCommitLines: 100,
    maxAutoFilesChanged: 5,
    requireReviewForPaths: ["src/core/", "src/config/", ".env"],
    autoDeployToStaging: true,
    autoDeployToProduction: false
  },
  trading: {
    allowedBots: ["dca"],
    allowedTokens: ["SOL", "USDC"],
    maxPositionPercent: 20,
    requireApprovalForNewTokens: true
  },
  time: {
    activeHoursStart: 6,
    activeHoursEnd: 22,
    quietHoursStart: 23,
    quietHoursEnd: 6
  }
};
var DEFAULT_CONFIG = {
  enabled: true,
  level: 2,
  boundaries: DEFAULT_BOUNDARIES,
  notifications: {
    channels: [],
    rateLimitPerMinute: 10
  },
  approval: {
    maxPendingItems: 50,
    autoExpireHours: 24,
    notifyOnNewItem: true
  },
  audit: {
    retentionDays: 90,
    storageDir: "./data/audit"
  }
};
function createConfig(overrides) {
  if (!overrides) return DEFAULT_CONFIG;
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    boundaries: {
      ...DEFAULT_BOUNDARIES,
      ...overrides.boundaries,
      financial: {
        ...DEFAULT_BOUNDARIES.financial,
        ...overrides.boundaries?.financial
      },
      content: {
        ...DEFAULT_BOUNDARIES.content,
        ...overrides.boundaries?.content
      },
      development: {
        ...DEFAULT_BOUNDARIES.development,
        ...overrides.boundaries?.development
      },
      trading: {
        ...DEFAULT_BOUNDARIES.trading,
        ...overrides.boundaries?.trading
      },
      time: {
        ...DEFAULT_BOUNDARIES.time,
        ...overrides.boundaries?.time
      }
    },
    notifications: {
      ...DEFAULT_CONFIG.notifications,
      ...overrides.notifications
    },
    approval: {
      ...DEFAULT_CONFIG.approval,
      ...overrides.approval
    },
    audit: {
      ...DEFAULT_CONFIG.audit,
      ...overrides.audit
    }
  };
}
function loadConfigFromEnv() {
  const config = {};
  if (process.env.GICM_MAX_AUTO_EXPENSE) {
    config.boundaries = config.boundaries ?? {};
    config.boundaries.financial = config.boundaries.financial ?? {};
    config.boundaries.financial.maxAutoExpense = Number(process.env.GICM_MAX_AUTO_EXPENSE);
  }
  if (process.env.GICM_MAX_DAILY_SPEND) {
    config.boundaries = config.boundaries ?? {};
    config.boundaries.financial = config.boundaries.financial ?? {};
    config.boundaries.financial.maxDailySpend = Number(process.env.GICM_MAX_DAILY_SPEND);
  }
  if (process.env.GICM_MAX_TRADE_SIZE) {
    config.boundaries = config.boundaries ?? {};
    config.boundaries.financial = config.boundaries.financial ?? {};
    config.boundaries.financial.maxTradeSize = Number(process.env.GICM_MAX_TRADE_SIZE);
  }
  if (process.env.DISCORD_WEBHOOK_URL) {
    config.notifications = config.notifications ?? { channels: [], rateLimitPerMinute: 10 };
    config.notifications.channels.push({
      type: "discord",
      enabled: true,
      config: { webhookUrl: process.env.DISCORD_WEBHOOK_URL }
    });
  }
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    config.notifications = config.notifications ?? { channels: [], rateLimitPerMinute: 10 };
    config.notifications.channels.push({
      type: "telegram",
      enabled: true,
      config: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
      }
    });
  }
  return config;
}

// src/decision/boundary-checker.ts
var BoundaryChecker = class {
  logger;
  boundaries;
  dailyUsage;
  constructor(boundaries) {
    this.logger = new Logger("BoundaryChecker");
    this.boundaries = this.mergeBoundaries(boundaries);
    this.dailyUsage = /* @__PURE__ */ new Map();
  }
  /**
   * Check if an action passes all boundaries
   */
  check(action, riskLevel) {
    const violations = [];
    const warnings = [];
    const today = this.getTodayKey();
    const usage = this.getOrCreateUsage(today);
    switch (action.category) {
      case "trading":
        this.checkTradingBoundaries(action, usage, violations, warnings);
        break;
      case "content":
        this.checkContentBoundaries(action, usage, violations, warnings);
        break;
      case "build":
        this.checkBuildBoundaries(action, usage, violations, warnings);
        break;
      case "deployment":
        this.checkDeploymentBoundaries(action, violations, warnings);
        break;
      case "configuration":
        violations.push("Configuration changes require human approval");
        break;
    }
    this.checkFinancialBoundaries(action, usage, violations, warnings);
    this.checkTimeBoundaries(action, violations, warnings);
    if (riskLevel === "critical") {
      violations.push("Critical risk level requires escalation");
    }
    const result = {
      passed: violations.length === 0,
      violations,
      warnings,
      usageToday: usage
    };
    if (!result.passed) {
      this.logger.warn(`Boundary check failed for ${action.type}`, {
        violations,
        warnings
      });
    }
    return result;
  }
  /**
   * Check trading-specific boundaries
   */
  checkTradingBoundaries(action, usage, violations, warnings) {
    const trading = this.boundaries.trading;
    if (usage.trades >= 10) {
      violations.push(`Daily trade limit (10) exceeded`);
    } else if (usage.trades >= 8) {
      warnings.push(`Approaching daily trade limit (${usage.trades}/10)`);
    }
    const botType = action.params.botType;
    if (botType && !trading.allowedBots.includes(botType)) {
      violations.push(`Bot type "${botType}" not in allowed list`);
    }
    const token = action.params.token;
    if (token && !trading.allowedTokens.includes(token)) {
      if (trading.requireApprovalForNewTokens) {
        violations.push(`Token "${token}" requires approval for first trade`);
      } else {
        warnings.push(`Trading new token: ${token}`);
      }
    }
    const positionPercent = action.params.positionPercent;
    if (positionPercent && positionPercent > trading.maxPositionPercent) {
      violations.push(
        `Position size ${positionPercent}% exceeds max ${trading.maxPositionPercent}%`
      );
    }
    const amount = action.metadata.estimatedValue ?? 0;
    if (amount > this.boundaries.financial.maxTradeSize) {
      violations.push(
        `Trade size $${amount} exceeds max $${this.boundaries.financial.maxTradeSize}`
      );
    }
  }
  /**
   * Check content-specific boundaries
   */
  checkContentBoundaries(action, usage, violations, warnings) {
    const content = this.boundaries.content;
    if (usage.content >= content.maxAutoPostsPerDay) {
      violations.push(
        `Daily content limit (${content.maxAutoPostsPerDay}) reached`
      );
    } else if (usage.content >= content.maxAutoPostsPerDay - 2) {
      warnings.push(
        `Approaching daily content limit (${usage.content}/${content.maxAutoPostsPerDay})`
      );
    }
    const description = action.description.toLowerCase();
    const title = action.params.title?.toLowerCase() ?? "";
    const contentText = `${description} ${title}`;
    for (const topic of content.requireReviewForTopics) {
      if (contentText.includes(topic.toLowerCase())) {
        violations.push(`Content contains restricted topic: "${topic}"`);
      }
    }
    if (action.type.includes("blog")) {
      const weeklyBlogs = this.getWeeklyBlogCount();
      if (weeklyBlogs >= content.maxAutoBlogsPerWeek) {
        violations.push(
          `Weekly blog limit (${content.maxAutoBlogsPerWeek}) reached`
        );
      }
    }
  }
  /**
   * Check build-specific boundaries
   */
  checkBuildBoundaries(action, usage, violations, warnings) {
    const dev = this.boundaries.development;
    if (usage.builds >= 5) {
      violations.push("Daily build limit (5) reached");
    }
    const linesChanged = action.metadata.linesChanged ?? 0;
    if (linesChanged > dev.maxAutoCommitLines) {
      violations.push(
        `Lines changed (${linesChanged}) exceeds auto-commit limit (${dev.maxAutoCommitLines})`
      );
    }
    const filesChanged = action.metadata.filesChanged ?? 0;
    if (filesChanged > dev.maxAutoFilesChanged) {
      violations.push(
        `Files changed (${filesChanged}) exceeds auto-commit limit (${dev.maxAutoFilesChanged})`
      );
    }
    const paths = action.params.paths ?? [];
    for (const path of paths) {
      for (const restricted of dev.requireReviewForPaths) {
        if (path.includes(restricted)) {
          violations.push(`Changes to restricted path: ${restricted}`);
        }
      }
    }
  }
  /**
   * Check deployment-specific boundaries
   */
  checkDeploymentBoundaries(action, violations, warnings) {
    const dev = this.boundaries.development;
    const target = action.params.target;
    if (target === "production" || action.type.includes("production")) {
      if (!dev.autoDeployToProduction) {
        violations.push("Production deployments require human approval");
      }
    }
    if (target === "staging" || action.type.includes("staging")) {
      if (!dev.autoDeployToStaging) {
        warnings.push("Staging deployment flagged for review");
      }
    }
  }
  /**
   * Check financial boundaries
   */
  checkFinancialBoundaries(action, usage, violations, warnings) {
    const financial = this.boundaries.financial;
    const amount = action.metadata.estimatedValue ?? 0;
    if (amount > financial.maxAutoExpense) {
      if (amount > financial.maxQueuedExpense) {
        violations.push(
          `Expense $${amount} exceeds max queued limit $${financial.maxQueuedExpense}`
        );
      } else {
        warnings.push(
          `Expense $${amount} exceeds auto-approve limit $${financial.maxAutoExpense}`
        );
      }
    }
    const projectedSpend = usage.spending + amount;
    if (projectedSpend > financial.maxDailySpend) {
      violations.push(
        `Daily spending would exceed limit: $${projectedSpend} > $${financial.maxDailySpend}`
      );
    } else if (projectedSpend > financial.maxDailySpend * 0.8) {
      warnings.push(
        `Approaching daily spend limit: $${projectedSpend}/$${financial.maxDailySpend}`
      );
    }
  }
  /**
   * Check time-based restrictions
   */
  checkTimeBoundaries(action, violations, warnings) {
    const time = this.boundaries.time;
    const hour = (/* @__PURE__ */ new Date()).getUTCHours();
    const inQuietHours = hour >= time.quietHoursStart || hour < time.quietHoursEnd;
    if (inQuietHours) {
      if (action.metadata.urgency !== "critical") {
        warnings.push("Action during quiet hours - may be delayed");
      }
    }
    const inActiveHours = hour >= time.activeHoursStart && hour < time.activeHoursEnd;
    if (!inActiveHours && action.category === "content") {
      warnings.push("Content posting outside active hours");
    }
  }
  /**
   * Record usage after action execution
   */
  recordUsage(action) {
    const today = this.getTodayKey();
    const usage = this.getOrCreateUsage(today);
    switch (action.category) {
      case "trading":
        usage.trades++;
        break;
      case "content":
        usage.content++;
        break;
      case "build":
        usage.builds++;
        break;
    }
    if (action.metadata.estimatedValue) {
      usage.spending += action.metadata.estimatedValue;
    }
    this.dailyUsage.set(today, usage);
    this.logger.debug(`Usage recorded for ${action.type}`, usage);
  }
  /**
   * Get current usage for today
   */
  getUsageToday() {
    return this.getOrCreateUsage(this.getTodayKey());
  }
  /**
   * Get current boundaries
   */
  getBoundaries() {
    return { ...this.boundaries };
  }
  /**
   * Update boundaries at runtime
   */
  updateBoundaries(updates) {
    this.boundaries = this.mergeBoundaries(updates);
    this.logger.info("Boundaries updated");
  }
  /**
   * Reset daily usage (for testing or new day)
   */
  resetDailyUsage() {
    this.dailyUsage.clear();
    this.logger.info("Daily usage reset");
  }
  // Helper methods
  getTodayKey() {
    return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  }
  getOrCreateUsage(key) {
    if (!this.dailyUsage.has(key)) {
      this.dailyUsage.set(key, {
        trades: 0,
        content: 0,
        builds: 0,
        spending: 0
      });
    }
    return this.dailyUsage.get(key);
  }
  getWeeklyBlogCount() {
    return 0;
  }
  mergeBoundaries(overrides) {
    if (!overrides) return DEFAULT_BOUNDARIES;
    return {
      financial: { ...DEFAULT_BOUNDARIES.financial, ...overrides.financial },
      content: { ...DEFAULT_BOUNDARIES.content, ...overrides.content },
      development: {
        ...DEFAULT_BOUNDARIES.development,
        ...overrides.development
      },
      trading: { ...DEFAULT_BOUNDARIES.trading, ...overrides.trading },
      time: { ...DEFAULT_BOUNDARIES.time, ...overrides.time }
    };
  }
};

// src/decision/decision-router.ts
import { EventEmitter } from "eventemitter3";
var DecisionRouter = class extends EventEmitter {
  logger;
  riskClassifier;
  boundaryChecker;
  autonomyLevel;
  decisionCount = 0;
  constructor(config = {}) {
    super();
    this.logger = new Logger("DecisionRouter");
    this.autonomyLevel = config.autonomyLevel ?? 2;
    this.riskClassifier = new RiskClassifier(config.riskClassifier);
    this.boundaryChecker = new BoundaryChecker(config.boundaries);
  }
  /**
   * Route an action through risk assessment and boundary checks
   */
  async route(action) {
    this.logger.info(`Routing action: ${action.type}`, {
      engine: action.engine,
      category: action.category
    });
    const assessment = this.riskClassifier.classify(action);
    const boundaryResult = this.boundaryChecker.check(action, assessment.level);
    const outcome = this.determineOutcome(action, assessment, boundaryResult);
    const decision = this.createDecision(
      action,
      assessment,
      boundaryResult,
      outcome
    );
    this.emitDecisionEvents(decision, boundaryResult);
    this.logger.info(`Decision: ${outcome}`, {
      actionId: action.id,
      riskLevel: assessment.level,
      riskScore: assessment.score,
      boundariesPassed: boundaryResult.passed
    });
    return decision;
  }
  /**
   * Determine the routing outcome based on all factors
   */
  determineOutcome(action, assessment, boundaryResult) {
    if (boundaryResult.violations.some((v) => v.includes("Production"))) {
      return "escalate";
    }
    if (!boundaryResult.passed) {
      const criticalViolations = boundaryResult.violations.filter(
        (v) => v.includes("exceeds") || v.includes("limit") || v.includes("IRREVERSIBLE")
      );
      if (criticalViolations.length > 0) {
        return "queue_approval";
      }
      return "reject";
    }
    switch (this.autonomyLevel) {
      case 1:
        return "queue_approval";
      case 2:
        return this.routeLevel2(action, assessment);
      case 3:
        return this.routeLevel3(action, assessment);
      case 4:
        return this.routeLevel4(action, assessment);
      default:
        return "queue_approval";
    }
  }
  /**
   * Level 2 routing: Bounded autonomy
   */
  routeLevel2(action, assessment) {
    if (assessment.level === "safe" || assessment.level === "low") {
      if (action.category === "content") {
        return "auto_execute";
      }
      if (action.category === "trading") {
        if (action.type.includes("dca") || action.type.includes("scheduled")) {
          return "auto_execute";
        }
        return "queue_approval";
      }
      return "auto_execute";
    }
    if (assessment.level === "medium") {
      return "queue_approval";
    }
    if (assessment.level === "high") {
      return "queue_approval";
    }
    return "escalate";
  }
  /**
   * Level 3 routing: Supervised autonomy
   */
  routeLevel3(action, assessment) {
    if (assessment.level === "safe" || assessment.level === "low" || assessment.level === "medium") {
      return "auto_execute";
    }
    if (assessment.level === "high") {
      return "queue_approval";
    }
    return "escalate";
  }
  /**
   * Level 4 routing: Full autonomy
   */
  routeLevel4(action, assessment) {
    if (assessment.level === "critical") {
      return "escalate";
    }
    return "auto_execute";
  }
  /**
   * Create a decision record
   */
  createDecision(action, assessment, boundaryResult, outcome) {
    this.decisionCount++;
    const reason = this.buildReason(action, assessment, boundaryResult, outcome);
    return {
      id: `dec_${Date.now()}_${this.decisionCount}`,
      actionId: action.id,
      action,
      assessment,
      outcome,
      reason,
      rollbackAvailable: action.metadata.reversible,
      timestamp: Date.now()
    };
  }
  /**
   * Build human-readable reason for decision
   */
  buildReason(action, assessment, boundaryResult, outcome) {
    const parts = [];
    parts.push(`Risk: ${assessment.level} (score: ${assessment.score})`);
    if (!boundaryResult.passed) {
      parts.push(`Boundary violations: ${boundaryResult.violations.join(", ")}`);
    } else if (boundaryResult.warnings.length > 0) {
      parts.push(`Warnings: ${boundaryResult.warnings.join(", ")}`);
    }
    switch (outcome) {
      case "auto_execute":
        parts.push("Auto-executing within safe boundaries");
        break;
      case "queue_approval":
        parts.push("Queued for human review");
        break;
      case "escalate":
        parts.push("Escalated - requires immediate attention");
        break;
      case "reject":
        parts.push("Rejected due to boundary violations");
        break;
    }
    return parts.join(" | ");
  }
  /**
   * Emit appropriate events for the decision
   */
  emitDecisionEvents(decision, boundaryResult) {
    this.emit("decision:made", decision);
    switch (decision.outcome) {
      case "auto_execute":
        this.emit("decision:auto_execute", decision);
        break;
      case "queue_approval":
        this.emit("decision:queued", decision);
        break;
      case "escalate":
        this.emit("decision:escalated", decision);
        break;
      case "reject":
        this.emit("decision:rejected", decision);
        break;
    }
    if (!boundaryResult.passed) {
      this.emit(
        "boundary:violation",
        decision.action,
        boundaryResult.violations
      );
    }
  }
  /**
   * Record action was executed (updates boundary usage)
   */
  recordExecution(action) {
    this.boundaryChecker.recordUsage(action);
  }
  /**
   * Get boundary checker for direct access
   */
  getBoundaryChecker() {
    return this.boundaryChecker;
  }
  /**
   * Get risk classifier for direct access
   */
  getRiskClassifier() {
    return this.riskClassifier;
  }
  /**
   * Update autonomy level
   */
  setAutonomyLevel(level) {
    this.autonomyLevel = level;
    this.logger.info(`Autonomy level set to ${level}`);
  }
  /**
   * Get current autonomy level
   */
  getAutonomyLevel() {
    return this.autonomyLevel;
  }
  /**
   * Update boundaries at runtime
   */
  updateBoundaries(updates) {
    this.boundaryChecker.updateBoundaries(updates);
  }
};

// src/decision/pipeline-classifier.ts
import { z } from "zod";
var PipelineStepSchema = z.object({
  id: z.string(),
  tool: z.string(),
  inputs: z.record(z.unknown()),
  dependsOn: z.array(z.string()).optional(),
  condition: z.string().optional(),
  retries: z.number().optional(),
  timeout: z.number().optional()
});
var PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().optional(),
  steps: z.array(PipelineStepSchema),
  inputs: z.record(z.object({
    type: z.string(),
    description: z.string(),
    required: z.boolean().optional(),
    default: z.unknown().optional()
  })).optional(),
  outputs: z.array(z.string()).optional(),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    riskLevel: z.enum(["safe", "low", "medium", "high", "critical"]).optional(),
    estimatedDuration: z.number().optional()
  }).optional()
});
var PipelineRiskAssessmentSchema = z.object({
  pipelineId: z.string(),
  level: z.enum(["safe", "low", "medium", "high", "critical"]),
  score: z.number().min(0).max(100),
  factors: z.array(z.object({
    name: z.string(),
    weight: z.number(),
    value: z.number(),
    threshold: z.number(),
    exceeded: z.boolean(),
    reason: z.string()
  })),
  stepRisks: z.array(z.object({
    stepId: z.string(),
    tool: z.string(),
    riskScore: z.number(),
    reason: z.string()
  })),
  recommendation: z.enum(["auto_execute", "queue_approval", "escalate", "reject"]),
  constraints: z.array(z.string()),
  estimatedImpact: z.object({
    financial: z.number(),
    visibility: z.enum(["internal", "limited", "public"]),
    reversibility: z.enum(["full", "partial", "none"])
  }),
  timestamp: z.number()
});
var TOOL_RISK_SCORES = {
  // Safe tools (0-20)
  "search_tools": 5,
  "search_gicm": 5,
  "analyzer": 10,
  "report_generator": 10,
  "seo_researcher": 10,
  "analytics_agent": 15,
  // Low risk tools (21-40)
  "hunter_agent": 25,
  "defi_agent": 30,
  "content_generator": 30,
  "seo_optimizer": 25,
  "decision_agent": 30,
  // Medium risk tools (41-60)
  "wallet_agent": 50,
  "audit_agent": 40,
  "scheduler": 45,
  "social_agent": 50,
  // High risk tools (61-80)
  "trading_agent": 70,
  "deployer_agent": 75,
  "bridge_agent": 75,
  // Critical risk tools (81-100)
  "treasury_agent": 90,
  "admin_agent": 95
};
var DANGEROUS_TOOL_COMBINATIONS = [
  ["wallet_agent", "trading_agent"],
  // Financial operations
  ["wallet_agent", "bridge_agent"],
  // Cross-chain operations
  ["deployer_agent", "wallet_agent"]
  // Deploy with funds
];
var PipelineRiskClassifier = class {
  logger;
  config;
  constructor(config = {}) {
    this.logger = new Logger("PipelineRiskClassifier");
    this.config = config;
  }
  /**
   * Classify risk level for an entire pipeline
   */
  classify(pipeline) {
    const factors = this.calculateFactors(pipeline);
    const stepRisks = this.calculateStepRisks(pipeline);
    const score = this.calculateTotalScore(factors);
    const level = this.scoreToLevel(score);
    const recommendation = this.getRecommendation(pipeline, level, stepRisks);
    const assessment = {
      pipelineId: pipeline.id,
      level,
      score: Math.round(score),
      factors,
      stepRisks,
      recommendation,
      constraints: this.getConstraints(pipeline, level),
      estimatedImpact: this.estimateImpact(pipeline, stepRisks),
      timestamp: Date.now()
    };
    this.logger.debug(`Pipeline risk assessed: ${pipeline.name}`, {
      score: assessment.score,
      level: assessment.level,
      recommendation: assessment.recommendation
    });
    return assessment;
  }
  /**
   * Calculate all risk factors for a pipeline
   */
  calculateFactors(pipeline) {
    const factors = [];
    factors.push(this.calculateToolRiskFactor(pipeline));
    factors.push(this.calculateCombinationFactor(pipeline));
    factors.push(this.calculateComplexityFactor(pipeline));
    factors.push(this.calculateDataFlowFactor(pipeline));
    factors.push(this.calculateMetadataFactor(pipeline));
    return factors;
  }
  /**
   * Calculate cumulative risk from all tools
   */
  calculateToolRiskFactor(pipeline) {
    const toolScores = pipeline.steps.map((step) => {
      const baseScore = this.config.toolRiskOverrides?.[step.tool] ?? TOOL_RISK_SCORES[step.tool] ?? 50;
      return { tool: step.tool, score: baseScore };
    });
    const avgScore = toolScores.reduce((sum, t, i) => {
      const weight = 1 / (i + 1);
      return sum + t.score * weight;
    }, 0) / Math.log(toolScores.length + 1);
    const maxScore = Math.max(...toolScores.map((t) => t.score), 0);
    const combinedScore = avgScore * 0.6 + maxScore * 0.4;
    return {
      name: "cumulativeToolRisk",
      weight: 0.35,
      value: Math.min(combinedScore, 100),
      threshold: 60,
      exceeded: combinedScore > 60,
      reason: `${pipeline.steps.length} tools, highest risk: ${maxScore}`
    };
  }
  /**
   * Check for dangerous tool combinations
   */
  calculateCombinationFactor(pipeline) {
    const tools = pipeline.steps.map((s) => s.tool);
    const dangerousCombos = [
      ...DANGEROUS_TOOL_COMBINATIONS,
      ...this.config.dangerousCombinations ?? []
    ];
    const foundCombinations = [];
    for (const combo of dangerousCombos) {
      if (combo.every((tool) => tools.includes(tool))) {
        foundCombinations.push(combo.join(" + "));
      }
    }
    const riskScore = foundCombinations.length > 0 ? Math.min(50 + foundCombinations.length * 20, 100) : 10;
    return {
      name: "dangerousCombinations",
      weight: 0.25,
      value: riskScore,
      threshold: 50,
      exceeded: foundCombinations.length > 0,
      reason: foundCombinations.length > 0 ? `Dangerous combinations: ${foundCombinations.join(", ")}` : "No dangerous tool combinations detected"
    };
  }
  /**
   * Calculate complexity-based risk
   */
  calculateComplexityFactor(pipeline) {
    const stepCount = pipeline.steps.length;
    const hasConditions = pipeline.steps.some((s) => s.condition);
    const hasDependencies = pipeline.steps.some((s) => s.dependsOn?.length);
    const maxDepth = this.calculateDependencyDepth(pipeline);
    let riskScore = 10;
    riskScore += Math.min(stepCount * 5, 30);
    if (hasConditions) riskScore += 15;
    if (maxDepth > 3) riskScore += 20;
    const maxSteps = this.config.maxStepsBeforeReview ?? 5;
    if (stepCount > maxSteps) riskScore += 15;
    return {
      name: "pipelineComplexity",
      weight: 0.15,
      value: Math.min(riskScore, 100),
      threshold: 50,
      exceeded: stepCount > maxSteps || maxDepth > 3,
      reason: `${stepCount} steps, depth ${maxDepth}, ${hasConditions ? "has" : "no"} conditions`
    };
  }
  /**
   * Calculate data flow risk (sensitive data propagation)
   */
  calculateDataFlowFactor(pipeline) {
    const sensitivePatterns = [
      "wallet",
      "token",
      "key",
      "secret",
      "password",
      "balance",
      "private",
      "transfer",
      "execute",
      "deploy"
    ];
    let sensitiveFlows = 0;
    for (const step of pipeline.steps) {
      const inputStr = JSON.stringify(step.inputs).toLowerCase();
      for (const pattern of sensitivePatterns) {
        if (inputStr.includes(pattern)) {
          sensitiveFlows++;
        }
      }
    }
    const riskScore = Math.min(sensitiveFlows * 10, 80);
    return {
      name: "dataFlowRisk",
      weight: 0.15,
      value: riskScore,
      threshold: 40,
      exceeded: sensitiveFlows > 3,
      reason: `${sensitiveFlows} sensitive data flows detected`
    };
  }
  /**
   * Use pipeline metadata risk level if provided
   */
  calculateMetadataFactor(pipeline) {
    const declaredLevel = pipeline.metadata?.riskLevel;
    const riskScores = {
      safe: 10,
      low: 25,
      medium: 50,
      high: 75,
      critical: 95
    };
    const riskScore = declaredLevel ? riskScores[declaredLevel] : 50;
    return {
      name: "declaredRiskLevel",
      weight: 0.1,
      value: riskScore,
      threshold: 50,
      exceeded: riskScore > 50,
      reason: declaredLevel ? `Pipeline declared as "${declaredLevel}" risk` : "No risk level declared, assuming medium"
    };
  }
  /**
   * Calculate risk for each step
   */
  calculateStepRisks(pipeline) {
    return pipeline.steps.map((step) => {
      const baseScore = this.config.toolRiskOverrides?.[step.tool] ?? TOOL_RISK_SCORES[step.tool] ?? 50;
      let reason = `Base tool risk: ${baseScore}`;
      if (step.condition) {
        reason += " (+conditional execution)";
      }
      if (step.timeout && step.timeout > 6e4) {
        reason += " (+long timeout)";
      }
      return {
        stepId: step.id,
        tool: step.tool,
        riskScore: baseScore,
        reason
      };
    });
  }
  /**
   * Calculate dependency chain depth
   */
  calculateDependencyDepth(pipeline) {
    const stepMap = new Map(pipeline.steps.map((s) => [s.id, s]));
    const cache = /* @__PURE__ */ new Map();
    const getDepth = (stepId) => {
      if (cache.has(stepId)) return cache.get(stepId);
      const step = stepMap.get(stepId);
      if (!step || !step.dependsOn?.length) {
        cache.set(stepId, 0);
        return 0;
      }
      const maxDepDep = Math.max(...step.dependsOn.map(getDepth));
      const depth = maxDepDep + 1;
      cache.set(stepId, depth);
      return depth;
    };
    return Math.max(...pipeline.steps.map((s) => getDepth(s.id)), 0);
  }
  /**
   * Calculate total weighted score
   */
  calculateTotalScore(factors) {
    return factors.reduce((sum, factor) => {
      return sum + factor.value * factor.weight;
    }, 0);
  }
  /**
   * Convert score to risk level
   */
  scoreToLevel(score) {
    if (score <= RISK_SCORE_THRESHOLDS.safe) return "safe";
    if (score <= RISK_SCORE_THRESHOLDS.low) return "low";
    if (score <= RISK_SCORE_THRESHOLDS.medium) return "medium";
    if (score <= RISK_SCORE_THRESHOLDS.high) return "high";
    return "critical";
  }
  /**
   * Get recommendation based on pipeline analysis
   */
  getRecommendation(pipeline, level, stepRisks) {
    if (stepRisks.some((s) => s.riskScore >= 90)) {
      return "escalate";
    }
    if (pipeline.metadata?.riskLevel === "safe" && level !== "critical") {
      return "auto_execute";
    }
    return RISK_LEVEL_OUTCOMES[level];
  }
  /**
   * Get constraints that apply to this pipeline
   */
  getConstraints(pipeline, level) {
    const constraints = [];
    if (level === "critical" || level === "high") {
      constraints.push("Requires human approval before execution");
    }
    const hasFinancialTools = pipeline.steps.some(
      (s) => ["wallet_agent", "trading_agent", "treasury_agent"].includes(s.tool)
    );
    if (hasFinancialTools) {
      constraints.push("Subject to financial limits");
    }
    const hasDeployment = pipeline.steps.some(
      (s) => s.tool === "deployer_agent"
    );
    if (hasDeployment) {
      constraints.push("Deployment requires approval");
    }
    if (pipeline.steps.length > 5) {
      constraints.push("Large pipeline - monitor execution");
    }
    return constraints;
  }
  /**
   * Estimate pipeline impact
   */
  estimateImpact(pipeline, stepRisks) {
    let financial = 0;
    for (const step of pipeline.steps) {
      if (step.tool.includes("wallet") || step.tool.includes("trading")) {
        financial += 100;
      }
      if (step.tool.includes("treasury")) {
        financial += 500;
      }
    }
    const hasPublicTools = pipeline.steps.some(
      (s) => ["social_agent", "content_generator", "scheduler"].includes(s.tool)
    );
    const visibility = hasPublicTools ? "public" : "internal";
    const hasIrreversible = pipeline.steps.some(
      (s) => ["deployer_agent", "bridge_agent", "trading_agent"].includes(s.tool)
    );
    const reversibility = hasIrreversible ? "partial" : "full";
    return { financial, visibility, reversibility };
  }
};

// src/decision/six-hats-evaluator.ts
import { z as z2 } from "zod";
var HatTypeSchema = z2.enum([
  "white",
  // Facts & Data
  "red",
  // Emotions & Intuition
  "black",
  // Caution & Risks
  "yellow",
  // Benefits & Optimism
  "green",
  // Creativity & Alternatives
  "blue"
  // Process & Meta
]);
var HatVerdictSchema = z2.enum(["proceed", "caution", "stop", "review"]);
var HatPerspectiveSchema = z2.object({
  hat: HatTypeSchema,
  verdict: HatVerdictSchema,
  analysis: z2.string(),
  keyPoints: z2.array(z2.string()),
  score: z2.number().min(0).max(100)
  // 100 = strongly proceed, 0 = strongly stop
});
var SixHatsConsensusSchema = z2.enum([
  "strong_proceed",
  // 5-6 hats say proceed
  "proceed",
  // 4+ hats say proceed
  "mixed",
  // Split decision
  "caution",
  // 4+ hats say caution/review
  "stop"
  // Any hat says stop or 3+ say caution
]);
var SixHatsResultSchema = z2.object({
  actionId: z2.string(),
  perspectives: z2.object({
    white: HatPerspectiveSchema,
    red: HatPerspectiveSchema,
    black: HatPerspectiveSchema,
    yellow: HatPerspectiveSchema,
    green: HatPerspectiveSchema,
    blue: HatPerspectiveSchema
  }),
  consensus: SixHatsConsensusSchema,
  overallScore: z2.number().min(0).max(100),
  recommendation: z2.string(),
  timestamp: z2.number()
});
var SixHatsEvaluator = class {
  logger;
  constructor() {
    this.logger = new Logger("SixHatsEvaluator");
  }
  /**
   * Evaluate an action using all six thinking hats
   */
  evaluate(action, riskAssessment) {
    this.logger.debug(`Evaluating action with Six Hats: ${action.type}`);
    const perspectives = {
      white: this.evaluateWhiteHat(action, riskAssessment),
      red: this.evaluateRedHat(action, riskAssessment),
      black: this.evaluateBlackHat(action, riskAssessment),
      yellow: this.evaluateYellowHat(action, riskAssessment),
      green: this.evaluateGreenHat(action, riskAssessment),
      blue: this.evaluateBlueHat(action, riskAssessment)
    };
    const consensus = this.determineConsensus(perspectives);
    const overallScore = this.calculateOverallScore(perspectives);
    const recommendation = this.generateRecommendation(perspectives, consensus);
    const result = {
      actionId: action.id,
      perspectives,
      consensus,
      overallScore,
      recommendation,
      timestamp: Date.now()
    };
    this.logger.info(`Six Hats analysis complete`, {
      actionType: action.type,
      consensus,
      score: overallScore
    });
    return result;
  }
  /**
   * White Hat: Facts, data, objective analysis
   * Focus: What information do we have? What do we need?
   */
  evaluateWhiteHat(action, assessment) {
    const keyPoints = [];
    let score = 50;
    keyPoints.push(`Action type: ${action.type}`);
    keyPoints.push(`Category: ${action.category}`);
    keyPoints.push(`Engine: ${action.engine}`);
    if (action.metadata.estimatedValue !== void 0) {
      keyPoints.push(`Estimated value: $${action.metadata.estimatedValue}`);
      score += action.metadata.estimatedValue < 50 ? 10 : -10;
    } else {
      keyPoints.push("Warning: No estimated value provided");
      score -= 15;
    }
    if (action.metadata.reversible) {
      keyPoints.push("Action is reversible");
      score += 20;
    } else {
      keyPoints.push("Action is NOT reversible");
      score -= 20;
    }
    if (assessment) {
      keyPoints.push(`Risk score: ${assessment.score}/100`);
      keyPoints.push(`Risk level: ${assessment.level}`);
    }
    score = Math.max(0, Math.min(100, score));
    return {
      hat: "white",
      verdict: score >= 60 ? "proceed" : score >= 40 ? "review" : "caution",
      analysis: "Objective data analysis of action parameters and risk factors",
      keyPoints,
      score
    };
  }
  /**
   * Red Hat: Emotions, intuition, gut feelings
   * Focus: How does this feel? What's the instinct?
   */
  evaluateRedHat(action, assessment) {
    const keyPoints = [];
    let score = 50;
    if (action.metadata.urgency === "critical") {
      keyPoints.push("High pressure situation - feels rushed");
      score -= 20;
    } else if (action.metadata.urgency === "high") {
      keyPoints.push("Moderate urgency - some pressure");
      score -= 10;
    } else {
      keyPoints.push("Comfortable timeline - no rush");
      score += 10;
    }
    if (action.category === "trading") {
      keyPoints.push("Trading feels risky - market volatility");
      score -= 10;
    } else if (action.category === "content") {
      keyPoints.push("Content creation feels relatively safe");
      score += 10;
    }
    if (assessment?.level === "critical" || assessment?.level === "high") {
      keyPoints.push("Gut says: this needs human oversight");
      score -= 25;
    } else if (assessment?.level === "safe") {
      keyPoints.push("Feels like a routine operation");
      score += 20;
    }
    if (!action.metadata.reversible) {
      keyPoints.push("Uncomfortable with irreversible actions");
      score -= 15;
    }
    score = Math.max(0, Math.min(100, score));
    return {
      hat: "red",
      verdict: score >= 60 ? "proceed" : score >= 40 ? "caution" : "stop",
      analysis: "Intuitive response to action risk and urgency",
      keyPoints,
      score
    };
  }
  /**
   * Black Hat: Caution, risks, what could go wrong
   * Focus: Identify dangers, weaknesses, threats
   */
  evaluateBlackHat(action, assessment) {
    const keyPoints = [];
    let score = 70;
    if (assessment) {
      for (const factor of assessment.factors) {
        if (factor.exceeded) {
          keyPoints.push(`Risk: ${factor.reason}`);
          score -= 15;
        }
      }
      if (assessment.level === "critical") {
        keyPoints.push("CRITICAL: Multiple failure modes possible");
        score -= 30;
      } else if (assessment.level === "high") {
        keyPoints.push("HIGH RISK: Significant potential for issues");
        score -= 20;
      }
    }
    if (action.metadata.estimatedValue && action.metadata.estimatedValue > 100) {
      keyPoints.push("Danger: High-value operation");
      score -= 15;
    }
    if (!action.metadata.reversible) {
      keyPoints.push("Danger: No rollback option");
      score -= 20;
    }
    if (action.category === "deployment") {
      keyPoints.push("Deployment risk: Could affect production");
      score -= 15;
    }
    if (action.category === "trading") {
      keyPoints.push("Trading risk: Market conditions unknown");
      score -= 10;
    }
    score = Math.max(0, Math.min(100, score));
    return {
      hat: "black",
      verdict: score >= 60 ? "proceed" : score >= 30 ? "caution" : "stop",
      analysis: "Critical analysis of risks and potential failure modes",
      keyPoints,
      score
    };
  }
  /**
   * Yellow Hat: Benefits, optimism, advantages
   * Focus: What are the potential gains?
   */
  evaluateYellowHat(action, _assessment) {
    const keyPoints = [];
    let score = 50;
    if (action.category === "content") {
      keyPoints.push("Benefit: Increases platform visibility");
      keyPoints.push("Benefit: Builds community engagement");
      score += 20;
    }
    if (action.category === "build") {
      keyPoints.push("Benefit: Expands platform capabilities");
      keyPoints.push("Benefit: Creates value for users");
      score += 20;
    }
    if (action.category === "trading") {
      keyPoints.push("Benefit: Potential for profit");
      keyPoints.push("Benefit: Grows treasury");
      score += 15;
    }
    if (action.metadata.estimatedValue !== void 0 && action.metadata.estimatedValue < 20) {
      keyPoints.push("Benefit: Low-stakes action for learning");
      score += 15;
    }
    if (action.metadata.reversible) {
      keyPoints.push("Benefit: Can be undone if needed");
      score += 15;
    }
    keyPoints.push("Benefit: Autonomous execution saves time");
    score += 10;
    score = Math.max(0, Math.min(100, score));
    return {
      hat: "yellow",
      verdict: score >= 60 ? "proceed" : "caution",
      analysis: "Optimistic view of potential benefits and positive outcomes",
      keyPoints,
      score
    };
  }
  /**
   * Green Hat: Creativity, alternatives, new ideas
   * Focus: What other approaches could work?
   */
  evaluateGreenHat(action, assessment) {
    const keyPoints = [];
    let score = 60;
    if (assessment?.level === "high" || assessment?.level === "critical") {
      keyPoints.push("Alternative: Break into smaller, lower-risk steps");
      keyPoints.push("Alternative: Add manual checkpoint before execution");
      score -= 10;
    }
    if (action.category === "trading" && action.metadata.estimatedValue && action.metadata.estimatedValue > 50) {
      keyPoints.push("Alternative: Reduce trade size to minimize risk");
      keyPoints.push("Alternative: Use paper trading mode first");
    }
    if (action.category === "content") {
      keyPoints.push("Alternative: Queue for batch review before posting");
    }
    if (action.category === "deployment") {
      keyPoints.push("Alternative: Deploy to staging first");
      keyPoints.push("Alternative: Use canary deployment pattern");
    }
    keyPoints.push("Idea: Log action for learning/improvement");
    if (!action.metadata.reversible) {
      keyPoints.push("Idea: Create a snapshot before executing");
    }
    score = Math.max(0, Math.min(100, score));
    return {
      hat: "green",
      verdict: "review",
      analysis: "Creative alternatives and process improvements",
      keyPoints,
      score
    };
  }
  /**
   * Blue Hat: Process, meta-thinking, next steps
   * Focus: What's the overall process recommendation?
   */
  evaluateBlueHat(action, assessment) {
    const keyPoints = [];
    let score = 60;
    if (assessment) {
      if (assessment.level === "safe" || assessment.level === "low") {
        keyPoints.push("Process: Auto-execute is appropriate");
        score += 20;
      } else if (assessment.level === "medium") {
        keyPoints.push("Process: Queue for batch approval recommended");
        score += 5;
      } else {
        keyPoints.push("Process: Escalate for immediate human review");
        score -= 20;
      }
    }
    keyPoints.push("Process: Log all actions for audit trail");
    if (action.category === "trading") {
      keyPoints.push("Process: Verify trading limits before execution");
    }
    if (action.category === "deployment") {
      keyPoints.push("Process: Run tests before deployment");
    }
    keyPoints.push(`Process: Current autonomy level determines execution path`);
    score = Math.max(0, Math.min(100, score));
    return {
      hat: "blue",
      verdict: score >= 60 ? "proceed" : "review",
      analysis: "Process control and meta-analysis of decision-making",
      keyPoints,
      score
    };
  }
  /**
   * Determine consensus from all perspectives
   */
  determineConsensus(perspectives) {
    const verdicts = Object.values(perspectives).map((p) => p.verdict);
    const proceedCount = verdicts.filter((v) => v === "proceed").length;
    const stopCount = verdicts.filter((v) => v === "stop").length;
    const cautionCount = verdicts.filter((v) => v === "caution").length;
    if (stopCount > 0 || cautionCount >= 3) {
      return "stop";
    }
    if (proceedCount >= 5) {
      return "strong_proceed";
    }
    if (proceedCount >= 4) {
      return "proceed";
    }
    if (cautionCount >= 3 || cautionCount + (6 - proceedCount - stopCount) >= 4) {
      return "caution";
    }
    return "mixed";
  }
  /**
   * Calculate overall score from all perspectives
   */
  calculateOverallScore(perspectives) {
    const weights = {
      white: 0.2,
      // Data matters
      red: 0.1,
      // Intuition matters less
      black: 0.25,
      // Caution is important
      yellow: 0.15,
      // Benefits considered
      green: 0.1,
      // Alternatives are nice to have
      blue: 0.2
      // Process matters
    };
    let weightedSum = 0;
    for (const [hat, perspective] of Object.entries(perspectives)) {
      weightedSum += perspective.score * weights[hat];
    }
    return Math.round(weightedSum);
  }
  /**
   * Generate final recommendation
   */
  generateRecommendation(perspectives, consensus) {
    const blackHat = perspectives.black;
    const yellowHat = perspectives.yellow;
    switch (consensus) {
      case "strong_proceed":
        return "All perspectives align: proceed with confidence.";
      case "proceed":
        return `Most perspectives favor proceeding. Yellow hat highlights: ${yellowHat.keyPoints[0] || "benefits exist"}.`;
      case "mixed":
        return `Mixed signals. Consider: ${blackHat.keyPoints[0] || "risks"} vs ${yellowHat.keyPoints[0] || "benefits"}.`;
      case "caution":
        return `Multiple cautions raised. Primary concern: ${blackHat.keyPoints[0] || "risk factors"}.`;
      case "stop":
        return `Stop recommended. Critical issue: ${blackHat.keyPoints[0] || "high risk detected"}.`;
    }
  }
};

export {
  DEFAULT_BOUNDARIES,
  DEFAULT_CONFIG,
  createConfig,
  loadConfigFromEnv,
  RiskClassifier,
  BoundaryChecker,
  DecisionRouter,
  PipelineStepSchema,
  PipelineSchema,
  PipelineRiskAssessmentSchema,
  PipelineRiskClassifier,
  HatTypeSchema,
  HatVerdictSchema,
  HatPerspectiveSchema,
  SixHatsConsensusSchema,
  SixHatsResultSchema,
  SixHatsEvaluator
};
//# sourceMappingURL=chunk-LO6AQCOL.js.map