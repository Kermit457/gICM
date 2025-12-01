/**
 * Pipeline Risk Classifier for PTC Integration
 *
 * Extends risk classification to entire pipelines, not just individual actions.
 * Analyzes tool combinations, data flow, and cumulative risk across pipeline steps.
 */

import { z } from "zod";
import type {
  RiskLevel,
  DecisionOutcome,
  RiskFactor,
} from "../core/types.js";
import {
  RISK_SCORE_THRESHOLDS,
  RISK_LEVEL_OUTCOMES,
} from "../core/constants.js";
import { Logger } from "../utils/logger.js";

// ============================================================================
// Pipeline Types (compatible with @gicm/ptc-coordinator)
// ============================================================================

export const PipelineStepSchema = z.object({
  id: z.string(),
  tool: z.string(),
  inputs: z.record(z.unknown()),
  dependsOn: z.array(z.string()).optional(),
  condition: z.string().optional(),
  retries: z.number().optional(),
  timeout: z.number().optional(),
});

export type PipelineStep = z.infer<typeof PipelineStepSchema>;

export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().optional(),
  steps: z.array(PipelineStepSchema),
  inputs: z.record(z.object({
    type: z.string(),
    description: z.string(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
  })).optional(),
  outputs: z.array(z.string()).optional(),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    riskLevel: z.enum(['safe', 'low', 'medium', 'high', 'critical']).optional(),
    estimatedDuration: z.number().optional(),
  }).optional(),
});

export type Pipeline = z.infer<typeof PipelineSchema>;

// ============================================================================
// Pipeline Risk Assessment
// ============================================================================

export const PipelineRiskAssessmentSchema = z.object({
  pipelineId: z.string(),
  level: z.enum(['safe', 'low', 'medium', 'high', 'critical']),
  score: z.number().min(0).max(100),
  factors: z.array(z.object({
    name: z.string(),
    weight: z.number(),
    value: z.number(),
    threshold: z.number(),
    exceeded: z.boolean(),
    reason: z.string(),
  })),
  stepRisks: z.array(z.object({
    stepId: z.string(),
    tool: z.string(),
    riskScore: z.number(),
    reason: z.string(),
  })),
  recommendation: z.enum(['auto_execute', 'queue_approval', 'escalate', 'reject']),
  constraints: z.array(z.string()),
  estimatedImpact: z.object({
    financial: z.number(),
    visibility: z.enum(['internal', 'limited', 'public']),
    reversibility: z.enum(['full', 'partial', 'none']),
  }),
  timestamp: z.number(),
});

export type PipelineRiskAssessment = z.infer<typeof PipelineRiskAssessmentSchema>;

// ============================================================================
// Tool Risk Categories
// ============================================================================

const TOOL_RISK_SCORES: Record<string, number> = {
  // Safe tools (0-20)
  'search_tools': 5,
  'search_gicm': 5,
  'analyzer': 10,
  'report_generator': 10,
  'seo_researcher': 10,
  'analytics_agent': 15,

  // Low risk tools (21-40)
  'hunter_agent': 25,
  'defi_agent': 30,
  'content_generator': 30,
  'seo_optimizer': 25,
  'decision_agent': 30,

  // Medium risk tools (41-60)
  'wallet_agent': 50,
  'audit_agent': 40,
  'scheduler': 45,
  'social_agent': 50,

  // High risk tools (61-80)
  'trading_agent': 70,
  'deployer_agent': 75,
  'bridge_agent': 75,

  // Critical risk tools (81-100)
  'treasury_agent': 90,
  'admin_agent': 95,
};

const DANGEROUS_TOOL_COMBINATIONS = [
  ['wallet_agent', 'trading_agent'], // Financial operations
  ['wallet_agent', 'bridge_agent'],  // Cross-chain operations
  ['deployer_agent', 'wallet_agent'], // Deploy with funds
];

// ============================================================================
// Pipeline Risk Classifier
// ============================================================================

export interface PipelineClassifierConfig {
  toolRiskOverrides?: Record<string, number>;
  dangerousCombinations?: string[][];
  maxStepsBeforeReview?: number;
}

export class PipelineRiskClassifier {
  private logger: Logger;
  private config: PipelineClassifierConfig;

  constructor(config: PipelineClassifierConfig = {}) {
    this.logger = new Logger("PipelineRiskClassifier");
    this.config = config;
  }

