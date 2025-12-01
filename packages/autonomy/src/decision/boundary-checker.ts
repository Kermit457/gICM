/**
 * Boundary Checker for Level 2 Autonomy
 *
 * Enforces operational limits:
 * - Daily limits (trades, content, builds, spending)
 * - Value thresholds
 * - Blocked keywords/topics
 * - Time restrictions
 */

import type {
  Action,
  Boundaries,
  BoundaryCheckResult,
  DailyUsage,
  RiskLevel,
} from "../core/types.js";
import { DEFAULT_BOUNDARIES } from "../core/config.js";
import { Logger } from "../utils/logger.js";

export class BoundaryChecker {
  private logger: Logger;
  private boundaries: Boundaries;
  private dailyUsage: Map<string, DailyUsage>;

  constructor(boundaries?: Partial<Boundaries>) {
    this.logger = new Logger("BoundaryChecker");
    this.boundaries = this.mergeBoundaries(boundaries);
    this.dailyUsage = new Map();
  }

  /**
   * Check if an action passes all boundaries
   */
  check(action: Action, riskLevel: RiskLevel): BoundaryCheckResult {
    const violations: string[] = [];
    const warnings: string[] = [];
    const today = this.getTodayKey();
    const usage = this.getOrCreateUsage(today);

    // Check by category
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

    // Check financial limits
    this.checkFinancialBoundaries(action, usage, violations, warnings);

    // Check time restrictions
    this.checkTimeBoundaries(action, violations, warnings);

    // Check risk level thresholds
    if (riskLevel === "critical") {
      violations.push("Critical risk level requires escalation");
    }

    const result: BoundaryCheckResult = {
      passed: violations.length === 0,
      violations,
      warnings,
      usageToday: usage,
    };

    if (!result.passed) {
      this.logger.warn(`Boundary check failed for ${action.type}`, {
        violations,
        warnings,
      });
    }

    return result;
  }

