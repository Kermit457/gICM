import { M as ModeName, a as Mode, b as ModeContext } from './boot-sequence-yR7xXB1L.js';
export { B as BootConfig, D as DetectionResult, e as ModeSelector, S as SystemStatus, d as detectMode, f as formatModeDisplay, k as generateAgentSpawnNotification, h as generateBootScreen, n as generateHelpScreen, o as generateInlineStatus, j as generateModeSwitchNotification, i as generateStatusLine, c as getAllModes, g as getMode, l as loadModeRegistry, m as modeSelector } from './boot-sequence-yR7xXB1L.js';
import { EventEmitter } from 'eventemitter3';

/**
 * OPUS 67 Skill Loader
 * Automatically loads relevant skills based on context
 */
interface Skill {
    id: string;
    name: string;
    tier: 1 | 2 | 3;
    token_cost: number;
    capabilities: string[];
    auto_load_when: {
        keywords?: string[];
        file_types?: string[];
        directories?: string[];
        task_patterns?: string[];
    };
    mcp_connections: string[];
}
interface LoadContext {
    query: string;
    activeFiles?: string[];
    currentDirectory?: string;
    taskType?: 'code' | 'architecture' | 'data' | 'content' | 'ops';
}
interface LoadResult {
    skills: Skill[];
    totalTokenCost: number;
    mcpConnections: string[];
    reason: string[];
}
/**
 * Load skills based on context
 */
declare function loadSkills(context: LoadContext): LoadResult;
/**
 * Load a specific skill combination
 */
declare function loadCombination(combinationId: string): LoadResult;
/**
 * Format loaded skills for prompt injection
 */
declare function formatSkillsForPrompt(result: LoadResult): string;

/**
 * OPUS 67 MCP Hub
 * Manages connections to external data sources
 */
interface MCPConnection {
    name: string;
    type: 'rest_api' | 'graphql' | 'mcp_server' | 'custom_mcp';
    category: string;
    priority: number;
    description: string;
    base_url?: string;
    connection?: {
        type: string;
        command?: string;
        args?: string[];
    };
    auth: {
        type: string;
        env_var?: string;
        header?: string;
    };
    capabilities: string[];
    rate_limit?: {
        requests_per_second?: number;
        requests_per_minute?: number;
        requests_per_day?: number;
    };
    pricing: {
        tier: string;
        free_limit: string;
        paid_starts?: string;
    };
    auto_connect_when: {
        keywords?: string[];
        skills?: string[];
    };
}
/**
 * Get all connections as flat list
 */
declare function getAllConnections(): Array<{
    id: string;
    connection: MCPConnection;
}>;
/**
 * Find connections that match given skills
 */
declare function getConnectionsForSkills(skillIds: string[]): Array<{
    id: string;
    connection: MCPConnection;
}>;
/**
 * Find connections that match given keywords
 */
declare function getConnectionsForKeywords(keywords: string[]): Array<{
    id: string;
    connection: MCPConnection;
}>;
/**
 * Format connections for prompt context
 */
declare function formatConnectionsForPrompt(connections: Array<{
    id: string;
    connection: MCPConnection;
}>): string;
/**
 * Generate connection code snippet
 */
declare function generateConnectionCode(id: string): string;

/**
 * OPUS 67 Autonomy Logger
 * Logs interactions for pattern analysis and self-improvement
 */

interface InteractionLog {
    id: string;
    timestamp: Date;
    task: string;
    taskType: 'code' | 'architecture' | 'data' | 'content' | 'ops';
    skillsLoaded: string[];
    skillsUsed: string[];
    mcpsConnected: string[];
    mcpsUsed: string[];
    success: boolean;
    executionTimeMs: number;
    tokenCost: number;
    userFeedback?: 'positive' | 'negative' | 'neutral';
    errorMessage?: string;
    metadata?: Record<string, unknown>;
}
interface PatternAnalysis {
    skillUsagePatterns: Array<{
        skill: string;
        usageCount: number;
        successRate: number;
        avgExecutionTime: number;
    }>;
    mcpUsagePatterns: Array<{
        mcp: string;
        usageCount: number;
        errorRate: number;
    }>;
    failurePatterns: Array<{
        taskPattern: string;
        failureCount: number;
        commonErrors: string[];
        suggestedSkills: string[];
    }>;
    suggestions: string[];
}
interface LoggerConfig {
    maxLogs?: number;
    persistPath?: string;
    enableAnalytics?: boolean;
}
/**
 * Autonomy Logger for tracking interactions
 */
declare class AutonomyLogger extends EventEmitter {
    private logs;
    private config;
    private currentInteraction;
    constructor(config?: LoggerConfig);
    /**
     * Start tracking an interaction
     */
    startInteraction(task: string, taskType: InteractionLog['taskType']): string;
    /**
     * Record skills loaded for current interaction
     */
    recordSkillsLoaded(skills: string[]): void;
    /**
     * Record a skill being used
     */
    recordSkillUsed(skill: string): void;
    /**
     * Record MCPs connected
     */
    recordMcpsConnected(mcps: string[]): void;
    /**
     * Record an MCP being used
     */
    recordMcpUsed(mcp: string): void;
    /**
     * Complete the interaction
     */
    completeInteraction(options: {
        success: boolean;
        tokenCost?: number;
        errorMessage?: string;
        metadata?: Record<string, unknown>;
    }): InteractionLog | null;
    /**
     * Record user feedback for a past interaction
     */
    recordFeedback(interactionId: string, feedback: 'positive' | 'negative' | 'neutral'): void;
    /**
     * Get all logs
     */
    getLogs(filter?: Partial<Pick<InteractionLog, 'taskType' | 'success'>>): InteractionLog[];
    /**
     * Analyze patterns from logs
     */
    analyzePatterns(): PatternAnalysis;
    /**
     * Get summary stats
     */
    getSummary(): Record<string, unknown>;
}
declare const autonomyLogger: AutonomyLogger;

/**
 * OPUS 67 - Self-Evolving AI Runtime
 * Version 2.0 - With Operating Modes
 */

interface Opus67Config {
    tokenBudget?: number;
    maxSkills?: number;
    autoConnectMcps?: boolean;
    defaultMode?: ModeName;
    showBootScreen?: boolean;
}
interface SessionContext {
    mode: ModeName;
    modeConfig: Mode;
    skills: LoadResult;
    mcpConnections: Array<{
        id: string;
        connection: MCPConnection;
    }>;
    prompt: string;
    bootScreen?: string;
}
/**
 * OPUS 67 Runtime Class
 */
declare class Opus67 {
    private config;
    private currentMode;
    constructor(config?: Opus67Config);
    /**
     * Boot OPUS 67 and return boot screen
     */
    boot(): string;
    /**
     * Process a query with automatic mode detection
     */
    process(query: string, context?: Partial<ModeContext>): SessionContext;
    /**
     * Set mode manually
     */
    setMode(mode: ModeName): void;
    /**
     * Get current mode
     */
    getMode(): ModeName;
    /**
     * Generate context prompt
     */
    private generatePrompt;
    /**
     * Get mode status line
     */
    getStatusLine(): string;
}
declare const opus67: Opus67;

export { AutonomyLogger, type InteractionLog, type LoadContext, type LoadResult, type MCPConnection, Mode, ModeContext, ModeName, Opus67, type Opus67Config, type PatternAnalysis, type SessionContext, type Skill, autonomyLogger, formatConnectionsForPrompt, formatSkillsForPrompt, generateConnectionCode, getAllConnections, getConnectionsForKeywords, getConnectionsForSkills, loadCombination, loadSkills, opus67 };
