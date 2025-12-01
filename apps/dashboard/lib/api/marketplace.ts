/**
 * Marketplace API Client
 */

const MARKETPLACE_URL = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "http://localhost:3000";

export interface LiveStats {
  totalBuilders: number;
  activeNow: number;
  builtToday: number;
  trending: Array<{ name: string; count: number }>;
  lastUpdated: string;
}

export interface TokenSavings {
  tokensSavedToday: number;
  costSavedToday: number;
  avgTokensPerStack: number;
  avgCostPerStack: number;
  totalTokensSaved: number;
  totalCostSaved: number;
  savingsRate: number;
  formatted: {
    tokensSavedToday: string;
    costSavedToday: string;
    totalTokensSaved: string;
    totalCostSaved: string;
  };
}

export interface AnalyticsStats {
  totalEvents: number;
  uniqueItems: number;
  uniqueVisitors: number;
  itemsViewed: number;
  searchCount: number;
  bundleDownloads: number;
  popularItems: Array<{ id: string; name: string; views: number; score: number }>;
  byKind: Record<string, number>;
}

export interface ActivityEvent {
  id: string;
  type: string;
  timestamp: string;
  user: string;
  message: string;
  icon: string;
  color: string;
}

export interface RegistryStats {
  totalItems: number;
  byKind: {
    agents: number;
    skills: number;
    commands: number;
    mcps: number;
    workflows: number;
  };
}

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${MARKETPLACE_URL}${endpoint}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const marketplaceApi = {
  getLiveStats: () => fetchApi<LiveStats>("/api/live/stats"),
  getLiveFeed: () => fetchApi<ActivityEvent[]>("/api/live/feed"),
  getTokenSavings: () => fetchApi<TokenSavings>("/api/analytics/token-savings"),
  getAnalytics: () => fetchApi<AnalyticsStats>("/api/analytics/stats"),
  getRegistry: async (): Promise<RegistryStats | null> => {
    try {
      const res = await fetch(`${MARKETPLACE_URL}/api/registry`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const items = await res.json();
      const byKind = { agents: 0, skills: 0, commands: 0, mcps: 0, workflows: 0 };
      for (const item of items) {
        const kind = item.kind?.toLowerCase() || "other";
        if (kind in byKind) byKind[kind as keyof typeof byKind]++;
      }
      return { totalItems: items.length, byKind };
    } catch {
      return null;
    }
  },
};