  /**
   * Check trading-specific boundaries
   */
  private checkTradingBoundaries(
    action: Action,
    usage: DailyUsage,
    violations: string[],
    warnings: string[]
  ): void {
    const trading = this.boundaries.trading;

    // Check daily trade limit
    if (usage.trades >= 10) {
      violations.push(`Daily trade limit (10) exceeded`);
    } else if (usage.trades >= 8) {
      warnings.push(`Approaching daily trade limit (${usage.trades}/10)`);
    }

    // Check allowed bots
    const botType = action.params.botType as string | undefined;
    if (botType && !trading.allowedBots.includes(botType)) {
      violations.push(`Bot type "${botType}" not in allowed list`);
    }

    // Check allowed tokens
    const token = action.params.token as string | undefined;
    if (token && !trading.allowedTokens.includes(token)) {
      if (trading.requireApprovalForNewTokens) {
        violations.push(`Token "${token}" requires approval for first trade`);
      } else {
        warnings.push(`Trading new token: ${token}`);
      }
    }

    // Check position size
    const positionPercent = action.params.positionPercent as number | undefined;
    if (positionPercent && positionPercent > trading.maxPositionPercent) {
      violations.push(
        `Position size ${positionPercent}% exceeds max ${trading.maxPositionPercent}%`
      );
    }

    // Check trade size
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
  private checkContentBoundaries(
    action: Action,
    usage: DailyUsage,
    violations: string[],
    warnings: string[]
  ): void {
    const content = this.boundaries.content;

    // Check daily content limit
    if (usage.content >= content.maxAutoPostsPerDay) {
      violations.push(
        `Daily content limit (${content.maxAutoPostsPerDay}) reached`
      );
    } else if (usage.content >= content.maxAutoPostsPerDay - 2) {
      warnings.push(
        `Approaching daily content limit (${usage.content}/${content.maxAutoPostsPerDay})`
      );
    }

    // Check for restricted topics
    const description = action.description.toLowerCase();
    const title = (action.params.title as string)?.toLowerCase() ?? "";
    const contentText = `${description} ${title}`;

    for (const topic of content.requireReviewForTopics) {
      if (contentText.includes(topic.toLowerCase())) {
        violations.push(`Content contains restricted topic: "${topic}"`);
      }
    }

    // Check for blog weekly limit
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
  private checkBuildBoundaries(
    action: Action,
    usage: DailyUsage,
    violations: string[],
    warnings: string[]
  ): void {
    const dev = this.boundaries.development;

    // Check daily build limit
    if (usage.builds >= 5) {
      violations.push("Daily build limit (5) reached");
    }

    // Check lines changed
    const linesChanged = action.metadata.linesChanged ?? 0;
    if (linesChanged > dev.maxAutoCommitLines) {
      violations.push(
        `Lines changed (${linesChanged}) exceeds auto-commit limit (${dev.maxAutoCommitLines})`
      );
    }

    // Check files changed
    const filesChanged = action.metadata.filesChanged ?? 0;
    if (filesChanged > dev.maxAutoFilesChanged) {
      violations.push(
        `Files changed (${filesChanged}) exceeds auto-commit limit (${dev.maxAutoFilesChanged})`
      );
    }

    // Check for restricted paths
    const paths = (action.params.paths as string[]) ?? [];
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
  private checkDeploymentBoundaries(
    action: Action,
    violations: string[],
    warnings: string[]
  ): void {
    const dev = this.boundaries.development;

    // Production deployment
    const target = action.params.target as string | undefined;
    if (target === "production" || action.type.includes("production")) {
      if (!dev.autoDeployToProduction) {
        violations.push("Production deployments require human approval");
      }
    }

    // Staging deployment
    if (target === "staging" || action.type.includes("staging")) {
      if (!dev.autoDeployToStaging) {
        warnings.push("Staging deployment flagged for review");
      }
    }
  }

  /**
   * Check financial boundaries
   */
  private checkFinancialBoundaries(
    action: Action,
    usage: DailyUsage,
    violations: string[],
    warnings: string[]
  ): void {
    const financial = this.boundaries.financial;
    const amount = action.metadata.estimatedValue ?? 0;

    // Check single expense limit
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

    // Check daily spending limit
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
  private checkTimeBoundaries(
    action: Action,
    violations: string[],
    warnings: string[]
  ): void {
    const time = this.boundaries.time;
    const hour = new Date().getUTCHours();

    // Check quiet hours
    const inQuietHours =
      hour >= time.quietHoursStart || hour < time.quietHoursEnd;
    if (inQuietHours) {
      if (action.metadata.urgency !== "critical") {
        warnings.push("Action during quiet hours - may be delayed");
      }
    }

    // Check active hours
    const inActiveHours =
      hour >= time.activeHoursStart && hour < time.activeHoursEnd;
    if (!inActiveHours && action.category === "content") {
      warnings.push("Content posting outside active hours");
    }
  }

  /**
   * Record usage after action execution
   */
  recordUsage(action: Action): void {
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

    // Track spending
    if (action.metadata.estimatedValue) {
      usage.spending += action.metadata.estimatedValue;
    }

    this.dailyUsage.set(today, usage);
    this.logger.debug(`Usage recorded for ${action.type}`, usage);
  }

  /**
   * Get current usage for today
   */
  getUsageToday(): DailyUsage {
    return this.getOrCreateUsage(this.getTodayKey());
  }

  /**
   * Get current boundaries
   */
  getBoundaries(): Boundaries {
    return { ...this.boundaries };
  }

  /**
   * Update boundaries at runtime
   */
  updateBoundaries(updates: Partial<Boundaries>): void {
    this.boundaries = this.mergeBoundaries(updates);
    this.logger.info("Boundaries updated");
  }

  /**
   * Reset daily usage (for testing or new day)
   */
  resetDailyUsage(): void {
    this.dailyUsage.clear();
    this.logger.info("Daily usage reset");
  }

  // Helper methods

  private getTodayKey(): string {
    return new Date().toISOString().split("T")[0];
  }

  private getOrCreateUsage(key: string): DailyUsage {
    if (!this.dailyUsage.has(key)) {
      this.dailyUsage.set(key, {
        trades: 0,
        content: 0,
        builds: 0,
        spending: 0,
      });
    }
    return this.dailyUsage.get(key)!;
  }

  private getWeeklyBlogCount(): number {
    // Simplified - count blogs in last 7 days
    // In production, this would query the audit log
    return 0;
  }

  private mergeBoundaries(overrides?: Partial<Boundaries>): Boundaries {
    if (!overrides) return DEFAULT_BOUNDARIES;

    return {
      financial: { ...DEFAULT_BOUNDARIES.financial, ...overrides.financial },
      content: { ...DEFAULT_BOUNDARIES.content, ...overrides.content },
      development: {
        ...DEFAULT_BOUNDARIES.development,
        ...overrides.development,
      },
      trading: { ...DEFAULT_BOUNDARIES.trading, ...overrides.trading },
      time: { ...DEFAULT_BOUNDARIES.time, ...overrides.time },
    };
  }
}
