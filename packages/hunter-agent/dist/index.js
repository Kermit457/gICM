import {
  ArxivHunter,
  BinanceHunter,
  DEFAULT_SCHEDULES,
  DeFiLlamaHunter,
  DevToHunter,
  FREDHunter,
  FearGreedHunter,
  FinnhubHunter,
  GeckoTerminalHunter,
  GitHubHunter,
  GitHubRepoSchema,
  HNItemSchema,
  HackerNewsHunter,
  HuntDiscoverySchema,
  HuntSourceSchema,
  LobstersHunter,
  NPMHunter,
  NitterHunter,
  ProductHuntHunter,
  PumpFunHunter,
  RELEVANCE_KEYWORDS,
  RawDiscoverySchema,
  RedditHunter,
  RugCheckHunter,
  SECHunter,
  TikTokHunter,
  TwitterHunter,
  TwitterTweetSchema,
  VybeHunter
} from "./chunk-6Y43THNA.js";

// src/hunter-agent.ts
import { BaseAgent } from "@gicm/agent-core";
import { CronJob } from "cron";

// src/scanner/types.ts
import { z } from "zod";
var RecommendationSchema = z.enum([
  "STRONG_BUY",
  "BUY",
  "HOLD",
  "SELL",
  "AVOID"
]);
var SCORE_WEIGHTS = {
  safety: 0.3,
  fundamentals: 0.25,
  momentum: 0.2,
  onChain: 0.15,
  sentiment: 0.1
};
var RECOMMENDATION_THRESHOLDS = {
  STRONG_BUY: 80,
  BUY: 65,
  HOLD: 45,
  SELL: 25
  // Below 25 = AVOID
};
var ScoresSchema = z.object({
  safety: z.number().min(0).max(100),
  fundamentals: z.number().min(0).max(100),
  momentum: z.number().min(0).max(100),
  onChain: z.number().min(0).max(100),
  sentiment: z.number().min(0).max(100),
  overall: z.number().min(0).max(100)
});
var RugCheckDataSchema = z.object({
  score: z.number().optional(),
  rugged: z.boolean().optional(),
  risks: z.array(z.string()).optional(),
  mintAuthority: z.boolean().optional(),
  freezeAuthority: z.boolean().optional(),
  lpLocked: z.boolean().optional(),
  topHoldersPercent: z.number().optional()
});
var PumpFunDataSchema = z.object({
  mint: z.string(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  description: z.string().optional(),
  imageUri: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  website: z.string().optional(),
  bondingCurveProgress: z.number().optional(),
  marketCap: z.number().optional(),
  complete: z.boolean().optional(),
  raydiumPool: z.string().optional(),
  createdAt: z.date().optional()
});
var VybeDataSchema = z.object({
  holders: z.number().optional(),
  topHolderPercent: z.number().optional(),
  top10Percent: z.number().optional(),
  whaleCount: z.number().optional(),
  concentrationRisk: z.enum(["low", "medium", "high"]).optional(),
  price: z.number().optional(),
  volume24h: z.number().optional()
});
var MarketDataSchema = z.object({
  price: z.number().optional(),
  marketCap: z.number().optional(),
  volume24h: z.number().optional(),
  priceChange24h: z.number().optional(),
  priceChange7d: z.number().optional(),
  liquidity: z.number().optional(),
  fdv: z.number().optional(),
  ath: z.number().optional(),
  athChangePercent: z.number().optional()
});
var SourceDataSchema = z.object({
  rugcheck: RugCheckDataSchema.optional(),
  pumpfun: PumpFunDataSchema.optional(),
  vybe: VybeDataSchema.optional(),
  market: MarketDataSchema.optional()
});
var TokenAnalysisSchema = z.object({
  mint: z.string(),
  symbol: z.string(),
  name: z.string(),
  scores: ScoresSchema,
  risks: z.array(z.string()),
  recommendation: RecommendationSchema,
  confidence: z.number().min(0).max(1),
  sources: SourceDataSchema,
  scannedAt: z.date()
});
var ScanOptionsSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  minProgress: z.number().min(0).max(100).default(10),
  includeNsfw: z.boolean().default(false),
  minSafetyScore: z.number().min(0).max(100).optional()
});

