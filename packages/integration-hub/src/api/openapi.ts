/**
 * OpenAPI Specification Generator
 * Generates OpenAPI 3.1 documentation for the Integration Hub API
 */

import { z } from "zod";

// OpenAPI specification
export const openAPISpec = {
  openapi: "3.1.0",
  info: {
    title: "gICM Integration Hub API",
    version: "1.0.0",
    description: `
# gICM Integration Hub API

The Integration Hub API provides programmatic access to pipeline management,
execution, scheduling, and monitoring capabilities.

## Authentication

All API endpoints require authentication via API key. Include your API key
in the \`X-API-Key\` header:

\`\`\`
X-API-Key: your-api-key-here
\`\`\`

## Rate Limits

- Standard tier: 100 requests/minute
- Pro tier: 1000 requests/minute
- Enterprise: Custom limits

## Webhooks

Configure webhooks to receive real-time notifications about pipeline events.
See the Webhooks section for available event types.
    `,
    contact: {
      name: "gICM Support",
      email: "support@gicm.dev",
      url: "https://gicm.dev",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local development server",
    },
    {
      url: "https://api.gicm.dev",
      description: "Production server",
    },
  ],
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Pipelines", description: "Pipeline management" },
    { name: "Executions", description: "Pipeline execution and monitoring" },
    { name: "Schedules", description: "Pipeline scheduling" },
    { name: "Analytics", description: "Usage analytics and metrics" },
    { name: "Budgets", description: "Cost budgets and alerts" },
    { name: "Webhooks", description: "Webhook management" },
    { name: "Marketplace", description: "Template marketplace" },
  ],
  paths: {
    // Health endpoints
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns the health status of the API",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },

    // Pipeline endpoints
    "/api/pipelines": {
      get: {
        tags: ["Pipelines"],
        summary: "List pipelines",
        description: "Retrieve a list of all pipelines",
        operationId: "listPipelines",
        security: [{ apiKey: [] }],
        parameters: [
          { $ref: "#/components/parameters/PageParam" },
          { $ref: "#/components/parameters/LimitParam" },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "paused", "archived"] },
          },
        ],
        responses: {
          "200": {
            description: "List of pipelines",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PipelineList" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Pipelines"],
        summary: "Create pipeline",
        description: "Create a new pipeline",
        operationId: "createPipeline",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePipeline" },
            },
          },
        },
        responses: {
          "201": {
            description: "Pipeline created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Pipeline" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    "/api/pipelines/{id}": {
      get: {
        tags: ["Pipelines"],
        summary: "Get pipeline",
        description: "Retrieve a pipeline by ID",
        operationId: "getPipeline",
        security: [{ apiKey: [] }],
        parameters: [{ $ref: "#/components/parameters/PipelineId" }],
        responses: {
          "200": {
            description: "Pipeline details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Pipeline" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Pipelines"],
        summary: "Update pipeline",
        description: "Update an existing pipeline",
        operationId: "updatePipeline",
        security: [{ apiKey: [] }],
        parameters: [{ $ref: "#/components/parameters/PipelineId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePipeline" },
            },
          },
        },
        responses: {
          "200": {
            description: "Pipeline updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Pipeline" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Pipelines"],
        summary: "Delete pipeline",
        description: "Delete a pipeline",
        operationId: "deletePipeline",
        security: [{ apiKey: [] }],
        parameters: [{ $ref: "#/components/parameters/PipelineId" }],
        responses: {
          "204": { description: "Pipeline deleted" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // Execution endpoints
    "/api/pipelines/{id}/execute": {
      post: {
        tags: ["Executions"],
        summary: "Execute pipeline",
        description: "Start a new pipeline execution",
        operationId: "executePipeline",
        security: [{ apiKey: [] }],
        parameters: [{ $ref: "#/components/parameters/PipelineId" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExecuteRequest" },
            },
          },
        },
        responses: {
          "202": {
            description: "Execution started",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Execution" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/executions/{id}": {
      get: {
        tags: ["Executions"],
        summary: "Get execution",
        description: "Get execution status and details",
        operationId: "getExecution",
        security: [{ apiKey: [] }],
        parameters: [{ $ref: "#/components/parameters/ExecutionId" }],
        responses: {
          "200": {
            description: "Execution details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Execution" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/executions/{id}/cancel": {
      post: {
        tags: ["Executions"],
        summary: "Cancel execution",
        description: "Cancel a running execution",
        operationId: "cancelExecution",
        security: [{ apiKey: [] }],
        parameters: [{ $ref: "#/components/parameters/ExecutionId" }],
        responses: {
          "200": {
            description: "Execution cancelled",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Execution" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // Schedule endpoints
    "/api/schedules": {
      get: {
        tags: ["Schedules"],
        summary: "List schedules",
        description: "List all pipeline schedules",
        operationId: "listSchedules",
        security: [{ apiKey: [] }],
        responses: {
          "200": {
            description: "List of schedules",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScheduleList" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Schedules"],
        summary: "Create schedule",
        description: "Create a new pipeline schedule",
        operationId: "createSchedule",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSchedule" },
            },
          },
        },
        responses: {
          "201": {
            description: "Schedule created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Schedule" },
              },
            },
          },
        },
      },
    },

    // Analytics endpoints
    "/api/analytics/summary": {
      get: {
        tags: ["Analytics"],
        summary: "Get analytics summary",
        description: "Get aggregated analytics for all pipelines",
        operationId: "getAnalyticsSummary",
        security: [{ apiKey: [] }],
        parameters: [
          {
            name: "period",
            in: "query",
            schema: { type: "string", enum: ["day", "week", "month"], default: "week" },
          },
        ],
        responses: {
          "200": {
            description: "Analytics summary",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AnalyticsSummary" },
              },
            },
          },
        },
      },
    },

    // Budget endpoints
    "/api/budgets": {
      get: {
        tags: ["Budgets"],
        summary: "List budgets",
        description: "List all cost budgets",
        operationId: "listBudgets",
        security: [{ apiKey: [] }],
        responses: {
          "200": {
            description: "List of budgets",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BudgetList" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Budgets"],
        summary: "Create budget",
        description: "Create a new cost budget",
        operationId: "createBudget",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBudget" },
            },
          },
        },
        responses: {
          "201": {
            description: "Budget created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Budget" },
              },
            },
          },
        },
      },
    },

    // Webhook endpoints
    "/api/webhooks": {
      get: {
        tags: ["Webhooks"],
        summary: "List webhooks",
        description: "List all configured webhooks",
        operationId: "listWebhooks",
        security: [{ apiKey: [] }],
        responses: {
          "200": {
            description: "List of webhooks",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WebhookList" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Create webhook",
        description: "Create a new webhook",
        operationId: "createWebhook",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateWebhook" },
            },
          },
        },
        responses: {
          "201": {
            description: "Webhook created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Webhook" },
              },
            },
          },
        },
      },
    },

    // Marketplace endpoints
    "/api/marketplace/templates": {
      get: {
        tags: ["Marketplace"],
        summary: "Search templates",
        description: "Search marketplace templates",
        operationId: "searchTemplates",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["popular", "recent", "rating"] } },
          { $ref: "#/components/parameters/PageParam" },
          { $ref: "#/components/parameters/LimitParam" },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TemplateSearchResults" },
              },
            },
          },
        },
      },
    },

    "/api/marketplace/templates/{id}/install": {
      post: {
        tags: ["Marketplace"],
        summary: "Install template",
        description: "Install a marketplace template",
        operationId: "installTemplate",
        security: [{ apiKey: [] }],
        parameters: [{ $ref: "#/components/parameters/TemplateId" }],
        responses: {
          "201": {
            description: "Template installed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Installation" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key for authentication",
      },
    },
    parameters: {
      PageParam: {
        name: "page",
        in: "query",
        description: "Page number",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      LimitParam: {
        name: "limit",
        in: "query",
        description: "Items per page",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
      PipelineId: {
        name: "id",
        in: "path",
        required: true,
        description: "Pipeline ID",
        schema: { type: "string", format: "uuid" },
      },
      ExecutionId: {
        name: "id",
        in: "path",
        required: true,
        description: "Execution ID",
        schema: { type: "string", format: "uuid" },
      },
      TemplateId: {
        name: "id",
        in: "path",
        required: true,
        description: "Template ID",
        schema: { type: "string", format: "uuid" },
      },
    },
    responses: {
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          code: { type: "string" },
        },
        required: ["error", "message"],
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["healthy", "degraded", "unhealthy"] },
          version: { type: "string" },
          uptime: { type: "number" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      Pipeline: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          steps: {
            type: "array",
            items: { $ref: "#/components/schemas/PipelineStep" },
          },
          status: { type: "string", enum: ["active", "paused", "archived"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PipelineStep: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          toolId: { type: "string" },
          config: { type: "object" },
          order: { type: "integer" },
        },
      },
      PipelineList: {
        type: "object",
        properties: {
          pipelines: {
            type: "array",
            items: { $ref: "#/components/schemas/Pipeline" },
          },
          total: { type: "integer" },
          page: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      CreatePipeline: {
        type: "object",
        required: ["name", "steps"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          steps: {
            type: "array",
            items: { $ref: "#/components/schemas/PipelineStep" },
          },
        },
      },
      UpdatePipeline: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          steps: {
            type: "array",
            items: { $ref: "#/components/schemas/PipelineStep" },
          },
          status: { type: "string", enum: ["active", "paused", "archived"] },
        },
      },
      ExecuteRequest: {
        type: "object",
        properties: {
          input: { type: "object" },
          priority: { type: "string", enum: ["low", "normal", "high", "critical"] },
        },
      },
      Execution: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          pipelineId: { type: "string", format: "uuid" },
          status: { type: "string", enum: ["queued", "running", "completed", "failed", "cancelled"] },
          progress: { type: "number", minimum: 0, maximum: 100 },
          startedAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time" },
          result: { type: "object" },
          error: { type: "string" },
        },
      },
      Schedule: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          pipelineId: { type: "string", format: "uuid" },
          cronExpression: { type: "string" },
          timezone: { type: "string" },
          enabled: { type: "boolean" },
          nextRunAt: { type: "string", format: "date-time" },
          lastRunAt: { type: "string", format: "date-time" },
        },
      },
      ScheduleList: {
        type: "object",
        properties: {
          schedules: {
            type: "array",
            items: { $ref: "#/components/schemas/Schedule" },
          },
        },
      },
      CreateSchedule: {
        type: "object",
        required: ["pipelineId", "cronExpression"],
        properties: {
          pipelineId: { type: "string", format: "uuid" },
          cronExpression: { type: "string" },
          timezone: { type: "string", default: "UTC" },
          enabled: { type: "boolean", default: true },
        },
      },
      AnalyticsSummary: {
        type: "object",
        properties: {
          totalExecutions: { type: "integer" },
          successRate: { type: "number" },
          totalCost: { type: "number" },
          averageDuration: { type: "number" },
          dailyStats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                executions: { type: "integer" },
                cost: { type: "number" },
              },
            },
          },
        },
      },
      Budget: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          limitAmount: { type: "number" },
          currentSpend: { type: "number" },
          period: { type: "string", enum: ["daily", "weekly", "monthly"] },
          status: { type: "string", enum: ["active", "paused", "exceeded"] },
        },
      },
      BudgetList: {
        type: "object",
        properties: {
          budgets: {
            type: "array",
            items: { $ref: "#/components/schemas/Budget" },
          },
        },
      },
      CreateBudget: {
        type: "object",
        required: ["name", "limitAmount", "period"],
        properties: {
          name: { type: "string" },
          limitAmount: { type: "number" },
          period: { type: "string", enum: ["daily", "weekly", "monthly"] },
        },
      },
      Webhook: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" } },
          enabled: { type: "boolean" },
          secret: { type: "string" },
        },
      },
      WebhookList: {
        type: "object",
        properties: {
          webhooks: {
            type: "array",
            items: { $ref: "#/components/schemas/Webhook" },
          },
        },
      },
      CreateWebhook: {
        type: "object",
        required: ["url", "events"],
        properties: {
          url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" } },
        },
      },
      TemplateSearchResults: {
        type: "object",
        properties: {
          templates: { type: "array", items: { $ref: "#/components/schemas/MarketplaceTemplate" } },
          total: { type: "integer" },
          page: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      MarketplaceTemplate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          author: { type: "object" },
          rating: { type: "object" },
          installs: { type: "integer" },
        },
      },
      Installation: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          templateId: { type: "string", format: "uuid" },
          pipelineId: { type: "string", format: "uuid" },
          installedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

// Export function to get spec
export function getOpenAPISpec(): typeof openAPISpec {
  return openAPISpec;
}

// Generate JSON string
export function getOpenAPIJSON(): string {
  return JSON.stringify(openAPISpec, null, 2);
}

// Generate YAML (simplified)
export function getOpenAPIYAML(): string {
  // Simple YAML-like output (would use js-yaml in production)
  return `# gICM Integration Hub API
openapi: ${openAPISpec.openapi}
info:
  title: ${openAPISpec.info.title}
  version: ${openAPISpec.info.version}
# ... (full spec in JSON)
`;
}