  /**
   * Classify risk level for an entire pipeline
   */
  classify(pipeline: Pipeline): PipelineRiskAssessment {
    const factors = this.calculateFactors(pipeline);
    const stepRisks = this.calculateStepRisks(pipeline);
    const score = this.calculateTotalScore(factors);
    const level = this.scoreToLevel(score);
    const recommendation = this.getRecommendation(pipeline, level, stepRisks);

    const assessment: PipelineRiskAssessment = {
      pipelineId: pipeline.id,
      level,
      score: Math.round(score),
      factors,
      stepRisks,
      recommendation,
      constraints: this.getConstraints(pipeline, level),
      estimatedImpact: this.estimateImpact(pipeline, stepRisks),
      timestamp: Date.now(),
    };

    this.logger.debug(`Pipeline risk assessed: ${pipeline.name}`, {
      score: assessment.score,
      level: assessment.level,
      recommendation: assessment.recommendation,
    });

    return assessment;
  }

  /**
   * Calculate all risk factors for a pipeline
   */
  private calculateFactors(pipeline: Pipeline): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // 1. Cumulative Tool Risk
    factors.push(this.calculateToolRiskFactor(pipeline));

    // 2. Tool Combination Risk
    factors.push(this.calculateCombinationFactor(pipeline));

    // 3. Pipeline Complexity
    factors.push(this.calculateComplexityFactor(pipeline));

    // 4. Data Flow Risk
    factors.push(this.calculateDataFlowFactor(pipeline));

    // 5. Metadata Risk Level
    factors.push(this.calculateMetadataFactor(pipeline));

