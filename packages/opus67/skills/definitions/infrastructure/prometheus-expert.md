# Prometheus Expert - Metrics Collection & Alerting

**Version:** 5.1.0
**Tier:** 3
**Token Cost:** 7500
**Category:** Infrastructure Management

## Overview

You are a Prometheus monitoring expert specializing in metrics collection, PromQL queries, alerting rules, service discovery, and building production-grade observability systems. You design comprehensive monitoring strategies for distributed systems.

## Core Competencies

### 1. Prometheus Configuration

**Main Configuration File**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  scrape_timeout: 10s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    region: 'us-west-2'
    environment: 'prod'

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093
    timeout: 10s
    api_version: v2

# Rule files
rule_files:
  - '/etc/prometheus/rules/*.yml'
  - '/etc/prometheus/alerts/*.yml'

# Scrape configurations
scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
        labels:
          service: 'prometheus'

  # Node Exporter for system metrics
  - job_name: 'node-exporter'
    scrape_interval: 30s
    static_configs:
      - targets:
        - 'node1:9100'
        - 'node2:9100'
        - 'node3:9100'
        labels:
          environment: 'production'

  # Kubernetes service discovery
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
      namespaces:
        names:
          - production
          - staging

    relabel_configs:
    # Only scrape pods with prometheus.io/scrape annotation
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true

    # Use custom path if specified
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)

    # Use custom port if specified
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__

    # Add pod metadata as labels
    - source_labels: [__meta_kubernetes_namespace]
      target_label: kubernetes_namespace
    - source_labels: [__meta_kubernetes_pod_name]
      target_label: kubernetes_pod_name
    - source_labels: [__meta_kubernetes_pod_label_app]
      target_label: app
    - source_labels: [__meta_kubernetes_pod_label_version]
      target_label: version

  # Kubernetes services
  - job_name: 'kubernetes-services'
    kubernetes_sd_configs:
    - role: service
    relabel_configs:
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
      action: replace
      target_label: __scheme__
      regex: (https?)
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)

  # Service discovery with Consul
  - job_name: 'consul-services'
    consul_sd_configs:
      - server: 'consul:8500'
        datacenter: 'dc1'
    relabel_configs:
      - source_labels: [__meta_consul_service]
        target_label: service

  # File-based service discovery
  - job_name: 'dynamic-services'
    file_sd_configs:
      - files:
        - '/etc/prometheus/targets/*.json'
        - '/etc/prometheus/targets/*.yml'
        refresh_interval: 30s

  # HTTP API targets
  - job_name: 'webapp-api'
    scrape_interval: 15s
    metrics_path: '/metrics'
    static_configs:
      - targets:
        - 'api-1.example.com:8080'
        - 'api-2.example.com:8080'
        - 'api-3.example.com:8080'
        labels:
          service: 'webapp-api'
          tier: 'backend'

  # PostgreSQL exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
        labels:
          database: 'production'

  # Redis exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx exporter
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  # Blackbox exporter for endpoint monitoring
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://example.com
        - https://api.example.com
        - https://admin.example.com
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115

  # Custom application metrics
  - job_name: 'custom-app'
    scrape_interval: 10s
    static_configs:
      - targets: ['app:9090']
    metric_relabel_configs:
      # Drop high-cardinality metrics
      - source_labels: [__name__]
        regex: 'http_request_duration_seconds_bucket'
        action: drop
      # Rename metrics
      - source_labels: [__name__]
        regex: 'app_(.+)'
        replacement: 'custom_app_${1}'
        target_label: __name__

# Remote write for long-term storage
remote_write:
  - url: "https://prometheus-remote-storage.example.com/api/v1/write"
    queue_config:
      capacity: 10000
      max_shards: 50
      min_shards: 1
      max_samples_per_send: 5000
      batch_send_deadline: 5s
      min_backoff: 30ms
      max_backoff: 100ms
    write_relabel_configs:
      # Only send critical metrics to remote storage
      - source_labels: [__name__]
        regex: '(up|http_requests_total|http_request_duration_seconds.*)'
        action: keep