// src/scanner/aggregators.ts
function calculateSafetyScore(rugcheck, vybe) {
  const risks = [];
  let score = 50;
  if (!rugcheck && !vybe) {
    risks.push("No safety data available");
    return { score: 30, risks };
  }
  if (rugcheck?.score !== void 0) {
    score = rugcheck.score;
    if (rugcheck.rugged) {
      risks.push("TOKEN RUGGED");
      return { score: 0, risks };
    }
    if (rugcheck.mintAuthority) {
      score -= 15;
      risks.push("Mint authority enabled");
    }
    if (rugcheck.freezeAuthority) {
      score -= 10;
      risks.push("Freeze authority enabled");
    }
    if (!rugcheck.lpLocked) {
      score -= 10;
      risks.push("Liquidity not locked");
    }
    if (rugcheck.topHoldersPercent && rugcheck.topHoldersPercent > 50) {
      score -= 15;
      risks.push(`Top holders own ${rugcheck.topHoldersPercent.toFixed(1)}%`);
    }
    if (rugcheck.risks) {
      risks.push(...rugcheck.risks);
    }
  }
  if (vybe?.concentrationRisk === "high") {
    score -= 10;
    if (!risks.some((r) => r.includes("holder"))) {
      risks.push("High holder concentration");
    }
  }
  if (vybe?.topHolderPercent && vybe.topHolderPercent > 30) {
    score -= 5;
    if (!risks.some((r) => r.includes("holder"))) {
      risks.push(`Single wallet owns ${vybe.topHolderPercent.toFixed(1)}%`);
    }
  }
  return { score: Math.max(0, Math.min(100, score)), risks };
}
function calculateFundamentalsScore(market, pumpfun) {
  if (!market && !pumpfun) return 40;
  let score = 50;
  const marketCap = market?.marketCap || pumpfun?.marketCap || 0;
  if (marketCap > 1e7) score += 20;
  else if (marketCap > 1e6) score += 15;
  else if (marketCap > 1e5) score += 10;
  else if (marketCap > 1e4) score += 5;
  else score -= 5;
  if (market?.liquidity) {
    if (market.liquidity > 5e5) score += 15;
    else if (market.liquidity > 1e5) score += 10;
    else if (market.liquidity > 1e4) score += 5;
    else score -= 10;
  }
  if (market?.volume24h && marketCap > 0) {
    const volumeRatio = market.volume24h / marketCap;
    if (volumeRatio > 0.1 && volumeRatio < 0.5) score += 10;
    else if (volumeRatio > 0.5) score += 5;
    else score -= 5;
  }
  if (pumpfun?.bondingCurveProgress !== void 0) {
    if (pumpfun.bondingCurveProgress >= 100 || pumpfun.complete) {
      score += 10;
    } else if (pumpfun.bondingCurveProgress > 50) {
      score += 5;
    }
  }
  return Math.max(0, Math.min(100, score));
}
function calculateMomentumScore(market) {
  if (!market) return 50;
  let score = 50;
  const priceChange = market.priceChange24h || 0;
  if (priceChange > 50) score += 25;
  else if (priceChange > 20) score += 15;
  else if (priceChange > 5) score += 10;
  else if (priceChange > 0) score += 5;
  else if (priceChange > -10) score -= 5;
  else if (priceChange > -30) score -= 15;
  else score -= 25;
  if (market.priceChange7d !== void 0) {
    if (market.priceChange7d > 100) score += 10;
    else if (market.priceChange7d > 0) score += 5;
    else if (market.priceChange7d < -50) score -= 10;
  }
  if (market.athChangePercent !== void 0) {
    if (market.athChangePercent > -10) score += 5;
    else if (market.athChangePercent < -90) score -= 10;
  }
  return Math.max(0, Math.min(100, score));
}
function calculateOnChainScore(vybe) {
  if (!vybe) return 50;
  let score = 50;
  if (vybe.holders !== void 0) {
    if (vybe.holders > 1e4) score += 20;
    else if (vybe.holders > 1e3) score += 15;
    else if (vybe.holders > 100) score += 10;
    else if (vybe.holders > 10) score += 5;
    else score -= 10;
  }
  if (vybe.top10Percent !== void 0) {
    if (vybe.top10Percent < 30) score += 15;
    else if (vybe.top10Percent < 50) score += 5;
    else if (vybe.top10Percent > 70) score -= 15;
    else score -= 5;
  }
  if (vybe.whaleCount !== void 0) {
    if (vybe.whaleCount === 0) score += 10;
    else if (vybe.whaleCount <= 2) score += 5;
    else if (vybe.whaleCount > 5) score -= 10;
  }
  return Math.max(0, Math.min(100, score));
}
function calculateSentimentScore(pumpfun) {
  if (!pumpfun) return 50;
  let score = 50;
  if (pumpfun.twitter) score += 15;
  if (pumpfun.telegram) score += 10;
  if (pumpfun.website) score += 10;
  if (pumpfun.description) {
    if (pumpfun.description.length > 100) score += 10;
    else if (pumpfun.description.length > 20) score += 5;
  }
  if (pumpfun.imageUri) score += 5;
  if (!pumpfun.twitter && !pumpfun.telegram && !pumpfun.website) {
    score -= 20;
  }
  return Math.max(0, Math.min(100, score));
}
function calculateOverallScore(scores) {
  const overall = scores.safety * SCORE_WEIGHTS.safety + scores.fundamentals * SCORE_WEIGHTS.fundamentals + scores.momentum * SCORE_WEIGHTS.momentum + scores.onChain * SCORE_WEIGHTS.onChain + scores.sentiment * SCORE_WEIGHTS.sentiment;
  return Math.round(overall * 10) / 10;
}
function getRecommendation(overallScore, risks) {
  const criticalRisks = risks.filter(
    (r) => r.includes("RUGGED") || r.includes("Mint authority") || r.includes("No safety data")
  );
  if (criticalRisks.length > 0 && overallScore < 70) {
    return "AVOID";
  }
  if (overallScore >= RECOMMENDATION_THRESHOLDS.STRONG_BUY) return "STRONG_BUY";
  if (overallScore >= RECOMMENDATION_THRESHOLDS.BUY) return "BUY";
  if (overallScore >= RECOMMENDATION_THRESHOLDS.HOLD) return "HOLD";
  if (overallScore >= RECOMMENDATION_THRESHOLDS.SELL) return "SELL";
  return "AVOID";
}
function calculateConfidence(sources) {
  let available = 0;
  let total = 4;
  if (sources.rugcheck) available++;
  if (sources.pumpfun) available++;
  if (sources.vybe) available++;
  if (sources.market) available++;
  const dataConfidence = available / total;
  return Math.max(0.3, dataConfidence);
}

