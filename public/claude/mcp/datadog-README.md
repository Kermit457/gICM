# Datadog MCP

Comprehensive monitoring and observability platform integration.

## Overview

The Datadog MCP provides complete observability for your applications with metrics, traces, logs, and real-user monitoring. Monitor performance, track errors, and gain insights into your infrastructure and applications.

## Installation

```bash
npm install -g @datadog/mcp-server
```

## Environment Variables

```bash
DD_API_KEY=your_datadog_api_key
DD_APP_KEY=your_datadog_app_key
DD_SITE=datadoghq.com  # or datadoghq.eu for EU
```

Get your API keys from: https://app.datadoghq.com/organization-settings/api-keys

## Features

- **Infrastructure Monitoring**: Real-time metrics from servers, containers, databases
- **APM (Application Performance Monitoring)**: Distributed tracing, service maps
- **Log Management**: Centralized log aggregation and analysis
- **Real User Monitoring**: Frontend performance tracking
- **Synthetics**: API and browser tests
- **Alerting**: Smart alerts with anomaly detection
- **Dashboards**: Customizable visualizations

## Usage Examples

### Track Custom Metrics

```typescript
import { datadogMetrics } from '@datadog/mcp';

// Track blockchain transaction volume
await datadogMetrics.gauge('solana.transactions.volume', {
  value: txCount,
  tags: ['program:token_launcher', 'network:mainnet']
});

// Track API latency
await datadogMetrics.histogram('api.response_time', {
  value: responseTime,
  tags: ['endpoint:/api/launch', 'method:POST']
});
```

### Monitor Service Health

```typescript
// Send service check
await datadog.serviceCheck('token_launcher.health', {
  status: 'ok',
  message: 'All systems operational',
  tags: ['env:production']
});
```

### Query Metrics

```typescript
// Get average response time over last hour
const metrics = await datadog.queryMetrics({
  query: 'avg:api.response_time{endpoint:/api/launch}',
  from: Date.now() - 3600000,
  to: Date.now()
});
```

### Create Dashboard

```typescript
const dashboard = await datadog.createDashboard({
  title: 'Token Launch Platform',
  widgets: [
    {
      definition: {
        type: 'timeseries',
        requests: [{
          q: 'avg:solana.transactions.volume{*}'
        }],
        title: 'Transaction Volume'
      }
    }
  ]
});
```

## Tools Provided

- `datadog_send_metric` - Send custom metrics
- `datadog_query_metrics` - Query historical metrics
- `datadog_create_event` - Create events
- `datadog_get_monitors` - List monitors
- `datadog_create_monitor` - Create alert monitor
- `datadog_query_logs` - Search logs
- `datadog_create_dashboard` - Create dashboard

## Integration Patterns

**Next.js Middleware:**
```typescript
import { datadogTracer } from '@datadog/mcp';

export async function middleware(req: NextRequest) {
  const span = datadogTracer.startSpan('http.request');
  span.setTag('http.url', req.url);

  const response = await next();

  span.setTag('http.status_code', response.status);
  span.finish();

  return response;
}
```

**Error Tracking:**
```typescript
try {
  await launchToken(params);
} catch (error) {
  await datadog.logError(error, {
    tags: {
      service: 'token-launcher',
      env: 'production',
      error_type: error.constructor.name
    }
  });
  throw error;
}
```

## Web3 Use Cases

- **Transaction monitoring**: Track transaction success rates, gas usage
- **Smart contract performance**: Monitor contract call latency
- **RPC health**: Track RPC endpoint availability and response times
- **Wallet metrics**: Monitor wallet connection success rates
- **DeFi analytics**: Track TVL, volume, user activity
- **Network monitoring**: Solana/Ethereum network metrics

## Best Practices

1. **Tag everything**: Use consistent tags for filtering (env, service, version)
2. **Set up monitors**: Create alerts for critical metrics
3. **Use APM**: Enable distributed tracing for full request flows
4. **Log correlation**: Link logs to traces for debugging
5. **Custom dashboards**: Build dashboards for key business metrics

## Repository

https://github.com/DataDog/mcp-server

---

**Version:** 1.0.0
**Category:** Monitoring & Observability
**Last Updated:** 2025-01-08
