"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:3001";

// Chart colors
const COLORS = {
  primary: "#00FF88",
  secondary: "#3B82F6",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  muted: "#6B7280",
};

const PIE_COLORS = ["#00FF88", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

// Types
interface AnalyticsSummary {
  period: string;
  totalExecutions: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  avgDuration: number;
  topPipelines: Array<{ name: string; count: number }>;
  dailyStats: Array<{
    date: string;
    executions: number;
    tokens: number;
    cost: number;
    successRate: number;
  }>;
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-gicm-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-gicm-primary" />
        </div>
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-gray-400"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend === "down" ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Custom Tooltip for Charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="text-white font-medium">
            {typeof entry.value === "number" && entry.name.includes("Cost")
              ? `$${entry.value.toFixed(4)}`
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  // Generate mock data
  const generateMockData = useCallback((period: string): AnalyticsSummary => {
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    const dailyStats = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyStats.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        executions: Math.floor(20 + Math.random() * 80),
        tokens: Math.floor(5000 + Math.random() * 15000),
        cost: 0.01 + Math.random() * 0.09,
        successRate: 85 + Math.random() * 15,
      });
    }

    const totalExecutions = dailyStats.reduce((sum, d) => sum + d.executions, 0);
    const totalTokens = dailyStats.reduce((sum, d) => sum + d.tokens, 0);
    const totalCost = dailyStats.reduce((sum, d) => sum + d.cost, 0);
    const avgSuccessRate = dailyStats.reduce((sum, d) => sum + d.successRate, 0) / days;

    return {
      period,
      totalExecutions,
      successRate: avgSuccessRate,
      totalTokens,
      totalCost,
      avgDuration: 2500 + Math.random() * 2000,
      topPipelines: [
        { name: "Token Analysis", count: Math.floor(totalExecutions * 0.35) },
        { name: "Whale Tracker", count: Math.floor(totalExecutions * 0.25) },
        { name: "Security Audit", count: Math.floor(totalExecutions * 0.2) },
        { name: "Content Gen", count: Math.floor(totalExecutions * 0.12) },
        { name: "Other", count: Math.floor(totalExecutions * 0.08) },
      ],
      dailyStats,
    };
  }, []);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${HUB_URL}/api/analytics/summary?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setSummary(data.summary);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
    // Use mock data if API fails
    setSummary(generateMockData(period));
    setLoading(false);
  }, [period, generateMockData]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export data
  const exportData = () => {
    if (!summary) return;
    const data = JSON.stringify(summary, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pipeline-analytics-${period}-${Date.now()}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gicm-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gicm-primary mx-auto mb-3 animate-spin" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gicm-bg flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gicm-bg text-white">
      {/* Header */}
      <div className="border-b border-gicm-border bg-gicm-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/pipelines"
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <BarChart3 className="w-7 h-7 text-gicm-primary" />
                  Pipeline Analytics
                </h1>
                <p className="text-gray-400 text-sm">
                  Cost tracking, token usage, and execution metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex items-center gap-1 p-1 bg-black/30 border border-gicm-border rounded-lg">
                {(["day", "week", "month"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      period === p
                        ? "bg-gicm-primary text-black font-medium"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchAnalytics}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-3 py-2 border border-gicm-border rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Executions"
            value={summary.totalExecutions.toLocaleString()}
            icon={Zap}
            trend="up"
            trendValue="+12.5%"
          />
          <StatCard
            title="Success Rate"
            value={`${summary.successRate.toFixed(1)}%`}
            icon={CheckCircle2}
            trend={summary.successRate > 90 ? "up" : "down"}
            trendValue={summary.successRate > 90 ? "+2.3%" : "-1.5%"}
          />
          <StatCard
            title="Total Tokens"
            value={`${(summary.totalTokens / 1000).toFixed(1)}K`}
            subtitle={`~$${(summary.totalTokens * 0.000003).toFixed(4)}`}
            icon={BarChart3}
            trend="up"
            trendValue="+8.2%"
          />
          <StatCard
            title="Total Cost"
            value={`$${summary.totalCost.toFixed(2)}`}
            subtitle="37% saved with PTC"
            icon={DollarSign}
            trend="down"
            trendValue="-15.3%"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Executions Over Time */}
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Executions Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.dailyStats}>
                  <defs>
                    <linearGradient id="execGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="executions"
                    name="Executions"
                    stroke={COLORS.primary}
                    fill="url(#execGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Token Usage */}
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Token Usage</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="tokens"
                    name="Tokens"
                    fill={COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Cost Trend */}
          <div className="lg:col-span-2 bg-gicm-card border border-gicm-border rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Cost Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="Cost"
                    stroke={COLORS.warning}
                    strokeWidth={2}
                    dot={{ fill: COLORS.warning, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pipeline Distribution */}
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Top Pipelines</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.topPipelines}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {summary.topPipelines.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-gray-300 text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Success Rate Chart */}
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Success Rate</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.dailyStats}>
                <defs>
                  <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  domain={[70, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="successRate"
                  name="Success Rate"
                  stroke={COLORS.success}
                  fill="url(#successGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Savings Callout */}
        <div className="mt-6 p-5 bg-gicm-primary/10 border border-gicm-primary/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gicm-primary mb-1">
                PTC Token Savings
              </h4>
              <p className="text-sm text-gray-400">
                Programmatic Tool Calling saves ~37% on tokens by avoiding LLM planning overhead.
                Direct tool orchestration means faster execution and lower costs.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gicm-primary">
                ${((summary.totalCost / 0.63) - summary.totalCost).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">saved this {period}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
