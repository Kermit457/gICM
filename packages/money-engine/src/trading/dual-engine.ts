/**
 * Dual Trading Engine
 *
 * Runs Paper ($1000 virtual) and Micro ($5 real) trading simultaneously.
 * Compares performance to learn what works before scaling up.
 */

import { Connection, Keypair } from "@solana/web3.js";
import Decimal from "decimal.js";
import { EventEmitter } from "eventemitter3";
import { DCABot, createSOLDCABot } from "./bots/dca.js";
import { Logger } from "../utils/logger.js";
import type { Trade, BotPerformance } from "../core/types.js";

export interface DualEngineConfig {
  // Paper trading config
  paperBalance: number; // Virtual balance (default $1000)
  paperAmountPerTrade: number; // Amount per paper trade

  // Micro trading config
  microAmountPerTrade: number; // Real $ per trade (default $5)
  maxDailyMicro: number; // Max daily spend on micro trades

  // Shared config
  schedule: string; // Cron schedule for DCA
  targetToken: string; // Token to accumulate (default SOL)
  targetSymbol: string; // Symbol (default "SOL")
}

export interface DualPerformance {
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
    paperBetterBy: number; // Paper PnL% - Micro PnL%
    recommendation: "scale_micro" | "keep_paper" | "adjust_strategy" | "insufficient_data";
    confidence: number; // 0-100
  };
}

export interface DualEngineEvents {
  "trade": (trade: Trade, mode: "paper" | "micro") => void;
  "error": (error: Error) => void;
}

export class DualTradingEngine extends EventEmitter<DualEngineEvents> {
  private logger: Logger;
  private connection: Connection;
  private keypair: Keypair;
  private config: DualEngineConfig;

  private paperBot: DCABot | null = null;
  private microBot: DCABot | null = null;

  private paperTrades: Trade[] = [];
  private microTrades: Trade[] = [];
  private dailyMicroSpent: Decimal = new Decimal(0);
  private dailyResetTime: number = Date.now();

  private isRunning: boolean = false;

  constructor(
    connection: Connection,
    keypair: Keypair,
    config: Partial<DualEngineConfig> = {}
  ) {
    super();
    this.logger = new Logger("DualEngine");
    this.connection = connection;
    this.keypair = keypair;

    this.config = {
      paperBalance: config.paperBalance ?? parseFloat(process.env.PAPER_BALANCE || "1000"),
      paperAmountPerTrade: config.paperAmountPerTrade ?? 50, // $50 paper trades
      microAmountPerTrade: config.microAmountPerTrade ?? parseFloat(process.env.MICRO_AMOUNT || "5"),
      maxDailyMicro: config.maxDailyMicro ?? parseFloat(process.env.MAX_DAILY_MICRO || "20"),
      schedule: config.schedule ?? "0 */4 * * *", // Every 4 hours
      targetToken: config.targetToken ?? "So11111111111111111111111111111111111111112",
      targetSymbol: config.targetSymbol ?? "SOL",
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
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("Dual Engine already running");
      return;
    }

    this.logger.info("Starting Dual Trading Engine...");

    // Create Paper Bot
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

    // Create Micro Bot
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

    // Start both bots
    await this.paperBot.start();
    this.logger.info("Paper bot started ($" + this.config.paperBalance + " virtual)");

    await this.microBot.start();
    this.logger.info("Micro bot started ($" + this.config.microAmountPerTrade + " per trade)");

    this.isRunning = true;

    // Set up daily reset
    this.scheduleDailyReset();

    this.logger.info("Dual Trading Engine is LIVE");
  }

