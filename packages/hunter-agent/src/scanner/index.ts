import {
  type TokenAnalysis,
  type TokenScannerConfig,
  type ScanOptions,
  type RugCheckData,
  type PumpFunData,
  type VybeData,
  type MarketData,
  type Scores,
  ScanOptionsSchema,
} from "./types.js";
import {
  calculateSafetyScore,
  calculateFundamentalsScore,
  calculateMomentumScore,
  calculateOnChainScore,
  calculateSentimentScore,
  calculateOverallScore,
  getRecommendation,
  calculateConfidence,
} from "./aggregators.js";
import { RugCheckHunter } from "../sources/rugcheck-hunter.js";
import { PumpFunHunter } from "../sources/pumpfun-hunter.js";
import { VybeHunter } from "../sources/vybe-hunter.js";

const DEFAULT_CONFIG: TokenScannerConfig = {
  enableRugCheck: true,
  enablePumpFun: true,
  enableVybe: true,
  enableMarketData: true,
  timeout: 30000,
};

export class TokenScanner {
  private config: TokenScannerConfig;
  private rugcheck: RugCheckHunter;
  private pumpfun: PumpFunHunter;
  private vybe: VybeHunter;

  constructor(config: Partial<TokenScannerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize hunters
    this.rugcheck = new RugCheckHunter({
      source: "rugcheck",
      enabled: this.config.enableRugCheck ?? true,
    });

    this.pumpfun = new PumpFunHunter({
      source: "pumpfun",
      enabled: this.config.enablePumpFun ?? true,
    });

    this.vybe = new VybeHunter({
      source: "vybe",
      enabled: this.config.enableVybe ?? true,
      apiKey: this.config.vybeApiKey,
    });
  }

  /**
   * Scan a single token by mint address
   */
  async scanToken(mint: string): Promise<TokenAnalysis> {
    // Fetch data from all sources in parallel
    const [rugcheckData, pumpfunData, vybeData] = await Promise.all([
      this.fetchRugCheckData(mint),
      this.fetchPumpFunData(mint),
      this.fetchVybeData(mint),
    ]);

    // Build market data from available sources
    const marketData = this.buildMarketData(pumpfunData, vybeData);

    return this.analyzeToken(mint, {
      rugcheck: rugcheckData,
      pumpfun: pumpfunData,
      vybe: vybeData,
      market: marketData,
    });
  }

