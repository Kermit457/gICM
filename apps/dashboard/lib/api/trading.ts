/**
 * Trading API Client - connects to ai-hedge-fund Python service
 */

export const TRADING_URL = process.env.NEXT_PUBLIC_TRADING_URL || "http://localhost:8001";

// Types
export interface TradingStatus {
  mode: string;
  running: boolean;
  positions: number;
  totalPnL: number;
  dailyPnL: number;
  weeklyPnL: number;
  winRate: number;
}

export interface Position {
  id: string;
  token: string;
  chain: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  openedAt: number;
  status: "open" | "closing" | "closed";
}

export interface Trade {
  id: string;
  timestamp: number;
  asset: string;
  type: "buy" | "sell";
  amount: number;
  price: number;
  total: number;
  pnl: number;
  pnlPercent: number;
  status: "completed" | "pending" | "failed";
}

export interface TreasuryData {
  totalValueUsd: number;
  balances: {
    sol: number;
    usdc: number;
    [key: string]: number;
  };
  allocations: {
    trading: number;
    operations: number;
    growth: number;
    reserve: number;
  };
  runway: number;
}

export interface SignalResult {
  token: string;
  chain: string;
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  confidence: number;
  reasons: string[];
  priceTarget?: number;
  stopLoss?: number;
}

export interface MarketData {
  token: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders?: number;
}

export interface SignalQueueItem {
  id: string;
  token: string;
  chain: string;
  signal: string;
  confidence: number;
  createdAt: number;
  status: "pending" | "executed" | "rejected";
}

// API helpers
async function fetchTradingApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${TRADING_URL}${endpoint}`, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function postTradingApi<T>(endpoint: string, body?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${TRADING_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const tradingApi = {
  // Status & System
  getStatus: () => fetchTradingApi<TradingStatus>("/api/v1/status"),
  getHealth: () => fetchTradingApi<{ status: string; uptime: number }>("/health"),

  // Positions & Trades
  getPositions: () => fetchTradingApi<Position[]>("/api/v1/positions"),
  getTreasury: () => fetchTradingApi<TreasuryData>("/api/v1/treasury"),
  getTradesToday: () => fetchTradingApi<Trade[]>("/api/v1/trades/today"),
  getTradeHistory: (limit = 100) => fetchTradingApi<Trade[]>(`/api/v1/trades?limit=${limit}`),

  // Analysis & Signals
  quickSignal: (token: string, chain = "solana") =>
    postTradingApi<SignalResult>("/api/v1/quick-signal", { token, chain }),
  analyze: (token: string, chain: string, mode: "fast" | "deep" = "fast") =>
    postTradingApi<SignalResult>("/api/v1/analyze", { token, chain, mode }),
  getMarketData: (token: string) =>
    fetchTradingApi<MarketData>(`/api/v1/market-data/${token}`),

  // Signal Queue
  getSignalQueue: () => fetchTradingApi<SignalQueueItem[]>("/api/v1/signals/queue"),

  // Trading Actions
  executeTrade: (data: { token: string; chain: string; action: "buy" | "sell"; amount: number }) =>
    postTradingApi<{ ok: boolean; tradeId: string }>("/api/v1/trade", data),
  closePosition: (positionId: string) =>
    postTradingApi<{ ok: boolean }>(`/api/v1/positions/${positionId}/close`),

  // PnL & Analytics
  getDailyPnL: (days = 30) =>
    fetchTradingApi<Array<{ date: string; pnl: number; trades: number }>>(`/api/v1/pnl/daily?days=${days}`),
  getPortfolioMetrics: () =>
    fetchTradingApi<{
      totalValue: number;
      totalPnL: number;
      winRate: number;
      avgTradeSize: number;
      sharpeRatio: number;
      maxDrawdown: number;
    }>("/api/v1/portfolio/metrics"),
};
