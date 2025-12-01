import { EventEmitter } from 'eventemitter3';
import { b as Action, D as Decision, E as ExecutionResult, j as EngineType, a as ActionCategory, U as Urgency } from './types-BSLNoyKE.js';

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

export { type BlogParams as B, type CommitParams as C, type DCATradeParams as D, EngineAdapter as E, GrowthEngineAdapter as G, Logger as L, MoneyEngineAdapter as M, ProductEngineAdapter as P, type SwapParams as S, type TweetParams as T, type EngineAdapterConfig as a, type EngineAdapterEvents as b, type ExpenseParams as c, type DiscordAnnouncementParams as d, type BuildParams as e, type DeployParams as f };