  /**
   * Scan new launches from Pump.fun
   */
  async scanNewLaunches(options?: Partial<ScanOptions>): Promise<TokenAnalysis[]> {
    const opts = ScanOptionsSchema.parse(options || {});

    // Get new coins from Pump.fun
    const coins = await this.pumpfun.fetchNewCoins(opts.limit * 2); // Fetch extra for filtering

    // Filter by progress using inline calculation
    const filtered = coins.filter((coin) => {
      const progress = this.calculateBondingProgress(coin);
      return progress >= opts.minProgress;
    });

    // Analyze each token
    const analyses: TokenAnalysis[] = [];

    for (const coin of filtered.slice(0, opts.limit)) {
      try {
        const analysis = await this.scanToken(coin.mint);

        // Apply safety filter if specified
        if (
          opts.minSafetyScore &&
          analysis.scores.safety < opts.minSafetyScore
        ) {
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
  async scanBatch(mints: string[]): Promise<TokenAnalysis[]> {
    const results: TokenAnalysis[] = [];

    // Process in batches of 5 to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((mint) =>
          this.scanToken(mint).catch((err) => {
            console.warn(`[TokenScanner] Failed to scan ${mint}:`, err);
            return null;
          })
        )
      );

      results.push(
        ...batchResults.filter((r): r is TokenAnalysis => r !== null)
      );

      // Rate limit delay between batches
      if (i + batchSize < mints.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Calculate bonding curve progress for PumpFun coins
   */
  private calculateBondingProgress(coin: { complete?: boolean; virtual_sol_reserves?: number }): number {
    if (coin.complete) return 100;
    const targetSol = 85; // ~85 SOL to complete
    const currentSol = (coin.virtual_sol_reserves || 0) / 1e9;
    return Math.min(100, (currentSol / targetSol) * 100);
  }

  /**
   * Build market data from available sources
   */
  private buildMarketData(
    pumpfun?: PumpFunData,
    vybe?: VybeData
  ): MarketData | undefined {
    if (!pumpfun && !vybe) return undefined;

    return {
      price: vybe?.price,
      marketCap: pumpfun?.marketCap,
      volume24h: vybe?.volume24h,
      priceChange24h: undefined,
      priceChange7d: undefined,
      liquidity: undefined,
      fdv: undefined,
      ath: undefined,
      athChangePercent: undefined,
    };
  }

  /**
   * Analyze token data and compute scores
   */
  private analyzeToken(
    mint: string,
    sources: {
      rugcheck?: RugCheckData;
      pumpfun?: PumpFunData;
      vybe?: VybeData;
      market?: MarketData;
    }
  ): TokenAnalysis {
    // Calculate individual scores
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

    // Calculate overall score
    const partialScores: Omit<Scores, "overall"> = {
      safety: safetyScore,
      fundamentals: fundamentalsScore,
      momentum: momentumScore,
      onChain: onChainScore,
      sentiment: sentimentScore,
    };
    const overallScore = calculateOverallScore(partialScores);

    // Get recommendation
    const recommendation = getRecommendation(overallScore, risks);

    // Calculate confidence
    const confidence = calculateConfidence(sources);

    // Extract token info
    const symbol = sources.pumpfun?.symbol || "UNKNOWN";
    const name = sources.pumpfun?.name || symbol;

    return {
      mint,
      symbol,
      name,
      scores: {
        ...partialScores,
        overall: overallScore,
      },
      risks,
      recommendation,
      confidence,
      sources: {
        rugcheck: sources.rugcheck,
        pumpfun: sources.pumpfun,
        vybe: sources.vybe,
        market: sources.market,
      },
      scannedAt: new Date(),
    };
  }

  /**
   * Fetch RugCheck safety data
   */
  private async fetchRugCheckData(mint: string): Promise<RugCheckData | undefined> {
    if (!this.config.enableRugCheck) return undefined;

    try {
      const summary = await this.rugcheck.getTokenSummary(mint);
      if (!summary) return undefined;

      const report = await this.rugcheck.getTokenReport(mint);

      // Extract data from nested structure
      const hasMintAuthority = !!report?.token?.mintAuthority;
      const hasFreezeAuthority = !!report?.token?.freezeAuthority;

      // Calculate top holders percentage
      let topHoldersPercent: number | undefined;
      if (report?.topHolders && report.topHolders.length > 0) {
        topHoldersPercent = report.topHolders
          .slice(0, 10)
          .reduce((sum, h) => sum + (h.pct || 0), 0);
      }

      return {
        score: summary.score,
        rugged: summary.rugged,
        risks: report?.risks?.map((r) => r.name || r.description || "Unknown risk") || [],
        mintAuthority: hasMintAuthority,
        freezeAuthority: hasFreezeAuthority,
        lpLocked: undefined, // Not directly available in API
        topHoldersPercent,
      };
    } catch (error) {
      console.warn(`[TokenScanner] RugCheck fetch failed for ${mint}:`, error);
      return undefined;
    }
  }

  /**
   * Fetch Pump.fun token data
   */
  private async fetchPumpFunData(mint: string): Promise<PumpFunData | undefined> {
    if (!this.config.enablePumpFun) return undefined;

    try {
      const coin = await this.pumpfun.getCoinDetails(mint);
      if (!coin) return undefined;

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
        createdAt: coin.created_timestamp
          ? new Date(coin.created_timestamp)
          : undefined,
      };
    } catch (error) {
      console.warn(`[TokenScanner] PumpFun fetch failed for ${mint}:`, error);
      return undefined;
    }
  }

  /**
   * Fetch Vybe on-chain data
   */
  private async fetchVybeData(mint: string): Promise<VybeData | undefined> {
    if (!this.config.enableVybe || !this.config.vybeApiKey) return undefined;

    try {
      const [details, concentration] = await Promise.all([
        this.vybe.fetchTokenDetails(mint),
        this.vybe.getConcentrationRisk(mint),
      ]);

      return {
        holders: details?.holders,
        topHolderPercent: concentration.topHolderPercent,
        top10Percent: concentration.top10Percent,
        whaleCount: concentration.whaleCount,
        concentrationRisk: concentration.risk,
        price: details?.price,
        volume24h: details?.volume_24h,
      };
    } catch (error) {
      console.warn(`[TokenScanner] Vybe fetch failed for ${mint}:`, error);
      return undefined;
    }
  }
}

// Re-export types
export * from "./types.js";
export * from "./aggregators.js";
