import { b as Action, r as RiskAssessment, B as Boundaries, R as RiskLevel, J as BoundaryCheckResult, d as DailyUsage, D as Decision } from '../types-BSLNoyKE.js';
import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';

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

interface RiskClassifierConfig {
    /** Override category base risks */
    categoryRiskOverrides?: Partial<Record<string, number>>;
    /** Additional safe action types */
    additionalSafeActions?: string[];
}
declare class RiskClassifier {
    private logger;
    private config;
    constructor(config?: RiskClassifierConfig);
    /**
     * Classify risk level for an action
     */
    classify(action: Action): RiskAssessment;
    /**
     * Calculate all risk factors for an action
     */
    private calculateFactors;
    /**
     * Calculate financial risk factor
     */
    private calculateFinancialFactor;
    /**
     * Calculate reversibility factor
     */
    private calculateReversibilityFactor;
    /**
     * Calculate category base risk factor
     */
    private calculateCategoryFactor;
    /**
     * Calculate urgency factor
     */
    private calculateUrgencyFactor;
    /**
     * Calculate external visibility factor
     */
    private calculateVisibilityFactor;
    /**
     * Calculate total weighted score
     */
    private calculateTotalScore;
    /**
     * Convert score to risk level
     */
    private scoreToLevel;
    /**
     * Get recommendation based on action type and risk level
     */
    private getRecommendation;
    /**
     * Get constraints that apply to this action
     */
    private getConstraints;
}

/**
 * Boundary Checker for Level 2 Autonomy
 *
 * Enforces operational limits:
 * - Daily limits (trades, content, builds, spending)
 * - Value thresholds
 * - Blocked keywords/topics
 * - Time restrictions
 */

declare class BoundaryChecker {
    private logger;
    private boundaries;
    private dailyUsage;
    constructor(boundaries?: Partial<Boundaries>);
    /**
     * Check if an action passes all boundaries
     */
    check(action: Action, riskLevel: RiskLevel): BoundaryCheckResult;
    /**
     * Check trading-specific boundaries
     */
    private checkTradingBoundaries;
    /**
     * Check content-specific boundaries
     */
    private checkContentBoundaries;
    /**
     * Check build-specific boundaries
     */
    private checkBuildBoundaries;
    /**
     * Check deployment-specific boundaries
     */
    private checkDeploymentBoundaries;
    /**
     * Check financial boundaries
     */
    private checkFinancialBoundaries;
    /**
     * Check time-based restrictions
     */
    private checkTimeBoundaries;
    /**
     * Record usage after action execution
     */
    recordUsage(action: Action): void;
    /**
     * Get current usage for today
     */
    getUsageToday(): DailyUsage;
    /**
     * Get current boundaries
     */
    getBoundaries(): Boundaries;
    /**
     * Update boundaries at runtime
     */
    updateBoundaries(updates: Partial<Boundaries>): void;
    /**
     * Reset daily usage (for testing or new day)
     */
    resetDailyUsage(): void;
    private getTodayKey;
    private getOrCreateUsage;
    private getWeeklyBlogCount;
    private mergeBoundaries;
}

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

