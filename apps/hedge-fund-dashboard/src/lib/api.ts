/**
 * AI Hedge Fund API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface AgentSignal {
  agent: string;
  action: "bullish" | "bearish" | "neutral";
  confidence: number;
  reasoning: string;
  key_metrics: string[];
  risks: string[];
}

export interface MarketData {
  token: string;
  chain: string;
  price: number;
  market_cap: number;
  volume_24h: number;
  change_24h: number;
  change_7d: number;
  liquidity: number;
  ath: number;
  ath_change: number;
}

export interface AnalysisResult {
  token: string;
  chain: string;
  market_data: MarketData;
  agent_signals: AgentSignal[];
  risk_assessment: AgentSignal | null;
  final_decision: {
    action: string;
    conviction: string;
    confidence: number;
    reasoning: string;
    execution_plan?: {
      entry_price: string;
      position_size_pct: string;
      stop_loss: string;
      take_profit: string[];
    };
  };
  summary: string;
}

export interface QuickSignal {
  token: string;
  price: number;
  change_24h: number;
  sentiment: string;
  confidence: number;
  signals: AgentSignal[];
  quick_take: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  agents_available: number;
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/api/v1/health`);
  if (!res.ok) throw new Error("API not available");
  return res.json();
}

export async function getMarketData(
  token: string,
  chain = "solana"
): Promise<{ data: MarketData }> {
  const res = await fetch(`${API_BASE}/api/v1/market-data/${token}?chain=${chain}`);
  if (!res.ok) throw new Error(`Failed to fetch market data for ${token}`);
  return res.json();
}

export async function analyzeToken(
  token: string,
  chain = "solana",
  mode: "full" | "fast" | "degen" = "full"
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, chain, mode }),
  });
  if (!res.ok) throw new Error(`Analysis failed for ${token}`);
  return res.json();
}

export async function quickSignal(
  token: string,
  chain = "solana"
): Promise<QuickSignal> {
  const res = await fetch(`${API_BASE}/api/v1/quick-signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, chain }),
  });
  if (!res.ok) throw new Error(`Quick signal failed for ${token}`);
  return res.json();
}

export async function batchAnalyze(
  tokens: string[],
  chain = "solana"
): Promise<{ results: QuickSignal[] }> {
  const res = await fetch(`${API_BASE}/api/v1/analyze/batch?chain=${chain}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokens),
  });
  if (!res.ok) throw new Error("Batch analysis failed");
  return res.json();
}

export async function listAgents(): Promise<{
  agents: Array<{
    name: string;
    description: string;
    risk_tolerance: string;
    time_horizon: string;
    focus_areas: string[];
  }>;
}> {
  const res = await fetch(`${API_BASE}/api/v1/agents`);
  if (!res.ok) throw new Error("Failed to list agents");
  return res.json();
}
