"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Cpu,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Zap,
  RefreshCw,
} from "lucide-react";
import { HUB_URL } from "@/lib/api/hub";

interface AnalyticsSummary {
  period: string;
  totalExecutions: number;
  successRate: number;
  totalCost: number;
  totalTokens: number;
  avgDuration: number;
  topPipelines: Array<{
    id: string;
    name: string;
    count: number;
    successRate: number;
  }>;
  costTrend: Array<{ date: string; cost: number }>;
  executionTrend: Array<{ date: string; count: number; successRate: number }>;
}

interface TokenBreakdown {
  total: { input: number; output: number; total: number };
  byTool: Record<string, { input: number; output: number; total: number }>;
  byPipeline: Record<string, { input: number; output: number; total: number }>;
  trend: Array<{ date: string; tokens: number }>;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [tokenBreakdown, setTokenBreakdown] = useState<TokenBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, tokensRes] = await Promise.all([
        fetch(`${HUB_URL}/api/analytics/summary?period=${period}`),
        fetch(`${HUB_URL}/api/analytics/tokens?period=${period}`),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }

      if (tokensRes.ok) {
        const data = await tokensRes.json();
        setTokenBreakdown(data);
      }
    } catch (err) {
      setError("Failed to fetch analytics. Make sure the Integration Hub is running.");
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toFixed(0);
  };

  const formatCost = (n: number) => `$${n.toFixed(4)}`;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="min-h-screen bg-gicm-bg text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-gicm-primary" />
              Pipeline Analytics
            </h1>
            <p className="text-gray-400 mt-1">
              Cost tracking, success rates, and token usage
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Period selector */}
            <div className="flex bg-gicm-card rounded-lg p-1">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? "bg-gicm-primary text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 rounded-lg bg-gicm-card hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Executions"
            value={summary ? formatNumber(summary.totalExecutions) : "-"}
            icon={Activity}
            trend={summary?.executionTrend}
            loading={loading}
          />
          <MetricCard
            title="Success Rate"
            value={summary ? `${summary.successRate.toFixed(1)}%` : "-"}
            icon={CheckCircle}
            iconColor={summary && summary.successRate >= 80 ? "text-green-400" : "text-yellow-400"}
            loading={loading}
          />
          <MetricCard
            title="Total Cost"
            value={summary ? formatCost(summary.totalCost) : "-"}
            icon={DollarSign}
            trend={summary?.costTrend}
            loading={loading}
          />
          <MetricCard
            title="Avg Duration"
            value={summary ? formatDuration(summary.avgDuration) : "-"}
            icon={Clock}
            loading={loading}
          />
        </div>

        {/* Token Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gicm-card rounded-xl border border-gicm-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gicm-primary" />
              Token Usage
            </h2>

            {tokenBreakdown ? (
              <div className="space-y-6">
                {/* Total tokens */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Total Tokens</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(tokenBreakdown.total.total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Input / Output</p>
                    <p className="text-sm">
                      <span className="text-blue-400">
                        {formatNumber(tokenBreakdown.total.input)}
                      </span>
                      {" / "}
                      <span className="text-green-400">
                        {formatNumber(tokenBreakdown.total.output)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Token trend */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Token Usage Trend
                  </h3>
                  <div className="h-32 flex items-end gap-1">
                    {tokenBreakdown.trend.map((d, i) => {
                      const max = Math.max(...tokenBreakdown.trend.map((t) => t.tokens));
                      const height = max > 0 ? (d.tokens / max) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-gicm-primary/20 hover:bg-gicm-primary/40 rounded-t transition-colors group relative"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap">
                            {d.date}: {formatNumber(d.tokens)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* By tool */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    By Tool
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(tokenBreakdown.byTool)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .slice(0, 5)
                      .map(([tool, usage]) => (
                        <div
                          key={tool}
                          className="flex items-center justify-between p-2 bg-white/5 rounded"
                        >
                          <span className="text-sm font-mono">{tool}</span>
                          <span className="text-sm text-gray-400">
                            {formatNumber(usage.total)} tokens
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {loading ? "Loading..." : "No token data available"}
              </div>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="bg-gicm-card rounded-xl border border-gicm-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gicm-primary" />
              Cost Breakdown
            </h2>

            {summary ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">Total Cost</p>
                  <p className="text-3xl font-bold text-gicm-primary">
                    {formatCost(summary.totalCost)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {formatCost(summary.totalExecutions > 0 ? summary.totalCost / summary.totalExecutions : 0)} per execution
                  </p>
                </div>

                {/* Cost trend */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Cost Trend
                  </h3>
                  <div className="h-24 flex items-end gap-1">
                    {summary.costTrend.map((d, i) => {
                      const max = Math.max(...summary.costTrend.map((t) => t.cost));
                      const height = max > 0 ? (d.cost / max) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-green-500/20 hover:bg-green-500/40 rounded-t transition-colors group relative"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap">
                            {d.date}: {formatCost(d.cost)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost estimation */}
                <div className="text-sm text-gray-400 border-t border-gicm-border pt-4 mt-4">
                  <p className="font-medium mb-2">Estimated costs (Claude Sonnet):</p>
                  <ul className="space-y-1 text-xs">
                    <li>Input: $0.003 / 1K tokens</li>
                    <li>Output: $0.015 / 1K tokens</li>
                    <li>API call: $0.001 base</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {loading ? "Loading..." : "No cost data available"}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Performance */}
        <div className="bg-gicm-card rounded-xl border border-gicm-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-gicm-primary" />
            Pipeline Performance
          </h2>

          {summary && summary.topPipelines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gicm-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Pipeline
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      Executions
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      Success Rate
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topPipelines.map((pipeline) => (
                    <tr
                      key={pipeline.id}
                      className="border-b border-gicm-border/50 hover:bg-white/5"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium">{pipeline.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{pipeline.id}</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        {pipeline.count}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span
                          className={
                            pipeline.successRate >= 80
                              ? "text-green-400"
                              : pipeline.successRate >= 50
                              ? "text-yellow-400"
                              : "text-red-400"
                          }
                        >
                          {pipeline.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        {pipeline.successRate >= 80 ? (
                          <CheckCircle className="w-5 h-5 text-green-400 inline" />
                        ) : pipeline.successRate >= 50 ? (
                          <Activity className="w-5 h-5 text-yellow-400 inline" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {loading ? "Loading..." : "No pipeline data available yet. Run some pipelines to see analytics."}
            </div>
          )}
        </div>

        {/* Execution Trend */}
        <div className="bg-gicm-card rounded-xl border border-gicm-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gicm-primary" />
            Execution Trend
          </h2>

          {summary && summary.executionTrend.length > 0 ? (
            <div className="h-48 flex items-end gap-2">
              {summary.executionTrend.map((d, i) => {
                const max = Math.max(...summary.executionTrend.map((t) => t.count));
                const height = max > 0 ? (d.count / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gicm-primary/20 hover:bg-gicm-primary/40 rounded-t transition-colors group relative"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                        <p>{d.date}</p>
                        <p>{d.count} executions</p>
                        <p>{d.successRate.toFixed(0)}% success</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">
                      {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {loading ? "Loading..." : "No execution data available"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-gicm-primary",
  trend,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  trend?: Array<{ date: string; cost?: number; count?: number }>;
  loading?: boolean;
}) {
  const trendDirection = trend?.length
    ? (trend[trend.length - 1]?.cost ?? trend[trend.length - 1]?.count ?? 0) >
      (trend[0]?.cost ?? trend[0]?.count ?? 0)
      ? "up"
      : "down"
    : null;

  return (
    <div className="bg-gicm-card rounded-xl border border-gicm-border p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-6 h-6 ${iconColor}`} />
        {trendDirection && (
          trendDirection === "up" ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )
        )}
      </div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-1">
        {loading ? (
          <span className="animate-pulse bg-white/10 rounded w-16 h-7 inline-block" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}
