import { EventEmitter } from 'eventemitter3';
import { b as Action, D as Decision, E as ExecutionResult, j as EngineType, a as ActionCategory, U as Urgency } from './types-BSLNoyKE.js';
import { z } from 'zod';

/**
 * Logger utility for Autonomy package
 */
declare class Logger {
    private logger;
    constructor(context: string);
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
    debug(message: string, data?: Record<string, unknown>): void;
}

/**
 * Base Engine Adapter for Level 2 Autonomy
 *
 * Abstract base class for integrating engines with autonomy system.
 * Engines can optionally use autonomy by importing and creating an adapter.
 */

interface EngineAdapterConfig {
    engineName: string;
    engineType: EngineType;
    defaultCategory: ActionCategory;
}
interface EngineAdapterEvents {
    "action:submitted": (action: Action) => void;
    "decision:received": (decision: Decision) => void;
    "execution:completed": (result: ExecutionResult) => void;
}
/**
 * Base adapter that engines can extend or use directly
 */
declare abstract class EngineAdapter extends EventEmitter<EngineAdapterEvents> {
    protected logger: Logger;
    protected config: EngineAdapterConfig;
    protected actionCount: number;
    constructor(config: EngineAdapterConfig);
    /**
     * Create an action from engine-specific data
     */
    createAction(params: {
        type: string;
        description: string;
        payload: Record<string, unknown>;
        estimatedValue?: number;
        reversible?: boolean;
        urgency?: Urgency;
        linesChanged?: number;
        filesChanged?: number;
    }): Action;
    /**
     * Map action type to category (override in subclasses)
     */
    protected getCategoryForType(actionType: string): ActionCategory;
    /**
     * Get engine name
     */
    getEngineName(): string;
    /**
     * Get engine type
     */
    getEngineType(): EngineType;
    /**
     * Get action count
     */
    getActionCount(): number;
}

/**
 * Money Engine Adapter
 *
 * Integrates MoneyEngine with autonomy system for:
 * - DCA trades
 * - Token swaps
 * - Expense payments
 */

interface DCATradeParams {
    token: string;
    amount: number;
    botType?: string;
}
interface SwapParams {
    fromToken: string;
    toToken: string;
    amount: number;
}
interface ExpenseParams {
    category: string;
    description: string;
    amount: number;
    recurring?: boolean;
}
declare class MoneyEngineAdapter extends EngineAdapter {
    constructor();
    /**
     * Create DCA trade action
     */
    createDCAAction(params: DCATradeParams): Action;
    /**
     * Create token swap action
     */
    createSwapAction(params: SwapParams): Action;
    /**
     * Create expense payment action
     */
    createExpenseAction(params: ExpenseParams): Action;
    /**
     * Create rebalance action
     */
    createRebalanceAction(targetAllocations: Record<string, number>): Action;
    protected getCategoryForType(actionType: string): ActionCategory;
}

/**
 * Growth Engine Adapter
 *
 * Integrates GrowthEngine with autonomy system for:
 * - Tweet generation/posting
 * - Blog generation/publishing
 * - Discord announcements
 */

interface TweetParams {
    content: string;
    threadId?: string;
    scheduledFor?: number;
}
interface BlogParams {
    title: string;
    topic: string;
    keywords?: string[];
    draft?: boolean;
}
interface DiscordAnnouncementParams {
    channel: string;
    message: string;
    embed?: {
        title: string;
        description: string;
        color?: number;
    };
}
declare class GrowthEngineAdapter extends EngineAdapter {
    constructor();
    /**
     * Create tweet action
     */
    createTweetAction(params: TweetParams): Action;
    /**
     * Create blog draft action
     */
    createBlogDraftAction(params: BlogParams): Action;
    /**
     * Create blog publish action
     */
    createBlogPublishAction(params: BlogParams): Action;
    /**
     * Create Discord announcement action
     */
    createDiscordAction(params: DiscordAnnouncementParams): Action;
    /**
     * Create thread of tweets action
     */
    createTwitterThreadAction(tweets: string[]): Action;
    protected getCategoryForType(actionType: string): ActionCategory;
}

/**
 * Product Engine Adapter
 *
 * Integrates ProductEngine with autonomy system for:
 * - Agent building
 * - Code commits
 * - Deployments
 */

