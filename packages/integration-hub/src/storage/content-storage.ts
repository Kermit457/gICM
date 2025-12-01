import { EventEmitter } from "eventemitter3";
import type {
  EngineEvent,
  WinRecord,
  ContentBrief,
  ContentArticle,
  DistributionPacket,
} from "../types/content.js";

// Mock SupabaseClient for demonstration purposes.
// In a real application, you would import: `import { createClient, SupabaseClient } from '@supabase/supabase-js';`
const MOCK_SUPABASE_DB = new Map<string, Map<string, any>>();

const createClient = (url: string, serviceKey: string) => {
    console.log(`[ContentStorage] Mock Supabase Client created for URL: ${url}`);

    // Helper to create chainable query builder
    const createQueryBuilder = (tableName: string, currentData: any[] | null = null) => {
        const getTableData = () => {
            if (currentData !== null) return currentData;
            if (!MOCK_SUPABASE_DB.has(tableName)) return [];
            return Array.from(MOCK_SUPABASE_DB.get(tableName)!.values());
        };

        return {
            insert: async (data: any) => {
                console.log(`[ContentStorage] Mock Supabase: Inserting into ${tableName}`, data);
                if (!MOCK_SUPABASE_DB.has(tableName)) MOCK_SUPABASE_DB.set(tableName, new Map());
                const table = MOCK_SUPABASE_DB.get(tableName)!;
                const id = data.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                table.set(id, { ...data, id });
                return { data: [{ id }], error: null };
            },
            upsert: async (data: any, { onConflict }: { onConflict: string }) => {
                console.log(`[ContentStorage] Mock Supabase: Upserting into ${tableName} on conflict ${onConflict}`, data);
                if (!MOCK_SUPABASE_DB.has(tableName)) MOCK_SUPABASE_DB.set(tableName, new Map());
                const table = MOCK_SUPABASE_DB.get(tableName)!;
                const id = data.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                table.set(id, { ...data, id });
                return { data: [{ id }], error: null };
            },
            select: (columns: string) => {
                console.log(`[ContentStorage] Mock Supabase: Selecting ${columns} from ${tableName}`);
                return createQueryBuilder(tableName, getTableData());
            },
            eq: (column: string, value: any) => {
                console.log(`[ContentStorage] Mock Supabase: eq ${column} = ${value}`);
                const filtered = getTableData().filter(item => item[column] === value);
                // Return data directly for terminal operations
                return { data: filtered, error: null, ...createQueryBuilder(tableName, filtered) };
            },
            gte: (column: string, value: any) => {
                console.log(`[ContentStorage] Mock Supabase: gte ${column} >= ${value}`);
                const filtered = getTableData().filter(item =>
                    new Date(item[column]).getTime() >= new Date(value).getTime()
                );
                return createQueryBuilder(tableName, filtered);
            },
            filter: (column: string, operator: string, value: any) => {
                console.log(`[ContentStorage] Mock Supabase: Filtering ${column} ${operator} ${value}`);
                const filtered = getTableData().filter(item => {
                    if (operator === "gte") return new Date(item[column]).getTime() >= new Date(value).getTime();
                    if (operator === "eq") return item[column] === value;
                    return false;
                });
                return { data: filtered, error: null, ...createQueryBuilder(tableName, filtered) };
            },
            order: (column: string, { ascending = true }: { ascending?: boolean } = {}) => {
                console.log(`[ContentStorage] Mock Supabase: Ordering by ${column} ${ascending ? 'ASC' : 'DESC'}`);
                const sorted = [...getTableData()].sort((a, b) => {
                    const valA = new Date(a[column]).getTime();
                    const valB = new Date(b[column]).getTime();
                    return ascending ? valA - valB : valB - valA;
                });
                return { data: sorted, error: null, ...createQueryBuilder(tableName, sorted) };
            },
            limit: (count: number) => {
                console.log(`[ContentStorage] Mock Supabase: Limiting to ${count}`);
                const limited = getTableData().slice(0, count);
                return { data: limited, error: null };
            },
            // Allow direct data access after chaining
            then: (resolve: (result: { data: any[]; error: null }) => void) => {
                resolve({ data: getTableData(), error: null });
            }
        };
    };

    return {
        from: (tableName: string) => createQueryBuilder(tableName)
    };
};

type SupabaseClient = ReturnType<typeof createClient>;


// =========================================================================
// TYPES
// =========================================================================

