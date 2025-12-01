/**
 * Pump.fun Hunter - Memecoin Launch Tracker for Solana
 *
 * FREE API - No authentication required
 * Base URL: https://frontend-api.pump.fun
 *
 * Provides:
 * - New memecoin launches
 * - Bonding curve data
 * - King of the Hill tracking
 * - Token details and metadata
 */

import {
  type BaseHunterSource,
  type RawDiscovery,
  type HuntDiscovery,
  type HunterConfig,
  RELEVANCE_KEYWORDS,
} from "../types.js";
import { createHash } from "crypto";

// Pump.fun API types
interface PumpFunCoin {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image_uri?: string;
  video_uri?: string;
  metadata_uri?: string;
  twitter?: string;
  telegram?: string;
  bonding_curve: string;
  associated_bonding_curve?: string;
  creator: string;
  created_timestamp: number;
  raydium_pool?: string;
  complete: boolean;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  total_supply: number;
  website?: string;
  show_name: boolean;
  king_of_the_hill_timestamp?: number;
  market_cap?: number;
  reply_count?: number;
  last_reply?: number;
  nsfw: boolean;
  market_id?: string;
  inverted?: boolean;
  usd_market_cap?: number;
}

interface PumpFunKingOfTheHill {
  mint: string;
  name: string;
  symbol: string;
  market_cap: number;
  timestamp: number;
}

const PUMPFUN_BASE_URL = "https://frontend-api.pump.fun";

// Thresholds for significant launches
const THRESHOLDS = {
  HIGH_MARKET_CAP: 100000, // $100k market cap
  MEDIUM_MARKET_CAP: 10000, // $10k market cap
  HIGH_REPLIES: 50, // Many community replies
  GRADUATED: true, // Completed bonding curve
};

export class PumpFunHunter implements BaseHunterSource {
  source = "pumpfun" as const;
  private config: HunterConfig;
  private lastKingOfTheHill: string | null = null;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    try {
      // Parallel fetch new coins and king of the hill
      const [newCoins, kingOfTheHill] = await Promise.all([
        this.fetchNewCoins(),
        this.fetchKingOfTheHill(),
      ]);

      // Process new launches
      for (const coin of newCoins.slice(0, 20)) {
        const discovery = this.createCoinDiscovery(coin, "new");
        if (discovery) discoveries.push(discovery);
      }

      // Process king of the hill (if changed)
      if (kingOfTheHill && kingOfTheHill.mint !== this.lastKingOfTheHill) {
        const kingDiscovery = this.createKingDiscovery(kingOfTheHill);
        if (kingDiscovery) discoveries.push(kingDiscovery);
        this.lastKingOfTheHill = kingOfTheHill.mint;
      }

      // Find graduated tokens (completed bonding curve)
      const graduated = newCoins.filter((c) => c.complete);
      for (const coin of graduated.slice(0, 5)) {
        const discovery = this.createCoinDiscovery(coin, "graduated");
        if (discovery) discoveries.push(discovery);
      }
    } catch (error) {
      console.error("[PumpFunHunter] Hunt failed:", error);
    }

