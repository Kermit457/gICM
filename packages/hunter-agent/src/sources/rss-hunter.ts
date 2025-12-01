/**
 * RSS Hunter - Aggregated news feeds from crypto, AI, and tech sources
 *
 * No API key required. Parses RSS/Atom feeds from multiple sources.
 *
 * Categories:
 * - Crypto News: CoinDesk, The Block, Decrypt, CryptoSlate
 * - AI/Tech News: TechCrunch, Ars Technica, Wired, MIT Tech Review
 * - Developer: Dev.to, Hacker Noon, InfoQ
 * - Market: Bloomberg Crypto, Reuters Tech
 */

import {
  type BaseHunterSource,
  type RawDiscovery,
  type HuntDiscovery,
  type HunterConfig,
  RELEVANCE_KEYWORDS,
} from "../types.js";
import { createHash } from "crypto";

// RSS Feed configuration
interface RSSFeed {
  name: string;
  url: string;
  category: "crypto" | "ai" | "tech" | "dev" | "market";
  priority: number; // 1-5, higher = more important
}

// Parsed RSS item
interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  categories?: string[];
  guid?: string;
}

// Default feeds to monitor
const DEFAULT_FEEDS: RSSFeed[] = [
  // Crypto News (Priority 5)
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "crypto",
    priority: 5,
  },
  {
    name: "The Block",
    url: "https://www.theblock.co/rss.xml",
    category: "crypto",
    priority: 5,
  },
  {
    name: "Decrypt",
    url: "https://decrypt.co/feed",
    category: "crypto",
    priority: 4,
  },
  {
    name: "CryptoSlate",
    url: "https://cryptoslate.com/feed/",
    category: "crypto",
    priority: 4,
  },
  {
    name: "Cointelegraph",
    url: "https://cointelegraph.com/rss",
    category: "crypto",
    priority: 4,
  },

  // AI/Tech News (Priority 4)
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "ai",
    priority: 4,
  },
  {
    name: "MIT Tech Review",
    url: "https://www.technologyreview.com/feed/",
    category: "ai",
    priority: 4,
  },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    category: "tech",
    priority: 3,
  },
  {
    name: "Wired",
    url: "https://www.wired.com/feed/rss",
    category: "tech",
    priority: 3,
  },

  // Developer (Priority 3)
  {
    name: "Dev.to",
    url: "https://dev.to/feed",
    category: "dev",
    priority: 3,
  },
  {
    name: "Hacker Noon",
    url: "https://hackernoon.com/feed",
    category: "dev",
    priority: 3,
  },
  {
    name: "InfoQ",
    url: "https://feed.infoq.com/",
    category: "dev",
    priority: 2,
  },

  // Solana Specific
  {
    name: "Solana Blog",
    url: "https://solana.com/news/rss.xml",
    category: "crypto",
    priority: 5,
  },

  // DeFi Specific
  {
    name: "DeFi Pulse",
    url: "https://defipulse.com/blog/feed/",
    category: "crypto",
    priority: 4,
  },
];

// Simple XML parser for RSS (no external dependencies)
function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Match all <item> or <entry> tags (RSS 2.0 and Atom)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1] || match[2];

    const title = extractTag(content, "title");
    const link =
      extractTag(content, "link") || extractAtomLink(content);
    const description =
      extractTag(content, "description") ||
      extractTag(content, "summary") ||
      extractTag(content, "content");
    const pubDate =
      extractTag(content, "pubDate") ||
      extractTag(content, "published") ||
      extractTag(content, "updated");
    const author =
      extractTag(content, "author") ||
      extractTag(content, "dc:creator");
    const guid = extractTag(content, "guid") || extractTag(content, "id");

    // Extract categories
    const categories: string[] = [];
    const catRegex = /<category[^>]*>([^<]+)<\/category>/gi;
    let catMatch;
    while ((catMatch = catRegex.exec(content)) !== null) {
      categories.push(catMatch[1].trim());
    }

    if (title && link) {
      items.push({
        title: decodeHTMLEntities(title),
        link,
        description: description ? decodeHTMLEntities(stripHTML(description)) : undefined,
        pubDate,
        author,
        categories,
        guid,
      });
    }
  }

  return items;
}

function extractTag(content: string, tag: string): string | undefined {
  // Handle both regular tags and CDATA
  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    "i"
  );
  const regularRegex = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i");

  const cdataMatch = content.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regularMatch = content.match(regularRegex);
  if (regularMatch) return regularMatch[1].trim();

  return undefined;
}

function extractAtomLink(content: string): string | undefined {
  // Atom links: <link href="..." />
  const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i;
  const match = content.match(linkRegex);
  return match ? match[1] : undefined;
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&#x27;": "'",
    "&#x2F;": "/",
  };

  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

export class RSSHunter implements BaseHunterSource {
  source = "rss" as const;
  private config: HunterConfig;
  private feeds: RSSFeed[];
  private seenGuids: Set<string> = new Set();

