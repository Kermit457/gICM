/**
 * LunarCrush Hunter - Social sentiment and engagement metrics
 *
 * LunarCrush tracks social activity across Twitter, Reddit, YouTube, etc.
 * Provides Galaxy Score, AltRank, and social engagement metrics.
 *
 * Free tier: Limited endpoints (public API)
 * Pro tier: Full API access with key
 *
 * Endpoints:
 * - /coins/list - Top coins by social activity
 * - /coins/:coin - Detailed coin metrics
 * - /feeds - Social media feed aggregation
 */

import {
  type BaseHunterSource,
  type RawDiscovery,
  type HuntDiscovery,
  type HunterConfig,
  RELEVANCE_KEYWORDS,
} from "../types.js";
import { createHash } from "crypto";

// LunarCrush API types
interface LunarCoin {
  id: number;
  symbol: string;
  name: string;
  price: number;
  price_btc: number;
  market_cap: number;
  percent_change_24h: number;
  percent_change_7d: number;
  volume_24h: number;
  // Social metrics
  galaxy_score: number; // 0-100, overall social health
  alt_rank: number; // Ranking vs other alts
  social_volume: number; // Total social mentions
  social_volume_change_24h: number;
  social_score: number; // Engagement quality
  social_contributors: number;
  social_dominance: number; // % of total crypto social
  sentiment: number; // -100 to 100
  // Engagement breakdown
  twitter_volume: number;
  twitter_volume_change_24h: number;
  reddit_volume: number;
  reddit_volume_change_24h: number;
  news_volume: number;
  spam_volume: number;
  // Time data
  time: number; // Unix timestamp
}

interface LunarFeedItem {
  id: string;
  type: "tweet" | "reddit" | "news" | "youtube";
  title?: string;
  body: string;
  url: string;
  time: number;
  social_score: number;
  sentiment: number;
  symbol?: string;
  influencer_id?: number;
  influencer_name?: string;
  influencer_followers?: number;
}

interface LunarInfluencer {
  id: number;
  twitter_screen_name: string;
  display_name: string;
  followers: number;
  engagement_rate: number;
  influence_score: number;
  avg_sentiment: number;
}

// LunarCrush API base URL
const LUNARCRUSH_API_V2 = "https://lunarcrush.com/api/v2";
const LUNARCRUSH_API_V3 = "https://lunarcrush.com/api3"; // Some endpoints

// Thresholds for significant social events
const THRESHOLDS = {
  GALAXY_SCORE_HIGH: 70, // Top tier social health
  GALAXY_SCORE_LOW: 30, // Concerning social health
  SOCIAL_VOLUME_SPIKE: 50, // 50% increase in 24h
  SENTIMENT_BULLISH: 60, // Strong positive sentiment
  SENTIMENT_BEARISH: -40, // Strong negative sentiment
  ALT_RANK_TOP: 50, // Top 50 by social
  INFLUENCER_FOLLOWERS_MIN: 10000,
};

export class LunarCrushHunter implements BaseHunterSource {
  source = "lunarcrush" as const;
  private config: HunterConfig;
  private lastSocialVolumes: Map<string, number> = new Map();

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // Check if API key is available
    if (!this.config.apiKey) {
      console.warn("[LunarCrush] API key required for full functionality");
      // Try public endpoints only
      return this.huntPublicData();
    }

    try {
      // Parallel fetch all data
      const [topCoins, feedItems] = await Promise.all([
        this.fetchTopCoins(),
        this.fetchSocialFeed(),
      ]);

      // Process top social coins
      for (const coin of topCoins) {
        const discoveries_for_coin = this.processCoin(coin);
        discoveries.push(...discoveries_for_coin);
      }

      // Process viral feed items
      for (const item of feedItems) {
        const discovery = this.createFeedDiscovery(item);
        if (discovery) discoveries.push(discovery);
      }

      // Update volume tracking for next run
      for (const coin of topCoins) {
        this.lastSocialVolumes.set(coin.symbol, coin.social_volume);
      }
    } catch (error) {
      console.error("[LunarCrushHunter] Hunt failed:", error);
    }

