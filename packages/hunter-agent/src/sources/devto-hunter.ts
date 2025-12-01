import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// Dev.to - Developer community articles
const DEVTO_API = "https://dev.to/api";

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  social_image?: string;
  readable_publish_date: string;
  tag_list: string[];
  slug: string;
  path: string;
  url: string;
  canonical_url: string;
  comments_count: number;
  positive_reactions_count: number;
  public_reactions_count: number;
  created_at: string;
  published_at: string;
  user: {
    name: string;
    username: string;
    twitter_username?: string;
    github_username?: string;
  };
}

// High-value tags for discovery
const TARGET_TAGS = [
  "ai",
  "machinelearning",
  "webdev",
  "typescript",
  "javascript",
  "rust",
  "blockchain",
  "web3",
  "solana",
  "ethereum",
  "crypto",
  "opensource",
  "programming",
  "devops",
  "security",
];

export class DevToHunter implements BaseHunterSource {
  source = "devto" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // Fetch top articles (by reactions)
    try {
      const top = await this.fetchArticles("top", 30);
      discoveries.push(...top);
    } catch (error) {
      console.error("[DevToHunter] Failed to fetch top:", error);
    }

    // Fetch latest articles
    try {
      const latest = await this.fetchArticles("latest", 30);
      discoveries.push(...latest);
    } catch (error) {
      console.error("[DevToHunter] Failed to fetch latest:", error);
    }

    // Fetch by tags
    for (const tag of TARGET_TAGS.slice(0, 5)) {
      try {
        const tagged = await this.fetchByTag(tag, 15);
        discoveries.push(...tagged);
        await new Promise((r) => setTimeout(r, 300));
      } catch (error) {
        console.error(`[DevToHunter] Failed to fetch tag ${tag}:`, error);
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
    const metadata = raw.metadata as DevToArticle | undefined;

    return {
      id: randomUUID(),
      source: "devto" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(text, metadata?.tag_list ?? []),
      tags: this.extractTags(text, metadata?.tag_list ?? []),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.likes ?? 0) > 50,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchArticles(type: "top" | "latest", perPage: number): Promise<RawDiscovery[]> {
    const response = await fetch(
      `${DEVTO_API}/articles?per_page=${perPage}&state=rising${type === "top" ? "&top=7" : ""}`,
      {
        headers: {
          "User-Agent": "gICM-Hunter/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const articles = (await response.json()) as DevToArticle[];
    return articles.filter((a) => this.passesFilters(a)).map((a) => this.articleToRawDiscovery(a));
  }

  private async fetchByTag(tag: string, perPage: number): Promise<RawDiscovery[]> {
    const response = await fetch(`${DEVTO_API}/articles?tag=${tag}&per_page=${perPage}`, {
      headers: {
        "User-Agent": "gICM-Hunter/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) return [];

    const articles = (await response.json()) as DevToArticle[];
    return articles.filter((a) => this.passesFilters(a)).map((a) => this.articleToRawDiscovery(a));
  }

  private passesFilters(article: DevToArticle): boolean {
    const minReactions = this.config.filters?.minPoints ?? 10;
    if (article.positive_reactions_count < minReactions) return false;

    // Check keywords
    const text = `${article.title} ${article.description ?? ""} ${article.tag_list.join(" ")}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "tutorial",
      "guide",
      "tool",
      "library",
      "framework",
      "open source",
    ];

    const matchesKeywords = keywords.some((kw) => text.includes(kw.toLowerCase()));

    // High engagement articles always pass
    if (article.positive_reactions_count >= 100) return true;

    // Articles with relevant tags pass
    if (article.tag_list.some((t) => TARGET_TAGS.includes(t.toLowerCase()))) return true;

    return matchesKeywords;
  }

  private articleToRawDiscovery(article: DevToArticle): RawDiscovery {
    return {
      sourceId: String(article.id),
      sourceUrl: article.url,
      title: `[DevTo] ${article.title}`,
      description: article.description,
      author: article.user.name,
      authorUrl: `https://dev.to/${article.user.username}`,
      publishedAt: new Date(article.published_at),
      metrics: {
        likes: article.positive_reactions_count,
        comments: article.comments_count,
        views: article.public_reactions_count,
      },
      metadata: article as unknown as Record<string, unknown>,
    };
  }

  private categorize(text: string, tags: string[]): HuntDiscovery["category"] {
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));

    if (tagSet.has("blockchain") || tagSet.has("web3") || tagSet.has("crypto") ||
        this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (tagSet.has("ai") || tagSet.has("machinelearning") ||
        this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (tagSet.has("defi")) {
      return "defi";
    }
    if (tags.some((t) => ["programming", "typescript", "javascript", "rust", "python"].includes(t.toLowerCase()))) {
      return "tooling";
    }
    return "other";
  }

  private extractTags(text: string, articleTags: string[]): string[] {
    const tags = articleTags.slice(0, 5);

    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private isRecent(article?: DevToArticle): boolean {
    if (!article?.published_at) return false;
    const pubTime = new Date(article.published_at);
    const hoursSincePub = (Date.now() - pubTime.getTime()) / (1000 * 60 * 60);
    return hoursSincePub < 48;
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `devto:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
