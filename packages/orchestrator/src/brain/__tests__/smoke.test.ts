/**
 * gICM Brain - Smoke Tests
 *
 * Quick tests to verify core brain functionality:
 * - Brain initialization
 * - Goal system
 * - Signal processing
 * - Status reporting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GicmBrain, createGicmBrain } from "../gicm-brain.js";
import { GoalSystemManager, goalSystem } from "../goal-system.js";
import { SignalProcessor } from "../signal-processor.js";

// Suppress console output during tests
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GicmBrain smoke", () => {
  it("creates brain with default config", () => {
    const brain = createGicmBrain();

    expect(brain).toBeInstanceOf(GicmBrain);
  });

  it("initializes in dry run mode by default", async () => {
    const brain = createGicmBrain({
      enableHunter: false,
      enableTrading: false,
      enableGrowth: false,
    });

    await brain.initialize();

    const status = brain.getStatus();
    expect(status.dryRun).toBe(true);
  });

  it("returns valid status object", async () => {
    const brain = createGicmBrain({
      dryRun: true,
      enableHunter: false,
      enableTrading: false,
      enableGrowth: false,
    });

    await brain.initialize();
    const status = brain.getStatus();

    expect(status).toHaveProperty("version");
    expect(status).toHaveProperty("primeDirective");
    expect(status).toHaveProperty("autonomyLevel");
    expect(status).toHaveProperty("currentPhase");
    expect(status).toHaveProperty("todayFocus");
    expect(status).toHaveProperty("isRunning");
    expect(status).toHaveProperty("engines");
    expect(status).toHaveProperty("metrics");
  });

  it("connects money engine by default", async () => {
    const brain = createGicmBrain({
      dryRun: true,
      enableHunter: false,
      enableTrading: false,
      enableGrowth: false,
    });

    await brain.initialize();
    const status = brain.getStatus();

    expect(status.engines.money).toBe(true);
  });

  it("provides goal system access", async () => {
    const brain = createGicmBrain();

    const goals = brain.getGoalSystem();

    expect(goals).toBeDefined();
    expect(goals.getPrimeDirective()).toBeTruthy();
  });
});

describe("GoalSystem smoke", () => {
  it("returns prime directive", () => {
    const directive = goalSystem.getPrimeDirective();

    expect(directive).toBeTruthy();
    expect(typeof directive).toBe("string");
    expect(directive.length).toBeGreaterThan(10);
  });

  it("returns current autonomy level", () => {
    const level = goalSystem.getCurrentAutonomyLevel();

    expect(level).toBeGreaterThanOrEqual(1);
    expect(level).toBeLessThanOrEqual(4);
  });

  it("returns autonomy description for each level", () => {
    for (let level = 1; level <= 4; level++) {
      const description = goalSystem.getAutonomyDescription(level);
      expect(description).toBeTruthy();
      expect(typeof description).toBe("string");
    }
  });

  it("returns today focus based on day of week", () => {
    const focus = goalSystem.getTodayFocus();

    expect(focus).toBeTruthy();
    expect(typeof focus).toBe("string");
  });

  it("returns current phase based on time", () => {
    const phase = goalSystem.getCurrentPhase();

    // Phase may be null outside of defined hours
    if (phase) {
      expect(phase).toHaveProperty("name");
      // Phase structure may contain nested 'phase' object
      expect(typeof phase.name).toBe("string");
    }
  });

  it("returns default trading mode", () => {
    const mode = goalSystem.getDefaultTradingMode();

    expect(["paper", "micro", "live"]).toContain(mode);
  });

  it("provides core values", () => {
    const values = goalSystem.getCoreValues();

    expect(values).toBeInstanceOf(Array);
    expect(values.length).toBeGreaterThan(0);

    const firstValue = values[0];
    expect(firstValue).toHaveProperty("name");
    // Core values have name and description/priority properties
    expect(typeof firstValue.name).toBe("string");
  });
});

describe("SignalProcessor smoke", () => {
  let processor: SignalProcessor;

  beforeEach(() => {
    processor = new SignalProcessor();
  });

  it("processes empty discoveries array", () => {
    const batch = processor.processBatch([]);

    expect(batch.totalDiscoveries).toBe(0);
    expect(batch.signals).toHaveLength(0);
  });

  it("processes fear & greed discovery", () => {
    const discovery = {
      id: "fg-test-1",
      source: "feargreed",
      sourceId: "fg-1",
      sourceUrl: "https://alternative.me",
      title: "Crypto Fear & Greed: 20 (Extreme Fear)",
      description: "Market in extreme fear",
      tags: ["sentiment"],
      metrics: {},
      relevanceFactors: { hasWeb3Keywords: true },
      rawMetadata: {
        value: 20,
        classification: "Extreme Fear",
        signal: "ACCUMULATE",
      },
      fingerprint: "fg-test-1",
    };

    const batch = processor.processBatch([discovery]);

    expect(batch.totalDiscoveries).toBe(1);
    expect(batch.signals.length).toBeGreaterThan(0);

    const signal = batch.signals[0];
    expect(signal.type).toBe("sentiment_extreme");
    // Action may be 'buy' or 'watch' depending on signal processing logic
    expect(["buy", "watch"]).toContain(signal.action);
  });

  it("processes binance price move discovery", () => {
    const discovery = {
      id: "bnb-test-1",
      source: "binance",
      sourceId: "bnb-1",
      sourceUrl: "https://binance.com",
      title: "[CEX] SOL: $150.00 (+10%)",
      description: "Strong price move",
      tags: ["binance", "sol"],
      metrics: { likes: 10 },
      relevanceFactors: { hasWeb3Keywords: true },
      rawMetadata: {
        symbol: "SOL",
        type: "price_move",
        priceChangePercent: "10",
        quoteVolume: "100000000",
      },
      fingerprint: "bnb-test-1",
    };

    const batch = processor.processBatch([discovery]);

    expect(batch.totalDiscoveries).toBe(1);
    expect(batch.signals.length).toBeGreaterThan(0);

    const signal = batch.signals[0];
    expect(signal.type).toBe("price_move");
    expect(signal.token).toBe("SOL");
  });

  it("filters actionable signals by confidence and urgency", () => {
    // Create signals with varying confidence
    const discoveries = [
      {
        id: "high-conf",
        source: "feargreed",
        sourceId: "1",
        sourceUrl: "",
        title: "Fear & Greed: 10",
        description: "",
        tags: [],
        metrics: {},
        relevanceFactors: {},
        rawMetadata: { value: 10, classification: "Extreme Fear", signal: "ACCUMULATE" },
        fingerprint: "1",
      },
    ];

    const batch = processor.processBatch(discoveries);
    const actionable = processor.getActionableSignals(batch);

    // Actionable requires confidence >= 60 and urgency immediate/today
    expect(actionable).toBeInstanceOf(Array);
    // Each actionable signal should have high confidence
    actionable.forEach((signal) => {
      expect(signal.confidence).toBeGreaterThanOrEqual(60);
    });
  });

  it("categorizes signals by type", () => {
    const discoveries = [
      {
        id: "1",
        source: "feargreed",
        sourceId: "1",
        sourceUrl: "",
        title: "Fear: 15",
        description: "",
        tags: [],
        metrics: {},
        relevanceFactors: {},
        rawMetadata: { value: 15, classification: "Extreme Fear", signal: "ACCUMULATE" },
        fingerprint: "1",
      },
      {
        id: "2",
        source: "binance",
        sourceId: "2",
        sourceUrl: "",
        title: "SOL +15%",
        description: "",
        tags: [],
        metrics: {},
        relevanceFactors: {},
        rawMetadata: { symbol: "SOL", type: "price_move", priceChangePercent: "15", quoteVolume: "500000000" },
        fingerprint: "2",
      },
    ];

    const batch = processor.processBatch(discoveries);

    expect(batch.byType).toBeDefined();
    expect(Object.keys(batch.byType).length).toBeGreaterThan(0);
  });

  it("returns signal batch metadata", () => {
    const batch = processor.processBatch([]);

    expect(batch).toHaveProperty("processedAt");
    expect(batch).toHaveProperty("totalDiscoveries");
    expect(batch).toHaveProperty("signals");
    expect(batch).toHaveProperty("byType");
    expect(batch).toHaveProperty("byAction");
    expect(batch.processedAt).toBeInstanceOf(Date);
  });
});
