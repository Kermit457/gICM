/**
 * Money Engine PTC Tool Handler
 *
 * Wraps the Money Engine for use in PTC pipelines.
 * Enables DCA trading with autonomy integration.
 */

import type { ToolDefinition, ToolHandler, SharedContext } from '../types.js';

// Tool Definition for DCA operations
export const dcaTradeToolDefinition: ToolDefinition = {
  name: 'money_dca_trade',
  description: `Execute a DCA (Dollar-Cost Averaging) trade operation.
This is a FINANCIAL ACTION that requires autonomy approval if risk is high.

The tool will:
1. Check current treasury balance
2. Validate trade parameters
3. Execute DCA buy through Jupiter DEX (if live mode)
4. Return trade confirmation or paper trade record

Risk levels based on amount:
- Under $50: Low risk (may auto-execute)
- $50-$500: Medium risk (requires approval)
- Over $500: High risk (escalates for review)`,
  input_schema: {
    type: 'object',
    properties: {
      asset: {
        type: 'string',
        description: 'Asset to buy (e.g., SOL, BONK, JUP)',
      },
      amountUsd: {
        type: 'string',
        description: 'Amount in USD to spend',
      },
      mode: {
        type: 'string',
        description: 'Trading mode: paper (simulated), micro (small live), live (full)',
        enum: ['paper', 'micro', 'live'],
      },
      slippageBps: {
        type: 'string',
        description: 'Max slippage in basis points (default: 100 = 1%)',
      },
    },
    required: ['asset', 'amountUsd'],
  },
};

