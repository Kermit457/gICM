#!/usr/bin/env node
/**
 * gICM Brain CLI
 *
 * Command-line interface for the autonomous brain.
 */

// Prevent MaxListenersExceededWarning from pino-pretty and event emitters
process.setMaxListeners(25);

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { GicmBrain, createGicmBrain } from "./gicm-brain.js";
import { goalSystem } from "./goal-system.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "start":
      await startBrain(args.includes("--live"));
      break;

    case "status":
      showStatus();
      break;

    case "phase":
      const phase = args[1];
      if (!phase) {
        console.log("Usage: brain phase <morning_scan|decision_planning|execution|reflection|maintenance>");
        process.exit(1);
      }
      await runPhase(phase as any, args.includes("--live"));
      break;

    case "goals":
      showGoals();
      break;

    case "metrics":
      showMetrics();
      break;

    case "help":
    default:
      showHelp();
      break;
  }
}

async function startBrain(live: boolean): Promise<void> {
  console.log("\n=== gICM BRAIN ===\n");

  const brain = createGicmBrain({
    dryRun: !live,
    tradingApiUrl: process.env.TRADING_API_URL || "http://localhost:4000",
  });

  await brain.initialize();
  
  // Register with Integration Hub
  const hubUrl = process.env.HUB_URL || "http://localhost:3001";
  await registerWithHub(hubUrl);
  
  // Start heartbeat loop
  const heartbeatInterval = setInterval(async () => {
    await sendHeartbeat(hubUrl);
  }, 30000); // Every 30 seconds

  brain.start();

  const status = brain.getStatus();
  console.log(`\nMode: ${status.dryRun ? "DRY RUN (safe)" : "LIVE (real actions)"}`);
  console.log(`Today's Focus: ${status.todayFocus}`);
  console.log(`Current Phase: ${status.currentPhase || "Between phases"}`);
  console.log(`\nRegistered with Integration Hub: ${hubUrl}`);
  console.log("\nPress Ctrl+C to stop\n");

  // Keep running
  process.on("SIGINT", async () => {
    console.log("\n\nStopping brain...");
    clearInterval(heartbeatInterval);
    await unregisterFromHub(hubUrl);
    brain.stop();
    console.log("Brain stopped. Final status:");
    const finalStatus = brain.getStatus();
    console.log(`  Phases completed today: ${finalStatus.metrics.todayPhases}`);
    console.log(`  Actions taken: ${finalStatus.metrics.todayActions}`);
    console.log(`  Errors: ${finalStatus.metrics.todayErrors}`);
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

async function registerWithHub(hubUrl: string): Promise<void> {
  try {
    const response = await fetch(`${hubUrl}/api/engines/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineId: "brain" }),
    });
    if (response.ok) {
      console.log("[BRAIN] Registered with Integration Hub");
    } else {
      console.warn(`[BRAIN] Failed to register with Hub: ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`[BRAIN] Could not register with Hub (may not be running): ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function sendHeartbeat(hubUrl: string): Promise<void> {
  try {
    await fetch(`${hubUrl}/api/engines/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineId: "brain" }),
    });
  } catch (error) {
    // Silently fail - Hub may not be running
  }
}

