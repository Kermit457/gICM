import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
  RELEVANCE_KEYWORDS,
} from "../types.js";

// TikTok scraping via Apify Actor
const APIFY_API = "https://api.apify.com/v2";

interface TikTokVideo {
  id: string;
  text: string;
  createTime: number;
  authorMeta: {
    id: string;
    name: string;
    nickName: string;
    verified: boolean;
    signature?: string;
  };
  musicMeta?: {
    musicName: string;
    musicAuthor: string;
  };
  hashtags?: Array<{ name: string }>;
  videoMeta: {
    duration: number;
    coverUrl?: string;
  };
  diggCount: number;  // likes
  shareCount: number;
  playCount: number;
  commentCount: number;
  webVideoUrl: string;
}

// High-value hashtags for crypto/AI alpha
const TARGET_HASHTAGS = [
  // Crypto
  "crypto",
  "bitcoin",
  "ethereum",
  "solana",
  "defi",
  "web3",
  "nft",
  "altcoin",
  "cryptotok",
  "cryptonews",
  // AI
  "ai",
  "chatgpt",
  "artificialintelligence",
  "machinelearning",
  "aitools",
  // Tech/Dev
  "coding",
  "programming",
  "tech",
  "startup",
  "developer",
];

export class TikTokHunter implements BaseHunterSource {
  source = "tiktok" as const;
  private config: HunterConfig;
  private apifyToken?: string;

  constructor(config: HunterConfig) {
    this.config = config;
    this.apifyToken = config.apiToken ?? process.env.APIFY_TOKEN;
  }

  async hunt(): Promise<RawDiscovery[]> {
    if (!this.apifyToken) {
      console.error("[TikTokHunter] No Apify token configured");
      return [];
    }

    const discoveries: RawDiscovery[] = [];

    // Hunt each target hashtag
    for (const hashtag of TARGET_HASHTAGS.slice(0, 5)) { // Limit to save API calls
      try {
        const videos = await this.searchHashtag(hashtag);
        discoveries.push(...videos);
        await new Promise((r) => setTimeout(r, 2000)); // Rate limit
      } catch (error) {
        console.error(`[TikTokHunter] Failed to search #${hashtag}:`, error);
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
    const metadata = raw.metadata as TikTokVideo | undefined;

    const hashtags = metadata?.hashtags?.map((h) => h.name.toLowerCase()) ?? [];

    return {
      id: randomUUID(),
      source: "tiktok" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(text, hashtags),
      tags: this.extractTags(text, hashtags),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.web3),
        hasAIKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ai),
        hasSolanaKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.solana),
        hasEthereumKeywords: this.hasKeywords(text, RELEVANCE_KEYWORDS.ethereum),
        hasTypeScript: false,
        recentActivity: this.isRecent(metadata),
        highEngagement: (raw.metrics.views ?? 0) > 100000 || (raw.metrics.likes ?? 0) > 10000,
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async searchHashtag(hashtag: string): Promise<RawDiscovery[]> {
    // Run Apify Actor synchronously
    const runUrl = `${APIFY_API}/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items`;

    const response = await fetch(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apifyToken}`,
      },
      body: JSON.stringify({
        hashtags: [hashtag],
        resultsPerPage: 30,
        profileScrapeSections: ["videos"],
        profileSorting: "latest",
        excludePinnedPosts: false,
        searchSection: "",
        maxProfilesPerQuery: 5,
        scrapeRelatedVideos: false,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[TikTokHunter] Apify error for #${hashtag}:`, error);
      return [];
    }

    const videos = (await response.json()) as TikTokVideo[];
    return videos.filter((v) => this.passesFilters(v)).map((v) => this.videoToRawDiscovery(v, hashtag));
  }

  private passesFilters(video: TikTokVideo): boolean {
    const minViews = this.config.filters?.minPoints ?? 10000;
    if (video.playCount < minViews) return false;

    // Check keywords
    const text = `${video.text} ${video.hashtags?.map((h) => h.name).join(" ") ?? ""}`.toLowerCase();
    const keywords = this.config.filters?.keywords ?? [
      ...RELEVANCE_KEYWORDS.web3,
      ...RELEVANCE_KEYWORDS.ai,
      "alpha",
      "gem",
      "100x",
      "pump",
      "launch",
      "airdrop",
    ];

    const matchesKeywords = keywords.some((kw) => text.includes(kw.toLowerCase()));

    // High engagement videos always pass
    if (video.playCount >= 1000000 || video.diggCount >= 100000) return true;

    return matchesKeywords;
  }

  private videoToRawDiscovery(video: TikTokVideo, hashtag: string): RawDiscovery {
    const text = video.text.slice(0, 200);
    const username = video.authorMeta.name;

    return {
      sourceId: video.id,
      sourceUrl: video.webVideoUrl,
      title: `[TikTok #${hashtag}] @${username}: ${text}`,
      description: video.text,
      author: video.authorMeta.nickName || video.authorMeta.name,
      authorUrl: `https://tiktok.com/@${username}`,
      publishedAt: new Date(video.createTime * 1000),
      metrics: {
        views: video.playCount,
        likes: video.diggCount,
        comments: video.commentCount,
        reposts: video.shareCount,
      },
      metadata: video as unknown as Record<string, unknown>,
    };
  }

  private categorize(text: string, hashtags: string[]): HuntDiscovery["category"] {
    const hastagSet = new Set(hashtags);

    if (hastagSet.has("crypto") || hastagSet.has("bitcoin") || hastagSet.has("solana") ||
        hastagSet.has("ethereum") || this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) {
      return "web3";
    }
    if (hastagSet.has("ai") || hastagSet.has("chatgpt") ||
        this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) {
      return "ai";
    }
    if (hastagSet.has("defi") || this.hasKeywords(text, ["defi", "yield", "lending"])) {
      return "defi";
    }
    if (hastagSet.has("nft")) {
      return "nft";
    }
    return "other";
  }

  private extractTags(text: string, hashtags: string[]): string[] {
    const tags = hashtags.slice(0, 5);

    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.web3)) tags.push("web3");
    if (this.hasKeywords(text, RELEVANCE_KEYWORDS.ai)) tags.push("ai");
    if (this.hasKeywords(text, ["alpha", "gem", "100x"])) tags.push("alpha");

    return [...new Set(tags)];
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private isRecent(video?: TikTokVideo): boolean {
    if (!video?.createTime) return false;
    const postTime = new Date(video.createTime * 1000);
    const hoursSincePost = (Date.now() - postTime.getTime()) / (1000 * 60 * 60);
    return hoursSincePost < 24;
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `tiktok:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
