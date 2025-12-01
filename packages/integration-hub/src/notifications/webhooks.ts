/**
 * Webhook Notification System
 *
 * Sends notifications to configured webhook endpoints when
 * pipeline events occur. Supports retries, HMAC signatures,
 * and delivery tracking.
 */

import { EventEmitter } from "eventemitter3";
import { createHmac } from "crypto";
import type { WebhookConfig, WebhookDelivery, WebhookEventType, SupabaseStorage } from "../storage/supabase.js";
import type { PipelineExecution } from "../analytics.js";
import type { PipelineResult } from "../queue/workers.js";

// =========================================================================
// TYPES
// =========================================================================

export interface WebhookManagerConfig {
  /** Storage for persisting webhook configs and deliveries */
  storage?: SupabaseStorage;
  /** Default retry count (default: 3) */
  defaultRetries?: number;
  /** Default timeout in ms (default: 5000) */
  defaultTimeout?: number;
  /** Rate limit: max deliveries per minute (default: 60) */
  rateLimit?: number;
  /** Enable async delivery (default: true) */
  asyncDelivery?: boolean;
}

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface DeliveryResult {
  success: boolean;
  webhookId: string;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  attempts: number;
  duration: number;
}

export interface WebhookManagerEvents {
  "delivery:success": (result: DeliveryResult) => void;
  "delivery:failed": (result: DeliveryResult) => void;
  "delivery:retrying": (webhookId: string, attempt: number) => void;
  "rateLimit:exceeded": (webhookId: string) => void;
}

// =========================================================================
// WEBHOOK MANAGER
// =========================================================================

export class WebhookManager extends EventEmitter<WebhookManagerEvents> {
  private config: Required<WebhookManagerConfig>;
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveryQueue: Array<{ webhook: WebhookConfig; payload: WebhookPayload; attempt: number }> = [];
  private deliveryCountsPerMinute: Map<string, number> = new Map();
  private isProcessing = false;

  constructor(config: WebhookManagerConfig = {}) {
    super();
    this.config = {
      storage: config.storage || undefined!,
      defaultRetries: config.defaultRetries || 3,
      defaultTimeout: config.defaultTimeout || 5000,
      rateLimit: config.rateLimit || 60,
      asyncDelivery: config.asyncDelivery !== false,
    };

    // Reset rate limit counts every minute
    setInterval(() => {
      this.deliveryCountsPerMinute.clear();
    }, 60000);
  }

  /**
   * Initialize and load webhooks from storage
   */
  async initialize(): Promise<void> {
    if (this.config.storage?.connected) {
      try {
        const webhooks = await this.config.storage.getEnabledWebhooks();
        for (const webhook of webhooks) {
          this.webhooks.set(webhook.id, webhook);
        }
        console.log(`[Webhooks] Loaded ${webhooks.length} webhook configs`);
      } catch (error) {
        console.error("[Webhooks] Failed to load webhooks:", error);
      }
    }
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(
    config: Omit<WebhookConfig, "id" | "createdAt" | "updatedAt" | "failureCount" | "lastTriggeredAt" | "lastStatus">
  ): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      ...config,
      id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhooks.set(webhook.id, webhook);

    // Persist to storage
    if (this.config.storage?.connected) {
      try {
        const saved = await this.config.storage.saveWebhook(config);
        this.webhooks.set(saved.id, saved);
        return saved;
      } catch (error) {
        console.error("[Webhooks] Failed to save webhook:", error);
      }
    }

    return webhook;
  }

  /**
   * Update webhook configuration
   */
  updateWebhook(id: string, updates: Partial<WebhookConfig>): WebhookConfig | null {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;

    const updated = {
      ...webhook,
      ...updates,
      id: webhook.id,
      createdAt: webhook.createdAt,
      updatedAt: new Date(),
    };

    this.webhooks.set(id, updated);
    return updated;
  }

  /**
   * Remove a webhook
   */
  removeWebhook(id: string): boolean {
    return this.webhooks.delete(id);
  }

