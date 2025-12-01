/**
 * Supabase Client for gICM Dashboard
 *
 * Tables available:
 * - positions: Trading positions (open/closed)
 * - trades: Trade executions
 * - signals: Hunter signals queue
 * - discoveries: Hunter discoveries
 * - daily_stats: Aggregated daily statistics
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create client if configured
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Type definitions matching the database schema
export interface Position {
  id: string;
  token: string;
  chain: string;
  size: number;
  entry_price: number;
  current_price: number | null;
  pnl: number;
  pnl_percent: number;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  position_id: string | null;
  type: "open" | "close" | "partial";
  token: string;
  chain: string;
  size: number;
  price: number;
  pnl: number | null;
  executed_at: string;
  created_at: string;
}

export interface Signal {
  id: string;
  type: string;
  source: string;
  token: string | null;
  chain: string | null;
  action: string;
  confidence: number;
  urgency: string;
  title: string;
  description: string | null;
  reasoning: string | null;
  risk: string;
  risk_factors: string[];
  tags: string[];
  metrics: Record<string, unknown>;
  status: "queued" | "analyzed" | "executed" | "rejected";
  analysis: Record<string, unknown> | null;
  received_at: string;
  analyzed_at: string | null;
  created_at: string;
}

export interface Discovery {
  id: string;
  source: string;
  type: string;
  title: string;
  description: string | null;
  url: string | null;
  fingerprint: string | null;
  relevance: number | null;
  metrics: Record<string, unknown>;
  tags: string[];
  discovered_at: string;
  created_at: string;
}

export interface DailyStats {
  id: string;
  date: string;
  pnl: number;
  trades_count: number;
  signals_received: number;
  signals_queued: number;
  signals_rejected: number;
  created_at: string;
  updated_at: string;
}

// Repository functions
export const positionsRepo = {
  async getOpen(): Promise<Position[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false });
    if (error) console.error("Error fetching positions:", error);
    return data || [];
  },

  async getAll(): Promise<Position[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .order("opened_at", { ascending: false });
    if (error) console.error("Error fetching positions:", error);
    return data || [];
  },

  async getRecent(limit = 10): Promise<Position[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(limit);
    if (error) console.error("Error fetching positions:", error);
    return data || [];
  },
};

export const tradesRepo = {
  async getToday(): Promise<Trade[]> {
    if (!supabase) return [];
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .gte("executed_at", `${today}T00:00:00`)
      .order("executed_at", { ascending: false });
    if (error) console.error("Error fetching trades:", error);
    return data || [];
  },

  async getRecent(limit = 50): Promise<Trade[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(limit);
    if (error) console.error("Error fetching trades:", error);
    return data || [];
  },
};

export const signalsRepo = {
  async getQueued(limit = 50): Promise<Signal[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("signals")
      .select("*")
      .eq("status", "queued")
      .order("received_at", { ascending: false })
      .limit(limit);
    if (error) console.error("Error fetching signals:", error);
    return data || [];
  },

  async getRecent(limit = 100): Promise<Signal[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("signals")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(limit);
    if (error) console.error("Error fetching signals:", error);
    return data || [];
  },

  async getById(id: string): Promise<Signal | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("signals")
      .select("*")
      .eq("id", id)
      .single();
    if (error) console.error("Error fetching signal:", error);
    return data;
  },
};

export const discoveriesRepo = {
  async getRecent(limit = 100): Promise<Discovery[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("discoveries")
      .select("*")
      .order("discovered_at", { ascending: false })
      .limit(limit);
    if (error) console.error("Error fetching discoveries:", error);
    return data || [];
  },

  async getBySource(source: string, limit = 50): Promise<Discovery[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("discoveries")
      .select("*")
      .eq("source", source)
      .order("discovered_at", { ascending: false })
      .limit(limit);
    if (error) console.error("Error fetching discoveries:", error);
    return data || [];
  },
};

export const dailyStatsRepo = {
  async getToday(): Promise<DailyStats | null> {
    if (!supabase) return null;
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("date", today)
      .single();
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching daily stats:", error);
    }
    return data;
  },

  async getRecent(days = 30): Promise<DailyStats[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("daily_stats")
      .select("*")
      .order("date", { ascending: false })
      .limit(days);
    if (error) console.error("Error fetching daily stats:", error);
    return data || [];
  },

  async getTotalPnL(): Promise<number> {
    if (!supabase) return 0;
    const { data, error } = await supabase
      .from("daily_stats")
      .select("pnl");
    if (error) {
      console.error("Error fetching total PnL:", error);
      return 0;
    }
    return (data || []).reduce((sum, row) => sum + (row.pnl || 0), 0);
  },
};

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
