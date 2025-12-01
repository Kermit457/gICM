/**
 * Analytics Manager
 *
 * Tracks pipeline execution costs, success rates, and token usage.
 * Provides aggregated metrics for dashboard visualization.
 *
 * Supports both in-memory and persistent (Supabase) storage modes.
 */

import { EventEmitter } from 'eventemitter3';
import type { SupabaseStorage } from './storage/supabase.js';

// Types
export interface PipelineExecution {
  id: string;
  pipelineId: string;
  pipelineName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  duration?: number;
  steps: StepExecution[];
  cost: ExecutionCost;
  tokens: TokenUsage;
  error?: string;
}

export interface StepExecution {
  id: string;
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  duration?: number;
  tokens: TokenUsage;
  cost: number;
  error?: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface ExecutionCost {
  total: number;
  breakdown: {
    llm: number;
    api: number;
    compute: number;
  };
  currency: 'USD';
}

export interface DailyStats {
  date: string;
  executions: number;
  successful: number;
  failed: number;
  totalCost: number;
  totalTokens: number;
  avgDuration: number;
  byPipeline: Record<string, { count: number; successRate: number; avgCost: number }>;
}

export interface AnalyticsSummary {
  period: 'day' | 'week' | 'month';
  totalExecutions: number;
  successRate: number;
  totalCost: number;
  totalTokens: number;
  avgDuration: number;
  topPipelines: Array<{ id: string; name: string; count: number; successRate: number }>;
  costTrend: Array<{ date: string; cost: number }>;
  executionTrend: Array<{ date: string; count: number; successRate: number }>;
}

export interface AnalyticsEvents {
  'execution:start': (execution: PipelineExecution) => void;
  'execution:complete': (execution: PipelineExecution) => void;
  'step:complete': (step: StepExecution, executionId: string) => void;
  'cost:update': (executionId: string, cost: ExecutionCost) => void;
  'stats:daily': (stats: DailyStats) => void;
}

// Cost estimation constants (per 1K tokens)
const COST_PER_1K_INPUT = 0.003;  // Claude Sonnet
const COST_PER_1K_OUTPUT = 0.015; // Claude Sonnet
const API_CALL_BASE_COST = 0.001; // Base cost per external API call

export interface AnalyticsConfig {
  /** Use persistent storage (Supabase) */
  persistent?: boolean;
  /** Max executions to keep in memory (default: 1000) */
  maxInMemory?: number;
  /** Sync to storage on every update (default: true) */
  autoSync?: boolean;
}

export class AnalyticsManager extends EventEmitter<AnalyticsEvents> {
  private executions: Map<string, PipelineExecution> = new Map();
  private dailyStats: Map<string, DailyStats> = new Map();
  private maxExecutionsInMemory = 1000;
  private storage: SupabaseStorage | null = null;
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig = {}) {
    super();
    this.config = {
      persistent: false,
      maxInMemory: 1000,
      autoSync: true,
      ...config,
    };
    this.maxExecutionsInMemory = this.config.maxInMemory!;
  }

  /**
   * Enable persistent storage with Supabase
   */
  async enablePersistence(storage: SupabaseStorage): Promise<void> {
    this.storage = storage;
    this.config.persistent = true;

    // Load recent executions from storage
    if (storage.connected) {
      try {
        const recent = await storage.getRecentExecutions(this.maxExecutionsInMemory);
        for (const exec of recent) {
          this.executions.set(exec.id, exec);
        }
        console.log(`[Analytics] Loaded ${recent.length} executions from storage`);
      } catch (error) {
        console.error('[Analytics] Failed to load from storage:', error);
      }
    }
  }

  /**
   * Check if persistent storage is enabled
   */
  get isPersistent(): boolean {
    return this.config.persistent === true && this.storage !== null;
  }

