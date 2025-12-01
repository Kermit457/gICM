/**
 * API Client for Integration Hub
 */

const API_BASE = process.env.NEXT_PUBLIC_HUB_API_URL || "http://localhost:3100";

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
  };
  metrics: {
    todayPhases: number;
    todayActions: number;
    todayErrors: number;
  };
}

export interface EngineHealth {
  id: string;
  connected: boolean;
  lastHeartbeat: number | null;
  status: "healthy" | "degraded" | "offline";
  error?: string;
}

export interface TreasuryStatus {
  totalUsd: number;
  solBalance: number;
  usdcBalance: number;
  runway: number;
  allocations: Record<string, number>;
}

export interface HubEvent {
  id: string;
  timestamp: number;
  source: string;
  category: string;
  type: string;
  payload: Record<string, unknown>;
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error("API request failed: " + res.status);
  }
  return res.json();
}

export const api = {
  // Status
  async getStatus() {
    return fetchJson<{
      ok: boolean;
      timestamp: number;
      engines: {
        status: { healthy: number; degraded: number; offline: number };
        details: EngineHealth[];
      };
    }>("/api/status");
  },

  // Brain
  async getBrainStatus() {
    return fetchJson<{ ok: boolean; status: BrainStatus }>("/api/brain/status");
  },

  async startBrain() {
    return fetchJson<{ ok: boolean; message: string }>("/api/brain/start", {
      method: "POST",
    });
  },

  async stopBrain() {
    return fetchJson<{ ok: boolean; message: string }>("/api/brain/stop", {
      method: "POST",
    });
  },

  async triggerPhase(phase: string) {
    return fetchJson<{ ok: boolean; message: string; phase: string }>(
      "/api/brain/phase",
      {
        method: "POST",
        body: JSON.stringify({ phase }),
      }
    );
  },

  // Treasury
  async getTreasury() {
    return fetchJson<{
      ok: boolean;
      treasury: TreasuryStatus;
      health: { runway: number };
    }>("/api/treasury");
  },

  // Events
  async getEvents(limit = 50) {
    return fetchJson<{ ok: boolean; count: number; events: HubEvent[] }>(
      "/api/events?limit=" + limit
    );
  },

  // Discovery
  async getBacklog() {
    return fetchJson<{
      ok: boolean;
      count: number;
      items: Array<{ id: string; title: string; status: string }>;
    }>("/api/backlog");
  },

  async runDiscovery() {
    return fetchJson<{
      ok: boolean;
      found: number;
      opportunities: Array<{ id: string; title: string }>;
    }>("/api/discovery/run", { method: "POST" });
  },

  // Content
  async generateContent(type: "blog" | "tweet" | "thread") {
    return fetchJson<{ ok: boolean; type: string }>("/api/content/generate", {
      method: "POST",
      body: JSON.stringify({ type }),
    });
  },
};
