import { B as Boundaries, A as AutonomyConfig, a as ActionCategory, R as RiskLevel, b as Action, D as Decision, E as ExecutionResult, c as ApprovalRequest, U as Urgency, d as DailyUsage } from './types-BSLNoyKE.js';
export { h as ActionCategorySchema, m as ActionMetadata, l as ActionMetadataSchema, n as ActionSchema, M as ApprovalRequestSchema, L as ApprovalStatus, K as ApprovalStatusSchema, W as AuditEntry, V as AuditEntrySchema, S as AuditEntryType, Q as AuditEntryTypeSchema, $ as AutonomyConfigSchema, G as BoundariesSchema, J as BoundaryCheckResult, I as BoundaryCheckResultSchema, u as ContentBoundaries, C as ContentBoundariesSchema, H as DailyUsageSchema, g as DecisionOutcome, f as DecisionOutcomeSchema, s as DecisionSchema, w as DevelopmentBoundaries, v as DevelopmentBoundariesSchema, j as EngineType, i as EngineTypeSchema, N as ExecutionResultSchema, t as FinancialBoundaries, F as FinancialBoundariesSchema, _ as NotificationChannel, Z as NotificationChannelSchema, Y as NotificationChannelType, X as NotificationChannelTypeSchema, r as RiskAssessment, q as RiskAssessmentSchema, p as RiskFactor, o as RiskFactorSchema, e as RiskLevelSchema, P as RollbackCheckpoint, O as RollbackCheckpointSchema, z as TimeBoundaries, y as TimeBoundariesSchema, x as TradingBoundaries, T as TradingBoundariesSchema, k as UrgencySchema } from './types-BSLNoyKE.js';
import { EventEmitter } from 'eventemitter3';
import { AutoExecutor } from './execution/index.js';
export { ActionHandler, AutoExecutorConfig, AutoExecutorEvents, RollbackHandler, RollbackManager, RollbackManagerConfig, SafeActions, SafeActionsConfig } from './execution/index.js';
import { BatchApproval, ApprovalQueue } from './approval/index.js';
export { ApprovalQueueConfig, ApprovalQueueEvents, BatchFilter, BatchSummary, NotificationManager, NotificationManagerConfig } from './approval/index.js';
import { AuditLogger } from './audit/index.js';
export { AuditLoggerConfig } from './audit/index.js';
export { BoundaryChecker, DecisionRouter, DecisionRouterConfig, DecisionRouterEvents, HatPerspective, HatPerspectiveSchema, HatType, HatTypeSchema, HatVerdict, HatVerdictSchema, Pipeline, PipelineClassifierConfig, PipelineRiskAssessment, PipelineRiskAssessmentSchema, PipelineRiskClassifier, PipelineSchema, PipelineStep, PipelineStepSchema, RiskClassifier, RiskClassifierConfig, SixHatsConsensus, SixHatsConsensusSchema, SixHatsEvaluator, SixHatsResult, SixHatsResultSchema } from './decision/index.js';
export { B as BlogParams, e as BuildParams, r as CLAUDE_ACTION_BASE_RISK, s as CONTEXT_RISK_MODIFIERS, i as ClaudeCodeActionType, k as ClaudeCodeContext, j as ClaudeCodeContextSchema, g as ClaudeWorkflowAdapter, C as CommitParams, u as DANGEROUS_CLAUDE_ACTIONS, D as DCATradeParams, v as DEFAULT_WORKFLOW_BOUNDARIES, o as DailyImprovement, n as DailyImprovementSchema, f as DeployParams, d as DiscordAnnouncementParams, E as EngineAdapter, a as EngineAdapterConfig, b as EngineAdapterEvents, c as ExpenseParams, G as GrowthEngineAdapter, w as IMPROVEMENT_VALUE, p as ImprovementStats, I as ImprovementStatsSchema, L as Logger, M as MoneyEngineAdapter, P as ProductEngineAdapter, R as RISK_THRESHOLDS, t as SAFE_CLAUDE_ACTIONS, S as SwapParams, T as TweetParams, W as WorkflowActionType, q as WorkflowAdapterEvents, m as WorkflowContext, l as WorkflowContextSchema, h as getWorkflowAdapter } from './index-x7CDcp49.js';
import 'zod';

