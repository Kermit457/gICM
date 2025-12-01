"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity,
  MoreVertical,
  Eye,
} from "lucide-react";

// Types
type AuditSeverity = "debug" | "info" | "warning" | "error" | "critical";
type AuditResult = "success" | "failure" | "partial" | "pending";
type AuditCategory = "auth" | "organization" | "member" | "pipeline" | "schedule" | "budget" | "webhook" | "settings" | "api" | "security" | "system";

interface AuditEvent {
  id: string;
  timestamp: Date;
  category: AuditCategory;
  action: string;
  severity: AuditSeverity;
  result: AuditResult;
  description: string;
  context: {
    userId?: string;
    userEmail?: string;
    orgId?: string;
    ipAddress?: string;
  };
  resource?: {
    type: string;
    id: string;
    name?: string;
  };
}

interface AuditStats {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByResult: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
}

// Mock data
const mockEvents: AuditEvent[] = [
  {
    id: "aud_1",
    timestamp: new Date(Date.now() - 5 * 60000),
    category: "auth",
    action: "login",
    severity: "info",
    result: "success",
    description: "User logged in successfully",
    context: { userId: "user_1", userEmail: "admin@company.com", ipAddress: "192.168.1.100" },
  },
  {
    id: "aud_2",
    timestamp: new Date(Date.now() - 15 * 60000),
    category: "pipeline",
    action: "execute",
    severity: "info",
    result: "success",
    description: "Pipeline 'Data Sync' executed successfully",
    context: { userId: "user_2", userEmail: "dev@company.com" },
    resource: { type: "pipeline", id: "pipe_1", name: "Data Sync" },
  },
  {
    id: "aud_3",
    timestamp: new Date(Date.now() - 30 * 60000),
    category: "security",
    action: "permission_denied",
    severity: "warning",
    result: "failure",
    description: "Unauthorized access attempt to budget settings",
    context: { userId: "user_3", userEmail: "viewer@company.com", ipAddress: "10.0.0.50" },
    resource: { type: "budget", id: "bud_1" },
  },
  {
    id: "aud_4",
    timestamp: new Date(Date.now() - 60 * 60000),
    category: "member",
    action: "role_change",
    severity: "info",
    result: "success",
    description: "Changed role from Editor to Admin",
    context: { userId: "user_1", userEmail: "admin@company.com" },
    resource: { type: "member", id: "mem_2", name: "dev@company.com" },
  },
  {
    id: "aud_5",
    timestamp: new Date(Date.now() - 2 * 3600000),
    category: "api",
    action: "rate_limited",
    severity: "warning",
    result: "failure",
    description: "API rate limit exceeded",
    context: { ipAddress: "203.0.113.50" },
  },
  {
    id: "aud_6",
    timestamp: new Date(Date.now() - 3 * 3600000),
    category: "settings",
    action: "update",
    severity: "info",
    result: "success",
    description: "Updated organization settings",
    context: { userId: "user_1", userEmail: "admin@company.com" },
    resource: { type: "settings", id: "org_settings" },
  },
];

const mockStats: AuditStats = {
  totalEvents: 1247,
  eventsByCategory: {
    auth: 342,
    pipeline: 456,
    security: 89,
    member: 123,
    api: 178,
    settings: 59,
  },
  eventsBySeverity: {
    info: 1089,
    warning: 134,
    error: 22,
    critical: 2,
  },
  eventsByResult: {
    success: 1156,
    failure: 78,
    partial: 13,
  },
  recentActivity: [
    { date: "2024-01-24", count: 156 },
    { date: "2024-01-25", count: 189 },
    { date: "2024-01-26", count: 203 },
    { date: "2024-01-27", count: 178 },
    { date: "2024-01-28", count: 167 },
    { date: "2024-01-29", count: 198 },
    { date: "2024-01-30", count: 156 },
  ],
};

