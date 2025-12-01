/**
 * Supabase API Client for Dashboard
 * Fetches trading, signals, and discovery data from Supabase via API routes
 */

import type { Position, Trade, Signal, Discovery, DailyStats } from "../supabase";

export interface TradingData {
  positions: Position[];
  trades: Trade[];
  stats: {
    dailyPnL: number;
    weeklyPnL: number;
    totalPnL: number;
    tradesCount: number;
    activeBots: number;
  };
  configured: boolean;
  lastUpdated: number;
}

export interface SignalsData {
  signals: Signal[];
  stats: {
    total: number;
    queued: number;
    executed: number;
    rejected: number;
  };
  configured: boolean;
  lastUpdated: number;
}

export interface DiscoveriesData {
  discoveries: Discovery[];
  stats: {
    total: number;
    bySource: Record<string, number>;
  };
  configured: boolean;
  lastUpdated: number;
}

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`/api${endpoint}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const supabaseApi = {
  getTrading: () => fetchApi<TradingData>("/trading"),
  getSignals: (status?: string) =>
    fetchApi<SignalsData>(status ? `/signals?status=${status}` : "/signals"),
  getDiscoveries: (source?: string) =>
    fetchApi<DiscoveriesData>(source ? `/discoveries?source=${source}` : "/discoveries"),
};
