import { Connection, Keypair } from "@solana/web3.js";
import { EventEmitter } from "eventemitter3";
import { TreasuryManager } from "./treasury/index.js";
import { ExpenseTracker } from "./expenses/index.js";
import { DualTradingEngine } from "./trading/dual-engine.js";
import { Logger } from "./utils/logger.js";
import type { MoneyEngineConfig, FinancialReport, Trade, BotPerformance } from "./core/types.js";
import { SOL_MINT } from "./core/constants.js";

// Basic mocks for initialization if config is missing
const MOCK_RPC = "https://api.devnet.solana.com";

export interface MoneyEngineEvents {
  "trade": (trade: Trade) => void;
  "report": (report: FinancialReport) => void;
  "alert": (message: string) => void;
}

export class MoneyEngine extends EventEmitter<MoneyEngineEvents> {
  private config: MoneyEngineConfig;
  private logger: Logger;
  private connection: Connection;
  private keypair: Keypair;

  private treasury: TreasuryManager;
  private expenses: ExpenseTracker;
  private tradingEngine: DualTradingEngine | null = null;

  constructor(config: Partial<MoneyEngineConfig> = {}) {
    super();
    this.logger = new Logger("MoneyEngine");
    
    // Defaults
    this.config = {
      rpcUrl: config.rpcUrl || process.env.SOLANA_RPC_URL || MOCK_RPC,
      tradingMode: config.tradingMode || "paper",
      enableTrading: config.enableTrading ?? true,
      dcaAmountPerBuy: config.dcaAmountPerBuy || 10,
      dcaSchedule: config.dcaSchedule || "0 */4 * * *",
      autoPayExpenses: config.autoPayExpenses ?? false,
    };

    // Initialize Solana connection
    this.connection = new Connection(this.config.rpcUrl, "confirmed");
    
    // Initialize Keypair (mock or real)
    // In production, this would load from a secure vault or env
    this.keypair = Keypair.generate(); 
    if (process.env.GICM_PRIVATE_KEY) {
        try {
            // Logic to load keypair would go here
            // this.keypair = Keypair.fromSecretKey(...)
        } catch (e) {
            this.logger.error("Failed to load private key, using random keypair");
        }
    }

    // Initialize Components
    this.treasury = new TreasuryManager({
        mainWallet: this.keypair.publicKey.toBase58(),
    });
    this.expenses = new ExpenseTracker();

    if (this.config.enableTrading) {
      this.initializeTrading();
    }
  }

  private initializeTrading(): void {
    this.tradingEngine = new DualTradingEngine(this.connection, this.keypair, {
      schedule: this.config.dcaSchedule,
      paperAmountPerTrade: this.config.dcaAmountPerBuy,
    });

    // Forward events
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
  async start(): Promise<void> {
    this.logger.info("Starting Money Engine...");

    // Update treasury balances?
    // await this.treasury.updateBalances(...);
    
    if (this.tradingEngine) {
      await this.tradingEngine.start();
    }

    this.logger.info("Money Engine started");
  }

  /**
   * Stop the engine
   */
  async stop(): Promise<void> {
    this.logger.info("Stopping Money Engine...");

    if (this.tradingEngine) {
      await this.tradingEngine.stop();
    }
    
    this.logger.info("Money Engine stopped");
  }

  /**
   * Get overall status
   */
  async getStatus(): Promise<{
    treasury: any;
    trading: { active: boolean; performance?: any };
    health: { runway: number };
  }> {
    const treasuryStatus = this.treasury.getStatus();
    
    let tradingPerf = null;
    if (this.tradingEngine) {
        tradingPerf = this.tradingEngine.getPerformance();
    }

    // Calculate runway (mock)
    const runway = 12; // months

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
  getTreasury(): TreasuryManager {
    return this.treasury;
  }

  getTradingEngine(): DualTradingEngine | null {
    return this.tradingEngine;
  }
}