  /**
   * Start tracking a new pipeline execution
   */
  startExecution(pipelineId: string, pipelineName: string, stepCount: number): string {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const execution: PipelineExecution = {
      id: executionId,
      pipelineId,
      pipelineName,
      status: 'running',
      startTime: Date.now(),
      steps: [],
      cost: {
        total: 0,
        breakdown: { llm: 0, api: 0, compute: 0 },
        currency: 'USD',
      },
      tokens: { input: 0, output: 0, total: 0 },
    };

    this.executions.set(executionId, execution);
    this.emit('execution:start', execution);

    // Sync to storage
    if (this.isPersistent && this.config.autoSync) {
      this.storage!.saveExecution(execution).catch((err) => {
        console.error('[Analytics] Failed to save execution to storage:', err);
      });
    }

    // Cleanup old executions
    this.cleanupOldExecutions();

    return executionId;
  }

  /**
   * Record step execution
   */
  recordStep(
    executionId: string,
    stepId: string,
    tool: string,
    status: StepExecution['status'],
    tokens?: Partial<TokenUsage>,
    error?: string
  ): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    // Find existing step or create new
    let step = execution.steps.find(s => s.id === stepId);

    if (!step) {
      step = {
        id: stepId,
        tool,
        status: 'pending',
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
      };
      execution.steps.push(step);
    }

    // Update step
    if (status === 'running' && !step.startTime) {
      step.startTime = Date.now();
    }

    step.status = status;

    if (['completed', 'failed', 'skipped'].includes(status)) {
      step.endTime = Date.now();
      step.duration = step.endTime - (step.startTime || step.endTime);
    }

    if (tokens) {
      step.tokens.input += tokens.input || 0;
      step.tokens.output += tokens.output || 0;
      step.tokens.total = step.tokens.input + step.tokens.output;
    }

    if (error) {
      step.error = error;
    }

    // Calculate step cost
    step.cost = this.calculateStepCost(step);

    // Update execution totals
    this.updateExecutionTotals(execution);

