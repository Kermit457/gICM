import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// npm Registry API - 100% Free, No Auth Required
const NPM_API = "https://api.npmjs.org";
const NPM_REGISTRY = "https://registry.npmjs.org";

interface NPMDownloads {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

interface NPMPackageInfo {
  name: string;
  description?: string;
  "dist-tags": { latest: string };
  time: Record<string, string>;
  keywords?: string[];
  repository?: { url?: string };
  author?: { name?: string };
  maintainers?: Array<{ name: string }>;
}

// Key packages to track for tech trends
const TRACKED_PACKAGES = [
  // AI/ML
  { name: "langchain", category: "ai" },
  { name: "@langchain/core", category: "ai" },
  { name: "openai", category: "ai" },
  { name: "@anthropic-ai/sdk", category: "ai" },
  { name: "ai", category: "ai" }, // Vercel AI SDK
  { name: "ollama", category: "ai" },

  // Crypto/Web3
  { name: "@solana/web3.js", category: "crypto" },
  { name: "ethers", category: "crypto" },
  { name: "viem", category: "crypto" },
  { name: "wagmi", category: "crypto" },
  { name: "@coral-xyz/anchor", category: "crypto" },

  // Frontend Frameworks
  { name: "react", category: "frontend" },
  { name: "next", category: "frontend" },
  { name: "vue", category: "frontend" },
  { name: "svelte", category: "frontend" },
  { name: "solid-js", category: "frontend" },
  { name: "astro", category: "frontend" },

  // Backend/Runtime
  { name: "express", category: "backend" },
  { name: "fastify", category: "backend" },
  { name: "hono", category: "backend" },
  { name: "elysia", category: "backend" },

  // Dev Tools
  { name: "typescript", category: "tooling" },
  { name: "vite", category: "tooling" },
  { name: "turbo", category: "tooling" },
  { name: "bun", category: "tooling" },
  { name: "tsx", category: "tooling" },
];

export class NPMHunter implements BaseHunterSource {
  source = "npm" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    for (const pkg of TRACKED_PACKAGES) {
      try {
        const downloads = await this.fetchDownloads(pkg.name);
        const info = await this.fetchPackageInfo(pkg.name);

        if (downloads && info) {
          const trend = await this.calculateTrend(pkg.name);
          const discovery = this.createDiscovery(pkg, downloads, info, trend);
          if (discovery) {
            discoveries.push(discovery);
          }
        }

        await new Promise((r) => setTimeout(r, 200)); // Be nice to npm
      } catch (error) {
        console.error(`[NPMHunter] Failed to fetch ${pkg.name}:`, error);
      }
    }

    // Sort by download growth and return significant ones
    return discoveries
      .filter((d) => d.metrics.likes !== undefined && Math.abs(d.metrics.likes) > 5)
      .sort((a, b) => (b.metrics.likes ?? 0) - (a.metrics.likes ?? 0));
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata as { category: string; trend: number } | undefined;

    return {
      id: randomUUID(),
      source: "npm" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(metadata?.category),
      tags: this.extractTags(text, metadata),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: this.hasKeywords(text, RELEVANCE_KEYWORDS.typescript),
        recentActivity: (metadata?.trend ?? 0) > 10,
        highEngagement: (metadata?.trend ?? 0) > 20,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchDownloads(packageName: string): Promise<NPMDownloads | null> {
    const response = await fetch(
      `${NPM_API}/downloads/point/last-week/${encodeURIComponent(packageName)}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );

    if (!response.ok) return null;
    return response.json();
  }

  private async fetchPackageInfo(packageName: string): Promise<NPMPackageInfo | null> {
    const response = await fetch(
      `${NPM_REGISTRY}/${encodeURIComponent(packageName)}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );

    if (!response.ok) return null;
    return response.json();
  }

  private async calculateTrend(packageName: string): Promise<number> {
    // Compare this week vs last week
    const thisWeek = await this.fetchDownloads(packageName);

    // Fetch last week (hacky but works)
    const lastWeekResponse = await fetch(
      `${NPM_API}/downloads/point/last-month/${encodeURIComponent(packageName)}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );

    if (!lastWeekResponse.ok || !thisWeek) return 0;

    const lastMonth = await lastWeekResponse.json();
    const avgWeeklyLastMonth = lastMonth.downloads / 4;

    if (avgWeeklyLastMonth === 0) return 0;

    return ((thisWeek.downloads - avgWeeklyLastMonth) / avgWeeklyLastMonth) * 100;
  }

  private createDiscovery(
    pkg: typeof TRACKED_PACKAGES[0],
    downloads: NPMDownloads,
    info: NPMPackageInfo,
    trend: number
  ): RawDiscovery | null {
    const emoji = trend > 0 ? "📈" : trend < 0 ? "📉" : "➡️";
    const trendStr = trend !== 0 ? ` (${trend > 0 ? "+" : ""}${trend.toFixed(1)}%)` : "";

    // Get last publish date
    const latestVersion = info["dist-tags"]?.latest;
    const lastPublish = latestVersion ? info.time[latestVersion] : undefined;
    const isRecentlyUpdated = lastPublish
      ? (Date.now() - new Date(lastPublish).getTime()) < 7 * 24 * 60 * 60 * 1000
      : false;

    return {
      sourceId: `npm:${pkg.name}:${downloads.end}`,
      sourceUrl: `https://www.npmjs.com/package/${pkg.name}`,
      title: `${emoji} [NPM] ${pkg.name}: ${this.formatNumber(downloads.downloads)}/week${trendStr}`,
      description: `${info.description || pkg.name}${isRecentlyUpdated ? " | Recently updated!" : ""} | Category: ${pkg.category}`,
      author: info.author?.name || info.maintainers?.[0]?.name,
      authorUrl: info.repository?.url?.replace("git+", "").replace(".git", ""),
      publishedAt: lastPublish ? new Date(lastPublish) : undefined,
      metrics: {
        points: downloads.downloads,
        likes: trend,
        views: isRecentlyUpdated ? 1 : 0,
      },
      metadata: {
        ...pkg,
        downloads: downloads.downloads,
        trend,
        latestVersion,
        lastPublish,
        keywords: info.keywords,
      } as unknown as Record<string, unknown>,
    };
  }

  private categorize(category?: string): HuntDiscovery["category"] {
    if (category === "ai") return "ai";
    if (category === "crypto") return "web3";
    if (category === "tooling") return "tooling";
    return "other";
  }

  private extractTags(text: string, metadata?: { category: string; trend: number }): string[] {
    const tags = ["npm", "javascript", "typescript"];

    if (metadata?.category) {
      tags.push(metadata.category);
    }

    if ((metadata?.trend ?? 0) > 20) tags.push("trending");
    if ((metadata?.trend ?? 0) < -20) tags.push("declining");

    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `npm:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
