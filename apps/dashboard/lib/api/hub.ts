/**
 * Integration Hub API Client
 */

export const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:3100";

// WebSocket URL (derives from HUB_URL)
export const WS_URL = HUB_URL.replace(/^http/, "ws") + "/ws";

export interface BrainStatus {
  version: string;
  primeDirective: string;
  autonomyLevel: number;
  autonomyDescription: string;
  currentPhase: string | null;
  todayFocus: string;
  isRunning: boolean;
  dryRun: boolean;
  engines: {
    money: boolean;
    growth: boolean;
    product: boolean;
    trading: boolean;
    hunter: boolean;
  };
  metrics: {
    todayPhases: number;
    todayActions: number;
    todayErrors: number;
  };
  hunter?: {
    enabledSources: string[];
    totalDiscoveries: number;
    totalSignals: number;
    actionableSignals: number;
  };
  decisionsToday?: number;
  cycleNumber?: number;
  goals?: {
    daily: Array<{ id: string; name: string; completed: boolean }>;
    weekly: Array<{ id: string; name: string; completed: boolean }>;
    monthly: Array<{ id: string; name: string; completed: boolean }>;
  };
}

export interface EngineHealth {
  id: string;
  connected: boolean;
  lastHeartbeat: number | null;
  status: "healthy" | "degraded" | "offline";
  error?: string;
}

export interface HubStatus {
  ok: boolean;
  timestamp: number;
  running?: boolean;
  apiPort?: number;
  workflows?: number;
  engines: {
    status: {
      healthy: number;
      degraded: number;
      offline: number;
      total: number;
    };
    details: EngineHealth[];
  };
}

export interface TreasuryStatus {
  totalValueUsd: number;
  balances: { sol: number; usdc: number };
  allocations: { trading: number; operations: number; growth: number; reserve: number };
  runway: number;
  expenses: { monthly: number; upcoming: number };
  trading: { activeBots: number; totalPnL: number; dailyPnL: number; weeklyPnL: number };
}

export interface GrowthStatus {
  running: boolean;
  metrics: {
    traffic: { daily: number; weekly: number; monthly: number };
    content: { postsPublished: number; totalViews: number; avgEngagement: number };
    social: { twitterFollowers: number; discordMembers: number };
    seo: { avgPosition: number; indexedPages: number; backlinks: number };
  };
  upcomingContent: { blogPosts: number; tweets: number };
}

export interface ProductStatus {
  running: boolean;
  backlog: { total: number; approved: number; building: number };
  activeBuild: { id: string; name: string; progress: number } | null;
  metrics: { discovered: number; built: number; deployed: number; successRate: number };
}

export interface HunterStatus {
  isRunning: boolean;
  enabledSources: string[];
  totalDiscoveries: number;
  totalSignals: number;
  actionableSignals: number;
  recentDiscoveries: Array<{
    id: string;
    title: string;
    source: string;
    category: string;
    relevanceScore: number;
  }>;
}

export interface AutonomyStatus {
  level: number;
  queue: { pending: number; approved: number; rejected: number };
  audit: { total: number; auto: number; queued: number; escalated: number; successRate: number };
  today: { autoExecuted: number; queued: number; escalated: number; cost: number; revenue: number };
  stats: { autoExecuted: number; queued: number; pending: number };
}

export interface EngineStatus {
  id: string;
  status: "running" | "stopped" | "error" | "unknown" | "healthy" | "idle";
  lastUpdate?: number;
}

export interface PredictionMarket {
  id: string;
  source: "polymarket" | "kalshi";
  question: string;
  category: "politics" | "crypto" | "macro" | "other";
  yesPrice: number;        // 0-100 (percentage)
  noPrice: number;         // 0-100 (percentage)
  volume24h: number;       // USD
  totalVolume: number;     // USD
  liquidity: number;       // USD
  openInterest?: number;   // Kalshi only
  priceChange24h: number;  // Percentage change
  expiresAt?: string;      // ISO date
  url: string;             // Link to market
}

export interface PredictionsStatus {
  lastUpdated: string;
  sources: {
    polymarket: { active: boolean; marketCount: number; totalVolume: number };
    kalshi: { active: boolean; marketCount: number; totalVolume: number };
  };
  markets: {
    politics: PredictionMarket[];
    crypto: PredictionMarket[];
    trending: PredictionMarket[];
  };
  stats: {
    totalMarkets: number;
    totalVolume24h: number;
    topMoverPercent: number;
  };
}

