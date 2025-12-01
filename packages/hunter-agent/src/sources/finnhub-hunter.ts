import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
} from "../types.js";

// Finnhub API - Free API Key Required
// Rate limit: 60 calls/minute (free tier)
const FINNHUB_API = "https://finnhub.io/api/v1";

interface CongressTrade {
  symbol: string;
  name: string;
  transactionDate: string;
  transactionType: string;
  amountFrom?: number;
  amountTo?: number;
  chamber: string;
  ownerType: string;
  filingDate: string;
}

interface InsiderTransaction {
  symbol: string;
  name: string;
  share: number;
  change: number;
  transactionDate: string;
  transactionCode: string;
  transactionPrice: number;
  filingDate: string;
}

interface EarningsSurprise {
  symbol: string;
  actual: number;
  estimate: number;
  period: string;
  surprisePercent: number;
}

// Crypto and tech tickers to track
const TRACKED_SYMBOLS = [
  // Crypto-related
  "COIN", "MSTR", "RIOT", "MARA", "CLSK", "HUT",
  // Big tech
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
  // AI plays
  "AMD", "INTC", "CRM", "PLTR", "AI", "SNOW",
  // ETFs
  "QQQ", "SPY", "IWM", "ARKK",
];

export class FinnhubHunter implements BaseHunterSource {
  source = "finnhub" as const;
  private config: HunterConfig;
  private apiKey: string;

  constructor(config: HunterConfig) {
    this.config = config;
    this.apiKey = config.apiKey ?? process.env.FINNHUB_API_KEY ?? "";
  }

