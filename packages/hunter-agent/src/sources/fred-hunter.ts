import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
} from "../types.js";

// FRED API - Free API Key Required
// Rate limit: 120 requests/minute
const FRED_API = "https://api.stlouisfed.org/fred";

interface FREDObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

interface FREDSeries {
  id: string;
  realtime_start: string;
  realtime_end: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  notes?: string;
}

// Key economic indicators for trading signals
const KEY_SERIES = [
  // Interest Rates & Fed Policy
  { id: "FEDFUNDS", name: "Fed Funds Rate", category: "rates", threshold: 0.25 },
  { id: "T10Y2Y", name: "10Y-2Y Treasury Spread", category: "rates", threshold: 0.1 },
  { id: "T10YIE", name: "10Y Breakeven Inflation", category: "inflation", threshold: 0.1 },

  // Inflation
  { id: "CPIAUCSL", name: "Consumer Price Index", category: "inflation", threshold: 0.5 },
  { id: "PCEPI", name: "PCE Price Index", category: "inflation", threshold: 0.3 },

  // Employment
  { id: "UNRATE", name: "Unemployment Rate", category: "employment", threshold: 0.2 },
  { id: "PAYEMS", name: "Nonfarm Payrolls", category: "employment", threshold: 100 },
  { id: "ICSA", name: "Initial Jobless Claims", category: "employment", threshold: 20000 },

  // Economic Activity
  { id: "GDP", name: "Real GDP", category: "gdp", threshold: 0.5 },
  { id: "DGORDER", name: "Durable Goods Orders", category: "manufacturing", threshold: 1 },
  { id: "INDPRO", name: "Industrial Production", category: "manufacturing", threshold: 0.5 },

  // Consumer & Housing
  { id: "UMCSENT", name: "Consumer Sentiment", category: "sentiment", threshold: 2 },
  { id: "HOUST", name: "Housing Starts", category: "housing", threshold: 50 },

  // Money Supply
  { id: "M2SL", name: "M2 Money Supply", category: "money", threshold: 100 },

  // Leading Indicators
  { id: "USSLIND", name: "Leading Index", category: "leading", threshold: 0.2 },
];

export class FREDHunter implements BaseHunterSource {
  source = "fred" as const;
  private config: HunterConfig;
  private apiKey: string;

  constructor(config: HunterConfig) {
    this.config = config;
    this.apiKey = config.apiKey ?? process.env.FRED_API_KEY ?? "";
  }

