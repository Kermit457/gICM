export type EngineName =
  | "orchestrator"
  | "money"
  | "growth"
  | "product";

export type EngineEventType =
  | "trade_executed"
  | "pnl_snapshot"
  | "feature_shipped"
  | "campaign_launched"
  | "content_published"
  | "bug_fixed"
  | "retro"
  | "win_recorded";

export interface EngineEvent {
  id: string;
  timestamp: string;        // ISO string
  engine: EngineName;
  type: EngineEventType;
  title: string;
  description: string;
  metrics?: Record<string, number>;
  tags: string[];
  links?: string[];
  source?: Record<string, any>;
}

export interface WinRecord {
  id: string;
  createdAt: string;
  category: "money" | "growth" | "product" | "ops";
  subcategory: string;
  title: string;
  value: number;
  unit: string;
  engineEventId?: string;   // FK to EngineEvent
}

export type ContentPrimaryGoal =
  | "build_authority"
  | "ship_update"
  | "show_agent_alpha"
  | "convert_users"
  | "recruit_builders";

export type ContentNarrativeAngle =
  | "macro_thesis"
  | "trading_case_study"
  | "devlog"
  | "product_launch"
  | "playbook_howto";

export type ContentAudience =
  | "traders"
  | "founders"
  | "devs"
  | "partners"
  | "community";

export type ContentTimeScope = "daily" | "weekly" | "monthly" | "evergreen";

export type ContentLength = "tweet" | "thread" | "short_post" | "longform";

// Tier 1: Full automation (free + API-friendly)
export type AutomatedChannel =
  | "blog"        // Your own Next.js blog
  | "substack"    // Email + blog via API/email
  | "mirror"      // Web3 essays via wallet
  | "medium"      // Syndication via API
  | "devto"       // Devlogs via API
  | "hashnode"    // Dev-focused via API
  | "github"      // CHANGELOG, docs via API
  | "rss"         // Feed for aggregators
  | "email"       // Digest via ESP
  // Web3 social (NEW)
  | "farcaster"   // Web3 social via Neynar API
  | "lens"        // Web3 social via Lens API
  | "paragraph"   // Web3 publishing platform
  // Decentralized social (NEW)
  | "bluesky"     // AT Protocol
  | "mastodon";   // ActivityPub

// Tier 2: Agent draft + human approve
export type ApprovalChannel =
  | "twitter"
  | "linkedin"
  | "reddit"
  | "threads";    // NEW: Meta's Threads (limited API)

export type ContentChannel = AutomatedChannel | ApprovalChannel;

export type ContentCTA =
  | "join_waitlist"
  | "launch_with_us"
  | "try_agent"
  | "join_community"
  | "book_call"
  | "subscribe";

export interface MarketContext {
  btcUsd?: number;
  ethUsd?: number;
  solUsd?: number;
  volatilityIndex?: number;
  notes?: string;
}

export interface ContentBrief {
  id: string;
  createdAt: string;
  primaryGoal: ContentPrimaryGoal;
  narrativeAngle: ContentNarrativeAngle;
  primaryAudience: ContentAudience;
  timeScope: ContentTimeScope;
  keyIdea: string;
  events: EngineEvent[];
  wins?: WinRecord[];
  marketContext?: MarketContext;
  targetLength: ContentLength;
  targetChannels: ContentChannel[];
  primaryCTA: ContentCTA;
  seedKeywords: string[];
}

export interface ContentSEO {
  seoTitle: string;
  metaDescription: string;
  slug: string;
  keywords: string[];
  faqs: string[];
  internalLinks: string[];
  externalLinks: string[];
}

export interface ContentArticle {
  id: string;
  briefId: string;
  createdAt: string;
  updatedAt: string;
  markdown: string;
  seo: ContentSEO;
  status: "draft" | "ready_for_review" | "ready_for_publish" | "published";
}

export interface DistributionPacket {
  id: string;
  articleId: string;
  createdAt: string;
  baseSlug: string;
  canonicalUrl?: string;
  ogImageUrl?: string;

  // Tier 1: Full automation (free + API-friendly)
  blogPost: string;
  substackBody: string;
  mirrorBody: string;
  mediumBody?: string;
  devtoBody?: string;
  hashnodeBody?: string;
  githubReadme?: string;
  rssEntry?: RSSEntry;
  emailDigest?: EmailDigest;

  // Web3 Social (NEW - Tier 1 automated)
  farcasterCast?: string;        // Short post for Farcaster
  lensPost?: string;             // Post for Lens Protocol
  paragraphPost?: string;        // Long-form for Paragraph.xyz

  // Decentralized Social (NEW - Tier 1 automated)
  blueskyPost?: string;          // Post for Bluesky/AT Protocol
  mastodonPost?: string;         // Toot for Mastodon/ActivityPub

  // Tier 2: Agent draft + human approve
  twitterThread: string[];
  linkedinPost: string;
  redditDraft?: string;
  threadsDraft?: string;         // NEW: Meta Threads draft

  status: "pending" | "ready" | "distributed" | "failed";
}

export interface RSSEntry {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  categories: string[];
}

export interface EmailDigest {
  subject: string;
  previewText: string;
  htmlBody: string;
  textBody: string;
}

export interface DistributionAttempt {
  id: string;
  packetId: string;
  channel: ContentChannel;
  attemptedAt: string;
  status: "pending" | "success" | "failed" | "skipped";
  externalUrl?: string;
  externalId?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface ContentMetrics {
  id: string;
  articleId: string;
  channel: ContentChannel;
  collectedAt: string;
  views: number;
  reads: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  clicks: number;
  subscribersGained: number;
  estimatedReach: number;
  engagementRate: number;
}
