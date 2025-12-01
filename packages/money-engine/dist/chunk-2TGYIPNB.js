// src/engine.ts
import { Connection, Keypair } from "@solana/web3.js";
import { EventEmitter as EventEmitter3 } from "eventemitter3";

// src/treasury/manager.ts
import Decimal from "decimal.js";

// src/utils/logger.ts
var Logger = class {
  name;
  level;
  constructor(name, level = "info") {
    this.name = name;
    this.level = level;
  }
  shouldLog(level) {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
  format(level, message) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`;
  }
  debug(message) {
    if (this.shouldLog("debug")) {
      console.debug(this.format("debug", message));
    }
  }
  info(message) {
    if (this.shouldLog("info")) {
      console.info(this.format("info", message));
    }
  }
  warn(message) {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message));
    }
  }
  error(message) {
    if (this.shouldLog("error")) {
      console.error(this.format("error", message));
    }
  }
};

// src/treasury/manager.ts
var DEFAULT_ALLOCATIONS = {
  trading: new Decimal(0.4),
  // 40%
  operations: new Decimal(0.3),
  // 30%
  growth: new Decimal(0.2),
  // 20%
  reserve: new Decimal(0.1)
  // 10%
};
var DEFAULT_THRESHOLDS = {
  minOperatingBalance: new Decimal(1e3),
  // $1000 minimum
  maxTradingAllocation: new Decimal(0.5),
  // Max 50% in trading
  rebalanceThreshold: new Decimal(0.1)
  // Rebalance if 10% off target
};
var TreasuryManager = class {
  treasury;
  logger;
  solPrice = 0;
  constructor(config) {
    this.logger = new Logger("Treasury");
    this.treasury = this.initializeTreasury(config);
  }
  initializeTreasury(config) {
    return {
      balances: {
        sol: new Decimal(0),
        usdc: new Decimal(0),
        tokens: /* @__PURE__ */ new Map()
      },
      allocations: {
        trading: config.allocations?.trading ?? DEFAULT_ALLOCATIONS.trading,
        operations: config.allocations?.operations ?? DEFAULT_ALLOCATIONS.operations,
        growth: config.allocations?.growth ?? DEFAULT_ALLOCATIONS.growth,
        reserve: config.allocations?.reserve ?? DEFAULT_ALLOCATIONS.reserve
      },
      wallets: {
        main: config.mainWallet,
        trading: config.tradingWallet ?? config.mainWallet,
        operations: config.operationsWallet ?? config.mainWallet,
        cold: config.coldWallet ?? ""
      },
      thresholds: {
        minOperatingBalance: config.thresholds?.minOperatingBalance ?? DEFAULT_THRESHOLDS.minOperatingBalance,
        maxTradingAllocation: config.thresholds?.maxTradingAllocation ?? DEFAULT_THRESHOLDS.maxTradingAllocation,
        rebalanceThreshold: config.thresholds?.rebalanceThreshold ?? DEFAULT_THRESHOLDS.rebalanceThreshold
      },
      lastUpdated: Date.now(),
      lastRebalance: Date.now()
    };
  }
  /**
   * Set SOL price for USD calculations
   */
  setSolPrice(price) {
    this.solPrice = price;
  }
  /**
   * Update balances from external source
   */
  updateBalances(balances) {
    this.treasury.balances.sol = new Decimal(balances.sol);
    this.treasury.balances.usdc = new Decimal(balances.usdc);
    if (balances.tokens) {
      this.treasury.balances.tokens.clear();
      for (const token of balances.tokens) {
        const balance = new Decimal(token.balance);
        const price = new Decimal(token.price);
        this.treasury.balances.tokens.set(token.mint, {
          mint: token.mint,
          symbol: token.symbol,
          balance,
          price,
          valueUsd: balance.mul(price)
        });
      }
    }
    this.treasury.lastUpdated = Date.now();
    this.logger.info(`Balances updated: ${balances.sol} SOL, $${balances.usdc} USDC`);
  }
  /**
   * Get total treasury value in USD
   */
  getTotalValueUsd() {
    const solValue = this.treasury.balances.sol.mul(this.solPrice);
    const usdcValue = this.treasury.balances.usdc;
    let tokenValue = new Decimal(0);
    for (const [_, token] of this.treasury.balances.tokens) {
      tokenValue = tokenValue.add(token.valueUsd);
    }
    return solValue.add(usdcValue).add(tokenValue);
  }
  /**
   * Get allocation amounts in USD
   */
  getAllocations() {
    const total = this.getTotalValueUsd();
    return {
      trading: total.mul(this.treasury.allocations.trading),
      operations: total.mul(this.treasury.allocations.operations),
      growth: total.mul(this.treasury.allocations.growth),
      reserve: total.mul(this.treasury.allocations.reserve)
    };
  }
  /**
   * Check if rebalance is needed
   */
  needsRebalance() {
    const total = this.getTotalValueUsd();
    if (total.isZero()) return false;
    const threshold = this.treasury.thresholds.rebalanceThreshold;
    const allocations = this.getAllocations();
    const tradingTarget = total.mul(this.treasury.allocations.trading);
    const tradingDiff = allocations.trading.sub(tradingTarget).abs().div(tradingTarget);
    return tradingDiff.gt(threshold);
  }
  /**
   * Get available amount for trading
   */
  getAvailableForTrading() {
    const allocations = this.getAllocations();
    return allocations.trading;
  }
  /**
   * Calculate runway in months
   */
  getRunwayMonths(monthlyExpenses) {
    const total = this.getTotalValueUsd();
    if (monthlyExpenses.isZero()) return Infinity;
    return total.div(monthlyExpenses).toNumber();
  }
  /**
   * Check if revenue covers expenses (self-sustaining)
   */
  isSelfSustaining(monthlyRevenue, monthlyExpenses) {
    return monthlyRevenue.gte(monthlyExpenses);
  }
  /**
   * Get full treasury status
   */
  getStatus(monthlyExpenses, monthlyRevenue) {
    const totalValueUsd = this.getTotalValueUsd();
    const allocations = this.getAllocations();
    const expenses = monthlyExpenses ?? new Decimal(500);
    const revenue = monthlyRevenue ?? new Decimal(0);
    return {
      totalValueUsd,
      balances: {
        sol: this.treasury.balances.sol,
        usdc: this.treasury.balances.usdc
      },
      allocations,
      health: {
        runway: this.getRunwayMonths(expenses),
        needsRebalance: this.needsRebalance(),
        selfSustaining: this.isSelfSustaining(revenue, expenses)
      }
    };
  }
  /**
   * Get raw treasury state
   */
  getState() {
    return { ...this.treasury };
  }
  /**
   * Get wallet addresses
   */
  getWallets() {
    return { ...this.treasury.wallets };
  }
};

// src/expenses/tracker.ts
import Decimal2 from "decimal.js";
var DEFAULT_BUDGET_LIMITS = {
  api_subscriptions: new Decimal2(500),
  infrastructure: new Decimal2(200),
  marketing: new Decimal2(300),
  tools: new Decimal2(100),
  legal: new Decimal2(100),
  other: new Decimal2(100)
};
var ExpenseTracker = class {
  expenses = /* @__PURE__ */ new Map();
  budget;
  logger;
  constructor(budgetLimits) {
    this.logger = new Logger("Expenses");
    this.budget = this.initializeBudget(budgetLimits);
  }
  initializeBudget(limits) {
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const budgetLimits = { ...DEFAULT_BUDGET_LIMITS };
    if (limits) {
      for (const [category, amount] of Object.entries(limits)) {
        budgetLimits[category] = new Decimal2(amount);
      }
    }
    return {
      limits: budgetLimits,
      spent: {
        api_subscriptions: new Decimal2(0),
        infrastructure: new Decimal2(0),
        marketing: new Decimal2(0),
        tools: new Decimal2(0),
        legal: new Decimal2(0),
        other: new Decimal2(0)
      },
      alertThreshold: 80,
      periodStart: startOfMonth.getTime(),
      periodEnd: endOfMonth.getTime()
    };
  }
  /**
   * Add an expense
   */
  addExpense(expense) {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newExpense = {
      ...expense,
      id,
      status: "pending"
    };
    this.expenses.set(id, newExpense);
    this.logger.info(`Added expense: ${expense.name} ($${expense.amount})`);
    return newExpense;
  }
  /**
   * Add default gICM expenses
   */
  addDefaultExpenses() {
    this.addExpense({
      category: "api_subscriptions",
      subcategory: "llm",
      name: "Claude API",
      description: "Anthropic Claude API usage",
      amount: new Decimal2(200),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: this.getNextMonthStart(),
      autoPay: true,
      paymentMethod: "card"
    });
    this.addExpense({
      category: "api_subscriptions",
      subcategory: "blockchain",
      name: "Helius RPC",
      description: "Solana RPC provider",
      amount: new Decimal2(50),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: this.getNextMonthStart(),
      autoPay: true,
      paymentMethod: "card"
    });
    this.addExpense({
      category: "api_subscriptions",
      subcategory: "data",
      name: "Birdeye API",
      description: "Token data and analytics",
      amount: new Decimal2(100),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: this.getNextMonthStart(),
      autoPay: true,
      paymentMethod: "card"
    });
    this.addExpense({
      category: "infrastructure",
      subcategory: "hosting",
      name: "Vercel Pro",
      description: "Frontend hosting",
      amount: new Decimal2(20),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: this.getNextMonthStart(),
      autoPay: true,
      paymentMethod: "card"
    });
    this.addExpense({
      category: "infrastructure",
      subcategory: "domain",
      name: "gicm.dev domain",
      description: "Domain registration",
      amount: new Decimal2(15),
      currency: "USD",
      type: "recurring",
      frequency: "yearly",
      nextDueDate: this.getNextYearStart(),
      autoPay: true,
      paymentMethod: "card"
    });
    this.logger.info("Added default gICM expenses");
  }
  /**
   * Mark expense as paid
   */
  markPaid(expenseId, txSignature) {
    const expense = this.expenses.get(expenseId);
    if (!expense) {
      this.logger.warn(`Expense not found: ${expenseId}`);
      return false;
    }
    expense.status = "paid";
    expense.lastPaidAt = Date.now();
    expense.paidAmount = expense.amount;
    if (txSignature) {
      expense.txSignature = txSignature;
    }
    this.budget.spent[expense.category] = this.budget.spent[expense.category].add(expense.amount);
    if (expense.type === "recurring" && expense.frequency) {
      expense.nextDueDate = this.getNextDueDate(expense.frequency);
      expense.status = "pending";
    }
    this.logger.info(`Expense paid: ${expense.name} - $${expense.amount}`);
    return true;
  }
  /**
   * Get expenses due within N days
   */
  getUpcoming(days = 30) {
    const cutoff = Date.now() + days * 24 * 60 * 60 * 1e3;
    return Array.from(this.expenses.values()).filter((e) => e.status !== "cancelled" && e.nextDueDate && e.nextDueDate <= cutoff).sort((a, b) => (a.nextDueDate || 0) - (b.nextDueDate || 0));
  }
  /**
   * Get overdue expenses
   */
  getOverdue() {
    const now = Date.now();
    return Array.from(this.expenses.values()).filter((e) => e.status !== "cancelled" && e.status !== "paid" && e.nextDueDate && e.nextDueDate < now);
  }
  /**
   * Check if expense fits in budget
   */
  checkBudget(category, amount) {
    const limit = this.budget.limits[category];
    const spent = this.budget.spent[category];
    const remaining = limit.sub(spent);
    return amount.lte(remaining);
  }
  /**
   * Get budget status
   */
  getBudgetStatus() {
    const alerts = [];
    const byCategory = {};
    let totalLimit = new Decimal2(0);
    let totalSpent = new Decimal2(0);
    for (const category of Object.keys(this.budget.limits)) {
      const limit = this.budget.limits[category];
      const spent = this.budget.spent[category];
      const percent = limit.isZero() ? 0 : spent.div(limit).mul(100).toNumber();
      totalLimit = totalLimit.add(limit);
      totalSpent = totalSpent.add(spent);
      byCategory[category] = { limit, spent, percent };
      if (percent >= this.budget.alertThreshold) {
        alerts.push(`${category}: ${percent.toFixed(0)}% of budget used`);
      }
    }
    return {
      total: {
        limit: totalLimit,
        spent: totalSpent,
        remaining: totalLimit.sub(totalSpent)
      },
      byCategory,
      alerts
    };
  }
  /**
   * Get monthly expense total
   */
  getMonthlyTotal() {
    let total = new Decimal2(0);
    for (const expense of this.expenses.values()) {
      if (expense.status === "cancelled") continue;
      if (expense.frequency === "monthly") {
        total = total.add(expense.amount);
      } else if (expense.frequency === "yearly") {
        total = total.add(expense.amount.div(12));
      }
    }
    return total;
  }
  /**
   * Get all expenses
   */
  getExpenses() {
    return Array.from(this.expenses.values());
  }
  /**
   * Reset budget for new period
   */
  resetBudgetPeriod() {
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.budget.periodStart = startOfMonth.getTime();
    this.budget.periodEnd = endOfMonth.getTime();
    for (const category of Object.keys(this.budget.spent)) {
      this.budget.spent[category] = new Decimal2(0);
    }
    this.logger.info("Budget period reset");
  }
  // Helpers
  getNextMonthStart() {
    const now = /* @__PURE__ */ new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  }
  getNextYearStart() {
    const now = /* @__PURE__ */ new Date();
    return new Date(now.getFullYear() + 1, 0, 1).getTime();
  }
  getNextDueDate(frequency) {
    const now = Date.now();
    switch (frequency) {
      case "daily":
        return now + 24 * 60 * 60 * 1e3;
      case "weekly":
        return now + 7 * 24 * 60 * 60 * 1e3;
      case "monthly":
        return this.getNextMonthStart();
      case "yearly":
        return this.getNextYearStart();
      default:
        return now;
    }
  }
};

// src/trading/dual-engine.ts
import Decimal7 from "decimal.js";
import { EventEmitter as EventEmitter2 } from "eventemitter3";

// src/trading/bots/dca.ts
import Decimal6 from "decimal.js";
import { CronJob } from "cron";

// src/trading/base-bot.ts
import { EventEmitter } from "eventemitter3";
import Decimal4 from "decimal.js";

// src/trading/risk-manager.ts
import Decimal3 from "decimal.js";

// src/core/constants.ts
import { PublicKey } from "@solana/web3.js";
var USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
var SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
var SOL_DECIMALS = 9;
var DEFAULT_RISK_PARAMS = {
  maxPositionPercent: 10,
  // 10% of capital per position
  maxTotalExposure: 80,
  // 80% max exposure
  stopLossPercent: 5,
  // 5% stop loss
  dailyLossLimitPercent: 3,
  // 3% daily loss limit
  weeklyLossLimitPercent: 10,
  // 10% weekly loss limit
  maxDrawdownPercent: 15,
  // 15% max drawdown
  cooldownAfterLoss: 3600
  // 1 hour cooldown
};

// src/trading/risk-manager.ts
var RiskManager = class {
  params;
  logger;
  dailyLossTracking = new Decimal3(0);
  weeklyLossTracking = new Decimal3(0);
  lastDailyReset = Date.now();
  lastWeeklyReset = Date.now();
  constructor(params) {
    this.logger = new Logger("RiskManager");
    this.params = {
      maxPositionPercent: params?.maxPositionPercent ?? DEFAULT_RISK_PARAMS.maxPositionPercent,
      maxTotalExposure: params?.maxTotalExposure ?? DEFAULT_RISK_PARAMS.maxTotalExposure,
      stopLossPercent: params?.stopLossPercent ?? DEFAULT_RISK_PARAMS.stopLossPercent,
      dailyLossLimit: params?.dailyLossLimit ?? new Decimal3(DEFAULT_RISK_PARAMS.dailyLossLimitPercent),
      weeklyLossLimit: params?.weeklyLossLimit ?? new Decimal3(DEFAULT_RISK_PARAMS.weeklyLossLimitPercent),
      maxDrawdownPercent: params?.maxDrawdownPercent ?? DEFAULT_RISK_PARAMS.maxDrawdownPercent,
      cooldownAfterLoss: params?.cooldownAfterLoss ?? DEFAULT_RISK_PARAMS.cooldownAfterLoss
    };
  }
  /**
   * Check if a new position can be opened
   */
  canOpenPosition(performance, positionSize, totalCapital) {
    this.resetTrackingIfNeeded();
    const positionPercent = positionSize.div(totalCapital).mul(100).toNumber();
    if (positionPercent > this.params.maxPositionPercent) {
      this.logger.warn(
        `Position size ${positionPercent.toFixed(2)}% exceeds max ${this.params.maxPositionPercent}%`
      );
      return false;
    }
    const currentExposure = this.calculateCurrentExposure(performance, totalCapital);
    const newExposure = currentExposure + positionPercent;
    if (newExposure > this.params.maxTotalExposure) {
      this.logger.warn(
        `Total exposure ${newExposure.toFixed(2)}% would exceed max ${this.params.maxTotalExposure}%`
      );
      return false;
    }
    if (this.dailyLossTracking.abs().gt(this.params.dailyLossLimit.mul(totalCapital).div(100))) {
      this.logger.warn("Daily loss limit reached");
      return false;
    }
    if (this.weeklyLossTracking.abs().gt(this.params.weeklyLossLimit.mul(totalCapital).div(100))) {
      this.logger.warn("Weekly loss limit reached");
      return false;
    }
    if (performance.maxDrawdown > this.params.maxDrawdownPercent) {
      this.logger.warn(
        `Max drawdown ${performance.maxDrawdown.toFixed(2)}% exceeds limit ${this.params.maxDrawdownPercent}%`
      );
      return false;
    }
    return true;
  }
  /**
   * Calculate current exposure as percentage
   */
  calculateCurrentExposure(performance, totalCapital) {
    if (totalCapital.isZero()) return 0;
    return performance.unrealizedPnL.abs().div(totalCapital).mul(100).toNumber();
  }
  /**
   * Record a loss for tracking
   */
  recordLoss(amount) {
    this.resetTrackingIfNeeded();
    this.dailyLossTracking = this.dailyLossTracking.sub(amount.abs());
    this.weeklyLossTracking = this.weeklyLossTracking.sub(amount.abs());
    this.logger.info(`Recorded loss: $${amount.toFixed(2)}`);
  }
  /**
   * Record a profit for tracking
   */
  recordProfit(amount) {
    this.resetTrackingIfNeeded();
    this.dailyLossTracking = this.dailyLossTracking.add(amount);
    this.weeklyLossTracking = this.weeklyLossTracking.add(amount);
  }
  /**
   * Reset tracking counters if period has passed
   */
  resetTrackingIfNeeded() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1e3;
    const weekMs = 7 * dayMs;
    if (now - this.lastDailyReset > dayMs) {
      this.dailyLossTracking = new Decimal3(0);
      this.lastDailyReset = now;
    }
    if (now - this.lastWeeklyReset > weekMs) {
      this.weeklyLossTracking = new Decimal3(0);
      this.lastWeeklyReset = now;
    }
  }
  /**
   * Calculate optimal position size based on risk
   */
  calculatePositionSize(totalCapital, riskPercent = 1) {
    const maxPosition = totalCapital.mul(this.params.maxPositionPercent).div(100);
    const riskBasedPosition = totalCapital.mul(riskPercent).div(100);
    return Decimal3.min(maxPosition, riskBasedPosition);
  }
  /**
   * Get stop loss price for a position
   */
  getStopLossPrice(entryPrice, side) {
    const stopPercent = this.params.stopLossPercent / 100;
    return side === "long" ? entryPrice.mul(1 - stopPercent) : entryPrice.mul(1 + stopPercent);
  }
  /**
   * Check if bot should be paused due to losses
   */
  shouldPauseTrading(performance) {
    return performance.maxDrawdown > this.params.maxDrawdownPercent;
  }
  /**
   * Get parameters
   */
  getParams() {
    return { ...this.params };
  }
  /**
   * Update parameters
   */
  updateParams(params) {
    this.params = { ...this.params, ...params };
    this.logger.info("Risk parameters updated");
  }
};

// src/trading/base-bot.ts
var BaseBot = class extends EventEmitter {
  id;
  name;
  botType;
  mode;
  status = "stopped";
  config;
  performance;
  riskManager;
  logger;
  positions = /* @__PURE__ */ new Map();
  pendingOrders = /* @__PURE__ */ new Map();
  tradeHistory = [];
  constructor(id, name, botType, config, riskParams, mode = "paper") {
    super();
    this.id = id;
    this.name = name;
    this.botType = botType;
    this.config = config;
    this.mode = mode;
    this.logger = new Logger(`Bot:${name}`);
    this.riskManager = new RiskManager(riskParams);
    this.performance = this.initializePerformance();
  }
  initializePerformance() {
    return {
      totalPnL: new Decimal4(0),
      realizedPnL: new Decimal4(0),
      unrealizedPnL: new Decimal4(0),
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      dailyPnL: new Decimal4(0),
      weeklyPnL: new Decimal4(0),
      monthlyPnL: new Decimal4(0)
    };
  }
  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  async start() {
    if (this.status === "running") {
      this.logger.warn("Bot already running");
      return;
    }
    this.logger.info(`Starting ${this.name} in ${this.mode} mode...`);
    this.status = "running";
    await this.onStart();
    this.emit("started");
    this.logger.info(`${this.name} started`);
  }
  async stop() {
    if (this.status === "stopped") return;
    this.logger.info(`Stopping ${this.name}...`);
    if (this.config.strategyParams.closeOnStop) {
      await this.closeAllPositions();
    }
    await this.onStop();
    this.status = "stopped";
    this.emit("stopped");
    this.logger.info(`${this.name} stopped`);
  }
  async pause() {
    this.status = "paused";
    this.logger.info(`${this.name} paused`);
  }
  async resume() {
    this.status = "running";
    this.logger.info(`${this.name} resumed`);
  }
  // ===========================================================================
  // POSITION MANAGEMENT
  // ===========================================================================
  async openPosition(token, symbol, size, side = "long") {
    if (!this.riskManager.canOpenPosition(this.performance, size, this.config.allocatedCapital)) {
      this.logger.warn(`Risk check failed for ${symbol}`);
      this.emit("risk:alert", `Cannot open position: risk limits exceeded`);
      return null;
    }
    const price = await this.getPrice(token);
    const trade = side === "long" ? await this.executeBuy(token, size) : await this.executeSell(token, size);
    if (!trade) {
      this.logger.error(`Failed to execute trade for ${symbol}`);
      return null;
    }
    const position = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      botId: this.id,
      token,
      symbol,
      side,
      size,
      entryPrice: trade.price,
      currentPrice: trade.price,
      unrealizedPnL: new Decimal4(0),
      unrealizedPnLPercent: 0,
      stopLoss: this.riskManager.getStopLossPrice(trade.price, side),
      takeProfit: this.calculateTakeProfit(trade.price, side),
      openedAt: Date.now(),
      updatedAt: Date.now()
    };
    this.positions.set(position.id, position);
    this.tradeHistory.push(trade);
    this.emit("position:opened", position);
    this.logger.info(`Opened ${side} position: ${size} ${symbol} @ ${trade.price}`);
    return position;
  }
  async closePosition(positionId) {
    const position = this.positions.get(positionId);
    if (!position) {
      this.logger.warn(`Position not found: ${positionId}`);
      return null;
    }
    const trade = position.side === "long" ? await this.executeSell(position.token, position.size) : await this.executeBuy(position.token, position.size);
    if (!trade) {
      this.logger.error(`Failed to close position ${positionId}`);
      return null;
    }
    const pnl = position.side === "long" ? trade.price.sub(position.entryPrice).mul(position.size) : position.entryPrice.sub(trade.price).mul(position.size);
    trade.realizedPnL = pnl;
    this.tradeHistory.push(trade);
    this.performance.realizedPnL = this.performance.realizedPnL.add(pnl);
    this.performance.totalTrades++;
    if (pnl.gt(0)) {
      this.performance.winningTrades++;
      this.riskManager.recordProfit(pnl);
    } else {
      this.performance.losingTrades++;
      this.riskManager.recordLoss(pnl);
    }
    this.updateWinRate();
    this.positions.delete(positionId);
    this.emit("position:closed", position, pnl);
    this.logger.info(`Closed position: ${position.symbol} PnL: ${pnl.toFixed(2)}`);
    return pnl;
  }
  async closeAllPositions() {
    this.logger.info("Closing all positions...");
    for (const [positionId] of this.positions) {
      await this.closePosition(positionId);
    }
  }
  async updatePositions() {
    let totalUnrealized = new Decimal4(0);
    for (const [id, position] of this.positions) {
      const currentPrice = await this.getPrice(position.token);
      position.currentPrice = currentPrice;
      if (position.side === "long") {
        position.unrealizedPnL = currentPrice.sub(position.entryPrice).mul(position.size);
      } else {
        position.unrealizedPnL = position.entryPrice.sub(currentPrice).mul(position.size);
      }
      position.unrealizedPnLPercent = position.unrealizedPnL.div(position.entryPrice.mul(position.size)).mul(100).toNumber();
      position.updatedAt = Date.now();
      totalUnrealized = totalUnrealized.add(position.unrealizedPnL);
      if (position.stopLoss && this.shouldTriggerStopLoss(position)) {
        this.logger.warn(`Stop loss triggered for ${position.symbol}`);
        await this.closePosition(id);
      }
      if (position.takeProfit && this.shouldTriggerTakeProfit(position)) {
        this.logger.info(`Take profit triggered for ${position.symbol}`);
        await this.closePosition(id);
      }
    }
    this.performance.unrealizedPnL = totalUnrealized;
    this.performance.totalPnL = this.performance.realizedPnL.add(totalUnrealized);
  }
  // ===========================================================================
  // HELPERS
  // ===========================================================================
  calculateTakeProfit(entryPrice, side) {
    const takeProfitPercent = 0.1;
    return side === "long" ? entryPrice.mul(1 + takeProfitPercent) : entryPrice.mul(1 - takeProfitPercent);
  }
  shouldTriggerStopLoss(position) {
    if (!position.stopLoss) return false;
    return position.side === "long" ? position.currentPrice.lte(position.stopLoss) : position.currentPrice.gte(position.stopLoss);
  }
  shouldTriggerTakeProfit(position) {
    if (!position.takeProfit) return false;
    return position.side === "long" ? position.currentPrice.gte(position.takeProfit) : position.currentPrice.lte(position.takeProfit);
  }
  updateWinRate() {
    if (this.performance.totalTrades === 0) {
      this.performance.winRate = 0;
    } else {
      this.performance.winRate = this.performance.winningTrades / this.performance.totalTrades * 100;
    }
  }
  // ===========================================================================
  // PUBLIC API
  // ===========================================================================
  getId() {
    return this.id;
  }
  getName() {
    return this.name;
  }
  getStatus() {
    return this.status;
  }
  getMode() {
    return this.mode;
  }
  getPerformance() {
    return { ...this.performance };
  }
  getPositions() {
    return Array.from(this.positions.values());
  }
  getTradeHistory() {
    return [...this.tradeHistory];
  }
  getState() {
    return {
      id: this.id,
      type: this.botType,
      name: this.name,
      status: this.status,
      mode: this.mode,
      config: this.config,
      performance: this.performance,
      riskParams: this.riskManager.getParams(),
      positions: this.getPositions(),
      pendingOrders: Array.from(this.pendingOrders.values()),
      createdAt: Date.now(),
      lastTradeAt: this.tradeHistory.length > 0 ? this.tradeHistory[this.tradeHistory.length - 1].executedAt : void 0
    };
  }
};

// src/blockchain/jupiter.ts
import Decimal5 from "decimal.js";
var JupiterClient = class {
  logger;
  baseUrl = "https://quote-api.jup.ag/v6";
  constructor() {
    this.logger = new Logger("Jupiter");
  }
  /**
   * Get price for a token in USDC
   */
  async getPrice(tokenMint) {
    try {
      const response = await fetch(
        `https://price.jup.ag/v6/price?ids=${tokenMint}`
      );
      const data = await response.json();
      return data.data[tokenMint]?.price ?? 0;
    } catch (error) {
      this.logger.error(`Failed to get price: ${error}`);
      return 0;
    }
  }
  /**
   * Get swap quote
   */
  async getQuote(inputMint, outputMint, amount, slippageBps) {
    try {
      const response = await fetch(
        `${this.baseUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
      );
      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to get quote: ${error}`);
      return null;
    }
  }
  /**
   * Execute a swap
   */
  async swap(params) {
    this.logger.info(`Executing swap: ${params.amount} ${params.inputMint} -> ${params.outputMint}`);
    const quote = await this.getQuote(
      params.inputMint,
      params.outputMint,
      params.amount,
      params.slippageBps
    );
    if (!quote) {
      throw new Error("Failed to get quote");
    }
    const inputAmount = params.amount;
    const outputAmount = parseInt(quote.outAmount);
    const price = new Decimal5(outputAmount).div(inputAmount).toNumber();
    this.logger.info(`Swap executed: ${inputAmount} -> ${outputAmount} @ ${price}`);
    return {
      txSignature: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      inputAmount,
      outputAmount,
      price,
      fee: inputAmount * 3e-3,
      // 0.3% simulated fee
      slippage: quote.priceImpactPct
    };
  }
  /**
   * Get SOL price in USD
   */
  async getSolPrice() {
    return this.getPrice("So11111111111111111111111111111111111111112");
  }
};

