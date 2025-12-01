/**
 * SDK Client Implementation
 * Phase 9E: SDK Generation
 */

import {
  SDKConfig,
  Pipeline,
  Execution,
  Schedule,
  Budget,
  Webhook,
  AnalyticsSummary,
  QueueJob,
  Organization,
  Member,
  AuditEvent,
  CreatePipelineInput,
  ExecutePipelineInput,
  CreateScheduleInput,
  CreateBudgetInput,
  CreateWebhookInput,
  CreateQueueJobInput,
  InviteMemberInput,
} from "./types.js";

// ============================================================================
// HTTP CLIENT
// ============================================================================

class HttpClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;
  private retries: number;

  constructor(config: SDKConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.headers = {
      "Content-Type": "application/json",
      ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      ...config.headers,
    };
  }

  async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; query?: Record<string, string> }
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (options?.query) {
      const params = new URLSearchParams(options.query);
      url += `?${params.toString()}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers: this.headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new SDKError(
            errorData.error || `HTTP ${response.status}`,
            response.status,
            errorData
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors
        if (error instanceof SDKError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Wait before retry
        if (attempt < this.retries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  get<T>(path: string, query?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, { query });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class SDKError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "SDKError";
  }
}

// ============================================================================
// RESOURCE CLIENTS
// ============================================================================

class PipelinesClient {
  constructor(private http: HttpClient) {}

  async list(options?: { page?: number; pageSize?: number }): Promise<{ pipelines: Pipeline[]; total: number }> {
    return this.http.get("/api/pipelines", {
      page: String(options?.page || 1),
      pageSize: String(options?.pageSize || 20),
    });
  }

  async get(id: string): Promise<Pipeline> {
    const response = await this.http.get<{ ok: boolean; pipeline: Pipeline }>(`/api/pipelines/${id}`);
    return response.pipeline;
  }

  async create(input: CreatePipelineInput): Promise<Pipeline> {
    const response = await this.http.post<{ ok: boolean; pipeline: Pipeline }>("/api/pipelines", input);
    return response.pipeline;
  }

  async update(id: string, input: Partial<CreatePipelineInput>): Promise<Pipeline> {
    const response = await this.http.patch<{ ok: boolean; pipeline: Pipeline }>(`/api/pipelines/${id}`, input);
    return response.pipeline;
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/pipelines/${id}`);
  }

  async execute(input: ExecutePipelineInput): Promise<Execution> {
    const response = await this.http.post<{ ok: boolean; executionId: string }>("/api/pipelines/execute", {
      pipeline: { id: input.pipelineId, name: "", steps: [] },
      inputs: input.inputs,
    });
    return this.getExecution(response.executionId);
  }

  async getExecution(executionId: string): Promise<Execution> {
    const response = await this.http.get<{ ok: boolean; execution: Execution }>(`/api/pipelines/${executionId}/status`);
    return response.execution;
  }

  async listExecutions(options?: { status?: string; limit?: number }): Promise<Execution[]> {
    const response = await this.http.get<{ ok: boolean; executions: Execution[] }>("/api/pipelines/executions", {
      ...(options?.status && { status: options.status }),
      ...(options?.limit && { limit: String(options.limit) }),
    });
    return response.executions;
  }

  async cancelExecution(executionId: string): Promise<void> {
    await this.http.post(`/api/pipelines/${executionId}/cancel`);
  }
}

class SchedulesClient {
  constructor(private http: HttpClient) {}

  async list(): Promise<Schedule[]> {
    const response = await this.http.get<{ ok: boolean; schedules: Schedule[] }>("/api/schedules");
    return response.schedules;
  }

  async get(id: string): Promise<Schedule> {
    const response = await this.http.get<{ ok: boolean; schedule: Schedule }>(`/api/schedules/${id}`);
    return response.schedule;
  }

  async create(input: CreateScheduleInput): Promise<Schedule> {
    const response = await this.http.post<{ ok: boolean; schedule: Schedule }>("/api/schedules", input);
    return response.schedule;
  }

