import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// ArXiv API for research papers
const ARXIV_API = "http://export.arxiv.org/api/query";

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  updated: string;
  link: string;
  categories: string[];
  pdfLink?: string;
}

// High-value ArXiv categories for AI/ML/Crypto
const TARGET_CATEGORIES = [
  "cs.AI",      // Artificial Intelligence
  "cs.LG",      // Machine Learning
  "cs.CL",      // Computation and Language (NLP)
  "cs.CV",      // Computer Vision
  "cs.CR",      // Cryptography and Security
  "cs.DC",      // Distributed Computing
  "cs.NE",      // Neural and Evolutionary Computing
  "stat.ML",    // Machine Learning (stat)
];

// Search queries for crypto/web3 papers
const SEARCH_QUERIES = [
  "blockchain",
  "smart contract",
  "decentralized",
  "large language model",
  "transformer",
  "attention mechanism",
  "AI agent",
  "reinforcement learning",
  "zero knowledge",
  "zkSNARK",
];

export class ArxivHunter implements BaseHunterSource {
  source = "arxiv" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // Fetch from each category
    for (const category of TARGET_CATEGORIES.slice(0, 5)) { // Limit to avoid rate limits
      try {
        const papers = await this.fetchCategory(category, 20);
        discoveries.push(...papers);
        await new Promise((r) => setTimeout(r, 3000)); // 3s delay per ArXiv ToS
      } catch (error) {
        console.error(`[ArxivHunter] Failed to fetch ${category}:`, error);
      }
    }

    // Also search by keywords
    for (const query of SEARCH_QUERIES.slice(0, 3)) {
      try {
        const papers = await this.searchPapers(query, 10);
        discoveries.push(...papers);
        await new Promise((r) => setTimeout(r, 3000));
      } catch (error) {
        console.error(`[ArxivHunter] Failed to search "${query}":`, error);
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
    const metadata = raw.metadata as ArxivEntry | undefined;

    return {
      id: randomUUID(),
      source: "arxiv" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(text, metadata?.categories ?? []),
      tags: this.extractTags(text, metadata?.categories ?? []),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: this.isRecent(metadata),
        highEngagement: false, // ArXiv doesn't have engagement metrics
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchCategory(category: string, maxResults: number): Promise<RawDiscovery[]> {
    const params = new URLSearchParams({
      search_query: `cat:${category}`,
      start: "0",
      max_results: String(maxResults),
      sortBy: "submittedDate",
      sortOrder: "descending",
    });

    const response = await fetch(`${ARXIV_API}?${params}`);
    if (!response.ok) return [];

    const xml = await response.text();
    return this.parseAtomFeed(xml);
  }

  private async searchPapers(query: string, maxResults: number): Promise<RawDiscovery[]> {
    const params = new URLSearchParams({
      search_query: `all:${query}`,
      start: "0",
      max_results: String(maxResults),
      sortBy: "submittedDate",
      sortOrder: "descending",
    });

    const response = await fetch(`${ARXIV_API}?${params}`);
    if (!response.ok) return [];

    const xml = await response.text();
    return this.parseAtomFeed(xml);
  }

  private parseAtomFeed(xml: string): RawDiscovery[] {
    const discoveries: RawDiscovery[] = [];

    // Parse Atom entries (simplified XML parsing)
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];

      const id = this.extractTag(entry, "id");
      const title = this.extractTag(entry, "title")?.replace(/\s+/g, " ").trim();
      const summary = this.extractTag(entry, "summary")?.replace(/\s+/g, " ").trim();
      const published = this.extractTag(entry, "published");
      const updated = this.extractTag(entry, "updated");

      // Extract authors
      const authorRegex = /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g;
      const authors: string[] = [];
      let authorMatch;
      while ((authorMatch = authorRegex.exec(entry)) !== null) {
        authors.push(authorMatch[1]);
      }

      // Extract categories
      const categoryRegex = /category term="([^"]+)"/g;
      const categories: string[] = [];
      let catMatch;
      while ((catMatch = categoryRegex.exec(entry)) !== null) {
        categories.push(catMatch[1]);
      }

      // Extract PDF link
      const pdfMatch = /href="([^"]+)" title="pdf"/i.exec(entry);
      const pdfLink = pdfMatch?.[1];

      if (id && title) {
        const arxivId = id.replace("http://arxiv.org/abs/", "");

        if (!this.passesFilters(title, summary ?? "", categories)) continue;

        discoveries.push({
          sourceId: arxivId,
          sourceUrl: id,
          title: `[ArXiv] ${title}`,
          description: summary?.slice(0, 800),
          author: authors.slice(0, 3).join(", "),
          authorUrl: `https://arxiv.org/search/?query=${encodeURIComponent(authors[0] ?? "")}&searchtype=author`,
          publishedAt: published ? new Date(published) : undefined,
          metrics: {
            views: 0,
          },
          metadata: {
            id: arxivId,
            title,
            summary,
            authors,
            published,
            updated,
            link: id,
            categories,
            pdfLink,
          } as unknown as Record<string, unknown>,
        });
      }
    }

    return discoveries;
  }

  private extractTag(xml: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const match = regex.exec(xml);
    return match?.[1];
  }

  private passesFilters(title: string, summary: string, categories: string[]): boolean {
    const text = `${title} ${summary}`.toLowerCase();

    // High-value categories always pass
    if (categories.some((c) => TARGET_CATEGORIES.includes(c))) {
      return true;
    }

    // Check for relevant keywords
    const keywords = [
      ...RELEVANCE_KEYWORDS.ai,
      ...RELEVANCE_KEYWORDS.web3,
      "zero knowledge",
      "zksnark",
      "zkstark",
      "mpc",
      "homomorphic",
    ];

    return keywords.some((kw) => text.includes(kw.toLowerCase()));
  }

  private categorize(text: string, categories: string[]): HuntDiscovery["category"] {
    if (categories.includes("cs.CR") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (
      categories.some((c) => ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE", "stat.ML"].includes(c)) ||
      this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)
    ) {
      return "ai";
    }
    return "other";
  }

  private extractTags(text: string, categories: string[]): string[] {
    const tags = categories.slice(0, 3);

    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, ["llm", "large language model", "gpt", "transformer"])) {
      tags.push("llm");
    }
    if (this.hasKeywords(text, ["zero knowledge", "zksnark", "zkstark"])) {
      tags.push("zk");
    }

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private isRecent(entry?: ArxivEntry): boolean {
    if (!entry?.published) return false;
    const pubTime = new Date(entry.published);
    const daysSincePub = (Date.now() - pubTime.getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePub < 7;
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `arxiv:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