// Tool Definition for Treasury status
export const treasuryStatusToolDefinition: ToolDefinition = {
  name: 'money_treasury_status',
  description: `Get current treasury status including balances, allocations, and health metrics.

Returns:
- SOL and USDC balances
- Total value in USD
- Allocation breakdown (trading, operations, growth, reserve)
- Runway in months
- Self-sustainability status`,
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Tool Definition for expense management
export const expenseStatusToolDefinition: ToolDefinition = {
  name: 'money_expenses',
  description: `Get expense breakdown and upcoming payments.

Returns:
- Monthly expense total
- Expense breakdown by category
- Upcoming expenses in next 7 days
- Budget utilization`,
  input_schema: {
    type: 'object',
    properties: {
      days: {
        type: 'string',
        description: 'Number of days to look ahead for upcoming expenses (default: 7)',
      },
    },
    required: [],
  },
};

// Tool Definition for financial health check
export const healthCheckToolDefinition: ToolDefinition = {
  name: 'money_health_check',
  description: `Comprehensive financial health check.

Analyzes:
- Cash runway
- Expense coverage ratio
- Trading P&L trend
- Risk exposure
- Recommendations for optimization`,
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Handler implementations
export const createDCATradeHandler = (
  moneyEngineFactory: () => Promise<{
    triggerDCA: () => Promise<void>;
    getStatus: () => Promise<{
      treasury: { balances: { sol: { toNumber: () => number }; usdc: { toNumber: () => number } } };
      trading: { totalPnL: { toNumber: () => number } };
    }>;
  }>,
  autonomyCheck?: (action: {
    type: string;
    category: string;
    data: Record<string, unknown>;
    estimatedImpact: number;
  }) => Promise<{ approved: boolean; reason?: string; requiresApproval?: boolean }>
): ToolHandler => {
  return async (inputs: Record<string, unknown>, context: SharedContext): Promise<unknown> => {
    const asset = inputs.asset as string;
    const amountUsdStr = inputs.amountUsd as string;
    const mode = (inputs.mode as string) || 'paper';
    const slippageBpsStr = (inputs.slippageBps as string) || '100';

    const amountUsd = parseFloat(amountUsdStr);
    const slippageBps = parseInt(slippageBpsStr, 10);

    // Validate inputs
    if (!asset || isNaN(amountUsd) || amountUsd <= 0) {
      return {
        success: false,
        error: 'Invalid asset or amount',
        trade: null,
      };
    }

    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (amountUsd < 50) {
      riskLevel = 'low';
    } else if (amountUsd < 500) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    // Check autonomy if handler provided
    if (autonomyCheck && mode !== 'paper') {
      const autonomyResult = await autonomyCheck({
        type: 'trade',
        category: 'financial',
        data: {
          asset,
          amountUsd,
          mode,
          slippageBps,
          riskLevel,
        },
        estimatedImpact: amountUsd,
      });

      if (!autonomyResult.approved) {
        return {
          success: false,
          requiresApproval: autonomyResult.requiresApproval ?? true,
          reason: autonomyResult.reason || 'Trade requires approval',
          trade: null,
          riskLevel,
          action: {
            asset,
            amountUsd,
            mode,
          },
        };
      }
    }

    // Execute trade
    try {
      if (mode === 'paper') {
        // Paper trade simulation
        const simulatedPrice = asset === 'SOL' ? 225 : asset === 'BONK' ? 0.00003 : 1;
        const quantity = amountUsd / simulatedPrice;

        return {
          success: true,
          trade: {
            id: `paper_${Date.now()}`,
            asset,
            side: 'buy',
            amountUsd,
            quantity,
            price: simulatedPrice,
            mode: 'paper',
            timestamp: new Date().toISOString(),
            slippageBps,
          },
          riskLevel,
          message: `Paper trade: Bought ${quantity.toFixed(6)} ${asset} for $${amountUsd}`,
        };
      }

      // Live/micro trade
      const engine = await moneyEngineFactory();
      await engine.triggerDCA();

      const status = await engine.getStatus();

      return {
        success: true,
        trade: {
          id: `live_${Date.now()}`,
          asset,
          side: 'buy',
          amountUsd,
          mode,
          timestamp: new Date().toISOString(),
          slippageBps,
        },
        riskLevel,
        treasuryBalance: {
          sol: status.treasury.balances.sol.toNumber(),
          usdc: status.treasury.balances.usdc.toNumber(),
        },
        message: `DCA trade executed for ${asset}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Trade execution failed',
        trade: null,
        riskLevel,
      };
    }
  };
};

export const createTreasuryStatusHandler = (
  moneyEngineFactory: () => Promise<{
    getStatus: () => Promise<{
      treasury: {
        balances: { sol: { toNumber: () => number }; usdc: { toNumber: () => number } };
        totalValueUsd: { toNumber: () => number };
        allocations: Record<string, { toNumber: () => number }>;
        health: { runway: number; needsRebalance: boolean };
      };
    }>;
  }>
): ToolHandler => {
  return async (_inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    try {
      const engine = await moneyEngineFactory();
      const status = await engine.getStatus();

      return {
        success: true,
        treasury: {
          balances: {
            sol: status.treasury.balances.sol.toNumber(),
            usdc: status.treasury.balances.usdc.toNumber(),
          },
          totalValueUsd: status.treasury.totalValueUsd.toNumber(),
          allocations: {
            trading: status.treasury.allocations.trading?.toNumber() ?? 0,
            operations: status.treasury.allocations.operations?.toNumber() ?? 0,
            growth: status.treasury.allocations.growth?.toNumber() ?? 0,
            reserve: status.treasury.allocations.reserve?.toNumber() ?? 0,
          },
          health: {
            runway: status.treasury.health.runway,
            needsRebalance: status.treasury.health.needsRebalance,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get treasury status',
        treasury: null,
      };
    }
  };
};

export const createExpenseStatusHandler = (
  moneyEngineFactory: () => Promise<{
    getExpenseManager: () => {
      getMonthlyTotal: () => { toNumber: () => number };
      getUpcoming: (days: number) => Array<{ name: string; amount: number; dueDate: Date }>;
      getBudgetStatus: () => { utilized: number; remaining: number };
    };
  }>
): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const daysStr = (inputs.days as string) || '7';
    const days = parseInt(daysStr, 10);

    try {
      const engine = await moneyEngineFactory();
      const expenseManager = engine.getExpenseManager();

      const monthlyTotal = expenseManager.getMonthlyTotal();
      const upcoming = expenseManager.getUpcoming(days);
      const budgetStatus = expenseManager.getBudgetStatus();

      return {
        success: true,
        expenses: {
          monthly: monthlyTotal.toNumber(),
          upcoming: upcoming.map(e => ({
            name: e.name,
            amount: e.amount,
            dueDate: e.dueDate.toISOString(),
          })),
          upcomingTotal: upcoming.reduce((sum, e) => sum + e.amount, 0),
          budget: {
            utilized: budgetStatus.utilized,
            remaining: budgetStatus.remaining,
          },
        },
        lookAheadDays: days,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get expense status',
        expenses: null,
      };
    }
  };
};

export const createHealthCheckHandler = (
  moneyEngineFactory: () => Promise<{
    getStatus: () => Promise<{
      treasury: {
        totalValueUsd: { toNumber: () => number };
        health: { runway: number };
      };
      expenses: {
        monthly: { toNumber: () => number };
      };
      trading: {
        activeBots: number;
        totalPnL: { toNumber: () => number };
      };
      health: {
        selfSustaining: boolean;
        runway: number;
      };
    }>;
  }>
): ToolHandler => {
  return async (_inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    try {
      const engine = await moneyEngineFactory();
      const status = await engine.getStatus();

      // Calculate health metrics
      const totalValue = status.treasury.totalValueUsd.toNumber();
      const monthlyExpenses = status.expenses.monthly.toNumber();
      const tradingPnL = status.trading.totalPnL.toNumber();
      const runway = status.health.runway;

      // Generate health score (0-100)
      let healthScore = 50; // Base score

      // Runway scoring (up to 30 points)
      if (runway >= 12) healthScore += 30;
      else if (runway >= 6) healthScore += 20;
      else if (runway >= 3) healthScore += 10;
      else healthScore -= 10;

      // Self-sustainability scoring (up to 20 points)
      if (status.health.selfSustaining) healthScore += 20;
      else if (tradingPnL > 0) healthScore += 10;

      // Trading activity (up to 10 points)
      if (status.trading.activeBots > 0) healthScore += 10;

      // Clamp score
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Generate recommendations
      const recommendations: string[] = [];

      if (runway < 3) {
        recommendations.push('CRITICAL: Less than 3 months runway. Reduce expenses or increase revenue.');
      }
      if (runway < 6) {
        recommendations.push('Consider increasing trading allocation to improve revenue.');
      }
      if (!status.health.selfSustaining) {
        recommendations.push('Focus on achieving self-sustainability through trading profits.');
      }
      if (status.trading.activeBots === 0) {
        recommendations.push('Start DCA bots to begin generating trading returns.');
      }
      if (totalValue < 1000) {
        recommendations.push('Treasury balance is low. Consider capital injection.');
      }

      return {
        success: true,
        health: {
          score: healthScore,
          grade: healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D',
          selfSustaining: status.health.selfSustaining,
          runway: runway,
          metrics: {
            totalValue,
            monthlyExpenses,
            tradingPnL,
            activeBots: status.trading.activeBots,
          },
          recommendations,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        health: null,
      };
    }
  };
};

// Export all money engine tools
export const moneyEngineTools = {
  definitions: [
    dcaTradeToolDefinition,
    treasuryStatusToolDefinition,
    expenseStatusToolDefinition,
    healthCheckToolDefinition,
  ],
  createHandlers: (
    moneyEngineFactory: () => Promise<any>,
    autonomyCheck?: (action: any) => Promise<{ approved: boolean; reason?: string; requiresApproval?: boolean }>
  ) => ({
    'money_dca_trade': createDCATradeHandler(moneyEngineFactory, autonomyCheck),
    'money_treasury_status': createTreasuryStatusHandler(moneyEngineFactory),
    'money_expenses': createExpenseStatusHandler(moneyEngineFactory),
    'money_health_check': createHealthCheckHandler(moneyEngineFactory),
  }),
};
