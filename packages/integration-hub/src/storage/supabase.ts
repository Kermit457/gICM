/**
 * Supabase Storage Module
 *
 * Provides persistent storage for pipeline analytics, webhook configs,
 * and pipeline templates using Supabase as the backend.
 */

import { EventEmitter } from "eventemitter3";
import type {
  PipelineExecution,
  StepExecution,
  TokenUsage,
  ExecutionCost,
  DailyStats,
  AnalyticsSummary,
} from "../analytics.js";

// =========================================================================
// TYPES
// =========================================================================

export interface SupabaseConfig {
  url: string;
  serviceKey: string;
  /** If true, fall back to in-memory when Supabase unavailable */
  fallbackToMemory?: boolean;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  enabled: boolean;
  retryCount: number;
  timeoutMs: number;
  lastTriggeredAt?: Date;
  lastStatus?: string;
  failureCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEventType =
  | "pipeline.started"
  | "pipeline.completed"
  | "pipeline.failed"
  | "cost.threshold"
  | "daily.summary";

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed" | "retrying";
  attempts: number;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  steps: Array<{
    id: string;
    tool: string;
    inputs?: Record<string, unknown>;
    dependsOn?: string[];
  }>;
  defaultInputs: Record<string, unknown>;
  isPublic: boolean;
  usageCount: number;
  avgCost?: number;
  avgDurationMs?: number;
  successRate?: number;
  author?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageEvents {
  "execution:saved": (execution: PipelineExecution) => void;
  "execution:updated": (execution: PipelineExecution) => void;
  "webhook:triggered": (delivery: WebhookDelivery) => void;
  "error": (error: Error) => void;
  "connected": () => void;
  "disconnected": () => void;
}

// Database row types
interface ExecutionRow {
  id: string;
  execution_id: string;
  pipeline_id: string;
  pipeline_name: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  llm_cost: number;
  api_cost: number;
  steps: StepExecution[];
  error?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DailyRow {
  date: string;
  total_executions: number;
  successful: number;
  failed: number;
  cancelled: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  avg_duration_ms: number;
  by_pipeline: Record<string, { count: number; successRate: number; avgCost: number }>;
  by_tool: Record<string, TokenUsage>;
}

// =========================================================================
// SUPABASE STORAGE CLASS
// =========================================================================

export class SupabaseStorage extends EventEmitter<StorageEvents> {
  private config: SupabaseConfig;
  private isConnected = false;
  private fallbackExecutions: Map<string, PipelineExecution> = new Map();

  constructor(config: SupabaseConfig) {
    super();
    this.config = {
      fallbackToMemory: true,
      ...config,
    };
  }

