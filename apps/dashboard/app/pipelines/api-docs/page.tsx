"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Book,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Key,
  Play,
  Terminal,
} from "lucide-react";

// Endpoint type
interface Endpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  params?: string[];
  body?: Record<string, string>;
}

// API endpoints grouped by tag
const API_ENDPOINTS: Record<string, Endpoint[]> = {
  Health: [
    {
      method: "GET",
      path: "/health",
      summary: "Health check",
      description: "Returns the health status of the API",
    },
  ],
  Pipelines: [
    {
      method: "GET",
      path: "/api/pipelines",
      summary: "List pipelines",
      description: "Retrieve a list of all pipelines",
      params: ["page", "limit", "status"],
    },
    {
      method: "POST",
      path: "/api/pipelines",
      summary: "Create pipeline",
      description: "Create a new pipeline",
      body: { name: "string", description: "string", steps: "array" },
    },
    {
      method: "GET",
      path: "/api/pipelines/{id}",
      summary: "Get pipeline",
      description: "Retrieve a pipeline by ID",
    },
    {
      method: "PUT",
      path: "/api/pipelines/{id}",
      summary: "Update pipeline",
      description: "Update an existing pipeline",
    },
    {
      method: "DELETE",
      path: "/api/pipelines/{id}",
      summary: "Delete pipeline",
      description: "Delete a pipeline",
    },
  ],
  Executions: [
    {
      method: "POST",
      path: "/api/pipelines/{id}/execute",
      summary: "Execute pipeline",
      description: "Start a new pipeline execution",
      body: { input: "object", priority: "string" },
    },
    {
      method: "GET",
      path: "/api/executions/{id}",
      summary: "Get execution",
      description: "Get execution status and details",
    },
    {
      method: "POST",
      path: "/api/executions/{id}/cancel",
      summary: "Cancel execution",
      description: "Cancel a running execution",
    },
  ],
  Schedules: [
    {
      method: "GET",
      path: "/api/schedules",
      summary: "List schedules",
      description: "List all pipeline schedules",
    },
    {
      method: "POST",
      path: "/api/schedules",
      summary: "Create schedule",
      description: "Create a new pipeline schedule",
      body: { pipelineId: "string", cronExpression: "string", timezone: "string" },
    },
  ],
  Analytics: [
    {
      method: "GET",
      path: "/api/analytics/summary",
      summary: "Get analytics summary",
      description: "Get aggregated analytics for all pipelines",
      params: ["period"],
    },
  ],
  Budgets: [
    {
      method: "GET",
      path: "/api/budgets",
      summary: "List budgets",
      description: "List all cost budgets",
    },
    {
      method: "POST",
      path: "/api/budgets",
      summary: "Create budget",
      description: "Create a new cost budget",
      body: { name: "string", limitAmount: "number", period: "string" },
    },
  ],
  Webhooks: [
    {
      method: "GET",
      path: "/api/webhooks",
      summary: "List webhooks",
      description: "List all configured webhooks",
    },
    {
      method: "POST",
      path: "/api/webhooks",
      summary: "Create webhook",
      description: "Create a new webhook",
      body: { url: "string", events: "array" },
    },
  ],
  Marketplace: [
    {
      method: "GET",
      path: "/api/marketplace/templates",
      summary: "Search templates",
      description: "Search marketplace templates",
      params: ["q", "category", "sort", "page", "limit"],
    },
    {
      method: "POST",
      path: "/api/marketplace/templates/{id}/install",
      summary: "Install template",
      description: "Install a marketplace template",
    },
  ],
};

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-500",
  POST: "bg-green-500",
  PUT: "bg-yellow-500",
  DELETE: "bg-red-500",
  PATCH: "bg-purple-500",
};

