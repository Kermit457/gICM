import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// Polymarket CLOB API (Gamma) - Public, No Auth Required
const POLYMARKET_API = "https://gamma-api.polymarket.com";
const POLYMARKET_CLOB = "https://clob.polymarket.com";

interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  category: string;
  markets: PolymarketMarket[];
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
}

interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  endDate: string;
  liquidity: number;
  volume: number;
  volume24hr: number;
  active: boolean;
  closed: boolean;
  outcomes: string[];
  outcomePrices: string[];
  acceptingOrders: boolean;
  clobRewards?: {
    rates: string[];
  };
}

// Categories we care about
const TARGET_CATEGORIES = [
  "crypto",
  "finance",
  "politics",
  "sports",
  "science",
  "tech",
  "pop-culture",
  "business",
];

// Crypto-related keywords
const CRYPTO_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "solana",
  "sol",
  "crypto",
  "cryptocurrency",
  "blockchain",
  "defi",
  "nft",
  "web3",
  "binance",
  "coinbase",
  "sec",
  "etf",
];

export class PolymarketHunter implements BaseHunterSource {
  source = "polymarket" as const;
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
      console.error("[PolymarketHunter] Failed to fetch markets:", error);
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
    const metadata = raw.metadata as PolymarketMarket | undefined;

    return {
      id: randomUUID(),
      source: "polymarket" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: "Polymarket",
      authorUrl: "https://polymarket.com",
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
        recentActivity: (metadata?.volume24hr ?? 0) > 10000,
        highEngagement: (raw.metrics.points ?? 0) > 100000,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchMarkets(): Promise<PolymarketMarket[]> {
    // Fetch active markets from Gamma API
    const response = await fetch(`${POLYMARKET_API}/markets?active=true&limit=100`, {
      headers: {
        "User-Agent": "gICM-Hunter/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.markets ?? []);
  }

  private filterMarkets(markets: PolymarketMarket[]): PolymarketMarket[] {
    const minVolume = this.config.filters?.minPoints ?? 10000; // $10K default
    const minLiquidity = 5000; // $5K minimum

    return markets
      .filter((m) => {
        // Must be active
        if (!m.active || m.closed) return false;

        // Must have minimum volume
        if (m.volume < minVolume) return false;

        // Must have minimum liquidity
        if (m.liquidity < minLiquidity) return false;

        // Filter by keywords if specified
        const text = m.question.toLowerCase();
        if (this.config.filters?.keywords?.length) {
          const hasKeyword = this.config.filters.keywords.some((kw) =>
            text.includes(kw.toLowerCase())
          );
          if (!hasKeyword) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by 24h volume (most active first)
        return (b.volume24hr ?? 0) - (a.volume24hr ?? 0);
      })
      .slice(0, 50); // Top 50 markets
  }

  private marketToRawDiscovery(market: PolymarketMarket): RawDiscovery {
    // Parse outcome prices
    const prices = market.outcomePrices?.map((p) => parseFloat(p) * 100) ?? [];
    const priceStr = prices.length >= 2 ? `Yes: ${prices[0].toFixed(0)}% / No: ${prices[1].toFixed(0)}%` : "";

    return {
      sourceId: `polymarket:${market.id}`,
      sourceUrl: `https://polymarket.com/event/${market.slug}`,
      title: `[Prediction] ${market.question}`,
      description: `${priceStr} | Volume: $${this.formatNumber(market.volume)} | Liquidity: $${this.formatNumber(market.liquidity)}`,
      author: "Polymarket",
      authorUrl: "https://polymarket.com",
      publishedAt: market.endDate ? new Date(market.endDate) : undefined,
      metrics: {
        points: market.volume,
        views: market.volume24hr,
        likes: market.liquidity,
      },
      metadata: market as unknown as Record<string, unknown>,
    };
  }

  private categorize(text: string): HuntDiscovery["category"] {
    if (this.hasKeywords(text, CRYPTO_KEYWORDS)) return "defi";
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) return "ai";
    return "other";
  }

  private extractTags(text: string, metadata?: PolymarketMarket): string[] {
    const tags: string[] = ["prediction-market", "polymarket"];

    if (this.hasKeywords(text, CRYPTO_KEYWORDS)) tags.push("crypto");
    if (text.includes("bitcoin") || text.includes("btc")) tags.push("bitcoin");
    if (text.includes("ethereum") || text.includes("eth")) tags.push("ethereum");
    if (text.includes("solana") || text.includes("sol")) tags.push("solana");
    if (text.includes("election") || text.includes("president")) tags.push("politics");
    if (text.includes("etf")) tags.push("etf");
    if (text.includes("sec")) tags.push("sec");
    if (text.includes("fed") || text.includes("interest rate")) tags.push("macro");

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `polymarket:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
