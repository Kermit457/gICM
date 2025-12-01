// src/brain/goal-system.ts
import { z } from "zod";

// src/brain/goal-system.json
var goal_system_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  version: "1.0.0",
  description: "gICM Goal System - The soul of the autonomous platform",
  primeDirective: "Become the world's most advanced autonomous AI development platform",
  coreValues: [
    { name: "safety_first", priority: 1, description: "Never compromise user data, code quality, or ethical boundaries" },
    { name: "continuous_improvement", priority: 2, description: "Every action should make gICM better - 1% daily compounds to 37x yearly" },
    { name: "speed_of_iteration", priority: 3, description: "Done > Perfect. Ship, measure, improve. But never sacrifice safety for speed" },
    { name: "user_value", priority: 4, description: "Everything serves users - vibe coders, pro coders, enterprises" },
    { name: "transparency", priority: 5, description: "All activity logged, all decisions explainable, all code open source" },
    { name: "self_reliance", priority: 6, description: "Reduce dependencies on humans, external services, manual processes" }
  ],
  autonomyLevels: {
    current: 2,
    descriptions: {
      "1": "Manual - Human does everything",
      "2": "Assisted - AI suggests, human approves",
      "3": "Supervised - AI acts, human monitors",
      "4": "Autonomous - AI decides within guardrails",
      "5": "Self-Directed - AI sets own objectives",
      "6": "AGI-Ready - Full autonomy with safety guarantees"
    },
    targets: {
      "2025": 3,
      "2027": 6
    }
  },
  metrics: {
    daily: {
      discoveries_scanned: { target: 100, description: "More input = more opportunities" },
      high_value_discoveries: { target: 3, description: "Score > 70" },
      integrations_completed: { target: 1, description: "Continuous improvement" },
      code_quality_score: { target: 85, description: "No regressions allowed" },
      uptime_percent: { target: 99.9, description: "Reliability is trust" }
    },
    weekly: {
      new_components: { target: 5, description: "Growing capability" },
      improved_components: { target: 10, description: "Everything gets better" },
      user_requested_features: { target: 3, description: "Community-driven" },
      competitor_features_matched: { target: 2, description: "Stay competitive" },
      innovations: { target: 1, description: "Lead, don't follow" }
    },
    monthly: {
      major_capabilities: { target: 3, description: "Visible progress" },
      performance_improvement_percent: { target: 10, description: "Compounding gains" },
      autonomy_level_increase: { target: 0.5, description: "Toward AGI" },
      community_growth_percent: { target: 20, description: "Network effects" }
    },
    yearly_2025: {
      autonomy_level: { target: 3, description: "gICM acts, Mirko monitors" },
      total_components: { target: 500, description: "Comprehensive marketplace" },
      active_users: { target: 1e4, description: "Product-market fit" },
      self_funding: { target: true, description: "Revenue covers costs" },
      category_ranking: { target: 3, description: "Top 3 in AI dev tools" }
    }
  },
  decisionThresholds: {
    auto_approve_score: 85,
    manual_review_score: 70,
    auto_reject_score: 40,
    escalate_above_impact: 80,
    escalate_above_risk: 70
  },
  competitors: [
    { name: "cursor", category: "AI code editor" },
    { name: "replit", category: "Cloud IDE with AI" },
    { name: "v0.dev", category: "AI UI generation" },
    { name: "lovable", category: "AI app builder" },
    { name: "bolt.new", category: "AI full-stack" },
    { name: "github-copilot", category: "Code completion" },
    { name: "devin", category: "AI software engineer" }
  ],
  focusAreas: [
    "context_efficiency",
    "autonomous_agents",
    "solana_web3",
    "ui_components",
    "mcp_ecosystem"
  ],
  schedule: {
    timezone: "UTC",
    phases: {
      morning_scan: { start: "00:00", end: "04:00", description: "Hunt & discover" },
      decision_planning: { start: "04:00", end: "06:00", description: "Plan & decide" },
      execution: { start: "06:00", end: "20:00", description: "Build & execute" },
      reflection: { start: "20:00", end: "23:00", description: "Analyze & learn" },
      maintenance: { start: "23:00", end: "00:00", description: "Cleanup & prep" }
    },
    weekly: {
      monday: "Planning & Strategy",
      tuesday: "Building",
      wednesday: "Growth",
      thursday: "Quality",
      friday: "Finance & Metrics",
      saturday: "Innovation",
      sunday: "Rest & Reflection"
    }
  },
  treasury: {
    allocations: {
      trading: 0.4,
      operations: 0.3,
      growth: 0.2,
      reserve: 0.1
    },
    thresholds: {
      min_operating_balance_usd: 1e3,
      max_trading_allocation_percent: 50,
      rebalance_threshold_percent: 10,
      runway_months_minimum: 3
    },
    expenses_monthly: {
      claude_api: 200,
      helius_rpc: 50,
      birdeye_api: 100,
      vercel_hosting: 20,
      misc: 30
    }
  },
  trading: {
    default_mode: "paper",
    progression_rules: {
      paper_to_micro: {
        win_rate_min: 60,
        profitable_days_min: 30,
        requires_approval: true
      },
      micro_to_live: {
        win_rate_min: 65,
        profitable_months_min: 3,
        max_drawdown_percent: 10,
        requires_approval: true
      }
    },
    risk_limits: {
      max_position_percent: 10,
      stop_loss_percent: 5,
      daily_loss_limit_percent: 3,
      max_drawdown_percent: 15
    }
  }
};

