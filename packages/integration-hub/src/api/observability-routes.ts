/**
 * Observability API Routes
 * Phase 12D: Tracing, Metrics & Logging endpoints
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getObservabilityManager,
  createObservabilityManager,
  type TraceQuery,
  type MetricQuery,
  type LogQuery,
} from "../observability/index.js";

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function observabilityRoutes(fastify: FastifyInstance): Promise<void> {
  // Initialize manager if not already initialized
  let observability = getObservabilityManager();
  if (!observability) {
    observability = createObservabilityManager({
      serviceName: "integration-hub",
      environment: process.env.NODE_ENV ?? "development",
    });
  }

  // ===========================================================================
  // STATUS & HEALTH
  // ===========================================================================

  /**
   * GET /api/observability/status
   * Get observability status
   */
  fastify.get("/api/observability/status", async (_request, reply) => {
    const health = observability!.getHealth();

    return reply.send({
      success: true,
      data: health,
    });
  });

  /**
   * GET /api/observability/summary
   * Get observability summary
   */
  fastify.get("/api/observability/summary", async (_request, reply) => {
    const summary = observability!.getSummary();

    return reply.send({
      success: true,
      data: summary,
    });
  });

  // ===========================================================================
  // TRACES
  // ===========================================================================

  /**
   * GET /api/observability/traces
   * Search traces
   */
  fastify.get(
    "/api/observability/traces",
    async (
      request: FastifyRequest<{
        Querystring: {
          serviceName?: string;
          operationName?: string;
          minDuration?: string;
          maxDuration?: string;
          startTime?: string;
          endTime?: string;
          limit?: string;
          tags?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const query: Omit<TraceQuery, "traceId"> = {
        serviceName: request.query.serviceName,
        operationName: request.query.operationName,
        minDuration: request.query.minDuration ? parseInt(request.query.minDuration, 10) : undefined,
        maxDuration: request.query.maxDuration ? parseInt(request.query.maxDuration, 10) : undefined,
        startTime: request.query.startTime ? parseInt(request.query.startTime, 10) : undefined,
        endTime: request.query.endTime ? parseInt(request.query.endTime, 10) : undefined,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : 100,
      };

      // Parse tags if provided
      if (request.query.tags) {
        try {
          query.tags = JSON.parse(request.query.tags);
        } catch {
          // Ignore parse errors
        }
      }

      const traces = observability!.searchTraces(query);

      return reply.send({
        success: true,
        data: traces,
        count: traces.length,
      });
    }
  );

  /**
   * GET /api/observability/traces/:traceId
   * Get specific trace
   */
  fastify.get(
    "/api/observability/traces/:traceId",
    async (
      request: FastifyRequest<{ Params: { traceId: string } }>,
      reply: FastifyReply
    ) => {
      const trace = observability!.getTrace(request.params.traceId);

      if (!trace) {
        return reply.status(404).send({
          success: false,
          error: "Trace not found",
        });
      }

      return reply.send({
        success: true,
        data: trace,
      });
    }
  );

  /**
   * GET /api/observability/traces/:traceId/logs
   * Get logs for a trace
   */
  fastify.get(
    "/api/observability/traces/:traceId/logs",
    async (
      request: FastifyRequest<{ Params: { traceId: string } }>,
      reply: FastifyReply
    ) => {
      const logs = observability!.queryLogs({
        traceId: request.params.traceId,
      });

      return reply.send({
        success: true,
        data: logs,
        count: logs.length,
      });
    }
  );

  // ===========================================================================
  // METRICS
  // ===========================================================================

  /**
   * GET /api/observability/metrics
   * Get all metrics
   */
  fastify.get("/api/observability/metrics", async (_request, reply) => {
    const metrics = observability!.getAllMetrics();

    return reply.send({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  });

  /**
   * GET /api/observability/metrics/:name
   * Get specific metric
   */
  fastify.get(
    "/api/observability/metrics/:name",
    async (
      request: FastifyRequest<{
        Params: { name: string };
        Querystring: {
          labels?: string;
          startTime?: string;
          endTime?: string;
          step?: string;
          aggregation?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const query: MetricQuery = {
        name: request.params.name,
        startTime: request.query.startTime ? parseInt(request.query.startTime, 10) : undefined,
        endTime: request.query.endTime ? parseInt(request.query.endTime, 10) : undefined,
        step: request.query.step ? parseInt(request.query.step, 10) : undefined,
        aggregation: request.query.aggregation as any,
      };

      // Parse labels if provided
      if (request.query.labels) {
        try {
          query.labels = JSON.parse(request.query.labels);
        } catch {
          // Ignore parse errors
        }
      }

      const metric = observability!.queryMetrics(query);

      if (!metric) {
        return reply.status(404).send({
          success: false,
          error: "Metric not found",
        });
      }

      return reply.send({
        success: true,
        data: metric,
      });
    }
  );

  /**
   * GET /api/observability/metrics/prometheus
   * Export metrics in Prometheus format
   */
  fastify.get("/api/observability/metrics/prometheus", async (_request, reply) => {
    const prometheus = observability!.getPrometheusMetrics();

    return reply
      .header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
      .send(prometheus);
  });

  /**
   * POST /api/observability/metrics/record
   * Record a metric value
   */
  fastify.post(
    "/api/observability/metrics/record",
    async (
      request: FastifyRequest<{
        Body: {
          name: string;
          value: number;
          labels?: Record<string, string>;
        };
      }>,
      reply: FastifyReply
    ) => {
      observability!.recordMetric(
        request.body.name,
        request.body.value,
        request.body.labels
      );

      return reply.send({
        success: true,
        message: "Metric recorded",
      });
    }
  );

  // ===========================================================================
  // LOGS
  // ===========================================================================

  /**
   * GET /api/observability/logs
   * Query logs
   */
  fastify.get(
    "/api/observability/logs",
    async (
      request: FastifyRequest<{
        Querystring: {
          traceId?: string;
          spanId?: string;
          serviceName?: string;
          severity?: string;
          bodyContains?: string;
          startTime?: string;
          endTime?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const query: LogQuery = {
        traceId: request.query.traceId,
        spanId: request.query.spanId,
        serviceName: request.query.serviceName,
        severity: request.query.severity as any,
        bodyContains: request.query.bodyContains,
        startTime: request.query.startTime ? parseInt(request.query.startTime, 10) : undefined,
        endTime: request.query.endTime ? parseInt(request.query.endTime, 10) : undefined,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : 100,
      };

      const logs = observability!.queryLogs(query);

      return reply.send({
        success: true,
        data: logs,
        count: logs.length,
      });
    }
  );

  /**
   * POST /api/observability/logs
   * Record a log entry
   */
  fastify.post(
    "/api/observability/logs",
    async (
      request: FastifyRequest<{
        Body: {
          severity: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
          message: string;
          attributes?: Record<string, string | number | boolean>;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { severity, message, attributes } = request.body;

      switch (severity) {
        case "TRACE":
          observability!.logTrace(message, attributes);
          break;
        case "DEBUG":
          observability!.logDebug(message, attributes);
          break;
        case "INFO":
          observability!.logInfo(message, attributes);
          break;
        case "WARN":
          observability!.logWarn(message, attributes);
          break;
        case "ERROR":
          observability!.logError(message, undefined, attributes);
          break;
        case "FATAL":
          observability!.logFatal(message, undefined, attributes);
          break;
      }

      return reply.send({
        success: true,
        message: "Log recorded",
      });
    }
  );

  // ===========================================================================
  // SPANS
  // ===========================================================================

  /**
   * POST /api/observability/spans/start
   * Start a new span (for external clients)
   */
  fastify.post(
    "/api/observability/spans/start",
    async (
      request: FastifyRequest<{
        Body: {
          name: string;
          kind?: "INTERNAL" | "SERVER" | "CLIENT" | "PRODUCER" | "CONSUMER";
          parentTraceId?: string;
          parentSpanId?: string;
          attributes?: Record<string, string | number | boolean>;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { name, kind, parentTraceId, parentSpanId, attributes } = request.body;

      const span = observability!.startSpan(name, {
        kind,
        context: parentTraceId && parentSpanId
          ? { traceId: parentTraceId, spanId: parentSpanId, traceFlags: 1 }
          : undefined,
        attributes,
      });

      const context = span.getContext();

      return reply.send({
        success: true,
        data: {
          traceId: context.traceId,
          spanId: context.spanId,
          parentSpanId: context.parentSpanId,
        },
      });
    }
  );

  /**
   * POST /api/observability/spans/end
   * End a span (for external clients)
   */
  fastify.post(
    "/api/observability/spans/end",
    async (
      request: FastifyRequest<{
        Body: {
          traceId: string;
          spanId: string;
          status?: "OK" | "ERROR" | "UNSET";
          statusMessage?: string;
          attributes?: Record<string, string | number | boolean>;
        };
      }>,
      reply: FastifyReply
    ) => {
      // Note: In a real implementation, we'd look up the active span
      // For now, this is a simplified version

      return reply.send({
        success: true,
        message: "Span ended",
      });
    }
  );

  // ===========================================================================
  // ADMIN
  // ===========================================================================

  /**
   * POST /api/observability/reset
   * Reset all observability data
   */
  fastify.post("/api/observability/reset", async (_request, reply) => {
    observability!.reset();

    return reply.send({
      success: true,
      message: "Observability data reset",
    });
  });

  /**
   * GET /api/observability/config
   * Get observability configuration
   */
  fastify.get("/api/observability/config", async (_request, reply) => {
    const config = observability!.getConfig();

    // Remove sensitive info
    const safeConfig = {
      serviceName: config.serviceName,
      serviceVersion: config.serviceVersion,
      environment: config.environment,
      tracing: {
        enabled: config.tracing.enabled,
        sampler: config.tracing.sampler,
      },
      metrics: {
        enabled: config.metrics.enabled,
        collectInterval: config.metrics.collectInterval,
      },
      logging: {
        enabled: config.logging.enabled,
        minSeverity: config.logging.minSeverity,
      },
      retention: config.retention,
    };

    return reply.send({
      success: true,
      data: safeConfig,
    });
  });
}

export default observabilityRoutes;
