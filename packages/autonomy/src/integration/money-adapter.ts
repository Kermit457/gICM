/**
 * Money Engine Adapter
 *
 * Integrates MoneyEngine with autonomy system for:
 * - DCA trades
 * - Token swaps
 * - Expense payments
 */

import { EngineAdapter, type EngineAdapterConfig } from "./engine-adapter.js";
import type { Action, ActionCategory } from "../core/types.js";

export interface DCATradeParams {
  token: string;
  amount: number;
  botType?: string;
}

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: number;
}

export interface ExpenseParams {
  category: string;
  description: string;
  amount: number;
  recurring?: boolean;
}

export class MoneyEngineAdapter extends EngineAdapter {
  constructor() {
    super({
      engineName: "money-engine",
      engineType: "money",
      defaultCategory: "trading",
    });
  }

  /**
   * Create DCA trade action
   */
  createDCAAction(params: DCATradeParams): Action {
    return this.createAction({
      type: "dca_buy",
      description: `DCA buy $${params.amount} of ${params.token}`,
      payload: {
        token: params.token,
        amount: params.amount,
        botType: params.botType ?? "dca",
      },
      estimatedValue: params.amount,
      reversible: false, // Trades are not reversible
      urgency: "normal",
    });
  }

  /**
   * Create token swap action
   */
  createSwapAction(params: SwapParams): Action {
    return this.createAction({
      type: "token_swap",
      description: `Swap ${params.amount} ${params.fromToken} to ${params.toToken}`,
      payload: {
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount,
      },
      estimatedValue: params.amount,
      reversible: false,
      urgency: "normal",
    });
  }

  /**
   * Create expense payment action
   */
  createExpenseAction(params: ExpenseParams): Action {
    return this.createAction({
      type: params.recurring ? "recurring_expense" : "one_time_expense",
      description: `Pay expense: ${params.description} ($${params.amount})`,
      payload: {
        category: params.category,
        description: params.description,
        amount: params.amount,
        recurring: params.recurring,
      },
      estimatedValue: params.amount,
      reversible: false,
      urgency: "normal",
    });
  }

  /**
   * Create rebalance action
   */
  createRebalanceAction(targetAllocations: Record<string, number>): Action {
    const totalPercent = Object.values(targetAllocations).reduce((a, b) => a + b, 0);
    return this.createAction({
      type: "treasury_rebalance",
      description: `Rebalance treasury allocations`,
      payload: { targetAllocations },
      reversible: true,
      urgency: "low",
    });
  }

  protected getCategoryForType(actionType: string): ActionCategory {
    if (actionType.includes("expense")) return "configuration";
    if (actionType.includes("rebalance")) return "configuration";
    return "trading";
  }
}