// src/brain/goal-system.ts
var CoreValueSchema = z.object({
  name: z.string(),
  priority: z.number(),
  description: z.string()
});
var MetricTargetSchema = z.object({
  target: z.union([z.number(), z.boolean()]),
  description: z.string()
});
var CompetitorSchema = z.object({
  name: z.string(),
  category: z.string()
});
var PhaseSchema = z.object({
  start: z.string(),
  end: z.string(),
  description: z.string()
});
var GoalSystemSchema = z.object({
  version: z.string(),
  primeDirective: z.string(),
  coreValues: z.array(CoreValueSchema),
  autonomyLevels: z.object({
    current: z.number(),
    descriptions: z.record(z.string()),
    targets: z.record(z.number())
  }),
  metrics: z.object({
    daily: z.record(MetricTargetSchema),
    weekly: z.record(MetricTargetSchema),
    monthly: z.record(MetricTargetSchema),
    yearly_2025: z.record(MetricTargetSchema)
  }),
  decisionThresholds: z.object({
    auto_approve_score: z.number(),
    manual_review_score: z.number(),
    auto_reject_score: z.number(),
    escalate_above_impact: z.number(),
    escalate_above_risk: z.number()
  }),
  competitors: z.array(CompetitorSchema),
  focusAreas: z.array(z.string()),
  schedule: z.object({
    timezone: z.string(),
    phases: z.record(PhaseSchema),
    weekly: z.record(z.string())
  }),
  treasury: z.object({
    allocations: z.record(z.number()),
    thresholds: z.record(z.number()),
    expenses_monthly: z.record(z.number())
  }),
  trading: z.object({
    default_mode: z.enum(["paper", "micro", "live"]),
    progression_rules: z.record(z.object({
      win_rate_min: z.number().optional(),
      profitable_days_min: z.number().optional(),
      profitable_months_min: z.number().optional(),
      max_drawdown_percent: z.number().optional(),
      requires_approval: z.boolean()
    })),
    risk_limits: z.record(z.number())
  })
});
var GoalSystemManager = class {
  config;
  constructor() {
    this.config = GoalSystemSchema.parse(goal_system_default);
  }
  /**
   * Get the prime directive
   */
  getPrimeDirective() {
    return this.config.primeDirective;
  }
  /**
   * Get core values in priority order
   */
  getCoreValues() {
    return [...this.config.coreValues].sort((a, b) => a.priority - b.priority);
  }
  /**
   * Get current autonomy level
   */
  getCurrentAutonomyLevel() {
    return this.config.autonomyLevels.current;
  }
  /**
   * Get autonomy level description
   */
  getAutonomyDescription(level) {
    return this.config.autonomyLevels.descriptions[level.toString()] ?? "Unknown";
  }
  /**
   * Get daily metric targets
   */
  getDailyMetrics() {
    return this.config.metrics.daily;
  }
  /**
   * Get weekly metric targets
   */
  getWeeklyMetrics() {
    return this.config.metrics.weekly;
  }
  /**
   * Get decision thresholds
   */
  getDecisionThresholds() {
    return this.config.decisionThresholds;
  }
  /**
   * Evaluate a discovery score against thresholds
   */
  evaluateScore(score) {
    const thresholds = this.config.decisionThresholds;
    if (score >= thresholds.auto_approve_score) {
      return "auto_approve";
    } else if (score >= thresholds.manual_review_score) {
      return "manual_review";
    } else if (score < thresholds.auto_reject_score) {
      return "auto_reject";
    } else {
      return "defer";
    }
  }
  /**
   * Get competitors to monitor
   */
  getCompetitors() {
    return this.config.competitors;
  }
  /**
   * Get current schedule phase based on UTC time
   */
  getCurrentPhase() {
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    for (const [name, phase] of Object.entries(this.config.schedule.phases)) {
      const [startHour, startMinute] = phase.start.split(":").map(Number);
      const [endHour, endMinute] = phase.end.split(":").map(Number);
      const startTime = startHour * 60 + startMinute;
      let endTime = endHour * 60 + endMinute;
      if (endTime <= startTime) {
        endTime += 24 * 60;
        const adjustedCurrentTime = currentTime < startTime ? currentTime + 24 * 60 : currentTime;
        if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
          return { name, phase };
        }
      } else if (currentTime >= startTime && currentTime < endTime) {
        return { name, phase };
      }
    }
    return null;
  }
  /**
   * Get today's weekly focus
   */
  getTodayFocus() {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[(/* @__PURE__ */ new Date()).getUTCDay()];
    return this.config.schedule.weekly[today] ?? "General";
  }
  /**
   * Get treasury allocation config
   */
  getTreasuryAllocations() {
    return this.config.treasury.allocations;
  }
  /**
   * Get trading risk limits
   */
  getTradingRiskLimits() {
    return this.config.trading.risk_limits;
  }
  /**
   * Get trading mode
   */
  getDefaultTradingMode() {
    return this.config.trading.default_mode;
  }
  /**
   * Check if progression from current to next trading mode is allowed
   */
  canProgressTradingMode(fromMode, stats) {
    const toMode = fromMode === "paper" ? "micro" : "live";
    const ruleKey = `${fromMode}_to_${toMode}`;
    const rules = this.config.trading.progression_rules[ruleKey];
    if (!rules) {
      return { allowed: false, requiresApproval: false, reason: "No progression rules defined" };
    }
    if (rules.win_rate_min && stats.winRate < rules.win_rate_min) {
      return { allowed: false, requiresApproval: false, reason: `Win rate ${stats.winRate}% below minimum ${rules.win_rate_min}%` };
    }
    if (rules.profitable_days_min && (stats.profitableDays ?? 0) < rules.profitable_days_min) {
      return { allowed: false, requiresApproval: false, reason: `Profitable days ${stats.profitableDays ?? 0} below minimum ${rules.profitable_days_min}` };
    }
    if (rules.profitable_months_min && (stats.profitableMonths ?? 0) < rules.profitable_months_min) {
      return { allowed: false, requiresApproval: false, reason: `Profitable months ${stats.profitableMonths ?? 0} below minimum ${rules.profitable_months_min}` };
    }
    if (rules.max_drawdown_percent && (stats.maxDrawdown ?? 0) > rules.max_drawdown_percent) {
      return { allowed: false, requiresApproval: false, reason: `Max drawdown ${stats.maxDrawdown}% exceeds limit ${rules.max_drawdown_percent}%` };
    }
    return { allowed: true, requiresApproval: rules.requires_approval };
  }
  /**
   * Get the full config
   */
  getConfig() {
    return this.config;
  }
};
var goalSystem = new GoalSystemManager();

