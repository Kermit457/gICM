import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// Lobste.rs - tech-focused HN alternative (higher signal-to-noise)
const LOBSTERS_API = "https://lobste.rs";

interface LobstersStory {
  short_id: string;
  short_id_url: string;
  created_at: string;
  title: string;
  url: string;
  score: number;
  comment_count: number;
  description: string;
  submitter_user: {
    username: string;
  };
  tags: string[];
}

export class LobstersHunter implements BaseHunterSource {
  source = "lobsters" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // Fetch hottest and newest stories
    try {
      const hottest = await this.fetchHottest();
      discoveries.push(...hottest);
    } catch (error) {
      console.error("[LobstersHunter] Failed to fetch hottest:", error);
    }

    try {
      const newest = await this.fetchNewest();
      discoveries.push(...newest);
    } catch (error) {
      console.error("[LobstersHunter] Failed to fetch newest:", error);
    }

    // Fetch specific tags
    const tags = ["ai", "crypto", "rust", "programming", "web", "security"];
    for (const tag of tags) {
      try {
        const tagged = await this.fetchByTag(tag);
        discoveries.push(...tagged);
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`[LobstersHunter] Failed to fetch tag ${tag}:`, error);
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata as LobstersStory | undefined;

    return {
      id: randomUUID(),
      source: "lobsters" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(text, metadata?.tags ?? []),
      tags: this.extractTags(text, metadata?.tags ?? []),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 30 || (raw.metrics.comments ?? 0) > 20,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchHottest(): Promise<RawDiscovery[]> {
    const response = await fetch(`${LOBSTERS_API}/hottest.json`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" },
    });
    if (!response.ok) return [];

    const stories = (await response.json()) as LobstersStory[];
    return stories.filter((s) => this.passesFilters(s)).map((s) => this.storyToRawDiscovery(s));
  }

  private async fetchNewest(): Promise<RawDiscovery[]> {
    const response = await fetch(`${LOBSTERS_API}/newest.json`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" },
    });
    if (!response.ok) return [];

    const stories = (await response.json()) as LobstersStory[];
    return stories.filter((s) => this.passesFilters(s)).map((s) => this.storyToRawDiscovery(s));
  }

  private async fetchByTag(tag: string): Promise<RawDiscovery[]> {
    const response = await fetch(`${LOBSTERS_API}/t/${tag}.json`, {
      headers: { "User-Agent": "gICM-Hunter/1.0" },
    });
    if (!response.ok) return [];

    const stories = (await response.json()) as LobstersStory[];
    return stories.filter((s) => this.passesFilters(s)).map((s) => this.storyToRawDiscovery(s));
  }

  private passesFilters(story: LobstersStory): boolean {
    const minPoints = this.config.filters?.minPoints ?? 5;
    if (story.score < minPoints) return false;

    // Check keywords
    const text = `${story.title} ${story.description ?? ""} ${story.tags.join(" ")}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "rust",
      "typescript",
      "security",
      "distributed",
      "open source",
    ];

    const matchesKeywords = keywords.some((kw) => text.includes(kw.toLowerCase()));

    // High scoring stories always pass
    if (story.score >= 20) return true;

    return matchesKeywords;
  }

  private storyToRawDiscovery(story: LobstersStory): RawDiscovery {
    return {
      sourceId: story.short_id,
      sourceUrl: story.url || story.short_id_url,
      title: `[Lobsters] ${story.title}`,
      description: story.description || undefined,
      author: story.submitter_user.username,
      authorUrl: `https://lobste.rs/~${story.submitter_user.username}`,
      publishedAt: new Date(story.created_at),
      metrics: {
        points: story.score,
        comments: story.comment_count,
      },
      metadata: story as unknown as Record<string, unknown>,
    };
  }

  private categorize(text: string, tags: string[]): HuntDiscovery["category"] {
    if (tags.includes("crypto") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (tags.includes("ai") || tags.includes("ml") || this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (tags.some((t) => ["programming", "rust", "go", "python", "javascript"].includes(t))) {
      return "tooling";
    }
    return "other";
  }

  private extractTags(text: string, storyTags: string[]): string[] {
    const tags = storyTags.slice(0, 5);

    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private isRecent(story?: LobstersStory): boolean {
    if (!story?.created_at) return false;
    const postTime = new Date(story.created_at);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1000 * 60 * 60);
    return hoursSincePost < 24;
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `lobsters:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