/**
 * Default Configuration for Level 2 Autonomy
 */

declare const DEFAULT_BOUNDARIES: Boundaries;
declare const DEFAULT_CONFIG: AutonomyConfig;
/**
 * Create config with defaults merged with overrides
 */
declare function createConfig(overrides?: Partial<AutonomyConfig>): AutonomyConfig;
/**
 * Load config from environment variables
 */
declare function loadConfigFromEnv(): Partial<AutonomyConfig>;

/**
 * Constants for Level 2 Autonomy
 *
 * Risk weights, thresholds, and category defaults
 */

/**
 * Risk factors and their weights (must sum to 1.0)
 */
declare const RISK_FACTOR_WEIGHTS: {
    readonly financialValue: 0.35;
    readonly reversibility: 0.2;
    readonly categoryRisk: 0.15;
    readonly urgency: 0.15;
    readonly externalVisibility: 0.15;
};
/**
 * Score thresholds for risk levels
 */
declare const RISK_SCORE_THRESHOLDS: {
    readonly safe: 20;
    readonly low: 40;
    readonly medium: 60;
    readonly high: 80;
};
/**
 * Base risk scores by category
 */
declare const CATEGORY_BASE_RISK: Record<ActionCategory, number>;
/**
 * Financial value thresholds for risk escalation
 */
declare const FINANCIAL_RISK_THRESHOLDS: {
    readonly negligible: 10;
    readonly low: 50;
    readonly medium: 100;
    readonly high: 500;
    readonly critical: 1000;
};
/**
 * Default outcome by risk level for Level 2 autonomy
 */
declare const RISK_LEVEL_OUTCOMES: Record<RiskLevel, string>;
/**
 * Categories that always require approval regardless of score
 */
declare const ALWAYS_REQUIRE_APPROVAL: ActionCategory[];
/**
 * Action types that can always auto-execute (override category risk)
 */
declare const SAFE_ACTION_TYPES: readonly ["dca_buy", "tweet_post", "blog_draft", "small_commit", "log_activity"];
/**
 * Action types that always require human approval
 */
declare const DANGEROUS_ACTION_TYPES: readonly ["deploy_production", "delete_data", "transfer_funds", "change_api_keys", "modify_permissions"];
/**
 * Priority multipliers by urgency
 */
declare const URGENCY_PRIORITY: Record<string, number>;
/**
 * Escalation rules
 */
declare const ESCALATION_RULES: {
    readonly ageHoursBeforeEscalation: 12;
    readonly ageHoursBeforeAutoReject: 48;
    readonly criticalRiskAutoEscalate: true;
    readonly highValueAutoEscalate: 200;
};
declare const RATE_LIMITS: {
    readonly maxActionsPerMinute: 30;
    readonly maxNotificationsPerMinute: 10;
    readonly maxAutoExecutionsPerHour: 100;
    readonly cooldownAfterFailureMs: 60000;
};
declare const AUDIT_CONFIG: {
    readonly hashAlgorithm: "sha256";
    readonly retentionDays: 90;
    readonly maxEntriesInMemory: 1000;
};

interface AutonomyEngineEvents {
    "started": () => void;
    "stopped": () => void;
    "action:received": (action: Action) => void;
    "decision:made": (decision: Decision) => void;
    "execution:completed": (result: ExecutionResult) => void;
    "execution:failed": (result: ExecutionResult) => void;
    "approval:queued": (request: ApprovalRequest) => void;
    "approval:granted": (request: ApprovalRequest) => void;
    "approval:rejected": (request: ApprovalRequest, reason: string) => void;
    "escalation": (request: ApprovalRequest) => void;
}
/**
 * Main Autonomy Engine
 *
 * Orchestrates all autonomy components:
 * - Decision routing
 * - Auto-execution
 * - Approval queue
 * - Notifications
 * - Audit logging
 */
