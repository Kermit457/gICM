/**
 * Token Analytics Implementation
 * Phase 16B: AI Operations - Deep Token Usage Analytics
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type TokenAnalyticsConfig,
  TokenAnalyticsConfigSchema,
  type TokenAnalyticsEvents,
  type TokenAnalyticsStorage,
  type TokenTimeSeriesPoint,
  type TokenTimeSeries,
  type TimeGranularity,
  type TokenAnomaly,
  type TokenAnomalyType,
  type TokenOptimization,
  type TokenForecast,
  type ProjectAnalytics,
  type TokenAnalyticsSummary,
  type TokenEfficiency,
  type TokenBreakdown,
  type UsagePattern,
  type UsagePatternType,
  type ModelComparison,
  calculateTokenEfficiency,
  calculateEfficiencyRating,
  EFFICIENCY_BENCHMARKS,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemoryTokenAnalyticsStorage implements TokenAnalyticsStorage {
  private timeSeries: Map<string, TokenTimeSeriesPoint[]> = new Map();
  private anomalies: Map<string, TokenAnomaly> = new Map();
  private optimizations: Map<string, TokenOptimization> = new Map();
  private forecasts: Map<string, TokenForecast> = new Map();
  private projectAnalytics: Map<string, ProjectAnalytics> = new Map();

  private getTimeSeriesKey(granularity: TimeGranularity, projectId?: string, model?: string): string {
    return `${granularity}-${projectId || "all"}-${model || "all"}`;
  }

  async saveTimeSeriesPoint(
    point: TokenTimeSeriesPoint & { projectId?: string; model?: string }
  ): Promise<void> {
    const key = this.getTimeSeriesKey("hour", point.projectId, point.model);
    const series = this.timeSeries.get(key) || [];
    series.push(point);
    this.timeSeries.set(key, series);

    // Also save to global series
    const globalKey = this.getTimeSeriesKey("hour");
    const globalSeries = this.timeSeries.get(globalKey) || [];
    globalSeries.push(point);
    this.timeSeries.set(globalKey, globalSeries);
  }

  async getTimeSeries(options: {
    granularity: TimeGranularity;
    startTime: number;
    endTime: number;
    projectId?: string;
    model?: string;
  }): Promise<TokenTimeSeries> {
    const key = this.getTimeSeriesKey(options.granularity, options.projectId, options.model);
    const allPoints = this.timeSeries.get(key) || [];

    const points = allPoints.filter(
      (p) => p.timestamp >= options.startTime && p.timestamp <= options.endTime
    );

    return {
      granularity: options.granularity,
      startTime: options.startTime,
      endTime: options.endTime,
      points,
    };
  }

  async saveAnomaly(anomaly: TokenAnomaly): Promise<void> {
    this.anomalies.set(anomaly.id, anomaly);
  }

  async getAnomalies(options?: {
    type?: TokenAnomalyType;
    severity?: string;
    acknowledged?: boolean;
    startTime?: number;
    endTime?: number;
  }): Promise<TokenAnomaly[]> {
    return Array.from(this.anomalies.values()).filter((a) => {
      if (options?.type && a.type !== options.type) return false;
      if (options?.severity && a.severity !== options.severity) return false;
      if (options?.acknowledged !== undefined && a.acknowledged !== options.acknowledged) return false;
      if (options?.startTime && a.timestamp < options.startTime) return false;
      if (options?.endTime && a.timestamp > options.endTime) return false;
      return true;
    });
  }

  async acknowledgeAnomaly(anomalyId: string): Promise<void> {
    const anomaly = this.anomalies.get(anomalyId);
    if (anomaly) {
      anomaly.acknowledged = true;
    }
  }

  async resolveAnomaly(anomalyId: string): Promise<void> {
    const anomaly = this.anomalies.get(anomalyId);
    if (anomaly) {
      anomaly.resolvedAt = Date.now();
    }
  }

  async saveOptimization(optimization: TokenOptimization): Promise<void> {
    this.optimizations.set(optimization.id, optimization);
  }

  async getOptimizations(status?: string): Promise<TokenOptimization[]> {
    return Array.from(this.optimizations.values()).filter((o) => {
      if (status && o.status !== status) return false;
      return true;
    });
  }

  async updateOptimizationStatus(
    id: string,
    status: string,
    actualSavings?: { tokens: number; cost: number }
  ): Promise<void> {
    const opt = this.optimizations.get(id);
    if (opt) {
      opt.status = status as TokenOptimization["status"];
      if (status === "implemented") {
        opt.implementedAt = Date.now();
        opt.actualSavings = actualSavings;
      }
    }
  }

  async saveForecast(forecast: TokenForecast & { projectId?: string }): Promise<void> {
    const key = forecast.projectId || "global";
    this.forecasts.set(key, forecast);
  }

  async getForecast(projectId?: string): Promise<TokenForecast | null> {
    return this.forecasts.get(projectId || "global") || null;
  }

  async saveProjectAnalytics(analytics: ProjectAnalytics): Promise<void> {
    this.projectAnalytics.set(analytics.projectId, analytics);
  }

  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics | null> {
    return this.projectAnalytics.get(projectId) || null;
  }
}

// =============================================================================
// Token Analytics Manager
// =============================================================================

export class TokenAnalyticsManager extends EventEmitter<TokenAnalyticsEvents> {
  private config: TokenAnalyticsConfig;
  private storage: TokenAnalyticsStorage;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private started: boolean = false;

  // Running statistics for anomaly detection
  private runningStats: Map<string, {
    count: number;
    mean: number;
    m2: number; // For Welford's algorithm
  }> = new Map();

  constructor(config: Partial<TokenAnalyticsConfig> = {}, storage?: TokenAnalyticsStorage) {
    super();
    this.config = TokenAnalyticsConfigSchema.parse(config);
    this.storage = storage || new InMemoryTokenAnalyticsStorage();
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  async start(): Promise<void> {
    if (this.started) return;

    if (this.config.optimizationScanEnabled) {
      this.scheduleOptimizationScan();
    }

    this.started = true;
  }

  async stop(): Promise<void> {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    this.started = false;
  }

  // ===========================================================================
  // Data Ingestion
  // ===========================================================================

  async recordUsage(data: {
    timestamp?: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
    cost: number;
    latencyMs?: number;
    projectId?: string;
    model?: string;
  }): Promise<void> {
    const point: TokenTimeSeriesPoint & { projectId?: string; model?: string } = {
      timestamp: data.timestamp || Date.now(),
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      cachedTokens: data.cachedTokens || 0,
      totalTokens: data.inputTokens + data.outputTokens,
      requests: 1,
      cost: data.cost,
      avgLatency: data.latencyMs,
      projectId: data.projectId,
      model: data.model,
    };

    await this.storage.saveTimeSeriesPoint(point);

    // Check for anomalies
    if (this.config.anomalyDetectionEnabled) {
      await this.checkForAnomalies(point);
    }
  }

  // ===========================================================================
  // Anomaly Detection
  // ===========================================================================

  private async checkForAnomalies(
    point: TokenTimeSeriesPoint & { projectId?: string; model?: string }
  ): Promise<void> {
    const key = `tokens-${point.projectId || "global"}`;

    // Update running statistics using Welford's algorithm
    let stats = this.runningStats.get(key);
    if (!stats) {
      stats = { count: 0, mean: 0, m2: 0 };
    }

    stats.count++;
    const delta = point.totalTokens - stats.mean;
    stats.mean += delta / stats.count;
    const delta2 = point.totalTokens - stats.mean;
    stats.m2 += delta * delta2;

    this.runningStats.set(key, stats);

    // Need minimum samples for detection
    if (stats.count < this.config.anomalyMinSamples) return;

    // Calculate standard deviation
    const variance = stats.m2 / (stats.count - 1);
    const stdDev = Math.sqrt(variance);

    // Check for anomalies
    const deviation = (point.totalTokens - stats.mean) / (stdDev || 1);

    if (Math.abs(deviation) >= this.config.anomalyThresholdStdDev) {
      const anomaly = await this.createAnomaly({
        type: deviation > 0 ? "spike" : "drop",
        expected: stats.mean,
        actual: point.totalTokens,
        deviation,
        model: point.model,
        projectId: point.projectId,
      });

      if (this.config.alertOnAnomalies) {
        this.emit("anomalyDetected", anomaly);
      }
    }

    // Check input/output ratio anomaly
    const ratio = point.inputTokens / (point.outputTokens || 1);
    if (ratio > 20) {
      await this.createAnomaly({
        type: "unusual_ratio",
        expected: 5,
        actual: ratio,
        deviation: (ratio - 5) / 2,
        model: point.model,
        projectId: point.projectId,
        description: `Unusually high input/output ratio: ${ratio.toFixed(1)}:1`,
      });
    }
  }

  private async createAnomaly(data: {
    type: TokenAnomalyType;
    expected: number;
    actual: number;
    deviation: number;
    model?: string;
    projectId?: string;
    requestId?: string;
    description?: string;
  }): Promise<TokenAnomaly> {
    const severity = this.calculateAnomalySeverity(data.deviation);

    const anomaly: TokenAnomaly = {
      id: randomUUID(),
      type: data.type,
      severity,
      timestamp: Date.now(),
      expected: data.expected,
      actual: data.actual,
      deviation: data.deviation,
      model: data.model,
      projectId: data.projectId,
      requestId: data.requestId,
      description: data.description || this.generateAnomalyDescription(data.type, data.expected, data.actual),
      possibleCauses: this.getPossibleCauses(data.type),
      recommendations: this.getAnomalyRecommendations(data.type),
      acknowledged: false,
    };

    await this.storage.saveAnomaly(anomaly);
    return anomaly;
  }

  private calculateAnomalySeverity(deviation: number): "low" | "medium" | "high" | "critical" {
    const absDeviation = Math.abs(deviation);
    if (absDeviation >= 5) return "critical";
    if (absDeviation >= 4) return "high";
    if (absDeviation >= 3) return "medium";
    return "low";
  }

  private generateAnomalyDescription(type: TokenAnomalyType, expected: number, actual: number): string {
    const descriptions: Record<TokenAnomalyType, string> = {
      spike: `Token usage spiked to ${actual.toFixed(0)} (expected ~${expected.toFixed(0)})`,
      drop: `Token usage dropped to ${actual.toFixed(0)} (expected ~${expected.toFixed(0)})`,
      unusual_ratio: `Unusual input/output ratio detected`,
      excessive_input: `Excessive input tokens: ${actual.toFixed(0)}`,
      minimal_output: `Minimal output tokens: ${actual.toFixed(0)}`,
      high_waste: `High token waste detected`,
      context_overflow: `Context window overflow detected`,
      repetition: `Repetitive content detected in output`,
      encoding_issue: `Potential encoding issue affecting token count`,
    };
    return descriptions[type] || "Unknown anomaly";
  }

  private getPossibleCauses(type: TokenAnomalyType): string[] {
    const causes: Record<TokenAnomalyType, string[]> = {
      spike: [
        "Large batch of requests processed",
        "Complex query requiring detailed response",
        "New feature deployment",
        "Unusual user activity",
      ],
      drop: [
        "Service disruption or downtime",
        "Client-side issues",
        "Rate limiting activated",
        "Reduced user activity",
      ],
      unusual_ratio: [
        "Large context/system prompts",
        "Short responses or errors",
        "Caching issues",
        "Prompt engineering needed",
      ],
      excessive_input: [
        "Redundant context included",
        "Large document processing",
        "Inefficient prompt design",
        "Missing caching",
      ],
      minimal_output: [
        "Model returned error",
        "Query too restrictive",
        "Max tokens set too low",
        "Request timeout",
      ],
      high_waste: [
        "Unused context in prompts",
        "Redundant information",
        "Suboptimal prompt structure",
      ],
      context_overflow: [
        "Input exceeds context window",
        "No truncation strategy",
        "Document too large",
      ],
      repetition: [
        "Model in repetition loop",
        "Prompt encouraging repetition",
        "Temperature too low",
      ],
      encoding_issue: [
        "Special characters in input",
        "Unicode handling issues",
        "Binary data in text",
      ],
    };
    return causes[type] || ["Unknown cause"];
  }

  private getAnomalyRecommendations(type: TokenAnomalyType): string[] {
    const recommendations: Record<TokenAnomalyType, string[]> = {
      spike: [
        "Review recent changes to prompts or workflows",
        "Check for batch processing jobs",
        "Consider implementing request throttling",
      ],
      drop: [
        "Check service health and connectivity",
        "Review error logs for failures",
        "Verify API credentials are valid",
      ],
      unusual_ratio: [
        "Review and optimize system prompts",
        "Consider using prompt compression",
        "Enable caching for repeated context",
      ],
      excessive_input: [
        "Implement context pruning",
        "Use summarization for long documents",
        "Enable prompt caching",
      ],
      minimal_output: [
        "Check for error responses",
        "Increase max_tokens if appropriate",
        "Review query complexity",
      ],
      high_waste: [
        "Audit prompt templates",
        "Remove redundant context",
        "Use dynamic prompt generation",
      ],
      context_overflow: [
        "Implement chunking strategy",
        "Use summarization",
        "Switch to model with larger context",
      ],
      repetition: [
        "Increase temperature slightly",
        "Add presence_penalty",
        "Review prompt for repetition triggers",
      ],
      encoding_issue: [
        "Sanitize input text",
        "Check character encoding",
        "Handle special characters",
      ],
    };
    return recommendations[type] || ["Contact support for assistance"];
  }

  // ===========================================================================
  // Efficiency Analysis
  // ===========================================================================

  async analyzeEfficiency(options: {
    startTime: number;
    endTime: number;
    projectId?: string;
    model?: string;
  }): Promise<TokenEfficiency> {
    const timeSeries = await this.storage.getTimeSeries({
      granularity: "hour",
      ...options,
    });

    if (timeSeries.points.length === 0) {
      return this.getEmptyEfficiency();
    }

    const totals = timeSeries.points.reduce(
      (acc, p) => ({
        inputTokens: acc.inputTokens + p.inputTokens,
        outputTokens: acc.outputTokens + p.outputTokens,
        cachedTokens: acc.cachedTokens + p.cachedTokens,
        totalCost: acc.totalCost + p.cost,
        latencyMs: acc.latencyMs + (p.avgLatency || 0),
        count: acc.count + 1,
      }),
      { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalCost: 0, latencyMs: 0, count: 0 }
    );

    return calculateTokenEfficiency({
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      cachedTokens: totals.cachedTokens,
      totalCost: totals.totalCost,
      contextWindow: 128000, // Default, should be model-specific
      usedContext: totals.inputTokens / totals.count,
      latencyMs: totals.count > 0 ? totals.latencyMs / totals.count : undefined,
    });
  }

  private getEmptyEfficiency(): TokenEfficiency {
    return {
      inputOutputRatio: 0,
      usefulTokenRatio: 0,
      cacheHitRate: 0,
      contextUtilization: 0,
      costPerUsefulToken: 0,
      overallScore: 0,
    };
  }

  // ===========================================================================
  // Pattern Analysis
  // ===========================================================================

  async analyzeUsagePattern(options: {
    startTime: number;
    endTime: number;
    projectId?: string;
  }): Promise<UsagePattern> {
    const timeSeries = await this.storage.getTimeSeries({
      granularity: "hour",
      ...options,
    });

    const points = timeSeries.points;
    if (points.length < this.config.patternMinDataPoints) {
      return this.getDefaultPattern();
    }

    const values = points.map((p) => p.totalTokens);

    // Calculate statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Detect pattern type
    const patternType = this.detectPatternType(values, stdDev, mean);

    // Detect trend
    const trend = this.detectTrend(values);

    // Detect seasonality
    const seasonality = this.detectSeasonality(points);

    return {
      type: patternType.type,
      confidence: patternType.confidence,
      description: this.generatePatternDescription(patternType.type, trend.direction),
      mean,
      median,
      stdDev,
      min,
      max,
      trend: trend.direction,
      trendStrength: trend.strength,
      hasSeasonality: seasonality.hasSeasonality,
      seasonalPeriod: seasonality.period,
      peakHours: seasonality.peakHours,
      peakDays: seasonality.peakDays,
    };
  }

  private detectPatternType(values: number[], stdDev: number, mean: number): {
    type: UsagePatternType;
    confidence: number;
  } {
    const cv = stdDev / (mean || 1); // Coefficient of variation

    if (cv < 0.1) {
      return { type: "consistent", confidence: 0.9 };
    }

    // Check for growth/decline
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.3) {
      return { type: "growing", confidence: 0.7 };
    }
    if (secondAvg < firstAvg * 0.7) {
      return { type: "declining", confidence: 0.7 };
    }

    if (cv > 0.5) {
      return { type: "bursty", confidence: 0.8 };
    }

    if (cv > 0.3) {
      return { type: "erratic", confidence: 0.6 };
    }

    return { type: "cyclical", confidence: 0.5 };
  }

  private detectTrend(values: number[]): {
    direction: "increasing" | "stable" | "decreasing";
    strength: number;
  } {
    if (values.length < 3) {
      return { direction: "stable", strength: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;
    const normalizedSlope = slope / (avgY || 1);

    if (normalizedSlope > 0.05) {
      return { direction: "increasing", strength: Math.min(Math.abs(normalizedSlope) * 5, 1) };
    }
    if (normalizedSlope < -0.05) {
      return { direction: "decreasing", strength: Math.min(Math.abs(normalizedSlope) * 5, 1) };
    }
    return { direction: "stable", strength: 0 };
  }

  private detectSeasonality(points: TokenTimeSeriesPoint[]): {
    hasSeasonality: boolean;
    period?: string;
    peakHours?: number[];
    peakDays?: number[];
  } {
    if (points.length < 24) {
      return { hasSeasonality: false };
    }

    // Group by hour of day
    const byHour: Map<number, number[]> = new Map();
    for (const p of points) {
      const hour = new Date(p.timestamp).getHours();
      if (!byHour.has(hour)) byHour.set(hour, []);
      byHour.get(hour)!.push(p.totalTokens);
    }

    // Find peak hours
    const hourlyAvgs: [number, number][] = [];
    for (const [hour, values] of byHour) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      hourlyAvgs.push([hour, avg]);
    }

    hourlyAvgs.sort((a, b) => b[1] - a[1]);
    const globalAvg = hourlyAvgs.reduce((sum, [, avg]) => sum + avg, 0) / hourlyAvgs.length;
    const peakHours = hourlyAvgs
      .filter(([, avg]) => avg > globalAvg * 1.2)
      .map(([hour]) => hour)
      .slice(0, 5);

    if (peakHours.length > 0) {
      return {
        hasSeasonality: true,
        period: "daily",
        peakHours,
      };
    }

    return { hasSeasonality: false };
  }

  private generatePatternDescription(type: UsagePatternType, trend: string): string {
    const descriptions: Record<UsagePatternType, string> = {
      consistent: "Usage is steady with minimal variation",
      bursty: "Usage shows periodic bursts of high activity",
      growing: "Usage is steadily increasing over time",
      declining: "Usage is declining over time",
      cyclical: "Usage follows a predictable cycle",
      erratic: "Usage shows unpredictable variation",
    };
    return `${descriptions[type]}. Trend: ${trend}`;
  }

  private getDefaultPattern(): UsagePattern {
    return {
      type: "consistent",
      confidence: 0,
      description: "Insufficient data for pattern analysis",
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      trend: "stable",
      trendStrength: 0,
      hasSeasonality: false,
    };
  }

  // ===========================================================================
  // Forecasting
  // ===========================================================================

  async generateForecast(options: {
    periodDays: number;
    projectId?: string;
  }): Promise<TokenForecast> {
    const periodDays = options.periodDays || this.config.defaultForecastDays;

    // Get historical data
    const endTime = Date.now();
    const startTime = endTime - 30 * 24 * 60 * 60 * 1000; // Last 30 days

    const timeSeries = await this.storage.getTimeSeries({
      granularity: "day",
      startTime,
      endTime,
      projectId: options.projectId,
    });

    // Simple linear projection
    const points = timeSeries.points;
    if (points.length < 7) {
      return this.getDefaultForecast(periodDays);
    }

    const dailyTokens = points.map((p) => p.totalTokens);
    const dailyCosts = points.map((p) => p.cost);
    const dailyRequests = points.map((p) => p.requests);

    const avgTokens = dailyTokens.reduce((a, b) => a + b, 0) / dailyTokens.length;
    const avgCost = dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length;
    const avgRequests = dailyRequests.reduce((a, b) => a + b, 0) / dailyRequests.length;

    // Calculate trend
    const trend = this.detectTrend(dailyTokens);
    const trendMultiplier = 1 + (trend.direction === "increasing" ? 0.1 : trend.direction === "decreasing" ? -0.1 : 0) * trend.strength;

    const projectedTokens = avgTokens * periodDays * trendMultiplier;
    const projectedCost = avgCost * periodDays * trendMultiplier;
    const projectedRequests = avgRequests * periodDays * trendMultiplier;

    // Calculate confidence based on data consistency
    const stdDev = Math.sqrt(dailyTokens.reduce((sum, v) => sum + Math.pow(v - avgTokens, 2), 0) / dailyTokens.length);
    const cv = stdDev / (avgTokens || 1);
    const confidence = Math.max(0.3, Math.min(0.95, 1 - cv));

    // Daily projections
    const dailyProjections = [];
    const startDate = new Date();
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayMultiplier = 1 + (trendMultiplier - 1) * (i / periodDays);
      dailyProjections.push({
        date: date.toISOString().split("T")[0],
        tokens: Math.round(avgTokens * dayMultiplier),
        cost: avgCost * dayMultiplier,
      });
    }

    const forecast: TokenForecast = {
      method: this.config.forecastMethod,
      periodDays,
      generatedAt: Date.now(),
      projectedTokens: Math.round(projectedTokens),
      projectedCost,
      projectedRequests: Math.round(projectedRequests),
      confidence,
      lowerBound: {
        tokens: Math.round(projectedTokens * 0.7),
        cost: projectedCost * 0.7,
      },
      upperBound: {
        tokens: Math.round(projectedTokens * 1.3),
        cost: projectedCost * 1.3,
      },
      dailyProjections,
      assumptions: [
        "Based on last 30 days of usage",
        `Using ${this.config.forecastMethod} projection method`,
        trend.direction !== "stable" ? `Trend adjustment applied: ${trend.direction}` : "No significant trend detected",
      ],
      factors: [
        {
          name: "Historical trend",
          impact: trend.direction === "increasing" ? "positive" : trend.direction === "decreasing" ? "negative" : "neutral",
          weight: trend.strength,
        },
      ],
    };

    await this.storage.saveForecast({ ...forecast, projectId: options.projectId });
    this.emit("forecastGenerated", forecast);
    return forecast;
  }

  private getDefaultForecast(periodDays: number): TokenForecast {
    return {
      method: "linear",
      periodDays,
      generatedAt: Date.now(),
      projectedTokens: 0,
      projectedCost: 0,
      projectedRequests: 0,
      confidence: 0,
      lowerBound: { tokens: 0, cost: 0 },
      upperBound: { tokens: 0, cost: 0 },
      dailyProjections: [],
      assumptions: ["Insufficient historical data for forecast"],
      factors: [],
    };
  }

  // ===========================================================================
  // Optimization Recommendations
  // ===========================================================================

  async scanForOptimizations(options?: { projectId?: string }): Promise<TokenOptimization[]> {
    const optimizations: TokenOptimization[] = [];

    // Get recent data
    const endTime = Date.now();
    const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

    const efficiency = await this.analyzeEfficiency({
      startTime,
      endTime,
      projectId: options?.projectId,
    });

    // Check cache hit rate
    if (efficiency.cacheHitRate < 0.2) {
      const optimization: TokenOptimization = {
        id: randomUUID(),
        type: "caching_strategy",
        priority: efficiency.cacheHitRate < 0.05 ? "high" : "medium",
        timestamp: Date.now(),
        impacts: ["cost_reduction", "latency_improvement"],
        estimatedSavings: {
          tokens: 0,
          cost: efficiency.costPerUsefulToken * 0.3,
          latencyMs: 100,
        },
        title: "Improve prompt caching",
        description: `Cache hit rate is only ${(efficiency.cacheHitRate * 100).toFixed(1)}%. Implementing caching could reduce costs by 20-50%.`,
        currentState: `Cache hit rate: ${(efficiency.cacheHitRate * 100).toFixed(1)}%`,
        recommendedAction: "Enable prompt caching for system prompts and repeated context",
        implementation: "Use cache_control: { type: 'ephemeral' } for system prompts",
        effort: "easy",
        riskLevel: "none",
        status: "suggested",
      };
      optimizations.push(optimization);
      await this.storage.saveOptimization(optimization);
      this.emit("optimizationFound", optimization);
    }

    // Check input/output ratio
    if (efficiency.inputOutputRatio > 10) {
      const optimization: TokenOptimization = {
        id: randomUUID(),
        type: "prompt_compression",
        priority: efficiency.inputOutputRatio > 20 ? "high" : "medium",
        timestamp: Date.now(),
        impacts: ["cost_reduction", "efficiency_improvement"],
        estimatedSavings: {
          tokens: Math.round(efficiency.inputOutputRatio * 1000),
          cost: efficiency.costPerUsefulToken * 0.25,
          latencyMs: 50,
        },
        title: "Reduce input token usage",
        description: `Input/output ratio is ${efficiency.inputOutputRatio.toFixed(1)}:1. Consider compressing prompts or removing redundant context.`,
        currentState: `${efficiency.inputOutputRatio.toFixed(1)} input tokens per output token`,
        recommendedAction: "Review and optimize system prompts, use dynamic context injection",
        effort: "moderate",
        riskLevel: "low",
        status: "suggested",
      };
      optimizations.push(optimization);
      await this.storage.saveOptimization(optimization);
      this.emit("optimizationFound", optimization);
    }

    // Check context utilization
    if (efficiency.contextUtilization < 0.1) {
      const optimization: TokenOptimization = {
        id: randomUUID(),
        type: "model_selection",
        priority: "low",
        timestamp: Date.now(),
        impacts: ["cost_reduction"],
        estimatedSavings: {
          tokens: 0,
          cost: efficiency.costPerUsefulToken * 0.1,
          latencyMs: 0,
        },
        title: "Consider smaller context model",
        description: `Only ${(efficiency.contextUtilization * 100).toFixed(1)}% of context window is used. A model with smaller context might be more cost-effective.`,
        currentState: `${(efficiency.contextUtilization * 100).toFixed(1)}% context utilization`,
        recommendedAction: "Evaluate if a model with smaller context window (and lower cost) would suffice",
        effort: "easy",
        riskLevel: "low",
        status: "suggested",
      };
      optimizations.push(optimization);
      await this.storage.saveOptimization(optimization);
      this.emit("optimizationFound", optimization);
    }

    return optimizations;
  }

  private scheduleOptimizationScan(): void {
    const interval = setInterval(async () => {
      try {
        await this.scanForOptimizations();
      } catch (error) {
        this.emit("error", error as Error);
      }
    }, this.config.optimizationScanIntervalHours * 60 * 60 * 1000);

    this.intervals.set("optimization", interval);
  }

  // ===========================================================================
  // Summary & Reporting
  // ===========================================================================

  async generateSummary(options: {
    startTime: number;
    endTime: number;
    granularity?: TimeGranularity;
  }): Promise<TokenAnalyticsSummary> {
    const granularity = options.granularity || this.config.defaultGranularity;

    const timeSeries = await this.storage.getTimeSeries({
      granularity,
      startTime: options.startTime,
      endTime: options.endTime,
    });

    const points = timeSeries.points;
    const totals = points.reduce(
      (acc, p) => ({
        tokens: acc.tokens + p.totalTokens,
        cost: acc.cost + p.cost,
        requests: acc.requests + p.requests,
      }),
      { tokens: 0, cost: 0, requests: 0 }
    );

    // Get previous period for comparison
    const periodMs = options.endTime - options.startTime;
    const prevTimeSeries = await this.storage.getTimeSeries({
      granularity,
      startTime: options.startTime - periodMs,
      endTime: options.startTime,
    });

    const prevTotals = prevTimeSeries.points.reduce(
      (acc, p) => ({
        tokens: acc.tokens + p.totalTokens,
        cost: acc.cost + p.cost,
        requests: acc.requests + p.requests,
      }),
      { tokens: 0, cost: 0, requests: 0 }
    );

    // Get efficiency
    const efficiency = await this.analyzeEfficiency({
      startTime: options.startTime,
      endTime: options.endTime,
    });

    // Get anomalies
    const anomalies = await this.storage.getAnomalies({
      startTime: options.startTime,
      endTime: options.endTime,
      acknowledged: false,
    });

    // Get optimizations
    const optimizations = await this.storage.getOptimizations("suggested");

    // Get forecast
    const forecast = await this.storage.getForecast();

    // Calculate changes
    const tokenChange = prevTotals.tokens > 0
      ? ((totals.tokens - prevTotals.tokens) / prevTotals.tokens) * 100
      : 0;
    const costChange = prevTotals.cost > 0
      ? ((totals.cost - prevTotals.cost) / prevTotals.cost) * 100
      : 0;
    const requestChange = prevTotals.requests > 0
      ? ((totals.requests - prevTotals.requests) / prevTotals.requests) * 100
      : 0;

    // Group anomalies by type
    const anomaliesByType: Record<string, number> = {};
    for (const a of anomalies) {
      anomaliesByType[a.type] = (anomaliesByType[a.type] || 0) + 1;
    }

    const summary: TokenAnalyticsSummary = {
      period: {
        start: options.startTime,
        end: options.endTime,
        granularity,
      },
      totalTokens: totals.tokens,
      totalCost: totals.cost,
      totalRequests: totals.requests,
      uniqueModels: 0, // Would need model tracking
      uniqueProjects: 0, // Would need project tracking
      tokenChange,
      costChange,
      requestChange,
      overallEfficiency: efficiency,
      efficiencyTrend: efficiency.overallScore > 60 ? "improving" : efficiency.overallScore < 40 ? "declining" : "stable",
      topModels: [], // Would need model aggregation
      topProjects: [], // Would need project aggregation
      activeAnomalies: anomalies.length,
      anomaliesByType: anomaliesByType as Record<TokenAnomalyType, number>,
      pendingOptimizations: optimizations.length,
      potentialSavings: optimizations.reduce((sum, o) => sum + o.estimatedSavings.cost, 0),
      forecast: forecast || undefined,
    };

    this.emit("summaryGenerated", summary);
    return summary;
  }

  // ===========================================================================
  // Query Methods
  // ===========================================================================

  async getTimeSeries(options: {
    granularity: TimeGranularity;
    startTime: number;
    endTime: number;
    projectId?: string;
    model?: string;
  }): Promise<TokenTimeSeries> {
    return this.storage.getTimeSeries(options);
  }

  async getAnomalies(options?: {
    type?: TokenAnomalyType;
    severity?: string;
    acknowledged?: boolean;
    startTime?: number;
    endTime?: number;
  }): Promise<TokenAnomaly[]> {
    return this.storage.getAnomalies(options);
  }

  async acknowledgeAnomaly(anomalyId: string): Promise<void> {
    await this.storage.acknowledgeAnomaly(anomalyId);
  }

  async resolveAnomaly(anomalyId: string): Promise<void> {
    await this.storage.resolveAnomaly(anomalyId);
    this.emit("anomalyResolved", anomalyId);
  }

  async getOptimizations(status?: string): Promise<TokenOptimization[]> {
    return this.storage.getOptimizations(status);
  }

  async implementOptimization(
    id: string,
    actualSavings?: { tokens: number; cost: number }
  ): Promise<void> {
    await this.storage.updateOptimizationStatus(id, "implemented", actualSavings);
    const optimizations = await this.storage.getOptimizations();
    const opt = optimizations.find((o) => o.id === id);
    if (opt) {
      this.emit("optimizationImplemented", opt);
    }
  }

  async getForecast(projectId?: string): Promise<TokenForecast | null> {
    return this.storage.getForecast(projectId);
  }
}

// =============================================================================
// Singleton & Factory
// =============================================================================

let defaultManager: TokenAnalyticsManager | null = null;

export function getTokenAnalyticsManager(): TokenAnalyticsManager {
  if (!defaultManager) {
    defaultManager = new TokenAnalyticsManager();
  }
  return defaultManager;
}

export function createTokenAnalyticsManager(
  config?: Partial<TokenAnalyticsConfig>,
  storage?: TokenAnalyticsStorage
): TokenAnalyticsManager {
  return new TokenAnalyticsManager(config, storage);
}