interface DecisionRouterConfig {
    autonomyLevel?: 1 | 2 | 3 | 4;
    boundaries?: Partial<Boundaries>;
    riskClassifier?: RiskClassifierConfig;
}
interface DecisionRouterEvents {
    "decision:made": (decision: Decision) => void;
    "decision:auto_execute": (decision: Decision) => void;
    "decision:queued": (decision: Decision) => void;
    "decision:escalated": (decision: Decision) => void;
    "decision:rejected": (decision: Decision) => void;
    "boundary:violation": (action: Action, violations: string[]) => void;
}
declare class DecisionRouter extends EventEmitter<DecisionRouterEvents> {
    private logger;
    private riskClassifier;
    private boundaryChecker;
    private autonomyLevel;
    private decisionCount;
    constructor(config?: DecisionRouterConfig);
    /**
     * Route an action through risk assessment and boundary checks
     */
    route(action: Action): Promise<Decision>;
    /**
     * Determine the routing outcome based on all factors
     */
    private determineOutcome;
    /**
     * Level 2 routing: Bounded autonomy
     */
    private routeLevel2;
    /**
     * Level 3 routing: Supervised autonomy
     */
    private routeLevel3;
    /**
     * Level 4 routing: Full autonomy
     */
    private routeLevel4;
    /**
     * Create a decision record
     */
    private createDecision;
    /**
     * Build human-readable reason for decision
     */
    private buildReason;
    /**
     * Emit appropriate events for the decision
     */
    private emitDecisionEvents;
    /**
     * Record action was executed (updates boundary usage)
     */
    recordExecution(action: Action): void;
    /**
     * Get boundary checker for direct access
     */
    getBoundaryChecker(): BoundaryChecker;
    /**
     * Get risk classifier for direct access
     */
    getRiskClassifier(): RiskClassifier;
    /**
     * Update autonomy level
     */
    setAutonomyLevel(level: 1 | 2 | 3 | 4): void;
    /**
     * Get current autonomy level
     */
    getAutonomyLevel(): number;
    /**
     * Update boundaries at runtime
     */
    updateBoundaries(updates: Partial<Boundaries>): void;
}

/**
 * Pipeline Risk Classifier for PTC Integration
 *
 * Extends risk classification to entire pipelines, not just individual actions.
 * Analyzes tool combinations, data flow, and cumulative risk across pipeline steps.
 */

