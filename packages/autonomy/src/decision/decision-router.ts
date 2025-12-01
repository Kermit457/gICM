/**
 * Decision Router for Level 2 Autonomy
 *
 * Routes actions based on:
 * - Risk classification
 * - Boundary checks
 * - Autonomy level configuration
 *
 * Outcomes:
 * - auto_execute: Execute immediately
 * - queue_approval: Add to approval queue
 * - escalate: Notify human immediately
 * - reject: Deny the action
 */

import { EventEmitter } from "eventemitter3";
import type {
  Action,
  Decision,
  DecisionOutcome,
  RiskAssessment,
  BoundaryCheckResult,
  Boundaries,
  AutonomyConfig,
} from "../core/types.js";
import { RiskClassifier, type RiskClassifierConfig } from "./risk-classifier.js";
import { BoundaryChecker } from "./boundary-checker.js";
import { Logger } from "../utils/logger.js";

export interface DecisionRouterConfig {
  autonomyLevel?: 1 | 2 | 3 | 4;
  boundaries?: Partial<Boundaries>;
  riskClassifier?: RiskClassifierConfig;
}

export interface DecisionRouterEvents {
  "decision:made": (decision: Decision) => void;
  "decision:auto_execute": (decision: Decision) => void;
  "decision:queued": (decision: Decision) => void;
  "decision:escalated": (decision: Decision) => void;
  "decision:rejected": (decision: Decision) => void;
  "boundary:violation": (action: Action, violations: string[]) => void;
}

export class DecisionRouter extends EventEmitter<DecisionRouterEvents> {
  private logger: Logger;
  private riskClassifier: RiskClassifier;
  private boundaryChecker: BoundaryChecker;
  private autonomyLevel: number;
  private decisionCount = 0;

  constructor(config: DecisionRouterConfig = {}) {
    super();
    this.logger = new Logger("DecisionRouter");
    this.autonomyLevel = config.autonomyLevel ?? 2;
    this.riskClassifier = new RiskClassifier(config.riskClassifier);
    this.boundaryChecker = new BoundaryChecker(config.boundaries);
  }

  /**
   * Route an action through risk assessment and boundary checks
   */
  async route(action: Action): Promise<Decision> {
    this.logger.info(`Routing action: ${action.type}`, {
      engine: action.engine,
      category: action.category,
    });

    // 1. Assess risk
    const assessment = this.riskClassifier.classify(action);

    // 2. Check boundaries
    const boundaryResult = this.boundaryChecker.check(action, assessment.level);

    // 3. Determine outcome
    const outcome = this.determineOutcome(action, assessment, boundaryResult);

    // 4. Create decision
    const decision = this.createDecision(
      action,
      assessment,
      boundaryResult,
      outcome
    );

    // 5. Emit events
    this.emitDecisionEvents(decision, boundaryResult);

    this.logger.info(`Decision: ${outcome}`, {
      actionId: action.id,
      riskLevel: assessment.level,
      riskScore: assessment.score,
      boundariesPassed: boundaryResult.passed,
    });

    return decision;
  }

  /**
   * Determine the routing outcome based on all factors
   */
  private determineOutcome(
    action: Action,
    assessment: RiskAssessment,
    boundaryResult: BoundaryCheckResult
  ): DecisionOutcome {
    // Hard rejections
    if (boundaryResult.violations.some((v) => v.includes("Production"))) {
      return "escalate";
    }

    if (!boundaryResult.passed) {
      // Some violations can be queued, others rejected
      const criticalViolations = boundaryResult.violations.filter(
        (v) =>
          v.includes("exceeds") ||
          v.includes("limit") ||
          v.includes("IRREVERSIBLE")
      );
      if (criticalViolations.length > 0) {
        return "queue_approval";
      }
      return "reject";
    }

    // Route by autonomy level
    switch (this.autonomyLevel) {
      case 1:
        // Level 1: Everything requires approval
        return "queue_approval";

      case 2:
        // Level 2: Auto-execute safe/low risk, queue medium+
        return this.routeLevel2(action, assessment);

      case 3:
        // Level 3: Auto-execute up to high risk, escalate critical
        return this.routeLevel3(action, assessment);

      case 4:
        // Level 4: Full autonomy, only escalate critical
        return this.routeLevel4(action, assessment);

      default:
        return "queue_approval";
    }
  }