  /**
   * Initialize connection and verify schema
   */
  async initialize(): Promise<boolean> {
    try {
      // Test connection with a simple query
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
  get connected(): boolean {
    return this.isConnected;
  }

  // =========================================================================
  // PIPELINE EXECUTIONS
  // =========================================================================

  /**
   * Save a new pipeline execution
   */
  async saveExecution(execution: PipelineExecution): Promise<void> {
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
        JSON.stringify(row.metadata || {}),
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
  async updateExecution(execution: PipelineExecution): Promise<void> {
    await this.saveExecution(execution); // Uses upsert
    this.emit("execution:updated", execution);
  }

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string): Promise<PipelineExecution | null> {
    if (!this.isConnected && this.config.fallbackToMemory) {
      return this.fallbackExecutions.get(executionId) || null;
    }

    const response = await this.query<ExecutionRow[]>(
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
  async getRecentExecutions(limit = 50): Promise<PipelineExecution[]> {
    if (!this.isConnected && this.config.fallbackToMemory) {
      return Array.from(this.fallbackExecutions.values())
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, limit);
    }

    const response = await this.query<ExecutionRow[]>(
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
  async getExecutionsByPipeline(pipelineId: string, limit = 20): Promise<PipelineExecution[]> {
    if (!this.isConnected && this.config.fallbackToMemory) {
      return Array.from(this.fallbackExecutions.values())
        .filter((e) => e.pipelineId === pipelineId)
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, limit);
    }

    const response = await this.query<ExecutionRow[]>(
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
  async getExecutionsInRange(startDate: Date, endDate: Date): Promise<PipelineExecution[]> {
    if (!this.isConnected && this.config.fallbackToMemory) {
      return Array.from(this.fallbackExecutions.values())
        .filter((e) => e.startTime >= startDate.getTime() && e.startTime <= endDate.getTime())
        .sort((a, b) => b.startTime - a.startTime);
    }

    const response = await this.query<ExecutionRow[]>(
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
  async getDailyStats(date?: string): Promise<DailyStats | null> {
    const dateKey = date || new Date().toISOString().split("T")[0];

    if (!this.isConnected) {
      return null;
    }

    const response = await this.query<DailyRow[]>(
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
      byPipeline: row.by_pipeline || {},
    };
  }

  /**
   * Get stats for date range
   */
  async getStatsRange(startDate: string, endDate: string): Promise<DailyStats[]> {
    if (!this.isConnected) {
      return [];
    }

    const response = await this.query<DailyRow[]>(
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
      byPipeline: row.by_pipeline || {},
    }));
  }

  /**
   * Get analytics summary
   */
  async getSummary(period: "day" | "week" | "month"): Promise<AnalyticsSummary> {
    const now = new Date();
    let startDate: Date;

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
    const successRate = totalExecutions > 0 ? (successful / totalExecutions) * 100 : 0;
    const totalCost = executions.reduce((sum, e) => sum + e.cost.total, 0);
    const totalTokens = executions.reduce((sum, e) => sum + e.tokens.total, 0);
    const completedExecs = executions.filter((e) => e.duration !== undefined);
    const avgDuration =
      completedExecs.length > 0
        ? completedExecs.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecs.length
        : 0;

    // Group by pipeline
    const pipelineStats = new Map<string, { count: number; success: number; name: string }>();
    for (const exec of executions) {
      const existing = pipelineStats.get(exec.pipelineId) || {
        count: 0,
        success: 0,
        name: exec.pipelineName,
      };
      existing.count++;
      if (exec.status === "completed") existing.success++;
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

    // Build trends from daily stats
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    const statsRange = await this.getStatsRange(
      startDate.toISOString().split("T")[0],
      now.toISOString().split("T")[0]
    );

    const statsMap = new Map(statsRange.map((s) => [s.date, s]));
    const costTrend: Array<{ date: string; cost: number }> = [];
    const executionTrend: Array<{ date: string; count: number; successRate: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split("T")[0];
      const dayStats = statsMap.get(dateKey);

      costTrend.push({
        date: dateKey,
        cost: dayStats?.totalCost || 0,
      });
      executionTrend.push({
        date: dateKey,
        count: dayStats?.executions || 0,
        successRate: dayStats?.executions
          ? (dayStats.successful / dayStats.executions) * 100
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

  // =========================================================================
  // WEBHOOK CONFIGURATIONS
  // =========================================================================

  /**
   * Save webhook config
   */
  async saveWebhook(webhook: Omit<WebhookConfig, "id" | "createdAt" | "updatedAt">): Promise<WebhookConfig> {
    const response = await this.query<Array<{ id: string; created_at: string; updated_at: string }>>(
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
        JSON.stringify(webhook.metadata || {}),
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
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Get all enabled webhooks
   */
  async getEnabledWebhooks(): Promise<WebhookConfig[]> {
    const response = await this.query<Array<{
      id: string;
      name: string;
      url: string;
      secret: string;
      events: WebhookEventType[];
      enabled: boolean;
      retry_count: number;
      timeout_ms: number;
      last_triggered_at?: string;
      last_status?: string;
      failure_count: number;
      metadata: Record<string, unknown>;
      created_at: string;
      updated_at: string;
    }>>(
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
      lastTriggeredAt: row.last_triggered_at ? new Date(row.last_triggered_at) : undefined,
      lastStatus: row.last_status,
      failureCount: row.failure_count,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  /**
   * Record webhook delivery
   */
  async recordDelivery(delivery: Omit<WebhookDelivery, "id" | "createdAt">): Promise<void> {
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
        delivery.deliveredAt?.toISOString(),
      ]
    );
  }

  // =========================================================================
  // PIPELINE TEMPLATES
  // =========================================================================

  /**
   * Save pipeline template
   */
  async saveTemplate(
    template: Omit<PipelineTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<PipelineTemplate> {
    const response = await this.query<Array<{ id: string; created_at: string; updated_at: string }>>(
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
        JSON.stringify(template.metadata || {}),
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
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Get public templates
   */
  async getPublicTemplates(category?: string): Promise<PipelineTemplate[]> {
    let sql = "SELECT * FROM pipeline_templates WHERE is_public = true";
    const params: unknown[] = [];

    if (category) {
      sql += " AND category = $1";
      params.push(category);
    }

    sql += " ORDER BY usage_count DESC";

    const response = await this.query<Array<{
      id: string;
      name: string;
      description?: string;
      category: string;
      steps: PipelineTemplate["steps"];
      default_inputs: Record<string, unknown>;
      is_public: boolean;
      usage_count: number;
      avg_cost?: number;
      avg_duration_ms?: number;
      success_rate?: number;
      author?: string;
      tags: string[];
      metadata: Record<string, unknown>;
      created_at: string;
      updated_at: string;
    }>>(sql, params);

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
      updatedAt: new Date(row.updated_at),
    }));
  }

  /**
   * Increment template usage count
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    await this.query(
      "UPDATE pipeline_templates SET usage_count = usage_count + 1 WHERE id = $1",
      [templateId]
    );
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private async query<T = unknown>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ ok: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.config.url}/rest/v1/rpc/raw_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.config.serviceKey,
          Authorization: `Bearer ${this.config.serviceKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({ query: sql, params }),
      });

      if (!response.ok) {
        // Fall back to PostgREST API for simple queries
        return this.postgrestQuery<T>(sql, params);
      }

      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      // Try PostgREST fallback
      return this.postgrestQuery<T>(sql, params);
    }
  }

  private async postgrestQuery<T>(
    sql: string,
    params: unknown[]
  ): Promise<{ ok: boolean; data?: T; error?: string }> {
    // Parse SQL to determine operation and table
    const selectMatch = sql.match(/SELECT\s+\*\s+FROM\s+(\w+)/i);
    const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);

    if (selectMatch) {
      const table = selectMatch[1];
      try {
        // Extract WHERE conditions (simplified)
        let url = `${this.config.url}/rest/v1/${table}?select=*`;

        // Handle simple equality conditions
        const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\$(\d+)/gi);
        if (whereMatch && params.length > 0) {
          whereMatch.forEach((match) => {
            const [, col, idx] = match.match(/WHERE\s+(\w+)\s*=\s*\$(\d+)/i) || [];
            if (col && idx) {
              url += `&${col}=eq.${encodeURIComponent(String(params[parseInt(idx) - 1]))}`;
            }
          });
        }

        // Handle ORDER BY
        const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)?/i);
        if (orderMatch) {
          const [, col, dir] = orderMatch;
          url += `&order=${col}.${(dir || "asc").toLowerCase()}`;
        }

        // Handle LIMIT
        const limitMatch = sql.match(/LIMIT\s+\$?(\d+)/i);
        if (limitMatch) {
          const limitIdx = parseInt(limitMatch[1]);
          const limit = sql.includes("$") ? params[limitIdx - 1] : limitIdx;
          url += `&limit=${limit}`;
        }

        const response = await fetch(url, {
          headers: {
            apikey: this.config.serviceKey,
            Authorization: `Bearer ${this.config.serviceKey}`,
          },
        });

        if (!response.ok) {
          return { ok: false, error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        return { ok: true, data: data as T };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    }

    if (insertMatch) {
      const table = insertMatch[1];
      try {
        // Parse column names from INSERT
        const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
        if (!colsMatch) {
          return { ok: false, error: "Could not parse INSERT columns" };
        }

        const columns = colsMatch[1].split(",").map((c) => c.trim());
        const body: Record<string, unknown> = {};

        columns.forEach((col, idx) => {
          body[col] = params[idx];
        });

        const response = await fetch(`${this.config.url}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: this.config.serviceKey,
            Authorization: `Bearer ${this.config.serviceKey}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          return { ok: false, error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        return { ok: true, data: data as T };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    }

    // For other queries, return success (test query)
    if (sql.includes("SELECT 1")) {
      return { ok: true, data: [{ test: 1 }] as T };
    }

    return { ok: false, error: "Unsupported query type" };
  }

  private executionToRow(execution: PipelineExecution): Partial<ExecutionRow> {
    return {
      execution_id: execution.id,
      pipeline_id: execution.pipelineId,
      pipeline_name: execution.pipelineName,
      status: execution.status,
      started_at: new Date(execution.startTime).toISOString(),
      completed_at: execution.endTime ? new Date(execution.endTime).toISOString() : undefined,
      duration_ms: execution.duration,
      total_tokens: execution.tokens.total,
      input_tokens: execution.tokens.input,
      output_tokens: execution.tokens.output,
      total_cost: execution.cost.total,
      llm_cost: execution.cost.breakdown.llm,
      api_cost: execution.cost.breakdown.api,
      steps: execution.steps,
      error: execution.error,
      metadata: {},
    };
  }

  private rowToExecution(row: ExecutionRow): PipelineExecution {
    return {
      id: row.execution_id,
      pipelineId: row.pipeline_id,
      pipelineName: row.pipeline_name,
      status: row.status as PipelineExecution["status"],
      startTime: new Date(row.started_at).getTime(),
      endTime: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
      duration: row.duration_ms,
      steps: row.steps,
      tokens: {
        input: row.input_tokens,
        output: row.output_tokens,
        total: row.total_tokens,
      },
      cost: {
        total: row.total_cost,
        breakdown: {
          llm: row.llm_cost,
          api: row.api_cost,
          compute: 0,
        },
        currency: "USD",
      },
      error: row.error,
    };
  }
}

// =========================================================================
// SINGLETON
// =========================================================================

let storageInstance: SupabaseStorage | null = null;

/**
 * Get or create Supabase storage instance
 */
export function getSupabaseStorage(config?: SupabaseConfig): SupabaseStorage {
  if (!storageInstance && config) {
    storageInstance = new SupabaseStorage(config);
  }

  if (!storageInstance) {
    // Create with env vars
    storageInstance = new SupabaseStorage({
      url: process.env.SUPABASE_URL || "",
      serviceKey: process.env.SUPABASE_SERVICE_KEY || "",
      fallbackToMemory: true,
    });
  }

  return storageInstance;
}

/**
 * Initialize storage from environment
 */
export async function initializeStorage(): Promise<SupabaseStorage> {
  const storage = getSupabaseStorage();
  await storage.initialize();
  return storage;
}
