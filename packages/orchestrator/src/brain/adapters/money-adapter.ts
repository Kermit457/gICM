/**
 * Money Engine Adapter
 *
 * Converts MoneyEngine (Decimal-based) to EngineConnections interface.
 */

import type { MoneyEngine } from "@gicm/money-engine";
import type { EngineConnections } from "../daily-cycle.js";

export function createMoneyAdapter(engine: MoneyEngine): NonNullable<EngineConnections["money"]> {
  return {
    getTreasuryStatus: async () => {
      try {
        const status = await engine.getStatus();
        const totalUsd = status.treasury.totalValueUsd.toNumber();
        const runwayMonths = status.health.runway;

        const runway = Number.isFinite(runwayMonths) && runwayMonths > 0
          ? `${runwayMonths.toFixed(1)} months`
          : "Unknown";

        return { totalUsd, runway };
      } catch (error) {
        console.warn(`[MONEY-ADAPTER] Treasury status failed: ${error}`);
        return {
          totalUsd: 0,
          runway: "Error fetching treasury",
        };
      }
    },

    getUpcomingExpenses: async () => {
      try {
        const expenseManager = engine.getExpenseManager();
        const upcoming = expenseManager.getUpcoming(30);

        return upcoming.slice(0, 10).map((exp) => ({
          name: exp.name,
          amount: exp.amount.toNumber(),
          dueDate: exp.nextDueDate || Date.now() + 7 * 24 * 60 * 60 * 1000,
        }));
      } catch (error) {
        console.warn(`[MONEY-ADAPTER] Expenses fetch failed: ${error}`);
        return [];
      }
    },
  };
}
