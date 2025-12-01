/**
 * OPUS 67 Mode Selector
 * Intelligent auto-detection and manual mode switching
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'eventemitter3';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Types
export type ModeName = 
  | 'ultra' | 'think' | 'build' | 'vibe' | 'light' 
  | 'creative' | 'data' | 'audit' | 'swarm' | 'auto';

export interface Mode {
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

export interface ModeRegistry {
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

export interface DetectionResult {
  mode: ModeName;
  confidence: number;
  reasons: string[];
  complexity_score: number;
  suggested_skills: string[];
  suggested_mcps: string[];
  sub_agents_recommended: string[];
}

export interface ModeContext {
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
export function loadModeRegistry(): ModeRegistry {
  const registryPath = join(__dirname, '..', 'modes', 'registry.yaml');
  const content = readFileSync(registryPath, 'utf-8');
  return parse(content) as ModeRegistry;
}

/**
 * Calculate complexity score for a query
 */
function calculateComplexityScore(context: ModeContext, registry: ModeRegistry): number {
  const { query, activeFiles = [], fileCount = 1 } = context;
  const factors = registry.complexity_scoring.factors;
  let score = 0;

  // Keyword complexity
  const queryLower = query.toLowerCase();
  const highKeywords = factors.keyword_complexity.high as string[];
  const mediumKeywords = factors.keyword_complexity.medium as string[];
  const lowKeywords = factors.keyword_complexity.low as string[];
  
  if (highKeywords.some(k => queryLower.includes(k))) {
    score += 8 * factors.keyword_complexity.weight;
  } else if (mediumKeywords.some(k => queryLower.includes(k))) {
    score += 5 * factors.keyword_complexity.weight;
  } else if (lowKeywords.some(k => queryLower.includes(k))) {
    score += 2 * factors.keyword_complexity.weight;
  }

  // File scope
  if (fileCount > 10) {
    score += 10 * factors.file_scope.weight;
  } else if (fileCount > 5) {
    score += 7 * factors.file_scope.weight;
  } else if (fileCount > 1) {
    score += 4 * factors.file_scope.weight;
  } else {
    score += 2 * factors.file_scope.weight;
  }

  // Domain depth (based on file types)
  const hasRust = activeFiles.some(f => f.endsWith('.rs'));
  const hasTsx = activeFiles.some(f => f.endsWith('.tsx'));
  const hasTs = activeFiles.some(f => f.endsWith('.ts'));
  
  if (hasRust) {
    score += 8 * factors.domain_depth.weight; // blockchain
  } else if (hasTsx && hasTs) {
    score += 6 * factors.domain_depth.weight; // fullstack
  } else if (hasTsx) {
    score += 4 * factors.domain_depth.weight; // frontend
  } else {
    score += 2 * factors.domain_depth.weight;
  }

  // Task type estimation
  if (queryLower.includes('architecture') || queryLower.includes('system design')) {
    score += 10 * factors.task_type.weight;
  } else if (queryLower.includes('feature') || queryLower.includes('implement')) {
    score += 6 * factors.task_type.weight;
  } else if (queryLower.includes('component') || queryLower.includes('build')) {
    score += 4 * factors.task_type.weight;
  } else if (queryLower.includes('fix') || queryLower.includes('update')) {
    score += 2 * factors.task_type.weight;
  } else {
    score += 1 * factors.task_type.weight;
  }

  return Math.min(10, Math.max(1, Math.round(score)));
}

/**
 * Check if mode triggers match context
 */