async function unregisterFromHub(hubUrl: string): Promise<void> {
  try {
    await fetch(`${hubUrl}/api/engines/unregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineId: "brain" }),
    });
  } catch (error) {
    // Ignore errors on shutdown
  }
}

function showStatus(): void {
  console.log("\n=== gICM BRAIN STATUS ===\n");

  const phase = goalSystem.getCurrentPhase();
  const focus = goalSystem.getTodayFocus();
  const level = goalSystem.getCurrentAutonomyLevel();

  console.log(`Prime Directive: ${goalSystem.getPrimeDirective()}`);
  console.log(`Autonomy Level: ${level} - ${goalSystem.getAutonomyDescription(level)}`);
  console.log(`Current Phase: ${phase?.name || "Between phases"}`);
  console.log(`Today's Focus: ${focus}`);
  console.log(`Trading Mode: ${goalSystem.getDefaultTradingMode()}`);

  console.log("\nCore Values:");
  goalSystem.getCoreValues().forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.name} - ${v.description}`);
  });

  console.log("\nCompetitors to Monitor:");
  goalSystem.getCompetitors().forEach((c) => {
    console.log(`  - ${c.name} (${c.category})`);
  });
}

function showGoals(): void {
  console.log("\n=== gICM GOALS ===\n");

  console.log("Daily Targets:");
  const daily = goalSystem.getDailyMetrics();
  for (const [key, value] of Object.entries(daily)) {
    console.log(`  ${key}: ${value.target} - ${value.description}`);
  }

  console.log("\nWeekly Targets:");
  const weekly = goalSystem.getWeeklyMetrics();
  for (const [key, value] of Object.entries(weekly)) {
    console.log(`  ${key}: ${value.target} - ${value.description}`);
  }

  console.log("\nDecision Thresholds:");
  const thresholds = goalSystem.getDecisionThresholds();
  console.log(`  Auto-approve: ${thresholds.auto_approve_score}+`);
  console.log(`  Manual review: ${thresholds.manual_review_score}-${thresholds.auto_approve_score}`);
  console.log(`  Auto-reject: <${thresholds.auto_reject_score}`);
}

function showMetrics(): void {
  console.log("\n=== gICM METRICS ===\n");

  console.log("Treasury Allocations:");
  const allocations = goalSystem.getTreasuryAllocations();
  for (const [key, value] of Object.entries(allocations)) {
    console.log(`  ${key}: ${(value * 100).toFixed(0)}%`);
  }

  console.log("\nTrading Risk Limits:");
  const limits = goalSystem.getTradingRiskLimits();
  for (const [key, value] of Object.entries(limits)) {
    console.log(`  ${key}: ${value}`);
  }
}

async function runPhase(
  phase: "morning_scan" | "decision_planning" | "execution" | "reflection" | "maintenance",
  live: boolean
): Promise<void> {
  console.log(`\n=== Running Phase: ${phase.toUpperCase()} ===\n`);

  const brain = createGicmBrain({
    dryRun: !live,
    tradingApiUrl: process.env.TRADING_API_URL || "http://localhost:4000",
  });

  await brain.initialize();

  console.log(`Mode: ${live ? "LIVE" : "DRY RUN"}\n`);

  const result = await brain.triggerPhase(phase);

  console.log(`\n=== Phase Complete ===`);
  console.log(`Duration: ${((result.completedAt - result.startedAt) / 1000).toFixed(1)}s`);
  console.log(`Success: ${result.success}`);
  console.log(`Actions: ${result.actions.length}`);
  console.log(`Errors: ${result.errors.length}`);

  if (result.actions.length > 0) {
    console.log("\nActions:");
    result.actions.forEach((a) => {
      const icon = a.result === "success" ? "✓" : a.result === "failed" ? "✗" : "○";
      console.log(`  ${icon} [${a.engine}] ${a.action}${a.details ? ` - ${a.details}` : ""}`);
    });
  }

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((e) => {
      console.log(`  ✗ ${e}`);
    });
  }

  if (Object.keys(result.metrics).length > 0) {
    console.log("\nMetrics:");
    for (const [key, value] of Object.entries(result.metrics)) {
      console.log(`  ${key}: ${value}`);
    }
  }
}

function showHelp(): void {
  console.log(`
gICM Brain CLI - Autonomous Control Center

Usage:
  brain start [--live]     Start the autonomous cycle (default: dry run)
  brain status             Show current brain status
  brain phase <name>       Run a specific phase manually
  brain goals              Show goal targets
  brain metrics            Show metric configurations
  brain help               Show this help

Phases:
  morning_scan             Discovery, market analysis (00:00-04:00 UTC)
  decision_planning        Prioritize, plan executions (04:00-06:00 UTC)
  execution                Trading, content, building (06:00-20:00 UTC)
  reflection               Review performance (20:00-22:00 UTC)
  maintenance              Cleanup, prepare (22:00-00:00 UTC)

Examples:
  brain start              Start in dry run mode (safe)
  brain start --live       Start with real actions (careful!)
  brain phase morning_scan Run morning scan now
  brain status             Check current status
`);
}

main().catch((error) => {
  console.error(`Error: ${error.message || error}`);
  process.exit(1);
});
