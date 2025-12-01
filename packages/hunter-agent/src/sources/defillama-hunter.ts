import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// DeFiLlama API - 100% Free, No Auth Required
const DEFILLAMA_API = "https://api.llama.fi";
const YIELDS_API = "https://yields.llama.fi";

interface DefiProtocol {
  id: string;
  name: string;
  address?: string;
  symbol?: string;
  url: string;
  description?: string;
  chain: string;
  chains: string[];
  logo?: string;
  audits?: string;
  audit_note?: string;
  gecko_id?: string;
  cmcId?: string;
  category: string;
  twitter?: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  fdv?: number;
}

interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase?: number;
  apyReward?: number;
  apy: number;
  rewardTokens?: string[];
  pool: string;
  apyPct1D?: number;
  apyPct7D?: number;
  apyPct30D?: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  poolMeta?: string;
  underlyingTokens?: string[];
  il7d?: number;
  apyBase7d?: number;
  apyMean30d?: number;
  volumeUsd1d?: number;
  volumeUsd7d?: number;
}

// Chains we care about most
const TARGET_CHAINS = [
  "Solana",
  "Ethereum",
  "Arbitrum",
  "Base",
  "Optimism",
  "BSC",
  "Polygon",
  "Avalanche",
];

// Categories we care about
const TARGET_CATEGORIES = [
  "Dexes",
  "Lending",
  "Liquid Staking",
  "Bridge",
  "Yield",
  "Derivatives",
  "CDP",
  "Yield Aggregator",
  "Leveraged Farming",
];

export class DeFiLlamaHunter implements BaseHunterSource {
  source = "defillama" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // 1. Fetch protocols with significant TVL changes
    try {
      const protocols = await this.fetchProtocols();
      const filtered = this.filterProtocols(protocols);
      discoveries.push(...filtered.map((p) => this.protocolToRawDiscovery(p)));
    } catch (error) {
      console.error("[DeFiLlamaHunter] Failed to fetch protocols:", error);
    }

    // 2. Fetch top yield opportunities
    try {
      const yields = await this.fetchYields();
      const topYields = this.filterYields(yields);
      discoveries.push(...topYields.map((y) => this.yieldToRawDiscovery(y)));
    } catch (error) {
      console.error("[DeFiLlamaHunter] Failed to fetch yields:", error);
    }

    // Deduplicate by source ID
    const seen = new Set<string>();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata as (DefiProtocol | YieldPool) | undefined;