  /**
   * Stop both bots
   */
  async stop(): Promise<void> {
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
  private handlePaperTrade(trade: Trade): void {
    this.paperTrades.push(trade);
    this.emit("trade", trade, "paper");
    this.logger.info(
      `[PAPER] ${trade.side.toUpperCase()} ${trade.size} ${trade.symbol} @ $${trade.price} (value: $${trade.valueUsd})`
    );
  }

  /**
   * Handle micro trade with daily limit check
   */
  private handleMicroTrade(trade: Trade): void {
    // Check daily limit
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
  private resetDailyIfNeeded(): void {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;

    if (now - this.dailyResetTime >= msInDay) {
      this.dailyMicroSpent = new Decimal(0);
      this.dailyResetTime = now;
      this.logger.info("Daily micro limit reset");
    }
  }

  /**
   * Schedule daily reset
   */
  private scheduleDailyReset(): void {
    const msInDay = 24 * 60 * 60 * 1000;
    setInterval(() => {
      this.dailyMicroSpent = new Decimal(0);
      this.dailyResetTime = Date.now();
      this.logger.info("Daily micro limit reset (scheduled)");
    }, msInDay);
  }

  /**
   * Get combined performance metrics
   */
  getPerformance(): DualPerformance {
    const paperPerf = this.calculatePerformance(this.paperTrades, this.config.paperBalance);
    const microPerf = this.calculatePerformance(this.microTrades, 0);

    // Calculate comparison
    const paperPnlPercent = paperPerf.pnlPercent;
    const microPnlPercent = microPerf.pnlPercent;
    const diff = paperPnlPercent - microPnlPercent;

    let recommendation: DualPerformance["comparison"]["recommendation"] = "insufficient_data";
    let confidence = 0;

    const totalTrades = paperPerf.trades + microPerf.trades;

    if (totalTrades >= 10) {
      confidence = Math.min(100, totalTrades * 5);

      if (Math.abs(diff) < 1) {
        recommendation = "scale_micro"; // Paper and micro performing similarly
      } else if (diff > 5) {
        recommendation = "keep_paper"; // Paper doing better
      } else if (diff < -5) {
        recommendation = "scale_micro"; // Micro doing better!
      } else {
        recommendation = "adjust_strategy";
      }
    }

    return {
      paper: {
        balance: new Decimal(this.config.paperBalance).add(paperPerf.pnl),
        startBalance: new Decimal(this.config.paperBalance),
        trades: paperPerf.trades,
        pnl: paperPerf.pnl,
        pnlPercent: paperPerf.pnlPercent,
        winRate: paperPerf.winRate,
        avgTradeSize: paperPerf.avgTradeSize,
        lastTrade: this.paperTrades[this.paperTrades.length - 1],
      },
      micro: {
        spent: microPerf.totalSpent,
        dailySpent: this.dailyMicroSpent,
        trades: microPerf.trades,
        pnl: microPerf.pnl,
        pnlPercent: microPerf.pnlPercent,
        winRate: microPerf.winRate,
        avgTradeSize: microPerf.avgTradeSize,
        lastTrade: this.microTrades[this.microTrades.length - 1],
      },
      comparison: {
        paperBetterBy: diff,
        recommendation,
        confidence,
      },
    };
  }

  /**
   * Calculate performance metrics from trades
   */
  private calculatePerformance(trades: Trade[], startBalance: number): {
    trades: number;
    pnl: Decimal;
    pnlPercent: number;
    winRate: number;
    avgTradeSize: Decimal;
    totalSpent: Decimal;
  } {
    if (trades.length === 0) {
      return {
        trades: 0,
        pnl: new Decimal(0),
        pnlPercent: 0,
        winRate: 0,
        avgTradeSize: new Decimal(0),
        totalSpent: new Decimal(0),
      };
    }

    let totalSpent = new Decimal(0);
    let totalReceived = new Decimal(0);
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
      winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
      avgTradeSize: totalSpent.div(Math.max(1, trades.length)),
      totalSpent,
    };
  }

  /**
   * Manually trigger both DCA bots (for testing)
   */
  async triggerDCA(): Promise<void> {
    this.logger.info("Manually triggering DCA for both bots...");

    if (this.paperBot) {
      await this.paperBot.triggerDCA();
    }
    if (this.microBot) {
      // Check daily limit before triggering micro
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
  printPerformance(): void {
    const perf = this.getPerformance();

    console.log("\n📊 Dual Trading Engine Performance");
    console.log("═".repeat(60));

    console.log("\n📄 PAPER TRADING ($" + perf.paper.startBalance + " virtual)");
    console.log(`   Balance: $${perf.paper.balance.toFixed(2)}`);
    console.log(`   P&L: $${perf.paper.pnl.toFixed(2)} (${perf.paper.pnlPercent.toFixed(2)}%)`);
    console.log(`   Trades: ${perf.paper.trades}`);
    console.log(`   Win Rate: ${perf.paper.winRate.toFixed(1)}%`);
    console.log(`   Avg Trade: $${perf.paper.avgTradeSize.toFixed(2)}`);

    console.log("\n💵 MICRO TRADING (Real $)");
    console.log(`   Total Spent: $${perf.micro.spent.toFixed(2)}`);
    console.log(`   Today Spent: $${perf.micro.dailySpent.toFixed(2)}/$${this.config.maxDailyMicro}`);
    console.log(`   P&L: $${perf.micro.pnl.toFixed(2)} (${perf.micro.pnlPercent.toFixed(2)}%)`);
    console.log(`   Trades: ${perf.micro.trades}`);
    console.log(`   Win Rate: ${perf.micro.winRate.toFixed(1)}%`);
    console.log(`   Avg Trade: $${perf.micro.avgTradeSize.toFixed(2)}`);

    console.log("\n📈 COMPARISON");
    console.log(`   Paper better by: ${perf.comparison.paperBetterBy.toFixed(2)}%`);
    console.log(`   Recommendation: ${perf.comparison.recommendation.toUpperCase()}`);
    console.log(`   Confidence: ${perf.comparison.confidence}%`);

    console.log("═".repeat(60) + "\n");
  }

  /**
   * Is engine running
   */
  isEngineRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get trade history
   */
  getTradeHistory(): { paper: Trade[]; micro: Trade[] } {
    return {
      paper: [...this.paperTrades],
      micro: [...this.microTrades],
    };
  }
}