// src/brain/daily-cycle.ts
import { CronJob } from "cron";
var DailyCycleManager = class {
  config;
  goals;
  engines;
  jobs = /* @__PURE__ */ new Map();
  todayResults = [];
  isRunning = false;
  currentPhase = null;
  constructor(config) {
    this.config = {
      enabled: config?.enabled ?? true,
      dryRun: config?.dryRun ?? true,
      // Safe default
      notifyOnPhaseComplete: config?.notifyOnPhaseComplete ?? true,
      notifyOnError: config?.notifyOnError ?? true
    };
    this.goals = goalSystem;
    this.engines = {};
  }
  /**
   * Connect engines
   */
  connectEngines(engines) {
    this.engines = { ...this.engines, ...engines };
    this.log("brain", "Engines connected", Object.keys(engines).join(", "));
  }
  /**
   * Start the daily cycle
   */
  start() {
    if (this.isRunning) {
      this.log("brain", "Already running", "skipped");
      return;
    }
    this.log("brain", "Starting daily cycle", this.config.dryRun ? "DRY RUN MODE" : "LIVE MODE");
    const schedules = {
      morning_scan: "0 0 * * *",
      // 00:00 UTC
      decision_planning: "0 4 * * *",
      // 04:00 UTC
      execution: "0 6 * * *",
      // 06:00 UTC
      reflection: "0 20 * * *",
      // 20:00 UTC
      maintenance: "0 22 * * *"
      // 22:00 UTC
    };
    for (const [phase, cron] of Object.entries(schedules)) {
      const job = new CronJob(cron, async () => {
        await this.runPhase(phase);
      }, null, true, "UTC");
      this.jobs.set(phase, job);
    }
    this.isRunning = true;
    this.log("brain", "Daily cycle started", `${this.jobs.size} phases scheduled`);
    const currentPhase = this.goals.getCurrentPhase();
    if (currentPhase) {
      this.log("brain", `Currently in ${currentPhase.name} phase`, "running immediately");
      this.runPhase(currentPhase.name);
    }
  }
  /**
   * Stop the daily cycle
   */
  stop() {
    for (const [name, job] of this.jobs) {
      job.stop();
    }
    this.jobs.clear();
    this.isRunning = false;
    this.log("brain", "Daily cycle stopped");
  }
  /**
   * Run a specific phase
   */
  async runPhase(phase) {
    this.currentPhase = phase;
    const startedAt = Date.now();
    const actions = [];
    const errors = [];
    const metrics = {};
    this.log("brain", `Starting phase: ${phase}`);
    try {
      switch (phase) {
        case "morning_scan":
          await this.runMorningScan(actions, metrics, errors);
          break;
        case "decision_planning":
          await this.runDecisionPlanning(actions, metrics, errors);
          break;
        case "execution":
          await this.runExecution(actions, metrics, errors);
          break;
        case "reflection":
          await this.runReflection(actions, metrics, errors);
          break;
        case "maintenance":
          await this.runMaintenance(actions, metrics, errors);
          break;
      }
    } catch (error) {
      errors.push(`Phase error: ${error}`);
      this.log("brain", `Phase ${phase} error`, String(error));
    }
    const result = {
      phase,
      startedAt,
      completedAt: Date.now(),
      success: errors.length === 0,
      metrics,
      errors,
      actions
    };
    this.todayResults.push(result);
    this.currentPhase = null;
    this.log("brain", `Phase ${phase} complete`, `${actions.length} actions, ${errors.length} errors`);
    return result;
  }
  // ============================================================================
  // PHASE IMPLEMENTATIONS
  // ============================================================================
  /**
   * Morning Scan: Discovery, market analysis, opportunity identification
   */
  async runMorningScan(actions, metrics, errors) {
    if (this.engines.hunter) {
      try {
        this.log("brain", "Running hunter alpha scan...");
        const discoveries = await this.engines.hunter.runHunt();
        metrics.hunterDiscoveries = discoveries.length;
        actions.push(this.action("brain", "runHunterScan", "success", `Found ${discoveries.length} discoveries`));
        const signalBatch = this.engines.hunter.processSignals(discoveries);
        metrics.totalSignals = signalBatch.signals.length;
        actions.push(this.action("brain", "processSignals", "success", `${signalBatch.signals.length} signals generated`));
        const actionable = this.engines.hunter.getActionableSignals();
        metrics.actionableSignals = actionable.length;
        actions.push(this.action("brain", "filterActionable", "success", `${actionable.length} actionable signals`));
        actionable.slice(0, 5).forEach((signal) => {
          this.log("brain", `[${signal.type}] ${signal.title.slice(0, 50)}...`, `Confidence: ${signal.confidence}%`);
        });
        if (actionable.length > 0 && this.engines.trading?.sendSignals) {
          try {
            const result = await this.engines.trading.sendSignals(actionable);
            metrics.signalsQueued = result.queued;
            metrics.signalsRejected = result.rejected;
            actions.push(this.action("brain", "sendSignals", "success", `${result.queued} queued, ${result.rejected} rejected`));
          } catch (e) {
            errors.push(`Failed to send signals: ${e}`);
            actions.push(this.action("brain", "sendSignals", "failed", String(e)));
          }
        }
      } catch (e) {
        errors.push(`Hunter scan failed: ${e}`);
        actions.push(this.action("brain", "runHunterScan", "failed", String(e)));
      }
    }
    if (this.engines.product) {
      try {
        const opportunities = await this.engines.product.runDiscovery();
        metrics.productDiscoveries = opportunities.length;
        actions.push(this.action("product", "runDiscovery", "success", `Found ${opportunities.length} opportunities`));
        opportunities.slice(0, 5).forEach((opp) => {
          this.log("product", `Discovery: ${opp.title}`, `Score: ${opp.score}`);
        });
      } catch (e) {
        errors.push(`Product discovery failed: ${e}`);
        actions.push(this.action("product", "runDiscovery", "failed", String(e)));
      }
    }
    if (this.engines.money) {
      try {
        const treasury = await this.engines.money.getTreasuryStatus();
        metrics.treasuryUsd = treasury.totalUsd;
        actions.push(this.action("money", "getTreasuryStatus", "success", `$${treasury.totalUsd} | ${treasury.runway}`));
        const expenses = await this.engines.money.getUpcomingExpenses();
        metrics.upcomingExpenses = expenses.length;
        actions.push(this.action("money", "getUpcomingExpenses", "success", `${expenses.length} upcoming`));
      } catch (e) {
        errors.push(`Treasury check failed: ${e}`);
        actions.push(this.action("money", "getTreasuryStatus", "failed", String(e)));
      }
    }
    if (this.engines.trading) {
      try {
        const status = await this.engines.trading.getStatus();
        metrics.tradingPositions = status.positions;
        metrics.tradingPnl = status.pnlToday;
        actions.push(this.action("money", "getTradingStatus", "success", `${status.positions} positions, $${status.pnlToday} PnL`));
      } catch (e) {
        errors.push(`Trading status check failed: ${e}`);
        actions.push(this.action("money", "getTradingStatus", "failed", String(e)));
      }
    }
  }
  /**
   * Decision Planning: Prioritize tasks, plan executions
   */
  async runDecisionPlanning(actions, metrics, errors) {
    const thresholds = this.goals.getDecisionThresholds();
    const todayFocus = this.goals.getTodayFocus();
    this.log("brain", `Today's focus: ${todayFocus}`);
    actions.push(this.action("brain", "setFocus", "success", todayFocus));
    if (this.engines.product) {
      try {
        const backlog = await this.engines.product.getBacklog();
        const pending = backlog.filter((b) => b.status === "evaluated");
        metrics.backlogPending = pending.length;
        let approved = 0;
        let rejected = 0;
        if (this.config.dryRun) {
          this.log("brain", `[DRY RUN] Would process ${pending.length} backlog items`);
        }
        metrics.autoApproved = approved;
        metrics.autoRejected = rejected;
        actions.push(this.action("brain", "evaluateBacklog", "success", `${pending.length} pending items`));
      } catch (e) {
        errors.push(`Backlog evaluation failed: ${e}`);
        actions.push(this.action("brain", "evaluateBacklog", "failed", String(e)));
      }
    }
    const dailyMetrics = this.goals.getDailyMetrics();
    if (dailyMetrics.content_pieces) {
      const target = dailyMetrics.content_pieces.target;
      metrics.contentTarget = target;
      actions.push(this.action("brain", "planContent", "success", `Target: ${target} pieces`));
    }
  }
  /**
   * Execution: Trading, content creation, building
   */
  async runExecution(actions, metrics, errors) {
    if (this.engines.growth) {
      try {
        if (this.config.dryRun) {
          this.log("growth", "[DRY RUN] Would generate and schedule content");
          actions.push(this.action("growth", "generateContent", "skipped", "Dry run mode"));
        } else {
          const content = await this.engines.growth.generateContent("educational");
          await this.engines.growth.schedulePost({ title: content.title, body: "" }, "twitter");
          metrics.contentGenerated = 1;
          actions.push(this.action("growth", "generateContent", "success", content.title));
        }
      } catch (e) {
        errors.push(`Content generation failed: ${e}`);
        actions.push(this.action("growth", "generateContent", "failed", String(e)));
      }
    }
    if (this.engines.product) {
      try {
        if (this.config.dryRun) {
          this.log("product", "[DRY RUN] Would process next build");
          actions.push(this.action("product", "processNextBuild", "skipped", "Dry run mode"));
        } else {
          const build = await this.engines.product.processNextBuild();
          if (build) {
            metrics.buildsProcessed = 1;
            actions.push(this.action("product", "processNextBuild", "success", build.id));
          } else {
            actions.push(this.action("product", "processNextBuild", "skipped", "No builds in queue"));
          }
        }
      } catch (e) {
        errors.push(`Build processing failed: ${e}`);
        actions.push(this.action("product", "processNextBuild", "failed", String(e)));
      }
    }
    if (this.engines.trading) {
      try {
        const status = await this.engines.trading.getStatus();
        metrics.tradingMode = status.mode === "paper" ? 0 : status.mode === "micro" ? 1 : 2;
        actions.push(this.action("money", "monitorTrading", "success", `Mode: ${status.mode}`));
      } catch (e) {
        actions.push(this.action("money", "monitorTrading", "failed", String(e)));
      }
    }
  }
  /**
   * Reflection: Review performance, calculate metrics
   */
  async runReflection(actions, metrics, errors) {
    const todayActions = this.todayResults.flatMap((r) => r.actions);
    const successCount = todayActions.filter((a) => a.result === "success").length;
    const failedCount = todayActions.filter((a) => a.result === "failed").length;
    metrics.totalActions = todayActions.length;
    metrics.successRate = todayActions.length > 0 ? Math.round(successCount / todayActions.length * 100) : 0;
    metrics.failedActions = failedCount;
    this.log("brain", `Daily stats: ${successCount}/${todayActions.length} successful (${metrics.successRate}%)`);
    actions.push(this.action("brain", "aggregateStats", "success", `${metrics.successRate}% success rate`));
    const dailyMetrics = this.goals.getDailyMetrics();
    const progress = [];
    for (const [key, target] of Object.entries(dailyMetrics)) {
      const value = this.todayResults.reduce((sum, r) => sum + (r.metrics[key] ?? 0), 0);
      const targetValue = target.target;
      const percent = Math.round(value / targetValue * 100);
      progress.push(`${key}: ${value}/${targetValue} (${percent}%)`);
    }
    this.log("brain", "Goal progress", progress.join(", "));
    actions.push(this.action("brain", "checkGoalProgress", "success", `${progress.length} metrics tracked`));
    if (this.engines.trading) {
      try {
        const status = await this.engines.trading.getStatus();
        metrics.dailyPnl = status.pnlToday;
        this.log("money", `Daily PnL: $${status.pnlToday}`);
        actions.push(this.action("money", "recordPnl", "success", `$${status.pnlToday}`));
      } catch (e) {
        errors.push(`Trading reflection failed: ${e}`);
      }
    }
  }
  /**
   * Maintenance: Cleanup, prepare for next day
   */
  async runMaintenance(actions, metrics, errors) {
    const summary = {
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      phases: this.todayResults.length,
      totalActions: this.todayResults.reduce((sum, r) => sum + r.actions.length, 0),
      totalErrors: this.todayResults.reduce((sum, r) => sum + r.errors.length, 0)
    };
    this.log("brain", `Day summary: ${summary.totalActions} actions, ${summary.totalErrors} errors`);
    actions.push(this.action("brain", "archiveResults", "success", JSON.stringify(summary)));
    this.todayResults = [];
    metrics.resetComplete = 1;
    actions.push(this.action("brain", "resetForTomorrow", "success"));
    if (this.engines.money) {
      try {
        const treasury = await this.engines.money.getTreasuryStatus();
        this.log("money", `Treasury runway: ${treasury.runway}`);
        actions.push(this.action("money", "checkRunway", "success", treasury.runway));
      } catch (e) {
        errors.push(`Treasury check failed: ${e}`);
      }
    }
  }
  // ============================================================================
  // HELPERS
  // ============================================================================
  log(engine, message, details) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const prefix = `[${timestamp}] [${engine.toUpperCase()}]`;
    console.log(`${prefix} ${message}${details ? ` - ${details}` : ""}`);
  }
  action(engine, action, result, details) {
    return {
      timestamp: Date.now(),
      engine,
      action,
      result,
      details
    };
  }
  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentPhase: this.currentPhase,
      dryRun: this.config.dryRun,
      todayPhases: this.todayResults.length,
      todayActions: this.todayResults.reduce((sum, r) => sum + r.actions.length, 0),
      todayErrors: this.todayResults.reduce((sum, r) => sum + r.errors.length, 0),
      connectedEngines: Object.keys(this.engines)
    };
  }
  /**
   * Get today's results
   */
  getTodayResults() {
    return this.todayResults;
  }
  /**
   * Manually trigger a phase (for testing)
   */
  async triggerPhase(phase) {
    return this.runPhase(phase);
  }
};
var dailyCycle = new DailyCycleManager();

