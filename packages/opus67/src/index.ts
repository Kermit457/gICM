/**
 * OPUS 67 - Self-Evolving AI Runtime
 * Version 2.0 - With Operating Modes
 */

// Import for local use
import {
  loadSkills,
  formatSkillsForPrompt,
  type LoadResult,
  type Skill
} from './skill-loader.js';

import {
  getConnectionsForSkills,
  formatConnectionsForPrompt,
  type MCPConnection
} from './mcp-hub.js';

import {
  detectMode,
  getMode,
  modeSelector,
  type ModeName,
  type Mode,
  type DetectionResult,
  type ModeContext
} from './mode-selector.js';

import {
  generateBootScreen,
  generateInlineStatus
} from './boot-sequence.js';

// Re-export everything
export {
  loadSkills,
  loadCombination,
  formatSkillsForPrompt,
  type LoadContext,
  type LoadResult,
  type Skill
} from './skill-loader.js';

export {
  getAllConnections,
  getConnectionsForSkills,
  getConnectionsForKeywords,
  formatConnectionsForPrompt,
  generateConnectionCode,
  type MCPConnection
} from './mcp-hub.js';

export {
  detectMode,
  getMode,
  getAllModes,
  formatModeDisplay,
  loadModeRegistry,
  modeSelector,
  ModeSelector,
  type ModeName,
  type Mode,
  type DetectionResult,
  type ModeContext
} from './mode-selector.js';

export {
  generateBootScreen,
  generateStatusLine,
  generateModeSwitchNotification,
  generateAgentSpawnNotification,
  generateHelpScreen,
  generateInlineStatus,
  type BootConfig,
  type SystemStatus
} from './boot-sequence.js';

// Autonomy
export {
  autonomyLogger,
  AutonomyLogger,
  type InteractionLog,
  type PatternAnalysis
} from './autonomy-logger.js';

// Types
export interface Opus67Config {
  tokenBudget?: number;
  maxSkills?: number;
  autoConnectMcps?: boolean;
  defaultMode?: ModeName;
  showBootScreen?: boolean;
}

export interface SessionContext {
  mode: ModeName;
  modeConfig: Mode;
  skills: LoadResult;
  mcpConnections: Array<{ id: string; connection: MCPConnection }>;
  prompt: string;
  bootScreen?: string;
}

/**
 * OPUS 67 Runtime Class
 */
export class Opus67 {
  private config: Opus67Config;
  private currentMode: ModeName;

  constructor(config: Opus67Config = {}) {
    this.config = {
      tokenBudget: config.tokenBudget ?? 50000,
      maxSkills: config.maxSkills ?? 5,
      autoConnectMcps: config.autoConnectMcps ?? true,
      defaultMode: config.defaultMode ?? 'auto',
      showBootScreen: config.showBootScreen ?? true
    };
    this.currentMode = this.config.defaultMode!;
  }

  /**
   * Boot OPUS 67 and return boot screen
   */
  boot(): string {
    return generateBootScreen({ defaultMode: this.currentMode });
  }

  /**
   * Process a query with automatic mode detection
   */
  process(query: string, context?: Partial<ModeContext>): SessionContext {
    // Detect mode
    const detection = detectMode({
      query,
      ...context,
      userPreference: this.currentMode !== 'auto' ? this.currentMode : undefined
    });

    const modeConfig = getMode(detection.mode)!;

    // Load skills based on mode
    const skills = loadSkills({
      query,
      activeFiles: context?.activeFiles
    });

    // Prioritize mode-specific skills
    const modeSkills = modeConfig.skills_priority || [];
    // (In real implementation, would merge/prioritize)

    // Get MCPs
    let mcpConnections: Array<{ id: string; connection: MCPConnection }> = [];
    if (this.config.autoConnectMcps) {
      const skillIds = skills.skills.map(s => s.id);
      mcpConnections = getConnectionsForSkills(skillIds);
    }

    // Generate prompt
    const prompt = this.generatePrompt(detection, skills, mcpConnections);

    return {
      mode: detection.mode,
      modeConfig,
      skills,
      mcpConnections,
      prompt,
      bootScreen: this.config.showBootScreen ? this.boot() : undefined
    };
  }

  /**
   * Set mode manually
   */
  setMode(mode: ModeName): void {
    this.currentMode = mode;
    modeSelector.setMode(mode);
  }

  /**
   * Get current mode
   */
  getMode(): ModeName {
    return this.currentMode;
  }

  /**
   * Generate context prompt
   */
  private generatePrompt(
    detection: DetectionResult,
    skills: LoadResult,
    mcps: Array<{ id: string; connection: MCPConnection }>
  ): string {
    const modeConfig = getMode(detection.mode)!;
    
    return `
<!-- OPUS 67 SESSION -->
Mode: ${modeConfig.icon} ${detection.mode.toUpperCase()} (${(detection.confidence * 100).toFixed(0)}% confidence)
Complexity: ${detection.complexity_score}/10
Token Budget: ${modeConfig.token_budget}
Thinking: ${modeConfig.thinking_depth}
Sub-agents: ${modeConfig.sub_agents.enabled ? `Up to ${modeConfig.sub_agents.max_agents}` : 'Disabled'}

Skills Loaded: ${skills.skills.map(s => s.id).join(', ')}
MCPs Available: ${mcps.map(m => m.id).join(', ')}

Detected by: ${detection.reasons.join('; ')}
<!-- /OPUS 67 SESSION -->

${formatSkillsForPrompt(skills)}

${formatConnectionsForPrompt(mcps)}
`.trim();
  }

  /**
   * Get mode status line
   */
  getStatusLine(): string {
    return generateInlineStatus(this.currentMode);
  }
}

// Default instance
export const opus67 = new Opus67();

// CLI
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  console.log(opus67.boot());
  
  console.log('\n--- Processing test query ---\n');
  
  const session = opus67.process('design the entire system architecture');
  console.log(`Mode: ${session.mode}`);
  console.log(`Confidence: ${session.modeConfig.description}`);
  console.log(`Skills: ${session.skills.skills.map(s => s.id).join(', ')}`);
}