declare const PipelineStepSchema: z.ZodObject<{
    id: z.ZodString;
    tool: z.ZodString;
    inputs: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    condition: z.ZodOptional<z.ZodString>;
    retries: z.ZodOptional<z.ZodNumber>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tool: string;
    inputs: Record<string, unknown>;
    dependsOn?: string[] | undefined;
    condition?: string | undefined;
    retries?: number | undefined;
    timeout?: number | undefined;
}, {
    id: string;
    tool: string;
    inputs: Record<string, unknown>;
    dependsOn?: string[] | undefined;
    condition?: string | undefined;
    retries?: number | undefined;
    timeout?: number | undefined;
}>;
type PipelineStep = z.infer<typeof PipelineStepSchema>;
declare const PipelineSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        tool: z.ZodString;
        inputs: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        condition: z.ZodOptional<z.ZodString>;
        retries: z.ZodOptional<z.ZodNumber>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        tool: string;
        inputs: Record<string, unknown>;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        retries?: number | undefined;
        timeout?: number | undefined;
    }, {
        id: string;
        tool: string;
        inputs: Record<string, unknown>;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        retries?: number | undefined;
        timeout?: number | undefined;
    }>, "many">;
    inputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodString;
        description: z.ZodString;
        required: z.ZodOptional<z.ZodBoolean>;
        default: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        description: string;
        default?: unknown;
        required?: boolean | undefined;
    }, {
        type: string;
        description: string;
        default?: unknown;
        required?: boolean | undefined;
    }>>>;
    outputs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        riskLevel: z.ZodOptional<z.ZodEnum<["safe", "low", "medium", "high", "critical"]>>;
        estimatedDuration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        category?: string | undefined;
        riskLevel?: "safe" | "low" | "medium" | "high" | "critical" | undefined;
        tags?: string[] | undefined;
        estimatedDuration?: number | undefined;
    }, {
        category?: string | undefined;
        riskLevel?: "safe" | "low" | "medium" | "high" | "critical" | undefined;
        tags?: string[] | undefined;
        estimatedDuration?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    name: string;
    steps: {
        id: string;
        tool: string;
        inputs: Record<string, unknown>;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        retries?: number | undefined;
        timeout?: number | undefined;
    }[];
    metadata?: {
        category?: string | undefined;
        riskLevel?: "safe" | "low" | "medium" | "high" | "critical" | undefined;
        tags?: string[] | undefined;
        estimatedDuration?: number | undefined;
    } | undefined;
    version?: string | undefined;
    inputs?: Record<string, {
        type: string;
        description: string;
        default?: unknown;
        required?: boolean | undefined;
    }> | undefined;
    outputs?: string[] | undefined;
}, {
    id: string;
    description: string;
    name: string;
    steps: {
        id: string;
        tool: string;
        inputs: Record<string, unknown>;
        dependsOn?: string[] | undefined;
        condition?: string | undefined;
        retries?: number | undefined;
        timeout?: number | undefined;
    }[];
    metadata?: {
        category?: string | undefined;
        riskLevel?: "safe" | "low" | "medium" | "high" | "critical" | undefined;
        tags?: string[] | undefined;
        estimatedDuration?: number | undefined;
    } | undefined;
    version?: string | undefined;
    inputs?: Record<string, {
        type: string;
        description: string;
        default?: unknown;
        required?: boolean | undefined;
    }> | undefined;
    outputs?: string[] | undefined;
}>;
type Pipeline = z.infer<typeof PipelineSchema>;
declare const PipelineRiskAssessmentSchema: z.ZodObject<{
    pipelineId: z.ZodString;
    level: z.ZodEnum<["safe", "low", "medium", "high", "critical"]>;
    score: z.ZodNumber;
    factors: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        weight: z.ZodNumber;
        value: z.ZodNumber;
        threshold: z.ZodNumber;
        exceeded: z.ZodBoolean;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: number;
        name: string;
        weight: number;
        threshold: number;
        exceeded: boolean;
        reason: string;
    }, {
        value: number;
        name: string;
        weight: number;
        threshold: number;
        exceeded: boolean;
        reason: string;
    }>, "many">;
    stepRisks: z.ZodArray<z.ZodObject<{
        stepId: z.ZodString;
        tool: z.ZodString;
        riskScore: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reason: string;
        riskScore: number;
        tool: string;
        stepId: string;
    }, {
        reason: string;
        riskScore: number;
        tool: string;
        stepId: string;
    }>, "many">;
    recommendation: z.ZodEnum<["auto_execute", "queue_approval", "escalate", "reject"]>;
    constraints: z.ZodArray<z.ZodString, "many">;
    estimatedImpact: z.ZodObject<{
        financial: z.ZodNumber;
        visibility: z.ZodEnum<["internal", "limited", "public"]>;
        reversibility: z.ZodEnum<["full", "partial", "none"]>;
    }, "strip", z.ZodTypeAny, {
        financial: number;
        reversibility: "full" | "partial" | "none";
        visibility: "internal" | "limited" | "public";
    }, {
        financial: number;
        reversibility: "full" | "partial" | "none";
        visibility: "internal" | "limited" | "public";
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    level: "safe" | "low" | "medium" | "high" | "critical";
    score: number;
    factors: {
        value: number;
        name: string;
        weight: number;
        threshold: number;
        exceeded: boolean;
        reason: string;
    }[];
    recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
    constraints: string[];
    pipelineId: string;
    stepRisks: {
        reason: string;
        riskScore: number;
        tool: string;
        stepId: string;
    }[];
    estimatedImpact: {
        financial: number;
        reversibility: "full" | "partial" | "none";
        visibility: "internal" | "limited" | "public";
    };
}, {
    timestamp: number;
    level: "safe" | "low" | "medium" | "high" | "critical";
    score: number;
    factors: {
        value: number;
        name: string;
        weight: number;
        threshold: number;
        exceeded: boolean;
        reason: string;
    }[];
    recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
    constraints: string[];
    pipelineId: string;
    stepRisks: {
        reason: string;
        riskScore: number;
        tool: string;
        stepId: string;
    }[];
    estimatedImpact: {
        financial: number;
        reversibility: "full" | "partial" | "none";
        visibility: "internal" | "limited" | "public";
    };
}>;
type PipelineRiskAssessment = z.infer<typeof PipelineRiskAssessmentSchema>;
interface PipelineClassifierConfig {
    toolRiskOverrides?: Record<string, number>;
    dangerousCombinations?: string[][];
    maxStepsBeforeReview?: number;
}
declare class PipelineRiskClassifier {
    private logger;
    private config;
    constructor(config?: PipelineClassifierConfig);
    /**
     * Classify risk level for an entire pipeline
     */
    classify(pipeline: Pipeline): PipelineRiskAssessment;
    /**
     * Calculate all risk factors for a pipeline
     */
    private calculateFactors;
    /**
     * Calculate cumulative risk from all tools
     */
    private calculateToolRiskFactor;
    /**
     * Check for dangerous tool combinations
     */
    private calculateCombinationFactor;
    /**
     * Calculate complexity-based risk
     */
    private calculateComplexityFactor;
    /**
     * Calculate data flow risk (sensitive data propagation)
     */
    private calculateDataFlowFactor;
    /**
     * Use pipeline metadata risk level if provided
     */
    private calculateMetadataFactor;
    /**
     * Calculate risk for each step
     */
    private calculateStepRisks;
    /**
     * Calculate dependency chain depth
     */
    private calculateDependencyDepth;
    /**
     * Calculate total weighted score
     */
    private calculateTotalScore;
    /**
     * Convert score to risk level
     */
    private scoreToLevel;
    /**
     * Get recommendation based on pipeline analysis
     */
    private getRecommendation;
    /**
     * Get constraints that apply to this pipeline
     */
    private getConstraints;
    /**
     * Estimate pipeline impact
     */
    private estimateImpact;
}

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

