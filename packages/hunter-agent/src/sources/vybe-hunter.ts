/**
 * Vybe Network Hunter - Enterprise Solana Data Platform
 *
 * FREE TIER: 4 req/min, 12,000 credits/month
 * Base URL: https://api.vybenetwork.xyz
 * Auth: API Key required (sign up with wallet)
 *
 * Provides:
 * - Wallet PnL calculations
 * - Token holder distribution
 * - Trading activity
 * - Labeled wallets (CEXs, KOLs, treasuries)
 * - TVL metrics
 * - Pyth Oracle prices
 */

import {
  type BaseHunterSource,
  type RawDiscovery,
  type HuntDiscovery,
  type HunterConfig,
  RELEVANCE_KEYWORDS,
} from "../types.js";
import { createHash } from "crypto";

// Vybe API types
interface VybeWalletPnL {
  address: string;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  profitable_trades: number;
  average_trade_size: number;
  largest_win: number;
  largest_loss: number;
  last_updated: string;
}

interface VybeTokenBalance {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  usd_value: number;
  price: number;
  logo_uri?: string;
}

interface VybeTokenHolder {
  address: string;
  amount: number;
  percentage: number;
  rank: number;
  label?: string;
  is_known_entity: boolean;
  entity_type?: "cex" | "kol" | "treasury" | "protocol" | "unknown";
}

interface VybeTokenDetails {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  holders: number;
  price?: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_24h?: number;
  logo_uri?: string;
  description?: string;
  website?: string;
  twitter?: string;
}

interface VybeTokenTrade {
  signature: string;
  timestamp: number;
  mint: string;
  symbol: string;
  side: "buy" | "sell";
  amount_token: number;
  amount_sol: number;
  price_usd: number;
  wallet: string;
  wallet_label?: string;
  dex: string;
}

interface VybeProgramTVL {
  program_id: string;
  name: string;
  tvl_usd: number;
  tvl_sol: number;
  change_24h: number;
  change_7d: number;
}

interface VybePythPrice {
  symbol: string;
  price: number;
  confidence: number;
  timestamp: number;
  ema_price: number;
}

const VYBE_BASE_URL = "https://api.vybenetwork.xyz";

export class VybeHunter implements BaseHunterSource {
  source = "vybe" as const;
  private config: HunterConfig;
  private apiKey: string | null;

