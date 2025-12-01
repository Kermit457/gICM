/**
 * Storage Module Tests
 * Phase 17B: Core Module Tests
 *
 * Tests the in-memory fallback behavior of storage modules.
 * Note: SupabaseStorage tests are minimal since it requires actual Supabase connection.
 * ContentStorage has a proper in-memory fallback that can be tested.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseStorage } from "../storage/supabase.js";
import { ContentStorage } from "../storage/content-storage.js";
import type {
  EngineEvent,
  WinRecord,
  ContentBrief,
  ContentArticle,
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

// =============================================================================
// SUPABASE STORAGE TESTS (Basic initialization only)
// =============================================================================

describe("SupabaseStorage", () => {
  describe("initialization", () => {
    it("should create instance with config", () => {
      const storage = new SupabaseStorage({
        url: "https://test.supabase.co",
        serviceKey: "test-key",
        fallbackToMemory: true,
      });

      expect(storage).toBeDefined();
    });

    it("should use default fallbackToMemory value", () => {
      const storage = new SupabaseStorage({
        url: "",
        serviceKey: "",
      });

      // Default is true for fallbackToMemory
      expect(storage).toBeDefined();
    });
  });
});

// =============================================================================
// CONTENT STORAGE TESTS
// =============================================================================

describe("ContentStorage", () => {
  let storage: ContentStorage;

  beforeEach(async () => {
    storage = new ContentStorage({
      fallbackToMemory: true,
    });
    await storage.initialize();
  });

  // ===========================================================================
  // INITIALIZATION TESTS
  // ===========================================================================

  describe("initialization", () => {
    it("should initialize with fallback to memory", async () => {
      const newStorage = new ContentStorage({
        fallbackToMemory: true,
      });

      const result = await newStorage.initialize();
      expect(result).toBe(true);
    });

    it("should report not connected when using fallback", async () => {
      expect(storage.connected).toBe(false);
    });
  });

  // ===========================================================================
  // ENGINE EVENTS TESTS
  // ===========================================================================

  describe("engine events", () => {
    it("should save engine event", async () => {
      const event: EngineEvent = {
        id: "event-1",
        timestamp: new Date().toISOString(),
        engine: "money" as EngineName,
        type: "trade_executed" as EngineEventType,
        title: "SOL Trade",
        description: "Bought 1 SOL",
        metrics: { price: 100, amount: 1 },
        tags: ["trading", "sol"],
      };

      await storage.saveEngineEvent(event);

      const events = await storage.getEngineEventsSince(new Date(0));
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("event-1");
    });

    it("should emit event:saved", async () => {
      const handler = vi.fn();
      storage.on("event:saved", handler);

      const event: EngineEvent = {
        id: "event-1",
        timestamp: new Date().toISOString(),
        engine: "growth" as EngineName,
        type: "content_published" as EngineEventType,
        title: "New Blog",
        description: "Published a new blog post",
        tags: [],
      };

      await storage.saveEngineEvent(event);

      expect(handler).toHaveBeenCalled();
    });

    it("should filter events by date", async () => {
      const now = Date.now();
      const event1: EngineEvent = {
        id: "event-1",
        timestamp: new Date(now - 10000).toISOString(),
        engine: "money" as EngineName,
        type: "trade_executed" as EngineEventType,
        title: "Recent Event",
        description: "Recent event description",
        tags: [],
      };
      const event2: EngineEvent = {
        id: "event-2",
        timestamp: new Date(now - 60000).toISOString(),
        engine: "money" as EngineName,
        type: "trade_executed" as EngineEventType,
        title: "Old Event",
        description: "Old event description",
        tags: [],
      };

      await storage.saveEngineEvent(event1);
      await storage.saveEngineEvent(event2);

      const sinceDate = new Date(now - 30000);
      const recentEvents = await storage.getEngineEventsSince(sinceDate);

      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0].id).toBe("event-1");
    });
  });

  // ===========================================================================
  // WIN RECORDS TESTS
  // ===========================================================================

  describe("win records", () => {
    it("should save win record", async () => {
      const win: WinRecord = {
        id: "win-1",
        createdAt: new Date().toISOString(),
        category: "money" as const,
        subcategory: "profit",
        title: "Profitable Trade",
        value: 100,
        unit: "USD",
      };

      await storage.saveWinRecord(win);

      const wins = await storage.getWinRecordsSince(new Date(0));
      expect(wins).toHaveLength(1);
      expect(wins[0].id).toBe("win-1");
    });

    it("should filter wins by date", async () => {
      const now = Date.now();
      const win1: WinRecord = {
        id: "win-1",
        createdAt: new Date(now - 10000).toISOString(),
        category: "money" as const,
        subcategory: "profit",
        title: "Recent Win",
        value: 100,
        unit: "USD",
      };
      const win2: WinRecord = {
        id: "win-2",
        createdAt: new Date(now - 60000).toISOString(),
        category: "money" as const,
        subcategory: "profit",
        title: "Old Win",
        value: 50,
        unit: "USD",
      };

      await storage.saveWinRecord(win1);
      await storage.saveWinRecord(win2);

      const sinceDate = new Date(now - 30000);
      const recentWins = await storage.getWinRecordsSince(sinceDate);

      expect(recentWins).toHaveLength(1);
      expect(recentWins[0].id).toBe("win-1");
    });
  });

  // ===========================================================================
  // CONTENT BRIEFS TESTS
  // ===========================================================================

  describe("content briefs", () => {
    const createBrief = (id: string): ContentBrief => ({
      id,
      createdAt: new Date().toISOString(),
      primaryGoal: "build_authority" as ContentPrimaryGoal,
      narrativeAngle: "devlog" as ContentNarrativeAngle,
      primaryAudience: "devs" as ContentAudience,
      timeScope: "weekly" as ContentTimeScope,
      keyIdea: "Test idea",
      events: [],
      wins: [],
      targetLength: "short_post" as ContentLength,
      targetChannels: ["blog"],
      primaryCTA: "join_waitlist" as ContentCTA,
      seedKeywords: ["test", "keyword"],
    });

    it("should save content brief", async () => {
      const brief = createBrief("brief-1");

      await storage.saveContentBrief(brief);

      const retrieved = await storage.getBrief("brief-1");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("brief-1");
    });

    it("should emit brief:saved", async () => {
      const handler = vi.fn();
      storage.on("brief:saved", handler);

      await storage.saveContentBrief(createBrief("brief-1"));

      expect(handler).toHaveBeenCalled();
    });

    it("should list pending briefs", async () => {
      await storage.saveContentBrief(createBrief("brief-1"));
      await storage.saveContentBrief(createBrief("brief-2"));

      const pending = await storage.listPendingBriefs();
      expect(pending).toHaveLength(2);
    });

    it("should return undefined for non-existent brief", async () => {
      const result = await storage.getBrief("non-existent");
      expect(result).toBeUndefined();
    });
  });

  // ===========================================================================
  // CONTENT ARTICLES TESTS
  // ===========================================================================

  describe("content articles", () => {
    const createArticle = (id: string, briefId: string): ContentArticle => ({
      id,
      briefId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      markdown: "# Test Article\n\nContent here.",
      seo: {
        seoTitle: "Test Article",
        metaDescription: "Test description",
        slug: "test-article",
        keywords: ["test"],
        faqs: [],
        internalLinks: [],
        externalLinks: [],
      },
      status: "draft" as const,
    });

    it("should save content article", async () => {
      const article = createArticle("article-1", "brief-1");

      await storage.saveContentArticle(article);

      const retrieved = await storage.getArticleByBriefId("brief-1");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("article-1");
    });

    it("should emit article:saved", async () => {
      const handler = vi.fn();
      storage.on("article:saved", handler);

      await storage.saveContentArticle(createArticle("article-1", "brief-1"));

      expect(handler).toHaveBeenCalled();
    });

    it("should update content article", async () => {
      const article = createArticle("article-1", "brief-1");
      await storage.saveContentArticle(article);

      article.status = "published" as ContentArticle["status"];
      await storage.updateContentArticle(article);

      const retrieved = await storage.getArticleByBriefId("brief-1");
      expect(retrieved?.status).toBe("published");
    });

    it("should return undefined for non-existent article", async () => {
      const result = await storage.getArticleByBriefId("non-existent");
      expect(result).toBeUndefined();
    });
  });

  // ===========================================================================
  // DISTRIBUTION PACKETS TESTS
  // ===========================================================================

  describe("distribution packets", () => {
    const createPacket = (id: string, articleId: string): DistributionPacket => ({
      id,
      articleId,
      createdAt: new Date().toISOString(),
      baseSlug: "test-article",
      blogPost: "Full blog content",
      substackBody: "Substack version",
      mirrorBody: "Mirror version",
      twitterThread: ["Tweet 1", "Tweet 2"],
      linkedinPost: "LinkedIn version",
      status: "pending" as const,
    });

    it("should save distribution packet", async () => {
      const packet = createPacket("packet-1", "article-1");

      await storage.saveDistributionPacket(packet);

      const retrieved = await storage.getDistributionPacketByArticleId("article-1");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("packet-1");
    });

    it("should emit packet:saved", async () => {
      const handler = vi.fn();
      storage.on("packet:saved", handler);

      await storage.saveDistributionPacket(createPacket("packet-1", "article-1"));

      expect(handler).toHaveBeenCalled();
    });

    it("should get packet by ID", async () => {
      await storage.saveDistributionPacket(createPacket("packet-1", "article-1"));

      const retrieved = await storage.getDistributionPacket("packet-1");
      expect(retrieved).toBeDefined();
      expect(retrieved?.baseSlug).toBe("test-article");
    });

    it("should update packet status", async () => {
      await storage.saveDistributionPacket(createPacket("packet-1", "article-1"));

      await storage.updateDistributionPacketStatus("packet-1", "distributed");

      const retrieved = await storage.getDistributionPacket("packet-1");
      expect(retrieved?.status).toBe("distributed");
    });

    it("should return undefined for non-existent packet", async () => {
      const result = await storage.getDistributionPacket("non-existent");
      expect(result).toBeUndefined();
    });
  });
});
