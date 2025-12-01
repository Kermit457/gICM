/**
 * Signal Processor
 *
 * Converts hunter discoveries into actionable trading signals.
 * Routes signals to the ai-hedge-fund for analysis and execution.
 */

import type { HuntDiscovery } from "@gicm/hunter-agent";

// ============================================================================
// TYPES
// ============================================================================

export type SignalType =
  | "new_pool"           // GeckoTerminal: New liquidity pool
  | "price_move"         // Binance: Significant price change
  | "volume_spike"       // Binance: Unusual volume
  | "tvl_change"         // DeFiLlama: TVL movement
  | "yield_opportunity"  // DeFiLlama: High yield
  | "sentiment_extreme"  // Fear & Greed: Extreme reading
  | "insider_trade"      // SEC/Finnhub: Insider buying/selling
  | "congress_trade"     // Finnhub: Congressional trade
  | "tech_trend"         // npm/GitHub: Technology adoption signal
  | "social_buzz"        // Twitter/Reddit: Viral content
  | "research_alpha";    // ArXiv/HackerNews: Research insight

export interface TradingSignal {
  id: string;
  type: SignalType;
  source: string;
  timestamp: Date;

  // Asset info
  token?: string;
  chain?: string;
  contractAddress?: string;

  // Signal strength
  action: "buy" | "sell" | "hold" | "watch";
  confidence: number;      // 0-100
  urgency: "immediate" | "today" | "week" | "monitor";

  // Context
  title: string;
  description: string;
  reasoning: string;

  // Metrics
  metrics: {
    priceChange?: number;
    volume?: number;
    tvl?: number;
    sentiment?: number;
    engagement?: number;
  };

  // Risk assessment
  risk: "low" | "medium" | "high" | "extreme";
  riskFactors: string[];

  // Original discovery
  discoveryId: string;
  sourceUrl: string;
  tags: string[];
}

export interface SignalBatch {
  processedAt: Date;
  totalDiscoveries: number;
  signals: TradingSignal[];
  byType: Record<SignalType, number>;
  byAction: Record<string, number>;
}

// ============================================================================
// SIGNAL PROCESSOR
// ============================================================================

export class SignalProcessor {
  private processedIds: Set<string> = new Set();

