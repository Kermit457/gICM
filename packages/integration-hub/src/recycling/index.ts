/**
 * Content Recycling Engine
 *
 * Transforms long-form content into multiple formats for distribution:
 * - Article → Thread (Twitter, Farcaster, Bluesky)
 * - Article → Short posts (LinkedIn, Mastodon, Threads)
 * - Article → Bullet summaries (Reddit, HN)
 * - Article → Email digest
 * - Article → RSS entry
 *
 * Also handles:
 * - Re-purposing old content for new channels
 * - A/B testing different angles
 * - Scheduling recycled content
 */

import type {
  ContentArticle,
  ContentBrief,
  DistributionPacket,
  RSSEntry,
  EmailDigest,
} from "../types/content.js";

// =============================================================================
// TYPES
// =============================================================================

export interface RecyclingConfig {
  // Character limits per platform
  limits?: {
    twitter?: number;      // 280
    farcaster?: number;    // 1024
    bluesky?: number;      // 300
    linkedin?: number;     // 3000
    mastodon?: number;     // 500
    threads?: number;      // 500
  };

  // Include links in recycled content
  includeLinks?: boolean;

  // Include hashtags
  includeHashtags?: boolean;

  // Max hashtags per post
  maxHashtags?: number;

  // Brand voice settings
  brandVoice?: "professional" | "casual" | "technical" | "friendly";

  // Add call-to-action
  ctaEnabled?: boolean;
  ctaText?: string;
}

export interface RecycledContent {
  // Thread formats (array of posts)
  twitterThread: string[];
  farcasterThread: string[];
  blueskyThread: string[];

  // Single post formats
  linkedinPost: string;
  mastodonPost: string;
  threadsPost: string;
  farcasterCast: string;
  blueskyPost: string;
  lensPost: string;
  paragraphPost: string;

  // Long-form
  redditPost: string;
  hnPost: string;

  // Email/RSS
  emailDigest: EmailDigest;
  rssEntry: RSSEntry;

  // Metadata
  hashtags: string[];
  keyPoints: string[];
  title: string;
  slug: string;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_LIMITS = {
  twitter: 280,
  farcaster: 1024,
  bluesky: 300,
  linkedin: 3000,
  mastodon: 500,
  threads: 500,
};

const DEFAULT_CONFIG: RecyclingConfig = {
  limits: DEFAULT_LIMITS,
  includeLinks: true,
  includeHashtags: true,
  maxHashtags: 5,
  brandVoice: "professional",
  ctaEnabled: true,
  ctaText: "Read more:",
};

// =============================================================================
// CONTENT RECYCLING ENGINE
// =============================================================================

export class ContentRecycler {
  private config: RecyclingConfig;

