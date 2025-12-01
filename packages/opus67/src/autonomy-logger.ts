/**
 * OPUS 67 Autonomy Logger
 * Logs interactions for pattern analysis and self-improvement
 */

import { EventEmitter } from 'eventemitter3';

export interface InteractionLog {
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

export interface PatternAnalysis {
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

export interface LoggerConfig {
  maxLogs?: number;
  persistPath?: string;
  enableAnalytics?: boolean;
}

/**
 * Autonomy Logger for tracking interactions
 */
export class AutonomyLogger extends EventEmitter {
  private logs: InteractionLog[] = [];
  private config: LoggerConfig;
  private currentInteraction: Partial<InteractionLog> | null = null;

  constructor(config: LoggerConfig = {}) {
    super();
    this.config = {
      maxLogs: config.maxLogs ?? 1000,
      persistPath: config.persistPath,
      enableAnalytics: config.enableAnalytics ?? true
    };
  }

  /**
   * Start tracking an interaction
   */
  startInteraction(task: string, taskType: InteractionLog['taskType']): string {
    const id = `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    this.currentInteraction = {
      id,
      timestamp: new Date(),
      task,
      taskType,
      skillsLoaded: [],
      skillsUsed: [],
      mcpsConnected: [],
      mcpsUsed: [],
      success: false,
      executionTimeMs: 0,
      tokenCost: 0
    };

    this.emit('interaction:start', { id, task, taskType });
    return id;
  }

  /**
   * Record skills loaded for current interaction
   */
  recordSkillsLoaded(skills: string[]): void {
    if (this.currentInteraction) {
      this.currentInteraction.skillsLoaded = skills;
    }
  }

  /**
   * Record a skill being used
   */
  recordSkillUsed(skill: string): void {
    if (this.currentInteraction && !this.currentInteraction.skillsUsed?.includes(skill)) {
      this.currentInteraction.skillsUsed?.push(skill);
    }
  }

  /**
   * Record MCPs connected
   */
  recordMcpsConnected(mcps: string[]): void {
    if (this.currentInteraction) {
      this.currentInteraction.mcpsConnected = mcps;
    }
  }

  /**
   * Record an MCP being used
   */
  recordMcpUsed(mcp: string): void {
    if (this.currentInteraction && !this.currentInteraction.mcpsUsed?.includes(mcp)) {
      this.currentInteraction.mcpsUsed?.push(mcp);
    }
  }

  /**
   * Complete the interaction
   */
  completeInteraction(options: {
    success: boolean;
    tokenCost?: number;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }): InteractionLog | null {
    if (!this.currentInteraction) return null;

    const startTime = this.currentInteraction.timestamp?.getTime() ?? Date.now();
    const log: InteractionLog = {
      ...this.currentInteraction as InteractionLog,
      success: options.success,
      executionTimeMs: Date.now() - startTime,
      tokenCost: options.tokenCost ?? 0,
      errorMessage: options.errorMessage,
      metadata: options.metadata
    };

    this.logs.push(log);
    this.currentInteraction = null;

    // Trim logs if exceeding max
    if (this.logs.length > this.config.maxLogs!) {
      this.logs = this.logs.slice(-this.config.maxLogs!);
    }

    this.emit('interaction:complete', log);
    return log;
  }

  /**
   * Record user feedback for a past interaction
   */
  recordFeedback(interactionId: string, feedback: 'positive' | 'negative' | 'neutral'): void {
    const log = this.logs.find(l => l.id === interactionId);
    if (log) {
      log.userFeedback = feedback;
      this.emit('feedback:recorded', { id: interactionId, feedback });
    }
  }

  /**
   * Get all logs
   */
  getLogs(filter?: Partial<Pick<InteractionLog, 'taskType' | 'success'>>): InteractionLog[] {
    let result = [...this.logs];
    
    if (filter?.taskType) {
      result = result.filter(l => l.taskType === filter.taskType);
    }
    if (filter?.success !== undefined) {
      result = result.filter(l => l.success === filter.success);
    }

    return result;
  }

  /**
   * Analyze patterns from logs
   */
  analyzePatterns(): PatternAnalysis {
    const skillUsage = new Map<string, { count: number; successes: number; totalTime: number }>();
    const mcpUsage = new Map<string, { count: number; errors: number }>();
    const taskFailures = new Map<string, { count: number; errors: string[] }>();

    for (const log of this.logs) {
      // Track skill usage
      for (const skill of log.skillsUsed) {
        const current = skillUsage.get(skill) || { count: 0, successes: 0, totalTime: 0 };
        current.count++;
        if (log.success) current.successes++;
        current.totalTime += log.executionTimeMs;
        skillUsage.set(skill, current);
      }

      // Track MCP usage
      for (const mcp of log.mcpsUsed) {
        const current = mcpUsage.get(mcp) || { count: 0, errors: 0 };
        current.count++;
        if (!log.success) current.errors++;
        mcpUsage.set(mcp, current);
      }

      // Track failures
      if (!log.success) {
        const taskKey = log.taskType;
        const current = taskFailures.get(taskKey) || { count: 0, errors: [] };
        current.count++;
        if (log.errorMessage) current.errors.push(log.errorMessage);
        taskFailures.set(taskKey, current);
      }
    }

    // Build analysis result
    const skillUsagePatterns = Array.from(skillUsage.entries()).map(([skill, data]) => ({
      skill,
      usageCount: data.count,
      successRate: data.count > 0 ? data.successes / data.count : 0,
      avgExecutionTime: data.count > 0 ? data.totalTime / data.count : 0
    })).sort((a, b) => b.usageCount - a.usageCount);

    const mcpUsagePatterns = Array.from(mcpUsage.entries()).map(([mcp, data]) => ({
      mcp,
      usageCount: data.count,
      errorRate: data.count > 0 ? data.errors / data.count : 0
    })).sort((a, b) => b.usageCount - a.usageCount);

    const failurePatterns = Array.from(taskFailures.entries()).map(([taskPattern, data]) => ({
      taskPattern,
      failureCount: data.count,
      commonErrors: [...new Set(data.errors)].slice(0, 5),
      suggestedSkills: [] // Would be populated by skill suggester
    }));

    // Generate suggestions
    const suggestions: string[] = [];

    // High failure rate skills
    for (const pattern of skillUsagePatterns) {
      if (pattern.usageCount > 3 && pattern.successRate < 0.5) {
        suggestions.push(`Skill "${pattern.skill}" has low success rate (${(pattern.successRate * 100).toFixed(0)}%). Consider reviewing or improving.`);
      }
    }

    // Underutilized skills
    const loadedNotUsed = new Map<string, number>();
    for (const log of this.logs) {
      for (const skill of log.skillsLoaded) {
        if (!log.skillsUsed.includes(skill)) {
          loadedNotUsed.set(skill, (loadedNotUsed.get(skill) || 0) + 1);
        }
      }
    }
    for (const [skill, count] of loadedNotUsed) {
      if (count > 5) {
        suggestions.push(`Skill "${skill}" loaded ${count} times but rarely used. Consider adjusting auto-load triggers.`);
      }
    }

    return {
      skillUsagePatterns,
      mcpUsagePatterns,
      failurePatterns,
      suggestions
    };
  }

  /**
   * Get summary stats
   */
  getSummary(): Record<string, unknown> {
    const total = this.logs.length;
    const successes = this.logs.filter(l => l.success).length;
    const totalTokens = this.logs.reduce((sum, l) => sum + l.tokenCost, 0);
    const avgTime = total > 0 
      ? this.logs.reduce((sum, l) => sum + l.executionTimeMs, 0) / total 
      : 0;

    return {
      totalInteractions: total,
      successRate: total > 0 ? successes / total : 0,
      totalTokensUsed: totalTokens,
      avgExecutionTimeMs: avgTime,
      positiveFeedback: this.logs.filter(l => l.userFeedback === 'positive').length,
      negativeFeedback: this.logs.filter(l => l.userFeedback === 'negative').length
    };
  }
}

// Export singleton
export const autonomyLogger = new AutonomyLogger();
