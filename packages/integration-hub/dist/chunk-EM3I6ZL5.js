// src/notifications/webhooks.ts
import { EventEmitter } from "eventemitter3";
import { createHmac } from "crypto";
var WebhookManager = class extends EventEmitter {
  config;
  webhooks = /* @__PURE__ */ new Map();
  deliveryQueue = [];
  deliveryCountsPerMinute = /* @__PURE__ */ new Map();
  isProcessing = false;
  constructor(config = {}) {
    super();
    this.config = {
      storage: config.storage || void 0,
      defaultRetries: config.defaultRetries || 3,
      defaultTimeout: config.defaultTimeout || 5e3,
      rateLimit: config.rateLimit || 60,
      asyncDelivery: config.asyncDelivery !== false
    };
    setInterval(() => {
      this.deliveryCountsPerMinute.clear();
    }, 6e4);
  }
  /**
   * Initialize and load webhooks from storage
   */
  async initialize() {
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
  async registerWebhook(config) {
    const webhook = {
      ...config,
      id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      failureCount: 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.webhooks.set(webhook.id, webhook);
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
  updateWebhook(id, updates) {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;
    const updated = {
      ...webhook,
      ...updates,
      id: webhook.id,
      createdAt: webhook.createdAt,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.webhooks.set(id, updated);
    return updated;
  }
  /**
   * Remove a webhook
   */
  removeWebhook(id) {
    return this.webhooks.delete(id);
  }
  /**
   * Get all registered webhooks
   */
  getWebhooks() {
    return Array.from(this.webhooks.values());
  }
  /**
   * Get webhook by ID
   */
  getWebhook(id) {
    return this.webhooks.get(id);
  }
  /**
   * Trigger webhooks for a pipeline event
   */
  async triggerPipelineEvent(event, execution) {
    const payload = {
      event,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      data: {
        executionId: "executionId" in execution ? execution.executionId : execution.id,
        pipelineId: execution.pipelineId,
        status: execution.status,
        ..."totalDuration" in execution && { duration: execution.totalDuration },
        ..."totalTokens" in execution && { tokens: execution.totalTokens },
        ..."completedSteps" in execution && { completedSteps: execution.completedSteps },
        ..."failedSteps" in execution && { failedSteps: execution.failedSteps },
        ..."cost" in execution && { cost: execution.cost },
        ..."error" in execution && execution.error && { error: execution.error }
      }
    };
    await this.trigger(event, payload);
  }
  /**
   * Trigger webhooks for cost threshold alert
   */
  async triggerCostAlert(dailyCost, threshold, details = {}) {
    const payload = {
      event: "cost.threshold",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      data: {
        dailyCost,
        threshold,
        percentOfThreshold: Math.round(dailyCost / threshold * 100),
        ...details
      }
    };
    await this.trigger("cost.threshold", payload);
  }
  /**
   * Trigger webhooks for daily summary
   */
  async triggerDailySummary(summary) {
    const payload = {
      event: "daily.summary",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      data: summary
    };
    await this.trigger("daily.summary", payload);
  }
  /**
   * Trigger all webhooks subscribed to an event
   */
  async trigger(event, payload) {
    const subscribedWebhooks = Array.from(this.webhooks.values()).filter(
      (w) => w.enabled && w.events.includes(event)
    );
    if (subscribedWebhooks.length === 0) {
      return;
    }
    for (const webhook of subscribedWebhooks) {
      if (this.config.asyncDelivery) {
        this.deliveryQueue.push({ webhook, payload, attempt: 1 });
        this.processQueue();
      } else {
        await this.deliver(webhook, payload, 1);
      }
    }
  }
  /**
   * Process delivery queue
   */
  async processQueue() {
    if (this.isProcessing || this.deliveryQueue.length === 0) {
      return;
    }
    this.isProcessing = true;
    while (this.deliveryQueue.length > 0) {
      const item = this.deliveryQueue.shift();
      if (!item) break;
      const currentCount = this.deliveryCountsPerMinute.get(item.webhook.id) || 0;
      if (currentCount >= this.config.rateLimit) {
        this.emit("rateLimit:exceeded", item.webhook.id);
        this.deliveryQueue.push(item);
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        continue;
      }
      await this.deliver(item.webhook, item.payload, item.attempt);
    }
    this.isProcessing = false;
  }
  /**
   * Deliver payload to webhook endpoint
   */
  async deliver(webhook, payload, attempt) {
    const startTime = Date.now();
    const body = JSON.stringify(payload);
    const signature = this.sign(webhook.secret, body);
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
          "X-Webhook-Delivery": `${webhook.id}_${Date.now()}`
        },
        body,
        signal: controller.signal
      });
      clearTimeout(timeout);
      const responseBody = await response.text().catch(() => "");
      const duration = Date.now() - startTime;
      const result = {
        success: response.ok,
        webhookId: webhook.id,
        statusCode: response.status,
        responseBody: responseBody.slice(0, 1e3),
        // Limit response size
        attempts: attempt,
        duration
      };
      webhook.lastTriggeredAt = /* @__PURE__ */ new Date();
      webhook.lastStatus = response.ok ? "success" : `error_${response.status}`;
      if (!response.ok) {
        webhook.failureCount++;
      } else {
        webhook.failureCount = 0;
      }
      if (this.config.storage?.connected) {
        await this.config.storage.recordDelivery({
          webhookId: webhook.id,
          eventType: payload.event,
          payload: payload.data,
          status: response.ok ? "delivered" : "failed",
          attempts: attempt,
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 1e3),
          deliveredAt: /* @__PURE__ */ new Date()
        }).catch(() => {
        });
      }
      if (response.ok) {
        this.emit("delivery:success", result);
      } else {
        if (attempt < (webhook.retryCount || this.config.defaultRetries)) {
          this.emit("delivery:retrying", webhook.id, attempt + 1);
          const delay = Math.pow(2, attempt) * 1e3;
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
      const result = {
        success: false,
        webhookId: webhook.id,
        error: errorMessage,
        attempts: attempt,
        duration
      };
      webhook.lastTriggeredAt = /* @__PURE__ */ new Date();
      webhook.lastStatus = `error_${errorMessage.slice(0, 50)}`;
      webhook.failureCount++;
      if (this.config.storage?.connected) {
        await this.config.storage.recordDelivery({
          webhookId: webhook.id,
          eventType: payload.event,
          payload: payload.data,
          status: "failed",
          attempts: attempt,
          error: errorMessage
        }).catch(() => {
        });
      }
      if (attempt < (webhook.retryCount || this.config.defaultRetries)) {
        this.emit("delivery:retrying", webhook.id, attempt + 1);
        const delay = Math.pow(2, attempt) * 1e3;
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
  sign(secret, payload) {
    return `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  }
  /**
   * Verify webhook signature
   */
  static verifySignature(secret, payload, signature) {
    const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
    return signature === expected;
  }
};
var webhookManagerInstance = null;
function getWebhookManager(config) {
  if (!webhookManagerInstance) {
    webhookManagerInstance = new WebhookManager(config);
  }
  return webhookManagerInstance;
}
async function createWebhookManager(config = {}) {
  const manager = getWebhookManager(config);
  await manager.initialize();
  return manager;
}

export {
  WebhookManager,
  getWebhookManager,
  createWebhookManager
};
//# sourceMappingURL=chunk-EM3I6ZL5.js.map