interface BuildParams {
    opportunityId: string;
    name: string;
    type: "agent" | "component" | "service";
    templateType?: string;
}
interface CommitParams {
    message: string;
    files: string[];
    linesAdded: number;
    linesRemoved: number;
}
interface DeployParams {
    target: "staging" | "production";
    package: string;
    version: string;
}
declare class ProductEngineAdapter extends EngineAdapter {
    constructor();
    /**
     * Create agent build action
     */
    createBuildAction(params: BuildParams): Action;
    /**
     * Create code commit action
     */
    createCommitAction(params: CommitParams): Action;
    /**
     * Create staging deployment action
     */
    createStagingDeployAction(params: Omit<DeployParams, "target">): Action;
    /**
     * Create production deployment action
     */
    createProductionDeployAction(params: Omit<DeployParams, "target">): Action;
    /**
     * Create quality gate action
     */
    createQualityGateAction(params: {
        package: string;
        testScore: number;
        reviewScore: number;
    }): Action;
    protected getCategoryForType(actionType: string): ActionCategory;
}

/**
 * Types for Claude Code Workflow Integration
 *
 * Defines action types, contexts, and tracking structures
 * for routing Claude Code actions through the autonomy system.
 */

declare const ClaudeCodeActionType: {
    readonly ADD_TEST: "claude_add_test";
    readonly FIX_LINT: "claude_fix_lint";
    readonly UPDATE_DOCS: "claude_update_docs";
    readonly ADD_COMMENTS: "claude_add_comments";
    readonly FORMAT_CODE: "claude_format_code";
    readonly ADD_TYPE: "claude_add_type";
    readonly UPDATE_README: "claude_update_readme";
    readonly ADD_EXAMPLE: "claude_add_example";
    readonly MODIFY_FUNCTION: "claude_modify_function";
    readonly ADD_FEATURE: "claude_add_feature";
    readonly REFACTOR: "claude_refactor";
    readonly CHANGE_API: "claude_change_api";
    readonly MODIFY_CORE: "claude_modify_core";
    readonly MODIFY_CONFIG: "claude_modify_config";
    readonly PRODUCTION_DEPLOY: "claude_production_deploy";
    readonly DELETE_DATA: "claude_delete_data";
    readonly MODIFY_AUTH: "claude_modify_auth";
};
type ClaudeCodeActionType = (typeof ClaudeCodeActionType)[keyof typeof ClaudeCodeActionType];
declare const ClaudeCodeContextSchema: z.ZodObject<{
    /** File being modified */
    filePath: z.ZodString;
    /** Package name if in a package */
    packageName: z.ZodOptional<z.ZodString>;
    /** Is this a core infrastructure file? */
    isCore: z.ZodDefault<z.ZodBoolean>;
    /** Is this a test file? */
    isTest: z.ZodDefault<z.ZodBoolean>;
    /** Lines added */
    linesAdded: z.ZodDefault<z.ZodNumber>;
    /** Lines removed */
    linesRemoved: z.ZodDefault<z.ZodNumber>;
    /** Affects public API? */
    affectsPublicApi: z.ZodDefault<z.ZodBoolean>;
    /** Affects database? */
    affectsDatabase: z.ZodDefault<z.ZodBoolean>;
    /** Affects authentication? */
    affectsAuth: z.ZodDefault<z.ZodBoolean>;
    /** Affects production? */
    affectsProduction: z.ZodDefault<z.ZodBoolean>;
    /** Number of files changed */
    filesChanged: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    filePath: string;
    isCore: boolean;
    isTest: boolean;
    affectsPublicApi: boolean;
    affectsDatabase: boolean;
    affectsAuth: boolean;
    affectsProduction: boolean;
    packageName?: string | undefined;
}, {
    filePath: string;
    filesChanged?: number | undefined;
    linesAdded?: number | undefined;
    linesRemoved?: number | undefined;
    packageName?: string | undefined;
    isCore?: boolean | undefined;
    isTest?: boolean | undefined;
    affectsPublicApi?: boolean | undefined;
    affectsDatabase?: boolean | undefined;
    affectsAuth?: boolean | undefined;
    affectsProduction?: boolean | undefined;
}>;
type ClaudeCodeContext = z.infer<typeof ClaudeCodeContextSchema>;
declare const WorkflowActionType: {
    readonly WORKFLOW_CREATE: "workflow_create";
    readonly WORKFLOW_RUN: "workflow_run";
    readonly WORKFLOW_STEP: "workflow_step";
    readonly WORKFLOW_COMPLETE: "workflow_complete";
};
type WorkflowActionType = (typeof WorkflowActionType)[keyof typeof WorkflowActionType];
declare const WorkflowContextSchema: z.ZodObject<{
    workflowId: z.ZodString;
    workflowName: z.ZodString;
    executionId: z.ZodOptional<z.ZodString>;
    stepId: z.ZodOptional<z.ZodString>;
    stepAgent: z.ZodOptional<z.ZodString>;
    aggregateRiskScore: z.ZodDefault<z.ZodNumber>;
    steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        agent: z.ZodString;
        riskScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        riskScore: number;
        agent: string;
    }, {
        riskScore: number;
        agent: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    workflowId: string;
    workflowName: string;
    aggregateRiskScore: number;
    steps?: {
        riskScore: number;
        agent: string;
    }[] | undefined;
    stepId?: string | undefined;
    executionId?: string | undefined;
    stepAgent?: string | undefined;
}, {
    workflowId: string;
    workflowName: string;
    steps?: {
        riskScore: number;
        agent: string;
    }[] | undefined;
    stepId?: string | undefined;
    executionId?: string | undefined;
    stepAgent?: string | undefined;
    aggregateRiskScore?: number | undefined;
}>;
type WorkflowContext = z.infer<typeof WorkflowContextSchema>;
declare const DailyImprovementSchema: z.ZodObject<{
    id: z.ZodString;
    actionType: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    value: z.ZodDefault<z.ZodNumber>;
    autoExecuted: z.ZodBoolean;
    timestamp: z.ZodNumber;
    filePath: z.ZodOptional<z.ZodString>;
    packageName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: number;
    id: string;
    timestamp: number;
    title: string;
    actionType: string;
    autoExecuted: boolean;
    description?: string | undefined;
    filePath?: string | undefined;
    packageName?: string | undefined;
}, {
    id: string;
    timestamp: number;
    title: string;
    actionType: string;
    autoExecuted: boolean;
    value?: number | undefined;
    description?: string | undefined;
    filePath?: string | undefined;
    packageName?: string | undefined;
}>;
type DailyImprovement = z.infer<typeof DailyImprovementSchema>;
declare const ImprovementStatsSchema: z.ZodObject<{
    date: z.ZodString;
    totalImprovements: z.ZodNumber;
    autoExecuted: z.ZodNumber;
    queued: z.ZodNumber;
    escalated: z.ZodNumber;
    totalValue: z.ZodNumber;
    byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byPackage: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    escalated: number;
    date: string;
    queued: number;
    autoExecuted: number;
    totalImprovements: number;
    totalValue: number;
    byType: Record<string, number>;
    byPackage: Record<string, number>;
}, {
    escalated: number;
    date: string;
    queued: number;
    autoExecuted: number;
    totalImprovements: number;
    totalValue: number;
    byType: Record<string, number>;
    byPackage: Record<string, number>;
}>;
type ImprovementStats = z.infer<typeof ImprovementStatsSchema>;
interface WorkflowAdapterEvents {
    "improvement:recorded": (improvement: DailyImprovement) => void;
    "win:published": (improvement: DailyImprovement) => void;
    "boundary:exceeded": (type: string, current: number, limit: number) => void;
    "action:safe": (actionType: string, riskScore: number) => void;
    "action:risky": (actionType: string, riskScore: number) => void;
}

