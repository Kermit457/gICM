import { EventEmitter } from 'eventemitter3';
import { P as PTCEvents, a as PTCConfig, T as ToolDefinition, b as ToolHandler, c as Pipeline, V as ValidationResult, d as PipelineResult } from './index-BXkXZovC.js';
export { D as DEFAULT_PTC_CONFIG, o as PIPELINE_TEMPLATES, m as PipelineResultSchema, h as PipelineSchema, e as PipelineStep, i as PipelineStepSchema, f as SharedContext, k as SharedContextSchema, S as StepResult, l as StepResultSchema, j as ToolDefinitionSchema, g as ToolRegistry, n as ValidationResultSchema, u as contentGeneration, p as getTemplate, q as listTemplates, r as listTemplatesByCategory, w as portfolioAnalysis, s as researchAndAnalyze, v as securityAudit, t as swapToken } from './index-BXkXZovC.js';
import 'zod';

/**
 * PTC Coordinator - Programmatic Tool Calling
 *
 * Orchestrates gICM agents via generated code pipelines instead of
 * individual tool calls. Achieves 37% token reduction by batching
 * tool invocations and only surfacing final results.
 */

declare class PTCCoordinator extends EventEmitter<PTCEvents> {
    private config;
    private registry;
    constructor(config?: Partial<PTCConfig>);
    /**
     * Register a tool with its handler
     */
    registerTool(tool: ToolDefinition, handler: ToolHandler): void;
    /**
     * Validate a pipeline before execution
     */
    validate(pipeline: Pipeline): ValidationResult;
    /**
     * Execute a pipeline
     */
    execute(pipeline: Pipeline, inputs?: Record<string, unknown>): Promise<PipelineResult>;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Resolve input references like ${results.step1.value}
     */
    private resolveInputs;
    /**
     * Topological sort for execution order
     */
    private topologicalSort;
    /**
     * Determine overall pipeline status
     */
    private determineStatus;
    /**
     * Extract final output based on pipeline outputs config
     */
    private extractFinalOutput;
    /**
     * Generate a pipeline from natural language intent
     */
    generateFromIntent(intent: string, availableTools: ToolDefinition[]): Pipeline;
}

/**
 * Hunter Agent PTC Tool Handler
 *
 * Wraps the Hunter Agent for use in PTC pipelines.
 * Enables discovery → scoring → filtering workflows.
 */

declare const hunterToolDefinition: ToolDefinition;
declare const hunterScoreToolDefinition: ToolDefinition;
declare const hunterFilterToolDefinition: ToolDefinition;
declare const hunterTools: {
    definitions: {
        name: string;
        description: string;
        input_schema: {
            type: "object";
            properties: Record<string, {
                description: string;
                type: string;
                enum?: string[] | undefined;
            }>;
            required: string[];
        };
    }[];
    createHandlers: (hunterFactory: () => Promise<{
        huntNow: (sources?: string[]) => Promise<unknown[]>;
    }>) => {
        hunter_discover: ToolHandler;
        hunter_score: ToolHandler;
        hunter_filter: ToolHandler;
    };
};

/**
 * Money Engine PTC Tool Handler
 *
 * Wraps the Money Engine for use in PTC pipelines.
 * Enables DCA trading with autonomy integration.
 */

declare const dcaTradeToolDefinition: ToolDefinition;
declare const treasuryStatusToolDefinition: ToolDefinition;
declare const expenseStatusToolDefinition: ToolDefinition;
declare const healthCheckToolDefinition: ToolDefinition;
declare const moneyEngineTools: {
    definitions: {
        name: string;
        description: string;
        input_schema: {
            type: "object";
            properties: Record<string, {
                description: string;
                type: string;
                enum?: string[] | undefined;
            }>;
            required: string[];
        };
    }[];
    createHandlers: (moneyEngineFactory: () => Promise<any>, autonomyCheck?: (action: any) => Promise<{
        approved: boolean;
        reason?: string;
        requiresApproval?: boolean;
    }>) => {
        money_dca_trade: ToolHandler;
        money_treasury_status: ToolHandler;
        money_expenses: ToolHandler;
        money_health_check: ToolHandler;
    };
};

/**
 * Growth Engine PTC Tool Handler
 *
 * Wraps the Growth Engine for use in PTC pipelines.
 * Enables content generation workflows: Blog → SEO → Twitter.
 */

