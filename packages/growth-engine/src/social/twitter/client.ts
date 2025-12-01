/**
 * Twitter API Client
 *
 * Wrapper around twitter-api-v2 for gICM Growth Engine.
 */

import { TwitterApi, type TweetV2, type UserV2 } from "twitter-api-v2";
import { Logger } from "../../utils/logger.js";

export interface TwitterConfig {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
}

export class TwitterClient {
  private client?: TwitterApi;
  private logger: Logger;
  private userId?: string;
  private config?: TwitterConfig;
  private mockMode = false;

  constructor(config?: TwitterConfig) {
    this.logger = new Logger("TwitterClient");
    this.config = config;
    // Don't initialize client until init() is called - allows CLI to work without tokens
    this.mockMode = this.detectMockMode();
  }

  /**
   * Check if credentials are available
   */
  private detectMockMode(): boolean {
    const creds = this.config || {
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    };
    return !creds.appKey || !creds.appSecret || !creds.accessToken || !creds.accessSecret;
  }

  /**
   * Check if Twitter is available (not in mock mode)
   */
  isAvailable(): boolean {
    return !this.mockMode && !!this.userId;
  }

  private getClient(): TwitterApi {
    if (!this.client) {
      const credentials = this.config || {
        appKey: process.env.TWITTER_APP_KEY || "",
        appSecret: process.env.TWITTER_APP_SECRET || "",
        accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
        accessSecret: process.env.TWITTER_ACCESS_SECRET || "",
      };
      this.client = new TwitterApi(credentials);
    }
    return this.client;
  }

  /**
   * Initialize and verify credentials
   */
  async init(): Promise<void> {
    // Skip authentication if in mock mode (no credentials)
    if (this.mockMode) {
      this.logger.warn("No Twitter credentials provided, running in MOCK mode");
      return;
    }

    try {
      const me = await this.getClient().v2.me();
      this.userId = me.data.id;
      this.logger.info(`Authenticated as @${me.data.username}`);
    } catch (error) {
      this.logger.warn(`Authentication failed, switching to mock mode: ${error}`);
      this.mockMode = true;
    }
  }

  /**
   * Post a tweet
   */
  async tweet(text: string, options?: { replyTo?: string; mediaIds?: string[] }): Promise<TweetV2> {
    // Return mock tweet in mock mode
    if (this.mockMode) {
      this.logger.info(`[MOCK] Would post tweet: ${text.substring(0, 50)}...`);
      return { id: `mock-${Date.now()}`, text } as TweetV2;
    }

    try {
      const params: Record<string, unknown> = {};

      if (options?.replyTo) {
        params.reply = { in_reply_to_tweet_id: options.replyTo };
      }

      if (options?.mediaIds?.length) {
        params.media = { media_ids: options.mediaIds };
      }

      const result = await this.getClient().v2.tweet(text, params);
      this.logger.info(`Posted tweet: ${result.data.id}`);
      return result.data;
    } catch (error) {
      this.logger.error(`Tweet failed: ${error}`);
      throw error;
    }
  }

  /**
   * Post a thread
   */
  async thread(tweets: string[]): Promise<TweetV2[]> {
    const posted: TweetV2[] = [];
    let previousId: string | undefined;

    for (const text of tweets) {
      const result = await this.tweet(text, { replyTo: previousId });
      posted.push(result);
      previousId = result.id;
    }

    this.logger.info(`Posted thread of ${tweets.length} tweets`);
    return posted;
  }

  /**
   * Get tweet metrics
   */
  async getMetrics(tweetId: string): Promise<TweetMetrics> {
    try {
      const tweet = await this.getClient().v2.singleTweet(tweetId, {
        "tweet.fields": ["public_metrics"],
      });

      const metrics = tweet.data.public_metrics;
      return {
        likes: metrics?.like_count || 0,
        retweets: metrics?.retweet_count || 0,
        replies: metrics?.reply_count || 0,
        impressions: metrics?.impression_count || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error}`);
      return { likes: 0, retweets: 0, replies: 0, impressions: 0 };
    }
  }

  /**
   * Get my recent tweets
   */
  async getMyTweets(count: number = 10): Promise<TweetV2[]> {
    if (!this.userId) {
      await this.init();
    }

    const tweets = await this.getClient().v2.userTimeline(this.userId!, {
      max_results: count,
      "tweet.fields": ["created_at", "public_metrics"],
    });

    return tweets.data.data || [];
  }

  /**
   * Search recent tweets
   */
  async search(query: string, count: number = 10): Promise<TweetV2[]> {
    const results = await this.getClient().v2.search(query, {
      max_results: count,
      "tweet.fields": ["created_at", "public_metrics", "author_id"],
    });

    return results.data.data || [];
  }

  /**
   * Get user by username
   */
  async getUser(username: string): Promise<UserV2 | null> {
    try {
      const user = await this.getClient().v2.userByUsername(username, {
        "user.fields": ["public_metrics", "description"],
      });
      return user.data;
    } catch {
      return null;
    }
  }

  /**
   * Upload media
   */
  async uploadMedia(buffer: Buffer, mimeType: string): Promise<string> {
    const mediaId = await this.getClient().v1.uploadMedia(buffer, { mimeType });
    return mediaId;
  }

  /**
   * Check rate limits
   */
  async getRateLimits(): Promise<Record<string, unknown>> {
    // Rate limit info is in response headers
    // Return a simplified version
    return {
      tweetsRemaining: "check headers",
      resetTime: "check headers",
    };
  }
}
