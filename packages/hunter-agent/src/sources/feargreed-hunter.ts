import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
} from "../types.js";

// Alternative.me Fear & Greed Index - 100% Free, No Auth Required
const FEAR_GREED_API = "https://api.alternative.me/fng";

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

interface FearGreedResponse {
  name: string;
  data: FearGreedData[];
  metadata: {
    error: null | string;
  };
}

// Classification thresholds
const SENTIMENT_LEVELS = {
  EXTREME_FEAR: { min: 0, max: 25, signal: "BUY" },
  FEAR: { min: 26, max: 45, signal: "ACCUMULATE" },
  NEUTRAL: { min: 46, max: 55, signal: "HOLD" },
  GREED: { min: 56, max: 75, signal: "CAUTION" },
  EXTREME_GREED: { min: 76, max: 100, signal: "SELL" },
};

export class FearGreedHunter implements BaseHunterSource {
  source = "feargreed" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    try {
      // Fetch current and historical data (last 30 days)
      const response = await fetch(`${FEAR_GREED_API}/?limit=30&format=json`, {
        headers: { "User-Agent": "gICM-Hunter/1.0" },
      });

      if (!response.ok) {
        throw new Error(`Fear & Greed API error: ${response.status}`);
      }

      const data: FearGreedResponse = await response.json();

      if (data.data && data.data.length > 0) {
        // Current reading
        const current = data.data[0];
        discoveries.push(this.createDiscovery(current, "current", data.data));

        // Check for significant changes
        if (data.data.length >= 7) {
          const weekAgo = data.data[6];
          const weekChange = parseInt(current.value) - parseInt(weekAgo.value);
          if (Math.abs(weekChange) >= 15) {
            discoveries.push(this.createTrendDiscovery(current, weekAgo, weekChange));
          }
        }

        // Alert on extreme readings
        const value = parseInt(current.value);
        if (value <= 25 || value >= 75) {
          discoveries.push(this.createExtremeDiscovery(current));
        }
      }
    } catch (error) {
      console.error("[FearGreedHunter] Failed to fetch data:", error);
    }

    return discoveries;
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const metadata = raw.metadata as { current: FearGreedData; type: string } | undefined;

    return {
      id: randomUUID(),
      source: "feargreed" as any,
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
        hasWeb3Keywords: true,
        hasAIKeywords: false,
        hasSolanaKeywords: false,
        hasEthereumKeywords: false,
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: this.isExtreme(metadata?.current),
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private createDiscovery(current: FearGreedData, type: string, history: FearGreedData[]): RawDiscovery {
    const value = parseInt(current.value);
    const signal = this.getSignal(value);
    const emoji = this.getEmoji(value);
    const avg7d = this.calculateAverage(history.slice(0, 7));
    const avg30d = this.calculateAverage(history);

    return {
      sourceId: `feargreed:${type}:${current.timestamp}`,
      sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
      title: `${emoji} Crypto Fear & Greed: ${value} (${current.value_classification}) - Signal: ${signal}`,
      description: `Current: ${value}/100 | 7d Avg: ${avg7d.toFixed(0)} | 30d Avg: ${avg30d.toFixed(0)} | ${this.getTradingAdvice(value)}`,
      author: "Alternative.me",
      authorUrl: "https://alternative.me",
      publishedAt: new Date(parseInt(current.timestamp) * 1000),
      metrics: {
        points: value,
        views: avg7d,
        likes: avg30d,
      },
      metadata: { current, type, history } as unknown as Record<string, unknown>,
    };
  }

  private createTrendDiscovery(current: FearGreedData, previous: FearGreedData, change: number): RawDiscovery {
    const direction = change > 0 ? "UP" : "DOWN";
    const emoji = change > 0 ? "📈" : "📉";

    return {
      sourceId: `feargreed:trend:${current.timestamp}`,
      sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
      title: `${emoji} Fear & Greed ${direction} ${Math.abs(change)} points in 7 days`,
      description: `From ${previous.value} (${previous.value_classification}) to ${current.value} (${current.value_classification}). ${change > 0 ? "Sentiment improving - caution on FOMO" : "Sentiment deteriorating - watch for buying opportunity"}`,
      author: "Alternative.me",
      publishedAt: new Date(parseInt(current.timestamp) * 1000),
      metrics: {
        points: Math.abs(change),
        views: parseInt(current.value),
      },
      metadata: { current, previous, change, type: "trend" } as unknown as Record<string, unknown>,
    };
  }

  private createExtremeDiscovery(current: FearGreedData): RawDiscovery {
    const value = parseInt(current.value);
    const isExtremeFear = value <= 25;
    const emoji = isExtremeFear ? "🟢" : "🔴";
    const signal = isExtremeFear ? "CONTRARIAN BUY SIGNAL" : "CONTRARIAN SELL SIGNAL";

    return {
      sourceId: `feargreed:extreme:${current.timestamp}`,
      sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
      title: `${emoji} EXTREME ${isExtremeFear ? "FEAR" : "GREED"}: ${value}/100 - ${signal}`,
      description: isExtremeFear
        ? "Historically, extreme fear readings (below 25) have been good buying opportunities. Warren Buffett: 'Be greedy when others are fearful.'"
        : "Historically, extreme greed readings (above 75) often precede corrections. Consider taking profits or reducing exposure.",
      author: "Alternative.me",
      publishedAt: new Date(parseInt(current.timestamp) * 1000),
      metrics: {
        points: value,
      },
      metadata: { current, type: "extreme", isExtremeFear } as unknown as Record<string, unknown>,
    };
  }

  private getSignal(value: number): string {
    if (value <= 25) return "BUY";
    if (value <= 45) return "ACCUMULATE";
    if (value <= 55) return "HOLD";
    if (value <= 75) return "CAUTION";
    return "SELL";
  }

  private getEmoji(value: number): string {
    if (value <= 25) return "😱";
    if (value <= 45) return "😰";
    if (value <= 55) return "😐";
    if (value <= 75) return "😊";
    return "🤑";
  }

  private getTradingAdvice(value: number): string {
    if (value <= 25) return "Extreme fear = potential buying opportunity";
    if (value <= 45) return "Fear present - consider DCA accumulation";
    if (value <= 55) return "Neutral sentiment - market indecision";
    if (value <= 75) return "Greed rising - be cautious with new positions";
    return "Extreme greed = consider taking profits";
  }

  private calculateAverage(data: FearGreedData[]): number {
    if (data.length === 0) return 50;
    const sum = data.reduce((acc, d) => acc + parseInt(d.value), 0);
    return sum / data.length;
  }

  private isExtreme(data?: FearGreedData): boolean {
    if (!data) return false;
    const value = parseInt(data.value);
    return value <= 25 || value >= 75;
  }

  private extractTags(metadata?: { current: FearGreedData; type: string }): string[] {
    const tags = ["sentiment", "fear-greed"];

    if (metadata?.current) {
      const value = parseInt(metadata.current.value);
      tags.push(metadata.current.value_classification.toLowerCase().replace(" ", "-"));

      if (value <= 25) tags.push("extreme-fear", "buy-signal");
      else if (value >= 75) tags.push("extreme-greed", "sell-signal");
    }

    if (metadata?.type === "trend") tags.push("trend-change");
    if (metadata?.type === "extreme") tags.push("extreme-reading");

    return tags;
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `feargreed:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
