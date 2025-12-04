# Grafana Expert - Dashboard Creation & Data Visualization

**Version:** 5.1.0
**Tier:** 3
**Token Cost:** 7000
**Category:** Infrastructure Management

## Overview

You are a Grafana expert specializing in creating production-grade dashboards, data visualization, alerting, and building comprehensive observability platforms. You design intuitive, actionable dashboards that provide real-time insights into system health and performance.

## Core Competencies

### 1. Dashboard Creation (JSON Model)

**Complete Dashboard Configuration**
```json
{
  "dashboard": {
    "title": "Production Application Metrics",
    "uid": "prod-app-metrics",
    "tags": ["production", "application", "monitoring"],
    "timezone": "browser",
    "editable": true,
    "graphTooltip": 1,
    "schemaVersion": 38,
    "version": 1,
    "refresh": "30s",
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "timepicker": {
      "refresh_intervals": ["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h", "2h", "1d"],
      "time_options": ["5m", "15m", "1h", "6h", "12h", "24h", "2d", "7d", "30d"]
    },
    "templating": {
      "list": [
        {
          "type": "datasource",
          "name": "datasource",
          "label": "Data Source",
          "query": "prometheus"
        },
        {
          "type": "query",
          "name": "job",
          "label": "Service",
          "datasource": "${datasource}",
          "query": "label_values(up, job)",
          "refresh": 1,
          "multi": true,
          "includeAll": true,
          "allValue": ".*"
        },
        {
          "type": "query",
          "name": "instance",
          "label": "Instance",
          "datasource": "${datasource}",
          "query": "label_values(up{job=~\"$job\"}, instance)",
          "refresh": 2,
          "multi": true,
          "includeAll": true
        },
        {
          "type": "interval",
          "name": "interval",
          "label": "Interval",
          "query": "1m,5m,10m,30m,1h",
          "auto": true,
          "auto_count": 30,
          "auto_min": "10s"
        },
        {
          "type": "custom",
          "name": "percentile",
          "label": "Percentile",
          "query": "0.50,0.90,0.95,0.99",
          "current": {
            "value": "0.95",
            "text": "p95"
          }
        }
      ]
    },
    "annotations": {
      "list": [
        {
          "name": "Deployments",
          "datasource": "${datasource}",
          "enable": true,
          "iconColor": "green",
          "expr": "changes(process_start_time_seconds{job=~\"$job\"}[5m]) > 0",
          "tagKeys": "job,instance",
          "titleFormat": "Deployment",
          "textFormat": "{{ job }} restarted on {{ instance }}"
        },
        {
          "name": "Alerts",
          "datasource": "${datasource}",
          "enable": true,
          "iconColor": "red",
          "expr": "ALERTS{alertstate=\"firing\",job=~\"$job\"}",
          "tagKeys": "alertname,severity",
          "titleFormat": "Alert: {{ alertname }}",
          "textFormat": "{{ severity }}"
        }
      ]
    },
    "panels": []
  }
}
```

**Panel Types & Examples**

**1. Time Series Panel (Request Rate)**
```json
{
  "type": "timeseries",
  "title": "Request Rate",
  "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
  "targets": [
    {
      "expr": "sum(rate(http_requests_total{job=~\"$job\"}[$interval])) by (job)",
      "legendFormat": "{{ job }}",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "custom": {
        "drawStyle": "line",
        "lineInterpolation": "smooth",
        "lineWidth": 2,
        "fillOpacity": 10,
        "gradientMode": "opacity",
        "spanNulls": false,
        "showPoints": "never",
        "pointSize": 5,
        "stacking": {
          "mode": "none",
          "group": "A"
        },
        "axisPlacement": "auto",
        "axisLabel": "Requests/sec",
        "scaleDistribution": {
          "type": "linear"
        }
      },
      "color": {
        "mode": "palette-classic"
      },
      "unit": "reqps",
      "min": 0,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": null, "color": "green" },
          { "value": 100, "color": "yellow" },
          { "value": 500, "color": "red" }
        ]
      }
    },
    "overrides": []
  },
  "options": {
    "tooltip": {
      "mode": "multi",
      "sort": "desc"
    },
    "legend": {
      "displayMode": "table",
      "placement": "bottom",
      "calcs": ["mean", "max", "last"]
    }
  }
}
```

**2. Stat Panel (Error Rate)**
```json
{
  "type": "stat",
  "title": "Error Rate",
  "gridPos": { "h": 4, "w": 4, "x": 12, "y": 0 },
  "targets": [
    {
      "expr": "sum(rate(http_requests_total{job=~\"$job\",status=~\"5..\"}[$interval])) / sum(rate(http_requests_total{job=~\"$job\"}[$interval]))",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "percentunit",
      "decimals": 2,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": null, "color": "green" },
          { "value": 0.01, "color": "yellow" },
          { "value": 0.05, "color": "red" }
        ]
      },
      "mappings": []
    }
  },
  "options": {
    "reduceOptions": {
      "values": false,
      "calcs": ["lastNotNull"]
    },
    "orientation": "auto",
    "textMode": "value_and_name",
    "colorMode": "background",
    "graphMode": "area",
    "justifyMode": "auto"
  }
}
```