    return discoveries;
  }

  /**
   * Fetch latest coins from Pump.fun
   */
  async fetchNewCoins(limit: number = 50): Promise<PumpFunCoin[]> {
    try {
      const response = await fetch(
        `${PUMPFUN_BASE_URL}/coins?offset=0&limit=${limit}&sort=created_timestamp&order=DESC&includeNsfw=false`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "gICM-Hunter/1.0",
          },
        }
      );

      if (!response.ok) {
        console.warn(`[PumpFun] Coins fetch failed: ${response.status}`);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("[PumpFun] Coins error:", error);
      return [];
    }
  }

  /**
   * Fetch specific coin details
   */
  async getCoinDetails(mint: string): Promise<PumpFunCoin | null> {
    try {
      const response = await fetch(`${PUMPFUN_BASE_URL}/coins/${mint}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "gICM-Hunter/1.0",
        },
      });

      if (!response.ok) {
        console.warn(`[PumpFun] Coin details fetch failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[PumpFun] Coin details error:", error);
      return null;
    }
  }

  /**
   * Fetch current king of the hill
   */
  async fetchKingOfTheHill(): Promise<PumpFunCoin | null> {
    try {
      const response = await fetch(`${PUMPFUN_BASE_URL}/coins/king-of-the-hill`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "gICM-Hunter/1.0",
        },
      });

      if (!response.ok) {
        console.warn(`[PumpFun] King fetch failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[PumpFun] King error:", error);
      return null;
    }
  }

  /**
   * Calculate bonding curve progress
   */
  private getBondingCurveProgress(coin: PumpFunCoin): number {
    // Pump.fun bonding curve completes when ~$69k worth of SOL is raised
    // Virtual reserves give us an idea of progress
    if (coin.complete) return 100;

    // Rough estimation based on virtual reserves
    const targetSol = 85; // ~85 SOL to complete (varies)
    const currentSol = coin.virtual_sol_reserves / 1e9; // Convert lamports to SOL
    return Math.min(100, (currentSol / targetSol) * 100);
  }

  /**
   * Calculate estimated market cap from reserves
   */
  private getEstimatedMarketCap(coin: PumpFunCoin): number {
    if (coin.usd_market_cap) return coin.usd_market_cap;
    if (coin.market_cap) return coin.market_cap;

    // Estimate from virtual reserves (rough calculation)
    const solPrice = 200; // Approximate SOL price, should be fetched dynamically
    const virtualSol = coin.virtual_sol_reserves / 1e9;
    return virtualSol * solPrice * 2; // Rough market cap estimate
  }

  private createCoinDiscovery(
    coin: PumpFunCoin,
    type: "new" | "graduated"
  ): RawDiscovery | null {
    const progress = this.getBondingCurveProgress(coin);
    const marketCap = this.getEstimatedMarketCap(coin);
    const createdAt = new Date(coin.created_timestamp);

    // Skip NSFW content
    if (coin.nsfw) return null;

    const emoji = type === "graduated" ? "🎓" : progress > 50 ? "🚀" : "🆕";
    const statusLabel = coin.complete
      ? "GRADUATED (Raydium)"
      : `${progress.toFixed(0)}% to Raydium`;

    return {
      sourceId: `pumpfun-${type}-${coin.mint}`,
      sourceUrl: `https://pump.fun/${coin.mint}`,
      title: `${emoji} ${coin.name} (${coin.symbol}) - ${statusLabel}`,
      description: `${coin.description?.slice(0, 200) || "New memecoin on Pump.fun"}. Market cap: ~$${(marketCap / 1000).toFixed(1)}k. ${coin.reply_count ? `${coin.reply_count} replies.` : ""} ${coin.twitter ? "Has Twitter." : ""} ${coin.telegram ? "Has Telegram." : ""}`,
      author: coin.creator,
      publishedAt: createdAt,
      metrics: {
        views: coin.reply_count || 0,
        likes: coin.complete ? 100 : Math.floor(progress),
      },
      metadata: {
        type: type === "graduated" ? "graduated_token" : "new_launch",
        source: "pumpfun",
        mint: coin.mint,
        name: coin.name,
        symbol: coin.symbol,
        description: coin.description,
        creator: coin.creator,
        bondingCurve: coin.bonding_curve,
        bondingCurveProgress: progress,
        complete: coin.complete,
        raydiumPool: coin.raydium_pool,
        marketCap,
        virtualSolReserves: coin.virtual_sol_reserves,
        virtualTokenReserves: coin.virtual_token_reserves,
        totalSupply: coin.total_supply,
        imageUri: coin.image_uri,
        twitter: coin.twitter,
        telegram: coin.telegram,
        website: coin.website,
        replyCount: coin.reply_count,
        createdTimestamp: coin.created_timestamp,
        isGraduated: coin.complete,
        hasRaydiumPool: !!coin.raydium_pool,
      },
    };
  }

  private createKingDiscovery(coin: PumpFunCoin): RawDiscovery | null {
    const marketCap = this.getEstimatedMarketCap(coin);

    return {
      sourceId: `pumpfun-king-${coin.mint}-${Date.now()}`,
      sourceUrl: `https://pump.fun/${coin.mint}`,
      title: `👑 NEW KING: ${coin.name} (${coin.symbol}) - Top of Pump.fun`,
      description: `${coin.name} is now King of the Hill on Pump.fun! Market cap: ~$${(marketCap / 1000).toFixed(1)}k. ${coin.description?.slice(0, 150) || ""}`,
      author: coin.creator,
      publishedAt: new Date(),
      metrics: {
        views: coin.reply_count || 0,
        likes: 100,
      },
      metadata: {
        type: "king_of_the_hill",
        source: "pumpfun",
        mint: coin.mint,
        name: coin.name,
        symbol: coin.symbol,
        creator: coin.creator,
        marketCap,
        complete: coin.complete,
        raydiumPool: coin.raydium_pool,
        twitter: coin.twitter,
        telegram: coin.telegram,
        isKing: true,
      },
    };
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = (raw.metadata as Record<string, unknown>) || {};

    // Pump.fun is always Solana and Web3
    const hasWeb3Keywords = true;
    const hasSolanaKeywords = true;
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some((k) =>
      text.includes(k.toLowerCase())
    );

    // High engagement = graduated, king, or high market cap
    const highEngagement =
      metadata.isKing === true ||
      metadata.isGraduated === true ||
      (metadata.marketCap as number) > THRESHOLDS.HIGH_MARKET_CAP;

    // Determine category
    let category: "web3" | "defi" | "ai" | "nft" | "tooling" | "other" = "web3";
    if (metadata.isGraduated) category = "defi";

    // Generate tags
    const tags: string[] = ["solana", "memecoin", "pumpfun"];
    if (metadata.isGraduated) tags.push("graduated", "raydium");
    if (metadata.isKing) tags.push("king-of-the-hill");
    if (metadata.twitter) tags.push("has-twitter");
    if (metadata.telegram) tags.push("has-telegram");
    if (metadata.symbol) tags.push(String(metadata.symbol).toLowerCase());

    // Fingerprint
    const fingerprint = createHash("md5")
      .update(`${raw.sourceId}-${raw.title}`)
      .digest("hex")
      .slice(0, 16);

    return {
      id: `pumpfun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "pumpfun" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category,
      tags,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement,
        isShowHN: false,
      },
      rawMetadata: raw.metadata,
      fingerprint,
    };
  }
}

// Export types for external use
export type { PumpFunCoin, PumpFunKingOfTheHill };