  /**
   * Get all registered webhooks
   */
  getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Get webhook by ID
   */
  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Trigger webhooks for a pipeline event
   */
  async triggerPipelineEvent(
    event: "pipeline.started" | "pipeline.completed" | "pipeline.failed",
    execution: PipelineExecution | PipelineResult
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        executionId: "executionId" in execution ? execution.executionId : execution.id,
        pipelineId: execution.pipelineId,
        status: execution.status,
        ...("totalDuration" in execution && { duration: execution.totalDuration }),
        ...("totalTokens" in execution && { tokens: execution.totalTokens }),
        ...("completedSteps" in execution && { completedSteps: execution.completedSteps }),
        ...("failedSteps" in execution && { failedSteps: execution.failedSteps }),
        ...("cost" in execution && { cost: execution.cost }),
        ...("error" in execution && execution.error && { error: execution.error }),
      },
    };

    await this.trigger(event, payload);
  }

  /**
   * Trigger webhooks for cost threshold alert
   */
  async triggerCostAlert(
    dailyCost: number,
    threshold: number,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: "cost.threshold",
      timestamp: new Date().toISOString(),
      data: {
        dailyCost,
        threshold,
        percentOfThreshold: Math.round((dailyCost / threshold) * 100),
        ...details,
      },
    };

    await this.trigger("cost.threshold", payload);
  }

  /**
   * Trigger webhooks for daily summary
   */
  async triggerDailySummary(summary: Record<string, unknown>): Promise<void> {
    const payload: WebhookPayload = {
      event: "daily.summary",
      timestamp: new Date().toISOString(),
      data: summary,
    };

    await this.trigger("daily.summary", payload);
  }

  /**
   * Trigger all webhooks subscribed to an event
   */
  private async trigger(event: WebhookEventType, payload: WebhookPayload): Promise<void> {
    const subscribedWebhooks = Array.from(this.webhooks.values()).filter(
      (w) => w.enabled && w.events.includes(event)
    );

    if (subscribedWebhooks.length === 0) {
      return;
    }

    for (const webhook of subscribedWebhooks) {
      if (this.config.asyncDelivery) {
        // Add to queue for async processing
        this.deliveryQueue.push({ webhook, payload, attempt: 1 });
        this.processQueue();
      } else {
        // Deliver synchronously
        await this.deliver(webhook, payload, 1);
      }
    }
  }

  /**
   * Process delivery queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.deliveryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.deliveryQueue.length > 0) {
      const item = this.deliveryQueue.shift();
      if (!item) break;

      // Check rate limit
      const currentCount = this.deliveryCountsPerMinute.get(item.webhook.id) || 0;
      if (currentCount >= this.config.rateLimit) {
        this.emit("rateLimit:exceeded", item.webhook.id);
        // Re-queue for later
        this.deliveryQueue.push(item);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Deliver
      await this.deliver(item.webhook, item.payload, item.attempt);
    }

    this.isProcessing = false;
  }

  /**
   * Deliver payload to webhook endpoint
   */
  private async deliver(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    attempt: number
  ): Promise<DeliveryResult> {
    const startTime = Date.now();
    const body = JSON.stringify(payload);
    const signature = this.sign(webhook.secret, body);

    // Track rate limit
    const currentCount = this.deliveryCountsPerMinute.get(webhook.id) || 0;
    this.deliveryCountsPerMinute.set(webhook.id, currentCount + 1);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), webhook.timeoutMs || this.config.defaultTimeout);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": payload.event,
          "X-Webhook-Timestamp": payload.timestamp,
          "X-Webhook-Delivery": `${webhook.id}_${Date.now()}`,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseBody = await response.text().catch(() => "");
      const duration = Date.now() - startTime;

      const result: DeliveryResult = {
        success: response.ok,
        webhookId: webhook.id,
        statusCode: response.status,
        responseBody: responseBody.slice(0, 1000), // Limit response size
        attempts: attempt,
        duration,
      };

      // Update webhook stats
      webhook.lastTriggeredAt = new Date();
      webhook.lastStatus = response.ok ? "success" : `error_${response.status}`;
      if (!response.ok) {
        webhook.failureCount++;
      } else {
        webhook.failureCount = 0;
      }

      // Record delivery
      if (this.config.storage?.connected) {
        await this.config.storage.recordDelivery({
          webhookId: webhook.id,
          eventType: payload.event,
          payload: payload.data,
          status: response.ok ? "delivered" : "failed",
          attempts: attempt,
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 1000),
          deliveredAt: new Date(),
        }).catch(() => {});
      }

      if (response.ok) {
        this.emit("delivery:success", result);
      } else {
        // Retry on failure
        if (attempt < (webhook.retryCount || this.config.defaultRetries)) {
          this.emit("delivery:retrying", webhook.id, attempt + 1);
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          setTimeout(() => {
            this.deliveryQueue.push({ webhook, payload, attempt: attempt + 1 });
            this.processQueue();
          }, delay);
        } else {
          result.error = `Failed after ${attempt} attempts`;
          this.emit("delivery:failed", result);
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const result: DeliveryResult = {
        success: false,
        webhookId: webhook.id,
        error: errorMessage,
        attempts: attempt,
        duration,
      };

      // Update webhook stats
      webhook.lastTriggeredAt = new Date();
      webhook.lastStatus = `error_${errorMessage.slice(0, 50)}`;
      webhook.failureCount++;

      // Record delivery failure
      if (this.config.storage?.connected) {
        await this.config.storage.recordDelivery({
          webhookId: webhook.id,
          eventType: payload.event,
          payload: payload.data,
          status: "failed",
          attempts: attempt,
          error: errorMessage,
        }).catch(() => {});
      }

      // Retry on failure
      if (attempt < (webhook.retryCount || this.config.defaultRetries)) {
        this.emit("delivery:retrying", webhook.id, attempt + 1);
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => {
          this.deliveryQueue.push({ webhook, payload, attempt: attempt + 1 });
          this.processQueue();
        }, delay);
      } else {
        this.emit("delivery:failed", result);
      }

      return result;
    }
  }

  /**
   * Sign payload with HMAC-SHA256
   */
  private sign(secret: string, payload: string): string {
    return `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(secret: string, payload: string, signature: string): boolean {
    const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
    return signature === expected;
  }
}

// =========================================================================
// SINGLETON
// =========================================================================

let webhookManagerInstance: WebhookManager | null = null;

/**
 * Get or create webhook manager singleton
 */
export function getWebhookManager(config?: WebhookManagerConfig): WebhookManager {
  if (!webhookManagerInstance) {
    webhookManagerInstance = new WebhookManager(config);
  }
  return webhookManagerInstance;
}

/**
 * Create webhook manager with storage
 */
export async function createWebhookManager(config: WebhookManagerConfig = {}): Promise<WebhookManager> {
  const manager = getWebhookManager(config);
  await manager.initialize();
  return manager;
}
