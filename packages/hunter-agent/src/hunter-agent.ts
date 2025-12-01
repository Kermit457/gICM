import { BaseAgent } from "@gicm/agent-core";
import type { AgentConfig, AgentContext, AgentResult } from "@gicm/agent-core";
import { CronJob } from "cron";
import {
  type BaseHunterSource,
  DEFAULT_SCHEDULES,
  type HunterConfig,
  type HuntDiscovery,
  type HuntSource,
} from "./types.js";
import {
  TokenScanner,
  type TokenAnalysis,
  type ScanOptions,
  type TokenScannerConfig,
} from "./scanner/index.js";
// Social/Tech Sources
import { GitHubHunter } from "./sources/github-hunter.js";
import { HackerNewsHunter } from "./sources/hackernews-hunter.js";
import { TwitterHunter } from "./sources/twitter-hunter.js";
import { RedditHunter } from "./sources/reddit-hunter.js";
import { ProductHuntHunter } from "./sources/producthunt-hunter.js";
import { ArxivHunter } from "./sources/arxiv-hunter.js";
import { LobstersHunter } from "./sources/lobsters-hunter.js";
import { DevToHunter } from "./sources/devto-hunter.js";
import { TikTokHunter } from "./sources/tiktok-hunter.js";
// DeFi/Crypto Sources
import { DeFiLlamaHunter } from "./sources/defillama-hunter.js";
import { GeckoTerminalHunter } from "./sources/geckoterminal-hunter.js";
import { FearGreedHunter } from "./sources/feargreed-hunter.js";
import { BinanceHunter } from "./sources/binance-hunter.js";
// Economic/Financial Sources
import { FREDHunter } from "./sources/fred-hunter.js";
import { SECHunter } from "./sources/sec-hunter.js";
import { FinnhubHunter } from "./sources/finnhub-hunter.js";
// Alternative Sources
import { NPMHunter } from "./sources/npm-hunter.js";

export interface HunterAgentConfig extends AgentConfig {
  sources: HunterConfig[];
  deduplicationTTL?: number; // ms
  onDiscovery?: (discoveries: HuntDiscovery[]) => Promise<void>;
  // Token scanner config
  scanner?: TokenScannerConfig;
}

export class HunterAgent extends BaseAgent {
  private hunters: Map<HuntSource, BaseHunterSource> = new Map();
  private jobs: Map<HuntSource, CronJob> = new Map();
  private seen: Map<string, number> = new Map(); // fingerprint -> timestamp
  private deduplicationTTL: number;
  private onDiscovery?: (discoveries: HuntDiscovery[]) => Promise<void>;
  private isRunning = false;
  private scanner: TokenScanner;

  constructor(config: HunterAgentConfig) {
    super("hunter", config);
    this.deduplicationTTL = config.deduplicationTTL ?? 7 * 24 * 60 * 60 * 1000; // 7 days
    this.onDiscovery = config.onDiscovery;

    // Initialize hunters
    for (const sourceConfig of config.sources) {
      if (!sourceConfig.enabled) continue;

      const hunter = this.createHunter(sourceConfig);
      if (hunter) {
        this.hunters.set(sourceConfig.source, hunter);
      }
    }

    // Initialize token scanner
    this.scanner = new TokenScanner(config.scanner || {
      vybeApiKey: process.env.VYBE_API_KEY,
    });
  }