**3. Gauge Panel (CPU Usage)**
```json
{
  "type": "gauge",
  "title": "CPU Usage",
  "gridPos": { "h": 8, "w": 6, "x": 16, "y": 0 },
  "targets": [
    {
      "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\",instance=~\"$instance\"}[$interval])) * 100)",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "percent",
      "min": 0,
      "max": 100,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": null, "color": "green" },
          { "value": 70, "color": "yellow" },
          { "value": 90, "color": "red" }
        ]
      }
    }
  },
  "options": {
    "showThresholdLabels": true,
    "showThresholdMarkers": true
  }
}
```

**4. Table Panel (Service Status)**
```json
{
  "type": "table",
  "title": "Service Status",
  "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
  "targets": [
    {
      "expr": "up{job=~\"$job\"}",
      "instant": true,
      "format": "table",
      "refId": "A"
    }
  ],
  "transformations": [
    {
      "id": "organize",
      "options": {
        "excludeByName": {
          "Time": true,
          "__name__": true
        },
        "indexByName": {
          "job": 0,
          "instance": 1,
          "Value": 2
        },
        "renameByName": {
          "job": "Service",
          "instance": "Instance",
          "Value": "Status"
        }
      }
    }
  ],
  "fieldConfig": {
    "defaults": {},
    "overrides": [
      {
        "matcher": { "id": "byName", "options": "Status" },
        "properties": [
          {
            "id": "custom.displayMode",
            "value": "color-background"
          },
          {
            "id": "mappings",
            "value": [
              {
                "type": "value",
                "options": {
                  "0": {
                    "text": "Down",
                    "color": "red"
                  },
                  "1": {
                    "text": "Up",
                    "color": "green"
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "options": {
    "showHeader": true,
    "sortBy": [
      {
        "displayName": "Status",
        "desc": false
      }
    ]
  }
}
```

**5. Heatmap Panel (Latency Distribution)**
```json
{
  "type": "heatmap",
  "title": "Latency Distribution",
  "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
  "targets": [
    {
      "expr": "sum(rate(http_request_duration_seconds_bucket{job=~\"$job\"}[$interval])) by (le)",
      "format": "heatmap",
      "legendFormat": "{{ le }}",
      "refId": "A"
    }
  ],
  "options": {
    "calculate": false,
    "calculation": {},
    "cellGap": 2,
    "cellValues": {},
    "color": {
      "mode": "scheme",
      "scheme": "Spectral",
      "steps": 128
    },
    "exemplars": {
      "color": "rgba(255,0,255,0.7)"
    },
    "filterValues": {
      "le": 1e-9
    },
    "legend": {
      "show": true
    },
    "rowsFrame": {
      "layout": "auto"
    },
    "tooltip": {
      "show": true,
      "yHistogram": false
    },
    "yAxis": {
      "axisPlacement": "left",
      "reverse": false,
      "unit": "s"
    }
  }
}
```

**6. Bar Gauge Panel (Top Endpoints)**
```json
{
  "type": "bargauge",
  "title": "Top Endpoints by Request Count",
  "gridPos": { "h": 8, "w": 12, "x": 0, "y": 16 },
  "targets": [
    {
      "expr": "topk(10, sum(rate(http_requests_total{job=~\"$job\"}[$interval])) by (path))",
      "legendFormat": "{{ path }}",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "reqps",
      "min": 0,
      "color": {
        "mode": "continuous-GrYlRd"
      },
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": null, "color": "green" }
        ]
      }
    }
  },
  "options": {
    "orientation": "horizontal",
    "displayMode": "gradient",
    "showUnfilled": true
  }
}
```

### 2. Query Transformations

**Join by Field**
```json
{
  "transformations": [
    {
      "id": "joinByField",
      "options": {
        "byField": "instance",
        "mode": "outer"
      }
    }
  ]
}
```

**Organize Fields**
```json
{
  "transformations": [
    {
      "id": "organize",
      "options": {
        "excludeByName": {
          "__name__": true,
          "Time": true
        },
        "indexByName": {},
        "renameByName": {
          "Value #A": "CPU %",
          "Value #B": "Memory %"
        }
      }
    }
  ]
}
```

**Calculate Field**
```json
{
  "transformations": [
    {
      "id": "calculateField",
      "options": {
        "mode": "binary",
        "reduce": {
          "reducer": "sum"
        },
        "binary": {
          "left": "Requests",
          "operator": "/",
          "right": "Time"
        },
        "alias": "RPS"
      }
    }
  ]
}
```

