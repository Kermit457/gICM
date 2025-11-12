"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Zap, Clock, CheckCircle, XCircle, Activity, TrendingUp } from "lucide-react";
import type { APIUsageStats } from "@/types/analytics";

export default function WorkflowAnalyticsPage() {
  const [stats, setStats] = useState<APIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/workflow/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen radial-burst flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500 mx-auto mb-4" />
          <p className="text-black/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen radial-burst flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-lime-500 text-black font-bold rounded-lg hover:bg-lime-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const successRate = stats.totalRequests > 0
    ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen radial-burst">
      {/* Header */}
      <div className="border-b border-black/20 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link
            href="/workflow"
            className="inline-flex items-center gap-2 text-sm text-black/80 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Workflow Builder
          </Link>
          <button
            onClick={fetchStats}
            className="text-sm text-black/60 hover:text-black transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-500 text-white grid place-items-center mx-auto mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-black mb-2">AI Usage Analytics</h1>
          <p className="text-black/60">Monitor your Claude API usage and costs</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Requests */}
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-lime-600" />
              <span className="text-xs text-black/60">TOTAL</span>
            </div>
            <div className="text-3xl font-black text-black">{stats.totalRequests}</div>
            <div className="text-sm text-black/60 mt-1">API Requests</div>
          </div>

          {/* Total Cost */}
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-lime-600" />
              <span className="text-xs text-black/60">COST</span>
            </div>
            <div className="text-3xl font-black text-black">${stats.totalCost.toFixed(2)}</div>
            <div className="text-sm text-black/60 mt-1">Total Spent</div>
          </div>

          {/* Success Rate */}
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-lime-600" />
              <span className="text-xs text-black/60">SUCCESS</span>
            </div>
            <div className="text-3xl font-black text-black">{successRate}%</div>
            <div className="text-sm text-black/60 mt-1">Success Rate</div>
          </div>

          {/* Avg Response Time */}
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-lime-600" />
              <span className="text-xs text-black/60">SPEED</span>
            </div>
            <div className="text-3xl font-black text-black">
              {(stats.averageResponseTime / 1000).toFixed(1)}s
            </div>
            <div className="text-sm text-black/60 mt-1">Avg Response</div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
          <h2 className="text-xl font-bold text-black mb-4">Token Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-lime-500/10">
              <div className="text-2xl font-black text-black">
                {stats.totalInputTokens.toLocaleString()}
              </div>
              <div className="text-sm text-black/60 mt-1">Input Tokens</div>
              <div className="text-xs text-lime-600 font-medium mt-2">
                ${((stats.totalInputTokens / 1000000) * 3).toFixed(4)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/10">
              <div className="text-2xl font-black text-black">
                {stats.totalOutputTokens.toLocaleString()}
              </div>
              <div className="text-sm text-black/60 mt-1">Output Tokens</div>
              <div className="text-xs text-lime-600 font-medium mt-2">
                ${((stats.totalOutputTokens / 1000000) * 15).toFixed(4)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-teal-500/10">
              <div className="text-2xl font-black text-black">
                {stats.totalTokens.toLocaleString()}
              </div>
              <div className="text-sm text-black/60 mt-1">Total Tokens</div>
              <div className="text-xs text-black/60 mt-2">
                Avg: {stats.totalRequests > 0 ? Math.round(stats.totalTokens / stats.totalRequests).toLocaleString() : 0} per request
              </div>
            </div>
          </div>
        </div>

        {/* Request Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Successful vs Failed */}
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
            <h3 className="text-lg font-bold text-black mb-4">Request Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-black">Successful</span>
                </div>
                <span className="text-lg font-black text-black">{stats.successfulRequests}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-black">Failed</span>
                </div>
                <span className="text-lg font-black text-black">{stats.failedRequests}</span>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
            <h3 className="text-lg font-bold text-black mb-4">Cost Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/60">Average per request:</span>
                <span className="font-bold text-black">
                  ${stats.totalRequests > 0 ? (stats.totalCost / stats.totalRequests).toFixed(4) : '0.0000'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/60">Projected monthly (100 req):</span>
                <span className="font-bold text-black">
                  ${stats.totalRequests > 0 ? ((stats.totalCost / stats.totalRequests) * 100).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/60">Projected monthly (1000 req):</span>
                <span className="font-bold text-black">
                  ${stats.totalRequests > 0 ? ((stats.totalCost / stats.totalRequests) * 1000).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost by Day */}
        {stats.costByDay.length > 0 && (
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-lime-600" />
              Cost by Day
            </h3>
            <div className="space-y-2">
              {stats.costByDay.slice(0, 7).map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="text-sm text-black/60 w-24">{day.date}</span>
                  <div className="flex-1 h-8 rounded-lg bg-black/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 flex items-center justify-end px-2 text-xs font-bold text-black"
                      style={{
                        width: `${Math.min(100, (day.cost / Math.max(...stats.costByDay.map(d => d.cost))) * 100)}%`,
                      }}
                    >
                      ${day.cost.toFixed(2)}
                    </div>
                  </div>
                  <span className="text-xs text-black/60 w-16 text-right">{day.requests} req</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requests by Hour */}
        {stats.requestsByHour.length > 0 && (
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
            <h3 className="text-lg font-bold text-black mb-4">Requests by Hour</h3>
            <div className="flex items-end gap-1 h-32">
              {Array.from({ length: 24 }, (_, i) => {
                const hourData = stats.requestsByHour.find(h => h.hour === i);
                const count = hourData?.count || 0;
                const maxCount = Math.max(...stats.requestsByHour.map(h => h.count), 1);
                const height = (count / maxCount) * 100;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-lime-500 to-emerald-500 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                      title={`${i}:00 - ${count} requests`}
                    />
                    {i % 3 === 0 && (
                      <span className="text-[10px] text-black/60">{i}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Data State */}
        {stats.totalRequests === 0 && (
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-black/20" />
            <h3 className="text-xl font-bold text-black mb-2">No Usage Data Yet</h3>
            <p className="text-black/60 mb-6">
              Start using the AI Workflow Builder to see your usage analytics
            </p>
            <Link href="/workflow">
              <button className="px-6 py-3 bg-lime-500 text-black font-bold rounded-lg hover:bg-lime-600 transition-colors">
                Go to Workflow Builder
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