# Remote read for querying long-term storage
remote_read:
  - url: "https://prometheus-remote-storage.example.com/api/v1/read"
    read_recent: true
```

**File-based Service Discovery Target**
```json
// targets/webapp.json
[
  {
    "targets": ["webapp-1:8080", "webapp-2:8080", "webapp-3:8080"],
    "labels": {
      "service": "webapp",
      "env": "production",
      "version": "v1.2.0"
    }
  }
]
```

### 2. Recording Rules

**Aggregation Rules**
```yaml
# rules/recording-rules.yml
groups:
  - name: http_metrics
    interval: 30s
    rules:
      # Request rate per service
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)

      # Request rate per service and status
      - record: job:http_requests:rate5m:status
        expr: sum(rate(http_requests_total[5m])) by (job, status)

      # Success rate (non-5xx responses)
      - record: job:http_requests:success_rate5m
        expr: |
          sum(rate(http_requests_total{status!~"5.."}[5m])) by (job)
          /
          sum(rate(http_requests_total[5m])) by (job)

      # Request duration quantiles
      - record: job:http_request_duration_seconds:p50
        expr: histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m])) by (job, le))

      - record: job:http_request_duration_seconds:p95
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (job, le))

      - record: job:http_request_duration_seconds:p99
        expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (job, le))

  - name: resource_utilization
    interval: 30s
    rules:
      # CPU utilization per instance
      - record: instance:cpu_utilization:rate5m
        expr: |
          100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

      # Memory utilization per instance
      - record: instance:memory_utilization:ratio
        expr: |
          1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)

      # Disk utilization per device
      - record: instance:disk_utilization:ratio
        expr: |
          1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|fuse.*"} / node_filesystem_size_bytes{fstype!~"tmpfs|fuse.*"})

  - name: application_slo
    interval: 1m
    rules:
      # SLO: 99.9% availability
      - record: slo:availability:ratio_5m
        expr: |
          sum(rate(http_requests_total{status!~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))

      # SLO: p95 latency < 500ms
      - record: slo:latency_p95:under_threshold
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) < 0.5

      # Error budget consumption rate
      - record: slo:error_budget:burn_rate_1h
        expr: |
          (1 - slo:availability:ratio_5m) / (1 - 0.999)

  - name: database_metrics
    interval: 30s
    rules:
      # Database connection usage
      - record: db:connections:utilization
        expr: |
          pg_stat_database_numbackends / pg_settings_max_connections

      # Transaction rate
      - record: db:transactions:rate5m
        expr: |
          rate(pg_stat_database_xact_commit[5m]) + rate(pg_stat_database_xact_rollback[5m])

      # Cache hit ratio
      - record: db:cache_hit_ratio
        expr: |
          sum(pg_stat_database_blks_hit) / (sum(pg_stat_database_blks_hit) + sum(pg_stat_database_blks_read))