// src/trading/bots/dca.ts
var DCABot = class extends BaseBot {
  connection;
  keypair;
  jupiter;
  cronJob;
  dcaConfig;
  constructor(connection, keypair, config, riskParams, mode = "paper") {
    super(
      `dca-${config.strategyParams.targetSymbol}`,
      `DCA ${config.strategyParams.targetSymbol}`,
      "dca",
      config,
      riskParams,
      mode
    );
    this.connection = connection;
    this.keypair = keypair;
    this.dcaConfig = config;
    this.jupiter = new JupiterClient();
  }
  async onStart() {
    this.logger.info(`Setting up DCA schedule: ${this.dcaConfig.strategyParams.schedule}`);
    this.cronJob = new CronJob(
      this.dcaConfig.strategyParams.schedule,
      async () => {
        await this.executeDCA();
      },
      null,
      true
    );
  }
  async onStop() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
  }
  async onTick() {
    await this.updatePositions();
  }
  /**
   * Execute DCA buy
   */
  async executeDCA() {
    if (this.status !== "running") return;
    this.logger.info("Executing DCA buy...");
    try {
      let amount = new Decimal6(this.dcaConfig.strategyParams.amountPerBuy);
      if (this.dcaConfig.strategyParams.randomizeAmount) {
        const variance = 0.1;
        const multiplier = 1 + (Math.random() * 2 - 1) * variance;
        amount = amount.mul(multiplier);
      }
      const trade = await this.executeBuy(this.dcaConfig.strategyParams.targetToken, amount);
      if (trade) {
        this.logger.info(
          `DCA buy executed: ${trade.size} ${this.dcaConfig.strategyParams.targetSymbol} @ ${trade.price}`
        );
      }
    } catch (error) {
      this.logger.error(`DCA execution failed: ${error}`);
      this.emit("error", error);
    }
  }
  async getPrice(token) {
    const price = await this.jupiter.getPrice(token);
    return new Decimal6(price);
  }
  async executeBuy(token, amountUsdc) {
    if (this.mode === "paper") {
      return this.paperBuy(token, amountUsdc);
    }
    return this.realBuy(token, amountUsdc);
  }
  async executeSell(token, amount) {
    if (this.mode === "paper") {
      return this.paperSell(token, amount);
    }
    return this.realSell(token, amount);
  }
  /**
   * Paper trading buy
   */
  async paperBuy(token, amountUsdc) {
    const price = await this.getPrice(token);
    const size = amountUsdc.div(price);
    const trade = {
      id: `trade-${Date.now()}`,
      botId: this.id,
      positionId: "",
      side: "buy",
      token,
      symbol: this.dcaConfig.strategyParams.targetSymbol,
      size,
      price,
      valueUsd: amountUsdc,
      fee: amountUsdc.mul(3e-3),
      slippage: 0.1,
      txSignature: `paper-${Date.now()}`,
      executedAt: Date.now()
    };
    this.emit("trade", trade);
    return trade;
  }
  /**
   * Paper trading sell
   */
  async paperSell(token, amount) {
    const price = await this.getPrice(token);
    const valueUsd = amount.mul(price);
    const trade = {
      id: `trade-${Date.now()}`,
      botId: this.id,
      positionId: "",
      side: "sell",
      token,
      symbol: this.dcaConfig.strategyParams.targetSymbol,
      size: amount,
      price,
      valueUsd,
      fee: valueUsd.mul(3e-3),
      slippage: 0.1,
      txSignature: `paper-${Date.now()}`,
      executedAt: Date.now()
    };
    this.emit("trade", trade);
    return trade;
  }
  /**
   * Real buy via Jupiter
   */
  async realBuy(token, amountUsdc) {
    try {
      const result = await this.jupiter.swap({
        inputMint: USDC_MINT.toBase58(),
        outputMint: token,
        amount: amountUsdc.mul(1e6).toNumber(),
        slippageBps: this.config.slippageTolerance * 100,
        wallet: this.keypair
      });
      const trade = {
        id: `trade-${Date.now()}`,
        botId: this.id,
        positionId: "",
        side: "buy",
        token,
        symbol: this.dcaConfig.strategyParams.targetSymbol,
        size: new Decimal6(result.outputAmount),
        price: new Decimal6(result.price),
        valueUsd: amountUsdc,
        fee: new Decimal6(result.fee || 0),
        slippage: result.slippage || 0,
        txSignature: result.txSignature,
        executedAt: Date.now()
      };
      this.emit("trade", trade);
      return trade;
    } catch (error) {
      this.logger.error(`Real buy failed: ${error}`);
      return null;
    }
  }
  /**
   * Real sell via Jupiter
   */
  async realSell(token, amount) {
    try {
      const result = await this.jupiter.swap({
        inputMint: token,
        outputMint: USDC_MINT.toBase58(),
        amount: amount.mul(10 ** SOL_DECIMALS).toNumber(),
        slippageBps: this.config.slippageTolerance * 100,
        wallet: this.keypair
      });
      const trade = {
        id: `trade-${Date.now()}`,
        botId: this.id,
        positionId: "",
        side: "sell",
        token,
        symbol: this.dcaConfig.strategyParams.targetSymbol,
        size: amount,
        price: new Decimal6(result.price),
        valueUsd: new Decimal6(result.outputAmount).div(1e6),
        fee: new Decimal6(result.fee || 0),
        slippage: result.slippage || 0,
        txSignature: result.txSignature,
        executedAt: Date.now()
      };
      this.emit("trade", trade);
      return trade;
    } catch (error) {
      this.logger.error(`Real sell failed: ${error}`);
      return null;
    }
  }
  /**
   * Manually trigger DCA (for testing)
   */
  async triggerDCA() {
    await this.executeDCA();
  }
};
function createSOLDCABot(connection, keypair, amountPerBuy = 10, schedule = "0 */4 * * *", mode = "paper") {
  const config = {
    allocatedCapital: new Decimal6(1e3),
    maxPositionSize: new Decimal6(100),
    pairs: ["SOL/USDC"],
    slippageTolerance: 0.5,
    priorityFee: 1e4,
    strategyParams: {
      targetToken: SOL_MINT.toBase58(),
      targetSymbol: "SOL",
      amountPerBuy,
      schedule,
      closeOnStop: false,
      randomizeAmount: true,
      randomizeTime: false
    }
  };
  const riskParams = {
    maxPositionPercent: 100,
    maxTotalExposure: 100,
    stopLossPercent: 0,
    dailyLossLimit: new Decimal6(0),
    weeklyLossLimit: new Decimal6(0),
    maxDrawdownPercent: 0,
    cooldownAfterLoss: 0
  };
  return new DCABot(connection, keypair, config, riskParams, mode);
}

