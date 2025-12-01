/**
 * OPUS 67 - Autonomy Engine
 * Interaction logging, pattern detection, and self-improvement
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// =============================================================================
// TYPES
// =============================================================================

export interface AutonomyConfig {
  level: 1 | 2 | 3 | 4;
  logPath?: string;
  maxLogEntries?: number;
  patternAnalysisInterval?: number;
}

export interface InteractionLog {
  id: string;
  timestamp: Date;
  taskType: string;
  input: string;
  skillsUsed: string[];
  mcpsUsed: string[];
  tokensIn: number;
  tokensOut: number;
  executionTimeMs: number;
  success: boolean;
  errorMessage?: string;
  userFeedback?: "positive" | "negative" | null;
}

export interface Pattern {
  id: string;
  type: "skill_gap" | "frequent_task" | "recurring_error" | "optimization";
  description: string;
  frequency: number;
  lastSeen: Date;
  suggestedAction?: string;
}

export interface SkillSuggestion {
  id: string;
  name: string;
  reason: string;
  triggers: string[];
  confidence: number;
  createdAt: Date;
}

// =============================================================================
// AUTONOMY ENGINE
// =============================================================================

export class AutonomyEngine {
  private config: AutonomyConfig;
  private logs: InteractionLog[] = [];
  private patterns: Pattern[] = [];
  private suggestions: SkillSuggestion[] = [];
  private logPath: string;

  constructor(config: AutonomyConfig) {
    this.config = {
      level: config.level,
      logPath: config.logPath || ".opus67/logs",
      maxLogEntries: config.maxLogEntries || 1000,
      patternAnalysisInterval: config.patternAnalysisInterval || 3600000, // 1 hour
    };
    this.logPath = this.config.logPath!;
  }

  /**
   * Initialize the autonomy engine
   */
  async initialize(): Promise<void> {
    // Create log directory
    if (!existsSync(this.logPath)) {
      mkdirSync(this.logPath, { recursive: true });
    }

    // Load existing logs
    await this.loadLogs();

    // Start pattern analysis interval
    if (this.config.patternAnalysisInterval! > 0) {
      setInterval(() => {
        this.analyzePatterns();
      }, this.config.patternAnalysisInterval);
    }

    console.log(`[AutonomyEngine] Initialized at level ${this.config.level}`);
  }

  /**
   * Log an interaction
   */
  logInteraction(log: Omit<InteractionLog, "id" | "timestamp">): string {
    const id = this.generateId();
    const entry: InteractionLog = {
      ...log,
      id,
      timestamp: new Date(),
    };

    this.logs.push(entry);

    // Trim logs if over limit
    if (this.logs.length > this.config.maxLogEntries!) {
      this.logs = this.logs.slice(-this.config.maxLogEntries!);
    }

    // Async save
    this.saveLogs().catch(console.error);

    return id;
  }

  /**
   * Record user feedback for an interaction
   */
  recordFeedback(logId: string, feedback: "positive" | "negative"): void {
    const log = this.logs.find((l) => l.id === logId);
    if (log) {
      log.userFeedback = feedback;
      this.saveLogs().catch(console.error);
    }
  }

  /**
   * Analyze patterns in logs
   */
  analyzePatterns(): Pattern[] {
    const newPatterns: Pattern[] = [];

    // Pattern 1: Frequent task types
    const taskCounts = new Map<string, number>();
    for (const log of this.logs.slice(-100)) {
      const count = taskCounts.get(log.taskType) || 0;
      taskCounts.set(log.taskType, count + 1);
    }

    for (const [taskType, count] of taskCounts) {
      if (count >= 10) {
        newPatterns.push({
          id: `frequent_${taskType}`,
          type: "frequent_task",
          description: `Task type "${taskType}" appears frequently (${count} times in last 100 interactions)`,
          frequency: count,
          lastSeen: new Date(),
          suggestedAction: `Consider creating optimized workflow for ${taskType} tasks`,
        });
      }
    }

    // Pattern 2: Skill gaps (frequent failures with no skill)
    const failedTasks = this.logs.filter((l) => !l.success && l.skillsUsed.length === 0);
    const failedTaskTypes = new Map<string, number>();
    for (const log of failedTasks.slice(-50)) {
      const count = failedTaskTypes.get(log.taskType) || 0;
      failedTaskTypes.set(log.taskType, count + 1);
    }

    for (const [taskType, count] of failedTaskTypes) {
      if (count >= 3) {
        newPatterns.push({
          id: `gap_${taskType}`,
          type: "skill_gap",
          description: `Potential skill gap: ${taskType} tasks failing without loaded skills`,
          frequency: count,
          lastSeen: new Date(),
          suggestedAction: `Create new skill to handle ${taskType} tasks`,
        });
      }
    }

    // Pattern 3: Recurring errors
    const errorMessages = new Map<string, number>();
    for (const log of this.logs.filter((l) => l.errorMessage)) {
      const msg = log.errorMessage!.slice(0, 50); // First 50 chars
      const count = errorMessages.get(msg) || 0;
      errorMessages.set(msg, count + 1);
    }

    for (const [error, count] of errorMessages) {
      if (count >= 3) {
        newPatterns.push({
          id: `error_${this.generateId()}`,
          type: "recurring_error",
          description: `Recurring error: "${error}"`,
          frequency: count,
          lastSeen: new Date(),
          suggestedAction: "Investigate and add error handling or prevention",
        });
      }
    }

    // Pattern 4: Optimization opportunities
    const slowTasks = this.logs.filter((l) => l.executionTimeMs > 10000);
    if (slowTasks.length >= 5) {
      const avgTime = slowTasks.reduce((sum, l) => sum + l.executionTimeMs, 0) / slowTasks.length;
      newPatterns.push({
        id: "slow_tasks",
        type: "optimization",
        description: `${slowTasks.length} tasks took >10s (avg ${Math.round(avgTime / 1000)}s)`,
        frequency: slowTasks.length,
        lastSeen: new Date(),
        suggestedAction: "Consider caching, parallel processing, or simpler approaches",
      });
    }

    this.patterns = newPatterns;
    return newPatterns;
  }

  /**
   * Generate skill suggestions based on patterns
   */
  generateSkillSuggestions(): SkillSuggestion[] {
    const suggestions: SkillSuggestion[] = [];

    for (const pattern of this.patterns) {
      if (pattern.type === "skill_gap") {
        suggestions.push({
          id: `suggestion_${this.generateId()}`,
          name: `${pattern.description.split(":")[1]?.trim() || "new"}-specialist`,
          reason: pattern.description,
          triggers: [pattern.description.toLowerCase()],
          confidence: Math.min(pattern.frequency * 0.1, 0.9),
          createdAt: new Date(),
        });
      }
    }

    this.suggestions = suggestions;
    return suggestions;
  }

  /**
   * Get autonomy stats
   */
  getStats(): {
    totalInteractions: number;
    successRate: number;
    avgExecutionTime: number;
    patterns: number;
    suggestions: number;
  } {
    const total = this.logs.length;
    const successful = this.logs.filter((l) => l.success).length;
    const avgTime = total > 0
      ? this.logs.reduce((sum, l) => sum + l.executionTimeMs, 0) / total
      : 0;

    return {
      totalInteractions: total,
      successRate: total > 0 ? successful / total : 0,
      avgExecutionTime: avgTime,
      patterns: this.patterns.length,
      suggestions: this.suggestions.length,
    };
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 10): InteractionLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get patterns
   */
  getPatterns(): Pattern[] {
    return this.patterns;
  }

  /**
   * Get suggestions
   */
  getSuggestions(): SkillSuggestion[] {
    return this.suggestions;
  }

  /**
   * Load logs from disk
   */
  private async loadLogs(): Promise<void> {
    const logFile = join(this.logPath, "interactions.json");
    
    if (existsSync(logFile)) {
      try {
        const data = JSON.parse(readFileSync(logFile, "utf-8"));
        this.logs = data.logs || [];
        this.patterns = data.patterns || [];
        console.log(`[AutonomyEngine] Loaded ${this.logs.length} logs`);
      } catch (error) {
        console.warn("[AutonomyEngine] Failed to load logs:", error);
      }
    }
  }

  /**
   * Save logs to disk
   */
  private async saveLogs(): Promise<void> {
    const logFile = join(this.logPath, "interactions.json");
    
    const data = {
      version: "1.0.0",
      lastSaved: new Date().toISOString(),
      logs: this.logs.slice(-this.config.maxLogEntries!),
      patterns: this.patterns,
    };

    writeFileSync(logFile, JSON.stringify(data, null, 2));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Format stats for display
   */
  formatStats(): string {
    const stats = this.getStats();
    
    return `
## Autonomy Engine Stats

- **Level:** ${this.config.level}
- **Total Interactions:** ${stats.totalInteractions}
- **Success Rate:** ${(stats.successRate * 100).toFixed(1)}%
- **Avg Execution Time:** ${Math.round(stats.avgExecutionTime)}ms
- **Detected Patterns:** ${stats.patterns}
- **Skill Suggestions:** ${stats.suggestions}
    `.trim();
  }
}

export default AutonomyEngine;