    return discoveries;
  }

  private async huntPublicData(): Promise<RawDiscovery[]> {
    // Fallback to public endpoints without API key
    const discoveries: RawDiscovery[] = [];

    try {
      // Try the public trending endpoint
      const response = await fetch(
        `${LUNARCRUSH_API_V3}/coins?sort=galaxy_score&limit=20`,
        { headers: { Accept: "application/json" } }
      );

      if (response.ok) {
        const data = await response.json();
        const coins = data.data || [];
        for (const coin of coins) {
          if (coin.galaxy_score >= THRESHOLDS.GALAXY_SCORE_HIGH) {
            discoveries.push(this.createHighSocialDiscovery(coin));
          }
        }
      }
    } catch (error) {
      console.warn("[LunarCrush] Public endpoint failed:", error);
    }

    return discoveries;
  }

  private async fetchTopCoins(): Promise<LunarCoin[]> {
    try {
      const response = await fetch(
        `${LUNARCRUSH_API_V2}/assets?sort=galaxy_score&limit=50`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        console.warn(`[LunarCrush] Top coins fetch failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("[LunarCrush] Top coins error:", error);
      return [];
    }
  }

  private async fetchSocialFeed(): Promise<LunarFeedItem[]> {
    try {
      const response = await fetch(
        `${LUNARCRUSH_API_V2}/feeds?limit=50&sources=twitter,reddit,news`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        console.warn(`[LunarCrush] Feed fetch failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const items: LunarFeedItem[] = data.data || [];

      // Filter to high-engagement items
      return items.filter(
        (item) =>
          item.social_score >= 50 ||
          (item.influencer_followers &&
            item.influencer_followers >= THRESHOLDS.INFLUENCER_FOLLOWERS_MIN)
      );
    } catch (error) {
      console.error("[LunarCrush] Feed error:", error);
      return [];
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  private processCoin(coin: LunarCoin): RawDiscovery[] {
    const discoveries: RawDiscovery[] = [];

    // High Galaxy Score alert
    if (coin.galaxy_score >= THRESHOLDS.GALAXY_SCORE_HIGH) {
      discoveries.push(this.createHighSocialDiscovery(coin));
    }

    // Low Galaxy Score warning
    if (coin.galaxy_score <= THRESHOLDS.GALAXY_SCORE_LOW && coin.alt_rank <= 100) {
      discoveries.push(this.createLowSocialDiscovery(coin));
    }

    // Social volume spike
    const prevVolume = this.lastSocialVolumes.get(coin.symbol);
    if (prevVolume && coin.social_volume_change_24h >= THRESHOLDS.SOCIAL_VOLUME_SPIKE) {
      discoveries.push(this.createVolumeSpikeDiscovery(coin));
    }

    // Strong sentiment
    if (coin.sentiment >= THRESHOLDS.SENTIMENT_BULLISH) {
      discoveries.push(this.createSentimentDiscovery(coin, "bullish"));
    } else if (coin.sentiment <= THRESHOLDS.SENTIMENT_BEARISH) {
      discoveries.push(this.createSentimentDiscovery(coin, "bearish"));
    }

    return discoveries;
  }

  private createHighSocialDiscovery(coin: LunarCoin): RawDiscovery {
    return {
      sourceId: `lunarcrush-high-${coin.symbol}-${Date.now()}`,
      sourceUrl: `https://lunarcrush.com/coins/${coin.symbol.toLowerCase()}`,
      title: `🌟 ${coin.name} (${coin.symbol}) High Social Activity - Galaxy Score: ${coin.galaxy_score}`,
      description: `${coin.name} ranks #${coin.alt_rank} by social metrics. Galaxy Score: ${coin.galaxy_score}/100. Social Volume: ${coin.social_volume?.toLocaleString() || "N/A"} mentions. Sentiment: ${this.formatSentiment(coin.sentiment)}. Price: $${coin.price?.toFixed(4)} (${coin.percent_change_24h > 0 ? "+" : ""}${coin.percent_change_24h?.toFixed(2)}% 24h).`,
      publishedAt: new Date(coin.time * 1000),
      metrics: {
        points: coin.galaxy_score,
        likes: coin.social_volume,
        comments: coin.social_contributors,
      },
      metadata: {
        type: "high_social",
        symbol: coin.symbol,
        name: coin.name,
        galaxyScore: coin.galaxy_score,
        altRank: coin.alt_rank,
        socialVolume: coin.social_volume,
        socialScore: coin.social_score,
        sentiment: coin.sentiment,
        socialDominance: coin.social_dominance,
        twitterVolume: coin.twitter_volume,
        redditVolume: coin.reddit_volume,
        price: coin.price,
        priceChange24h: coin.percent_change_24h,
        marketCap: coin.market_cap,
      },
    };
  }

  private createLowSocialDiscovery(coin: LunarCoin): RawDiscovery {
    return {
      sourceId: `lunarcrush-low-${coin.symbol}-${Date.now()}`,
      sourceUrl: `https://lunarcrush.com/coins/${coin.symbol.toLowerCase()}`,
      title: `⚠️ ${coin.name} (${coin.symbol}) Low Social Activity - Galaxy Score: ${coin.galaxy_score}`,
      description: `Warning: ${coin.name} showing weak social metrics. Galaxy Score dropped to ${coin.galaxy_score}/100. Alt Rank: #${coin.alt_rank}. Could indicate declining interest or accumulation phase.`,
      publishedAt: new Date(coin.time * 1000),
      metrics: {
        points: coin.galaxy_score,
        likes: coin.social_volume,
      },
      metadata: {
        type: "low_social",
        symbol: coin.symbol,
        name: coin.name,
        galaxyScore: coin.galaxy_score,
        altRank: coin.alt_rank,
        socialVolume: coin.social_volume,
        sentiment: coin.sentiment,
      },
    };
  }

  private createVolumeSpikeDiscovery(coin: LunarCoin): RawDiscovery {
    return {
      sourceId: `lunarcrush-spike-${coin.symbol}-${Date.now()}`,
      sourceUrl: `https://lunarcrush.com/coins/${coin.symbol.toLowerCase()}`,
      title: `📈 ${coin.name} (${coin.symbol}) Social Volume Spike +${coin.social_volume_change_24h.toFixed(0)}%`,
      description: `${coin.name} social mentions surged ${coin.social_volume_change_24h.toFixed(0)}% in 24h. Current volume: ${coin.social_volume?.toLocaleString()}. Twitter: ${coin.twitter_volume_change_24h > 0 ? "+" : ""}${coin.twitter_volume_change_24h?.toFixed(0)}%. Reddit: ${coin.reddit_volume_change_24h > 0 ? "+" : ""}${coin.reddit_volume_change_24h?.toFixed(0)}%.`,
      publishedAt: new Date(coin.time * 1000),
      metrics: {
        points: Math.round(coin.social_volume_change_24h),
        likes: coin.social_volume,
      },
      metadata: {
        type: "volume_spike",
        symbol: coin.symbol,
        name: coin.name,
        volumeChange24h: coin.social_volume_change_24h,
        socialVolume: coin.social_volume,
        twitterVolumeChange: coin.twitter_volume_change_24h,
        redditVolumeChange: coin.reddit_volume_change_24h,
        galaxyScore: coin.galaxy_score,
      },
    };
  }

  private createSentimentDiscovery(
    coin: LunarCoin,
    type: "bullish" | "bearish"
  ): RawDiscovery {
    const emoji = type === "bullish" ? "🟢" : "🔴";

    return {
      sourceId: `lunarcrush-sentiment-${coin.symbol}-${Date.now()}`,
      sourceUrl: `https://lunarcrush.com/coins/${coin.symbol.toLowerCase()}`,
      title: `${emoji} ${coin.name} (${coin.symbol}) Strong ${type === "bullish" ? "Bullish" : "Bearish"} Sentiment: ${coin.sentiment}`,
      description: `${coin.name} showing ${type} social sentiment of ${coin.sentiment}/100. Social score: ${coin.social_score}. Contributors: ${coin.social_contributors?.toLocaleString()}. Galaxy Score: ${coin.galaxy_score}/100.`,
      publishedAt: new Date(coin.time * 1000),
      metrics: {
        points: Math.abs(coin.sentiment),
        likes: coin.social_score,
      },
      metadata: {
        type: `${type}_sentiment`,
        symbol: coin.symbol,
        name: coin.name,
        sentiment: coin.sentiment,
        sentimentType: type,
        socialScore: coin.social_score,
        socialContributors: coin.social_contributors,
        galaxyScore: coin.galaxy_score,
      },
    };
  }

  private createFeedDiscovery(item: LunarFeedItem): RawDiscovery | null {
    const sourceEmoji = this.getSourceEmoji(item.type);
    const sentimentEmoji = item.sentiment >= 0 ? "🟢" : "🔴";

    return {
      sourceId: `lunarcrush-feed-${item.id}`,
      sourceUrl: item.url,
      title: `${sourceEmoji} ${item.title || item.body.slice(0, 80)}...`,
      description: `${item.body.slice(0, 300)}${item.body.length > 300 ? "..." : ""} | Sentiment: ${sentimentEmoji} ${item.sentiment} | Score: ${item.social_score}${item.influencer_name ? ` | By @${item.influencer_name} (${item.influencer_followers?.toLocaleString()} followers)` : ""}`,
      author: item.influencer_name,
      publishedAt: new Date(item.time * 1000),
      metrics: {
        points: item.social_score,
        likes: item.influencer_followers || 0,
      },
      metadata: {
        type: "social_post",
        postType: item.type,
        symbol: item.symbol,
        sentiment: item.sentiment,
        socialScore: item.social_score,
        influencerId: item.influencer_id,
        influencerName: item.influencer_name,
        influencerFollowers: item.influencer_followers,
      },
    };
  }

  private getSourceEmoji(type: LunarFeedItem["type"]): string {
    switch (type) {
      case "tweet":
        return "🐦";
      case "reddit":
        return "🔴";
      case "news":
        return "📰";
      case "youtube":
        return "▶️";
      default:
        return "💬";
    }
  }

  private formatSentiment(sentiment: number): string {
    if (sentiment >= 60) return `Very Bullish (${sentiment})`;
    if (sentiment >= 20) return `Bullish (${sentiment})`;
    if (sentiment >= -20) return `Neutral (${sentiment})`;
    if (sentiment >= -60) return `Bearish (${sentiment})`;
    return `Very Bearish (${sentiment})`;
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
    const metadata = raw.metadata as Record<string, unknown>;

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

    // High engagement = high galaxy score or viral post
    const galaxyScore = (metadata.galaxyScore as number) || 0;
    const socialScore = (metadata.socialScore as number) || 0;
    const highEngagement =
      galaxyScore >= THRESHOLDS.GALAXY_SCORE_HIGH || socialScore >= 80;

    // Determine category
    let category: "web3" | "defi" | "ai" | "nft" | "tooling" | "other" = "web3";
    if (hasAIKeywords) category = "ai";
    if (text.includes("nft") || text.includes("collectible")) category = "nft";
    if (
      text.includes("defi") ||
      text.includes("yield") ||
      text.includes("lending")
    )
      category = "defi";

    // Generate tags
    const tags: string[] = ["social-sentiment", "lunarcrush"];
    const symbol = metadata.symbol as string;
    if (symbol) tags.push(symbol.toLowerCase());

    const type = metadata.type as string;
    if (type === "high_social") tags.push("trending");
    if (type === "volume_spike") tags.push("viral");
    if (type?.includes("sentiment")) tags.push("sentiment");
    if (type === "social_post") {
      const postType = metadata.postType as string;
      if (postType) tags.push(postType);
    }

    if (hasSolanaKeywords) tags.push("solana");
    if (hasEthereumKeywords) tags.push("ethereum");

    // Fingerprint for deduplication
    const fingerprint = createHash("md5")
      .update(`${raw.sourceId}-${raw.title}`)
      .digest("hex")
      .slice(0, 16);

    return {
      id: `lunarcrush-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: this.source,
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
        hasWeb3Keywords: true, // Always crypto-related
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