    return {
      id: randomUUID(),
      source: "defillama" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(text, metadata),
      tags: this.extractTags(text, metadata),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: true, // DeFi is always web3
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: this.hasSignificantChange(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 1000000, // $1M+ TVL
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchProtocols(): Promise<DefiProtocol[]> {
    const response = await fetch(`${DEFILLAMA_API}/protocols`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" },
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }

    return response.json();
  }

  private async fetchYields(): Promise<YieldPool[]> {
    const response = await fetch(`${YIELDS_API}/pools`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" },
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama Yields API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data ?? [];
  }

  private filterProtocols(protocols: DefiProtocol[]): DefiProtocol[] {
    const minTvl = this.config.filters?.minPoints ?? 100000; // $100K default
    const minChange = 5; // 5% change threshold

    return protocols.filter((p) => {
      // Must have minimum TVL
      if (p.tvl < minTvl) return false;

      // Must be on a chain we care about
      if (!p.chains.some((c) => TARGET_CHAINS.includes(c))) return false;

      // Must be in a category we care about
      if (!TARGET_CATEGORIES.includes(p.category)) return false;

      // Significant TVL change (up or down)
      const hasSignificantChange =
        Math.abs(p.change_1d ?? 0) > minChange ||
        Math.abs(p.change_7d ?? 0) > minChange * 2;

      // High TVL protocols always included
      if (p.tvl > 10000000) return true; // $10M+

      return hasSignificantChange;
    });
  }

  private filterYields(yields: YieldPool[]): YieldPool[] {
    const minTvl = 50000; // $50K minimum
    const minApy = 5; // 5% APY minimum

    return yields
      .filter((y) => {
        // Must have minimum TVL
        if (y.tvlUsd < minTvl) return false;

        // Must be on a chain we care about
        if (!TARGET_CHAINS.includes(y.chain)) return false;

        // Must have decent APY
        if (y.apy < minApy) return false;

        // Filter out obviously unsustainable APYs (likely scams)
        if (y.apy > 1000) return false;

        return true;
      })
      .sort((a, b) => {
        // Sort by risk-adjusted return (TVL * APY)
        const scoreA = a.tvlUsd * Math.min(a.apy, 100);
        const scoreB = b.tvlUsd * Math.min(b.apy, 100);
        return scoreB - scoreA;
      })
      .slice(0, 50); // Top 50 opportunities
  }

  private protocolToRawDiscovery(protocol: DefiProtocol): RawDiscovery {
    const changeStr = protocol.change_1d
      ? `${protocol.change_1d > 0 ? "+" : ""}${protocol.change_1d.toFixed(1)}%`
      : "";

    return {
      sourceId: `defillama:protocol:${protocol.id}`,
      sourceUrl: protocol.url || `https://defillama.com/protocol/${protocol.id}`,
      title: `[DeFi] ${protocol.name} - $${this.formatNumber(protocol.tvl)} TVL ${changeStr}`,
      description: protocol.description || `${protocol.category} on ${protocol.chains.join(", ")}`,
      author: protocol.name,
      authorUrl: protocol.twitter ? `https://twitter.com/${protocol.twitter}` : undefined,
      publishedAt: undefined,
      metrics: {
        points: protocol.tvl,
        views: protocol.mcap,
      },
      metadata: protocol as unknown as Record<string, unknown>,
    };
  }

  private yieldToRawDiscovery(pool: YieldPool): RawDiscovery {
    return {
      sourceId: `defillama:yield:${pool.pool}`,
      sourceUrl: `https://defillama.com/yields/pool/${pool.pool}`,
      title: `[Yield] ${pool.project} ${pool.symbol} - ${pool.apy.toFixed(1)}% APY on ${pool.chain}`,
      description: `TVL: $${this.formatNumber(pool.tvlUsd)} | ${pool.stablecoin ? "Stablecoin" : "Volatile"} | IL Risk: ${pool.ilRisk}`,
      author: pool.project,
      publishedAt: undefined,
      metrics: {
        points: pool.tvlUsd,
        likes: pool.apy,
      },
      metadata: pool as unknown as Record<string, unknown>,
    };
  }

  private categorize(text: string, metadata?: DefiProtocol | YieldPool): HuntDiscovery["category"] {
    if ("category" in (metadata ?? {})) {
      const cat = (metadata as DefiProtocol).category?.toLowerCase();
      if (cat?.includes("dex") || cat?.includes("swap")) return "defi";
      if (cat?.includes("lending") || cat?.includes("cdp")) return "defi";
    }
    if ("apy" in (metadata ?? {})) return "defi";
    return "defi";
  }

  private extractTags(text: string, metadata?: DefiProtocol | YieldPool): string[] {
    const tags: string[] = ["defi", "tvl"];

    if (metadata && "chains" in metadata) {
      tags.push(...(metadata as DefiProtocol).chains.slice(0, 3).map((c) => c.toLowerCase()));
      if ((metadata as DefiProtocol).category) {
        tags.push((metadata as DefiProtocol).category.toLowerCase());
      }
    }

    if (metadata && "chain" in metadata) {
      tags.push((metadata as YieldPool).chain.toLowerCase());
      tags.push("yield");
      if ((metadata as YieldPool).stablecoin) tags.push("stablecoin");
    }

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private hasSignificantChange(metadata?: DefiProtocol | YieldPool): boolean {
    if (!metadata) return false;
    if ("change_1d" in metadata) {
      return Math.abs((metadata as DefiProtocol).change_1d ?? 0) > 5;
    }
    if ("apyPct1D" in metadata) {
      return Math.abs((metadata as YieldPool).apyPct1D ?? 0) > 10;
    }
    return false;
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `defillama:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
