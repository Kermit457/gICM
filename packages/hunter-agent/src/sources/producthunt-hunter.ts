import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// Product Hunt API (public GraphQL endpoint)
const PH_API = "https://api.producthunt.com/v2/api/graphql";

interface PHPost {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  url: string;
  website: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
  makers: Array<{ name: string; username: string }>;
  topics: Array<{ name: string }>;
}

// GraphQL query to fetch recent posts
const POSTS_QUERY = `
query GetPosts($first: Int!, $order: PostsOrder!) {
  posts(first: $first, order: $order) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        website
        votesCount
        commentsCount
        createdAt
        makers {
          name
          username
        }
        topics {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }
}`;

export class ProductHuntHunter implements BaseHunterSource {
  source = "producthunt" as const;
  private config: HunterConfig;
  private apiToken?: string;

  constructor(config: HunterConfig) {
    this.config = config;
    this.apiToken = config.apiToken;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // Fetch newest and most voted
    for (const order of ["NEWEST", "VOTES"]) {
      try {
        const posts = await this.fetchPosts(order, 50);
        discoveries.push(...posts);
      } catch (error) {
        console.error(`[ProductHuntHunter] Failed to fetch ${order}:`, error);
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
    const metadata = raw.metadata as PHPost | undefined;

    const topics = metadata?.topics?.map((t) => t.name.toLowerCase()) ?? [];

    return {
      id: randomUUID(),
      source: "producthunt" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(text, topics),
      tags: this.extractTags(text, topics),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.points ?? 0) > 200,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchPosts(order: string, limit: number): Promise<RawDiscovery[]> {
    // If no API token, use RSS feed fallback
    if (!this.apiToken) {
      return this.fetchFromRSS();
    }

    const response = await fetch(PH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        query: POSTS_QUERY,
        variables: { first: limit, order },
      }),
    });

    if (!response.ok) {
      console.error("[ProductHuntHunter] API request failed, using RSS fallback");
      return this.fetchFromRSS();
    }

    const data = await response.json();
    const posts = data.data?.posts?.edges ?? [];

    return posts
      .map((edge: any) => this.nodeToRawDiscovery(edge.node))
      .filter((d: RawDiscovery) => this.passesFilters(d));
  }

  private async fetchFromRSS(): Promise<RawDiscovery[]> {
    // Fallback to scraping their RSS-like endpoints
    try {
      const response = await fetch("https://www.producthunt.com/feed?category=undefined", {
        headers: {
          "User-Agent": "gICM-Hunter/1.0 (Tech Discovery Bot)",
        },
      });

      if (!response.ok) return [];

      // Parse RSS XML (simplified)
      const text = await response.text();
      const discoveries: RawDiscovery[] = [];

      // Basic XML parsing for RSS items
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const item = match[1];
        const title = this.extractXMLTag(item, "title");
        const link = this.extractXMLTag(item, "link");
        const description = this.extractXMLTag(item, "description");
        const pubDate = this.extractXMLTag(item, "pubDate");

        if (title && link) {
          discoveries.push({
            sourceId: createHash("md5").update(link).digest("hex"),
            sourceUrl: link,
            title: `[PH] ${title}`,
            description: description?.slice(0, 500),
            publishedAt: pubDate ? new Date(pubDate) : undefined,
            metrics: {
              points: 0,
              comments: 0,
            },
          });
        }
      }

      return discoveries.filter((d) => this.passesFilters(d));
    } catch {
      return [];
    }
  }

  private extractXMLTag(xml: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`);
    const match = regex.exec(xml);
    return match?.[1] ?? match?.[2];
  }

  private nodeToRawDiscovery(node: any): RawDiscovery {
    const makers = node.makers ?? [];
    const topics = (node.topics?.edges ?? []).map((e: any) => ({ name: e.node.name }));

    return {
      sourceId: node.id,
      sourceUrl: node.url,
      title: `[PH] ${node.name}: ${node.tagline}`,
      description: node.description,
      author: makers[0]?.name,
      authorUrl: makers[0] ? `https://producthunt.com/@${makers[0].username}` : undefined,
      publishedAt: new Date(node.createdAt),
      metrics: {
        points: node.votesCount,
        comments: node.commentsCount,
      },
      metadata: { ...node, topics } as unknown as Record<string, unknown>,
    };
  }

  private passesFilters(discovery: RawDiscovery): boolean {
    const text = `${discovery.title} ${discovery.description ?? ""}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "developer",
      "api",
      "sdk",
      "open source",
      "automation",
    ];

    return keywords.some((kw) => text.includes(kw.toLowerCase()));
  }

  private categorize(text: string, topics: string[]): HuntDiscovery["category"] {
    if (topics.includes("web3") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (topics.includes("artificial intelligence") || this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (this.hasKeywords(text, ["defi", "lending", "swap"])) {
      return "defi";
    }
    if (topics.includes("developer tools") || this.hasKeywords(text, ["cli", "sdk", "api"])) {
      return "tooling";
    }
    return "other";
  }

  private extractTags(text: string, topics: string[]): string[] {
    const tags = topics.slice(0, 5);

    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private isRecent(post?: PHPost): boolean {
    if (!post?.createdAt) return false;
    const postTime = new Date(post.createdAt);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1000 * 60 * 60);
    return hoursSincePost < 48;
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `producthunt:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