/**
 * Constants for Claude Code Workflow Integration
 *
 * Defines risk scores, safe actions, and boundaries
 * for the ClaudeWorkflowAdapter.
 */
declare const CLAUDE_ACTION_BASE_RISK: Record<string, number>;
declare const CONTEXT_RISK_MODIFIERS: {
    /** File is in core infrastructure */
    isCore: number;
    /** Change affects public API */
    affectsPublicApi: number;
    /** Change affects database */
    affectsDatabase: number;
    /** Change affects authentication */
    affectsAuth: number;
    /** Change affects production */
    affectsProduction: number;
    /** Large change (>100 lines) */
    largeChange: number;
    /** Multi-file change (>5 files) */
    multiFile: number;
};
declare const SAFE_CLAUDE_ACTIONS: ("claude_add_test" | "claude_fix_lint" | "claude_update_docs" | "claude_add_comments" | "claude_format_code" | "claude_add_type" | "claude_update_readme" | "claude_add_example")[];
declare const DANGEROUS_CLAUDE_ACTIONS: ("claude_production_deploy" | "claude_delete_data" | "claude_modify_auth")[];
declare const DEFAULT_WORKFLOW_BOUNDARIES: {
    /** Max auto improvements per day */
    maxDailyAutoImprovements: number;
    /** Max auto test additions per day */
    maxDailyAutoTests: number;
    /** Max auto lint fixes per day */
    maxDailyAutoLintFixes: number;
    /** Max auto doc updates per day */
    maxDailyAutoDocUpdates: number;
    /** Max lines changed for auto-execute */
    maxAutoLinesChanged: number;
    /** Max files changed for auto-execute */
    maxAutoFilesChanged: number;
    /** Max concurrent workflows */
    maxConcurrentWorkflows: number;
    /** Max steps in a workflow */
    maxWorkflowSteps: number;
    /** Restricted paths require approval */
    restrictedPaths: string[];
    /** Restricted packages require approval */
    restrictedPackages: string[];
};
declare const IMPROVEMENT_VALUE: Record<string, number>;
declare const RISK_THRESHOLDS: {
    /** Safe: auto-execute */
    safe: number;
    /** Low: auto-execute with logging */
    low: number;
    /** Medium: queue for approval */
    medium: number;
    /** High: escalate */
    high: number;
    /** Critical: reject or escalate */
    critical: number;
};

