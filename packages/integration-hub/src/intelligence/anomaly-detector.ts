/**
 * Anomaly Detector
 * Phase 10B: Anomaly Detection
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

export const AnomalyTypeSchema = z.enum([
  "cost_spike",           // Unusual cost increase
  "latency_spike",        // Unusual latency increase
  "error_spike",          // Unusual error rate increase
  "token_spike",          // Unusual token usage
  "traffic_spike",        // Unusual request volume
  "traffic_drop",         // Unusual request drop
  "pattern_change",       // Execution pattern changed
  "performance_regression", // Gradual performance decline
]);
export type AnomalyType = z.infer<typeof AnomalyTypeSchema>;

export const AnomalySeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export type AnomalySeverity = z.infer<typeof AnomalySeveritySchema>;

export const AnomalyStatusSchema = z.enum([
  "active",
  "investigating",
  "resolved",
  "false_positive",
]);
export type AnomalyStatus = z.infer<typeof AnomalyStatusSchema>;

export const AnomalySchema = z.object({
  id: z.string(),
  type: AnomalyTypeSchema,
  severity: AnomalySeveritySchema,
  status: AnomalyStatusSchema,
  title: z.string(),
  description: z.string(),

  // Affected resources
  pipelineId: z.string().optional(),
  stepIndex: z.number().optional(),
  service: z.string().optional(),

  // Detection details
  metric: z.string(),
  expectedValue: z.number(),
  actualValue: z.number(),
  deviation: z.number(),  // Standard deviations from mean
  confidence: z.number().min(0).max(1),

  // Time range
  detectedAt: z.date(),
  startedAt: z.date(),
  endedAt: z.date().optional(),
  resolvedAt: z.date().optional(),

  // Related data
  relatedAnomalies: z.array(z.string()).optional(),
  possibleCauses: z.array(z.string()).optional(),
  suggestedActions: z.array(z.string()).optional(),

  // Incident
  incidentId: z.string().optional(),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
  notes: z.string().optional(),
});
export type Anomaly = z.infer<typeof AnomalySchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: AnomalySeveritySchema,
  status: z.enum(["open", "investigating", "mitigating", "resolved", "closed"]),
  anomalyIds: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().optional(),
  assignedTo: z.string().optional(),
  timeline: z.array(z.object({
    timestamp: z.date(),
    event: z.string(),
    actor: z.string().optional(),
  })),
  postmortem: z.string().optional(),
});
export type Incident = z.infer<typeof IncidentSchema>;

export const AnomalyDetectorConfigSchema = z.object({
  enabled: z.boolean().default(true),
  checkIntervalMs: z.number().default(60000),  // 1 minute

  // Thresholds (standard deviations)
  costSpikeThreshold: z.number().default(3),
  latencySpikeThreshold: z.number().default(2.5),
  errorSpikeThreshold: z.number().default(2),
  tokenSpikeThreshold: z.number().default(3),
  trafficSpikeThreshold: z.number().default(3),
  trafficDropThreshold: z.number().default(-2),

  // Time windows
  baselineWindowHours: z.number().default(168),  // 1 week
  detectionWindowMinutes: z.number().default(15),

  // Auto-incident creation
  autoCreateIncident: z.boolean().default(true),
  incidentThresholdSeverity: AnomalySeveritySchema.default("high"),

  // Alerting
  alertWebhookUrl: z.string().url().optional(),
  alertSlackChannel: z.string().optional(),
});
export type AnomalyDetectorConfig = z.infer<typeof AnomalyDetectorConfigSchema>;

export interface AnomalyDetectorEvents {
  "anomaly:detected": (anomaly: Anomaly) => void;
  "anomaly:resolved": (anomaly: Anomaly) => void;
  "anomaly:escalated": (anomaly: Anomaly) => void;
  "incident:created": (incident: Incident) => void;
  "incident:updated": (incident: Incident) => void;
  "incident:resolved": (incident: Incident) => void;
}

// ============================================================================
// METRIC DATA POINT
// ============================================================================

interface DataPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

interface MetricSeries {
  name: string;
  points: DataPoint[];
}

// ============================================================================
// ANOMALY DETECTOR
// ============================================================================

export class AnomalyDetector extends EventEmitter<AnomalyDetectorEvents> {
  private config: AnomalyDetectorConfig;
  private anomalies: Map<string, Anomaly> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private metrics: Map<string, MetricSeries> = new Map();
  private checkTimer?: NodeJS.Timeout;
  private baselines: Map<string, { mean: number; stdDev: number }> = new Map();

  constructor(config: Partial<AnomalyDetectorConfig> = {}) {
    super();
    this.config = AnomalyDetectorConfigSchema.parse(config);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  start(): void {
    if (!this.config.enabled) return;

    this.checkTimer = setInterval(() => {
      this.runDetection();
    }, this.config.checkIntervalMs);

    // Run initial detection
    this.runDetection();
  }

  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
  }

  // ==========================================================================
  // METRIC INGESTION
  // ==========================================================================

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const series = this.metrics.get(name) || { name, points: [] };

    series.points.push({
      timestamp: new Date(),
      value,
      labels,
    });

    // Keep only baseline window worth of data
    const cutoff = Date.now() - this.config.baselineWindowHours * 3600000;
    series.points = series.points.filter((p) => p.timestamp.getTime() > cutoff);

    this.metrics.set(name, series);

    // Update baseline
    this.updateBaseline(name);
  }

  recordCost(pipelineId: string, cost: number): void {
    this.recordMetric("cost", cost, { pipeline_id: pipelineId });
  }

  recordLatency(pipelineId: string, latencyMs: number): void {
    this.recordMetric("latency", latencyMs, { pipeline_id: pipelineId });
  }

  recordError(pipelineId: string): void {
    this.recordMetric("errors", 1, { pipeline_id: pipelineId });
  }

  recordTokens(pipelineId: string, tokens: number): void {
    this.recordMetric("tokens", tokens, { pipeline_id: pipelineId });
  }

  recordRequest(service: string): void {
    this.recordMetric("requests", 1, { service });
  }

  // ==========================================================================
  // DETECTION
  // ==========================================================================

  private runDetection(): void {
    this.detectCostAnomalies();
    this.detectLatencyAnomalies();
    this.detectErrorAnomalies();
    this.detectTokenAnomalies();
    this.detectTrafficAnomalies();
    this.checkResolvedAnomalies();
  }

  private detectCostAnomalies(): void {
    this.detectAnomalyForMetric("cost", "cost_spike", this.config.costSpikeThreshold);
  }

  private detectLatencyAnomalies(): void {
    this.detectAnomalyForMetric("latency", "latency_spike", this.config.latencySpikeThreshold);
  }

  private detectErrorAnomalies(): void {
    this.detectAnomalyForMetric("errors", "error_spike", this.config.errorSpikeThreshold);
  }

  private detectTokenAnomalies(): void {
    this.detectAnomalyForMetric("tokens", "token_spike", this.config.tokenSpikeThreshold);
  }

  private detectTrafficAnomalies(): void {
    this.detectAnomalyForMetric("requests", "traffic_spike", this.config.trafficSpikeThreshold);
    this.detectAnomalyForMetric("requests", "traffic_drop", this.config.trafficDropThreshold, true);
  }

  private detectAnomalyForMetric(
    metricName: string,
    anomalyType: AnomalyType,
    threshold: number,
    detectDrop: boolean = false
  ): void {
    const baseline = this.baselines.get(metricName);
    if (!baseline || baseline.stdDev === 0) return;

    const recentValue = this.getRecentValue(metricName);
    if (recentValue === null) return;

    const deviation = (recentValue - baseline.mean) / baseline.stdDev;

    // Check if deviation exceeds threshold
    const isAnomaly = detectDrop
      ? deviation < threshold
      : deviation > threshold;

    if (isAnomaly) {
      const existingAnomaly = this.findActiveAnomaly(metricName, anomalyType);

      if (!existingAnomaly) {
        const anomaly = this.createAnomaly({
          type: anomalyType,
          severity: this.calculateSeverity(Math.abs(deviation)),
          title: this.generateTitle(anomalyType, metricName),
          description: this.generateDescription(
            anomalyType,
            metricName,
            baseline.mean,
            recentValue,
            deviation
          ),
          metric: metricName,
          expectedValue: baseline.mean,
          actualValue: recentValue,
          deviation: Math.abs(deviation),
          confidence: this.calculateConfidence(Math.abs(deviation), baseline),
          possibleCauses: this.inferCauses(anomalyType, metricName),
          suggestedActions: this.suggestActions(anomalyType),
        });

        this.anomalies.set(anomaly.id, anomaly);
        this.emit("anomaly:detected", anomaly);

        // Auto-create incident for high severity
        if (
          this.config.autoCreateIncident &&
          this.compareSeverity(anomaly.severity, this.config.incidentThresholdSeverity) >= 0
        ) {
          this.createIncidentFromAnomaly(anomaly);
        }
      }
    }
  }

  private checkResolvedAnomalies(): void {
    for (const anomaly of this.anomalies.values()) {
      if (anomaly.status !== "active") continue;

      const baseline = this.baselines.get(anomaly.metric);
      if (!baseline) continue;

      const recentValue = this.getRecentValue(anomaly.metric);
      if (recentValue === null) continue;

      const deviation = Math.abs((recentValue - baseline.mean) / baseline.stdDev);

      // If deviation is back to normal (< 1.5 std devs), mark resolved
      if (deviation < 1.5) {
        anomaly.status = "resolved";
        anomaly.endedAt = new Date();
        anomaly.resolvedAt = new Date();
        this.emit("anomaly:resolved", anomaly);
      }
    }
  }

  // ==========================================================================
  // ANOMALY MANAGEMENT
  // ==========================================================================

  private createAnomaly(
    data: Omit<Anomaly, "id" | "status" | "detectedAt" | "startedAt">
  ): Anomaly {
    return {
      ...data,
      id: randomUUID(),
      status: "active",
      detectedAt: new Date(),
      startedAt: new Date(),
    };
  }

  getAnomalies(options?: {
    status?: AnomalyStatus;
    type?: AnomalyType;
    severity?: AnomalySeverity;
    pipelineId?: string;
  }): Anomaly[] {
    let anomalies = Array.from(this.anomalies.values());

    if (options?.status) {
      anomalies = anomalies.filter((a) => a.status === options.status);
    }
    if (options?.type) {
      anomalies = anomalies.filter((a) => a.type === options.type);
    }
    if (options?.severity) {
      anomalies = anomalies.filter((a) => a.severity === options.severity);
    }
    if (options?.pipelineId) {
      anomalies = anomalies.filter((a) => a.pipelineId === options.pipelineId);
    }

    return anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  acknowledgeAnomaly(anomalyId: string, userId: string, notes?: string): boolean {
    const anomaly = this.anomalies.get(anomalyId);
    if (!anomaly) return false;

    anomaly.status = "investigating";
    anomaly.acknowledgedBy = userId;
    anomaly.acknowledgedAt = new Date();
    if (notes) anomaly.notes = notes;

    return true;
  }

  markFalsePositive(anomalyId: string, reason?: string): boolean {
    const anomaly = this.anomalies.get(anomalyId);
    if (!anomaly) return false;

    anomaly.status = "false_positive";
    anomaly.resolvedAt = new Date();
    if (reason) anomaly.notes = reason;

    return true;
  }

  // ==========================================================================
  // INCIDENTS
  // ==========================================================================

  private createIncidentFromAnomaly(anomaly: Anomaly): Incident {
    const incident: Incident = {
      id: randomUUID(),
      title: `Incident: ${anomaly.title}`,
      description: anomaly.description,
      severity: anomaly.severity,
      status: "open",
      anomalyIds: [anomaly.id],
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [
        {
          timestamp: new Date(),
          event: "Incident created automatically from detected anomaly",
        },
      ],
    };

    this.incidents.set(incident.id, incident);
    anomaly.incidentId = incident.id;

    this.emit("incident:created", incident);
    return incident;
  }

  getIncidents(status?: Incident["status"]): Incident[] {
    let incidents = Array.from(this.incidents.values());
    if (status) {
      incidents = incidents.filter((i) => i.status === status);
    }
    return incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateIncident(
    incidentId: string,
    updates: {
      status?: Incident["status"];
      assignedTo?: string;
      notes?: string;
    }
  ): Incident | undefined {
    const incident = this.incidents.get(incidentId);
    if (!incident) return undefined;

    if (updates.status) {
      incident.status = updates.status;
      incident.timeline.push({
        timestamp: new Date(),
        event: `Status changed to ${updates.status}`,
      });

      if (updates.status === "resolved" || updates.status === "closed") {
        incident.resolvedAt = new Date();
      }
    }

    if (updates.assignedTo) {
      incident.assignedTo = updates.assignedTo;
      incident.timeline.push({
        timestamp: new Date(),
        event: `Assigned to ${updates.assignedTo}`,
      });
    }

    if (updates.notes) {
      incident.timeline.push({
        timestamp: new Date(),
        event: updates.notes,
      });
    }

    incident.updatedAt = new Date();
    this.emit("incident:updated", incident);

    if (incident.status === "resolved") {
      this.emit("incident:resolved", incident);
    }

    return incident;
  }

  addPostmortem(incidentId: string, postmortem: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    incident.postmortem = postmortem;
    incident.timeline.push({
      timestamp: new Date(),
      event: "Postmortem added",
    });
    incident.updatedAt = new Date();

    this.emit("incident:updated", incident);
    return true;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private updateBaseline(metricName: string): void {
    const series = this.metrics.get(metricName);
    if (!series || series.points.length < 10) return;

    // Use data older than detection window for baseline
    const baselineCutoff = Date.now() - this.config.detectionWindowMinutes * 60000;
    const baselinePoints = series.points.filter(
      (p) => p.timestamp.getTime() < baselineCutoff
    );

    if (baselinePoints.length < 10) return;

    const values = baselinePoints.map((p) => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    this.baselines.set(metricName, { mean, stdDev: stdDev || 1 });
  }

  private getRecentValue(metricName: string): number | null {
    const series = this.metrics.get(metricName);
    if (!series || series.points.length === 0) return null;

    // Get average of last detection window
    const windowStart = Date.now() - this.config.detectionWindowMinutes * 60000;
    const recentPoints = series.points.filter(
      (p) => p.timestamp.getTime() >= windowStart
    );

    if (recentPoints.length === 0) return null;

    return recentPoints.reduce((sum, p) => sum + p.value, 0) / recentPoints.length;
  }

  private findActiveAnomaly(metric: string, type: AnomalyType): Anomaly | undefined {
    for (const anomaly of this.anomalies.values()) {
      if (
        anomaly.metric === metric &&
        anomaly.type === type &&
        anomaly.status === "active"
      ) {
        return anomaly;
      }
    }
    return undefined;
  }

  private calculateSeverity(deviation: number): AnomalySeverity {
    if (deviation >= 5) return "critical";
    if (deviation >= 4) return "high";
    if (deviation >= 3) return "medium";
    return "low";
  }

  private calculateConfidence(
    deviation: number,
    baseline: { mean: number; stdDev: number }
  ): number {
    // Higher deviation = higher confidence
    // More data points = higher confidence
    const deviationFactor = Math.min(deviation / 5, 1);
    const series = Array.from(this.metrics.values())[0];
    const dataFactor = series ? Math.min(series.points.length / 100, 1) : 0.5;

    return 0.5 + (deviationFactor * 0.3) + (dataFactor * 0.2);
  }

  private compareSeverity(a: AnomalySeverity, b: AnomalySeverity): number {
    const order = { low: 0, medium: 1, high: 2, critical: 3 };
    return order[a] - order[b];
  }

  private generateTitle(type: AnomalyType, metric: string): string {
    const titles: Record<AnomalyType, string> = {
      cost_spike: `Cost spike detected for ${metric}`,
      latency_spike: `Latency spike detected`,
      error_spike: `Error rate spike detected`,
      token_spike: `Token usage spike detected`,
      traffic_spike: `Traffic spike detected`,
      traffic_drop: `Traffic drop detected`,
      pattern_change: `Execution pattern change detected`,
      performance_regression: `Performance regression detected`,
    };
    return titles[type];
  }

  private generateDescription(
    type: AnomalyType,
    metric: string,
    expected: number,
    actual: number,
    deviation: number
  ): string {
    const change = ((actual - expected) / expected * 100).toFixed(1);
    const direction = actual > expected ? "above" : "below";

    return `${metric} is ${Math.abs(parseFloat(change))}% ${direction} normal. ` +
      `Expected: ${expected.toFixed(2)}, Actual: ${actual.toFixed(2)} ` +
      `(${deviation.toFixed(1)} standard deviations from mean)`;
  }

  private inferCauses(type: AnomalyType, metric: string): string[] {
    const causes: Record<AnomalyType, string[]> = {
      cost_spike: [
        "Increased execution volume",
        "Using more expensive models",
        "Longer prompts or responses",
        "Retry loops causing duplicate calls",
      ],
      latency_spike: [
        "API provider experiencing slowdown",
        "Network latency issues",
        "Complex prompts requiring more processing",
        "Rate limiting causing delays",
      ],
      error_spike: [
        "API provider outage",
        "Invalid configuration",
        "Rate limit exceeded",
        "Authentication issues",
      ],
      token_spike: [
        "Longer inputs than usual",
        "More verbose outputs",
        "Missing input truncation",
        "Conversation context accumulation",
      ],
      traffic_spike: [
        "Marketing campaign driving traffic",
        "Bot or crawler activity",
        "Batch job execution",
        "User behavior change",
      ],
      traffic_drop: [
        "Service disruption",
        "DNS or networking issues",
        "Deployment problems",
        "External dependency failure",
      ],
      pattern_change: [
        "Configuration change",
        "Model update",
        "Workflow modification",
      ],
      performance_regression: [
        "Code changes affecting performance",
        "Data growth",
        "Resource contention",
      ],
    };
    return causes[type] || [];
  }

  private suggestActions(type: AnomalyType): string[] {
    const actions: Record<AnomalyType, string[]> = {
      cost_spike: [
        "Review recent execution logs",
        "Check for retry loops",
        "Consider adding cost limits",
        "Evaluate model selection",
      ],
      latency_spike: [
        "Check API provider status",
        "Review network connectivity",
        "Consider adding timeouts",
        "Implement request queuing",
      ],
      error_spike: [
        "Check API provider status page",
        "Review error logs",
        "Verify API keys and credentials",
        "Check rate limit status",
      ],
      token_spike: [
        "Review input data size",
        "Check prompt templates",
        "Implement input truncation",
        "Add token budgets",
      ],
      traffic_spike: [
        "Scale resources if needed",
        "Enable rate limiting",
        "Check for bot traffic",
        "Review recent deployments",
      ],
      traffic_drop: [
        "Check service health",
        "Review recent deployments",
        "Check DNS and networking",
        "Contact API provider if needed",
      ],
      pattern_change: [
        "Review recent configuration changes",
        "Check for model updates",
        "Verify workflow definitions",
      ],
      performance_regression: [
        "Review recent code changes",
        "Profile slow operations",
        "Check resource utilization",
      ],
    };
    return actions[type] || [];
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let instance: AnomalyDetector | null = null;

export function getAnomalyDetector(): AnomalyDetector {
  if (!instance) {
    instance = new AnomalyDetector();
  }
  return instance;
}

export function createAnomalyDetector(
  config: Partial<AnomalyDetectorConfig> = {}
): AnomalyDetector {
  instance = new AnomalyDetector(config);
  return instance;
}