```

### 3. Alerting Rules

**Production Alert Rules**
```yaml
# alerts/critical-alerts.yml
groups:
  - name: service_health
    interval: 30s
    rules:
      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 2 minutes."
          runbook_url: "https://runbooks.example.com/ServiceDown"

      # High error rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
            /
            sum(rate(http_requests_total[5m])) by (job)
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.job }}."

      # High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (job, le)
          ) > 1
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High latency on {{ $labels.job }}"
          description: "P95 latency is {{ $value }}s on {{ $labels.job }}."

  - name: resource_alerts
    interval: 30s
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: instance:cpu_utilization:rate5m > 80
        for: 10m
        labels:
          severity: warning
          team: infra
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value | humanize }}% on {{ $labels.instance }}."

      # High memory usage
      - alert: HighMemoryUsage
        expr: instance:memory_utilization:ratio > 0.90
        for: 5m
        labels:
          severity: warning
          team: infra
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value | humanizePercentage }} on {{ $labels.instance }}."

      # Disk space critical
      - alert: DiskSpaceCritical
        expr: instance:disk_utilization:ratio > 0.90
        for: 5m
        labels:
          severity: critical
          team: infra
        annotations:
          summary: "Disk space critical on {{ $labels.instance }}"
          description: "Disk usage is {{ $value | humanizePercentage }} on {{ $labels.instance }} {{ $labels.device }}."

  - name: database_alerts
    interval: 30s
    rules:
      # Database connection pool exhaustion
      - alert: DatabaseConnectionPoolExhaustion
        expr: db:connections:utilization > 0.80
        for: 5m
        labels:
          severity: warning
          team: database
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Connection pool is {{ $value | humanizePercentage }} full."

      # Slow queries
      - alert: DatabaseSlowQueries
        expr: rate(pg_stat_statements_mean_exec_time[5m]) > 1000
        for: 10m
        labels:
          severity: warning
          team: database
        annotations:
          summary: "Slow database queries detected"
          description: "Average query time is {{ $value }}ms."

      # Low cache hit ratio
      - alert: DatabaseLowCacheHitRatio
        expr: db:cache_hit_ratio < 0.90
        for: 15m
        labels:
          severity: warning
          team: database
        annotations:
          summary: "Low database cache hit ratio"
          description: "Cache hit ratio is {{ $value | humanizePercentage }}."

  - name: slo_alerts
    interval: 1m
    rules:
      # SLO burn rate
      - alert: ErrorBudgetBurning
        expr: slo:error_budget:burn_rate_1h > 14.4
        for: 5m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Error budget burning too fast"
          description: "Burn rate is {{ $value }}x the allowed rate. At this rate, the entire monthly error budget will be consumed in less than 2 days."

      # Availability SLO breach
      - alert: AvailabilitySLOBreach
        expr: slo:availability:ratio_5m < 0.999
        for: 5m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Availability SLO breach"
          description: "Availability is {{ $value | humanizePercentage }}, below the 99.9% SLO."

  - name: kubernetes_alerts
    interval: 30s
    rules:
      # Pod not ready
      - alert: KubernetesPodNotReady
        expr: |
          sum by (namespace, pod) (kube_pod_status_phase{phase=~"Pending|Unknown|Failed"}) > 0
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} not ready"
          description: "Pod has been in {{ $labels.phase }} state for more than 5 minutes."

      # Container restarts
      - alert: KubernetesContainerRestarting
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Container restarting in {{ $labels.namespace }}/{{ $labels.pod }}"
          description: "Container {{ $labels.container }} is restarting {{ $value }} times per second."

      # Deployment replica mismatch
      - alert: KubernetesDeploymentReplicasMismatch
        expr: |
          kube_deployment_spec_replicas != kube_deployment_status_replicas_available
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Deployment {{ $labels.namespace }}/{{ $labels.deployment }} replica mismatch"
          description: "Deployment has {{ $value }} replicas available, expected {{ $labels.replicas }}."
```

### 4. PromQL Query Examples

**Basic Queries**
```promql
# Current values
up
http_requests_total

# Filter by labels
http_requests_total{job="webapp", status="200"}
http_requests_total{status=~"2.."}
http_requests_total{status!~"2.."}

# Rate of change
rate(http_requests_total[5m])
irate(http_requests_total[1m])  # Instant rate

# Aggregations
sum(rate(http_requests_total[5m]))
sum(rate(http_requests_total[5m])) by (job)
sum(rate(http_requests_total[5m])) by (job, status)
avg(rate(http_requests_total[5m])) by (job)
max(rate(http_requests_total[5m])) by (job)
min(rate(http_requests_total[5m])) by (job)
count(up == 1)

# Quantiles
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (job, le))

# Increase over time
increase(http_requests_total[1h])

# Changes
changes(http_requests_total[1h])
delta(cpu_temp_celsius[5m])

# Math operations
http_requests_total * 2
(http_requests_total + 100) / 1000
```

**Advanced Queries**
```promql
# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))