export default function APIDocsPage() {
  const [expandedTags, setExpandedTags] = useState<string[]>(["Pipelines"]);
  const [apiKey, setApiKey] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateCurlCommand = (method: string, path: string) => {
    const baseUrl = "https://api.gicm.dev";
    let cmd = `curl -X ${method} "${baseUrl}${path}"`;
    if (apiKey) {
      cmd += ` \\\n  -H "X-API-Key: ${apiKey}"`;
    }
    if (method !== "GET" && method !== "DELETE") {
      cmd += ` \\\n  -H "Content-Type: application/json"`;
      cmd += ` \\\n  -d '{}'`;
    }
    return cmd;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Book className="h-8 w-8" />
            API Documentation
          </h1>
          <p className="text-muted-foreground">
            Explore and test the Integration Hub API
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/openapi.json" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              OpenAPI Spec
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - API Key & Navigation */}
        <div className="space-y-4">
          {/* API Key Input */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="h-4 w-4" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="password"
                placeholder="Enter API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Required for authenticated endpoints
              </p>
            </CardContent>
          </Card>

          {/* Endpoint Navigation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {Object.entries(API_ENDPOINTS).map(([tag, endpoints]) => (
                  <Collapsible
                    key={tag}
                    open={expandedTags.includes(tag)}
                    onOpenChange={() => toggleTag(tag)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 hover:bg-muted text-sm font-medium">
                      <span>{tag}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {endpoints.length}
                        </Badge>
                        {expandedTags.includes(tag) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {endpoints.map((endpoint, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedEndpoint(`${tag}-${idx}`)}
                          className={`w-full flex items-center gap-2 px-4 py-1.5 text-xs hover:bg-muted ${
                            selectedEndpoint === `${tag}-${idx}` ? "bg-muted" : ""
                          }`}
                        >
                          <Badge
                            className={`${METHOD_COLORS[endpoint.method]} text-white text-[10px] px-1.5`}
                          >
                            {endpoint.method}
                          </Badge>
                          <span className="truncate text-muted-foreground">
                            {endpoint.path}
                          </span>
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Get started with the Integration Hub API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Base URL</h4>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                  <code>https://api.gicm.dev</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard("https://api.gicm.dev")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Include your API key in the X-API-Key header:
                </p>
                <div className="p-3 bg-muted rounded-md font-mono text-sm overflow-x-auto">
                  <code>X-API-Key: your-api-key-here</code>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Example Request</h4>
                <div className="p-3 bg-slate-900 rounded-md font-mono text-sm text-green-400 overflow-x-auto">
                  <pre>{`curl -X GET "https://api.gicm.dev/api/pipelines" \\
  -H "X-API-Key: your-api-key-here"`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints Reference */}
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                All available endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Pipelines">
                <TabsList className="flex-wrap h-auto">
                  {Object.keys(API_ENDPOINTS).map((tag) => (
                    <TabsTrigger key={tag} value={tag} className="text-xs">
                      {tag}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(API_ENDPOINTS).map(([tag, endpoints]) => (
                  <TabsContent key={tag} value={tag} className="mt-4 space-y-4">
                    {endpoints.map((endpoint, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg overflow-hidden"
                      >
                        {/* Endpoint Header */}
                        <div className="flex items-center gap-3 p-4 bg-muted/50">
                          <Badge
                            className={`${METHOD_COLORS[endpoint.method]} text-white`}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="font-mono text-sm">{endpoint.path}</code>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {endpoint.summary}
                          </span>
                        </div>

                        {/* Endpoint Details */}
                        <div className="p-4 space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {endpoint.description}
                          </p>

                          {/* Parameters */}
                          {endpoint.params && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Query Parameters</h5>
                              <div className="space-y-1">
                                {endpoint.params.map((param) => (
                                  <div key={param} className="flex items-center gap-2 text-sm">
                                    <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                      {param}
                                    </code>
                                    <span className="text-muted-foreground">string</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Request Body */}
                          {endpoint.body && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Request Body</h5>
                              <div className="p-3 bg-muted rounded-md font-mono text-xs overflow-x-auto">
                                <pre>{JSON.stringify(endpoint.body, null, 2)}</pre>
                              </div>
                            </div>
                          )}

                          {/* cURL Example */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium">cURL</h5>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6"
                                onClick={() =>
                                  copyToClipboard(generateCurlCommand(endpoint.method, endpoint.path))
                                }
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-md font-mono text-xs text-green-400 overflow-x-auto">
                              <pre>{generateCurlCommand(endpoint.method, endpoint.path)}</pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">100</p>
                  <p className="text-sm text-muted-foreground">requests/min</p>
                  <Badge variant="secondary" className="mt-2">Standard</Badge>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">1,000</p>
                  <p className="text-sm text-muted-foreground">requests/min</p>
                  <Badge variant="secondary" className="mt-2">Pro</Badge>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">Custom</p>
                  <p className="text-sm text-muted-foreground">requests/min</p>
                  <Badge variant="secondary" className="mt-2">Enterprise</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
