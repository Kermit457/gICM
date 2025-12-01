import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// Reddit JSON API (no auth needed for public data)
const REDDIT_API = "https://www.reddit.com";

interface RedditPost {
  id: string;
  title: string;
  selftext?: string;
  url: string;
  permalink: string;
  author: string;
  subreddit: string;
  created_utc: number;
  score: number;
  num_comments: number;
  upvote_ratio: number;
  link_flair_text?: string;
}

interface RedditListing {
  data: {
    children: Array<{ data: RedditPost }>;
  };
}

// High-value subreddits for tech discovery
const TARGET_SUBREDDITS = [
  // AI/ML
  "MachineLearning",
  "LocalLLaMA",
  "artificial",
  "deeplearning",
  // Crypto/Web3
  "CryptoCurrency",
  "solana",
  "ethereum",
  "defi",
  // Development
  "programming",
  "webdev",
  "typescript",
  "node",
  "rust",
  // Startups/Products
  "startups",
  "SideProject",
  "coolgithubprojects",
];

export class RedditHunter implements BaseHunterSource {
  source = "reddit" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    for (const subreddit of TARGET_SUBREDDITS) {
      try {
        const posts = await this.fetchSubreddit(subreddit);
        discoveries.push(...posts);
        // Rate limit: wait 1s between subreddits
        await new Promise((r) => setTimeout(r, 1000));
      } catch (error) {
        console.error(`[RedditHunter] Failed to fetch r/${subreddit}:`, error);
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
    const metadata = raw.metadata as RedditPost | undefined;

    return {
      id: randomUUID(),
      source: "reddit" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(text),
      tags: this.extractTags(text, metadata?.subreddit),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 100 || (raw.metrics.comments ?? 0) > 50,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchSubreddit(subreddit: string): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // Fetch hot and new posts
    for (const sort of ["hot", "new"]) {
      try {
        const response = await fetch(
          `${REDDIT_API}/r/${subreddit}/${sort}.json?limit=25`,
          {
            headers: {
              "User-Agent": "gICM-Hunter/1.0 (Tech Discovery Bot)",
            },
          }
        );

        if (!response.ok) continue;

        const data = (await response.json()) as RedditListing;
        for (const child of data.data.children) {
          const post = child.data;
          if (!this.passesFilters(post)) continue;
          discoveries.push(this.postToRawDiscovery(post));
        }
      } catch {
        // Ignore errors for individual fetches
      }
    }

    return discoveries;
  }

  private passesFilters(post: RedditPost): boolean {
    const minPoints = this.config.filters?.minPoints ?? 10;
    const minEngagement = this.config.filters?.minEngagement ?? 3;

    if (post.score < minPoints) return false;
    if (post.num_comments < minEngagement) return false;

    // Check keywords
    const text = `${post.title} ${post.selftext ?? ""}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "github",
      "open source",
      "tool",
      "library",
      "framework",
      "sdk",
    ];

    const matchesKeywords = keywords.some((kw) => text.includes(kw.toLowerCase()));

    // High scoring posts are always included
    if (post.score >= 100) return true;

    return matchesKeywords;
  }

  private postToRawDiscovery(post: RedditPost): RawDiscovery {
    const redditUrl = `https://reddit.com${post.permalink}`;

    return {
      sourceId: post.id,
      sourceUrl: post.url.startsWith("http") ? post.url : redditUrl,
      title: `[r/${post.subreddit}] ${post.title}`,
      description: post.selftext?.slice(0, 500),
      author: post.author,
      authorUrl: `https://reddit.com/user/${post.author}`,
      publishedAt: new Date(post.created_utc * 1000),
      metrics: {
        points: post.score,
        comments: post.num_comments,
      },
      metadata: post as unknown as Record<string, unknown>,
    };
  }

  private categorize(text: string): HuntDiscovery["category"] {
    if (this.hasKeywords(text, ["defi", "lending", "dex", "swap", "yield"])) {
      return "defi";
    }
    if (this.hasKeywords(text, ["nft", "collectible"])) {
      return "nft";
    }
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (this.hasKeywords(text, ["cli", "tool", "sdk", "library", "framework"])) {
      return "tooling";
    }
    return "other";
  }

  private extractTags(text: string, subreddit?: string): string[] {
    const tags: string[] = [];

    if (subreddit) tags.push(`r/${subreddit.toLowerCase()}`);
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.solana)) tags.push("solana");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum)) tags.push("ethereum");

    return tags;
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private isRecent(post?: RedditPost): boolean {
    if (!post?.created_utc) return false;
    const postTime = new Date(post.created_utc * 1000);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1000 * 60 * 60);
    return hoursSincePost < 24;
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `reddit:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