  /**
   * Level 2 routing: Bounded autonomy
   */
  private routeLevel2(
    action: Action,
    assessment: RiskAssessment
  ): DecisionOutcome {
    // Safe and low risk: auto-execute
    if (assessment.level === "safe" || assessment.level === "low") {
      // Extra check for content - auto-execute tweets/posts
      if (action.category === "content") {
        return "auto_execute";
      }
      // Extra check for trading - only auto-execute DCA
      if (action.category === "trading") {
        if (action.type.includes("dca") || action.type.includes("scheduled")) {
          return "auto_execute";
        }
        return "queue_approval"; // Other trades need approval
      }
      return "auto_execute";
    }

    // Medium risk: queue for batch approval
    if (assessment.level === "medium") {
      return "queue_approval";
    }

    // High risk: queue with priority
    if (assessment.level === "high") {
      return "queue_approval";
    }

    // Critical: escalate immediately
    return "escalate";
  }

  /**
   * Level 3 routing: Supervised autonomy
   */
  private routeLevel3(
    action: Action,
    assessment: RiskAssessment
  ): DecisionOutcome {
    // Auto-execute up to high risk
    if (
      assessment.level === "safe" ||
      assessment.level === "low" ||
      assessment.level === "medium"
    ) {
      return "auto_execute";
    }

    // High risk: queue
    if (assessment.level === "high") {
      return "queue_approval";
    }

    // Critical: escalate
    return "escalate";
  }

  /**
   * Level 4 routing: Full autonomy
   */
  private routeLevel4(
    action: Action,
    assessment: RiskAssessment
  ): DecisionOutcome {
    // Only escalate critical
    if (assessment.level === "critical") {
      return "escalate";
    }
    return "auto_execute";
  }

  /**
   * Create a decision record
   */
  private createDecision(
    action: Action,
    assessment: RiskAssessment,
    boundaryResult: BoundaryCheckResult,
    outcome: DecisionOutcome
  ): Decision {
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
      timestamp: Date.now(),
    };
  }

  /**
   * Build human-readable reason for decision
   */
  private buildReason(
    action: Action,
    assessment: RiskAssessment,
    boundaryResult: BoundaryCheckResult,
    outcome: DecisionOutcome
  ): string {
    const parts: string[] = [];

    // Risk level
    parts.push(`Risk: ${assessment.level} (score: ${assessment.score})`);

    // Boundary status
    if (!boundaryResult.passed) {
      parts.push(`Boundary violations: ${boundaryResult.violations.join(", ")}`);
    } else if (boundaryResult.warnings.length > 0) {
      parts.push(`Warnings: ${boundaryResult.warnings.join(", ")}`);
    }

    // Outcome reason
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
  private emitDecisionEvents(
    decision: Decision,
    boundaryResult: BoundaryCheckResult
  ): void {
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
  recordExecution(action: Action): void {
    this.boundaryChecker.recordUsage(action);
  }

  /**
   * Get boundary checker for direct access
   */
  getBoundaryChecker(): BoundaryChecker {
    return this.boundaryChecker;
  }

  /**
   * Get risk classifier for direct access
   */
  getRiskClassifier(): RiskClassifier {
    return this.riskClassifier;
  }

  /**
   * Update autonomy level
   */
  setAutonomyLevel(level: 1 | 2 | 3 | 4): void {
    this.autonomyLevel = level;
    this.logger.info(`Autonomy level set to ${level}`);
  }

  /**
   * Get current autonomy level
   */
  getAutonomyLevel(): number {
    return this.autonomyLevel;
  }

  /**
   * Update boundaries at runtime
   */
  updateBoundaries(updates: Partial<Boundaries>): void {
    this.boundaryChecker.updateBoundaries(updates);
  }
}