    this.emit('step:complete', step, executionId);
  }

  /**
   * Complete pipeline execution
   */
  completeExecution(
    executionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    error?: string
  ): PipelineExecution | undefined {
    const execution = this.executions.get(executionId);
    if (!execution) return undefined;

    execution.status = status;
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;

    if (error) {
      execution.error = error;
    }

    // Update execution totals one final time
    this.updateExecutionTotals(execution);

    // Update daily stats
    this.updateDailyStats(execution);

    // Sync completed execution to storage
    if (this.isPersistent && this.config.autoSync) {
      this.storage!.updateExecution(execution).catch((err) => {
        console.error('[Analytics] Failed to update execution in storage:', err);
      });
    }

    this.emit('execution:complete', execution);

    return execution;
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): PipelineExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get recent executions
   */
  getRecentExecutions(limit = 50): PipelineExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Get executions by pipeline ID
   */
  getExecutionsByPipeline(pipelineId: string, limit = 20): PipelineExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.pipelineId === pipelineId)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Get daily statistics
   */
  getDailyStats(date?: string): DailyStats | undefined {
    const dateKey = date || new Date().toISOString().split('T')[0];
    return this.dailyStats.get(dateKey);
  }

  /**
   * Get statistics for a date range
   */
  getStatsRange(startDate: string, endDate: string): DailyStats[] {
    const stats: DailyStats[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateKey = current.toISOString().split('T')[0];
      const dayStat = this.dailyStats.get(dateKey);
      if (dayStat) {
        stats.push(dayStat);
      }
      current.setDate(current.getDate() + 1);
    }

    return stats;
  }

  /**
   * Get analytics summary for a period
   */
  getSummary(period: 'day' | 'week' | 'month' = 'week'): AnalyticsSummary {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Get executions in period
    const executions = Array.from(this.executions.values())
      .filter(e => e.startTime >= startDate.getTime());

    const totalExecutions = executions.length;
    const successful = executions.filter(e => e.status === 'completed').length;
    const successRate = totalExecutions > 0 ? (successful / totalExecutions) * 100 : 0;
    const totalCost = executions.reduce((sum, e) => sum + e.cost.total, 0);
    const totalTokens = executions.reduce((sum, e) => sum + e.tokens.total, 0);
    const completedExecs = executions.filter(e => e.duration !== undefined);
    const avgDuration = completedExecs.length > 0
      ? completedExecs.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecs.length
      : 0;

    // Group by pipeline
    const pipelineStats = new Map<string, { count: number; success: number; name: string }>();
    for (const exec of executions) {
      const existing = pipelineStats.get(exec.pipelineId) || { count: 0, success: 0, name: exec.pipelineName };
      existing.count++;
      if (exec.status === 'completed') existing.success++;
      pipelineStats.set(exec.pipelineId, existing);
    }

    const topPipelines = Array.from(pipelineStats.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        count: stats.count,
        successRate: stats.count > 0 ? (stats.success / stats.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Build trends
    const costTrend: Array<{ date: string; cost: number }> = [];
    const executionTrend: Array<{ date: string; count: number; successRate: number }> = [];

    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const dayStats = this.dailyStats.get(dateKey);
      costTrend.unshift({
        date: dateKey,
        cost: dayStats?.totalCost || 0,
      });
      executionTrend.unshift({
        date: dateKey,
        count: dayStats?.executions || 0,
        successRate: dayStats?.executions
          ? ((dayStats.successful / dayStats.executions) * 100)
          : 0,
      });
    }

    return {
      period,
      totalExecutions,
      successRate: Math.round(successRate * 100) / 100,
      totalCost: Math.round(totalCost * 1000) / 1000,
      totalTokens,
      avgDuration: Math.round(avgDuration),
      topPipelines,
      costTrend,
      executionTrend,
    };
  }

  /**
   * Get token usage breakdown
   */
  getTokenUsageBreakdown(period: 'day' | 'week' | 'month' = 'week'): {
    total: TokenUsage;
    byTool: Record<string, TokenUsage>;
    byPipeline: Record<string, TokenUsage>;
    trend: Array<{ date: string; tokens: number }>;
  } {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const executions = Array.from(this.executions.values())
      .filter(e => e.startTime >= startDate.getTime());

    const total: TokenUsage = { input: 0, output: 0, total: 0 };
    const byTool: Record<string, TokenUsage> = {};
    const byPipeline: Record<string, TokenUsage> = {};

    for (const exec of executions) {
      // Total
      total.input += exec.tokens.input;
      total.output += exec.tokens.output;
      total.total += exec.tokens.total;

      // By pipeline
      if (!byPipeline[exec.pipelineId]) {
        byPipeline[exec.pipelineId] = { input: 0, output: 0, total: 0 };
      }
      byPipeline[exec.pipelineId].input += exec.tokens.input;
      byPipeline[exec.pipelineId].output += exec.tokens.output;
      byPipeline[exec.pipelineId].total += exec.tokens.total;

      // By tool
      for (const step of exec.steps) {
        if (!byTool[step.tool]) {
          byTool[step.tool] = { input: 0, output: 0, total: 0 };
        }
        byTool[step.tool].input += step.tokens.input;
        byTool[step.tool].output += step.tokens.output;
        byTool[step.tool].total += step.tokens.total;
      }
    }

    // Build trend
    const trend: Array<{ date: string; tokens: number }> = [];
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayStats = this.dailyStats.get(dateKey);
      trend.unshift({
        date: dateKey,
        tokens: dayStats?.totalTokens || 0,
      });
    }

    return { total, byTool, byPipeline, trend };
  }

  // Private methods
  private calculateStepCost(step: StepExecution): number {
    const inputCost = (step.tokens.input / 1000) * COST_PER_1K_INPUT;
    const outputCost = (step.tokens.output / 1000) * COST_PER_1K_OUTPUT;
    const apiCost = API_CALL_BASE_COST; // One API call per step

    return inputCost + outputCost + apiCost;
  }

  private updateExecutionTotals(execution: PipelineExecution): void {
    let totalInput = 0;
    let totalOutput = 0;
    let totalLLMCost = 0;
    let totalAPICost = 0;

    for (const step of execution.steps) {
      totalInput += step.tokens.input;
      totalOutput += step.tokens.output;
      totalLLMCost += (step.tokens.input / 1000) * COST_PER_1K_INPUT;
      totalLLMCost += (step.tokens.output / 1000) * COST_PER_1K_OUTPUT;
      totalAPICost += API_CALL_BASE_COST;
    }

    execution.tokens = {
      input: totalInput,
      output: totalOutput,
      total: totalInput + totalOutput,
    };

    execution.cost = {
      total: totalLLMCost + totalAPICost,
      breakdown: {
        llm: totalLLMCost,
        api: totalAPICost,
        compute: 0, // Could add compute costs later
      },
      currency: 'USD',
    };

    this.emit('cost:update', execution.id, execution.cost);
  }

  private updateDailyStats(execution: PipelineExecution): void {
    const dateKey = new Date(execution.startTime).toISOString().split('T')[0];

    let stats = this.dailyStats.get(dateKey);
    if (!stats) {
      stats = {
        date: dateKey,
        executions: 0,
        successful: 0,
        failed: 0,
        totalCost: 0,
        totalTokens: 0,
        avgDuration: 0,
        byPipeline: {},
      };
      this.dailyStats.set(dateKey, stats);
    }

    stats.executions++;
    if (execution.status === 'completed') stats.successful++;
    if (execution.status === 'failed') stats.failed++;
    stats.totalCost += execution.cost.total;
    stats.totalTokens += execution.tokens.total;

    // Update average duration
    const completedToday = Array.from(this.executions.values())
      .filter(e =>
        new Date(e.startTime).toISOString().split('T')[0] === dateKey &&
        e.duration !== undefined
      );
    if (completedToday.length > 0) {
      stats.avgDuration = completedToday.reduce((sum, e) => sum + (e.duration || 0), 0) / completedToday.length;
    }

    // Update by pipeline
    if (!stats.byPipeline[execution.pipelineId]) {
      stats.byPipeline[execution.pipelineId] = { count: 0, successRate: 0, avgCost: 0 };
    }
    const pipelineStats = stats.byPipeline[execution.pipelineId];
    pipelineStats.count++;

    const pipelineExecs = Array.from(this.executions.values())
      .filter(e =>
        e.pipelineId === execution.pipelineId &&
        new Date(e.startTime).toISOString().split('T')[0] === dateKey
      );
    const pipelineSuccessful = pipelineExecs.filter(e => e.status === 'completed').length;
    pipelineStats.successRate = pipelineExecs.length > 0
      ? (pipelineSuccessful / pipelineExecs.length) * 100
      : 0;
    pipelineStats.avgCost = pipelineExecs.reduce((sum, e) => sum + e.cost.total, 0) / pipelineExecs.length;

    this.emit('stats:daily', stats);
  }

  private cleanupOldExecutions(): void {
    if (this.executions.size <= this.maxExecutionsInMemory) return;

    // Remove oldest executions
    const sorted = Array.from(this.executions.entries())
      .sort(([, a], [, b]) => a.startTime - b.startTime);

    const toRemove = sorted.slice(0, sorted.length - this.maxExecutionsInMemory);
    for (const [id] of toRemove) {
      this.executions.delete(id);
    }
  }
}

// Singleton instance
let analyticsManager: AnalyticsManager | null = null;

/**
 * Get or create the analytics manager singleton
 */
export function getAnalyticsManager(config?: AnalyticsConfig): AnalyticsManager {
  if (!analyticsManager) {
    analyticsManager = new AnalyticsManager(config);
  }
  return analyticsManager;
}

/**
 * Create analytics manager with Supabase persistence
 */
export async function createPersistentAnalytics(
  storageConfig?: { url: string; serviceKey: string }
): Promise<AnalyticsManager> {
  // Lazy import to avoid circular dependency
  const { getSupabaseStorage } = await import('./storage/supabase.js');

  const storage = getSupabaseStorage(storageConfig ? {
    url: storageConfig.url,
    serviceKey: storageConfig.serviceKey,
    fallbackToMemory: true,
  } : undefined);

  await storage.initialize();

  const analytics = getAnalyticsManager({ persistent: true });
  await analytics.enablePersistence(storage);

  return analytics;
}