export interface ContentStorageConfig {
  url?: string;
  serviceKey?: string;
  /** If true, fall back to in-memory when Supabase unavailable */
  fallbackToMemory?: boolean;
}

export interface ContentStorageEvents {
  "event:saved": (event: EngineEvent) => void;
  "brief:saved": (brief: ContentBrief) => void;
  "article:saved": (article: ContentArticle) => void;
  "packet:saved": (packet: DistributionPacket) => void;
  "error": (error: Error) => void;
  "connected": () => void;
}

// =========================================================================
// SUPABASE TABLE SCHEMAS (Conceptual - for reference)
// =========================================================================
/*
CREATE TABLE public.engine_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp timestamptz NOT NULL DEFAULT now(),
    engine text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    metrics jsonb,
    tags text[],
    links text[],
    source jsonb
);

CREATE TABLE public.win_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz NOT NULL DEFAULT now(),
    category text NOT NULL,
    subcategory text NOT NULL,
    title text NOT NULL,
    value numeric NOT NULL,
    unit text NOT NULL,
    engine_event_id uuid REFERENCES public.engine_events(id)
);

CREATE TABLE public.content_briefs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz NOT NULL DEFAULT now(),
    primary_goal text NOT NULL,
    narrative_angle text NOT NULL,
    primary_audience text NOT NULL,
    time_scope text NOT NULL,
    key_idea text NOT NULL,
    events jsonb, -- Storing relevant events as JSONB for simplicity
    wins jsonb,   -- Storing relevant wins as JSONB for simplicity
    market_context jsonb,
    target_length text NOT NULL,
    target_channels text[],
    primary_cta text NOT NULL,
    seed_keywords text[]
);

CREATE TABLE public.content_articles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    brief_id uuid NOT NULL REFERENCES public.content_briefs(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    markdown text NOT NULL,
    seo jsonb NOT NULL,
    status text NOT NULL DEFAULT 'draft'
);

CREATE TABLE public.distribution_packets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id uuid NOT NULL REFERENCES public.content_articles(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    base_slug text NOT NULL,
    blog_post text,
    twitter_thread jsonb,
    linkedin_post text,
    substack_body text,
    mirror_body text,
    devto_body text
);
*/

// =========================================================================
// CONTENT STORAGE CLASS
// =========================================================================

export class ContentStorage extends EventEmitter<ContentStorageEvents> {
  private config: ContentStorageConfig;
  private supabase: SupabaseClient | null = null;
  private isConnected = false;

  // In-memory fallbacks
  private events: Map<string, EngineEvent> = new Map();
  private wins: Map<string, WinRecord> = new Map();
  private briefs: Map<string, ContentBrief> = new Map();
  private articles: Map<string, ContentArticle> = new Map();
  private packets: Map<string, DistributionPacket> = new Map();

  constructor(config: ContentStorageConfig = {}) {
    super();
    this.config = {
      fallbackToMemory: true,
      ...config,
    };
  }

  /**
   * Initialize connection and verify schema
   */
  async initialize(): Promise<boolean> {
    if (this.config.url && this.config.serviceKey) {
      try {
        this.supabase = createClient(this.config.url, this.config.serviceKey);
        // A simple query to test connection, e.g., fetching a non-existent table
        // const { error } = await this.supabase.from('some_test_table').select('*').limit(1);
        // if (error) throw error;

        this.isConnected = true;
        this.emit("connected");
        console.log("[ContentStorage] Connected to Supabase.");
        return true;
      } catch (error) {
        console.error("[ContentStorage] Supabase connection failed:", error);
        this.isConnected = false;
        this.emit("error", error instanceof Error ? error : new Error(String(error)));
      }
    }

    if (this.config.fallbackToMemory || !this.isConnected) {
      console.warn("[ContentStorage] Using in-memory fallback for content storage.");
      this.isConnected = false; // Ensure isConnected is false if falling back
      return true;
    }
    return false;
  }

  /**
   * Check if connected to Supabase
   */
  get connected(): boolean {
    return this.isConnected;
  }

  // =========================================================================
  // EVENTS & WINS
  // =========================================================================

  async saveEngineEvent(event: EngineEvent): Promise<void> {
    if (this.isConnected && this.supabase) {
      const { error } = await this.supabase.from('engine_events').upsert(event, { onConflict: 'id' });
      if (error) {
        console.error("[ContentStorage] Supabase saveEngineEvent failed:", error);
        // Fallback to memory on error if configured
        if (this.config.fallbackToMemory) this.events.set(event.id, event);
        else throw error;
      }
    } else {
      this.events.set(event.id, event);
    }
    this.emit("event:saved", event);
  }