  /**
   * Process a batch of discoveries into trading signals
   */
  processBatch(discoveries: HuntDiscovery[]): SignalBatch {
    const signals: TradingSignal[] = [];
    const byType: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    for (const discovery of discoveries) {
      // Skip already processed
      if (this.processedIds.has(discovery.fingerprint)) continue;
      this.processedIds.add(discovery.fingerprint);

      const signal = this.processDiscovery(discovery);
      if (signal) {
        signals.push(signal);
        byType[signal.type] = (byType[signal.type] || 0) + 1;
        byAction[signal.action] = (byAction[signal.action] || 0) + 1;
      }
    }

    // Sort by confidence and urgency
    signals.sort((a, b) => {
      const urgencyOrder = { immediate: 0, today: 1, week: 2, monitor: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.confidence - a.confidence;
    });

    return {
      processedAt: new Date(),
      totalDiscoveries: discoveries.length,
      signals,
      byType: byType as Record<SignalType, number>,
      byAction,
    };
  }

  /**
   * Process a single discovery into a trading signal
   */
  private processDiscovery(discovery: HuntDiscovery): TradingSignal | null {
    const source = discovery.source as string;
    const metadata = discovery.rawMetadata ?? {};

    switch (source) {
      case "geckoterminal":
        return this.processGeckoTerminal(discovery, metadata);
      case "binance":
        return this.processBinance(discovery, metadata);
      case "defillama":
        return this.processDeFiLlama(discovery, metadata);
      case "feargreed":
        return this.processFearGreed(discovery, metadata);
      case "sec":
        return this.processSEC(discovery, metadata);
      case "finnhub":
        return this.processFinnhub(discovery, metadata);
      case "npm":
        return this.processNPM(discovery, metadata);
      case "github":
      case "hackernews":
      case "twitter":
      case "reddit":
        return this.processSocial(discovery, metadata);
      default:
        return null;
    }
  }

  // ============================================================================
  // SOURCE-SPECIFIC PROCESSORS
  // ============================================================================

  private processGeckoTerminal(
    d: HuntDiscovery,
    meta: Record<string, unknown>
  ): TradingSignal {
    const pool = meta as {
      baseToken?: string;
      quoteToken?: string;
      network?: string;
      priceChangePercent?: number;
      liquidity?: number;
      volume24h?: number;
      poolAddress?: string;
    };

    const priceChange = pool.priceChangePercent ?? 0;
    const liquidity = pool.liquidity ?? 0;
    const isNewPool = d.title.includes("[NEW]");

    // Determine action based on metrics
    let action: TradingSignal["action"] = "watch";
    let confidence = 30;
    let urgency: TradingSignal["urgency"] = "week";
    const riskFactors: string[] = [];

    if (isNewPool && liquidity > 50000) {
      action = "watch";
      confidence = 50;
      urgency = "today";
      riskFactors.push("New pool - higher risk");
    }

    if (priceChange > 50 && liquidity > 100000) {
      confidence = 60;
      urgency = "today";
      riskFactors.push("High volatility");
    }

    if (liquidity < 10000) {
      riskFactors.push("Low liquidity - high slippage risk");
    }

    return {
      id: `signal-${d.fingerprint}`,
      type: isNewPool ? "new_pool" : "price_move",
      source: "geckoterminal",
      timestamp: new Date(),
      token: pool.baseToken,
      chain: pool.network ?? "solana",
      contractAddress: pool.poolAddress,
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isNewPool
        ? `New pool detected with $${(liquidity / 1000).toFixed(1)}K liquidity`
        : `Price moved ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}%`,
      metrics: {
        priceChange,
        volume: pool.volume24h,
        tvl: liquidity,
      },
      risk: liquidity < 10000 ? "extreme" : liquidity < 50000 ? "high" : "medium",
      riskFactors,
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
    };
  }

  private processBinance(
    d: HuntDiscovery,
    meta: Record<string, unknown>
  ): TradingSignal {
    const ticker = meta as {
      symbol?: string;
      type?: string;
      priceChangePercent?: string;
      quoteVolume?: string;
    };

    const priceChange = parseFloat(ticker.priceChangePercent ?? "0");
    const volume = parseFloat(ticker.quoteVolume ?? "0");
    const isVolumeAnomaly = ticker.type === "volume_anomaly";

    let action: TradingSignal["action"] = "watch";
    let confidence = 40;
    let urgency: TradingSignal["urgency"] = "today";

    // Strong price moves with volume confirmation
    if (Math.abs(priceChange) > 10 && volume > 100000000) {
      action = priceChange > 0 ? "watch" : "watch"; // Don't auto-buy/sell on CEX data
      confidence = 65;
      urgency = "today";
    }

    return {
      id: `signal-${d.fingerprint}`,
      type: isVolumeAnomaly ? "volume_spike" : "price_move",
      source: "binance",
      timestamp: new Date(),
      token: ticker.symbol?.replace("USDT", ""),
      chain: "multi", // CEX token, multiple chains
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isVolumeAnomaly
        ? `Unusual volume: $${(volume / 1e6).toFixed(1)}M in 24h`
        : `CEX price moved ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}%`,
      metrics: {
        priceChange,
        volume,
      },
      risk: Math.abs(priceChange) > 20 ? "high" : "medium",
      riskFactors: Math.abs(priceChange) > 20 ? ["High volatility"] : [],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
    };
  }

  private processDeFiLlama(
    d: HuntDiscovery,
    meta: Record<string, unknown>
  ): TradingSignal {
    const protocol = meta as {
      tvl?: number;
      tvlChange24h?: number;
      category?: string;
      apy?: number;
      chain?: string;
    };

    const tvlChange = protocol.tvlChange24h ?? 0;
    const tvl = protocol.tvl ?? 0;
    const apy = protocol.apy ?? 0;
    const isYield = d.title.includes("[YIELD]");

    let action: TradingSignal["action"] = "watch";
    let confidence = 35;
    let urgency: TradingSignal["urgency"] = "week";
    const riskFactors: string[] = [];

    // High yield opportunity
    if (isYield && apy > 20 && tvl > 1000000) {
      action = "watch";
      confidence = 55;
      urgency = "today";
      if (apy > 100) riskFactors.push("Very high APY - potential risk");
    }

    // TVL growth signals confidence
    if (tvlChange > 10 && tvl > 10000000) {
      confidence = 60;
      urgency = "today";
    }

    return {
      id: `signal-${d.fingerprint}`,
      type: isYield ? "yield_opportunity" : "tvl_change",
      source: "defillama",
      timestamp: new Date(),
      chain: protocol.chain ?? "multi",
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isYield
        ? `${apy.toFixed(1)}% APY on $${(tvl / 1e6).toFixed(1)}M TVL`
        : `TVL changed ${tvlChange > 0 ? "+" : ""}${tvlChange.toFixed(1)}%`,
      metrics: {
        tvl,
        priceChange: tvlChange,
      },
      risk: apy > 100 ? "high" : tvl < 1000000 ? "high" : "medium",
      riskFactors,
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
    };
  }

  private processFearGreed(
    d: HuntDiscovery,
    meta: Record<string, unknown>
  ): TradingSignal {
    const fg = meta as {
      value?: number;
      classification?: string;
      signal?: string;
    };

    const value = fg.value ?? 50;
    const isExtremeFear = value < 25;
    const isExtremeGreed = value > 75;

    // Contrarian signals
    let action: TradingSignal["action"] = "watch";
    let confidence = 45;
    let urgency: TradingSignal["urgency"] = "week";

    if (isExtremeFear) {
      action = "watch"; // Potential accumulation zone
      confidence = 70;
      urgency = "today";
    } else if (isExtremeGreed) {
      action = "watch"; // Potential distribution zone
      confidence = 65;
      urgency = "today";
    }

    return {
      id: `signal-${d.fingerprint}`,
      type: "sentiment_extreme",
      source: "feargreed",
      timestamp: new Date(),
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isExtremeFear
        ? `Extreme Fear (${value}) - contrarian buy signal`
        : isExtremeGreed
        ? `Extreme Greed (${value}) - contrarian sell signal`
        : `Neutral sentiment (${value})`,
      metrics: {
        sentiment: value,
      },
      risk: "low", // Sentiment is supplementary info
      riskFactors: [],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
    };
  }

  private processSEC(
    d: HuntDiscovery,
    meta: Record<string, unknown>
  ): TradingSignal {
    const filing = meta as {
      form?: string;
      company?: string;
      symbol?: string;
    };

    const isInsider = filing.form === "4";
    const isInstitutional = filing.form === "13F-HR";
    const isBuy = d.title.includes("BOUGHT") || d.title.includes("🟢");

    let action: TradingSignal["action"] = "watch";
    let confidence = 50;
    let urgency: TradingSignal["urgency"] = "today";

    if (isInsider && isBuy) {
      confidence = 65;
      urgency = "today";
    }

    if (isInstitutional) {
      confidence = 60;
      urgency = "week"; // 13-F is delayed data
    }

    return {
      id: `signal-${d.fingerprint}`,
      type: "insider_trade",
      source: "sec",
      timestamp: new Date(),
      token: filing.symbol,
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: isInsider
        ? `Insider ${isBuy ? "buying" : "selling"} detected`
        : `Institutional filing: ${filing.form}`,
      metrics: {},
      risk: "low", // Public filings are reliable data
      riskFactors: isInstitutional ? ["13-F data is 45 days delayed"] : [],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
    };
  }

  private processFinnhub(
    d: HuntDiscovery,
    meta: Record<string, unknown>
  ): TradingSignal {
    const trade = meta as {
      type?: string;
      symbol?: string;
      chamber?: string;
    };

    const isCongress = trade.type === "congress";
    const isBuy = d.title.includes("BOUGHT") || d.title.includes("🟢");

    // Congressional trades are THE ALPHA
    let action: TradingSignal["action"] = "watch";
    let confidence = 75; // High confidence for congress trades
    let urgency: TradingSignal["urgency"] = "today";

    if (isCongress && isBuy) {
      confidence = 80;
      urgency = "today";
    }

    return {
      id: `signal-${d.fingerprint}`,
      type: "congress_trade",
      source: "finnhub",
      timestamp: new Date(),
      token: trade.symbol,
      action,
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: `${trade.chamber ?? "Congress"} member ${isBuy ? "bought" : "sold"} ${trade.symbol}`,
      metrics: {},
      risk: "low", // Public data, historically alpha-generating
      riskFactors: ["Congress trades filed with delay"],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
    };
  }

  private processNPM(
    d: HuntDiscovery,
    meta: Record<string, unknown>
  ): TradingSignal {
    const pkg = meta as {
      category?: string;
      trend?: number;
      downloads?: number;
    };

    const trend = pkg.trend ?? 0;
    const isAI = pkg.category === "ai";
    const isCrypto = pkg.category === "crypto";

    // Tech trends can signal broader market movements
    let confidence = 30;
    let urgency: TradingSignal["urgency"] = "week";

    if ((isAI || isCrypto) && trend > 20) {
      confidence = 45;
      urgency = "week";
    }

    return {
      id: `signal-${d.fingerprint}`,
      type: "tech_trend",
      source: "npm",
      timestamp: new Date(),
      action: "watch",
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: `${pkg.category} package trending ${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`,
      metrics: {
        priceChange: trend,
      },
      risk: "low",
      riskFactors: [],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
    };
  }

  private processSocial(
    d: HuntDiscovery,
    meta: Record<string, unknown>
  ): TradingSignal {
    const engagement = (d.metrics.likes ?? 0) + (d.metrics.comments ?? 0) + (d.metrics.reposts ?? 0);
    const isHighEngagement = engagement > 1000;

    // Social signals are noisy but can indicate momentum
    let confidence = 25;
    let urgency: TradingSignal["urgency"] = "week";

    if (isHighEngagement && d.relevanceFactors.hasWeb3Keywords) {
      confidence = 40;
      urgency = "today";
    }

    return {
      id: `signal-${d.fingerprint}`,
      type: "social_buzz",
      source: d.source as string,
      timestamp: new Date(),
      action: "watch",
      confidence,
      urgency,
      title: d.title,
      description: d.description ?? "",
      reasoning: `High engagement: ${engagement} interactions`,
      metrics: {
        engagement,
      },
      risk: "medium",
      riskFactors: ["Social signals are noisy"],
      discoveryId: d.id,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
    };
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get high-priority signals that should be acted on
   */
  getActionableSignals(batch: SignalBatch): TradingSignal[] {
    return batch.signals.filter(
      (s) => s.confidence >= 60 && (s.urgency === "immediate" || s.urgency === "today")
    );
  }

  /**
   * Get signals by type
   */
  getSignalsByType(batch: SignalBatch, type: SignalType): TradingSignal[] {
    return batch.signals.filter((s) => s.type === type);
  }

  /**
   * Clear processed cache (for testing)
   */
  clearCache(): void {
    this.processedIds.clear();
  }
}

// Export singleton
export const signalProcessor = new SignalProcessor();