  constructor(config: Partial<RecyclingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Recycle an article into all distribution formats
   */
  async recycle(
    article: ContentArticle,
    brief: ContentBrief,
    canonicalUrl?: string
  ): Promise<RecycledContent> {
    // Extract key information
    const title = brief.keyIdea || this.extractTitle(article.markdown);
    const slug = article.seo?.slug || this.generateSlug(title);
    const keyPoints = this.extractKeyPoints(article.markdown);
    const hashtags = this.generateHashtags(brief, article);

    // Generate all formats
    const [
      twitterThread,
      farcasterThread,
      blueskyThread,
      linkedinPost,
      mastodonPost,
      threadsPost,
      farcasterCast,
      blueskyPost,
      lensPost,
      paragraphPost,
      redditPost,
      hnPost,
      emailDigest,
      rssEntry,
    ] = await Promise.all([
      this.generateTwitterThread(article, brief, keyPoints, hashtags, canonicalUrl),
      this.generateFarcasterThread(article, brief, keyPoints, canonicalUrl),
      this.generateBlueskyThread(article, brief, keyPoints, canonicalUrl),
      this.generateLinkedInPost(article, brief, keyPoints, hashtags, canonicalUrl),
      this.generateMastodonPost(article, brief, keyPoints, hashtags, canonicalUrl),
      this.generateThreadsPost(article, brief, keyPoints, canonicalUrl),
      this.generateFarcasterCast(article, brief, keyPoints, canonicalUrl),
      this.generateBlueskyPost(article, brief, keyPoints, canonicalUrl),
      this.generateLensPost(article, brief, keyPoints, canonicalUrl),
      this.generateParagraphPost(article, brief),
      this.generateRedditPost(article, brief, keyPoints, canonicalUrl),
      this.generateHNPost(article, brief, canonicalUrl),
      this.generateEmailDigest(article, brief, keyPoints, canonicalUrl),
      this.generateRSSEntry(article, brief, canonicalUrl),
    ]);

    return {
      twitterThread,
      farcasterThread,
      blueskyThread,
      linkedinPost,
      mastodonPost,
      threadsPost,
      farcasterCast,
      blueskyPost,
      lensPost,
      paragraphPost,
      redditPost,
      hnPost,
      emailDigest,
      rssEntry,
      hashtags,
      keyPoints,
      title,
      slug,
    };
  }

  /**
   * Create a distribution packet from recycled content
   */
  createDistributionPacket(
    recycled: RecycledContent,
    article: ContentArticle,
    canonicalUrl?: string
  ): Omit<DistributionPacket, "id" | "createdAt"> {
    return {
      articleId: article.id,
      baseSlug: recycled.slug,
      canonicalUrl,
      blogPost: article.markdown,
      substackBody: article.markdown,
      mirrorBody: article.markdown,
      mediumBody: article.markdown,
      devtoBody: article.markdown,
      hashnodeBody: article.markdown,
      githubReadme: this.generateReadme(article, recycled),
      rssEntry: recycled.rssEntry,
      emailDigest: recycled.emailDigest,
      farcasterCast: recycled.farcasterCast,
      lensPost: recycled.lensPost,
      paragraphPost: recycled.paragraphPost,
      blueskyPost: recycled.blueskyPost,
      mastodonPost: recycled.mastodonPost,
      twitterThread: recycled.twitterThread,
      linkedinPost: recycled.linkedinPost,
      redditDraft: recycled.redditPost,
      threadsDraft: recycled.threadsPost,
      status: "ready",
    };
  }

  // ===========================================================================
  // THREAD GENERATORS
  // ===========================================================================

  private async generateTwitterThread(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    hashtags: string[],
    canonicalUrl?: string
  ): Promise<string[]> {
    const limit = this.config.limits?.twitter || 280;
    const thread: string[] = [];

    // Hook tweet
    const hook = this.generateHook(brief, "twitter");
    thread.push(this.truncate(hook, limit));

    // Key points as individual tweets
    for (const point of keyPoints.slice(0, 5)) {
      const tweet = `→ ${point}`;
      thread.push(this.truncate(tweet, limit));
    }

    // CTA tweet
    if (this.config.ctaEnabled && canonicalUrl) {
      const hashtagStr = this.config.includeHashtags
        ? `\n\n${hashtags.slice(0, 3).map(h => `#${h}`).join(" ")}`
        : "";
      const cta = `${this.config.ctaText || "Read more:"}\n${canonicalUrl}${hashtagStr}`;
      thread.push(this.truncate(cta, limit));
    }

    return thread;
  }

  private async generateFarcasterThread(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    canonicalUrl?: string
  ): Promise<string[]> {
    const limit = this.config.limits?.farcaster || 1024;
    const thread: string[] = [];

    // Farcaster allows longer posts, so we can be more detailed
    const hook = this.generateHook(brief, "farcaster");
    const intro = `${hook}\n\nKey takeaways:`;
    thread.push(this.truncate(intro, limit));

    // Combine key points into fewer, longer posts
    let currentPost = "";
    for (const point of keyPoints) {
      const addition = `\n• ${point}`;
      if ((currentPost + addition).length > limit - 100) {
        thread.push(currentPost.trim());
        currentPost = addition;
      } else {
        currentPost += addition;
      }
    }
    if (currentPost.trim()) {
      thread.push(currentPost.trim());
    }

    // CTA
    if (canonicalUrl) {
      thread.push(`Read the full article: ${canonicalUrl}`);
    }

    return thread;
  }

  private async generateBlueskyThread(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    canonicalUrl?: string
  ): Promise<string[]> {
    const limit = this.config.limits?.bluesky || 300;
    const thread: string[] = [];

    // Hook
    const hook = this.generateHook(brief, "bluesky");
    thread.push(this.truncate(hook, limit));

    // Key points
    for (const point of keyPoints.slice(0, 4)) {
      thread.push(this.truncate(`→ ${point}`, limit));
    }

    // CTA
    if (canonicalUrl) {
      thread.push(this.truncate(`Full article: ${canonicalUrl}`, limit));
    }

    return thread;
  }

  // ===========================================================================
  // SINGLE POST GENERATORS
  // ===========================================================================

  private async generateLinkedInPost(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    hashtags: string[],
    canonicalUrl?: string
  ): Promise<string> {
    const limit = this.config.limits?.linkedin || 3000;

    const hook = this.generateHook(brief, "linkedin");
    const pointsList = keyPoints.map(p => `• ${p}`).join("\n");
    const hashtagStr = this.config.includeHashtags
      ? `\n\n${hashtags.slice(0, 5).map(h => `#${h}`).join(" ")}`
      : "";
    const link = canonicalUrl ? `\n\n🔗 ${canonicalUrl}` : "";

    const post = `${hook}\n\n${pointsList}${link}${hashtagStr}`;
    return this.truncate(post, limit);
  }

  private async generateMastodonPost(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    hashtags: string[],
    canonicalUrl?: string
  ): Promise<string> {
    const limit = this.config.limits?.mastodon || 500;

    const hook = this.generateHook(brief, "mastodon");
    const points = keyPoints.slice(0, 2).map(p => `• ${p}`).join("\n");
    const hashtagStr = this.config.includeHashtags
      ? `\n\n${hashtags.slice(0, 3).map(h => `#${h}`).join(" ")}`
      : "";
    const link = canonicalUrl ? `\n\n${canonicalUrl}` : "";

    const post = `${hook}\n\n${points}${link}${hashtagStr}`;
    return this.truncate(post, limit);
  }

  private async generateThreadsPost(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    canonicalUrl?: string
  ): Promise<string> {
    const limit = this.config.limits?.threads || 500;

    const hook = this.generateHook(brief, "threads");
    const points = keyPoints.slice(0, 2).map(p => `→ ${p}`).join("\n");
    const link = canonicalUrl ? `\n\n${canonicalUrl}` : "";

    const post = `${hook}\n\n${points}${link}`;
    return this.truncate(post, limit);
  }

  private async generateFarcasterCast(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    canonicalUrl?: string
  ): Promise<string> {
    const limit = this.config.limits?.farcaster || 1024;

    const hook = this.generateHook(brief, "farcaster");
    const points = keyPoints.slice(0, 3).map(p => `• ${p}`).join("\n");
    const link = canonicalUrl ? `\n\n${canonicalUrl}` : "";

    const post = `${hook}\n\n${points}${link}`;
    return this.truncate(post, limit);
  }

  private async generateBlueskyPost(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    canonicalUrl?: string
  ): Promise<string> {
    const limit = this.config.limits?.bluesky || 300;

    const hook = this.generateHook(brief, "bluesky");
    const link = canonicalUrl ? `\n\n${canonicalUrl}` : "";

    const post = `${hook}${link}`;
    return this.truncate(post, limit);
  }

  private async generateLensPost(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    canonicalUrl?: string
  ): Promise<string> {
    // Lens supports longer posts (up to 10KB)
    const limit = 5000;

    const hook = this.generateHook(brief, "lens");
    const points = keyPoints.map(p => `• ${p}`).join("\n");
    const link = canonicalUrl ? `\n\nRead more: ${canonicalUrl}` : "";

    const post = `${hook}\n\n${points}${link}`;
    return this.truncate(post, limit);
  }

  private async generateParagraphPost(
    article: ContentArticle,
    brief: ContentBrief
  ): Promise<string> {
    // Paragraph is a publishing platform - use the full article
    return article.markdown;
  }

  // ===========================================================================
  // LONG-FORM GENERATORS
  // ===========================================================================

  private async generateRedditPost(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    canonicalUrl?: string
  ): Promise<string> {
    const title = brief.keyIdea;
    const tldr = keyPoints.slice(0, 3).map(p => `- ${p}`).join("\n");
    const link = canonicalUrl ? `\n\n[Full article](${canonicalUrl})` : "";

    return `# ${title}\n\n**TL;DR:**\n${tldr}\n\n---\n\n${article.markdown.slice(0, 5000)}${link}`;
  }

  private async generateHNPost(
    article: ContentArticle,
    brief: ContentBrief,
    canonicalUrl?: string
  ): Promise<string> {
    // HN prefers links to articles, minimal commentary
    return canonicalUrl || brief.keyIdea;
  }

  // ===========================================================================
  // EMAIL/RSS GENERATORS
  // ===========================================================================

  private async generateEmailDigest(
    article: ContentArticle,
    brief: ContentBrief,
    keyPoints: string[],
    canonicalUrl?: string
  ): Promise<EmailDigest> {
    const title = brief.keyIdea;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">${title}</h1>

  <h2 style="color: #666;">Key Takeaways</h2>
  <ul>
    ${keyPoints.map(p => `<li>${p}</li>`).join("\n    ")}
  </ul>

  ${canonicalUrl ? `<p><a href="${canonicalUrl}" style="color: #0066cc;">Read the full article →</a></p>` : ""}

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">You're receiving this because you subscribed to gICM updates.</p>
</body>
</html>`;

    const textBody = `${title}\n\n${keyPoints.map(p => `• ${p}`).join("\n")}\n\n${canonicalUrl ? `Read more: ${canonicalUrl}` : ""}`;

    return {
      subject: title,
      previewText: keyPoints[0] || title,
      htmlBody,
      textBody,
    };
  }

  private async generateRSSEntry(
    article: ContentArticle,
    brief: ContentBrief,
    canonicalUrl?: string
  ): Promise<RSSEntry> {
    const title = brief.keyIdea;
    const link = canonicalUrl || `https://gicm.dev/blog/${article.seo?.slug || "post"}`;

    return {
      title,
      link,
      description: article.seo?.metaDescription || article.markdown.slice(0, 500),
      pubDate: new Date().toISOString(),
      guid: article.id,
      categories: brief.seedKeywords,
    };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private generateHook(brief: ContentBrief, platform: string): string {
    const hooks: Record<string, string> = {
      twitter: `🧵 ${brief.keyIdea}`,
      farcaster: `${brief.keyIdea}`,
      bluesky: `${brief.keyIdea}`,
      linkedin: `${brief.keyIdea}\n\nHere's what you need to know:`,
      mastodon: `${brief.keyIdea}`,
      threads: `${brief.keyIdea}`,
      lens: `${brief.keyIdea}`,
    };

    return hooks[platform] || brief.keyIdea;
  }

  private extractTitle(markdown: string): string {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1] : "Untitled";
  }

  private extractKeyPoints(markdown: string): string[] {
    const points: string[] = [];

    // Extract bullet points
    const bulletMatches = markdown.match(/^[-*•]\s+(.+)$/gm);
    if (bulletMatches) {
      points.push(...bulletMatches.slice(0, 10).map(m => m.replace(/^[-*•]\s+/, "").trim()));
    }

    // Extract numbered lists
    const numberedMatches = markdown.match(/^\d+\.\s+(.+)$/gm);
    if (numberedMatches) {
      points.push(...numberedMatches.slice(0, 10).map(m => m.replace(/^\d+\.\s+/, "").trim()));
    }

    // If no lists found, extract first sentences of paragraphs
    if (points.length === 0) {
      const paragraphs = markdown.split(/\n\n+/).filter(p => !p.startsWith("#") && p.length > 50);
      for (const para of paragraphs.slice(0, 5)) {
        const firstSentence = para.match(/^[^.!?]+[.!?]/);
        if (firstSentence) {
          points.push(firstSentence[0].trim());
        }
      }
    }

    return points.slice(0, 7);
  }

  private generateHashtags(brief: ContentBrief, article: ContentArticle): string[] {
    const hashtags = new Set<string>();

    // From brief keywords
    for (const keyword of brief.seedKeywords || []) {
      hashtags.add(keyword.replace(/\s+/g, "").toLowerCase());
    }

    // From SEO keywords
    for (const keyword of article.seo?.keywords || []) {
      hashtags.add(keyword.replace(/\s+/g, "").toLowerCase());
    }

    // Default crypto/AI hashtags
    const defaults = ["web3", "crypto", "ai", "defi", "solana"];
    for (const d of defaults) {
      if (hashtags.size < (this.config.maxHashtags || 5)) {
        hashtags.add(d);
      }
    }

    return Array.from(hashtags).slice(0, this.config.maxHashtags || 5);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }

  private generateReadme(article: ContentArticle, recycled: RecycledContent): string {
    return `# ${recycled.title}\n\n${article.markdown}`;
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let instance: ContentRecycler | null = null;

export function getContentRecycler(config?: Partial<RecyclingConfig>): ContentRecycler {
  if (!instance) {
    instance = new ContentRecycler(config);
  }
  return instance;
}

export function createContentRecycler(config?: Partial<RecyclingConfig>): ContentRecycler {
  return new ContentRecycler(config);
}

export default ContentRecycler;