  constructor(config: HunterConfig) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.VYBE_API_KEY || null;
    if (!this.apiKey) {
      console.warn(
        "[VybeHunter] No API key provided. Set VYBE_API_KEY in environment or config."
      );
    }
  }

  async hunt(): Promise<RawDiscovery[]> {
    if (!this.apiKey) {
      console.warn("[VybeHunter] Skipping hunt - no API key");
      return [];
    }

    // Vybe is primarily used for on-demand queries
    // The hunter can track whale wallets if configured
    const discoveries: RawDiscovery[] = [];

    try {
      // If whale wallets are configured, track their activity
      const trackedWallets = this.config.filters?.keywords || [];

      for (const wallet of trackedWallets.slice(0, 3)) {
        // Limit to avoid rate limits
        if (wallet.length === 44 || wallet.length === 43) {
          // Solana address length
          const pnl = await this.fetchWalletPnL(wallet);
          if (pnl) {
            const discovery = this.createPnLDiscovery(pnl);
            if (discovery) discoveries.push(discovery);
          }
        }
      }
    } catch (error) {
      console.error("[VybeHunter] Hunt failed:", error);
    }

    return discoveries;
  }

  /**
   * Get wallet PnL and trading stats
   */
  async fetchWalletPnL(address: string): Promise<VybeWalletPnL | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/account/wallet-pnl?address=${address}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[Vybe] Wallet PnL fetch failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[Vybe] Wallet PnL error:", error);
      return null;
    }
  }

  /**
   * Get token balances for a wallet
   */
  async fetchTokenBalances(address: string): Promise<VybeTokenBalance[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/account/token-balances?address=${address}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[Vybe] Token balances fetch failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.balances || data || [];
    } catch (error) {
      console.error("[Vybe] Token balances error:", error);
      return [];
    }
  }

  /**
   * Get top holders for a token
   */
  async fetchTokenHolders(mint: string): Promise<VybeTokenHolder[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/tokens/top-holders?mint=${mint}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[Vybe] Token holders fetch failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.holders || data || [];
    } catch (error) {
      console.error("[Vybe] Token holders error:", error);
      return [];
    }
  }

  /**
   * Get token details
   */
  async fetchTokenDetails(mint: string): Promise<VybeTokenDetails | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/tokens/token-details?mint=${mint}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[Vybe] Token details fetch failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[Vybe] Token details error:", error);
      return null;
    }
  }

  /**
   * Get recent trades for a token
   */
  async fetchTokenTrades(
    mint: string,
    limit: number = 50
  ): Promise<VybeTokenTrade[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/tokens/token-trades?mint=${mint}&limit=${limit}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[Vybe] Token trades fetch failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.trades || data || [];
    } catch (error) {
      console.error("[Vybe] Token trades error:", error);
      return [];
    }
  }

  /**
   * Get TVL for a program
   */
  async fetchProgramTVL(programId: string): Promise<VybeProgramTVL | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/programs/program-tvl?program_id=${programId}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[Vybe] Program TVL fetch failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[Vybe] Program TVL error:", error);
      return null;
    }
  }

  /**
   * Get Pyth Oracle price
   */
  async fetchPythPrice(symbol: string): Promise<VybePythPrice | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${VYBE_BASE_URL}/prices/pyth-price?symbol=${symbol}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[Vybe] Pyth price fetch failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[Vybe] Pyth price error:", error);
      return null;
    }
  }

  /**
   * Get market data
   */
  async fetchMarkets(): Promise<any[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${VYBE_BASE_URL}/prices/markets`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.warn(`[Vybe] Markets fetch failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.markets || data || [];
    } catch (error) {
      console.error("[Vybe] Markets error:", error);
      return [];
    }
  }

  /**
   * Check if wallet is profitable
   */
  async isWalletProfitable(address: string): Promise<{
    profitable: boolean;
    totalPnL: number;
    winRate: number;
    trades: number;
  }> {
    const pnl = await this.fetchWalletPnL(address);
    if (!pnl) {
      return { profitable: false, totalPnL: 0, winRate: 0, trades: 0 };
    }

    return {
      profitable: pnl.total_pnl > 0,
      totalPnL: pnl.total_pnl,
      winRate: pnl.win_rate,
      trades: pnl.total_trades,
    };
  }

  /**
   * Get concentration risk for a token
   */
  async getConcentrationRisk(mint: string): Promise<{
    topHolderPercent: number;
    top10Percent: number;
    whaleCount: number;
    risk: "low" | "medium" | "high";
  }> {
    const holders = await this.fetchTokenHolders(mint);
    if (holders.length === 0) {
      return { topHolderPercent: 0, top10Percent: 0, whaleCount: 0, risk: "high" };
    }

    const topHolderPercent = holders[0]?.percentage || 0;
    const top10Percent = holders
      .slice(0, 10)
      .reduce((sum, h) => sum + h.percentage, 0);
    const whaleCount = holders.filter((h) => h.percentage > 5).length;

    let risk: "low" | "medium" | "high" = "low";
    if (topHolderPercent > 50 || top10Percent > 80) risk = "high";
    else if (topHolderPercent > 20 || top10Percent > 60) risk = "medium";

    return { topHolderPercent, top10Percent, whaleCount, risk };
  }

  private getHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private createPnLDiscovery(pnl: VybeWalletPnL): RawDiscovery | null {
    const profitEmoji = pnl.total_pnl > 0 ? "💰" : "📉";
    const pnlFormatted =
      pnl.total_pnl > 0
        ? `+$${pnl.total_pnl.toLocaleString()}`
        : `-$${Math.abs(pnl.total_pnl).toLocaleString()}`;

    return {
      sourceId: `vybe-pnl-${pnl.address}-${Date.now()}`,
      sourceUrl: `https://vybeapp.xyz/wallet/${pnl.address}`,
      title: `${profitEmoji} Wallet ${pnl.address.slice(0, 8)}... PnL: ${pnlFormatted}`,
      description: `Total PnL: ${pnlFormatted}. Win rate: ${(pnl.win_rate * 100).toFixed(1)}%. Trades: ${pnl.total_trades}. Largest win: $${pnl.largest_win.toLocaleString()}. Largest loss: $${Math.abs(pnl.largest_loss).toLocaleString()}.`,
      publishedAt: new Date(pnl.last_updated),
      metrics: {
        points: Math.round(pnl.win_rate * 100),
        likes: pnl.profitable_trades,
      },
      metadata: {
        type: "wallet_pnl",
        source: "vybe",
        address: pnl.address,
        realizedPnl: pnl.realized_pnl,
        unrealizedPnl: pnl.unrealized_pnl,
        totalPnl: pnl.total_pnl,
        winRate: pnl.win_rate,
        totalTrades: pnl.total_trades,
        profitableTrades: pnl.profitable_trades,
        averageTradeSize: pnl.average_trade_size,
        largestWin: pnl.largest_win,
        largestLoss: pnl.largest_loss,
        isProfitable: pnl.total_pnl > 0,
      },
    };
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = (raw.metadata as Record<string, unknown>) || {};

    // Always Solana and Web3 relevant
    const hasWeb3Keywords = true;
    const hasSolanaKeywords = true;
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some((k) =>
      text.includes(k.toLowerCase())
    );

    // High engagement = profitable wallet
    const highEngagement =
      metadata.isProfitable === true || (metadata.winRate as number) > 0.6;

    // Category
    let category: "web3" | "defi" | "ai" | "nft" | "tooling" | "other" = "defi";

    // Tags
    const tags: string[] = ["solana", "wallet", "analytics", "vybe"];
    if (metadata.isProfitable) tags.push("profitable");
    if ((metadata.winRate as number) > 0.6) tags.push("high-win-rate");

    // Fingerprint
    const fingerprint = createHash("md5")
      .update(`${raw.sourceId}-${raw.title}`)
      .digest("hex")
      .slice(0, 16);

    return {
      id: `vybe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "vybe" as any,
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
  VybeWalletPnL,
  VybeTokenBalance,
  VybeTokenHolder,
  VybeTokenDetails,
  VybeTokenTrade,
  VybeProgramTVL,
  VybePythPrice,
};