function checkModeTriggers(mode: Mode, context: ModeContext, complexityScore: number): { matches: boolean; confidence: number; reasons: string[] } {
  const { query, activeFiles = [], fileCount = 1 } = context;
  const queryLower = query.toLowerCase();
  const triggers = mode.auto_trigger_when;
  const reasons: string[] = [];
  let matchCount = 0;
  let totalChecks = 0;

  // Check keywords
  if (triggers.keywords) {
    totalChecks++;
    const matchedKeywords = triggers.keywords.filter(k => queryLower.includes(k.toLowerCase()));
    if (matchedKeywords.length > 0) {
      matchCount++;
      reasons.push(`keywords: ${matchedKeywords.join(', ')}`);
    }
  }

  // Check task patterns
  if (triggers.task_patterns) {
    totalChecks++;
    for (const pattern of triggers.task_patterns) {
      const regex = new RegExp(pattern.replace(/\.\*/g, '.*'), 'i');
      if (regex.test(query)) {
        matchCount++;
        reasons.push(`pattern: ${pattern}`);
        break;
      }
    }
  }

  // Check file types
  if (triggers.file_types && activeFiles.length > 0) {
    totalChecks++;
    const matchedTypes = triggers.file_types.filter(ft => 
      activeFiles.some(f => f.endsWith(ft))
    );
    if (matchedTypes.length > 0) {
      matchCount++;
      reasons.push(`file_types: ${matchedTypes.join(', ')}`);
    }
  }

  // Check complexity score
  if (triggers.complexity_score) {
    totalChecks++;
    const scoreCondition = triggers.complexity_score;
    let matches = false;
    
    if (scoreCondition.startsWith('>=')) {
      matches = complexityScore >= parseInt(scoreCondition.slice(2).trim());
    } else if (scoreCondition.startsWith('>')) {
      matches = complexityScore > parseInt(scoreCondition.slice(1).trim());
    } else if (scoreCondition.includes('-')) {
      const [min, max] = scoreCondition.split('-').map(s => parseInt(s.trim()));
      matches = complexityScore >= min && complexityScore <= max;
    }
    
    if (matches) {
      matchCount++;
      reasons.push(`complexity: ${complexityScore} (${scoreCondition})`);
    }
  }

  // Check message length
  if (triggers.message_length) {
    totalChecks++;
    const wordCount = query.split(/\s+/).length;
    if (triggers.message_length.includes('< 50') && wordCount < 50) {
      matchCount++;
      reasons.push(`short message: ${wordCount} words`);
    }
  }

  // Check file count
  if (triggers.file_count) {
    totalChecks++;
    if (triggers.file_count.includes('> 5') && fileCount > 5) {
      matchCount++;
      reasons.push(`many files: ${fileCount}`);
    }
  }

  const confidence = totalChecks > 0 ? matchCount / totalChecks : 0;
  return {
    matches: matchCount > 0,
    confidence,
    reasons
  };
}

/**
 * Detect the best mode for given context
 */
export function detectMode(context: ModeContext): DetectionResult {
  const registry = loadModeRegistry();
  const complexityScore = calculateComplexityScore(context, registry);
  
  // If user has preference, weight it heavily
  if (context.userPreference && context.userPreference !== 'auto') {
    const mode = registry.modes[context.userPreference];
    return {
      mode: context.userPreference,
      confidence: 1.0,
      reasons: ['user preference'],
      complexity_score: complexityScore,
      suggested_skills: mode.skills_priority,
      suggested_mcps: mode.mcp_priority || [],
      sub_agents_recommended: mode.sub_agents.enabled ? mode.sub_agents.types || [] : []
    };
  }

  // Score each mode
  const modeScores: Array<{ mode: ModeName; score: number; result: ReturnType<typeof checkModeTriggers> }> = [];
  const autoMode = registry.modes.auto;
  const modeWeights = (autoMode as any).mode_weights || {};

  for (const [modeName, mode] of Object.entries(registry.modes)) {
    if (modeName === 'auto') continue;
    
    const result = checkModeTriggers(mode, context, complexityScore);
    const weight = modeWeights[modeName] || 1.5;
    const score = result.confidence / weight; // Lower weight = easier to trigger
    
    if (result.matches) {
      modeScores.push({ mode: modeName as ModeName, score, result });
    }
  }

  // Sort by score (higher is better)
  modeScores.sort((a, b) => b.score - a.score);

  // Select best mode or fallback
  const selected = modeScores[0];
  const fallbackMode = (autoMode as any).fallback_mode || 'build';
  
  if (!selected) {
    const mode = registry.modes[fallbackMode];
    return {
      mode: fallbackMode as ModeName,
      confidence: 0.5,
      reasons: ['fallback - no strong signals'],
      complexity_score: complexityScore,
      suggested_skills: mode.skills_priority,
      suggested_mcps: mode.mcp_priority || [],
      sub_agents_recommended: []
    };
  }

  const mode = registry.modes[selected.mode];
  return {
    mode: selected.mode,
    confidence: selected.result.confidence,
    reasons: selected.result.reasons,
    complexity_score: complexityScore,
    suggested_skills: mode.skills_priority,
    suggested_mcps: mode.mcp_priority || [],
    sub_agents_recommended: mode.sub_agents.enabled ? mode.sub_agents.types || [] : []
  };
}