// src/brain/gicm-brain.ts
import { GrowthEngine } from "@gicm/growth-engine";
import { ProductEngine } from "@gicm/product-engine";

// src/brain/adapters/growth-adapter.ts
function createGrowthAdapter(engine) {
  return {
    generateContent: async (type) => {
      try {
        const contentType = type === "blog" ? "blog" : type === "thread" ? "thread" : "tweet";
        await engine.generateNow(contentType);
        const status = engine.getStatus();
        if (type === "blog" && status.upcomingContent.blogPosts.length > 0) {
          const latest = status.upcomingContent.blogPosts[status.upcomingContent.blogPosts.length - 1];
          return { id: latest.id || `blog-${Date.now()}`, title: latest.title };
        }
        if ((type === "tweet" || type === "thread") && status.upcomingContent.tweets.length > 0) {
          const latest = status.upcomingContent.tweets[status.upcomingContent.tweets.length - 1];
          return { id: latest.id || `tweet-${Date.now()}`, title: latest.text?.slice(0, 50) + "..." || "Tweet" };
        }
        return {
          id: `content-${Date.now()}`,
          title: `Generated ${type} content`
        };
      } catch (error) {
        console.warn(`[GROWTH-ADAPTER] Content generation failed: ${error}`);
        return {
          id: `error-${Date.now()}`,
          title: `[Failed] ${type} generation`
        };
      }
    },
    schedulePost: async (content, platform) => {
      try {
        if (platform === "discord") {
          await engine.announceUpdate("content", [content.title]);
        } else {
          console.log(`[GROWTH-ADAPTER] Would schedule "${content.title}" to ${platform}`);
        }
      } catch (error) {
        console.warn(`[GROWTH-ADAPTER] Schedule post failed: ${error}`);
      }
    }
  };
}

