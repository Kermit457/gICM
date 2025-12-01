import { EventEmitter } from 'eventemitter3';

/**
 * OPUS 67 Mode Selector
 * Intelligent auto-detection and manual mode switching
 */

type ModeName = 'ultra' | 'think' | 'build' | 'vibe' | 'light' | 'creative' | 'data' | 'audit' | 'swarm' | 'auto';
interface Mode {
    name: string;
    icon: string;
    color: string;
    description: string;
    token_budget: number | 'dynamic';
    thinking_depth: string;
    characteristics: string[];
    auto_trigger_when: {
        keywords?: string[];
        task_patterns?: string[];
        file_types?: string[];
        message_length?: string;
        file_count?: string;
        complexity_score?: string;
    };
    skills_priority: string[];
    mcp_priority?: string[];
    sub_agents: {
        enabled: boolean;
        max_agents: number;
        types?: string[];
        orchestration?: string;
    };
    model_routing: {
        primary?: string;
        fallback?: string;
        orchestrator?: string;
        workers?: string;
        simple_tasks?: string;
        analysis?: string;
        execution?: string;
        use_extended_thinking?: boolean;
    };
}
interface ModeRegistry {
    meta: {
        version: string;
        total_modes: number;
        default_mode: string;
    };
    modes: Record<string, Mode>;
    complexity_scoring: {
        factors: Record<string, any>;
    };
    sub_agents: Record<string, any>;
}
interface DetectionResult {
    mode: ModeName;
    confidence: number;
    reasons: string[];
    complexity_score: number;
    suggested_skills: string[];
    suggested_mcps: string[];
    sub_agents_recommended: string[];
}
interface ModeContext {
    query: string;
    activeFiles?: string[];
    fileCount?: number;
    conversationLength?: number;
    previousMode?: ModeName;
    userPreference?: ModeName;
}
/**
 * Load mode registry
 */
declare function loadModeRegistry(): ModeRegistry;
/**
 * Detect the best mode for given context
 */
declare function detectMode(context: ModeContext): DetectionResult;
/**
 * Get mode configuration
 */
declare function getMode(modeName: ModeName): Mode | null;
/**
 * Get all available modes
 */
declare function getAllModes(): Array<{
    id: ModeName;
    mode: Mode;
}>;
/**
 * Format mode for display
 */
declare function formatModeDisplay(modeName: ModeName, detection?: DetectionResult): string;
/**
 * Mode Selector class with event emission
 */
declare class ModeSelector extends EventEmitter {
    private currentMode;
    private modeHistory;
    constructor();
    /**
     * Set mode manually
     */
    setMode(mode: ModeName): void;
    /**
     * Get current mode
     */
    getCurrentMode(): ModeName;
    /**
     * Process a query and detect/switch mode
     */
    processQuery(context: ModeContext): DetectionResult;
    /**
     * Get mode usage statistics
     */
    getStats(): Record<string, number>;
}
declare const modeSelector: ModeSelector;

/**
 * OPUS 67 Boot Sequence
 * Terminal UI and initialization display
 */

interface BootConfig {
    showAnimation?: boolean;
    defaultMode?: ModeName;
    userName?: string;
    projectName?: string;
    version?: string;
}
interface SystemStatus {
    skills: {
        loaded: number;
        available: number;
    };
    mcps: {
        connected: number;
        available: number;
    };
    modes: {
        current: ModeName;
        available: number;
    };
    memory: {
        status: 'ready' | 'loading' | 'error';
    };
    context: {
        indexed: boolean;
        files: number;
    };
    subAgents: {
        available: number;
    };
    combinations: {
        available: number;
    };
}
/**
 * Generate the OPUS 67 boot screen - CLEAN VERSION
 */
declare function generateBootScreen(config?: BootConfig): string;
/**
 * Generate compact status line
 */
declare function generateStatusLine(status: SystemStatus): string;
/**
 * Generate mode switch notification
 */
declare function generateModeSwitchNotification(from: ModeName, to: ModeName, reason: string): string;
/**
 * Generate sub-agent spawn notification
 */
declare function generateAgentSpawnNotification(agents: Array<{
    type: string;
    task: string;
    model: string;
}>): string;
/**
 * Generate help screen
 */
declare function generateHelpScreen(): string;
/**
 * Generate minimal inline status
 */
declare function generateInlineStatus(mode: ModeName, confidence?: number): string;
/**
 * Generate system status panel
 */
declare function generateStatusPanel(status: SystemStatus): string;

export { type BootConfig as B, type DetectionResult as D, type ModeName as M, type SystemStatus as S, type Mode as a, type ModeContext as b, getAllModes as c, detectMode as d, ModeSelector as e, formatModeDisplay as f, getMode as g, generateBootScreen as h, generateStatusLine as i, generateModeSwitchNotification as j, generateAgentSpawnNotification as k, loadModeRegistry as l, modeSelector as m, generateHelpScreen as n, generateInlineStatus as o, generateStatusPanel as p };