  getSystemPrompt(): string {
    return `You are a tech discovery and alpha-hunting agent for gICM.
Your role is to find valuable opportunities from multiple sources
that are relevant to Web3, AI, trading, and developer tooling.

You hunt from:
SOCIAL/TECH:
- GitHub: Trending repos in crypto/AI
- HackerNews: Tech posts and Show HN launches
- Twitter: Crypto/AI discussions
- Reddit: r/programming, r/MachineLearning, r/cryptocurrency, r/solana
- ProductHunt: New product launches
- ArXiv: AI/ML research papers
- Lobste.rs: High-signal tech discussions
- Dev.to: Developer tutorials and tools
- TikTok: Viral crypto/tech content

DEFI/CRYPTO:
- DeFiLlama: TVL changes, yield opportunities, protocol metrics
- GeckoTerminal: New pool launches, trending pairs across chains
- Fear & Greed Index: Market sentiment for contrarian signals
- Binance: Price moves, volume anomalies on major pairs

ECONOMIC/FINANCIAL:
- FRED: Federal Reserve data (rates, inflation, employment)
- SEC EDGAR: Insider trades, 13-F institutional holdings
- Finnhub: Congressional trades, earnings surprises

ALTERNATIVE:
- npm: Package download trends for tech adoption signals

SIX THINKING HATS ANALYSIS:
When evaluating discoveries, analyze from 6 perspectives:
🎩 WHITE (Facts): What are the objective metrics and data points?
🎩 RED (Emotions): What's the gut feeling? Is there hype or fear?
🎩 BLACK (Risks): What could go wrong? Rug risk? Technical issues?
🎩 YELLOW (Benefits): What's the upside potential? Alpha opportunity?
🎩 GREEN (Creativity): What novel approaches or use cases exist?
🎩 BLUE (Process): What's the action plan? Entry/exit strategy?

You evaluate discoveries based on:
- Relevance to gICM (Web3/AI/trading focus)
- Quality signals (stars, engagement, volume, TVL)
- Recency and momentum
- Alpha potential (congressional trades, insider buys, new pools)
- Six Hats multi-perspective analysis`;
  }

  async analyze(context: AgentContext): Promise<AgentResult> {
    const action = context.action ?? "hunt";

    switch (action) {
      case "hunt":
        return this.performHunt(context.params?.sources as HuntSource[] | undefined);

      case "status":
        return this.getStatus();

      default:
        return this.createResult(false, null, `Unknown action: ${action}`);
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log("Hunter agent already running");
      return;
    }

    this.isRunning = true;
    this.log("Starting hunter agent");

    // Schedule jobs for each hunter
    for (const [source, hunter] of this.hunters) {
      const schedule = this.getSchedule(source);

      const job = new CronJob(schedule, async () => {
        this.log(`Running scheduled hunt for ${source}`);
        await this.huntSource(source, hunter);
      });

      job.start();
      this.jobs.set(source, job);
      this.log(`Scheduled ${source} hunter with cron: ${schedule}`);
    }
  }

  async stop(): Promise<void> {
    this.log("Stopping hunter agent");
    this.isRunning = false;

    for (const [source, job] of this.jobs) {
      job.stop();
      this.log(`Stopped ${source} hunter`);
    }

    this.jobs.clear();
  }

  async huntNow(sources?: HuntSource[]): Promise<HuntDiscovery[]> {
    const targetSources = sources ?? Array.from(this.hunters.keys());
    const allDiscoveries: HuntDiscovery[] = [];

    for (const source of targetSources) {
      const hunter = this.hunters.get(source);
      if (!hunter) continue;

      const discoveries = await this.huntSource(source, hunter);
      allDiscoveries.push(...discoveries);
    }

    return allDiscoveries;
  }

