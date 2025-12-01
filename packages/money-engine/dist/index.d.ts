import { EventEmitter } from 'eventemitter3';
import Decimal from 'decimal.js';
import { Connection, Keypair } from '@solana/web3.js';

/**
 * gICM Money Engine Types
 */

interface Treasury {
    balances: {
        sol: Decimal;
        usdc: Decimal;
        tokens: Map<string, TokenBalance>;
    };
    allocations: {
        trading: Decimal;
        operations: Decimal;
        growth: Decimal;
        reserve: Decimal;
    };
    wallets: {
        main: string;
        trading: string;
        operations: string;
        cold: string;
    };
    thresholds: {
        minOperatingBalance: Decimal;
        maxTradingAllocation: Decimal;
        rebalanceThreshold: Decimal;
    };
    lastUpdated: number;
    lastRebalance: number;
}
interface TokenBalance {
    mint: string;
    symbol: string;
    balance: Decimal;
    valueUsd: Decimal;
    price: Decimal;
}
interface TreasuryStatus {
    totalValueUsd: Decimal;
    balances: {
        sol: Decimal;
        usdc: Decimal;
    };
    allocations: {
        trading: Decimal;
        operations: Decimal;
        growth: Decimal;
        reserve: Decimal;
    };
    health: {
        runway: number;
        needsRebalance: boolean;
        selfSustaining: boolean;
    };
}
type TradingMode = "paper" | "micro" | "dual" | "live";
type BotType = "hedge-fund" | "dca" | "yield" | "arbitrage" | "grid";
type BotStatus = "running" | "paused" | "error" | "stopped";
interface TradingBot {
    id: string;
    type: BotType;
    name: string;
    status: BotStatus;
    mode: TradingMode;
    config: BotConfig;
    performance: BotPerformance;
    riskParams: RiskParameters;
    positions: Position[];
    pendingOrders: Order[];
    createdAt: number;
    lastTradeAt?: number;
    lastErrorAt?: number;
}
interface BotConfig {
    allocatedCapital: Decimal;
    maxPositionSize: Decimal;
    pairs: string[];
    strategyParams: Record<string, unknown>;
    slippageTolerance: number;
    priorityFee: number;
}
interface BotPerformance {
    totalPnL: Decimal;
    realizedPnL: Decimal;
    unrealizedPnL: Decimal;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    dailyPnL: Decimal;
    weeklyPnL: Decimal;
    monthlyPnL: Decimal;
}
interface RiskParameters {
    maxPositionPercent: number;
    maxTotalExposure: number;
    stopLossPercent: number;
    dailyLossLimit: Decimal;
    weeklyLossLimit: Decimal;
    maxDrawdownPercent: number;
    cooldownAfterLoss: number;
}
interface Position {
    id: string;
    botId: string;
    token: string;
    symbol: string;
    side: "long" | "short";
    size: Decimal;
    entryPrice: Decimal;
    currentPrice: Decimal;
    unrealizedPnL: Decimal;
    unrealizedPnLPercent: number;
    stopLoss?: Decimal;
    takeProfit?: Decimal;
    openedAt: number;
    updatedAt: number;
}
interface Order {
    id: string;
    botId: string;
    type: "market" | "limit";
    side: "buy" | "sell";
    token: string;
    size: Decimal;
    price?: Decimal;
    status: "pending" | "filled" | "cancelled" | "failed";
    txSignature?: string;
    filledAt?: number;
    filledPrice?: Decimal;
    createdAt: number;
}
interface Trade {
    id: string;
    botId: string;
    positionId: string;
    side: "buy" | "sell";
    token: string;
    symbol: string;
    size: Decimal;
    price: Decimal;
    valueUsd: Decimal;
    fee: Decimal;
    slippage: number;
    realizedPnL?: Decimal;
    txSignature: string;
    executedAt: number;
}
interface RevenueStream {
    source: "subscriptions" | "api" | "marketplace" | "trading";
    daily: Decimal;
    weekly: Decimal;
    monthly: Decimal;
    allTime: Decimal;
    growthRate: number;
}
interface Subscription {
    id: string;
    userId: string;
    tier: "free" | "pro" | "enterprise";
    price: Decimal;
    currency: "USD" | "SOL";
    billingCycle: "monthly" | "yearly";
    startDate: number;
    nextBillingDate: number;
    status: "active" | "cancelled" | "past_due";
    paymentMethod: "card" | "crypto";
    walletAddress?: string;
}
interface Expense {
    id: string;
    category: ExpenseCategory;
    subcategory: string;
    name: string;
    description: string;
    amount: Decimal;
    currency: "USD" | "SOL";
    type: "one-time" | "recurring";
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
    nextDueDate?: number;
    status: "pending" | "paid" | "overdue" | "cancelled";
    autoPay: boolean;
    paymentMethod?: "card" | "crypto" | "api_deduction";
    lastPaidAt?: number;
    paidAmount?: Decimal;
    txSignature?: string;
}
type ExpenseCategory = "api_subscriptions" | "infrastructure" | "marketing" | "tools" | "legal" | "other";
interface Budget {
    limits: Record<ExpenseCategory, Decimal>;
    spent: Record<ExpenseCategory, Decimal>;
    alertThreshold: number;
    periodStart: number;
    periodEnd: number;
}
type ExpenseFrequency = "daily" | "weekly" | "monthly" | "yearly";
interface BudgetStatus {
    total: {
        limit: Decimal;
        spent: Decimal;
        remaining: Decimal;
    };
    byCategory: Record<ExpenseCategory, {
        limit: Decimal;
        spent: Decimal;
        percent: number;
    }>;
    alerts: string[];
}
interface FinancialReport {
    period: "daily" | "weekly" | "monthly";
    startDate: number;
    endDate: number;
    summary: {
        totalRevenue: Decimal;
        totalExpenses: Decimal;
        netProfit: Decimal;
        profitMargin: number;
    };
    revenue: {
        trading: Decimal;
        subscriptions: Decimal;
        api: Decimal;
        marketplace: Decimal;
    };
    expenses: Record<ExpenseCategory, Decimal>;
    trading: {
        totalPnL: Decimal;
        winRate: number;
        tradesExecuted: number;
        bestTrade: Decimal;
        worstTrade: Decimal;
    };
    treasury: {
        totalValue: Decimal;
        change: Decimal;
        changePercent: number;
    };
    health: {
        runway: number;
        burnRate: Decimal;
        selfSustaining: boolean;
    };
}
interface MoneyEngineConfig {
    rpcUrl: string;
    tradingMode: TradingMode;
    enableTrading: boolean;
    dcaAmountPerBuy: number;
    dcaSchedule: string;
    autoPayExpenses: boolean;
}

