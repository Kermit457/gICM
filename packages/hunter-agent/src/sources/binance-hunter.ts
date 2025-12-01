import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// Binance Public API - 100% Free, No Auth Required
const BINANCE_API = "https://data-api.binance.vision/api/v3";

interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

// Key trading pairs to track
const TRACKED_PAIRS = [
  // Major crypto
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT",
  // Solana ecosystem
  "BONKUSDT", "WIFUSDT", "JUPUSDT", "RAYUSDT", "PYTHUSDT",
  // AI tokens
  "RENDERUSDT", "TAOUSDT", "FETUSDT", "AGIXUSDT",
  // DeFi
  "UNIUSDT", "AAVEUSDT", "MKRUSDT", "COMPUSDT",
  // Layer 2
  "ARBUSDT", "OPUSDT", "MATICUSDT",
  // Memecoins
  "DOGEUSDT", "SHIBUSDT", "PEPEUSDT", "FLOKIUSDT",
];

export class BinanceHunter implements BaseHunterSource {
  source = "binance" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    try {
      // 1. Fetch 24hr tickers for tracked pairs
      const tickers = await this.fetch24hrTickers();
      const significant = this.filterSignificantMoves(tickers);
      discoveries.push(...significant.map((t) => this.tickerToDiscovery(t)));

      // 2. Check for volume anomalies
      const volumeAnomalies = this.findVolumeAnomalies(tickers);
      discoveries.push(...volumeAnomalies.map((t) => this.volumeAnomalyToDiscovery(t)));

    } catch (error) {
      console.error("[BinanceHunter] Failed to fetch data:", error);
    }

    // Deduplicate
    const seen = new Set<string>();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata as { symbol: string; type: string } | undefined;

    return {
      id: randomUUID(),
      source: "binance" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(metadata?.symbol),
      tags: this.extractTags(text, metadata),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: true,
        hasAIKeywords: this.isAIToken(metadata?.symbol),
        hasSolanaKeywords: this.isSolanaToken(metadata?.symbol),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: metadata?.type === "volume_anomaly" || Math.abs(raw.metrics.likes ?? 0) > 10,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetch24hrTickers(): Promise<Binance24hrTicker[]> {
    // Fetch all tickers and filter to tracked ones
    const response = await fetch(`${BINANCE_API}/ticker/24hr`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" },
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const allTickers: Binance24hrTicker[] = await response.json();
    return allTickers.filter((t) => TRACKED_PAIRS.includes(t.symbol));
  }

  private filterSignificantMoves(tickers: Binance24hrTicker[]): Binance24hrTicker[] {
    const threshold = this.config.filters?.minPoints ?? 5; // 5% move

    return tickers.filter((t) => {
      const changePercent = parseFloat(t.priceChangePercent);
      return Math.abs(changePercent) >= threshold;
    });
  }

  private findVolumeAnomalies(tickers: Binance24hrTicker[]): Binance24hrTicker[] {
    // Find pairs with unusually high volume (this is a simple heuristic)
    // A proper implementation would compare to historical average

    const volumeThreshold = 100000000; // $100M volume threshold
    return tickers.filter((t) => {
      const volume = parseFloat(t.quoteVolume);
      return volume > volumeThreshold;
    });
  }

  private tickerToDiscovery(ticker: Binance24hrTicker): RawDiscovery {
    const changePercent = parseFloat(ticker.priceChangePercent);
    const price = parseFloat(ticker.lastPrice);
    const volume = parseFloat(ticker.quoteVolume);

    const emoji = changePercent > 0 ? "🟢" : "🔴";
    const symbol = ticker.symbol.replace("USDT", "");

    return {
      sourceId: `binance:ticker:${ticker.symbol}:${ticker.closeTime}`,
      sourceUrl: `https://www.binance.com/en/trade/${symbol}_USDT`,
      title: `${emoji} [CEX] ${symbol}: $${this.formatPrice(price)} (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%)`,
      description: `24h Vol: $${this.formatNumber(volume)} | High: $${parseFloat(ticker.highPrice).toFixed(4)} | Low: $${parseFloat(ticker.lowPrice).toFixed(4)} | Trades: ${ticker.count.toLocaleString()}`,
      author: "Binance",
      authorUrl: "https://www.binance.com",
      publishedAt: new Date(ticker.closeTime),
      metrics: {
        points: price,
        views: volume,
        likes: changePercent,
        comments: ticker.count,
      },
      metadata: { ...ticker, type: "price_move", symbol } as unknown as Record<string, unknown>,
    };
  }

  private volumeAnomalyToDiscovery(ticker: Binance24hrTicker): RawDiscovery {
    const volume = parseFloat(ticker.quoteVolume);
    const changePercent = parseFloat(ticker.priceChangePercent);
    const symbol = ticker.symbol.replace("USDT", "");

    return {
      sourceId: `binance:volume:${ticker.symbol}:${ticker.closeTime}`,
      sourceUrl: `https://www.binance.com/en/trade/${symbol}_USDT`,
      title: `📊 [VOLUME] ${symbol}: $${this.formatNumber(volume)} in 24h`,
      description: `Unusually high volume detected. Price ${changePercent > 0 ? "up" : "down"} ${Math.abs(changePercent).toFixed(2)}%. Total trades: ${ticker.count.toLocaleString()}`,
      author: "Binance",
      authorUrl: "https://www.binance.com",
      publishedAt: new Date(ticker.closeTime),
      metrics: {
        points: volume,
        views: ticker.count,
        likes: changePercent,
      },
      metadata: { ...ticker, type: "volume_anomaly", symbol } as unknown as Record<string, unknown>,
    };
  }

  private categorize(symbol?: string): HuntDiscovery["category"] {
    if (!symbol) return "web3";
    if (this.isAIToken(symbol)) return "ai";
    if (this.isSolanaToken(symbol)) return "web3";
    return "web3";
  }

  private extractTags(text: string, metadata?: { symbol: string; type: string }): string[] {
    const tags = ["binance", "cex", "trading"];

    if (metadata?.symbol) {
      tags.push(metadata.symbol.toLowerCase());

      if (this.isSolanaToken(metadata.symbol)) tags.push("solana");
      if (this.isAIToken(metadata.symbol)) tags.push("ai");
      if (this.isMemeToken(metadata.symbol)) tags.push("memecoin");
    }

    if (metadata?.type) {
      tags.push(metadata.type);
    }

    return [...new Set(tags)];
  }

  private isSolanaToken(symbol?: string): boolean {
    if (!symbol) return false;
    const solanaTokens = ["SOL", "BONK", "WIF", "JUP", "RAY", "PYTH", "JTO", "ORCA"];
    return solanaTokens.some((t) => symbol.toUpperCase().includes(t));
  }

  private isAIToken(symbol?: string): boolean {
    if (!symbol) return false;
    const aiTokens = ["RENDER", "TAO", "FET", "AGIX", "OCEAN", "NMR"];
    return aiTokens.some((t) => symbol.toUpperCase().includes(t));
  }

  private isMemeToken(symbol?: string): boolean {
    if (!symbol) return false;
    const memeTokens = ["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF"];
    return memeTokens.some((t) => symbol.toUpperCase().includes(t));
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private formatPrice(price: number): string {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `binance:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
