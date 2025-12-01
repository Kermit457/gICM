/**
 * Twitter/X Source
 *
 * Ingests tweets from crypto/AI influencers.
 * Note: Requires Twitter API v2 Bearer Token.
 */

import { BaseSource, RawItem } from "../base.js";
import type { SourceType } from "../../../types/index.js";

export class TwitterSource extends BaseSource {
  name = "twitter";
  type: SourceType = "twitter";
  interval = 5 * 60 * 1000; // Every 5 minutes

  private bearerToken: string;

  // Tracked accounts (would be much longer in production)
  private trackedAccounts = [
    // AI
    "AnthropicAI", "OpenAI", "GoogleDeepMind",
    // Crypto
    "solaborator", "CryptoHayes", "DegenSpartan",
    // Dev
    "levelsio", "raaborash", "swyx",
  ];

  // Keywords to track
  private keywords = [
    "claude", "gpt", "llm", "ai agent",
    "solana", "$sol", "memecoin", "pump.fun",
    "cursor", "copilot", "autonomous",
  ];

  constructor() {
    super();
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || "";
    this.rateLimit = { requests: 15, window: 15 * 60 * 1000 }; // Twitter rate limits
  }

  async fetch(): Promise<RawItem[]> {
    if (!this.bearerToken) {
      this.logger.warn("Twitter Bearer Token not configured, skipping");
      return [];
    }

    const items: RawItem[] = [];

    // Fetch from tracked accounts
    for (const account of this.trackedAccounts.slice(0, 5)) {
      try {
        const tweets = await this.fetchUserTweets(account);
        items.push(...tweets);
      } catch (error) {
        this.logger.error(`Failed to fetch @${account}: ${error}`);
      }
    }

    // Search keywords
    for (const keyword of this.keywords.slice(0, 3)) {
      try {
        const tweets = await this.searchTweets(keyword);
        items.push(...tweets);
      } catch (error) {
        this.logger.error(`Failed to search "${keyword}": ${error}`);
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    this.logger.info(`Fetched ${unique.length} tweets from Twitter`);
    return unique;
  }

  private async fetchUserTweets(username: string): Promise<RawItem[]> {
    // First get user ID
    const userResponse = await this.rateLimitedFetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error(`Failed to get user ${username}`);
    }

    const userData = await userResponse.json() as { data?: { id: string } };
    if (!userData.data?.id) return [];

    // Then get tweets
    const tweetsResponse = await this.rateLimitedFetch(
      `https://api.twitter.com/2/users/${userData.data.id}/tweets?max_results=10&tweet.fields=created_at,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      }
    );

    if (!tweetsResponse.ok) {
      throw new Error(`Failed to get tweets for ${username}`);
    }

    const tweetsData = await tweetsResponse.json() as {
      data?: Array<{
        id: string;
        text: string;
        created_at?: string;
        public_metrics?: {
          like_count: number;
          retweet_count: number;
          reply_count: number;
        };
      }>;
    };

    return (tweetsData.data || []).map((tweet) => ({
      id: this.generateId("twitter", tweet.id),
      source: this.name,
      type: "tweet",
      content: tweet.text,
      metadata: {
        author: username,
        tweetId: tweet.id,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        url: `https://twitter.com/${username}/status/${tweet.id}`,
      },
      timestamp: tweet.created_at
        ? new Date(tweet.created_at).getTime()
        : Date.now(),
    }));
  }

  private async searchTweets(query: string): Promise<RawItem[]> {
    const encodedQuery = encodeURIComponent(query);
    const response = await this.rateLimitedFetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodedQuery}&max_results=20&tweet.fields=created_at,public_metrics,author_id`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed for "${query}"`);
    }

    const data = await response.json() as {
      data?: Array<{
        id: string;
        text: string;
        author_id?: string;
        created_at?: string;
        public_metrics?: {
          like_count: number;
          retweet_count: number;
          reply_count: number;
        };
      }>;
    };

    return (data.data || []).map((tweet) => ({
      id: this.generateId("twitter", tweet.id),
      source: this.name,
      type: "tweet",
      content: tweet.text,
      metadata: {
        query,
        tweetId: tweet.id,
        authorId: tweet.author_id,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
      },
      timestamp: tweet.created_at
        ? new Date(tweet.created_at).getTime()
        : Date.now(),
    }));
  }
}