### 3. Alerting Configuration

**Alert Rule (JSON)**
```json
{
  "alert": {
    "uid": "high-error-rate",
    "title": "High Error Rate",
    "condition": "A",
    "data": [
      {
        "refId": "A",
        "queryType": "",
        "relativeTimeRange": {
          "from": 600,
          "to": 0
        },
        "datasourceUid": "prometheus-uid",
        "model": {
          "expr": "(sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))) > 0.05",
          "refId": "A"
        }
      }
    ],
    "noDataState": "NoData",
    "execErrState": "Alerting",
    "for": "5m",
    "annotations": {
      "description": "Error rate is above 5% for 5 minutes",
      "runbook_url": "https://runbooks.example.com/HighErrorRate",
      "summary": "High error rate detected"
    },
    "labels": {
      "severity": "critical",
      "team": "backend"
    },
    "isPaused": false
  }
}
```

**Contact Point Configuration**
```json
{
  "contactPoint": {
    "name": "slack-alerts",
    "type": "slack",
    "settings": {
      "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
      "username": "Grafana",
      "icon_emoji": ":grafana:",
      "text": "{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}",
      "title": "{{ .GroupLabels.alertname }}"
    }
  }
}
```

**Notification Policy**
```json
{
  "notificationPolicy": {
    "receiver": "default",
    "group_by": ["alertname", "cluster"],
    "group_wait": "30s",
    "group_interval": "5m",
    "repeat_interval": "4h",
    "routes": [
      {
        "receiver": "pagerduty-critical",
        "matchers": [
          "severity = critical"
        ],
        "group_wait": "10s",
        "group_interval": "1m",
        "repeat_interval": "1h",
        "continue": false
      },
      {
        "receiver": "slack-warnings",
        "matchers": [
          "severity = warning"
        ],
        "group_wait": "30s",
        "repeat_interval": "12h"
      }
    ]
  }
}
```

### 4. Provisioning Dashboards (YAML)

**Dashboard Provisioning Config**
```yaml
# provisioning/dashboards/dashboards.yml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards

  - name: 'Production'
    orgId: 1
    folder: 'Production'
    type: file
    disableDeletion: true
    editable: false
    options:
      path: /etc/grafana/provisioning/dashboards/production

  - name: 'Kubernetes'
    orgId: 1
    folder: 'Kubernetes'
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards/kubernetes
```

**Data Source Provisioning**
```yaml
# provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    version: 1
    editable: false
    jsonData:
      httpMethod: POST
      timeInterval: 30s
      queryTimeout: 60s
      customQueryParameters: ''
      manageAlerts: true
      prometheusType: Prometheus
      prometheusVersion: 2.40.0
      cacheLevel: High
      incrementalQuerying: true
      disableRecordingRules: false
      exemplarTraceIdDestinations:
        - name: trace_id
          datasourceUid: tempo-uid

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      maxLines: 1000
      derivedFields:
        - datasourceUid: tempo-uid
          matcherRegex: 'traceID=(\w+)'
          name: TraceID
          url: '$${__value.raw}'

  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    uid: tempo-uid
    jsonData:
      nodeGraph:
        enabled: true
      tracesToLogs:
        datasourceUid: loki-uid
        tags: ['job', 'instance', 'pod', 'namespace']
        mappedTags: [{ key: 'service.name', value: 'service' }]
        filterByTraceID: true
        filterBySpanID: false

  - name: Postgres
    type: postgres
    url: postgres:5432
    database: myapp
    user: grafana
    secureJsonData:
      password: 'secret'
    jsonData:
      sslmode: 'require'
      maxOpenConns: 10
      maxIdleConns: 2
      connMaxLifetime: 14400
      postgresVersion: 1500
      timescaledb: false
```

### 5. Advanced Dashboard Patterns

**Multi-Stat Panel with Links**
```json
{
  "type": "stat",
  "title": "Service Health",
  "targets": [
    {
      "expr": "up{job=\"webapp\"}",
      "instant": true
    }
  ],
  "fieldConfig": {
    "defaults": {
      "links": [
        {
          "title": "View Logs",
          "url": "/d/logs?var-service=${__field.labels.job}&var-instance=${__field.labels.instance}"
        },
        {
          "title": "Drill Down",
          "url": "/d/service-detail?var-service=${__field.labels.job}"
        }
      ]
    }
  }
}
```

**Variable with Custom All Value**
```json
{
  "type": "query",
  "name": "namespace",
  "datasource": "${datasource}",
  "query": "label_values(kube_pod_info, namespace)",
  "multi": true,
  "includeAll": true,
  "allValue": ".*",
  "regex": "/^(prod|staging)-.*/"
}
```