// src/trading/dual-engine.ts
var DualTradingEngine = class extends EventEmitter2 {
  logger;
  connection;
  keypair;
  config;
  paperBot = null;
  microBot = null;
  paperTrades = [];
  microTrades = [];
  dailyMicroSpent = new Decimal7(0);
  dailyResetTime = Date.now();
  isRunning = false;
  constructor(connection, keypair, config = {}) {
    super();
    this.logger = new Logger("DualEngine");
    this.connection = connection;
    this.keypair = keypair;
    this.config = {
      paperBalance: config.paperBalance ?? parseFloat(process.env.PAPER_BALANCE || "1000"),
      paperAmountPerTrade: config.paperAmountPerTrade ?? 50,
      // $50 paper trades
      microAmountPerTrade: config.microAmountPerTrade ?? parseFloat(process.env.MICRO_AMOUNT || "5"),
      maxDailyMicro: config.maxDailyMicro ?? parseFloat(process.env.MAX_DAILY_MICRO || "20"),
      schedule: config.schedule ?? "0 */4 * * *",
      // Every 4 hours
      targetToken: config.targetToken ?? "So11111111111111111111111111111111111111112",
      targetSymbol: config.targetSymbol ?? "SOL"
    };
    this.logger.info(`Dual Engine Config:`);
    this.logger.info(`  Paper Balance: $${this.config.paperBalance}`);
    this.logger.info(`  Paper per Trade: $${this.config.paperAmountPerTrade}`);
    this.logger.info(`  Micro per Trade: $${this.config.microAmountPerTrade}`);
    this.logger.info(`  Max Daily Micro: $${this.config.maxDailyMicro}`);
    this.logger.info(`  Schedule: ${this.config.schedule}`);
  }
  /**
   * Start both paper and micro bots
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn("Dual Engine already running");
      return;
    }
    this.logger.info("Starting Dual Trading Engine...");
    this.paperBot = createSOLDCABot(
      this.connection,
      this.keypair,
      this.config.paperAmountPerTrade,
      this.config.schedule,
      "paper"
    );
    this.paperBot.on("trade", (trade) => {
      this.handlePaperTrade(trade);
    });
    this.paperBot.on("error", (error) => {
      this.logger.error(`Paper bot error: ${error.message}`);
    });
    this.microBot = createSOLDCABot(
      this.connection,
      this.keypair,
      this.config.microAmountPerTrade,
      this.config.schedule,
      "micro"
    );
    this.microBot.on("trade", (trade) => {
      this.handleMicroTrade(trade);
    });
    this.microBot.on("error", (error) => {
      this.logger.error(`Micro bot error: ${error.message}`);
    });
    await this.paperBot.start();
    this.logger.info("Paper bot started ($" + this.config.paperBalance + " virtual)");
    await this.microBot.start();
    this.logger.info("Micro bot started ($" + this.config.microAmountPerTrade + " per trade)");
    this.isRunning = true;
    this.scheduleDailyReset();
    this.logger.info("Dual Trading Engine is LIVE");
  }
  /**
   * Stop both bots
   */
  async stop() {
    if (!this.isRunning) return;
    this.logger.info("Stopping Dual Trading Engine...");
    if (this.paperBot) {
      await this.paperBot.stop();
    }
    if (this.microBot) {
      await this.microBot.stop();
    }
    this.isRunning = false;
    this.logger.info("Dual Trading Engine stopped");
  }
  /**
   * Handle paper trade
   */
  handlePaperTrade(trade) {
    this.paperTrades.push(trade);
    this.emit("trade", trade, "paper");
    this.logger.info(
      `[PAPER] ${trade.side.toUpperCase()} ${trade.size} ${trade.symbol} @ $${trade.price} (value: $${trade.valueUsd})`
    );
  }
  /**
   * Handle micro trade with daily limit check
   */
  handleMicroTrade(trade) {
    this.resetDailyIfNeeded();
    if (this.dailyMicroSpent.add(trade.valueUsd).gt(this.config.maxDailyMicro)) {
      this.logger.warn(
        `[MICRO] Daily limit reached ($${this.dailyMicroSpent}/$${this.config.maxDailyMicro}). Trade skipped.`
      );
      return;
    }
    this.dailyMicroSpent = this.dailyMicroSpent.add(trade.valueUsd);
    this.microTrades.push(trade);
    this.emit("trade", trade, "micro");
    this.logger.info(
      `[MICRO] ${trade.side.toUpperCase()} ${trade.size} ${trade.symbol} @ $${trade.price} (value: $${trade.valueUsd})`
    );
    this.logger.info(`[MICRO] Daily spent: $${this.dailyMicroSpent}/$${this.config.maxDailyMicro}`);
  }
  /**
   * Reset daily counter if new day
   */
  resetDailyIfNeeded() {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1e3;
    if (now - this.dailyResetTime >= msInDay) {
      this.dailyMicroSpent = new Decimal7(0);
      this.dailyResetTime = now;
      this.logger.info("Daily micro limit reset");
    }
  }
  /**
   * Schedule daily reset
   */
  scheduleDailyReset() {
    const msInDay = 24 * 60 * 60 * 1e3;
    setInterval(() => {
      this.dailyMicroSpent = new Decimal7(0);
      this.dailyResetTime = Date.now();
      this.logger.info("Daily micro limit reset (scheduled)");
    }, msInDay);
  }
  /**
   * Get combined performance metrics
   */
  getPerformance() {
    const paperPerf = this.calculatePerformance(this.paperTrades, this.config.paperBalance);
    const microPerf = this.calculatePerformance(this.microTrades, 0);
    const paperPnlPercent = paperPerf.pnlPercent;
    const microPnlPercent = microPerf.pnlPercent;
    const diff = paperPnlPercent - microPnlPercent;
    let recommendation = "insufficient_data";
    let confidence = 0;
    const totalTrades = paperPerf.trades + microPerf.trades;
    if (totalTrades >= 10) {
      confidence = Math.min(100, totalTrades * 5);
      if (Math.abs(diff) < 1) {
        recommendation = "scale_micro";
      } else if (diff > 5) {
        recommendation = "keep_paper";
      } else if (diff < -5) {
        recommendation = "scale_micro";
      } else {
        recommendation = "adjust_strategy";
      }
    }
    return {
      paper: {
        balance: new Decimal7(this.config.paperBalance).add(paperPerf.pnl),
        startBalance: new Decimal7(this.config.paperBalance),
        trades: paperPerf.trades,
        pnl: paperPerf.pnl,
        pnlPercent: paperPerf.pnlPercent,
        winRate: paperPerf.winRate,
        avgTradeSize: paperPerf.avgTradeSize,
        lastTrade: this.paperTrades[this.paperTrades.length - 1]
      },
      micro: {
        spent: microPerf.totalSpent,
        dailySpent: this.dailyMicroSpent,
        trades: microPerf.trades,
        pnl: microPerf.pnl,
        pnlPercent: microPerf.pnlPercent,
        winRate: microPerf.winRate,
        avgTradeSize: microPerf.avgTradeSize,
        lastTrade: this.microTrades[this.microTrades.length - 1]
      },
      comparison: {
        paperBetterBy: diff,
        recommendation,
        confidence
      }
    };
  }
  /**
   * Calculate performance metrics from trades
   */
  calculatePerformance(trades, startBalance) {
    if (trades.length === 0) {
      return {
        trades: 0,
        pnl: new Decimal7(0),
        pnlPercent: 0,
        winRate: 0,
        avgTradeSize: new Decimal7(0),
        totalSpent: new Decimal7(0)
      };
    }
    let totalSpent = new Decimal7(0);
    let totalReceived = new Decimal7(0);
    let wins = 0;
    for (const trade of trades) {
      if (trade.side === "buy") {
        totalSpent = totalSpent.add(trade.valueUsd);
      } else {
        totalReceived = totalReceived.add(trade.valueUsd);
      }
      if (trade.realizedPnL && trade.realizedPnL.gt(0)) {
        wins++;
      }
    }
    const pnl = totalReceived.sub(totalSpent);
    const base = startBalance > 0 ? startBalance : totalSpent.toNumber();
    const pnlPercent = base > 0 ? pnl.div(base).mul(100).toNumber() : 0;
    return {
      trades: trades.length,
      pnl,
      pnlPercent,
      winRate: trades.length > 0 ? wins / trades.length * 100 : 0,
      avgTradeSize: totalSpent.div(Math.max(1, trades.length)),
      totalSpent
    };
  }
  /**
   * Manually trigger both DCA bots (for testing)
   */
  async triggerDCA() {
    this.logger.info("Manually triggering DCA for both bots...");
    if (this.paperBot) {
      await this.paperBot.triggerDCA();
    }
    if (this.microBot) {
      this.resetDailyIfNeeded();
      if (this.dailyMicroSpent.lt(this.config.maxDailyMicro)) {
        await this.microBot.triggerDCA();
      } else {
        this.logger.warn("Micro bot skipped - daily limit reached");
      }
    }
  }
  /**
   * Print performance comparison
   */
  printPerformance() {
    const perf = this.getPerformance();
    console.log("\n\u{1F4CA} Dual Trading Engine Performance");
    console.log("\u2550".repeat(60));
    console.log("\n\u{1F4C4} PAPER TRADING ($" + perf.paper.startBalance + " virtual)");
    console.log(`   Balance: $${perf.paper.balance.toFixed(2)}`);
    console.log(`   P&L: $${perf.paper.pnl.toFixed(2)} (${perf.paper.pnlPercent.toFixed(2)}%)`);
    console.log(`   Trades: ${perf.paper.trades}`);
    console.log(`   Win Rate: ${perf.paper.winRate.toFixed(1)}%`);
    console.log(`   Avg Trade: $${perf.paper.avgTradeSize.toFixed(2)}`);
    console.log("\n\u{1F4B5} MICRO TRADING (Real $)");
    console.log(`   Total Spent: $${perf.micro.spent.toFixed(2)}`);
    console.log(`   Today Spent: $${perf.micro.dailySpent.toFixed(2)}/$${this.config.maxDailyMicro}`);
    console.log(`   P&L: $${perf.micro.pnl.toFixed(2)} (${perf.micro.pnlPercent.toFixed(2)}%)`);
    console.log(`   Trades: ${perf.micro.trades}`);
    console.log(`   Win Rate: ${perf.micro.winRate.toFixed(1)}%`);
    console.log(`   Avg Trade: $${perf.micro.avgTradeSize.toFixed(2)}`);
    console.log("\n\u{1F4C8} COMPARISON");
    console.log(`   Paper better by: ${perf.comparison.paperBetterBy.toFixed(2)}%`);
    console.log(`   Recommendation: ${perf.comparison.recommendation.toUpperCase()}`);
    console.log(`   Confidence: ${perf.comparison.confidence}%`);
    console.log("\u2550".repeat(60) + "\n");
  }
  /**
   * Is engine running
   */
  isEngineRunning() {
    return this.isRunning;
  }
  /**
   * Get trade history
   */
  getTradeHistory() {
    return {
      paper: [...this.paperTrades],
      micro: [...this.microTrades]
    };
  }
};

