"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  RefreshCcw,
  Server,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";

// Types
type HealthStatus = "healthy" | "degraded" | "unhealthy";
type AlertSeverity = "info" | "warning" | "error" | "critical";
type AlertStatus = "firing" | "resolved" | "acknowledged";

interface SystemHealth {
  status: HealthStatus;
  uptime: number;
  cpuUsage?: number;
  memoryUsage?: number;
  activeConnections: number;
  queueDepth: number;
  cacheHitRate: number;
  errorRate: number;
}

interface ServiceStats {
  service: string;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgLatency: number;
  latencyPercentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  throughput: number;
}

interface Alert {
  id: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  value: number;
  threshold: number;
  startedAt: Date;
  resolvedAt?: Date;
}

interface PerformanceSummary {
  period: "hour" | "day" | "week" | "month";
  systemHealth: SystemHealth;
  services: ServiceStats[];
  totalRequests: number;
  totalErrors: number;
  totalTokens: number;
  totalCost: number;
}

// Mock data
const mockHealth: SystemHealth = {
  status: "healthy",
  uptime: 864000, // 10 days
  cpuUsage: 42,
  memoryUsage: 68,
  activeConnections: 127,
  queueDepth: 234,
  cacheHitRate: 87.5,
  errorRate: 0.8,
};

const mockServices: ServiceStats[] = [
  {
    service: "api-gateway",
    requestCount: 125000,
    errorCount: 250,
    errorRate: 0.2,
    avgLatency: 45,
    latencyPercentiles: { p50: 32, p75: 48, p90: 78, p95: 120, p99: 250 },
    throughput: 145.2,
  },
  {
    service: "pipeline-executor",
    requestCount: 8500,
    errorCount: 85,
    errorRate: 1.0,
    avgLatency: 2340,
    latencyPercentiles: { p50: 1800, p75: 2500, p90: 3200, p95: 4500, p99: 8000 },
    throughput: 9.8,
  },
  {
    service: "llm-proxy",
    requestCount: 45000,
    errorCount: 180,
    errorRate: 0.4,
    avgLatency: 1250,
    latencyPercentiles: { p50: 900, p75: 1200, p90: 1800, p95: 2500, p99: 4000 },
    throughput: 52.1,
  },
  {
    service: "webhook-dispatcher",
    requestCount: 12000,
    errorCount: 120,
    errorRate: 1.0,
    avgLatency: 180,
    latencyPercentiles: { p50: 120, p75: 180, p90: 280, p95: 450, p99: 800 },
    throughput: 13.9,
  },
];

const mockAlerts: Alert[] = [
  {
    id: "1",
    ruleName: "High Latency",
    severity: "warning",
    status: "firing",
    message: "P95 latency exceeds 2 seconds on llm-proxy",
    value: 2500,
    threshold: 2000,
    startedAt: new Date(Date.now() - 1800000), // 30 min ago
  },
  {
    id: "2",
    ruleName: "High Error Rate",
    severity: "error",
    status: "acknowledged",
    message: "Error rate exceeds 5% on webhook-dispatcher",
    value: 5.2,
    threshold: 5,
    startedAt: new Date(Date.now() - 7200000), // 2 hours ago
  },
  {
    id: "3",
    ruleName: "Low Cache Hit Rate",
    severity: "info",
    status: "resolved",
    message: "Cache hit rate below 50%",
    value: 87.5,
    threshold: 50,
    startedAt: new Date(Date.now() - 86400000), // 1 day ago
    resolvedAt: new Date(Date.now() - 82800000), // 23 hours ago
  },
];

// Helper functions
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatLatency = (ms: number) => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getHealthColor = (status: HealthStatus) => {
  switch (status) {
    case "healthy":
      return "text-green-500 bg-green-50 dark:bg-green-950";
    case "degraded":
      return "text-yellow-500 bg-yellow-50 dark:bg-yellow-950";
    case "unhealthy":
      return "text-red-500 bg-red-50 dark:bg-red-950";
  }
};

const getHealthIcon = (status: HealthStatus) => {
  switch (status) {
    case "healthy":
      return CheckCircle2;
    case "degraded":
      return AlertTriangle;
    case "unhealthy":
      return XCircle;
  }
};

const getSeverityColor = (severity: AlertSeverity) => {
  switch (severity) {
    case "info":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "error":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "critical":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  }
};

