// src/analytics.ts
import { EventEmitter } from "eventemitter3";
var COST_PER_1K_INPUT = 3e-3;
var COST_PER_1K_OUTPUT = 0.015;
var API_CALL_BASE_COST = 1e-3;
var AnalyticsManager = class extends EventEmitter {
  executions = /* @__PURE__ */ new Map();
  dailyStats = /* @__PURE__ */ new Map();
  maxExecutionsInMemory = 1e3;
  storage = null;
  config;
  constructor(config = {}) {
    super();
    this.config = {
      persistent: false,
      maxInMemory: 1e3,
      autoSync: true,
      ...config
    };
    this.maxExecutionsInMemory = this.config.maxInMemory;
  }
  /**
   * Enable persistent storage with Supabase
   */
  async enablePersistence(storage) {
    this.storage = storage;
    this.config.persistent = true;
    if (storage.connected) {
      try {
        const recent = await storage.getRecentExecutions(this.maxExecutionsInMemory);
        for (const exec of recent) {
          this.executions.set(exec.id, exec);
        }
        console.log(`[Analytics] Loaded ${recent.length} executions from storage`);
      } catch (error) {
        console.error("[Analytics] Failed to load from storage:", error);
      }
    }
  }
  /**
   * Check if persistent storage is enabled
   */
  get isPersistent() {
    return this.config.persistent === true && this.storage !== null;
  }
  /**
   * Start tracking a new pipeline execution
   */
  startExecution(pipelineId, pipelineName, stepCount) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const execution = {
      id: executionId,
      pipelineId,
      pipelineName,
      status: "running",
      startTime: Date.now(),
      steps: [],
      cost: {
        total: 0,
        breakdown: { llm: 0, api: 0, compute: 0 },
        currency: "USD"
      },
      tokens: { input: 0, output: 0, total: 0 }
    };
    this.executions.set(executionId, execution);
    this.emit("execution:start", execution);
    if (this.isPersistent && this.config.autoSync) {
      this.storage.saveExecution(execution).catch((err) => {
        console.error("[Analytics] Failed to save execution to storage:", err);
      });
    }
    this.cleanupOldExecutions();
    return executionId;
  }
  /**
   * Record step execution
   */
  recordStep(executionId, stepId, tool, status, tokens, error) {
    const execution = this.executions.get(executionId);
    if (!execution) return;
    let step = execution.steps.find((s) => s.id === stepId);
    if (!step) {
      step = {
        id: stepId,
        tool,
        status: "pending",
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0
      };
      execution.steps.push(step);
    }
    if (status === "running" && !step.startTime) {
      step.startTime = Date.now();
    }
    step.status = status;
    if (["completed", "failed", "skipped"].includes(status)) {
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
    step.cost = this.calculateStepCost(step);
    this.updateExecutionTotals(execution);
    this.emit("step:complete", step, executionId);
  }
  /**
   * Complete pipeline execution
   */
  completeExecution(executionId, status, error) {
    const execution = this.executions.get(executionId);
    if (!execution) return void 0;
    execution.status = status;
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;
    if (error) {
      execution.error = error;
    }
    this.updateExecutionTotals(execution);
    this.updateDailyStats(execution);
    if (this.isPersistent && this.config.autoSync) {
      this.storage.updateExecution(execution).catch((err) => {
        console.error("[Analytics] Failed to update execution in storage:", err);
      });
    }
    this.emit("execution:complete", execution);
    return execution;
  }
  /**
   * Get execution by ID
   */
  getExecution(executionId) {
    return this.executions.get(executionId);
  }
  /**
   * Get recent executions
   */
  getRecentExecutions(limit = 50) {
    return Array.from(this.executions.values()).sort((a, b) => b.startTime - a.startTime).slice(0, limit);
  }
  /**
   * Get executions by pipeline ID
   */
  getExecutionsByPipeline(pipelineId, limit = 20) {
    return Array.from(this.executions.values()).filter((e) => e.pipelineId === pipelineId).sort((a, b) => b.startTime - a.startTime).slice(0, limit);
  }
  /**
   * Get daily statistics
   */
  getDailyStats(date) {
    const dateKey = date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return this.dailyStats.get(dateKey);
  }
  /**
   * Get statistics for a date range
   */
  getStatsRange(startDate, endDate) {
    const stats = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const dateKey = current.toISOString().split("T")[0];
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
  getSummary(period = "week") {
    const now = /* @__PURE__ */ new Date();
    let startDate;
    switch (period) {
      case "day":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    const executions = Array.from(this.executions.values()).filter((e) => e.startTime >= startDate.getTime());
    const totalExecutions = executions.length;
    const successful = executions.filter((e) => e.status === "completed").length;
    const successRate = totalExecutions > 0 ? successful / totalExecutions * 100 : 0;
    const totalCost = executions.reduce((sum, e) => sum + e.cost.total, 0);
    const totalTokens = executions.reduce((sum, e) => sum + e.tokens.total, 0);
    const completedExecs = executions.filter((e) => e.duration !== void 0);
    const avgDuration = completedExecs.length > 0 ? completedExecs.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecs.length : 0;
    const pipelineStats = /* @__PURE__ */ new Map();
    for (const exec of executions) {
      const existing = pipelineStats.get(exec.pipelineId) || { count: 0, success: 0, name: exec.pipelineName };
      existing.count++;
      if (exec.status === "completed") existing.success++;
      pipelineStats.set(exec.pipelineId, existing);
    }
    const topPipelines = Array.from(pipelineStats.entries()).map(([id, stats]) => ({
      id,
      name: stats.name,
      count: stats.count,
      successRate: stats.count > 0 ? stats.success / stats.count * 100 : 0
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    const costTrend = [];
    const executionTrend = [];
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      const dayStats = this.dailyStats.get(dateKey);
      costTrend.unshift({
        date: dateKey,
        cost: dayStats?.totalCost || 0
      });
      executionTrend.unshift({
        date: dateKey,
        count: dayStats?.executions || 0,
        successRate: dayStats?.executions ? dayStats.successful / dayStats.executions * 100 : 0
      });
    }
    return {
      period,
      totalExecutions,
      successRate: Math.round(successRate * 100) / 100,
      totalCost: Math.round(totalCost * 1e3) / 1e3,
      totalTokens,
      avgDuration: Math.round(avgDuration),
      topPipelines,
      costTrend,
      executionTrend
    };
  }
  /**
   * Get token usage breakdown
   */
  getTokenUsageBreakdown(period = "week") {
    const now = /* @__PURE__ */ new Date();
    let startDate;
    switch (period) {
      case "day":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    const executions = Array.from(this.executions.values()).filter((e) => e.startTime >= startDate.getTime());
    const total = { input: 0, output: 0, total: 0 };
    const byTool = {};
    const byPipeline = {};
    for (const exec of executions) {
      total.input += exec.tokens.input;
      total.output += exec.tokens.output;
      total.total += exec.tokens.total;
      if (!byPipeline[exec.pipelineId]) {
        byPipeline[exec.pipelineId] = { input: 0, output: 0, total: 0 };
      }
      byPipeline[exec.pipelineId].input += exec.tokens.input;
      byPipeline[exec.pipelineId].output += exec.tokens.output;
      byPipeline[exec.pipelineId].total += exec.tokens.total;
      for (const step of exec.steps) {
        if (!byTool[step.tool]) {
          byTool[step.tool] = { input: 0, output: 0, total: 0 };
        }
        byTool[step.tool].input += step.tokens.input;
        byTool[step.tool].output += step.tokens.output;
        byTool[step.tool].total += step.tokens.total;
      }
    }
    const trend = [];
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      const dayStats = this.dailyStats.get(dateKey);
      trend.unshift({
        date: dateKey,
        tokens: dayStats?.totalTokens || 0
      });
    }
    return { total, byTool, byPipeline, trend };
  }
  // Private methods
  calculateStepCost(step) {
    const inputCost = step.tokens.input / 1e3 * COST_PER_1K_INPUT;
    const outputCost = step.tokens.output / 1e3 * COST_PER_1K_OUTPUT;
    const apiCost = API_CALL_BASE_COST;
    return inputCost + outputCost + apiCost;
  }
  updateExecutionTotals(execution) {
    let totalInput = 0;
    let totalOutput = 0;
    let totalLLMCost = 0;
    let totalAPICost = 0;
    for (const step of execution.steps) {
      totalInput += step.tokens.input;
      totalOutput += step.tokens.output;
      totalLLMCost += step.tokens.input / 1e3 * COST_PER_1K_INPUT;
      totalLLMCost += step.tokens.output / 1e3 * COST_PER_1K_OUTPUT;
      totalAPICost += API_CALL_BASE_COST;
    }
    execution.tokens = {
      input: totalInput,
      output: totalOutput,
      total: totalInput + totalOutput
    };
    execution.cost = {
      total: totalLLMCost + totalAPICost,
      breakdown: {
        llm: totalLLMCost,
        api: totalAPICost,
        compute: 0
        // Could add compute costs later
      },
      currency: "USD"
    };
    this.emit("cost:update", execution.id, execution.cost);
  }
  updateDailyStats(execution) {
    const dateKey = new Date(execution.startTime).toISOString().split("T")[0];
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
        byPipeline: {}
      };
      this.dailyStats.set(dateKey, stats);
    }
    stats.executions++;
    if (execution.status === "completed") stats.successful++;
    if (execution.status === "failed") stats.failed++;
    stats.totalCost += execution.cost.total;
    stats.totalTokens += execution.tokens.total;
    const completedToday = Array.from(this.executions.values()).filter(
      (e) => new Date(e.startTime).toISOString().split("T")[0] === dateKey && e.duration !== void 0
    );
    if (completedToday.length > 0) {
      stats.avgDuration = completedToday.reduce((sum, e) => sum + (e.duration || 0), 0) / completedToday.length;
    }
    if (!stats.byPipeline[execution.pipelineId]) {
      stats.byPipeline[execution.pipelineId] = { count: 0, successRate: 0, avgCost: 0 };
    }
    const pipelineStats = stats.byPipeline[execution.pipelineId];
    pipelineStats.count++;
    const pipelineExecs = Array.from(this.executions.values()).filter(
      (e) => e.pipelineId === execution.pipelineId && new Date(e.startTime).toISOString().split("T")[0] === dateKey
    );
    const pipelineSuccessful = pipelineExecs.filter((e) => e.status === "completed").length;
    pipelineStats.successRate = pipelineExecs.length > 0 ? pipelineSuccessful / pipelineExecs.length * 100 : 0;
    pipelineStats.avgCost = pipelineExecs.reduce((sum, e) => sum + e.cost.total, 0) / pipelineExecs.length;
    this.emit("stats:daily", stats);
  }
  cleanupOldExecutions() {
    if (this.executions.size <= this.maxExecutionsInMemory) return;
    const sorted = Array.from(this.executions.entries()).sort(([, a], [, b]) => a.startTime - b.startTime);
    const toRemove = sorted.slice(0, sorted.length - this.maxExecutionsInMemory);
    for (const [id] of toRemove) {
      this.executions.delete(id);
    }
  }
};
var analyticsManager = null;
function getAnalyticsManager(config) {
  if (!analyticsManager) {
    analyticsManager = new AnalyticsManager(config);
  }
  return analyticsManager;
}
async function createPersistentAnalytics(storageConfig) {
  const { getSupabaseStorage } = await import("./supabase-IHC4YPON.js");
  const storage = getSupabaseStorage(storageConfig ? {
    url: storageConfig.url,
    serviceKey: storageConfig.serviceKey,
    fallbackToMemory: true
  } : void 0);
  await storage.initialize();
  const analytics = getAnalyticsManager({ persistent: true });
  await analytics.enablePersistence(storage);
  return analytics;
}

export {
  AnalyticsManager,
  getAnalyticsManager,
  createPersistentAnalytics
};
//# sourceMappingURL=chunk-SWYYQHAY.js.map