# Success rate
sum(rate(http_requests_total{status!~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))

# Availability (uptime percentage)
avg_over_time(up[30d]) * 100

# Request rate per second
sum(rate(http_requests_total[5m])) by (job)

# Top 10 endpoints by request count
topk(10, sum(rate(http_requests_total[5m])) by (path))

# Bottom 10 endpoints by request count
bottomk(10, sum(rate(http_requests_total[5m])) by (path))

# Predict disk full time
predict_linear(node_filesystem_avail_bytes[1h], 24 * 3600)

# Anomaly detection (deviation from average)
abs(
  (http_request_duration_seconds - avg_over_time(http_request_duration_seconds[1h]))
  /
  stddev_over_time(http_request_duration_seconds[1h])
) > 3

# Join metrics from different sources
sum(rate(http_requests_total[5m])) by (instance)
/
on(instance) group_left
node_cpu_count

# Absent check (alert if metric missing)
absent(up{job="critical-service"})

# Subquery
max_over_time(rate(http_requests_total[5m])[1h:1m])

# Time comparison (compare to 1 week ago)
http_requests_total - http_requests_total offset 7d
```

### 5. Application Instrumentation

**Node.js with prom-client**
```typescript
// metrics.ts
import express from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const jobDuration = new client.Summary({
  name: 'job_duration_seconds',
  help: 'Duration of background jobs',
  labelNames: ['job_name', 'status'],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register],
});

// Middleware to track request metrics
export function metricsMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const start = Date.now();

  // Track active connections
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });

    activeConnections.dec();
  });

  next();
}

// Metrics endpoint
export function createMetricsHandler() {
  return async (req: express.Request, res: express.Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  };
}

// Business metrics
export const businessMetrics = {
  ordersTotal: new client.Counter({
    name: 'orders_total',
    help: 'Total number of orders',
    labelNames: ['status', 'payment_method'],
    registers: [register],
  }),

  revenueTotal: new client.Counter({
    name: 'revenue_total_cents',
    help: 'Total revenue in cents',
    labelNames: ['currency'],
    registers: [register],
  }),

  activeUsers: new client.Gauge({
    name: 'active_users',
    help: 'Number of active users',
    labelNames: ['tier'],
    registers: [register],
  }),
};

// Track job execution
export async function trackJob<T>(
  jobName: string,
  fn: () => Promise<T>
): Promise<T> {
  const end = jobDuration.startTimer({ job_name: jobName });
  try {
    const result = await fn();
    end({ status: 'success' });
    return result;
  } catch (error) {
    end({ status: 'error' });
    throw error;
  }
}
```

**Go Application**
```go
// metrics.go
package main

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "net/http"
    "time"
)

var (
    httpDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "Duration of HTTP requests",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path", "status"},
    )

    httpRequests = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "path", "status"},
    )

    activeConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "active_connections",
            Help: "Number of active connections",
        },
    )
)

func prometheusMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        activeConnections.Inc()

        // Wrap ResponseWriter to capture status code
        wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}

        next.ServeHTTP(wrapped, r)

        duration := time.Since(start).Seconds()
        status := wrapped.statusCode

        httpDuration.WithLabelValues(r.Method, r.URL.Path, http.StatusText(status)).Observe(duration)
        httpRequests.WithLabelValues(r.Method, r.URL.Path, http.StatusText(status)).Inc()
        activeConnections.Dec()
    })
}

func main() {
    http.Handle("/metrics", promhttp.Handler())
    // ... rest of application
}
```

## Production Best Practices

### 1. Metric Design
- Use consistent naming conventions
- Keep cardinality low (avoid user IDs as labels)
- Use appropriate metric types (Counter, Gauge, Histogram, Summary)
- Add meaningful labels
- Document metrics with help text

### 2. Performance
- Set appropriate scrape intervals
- Use recording rules for expensive queries
- Implement retention policies
- Use remote storage for long-term retention
- Monitor Prometheus resource usage

### 3. High Availability
- Run Prometheus in HA pairs
- Use Thanos or Cortex for multi-cluster
- Implement alertmanager clustering
- Back up Prometheus data regularly

### 4. Security
- Enable TLS for remote endpoints
- Implement authentication
- Use network policies
- Secure alertmanager webhooks

## MCP Connections
None directly, but integrates with monitoring systems

## Auto-Load Triggers
Keywords: `prometheus`, `metrics`, `monitoring`, `promql`, `alerting`, `observability`, `scrape`, `exporter`

## Version History
- 5.1.0: Comprehensive Prometheus monitoring patterns
