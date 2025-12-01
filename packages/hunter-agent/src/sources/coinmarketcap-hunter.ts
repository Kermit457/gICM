/**
 * CoinMarketCap Hunter - Market data, trending coins, and historical OHLCV
 *
 * Free tier: 10,000 calls/month, 30 calls/min
 * API Key required
 *
 * Endpoints used:
 * - /cryptocurrency/listings/latest - Top coins by market cap
 * - /cryptocurrency/quotes/latest - Current prices
 * - /cryptocurrency/trending/latest - Trending coins
 * - /global-metrics/quotes/latest - Global market data
 */

import {
  type BaseHunterSource,
  type RawDiscovery,
  type HuntDiscovery,
  type HunterConfig,
  RELEVANCE_KEYWORDS,
} from "../types.js";
import { createHash } from "crypto";

// CoinMarketCap API types
interface CMCCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  num_market_pairs: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  infinite_supply: boolean;
  last_updated: string;
  date_added: string;
  tags: string[];
  platform: {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    token_address: string;
  } | null;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
  };
}

interface CMCTrendingCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

interface CMCGlobalMetrics {
  active_cryptocurrencies: number;
  total_cryptocurrencies: number;
  active_market_pairs: number;
  active_exchanges: number;
  total_exchanges: number;
  eth_dominance: number;
  btc_dominance: number;
  eth_dominance_yesterday: number;
  btc_dominance_yesterday: number;
  defi_volume_24h: number;
  defi_volume_24h_reported: number;
  defi_market_cap: number;
  defi_24h_percentage_change: number;
  stablecoin_volume_24h: number;
  stablecoin_volume_24h_reported: number;
  stablecoin_market_cap: number;
  stablecoin_24h_percentage_change: number;
  derivatives_volume_24h: number;
  derivatives_volume_24h_reported: number;
  derivatives_24h_percentage_change: number;
  quote: {
    USD: {
      total_market_cap: number;
      total_volume_24h: number;
      total_volume_24h_reported: number;
      altcoin_volume_24h: number;
      altcoin_volume_24h_reported: number;
      altcoin_market_cap: number;
      defi_volume_24h: number;
      defi_volume_24h_reported: number;
      defi_24h_percentage_change: number;
      defi_market_cap: number;
      stablecoin_volume_24h: number;
      stablecoin_volume_24h_reported: number;
      stablecoin_24h_percentage_change: number;
      stablecoin_market_cap: number;
      derivatives_volume_24h: number;
      derivatives_volume_24h_reported: number;
      derivatives_24h_percentage_change: number;
      total_market_cap_yesterday: number;
      total_volume_24h_yesterday: number;
      total_market_cap_yesterday_percentage_change: number;
      total_volume_24h_yesterday_percentage_change: number;
      last_updated: string;
    };
  };
  last_updated: string;
}

interface CMCResponse<T> {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: T;
}

const CMC_BASE_URL = "https://pro-api.coinmarketcap.com/v1";

// Thresholds for significant events
const THRESHOLDS = {
  PRICE_CHANGE_SIGNIFICANT: 5, // 5% move is notable
  PRICE_CHANGE_MAJOR: 10, // 10% move is major
  MARKET_CAP_RANK_TOP: 100, // Track top 100 coins
  VOLUME_SPIKE_MULTIPLIER: 2, // 2x average volume
};

export class CoinMarketCapHunter implements BaseHunterSource {
  source = "coinmarketcap" as const;
  private config: HunterConfig;
  private lastGlobalData: CMCGlobalMetrics | null = null;

  constructor(config: HunterConfig) {
    this.config = config;
    if (!config.apiKey) {
      console.warn(
        "[CoinMarketCapHunter] No API key provided. Set COINMARKETCAP_API_KEY in environment."
      );
    }
  }

