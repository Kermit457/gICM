/**
 * Test Utilities - Mock Factories
 * Creates properly typed test data
 */

import type {
  EngineEvent,
  WinRecord,
  ContentBrief,
  ContentArticle,
  ContentSEO,
  DistributionPacket,
  EngineName,
  EngineEventType,
  ContentPrimaryGoal,
  ContentNarrativeAngle,
  ContentAudience,
  ContentTimeScope,
  ContentLength,
  ContentCTA,
} from "../types/content.js";

import type { WebhookConfig, WebhookEventType } from "../storage/supabase.js";

// =========================================================================
// ENGINE EVENT FACTORY
// =========================================================================

export function createMockEngineEvent(overrides: Partial<EngineEvent> = {}): EngineEvent {
  return {
    id: `event-${Date.now()}`,
    timestamp: new Date().toISOString(),
    engine: "money" as EngineName,
    type: "trade_executed" as EngineEventType,
    title: "Test Event",
    description: "Test event description",
    metrics: {},
    tags: [],
    ...overrides,
  };
}

// =========================================================================
// WIN RECORD FACTORY
// =========================================================================

export function createMockWinRecord(overrides: Partial<WinRecord> = {}): WinRecord {
  return {
    id: `win-${Date.now()}`,
    createdAt: new Date().toISOString(),
    category: "money" as const,
    subcategory: "trading",
    title: "Test Win",
    value: 100,
    unit: "USD",
    ...overrides,
  };
}

// =========================================================================
// CONTENT BRIEF FACTORY
// =========================================================================

export function createMockContentBrief(overrides: Partial<ContentBrief> = {}): ContentBrief {
  return {
    id: `brief-${Date.now()}`,
    createdAt: new Date().toISOString(),
    primaryGoal: "build_authority" as ContentPrimaryGoal,
    narrativeAngle: "devlog" as ContentNarrativeAngle,
    primaryAudience: "devs" as ContentAudience,
    timeScope: "weekly" as ContentTimeScope,
    keyIdea: "Test key idea",
    events: [],
    wins: [],
    targetLength: "short_post" as ContentLength,
    targetChannels: ["blog"],
    primaryCTA: "join_waitlist" as ContentCTA,
    seedKeywords: ["test", "keyword"],
    ...overrides,
  };
}

// =========================================================================
// CONTENT SEO FACTORY
// =========================================================================

export function createMockContentSEO(overrides: Partial<ContentSEO> = {}): ContentSEO {
  return {
    seoTitle: "Test SEO Title",
    metaDescription: "Test meta description for SEO",
    slug: "test-article-slug",
    keywords: ["test", "keywords"],
    faqs: ["What is this?", "How does it work?"],
    internalLinks: ["/related-article"],
    externalLinks: ["https://example.com"],
    ...overrides,
  };
}

// =========================================================================
// CONTENT ARTICLE FACTORY
// =========================================================================

export function createMockContentArticle(overrides: Partial<ContentArticle> = {}): ContentArticle {
  return {
    id: `article-${Date.now()}`,
    briefId: `brief-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    markdown: "# Test Article\n\nThis is test content.",
    seo: createMockContentSEO(),
    status: "draft",
    ...overrides,
  };
}

// =========================================================================
// DISTRIBUTION PACKET FACTORY
// =========================================================================

export function createMockDistributionPacket(overrides: Partial<DistributionPacket> = {}): DistributionPacket {
  return {
    id: `packet-${Date.now()}`,
    articleId: `article-${Date.now()}`,
    createdAt: new Date().toISOString(),
    baseSlug: "test-article",
    blogPost: "Blog post content",
    substackBody: "Substack body content",
    mirrorBody: "Mirror body content",
    twitterThread: ["Tweet 1", "Tweet 2"],
    linkedinPost: "LinkedIn post content",
    status: "pending",
    ...overrides,
  };
}

// =========================================================================
// WEBHOOK CONFIG FACTORY
// =========================================================================

export function createMockWebhookConfig(
  overrides: Partial<Omit<WebhookConfig, "id" | "createdAt" | "updatedAt" | "lastTriggeredAt" | "lastStatus" | "failureCount">> = {}
): Omit<WebhookConfig, "id" | "createdAt" | "updatedAt" | "lastTriggeredAt" | "lastStatus" | "failureCount"> {
  return {
    name: "Test Webhook",
    url: "https://example.com/webhook",
    secret: "test-secret",
    events: ["pipeline.completed"] as WebhookEventType[],
    enabled: true,
    metadata: {},
    retryCount: 3,
    timeoutMs: 5000,
    ...overrides,
  };
}

// =========================================================================
// TOOL RESULT FACTORY
// =========================================================================

export interface ToolResult {
  success: boolean;
  output: Record<string, unknown>;
  error?: string;
  tokensUsed?: { input: number; output: number };
}

export function createMockToolResult(overrides: Partial<ToolResult> = {}): ToolResult {
  return {
    success: true,
    output: {},
    ...overrides,
  };
}