declare const blogGenerateToolDefinition: ToolDefinition;
declare const tweetGenerateToolDefinition: ToolDefinition;
declare const keywordResearchToolDefinition: ToolDefinition;
declare const seoAnalyzeToolDefinition: ToolDefinition;
declare const contentCalendarToolDefinition: ToolDefinition;
declare const discordAnnounceToolDefinition: ToolDefinition;
declare const growthEngineTools: {
    definitions: {
        name: string;
        description: string;
        input_schema: {
            type: "object";
            properties: Record<string, {
                description: string;
                type: string;
                enum?: string[] | undefined;
            }>;
            required: string[];
        };
    }[];
    createHandlers: (growthEngineFactory: () => Promise<any>) => {
        growth_generate_blog: ToolHandler;
        growth_generate_tweets: ToolHandler;
        growth_keyword_research: ToolHandler;
        growth_seo_analyze: ToolHandler;
        growth_content_calendar: ToolHandler;
        growth_discord_announce: ToolHandler;
    };
};

/**
 * Autonomy Engine PTC Tool Handler
 *
 * Provides risk classification and approval workflows for PTC pipelines.
 * Gates high-risk operations and enforces boundaries.
 */

declare const classifyRiskToolDefinition: ToolDefinition;
declare const checkApprovalToolDefinition: ToolDefinition;
declare const checkBoundariesToolDefinition: ToolDefinition;
declare const logAuditToolDefinition: ToolDefinition;
declare const autonomyStatusToolDefinition: ToolDefinition;
declare const autonomyTools: {
    definitions: {
        name: string;
        description: string;
        input_schema: {
            type: "object";
            properties: Record<string, {
                description: string;
                type: string;
                enum?: string[] | undefined;
            }>;
            required: string[];
        };
    }[];
    createHandlers: (autonomyEngineFactory?: () => Promise<any>) => {
        autonomy_classify_risk: ToolHandler;
        autonomy_check_approval: ToolHandler;
        autonomy_check_boundaries: ToolHandler;
        autonomy_log_audit: ToolHandler;
        autonomy_status: ToolHandler;
    };
};

/**
 * PTC Tool Handlers Index
 *
 * Exports all tool definitions and handlers for PTC pipelines.
 * These tools wrap gICM engines for orchestrated execution.
 */

/**
 * Get all tool definitions
 */
declare function getAllToolDefinitions(): ToolDefinition[];
/**
 * Create all tool handlers with factory functions
 */
declare function createAllHandlers(factories: {
    hunterAgent?: () => Promise<{
        huntNow: (sources?: string[]) => Promise<unknown[]>;
    }>;
    moneyEngine?: () => Promise<any>;
    growthEngine?: () => Promise<any>;
    autonomyEngine?: () => Promise<any>;
    autonomyCheck?: (action: any) => Promise<{
        approved: boolean;
        reason?: string;
        requiresApproval?: boolean;
    }>;
}): Record<string, ToolHandler>;
/**
 * Tool categories for UI organization
 */
declare const toolCategories: {
    hunter: {
        name: string;
        description: string;
        tools: string[];
        icon: string;
    };
    money: {
        name: string;
        description: string;
        tools: string[];
        icon: string;
    };
    growth: {
        name: string;
        description: string;
        tools: string[];
        icon: string;
    };
    autonomy: {
        name: string;
        description: string;
        tools: string[];
        icon: string;
    };
};
/**
 * Pre-built pipeline templates using these tools
 */
