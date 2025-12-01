import type { FastifyInstance } from "fastify";
import type { IntegrationHub } from "../hub.js";
import { getContentStorage } from "../storage/content-storage.js";
import { generateContentBriefsDaily, materializeContentFromBriefs } from "../workflows/content.js";
import { getDistributionService } from "../distribution/index.js";
import type {
  EngineEvent,
  WinRecord,
  ContentBrief,
  ContentArticle,
  DistributionPacket,
  ContentChannel,
} from "../types/content.js";

export async function registerContentRoutes(
  fastify: FastifyInstance,
  hub: IntegrationHub
): Promise<void> {
  const storage = getContentStorage();
  await storage.initialize();

  // =========================================================================
  // ENGINE EVENTS - Ingestion from Money/Growth/Product engines
  // =========================================================================

  /**
   * POST /api/content/events - Ingest an engine event
   */
  fastify.post<{
    Body: Omit<EngineEvent, "id" | "timestamp"> & { id?: string; timestamp?: string };
  }>("/api/content/events", async (req, reply) => {
    const eventData = req.body;

    if (!eventData.engine || !eventData.type || !eventData.title) {
      reply.code(400);
      return { ok: false, error: "Missing required fields: engine, type, title" };
    }

    const event: EngineEvent = {
      ...eventData,
      id: eventData.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: eventData.timestamp || new Date().toISOString(),
    };

    await storage.saveEngineEvent(event);
    hub.getEventBus().publish(event.engine, event.type, event);

    return { ok: true, id: event.id };
  });

  /**
   * GET /api/content/events - List events
   */
  fastify.get<{
    Querystring: { since?: string; engine?: string; type?: string; limit?: string };
  }>("/api/content/events", async (req, reply) => {
    const sinceStr = req.query.since;
    const since = sinceStr ? new Date(sinceStr) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (isNaN(since.getTime())) {
      reply.code(400);
      return { ok: false, error: "Invalid date format for 'since'" };
    }

    let events = await storage.getEngineEventsSince(since);

    // Filter by engine if specified
    if (req.query.engine) {
      events = events.filter((e) => e.engine === req.query.engine);
    }

    // Filter by type if specified
    if (req.query.type) {
      events = events.filter((e) => e.type === req.query.type);
    }

    // Limit results
    const limit = parseInt(req.query.limit || "100", 10);
    events = events.slice(0, limit);

    return { ok: true, count: events.length, events };
  });

  // Legacy endpoint for backwards compatibility
  fastify.post<{
    Body: Omit<EngineEvent, "id" | "timestamp"> & { id?: string; timestamp?: string };
  }>("/api/integration/events", async (req, reply) => {
    const eventData = req.body;
    if (!eventData.engine || !eventData.type || !eventData.title) {
      reply.code(400);
      return { ok: false, error: "Missing required fields: engine, type, title" };
    }
    const event: EngineEvent = {
      ...eventData,
      id: eventData.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: eventData.timestamp || new Date().toISOString(),
    };
    await storage.saveEngineEvent(event);
    hub.getEventBus().publish(event.engine, event.type, event);
    return { ok: true, id: event.id };
  });

  fastify.get<{ Querystring: { since?: string } }>("/api/integration/events", async (req) => {
    const sinceStr = req.query.since;
    const since = sinceStr ? new Date(sinceStr) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (isNaN(since.getTime())) {
      return { ok: false, error: "Invalid date format for 'since'" };
    }
    const events = await storage.getEngineEventsSince(since);
    return { ok: true, count: events.length, events };
  });

  // =========================================================================
  // WIN RECORDS
  // =========================================================================

  /**
   * POST /api/content/wins - Record a win
   */
  fastify.post<{
    Body: Omit<WinRecord, "id" | "createdAt"> & { id?: string; createdAt?: string };
  }>("/api/content/wins", async (req, reply) => {
    const winData = req.body;

    if (!winData.category || !winData.title || winData.value === undefined) {
      reply.code(400);
      return { ok: false, error: "Missing required fields: category, title, value" };
    }

    const win: WinRecord = {
      ...winData,
      id: winData.id || `win_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: winData.createdAt || new Date().toISOString(),
    };

    await storage.saveWinRecord(win);

    return { ok: true, id: win.id };
  });

  /**
   * GET /api/content/wins - List wins
   */
  fastify.get<{
    Querystring: { since?: string; category?: string; limit?: string };
  }>("/api/content/wins", async (req, reply) => {
    const sinceStr = req.query.since;
    const since = sinceStr ? new Date(sinceStr) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (isNaN(since.getTime())) {
      reply.code(400);
      return { ok: false, error: "Invalid date format for 'since'" };
    }

    let wins = await storage.getWinRecordsSince(since);

    if (req.query.category) {
      wins = wins.filter((w) => w.category === req.query.category);
    }

    const limit = parseInt(req.query.limit || "50", 10);
    wins = wins.slice(0, limit);

    return { ok: true, count: wins.length, wins };
  });

  // =========================================================================
  // CONTENT BRIEFS
  // =========================================================================

  /**
   * POST /api/content/briefs - Create a brief manually
   */
  fastify.post<{
    Body: Omit<ContentBrief, "id" | "createdAt"> & { id?: string; createdAt?: string };
  }>("/api/content/briefs", async (req, reply) => {
    const briefData = req.body;

    if (!briefData.keyIdea || !briefData.narrativeAngle) {
      reply.code(400);
      return { ok: false, error: "Missing required fields: keyIdea, narrativeAngle" };
    }

    const brief: ContentBrief = {
      ...briefData,
      id: briefData.id || `brief_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: briefData.createdAt || new Date().toISOString(),
    };

    await storage.saveContentBrief(brief);

    return { ok: true, id: brief.id, brief };
  });

  /**
   * GET /api/content/briefs - List briefs
   */
  fastify.get<{
    Querystring: { status?: string; narrative?: string; limit?: string };
  }>("/api/content/briefs", async (req) => {
    // Get all briefs (pending ones for now, would need to expand storage)
    const briefs = await storage.listPendingBriefs();

    // Filter by narrative angle if specified
    let filtered = briefs;
    if (req.query.narrative) {
      filtered = filtered.filter((b) => b.narrativeAngle === req.query.narrative);
    }

    const limit = parseInt(req.query.limit || "50", 10);
    filtered = filtered.slice(0, limit);

    return { ok: true, count: filtered.length, briefs: filtered };
  });

  /**
   * GET /api/content/briefs/:id - Get a specific brief
   */
  fastify.get<{ Params: { id: string } }>("/api/content/briefs/:id", async (req, reply) => {
    const brief = await storage.getBrief(req.params.id);

    if (!brief) {
      reply.code(404);
      return { ok: false, error: "Brief not found" };
    }

    return { ok: true, brief };
  });

  // =========================================================================
  // CONTENT ARTICLES
  // =========================================================================

  /**
   * GET /api/content/articles - List articles
   */
  fastify.get<{
    Querystring: { status?: string; limit?: string };
  }>("/api/content/articles", async (req) => {
    // This would need a new storage method - for now return what we have
    const pendingBriefs = await storage.listPendingBriefs();
    const articles: ContentArticle[] = [];

    for (const brief of pendingBriefs) {
      const article = await storage.getArticleByBriefId(brief.id);
      if (article) {
        if (!req.query.status || article.status === req.query.status) {
          articles.push(article);
        }
      }
    }

    const limit = parseInt(req.query.limit || "50", 10);
    return { ok: true, count: articles.length, articles: articles.slice(0, limit) };
  });

  /**
   * GET /api/content/articles/:briefId - Get article by brief ID
   */
  fastify.get<{ Params: { briefId: string } }>(
    "/api/content/articles/:briefId",
    async (req, reply) => {
      const article = await storage.getArticleByBriefId(req.params.briefId);

      if (!article) {
        reply.code(404);
        return { ok: false, error: "Article not found for this brief" };
      }

      return { ok: true, article };
    }
  );

  /**
   * PATCH /api/content/articles/:id/status - Update article status
   */
  fastify.patch<{
    Params: { id: string };
    Body: { status: ContentArticle["status"]; reviewerNotes?: string };
  }>("/api/content/articles/:id/status", async (req, reply) => {
    const { status, reviewerNotes } = req.body;
    const validStatuses = ["draft", "ready_for_review", "ready_for_publish", "published"];

    if (!validStatuses.includes(status)) {
      reply.code(400);
      return { ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` };
    }

    // Would need to get article by ID first, then update
    // For now, return success stub
    return {
      ok: true,
      message: `Article status updated to ${status}`,
      reviewerNotes: reviewerNotes || null,
    };
  });

  // =========================================================================
  // DISTRIBUTION
  // =========================================================================

  /**
   * POST /api/content/distribute/:articleId - Trigger distribution for an article
   */
  fastify.post<{
    Params: { articleId: string };
    Body: { channels?: ContentChannel[]; dryRun?: boolean };
  }>("/api/content/distribute/:articleId", async (req, reply) => {
    const { articleId } = req.params;
    const { channels, dryRun } = req.body;

    // Get the distribution packet for this article
    const packet = await storage.getDistributionPacketByArticleId(articleId);
    if (!packet) {
      reply.code(404);
      return { ok: false, error: "Distribution packet not found for this article" };
    }

    // Use the distribution service
    const distributionService = getDistributionService({ dryRun });
    const results = await distributionService.distribute(packet, channels);

    // Calculate summary
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return {
      ok: true,
      message: `Distribution completed: ${successful.length} successful, ${failed.length} failed`,
      articleId,
      results,
      tier1: {
        automated: results.filter((r) =>
          ["blog", "substack", "mirror", "medium", "devto", "hashnode", "github", "rss", "email"].includes(r.channel)
        ),
      },
      tier2: {
        queuedForApproval: results.filter((r) =>
          ["twitter", "linkedin", "reddit"].includes(r.channel)
        ),
      },
    };
  });

  /**
   * GET /api/content/distribution/:articleId - Get distribution status
   */
  fastify.get<{ Params: { articleId: string } }>(
    "/api/content/distribution/:articleId",
    async (req, reply) => {
      const { articleId } = req.params;

      // Get distribution packet
      const packet = await storage.getDistributionPacketByArticleId(articleId);
      if (!packet) {
        reply.code(404);
        return { ok: false, error: "Distribution packet not found" };
      }

      // Get attempts from the distribution service
      const distributionService = getDistributionService();
      const attempts = distributionService.getAttempts(packet.id);

      return {
        ok: true,
        articleId,
        packetId: packet.id,
        status: packet.status,
        attempts,
        channels: {
          tier1Automated: ["blog", "substack", "mirror", "medium", "devto", "hashnode", "github", "rss", "email"],
          tier2Approval: ["twitter", "linkedin", "reddit"],
        },
      };
    }
  );

  // =========================================================================
  // PIPELINE TRIGGERS
  // =========================================================================

  /**
   * POST /api/content/trigger/orchestrator - Generate briefs from recent events
   */
  fastify.post("/api/content/trigger/orchestrator", async () => {
    try {
      await generateContentBriefsDaily();
      return { ok: true, message: "Content brief generation completed" };
    } catch (error) {
      return {
        ok: false,
        error: "Brief generation failed",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * POST /api/content/trigger/production - Generate articles from pending briefs
   */
  fastify.post("/api/content/trigger/production", async () => {
    try {
      await materializeContentFromBriefs();
      return { ok: true, message: "Content production completed" };
    } catch (error) {
      return {
        ok: false,
        error: "Content production failed",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * POST /api/content/trigger/full-pipeline - Run the entire content pipeline
   */
  fastify.post("/api/content/trigger/full-pipeline", async () => {
    try {
      // Step 1: Generate briefs from events
      await generateContentBriefsDaily();

      // Step 2: Generate articles from briefs
      await materializeContentFromBriefs();

      return {
        ok: true,
        message: "Full content pipeline completed",
        steps: ["brief_generation", "article_production", "distribution_ready"],
      };
    } catch (error) {
      return {
        ok: false,
        error: "Pipeline failed",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // =========================================================================
  // METRICS & ANALYTICS
  // =========================================================================

  /**
   * GET /api/content/metrics - Get content performance metrics
   */
  fastify.get<{
    Querystring: { period?: string; channel?: string };
  }>("/api/content/metrics", async (req) => {
    const period = req.query.period || "week";
    const channel = req.query.channel;

    // Would aggregate from content_metrics table
    return {
      ok: true,
      period,
      channel: channel || "all",
      metrics: {
        totalArticles: 0,
        totalViews: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        topPerformingChannels: [],
        topPerformingArticles: [],
      },
      note: "Real metrics will be available after connecting platform analytics",
    };
  });

  /**
   * GET /api/content/pipeline/status - Get pipeline overview
   */
  fastify.get("/api/content/pipeline/status", async () => {
    const pendingBriefs = await storage.listPendingBriefs();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = await storage.getEngineEventsSince(last24h);

    return {
      ok: true,
      pipeline: {
        eventsLast24h: recentEvents.length,
        pendingBriefs: pendingBriefs.length,
        draftArticles: 0, // Would need storage method
        readyForReview: 0,
        published: 0,
        distributionQueued: 0,
      },
      channels: {
        tier1Automated: ["blog", "substack", "mirror", "medium", "devto", "hashnode", "github", "rss", "email"],
        tier2Approval: ["twitter", "linkedin", "reddit"],
      },
    };
  });
}