const getStatusColor = (status: AlertStatus) => {
  switch (status) {
    case "firing":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "acknowledged":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
};

export default function PerformancePage() {
  const [period, setPeriod] = useState<"hour" | "day" | "week" | "month">("day");
  const [health, setHealth] = useState<SystemHealth>(mockHealth);
  const [services, setServices] = useState<ServiceStats[]>(mockServices);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const HealthIcon = getHealthIcon(health.status);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system health, latency, and service metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Overall Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <HealthIcon className={`h-5 w-5 ${getHealthColor(health.status).split(" ")[0]}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getHealthColor(health.status)}>
                {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Uptime: {formatUptime(health.uptime)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.errorRate.toFixed(2)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {health.errorRate < 1 ? (
                <>
                  <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                  Below threshold
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
                  Above normal
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.cacheHitRate.toFixed(1)}%</div>
            <Progress value={health.cacheHitRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Queue Depth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Queue Depth</CardTitle>
            <Database className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(health.queueDepth)}</div>
            <div className="text-xs text-muted-foreground">
              {health.activeConnections} active connections
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      {(health.cpuUsage !== undefined || health.memoryUsage !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          {health.cpuUsage !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{health.cpuUsage}%</span>
                  <span className="text-sm text-muted-foreground">of allocated</span>
                </div>
                <Progress
                  value={health.cpuUsage}
                  className={`h-2 ${health.cpuUsage > 80 ? "[&>div]:bg-red-500" : ""}`}
                />
              </CardContent>
            </Card>
          )}
          {health.memoryUsage !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Server className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{health.memoryUsage}%</span>
                  <span className="text-sm text-muted-foreground">of allocated</span>
                </div>
                <Progress
                  value={health.memoryUsage}
                  className={`h-2 ${health.memoryUsage > 80 ? "[&>div]:bg-red-500" : ""}`}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabs for Services and Alerts */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services" className="gap-2">
            <Activity className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
            {alerts.filter((a) => a.status === "firing").length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {alerts.filter((a) => a.status === "firing").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="latency" className="gap-2">
            <Clock className="h-4 w-4" />
            Latency
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Metrics</CardTitle>
              <CardDescription>Request counts, error rates, and throughput by service</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Error Rate</TableHead>
                    <TableHead className="text-right">Avg Latency</TableHead>
                    <TableHead className="text-right">Throughput</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.service}>
                      <TableCell className="font-medium">{service.service}</TableCell>
                      <TableCell className="text-right">{formatNumber(service.requestCount)}</TableCell>
                      <TableCell className="text-right">{formatNumber(service.errorCount)}</TableCell>
                      <TableCell className="text-right">
                        <span className={service.errorRate > 1 ? "text-red-500" : "text-green-500"}>
                          {service.errorRate.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatLatency(service.avgLatency)}</TableCell>
                      <TableCell className="text-right">{service.throughput.toFixed(1)} req/s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Current and recent alerts across all services</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No alerts - all systems operational</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{alert.ruleName}</div>
                            <div className="text-sm text-muted-foreground">{alert.message}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {alert.value.toFixed(1)} / {alert.threshold}
                        </TableCell>
                        <TableCell>
                          {new Date(alert.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {alert.status === "firing" && (
                            <Button variant="outline" size="sm">
                              Acknowledge
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Latency Tab */}
        <TabsContent value="latency">
          <Card>
            <CardHeader>
              <CardTitle>Latency Percentiles</CardTitle>
              <CardDescription>Response time distribution by service</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">P50</TableHead>
                    <TableHead className="text-right">P75</TableHead>
                    <TableHead className="text-right">P90</TableHead>
                    <TableHead className="text-right">P95</TableHead>
                    <TableHead className="text-right">P99</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.service}>
                      <TableCell className="font-medium">{service.service}</TableCell>
                      <TableCell className="text-right">
                        {formatLatency(service.latencyPercentiles.p50)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatLatency(service.latencyPercentiles.p75)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatLatency(service.latencyPercentiles.p90)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={service.latencyPercentiles.p95 > 2000 ? "text-yellow-500" : ""}>
                          {formatLatency(service.latencyPercentiles.p95)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={service.latencyPercentiles.p99 > 5000 ? "text-red-500" : ""}>
                          {formatLatency(service.latencyPercentiles.p99)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
