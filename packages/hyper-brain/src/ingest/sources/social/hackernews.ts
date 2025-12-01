/**
 * Hacker News Source
 *
 * Ingests top stories and comments.
 */

import { BaseSource, RawItem } from "../base.js";
import type { SourceType } from "../../../types/index.js";

interface HNStory {
  id: number;
  title: string;
  text?: string;
  url?: string;
  score: number;
  descendants?: number;
  by: string;
  time: number;
  type: string;
}

export class HackerNewsSource extends BaseSource {
  name = "hackernews";
  type: SourceType = "hackernews";
  interval = 15 * 60 * 1000; // Every 15 minutes

  private baseUrl = "https://hacker-news.firebaseio.com/v0";

  constructor() {
    super();
    this.rateLimit = { requests: 100, window: 60000 };
  }

  async fetch(): Promise<RawItem[]> {
    const items: RawItem[] = [];

    // Top stories
    const topStories = await this.fetchTopStories();
    items.push(...topStories);

    // New stories
    const newStories = await this.fetchNewStories();
    items.push(...newStories);

    // Show HN
    const showHN = await this.fetchShowHN();
    items.push(...showHN);

    // Ask HN
    const askHN = await this.fetchAskHN();
    items.push(...askHN);

    // Deduplicate
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    this.logger.info(`Fetched ${unique.length} stories from Hacker News`);
    return unique;
  }

  private async fetchTopStories(): Promise<RawItem[]> {
    const response = await this.rateLimitedFetch(`${this.baseUrl}/topstories.json`);
    const ids = (await response.json()) as number[];
    return this.fetchStories(ids.slice(0, 30), "top");
  }

  private async fetchNewStories(): Promise<RawItem[]> {
    const response = await this.rateLimitedFetch(`${this.baseUrl}/newstories.json`);
    const ids = (await response.json()) as number[];
    return this.fetchStories(ids.slice(0, 20), "new");
  }

  private async fetchShowHN(): Promise<RawItem[]> {
    const response = await this.rateLimitedFetch(`${this.baseUrl}/showstories.json`);
    const ids = (await response.json()) as number[];
    return this.fetchStories(ids.slice(0, 15), "show");
  }

  private async fetchAskHN(): Promise<RawItem[]> {
    const response = await this.rateLimitedFetch(`${this.baseUrl}/askstories.json`);
    const ids = (await response.json()) as number[];
    return this.fetchStories(ids.slice(0, 10), "ask");
  }

  private async fetchStories(ids: number[], category: string): Promise<RawItem[]> {
    const items: RawItem[] = [];

    // Fetch in batches of 10 for parallelism
    const batchSize = 10;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((id) => this.fetchStory(id))
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          const story = result.value;
          items.push({
            id: this.generateId("hn", story.id.toString()),
            source: this.name,
            type: "post",
            content: `${story.title}\n\n${story.text || story.url || ""}`,
            metadata: {
              category,
              title: story.title,
              url: story.url,
              score: story.score,
              comments: story.descendants || 0,
              author: story.by,
              hnUrl: `https://news.ycombinator.com/item?id=${story.id}`,
              type: story.type,
            },
            timestamp: story.time * 1000,
          });
        }
      }
    }

    return items;
  }

  private async fetchStory(id: number): Promise<HNStory | null> {
    try {
      const response = await this.rateLimitedFetch(`${this.baseUrl}/item/${id}.json`);
      if (!response.ok) return null;
      return (await response.json()) as HNStory;
    } catch {
      return null;
    }
  }
}
