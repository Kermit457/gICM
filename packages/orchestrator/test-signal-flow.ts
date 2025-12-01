/**
 * Test End-to-End Signal Flow
 *
 * Tests the complete pipeline:
 * 1. Hunter discovers opportunities
 * 2. Signal processor converts to trading signals
 * 3. Signals sent to trading API (mock)
 */

import "dotenv/config";
import { createHunterAdapter } from "./src/brain/adapters/hunter-adapter.js";
import { SignalProcessor } from "./src/brain/signal-processor.js";

async function testSignalFlow() {
  console.log("=".repeat(60));
  console.log("TESTING HUNTER -> SIGNAL -> TRADING FLOW");
  console.log("=".repeat(60));

  // 1. Create hunter adapter with FREE sources only
  console.log("\n[1] Creating Hunter Adapter...");
  const hunter = createHunterAdapter({
    // Only use fast, free sources for testing
    enabledSources: [
      "hackernews",
      "feargreed",
      "binance",
      "defillama",
    ] as any,
    tradingApiUrl: "http://localhost:4000",
    autoSendSignals: false,
  });

  await hunter.initialize();
  console.log("   Hunter initialized");

  // 2. Run a quick hunt
  console.log("\n[2] Running Hunt...");
  const startTime = Date.now();

  // Run a quick hunt on fast sources
  const discoveries = await hunter.runHunt([
    "hackernews",
    "feargreed",
    "binance",
  ] as any);

  console.log(`   Found ${discoveries.length} discoveries in ${Date.now() - startTime}ms`);

  // 3. Process into signals
  console.log("\n[3] Processing Signals...");
  const signalBatch = hunter.processSignals(discoveries);

  console.log(`   Total signals: ${signalBatch.signals.length}`);
  console.log(`   By type:`, signalBatch.byType);
  console.log(`   By action:`, signalBatch.byAction);

  // 4. Get actionable signals
  console.log("\n[4] Filtering Actionable Signals...");
  const actionable = hunter.getActionableSignals();

  console.log(`   Actionable signals: ${actionable.length}`);

  if (actionable.length > 0) {
    console.log("\n   Top Actionable Signals:");
    actionable.slice(0, 5).forEach((signal, i) => {
      console.log(`   ${i + 1}. [${signal.type}] ${signal.title.slice(0, 50)}...`);
      console.log(`      Confidence: ${signal.confidence}% | Urgency: ${signal.urgency}`);
      console.log(`      Reasoning: ${signal.reasoning}`);
    });
  }

  // 5. Show what would be sent to trading API
  console.log("\n[5] Trading API Payload (would send):");
  if (actionable.length > 0) {
    const payload = {
      signals: actionable.slice(0, 3).map(s => ({
        id: s.id,
        type: s.type,
        source: s.source,
        token: s.token,
        chain: s.chain,
        action: s.action,
        confidence: s.confidence,
        urgency: s.urgency,
        title: s.title.slice(0, 50),
        risk: s.risk,
      })),
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log("   No actionable signals to send");
  }

  // 6. Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const status = hunter.getStatus();
  console.log(`Enabled Sources: ${status.enabledSources.join(", ")}`);
  console.log(`Total Discoveries: ${status.totalDiscoveries}`);
  console.log(`Total Signals: ${status.totalSignals}`);
  console.log(`Actionable Signals: ${status.actionableSignals}`);

  console.log("\nPipeline Status: OK");
  console.log("Ready to connect to ai-hedge-fund trading API!");
}

// Test with mock signals to validate processor
async function testSignalProcessor() {
  console.log("\n" + "=".repeat(60));
  console.log("TESTING SIGNAL PROCESSOR DIRECTLY");
  console.log("=".repeat(60));

  const processor = new SignalProcessor();

  // Mock discoveries for different source types
  const mockDiscoveries: any[] = [
    {
      id: "test-1",
      source: "feargreed",
      sourceId: "fg-test",
      sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
      title: "Crypto Fear & Greed: 15 (Extreme Fear)",
      description: "Extreme fear in market",
      tags: ["sentiment", "fear-greed"],
      metrics: {},
      relevanceFactors: { hasWeb3Keywords: true },
      rawMetadata: { value: 15, classification: "Extreme Fear", signal: "ACCUMULATE" },
      fingerprint: "test-fg-1",
    },
    {
      id: "test-2",
      source: "binance",
      sourceId: "bnb-test",
      sourceUrl: "https://binance.com/trade/SOL_USDT",
      title: "[CEX] SOL: $150.00 (+12.5%)",
      description: "Strong price move",
      tags: ["binance", "sol", "price_move"],
      metrics: { likes: 12.5 },
      relevanceFactors: { hasWeb3Keywords: true },
      rawMetadata: { symbol: "SOL", type: "price_move", priceChangePercent: "12.5", quoteVolume: "500000000" },
      fingerprint: "test-bnb-1",
    },
    {
      id: "test-3",
      source: "finnhub",
      sourceId: "congress-test",
      sourceUrl: "https://finnhub.io",
      title: "[CONGRESS] Nancy Pelosi BOUGHT NVDA",
      description: "Congress member bought NVDA",
      tags: ["finnhub", "congress", "nvda"],
      metrics: {},
      relevanceFactors: {},
      rawMetadata: { type: "congress", symbol: "NVDA", chamber: "House" },
      fingerprint: "test-fh-1",
    },
  ];

  const batch = processor.processBatch(mockDiscoveries);

  console.log(`\nProcessed ${batch.totalDiscoveries} discoveries into ${batch.signals.length} signals`);
  console.log("Signals:");

  batch.signals.forEach((signal) => {
    console.log(`\n[${signal.type}] ${signal.title}`);
    console.log(`  Action: ${signal.action} | Confidence: ${signal.confidence}% | Urgency: ${signal.urgency}`);
    console.log(`  Risk: ${signal.risk}`);
    console.log(`  Reasoning: ${signal.reasoning}`);
  });

  const actionable = processor.getActionableSignals(batch);
  console.log(`\nActionable (confidence >= 60, urgency immediate/today): ${actionable.length}`);
}

async function main() {
  try {
    // First test the processor logic
    await testSignalProcessor();

    // Then test with real API data
    await testSignalFlow();

  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

main();
