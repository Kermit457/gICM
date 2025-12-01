/**
 * gICM Growth Engine Types
 */

// ============================================================================
// CONTENT
// ============================================================================

export type ContentType = "blog" | "tweet" | "thread" | "discord" | "linkedin" | "tutorial" | "docs";
export type ContentStatus = "draft" | "scheduled" | "published" | "failed";

export interface BlogPost {
  id: string;

  // Content
  title: string;
  slug: string;
  excerpt: string;
  content: string;          // Markdown

  // Metadata
  author: string;
  category: BlogCategory;
  tags: string[];

  // SEO
  seo: {
    title: string;          // Meta title
    description: string;    // Meta description
    keywords: string[];
    canonicalUrl?: string;
  };

  // Media
  featuredImage?: string;
  images: string[];

  // Stats
  readingTime: number;      // Minutes
  wordCount: number;

  // Publishing
  status: ContentStatus;
  publishedAt?: number;
  scheduledFor?: number;

  // Performance
  metrics?: ContentMetrics;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export type BlogCategory =
  | "tutorial"
  | "announcement"
  | "comparison"
  | "guide"
  | "case-study"
  | "thought-leadership"
  | "changelog";

export interface Tweet {
  id: string;

  // Content (support both text and content for compatibility)
  text?: string;
  content?: string;
  mediaUrls?: string[];

  // Thread
  isThread?: boolean;
  threadParts?: string[];

  // Engagement
  replyTo?: string;
  quoteTweet?: string;

  // Status
  status: ContentStatus | "posted";
  tweetId?: string;         // Twitter's ID after posting
  twitterId?: string;       // Alias for tweetId

  // Schedule
  scheduledFor?: number;
  postedAt?: number;

  // Performance
  metrics?: TweetMetrics;
}

export interface TweetMetrics {
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  clicks: number;
  engagementRate: number;
}

export interface ContentMetrics {
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  shares: number;
  conversions?: number;
}

// ============================================================================
// SEO
// ============================================================================

export interface Keyword {
  keyword: string;
  term?: string;

  // Metrics
  volume: number;
  searchVolume?: number;
  difficulty: number;       // 0-100
  cpc?: number;              // Cost per click

  // Status
  currentRanking?: number;
  targetRanking?: number;

  // Strategy
  priority?: "high" | "medium" | "low";
  contentIds?: string[];     // Content targeting this keyword

  // History
  rankingHistory?: Array<{ date: number; position: number }>;
}

export interface SEOReport {
  // Overall health
  healthScore: number;      // 0-100

  // Rankings
  keywords: {
    total: number;
    ranking: number;        // Keywords with rankings
    top10: number;
    top3: number;
  };

  // Technical
  technical: {
    indexedPages: number;
    crawlErrors: number;
    sitemapStatus: "ok" | "error";
    robotsStatus: "ok" | "error";
  };

  // Performance
  performance: {
    organicTraffic: number;
    organicGrowth: number;  // Month over month
    avgPosition: number;
    ctr: number;
  };

  // Issues
  issues: SEOIssue[];
}

export interface SEOIssue {
  type: "error" | "warning" | "info";
  category: "technical" | "content" | "performance";
  title: string;
  description: string;
  affectedUrls: string[];
  fixSuggestion: string;
}

// ============================================================================
// SOCIAL
// ============================================================================

export interface SocialAccount {
  platform: "twitter" | "discord" | "telegram" | "linkedin";
  handle: string;

  // Stats
  followers: number;
  following: number;

  // Activity
  postsThisWeek: number;
  engagementRate: number;

  // Growth
  followerGrowth: number;   // This month
}

export interface SocialPost {
  id: string;
  platform: SocialAccount["platform"];

  content: string;
  mediaUrls?: string[];

  status: ContentStatus;
  postId?: string;          // Platform's ID

  scheduledFor?: number;
  postedAt?: number;

  metrics?: {
    impressions: number;
    engagement: number;
    clicks: number;
  };
}

// ============================================================================
// CONTENT CALENDAR
// ============================================================================

export interface ContentCalendar {
  week: string;
  blogPosts: BlogPost[];
  tweets: Tweet[];
  threads: Tweet[];
}

export interface ContentSlot {
  time: string;             // "09:00"
  type: ContentType;
  template?: string;
}

export interface ScheduledContent {
  id: string;
  type: ContentType;
  title: string;
  scheduledFor: number;
  status: ContentStatus;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface GrowthMetrics {
  // Traffic
  traffic: {
    daily: number;
    weekly: number;
    monthly: number;
    trend: "up" | "down" | "stable";
  };

  // Content
  content: {
    postsPublished: number;
    totalViews: number;
    avgEngagement: number;
    blogPosts?: number;
    tweets?: number;
  };

  // Engagement
  engagement: {
    twitterFollowers: number;
    discordMembers: number;
    newsletterSubs: number;
  };

  // SEO
  seo: {
    avgPosition: number;
    indexedPages: number;
    backlinks: number;
  };
}

// ============================================================================
// ENGINE CONFIG
// ============================================================================

export interface GrowthEngineConfig {
  // Blog config
  blog: {
    postsPerWeek: number;
    categories: string[];
    targetWordCount: number;
  };

  // Twitter config
  twitter: {
    tweetsPerDay: number;
    threadsPerWeek: number;
    engagementEnabled: boolean;
  };

  // SEO config
  seo: {
    primaryKeywords: string[];
    competitors: string[];
    targetPositions: Record<string, number>;
  };

  // Discord config
  discord: {
    serverId: string;
    announcementChannel: string;
    contentChannel: string;
  };
}

// ============================================================================
// GENERATOR OPTIONS
// ============================================================================

export interface GenerateOptions {
  topic: string;
  category: BlogCategory;
  targetWordCount?: number;
}