declare class AutonomyEngine extends EventEmitter<AutonomyEngineEvents> {
    private logger;
    private config;
    private router;
    private executor;
    private approvalQueue;
    private batchApproval;
    private notifications;
    private audit;
    private running;
    constructor(config?: Partial<AutonomyConfig>);
    /**
     * Start the autonomy engine
     */
    start(): void;
    /**
     * Stop the autonomy engine
     */
    stop(): void;
    /**
     * Route an action through the autonomy system
     */
    route(action: Action): Promise<Decision>;
    /**
     * Approve a pending request
     */
    approve(requestId: string, approvedBy?: string, feedback?: string): Promise<ApprovalRequest | null>;
    /**
     * Reject a pending request
     */
    reject(requestId: string, reason: string, rejectedBy?: string): Promise<ApprovalRequest | null>;
    /**
     * Get pending approval queue
     */
    getQueue(): ApprovalRequest[];
    /**
     * Get batch approval interface
     */
    getBatch(): BatchApproval;
    /**
     * Get current boundaries
     */
    getBoundaries(): Boundaries;
    /**
     * Update boundaries at runtime
     */
    updateBoundaries(updates: Partial<Boundaries>): void;
    /**
     * Get usage statistics for today
     */
    getUsageToday(): {
        trades: number;
        content: number;
        builds: number;
        spending: number;
    };
    /**
     * Get queue statistics
     */
    getQueueStats(): {
        total: number;
        pending: number;
        byUrgency: Record<Urgency, number>;
        oldestAge: number;
        avgWaitTime: number;
    };
    /**
     * Get audit entries
     */
    getAuditLog(): {
        type: "approved" | "executed" | "rejected" | "escalated" | "action_received" | "risk_assessed" | "decision_made" | "queued_approval" | "execution_failed" | "rolled_back" | "boundary_violation";
        id: string;
        actionId: string;
        timestamp: number;
        data: Record<string, unknown>;
        hash: string;
        previousHash: string;
        decisionId?: string | undefined;
    }[];
    /**
     * Get executor stats
     */
    getExecutorStats(): {
        totalExecutions: number;
        currentlyExecuting: number;
        failedInCooldown: number;
    };
    /**
     * Check if engine is running
     */
    isRunning(): boolean;
    /**
     * Get autonomy level
     */
    getLevel(): number;
    /**
     * Get full status
     */
    getStatus(): {
        running: boolean;
        level: number;
        queue: ReturnType<ApprovalQueue["getStats"]>;
        usage: DailyUsage;
        executor: ReturnType<AutoExecutor["getStats"]>;
        audit: ReturnType<AuditLogger["getStats"]>;
    };
    private setupEventHandlers;
    private handleAutoExecute;
    private handleQueueApproval;
    private handleEscalate;
}
/**
 * Get or create the autonomy engine singleton
 */
declare function getAutonomy(config?: Partial<AutonomyConfig>): AutonomyEngine;
/**
 * Reset the singleton (for testing)
 */
declare function resetAutonomy(): void;

export { ALWAYS_REQUIRE_APPROVAL, AUDIT_CONFIG, Action, ActionCategory, ApprovalQueue, ApprovalRequest, AuditLogger, AutoExecutor, AutonomyConfig, AutonomyEngine, type AutonomyEngineEvents, AutonomyEngine as AutonomySystem, BatchApproval, Boundaries, CATEGORY_BASE_RISK, DANGEROUS_ACTION_TYPES, DEFAULT_BOUNDARIES, DEFAULT_CONFIG, DailyUsage, Decision, ESCALATION_RULES, ExecutionResult, FINANCIAL_RISK_THRESHOLDS, RATE_LIMITS, RISK_FACTOR_WEIGHTS, RISK_LEVEL_OUTCOMES, RISK_SCORE_THRESHOLDS, RiskLevel, SAFE_ACTION_TYPES, URGENCY_PRIORITY, Urgency, createConfig, getAutonomy, loadConfigFromEnv, resetAutonomy };
