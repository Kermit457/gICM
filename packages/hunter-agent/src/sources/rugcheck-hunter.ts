/**
 * RugCheck Hunter - Token Safety Scanner for Solana
 *
 * FREE API - No authentication required
 * Base URL: https://api.rugcheck.xyz
 *
 * Provides:
 * - Token safety reports
 * - Scam detection
 * - Trending/new tokens
 * - Community voting data
 */

import {
  type BaseHunterSource,
  type RawDiscovery,
  type HuntDiscovery,
  type HunterConfig,
  RELEVANCE_KEYWORDS,
} from "../types.js";
import { createHash } from "crypto";

// RugCheck API types
interface RugCheckReport {
  mint: string;
  tokenMeta?: {
    name: string;
    symbol: string;
    uri?: string;
    mutable: boolean;
    updateAuthority?: string;
  };
  token?: {
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    mintAuthority?: string;
    freezeAuthority?: string;
  };
  risks: RugCheckRisk[];
  score: number;
  rugged: boolean;
  markets?: RugCheckMarket[];
  topHolders?: RugCheckHolder[];
  fileMeta?: {
    description?: string;
    image?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

interface RugCheckRisk {
  name: string;
  description: string;
  level: "warn" | "danger" | "info";
  score: number;
}

interface RugCheckMarket {
  pubkey: string;
  marketType: string;
  lpMint?: string;
  liquidityA?: number;
  liquidityB?: number;
}

interface RugCheckHolder {
  address: string;
  amount: number;
  pct: number;
  insider: boolean;
}

interface RugCheckSummary {
  mint: string;
  score: number;
  risks: string[];
  rugged: boolean;
}

interface RugCheckTrendingToken {
  mint: string;
  name: string;
  symbol: string;
  score: number;
  votes: number;
  views: number;
}

interface RugCheckNewToken {
  mint: string;
  name: string;
  symbol: string;
  createdAt: string;
  score?: number;
}

const RUGCHECK_BASE_URL = "https://api.rugcheck.xyz/v1";

// Risk level thresholds
const THRESHOLDS = {
  SAFE_SCORE: 80, // Score >= 80 is considered safe
  RISKY_SCORE: 50, // Score < 50 is risky
  DANGER_SCORE: 30, // Score < 30 is dangerous
};

export class RugCheckHunter implements BaseHunterSource {
  source = "rugcheck" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    try {
      // Parallel fetch trending and new tokens
      const [trending, newTokens, verified] = await Promise.all([
        this.fetchTrendingTokens(),
        this.fetchNewTokens(),
        this.fetchVerifiedTokens(),
      ]);

      // Process trending tokens
      for (const token of trending.slice(0, 10)) {
        const discovery = this.createTrendingDiscovery(token);
        if (discovery) discoveries.push(discovery);
      }

      // Process new tokens (potential opportunities or scams)
      for (const token of newTokens.slice(0, 20)) {
        const discovery = this.createNewTokenDiscovery(token);
        if (discovery) discoveries.push(discovery);
      }

      // Process verified safe tokens
      for (const token of verified.slice(0, 5)) {
        const discovery = this.createVerifiedDiscovery(token);
        if (discovery) discoveries.push(discovery);
      }
    } catch (error) {
      console.error("[RugCheckHunter] Hunt failed:", error);
    }

    return discoveries;
  }

  /**
   * Get detailed safety report for a specific token
   */
  async getTokenReport(mint: string): Promise<RugCheckReport | null> {
    try {
      const response = await fetch(
        `${RUGCHECK_BASE_URL}/tokens/${mint}/report`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        console.warn(`[RugCheck] Report fetch failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[RugCheck] Report error:", error);
      return null;
    }
  }

  /**
   * Get quick safety summary for a token
   */
  async getTokenSummary(mint: string): Promise<RugCheckSummary | null> {
    try {
      const response = await fetch(
        `${RUGCHECK_BASE_URL}/tokens/${mint}/report/summary`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        console.warn(`[RugCheck] Summary fetch failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[RugCheck] Summary error:", error);
      return null;
    }
  }

  /**
   * Check if a token is safe (score >= 80)
   */
  async isTokenSafe(mint: string): Promise<{
    safe: boolean;
    score: number;
    risks: string[];
    rugged: boolean;
  }> {
    const summary = await this.getTokenSummary(mint);
    if (!summary) {
      return { safe: false, score: 0, risks: ["Unable to fetch data"], rugged: false };
    }

    return {
      safe: summary.score >= THRESHOLDS.SAFE_SCORE && !summary.rugged,
      score: summary.score,
      risks: summary.risks,
      rugged: summary.rugged,
    };
  }

  private async fetchTrendingTokens(): Promise<RugCheckTrendingToken[]> {
    try {
      const response = await fetch(`${RUGCHECK_BASE_URL}/stats/trending`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.warn(`[RugCheck] Trending fetch failed: ${response.status}`);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("[RugCheck] Trending error:", error);
      return [];
    }
  }

  private async fetchNewTokens(): Promise<RugCheckNewToken[]> {
    try {
      const response = await fetch(`${RUGCHECK_BASE_URL}/stats/new_tokens`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.warn(`[RugCheck] New tokens fetch failed: ${response.status}`);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("[RugCheck] New tokens error:", error);
      return [];
    }
  }

  private async fetchVerifiedTokens(): Promise<RugCheckTrendingToken[]> {
    try {
      const response = await fetch(`${RUGCHECK_BASE_URL}/stats/verified`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.warn(`[RugCheck] Verified fetch failed: ${response.status}`);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("[RugCheck] Verified error:", error);
      return [];
    }
  }

  private createTrendingDiscovery(
    token: RugCheckTrendingToken
  ): RawDiscovery | null {
    const safetyEmoji = this.getSafetyEmoji(token.score);
    const safetyLabel = this.getSafetyLabel(token.score);

    return {
      sourceId: `rugcheck-trending-${token.mint}`,
      sourceUrl: `https://rugcheck.xyz/tokens/${token.mint}`,
      title: `${safetyEmoji} ${token.name} (${token.symbol}) - ${safetyLabel} | Score: ${token.score}/100`,
      description: `Trending on RugCheck. Safety score: ${token.score}/100. Views: ${token.views?.toLocaleString() || "N/A"}. Community votes: ${token.votes || 0}.`,
      publishedAt: new Date(),
      metrics: {
        points: token.score,
        views: token.views,
        likes: token.votes,
      },
      metadata: {
        type: "trending_safety",
        source: "rugcheck",
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        safetyScore: token.score,
        safetyLabel,
        views: token.views,
        votes: token.votes,
        isSafe: token.score >= THRESHOLDS.SAFE_SCORE,
        isRisky: token.score < THRESHOLDS.RISKY_SCORE,
      },
    };
  }

  private createNewTokenDiscovery(token: RugCheckNewToken): RawDiscovery | null {
    const safetyEmoji = token.score ? this.getSafetyEmoji(token.score) : "🆕";
    const safetyLabel = token.score
      ? this.getSafetyLabel(token.score)
      : "UNSCANNED";

    return {
      sourceId: `rugcheck-new-${token.mint}`,
      sourceUrl: `https://rugcheck.xyz/tokens/${token.mint}`,
      title: `${safetyEmoji} NEW: ${token.name} (${token.symbol}) - ${safetyLabel}`,
      description: `New token detected. ${token.score ? `Safety score: ${token.score}/100.` : "Not yet scanned."} Created: ${new Date(token.createdAt).toLocaleString()}.`,
      publishedAt: new Date(token.createdAt),
      metrics: {
        points: token.score || 0,
      },
      metadata: {
        type: "new_token",
        source: "rugcheck",
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        safetyScore: token.score,
        safetyLabel,
        createdAt: token.createdAt,
        isNew: true,
        needsScan: !token.score,
      },
    };
  }

  private createVerifiedDiscovery(
    token: RugCheckTrendingToken
  ): RawDiscovery | null {
    return {
      sourceId: `rugcheck-verified-${token.mint}`,
      sourceUrl: `https://rugcheck.xyz/tokens/${token.mint}`,
      title: `✅ VERIFIED: ${token.name} (${token.symbol}) - Score: ${token.score}/100`,
      description: `Verified safe token. Safety score: ${token.score}/100. Community-vetted and approved.`,
      publishedAt: new Date(),
      metrics: {
        points: token.score,
        views: token.views,
        likes: token.votes,
      },
      metadata: {
        type: "verified_safe",
        source: "rugcheck",
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        safetyScore: token.score,
        verified: true,
        views: token.views,
        votes: token.votes,
      },
    };
  }

  private getSafetyEmoji(score: number): string {
    if (score >= THRESHOLDS.SAFE_SCORE) return "✅";
    if (score >= THRESHOLDS.RISKY_SCORE) return "⚠️";
    if (score >= THRESHOLDS.DANGER_SCORE) return "🔴";
    return "☠️";
  }

  private getSafetyLabel(score: number): string {
    if (score >= THRESHOLDS.SAFE_SCORE) return "SAFE";
    if (score >= THRESHOLDS.RISKY_SCORE) return "MODERATE RISK";
    if (score >= THRESHOLDS.DANGER_SCORE) return "HIGH RISK";
    return "DANGER";
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = (raw.metadata as Record<string, unknown>) || {};

    // Always web3/crypto relevant
    const hasWeb3Keywords = true;
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some((k) =>
      text.includes(k.toLowerCase())
    );
    const hasSolanaKeywords = true; // RugCheck is Solana-specific

    // High engagement = safe tokens or trending
    const highEngagement =
      metadata.verified === true ||
      metadata.isSafe === true ||
      (metadata.views as number) > 1000;

    // Determine category
    let category: "web3" | "defi" | "ai" | "nft" | "tooling" | "other" = "web3";
    if (metadata.type === "verified_safe") category = "defi";

    // Generate tags
    const tags: string[] = ["solana", "safety", "rugcheck"];
    if (metadata.verified) tags.push("verified");
    if (metadata.isSafe) tags.push("safe");
    if (metadata.isRisky) tags.push("risky");
    if (metadata.isNew) tags.push("new-token");
    if (metadata.symbol) tags.push(String(metadata.symbol).toLowerCase());

    // Fingerprint
    const fingerprint = createHash("md5")
      .update(`${raw.sourceId}-${raw.title}`)
      .digest("hex")
      .slice(0, 16);

    return {
      id: `rugcheck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "rugcheck" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
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
export type {
  RugCheckReport,
  RugCheckRisk,
  RugCheckSummary,
  RugCheckTrendingToken,
  RugCheckNewToken,
};
