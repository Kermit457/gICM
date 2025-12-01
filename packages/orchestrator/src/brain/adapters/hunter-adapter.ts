/**
 * Hunter Adapter
 *
 * Connects the HunterAgent to the gICM Brain for automated
 * signal processing and trading integration.
 */

import { HunterAgent, type HunterAgentConfig, type HuntDiscovery, type HuntSource } from "@gicm/hunter-agent";
import { SignalProcessor, type SignalBatch, type TradingSignal } from "../signal-processor.js";

// ============================================================================
// TYPES
// ============================================================================

export interface HunterEngineConnection {
  // Discovery
  runHunt: (sources?: HuntSource[]) => Promise<HuntDiscovery[]>;
  getDiscoveries: () => HuntDiscovery[];

  // Signal processing
  processSignals: (discoveries: HuntDiscovery[]) => SignalBatch;
  getActionableSignals: () => TradingSignal[];

  // Status
  getStatus: () => HunterStatus;

  // Control
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export interface HunterStatus {
  isRunning: boolean;
  enabledSources: string[];
  lastHunt: Date | null;
  totalDiscoveries: number;
  totalSignals: number;
  actionableSignals: number;
}

export interface HunterAdapterConfig {
  // Which sources to enable (default: all free sources)
  enabledSources?: HuntSource[];
  // API keys for paid sources
  apiKeys?: {
    github?: string;
    apify?: string;
    fred?: string;
    finnhub?: string;
  };
  // Signal routing
  tradingApiUrl?: string;
  autoSendSignals?: boolean;
}

// ============================================================================
// DEFAULT SOURCES
// ============================================================================

// Free sources that don't need API keys
const FREE_SOURCES: HuntSource[] = [
  "hackernews",
  "lobsters",
  "arxiv",
  "devto",
  "defillama",
  "geckoterminal",
  "feargreed",
  "binance",
  "sec",
  "npm",
];

// Sources that need API keys
const PAID_SOURCES: HuntSource[] = [
  "github",    // Needs GITHUB_TOKEN
  "twitter",   // Needs APIFY_TOKEN
  "tiktok",    // Needs APIFY_TOKEN
  "reddit",    // Public but rate limited
  "fred",      // Needs FRED_API_KEY
  "finnhub",   // Needs FINNHUB_API_KEY
];

// ============================================================================
// HUNTER ADAPTER
// ============================================================================

export class HunterAdapter {
  private agent: HunterAgent | null = null;
  private processor: SignalProcessor;
  private config: HunterAdapterConfig;

  private discoveries: HuntDiscovery[] = [];
  private lastSignalBatch: SignalBatch | null = null;
  private lastHuntTime: Date | null = null;

  constructor(config?: HunterAdapterConfig) {
    this.config = config ?? {};
    this.processor = new SignalProcessor();
  }

  /**
   * Initialize the hunter agent
   */
  async initialize(): Promise<void> {
    const sources = this.buildSourceConfigs();

    this.agent = new HunterAgent({
      name: "gicm-hunter",
      sources,
      deduplicationTTL: 24 * 60 * 60 * 1000, // 24 hours
      onDiscovery: async (discoveries) => {
        // Process discoveries as they come in
        this.discoveries.push(...discoveries);
        console.log(`[HUNTER] Received ${discoveries.length} new discoveries`);
      },
    });

    console.log(`[HUNTER] Initialized with ${sources.length} sources`);
  }

  /**
   * Build source configurations based on available API keys
   */
  private buildSourceConfigs(): HunterAgentConfig["sources"] {
    const configs: HunterAgentConfig["sources"] = [];
    const enabledSources = this.config.enabledSources ?? FREE_SOURCES;

    for (const source of enabledSources) {
      const sourceConfig: HunterAgentConfig["sources"][0] = {
        source,
        enabled: true,
      };

      // Add API keys if available
      switch (source) {
        case "github":
          if (this.config.apiKeys?.github || process.env.GITHUB_TOKEN) {
            sourceConfig.apiKey = this.config.apiKeys?.github ?? process.env.GITHUB_TOKEN;
            configs.push(sourceConfig);
          }
          break;

        case "twitter":
        case "tiktok":
          if (this.config.apiKeys?.apify || process.env.APIFY_TOKEN) {
            sourceConfig.apiToken = this.config.apiKeys?.apify ?? process.env.APIFY_TOKEN;
            configs.push(sourceConfig);
          }
          break;

        case "fred":
          if (this.config.apiKeys?.fred || process.env.FRED_API_KEY) {
            sourceConfig.apiKey = this.config.apiKeys?.fred ?? process.env.FRED_API_KEY;
            configs.push(sourceConfig);
          }
          break;

        case "finnhub":
          if (this.config.apiKeys?.finnhub || process.env.FINNHUB_API_KEY) {
            sourceConfig.apiKey = this.config.apiKeys?.finnhub ?? process.env.FINNHUB_API_KEY;
            configs.push(sourceConfig);
          }
          break;

        default:
          // Free sources - always add
          configs.push(sourceConfig);
      }
    }

    return configs;
  }

