import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// Kalshi Public API
const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";
const KALSHI_WEB = "https://kalshi.com";

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  market_type: string;
  title: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  open_time: string;
  close_time: string;
  expiration_time: string;
  status: string;
  category: string;
  series_ticker: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  previous_price: number;
  previous_yes_bid: number;
  previous_yes_ask: number;
  volume: number;
  volume_24h: number;
  liquidity: number;
  open_interest: number;
  result?: string;
  cap_strike?: number;
  floor_strike?: number;
  strike_type?: string;
  floor?: number;
  cap?: number;
}

interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  title: string;
  mutually_exclusive: boolean;
  category: string;
  sub_title?: string;
  markets: KalshiMarket[];
}

// Categories we care about
const TARGET_CATEGORIES = [
  "Economics",
  "Financials",
  "Politics",
  "Technology",
  "Climate",
  "Science",
  "Entertainment",
  "Sports",
];

// Finance/Crypto related keywords
const FINANCE_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "crypto",
  "fed",
  "interest rate",
  "inflation",
  "gdp",
  "unemployment",
  "stock",
  "s&p",
  "nasdaq",
  "treasury",
  "yield",
  "recession",
  "cpi",
  "fomc",
  "sec",
  "etf",
];

export class KalshiHunter implements BaseHunterSource {
  source = "kalshi" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    try {
      // Fetch active markets
      const markets = await this.fetchMarkets();
      const filtered = this.filterMarkets(markets);
      discoveries.push(...filtered.map((m) => this.marketToRawDiscovery(m)));
    } catch (error) {
      console.error("[KalshiHunter] Failed to fetch markets:", error);
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
    const metadata = raw.metadata as KalshiMarket | undefined;

    return {
      id: randomUUID(),
      source: "kalshi" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: "Kalshi",
      authorUrl: "https://kalshi.com",
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(text),
      tags: this.extractTags(text, metadata),
      language: "en",
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: (metadata?.volume_24h ?? 0) > 1000,
        highEngagement: (raw.metrics.points ?? 0) > 10000,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchMarkets(): Promise<KalshiMarket[]> {
    // Fetch active markets from Kalshi public API
    const response = await fetch(`${KALSHI_API}/markets?status=open&limit=200`, {
      headers: {
        "User-Agent": "gICM-Hunter/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      // Try alternative endpoint
      const altResponse = await fetch(
        `https://trading-api.kalshi.com/trade-api/v2/markets?status=open&limit=200`,
        {
          headers: {
            "User-Agent": "gICM-Hunter/1.0",
            Accept: "application/json",
          },
        }
      );

      if (!altResponse.ok) {
        throw new Error(`Kalshi API error: ${response.status}`);
      }

      const altData = await altResponse.json();
      return altData.markets ?? [];
    }

    const data = await response.json();
    return data.markets ?? [];
  }

  private filterMarkets(markets: KalshiMarket[]): KalshiMarket[] {
    const minVolume = this.config.filters?.minPoints ?? 100; // $100 default (Kalshi contracts are $1)
    const minOpenInterest = 50;

    return markets
      .filter((m) => {
        // Must be open
        if (m.status !== "open") return false;

        // Must have minimum volume
        if (m.volume < minVolume) return false;

        // Must have minimum open interest
        if (m.open_interest < minOpenInterest) return false;

        // Must be in a category we care about
        if (m.category && !TARGET_CATEGORIES.some((c) => m.category.includes(c))) {
          return false;
        }

        // Filter by keywords if specified
        const text = m.title.toLowerCase();
        if (this.config.filters?.keywords?.length) {
          const hasKeyword = this.config.filters.keywords.some((kw) =>
            text.includes(kw.toLowerCase())
          );
          if (!hasKeyword) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by 24h volume
        return (b.volume_24h ?? 0) - (a.volume_24h ?? 0);
      })
      .slice(0, 50); // Top 50 markets
  }

  private marketToRawDiscovery(market: KalshiMarket): RawDiscovery {
    // Calculate implied probability from yes_bid/yes_ask
    const yesPrice = market.yes_bid > 0 ? market.yes_bid : market.last_price;
    const noPrice = market.no_bid > 0 ? market.no_bid : (100 - market.last_price);
    const priceStr = `Yes: ${yesPrice}¢ / No: ${noPrice}¢`;

    // Calculate price change
    const priceChange = market.last_price - market.previous_price;
    const changeStr = priceChange !== 0 ? ` (${priceChange > 0 ? "+" : ""}${priceChange}¢)` : "";

    return {
      sourceId: `kalshi:${market.ticker}`,
      sourceUrl: `${KALSHI_WEB}/markets/${market.ticker}`,
      title: `[Prediction] ${market.title}`,
      description: `${priceStr}${changeStr} | Volume: ${this.formatNumber(market.volume)} contracts | Open Interest: ${this.formatNumber(market.open_interest)}`,
      author: "Kalshi",
      authorUrl: KALSHI_WEB,
      publishedAt: market.expiration_time ? new Date(market.expiration_time) : undefined,
      metrics: {
        points: market.volume,
        views: market.volume_24h,
        likes: market.open_interest,
      },
      metadata: market as unknown as Record<string, unknown>,
    };
  }

  private categorize(text: string): HuntDiscovery["category"] {
    if (this.hasKeywords(text, FINANCE_KEYWORDS)) return "defi";
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) return "ai";
    return "other";
  }

  private extractTags(text: string, metadata?: KalshiMarket): string[] {
    const tags: string[] = ["prediction-market", "kalshi"];

    // Add category tag
    if (metadata?.category) {
      tags.push(metadata.category.toLowerCase());
    }

    // Add topic tags
    if (this.hasKeywords(text, ["bitcoin", "btc"])) tags.push("bitcoin");
    if (this.hasKeywords(text, ["ethereum", "eth"])) tags.push("ethereum");
    if (this.hasKeywords(text, ["crypto"])) tags.push("crypto");
    if (this.hasKeywords(text, ["fed", "fomc", "interest rate"])) tags.push("fed");
    if (this.hasKeywords(text, ["inflation", "cpi"])) tags.push("inflation");
    if (this.hasKeywords(text, ["gdp", "recession"])) tags.push("macro");
    if (this.hasKeywords(text, ["election", "president", "congress"])) tags.push("politics");
    if (this.hasKeywords(text, ["sec", "etf"])) tags.push("regulatory");

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private formatNumber(num: number): string {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `kalshi:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
