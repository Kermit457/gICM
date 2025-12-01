/**
 * Six Thinking Hats Evaluator for Autonomy Engine
 *
 * Provides multi-perspective analysis of actions using Edward de Bono's framework:
 * - White Hat: Facts, data, objective analysis
 * - Red Hat: Emotions, intuition, gut feelings
 * - Black Hat: Caution, risks, what could go wrong
 * - Yellow Hat: Benefits, optimism, advantages
 * - Green Hat: Creativity, alternatives, new ideas
 * - Blue Hat: Process, meta-thinking, next steps
 */

import { z } from "zod";
import type { Action, RiskAssessment } from "../core/types.js";
import { Logger } from "../utils/logger.js";

// ============================================================================
// SIX HATS TYPES
// ============================================================================

export const HatTypeSchema = z.enum([
  "white",  // Facts & Data
  "red",    // Emotions & Intuition
  "black",  // Caution & Risks
  "yellow", // Benefits & Optimism
  "green",  // Creativity & Alternatives
  "blue",   // Process & Meta
]);
export type HatType = z.infer<typeof HatTypeSchema>;

export const HatVerdictSchema = z.enum(["proceed", "caution", "stop", "review"]);
export type HatVerdict = z.infer<typeof HatVerdictSchema>;

export const HatPerspectiveSchema = z.object({
  hat: HatTypeSchema,
  verdict: HatVerdictSchema,
  analysis: z.string(),
  keyPoints: z.array(z.string()),
  score: z.number().min(0).max(100), // 100 = strongly proceed, 0 = strongly stop
});
export type HatPerspective = z.infer<typeof HatPerspectiveSchema>;

export const SixHatsConsensusSchema = z.enum([
  "strong_proceed",  // 5-6 hats say proceed
  "proceed",         // 4+ hats say proceed
  "mixed",           // Split decision
  "caution",         // 4+ hats say caution/review
  "stop",            // Any hat says stop or 3+ say caution
]);
export type SixHatsConsensus = z.infer<typeof SixHatsConsensusSchema>;

export const SixHatsResultSchema = z.object({
  actionId: z.string(),
  perspectives: z.object({
    white: HatPerspectiveSchema,
    red: HatPerspectiveSchema,
    black: HatPerspectiveSchema,
    yellow: HatPerspectiveSchema,
    green: HatPerspectiveSchema,
    blue: HatPerspectiveSchema,
  }),
  consensus: SixHatsConsensusSchema,
  overallScore: z.number().min(0).max(100),
  recommendation: z.string(),
  timestamp: z.number(),
});
export type SixHatsResult = z.infer<typeof SixHatsResultSchema>;

// ============================================================================
// SIX HATS EVALUATOR
// ============================================================================