  /**
   * Create engine connection for the brain
   */
  createConnection(): HunterEngineConnection {
    return {
      runHunt: async (sources) => this.runHunt(sources),
      getDiscoveries: () => this.discoveries,
      processSignals: (d) => this.processSignals(d),
      getActionableSignals: () => this.getActionableSignals(),
      getStatus: () => this.getStatus(),
      start: () => this.start(),
      stop: () => this.stop(),
    };
  }

  /**
   * Run a hunt across all or specified sources
   */
  async runHunt(sources?: HuntSource[]): Promise<HuntDiscovery[]> {
    if (!this.agent) {
      throw new Error("Hunter not initialized. Call initialize() first.");
    }

    console.log(`[HUNTER] Starting hunt... sources: ${sources?.join(", ") ?? "all"}`);
    const startTime = Date.now();

    const newDiscoveries = await this.agent.huntNow(sources);
    this.discoveries.push(...newDiscoveries);
    this.lastHuntTime = new Date();

    console.log(`[HUNTER] Hunt complete: ${newDiscoveries.length} discoveries in ${Date.now() - startTime}ms`);

    return newDiscoveries;
  }

  /**
   * Process discoveries into trading signals
   */
  processSignals(discoveries: HuntDiscovery[]): SignalBatch {
    console.log(`[HUNTER] Processing ${discoveries.length} discoveries into signals...`);

    this.lastSignalBatch = this.processor.processBatch(discoveries);

    console.log(`[HUNTER] Generated ${this.lastSignalBatch.signals.length} signals`);
    console.log(`[HUNTER] Actionable: ${this.processor.getActionableSignals(this.lastSignalBatch).length}`);

    return this.lastSignalBatch;
  }

  /**
   * Get actionable signals from last batch
   */
  getActionableSignals(): TradingSignal[] {
    if (!this.lastSignalBatch) return [];
    return this.processor.getActionableSignals(this.lastSignalBatch);
  }

  /**
   * Send signals to trading API
   */
  async sendSignalsToTrading(signals: TradingSignal[]): Promise<void> {
    const apiUrl = this.config.tradingApiUrl ?? "http://localhost:4000";

    console.log(`[HUNTER] Sending ${signals.length} signals to trading API...`);

    try {
      const response = await fetch(`${apiUrl}/api/v1/signals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals }),
      });

      if (!response.ok) {
        throw new Error(`Trading API error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[HUNTER] Signals sent: ${result.processed ?? 0} processed`);
    } catch (error) {
      console.error(`[HUNTER] Failed to send signals: ${error}`);
    }
  }

  /**
   * Get current status
   */
  getStatus(): HunterStatus {
    const actionable = this.lastSignalBatch
      ? this.processor.getActionableSignals(this.lastSignalBatch).length
      : 0;

    return {
      isRunning: !!this.agent,
      enabledSources: this.buildSourceConfigs().map((s) => s.source),
      lastHunt: this.lastHuntTime,
      totalDiscoveries: this.discoveries.length,
      totalSignals: this.lastSignalBatch?.signals.length ?? 0,
      actionableSignals: actionable,
    };
  }

  /**
   * Start the hunter agent (scheduled hunting)
   */
  async start(): Promise<void> {
    if (!this.agent) {
      await this.initialize();
    }
    await this.agent!.start();
    console.log("[HUNTER] Started scheduled hunting");
  }

  /**
   * Stop the hunter agent
   */
  async stop(): Promise<void> {
    if (this.agent) {
      await this.agent.stop();
      console.log("[HUNTER] Stopped");
    }
  }

  /**
   * Full hunt and signal cycle
   */
  async runFullCycle(sources?: HuntSource[]): Promise<{
    discoveries: HuntDiscovery[];
    signals: SignalBatch;
    actionable: TradingSignal[];
  }> {
    // 1. Hunt for discoveries
    const discoveries = await this.runHunt(sources);

    // 2. Process into signals
    const signals = this.processSignals(discoveries);

    // 3. Get actionable signals
    const actionable = this.getActionableSignals();

    // 4. Optionally send to trading
    if (this.config.autoSendSignals && actionable.length > 0) {
      await this.sendSignalsToTrading(actionable);
    }

    return { discoveries, signals, actionable };
  }
}

/**
 * Create hunter engine connection for the brain
 */
export function createHunterAdapter(config?: HunterAdapterConfig): HunterAdapter {
  return new HunterAdapter(config);
}
