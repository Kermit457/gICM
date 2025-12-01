/**
 * @gicm/autonomy - Smoke Tests
 *
 * Quick tests to verify core autonomy functionality:
 * - Risk classification
 * - Decision routing
 * - Engine lifecycle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RiskClassifier } from "../decision/risk-classifier.js";
import { DecisionRouter } from "../decision/decision-router.js";
import { AutonomyEngine, resetAutonomy } from "../index.js";
import type { Action } from "../core/types.js";

// Suppress console output during tests
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  resetAutonomy();
});

// Helper to create test actions
function createAction(overrides: Partial<Action> = {}): Action {
  return {
    id: `test-${Date.now()}`,
    engine: "money",
    category: "trading",
    type: "swap",
    description: "Test action",
    params: {},
    metadata: {
      estimatedValue: 0,
      reversible: true,
      urgency: "normal",
    },
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("RiskClassifier smoke", () => {
  let classifier: RiskClassifier;

  beforeEach(() => {
    classifier = new RiskClassifier();
  });

  it("classifies zero-value reversible action as safe", () => {
    const action = createAction({
      metadata: { estimatedValue: 0, reversible: true, urgency: "low" },
    });

    const assessment = classifier.classify(action);

    expect(assessment.level).toBe("safe");
    expect(assessment.score).toBeLessThan(25);
    expect(assessment.recommendation).toBe("auto_execute");
  });

  it("classifies low-value DCA as low risk", () => {
    const action = createAction({
      type: "dca_buy",
      metadata: { estimatedValue: 20, reversible: false, urgency: "normal" },
    });

    const assessment = classifier.classify(action);

    expect(["safe", "low"]).toContain(assessment.level);
    expect(assessment.score).toBeLessThan(50);
  });

  it("classifies high-value trade as medium or higher risk", () => {
    const action = createAction({
      type: "swap",
      metadata: { estimatedValue: 500, reversible: false, urgency: "high" },
    });

    const assessment = classifier.classify(action);

    // $500 trade with high urgency scores ~60 (medium-high range)
    expect(["medium", "high", "critical"]).toContain(assessment.level);
    expect(assessment.score).toBeGreaterThan(40);
  });

  it("classifies very high value trade as high risk", () => {
    const action = createAction({
      type: "swap",
      metadata: { estimatedValue: 2000, reversible: false, urgency: "critical" },
    });

    const assessment = classifier.classify(action);

    // $2000 critical trade scores ~76 (high range)
    expect(["high", "critical"]).toContain(assessment.level);
    expect(assessment.score).toBeGreaterThan(60);
  });

  it("marks dangerous actions for escalation regardless of value", () => {
    const action = createAction({
      type: "deploy_production",
      category: "configuration",
      metadata: { estimatedValue: 0, reversible: false, urgency: "normal" },
    });

    const assessment = classifier.classify(action);

    expect(assessment.recommendation).toBe("escalate");
  });

  it("returns all required assessment fields", () => {
    const action = createAction();
    const assessment = classifier.classify(action);

    expect(assessment).toHaveProperty("actionId");
    expect(assessment).toHaveProperty("level");
    expect(assessment).toHaveProperty("score");
    expect(assessment).toHaveProperty("factors");
    expect(assessment).toHaveProperty("recommendation");
    expect(assessment).toHaveProperty("timestamp");
    expect(assessment.factors.length).toBeGreaterThan(0);
  });
});

describe("DecisionRouter smoke", () => {
  it("auto-executes safe actions at autonomy level 2", async () => {
    const router = new DecisionRouter({ autonomyLevel: 2 });

    const action = createAction({
      engine: "growth",
      category: "content",
      type: "collect_metrics",
      metadata: { estimatedValue: 0, reversible: true, urgency: "low" },
    });

    const decision = await router.route(action);

    expect(decision.outcome).toBe("auto_execute");
  });

  it("queues high-value trades for approval at level 2", async () => {
    const router = new DecisionRouter({ autonomyLevel: 2 });

    const action = createAction({
      type: "swap",
      metadata: { estimatedValue: 600, reversible: false, urgency: "normal" },
    });

    const decision = await router.route(action);

    expect(["queue_approval", "escalate"]).toContain(decision.outcome);
  });

  it("respects autonomy level boundaries", async () => {
    // Level 1 = Human-guided: most actions need approval
    const router1 = new DecisionRouter({ autonomyLevel: 1 });
    const action = createAction({
      type: "swap",
      metadata: { estimatedValue: 100, reversible: false, urgency: "normal" },
    });

    const decision1 = await router1.route(action);
    expect(["queue_approval", "escalate"]).toContain(decision1.outcome);

    // Level 3 = Supervised: more auto-execution
    const router3 = new DecisionRouter({ autonomyLevel: 3 });
    const lowValueAction = createAction({
      type: "dca_buy",
      metadata: { estimatedValue: 30, reversible: false, urgency: "normal" },
    });

    const decision3 = await router3.route(lowValueAction);
    expect(decision3.outcome).toBe("auto_execute");
  });

  it("handles dangerous actions appropriately", async () => {
    const router = new DecisionRouter({ autonomyLevel: 4 }); // Max autonomy

    const action = createAction({
      type: "change_api_keys",
      category: "configuration",
      metadata: { estimatedValue: 0, reversible: false, urgency: "critical" },
    });

    const decision = await router.route(action);

    // Dangerous actions are either escalated or rejected (blocked)
    expect(["escalate", "reject"]).toContain(decision.outcome);
  });
});

describe("AutonomyEngine smoke", () => {
  it("starts and stops without error", () => {
    const engine = new AutonomyEngine({
      level: 2,
      approval: { notifyOnNewItem: false },
    });

    expect(engine.isRunning()).toBe(false);

    engine.start();
    expect(engine.isRunning()).toBe(true);

    engine.stop();
    expect(engine.isRunning()).toBe(false);
  });

  it("routes actions through the system", async () => {
    const engine = new AutonomyEngine({
      level: 2,
      approval: { notifyOnNewItem: false },
    });
    engine.start();

    const action = createAction({
      engine: "growth",
      category: "content",
      type: "tweet_draft",
      metadata: { estimatedValue: 0, reversible: true, urgency: "low" },
    });

    const decision = await engine.route(action);

    expect(decision).toHaveProperty("outcome");
    expect(decision).toHaveProperty("assessment");
    expect(decision).toHaveProperty("action");

    engine.stop();
  });

  it("tracks usage statistics", async () => {
    const engine = new AutonomyEngine({
      level: 2,
      approval: { notifyOnNewItem: false },
    });
    engine.start();

    const usage = engine.getUsageToday();

    // Usage structure uses 'trades', 'content', 'builds', 'deployments'
    expect(usage).toHaveProperty("trades");
    expect(usage).toHaveProperty("content");
    expect(typeof usage.trades).toBe("number");

    engine.stop();
  });

  it("provides status information", () => {
    const engine = new AutonomyEngine({
      level: 2,
      approval: { notifyOnNewItem: false },
    });
    engine.start();

    const status = engine.getStatus();

    expect(status).toHaveProperty("running");
    expect(status).toHaveProperty("level");
    expect(status).toHaveProperty("queue");
    expect(status).toHaveProperty("usage");
    expect(status.running).toBe(true);
    expect(status.level).toBe(2);

    engine.stop();
  });

  it("rejects routing when not running", async () => {
    const engine = new AutonomyEngine();
    // Don't start

    const action = createAction();

    await expect(engine.route(action)).rejects.toThrow("not running");
  });
});