// src/scanner/index.ts
var DEFAULT_CONFIG = {
  enableRugCheck: true,
  enablePumpFun: true,
  enableVybe: true,
  enableMarketData: true,
  timeout: 3e4
};
var TokenScanner = class {
  config;
  rugcheck;
  pumpfun;
  vybe;
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rugcheck = new RugCheckHunter({
      source: "rugcheck",
      enabled: this.config.enableRugCheck ?? true
    });
    this.pumpfun = new PumpFunHunter({
      source: "pumpfun",
      enabled: this.config.enablePumpFun ?? true
    });
    this.vybe = new VybeHunter({
      source: "vybe",
      enabled: this.config.enableVybe ?? true,
      apiKey: this.config.vybeApiKey
    });
  }
  /**
   * Scan a single token by mint address
   */
  async scanToken(mint) {
    const [rugcheckData, pumpfunData, vybeData] = await Promise.all([
      this.fetchRugCheckData(mint),
      this.fetchPumpFunData(mint),
      this.fetchVybeData(mint)
    ]);
    const marketData = this.buildMarketData(pumpfunData, vybeData);
    return this.analyzeToken(mint, {
      rugcheck: rugcheckData,
      pumpfun: pumpfunData,
      vybe: vybeData,
      market: marketData
    });
  }
  /**
   * Scan new launches from Pump.fun
   */
  async scanNewLaunches(options) {
    const opts = ScanOptionsSchema.parse(options || {});
    const coins = await this.pumpfun.fetchNewCoins(opts.limit * 2);
    const filtered = coins.filter((coin) => {
      const progress = this.calculateBondingProgress(coin);
      return progress >= opts.minProgress;
    });
    const analyses = [];
    for (const coin of filtered.slice(0, opts.limit)) {
      try {
        const analysis = await this.scanToken(coin.mint);
        if (opts.minSafetyScore && analysis.scores.safety < opts.minSafetyScore) {
          continue;
        }
        analyses.push(analysis);
      } catch (error) {
        console.warn(`[TokenScanner] Failed to scan ${coin.mint}:`, error);
      }
    }
    return analyses;
  }
  /**
   * Scan multiple tokens in batch
   */
  async scanBatch(mints) {
    const results = [];
    const batchSize = 5;
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(
          (mint) => this.scanToken(mint).catch((err) => {
            console.warn(`[TokenScanner] Failed to scan ${mint}:`, err);
            return null;
          })
        )
      );
      results.push(
        ...batchResults.filter((r) => r !== null)
      );
      if (i + batchSize < mints.length) {
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
    }
    return results;
  }
  /**
   * Calculate bonding curve progress for PumpFun coins
   */
  calculateBondingProgress(coin) {
    if (coin.complete) return 100;
    const targetSol = 85;
    const currentSol = (coin.virtual_sol_reserves || 0) / 1e9;
    return Math.min(100, currentSol / targetSol * 100);
  }
  /**
   * Build market data from available sources
   */
  buildMarketData(pumpfun, vybe) {
    if (!pumpfun && !vybe) return void 0;
    return {
      price: vybe?.price,
      marketCap: pumpfun?.marketCap,
      volume24h: vybe?.volume24h,
      priceChange24h: void 0,
      priceChange7d: void 0,
      liquidity: void 0,
      fdv: void 0,
      ath: void 0,
      athChangePercent: void 0
    };
  }
  /**
   * Analyze token data and compute scores
   */
  analyzeToken(mint, sources) {
    const { score: safetyScore, risks } = calculateSafetyScore(
      sources.rugcheck,
      sources.vybe
    );
    const fundamentalsScore = calculateFundamentalsScore(
      sources.market,
      sources.pumpfun
    );
    const momentumScore = calculateMomentumScore(sources.market);
    const onChainScore = calculateOnChainScore(sources.vybe);
    const sentimentScore = calculateSentimentScore(sources.pumpfun);
    const partialScores = {
      safety: safetyScore,
      fundamentals: fundamentalsScore,
      momentum: momentumScore,
      onChain: onChainScore,
      sentiment: sentimentScore
    };
    const overallScore = calculateOverallScore(partialScores);
    const recommendation = getRecommendation(overallScore, risks);
    const confidence = calculateConfidence(sources);
    const symbol = sources.pumpfun?.symbol || "UNKNOWN";
    const name = sources.pumpfun?.name || symbol;
    return {
      mint,
      symbol,
      name,
      scores: {
        ...partialScores,
        overall: overallScore
      },
      risks,
      recommendation,
      confidence,
      sources: {
        rugcheck: sources.rugcheck,
        pumpfun: sources.pumpfun,
        vybe: sources.vybe,
        market: sources.market
      },
      scannedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Fetch RugCheck safety data
   */
  async fetchRugCheckData(mint) {
    if (!this.config.enableRugCheck) return void 0;
    try {
      const summary = await this.rugcheck.getTokenSummary(mint);
      if (!summary) return void 0;
      const report = await this.rugcheck.getTokenReport(mint);
      const hasMintAuthority = !!report?.token?.mintAuthority;
      const hasFreezeAuthority = !!report?.token?.freezeAuthority;
      let topHoldersPercent;
      if (report?.topHolders && report.topHolders.length > 0) {
        topHoldersPercent = report.topHolders.slice(0, 10).reduce((sum, h) => sum + (h.pct || 0), 0);
      }
      return {
        score: summary.score,
        rugged: summary.rugged,
        risks: report?.risks?.map((r) => r.name || r.description || "Unknown risk") || [],
        mintAuthority: hasMintAuthority,
        freezeAuthority: hasFreezeAuthority,
        lpLocked: void 0,
        // Not directly available in API
        topHoldersPercent
      };
    } catch (error) {
      console.warn(`[TokenScanner] RugCheck fetch failed for ${mint}:`, error);
      return void 0;
    }
  }
  /**
   * Fetch Pump.fun token data
   */
  async fetchPumpFunData(mint) {
    if (!this.config.enablePumpFun) return void 0;
    try {
      const coin = await this.pumpfun.getCoinDetails(mint);
      if (!coin) return void 0;
      return {
        mint: coin.mint,
        name: coin.name,
        symbol: coin.symbol,
        description: coin.description,
        imageUri: coin.image_uri,
        twitter: coin.twitter,
        telegram: coin.telegram,
        website: coin.website,
        bondingCurveProgress: this.calculateBondingProgress(coin),
        marketCap: coin.usd_market_cap || coin.market_cap,
        complete: coin.complete,
        raydiumPool: coin.raydium_pool,
        createdAt: coin.created_timestamp ? new Date(coin.created_timestamp) : void 0
      };
    } catch (error) {
      console.warn(`[TokenScanner] PumpFun fetch failed for ${mint}:`, error);
      return void 0;
    }
  }
  /**
   * Fetch Vybe on-chain data
   */
  async fetchVybeData(mint) {
    if (!this.config.enableVybe || !this.config.vybeApiKey) return void 0;
    try {
      const [details, concentration] = await Promise.all([
        this.vybe.fetchTokenDetails(mint),
        this.vybe.getConcentrationRisk(mint)
      ]);
      return {
        holders: details?.holders,
        topHolderPercent: concentration.topHolderPercent,
        top10Percent: concentration.top10Percent,
        whaleCount: concentration.whaleCount,
        concentrationRisk: concentration.risk,
        price: details?.price,
        volume24h: details?.volume_24h
      };
    } catch (error) {
      console.warn(`[TokenScanner] Vybe fetch failed for ${mint}:`, error);
      return void 0;
    }
  }
};

// src/hunter-agent.ts
var HunterAgent = class extends BaseAgent {
  hunters = /* @__PURE__ */ new Map();
  jobs = /* @__PURE__ */ new Map();
  seen = /* @__PURE__ */ new Map();
  // fingerprint -> timestamp
  deduplicationTTL;
  onDiscovery;
  isRunning = false;
  scanner;
  constructor(config) {
    super("hunter", config);
    this.deduplicationTTL = config.deduplicationTTL ?? 7 * 24 * 60 * 60 * 1e3;
    this.onDiscovery = config.onDiscovery;
    for (const sourceConfig of config.sources) {
      if (!sourceConfig.enabled) continue;
      const hunter = this.createHunter(sourceConfig);
      if (hunter) {
        this.hunters.set(sourceConfig.source, hunter);
      }
    }
    this.scanner = new TokenScanner(config.scanner || {
      vybeApiKey: process.env.VYBE_API_KEY
    });
  }
  getSystemPrompt() {
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
\u{1F3A9} WHITE (Facts): What are the objective metrics and data points?
\u{1F3A9} RED (Emotions): What's the gut feeling? Is there hype or fear?
\u{1F3A9} BLACK (Risks): What could go wrong? Rug risk? Technical issues?
\u{1F3A9} YELLOW (Benefits): What's the upside potential? Alpha opportunity?
\u{1F3A9} GREEN (Creativity): What novel approaches or use cases exist?
\u{1F3A9} BLUE (Process): What's the action plan? Entry/exit strategy?

You evaluate discoveries based on:
- Relevance to gICM (Web3/AI/trading focus)
- Quality signals (stars, engagement, volume, TVL)
- Recency and momentum
- Alpha potential (congressional trades, insider buys, new pools)
- Six Hats multi-perspective analysis`;
  }
  async analyze(context) {
    const action = context.action ?? "hunt";
    switch (action) {
      case "hunt":
        return this.performHunt(context.params?.sources);
      case "status":
        return this.getStatus();
      default:
        return this.createResult(false, null, `Unknown action: ${action}`);
    }
  }
  async start() {
    if (this.isRunning) {
      this.log("Hunter agent already running");
      return;
    }
    this.isRunning = true;
    this.log("Starting hunter agent");
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
  async stop() {
    this.log("Stopping hunter agent");
    this.isRunning = false;
    for (const [source, job] of this.jobs) {
      job.stop();
      this.log(`Stopped ${source} hunter`);
    }
    this.jobs.clear();
  }
  async huntNow(sources) {
    const targetSources = sources ?? Array.from(this.hunters.keys());
    const allDiscoveries = [];
    for (const source of targetSources) {
      const hunter = this.hunters.get(source);
      if (!hunter) continue;
      const discoveries = await this.huntSource(source, hunter);
      allDiscoveries.push(...discoveries);
    }
    return allDiscoveries;
  }
  async performHunt(sources) {
    try {
      const discoveries = await this.huntNow(sources);
      return this.createResult(
        true,
        {
          count: discoveries.length,
          discoveries,
          sources: sources ?? Array.from(this.hunters.keys())
        },
        void 0,
        0.9,
        `Found ${discoveries.length} new discoveries`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return this.createResult(false, null, message);
    }
  }
  async huntSource(source, hunter) {
    try {
      this.log(`Hunting ${source}...`);
      const rawDiscoveries = await hunter.hunt();
      this.log(`${source}: Found ${rawDiscoveries.length} raw discoveries`);
      const discoveries = [];
      for (const raw of rawDiscoveries) {
        const discovery = hunter.transform(raw);
        if (this.hasSeen(discovery.fingerprint)) {
          continue;
        }
        this.markSeen(discovery.fingerprint);
        discoveries.push(discovery);
      }
      this.log(`${source}: ${discoveries.length} new unique discoveries`);
      if (this.onDiscovery && discoveries.length > 0) {
        await this.onDiscovery(discoveries);
      }
      return discoveries;
    } catch (error) {
      this.log(`${source} hunt failed: ${error}`);
      return [];
    }
  }
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      hunters: Array.from(this.hunters.keys()),
      jobs: Array.from(this.jobs.entries()).map(([source, job]) => ({
        source,
        running: job.running,
        nextRun: job.nextDate()?.toISO()
      })),
      seenCount: this.seen.size
    };
    return this.createResult(true, status, void 0, 1, "Status retrieved");
  }
  createHunter(config) {
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
  getSchedule(source) {
    const config = this.findSourceConfig(source);
    return config?.schedule ?? DEFAULT_SCHEDULES[source];
  }
  findSourceConfig(source) {
    const agentConfig = this.config;
    return agentConfig.sources.find((s) => s.source === source);
  }
  hasSeen(fingerprint) {
    const timestamp = this.seen.get(fingerprint);
    if (!timestamp) return false;
    if (Date.now() - timestamp > this.deduplicationTTL) {
      this.seen.delete(fingerprint);
      return false;
    }
    return true;
  }
  markSeen(fingerprint) {
    this.seen.set(fingerprint, Date.now());
    if (this.seen.size > 1e4) {
      this.cleanupSeen();
    }
  }
  cleanupSeen() {
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
  async scanToken(mint) {
    this.log(`Scanning token: ${mint}`);
    return this.scanner.scanToken(mint);
  }
  /**
   * Scan new launches from Pump.fun
   * Returns analyzed tokens sorted by overall score
   */
  async scanNewLaunches(options) {
    this.log(`Scanning new launches with options: ${JSON.stringify(options)}`);
    const results = await this.scanner.scanNewLaunches(options);
    return results.sort((a, b) => b.scores.overall - a.scores.overall);
  }
  /**
   * Scan multiple tokens in batch
   */
  async scanBatch(mints) {
    this.log(`Batch scanning ${mints.length} tokens`);
    return this.scanner.scanBatch(mints);
  }
  /**
   * Get the underlying token scanner instance
   */
  getScanner() {
    return this.scanner;
  }
};
export {
  ArxivHunter,
  DEFAULT_SCHEDULES,
  DevToHunter,
  GitHubHunter,
  GitHubRepoSchema,
  HNItemSchema,
  HackerNewsHunter,
  HuntDiscoverySchema,
  HuntSourceSchema,
  HunterAgent,
  LobstersHunter,
  NitterHunter,
  ProductHuntHunter,
  RECOMMENDATION_THRESHOLDS,
  RELEVANCE_KEYWORDS,
  RawDiscoverySchema,
  RedditHunter,
  SCORE_WEIGHTS,
  TikTokHunter,
  TokenScanner,
  TwitterHunter,
  TwitterTweetSchema,
  calculateFundamentalsScore,
  calculateMomentumScore,
  calculateOnChainScore,
  calculateOverallScore,
  calculateSafetyScore,
  calculateSentimentScore,
  getRecommendation
};
//# sourceMappingURL=index.js.map