/**
 * Get mode configuration
 */
export function getMode(modeName: ModeName): Mode | null {
  const registry = loadModeRegistry();
  return registry.modes[modeName] || null;
}

/**
 * Get all available modes
 */
export function getAllModes(): Array<{ id: ModeName; mode: Mode }> {
  const registry = loadModeRegistry();
  return Object.entries(registry.modes).map(([id, mode]) => ({
    id: id as ModeName,
    mode
  }));
}

/**
 * Format mode for display
 */
export function formatModeDisplay(modeName: ModeName, detection?: DetectionResult): string {
  const mode = getMode(modeName);
  if (!mode) return `Unknown mode: ${modeName}`;

  let output = `
╔══════════════════════════════════════════════════════════════════╗
║  ${mode.icon} OPUS 67 :: ${mode.name.padEnd(10)} ${detection ? `[${(detection.confidence * 100).toFixed(0)}% confidence]` : ''}
╠══════════════════════════════════════════════════════════════════╣
║  ${mode.description.padEnd(62)} ║
╠══════════════════════════════════════════════════════════════════╣
║  Token Budget: ${String(mode.token_budget).padEnd(10)} Thinking: ${mode.thinking_depth.padEnd(15)} ║
║  Sub-agents: ${mode.sub_agents.enabled ? `Up to ${mode.sub_agents.max_agents}` : 'Disabled'.padEnd(12)}                                      ║`;

  if (detection) {
    output += `
╠══════════════════════════════════════════════════════════════════╣
║  Complexity Score: ${detection.complexity_score}/10                                        ║
║  Detected by: ${detection.reasons.slice(0, 2).join(', ').slice(0, 50).padEnd(50)} ║`;
  }

  output += `
╚══════════════════════════════════════════════════════════════════╝`;

  return output;
}

/**
 * Mode Selector class with event emission
 */
export class ModeSelector extends EventEmitter {
  private currentMode: ModeName = 'auto';
  private modeHistory: Array<{ mode: ModeName; timestamp: Date; query: string }> = [];

  constructor() {
    super();
  }

  /**
   * Set mode manually
   */
  setMode(mode: ModeName): void {
    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.emit('mode:change', { from: previousMode, to: mode, manual: true });
  }

  /**
   * Get current mode
   */
  getCurrentMode(): ModeName {
    return this.currentMode;
  }

  /**
   * Process a query and detect/switch mode
   */
  processQuery(context: ModeContext): DetectionResult {
    const detection = detectMode({
      ...context,
      previousMode: this.currentMode,
      userPreference: this.currentMode !== 'auto' ? this.currentMode : undefined
    });

    // Track mode history
    this.modeHistory.push({
      mode: detection.mode,
      timestamp: new Date(),
      query: context.query.slice(0, 100)
    });

    // Trim history
    if (this.modeHistory.length > 100) {
      this.modeHistory = this.modeHistory.slice(-100);
    }

    // Emit mode change if different
    if (detection.mode !== this.currentMode && this.currentMode === 'auto') {
      this.emit('mode:change', { 
        from: this.currentMode, 
        to: detection.mode, 
        manual: false,
        detection 
      });
    }

    return detection;
  }

  /**
   * Get mode usage statistics
   */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const entry of this.modeHistory) {
      stats[entry.mode] = (stats[entry.mode] || 0) + 1;
    }
    return stats;
  }
}

// Export singleton
export const modeSelector = new ModeSelector();

// CLI test
if (process.argv[1]?.includes('mode-selector')) {
  const testQueries = [
    'what is useState',
    'build a landing page with hero section',
    'design the entire system architecture for our new platform',
    'quick fix for this button',
    'analyze this token and find whale wallets',
    'audit the security of this anchor program',
    'create a beautiful animation for page transitions',
    'refactor the entire codebase to use the new design system'
  ];

  console.log('\n🧪 Testing OPUS 67 Mode Detection\n');
  console.log('='.repeat(70));

  for (const query of testQueries) {
    const result = detectMode({ query });
    const mode = getMode(result.mode)!;
    console.log(`\n📝 "${query.slice(0, 50)}..."`);
    console.log(`   ${mode.icon} ${result.mode.toUpperCase()} (${(result.confidence * 100).toFixed(0)}%)`);
    console.log(`   Complexity: ${result.complexity_score}/10`);
    console.log(`   Reasons: ${result.reasons.join(', ')}`);
  }
}
