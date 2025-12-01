import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// GeckoTerminal API - 100% Free, No Auth Required
// 30 calls/min rate limit
const GECKOTERMINAL_API = "https://api.geckoterminal.com/api/v2";

interface GeckoPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_native_currency: string;
    pool_created_at: string;
    reserve_in_usd: string;
    fdv_usd?: string;
    market_cap_usd?: string;
    price_change_percentage: {
      h1?: string;
      h24?: string;
    };
    transactions: {
      h1?: { buys: number; sells: number; buyers: number; sellers: number };
      h24?: { buys: number; sells: number; buyers: number; sellers: number };
    };
    volume_usd: {
      h1?: string;
      h24?: string;
    };
  };
  relationships?: {
    base_token?: { data: { id: string } };
    quote_token?: { data: { id: string } };
    dex?: { data: { id: string } };
  };
}

interface GeckoToken {
  id: string;
  type: string;
  attributes: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    image_url?: string;
    coingecko_coin_id?: string;
    total_supply?: string;
    price_usd?: string;
    fdv_usd?: string;
    total_reserve_in_usd?: string;
    volume_usd?: { h24?: string };
    market_cap_usd?: string;
  };
}

// Networks we care about most for new token discovery
const TARGET_NETWORKS = [
  "solana",
  "eth",
  "base",
  "arbitrum",
  "bsc",
  "polygon",
  "optimism",
  "avalanche",
];

export class GeckoTerminalHunter implements BaseHunterSource {
  source = "geckoterminal" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // 1. Fetch new pools from each network
    for (const network of TARGET_NETWORKS.slice(0, 4)) { // Limit to stay under rate limits
      try {
        const newPools = await this.fetchNewPools(network);
        discoveries.push(...newPools.map((p) => this.poolToRawDiscovery(p, network, "new")));
        await new Promise((r) => setTimeout(r, 2100)); // Rate limit: 30/min = 2s between calls
      } catch (error) {
        console.error(`[GeckoTerminalHunter] Failed to fetch new pools for ${network}:`, error);
      }
    }

    // 2. Fetch trending pools
    for (const network of TARGET_NETWORKS.slice(0, 4)) {
      try {
        const trendingPools = await this.fetchTrendingPools(network);
        discoveries.push(...trendingPools.map((p) => this.poolToRawDiscovery(p, network, "trending")));
        await new Promise((r) => setTimeout(r, 2100));
      } catch (error) {
        console.error(`[GeckoTerminalHunter] Failed to fetch trending pools for ${network}:`, error);
      }
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
    const metadata = raw.metadata as { pool: GeckoPool; network: string; type: string } | undefined;

    return {
      id: randomUUID(),
      source: "geckoterminal" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: "defi",
      tags: this.extractTags(text, metadata),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: true,
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: metadata?.network === "solana" || this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: metadata?.network === "eth" || this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: this.isNewPool(metadata?.pool),
        highEngagement: (raw.metrics.views ?? 0) > 100000, // $100K+ volume
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchNewPools(network: string): Promise<GeckoPool[]> {
    const response = await fetch(
      `${GECKOTERMINAL_API}/networks/${network}/new_pools?page=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "gICM-Hunter/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }

    const data = await response.json();
    return this.filterPools(data.data ?? []);
  }

  private async fetchTrendingPools(network: string): Promise<GeckoPool[]> {
    const response = await fetch(
      `${GECKOTERMINAL_API}/networks/${network}/trending_pools?page=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "gICM-Hunter/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }

    const data = await response.json();
    return this.filterPools(data.data ?? []);
  }

  private filterPools(pools: GeckoPool[]): GeckoPool[] {
    const minLiquidity = this.config.filters?.minPoints ?? 10000; // $10K minimum
    const minVolume = 1000; // $1K minimum 24h volume

    return pools.filter((pool) => {
      const liquidity = parseFloat(pool.attributes.reserve_in_usd || "0");
      const volume24h = parseFloat(pool.attributes.volume_usd?.h24 || "0");

      // Must have minimum liquidity
      if (liquidity < minLiquidity) return false;

      // Must have some trading activity
      if (volume24h < minVolume) return false;

      // Filter out obvious honeypots (0 sells)
      const txns = pool.attributes.transactions?.h24;
      if (txns && txns.sells === 0 && txns.buys > 10) return false;

      return true;
    });
  }

  private poolToRawDiscovery(pool: GeckoPool, network: string, type: string): RawDiscovery {
    const attrs = pool.attributes;
    const liquidity = parseFloat(attrs.reserve_in_usd || "0");
    const volume24h = parseFloat(attrs.volume_usd?.h24 || "0");
    const priceChange24h = parseFloat(attrs.price_change_percentage?.h24 || "0");
    const txns = attrs.transactions?.h24;

    const priceChangeStr = priceChange24h !== 0
      ? `${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(1)}%`
      : "";

    const createdAt = attrs.pool_created_at ? new Date(attrs.pool_created_at) : undefined;
    const isNew = createdAt && (Date.now() - createdAt.getTime()) < 24 * 60 * 60 * 1000;

    return {
      sourceId: `geckoterminal:${pool.id}`,
      sourceUrl: `https://www.geckoterminal.com/${network}/pools/${attrs.address}`,
      title: `[${type === "new" ? "NEW" : "HOT"}] ${attrs.name} on ${network.toUpperCase()} ${priceChangeStr}`,
      description: `Liquidity: $${this.formatNumber(liquidity)} | Vol 24h: $${this.formatNumber(volume24h)} | ${txns ? `Buys: ${txns.buys} Sells: ${txns.sells}` : ""}${isNew ? " | JUST LAUNCHED" : ""}`,
      author: network,
      authorUrl: `https://www.geckoterminal.com/${network}`,
      publishedAt: createdAt,
      metrics: {
        points: liquidity,
        views: volume24h,
        likes: txns?.buys ?? 0,
        comments: txns?.sells ?? 0,
      },
      metadata: { pool, network, type } as unknown as Record<string, unknown>,
    };
  }

  private extractTags(text: string, metadata?: { pool: GeckoPool; network: string; type: string }): string[] {
    const tags: string[] = ["dex", "pool"];

    if (metadata) {
      tags.push(metadata.network);
      tags.push(metadata.type);

      // Extract DEX name from pool ID if present
      const dexId = metadata.pool.relationships?.dex?.data?.id;
      if (dexId) {
        const dexName = dexId.split("_").pop();
        if (dexName) tags.push(dexName);
      }
    }

    if (this.hasKeywords(text, ["meme", "pepe", "doge", "shib", "bonk", "wif"])) {
      tags.push("memecoin");
    }

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private isNewPool(pool?: GeckoPool): boolean {
    if (!pool?.attributes.pool_created_at) return false;
    const created = new Date(pool.attributes.pool_created_at);
    const hoursSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 24;
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `geckoterminal:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
