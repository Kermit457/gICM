/**
 * Workflow Registry - Cross-engine automation workflows
 */

import type { EventBus } from "../event-bus.js";
import type { IntegrationHub } from "../hub.js";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string; // Event type that triggers this workflow
  enabled: boolean;
  execute: (hub: IntegrationHub, payload: Record<string, unknown>) => Promise<void>;
}

// ============================================================================
// WORKFLOW IMPLEMENTATIONS
// ============================================================================

/**
 * Feature Announcement Workflow
 * When ProductEngine deploys a new feature, announce via GrowthEngine
 */
const featureAnnouncementWorkflow: Workflow = {
  id: "feature-announcement",
  name: "Feature Announcement",
  description: "Announce new features when ProductEngine deploys them",
  trigger: "build.completed",
  enabled: true,
  execute: async (hub, payload) => {
    const growthEngine = hub.getGrowthEngine();
    if (!growthEngine) return;

    const { name, description } = payload as { name?: string; description?: string };
    if (!name) return;

    try {
      await growthEngine.announceFeature({
        name,
        description: description || "New feature deployed!",
      });
      console.log("[WORKFLOW] Feature announced:", name);

      hub.getEventBus().publish("workflow", "content.published", {
        workflow: "feature-announcement",
        feature: name,
      });
    } catch (error) {
      console.error("[WORKFLOW] Feature announcement failed:", error);
    }
  },
};

/**
 * Profitable Trade Workflow
 * When a trade makes profit above threshold, tweet about it
 */
const profitableTradeWorkflow: Workflow = {
  id: "profitable-trade",
  name: "Profitable Trade Tweet",
  description: "Tweet about profitable trades above threshold",
  trigger: "trade.profit",
  enabled: true,
  execute: async (hub, payload) => {
    const growthEngine = hub.getGrowthEngine();
    if (!growthEngine) return;

    const { profit, symbol } = payload as { profit?: number; symbol?: string };
    if (!profit || profit < 100) return; // Only announce profits > $100

    try {
      await growthEngine.generateNow("tweet");
      console.log("[WORKFLOW] Profit tweet generated for", symbol);
    } catch (error) {
      console.error("[WORKFLOW] Profit tweet failed:", error);
    }
  },
};

/**
 * Low Treasury Alert Workflow
 * When treasury drops below threshold, pause risky operations
 */
const lowTreasuryAlertWorkflow: Workflow = {
  id: "low-treasury-alert",
  name: "Low Treasury Alert",
  description: "Alert and pause operations when treasury is critically low",
  trigger: "treasury.critical",
  enabled: true,
  execute: async (hub, payload) => {
    const brain = hub.getBrain();
    if (!brain) return;

    const { totalUsd, threshold } = payload as { totalUsd?: number; threshold?: number };

    console.warn("[WORKFLOW] CRITICAL: Treasury below threshold!", {
      totalUsd,
      threshold,
    });

    // Could pause trading or other risky operations here
    hub.getEventBus().publish("workflow", "engine.error", {
      workflow: "low-treasury-alert",
      message: "Treasury critically low - manual review required",
      totalUsd,
    });
  },
};

/**
 * Daily Summary Workflow
 * Generate and publish daily performance summary
 */
const dailySummaryWorkflow: Workflow = {
  id: "daily-summary",
  name: "Daily Summary",
  description: "Generate daily performance summary",
  trigger: "brain.phase_completed",
  enabled: true,
  execute: async (hub, payload) => {
    const { phase } = payload as { phase?: string };
    if (phase !== "night_summary") return;

    const growthEngine = hub.getGrowthEngine();
    if (!growthEngine) return;

    try {
      await growthEngine.generateNow("thread");
      console.log("[WORKFLOW] Daily summary thread generated");
    } catch (error) {
      console.error("[WORKFLOW] Daily summary failed:", error);
    }
  },
};

// ============================================================================
// WORKFLOW REGISTRY
// ============================================================================

export const workflows: Workflow[] = [
  featureAnnouncementWorkflow,
  profitableTradeWorkflow,
  lowTreasuryAlertWorkflow,
  dailySummaryWorkflow,
];

/**
 * Register all workflows with the event bus
 */
export function registerWorkflows(hub: IntegrationHub): void {
  const eventBus = hub.getEventBus();

  for (const workflow of workflows) {
    if (!workflow.enabled) continue;

    eventBus.on(workflow.trigger as any, async (event) => {
      console.log("[WORKFLOW] Triggered:", workflow.name);

      try {
        await workflow.execute(hub, event.payload);
      } catch (error) {
        console.error("[WORKFLOW] Error in", workflow.name, error);
      }
    });
  }

  console.log("[WORKFLOW] Registered", workflows.filter((w) => w.enabled).length, "workflows");
}

/**
 * Get all workflows
 */
export function getWorkflows(): Workflow[] {
  return workflows;
}