// Helper components
const SeverityBadge = ({ severity }: { severity: AuditSeverity }) => {
  const config = {
    debug: { color: "bg-gray-100 text-gray-700", icon: null },
    info: { color: "bg-blue-100 text-blue-700", icon: CheckCircle },
    warning: { color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
    error: { color: "bg-red-100 text-red-700", icon: XCircle },
    critical: { color: "bg-red-500 text-white", icon: XCircle },
  };

  const { color, icon: Icon } = config[severity];

  return (
    <Badge variant="outline" className={`${color} gap-1`}>
      {Icon && <Icon className="h-3 w-3" />}
      {severity}
    </Badge>
  );
};

const ResultBadge = ({ result }: { result: AuditResult }) => {
  const config = {
    success: { color: "bg-green-100 text-green-700", icon: CheckCircle },
    failure: { color: "bg-red-100 text-red-700", icon: XCircle },
    partial: { color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
    pending: { color: "bg-gray-100 text-gray-700", icon: Clock },
  };

  const { color, icon: Icon } = config[result];

  return (
    <Badge variant="outline" className={`${color} gap-1`}>
      <Icon className="h-3 w-3" />
      {result}
    </Badge>
  );
};

const CategoryBadge = ({ category }: { category: AuditCategory }) => {
  const colors: Record<AuditCategory, string> = {
    auth: "bg-purple-100 text-purple-700",
    organization: "bg-blue-100 text-blue-700",
    member: "bg-green-100 text-green-700",
    pipeline: "bg-orange-100 text-orange-700",
    schedule: "bg-cyan-100 text-cyan-700",
    budget: "bg-yellow-100 text-yellow-700",
    webhook: "bg-pink-100 text-pink-700",
    settings: "bg-gray-100 text-gray-700",
    api: "bg-indigo-100 text-indigo-700",
    security: "bg-red-100 text-red-700",
    system: "bg-slate-100 text-slate-700",
  };

  return (
    <Badge variant="outline" className={colors[category]}>
      {category}
    </Badge>
  );
};

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>(mockEvents);
  const [stats, setStats] = useState<AuditStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredEvents = events.filter((e) => {
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== "all" && e.category !== categoryFilter) {
      return false;
    }
    if (severityFilter !== "all" && e.severity !== severityFilter) {
      return false;
    }
    return true;
  });

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
  };

  const handleExport = async (format: "json" | "csv") => {
    // In production, call API
    console.log(`Exporting as ${format}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all security events and user activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.eventsByResult.success / stats.totalEvents) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.eventsByResult.success.toLocaleString()} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsBySeverity.warning || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.eventsBySeverity.error || 0} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsByCategory.security || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.eventsBySeverity.critical || 0} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="pipeline">Pipeline</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatTime(event.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={event.category} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{event.action}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {event.description}
                      </TableCell>
                      <TableCell>
                        {event.context.userEmail ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{event.context.userEmail}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={event.severity} />
                      </TableCell>
                      <TableCell>
                        <ResultBadge result={event.result} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Events
              </CardTitle>
              <CardDescription>
                Authentication failures, permission denials, and suspicious activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events
                  .filter((e) => e.category === "security" || e.severity === "warning" || e.severity === "error")
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{event.description}</span>
                          <SeverityBadge severity={event.severity} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.context.userEmail || "Unknown user"} •{" "}
                          {event.context.ipAddress || "Unknown IP"} •{" "}
                          {formatTime(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retention Policies</CardTitle>
              <CardDescription>
                Configure how long audit logs are kept for each category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Archive After</TableHead>
                    <TableHead>Auto Delete</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { category: "auth", retention: 365, archive: 180 },
                    { category: "security", retention: 730, archive: 365 },
                    { category: "pipeline", retention: 90, archive: null },
                    { category: "api", retention: 30, archive: null },
                    { category: "member", retention: 365, archive: 180 },
                    { category: "settings", retention: 365, archive: 180 },
                  ].map((policy) => (
                    <TableRow key={policy.category}>
                      <TableCell>
                        <CategoryBadge category={policy.category as AuditCategory} />
                      </TableCell>
                      <TableCell>{policy.retention} days</TableCell>
                      <TableCell>
                        {policy.archive ? `${policy.archive} days` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {policy.archive ? "After archive" : "On expiry"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
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
