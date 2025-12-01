/**
 * Risk Classifier for Level 2 Autonomy
 *
 * Scores actions 0-100 based on weighted risk factors:
 * - Financial value (35%)
 * - Reversibility (20%)
 * - Category base risk (15%)
 * - Urgency (15%)
 * - External visibility (15%)
 */

import type {
  Action,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  DecisionOutcome,
} from "../core/types.js";
import {
  RISK_FACTOR_WEIGHTS,
  RISK_SCORE_THRESHOLDS,
  CATEGORY_BASE_RISK,
  FINANCIAL_RISK_THRESHOLDS,
  RISK_LEVEL_OUTCOMES,
  SAFE_ACTION_TYPES,
  DANGEROUS_ACTION_TYPES,
} from "../core/constants.js";
import { Logger } from "../utils/logger.js";

export interface RiskClassifierConfig {
  /** Override category base risks */
  categoryRiskOverrides?: Partial<Record<string, number>>;
  /** Additional safe action types */
  additionalSafeActions?: string[];
}

export class RiskClassifier {
  private logger: Logger;
  private config: RiskClassifierConfig;

  constructor(config: RiskClassifierConfig = {}) {
    this.logger = new Logger("RiskClassifier");
    this.config = config;
  }

  /**
   * Classify risk level for an action
   */
  classify(action: Action): RiskAssessment {
    const factors = this.calculateFactors(action);
    const score = this.calculateTotalScore(factors);
    const level = this.scoreToLevel(score);
    const recommendation = this.getRecommendation(action, level);

    const assessment: RiskAssessment = {
      actionId: action.id,
      level,
      score: Math.round(score),
      factors,
      recommendation,
      constraints: this.getConstraints(action, level),
      timestamp: Date.now(),
    };

    this.logger.debug(`Risk assessed: ${action.type}`, {
      score: assessment.score,
      level: assessment.level,
      recommendation: assessment.recommendation,
    });

    return assessment;
  }

  /**
   * Calculate all risk factors for an action
   */
  private calculateFactors(action: Action): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // 1. Financial Value Factor
    factors.push(this.calculateFinancialFactor(action));

    // 2. Reversibility Factor
    factors.push(this.calculateReversibilityFactor(action));

    // 3. Category Risk Factor
    factors.push(this.calculateCategoryFactor(action));

    // 4. Urgency Factor
    factors.push(this.calculateUrgencyFactor(action));

    // 5. External Visibility Factor
    factors.push(this.calculateVisibilityFactor(action));

    return factors;
  }

  /**
   * Calculate financial risk factor
   */
  private calculateFinancialFactor(action: Action): RiskFactor {
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
      threshold: 70, // Above this is concerning
      exceeded,
      reason,
    };
  }

  /**
   * Calculate reversibility factor
   */
  private calculateReversibilityFactor(action: Action): RiskFactor {
    const reversible = action.metadata.reversible;
    const riskScore = reversible ? 10 : 80;

    return {
      name: "reversibility",
      weight: RISK_FACTOR_WEIGHTS.reversibility,
      value: riskScore,
      threshold: 50,
      exceeded: !reversible,
      reason: reversible
        ? "Action can be reversed if needed"
        : "Action is IRREVERSIBLE",
    };
  }

  /**
   * Calculate category base risk factor
   */
  private calculateCategoryFactor(action: Action): RiskFactor {
    const baseRisk =
      this.config.categoryRiskOverrides?.[action.category] ??
      CATEGORY_BASE_RISK[action.category] ??
      50;

    return {
      name: "categoryRisk",
      weight: RISK_FACTOR_WEIGHTS.categoryRisk,
      value: baseRisk,
      threshold: 60,
      exceeded: baseRisk >= 60,
      reason: `Category "${action.category}" has base risk ${baseRisk}`,
    };
  }

  /**
   * Calculate urgency factor
   */
  private calculateUrgencyFactor(action: Action): RiskFactor {
    const urgencyScores: Record<string, number> = {
      low: 10,
      normal: 30,
      high: 60,
      critical: 90,
    };

    const urgency = action.metadata.urgency;
    const riskScore = urgencyScores[urgency] ?? 30;

    return {
      name: "urgency",
      weight: RISK_FACTOR_WEIGHTS.urgency,
      value: riskScore,
      threshold: 60,
      exceeded: urgency === "critical",
      reason: `Urgency level: ${urgency}`,
    };
  }

  /**
   * Calculate external visibility factor
   */
  private calculateVisibilityFactor(action: Action): RiskFactor {
    // Actions that are public-facing have higher risk
    const publicActions = ["tweet", "blog", "post", "publish", "announce"];
    const isPublic = publicActions.some((p) => action.type.includes(p));

    const riskScore = isPublic ? 60 : 20;

    return {
      name: "externalVisibility",
      weight: RISK_FACTOR_WEIGHTS.externalVisibility,
      value: riskScore,
      threshold: 50,
      exceeded: isPublic,
      reason: isPublic
        ? "Action is publicly visible"
        : "Action is internal only",
    };
  }

  /**
   * Calculate total weighted score
   */
  private calculateTotalScore(factors: RiskFactor[]): number {
    return factors.reduce((sum, factor) => {
      return sum + factor.value * factor.weight;
    }, 0);
  }

  /**
   * Convert score to risk level
   */
  private scoreToLevel(score: number): RiskLevel {
    if (score <= RISK_SCORE_THRESHOLDS.safe) return "safe";
    if (score <= RISK_SCORE_THRESHOLDS.low) return "low";
    if (score <= RISK_SCORE_THRESHOLDS.medium) return "medium";
    if (score <= RISK_SCORE_THRESHOLDS.high) return "high";
    return "critical";
  }

  /**
   * Get recommendation based on action type and risk level
   */
  private getRecommendation(action: Action, level: RiskLevel): DecisionOutcome {
    // Check for explicitly safe actions
    const safeActions = [
      ...SAFE_ACTION_TYPES,
      ...(this.config.additionalSafeActions ?? []),
    ];
    if (safeActions.some((s) => action.type.includes(s))) {
      return "auto_execute";
    }

    // Check for explicitly dangerous actions
    if (DANGEROUS_ACTION_TYPES.some((d) => action.type.includes(d))) {
      return "escalate";
    }

    // Use level-based recommendation
    return RISK_LEVEL_OUTCOMES[level] as DecisionOutcome;
  }

  /**
   * Get constraints that apply to this action
   */
  private getConstraints(action: Action, level: RiskLevel): string[] {
    const constraints: string[] = [];

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
}