declare const HatTypeSchema: z.ZodEnum<["white", "red", "black", "yellow", "green", "blue"]>;
type HatType = z.infer<typeof HatTypeSchema>;
declare const HatVerdictSchema: z.ZodEnum<["proceed", "caution", "stop", "review"]>;
type HatVerdict = z.infer<typeof HatVerdictSchema>;
declare const HatPerspectiveSchema: z.ZodObject<{
    hat: z.ZodEnum<["white", "red", "black", "yellow", "green", "blue"]>;
    verdict: z.ZodEnum<["proceed", "caution", "stop", "review"]>;
    analysis: z.ZodString;
    keyPoints: z.ZodArray<z.ZodString, "many">;
    score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    score: number;
    hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
    verdict: "proceed" | "caution" | "stop" | "review";
    analysis: string;
    keyPoints: string[];
}, {
    score: number;
    hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
    verdict: "proceed" | "caution" | "stop" | "review";
    analysis: string;
    keyPoints: string[];
}>;
type HatPerspective = z.infer<typeof HatPerspectiveSchema>;
declare const SixHatsConsensusSchema: z.ZodEnum<["strong_proceed", "proceed", "mixed", "caution", "stop"]>;
type SixHatsConsensus = z.infer<typeof SixHatsConsensusSchema>;
declare const SixHatsResultSchema: z.ZodObject<{
    actionId: z.ZodString;
    perspectives: z.ZodObject<{
        white: z.ZodObject<{
            hat: z.ZodEnum<["white", "red", "black", "yellow", "green", "blue"]>;
            verdict: z.ZodEnum<["proceed", "caution", "stop", "review"]>;
            analysis: z.ZodString;
            keyPoints: z.ZodArray<z.ZodString, "many">;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }>;
        red: z.ZodObject<{
            hat: z.ZodEnum<["white", "red", "black", "yellow", "green", "blue"]>;
            verdict: z.ZodEnum<["proceed", "caution", "stop", "review"]>;
            analysis: z.ZodString;
            keyPoints: z.ZodArray<z.ZodString, "many">;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }>;
        black: z.ZodObject<{
            hat: z.ZodEnum<["white", "red", "black", "yellow", "green", "blue"]>;
            verdict: z.ZodEnum<["proceed", "caution", "stop", "review"]>;
            analysis: z.ZodString;
            keyPoints: z.ZodArray<z.ZodString, "many">;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }>;
        yellow: z.ZodObject<{
            hat: z.ZodEnum<["white", "red", "black", "yellow", "green", "blue"]>;
            verdict: z.ZodEnum<["proceed", "caution", "stop", "review"]>;
            analysis: z.ZodString;
            keyPoints: z.ZodArray<z.ZodString, "many">;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }>;
        green: z.ZodObject<{
            hat: z.ZodEnum<["white", "red", "black", "yellow", "green", "blue"]>;
            verdict: z.ZodEnum<["proceed", "caution", "stop", "review"]>;
            analysis: z.ZodString;
            keyPoints: z.ZodArray<z.ZodString, "many">;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }>;
        blue: z.ZodObject<{
            hat: z.ZodEnum<["white", "red", "black", "yellow", "green", "blue"]>;
            verdict: z.ZodEnum<["proceed", "caution", "stop", "review"]>;
            analysis: z.ZodString;
            keyPoints: z.ZodArray<z.ZodString, "many">;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }, {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        white: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        red: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        black: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        yellow: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        green: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        blue: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
    }, {
        white: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        red: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        black: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        yellow: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        green: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        blue: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
    }>;
    consensus: z.ZodEnum<["strong_proceed", "proceed", "mixed", "caution", "stop"]>;
    overallScore: z.ZodNumber;
    recommendation: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    actionId: string;
    timestamp: number;
    recommendation: string;
    perspectives: {
        white: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        red: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        black: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        yellow: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        green: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        blue: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
    };
    consensus: "proceed" | "caution" | "stop" | "strong_proceed" | "mixed";
    overallScore: number;
}, {
    actionId: string;
    timestamp: number;
    recommendation: string;
    perspectives: {
        white: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        red: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        black: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        yellow: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        green: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
        blue: {
            score: number;
            hat: "white" | "red" | "black" | "yellow" | "green" | "blue";
            verdict: "proceed" | "caution" | "stop" | "review";
            analysis: string;
            keyPoints: string[];
        };
    };
    consensus: "proceed" | "caution" | "stop" | "strong_proceed" | "mixed";
    overallScore: number;
}>;
type SixHatsResult = z.infer<typeof SixHatsResultSchema>;
declare class SixHatsEvaluator {
    private logger;
    constructor();
    /**
     * Evaluate an action using all six thinking hats
     */
    evaluate(action: Action, riskAssessment?: RiskAssessment): SixHatsResult;
    /**
     * White Hat: Facts, data, objective analysis
     * Focus: What information do we have? What do we need?
     */
    private evaluateWhiteHat;
    /**
     * Red Hat: Emotions, intuition, gut feelings
     * Focus: How does this feel? What's the instinct?
     */
    private evaluateRedHat;
    /**
     * Black Hat: Caution, risks, what could go wrong
     * Focus: Identify dangers, weaknesses, threats
     */
    private evaluateBlackHat;
    /**
     * Yellow Hat: Benefits, optimism, advantages
     * Focus: What are the potential gains?
     */
    private evaluateYellowHat;
    /**
     * Green Hat: Creativity, alternatives, new ideas
     * Focus: What other approaches could work?
     */
    private evaluateGreenHat;
    /**
     * Blue Hat: Process, meta-thinking, next steps
     * Focus: What's the overall process recommendation?
     */
    private evaluateBlueHat;
    /**
     * Determine consensus from all perspectives
     */
    private determineConsensus;
    /**
     * Calculate overall score from all perspectives
     */
    private calculateOverallScore;
    /**
     * Generate final recommendation
     */
    private generateRecommendation;
}

export { BoundaryChecker, DecisionRouter, type DecisionRouterConfig, type DecisionRouterEvents, type HatPerspective, HatPerspectiveSchema, type HatType, HatTypeSchema, type HatVerdict, HatVerdictSchema, type Pipeline, type PipelineClassifierConfig, type PipelineRiskAssessment, PipelineRiskAssessmentSchema, PipelineRiskClassifier, PipelineSchema, type PipelineStep, PipelineStepSchema, RiskClassifier, type RiskClassifierConfig, type SixHatsConsensus, SixHatsConsensusSchema, SixHatsEvaluator, type SixHatsResult, SixHatsResultSchema };