    return factors;
  }

  /**
   * Calculate cumulative risk from all tools
   */
  private calculateToolRiskFactor(pipeline: Pipeline): RiskFactor {
    const toolScores = pipeline.steps.map((step) => {
      const baseScore = this.config.toolRiskOverrides?.[step.tool] ??
        TOOL_RISK_SCORES[step.tool] ?? 50;
      return { tool: step.tool, score: baseScore };
    });

    // Use weighted average with diminishing returns
    const avgScore = toolScores.reduce((sum, t, i) => {
      const weight = 1 / (i + 1); // First tool weighs more
      return sum + t.score * weight;
    }, 0) / Math.log(toolScores.length + 1);

    const maxScore = Math.max(...toolScores.map((t) => t.score), 0);

    // Combine average and max
    const combinedScore = avgScore * 0.6 + maxScore * 0.4;

    return {
      name: "cumulativeToolRisk",
      weight: 0.35,
      value: Math.min(combinedScore, 100),
      threshold: 60,
      exceeded: combinedScore > 60,
      reason: `${pipeline.steps.length} tools, highest risk: ${maxScore}`,
    };
  }

  /**
   * Check for dangerous tool combinations
   */
  private calculateCombinationFactor(pipeline: Pipeline): RiskFactor {
    const tools = pipeline.steps.map((s) => s.tool);
    const dangerousCombos = [
      ...DANGEROUS_TOOL_COMBINATIONS,
      ...(this.config.dangerousCombinations ?? []),
    ];

    const foundCombinations: string[] = [];
    for (const combo of dangerousCombos) {
      if (combo.every((tool) => tools.includes(tool))) {
        foundCombinations.push(combo.join(" + "));
      }
    }

    const riskScore = foundCombinations.length > 0
      ? Math.min(50 + foundCombinations.length * 20, 100)
      : 10;

    return {
      name: "dangerousCombinations",
      weight: 0.25,
      value: riskScore,
      threshold: 50,
      exceeded: foundCombinations.length > 0,
      reason: foundCombinations.length > 0
        ? `Dangerous combinations: ${foundCombinations.join(", ")}`
        : "No dangerous tool combinations detected",
    };
  }

  /**
   * Calculate complexity-based risk
   */
  private calculateComplexityFactor(pipeline: Pipeline): RiskFactor {
    const stepCount = pipeline.steps.length;
    const hasConditions = pipeline.steps.some((s) => s.condition);
    const hasDependencies = pipeline.steps.some((s) => s.dependsOn?.length);
    const maxDepth = this.calculateDependencyDepth(pipeline);

    let riskScore = 10;

    // More steps = more risk
    riskScore += Math.min(stepCount * 5, 30);

    // Conditional logic increases risk
    if (hasConditions) riskScore += 15;

    // Deep dependency chains increase risk
    if (maxDepth > 3) riskScore += 20;

    // Many steps without review is risky
    const maxSteps = this.config.maxStepsBeforeReview ?? 5;
    if (stepCount > maxSteps) riskScore += 15;

    return {
      name: "pipelineComplexity",
      weight: 0.15,
      value: Math.min(riskScore, 100),
      threshold: 50,
      exceeded: stepCount > maxSteps || maxDepth > 3,
      reason: `${stepCount} steps, depth ${maxDepth}, ${hasConditions ? "has" : "no"} conditions`,
    };
  }

  /**
   * Calculate data flow risk (sensitive data propagation)
   */
  private calculateDataFlowFactor(pipeline: Pipeline): RiskFactor {
    // Check for sensitive input references
    const sensitivePatterns = [
      'wallet', 'token', 'key', 'secret', 'password', 'balance',
      'private', 'transfer', 'execute', 'deploy',
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
      reason: `${sensitiveFlows} sensitive data flows detected`,
    };
  }

  /**
   * Use pipeline metadata risk level if provided
   */
  private calculateMetadataFactor(pipeline: Pipeline): RiskFactor {
    const declaredLevel = pipeline.metadata?.riskLevel;
    const riskScores: Record<string, number> = {
      safe: 10,
      low: 25,
      medium: 50,
      high: 75,
      critical: 95,
    };

    const riskScore = declaredLevel
      ? riskScores[declaredLevel]
      : 50; // Default to medium if not specified

    return {
      name: "declaredRiskLevel",
      weight: 0.10,
      value: riskScore,
      threshold: 50,
      exceeded: riskScore > 50,
      reason: declaredLevel
        ? `Pipeline declared as "${declaredLevel}" risk`
        : "No risk level declared, assuming medium",
    };
  }

  /**
   * Calculate risk for each step
   */
  private calculateStepRisks(pipeline: Pipeline): PipelineRiskAssessment['stepRisks'] {
    return pipeline.steps.map((step) => {
      const baseScore = this.config.toolRiskOverrides?.[step.tool] ??
        TOOL_RISK_SCORES[step.tool] ?? 50;

      let reason = `Base tool risk: ${baseScore}`;

      // Adjust for conditions
      if (step.condition) {
        reason += " (+conditional execution)";
      }

      // Adjust for timeouts
      if (step.timeout && step.timeout > 60000) {
        reason += " (+long timeout)";
      }

      return {
        stepId: step.id,
        tool: step.tool,
        riskScore: baseScore,
        reason,
      };
    });
  }

  /**
   * Calculate dependency chain depth
   */
  private calculateDependencyDepth(pipeline: Pipeline): number {
    const stepMap = new Map(pipeline.steps.map((s) => [s.id, s]));
    const cache = new Map<string, number>();

    const getDepth = (stepId: string): number => {
      if (cache.has(stepId)) return cache.get(stepId)!;

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
   * Get recommendation based on pipeline analysis
   */
  private getRecommendation(
    pipeline: Pipeline,
    level: RiskLevel,
    stepRisks: PipelineRiskAssessment['stepRisks']
  ): DecisionOutcome {
    // If any step has critical risk, escalate
    if (stepRisks.some((s) => s.riskScore >= 90)) {
      return "escalate";
    }

    // If declared as safe in metadata, auto-execute (unless steps contradict)
    if (pipeline.metadata?.riskLevel === 'safe' && level !== 'critical') {
      return "auto_execute";
    }

    // Use level-based recommendation
    return RISK_LEVEL_OUTCOMES[level] as DecisionOutcome;
  }

  /**
   * Get constraints that apply to this pipeline
   */
  private getConstraints(pipeline: Pipeline, level: RiskLevel): string[] {
    const constraints: string[] = [];

    if (level === "critical" || level === "high") {
      constraints.push("Requires human approval before execution");
    }

    const hasFinancialTools = pipeline.steps.some((s) =>
      ['wallet_agent', 'trading_agent', 'treasury_agent'].includes(s.tool)
    );
    if (hasFinancialTools) {
      constraints.push("Subject to financial limits");
    }

    const hasDeployment = pipeline.steps.some((s) =>
      s.tool === 'deployer_agent'
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
  private estimateImpact(
    pipeline: Pipeline,
    stepRisks: PipelineRiskAssessment['stepRisks']
  ): PipelineRiskAssessment['estimatedImpact'] {
    // Financial impact (rough estimate based on tools)
    let financial = 0;
    for (const step of pipeline.steps) {
      if (step.tool.includes('wallet') || step.tool.includes('trading')) {
        financial += 100; // Base financial impact
      }
      if (step.tool.includes('treasury')) {
        financial += 500;
      }
    }

    // Visibility
    const hasPublicTools = pipeline.steps.some((s) =>
      ['social_agent', 'content_generator', 'scheduler'].includes(s.tool)
    );
    const visibility = hasPublicTools ? 'public' : 'internal';

    // Reversibility
    const hasIrreversible = pipeline.steps.some((s) =>
      ['deployer_agent', 'bridge_agent', 'trading_agent'].includes(s.tool)
    );
    const reversibility = hasIrreversible ? 'partial' : 'full';

    return { financial, visibility, reversibility };
  }
}
