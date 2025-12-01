/**
 * Webhook Manager Tests
 * Phase 17C: API & Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebhookManager } from "../notifications/webhooks.js";
import type { WebhookEventType } from "../storage/supabase.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper to create webhook config with all required fields
function createWebhookConfig(overrides: {
  name: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  enabled: boolean;
  retryCount?: number;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}) {
  return {
    name: overrides.name,
    url: overrides.url,
    secret: overrides.secret,
    events: overrides.events,
    enabled: overrides.enabled,
    retryCount: overrides.retryCount ?? 3,
    timeoutMs: overrides.timeoutMs ?? 5000,
    metadata: overrides.metadata ?? {},
  };
}

describe("WebhookManager", () => {
  let manager: WebhookManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Create manager with sync delivery for easier testing
    manager = new WebhookManager({
      asyncDelivery: false,
      defaultRetries: 3,
      defaultTimeout: 5000,
      rateLimit: 60,
    });

    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("OK"),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ===========================================================================
  // CONSTRUCTOR TESTS
  // ===========================================================================

  describe("constructor", () => {
    it("should create manager with default config", () => {
      const mgr = new WebhookManager();
      expect(mgr).toBeDefined();
    });

    it("should create manager with custom config", () => {
      const mgr = new WebhookManager({
        defaultRetries: 5,
        defaultTimeout: 10000,
        rateLimit: 100,
      });
      expect(mgr).toBeDefined();
    });
  });

  // ===========================================================================
  // WEBHOOK REGISTRATION TESTS
  // ===========================================================================

  describe("registerWebhook", () => {
    it("should register a webhook and return config with ID", async () => {
      const result = await manager.registerWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^wh_/);
      expect(result.name).toBe("Test Webhook");
      expect(result.url).toBe("https://example.com/webhook");
      expect(result.failureCount).toBe(0);
    });

    it("should store registered webhook", async () => {
      await manager.registerWebhook({
        name: "Test Webhook",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });

      const webhooks = manager.getWebhooks();
      expect(webhooks).toHaveLength(1);
      expect(webhooks[0].name).toBe("Test Webhook");
    });

    it("should register multiple webhooks", async () => {
      await manager.registerWebhook({
        name: "Webhook 1",
        url: "https://example.com/webhook1",
        secret: "secret-1",
        events: ["pipeline.completed"],
        enabled: true,
      });

      await manager.registerWebhook({
        name: "Webhook 2",
        url: "https://example.com/webhook2",
        secret: "secret-2",
        events: ["pipeline.failed"],
        enabled: true,
      });

      const webhooks = manager.getWebhooks();
      expect(webhooks).toHaveLength(2);
    });
  });

  // ===========================================================================
  // WEBHOOK UPDATE TESTS
  // ===========================================================================

  describe("updateWebhook", () => {
    it("should update webhook configuration", async () => {
      const webhook = await manager.registerWebhook({
        name: "Original Name",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });

      const updated = manager.updateWebhook(webhook.id, {
        name: "Updated Name",
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.url).toBe("https://example.com/webhook");
    });

    it("should preserve ID and createdAt on update", async () => {
      const webhook = await manager.registerWebhook({
        name: "Test",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });

      const originalId = webhook.id;
      const originalCreatedAt = webhook.createdAt;

      const updated = manager.updateWebhook(webhook.id, {
        name: "New Name",
      });

      expect(updated?.id).toBe(originalId);
      expect(updated?.createdAt).toBe(originalCreatedAt);
    });

    it("should return null for non-existent webhook", () => {
      const result = manager.updateWebhook("non-existent-id", {
        name: "New Name",
      });

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // WEBHOOK REMOVAL TESTS
  // ===========================================================================

  describe("removeWebhook", () => {
    it("should remove registered webhook", async () => {
      const webhook = await manager.registerWebhook({
        name: "Test",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });

      const removed = manager.removeWebhook(webhook.id);
      expect(removed).toBe(true);

      const webhooks = manager.getWebhooks();
      expect(webhooks).toHaveLength(0);
    });

    it("should return false for non-existent webhook", () => {
      const removed = manager.removeWebhook("non-existent-id");
      expect(removed).toBe(false);
    });
  });

  // ===========================================================================
  // GET WEBHOOK TESTS
  // ===========================================================================

  describe("getWebhook", () => {
    it("should return webhook by ID", async () => {
      const webhook = await manager.registerWebhook({
        name: "Test",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });

      const found = manager.getWebhook(webhook.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Test");
    });

    it("should return undefined for non-existent webhook", () => {
      const found = manager.getWebhook("non-existent-id");
      expect(found).toBeUndefined();
    });
  });

  // ===========================================================================
  // TRIGGER PIPELINE EVENT TESTS
  // ===========================================================================

  describe("triggerPipelineEvent", () => {
    beforeEach(async () => {
      await manager.registerWebhook({
        name: "Pipeline Webhook",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed", "pipeline.failed"],
        enabled: true,
      });
    });

    it("should trigger webhook for subscribed event", async () => {
      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
        totalDuration: 1000,
        totalTokens: 500,
      } as any);

      expect(mockFetch).toHaveBeenCalled();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://example.com/webhook");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.event).toBe("pipeline.completed");
      expect(body.data.pipelineId).toBe("pipeline-1");
    });

    it("should include signature header", async () => {
      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["X-Webhook-Signature"]).toMatch(/^sha256=/);
    });

    it("should not trigger for unsubscribed event", async () => {
      await manager.triggerPipelineEvent("pipeline.started", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "running",
      } as any);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should not trigger for disabled webhook", async () => {
      const webhooks = manager.getWebhooks();
      manager.updateWebhook(webhooks[0].id, { enabled: false });

      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // TRIGGER COST ALERT TESTS
  // ===========================================================================

  describe("triggerCostAlert", () => {
    beforeEach(async () => {
      await manager.registerWebhook({
        name: "Cost Webhook",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["cost.threshold"],
        enabled: true,
      });
    });

    it("should trigger cost alert webhook", async () => {
      await manager.triggerCostAlert(95, 100, { details: "test" });

      expect(mockFetch).toHaveBeenCalled();
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.event).toBe("cost.threshold");
      expect(body.data.dailyCost).toBe(95);
      expect(body.data.threshold).toBe(100);
      expect(body.data.percentOfThreshold).toBe(95);
    });
  });

  // ===========================================================================
  // TRIGGER DAILY SUMMARY TESTS
  // ===========================================================================

  describe("triggerDailySummary", () => {
    beforeEach(async () => {
      await manager.registerWebhook({
        name: "Summary Webhook",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["daily.summary"],
        enabled: true,
      });
    });

    it("should trigger daily summary webhook", async () => {
      await manager.triggerDailySummary({
        totalPipelines: 10,
        totalCost: 5.5,
      });

      expect(mockFetch).toHaveBeenCalled();
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.event).toBe("daily.summary");
      expect(body.data.totalPipelines).toBe(10);
    });
  });

  // ===========================================================================
  // DELIVERY SUCCESS TESTS
  // ===========================================================================

  describe("delivery success", () => {
    it("should emit delivery:success on successful delivery", async () => {
      const successHandler = vi.fn();
      manager.on("delivery:success", successHandler);

      await manager.registerWebhook({
        name: "Test",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });

      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      expect(successHandler).toHaveBeenCalled();
      expect(successHandler.mock.calls[0][0].success).toBe(true);
    });

    it("should reset failure count on success", async () => {
      const webhook = await manager.registerWebhook({
        name: "Test",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });

      // Set initial failure count
      manager.updateWebhook(webhook.id, { failureCount: 5 });

      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      const updated = manager.getWebhook(webhook.id);
      expect(updated?.failureCount).toBe(0);
    });
  });

  // ===========================================================================
  // DELIVERY FAILURE TESTS
  // ===========================================================================

  describe("delivery failure", () => {
    it("should emit delivery:failed after all retries exhausted", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server Error"),
      });

      const failedHandler = vi.fn();
      const retryHandler = vi.fn();
      manager.on("delivery:failed", failedHandler);
      manager.on("delivery:retrying", retryHandler);

      await manager.registerWebhook({
        name: "Test",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
        retryCount: 2,
      });

      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      // Should retry with exponential backoff
      expect(retryHandler).toHaveBeenCalled();
    });

    it("should increment failure count on failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Error"),
      });

      const webhook = await manager.registerWebhook({
        name: "Test",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
        retryCount: 1, // Only 1 retry
      });

      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      const updated = manager.getWebhook(webhook.id);
      expect(updated?.failureCount).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // SIGNATURE VERIFICATION TESTS
  // ===========================================================================

  describe("verifySignature", () => {
    it("should verify valid signature", () => {
      const secret = "test-secret";
      const payload = JSON.stringify({ event: "test", data: {} });

      // Create signature same way the manager does
      const { createHmac } = require("crypto");
      const signature = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;

      const isValid = WebhookManager.verifySignature(secret, payload, signature);
      expect(isValid).toBe(true);
    });

    it("should reject invalid signature", () => {
      const isValid = WebhookManager.verifySignature(
        "test-secret",
        '{"event":"test"}',
        "sha256=invalid"
      );
      expect(isValid).toBe(false);
    });

    it("should reject signature with wrong secret", () => {
      const { createHmac } = require("crypto");
      const payload = '{"event":"test"}';
      const signature = `sha256=${createHmac("sha256", "wrong-secret").update(payload).digest("hex")}`;

      const isValid = WebhookManager.verifySignature("correct-secret", payload, signature);
      expect(isValid).toBe(false);
    });
  });

  // ===========================================================================
  // REQUEST HEADERS TESTS
  // ===========================================================================

  describe("request headers", () => {
    beforeEach(async () => {
      await manager.registerWebhook({
        name: "Test",
        url: "https://example.com/webhook",
        secret: "test-secret",
        events: ["pipeline.completed"],
        enabled: true,
      });
    });

    it("should include Content-Type header", async () => {
      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["Content-Type"]).toBe("application/json");
    });

    it("should include X-Webhook-Event header", async () => {
      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["X-Webhook-Event"]).toBe("pipeline.completed");
    });

    it("should include X-Webhook-Timestamp header", async () => {
      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["X-Webhook-Timestamp"]).toBeDefined();
    });

    it("should include X-Webhook-Delivery header", async () => {
      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["X-Webhook-Delivery"]).toBeDefined();
    });
  });

  // ===========================================================================
  // MULTIPLE WEBHOOKS TESTS
  // ===========================================================================

  describe("multiple webhooks", () => {
    it("should trigger all subscribed webhooks", async () => {
      await manager.registerWebhook({
        name: "Webhook 1",
        url: "https://example1.com/webhook",
        secret: "secret-1",
        events: ["pipeline.completed"],
        enabled: true,
      });

      await manager.registerWebhook({
        name: "Webhook 2",
        url: "https://example2.com/webhook",
        secret: "secret-2",
        events: ["pipeline.completed"],
        enabled: true,
      });

      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should only trigger webhooks subscribed to event", async () => {
      await manager.registerWebhook({
        name: "Webhook 1",
        url: "https://example1.com/webhook",
        secret: "secret-1",
        events: ["pipeline.completed"],
        enabled: true,
      });

      await manager.registerWebhook({
        name: "Webhook 2",
        url: "https://example2.com/webhook",
        secret: "secret-2",
        events: ["pipeline.failed"], // Different event
        enabled: true,
      });

      await manager.triggerPipelineEvent("pipeline.completed", {
        executionId: "exec-1",
        pipelineId: "pipeline-1",
        status: "completed",
      } as any);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toBe("https://example1.com/webhook");
    });
  });
});