/**
 * Treasury Manager
 *
 * Manages all gICM funds, allocations, and rebalancing.
 */

declare const DEFAULT_ALLOCATIONS: {
    trading: Decimal;
    operations: Decimal;
    growth: Decimal;
    reserve: Decimal;
};
declare const DEFAULT_THRESHOLDS: {
    minOperatingBalance: Decimal;
    maxTradingAllocation: Decimal;
    rebalanceThreshold: Decimal;
};
interface TreasuryManagerConfig {
    mainWallet: string;
    tradingWallet?: string;
    operationsWallet?: string;
    coldWallet?: string;
    allocations?: Partial<typeof DEFAULT_ALLOCATIONS>;
    thresholds?: Partial<typeof DEFAULT_THRESHOLDS>;
}
declare class TreasuryManager {
    private treasury;
    private logger;
    private solPrice;
    constructor(config: TreasuryManagerConfig);
    private initializeTreasury;
    /**
     * Set SOL price for USD calculations
     */
    setSolPrice(price: number): void;
    /**
     * Update balances from external source
     */
    updateBalances(balances: {
        sol: number;
        usdc: number;
        tokens?: Array<{
            mint: string;
            symbol: string;
            balance: number;
            price: number;
        }>;
    }): void;
    /**
     * Get total treasury value in USD
     */
    getTotalValueUsd(): Decimal;
    /**
     * Get allocation amounts in USD
     */
    getAllocations(): {
        trading: Decimal;
        operations: Decimal;
        growth: Decimal;
        reserve: Decimal;
    };
    /**
     * Check if rebalance is needed
     */
    needsRebalance(): boolean;
    /**
     * Get available amount for trading
     */
    getAvailableForTrading(): Decimal;
    /**
     * Calculate runway in months
     */
    getRunwayMonths(monthlyExpenses: Decimal): number;
    /**
     * Check if revenue covers expenses (self-sustaining)
     */
    isSelfSustaining(monthlyRevenue: Decimal, monthlyExpenses: Decimal): boolean;
    /**
     * Get full treasury status
     */
    getStatus(monthlyExpenses?: Decimal, monthlyRevenue?: Decimal): TreasuryStatus;
    /**
     * Get raw treasury state
     */
    getState(): Treasury;
    /**
     * Get wallet addresses
     */
    getWallets(): Treasury["wallets"];
}

/**
 * Dual Trading Engine
 *
 * Runs Paper ($1000 virtual) and Micro ($5 real) trading simultaneously.
 * Compares performance to learn what works before scaling up.
 */

