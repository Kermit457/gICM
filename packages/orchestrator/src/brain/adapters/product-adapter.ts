/**
 * Product Engine Adapter
 *
 * Converts ProductEngine to EngineConnections interface.
 */

import type { ProductEngine } from "@gicm/product-engine";
import type { EngineConnections } from "../daily-cycle.js";

export function createProductAdapter(engine: ProductEngine): NonNullable<EngineConnections["product"]> {
  return {
    runDiscovery: async () => {
      try {
        const opportunities = await engine.runDiscovery();

        return opportunities.map((opp) => ({
          id: opp.id,
          title: opp.title,
          score: opp.scores?.overall || 0,
        }));
      } catch (error) {
        console.warn(`[PRODUCT-ADAPTER] Discovery failed: ${error}`);
        return [];
      }
    },

    getBacklog: async () => {
      try {
        // getBacklog() is synchronous, wrap in Promise
        const backlog = engine.getBacklog();

        return backlog.map((item) => ({
          id: item.id,
          status: item.status,
        }));
      } catch (error) {
        console.warn(`[PRODUCT-ADAPTER] Backlog fetch failed: ${error}`);
        return [];
      }
    },

    processNextBuild: async () => {
      try {
        const task = await engine.processNextBuild();

        if (!task) return null;

        return {
          id: task.id,
          status: task.status,
        };
      } catch (error) {
        console.warn(`[PRODUCT-ADAPTER] Build processing failed: ${error}`);
        return null;
      }
    },
  };
}