  async hunt(): Promise<RawDiscovery[]> {
    if (!this.apiKey) {
      console.warn("[FinnhubHunter] No API key. Get one at https://finnhub.io/register");
      return [];
    }

    const discoveries: RawDiscovery[] = [];

    // 1. Congressional trades - THE ALPHA
    try {
      const congressTrades = await this.fetchCongressTrades();
      discoveries.push(...congressTrades.map((t) => this.congressTradeToDiscovery(t)));
    } catch (error) {
      console.error("[FinnhubHunter] Failed to fetch congress trades:", error);
    }

    // 2. Insider transactions for tracked symbols
    for (const symbol of TRACKED_SYMBOLS.slice(0, 10)) {
      try {
        const insiders = await this.fetchInsiderTransactions(symbol);
        const recent = insiders.filter((t) => this.isRecent(t.filingDate));
        discoveries.push(...recent.map((t) => this.insiderToDiscovery(t)));
        await new Promise((r) => setTimeout(r, 1100)); // Rate limit
      } catch (error) {
        console.error(`[FinnhubHunter] Failed to fetch insiders for ${symbol}:`, error);
      }
    }

    // 3. Earnings surprises
    try {
      const earnings = await this.fetchEarningsSurprises();
      const significant = earnings.filter((e) => Math.abs(e.surprisePercent) > 5);
      discoveries.push(...significant.map((e) => this.earningsToDiscovery(e)));
    } catch (error) {
      console.error("[FinnhubHunter] Failed to fetch earnings:", error);
    }

    // Deduplicate
    const seen = new Set<string>();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata as { type: string; symbol: string } | undefined;

    return {
      id: randomUUID(),
      source: "finnhub" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(metadata?.type),
      tags: this.extractTags(text, metadata),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.isCryptoRelated(metadata?.symbol),
        hasAIKeywords: this.isAIRelated(metadata?.symbol),
        hasSolanaKeywords: false,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: metadata?.type === "congress", // Congress trades are always high value
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchCongressTrades(): Promise<CongressTrade[]> {
    const response = await fetch(
      `${FINNHUB_API}/stock/congressional-trading?symbol=&from=&to=&token=${this.apiKey}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.data ?? []).slice(0, 50); // Latest 50 trades
  }

  private async fetchInsiderTransactions(symbol: string): Promise<InsiderTransaction[]> {
    const response = await fetch(
      `${FINNHUB_API}/stock/insider-transactions?symbol=${symbol}&token=${this.apiKey}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.data ?? [];
  }

  private async fetchEarningsSurprises(): Promise<EarningsSurprise[]> {
    const response = await fetch(
      `${FINNHUB_API}/calendar/earnings?from=${this.getDateString(-7)}&to=${this.getDateString(0)}&token=${this.apiKey}`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.earningsCalendar ?? [])
      .filter((e: any) => e.actual !== null && e.estimate !== null)
      .map((e: any) => ({
        symbol: e.symbol,
        actual: e.actual,
        estimate: e.estimate,
        period: e.period,
        surprisePercent: ((e.actual - e.estimate) / Math.abs(e.estimate)) * 100,
      }));
  }

  private congressTradeToDiscovery(trade: CongressTrade): RawDiscovery {
    const isBuy = trade.transactionType.toLowerCase().includes("purchase");
    const emoji = isBuy ? "🟢" : "🔴";
    const action = isBuy ? "BOUGHT" : "SOLD";

    const amountRange = trade.amountFrom && trade.amountTo
      ? `$${this.formatNumber(trade.amountFrom)} - $${this.formatNumber(trade.amountTo)}`
      : "Amount undisclosed";

    return {
      sourceId: `finnhub:congress:${trade.symbol}:${trade.transactionDate}:${trade.name}`,
      sourceUrl: `https://finnhub.io/docs/api/congressional-trading`,
      title: `${emoji} [CONGRESS] ${trade.name} ${action} ${trade.symbol}`,
      description: `${trade.chamber} member ${trade.name} ${action.toLowerCase()} ${trade.symbol}. Amount: ${amountRange}. Filed: ${trade.filingDate}`,
      author: trade.name,
      publishedAt: new Date(trade.transactionDate),
      metrics: {
        points: trade.amountTo ?? trade.amountFrom ?? 0,
        likes: isBuy ? 1 : -1,
      },
      metadata: { ...trade, type: "congress" } as unknown as Record<string, unknown>,
    };
  }

  private insiderToDiscovery(trade: InsiderTransaction): RawDiscovery {
    const isBuy = trade.change > 0;
    const emoji = isBuy ? "🟢" : "🔴";
    const action = isBuy ? "BOUGHT" : "SOLD";

    const value = Math.abs(trade.change * trade.transactionPrice);

    return {
      sourceId: `finnhub:insider:${trade.symbol}:${trade.transactionDate}:${trade.name}`,
      sourceUrl: `https://finnhub.io/docs/api/insider-transactions`,
      title: `${emoji} [INSIDER] ${trade.name} ${action} ${Math.abs(trade.change).toLocaleString()} ${trade.symbol}`,
      description: `Insider ${trade.name} ${action.toLowerCase()} ${Math.abs(trade.change).toLocaleString()} shares at $${trade.transactionPrice.toFixed(2)}. Total value: $${this.formatNumber(value)}`,
      author: trade.name,
      publishedAt: new Date(trade.transactionDate),
      metrics: {
        points: value,
        likes: trade.change,
      },
      metadata: { ...trade, type: "insider" } as unknown as Record<string, unknown>,
    };
  }

  private earningsToDiscovery(earnings: EarningsSurprise): RawDiscovery {
    const isBeat = earnings.surprisePercent > 0;
    const emoji = isBeat ? "🎯" : "❌";
    const result = isBeat ? "BEAT" : "MISSED";

    return {
      sourceId: `finnhub:earnings:${earnings.symbol}:${earnings.period}`,
      sourceUrl: `https://finnhub.io/docs/api/earnings-calendar`,
      title: `${emoji} [EARNINGS] ${earnings.symbol} ${result} by ${Math.abs(earnings.surprisePercent).toFixed(1)}%`,
      description: `${earnings.symbol} reported EPS of $${earnings.actual.toFixed(2)} vs estimate of $${earnings.estimate.toFixed(2)} for ${earnings.period}`,
      publishedAt: new Date(),
      metrics: {
        points: earnings.actual,
        likes: earnings.surprisePercent,
      },
      metadata: { ...earnings, type: "earnings" } as unknown as Record<string, unknown>,
    };
  }

  private categorize(type?: string): HuntDiscovery["category"] {
    return "other";
  }

  private extractTags(text: string, metadata?: { type: string; symbol: string }): string[] {
    const tags = ["finnhub"];

    if (metadata?.type) {
      tags.push(metadata.type);
      if (metadata.type === "congress") tags.push("political-alpha");
      if (metadata.type === "insider") tags.push("insider-trade");
      if (metadata.type === "earnings") tags.push("earnings");
    }

    if (metadata?.symbol) {
      tags.push(metadata.symbol.toLowerCase());
      if (this.isCryptoRelated(metadata.symbol)) tags.push("crypto");
      if (this.isAIRelated(metadata.symbol)) tags.push("ai");
    }

    return tags;
  }

  private isCryptoRelated(symbol?: string): boolean {
    if (!symbol) return false;
    const cryptoSymbols = ["COIN", "MSTR", "RIOT", "MARA", "CLSK", "HUT", "BITF", "BTBT"];
    return cryptoSymbols.includes(symbol.toUpperCase());
  }

  private isAIRelated(symbol?: string): boolean {
    if (!symbol) return false;
    const aiSymbols = ["NVDA", "AMD", "PLTR", "AI", "SNOW", "CRM", "GOOGL", "MSFT"];
    return aiSymbols.includes(symbol.toUpperCase());
  }

  private isRecent(dateStr: string): boolean {
    const date = new Date(dateStr);
    const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }

  private getDateString(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split("T")[0];
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `finnhub:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