// src/brain/adapters/product-adapter.ts
function createProductAdapter(engine) {
  return {
    runDiscovery: async () => {
      try {
        const opportunities = await engine.runDiscovery();
        return opportunities.map((opp) => ({
          id: opp.id,
          title: opp.title,
          score: opp.scores?.overall || 0
        }));
      } catch (error) {
        console.warn(`[PRODUCT-ADAPTER] Discovery failed: ${error}`);
        return [];
      }
    },
    getBacklog: async () => {
      try {
        const backlog = engine.getBacklog();
        return backlog.map((item) => ({
          id: item.id,
          status: item.status
        }));
      } catch (error) {
        console.warn(`[PRODUCT-ADAPTER] Backlog fetch failed: ${error}`);
        return [];
      }
    },
    processNextBuild: async () => {
      try {
        const task = await engine.processNextBuild();
        if (!task) return null;
        return {
          id: task.id,
          status: task.status
        };
      } catch (error) {
        console.warn(`[PRODUCT-ADAPTER] Build processing failed: ${error}`);
        return null;
      }
    }
  };
}

// src/brain/adapters/hunter-adapter.ts
import { HunterAgent } from "@gicm/hunter-agent";

// src/brain/signal-processor.ts
var SignalProcessor = class {
  processedIds = /* @__PURE__ */ new Set();
  /**
   * Process a batch of discoveries into trading signals
   */
  processBatch(discoveries) {
    const signals = [];
    const byType = {};
    const byAction = {};
    for (const discovery of discoveries) {
      if (this.processedIds.has(discovery.fingerprint)) continue;
      this.processedIds.add(discovery.fingerprint);
      const signal = this.processDiscovery(discovery);
      if (signal) {
        signals.push(signal);
        byType[signal.type] = (byType[signal.type] || 0) + 1;
        byAction[signal.action] = (byAction[signal.action] || 0) + 1;
      }
    }
    signals.sort((a, b) => {
      const urgencyOrder = { immediate: 0, today: 1, week: 2, monitor: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.confidence - a.confidence;
    });
    return {
      processedAt: /* @__PURE__ */ new Date(),
      totalDiscoveries: discoveries.length,
      signals,
      byType,
      byAction
    };
  }
  /**
   * Process a single discovery into a trading signal
   */
  processDiscovery(discovery) {
    const source = discovery.source;
    const metadata = discovery.rawMetadata ?? {};
    switch (source) {
      case "geckoterminal":
        return this.processGeckoTerminal(discovery, metadata);
      case "binance":
        return this.processBinance(discovery, metadata);
      case "defillama":
        return this.processDeFiLlama(discovery, metadata);
      case "feargreed":
        return this.processFearGreed(discovery, metadata);
      case "sec":
        return this.processSEC(discovery, metadata);
      case "finnhub":
        return this.processFinnhub(discovery, metadata);
      case "npm":
        return this.processNPM(discovery, metadata);
      case "github":
      case "hackernews":
      case "twitter":
      case "reddit":
        return this.processSocial(discovery, metadata);
      default:
        return null;
    }
  }
  // ============================================================================
  // SOURCE-SPECIFIC PROCESSORS
  // ============================================================================
  processGeckoTerminal(d, meta) {
    const pool = meta;
    const priceChange = pool.priceChangePercent ?? 0;
    const liquidity = pool.liquidity ?? 0;
    const isNewPool = d.title.includes("[NEW]");
    let action = "watch";
    let confidence = 30;
    let urgency = "week";
    const riskFactors = [];
    if (isNewPool && liquidity > 5e4) {
      action = "watch";
      confidence = 50;
      urgency = "today";
      riskFactors.push("New pool - higher risk");
    }
    if (priceChange > 50 && liquidity > 1e5) {
      confidence = 60;
      urgency = "today";
      riskFactors.push("High volatility");
    }
    if (liquidity < 1e4) {
      riskFactors.push("Low liquidity - high slippage risk");
    }
    return {
      id: `signal-${d.fingerprint}`,
      type: isNewPool ? "new_pool" : "price_move",
      source: "geckoterminal",
      timestamp: /* @__PURE__ */ new Date(),
      token: pool.baseToken,
      chain: pool.network ?? "solana",
      contractAddress: pool.poolAddress,
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isNewPool ? `New pool detected with $${(liquidity / 1e3).toFixed(1)}K liquidity` : `Price moved ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}%`,
      metrics: {
        priceChange,
        volume: pool.volume24h,
        tvl: liquidity
      },
      risk: liquidity < 1e4 ? "extreme" : liquidity < 5e4 ? "high" : "medium",
      riskFactors,
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags
    };
  }
  processBinance(d, meta) {
    const ticker = meta;
    const priceChange = parseFloat(ticker.priceChangePercent ?? "0");
    const volume = parseFloat(ticker.quoteVolume ?? "0");
    const isVolumeAnomaly = ticker.type === "volume_anomaly";
    let action = "watch";
    let confidence = 40;
    let urgency = "today";
    if (Math.abs(priceChange) > 10 && volume > 1e8) {
      action = priceChange > 0 ? "watch" : "watch";
      confidence = 65;
      urgency = "today";
    }
    return {
      id: `signal-${d.fingerprint}`,
      type: isVolumeAnomaly ? "volume_spike" : "price_move",
      source: "binance",
      timestamp: /* @__PURE__ */ new Date(),
      token: ticker.symbol?.replace("USDT", ""),
      chain: "multi",
      // CEX token, multiple chains
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isVolumeAnomaly ? `Unusual volume: $${(volume / 1e6).toFixed(1)}M in 24h` : `CEX price moved ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}%`,
      metrics: {
        priceChange,
        volume
      },
      risk: Math.abs(priceChange) > 20 ? "high" : "medium",
      riskFactors: Math.abs(priceChange) > 20 ? ["High volatility"] : [],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags
    };
  }
  processDeFiLlama(d, meta) {
    const protocol = meta;
    const tvlChange = protocol.tvlChange24h ?? 0;
    const tvl = protocol.tvl ?? 0;
    const apy = protocol.apy ?? 0;
    const isYield = d.title.includes("[YIELD]");
    let action = "watch";
    let confidence = 35;
    let urgency = "week";
    const riskFactors = [];
    if (isYield && apy > 20 && tvl > 1e6) {
      action = "watch";
      confidence = 55;
      urgency = "today";
      if (apy > 100) riskFactors.push("Very high APY - potential risk");
    }
    if (tvlChange > 10 && tvl > 1e7) {
      confidence = 60;
      urgency = "today";
    }
    return {
      id: `signal-${d.fingerprint}`,
      type: isYield ? "yield_opportunity" : "tvl_change",
      source: "defillama",
      timestamp: /* @__PURE__ */ new Date(),
      chain: protocol.chain ?? "multi",
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isYield ? `${apy.toFixed(1)}% APY on $${(tvl / 1e6).toFixed(1)}M TVL` : `TVL changed ${tvlChange > 0 ? "+" : ""}${tvlChange.toFixed(1)}%`,
      metrics: {
        tvl,
        priceChange: tvlChange
      },
      risk: apy > 100 ? "high" : tvl < 1e6 ? "high" : "medium",
      riskFactors,
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags
    };
  }
  processFearGreed(d, meta) {
    const fg = meta;
    const value = fg.value ?? 50;
    const isExtremeFear = value < 25;
    const isExtremeGreed = value > 75;
    let action = "watch";
    let confidence = 45;
    let urgency = "week";
    if (isExtremeFear) {
      action = "watch";
      confidence = 70;
      urgency = "today";
    } else if (isExtremeGreed) {
      action = "watch";
      confidence = 65;
      urgency = "today";
    }
    return {
      id: `signal-${d.fingerprint}`,
      type: "sentiment_extreme",
      source: "feargreed",
      timestamp: /* @__PURE__ */ new Date(),
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isExtremeFear ? `Extreme Fear (${value}) - contrarian buy signal` : isExtremeGreed ? `Extreme Greed (${value}) - contrarian sell signal` : `Neutral sentiment (${value})`,
      metrics: {
        sentiment: value
      },
      risk: "low",
      // Sentiment is supplementary info
      riskFactors: [],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags
    };
  }
  processSEC(d, meta) {
    const filing = meta;
    const isInsider = filing.form === "4";
    const isInstitutional = filing.form === "13F-HR";
    const isBuy = d.title.includes("BOUGHT") || d.title.includes("\u{1F7E2}");
    let action = "watch";
    let confidence = 50;
    let urgency = "today";
    if (isInsider && isBuy) {
      confidence = 65;
      urgency = "today";
    }
    if (isInstitutional) {
      confidence = 60;
      urgency = "week";
    }
    return {
      id: `signal-${d.fingerprint}`,
      type: "insider_trade",
      source: "sec",
      timestamp: /* @__PURE__ */ new Date(),
      token: filing.symbol,
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isInsider ? `Insider ${isBuy ? "buying" : "selling"} detected` : `Institutional filing: ${filing.form}`,
      metrics: {},
      risk: "low",
      // Public filings are reliable data
      riskFactors: isInstitutional ? ["13-F data is 45 days delayed"] : [],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags
    };
  }
  processFinnhub(d, meta) {
    const trade = meta;
    const isCongress = trade.type === "congress";
    const isBuy = d.title.includes("BOUGHT") || d.title.includes("\u{1F7E2}");
    let action = "watch";
    let confidence = 75;
    let urgency = "today";
    if (isCongress && isBuy) {
      confidence = 80;
      urgency = "today";
    }
    return {
      id: `signal-${d.fingerprint}`,
      type: "congress_trade",
      source: "finnhub",
      timestamp: /* @__PURE__ */ new Date(),
      token: trade.symbol,
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: `${trade.chamber ?? "Congress"} member ${isBuy ? "bought" : "sold"} ${trade.symbol}`,
      metrics: {},
      risk: "low",
      // Public data, historically alpha-generating
      riskFactors: ["Congress trades filed with delay"],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags
    };
  }
  processNPM(d, meta) {
    const pkg = meta;
    const trend = pkg.trend ?? 0;
    const isAI = pkg.category === "ai";
    const isCrypto = pkg.category === "crypto";
    let confidence = 30;
    let urgency = "week";
    if ((isAI || isCrypto) && trend > 20) {
      confidence = 45;
      urgency = "week";
    }
    return {
      id: `signal-${d.fingerprint}`,
      type: "tech_trend",
      source: "npm",
      timestamp: /* @__PURE__ */ new Date(),
      action: "watch",
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: `${pkg.category} package trending ${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`,
      metrics: {
        priceChange: trend
      },
      risk: "low",
      riskFactors: [],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags
    };
  }
  processSocial(d, meta) {
    const engagement = (d.metrics.likes ?? 0) + (d.metrics.comments ?? 0) + (d.metrics.reposts ?? 0);
    const isHighEngagement = engagement > 1e3;
    let confidence = 25;
    let urgency = "week";
    if (isHighEngagement && d.relevanceFactors.hasWeb3Keywords) {
      confidence = 40;
      urgency = "today";
    }
    return {
      id: `signal-${d.fingerprint}`,
      type: "social_buzz",
      source: d.source,
      timestamp: /* @__PURE__ */ new Date(),
      action: "watch",
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: `High engagement: ${engagement} interactions`,
      metrics: {
        engagement
      },
      risk: "medium",
      riskFactors: ["Social signals are noisy"],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags
    };
  }
  // ============================================================================
  // UTILITIES
  // ============================================================================
  /**
   * Get high-priority signals that should be acted on
   */
  getActionableSignals(batch) {
    return batch.signals.filter(
      (s) => s.confidence >= 60 && (s.urgency === "immediate" || s.urgency === "today")
    );
  }
  /**
   * Get signals by type
   */
  getSignalsByType(batch, type) {
    return batch.signals.filter((s) => s.type === type);
  }
  /**
   * Clear processed cache (for testing)
   */
  clearCache() {
    this.processedIds.clear();
  }
};
var signalProcessor = new SignalProcessor();

// src/brain/adapters/hunter-adapter.ts
var FREE_SOURCES = [
  "hackernews",
  "lobsters",
  "arxiv",
  "devto",
  "defillama",
  "geckoterminal",
  "feargreed",
  "binance",
  "sec",
  "npm"
];
var HunterAdapter = class {
  agent = null;
  processor;
  config;
  discoveries = [];
  lastSignalBatch = null;
  lastHuntTime = null;
  constructor(config) {
    this.config = config ?? {};
    this.processor = new SignalProcessor();
  }
  /**
   * Initialize the hunter agent
   */
  async initialize() {
    const sources = this.buildSourceConfigs();
    this.agent = new HunterAgent({
      name: "gicm-hunter",
      sources,
      deduplicationTTL: 24 * 60 * 60 * 1e3,
      // 24 hours
      onDiscovery: async (discoveries) => {
        this.discoveries.push(...discoveries);
        console.log(`[HUNTER] Received ${discoveries.length} new discoveries`);
      }
    });
    console.log(`[HUNTER] Initialized with ${sources.length} sources`);
  }
  /**
   * Build source configurations based on available API keys
   */
  buildSourceConfigs() {
    const configs = [];
    const enabledSources = this.config.enabledSources ?? FREE_SOURCES;
    for (const source of enabledSources) {
      const sourceConfig = {
        source,
        enabled: true
      };
      switch (source) {
        case "github":
          if (this.config.apiKeys?.github || process.env.GITHUB_TOKEN) {
            sourceConfig.apiKey = this.config.apiKeys?.github ?? process.env.GITHUB_TOKEN;
            configs.push(sourceConfig);
          }
          break;
        case "twitter":
        case "tiktok":
          if (this.config.apiKeys?.apify || process.env.APIFY_TOKEN) {
            sourceConfig.apiToken = this.config.apiKeys?.apify ?? process.env.APIFY_TOKEN;
            configs.push(sourceConfig);
          }
          break;
        case "fred":
          if (this.config.apiKeys?.fred || process.env.FRED_API_KEY) {
            sourceConfig.apiKey = this.config.apiKeys?.fred ?? process.env.FRED_API_KEY;
            configs.push(sourceConfig);
          }
          break;
        case "finnhub":
          if (this.config.apiKeys?.finnhub || process.env.FINNHUB_API_KEY) {
            sourceConfig.apiKey = this.config.apiKeys?.finnhub ?? process.env.FINNHUB_API_KEY;
            configs.push(sourceConfig);
          }
          break;
        default:
          configs.push(sourceConfig);
      }
    }
    return configs;
  }
  /**
   * Create engine connection for the brain
   */
  createConnection() {
    return {
      runHunt: async (sources) => this.runHunt(sources),
      getDiscoveries: () => this.discoveries,
      processSignals: (d) => this.processSignals(d),
      getActionableSignals: () => this.getActionableSignals(),
      getStatus: () => this.getStatus(),
      start: () => this.start(),
      stop: () => this.stop()
    };
  }
  /**
   * Run a hunt across all or specified sources
   */
  async runHunt(sources) {
    if (!this.agent) {
      throw new Error("Hunter not initialized. Call initialize() first.");
    }
    console.log(`[HUNTER] Starting hunt... sources: ${sources?.join(", ") ?? "all"}`);
    const startTime = Date.now();
    const newDiscoveries = await this.agent.huntNow(sources);
    this.discoveries.push(...newDiscoveries);
    this.lastHuntTime = /* @__PURE__ */ new Date();
    console.log(`[HUNTER] Hunt complete: ${newDiscoveries.length} discoveries in ${Date.now() - startTime}ms`);
    return newDiscoveries;
  }
  /**
   * Process discoveries into trading signals
   */
  processSignals(discoveries) {
    console.log(`[HUNTER] Processing ${discoveries.length} discoveries into signals...`);
    this.lastSignalBatch = this.processor.processBatch(discoveries);
    console.log(`[HUNTER] Generated ${this.lastSignalBatch.signals.length} signals`);
    console.log(`[HUNTER] Actionable: ${this.processor.getActionableSignals(this.lastSignalBatch).length}`);
    return this.lastSignalBatch;
  }
  /**
   * Get actionable signals from last batch
   */
  getActionableSignals() {
    if (!this.lastSignalBatch) return [];
    return this.processor.getActionableSignals(this.lastSignalBatch);
  }
  /**
   * Send signals to trading API
   */
  async sendSignalsToTrading(signals) {
    const apiUrl = this.config.tradingApiUrl ?? "http://localhost:4000";
    console.log(`[HUNTER] Sending ${signals.length} signals to trading API...`);
    try {
      const response = await fetch(`${apiUrl}/api/v1/signals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals })
      });
      if (!response.ok) {
        throw new Error(`Trading API error: ${response.status}`);
      }
      const result = await response.json();
      console.log(`[HUNTER] Signals sent: ${result.processed ?? 0} processed`);
    } catch (error) {
      console.error(`[HUNTER] Failed to send signals: ${error}`);
    }
  }
  /**
   * Get current status
   */
  getStatus() {
    const actionable = this.lastSignalBatch ? this.processor.getActionableSignals(this.lastSignalBatch).length : 0;
    return {
      isRunning: !!this.agent,
      enabledSources: this.buildSourceConfigs().map((s) => s.source),
      lastHunt: this.lastHuntTime,
      totalDiscoveries: this.discoveries.length,
      totalSignals: this.lastSignalBatch?.signals.length ?? 0,
      actionableSignals: actionable
    };
  }
  /**
   * Start the hunter agent (scheduled hunting)
   */
  async start() {
    if (!this.agent) {
      await this.initialize();
    }
    await this.agent.start();
    console.log("[HUNTER] Started scheduled hunting");
  }
  /**
   * Stop the hunter agent
   */
  async stop() {
    if (this.agent) {
      await this.agent.stop();
      console.log("[HUNTER] Stopped");
    }
  }
  /**
   * Full hunt and signal cycle
   */
  async runFullCycle(sources) {
    const discoveries = await this.runHunt(sources);
    const signals = this.processSignals(discoveries);
    const actionable = this.getActionableSignals();
    if (this.config.autoSendSignals && actionable.length > 0) {
      await this.sendSignalsToTrading(actionable);
    }
    return { discoveries, signals, actionable };
  }
};
function createHunterAdapter(config) {
  return new HunterAdapter(config);
}

// src/brain/adapters/autonomy-adapter.ts
import {
  AutonomySystem
} from "@gicm/autonomy";

// src/brain/gicm-brain.ts
var GicmBrain = class {
  config;
  cycle;
  engines = {};
  hunterAdapter;
  hub;
  // Optional integration hub
  constructor(config) {
    this.config = {
      dryRun: config?.dryRun ?? true,
      tradingApiUrl: config?.tradingApiUrl ?? "http://localhost:4000",
      enableDiscovery: config?.enableDiscovery ?? true,
      enableTrading: config?.enableTrading ?? true,
      enableGrowth: config?.enableGrowth ?? true,
      enableHunter: config?.enableHunter ?? true,
      hunterApiKeys: config?.hunterApiKeys
    };
    this.cycle = new DailyCycleManager({
      dryRun: this.config.dryRun,
      enabled: true
    });
  }
  /**
   * Initialize all engine connections
   */
  async initialize() {
    console.log("[BRAIN] Initializing gICM Brain...");
    console.log(`[BRAIN] Prime Directive: ${goalSystem.getPrimeDirective()}`);
    console.log(`[BRAIN] Autonomy Level: ${goalSystem.getCurrentAutonomyLevel()}`);
    console.log(`[BRAIN] Mode: ${this.config.dryRun ? "DRY RUN" : "LIVE"}`);
    await this.connectEngines();
    console.log("[BRAIN] Initialization complete");
  }
  /**
   * Connect all available engines
   */
  async connectEngines() {
    const connections = {};
    connections.money = this.createMoneyEngineConnection();
    console.log("[BRAIN] Money engine connected");
    if (this.config.enableGrowth) {
      connections.growth = this.createGrowthEngineConnection();
      console.log("[BRAIN] Growth engine connected");
    }
    if (this.config.enableDiscovery) {
      connections.product = this.createProductEngineConnection();
      console.log("[BRAIN] Product engine connected");
    }
    if (this.config.enableTrading) {
      connections.trading = this.createTradingConnection();
      console.log("[BRAIN] Trading engine connected");
    }
    if (this.config.enableHunter) {
      connections.hunter = await this.createHunterEngineConnection();
      console.log("[BRAIN] Hunter engine connected");
    }
    this.engines = connections;
    this.cycle.connectEngines(connections);
  }
  /**
   * Create money engine connection
   */
  createMoneyEngineConnection() {
    return {
      getTreasuryStatus: async () => {
        return {
          totalUsd: 0,
          runway: "Unknown - not connected to wallet"
        };
      },
      getUpcomingExpenses: async () => {
        return [
          { name: "Claude API", amount: 200, dueDate: Date.now() + 7 * 24 * 60 * 60 * 1e3 },
          { name: "Helius RPC", amount: 50, dueDate: Date.now() + 14 * 24 * 60 * 60 * 1e3 }
        ];
      }
    };
  }
  /**
   * Create growth engine connection
   */
  createGrowthEngineConnection() {
    try {
      const growthEngine = new GrowthEngine({
        blog: { postsPerWeek: 3, categories: ["tutorial", "guide"], targetWordCount: 1500 },
        twitter: { tweetsPerDay: 5, threadsPerWeek: 2, engagementEnabled: false },
        seo: { primaryKeywords: [], competitors: [], targetPositions: {} },
        discord: { serverId: "", announcementChannel: "", contentChannel: "" }
      });
      return createGrowthAdapter(growthEngine);
    } catch (error) {
      console.warn(`[BRAIN] Failed to create GrowthEngine: ${error}`);
      return {
        generateContent: async (type) => ({
          id: `mock-${Date.now()}`,
          title: `[Mock] ${type}`
        }),
        schedulePost: async () => {
        }
      };
    }
  }
  /**
   * Create product engine connection
   */
  createProductEngineConnection() {
    try {
      const productEngine = new ProductEngine({
        discovery: {
          enabled: false,
          // Manual discovery via daily cycle
          sources: ["competitor", "github", "hackernews"],
          intervalHours: 6
        },
        building: {
          autoBuild: false,
          autoApprove: false,
          outputDir: "packages"
        },
        quality: {
          minTestScore: 80,
          minReviewScore: 70,
          requireApproval: true
        },
        deployment: {
          autoDeploy: false,
          registry: "npm",
          notifications: true
        }
      });
      return createProductAdapter(productEngine);
    } catch (error) {
      console.warn(`[BRAIN] Failed to create ProductEngine: ${error}`);
      return {
        runDiscovery: async () => [],
        getBacklog: async () => [],
        processNextBuild: async () => null
      };
    }
  }
  /**
   * Create trading (AI Hedge Fund) connection
   */
  createTradingConnection() {
    const apiUrl = this.config.tradingApiUrl;
    return {
      getStatus: async () => {
        try {
          const response = await fetch(`${apiUrl}/api/v1/status`);
          if (!response.ok) throw new Error("API not available");
          const data = await response.json();
          return {
            mode: data.mode,
            positions: data.positions,
            pnlToday: data.pnlToday
          };
        } catch {
          return {
            mode: goalSystem.getDefaultTradingMode(),
            positions: 0,
            pnlToday: 0
          };
        }
      },
      runAnalysis: async (token) => {
        try {
          const response = await fetch(`${apiUrl}/api/v1/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, chain: "solana" })
          });
          if (!response.ok) throw new Error("Analysis failed");
          const data = await response.json();
          return {
            signal: data.final_decision?.action ?? "hold",
            confidence: data.final_decision?.confidence ?? 0
          };
        } catch {
          return { signal: "hold", confidence: 0 };
        }
      },
      sendSignals: async (signals) => {
        try {
          const response = await fetch(`${apiUrl}/api/v1/signals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signals })
          });
          if (!response.ok) throw new Error("Signal send failed");
          const data = await response.json();
          return {
            queued: data.queued ?? 0,
            rejected: data.rejected ?? 0
          };
        } catch {
          return { queued: 0, rejected: signals.length };
        }
      }
    };
  }
  /**
   * Create hunter engine connection
   */
  async createHunterEngineConnection() {
    try {
      this.hunterAdapter = createHunterAdapter({
        apiKeys: this.config.hunterApiKeys,
        tradingApiUrl: this.config.tradingApiUrl,
        autoSendSignals: false
        // We'll send manually via trading connection
      });
      await this.hunterAdapter.initialize();
      return this.hunterAdapter.createConnection();
    } catch (error) {
      console.warn(`[BRAIN] Failed to create HunterAdapter: ${error}`);
      return {
        runHunt: async () => [],
        getDiscoveries: () => [],
        processSignals: () => ({
          processedAt: /* @__PURE__ */ new Date(),
          totalDiscoveries: 0,
          signals: [],
          byType: {},
          byAction: {}
        }),
        getActionableSignals: () => [],
        getStatus: () => ({
          isRunning: false,
          enabledSources: [],
          lastHunt: null,
          totalDiscoveries: 0,
          totalSignals: 0,
          actionableSignals: 0
        }),
        start: async () => {
        },
        stop: async () => {
        }
      };
    }
  }
  /**
   * Start the autonomous cycle
   */
  start() {
    console.log("[BRAIN] Starting autonomous cycle...");
    this.cycle.start();
    this.hub?.engineStarted?.("orchestrator");
    setInterval(() => {
      this.hub?.heartbeat?.("orchestrator");
    }, 3e4);
  }
  /**
   * Stop the autonomous cycle
   */
  stop() {
    console.log("[BRAIN] Stopping autonomous cycle...");
    this.cycle.stop();
    this.hub?.engineStopped?.("orchestrator");
  }
  /**
   * Emit a brain event
   */
  emitEvent(type, payload) {
    this.hub?.getEventBus?.()?.emit?.("orchestrator", type, payload);
  }
  /**
   * Get current status
   */
  getStatus() {
    const cycleStatus = this.cycle.getStatus();
    const currentPhase = goalSystem.getCurrentPhase();
    const hunterStatus = this.engines.hunter?.getStatus();
    return {
      version: "1.0.0",
      primeDirective: goalSystem.getPrimeDirective(),
      autonomyLevel: goalSystem.getCurrentAutonomyLevel(),
      autonomyDescription: goalSystem.getAutonomyDescription(goalSystem.getCurrentAutonomyLevel()),
      currentPhase: currentPhase?.name ?? null,
      todayFocus: goalSystem.getTodayFocus(),
      isRunning: cycleStatus.isRunning,
      dryRun: cycleStatus.dryRun,
      engines: {
        money: !!this.engines.money,
        growth: !!this.engines.growth,
        product: !!this.engines.product,
        trading: !!this.engines.trading,
        hunter: !!this.engines.hunter
      },
      metrics: {
        todayPhases: cycleStatus.todayPhases,
        todayActions: cycleStatus.todayActions,
        todayErrors: cycleStatus.todayErrors
      },
      hunter: hunterStatus ? {
        enabledSources: hunterStatus.enabledSources,
        totalDiscoveries: hunterStatus.totalDiscoveries,
        totalSignals: hunterStatus.totalSignals,
        actionableSignals: hunterStatus.actionableSignals
      } : void 0
    };
  }
  /**
   * Manually trigger a phase (for testing)
   */
  async triggerPhase(phase) {
    return this.cycle.triggerPhase(phase);
  }
  /**
   * Get today's results
   */
  getTodayResults() {
    return this.cycle.getTodayResults();
  }
  /**
   * Get the goal system
   */
  getGoalSystem() {
    return goalSystem;
  }
};
function createGicmBrain(config) {
  return new GicmBrain(config);
}

export {
  GoalSystemManager,
  goalSystem,
  DailyCycleManager,
  dailyCycle,
  GicmBrain,
  createGicmBrain
};
//# sourceMappingURL=chunk-ZNQGZSKO.js.map