/**
 * ClaudeWorkflowAdapter - Deep Autonomy Integration
 *
 * Routes Claude Code actions through the autonomy system for:
 * - Auto-execution of safe improvements
 * - Queuing risky changes for approval
 * - Tracking daily improvements and wins
 */

declare class ClaudeWorkflowAdapter {
    private dailyImprovements;
    private dailyCounters;
    private lastResetDate;
    private emitter;
    private boundaries;
    private actionCount;
    constructor();
    getEngineName(): string;
    getEngineType(): string;
    getCategoryForType(actionType: string): ActionCategory;
    private createAction;
    createEditAction(params: {
        actionType: string;
        title: string;
        description?: string;
        context: Partial<ClaudeCodeContext>;
    }): Action;
    createAddTestAction(params: {
        testFile: string;
        targetFile: string;
        testCount?: number;
    }): Action;
    createFixLintAction(params: {
        filePath: string;
        issueCount?: number;
    }): Action;
    createUpdateDocsAction(params: {
        filePath: string;
        description?: string;
    }): Action;
    createModifyFunctionAction(params: {
        filePath: string;
        functionName: string;
        linesChanged: number;
        context?: Partial<ClaudeCodeContext>;
    }): Action;
    createDeployAction(params: {
        environment: "staging" | "production";
        service?: string;
    }): Action;
    createWorkflowRunAction(params: WorkflowContext): Action;
    calculateClaudeRisk(actionType: string, context: ClaudeCodeContext): number;
    isSafeAction(actionType: string, context: ClaudeCodeContext, riskScore: number): boolean;
    private isRestrictedPath;
    private isRestrictedPackage;
    private isReversibleAction;
    private getImprovementValue;
    private resetDailyCounters;
    private checkDailyLimit;
    private incrementDailyCounter;
    recordImprovement(action: Action, autoExecuted: boolean): DailyImprovement;
    getImprovementStats(): ImprovementStats;
    getDailyImprovements(): DailyImprovement[];
    updateBoundaries(newBoundaries: Partial<typeof DEFAULT_WORKFLOW_BOUNDARIES>): void;
    getBoundaries(): typeof DEFAULT_WORKFLOW_BOUNDARIES;
    on<K extends keyof WorkflowAdapterEvents>(event: K, listener: WorkflowAdapterEvents[K]): this;
    off<K extends keyof WorkflowAdapterEvents>(event: K, listener: WorkflowAdapterEvents[K]): this;
    getActionCount(): number;
}
declare function getWorkflowAdapter(): ClaudeWorkflowAdapter;

export { type BlogParams as B, type CommitParams as C, type DCATradeParams as D, EngineAdapter as E, GrowthEngineAdapter as G, ImprovementStatsSchema as I, Logger as L, MoneyEngineAdapter as M, ProductEngineAdapter as P, RISK_THRESHOLDS as R, type SwapParams as S, type TweetParams as T, WorkflowActionType as W, type EngineAdapterConfig as a, type EngineAdapterEvents as b, type ExpenseParams as c, type DiscordAnnouncementParams as d, type BuildParams as e, type DeployParams as f, ClaudeWorkflowAdapter as g, getWorkflowAdapter as h, ClaudeCodeActionType as i, ClaudeCodeContextSchema as j, type ClaudeCodeContext as k, WorkflowContextSchema as l, type WorkflowContext as m, DailyImprovementSchema as n, type DailyImprovement as o, type ImprovementStats as p, type WorkflowAdapterEvents as q, CLAUDE_ACTION_BASE_RISK as r, CONTEXT_RISK_MODIFIERS as s, SAFE_CLAUDE_ACTIONS as t, DANGEROUS_CLAUDE_ACTIONS as u, DEFAULT_WORKFLOW_BOUNDARIES as v, IMPROVEMENT_VALUE as w };