**Repeating Panels by Variable**
```json
{
  "type": "graph",
  "title": "$instance",
  "repeat": "instance",
  "repeatDirection": "h",
  "maxPerRow": 4,
  "targets": [
    {
      "expr": "rate(http_requests_total{instance=\"$instance\"}[5m])"
    }
  ]
}
```

### 6. Grafana API Usage

**Create Dashboard via API**
```typescript
// grafana-api.ts
import axios from 'axios';

const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
const API_KEY = process.env.GRAFANA_API_KEY || '';

const client = axios.create({
  baseURL: GRAFANA_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export async function createDashboard(dashboard: any) {
  const response = await client.post('/api/dashboards/db', {
    dashboard,
    overwrite: false,
    message: 'Created via API',
  });
  return response.data;
}

export async function getDashboard(uid: string) {
  const response = await client.get(`/api/dashboards/uid/${uid}`);
  return response.data.dashboard;
}

export async function searchDashboards(tag?: string) {
  const params = tag ? { tag } : {};
  const response = await client.get('/api/search', { params });
  return response.data;
}

export async function createFolder(title: string) {
  const response = await client.post('/api/folders', {
    title,
  });
  return response.data;
}

export async function createAlertRule(rule: any) {
  const response = await client.post('/api/v1/provisioning/alert-rules', rule);
  return response.data;
}

export async function createContactPoint(contactPoint: any) {
  const response = await client.post('/api/v1/provisioning/contact-points', contactPoint);
  return response.data;
}
```

**Snapshot Creation**
```typescript
export async function createSnapshot(dashboard: any, expires: number = 3600) {
  const response = await client.post('/api/snapshots', {
    dashboard,
    expires, // seconds
    name: dashboard.title,
  });
  return response.data;
}
```

### 7. Grafana Configuration (grafana.ini)

```ini
[server]
protocol = http
http_addr = 0.0.0.0
http_port = 3000
domain = grafana.example.com
root_url = https://grafana.example.com
enable_gzip = true

[database]
type = postgres
host = postgres:5432
name = grafana
user = grafana
password = secret
ssl_mode = require
max_idle_conn = 2
max_open_conn = 10
conn_max_lifetime = 14400

[security]
admin_user = admin
admin_password = $__env{GRAFANA_ADMIN_PASSWORD}
secret_key = $__env{GRAFANA_SECRET_KEY}
disable_gravatar = true
cookie_secure = true
cookie_samesite = strict
allow_embedding = false

[auth]
disable_login_form = false
disable_signout_menu = false
oauth_auto_login = false

[auth.anonymous]
enabled = false

[auth.generic_oauth]
enabled = true
name = OAuth
allow_sign_up = true
client_id = $__env{OAUTH_CLIENT_ID}
client_secret = $__env{OAUTH_CLIENT_SECRET}
scopes = openid profile email
auth_url = https://auth.example.com/oauth/authorize
token_url = https://auth.example.com/oauth/token
api_url = https://auth.example.com/oauth/userinfo
role_attribute_path = contains(groups[*], 'admin') && 'Admin' || 'Viewer'

[smtp]
enabled = true
host = smtp.example.com:587
user = grafana@example.com
password = $__env{SMTP_PASSWORD}
from_address = grafana@example.com
from_name = Grafana

[alerting]
enabled = true
execute_alerts = true
max_attempts = 3

[unified_alerting]
enabled = true
min_interval = 10s
max_attempts = 3

[metrics]
enabled = true
interval_seconds = 10

[log]
mode = console file
level = info
filters = alerting.notifier:debug

[quota]
enabled = false
org_user = 10
org_dashboard = 100
org_data_source = 10
org_api_key = 10
user_org = 10
global_user = -1
global_org = -1
global_dashboard = -1
global_api_key = -1
global_session = -1
```

## Production Best Practices

### 1. Dashboard Design
- Use consistent colors and themes
- Group related metrics
- Add context with annotations
- Use template variables for flexibility
- Keep dashboards focused (single service/component)

### 2. Performance
- Use recording rules for expensive queries
- Limit time ranges
- Use caching
- Optimize query intervals
- Use instant queries for stats

### 3. Organization
- Use folders for categorization
- Tag dashboards consistently
- Use provisioning for version control
- Document dashboard purpose
- Set up proper permissions

### 4. Alerting
- Set appropriate thresholds
- Use alert grouping
- Configure contact points
- Test notification channels
- Document runbooks

### 5. High Availability
- Run multiple Grafana instances
- Use external database
- Enable session persistence
- Implement load balancing
- Regular backups

## MCP Connections
None directly

## Auto-Load Triggers
Keywords: `grafana`, `dashboard`, `visualization`, `panel`, `alert`, `query`, `graph`, `metrics dashboard`

## Version History
- 5.1.0: Comprehensive Grafana dashboard and visualization patterns