declare const pipelineTemplates: {
    researchAndAnalyze: {
        id: string;
        name: string;
        description: string;
        steps: ({
            id: string;
            tool: string;
            inputs: {
                sources: string;
                discoveries?: undefined;
                minScore?: undefined;
                limit?: undefined;
            };
            dependsOn?: undefined;
        } | {
            id: string;
            tool: string;
            inputs: {
                discoveries: string;
                sources?: undefined;
                minScore?: undefined;
                limit?: undefined;
            };
            dependsOn: string[];
        } | {
            id: string;
            tool: string;
            inputs: {
                discoveries: string;
                minScore: string;
                limit: string;
                sources?: undefined;
            };
            dependsOn: string[];
        })[];
        metadata: {
            category: string;
            riskLevel: string;
            tags: string[];
        };
    };
    contentGeneration: {
        id: string;
        name: string;
        description: string;
        steps: ({
            id: string;
            tool: string;
            inputs: {
                topic: string;
                depth: string;
                keywords?: undefined;
                content?: undefined;
                targetKeywords?: undefined;
                count?: undefined;
                style?: undefined;
            };
            dependsOn?: undefined;
        } | {
            id: string;
            tool: string;
            inputs: {
                topic: string;
                keywords: string;
                depth?: undefined;
                content?: undefined;
                targetKeywords?: undefined;
                count?: undefined;
                style?: undefined;
            };
            dependsOn: string[];
        } | {
            id: string;
            tool: string;
            inputs: {
                content: string;
                targetKeywords: string;
                topic?: undefined;
                depth?: undefined;
                keywords?: undefined;
                count?: undefined;
                style?: undefined;
            };
            dependsOn: string[];
        } | {
            id: string;
            tool: string;
            inputs: {
                topic: string;
                count: string;
                style: string;
                depth?: undefined;
                keywords?: undefined;
                content?: undefined;
                targetKeywords?: undefined;
            };
            dependsOn: string[];
        })[];
        metadata: {
            category: string;
            riskLevel: string;
            tags: string[];
        };
    };
    dcaWithAutonomy: {
        id: string;
        name: string;
        description: string;
        steps: ({
            id: string;
            tool: string;
            inputs: {
                action: string;
                category: string;
                estimatedImpact: string;
                boundaryType?: undefined;
                value?: undefined;
                asset?: undefined;
                amountUsd?: undefined;
                mode?: undefined;
                result?: undefined;
            };
            dependsOn?: undefined;
            condition?: undefined;
        } | {
            id: string;
            tool: string;
            inputs: {
                boundaryType: string;
                value: string;
                action?: undefined;
                category?: undefined;
                estimatedImpact?: undefined;
                asset?: undefined;
                amountUsd?: undefined;
                mode?: undefined;
                result?: undefined;
            };
            dependsOn: string[];
            condition?: undefined;
        } | {
            id: string;
            tool: string;
            inputs: {
                asset: string;
                amountUsd: string;
                mode: string;
                action?: undefined;
                category?: undefined;
                estimatedImpact?: undefined;
                boundaryType?: undefined;
                value?: undefined;
                result?: undefined;
            };
            dependsOn: string[];
            condition: string;
        } | {
            id: string;
            tool: string;
            inputs: {
                action: string;
                result: string;
                category?: undefined;
                estimatedImpact?: undefined;
                boundaryType?: undefined;
                value?: undefined;
                asset?: undefined;
                amountUsd?: undefined;
                mode?: undefined;
            };
            dependsOn: string[];
            condition?: undefined;
        })[];
        metadata: {
            category: string;
            riskLevel: string;
            tags: string[];
        };
    };
    financialHealthCheck: {
        id: string;
        name: string;
        description: string;
        steps: ({
            id: string;
            tool: string;
            inputs: {
                days?: undefined;
            };
            dependsOn?: undefined;
        } | {
            id: string;
            tool: string;
            inputs: {
                days: string;
            };
            dependsOn?: undefined;
        } | {
            id: string;
            tool: string;
            inputs: {
                days?: undefined;
            };
            dependsOn: string[];
        })[];
        metadata: {
            category: string;
            riskLevel: string;
            tags: string[];
        };
    };
    fullDiscovery: {
        id: string;
        name: string;
        description: string;
        steps: ({
            id: string;
            tool: string;
            inputs: {
                discoveries?: undefined;
                minScore?: undefined;
                limit?: undefined;
                topic?: undefined;
                count?: undefined;
                style?: undefined;
            };
            dependsOn?: undefined;
        } | {
            id: string;
            tool: string;
            inputs: {
                discoveries: string;
                minScore?: undefined;
                limit?: undefined;
                topic?: undefined;
                count?: undefined;
                style?: undefined;
            };
            dependsOn: string[];
        } | {
            id: string;
            tool: string;
            inputs: {
                discoveries: string;
                minScore: string;
                limit: string;
                topic?: undefined;
                count?: undefined;
                style?: undefined;
            };
            dependsOn: string[];
        } | {
            id: string;
            tool: string;
            inputs: {
                topic: string;
                count: string;
                style: string;
                discoveries?: undefined;
                minScore?: undefined;
                limit?: undefined;
            };
            dependsOn: string[];
        })[];
        metadata: {
            category: string;
            riskLevel: string;
            tags: string[];
        };
    };
};

export { PTCConfig, PTCCoordinator, PTCEvents, Pipeline, PipelineResult, ToolDefinition, ToolHandler, ValidationResult, autonomyStatusToolDefinition, autonomyTools, blogGenerateToolDefinition, checkApprovalToolDefinition, checkBoundariesToolDefinition, classifyRiskToolDefinition, contentCalendarToolDefinition, createAllHandlers, dcaTradeToolDefinition, discordAnnounceToolDefinition, expenseStatusToolDefinition, getAllToolDefinitions, growthEngineTools, healthCheckToolDefinition, hunterFilterToolDefinition, hunterScoreToolDefinition, hunterToolDefinition, hunterTools, keywordResearchToolDefinition, logAuditToolDefinition, moneyEngineTools, pipelineTemplates, seoAnalyzeToolDefinition, toolCategories, treasuryStatusToolDefinition, tweetGenerateToolDefinition };
