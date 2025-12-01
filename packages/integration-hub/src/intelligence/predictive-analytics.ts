/**
 * Predictive Analytics
 * Phase 10D: Predictive Analytics
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

export const PredictionTypeSchema = z.enum([
  "execution_time",
  "cost",
  "token_usage",
  "success_rate",
  "traffic",
  "capacity",
]);
export type PredictionType = z.infer<typeof PredictionTypeSchema>;

export const PredictionConfidenceSchema = z.enum(["low", "medium", "high"]);
export type PredictionConfidence = z.infer<typeof PredictionConfidenceSchema>;

export const PredictionSchema = z.object({
  id: z.string(),
  type: PredictionTypeSchema,
  target: z.string(),  // pipeline ID, service name, etc.
  targetType: z.enum(["pipeline", "service", "organization", "global"]),

  // Prediction details
  predictedValue: z.number(),
  unit: z.string(),
  confidence: PredictionConfidenceSchema,
  confidenceScore: z.number().min(0).max(1),

  // Range
  lowerBound: z.number(),
  upperBound: z.number(),

  // Time frame
  horizon: z.enum(["hour", "day", "week", "month"]),
  predictedFor: z.date(),
  createdAt: z.date(),

  // Factors
  factors: z.array(z.object({
    name: z.string(),
    impact: z.number(),  // -1 to 1, negative = decreases, positive = increases
    description: z.string(),
  })).optional(),

  // Model info
  modelVersion: z.string(),
  dataPointsUsed: z.number(),
});
export type Prediction = z.infer<typeof PredictionSchema>;

export const ForecastSchema = z.object({
  id: z.string(),
  type: PredictionTypeSchema,
  target: z.string(),
  horizon: z.enum(["day", "week", "month", "quarter"]),
  startDate: z.date(),
  endDate: z.date(),
  predictions: z.array(z.object({
    date: z.date(),
    value: z.number(),
    lowerBound: z.number(),
    upperBound: z.number(),
  })),
  trend: z.enum(["increasing", "decreasing", "stable", "volatile"]),
  trendStrength: z.number().min(0).max(1),
  seasonality: z.object({
    detected: z.boolean(),
    period: z.string().optional(),  // "daily", "weekly", "monthly"
    amplitude: z.number().optional(),
  }),
  createdAt: z.date(),
});
export type Forecast = z.infer<typeof ForecastSchema>;

export const CapacityPlanSchema = z.object({
  id: z.string(),
  target: z.string(),
  currentCapacity: z.number(),
  currentUsage: z.number(),
  usagePercent: z.number(),
  projectedUsage: z.array(z.object({
    date: z.date(),
    usage: z.number(),
    percent: z.number(),
  })),
  recommendations: z.array(z.object({
    action: z.enum(["scale_up", "scale_down", "optimize", "no_action"]),
    description: z.string(),
    timing: z.string(),
    impact: z.string(),
    priority: z.enum(["low", "medium", "high"]),
  })),
  alertThresholds: z.object({
    warning: z.number(),  // percent
    critical: z.number(),
  }),
  createdAt: z.date(),
});
export type CapacityPlan = z.infer<typeof CapacityPlanSchema>;

export const UsageTrendSchema = z.object({
  metric: z.string(),
  period: z.enum(["day", "week", "month"]),
  dataPoints: z.array(z.object({
    date: z.date(),
    value: z.number(),
  })),
  trend: z.object({
    direction: z.enum(["up", "down", "stable"]),
    percentChange: z.number(),
    slope: z.number(),
  }),
  comparison: z.object({
    previousPeriod: z.number(),
    percentChange: z.number(),
  }),
});
export type UsageTrend = z.infer<typeof UsageTrendSchema>;

export const PredictiveAnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  updateIntervalMs: z.number().default(3600000),  // 1 hour
  minDataPoints: z.number().default(30),
  forecastHorizons: z.array(z.enum(["day", "week", "month", "quarter"])).default(["day", "week"]),
  confidenceLevel: z.number().default(0.95),
  seasonalityDetection: z.boolean().default(true),
  anomalyAdjustment: z.boolean().default(true),
});
export type PredictiveAnalyticsConfig = z.infer<typeof PredictiveAnalyticsConfigSchema>;

export interface PredictiveAnalyticsEvents {
  "prediction:created": (prediction: Prediction) => void;
  "forecast:updated": (forecast: Forecast) => void;
  "capacity:warning": (plan: CapacityPlan) => void;
  "trend:detected": (trend: UsageTrend) => void;
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

interface HistoricalDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

interface TimeSeriesData {
  metric: string;
  target: string;
  points: HistoricalDataPoint[];
}

// ============================================================================
// PREDICTIVE ANALYTICS ENGINE
// ============================================================================

export class PredictiveAnalytics extends EventEmitter<PredictiveAnalyticsEvents> {
  private config: PredictiveAnalyticsConfig;
  private historicalData: Map<string, TimeSeriesData> = new Map();
  private predictions: Map<string, Prediction> = new Map();
  private forecasts: Map<string, Forecast> = new Map();
  private capacityPlans: Map<string, CapacityPlan> = new Map();
  private updateTimer?: NodeJS.Timeout;

  constructor(config: Partial<PredictiveAnalyticsConfig> = {}) {
    super();
    this.config = PredictiveAnalyticsConfigSchema.parse(config);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  start(): void {
    if (!this.config.enabled) return;

    this.updateTimer = setInterval(() => {
      this.updatePredictions();
    }, this.config.updateIntervalMs);
  }

  stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }

  // ==========================================================================
  // DATA INGESTION
  // ==========================================================================

  recordDataPoint(
    metric: string,
    target: string,
    value: number,
    metadata?: Record<string, unknown>
  ): void {
    const key = `${metric}:${target}`;
    const series = this.historicalData.get(key) || {
      metric,
      target,
      points: [],
    };

    series.points.push({
      timestamp: new Date(),
      value,
      metadata,
    });

    // Keep 90 days of data
    const cutoff = Date.now() - 90 * 24 * 3600000;
    series.points = series.points.filter((p) => p.timestamp.getTime() > cutoff);

    this.historicalData.set(key, series);
  }

  recordExecution(
    pipelineId: string,
    duration: number,
    cost: number,
    tokens: number,
    success: boolean
  ): void {
    this.recordDataPoint("execution_time", pipelineId, duration);
    this.recordDataPoint("cost", pipelineId, cost);
    this.recordDataPoint("tokens", pipelineId, tokens);
    this.recordDataPoint("success", pipelineId, success ? 1 : 0);
  }

  recordTraffic(service: string, requestCount: number): void {
    this.recordDataPoint("traffic", service, requestCount);
  }

  // ==========================================================================
  // PREDICTIONS
  // ==========================================================================

  async predictExecutionTime(pipelineId: string): Promise<Prediction> {
    const data = this.getHistoricalData("execution_time", pipelineId);
    const prediction = this.generatePrediction(
      "execution_time",
      pipelineId,
      "pipeline",
      data,
      "ms"
    );

    this.predictions.set(prediction.id, prediction);
    this.emit("prediction:created", prediction);
    return prediction;
  }

  async predictCost(
    pipelineId: string,
    horizon: "hour" | "day" | "week" | "month" = "day"
  ): Promise<Prediction> {
    const data = this.getHistoricalData("cost", pipelineId);
    const prediction = this.generatePrediction(
      "cost",
      pipelineId,
      "pipeline",
      data,
      "USD",
      horizon
    );

    this.predictions.set(prediction.id, prediction);
    this.emit("prediction:created", prediction);
    return prediction;
  }

  async predictTokenUsage(
    pipelineId: string,
    horizon: "hour" | "day" | "week" | "month" = "day"
  ): Promise<Prediction> {
    const data = this.getHistoricalData("tokens", pipelineId);
    const prediction = this.generatePrediction(
      "token_usage",
      pipelineId,
      "pipeline",
      data,
      "tokens",
      horizon
    );

    this.predictions.set(prediction.id, prediction);
    this.emit("prediction:created", prediction);
    return prediction;
  }

  async predictSuccessRate(pipelineId: string): Promise<Prediction> {
    const data = this.getHistoricalData("success", pipelineId);
    const prediction = this.generatePrediction(
      "success_rate",
      pipelineId,
      "pipeline",
      data,
      "%"
    );

    // Convert to percentage
    prediction.predictedValue *= 100;
    prediction.lowerBound *= 100;
    prediction.upperBound *= 100;

    this.predictions.set(prediction.id, prediction);
    this.emit("prediction:created", prediction);
    return prediction;
  }

  async predictTraffic(
    service: string,
    horizon: "hour" | "day" | "week" | "month" = "day"
  ): Promise<Prediction> {
    const data = this.getHistoricalData("traffic", service);
    const prediction = this.generatePrediction(
      "traffic",
      service,
      "service",
      data,
      "requests",
      horizon
    );

    this.predictions.set(prediction.id, prediction);
    this.emit("prediction:created", prediction);
    return prediction;
  }

  getPrediction(predictionId: string): Prediction | undefined {
    return this.predictions.get(predictionId);
  }

  getLatestPredictions(target: string, type?: PredictionType): Prediction[] {
    const predictions = Array.from(this.predictions.values())
      .filter((p) => p.target === target && (!type || p.type === type))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return predictions;
  }

  // ==========================================================================
  // FORECASTING
  // ==========================================================================

  async generateForecast(
    type: PredictionType,
    target: string,
    horizon: "day" | "week" | "month" | "quarter" = "week"
  ): Promise<Forecast> {
    const metricMap: Record<PredictionType, string> = {
      execution_time: "execution_time",
      cost: "cost",
      token_usage: "tokens",
      success_rate: "success",
      traffic: "traffic",
      capacity: "traffic",
    };

    const data = this.getHistoricalData(metricMap[type], target);
    const forecast = this.buildForecast(type, target, data, horizon);

    this.forecasts.set(forecast.id, forecast);
    this.emit("forecast:updated", forecast);
    return forecast;
  }

  getForecast(forecastId: string): Forecast | undefined {
    return this.forecasts.get(forecastId);
  }

  // ==========================================================================
  // CAPACITY PLANNING
  // ==========================================================================

  async generateCapacityPlan(
    target: string,
    currentCapacity: number
  ): Promise<CapacityPlan> {
    const trafficData = this.getHistoricalData("traffic", target);
    const plan = this.buildCapacityPlan(target, currentCapacity, trafficData);

    this.capacityPlans.set(plan.id, plan);

    // Check if we need to alert
    if (plan.usagePercent > plan.alertThresholds.warning) {
      this.emit("capacity:warning", plan);
    }

    return plan;
  }

  getCapacityPlan(target: string): CapacityPlan | undefined {
    return this.capacityPlans.get(target);
  }

  // ==========================================================================
  // TRENDS
  // ==========================================================================

  analyzeTrend(
    metric: string,
    target: string,
    period: "day" | "week" | "month" = "week"
  ): UsageTrend {
    const data = this.getHistoricalData(metric, target);
    const trend = this.calculateTrend(metric, data, period);

    this.emit("trend:detected", trend);
    return trend;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private getHistoricalData(metric: string, target: string): HistoricalDataPoint[] {
    const key = `${metric}:${target}`;
    const series = this.historicalData.get(key);
    return series?.points || [];
  }

  private generatePrediction(
    type: PredictionType,
    target: string,
    targetType: Prediction["targetType"],
    data: HistoricalDataPoint[],
    unit: string,
    horizon: Prediction["horizon"] = "day"
  ): Prediction {
    // Calculate statistics
    const values = data.map((d) => d.value);
    const stats = this.calculateStats(values);

    // Simple prediction using exponential moving average
    const ema = this.calculateEMA(values);
    const predictedValue = ema;

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(data.length, stats.cv);

    // Calculate bounds using standard deviation
    const margin = stats.stdDev * (confidence === "high" ? 1.5 : confidence === "medium" ? 2 : 2.5);

    // Identify contributing factors
    const factors = this.identifyFactors(data, stats);

    // Calculate prediction date based on horizon
    const horizonMs = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
    }[horizon];

    return {
      id: randomUUID(),
      type,
      target,
      targetType,
      predictedValue: Math.max(0, predictedValue),
      unit,
      confidence,
      confidenceScore: confidence === "high" ? 0.9 : confidence === "medium" ? 0.7 : 0.5,
      lowerBound: Math.max(0, predictedValue - margin),
      upperBound: predictedValue + margin,
      horizon,
      predictedFor: new Date(Date.now() + horizonMs),
      createdAt: new Date(),
      factors,
      modelVersion: "1.0.0",
      dataPointsUsed: data.length,
    };
  }

  private buildForecast(
    type: PredictionType,
    target: string,
    data: HistoricalDataPoint[],
    horizon: Forecast["horizon"]
  ): Forecast {
    const values = data.map((d) => d.value);
    const stats = this.calculateStats(values);

    // Generate forecast points
    const horizonDays = { day: 1, week: 7, month: 30, quarter: 90 }[horizon];
    const predictions: Forecast["predictions"] = [];

    const trend = this.detectTrend(values);
    const seasonality = this.detectSeasonality(data);

    for (let i = 1; i <= horizonDays; i++) {
      const date = new Date(Date.now() + i * 86400000);
      const baseValue = stats.mean;

      // Apply trend
      let value = baseValue + (trend.slope * i);

      // Apply seasonality if detected
      if (seasonality.detected && seasonality.amplitude) {
        const dayOfWeek = date.getDay();
        value += seasonality.amplitude * Math.sin((dayOfWeek / 7) * 2 * Math.PI);
      }

      const margin = stats.stdDev * 1.96; // 95% confidence

      predictions.push({
        date,
        value: Math.max(0, value),
        lowerBound: Math.max(0, value - margin),
        upperBound: value + margin,
      });
    }

    return {
      id: randomUUID(),
      type,
      target,
      horizon,
      startDate: new Date(),
      endDate: new Date(Date.now() + horizonDays * 86400000),
      predictions,
      trend: trend.direction === "up" ? "increasing"
        : trend.direction === "down" ? "decreasing"
        : Math.abs(trend.slope) < 0.01 ? "stable" : "volatile",
      trendStrength: Math.min(1, Math.abs(trend.slope) / stats.mean),
      seasonality,
      createdAt: new Date(),
    };
  }

  private buildCapacityPlan(
    target: string,
    currentCapacity: number,
    data: HistoricalDataPoint[]
  ): CapacityPlan {
    const values = data.map((d) => d.value);
    const stats = this.calculateStats(values);
    const trend = this.detectTrend(values);

    const currentUsage = values.length > 0 ? values[values.length - 1] : 0;
    const usagePercent = (currentUsage / currentCapacity) * 100;

    // Project usage for next 30 days
    const projectedUsage: CapacityPlan["projectedUsage"] = [];
    for (let i = 1; i <= 30; i++) {
      const date = new Date(Date.now() + i * 86400000);
      const usage = currentUsage + (trend.slope * i);
      projectedUsage.push({
        date,
        usage: Math.max(0, usage),
        percent: (Math.max(0, usage) / currentCapacity) * 100,
      });
    }

    // Generate recommendations
    const recommendations: CapacityPlan["recommendations"] = [];

    const maxProjectedPercent = Math.max(...projectedUsage.map((p) => p.percent));

    if (maxProjectedPercent > 90) {
      recommendations.push({
        action: "scale_up",
        description: "Projected usage will exceed 90% capacity",
        timing: "Within 2 weeks",
        impact: "Prevent service degradation",
        priority: "high",
      });
    } else if (maxProjectedPercent > 75) {
      recommendations.push({
        action: "scale_up",
        description: "Projected usage approaching capacity limits",
        timing: "Within 4 weeks",
        impact: "Maintain performance headroom",
        priority: "medium",
      });
    } else if (usagePercent < 30 && trend.direction !== "up") {
      recommendations.push({
        action: "scale_down",
        description: "Current usage is well below capacity",
        timing: "Consider in next review",
        impact: "Reduce costs by 20-40%",
        priority: "low",
      });
    }

    if (stats.cv > 0.5) {
      recommendations.push({
        action: "optimize",
        description: "High usage variance detected",
        timing: "As soon as possible",
        impact: "More predictable capacity needs",
        priority: "medium",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        action: "no_action",
        description: "Current capacity is appropriate",
        timing: "Review in 30 days",
        impact: "None needed",
        priority: "low",
      });
    }

    return {
      id: randomUUID(),
      target,
      currentCapacity,
      currentUsage,
      usagePercent,
      projectedUsage,
      recommendations,
      alertThresholds: {
        warning: 75,
        critical: 90,
      },
      createdAt: new Date(),
    };
  }

  private calculateStats(values: number[]): {
    mean: number;
    stdDev: number;
    cv: number;  // coefficient of variation
    min: number;
    max: number;
  } {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0, cv: 0, min: 0, max: 0 };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      stdDev,
      cv: mean > 0 ? stdDev / mean : 0,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  private calculateEMA(values: number[], smoothing: number = 0.2): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
      ema = values[i] * smoothing + ema * (1 - smoothing);
    }
    return ema;
  }

  private calculateConfidence(
    dataPoints: number,
    cv: number
  ): PredictionConfidence {
    if (dataPoints < this.config.minDataPoints) return "low";
    if (cv > 0.5) return "low";
    if (dataPoints >= 100 && cv < 0.2) return "high";
    return "medium";
  }

  private identifyFactors(
    data: HistoricalDataPoint[],
    stats: { mean: number; stdDev: number }
  ): Prediction["factors"] {
    const factors: Prediction["factors"] = [];

    // Check for recent trend
    if (data.length >= 7) {
      const recentValues = data.slice(-7).map((d) => d.value);
      const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      const trendImpact = (recentMean - stats.mean) / stats.mean;

      if (Math.abs(trendImpact) > 0.1) {
        factors.push({
          name: "Recent trend",
          impact: trendImpact > 0 ? 0.3 : -0.3,
          description: trendImpact > 0
            ? "Recent values trending above historical average"
            : "Recent values trending below historical average",
        });
      }
    }

    // Check for day-of-week patterns
    const dayPatterns = new Map<number, number[]>();
    data.forEach((d) => {
      const day = d.timestamp.getDay();
      const values = dayPatterns.get(day) || [];
      values.push(d.value);
      dayPatterns.set(day, values);
    });

    const today = new Date().getDay();
    const todayValues = dayPatterns.get(today);
    if (todayValues && todayValues.length > 3) {
      const todayMean = todayValues.reduce((a, b) => a + b, 0) / todayValues.length;
      const dayImpact = (todayMean - stats.mean) / stats.mean;

      if (Math.abs(dayImpact) > 0.15) {
        factors.push({
          name: "Day-of-week pattern",
          impact: dayImpact > 0 ? 0.2 : -0.2,
          description: dayImpact > 0
            ? "This day typically has higher than average values"
            : "This day typically has lower than average values",
        });
      }
    }

    return factors;
  }

  private detectTrend(values: number[]): { direction: "up" | "down" | "stable"; slope: number } {
    if (values.length < 3) {
      return { direction: "stable", slope: 0 };
    }

    // Simple linear regression
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const mean = sumY / n;

    // Determine direction based on slope relative to mean
    const relativeSlope = slope / (mean || 1);

    if (relativeSlope > 0.01) return { direction: "up", slope };
    if (relativeSlope < -0.01) return { direction: "down", slope };
    return { direction: "stable", slope };
  }

  private detectSeasonality(data: HistoricalDataPoint[]): Forecast["seasonality"] {
    if (!this.config.seasonalityDetection || data.length < 14) {
      return { detected: false };
    }

    // Check for weekly seasonality
    const dayAverages = new Map<number, number[]>();
    data.forEach((d) => {
      const day = d.timestamp.getDay();
      const values = dayAverages.get(day) || [];
      values.push(d.value);
      dayAverages.set(day, values);
    });

    if (dayAverages.size < 7) {
      return { detected: false };
    }

    const dailyMeans = Array.from(dayAverages.values()).map(
      (vals) => vals.reduce((a, b) => a + b, 0) / vals.length
    );

    const overallMean = dailyMeans.reduce((a, b) => a + b, 0) / dailyMeans.length;
    const variance = dailyMeans.reduce((sum, v) => sum + Math.pow(v - overallMean, 2), 0) / dailyMeans.length;
    const amplitude = Math.sqrt(variance);

    // If daily variation is significant, seasonality detected
    if (amplitude / overallMean > 0.1) {
      return {
        detected: true,
        period: "weekly",
        amplitude,
      };
    }

    return { detected: false };
  }

  private calculateTrend(
    metric: string,
    data: HistoricalDataPoint[],
    period: "day" | "week" | "month"
  ): UsageTrend {
    const periodMs = { day: 86400000, week: 604800000, month: 2592000000 }[period];
    const cutoff = Date.now() - periodMs;

    const periodData = data.filter((d) => d.timestamp.getTime() > cutoff);
    const previousCutoff = cutoff - periodMs;
    const previousData = data.filter(
      (d) => d.timestamp.getTime() > previousCutoff && d.timestamp.getTime() <= cutoff
    );

    const currentSum = periodData.reduce((sum, d) => sum + d.value, 0);
    const previousSum = previousData.reduce((sum, d) => sum + d.value, 0);

    const trend = this.detectTrend(periodData.map((d) => d.value));
    const percentChange = previousSum > 0 ? ((currentSum - previousSum) / previousSum) * 100 : 0;

    return {
      metric,
      period,
      dataPoints: periodData.map((d) => ({ date: d.timestamp, value: d.value })),
      trend: {
        direction: trend.direction,
        percentChange,
        slope: trend.slope,
      },
      comparison: {
        previousPeriod: previousSum,
        percentChange,
      },
    };
  }

  private updatePredictions(): void {
    // Refresh predictions for all tracked targets
    for (const [key] of this.historicalData) {
      const [metric, target] = key.split(":");

      // Map metrics to prediction types
      const typeMap: Record<string, PredictionType> = {
        execution_time: "execution_time",
        cost: "cost",
        tokens: "token_usage",
        success: "success_rate",
        traffic: "traffic",
      };

      const type = typeMap[metric];
      if (type) {
        const data = this.getHistoricalData(metric, target);
        if (data.length >= this.config.minDataPoints) {
          const prediction = this.generatePrediction(
            type,
            target,
            "pipeline",
            data,
            type === "cost" ? "USD" : type === "execution_time" ? "ms" : "units"
          );
          this.predictions.set(`${type}:${target}`, prediction);
        }
      }
    }
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let instance: PredictiveAnalytics | null = null;

export function getPredictiveAnalytics(): PredictiveAnalytics {
  if (!instance) {
    instance = new PredictiveAnalytics();
  }
  return instance;
}

export function createPredictiveAnalytics(
  config: Partial<PredictiveAnalyticsConfig> = {}
): PredictiveAnalytics {
  instance = new PredictiveAnalytics(config);
  return instance;
}