  constructor(config: HunterConfig & { feeds?: RSSFeed[] }) {
    this.config = config;
    this.feeds = config.feeds || DEFAULT_FEEDS;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Fetch all feeds in parallel (with concurrency limit)
    const results = await Promise.allSettled(
      this.feeds.map((feed) => this.fetchFeed(feed))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const feed = this.feeds[i];

      if (result.status === "fulfilled" && result.value) {
        for (const item of result.value) {
          // Check if already seen
          const guid = item.guid || item.link;
          if (this.seenGuids.has(guid)) continue;

          // Check age
          if (item.pubDate) {
            const pubDate = new Date(item.pubDate);
            if (now.getTime() - pubDate.getTime() > maxAge) continue;
          }

          // Apply keyword filters if configured
          if (this.config.filters?.keywords?.length) {
            const text = `${item.title} ${item.description || ""}`.toLowerCase();
            const hasKeyword = this.config.filters.keywords.some((k) =>
              text.includes(k.toLowerCase())
            );
            if (!hasKeyword) continue;
          }

          // Apply exclude filters
          if (this.config.filters?.excludeKeywords?.length) {
            const text = `${item.title} ${item.description || ""}`.toLowerCase();
            const hasExcluded = this.config.filters.excludeKeywords.some((k) =>
              text.includes(k.toLowerCase())
            );
            if (hasExcluded) continue;
          }

          this.seenGuids.add(guid);
          discoveries.push(this.createDiscovery(item, feed));
        }
      } else if (result.status === "rejected") {
        console.warn(`[RSSHunter] Failed to fetch ${feed.name}:`, result.reason);
      }
    }

    // Sort by priority and recency
    discoveries.sort((a, b) => {
      const priorityA = (a.metadata as Record<string, unknown>)?.priority as number || 1;
      const priorityB = (b.metadata as Record<string, unknown>)?.priority as number || 1;
      if (priorityA !== priorityB) return priorityB - priorityA;

      const dateA = a.publishedAt?.getTime() || 0;
      const dateB = b.publishedAt?.getTime() || 0;
      return dateB - dateA;
    });

    return discoveries.slice(0, 50); // Limit to 50 items per hunt
  }

  private async fetchFeed(feed: RSSFeed): Promise<RSSItem[]> {
    try {
      const response = await fetch(feed.url, {
        headers: {
          Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml",
          "User-Agent": "gICM-HunterAgent/1.0",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xml = await response.text();
      return parseRSSXML(xml);
    } catch (error) {
      console.error(`[RSSHunter] Error fetching ${feed.name}:`, error);
      return [];
    }
  }

  private createDiscovery(item: RSSItem, feed: RSSFeed): RawDiscovery {
    const emoji = this.getCategoryEmoji(feed.category);

    return {
      sourceId: `rss-${feed.name}-${createHash("md5").update(item.link).digest("hex").slice(0, 8)}`,
      sourceUrl: item.link,
      title: `${emoji} ${item.title}`,
      description: item.description?.slice(0, 500),
      author: item.author || feed.name,
      authorUrl: new URL(item.link).origin,
      publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
      metrics: {
        points: feed.priority,
      },
      metadata: {
        type: "news_article",
        feedName: feed.name,
        feedCategory: feed.category,
        priority: feed.priority,
        categories: item.categories,
        guid: item.guid,
      },
    };
  }

  private getCategoryEmoji(category: RSSFeed["category"]): string {
    switch (category) {
      case "crypto":
        return "🪙";
      case "ai":
        return "🤖";
      case "tech":
        return "💻";
      case "dev":
        return "👨‍💻";
      case "market":
        return "📊";
      default:
        return "📰";
    }
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
    const hasTypeScript = RELEVANCE_KEYWORDS.typescript.some((k) =>
      text.includes(k.toLowerCase())
    );

    // High engagement = priority 4-5 sources
    const priority = (metadata.priority as number) || 1;
    const highEngagement = priority >= 4;

    // Determine category
    let category: "web3" | "defi" | "ai" | "nft" | "tooling" | "other" = "other";
    const feedCategory = metadata.feedCategory as string;

    if (feedCategory === "crypto") {
      category = hasWeb3Keywords ? "web3" : "defi";
      if (text.includes("nft")) category = "nft";
    } else if (feedCategory === "ai") {
      category = "ai";
    } else if (feedCategory === "dev") {
      category = "tooling";
    }

    // Generate tags from article categories and keywords
    const tags: string[] = ["news"];
    tags.push(feedCategory);
    if (metadata.categories && Array.isArray(metadata.categories)) {
      const articleCats = metadata.categories as string[];
      tags.push(...articleCats.slice(0, 5).map((c) => c.toLowerCase().replace(/\s+/g, "-")));
    }
    if (hasSolanaKeywords) tags.push("solana");
    if (hasEthereumKeywords) tags.push("ethereum");
    if (hasAIKeywords) tags.push("ai");
    if (hasWeb3Keywords) tags.push("web3");

    // Fingerprint for deduplication
    const fingerprint = createHash("md5")
      .update(raw.sourceUrl)
      .digest("hex")
      .slice(0, 16);

    return {
      id: `rss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: this.source,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category,
      tags: [...new Set(tags)], // Dedupe tags
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords,
        hasAIKeywords,
        hasSolanaKeywords,
        hasEthereumKeywords,
        hasTypeScript,
        recentActivity: true, // All items are recent (< 24h)
        highEngagement,
        isShowHN: false,
      },
      rawMetadata: raw.metadata,
      fingerprint,
    };
  }
}

// Export feed type for external configuration
export type { RSSFeed };
export { DEFAULT_FEEDS };
