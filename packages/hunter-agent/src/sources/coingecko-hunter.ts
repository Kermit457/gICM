/**
 * CoinGecko Hunter - Market data, trending coins, and category tracking
 *
 * Free tier: 50 calls/min (no API key required for demo mode)
 * Pro tier: Higher limits with API key
 *
 * Endpoints used:
 * - /search/trending - Trending coins (7 coins)
 * - /coins/markets - Top coins by market cap
 * - /coins/categories - DeFi, NFT, Gaming categories
 * - /global - Global market data
 */

import {
  type BaseHunterSource,
  type RawDiscovery,
  type HuntDiscovery,
  type HunterConfig,
  RELEVANCE_KEYWORDS,
} from "../types.js";
import { createHash } from "crypto";

// CoinGecko API types
interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
    data?: {
      price: number;
      price_change_percentage_24h?: {
        usd?: number;
      };
      market_cap?: string;
      total_volume?: string;
    };
  };
}

interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

interface Category {
  id: string;
  name: string;
  market_cap: number;
  market_cap_change_24h: number;
  content: string;
  top_3_coins: string[];
  volume_24h: number;
  updated_at: string;
}

interface GlobalData {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

// Thresholds for significant events
const THRESHOLDS = {
  PRICE_CHANGE_SIGNIFICANT: 5, // 5% move is notable
  PRICE_CHANGE_MAJOR: 10, // 10% move is major
  MARKET_CAP_RANK_TOP: 100, // Track top 100 coins
  TRENDING_SCORE_MIN: 0, // Include all trending (already filtered by CG)
  VOLUME_SPIKE_MULTIPLIER: 2, // 2x average volume
  CATEGORY_GROWTH_SIGNIFICANT: 3, // 3% category growth
};

export class CoinGeckoHunter implements BaseHunterSource {
  source = "coingecko" as const;
  private config: HunterConfig;
  private lastGlobalData: GlobalData["data"] | null = null;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    try {
      // Parallel fetch all data
      const [trending, topMovers, categories, globalData] = await Promise.all([
        this.fetchTrending(),
        this.fetchTopMovers(),
        this.fetchHotCategories(),
        this.fetchGlobalData(),
      ]);

      // Process trending coins
      for (const coin of trending) {
        const discovery = this.createCoinDiscovery(coin, "trending");
        if (discovery) discoveries.push(discovery);
      }

      // Process top movers (significant price changes)
      for (const coin of topMovers) {
        const discovery = this.createMarketDiscovery(coin);
        if (discovery) discoveries.push(discovery);
      }

      // Process hot categories
      for (const category of categories) {
        const discovery = this.createCategoryDiscovery(category);
        if (discovery) discoveries.push(discovery);
      }

      // Process global market shifts
      if (globalData) {
        const globalDiscovery = this.createGlobalDiscovery(globalData);
        if (globalDiscovery) discoveries.push(globalDiscovery);
        this.lastGlobalData = globalData;
      }
    } catch (error) {
      console.error("[CoinGeckoHunter] Hunt failed:", error);
    }

    return discoveries;
  }