export interface HubEvent {
  id: string;
  timestamp: number;
  source: string;
  category: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface EnrichedEvent extends HubEvent {
  title: string;
  description: string;
  icon: string;
  categoryIcon: string;
  color: string;
  severity: "info" | "success" | "warning" | "error";
  actions: EventAction[];
  relatedId?: string;
}

export interface EventAction {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  action?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  icon: string;
}

export interface BrainStats {
  knowledge: {
    total: number;
    bySource: Record<string, number>;
    byTopic: Record<string, number>;
    recent24h: number;
  };
  patterns: {
    total: number;
    byType: Record<string, number>;
    avgConfidence: number;
  };
  predictions: {
    total: number;
    pending: number;
    accuracy: number;
  };
  uptime: number;
  lastIngestion: number;
}

export interface KnowledgeItem {
  id: string;
  source: { name: string; type: string; url?: string };
  content: { raw: string; summary: string };
  topics: string[];
  importance: number;
  timestamp: number;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  type: "correlation" | "trend" | "anomaly" | "recurring";
  confidence: number;
  accuracy: number;
  occurrences: number;
  examples: string[];
  relatedTopics: string[];
  discoveredAt: number;
  lastSeen: number;
}

export interface Prediction {
  id: string;
  type: "market" | "technology" | "opportunity" | "risk";
  subject: string;
  prediction: {
    outcome: string;
    probability: number;
    confidence: number;
    timeframe: string;
    reasoning: string[];
  };
  basedOn: {
    patterns: string[];
    knowledge: string[];
  };
  createdAt: number;
  expiresAt: number;
  status: "pending" | "verified" | "failed" | "expired";
}

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${HUB_URL}/api${endpoint}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface ApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

async function postApi<T = ApiResponse>(endpoint: string, body?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${HUB_URL}/api${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const hubApi = {
  // GET endpoints - System
  getStatus: () => fetchApi<HubStatus>("/status"),

  // GET endpoints - Brain status & control
  getBrain: () => fetchApi<{ ok: boolean; status: BrainStatus }>("/brain/status"),
  getBrainStatus: () => fetchApi<{ ok: boolean; status: BrainStatus }>("/brain/status"),

  // GET endpoints - Brain knowledge (HYPER BRAIN integrated)
  getBrainStats: () => fetchApi<{ ok: boolean } & BrainStats>("/brain/stats"),
  getBrainRecent: (limit = 20) => fetchApi<{ ok: boolean; items: KnowledgeItem[]; count: number }>(`/brain/recent?limit=${limit}`),
  getBrainPatterns: () => fetchApi<{ ok: boolean; patterns: Pattern[]; count: number }>("/brain/patterns"),
  getBrainPredictions: () => fetchApi<{ ok: boolean; predictions: Prediction[]; count: number }>("/brain/predictions"),
  searchBrain: (query: string) => postApi<{ ok: boolean; results: KnowledgeItem[]; count: number }>("/brain/search", { query }),
  triggerIngest: (source?: string) => postApi("/brain/ingest", { source }),

  // Brain knowledge detail endpoints
  getBrainKnowledgeById: (id: string) => fetchApi<{ ok: boolean; item: KnowledgeItem | null; error?: string }>(`/brain/knowledge/${id}`),
  getBrainKnowledgeByTopic: (topic: string, limit = 20) => fetchApi<{ ok: boolean; items: KnowledgeItem[]; count: number }>(`/brain/knowledge/topic/${topic}?limit=${limit}`),
  getBrainKnowledgeSimilar: (id: string, limit = 10) => fetchApi<{ ok: boolean; results: Array<{ item: KnowledgeItem; score: number }>; count: number }>(`/brain/knowledge/${id}/similar?limit=${limit}`),
  getBrainPatternById: (id: string) => fetchApi<{ ok: boolean; pattern: Pattern | null; error?: string }>(`/brain/patterns/${id}`),
  getBrainPredictionById: (id: string) => fetchApi<{ ok: boolean; prediction: Prediction | null; error?: string }>(`/brain/predictions/${id}`),
  generateBrainPredictions: (type: string, count = 5) => postApi<{ ok: boolean; predictions: Prediction[] }>("/brain/predictions/generate", { type, count }),
  getBrainIngestStats: () => fetchApi<{ ok: boolean; lastRun: number; itemsIngested: number; errors: number; bySource: Record<string, { count: number; lastRun: number; errors: number }> }>("/brain/ingest/stats"),

  // GET endpoints - Engine statuses
  getTreasury: () => fetchApi<TreasuryStatus>("/treasury"),
  getMoney: () => fetchApi<TreasuryStatus>("/money/status"),
  getGrowth: () => fetchApi<GrowthStatus>("/growth/status"),
  getProduct: () => fetchApi<ProductStatus>("/product/status"),
  getHunter: () => fetchApi<HunterStatus>("/hunter/status"),
  getAutonomy: () => fetchApi<AutonomyStatus>("/autonomy/status"),

  // GET endpoints - Prediction markets
  getPredictions: () => fetchApi<PredictionsStatus>("/predictions/status"),

  // GET endpoints - Events
  getEvents: (limit = 50, category?: string) =>
    fetchApi<{ ok: boolean; events: HubEvent[]; count: number }>(
      `/events?limit=${limit}${category ? `&category=${category}` : ""}`
    ),
  getEnrichedEvents: (limit = 50, category?: string, severity?: string) =>
    fetchApi<{ ok: boolean; events: EnrichedEvent[]; count: number }>(
      `/events/enriched?limit=${limit}${category ? `&category=${category}` : ""}${severity ? `&severity=${severity}` : ""}`
    ),
  getEventCategories: () => fetchApi<{ ok: boolean; categories: EventCategory[] }>("/events/categories"),

  // Brain control actions
  startBrain: () => postApi("/brain/start"),
  stopBrain: () => postApi("/brain/stop"),
  triggerPhase: (phase: string) => postApi("/brain/phase", { phase }),

  // Discovery actions
  runDiscovery: () => postApi("/discovery/run"),

  // Content generation actions
  generateContent: (type: "blog" | "tweet" | "thread") => postApi("/content/generate", { type }),
};