  async hunt(): Promise<RawDiscovery[]> {
    if (!this.apiKey) {
      console.warn("[FREDHunter] No API key configured. Get one at https://fred.stlouisfed.org/docs/api/api_key.html");
      return [];
    }

    const discoveries: RawDiscovery[] = [];

    for (const series of KEY_SERIES) {
      try {
        const data = await this.fetchSeries(series.id);
        if (data) {
          const discovery = this.analyzeSeriesData(series, data);
          if (discovery) {
            discoveries.push(discovery);
          }
        }
        await new Promise((r) => setTimeout(r, 600)); // Rate limit
      } catch (error) {
        console.error(`[FREDHunter] Failed to fetch ${series.id}:`, error);
      }
    }

    return discoveries;
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata as { series: typeof KEY_SERIES[0]; change: number } | undefined;

    return {
      id: randomUUID(),
      source: "fred" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: "other",
      tags: this.extractTags(metadata),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: false,
        hasAIKeywords: false,
        hasSolanaKeywords: false,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: Math.abs(metadata?.change ?? 0) > (metadata?.series.threshold ?? 0),
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchSeries(seriesId: string): Promise<{ series: FREDSeries; observations: FREDObservation[] } | null> {
    // Fetch series info
    const seriesResponse = await fetch(
      `${FRED_API}/series?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );

    if (!seriesResponse.ok) return null;
    const seriesData = await seriesResponse.json();
    const series = seriesData.seriess?.[0];

    // Fetch recent observations
    const obsResponse = await fetch(
      `${FRED_API}/series/observations?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=10`,
      { headers: { "User-Agent": "gICM-Hunter/1.0" } }
    );

    if (!obsResponse.ok) return null;
    const obsData = await obsResponse.json();
    const observations = obsData.observations ?? [];

    return { series, observations };
  }

  private analyzeSeriesData(
    seriesConfig: typeof KEY_SERIES[0],
    data: { series: FREDSeries; observations: FREDObservation[] }
  ): RawDiscovery | null {
    const { series, observations } = data;

    if (observations.length < 2) return null;

    // Filter out "." values (missing data)
    const validObs = observations.filter((o) => o.value !== ".");
    if (validObs.length < 2) return null;

    const latest = parseFloat(validObs[0].value);
    const previous = parseFloat(validObs[1].value);
    const change = latest - previous;
    const changePercent = (change / previous) * 100;

    // Only report significant changes
    if (Math.abs(change) < seriesConfig.threshold) return null;

    const direction = change > 0 ? "📈" : "📉";
    const signal = this.getSignal(seriesConfig, change);

    return {
      sourceId: `fred:${seriesConfig.id}:${validObs[0].date}`,
      sourceUrl: `https://fred.stlouisfed.org/series/${seriesConfig.id}`,
      title: `${direction} [ECON] ${seriesConfig.name}: ${latest.toFixed(2)} (${change > 0 ? "+" : ""}${changePercent.toFixed(1)}%)`,
      description: `${series.title} changed from ${previous.toFixed(2)} to ${latest.toFixed(2)}. ${signal}`,
      author: "Federal Reserve",
      authorUrl: "https://fred.stlouisfed.org",
      publishedAt: new Date(validObs[0].date),
      metrics: {
        points: latest,
        views: Math.abs(change),
        likes: Math.abs(changePercent),
      },
      metadata: {
        series: seriesConfig,
        seriesInfo: series,
        latest,
        previous,
        change,
        changePercent,
        observations: validObs.slice(0, 5),
      } as unknown as Record<string, unknown>,
    };
  }

  private getSignal(series: typeof KEY_SERIES[0], change: number): string {
    const signals: Record<string, Record<string, string>> = {
      rates: {
        up: "Rising rates = bearish for risk assets, bullish USD",
        down: "Falling rates = bullish for risk assets, bearish USD",
      },
      inflation: {
        up: "Rising inflation = Fed may stay hawkish",
        down: "Falling inflation = Fed may ease policy",
      },
      employment: {
        up: series.id === "UNRATE"
          ? "Rising unemployment = recession risk, Fed may ease"
          : "Strong employment = economy resilient",
        down: series.id === "UNRATE"
          ? "Falling unemployment = labor market tight"
          : "Weak employment = slowdown risk",
      },
      gdp: {
        up: "GDP growth = economic expansion",
        down: "GDP decline = recession risk",
      },
      sentiment: {
        up: "Consumer confidence rising = bullish",
        down: "Consumer confidence falling = bearish",
      },
      money: {
        up: "M2 expansion = inflationary, liquidity increasing",
        down: "M2 contraction = deflationary, liquidity decreasing",
      },
      leading: {
        up: "Leading indicators up = expansion ahead",
        down: "Leading indicators down = contraction ahead",
      },
    };

    const direction = change > 0 ? "up" : "down";
    return signals[series.category]?.[direction] || "";
  }

  private extractTags(metadata?: { series: typeof KEY_SERIES[0]; change: number }): string[] {
    const tags = ["economics", "macro", "fred"];

    if (metadata?.series) {
      tags.push(metadata.series.category);
      tags.push(metadata.series.id.toLowerCase());

      // Add trading signal tag
      if (Math.abs(metadata.change) > metadata.series.threshold * 2) {
        tags.push("significant-change");
      }
    }

    return tags;
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `fred:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