  private async fetchTrending(): Promise<TrendingCoin[]> {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/search/trending`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.warn(`[CoinGecko] Trending fetch failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.coins || [];
    } catch (error) {
      console.error("[CoinGecko] Trending error:", error);
      return [];
    }
  }

  private async fetchTopMovers(): Promise<MarketCoin[]> {
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[CoinGecko] Markets fetch failed: ${response.status}`);
        return [];
      }

      const coins: MarketCoin[] = await response.json();

      // Filter to significant movers only
      return coins.filter(
        (coin) =>
          Math.abs(coin.price_change_percentage_24h) >= THRESHOLDS.PRICE_CHANGE_SIGNIFICANT
      );
    } catch (error) {
      console.error("[CoinGecko] Markets error:", error);
      return [];
    }
  }

  private async fetchHotCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/coins/categories`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.warn(`[CoinGecko] Categories fetch failed: ${response.status}`);
        return [];
      }

      const categories: Category[] = await response.json();

      // Filter to categories with significant growth
      return categories
        .filter(
          (cat) =>
            Math.abs(cat.market_cap_change_24h) >= THRESHOLDS.CATEGORY_GROWTH_SIGNIFICANT
        )
        .slice(0, 10); // Top 10 moving categories
    } catch (error) {
      console.error("[CoinGecko] Categories error:", error);
      return [];
    }
  }

  private async fetchGlobalData(): Promise<GlobalData["data"] | null> {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/global`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.warn(`[CoinGecko] Global fetch failed: ${response.status}`);
        return null;
      }

      const data: GlobalData = await response.json();
      return data.data;
    } catch (error) {
      console.error("[CoinGecko] Global error:", error);
      return null;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Add API key if provided (Pro tier)
    if (this.config.apiKey) {
      headers["x-cg-pro-api-key"] = this.config.apiKey;
    }

    return headers;
  }

  private createCoinDiscovery(
    coin: TrendingCoin,
    type: "trending"
  ): RawDiscovery | null {
    const item = coin.item;
    const priceChange = item.data?.price_change_percentage_24h?.usd || 0;

    return {
      sourceId: `coingecko-trending-${item.id}`,
      sourceUrl: `https://www.coingecko.com/en/coins/${item.slug}`,
      title: `🔥 ${item.name} (${item.symbol.toUpperCase()}) Trending on CoinGecko`,
      description: `Ranked #${item.score + 1} in trending. Market cap rank: #${item.market_cap_rank || "N/A"}. ${priceChange > 0 ? `+${priceChange.toFixed(2)}%` : `${priceChange.toFixed(2)}%`} in 24h.`,
      publishedAt: new Date(),
      metrics: {
        points: item.score,
        views: item.market_cap_rank,
      },
      metadata: {
        type: "trending_coin",
        coinId: item.id,
        symbol: item.symbol,
        name: item.name,
        marketCapRank: item.market_cap_rank,
        trendingScore: item.score,
        priceBtc: item.price_btc,
        priceUsd: item.data?.price,
        priceChange24h: priceChange,
        marketCap: item.data?.market_cap,
        volume: item.data?.total_volume,
      },
    };
  }

  private createMarketDiscovery(coin: MarketCoin): RawDiscovery | null {
    const changePercent = coin.price_change_percentage_24h;
    const direction = changePercent > 0 ? "📈" : "📉";
    const isMajor = Math.abs(changePercent) >= THRESHOLDS.PRICE_CHANGE_MAJOR;

    return {
      sourceId: `coingecko-market-${coin.id}-${Date.now()}`,
      sourceUrl: `https://www.coingecko.com/en/coins/${coin.id}`,
      title: `${direction} ${coin.name} ${isMajor ? "MAJOR MOVE:" : ""} ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
      description: `${coin.symbol.toUpperCase()} is ${changePercent > 0 ? "up" : "down"} ${Math.abs(changePercent).toFixed(2)}% in 24h. Price: $${coin.current_price.toLocaleString()}. Market cap: $${(coin.market_cap / 1e9).toFixed(2)}B (#${coin.market_cap_rank}).`,
      publishedAt: new Date(coin.last_updated),
      metrics: {
        views: coin.market_cap_rank,
        likes: Math.round(coin.total_volume / 1e6), // Volume in millions as engagement proxy
      },
      metadata: {
        type: "price_move",
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.current_price,
        priceChange24h: changePercent,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        volume24h: coin.total_volume,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athChangePercent: coin.ath_change_percentage,
        isMajorMove: isMajor,
      },
    };
  }

  private createCategoryDiscovery(category: Category): RawDiscovery | null {
    const changePercent = category.market_cap_change_24h;
    const direction = changePercent > 0 ? "🚀" : "⬇️";

    return {
      sourceId: `coingecko-category-${category.id}-${Date.now()}`,
      sourceUrl: `https://www.coingecko.com/en/categories/${category.id}`,
      title: `${direction} ${category.name} Category ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% (24h)`,
      description: `${category.name} sector ${changePercent > 0 ? "growing" : "declining"}. Total market cap: $${(category.market_cap / 1e9).toFixed(2)}B. 24h volume: $${(category.volume_24h / 1e9).toFixed(2)}B.`,
      publishedAt: new Date(category.updated_at),
      metrics: {
        views: Math.round(category.market_cap / 1e9),
        likes: Math.round(category.volume_24h / 1e6),
      },
      metadata: {
        type: "category_move",
        categoryId: category.id,
        categoryName: category.name,
        marketCap: category.market_cap,
        marketCapChange24h: changePercent,
        volume24h: category.volume_24h,
        topCoins: category.top_3_coins,
        content: category.content,
      },
    };
  }

  private createGlobalDiscovery(
    global: GlobalData["data"]
  ): RawDiscovery | null {
    const changePercent = global.market_cap_change_percentage_24h_usd;

    // Only report if significant change or first run
    if (
      this.lastGlobalData &&
      Math.abs(changePercent) < THRESHOLDS.PRICE_CHANGE_SIGNIFICANT
    ) {
      return null;
    }

    const totalMarketCap = global.total_market_cap.usd / 1e12; // In trillions
    const btcDominance = global.market_cap_percentage.btc;
    const ethDominance = global.market_cap_percentage.eth;

    return {
      sourceId: `coingecko-global-${global.updated_at}`,
      sourceUrl: "https://www.coingecko.com/en/global-charts",
      title: `🌍 Crypto Market ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% | $${totalMarketCap.toFixed(2)}T Total`,
      description: `Global crypto market cap: $${totalMarketCap.toFixed(2)}T (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% 24h). BTC dominance: ${btcDominance.toFixed(1)}%. ETH dominance: ${ethDominance.toFixed(1)}%. Active cryptos: ${global.active_cryptocurrencies.toLocaleString()}.`,
      publishedAt: new Date(global.updated_at * 1000),
      metrics: {
        views: global.active_cryptocurrencies,
        likes: global.markets,
      },
      metadata: {
        type: "global_market",
        totalMarketCapUsd: global.total_market_cap.usd,
        totalVolumeUsd: global.total_volume.usd,
        marketCapChange24h: changePercent,
        btcDominance,
        ethDominance,
        activeCryptocurrencies: global.active_cryptocurrencies,
        markets: global.markets,
        dominanceBreakdown: global.market_cap_percentage,
      },
    };
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata as Record<string, unknown> || {};

    // Detect relevance
    const hasWeb3Keywords = RELEVANCE_KEYWORDS.web3.some((k) =>
      text.includes(k.toLowerCase())
    );
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some((k) =>
      text.includes(k.toLowerCase())
    );
    const hasSolanaKeywords = RELEVANCE_KEYWORDS.solana.some((k) =>
      text.includes(k.toLowerCase())
    );
    const hasEthereumKeywords = RELEVANCE_KEYWORDS.ethereum.some((k) =>
      text.includes(k.toLowerCase())
    );

    // High engagement = top 50 or major price move
    const marketCapRank = typeof metadata.marketCapRank === 'number' ? metadata.marketCapRank : null;
    const highEngagement =
      (marketCapRank !== null && marketCapRank <= 50) ||
      metadata.isMajorMove === true ||
      metadata.type === "trending_coin";

    // Determine category
    let category: "web3" | "defi" | "ai" | "nft" | "tooling" | "other" =
      "web3";
    if (metadata.categoryName) {
      const catName = String(metadata.categoryName).toLowerCase();
      if (catName.includes("defi") || catName.includes("lending")) {
        category = "defi";
      } else if (catName.includes("nft") || catName.includes("gaming")) {
        category = "nft";
      } else if (catName.includes("ai") || catName.includes("artificial")) {
        category = "ai";
      }
    }

    // Generate tags
    const tags: string[] = ["crypto", "market-data"];
    if (metadata.type === "trending_coin") tags.push("trending");
    if (metadata.type === "price_move") tags.push("price-action");
    if (metadata.type === "category_move") tags.push("sector-rotation");
    if (metadata.type === "global_market") tags.push("macro");
    if (metadata.symbol) tags.push(String(metadata.symbol).toLowerCase());
    if (hasSolanaKeywords) tags.push("solana");
    if (hasEthereumKeywords) tags.push("ethereum");

    // Fingerprint for deduplication
    const fingerprint = createHash("md5")
      .update(`${raw.sourceId}-${raw.title}`)
      .digest("hex")
      .slice(0, 16);

    return {
      id: `coingecko-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: this.source,
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
        hasEthereumKeywords,
        hasTypeScript: false,
        recentActivity: true, // Always recent from CoinGecko
        highEngagement,
        isShowHN: false,
      },
      rawMetadata: raw.metadata,
      fingerprint,
    };
  }
}