export class SixHatsEvaluator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("SixHatsEvaluator");
  }

  /**
   * Evaluate an action using all six thinking hats
   */
  evaluate(action: Action, riskAssessment?: RiskAssessment): SixHatsResult {
    this.logger.debug(`Evaluating action with Six Hats: ${action.type}`);

    const perspectives = {
      white: this.evaluateWhiteHat(action, riskAssessment),
      red: this.evaluateRedHat(action, riskAssessment),
      black: this.evaluateBlackHat(action, riskAssessment),
      yellow: this.evaluateYellowHat(action, riskAssessment),
      green: this.evaluateGreenHat(action, riskAssessment),
      blue: this.evaluateBlueHat(action, riskAssessment),
    };

    const consensus = this.determineConsensus(perspectives);
    const overallScore = this.calculateOverallScore(perspectives);
    const recommendation = this.generateRecommendation(perspectives, consensus);

    const result: SixHatsResult = {
      actionId: action.id,
      perspectives,
      consensus,
      overallScore,
      recommendation,
      timestamp: Date.now(),
    };

    this.logger.info(`Six Hats analysis complete`, {
      actionType: action.type,
      consensus,
      score: overallScore,
    });

    return result;
  }

  /**
   * White Hat: Facts, data, objective analysis
   * Focus: What information do we have? What do we need?
   */
  private evaluateWhiteHat(
    action: Action,
    assessment?: RiskAssessment
  ): HatPerspective {
    const keyPoints: string[] = [];
    let score = 50;

    // Analyze available data
    keyPoints.push(`Action type: ${action.type}`);
    keyPoints.push(`Category: ${action.category}`);
    keyPoints.push(`Engine: ${action.engine}`);

    if (action.metadata.estimatedValue !== undefined) {
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
      score,
    };
  }

  /**
   * Red Hat: Emotions, intuition, gut feelings
   * Focus: How does this feel? What's the instinct?
   */
  private evaluateRedHat(
    action: Action,
    assessment?: RiskAssessment
  ): HatPerspective {
    const keyPoints: string[] = [];
    let score = 50;

    // Urgency creates pressure
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

    // Category intuition
    if (action.category === "trading") {
      keyPoints.push("Trading feels risky - market volatility");
      score -= 10;
    } else if (action.category === "content") {
      keyPoints.push("Content creation feels relatively safe");
      score += 10;
    }

    // Risk level intuition
    if (assessment?.level === "critical" || assessment?.level === "high") {
      keyPoints.push("Gut says: this needs human oversight");
      score -= 25;
    } else if (assessment?.level === "safe") {
      keyPoints.push("Feels like a routine operation");
      score += 20;
    }

    // Irreversibility concern
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
      score,
    };
  }

  /**
   * Black Hat: Caution, risks, what could go wrong
   * Focus: Identify dangers, weaknesses, threats
   */
  private evaluateBlackHat(
    action: Action,
    assessment?: RiskAssessment
  ): HatPerspective {
    const keyPoints: string[] = [];
    let score = 70; // Start cautiously optimistic

    // Check risk factors
    if (assessment) {
      for (const factor of assessment.factors) {
        if (factor.exceeded) {
          keyPoints.push(`Risk: ${factor.reason}`);
          score -= 15;
        }
      }

      // Risk level impact
      if (assessment.level === "critical") {
        keyPoints.push("CRITICAL: Multiple failure modes possible");
        score -= 30;
      } else if (assessment.level === "high") {
        keyPoints.push("HIGH RISK: Significant potential for issues");
        score -= 20;
      }
    }

    // Check for dangerous patterns
    if (action.metadata.estimatedValue && action.metadata.estimatedValue > 100) {
      keyPoints.push("Danger: High-value operation");
      score -= 15;
    }

    if (!action.metadata.reversible) {
      keyPoints.push("Danger: No rollback option");
      score -= 20;
    }

    // Category-specific dangers
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
      score,
    };
  }

  /**
   * Yellow Hat: Benefits, optimism, advantages
   * Focus: What are the potential gains?
   */
  private evaluateYellowHat(
    action: Action,
    _assessment?: RiskAssessment
  ): HatPerspective {
    const keyPoints: string[] = [];
    let score = 50;

    // Positive outcomes by category
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

    // Low value = low-stakes experimentation
    if (action.metadata.estimatedValue !== undefined && action.metadata.estimatedValue < 20) {
      keyPoints.push("Benefit: Low-stakes action for learning");
      score += 15;
    }

    // Reversible = safe to try
    if (action.metadata.reversible) {
      keyPoints.push("Benefit: Can be undone if needed");
      score += 15;
    }

    // Automation benefit
    keyPoints.push("Benefit: Autonomous execution saves time");
    score += 10;

    score = Math.max(0, Math.min(100, score));

    return {
      hat: "yellow",
      verdict: score >= 60 ? "proceed" : "caution",
      analysis: "Optimistic view of potential benefits and positive outcomes",
      keyPoints,
      score,
    };
  }

  /**
   * Green Hat: Creativity, alternatives, new ideas
   * Focus: What other approaches could work?
   */
  private evaluateGreenHat(
    action: Action,
    assessment?: RiskAssessment
  ): HatPerspective {
    const keyPoints: string[] = [];
    let score = 60;

    // Suggest alternatives based on risk
    if (assessment?.level === "high" || assessment?.level === "critical") {
      keyPoints.push("Alternative: Break into smaller, lower-risk steps");
      keyPoints.push("Alternative: Add manual checkpoint before execution");
      score -= 10;
    }

    // Category-specific alternatives
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

    // General creative suggestions
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
      score,
    };
  }

  /**
   * Blue Hat: Process, meta-thinking, next steps
   * Focus: What's the overall process recommendation?
   */
  private evaluateBlueHat(
    action: Action,
    assessment?: RiskAssessment
  ): HatPerspective {
    const keyPoints: string[] = [];
    let score = 60;

    // Process recommendations based on risk
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

    // Audit trail recommendation
    keyPoints.push("Process: Log all actions for audit trail");

    // Category-specific process
    if (action.category === "trading") {
      keyPoints.push("Process: Verify trading limits before execution");
    }

    if (action.category === "deployment") {
      keyPoints.push("Process: Run tests before deployment");
    }

    // Meta-observation
    keyPoints.push(`Process: Current autonomy level determines execution path`);

    score = Math.max(0, Math.min(100, score));

    return {
      hat: "blue",
      verdict: score >= 60 ? "proceed" : "review",
      analysis: "Process control and meta-analysis of decision-making",
      keyPoints,
      score,
    };
  }

  /**
   * Determine consensus from all perspectives
   */
  private determineConsensus(perspectives: Record<HatType, HatPerspective>): SixHatsConsensus {
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

    if (cautionCount >= 3 || (cautionCount + (6 - proceedCount - stopCount)) >= 4) {
      return "caution";
    }

    return "mixed";
  }

  /**
   * Calculate overall score from all perspectives
   */
  private calculateOverallScore(perspectives: Record<HatType, HatPerspective>): number {
    const weights = {
      white: 0.20,  // Data matters
      red: 0.10,    // Intuition matters less
      black: 0.25,  // Caution is important
      yellow: 0.15, // Benefits considered
      green: 0.10,  // Alternatives are nice to have
      blue: 0.20,   // Process matters
    };

    let weightedSum = 0;
    for (const [hat, perspective] of Object.entries(perspectives)) {
      weightedSum += perspective.score * weights[hat as HatType];
    }

    return Math.round(weightedSum);
  }

  /**
   * Generate final recommendation
   */
  private generateRecommendation(
    perspectives: Record<HatType, HatPerspective>,
    consensus: SixHatsConsensus
  ): string {
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
}
