/**
 * Growth Engine Adapter
 *
 * Integrates GrowthEngine with autonomy system for:
 * - Tweet generation/posting
 * - Blog generation/publishing
 * - Discord announcements
 */

import { EngineAdapter, type EngineAdapterConfig } from "./engine-adapter.js";
import type { Action, ActionCategory } from "../core/types.js";

export interface TweetParams {
  content: string;
  threadId?: string;
  scheduledFor?: number;
}

export interface BlogParams {
  title: string;
  topic: string;
  keywords?: string[];
  draft?: boolean;
}

export interface DiscordAnnouncementParams {
  channel: string;
  message: string;
  embed?: {
    title: string;
    description: string;
    color?: number;
  };
}

export class GrowthEngineAdapter extends EngineAdapter {
  constructor() {
    super({
      engineName: "growth-engine",
      engineType: "growth",
      defaultCategory: "content",
    });
  }

  /**
   * Create tweet action
   */
  createTweetAction(params: TweetParams): Action {
    return this.createAction({
      type: params.threadId ? "tweet_reply" : "tweet_post",
      description: `Post tweet: "${params.content.substring(0, 50)}..."`,
      payload: {
        content: params.content,
        threadId: params.threadId,
        scheduledFor: params.scheduledFor,
      },
      reversible: false, // Published tweets can't be auto-deleted
      urgency: "normal",
    });
  }

  /**
   * Create blog draft action
   */
  createBlogDraftAction(params: BlogParams): Action {
    return this.createAction({
      type: "blog_draft",
      description: `Generate blog draft: ${params.title}`,
      payload: {
        title: params.title,
        topic: params.topic,
        keywords: params.keywords,
      },
      reversible: true, // Drafts can be deleted
      urgency: "low",
    });
  }

  /**
   * Create blog publish action
   */
  createBlogPublishAction(params: BlogParams): Action {
    return this.createAction({
      type: "blog_publish",
      description: `Publish blog: ${params.title}`,
      payload: {
        title: params.title,
        topic: params.topic,
        keywords: params.keywords,
      },
      reversible: false, // Published blogs are public
      urgency: "normal",
    });
  }

  /**
   * Create Discord announcement action
   */
  createDiscordAction(params: DiscordAnnouncementParams): Action {
    return this.createAction({
      type: "discord_announce",
      description: `Discord announcement to ${params.channel}`,
      payload: {
        channel: params.channel,
        message: params.message,
        embed: params.embed,
      },
      reversible: false,
      urgency: "normal",
    });
  }

  /**
   * Create thread of tweets action
   */
  createTwitterThreadAction(tweets: string[]): Action {
    return this.createAction({
      type: "twitter_thread",
      description: `Post Twitter thread (${tweets.length} tweets)`,
      payload: {
        tweets,
        count: tweets.length,
      },
      reversible: false,
      urgency: "normal",
    });
  }

  protected getCategoryForType(actionType: string): ActionCategory {
    return "content";
  }
}