  async update(id: string, input: Partial<CreateScheduleInput>): Promise<Schedule> {
    const response = await this.http.patch<{ ok: boolean; schedule: Schedule }>(`/api/schedules/${id}`, input);
    return response.schedule;
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/schedules/${id}`);
  }

  async pause(id: string): Promise<void> {
    await this.http.post(`/api/schedules/${id}/pause`);
  }

  async resume(id: string): Promise<void> {
    await this.http.post(`/api/schedules/${id}/resume`);
  }

  async trigger(id: string): Promise<void> {
    await this.http.post(`/api/schedules/${id}/trigger`);
  }
}

class BudgetsClient {
  constructor(private http: HttpClient) {}

  async list(): Promise<Budget[]> {
    const response = await this.http.get<{ ok: boolean; budgets: Budget[] }>("/api/budgets");
    return response.budgets;
  }

  async get(id: string): Promise<Budget> {
    const response = await this.http.get<{ ok: boolean; budget: Budget }>(`/api/budgets/${id}`);
    return response.budget;
  }

  async create(input: CreateBudgetInput): Promise<Budget> {
    const response = await this.http.post<{ ok: boolean; budget: Budget }>("/api/budgets", input);
    return response.budget;
  }

  async update(id: string, input: Partial<CreateBudgetInput>): Promise<Budget> {
    const response = await this.http.patch<{ ok: boolean; budget: Budget }>(`/api/budgets/${id}`, input);
    return response.budget;
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/budgets/${id}`);
  }

  async pause(id: string): Promise<void> {
    await this.http.post(`/api/budgets/${id}/pause`);
  }

  async resume(id: string): Promise<void> {
    await this.http.post(`/api/budgets/${id}/resume`);
  }

  async reset(id: string): Promise<void> {
    await this.http.post(`/api/budgets/${id}/reset`);
  }
}

class WebhooksClient {
  constructor(private http: HttpClient) {}

  async list(): Promise<Webhook[]> {
    const response = await this.http.get<{ ok: boolean; webhooks: Webhook[] }>("/api/webhooks");
    return response.webhooks;
  }

  async get(id: string): Promise<Webhook> {
    const response = await this.http.get<{ ok: boolean; webhook: Webhook }>(`/api/webhooks/${id}`);
    return response.webhook;
  }

  async create(input: CreateWebhookInput): Promise<Webhook> {
    const response = await this.http.post<{ ok: boolean; webhook: Webhook }>("/api/webhooks", input);
    return response.webhook;
  }