  private async performHunt(
    sources?: HuntSource[]
  ): Promise<AgentResult> {
    try {
      const discoveries = await this.huntNow(sources);

      return this.createResult(
        true,
        {
          count: discoveries.length,
          discoveries,
          sources: sources ?? Array.from(this.hunters.keys()),
        },
        undefined,
        0.9,
        `Found ${discoveries.length} new discoveries`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return this.createResult(false, null, message);
    }
  }

  private async huntSource(
    source: HuntSource,
    hunter: BaseHunterSource
  ): Promise<HuntDiscovery[]> {
    try {
      this.log(`Hunting ${source}...`);

      // Fetch raw discoveries
      const rawDiscoveries = await hunter.hunt();
      this.log(`${source}: Found ${rawDiscoveries.length} raw discoveries`);

      // Transform and filter
      const discoveries: HuntDiscovery[] = [];

      for (const raw of rawDiscoveries) {
        const discovery = hunter.transform(raw);

        // Check deduplication
        if (this.hasSeen(discovery.fingerprint)) {
          continue;
        }

        // Mark as seen
        this.markSeen(discovery.fingerprint);
        discoveries.push(discovery);
      }

      this.log(`${source}: ${discoveries.length} new unique discoveries`);

      // Notify callback if provided
      if (this.onDiscovery && discoveries.length > 0) {
        await this.onDiscovery(discoveries);
      }

      return discoveries;
    } catch (error) {
      this.log(`${source} hunt failed: ${error}`);
      return [];
    }
  }

  private getStatus(): AgentResult {
    const status = {
      isRunning: this.isRunning,
      hunters: Array.from(this.hunters.keys()),
      jobs: Array.from(this.jobs.entries()).map(([source, job]) => ({
        source,
        running: job.running,
        nextRun: job.nextDate()?.toISO(),
      })),
      seenCount: this.seen.size,
    };

    return this.createResult(true, status, undefined, 1.0, "Status retrieved");
  }

  private createHunter(config: HunterConfig): BaseHunterSource | null {
    switch (config.source) {
      // Social/Tech Sources
      case "github":
        return new GitHubHunter(config);
      case "hackernews":
        return new HackerNewsHunter(config);
      case "twitter":
        return new TwitterHunter(config);
      case "reddit":
        return new RedditHunter(config);
      case "producthunt":
        return new ProductHuntHunter(config);
      case "arxiv":
        return new ArxivHunter(config);
      case "lobsters":
        return new LobstersHunter(config);
      case "devto":
        return new DevToHunter(config);
      case "tiktok":
        return new TikTokHunter(config);
      // DeFi/Crypto Sources
      case "defillama":
        return new DeFiLlamaHunter(config);
      case "geckoterminal":
        return new GeckoTerminalHunter(config);
      case "feargreed":
        return new FearGreedHunter(config);
      case "binance":
        return new BinanceHunter(config);
      // Economic/Financial Sources
      case "fred":
        return new FREDHunter(config);
      case "sec":
        return new SECHunter(config);
      case "finnhub":
        return new FinnhubHunter(config);
      // Alternative Sources
      case "npm":
        return new NPMHunter(config);
      default:
        this.log(`Unknown source: ${config.source}`);
        return null;
    }
  }

  private getSchedule(source: HuntSource): string {
    const config = this.findSourceConfig(source);
    return config?.schedule ?? DEFAULT_SCHEDULES[source];
  }

  private findSourceConfig(source: HuntSource): HunterConfig | undefined {
    const agentConfig = this.config as HunterAgentConfig;
    return agentConfig.sources.find((s) => s.source === source);
  }

  private hasSeen(fingerprint: string): boolean {
    const timestamp = this.seen.get(fingerprint);
    if (!timestamp) return false;

    // Check if expired
    if (Date.now() - timestamp > this.deduplicationTTL) {
      this.seen.delete(fingerprint);
      return false;
    }

    return true;
  }

  private markSeen(fingerprint: string): void {
    this.seen.set(fingerprint, Date.now());

    // Cleanup old entries periodically
    if (this.seen.size > 10000) {
      this.cleanupSeen();
    }
  }

  private cleanupSeen(): void {
    const now = Date.now();
    for (const [fingerprint, timestamp] of this.seen) {
      if (now - timestamp > this.deduplicationTTL) {
        this.seen.delete(fingerprint);
      }
    }
  }

  // ============================================
  // TOKEN SCANNER METHODS
  // ============================================

  /**
   * Scan a single token by mint address
   * Combines data from RugCheck, Pump.fun, Vybe, and CoinGecko
   */
  async scanToken(mint: string): Promise<TokenAnalysis> {
    this.log(`Scanning token: ${mint}`);
    return this.scanner.scanToken(mint);
  }

  /**
   * Scan new launches from Pump.fun
   * Returns analyzed tokens sorted by overall score
   */
  async scanNewLaunches(options?: Partial<ScanOptions>): Promise<TokenAnalysis[]> {
    this.log(`Scanning new launches with options: ${JSON.stringify(options)}`);
    const results = await this.scanner.scanNewLaunches(options);
    // Sort by overall score descending
    return results.sort((a, b) => b.scores.overall - a.scores.overall);
  }

  /**
   * Scan multiple tokens in batch
   */
  async scanBatch(mints: string[]): Promise<TokenAnalysis[]> {
    this.log(`Batch scanning ${mints.length} tokens`);
    return this.scanner.scanBatch(mints);
  }

  /**
   * Get the underlying token scanner instance
   */
  getScanner(): TokenScanner {
    return this.scanner;
  }
}