// src/engine.ts
var MOCK_RPC = "https://api.devnet.solana.com";
var MoneyEngine = class extends EventEmitter3 {
  config;
  logger;
  connection;
  keypair;
  treasury;
  expenses;
  tradingEngine = null;
  constructor(config = {}) {
    super();
    this.logger = new Logger("MoneyEngine");
    this.config = {
      rpcUrl: config.rpcUrl || process.env.SOLANA_RPC_URL || MOCK_RPC,
      tradingMode: config.tradingMode || "paper",
      enableTrading: config.enableTrading ?? true,
      dcaAmountPerBuy: config.dcaAmountPerBuy || 10,
      dcaSchedule: config.dcaSchedule || "0 */4 * * *",
      autoPayExpenses: config.autoPayExpenses ?? false
    };
    this.connection = new Connection(this.config.rpcUrl, "confirmed");
    this.keypair = Keypair.generate();
    if (process.env.GICM_PRIVATE_KEY) {
      try {
      } catch (e) {
        this.logger.error("Failed to load private key, using random keypair");
      }
    }
    this.treasury = new TreasuryManager({
      mainWallet: this.keypair.publicKey.toBase58()
    });
    this.expenses = new ExpenseTracker();
    if (this.config.enableTrading) {
      this.initializeTrading();
    }
  }
  initializeTrading() {
    this.tradingEngine = new DualTradingEngine(this.connection, this.keypair, {
      schedule: this.config.dcaSchedule,
      paperAmountPerTrade: this.config.dcaAmountPerBuy
    });
    this.tradingEngine.on("trade", (trade, mode) => {
      this.logger.info(`[${mode.toUpperCase()}] Trade executed: ${trade.symbol}`);
      this.emit("trade", trade);
    });
    this.tradingEngine.on("error", (error) => {
      this.logger.error(`Trading error: ${error.message}`);
      this.emit("alert", `Trading Error: ${error.message}`);
    });
  }
  /**
   * Start the engine
   */
  async start() {
    this.logger.info("Starting Money Engine...");
    if (this.tradingEngine) {
      await this.tradingEngine.start();
    }
    this.logger.info("Money Engine started");
  }
  /**
   * Stop the engine
   */
  async stop() {
    this.logger.info("Stopping Money Engine...");
    if (this.tradingEngine) {
      await this.tradingEngine.stop();
    }
    this.logger.info("Money Engine stopped");
  }
  /**
   * Get overall status
   */
  async getStatus() {
    const treasuryStatus = this.treasury.getStatus();
    let tradingPerf = null;
    if (this.tradingEngine) {
      tradingPerf = this.tradingEngine.getPerformance();
    }
    const runway = 12;
    return {
      treasury: treasuryStatus,
      trading: {
        active: !!this.tradingEngine?.isEngineRunning(),
        performance: tradingPerf
      },
      health: {
        runway
      }
    };
  }
  // Helper accessors
  getTreasury() {
    return this.treasury;
  }
  getTradingEngine() {
    return this.tradingEngine;
  }
};

export {
  Logger,
  TreasuryManager,
  ExpenseTracker,
  MoneyEngine
};
