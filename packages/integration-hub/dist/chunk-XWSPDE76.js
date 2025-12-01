// src/storage/supabase.ts
import { EventEmitter } from "eventemitter3";
var SupabaseStorage = class extends EventEmitter {
  config;
  isConnected = false;
  fallbackExecutions = /* @__PURE__ */ new Map();
  constructor(config) {
    super();
    this.config = {
      fallbackToMemory: true,
      ...config
    };
  }
  /**
   * Initialize connection and verify schema
   */
  async initialize() {
    try {
      const response = await this.query("SELECT 1 as test");
      if (response.ok) {
        this.isConnected = true;
        this.emit("connected");
        return true;
      }
      throw new Error("Connection test failed");
    } catch (error) {
      this.isConnected = false;
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
      if (this.config.fallbackToMemory) {
        console.warn("[SupabaseStorage] Using in-memory fallback");
        return true;
      }
      return false;
    }
  }
  /**
   * Check if connected to Supabase
   */
  get connected() {
    return this.isConnected;
  }
  // =========================================================================
  // PIPELINE EXECUTIONS
  // =========================================================================
  /**
   * Save a new pipeline execution
   */
  async saveExecution(execution) {
    if (!this.isConnected) {
      if (this.config.fallbackToMemory) {
        this.fallbackExecutions.set(execution.id, execution);
        this.emit("execution:saved", execution);
        return;
      }
      throw new Error("Not connected to Supabase");
    }
    const row = this.executionToRow(execution);
    const response = await this.query(
      `INSERT INTO pipeline_executions (
        execution_id, pipeline_id, pipeline_name, status, started_at,
        completed_at, duration_ms, total_tokens, input_tokens, output_tokens,
        total_cost, llm_cost, api_cost, steps, error, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (execution_id) DO UPDATE SET
        status = EXCLUDED.status,
        completed_at = EXCLUDED.completed_at,
        duration_ms = EXCLUDED.duration_ms,
        total_tokens = EXCLUDED.total_tokens,
        input_tokens = EXCLUDED.input_tokens,
        output_tokens = EXCLUDED.output_tokens,
        total_cost = EXCLUDED.total_cost,
        llm_cost = EXCLUDED.llm_cost,
        api_cost = EXCLUDED.api_cost,
        steps = EXCLUDED.steps,
        error = EXCLUDED.error`,
      [
        row.execution_id,
        row.pipeline_id,
        row.pipeline_name,
        row.status,
        row.started_at,
        row.completed_at,
        row.duration_ms,
        row.total_tokens,
        row.input_tokens,
        row.output_tokens,
        row.total_cost,
        row.llm_cost,
        row.api_cost,
        JSON.stringify(row.steps),
        row.error,
        JSON.stringify(row.metadata || {})
      ]
    );
    if (!response.ok) {
      throw new Error(`Failed to save execution: ${response.error}`);
    }
    this.emit("execution:saved", execution);
  }
  /**
   * Update an existing execution
   */
  async updateExecution(execution) {
    await this.saveExecution(execution);
    this.emit("execution:updated", execution);
  }
  /**
   * Get execution by ID
   */
  async getExecution(executionId) {
    if (!this.isConnected && this.config.fallbackToMemory) {
      return this.fallbackExecutions.get(executionId) || null;
    }
    const response = await this.query(
      "SELECT * FROM pipeline_executions WHERE execution_id = $1",
      [executionId]
    );
    if (!response.ok || !response.data?.length) {
      return null;
    }
    return this.rowToExecution(response.data[0]);
  }
  /**
   * Get recent executions
   */
  async getRecentExecutions(limit = 50) {
    if (!this.isConnected && this.config.fallbackToMemory) {
      return Array.from(this.fallbackExecutions.values()).sort((a, b) => b.startTime - a.startTime).slice(0, limit);
    }
    const response = await this.query(
      "SELECT * FROM pipeline_executions ORDER BY started_at DESC LIMIT $1",
      [limit]
    );
    if (!response.ok || !response.data) {
      return [];
    }
    return response.data.map((row) => this.rowToExecution(row));
  }
  /**
   * Get executions by pipeline ID
   */
  async getExecutionsByPipeline(pipelineId, limit = 20) {
    if (!this.isConnected && this.config.fallbackToMemory) {
      return Array.from(this.fallbackExecutions.values()).filter((e) => e.pipelineId === pipelineId).sort((a, b) => b.startTime - a.startTime).slice(0, limit);
    }
    const response = await this.query(
      "SELECT * FROM pipeline_executions WHERE pipeline_id = $1 ORDER BY started_at DESC LIMIT $2",
      [pipelineId, limit]
    );
    if (!response.ok || !response.data) {
      return [];
    }
    return response.data.map((row) => this.rowToExecution(row));
  }
  /**
   * Get executions in date range
   */
  async getExecutionsInRange(startDate, endDate) {
    if (!this.isConnected && this.config.fallbackToMemory) {
      return Array.from(this.fallbackExecutions.values()).filter((e) => e.startTime >= startDate.getTime() && e.startTime <= endDate.getTime()).sort((a, b) => b.startTime - a.startTime);
    }
    const response = await this.query(
      "SELECT * FROM pipeline_executions WHERE started_at >= $1 AND started_at <= $2 ORDER BY started_at DESC",
      [startDate.toISOString(), endDate.toISOString()]
    );
    if (!response.ok || !response.data) {
      return [];
    }
    return response.data.map((row) => this.rowToExecution(row));
  }
  // =========================================================================
  // DAILY ANALYTICS
  // =========================================================================
  /**
   * Get daily stats
   */
  async getDailyStats(date) {
    const dateKey = date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (!this.isConnected) {
      return null;
    }
    const response = await this.query(
      "SELECT * FROM daily_analytics WHERE date = $1",
      [dateKey]
    );
    if (!response.ok || !response.data?.length) {
      return null;
    }
    const row = response.data[0];
    return {
      date: row.date,
      executions: row.total_executions,
      successful: row.successful,
      failed: row.failed,
      totalCost: row.total_cost,
      totalTokens: row.total_tokens,
      avgDuration: row.avg_duration_ms,
      byPipeline: row.by_pipeline || {}
    };
  }
  /**
   * Get stats for date range
   */
  async getStatsRange(startDate, endDate) {
    if (!this.isConnected) {
      return [];
    }
    const response = await this.query(
      "SELECT * FROM daily_analytics WHERE date >= $1 AND date <= $2 ORDER BY date ASC",
      [startDate, endDate]
    );
    if (!response.ok || !response.data) {
      return [];
    }
    return response.data.map((row) => ({
      date: row.date,
      executions: row.total_executions,
      successful: row.successful,
      failed: row.failed,
      totalCost: row.total_cost,
      totalTokens: row.total_tokens,
      avgDuration: row.avg_duration_ms,
      byPipeline: row.by_pipeline || {}
    }));
  }
  /**
   * Get analytics summary
   */
  async getSummary(period) {
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
    const executions = await this.getExecutionsInRange(startDate, now);
    const totalExecutions = executions.length;
    const successful = executions.filter((e) => e.status === "completed").length;
    const successRate = totalExecutions > 0 ? successful / totalExecutions * 100 : 0;
    const totalCost = executions.reduce((sum, e) => sum + e.cost.total, 0);
    const totalTokens = executions.reduce((sum, e) => sum + e.tokens.total, 0);
    const completedExecs = executions.filter((e) => e.duration !== void 0);
    const avgDuration = completedExecs.length > 0 ? completedExecs.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecs.length : 0;
    const pipelineStats = /* @__PURE__ */ new Map();
    for (const exec of executions) {
      const existing = pipelineStats.get(exec.pipelineId) || {
        count: 0,
        success: 0,
        name: exec.pipelineName
      };
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
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    const statsRange = await this.getStatsRange(
      startDate.toISOString().split("T")[0],
      now.toISOString().split("T")[0]
    );
    const statsMap = new Map(statsRange.map((s) => [s.date, s]));
    const costTrend = [];
    const executionTrend = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split("T")[0];
      const dayStats = statsMap.get(dateKey);
      costTrend.push({
        date: dateKey,
        cost: dayStats?.totalCost || 0
      });
      executionTrend.push({
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
  // =========================================================================
  // WEBHOOK CONFIGURATIONS
  // =========================================================================
  /**
   * Save webhook config
   */
  async saveWebhook(webhook) {
    const response = await this.query(
      `INSERT INTO webhook_configs (name, url, secret, events, enabled, retry_count, timeout_ms, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at, updated_at`,
      [
        webhook.name,
        webhook.url,
        webhook.secret,
        webhook.events,
        webhook.enabled,
        webhook.retryCount,
        webhook.timeoutMs,
        JSON.stringify(webhook.metadata || {})
      ]
    );
    if (!response.ok || !response.data?.length) {
      throw new Error("Failed to save webhook");
    }
    const row = response.data[0];
    return {
      ...webhook,
      id: row.id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  /**
   * Get all enabled webhooks
   */
  async getEnabledWebhooks() {
    const response = await this.query(
      "SELECT * FROM webhook_configs WHERE enabled = true"
    );
    if (!response.ok || !response.data) {
      return [];
    }
    return response.data.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      secret: row.secret,
      events: row.events,
      enabled: row.enabled,
      retryCount: row.retry_count,
      timeoutMs: row.timeout_ms,
      lastTriggeredAt: row.last_triggered_at ? new Date(row.last_triggered_at) : void 0,
      lastStatus: row.last_status,
      failureCount: row.failure_count,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }
  /**
   * Record webhook delivery
   */
  async recordDelivery(delivery) {
    await this.query(
      `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status, attempts, response_status, response_body, error, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        delivery.webhookId,
        delivery.eventType,
        JSON.stringify(delivery.payload),
        delivery.status,
        delivery.attempts,
        delivery.responseStatus,
        delivery.responseBody,
        delivery.error,
        delivery.deliveredAt?.toISOString()
      ]
    );
  }
  // =========================================================================
  // PIPELINE TEMPLATES
  // =========================================================================
  /**
   * Save pipeline template
   */
  async saveTemplate(template) {
    const response = await this.query(
      `INSERT INTO pipeline_templates (name, description, category, steps, default_inputs, is_public, author, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at, updated_at`,
      [
        template.name,
        template.description,
        template.category,
        JSON.stringify(template.steps),
        JSON.stringify(template.defaultInputs || {}),
        template.isPublic,
        template.author,
        template.tags,
        JSON.stringify(template.metadata || {})
      ]
    );
    if (!response.ok || !response.data?.length) {
      throw new Error("Failed to save template");
    }
    const row = response.data[0];
    return {
      ...template,
      id: row.id,
      usageCount: 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  /**
   * Get public templates
   */
  async getPublicTemplates(category) {
    let sql = "SELECT * FROM pipeline_templates WHERE is_public = true";
    const params = [];
    if (category) {
      sql += " AND category = $1";
      params.push(category);
    }
    sql += " ORDER BY usage_count DESC";
    const response = await this.query(sql, params);
    if (!response.ok || !response.data) {
      return [];
    }
    return response.data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      steps: row.steps,
      defaultInputs: row.default_inputs,
      isPublic: row.is_public,
      usageCount: row.usage_count,
      avgCost: row.avg_cost,
      avgDurationMs: row.avg_duration_ms,
      successRate: row.success_rate,
      author: row.author,
      tags: row.tags,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }
  /**
   * Increment template usage count
   */
  async incrementTemplateUsage(templateId) {
    await this.query(
      "UPDATE pipeline_templates SET usage_count = usage_count + 1 WHERE id = $1",
      [templateId]
    );
  }
  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================
  async query(sql, params = []) {
    try {
      const response = await fetch(`${this.config.url}/rest/v1/rpc/raw_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.config.serviceKey,
          Authorization: `Bearer ${this.config.serviceKey}`,
          Prefer: "return=representation"
        },
        body: JSON.stringify({ query: sql, params })
      });
      if (!response.ok) {
        return this.postgrestQuery(sql, params);
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return this.postgrestQuery(sql, params);
    }
  }
  async postgrestQuery(sql, params) {
    const selectMatch = sql.match(/SELECT\s+\*\s+FROM\s+(\w+)/i);
    const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
    if (selectMatch) {
      const table = selectMatch[1];
      try {
        let url = `${this.config.url}/rest/v1/${table}?select=*`;
        const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\$(\d+)/gi);
        if (whereMatch && params.length > 0) {
          whereMatch.forEach((match) => {
            const [, col, idx] = match.match(/WHERE\s+(\w+)\s*=\s*\$(\d+)/i) || [];
            if (col && idx) {
              url += `&${col}=eq.${encodeURIComponent(String(params[parseInt(idx) - 1]))}`;
            }
          });
        }
        const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)?/i);
        if (orderMatch) {
          const [, col, dir] = orderMatch;
          url += `&order=${col}.${(dir || "asc").toLowerCase()}`;
        }
        const limitMatch = sql.match(/LIMIT\s+\$?(\d+)/i);
        if (limitMatch) {
          const limitIdx = parseInt(limitMatch[1]);
          const limit = sql.includes("$") ? params[limitIdx - 1] : limitIdx;
          url += `&limit=${limit}`;
        }
        const response = await fetch(url, {
          headers: {
            apikey: this.config.serviceKey,
            Authorization: `Bearer ${this.config.serviceKey}`
          }
        });
        if (!response.ok) {
          return { ok: false, error: `HTTP ${response.status}` };
        }
        const data = await response.json();
        return { ok: true, data };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    }
    if (insertMatch) {
      const table = insertMatch[1];
      try {
        const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
        if (!colsMatch) {
          return { ok: false, error: "Could not parse INSERT columns" };
        }
        const columns = colsMatch[1].split(",").map((c) => c.trim());
        const body = {};
        columns.forEach((col, idx) => {
          body[col] = params[idx];
        });
        const response = await fetch(`${this.config.url}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: this.config.serviceKey,
            Authorization: `Bearer ${this.config.serviceKey}`,
            Prefer: "return=representation"
          },
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          return { ok: false, error: `HTTP ${response.status}` };
        }
        const data = await response.json();
        return { ok: true, data };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    }
    if (sql.includes("SELECT 1")) {
      return { ok: true, data: [{ test: 1 }] };
    }
    return { ok: false, error: "Unsupported query type" };
  }
  executionToRow(execution) {
    return {
      execution_id: execution.id,
      pipeline_id: execution.pipelineId,
      pipeline_name: execution.pipelineName,
      status: execution.status,
      started_at: new Date(execution.startTime).toISOString(),
      completed_at: execution.endTime ? new Date(execution.endTime).toISOString() : void 0,
      duration_ms: execution.duration,
      total_tokens: execution.tokens.total,
      input_tokens: execution.tokens.input,
      output_tokens: execution.tokens.output,
      total_cost: execution.cost.total,
      llm_cost: execution.cost.breakdown.llm,
      api_cost: execution.cost.breakdown.api,
      steps: execution.steps,
      error: execution.error,
      metadata: {}
    };
  }
  rowToExecution(row) {
    return {
      id: row.execution_id,
      pipelineId: row.pipeline_id,
      pipelineName: row.pipeline_name,
      status: row.status,
      startTime: new Date(row.started_at).getTime(),
      endTime: row.completed_at ? new Date(row.completed_at).getTime() : void 0,
      duration: row.duration_ms,
      steps: row.steps,
      tokens: {
        input: row.input_tokens,
        output: row.output_tokens,
        total: row.total_tokens
      },
      cost: {
        total: row.total_cost,
        breakdown: {
          llm: row.llm_cost,
          api: row.api_cost,
          compute: 0
        },
        currency: "USD"
      },
      error: row.error
    };
  }
};
var storageInstance = null;
function getSupabaseStorage(config) {
  if (!storageInstance && config) {
    storageInstance = new SupabaseStorage(config);
  }
  if (!storageInstance) {
    storageInstance = new SupabaseStorage({
      url: process.env.SUPABASE_URL || "",
      serviceKey: process.env.SUPABASE_SERVICE_KEY || "",
      fallbackToMemory: true
    });
  }
  return storageInstance;
}
async function initializeStorage() {
  const storage = getSupabaseStorage();
  await storage.initialize();
  return storage;
}

export {
  SupabaseStorage,
  getSupabaseStorage,
  initializeStorage
};
//# sourceMappingURL=chunk-XWSPDE76.js.map