  async update(id: string, input: Partial<CreateWebhookInput>): Promise<Webhook> {
    const response = await this.http.patch<{ ok: boolean; webhook: Webhook }>(`/api/webhooks/${id}`, input);
    return response.webhook;
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/webhooks/${id}`);
  }

  async test(id: string): Promise<void> {
    await this.http.post(`/api/webhooks/${id}/test`);
  }
}

class AnalyticsClient {
  constructor(private http: HttpClient) {}

  async getSummary(period?: "day" | "week" | "month"): Promise<AnalyticsSummary> {
    const response = await this.http.get<{ ok: boolean; summary: AnalyticsSummary }>("/api/analytics/summary", {
      ...(period && { period }),
    });
    return response.summary;
  }

  async getExecutions(options?: { limit?: number; pipelineId?: string }): Promise<Execution[]> {
    const response = await this.http.get<{ ok: boolean; executions: Execution[] }>("/api/analytics/executions", {
      ...(options?.limit && { limit: String(options.limit) }),
      ...(options?.pipelineId && { pipelineId: options.pipelineId }),
    });
    return response.executions;
  }

  async getTokenUsage(period?: "day" | "week" | "month"): Promise<{ total: number; byPipeline: Record<string, number> }> {
    return this.http.get("/api/analytics/tokens", { ...(period && { period }) });
  }

  async getCosts(period?: "day" | "week" | "month"): Promise<{ totalCost: number; costTrend: number }> {
    return this.http.get("/api/analytics/costs", { ...(period && { period }) });
  }
}

class QueueClient {
  constructor(private http: HttpClient) {}

  async getStats(): Promise<{ pending: number; active: number; completed: number; failed: number }> {
    const response = await this.http.get<{ ok: boolean; stats: any }>("/api/queue/stats");
    return response.stats;
  }

  async addJob(input: CreateQueueJobInput): Promise<string> {
    const response = await this.http.post<{ ok: boolean; jobId: string }>("/api/queue/jobs", input);
    return response.jobId;
  }

  async getJob(id: string): Promise<QueueJob> {
    const response = await this.http.get<{ ok: boolean; job: QueueJob }>(`/api/queue/jobs/${id}`);
    return response.job;
  }

  async pause(): Promise<void> {
    await this.http.post("/api/queue/pause");
  }

  async resume(): Promise<void> {
    await this.http.post("/api/queue/resume");
  }
}

class OrganizationsClient {
  constructor(private http: HttpClient) {}

  async getCurrent(): Promise<Organization> {
    const response = await this.http.get<{ ok: boolean; organization: Organization }>("/api/orgs/current");
    return response.organization;
  }

  async update(input: Partial<{ name: string; settings: Record<string, unknown> }>): Promise<Organization> {
    const response = await this.http.patch<{ ok: boolean; organization: Organization }>("/api/orgs/current", input);
    return response.organization;
  }

  async listMembers(): Promise<Member[]> {
    const response = await this.http.get<{ ok: boolean; members: Member[] }>("/api/orgs/current/members");
    return response.members;
  }

  async inviteMember(input: InviteMemberInput): Promise<{ inviteId: string }> {
    return this.http.post("/api/orgs/current/invites", input);
  }

  async updateMemberRole(memberId: string, role: "admin" | "editor" | "viewer"): Promise<Member> {
    const response = await this.http.patch<{ ok: boolean; member: Member }>(`/api/orgs/current/members/${memberId}`, { role });
    return response.member;
  }

  async removeMember(memberId: string): Promise<void> {
    await this.http.delete(`/api/orgs/current/members/${memberId}`);
  }
}

class AuditClient {
  constructor(private http: HttpClient) {}

  async list(options?: {
    category?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: AuditEvent[]; total: number }> {
    return this.http.get("/api/audit", {
      ...(options?.category && { category: options.category }),
      ...(options?.severity && { severity: options.severity }),
      ...(options?.startDate && { startDate: options.startDate }),
      ...(options?.endDate && { endDate: options.endDate }),
      ...(options?.limit && { limit: String(options.limit) }),
      ...(options?.offset && { offset: String(options.offset) }),
    });
  }

  async get(id: string): Promise<AuditEvent> {
    return this.http.get(`/api/audit/${id}`);
  }

  async getStats(days?: number): Promise<Record<string, unknown>> {
    return this.http.get("/api/audit/stats", { ...(days && { days: String(days) }) });
  }

  async getSecurityEvents(options?: { severity?: string; limit?: number }): Promise<AuditEvent[]> {
    const response = await this.http.get<{ events: AuditEvent[] }>("/api/audit/security", {
      ...(options?.severity && { severity: options.severity }),
      ...(options?.limit && { limit: String(options.limit) }),
    });
    return response.events;
  }

  async export(format: "json" | "csv", options?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<string> {
    return this.http.post("/api/audit/export", { format, ...options });
  }
}

// ============================================================================
// MAIN SDK CLIENT
// ============================================================================

export class IntegrationHubSDK {
  public readonly pipelines: PipelinesClient;
  public readonly schedules: SchedulesClient;
  public readonly budgets: BudgetsClient;
  public readonly webhooks: WebhooksClient;
  public readonly analytics: AnalyticsClient;
  public readonly queue: QueueClient;
  public readonly organizations: OrganizationsClient;
  public readonly audit: AuditClient;

  private http: HttpClient;

  constructor(config: SDKConfig) {
    this.http = new HttpClient(config);

    this.pipelines = new PipelinesClient(this.http);
    this.schedules = new SchedulesClient(this.http);
    this.budgets = new BudgetsClient(this.http);
    this.webhooks = new WebhooksClient(this.http);
    this.analytics = new AnalyticsClient(this.http);
    this.queue = new QueueClient(this.http);
    this.organizations = new OrganizationsClient(this.http);
    this.audit = new AuditClient(this.http);
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<{ ok: boolean; engines: unknown }> {
    return this.http.get("/api/status");
  }

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    try {
      const response = await this.http.get<{ ok: boolean }>("/api/status");
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createSDK(config: SDKConfig): IntegrationHubSDK {
  return new IntegrationHubSDK(config);
}