interface DualEngineConfig {
    paperBalance: number;
    paperAmountPerTrade: number;
    microAmountPerTrade: number;
    maxDailyMicro: number;
    schedule: string;
    targetToken: string;
    targetSymbol: string;
}
interface DualPerformance {
    paper: {
        balance: Decimal;
        startBalance: Decimal;
        trades: number;
        pnl: Decimal;
        pnlPercent: number;
        winRate: number;
        avgTradeSize: Decimal;
        lastTrade?: Trade;
    };
    micro: {
        spent: Decimal;
        dailySpent: Decimal;
        trades: number;
        pnl: Decimal;
        pnlPercent: number;
        winRate: number;
        avgTradeSize: Decimal;
        lastTrade?: Trade;
    };
    comparison: {
        paperBetterBy: number;
        recommendation: "scale_micro" | "keep_paper" | "adjust_strategy" | "insufficient_data";
        confidence: number;
    };
}
interface DualEngineEvents {
    "trade": (trade: Trade, mode: "paper" | "micro") => void;
    "error": (error: Error) => void;
}
declare class DualTradingEngine extends EventEmitter<DualEngineEvents> {
    private logger;
    private connection;
    private keypair;
    private config;
    private paperBot;
    private microBot;
    private paperTrades;
    private microTrades;
    private dailyMicroSpent;
    private dailyResetTime;
    private isRunning;
    constructor(connection: Connection, keypair: Keypair, config?: Partial<DualEngineConfig>);
    /**
     * Start both paper and micro bots
     */
    start(): Promise<void>;
    /**
     * Stop both bots
     */
    stop(): Promise<void>;
    /**
     * Handle paper trade
     */
    private handlePaperTrade;
    /**
     * Handle micro trade with daily limit check
     */
    private handleMicroTrade;
    /**
     * Reset daily counter if new day
     */
    private resetDailyIfNeeded;
    /**
     * Schedule daily reset
     */
    private scheduleDailyReset;
    /**
     * Get combined performance metrics
     */
    getPerformance(): DualPerformance;
    /**
     * Calculate performance metrics from trades
     */
    private calculatePerformance;
    /**
     * Manually trigger both DCA bots (for testing)
     */
    triggerDCA(): Promise<void>;
    /**
     * Print performance comparison
     */
    printPerformance(): void;
    /**
     * Is engine running
     */
    isEngineRunning(): boolean;
    /**
     * Get trade history
     */
    getTradeHistory(): {
        paper: Trade[];
        micro: Trade[];
    };
}

interface MoneyEngineEvents {
    "trade": (trade: Trade) => void;
    "report": (report: FinancialReport) => void;
    "alert": (message: string) => void;
}
declare class MoneyEngine extends EventEmitter<MoneyEngineEvents> {
    private config;
    private logger;
    private connection;
    private keypair;
    private treasury;
    private expenses;
    private tradingEngine;
    constructor(config?: Partial<MoneyEngineConfig>);
    private initializeTrading;
    /**
     * Start the engine
     */
    start(): Promise<void>;
    /**
     * Stop the engine
     */
    stop(): Promise<void>;
    /**
     * Get overall status
     */
    getStatus(): Promise<{
        treasury: any;
        trading: {
            active: boolean;
            performance?: any;
        };
        health: {
            runway: number;
        };
    }>;
    getTreasury(): TreasuryManager;
    getTradingEngine(): DualTradingEngine | null;
}

/**
 * Expense Tracker
 *
 * Tracks and manages recurring and one-time expenses.
 */

declare class ExpenseTracker {
    private expenses;
    private budget;
    private logger;
    constructor(budgetLimits?: Partial<Record<ExpenseCategory, number>>);
    private initializeBudget;
    /**
     * Add an expense
     */
    addExpense(expense: Omit<Expense, "id" | "status">): Expense;
    /**
     * Add default gICM expenses
     */
    addDefaultExpenses(): void;
    /**
     * Mark expense as paid
     */
    markPaid(expenseId: string, txSignature?: string): boolean;
    /**
     * Get expenses due within N days
     */
    getUpcoming(days?: number): Expense[];
    /**
     * Get overdue expenses
     */
    getOverdue(): Expense[];
    /**
     * Check if expense fits in budget
     */
    checkBudget(category: ExpenseCategory, amount: Decimal): boolean;
    /**
     * Get budget status
     */
    getBudgetStatus(): BudgetStatus;
    /**
     * Get monthly expense total
     */
    getMonthlyTotal(): Decimal;
    /**
     * Get all expenses
     */
    getExpenses(): Expense[];
    /**
     * Reset budget for new period
     */
    resetBudgetPeriod(): void;
    private getNextMonthStart;
    private getNextYearStart;
    private getNextDueDate;
}

/**
 * Simple Logger
 */
type LogLevel = "debug" | "info" | "warn" | "error";
declare class Logger {
    private name;
    private level;
    constructor(name: string, level?: LogLevel);
    private shouldLog;
    private format;
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export { type BotConfig, type BotPerformance, type BotStatus, type BotType, type Budget, type BudgetStatus, type Expense, type ExpenseCategory, type ExpenseFrequency, ExpenseTracker, type FinancialReport, type LogLevel, Logger, MoneyEngine, type MoneyEngineConfig, type MoneyEngineEvents, type Order, type Position, type RevenueStream, type RiskParameters, type Subscription, type TokenBalance, type Trade, type TradingBot, type TradingMode, type Treasury, TreasuryManager, type TreasuryManagerConfig, type TreasuryStatus };