  async hunt(): Promise<RawDiscovery[]> {
    if (!this.config.apiKey) {
      console.warn("[CoinMarketCapHunter] Skipping hunt - no API key");
      return [];
    }

    const discoveries: RawDiscovery[] = [];

    try {
      // Parallel fetch all data
      const [listings, globalData] = await Promise.all([
        this.fetchListings(),
        this.fetchGlobalMetrics(),
      ]);

      // Process top movers (significant price changes)
      const topMovers = listings.filter(
        (coin) =>
          Math.abs(coin.quote.USD.percent_change_24h) >=
          THRESHOLDS.PRICE_CHANGE_SIGNIFICANT
      );

      for (const coin of topMovers) {
        const discovery = this.createCoinDiscovery(coin);
        if (discovery) discoveries.push(discovery);
      }

      // Process global market data
      if (globalData) {
        const globalDiscovery = this.createGlobalDiscovery(globalData);
        if (globalDiscovery) discoveries.push(globalDiscovery);
        this.lastGlobalData = globalData;
      }
    } catch (error) {
      console.error("[CoinMarketCapHunter] Hunt failed:", error);
    }

    return discoveries;
  }

  private async fetchListings(): Promise<CMCCoin[]> {
    try {
      const response = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/listings/latest?limit=100&convert=USD`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `[CoinMarketCap] Listings fetch failed: ${response.status} - ${errorText}`
        );
        return [];
      }

      const data: CMCResponse<CMCCoin[]> = await response.json();

      if (data.status.error_code !== 0) {
        console.warn(
          `[CoinMarketCap] API error: ${data.status.error_message}`
        );
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error("[CoinMarketCap] Listings error:", error);
      return [];
    }
  }

  private async fetchGlobalMetrics(): Promise<CMCGlobalMetrics | null> {
    try {
      const response = await fetch(
        `${CMC_BASE_URL}/global-metrics/quotes/latest?convert=USD`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(
          `[CoinMarketCap] Global metrics fetch failed: ${response.status}`
        );
        return null;
      }

      const data: CMCResponse<CMCGlobalMetrics> = await response.json();

      if (data.status.error_code !== 0) {
        console.warn(
          `[CoinMarketCap] API error: ${data.status.error_message}`
        );
        return null;
      }

      return data.data;
    } catch (error) {
      console.error("[CoinMarketCap] Global metrics error:", error);
      return null;
    }
  }

  /**
   * Fetch historical OHLCV data for a specific coin
   * Note: This uses additional API credits
   */
  async fetchHistoricalOHLCV(
    symbol: string,
    days: number = 30
  ): Promise<Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    market_cap: number;
  }> | null> {
    if (!this.config.apiKey) {
      console.warn("[CoinMarketCap] No API key for OHLCV fetch");
      return null;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/ohlcv/historical?symbol=${symbol}&time_start=${startDate.toISOString()}&time_end=${endDate.toISOString()}&convert=USD`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(
          `[CoinMarketCap] OHLCV fetch failed: ${response.status}`
        );
        return null;
      }

      const data = await response.json();

      if (data.status.error_code !== 0) {
        console.warn(`[CoinMarketCap] OHLCV error: ${data.status.error_message}`);
        return null;
      }

      return data.data?.quotes?.map((q: any) => ({
        timestamp: q.time_open,
        open: q.quote.USD.open,
        high: q.quote.USD.high,
        low: q.quote.USD.low,
        close: q.quote.USD.close,
        volume: q.quote.USD.volume,
        market_cap: q.quote.USD.market_cap,
      })) || null;
    } catch (error) {
      console.error("[CoinMarketCap] OHLCV error:", error);
      return null;
    }
  }

  /**
   * Fetch current prices for specific symbols
   */
  async fetchPrices(
    symbols: string[]
  ): Promise<Map<string, { price: number; change24h: number; marketCap: number }>> {
    const prices = new Map<string, { price: number; change24h: number; marketCap: number }>();

    if (!this.config.apiKey || symbols.length === 0) {
      return prices;
    }

    try {
      const response = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbols.join(",")}&convert=USD`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn(`[CoinMarketCap] Prices fetch failed: ${response.status}`);
        return prices;
      }

      const data = await response.json();

      if (data.status.error_code !== 0) {
        console.warn(`[CoinMarketCap] Prices error: ${data.status.error_message}`);
        return prices;
      }

      for (const [symbol, coinData] of Object.entries(data.data || {})) {
        const coin = coinData as CMCCoin;
        prices.set(symbol, {
          price: coin.quote.USD.price,
          change24h: coin.quote.USD.percent_change_24h,
          marketCap: coin.quote.USD.market_cap,
        });
      }

      return prices;
    } catch (error) {
      console.error("[CoinMarketCap] Prices error:", error);
      return prices;
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      "X-CMC_PRO_API_KEY": this.config.apiKey || "",
    };
  }

  private createCoinDiscovery(coin: CMCCoin): RawDiscovery | null {
    const changePercent = coin.quote.USD.percent_change_24h;
    const direction = changePercent > 0 ? "📈" : "📉";
    const isMajor = Math.abs(changePercent) >= THRESHOLDS.PRICE_CHANGE_MAJOR;

    // Determine platform tag
    const platformTag = coin.platform?.name
      ? ` on ${coin.platform.name}`
      : "";

    return {
      sourceId: `cmc-coin-${coin.id}-${Date.now()}`,
      sourceUrl: `https://coinmarketcap.com/currencies/${coin.slug}/`,
      title: `${direction} ${coin.name} (${coin.symbol}) ${isMajor ? "MAJOR MOVE:" : ""} ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
      description: `${coin.symbol} is ${changePercent > 0 ? "up" : "down"} ${Math.abs(changePercent).toFixed(2)}% in 24h${platformTag}. Price: $${coin.quote.USD.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}. Market cap: $${(coin.quote.USD.market_cap / 1e9).toFixed(2)}B (#${coin.cmc_rank}). Volume: $${(coin.quote.USD.volume_24h / 1e6).toFixed(2)}M.`,
      publishedAt: new Date(coin.quote.USD.last_updated),
      metrics: {
        views: coin.cmc_rank,
        likes: Math.round(coin.quote.USD.volume_24h / 1e6),
      },
      metadata: {
        type: "price_move",
        source: "coinmarketcap",
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        slug: coin.slug,
        price: coin.quote.USD.price,
        priceChange1h: coin.quote.USD.percent_change_1h,
        priceChange24h: changePercent,
        priceChange7d: coin.quote.USD.percent_change_7d,
        priceChange30d: coin.quote.USD.percent_change_30d,
        marketCap: coin.quote.USD.market_cap,
        marketCapRank: coin.cmc_rank,
        volume24h: coin.quote.USD.volume_24h,
        volumeChange24h: coin.quote.USD.volume_change_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        fullyDilutedMarketCap: coin.quote.USD.fully_diluted_market_cap,
        marketCapDominance: coin.quote.USD.market_cap_dominance,
        platform: coin.platform?.name,
        tokenAddress: coin.platform?.token_address,
        tags: coin.tags,
        isMajorMove: isMajor,
      },
    };
  }

  private createGlobalDiscovery(global: CMCGlobalMetrics): RawDiscovery | null {
    const changePercent =
      global.quote.USD.total_market_cap_yesterday_percentage_change;

    // Only report if significant change or first run
    if (
      this.lastGlobalData &&
      Math.abs(changePercent) < THRESHOLDS.PRICE_CHANGE_SIGNIFICANT
    ) {
      return null;
    }

    const totalMarketCap = global.quote.USD.total_market_cap / 1e12;

    return {
      sourceId: `cmc-global-${Date.now()}`,
      sourceUrl: "https://coinmarketcap.com/charts/",
      title: `🌍 Crypto Market ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% | $${totalMarketCap.toFixed(2)}T Total (CMC)`,
      description: `Global crypto market cap: $${totalMarketCap.toFixed(2)}T (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}% 24h). BTC dominance: ${global.btc_dominance.toFixed(1)}%. ETH dominance: ${global.eth_dominance.toFixed(1)}%. DeFi market cap: $${(global.defi_market_cap / 1e9).toFixed(2)}B (${global.defi_24h_percentage_change > 0 ? "+" : ""}${global.defi_24h_percentage_change.toFixed(2)}%). Active cryptos: ${global.active_cryptocurrencies.toLocaleString()}.`,
      publishedAt: new Date(global.last_updated),
      metrics: {
        views: global.active_cryptocurrencies,
        likes: global.active_exchanges,
      },
      metadata: {
        type: "global_market",
        source: "coinmarketcap",
        totalMarketCapUsd: global.quote.USD.total_market_cap,
        totalVolumeUsd: global.quote.USD.total_volume_24h,
        marketCapChange24h: changePercent,
        btcDominance: global.btc_dominance,
        ethDominance: global.eth_dominance,
        btcDominanceChange: global.btc_dominance - global.btc_dominance_yesterday,
        ethDominanceChange: global.eth_dominance - global.eth_dominance_yesterday,
        defiMarketCap: global.defi_market_cap,
        defiChange24h: global.defi_24h_percentage_change,
        stablecoinMarketCap: global.stablecoin_market_cap,
        stablecoinChange24h: global.stablecoin_24h_percentage_change,
        derivativesVolume24h: global.derivatives_volume_24h,
        activeCryptocurrencies: global.active_cryptocurrencies,
        activeExchanges: global.active_exchanges,
        activeMarketPairs: global.active_market_pairs,
      },
    };
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = (raw.metadata as Record<string, unknown>) || {};

    // Detect relevance
    const hasWeb3Keywords = RELEVANCE_KEYWORDS.web3.some((k) =>
      text.includes(k.toLowerCase())
    );
    const hasAIKeywords = RELEVANCE_KEYWORDS.ai.some((k) =>
      text.includes(k.toLowerCase())
    );
    const hasSolanaKeywords =
      RELEVANCE_KEYWORDS.solana.some((k) => text.includes(k.toLowerCase())) ||
      metadata.platform === "Solana";
    const hasEthereumKeywords =
      RELEVANCE_KEYWORDS.ethereum.some((k) =>
        text.includes(k.toLowerCase())
      ) || metadata.platform === "Ethereum";

    // High engagement = top 50 or major price move
    const marketCapRank =
      typeof metadata.marketCapRank === "number"
        ? metadata.marketCapRank
        : null;
    const highEngagement =
      (marketCapRank !== null && marketCapRank <= 50) ||
      metadata.isMajorMove === true;

    // Determine category from tags
    let category: "web3" | "defi" | "ai" | "nft" | "tooling" | "other" = "web3";
    const tags = (metadata.tags as string[]) || [];
    if (tags.some((t) => t.includes("defi") || t.includes("lending"))) {
      category = "defi";
    } else if (tags.some((t) => t.includes("nft") || t.includes("gaming"))) {
      category = "nft";
    } else if (tags.some((t) => t.includes("ai") || t.includes("artificial"))) {
      category = "ai";
    }

    // Generate tags for discovery
    const discoveryTags: string[] = ["crypto", "market-data", "coinmarketcap"];
    if (metadata.type === "price_move") discoveryTags.push("price-action");
    if (metadata.type === "global_market") discoveryTags.push("macro");
    if (metadata.symbol)
      discoveryTags.push(String(metadata.symbol).toLowerCase());
    if (hasSolanaKeywords) discoveryTags.push("solana");
    if (hasEthereumKeywords) discoveryTags.push("ethereum");

    // Fingerprint for deduplication
    const fingerprint = createHash("md5")
      .update(`${raw.sourceId}-${raw.title}`)
      .digest("hex")
      .slice(0, 16);

    return {
      id: `cmc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "coinmarketcap" as any, // Will be added to HuntSourceSchema
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category,
      tags: discoveryTags,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords,
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
  CMCCoin,
  CMCGlobalMetrics,
  CMCResponse,
};