  async getEngineEventsSince(since: Date): Promise<EngineEvent[]> {
    if (this.isConnected && this.supabase) {
      const { data, error } = await this.supabase
        .from('engine_events')
        .select('*')
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: false });
      if (error) {
        console.error("[ContentStorage] Supabase getEngineEventsSince failed:", error);
        // Fallback to memory on error if configured
        if (this.config.fallbackToMemory) {
            const sinceTime = since.getTime();
            return Array.from(this.events.values())
                .filter((e) => new Date(e.timestamp).getTime() >= sinceTime)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        throw error;
      }
      return data as EngineEvent[];
    } else {
      const sinceTime = since.getTime();
      return Array.from(this.events.values())
        .filter((e) => new Date(e.timestamp).getTime() >= sinceTime)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }

  async saveWinRecord(win: WinRecord): Promise<void> {
    if (this.isConnected && this.supabase) {
        const { error } = await this.supabase.from('win_records').upsert(win, { onConflict: 'id' });
        if (error) {
          console.error("[ContentStorage] Supabase saveWinRecord failed:", error);
          if (this.config.fallbackToMemory) this.wins.set(win.id, win);
          else throw error;
        }
    } else {
        this.wins.set(win.id, win);
    }
  }

  async getWinRecordsSince(since: Date): Promise<WinRecord[]> {
    if (this.isConnected && this.supabase) {
        const { data, error } = await this.supabase
          .from('win_records')
          .select('*')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false });
        if (error) {
          console.error("[ContentStorage] Supabase getWinRecordsSince failed:", error);
          if (this.config.fallbackToMemory) {
            const sinceTime = since.getTime();
            return Array.from(this.wins.values())
              .filter((w) => new Date(w.createdAt).getTime() >= sinceTime)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          throw error;
        }
        return data as WinRecord[];
    } else {
      const sinceTime = since.getTime();
      return Array.from(this.wins.values())
        .filter((w) => new Date(w.createdAt).getTime() >= sinceTime)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  // =========================================================================
  // BRIEFS
  // =========================================================================

  async saveContentBrief(brief: ContentBrief): Promise<void> {
    if (this.isConnected && this.supabase) {
        const { error } = await this.supabase.from('content_briefs').upsert(brief, { onConflict: 'id' });
        if (error) {
          console.error("[ContentStorage] Supabase saveContentBrief failed:", error);
          if (this.config.fallbackToMemory) this.briefs.set(brief.id, brief);
          else throw error;
        }
    } else {
        this.briefs.set(brief.id, brief);
    }
    this.emit("brief:saved", brief);
  }

  async listPendingBriefs(): Promise<ContentBrief[]> {
    if (this.isConnected && this.supabase) {
        // This is a simplified check. A real implementation would involve a join
        // or a more complex query to find briefs that do not have associated articles.
        // For now, we'll fetch all briefs and filter in-memory.
        const { data: briefsData, error: briefsError } = await this.supabase
          .from('content_briefs')
          .select('*');
        if (briefsError) {
          console.error("[ContentStorage] Supabase listPendingBriefs failed (briefs fetch):", briefsError);
          if (this.config.fallbackToMemory) {
            const articleBriefIds = new Set(Array.from(this.articles.values()).map(a => a.briefId));
            return Array.from(this.briefs.values()).filter(b => !articleBriefIds.has(b.id));
          }
          throw briefsError;
        }

        const { data: articlesData, error: articlesError } = await this.supabase
          .from('content_articles')
          .select('brief_id');
        if (articlesError) {
          console.error("[ContentStorage] Supabase listPendingBriefs failed (articles fetch):", articlesError);
          if (this.config.fallbackToMemory) {
            const articleBriefIds = new Set(Array.from(this.articles.values()).map(a => a.briefId));
            return Array.from(this.briefs.values()).filter(b => !articleBriefIds.has(b.id));
          }
          throw articlesError;
        }

        const articleBriefIds = new Set(articlesData?.map(a => a.brief_id));
        return (briefsData as ContentBrief[]).filter(b => !articleBriefIds.has(b.id));

    } else {
      const articleBriefIds = new Set(Array.from(this.articles.values()).map(a => a.briefId));
      return Array.from(this.briefs.values()).filter(b => !articleBriefIds.has(b.id));
    }
  }

  async getBrief(id: string): Promise<ContentBrief | undefined> {
    if (this.isConnected && this.supabase) {
        const { data, error } = await this.supabase
          .from('content_briefs')
          .select('*')
          .eq('id', id);
        if (error) {
          console.error("[ContentStorage] Supabase getBrief failed:", error);
          if (this.config.fallbackToMemory) return this.briefs.get(id);
          throw error;
        }
        return data?.[0] as ContentBrief | undefined;
    } else {
      return this.briefs.get(id);
    }
  }

  // =========================================================================
  // ARTICLES
  // =========================================================================

  async saveContentArticle(article: ContentArticle): Promise<void> {
    if (this.isConnected && this.supabase) {
        const { error } = await this.supabase.from('content_articles').upsert(article, { onConflict: 'id' });
        if (error) {
          console.error("[ContentStorage] Supabase saveContentArticle failed:", error);
          if (this.config.fallbackToMemory) this.articles.set(article.id, article);
          else throw error;
        }
    } else {
        this.articles.set(article.id, article);
    }
    this.emit("article:saved", article);
  }

  async updateContentArticle(article: ContentArticle): Promise<void> {
    // Upsert acts as update if ID exists
    await this.saveContentArticle(article);
    this.emit("article:saved", article);
  }

  async getArticleByBriefId(briefId: string): Promise<ContentArticle | undefined> {
    if (this.isConnected && this.supabase) {
        const { data, error } = await this.supabase
          .from('content_articles')
          .select('*')
          .eq('brief_id', briefId);
        if (error) {
          console.error("[ContentStorage] Supabase getArticleByBriefId failed:", error);
          if (this.config.fallbackToMemory) return Array.from(this.articles.values()).find(a => a.briefId === briefId);
          throw error;
        }
        return data?.[0] as ContentArticle | undefined;
    } else {
      return Array.from(this.articles.values()).find(a => a.briefId === briefId);
    }
  }

  // =========================================================================
  // DISTRIBUTION
  // =========================================================================

  async saveDistributionPacket(packet: DistributionPacket): Promise<void> {
    if (this.isConnected && this.supabase) {
        const { error } = await this.supabase.from('distribution_packets').upsert(packet, { onConflict: 'id' });
        if (error) {
          console.error("[ContentStorage] Supabase saveDistributionPacket failed:", error);
          if (this.config.fallbackToMemory) this.packets.set(packet.id, packet);
          else throw error;
        }
    } else {
        this.packets.set(packet.id, packet);
    }
    this.emit("packet:saved", packet);
  }

  async getDistributionPacketByArticleId(articleId: string): Promise<DistributionPacket | undefined> {
    if (this.isConnected && this.supabase) {
        const { data, error } = await this.supabase
          .from('distribution_packets')
          .select('*')
          .eq('article_id', articleId);
        if (error) {
          console.error("[ContentStorage] Supabase getDistributionPacketByArticleId failed:", error);
          if (this.config.fallbackToMemory) {
            return Array.from(this.packets.values()).find(p => p.articleId === articleId);
          }
          throw error;
        }
        return data?.[0] as DistributionPacket | undefined;
    } else {
      return Array.from(this.packets.values()).find(p => p.articleId === articleId);
    }
  }

  async getDistributionPacket(id: string): Promise<DistributionPacket | undefined> {
    if (this.isConnected && this.supabase) {
        const { error, data } = await this.supabase
          .from('distribution_packets')
          .select('*')
          .eq('id', id);
        if (error) {
          console.error("[ContentStorage] Supabase getDistributionPacket failed:", error);
          if (this.config.fallbackToMemory) return this.packets.get(id);
          throw error;
        }
        return data?.[0] as DistributionPacket | undefined;
    } else {
      return this.packets.get(id);
    }
  }

  async updateDistributionPacketStatus(id: string, status: DistributionPacket["status"]): Promise<void> {
    const packet = await this.getDistributionPacket(id);
    if (packet) {
      packet.status = status;
      await this.saveDistributionPacket(packet);
    }
  }
}

// Singleton instance
let instance: ContentStorage | null = null;

export function getContentStorage(): ContentStorage {
  if (!instance) {
    instance = new ContentStorage({
        url: process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
        fallbackToMemory: process.env.NODE_ENV !== 'production' // Fallback in dev by default
    });
  }
  return instance;
}