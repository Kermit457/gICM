"use client";

import { useState, useEffect } from "react";
import type { LiveStatsResponse } from "@/types/live-activity";
import { TrendingUp, Package, Users } from "lucide-react";
import { AnimatedCounter } from "../hero/AnimatedCounter";

interface StatsPanelProps {
  theme: "dark" | "light";
}

export function StatsPanel({ theme }: StatsPanelProps) {
  const [stats, setStats] = useState<LiveStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/live/stats");
      if (!response.ok) throw new Error("Failed to fetch");

      const data: LiveStatsResponse = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return (
      <div className={`
        h-[600px] rounded-2xl border p-6
        ${theme === "dark" ? "glass-card" : "glass-card-light bg-white"}
      `}>
        <div className="animate-pulse">
          <div className={`h-8 rounded mb-4 ${theme === "dark" ? "bg-white/10" : "bg-black/10"}`} />
          <div className={`h-32 rounded mb-4 ${theme === "dark" ? "bg-white/10" : "bg-black/10"}`} />
          <div className={`h-32 rounded ${theme === "dark" ? "bg-white/10" : "bg-black/10"}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`
      h-[600px] rounded-2xl border p-6 overflow-y-auto custom-scrollbar
      ${theme === "dark" ? "glass-card" : "glass-card-light bg-white"}
    `}>
      {/* Top Stats */}
      <div className="space-y-4 mb-6">
        {/* Total Builders */}
        <div className={`
          p-4 rounded-xl border
          ${theme === "dark"
            ? "bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30"
            : "bg-gradient-to-br from-purple-50 to-transparent border-purple-200"
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Users className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
            <h3 className={`
              text-xs font-bold uppercase tracking-wide
              ${theme === "dark" ? "text-purple-400" : "text-purple-600"}
            `}>
              Total Builders
            </h3>
          </div>
          <div className={`text-4xl font-black ${theme === "dark" ? "text-white" : "text-black"}`}>
            <AnimatedCounter value={stats.totalBuilders} />
          </div>
        </div>

        {/* Active Now */}
        <div className={`
          p-4 rounded-xl border animate-pulse-glow
          ${theme === "dark"
            ? "bg-gradient-to-br from-lime-500/10 to-transparent border-lime-500/30"
            : "bg-gradient-to-br from-lime-50 to-transparent border-lime-200"
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
            <h3 className={`
              text-xs font-bold uppercase tracking-wide
              ${theme === "dark" ? "text-lime-400" : "text-lime-600"}
            `}>
              Building Now
            </h3>
          </div>
          <div className={`text-3xl font-black ${theme === "dark" ? "text-lime-400" : "text-lime-600"}`}>
            <AnimatedCounter value={stats.activeNow} />
          </div>
          <p className={`text-xs mt-1 ${theme === "dark" ? "text-lime-400/70" : "text-lime-600/70"}`}>
            Active in last 5 min
          </p>
        </div>

        {/* Built Today */}
        <div className={`
          p-4 rounded-xl border
          ${theme === "dark"
            ? "bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30"
            : "bg-gradient-to-br from-yellow-50 to-transparent border-yellow-200"
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Package className={`w-5 h-5 ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`} />
            <h3 className={`
              text-xs font-bold uppercase tracking-wide
              ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}
            `}>
              Built Today
            </h3>
          </div>
          <div className={`text-3xl font-black ${theme === "dark" ? "text-white" : "text-black"}`}>
            <AnimatedCounter value={stats.builtToday} />
          </div>
        </div>
      </div>

      {/* Trending */}
      {stats.trending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className={`w-5 h-5 ${theme === "dark" ? "text-white/70" : "text-black/70"}`} />
            <h3 className={`
              text-sm font-bold uppercase tracking-wide
              ${theme === "dark" ? "text-white/70" : "text-black/70"}
            `}>
              Trending
            </h3>
          </div>
          <div className="space-y-3">
            {stats.trending.slice(0, 5).map((item, index) => (
              <div
                key={item.name}
                className={`
                  flex items-center justify-between p-3 rounded-lg border
                  transition-all hover-scale
                  ${theme === "dark"
                    ? "bg-white/5 border-white/10 hover:bg-white/10"
                    : "bg-white border-black/10 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`
                    w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${index === 0
                      ? (theme === "dark" ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-600")
                      : (theme === "dark" ? "bg-white/10 text-white/60" : "bg-black/5 text-black/60")
                    }
                  `}>
                    {index + 1}
                  </div>
                  <span className={`
                    text-sm font-medium truncate
                    ${theme === "dark" ? "text-white" : "text-black"}
                  `}>
                    {item.name}
                  </span>
                </div>
                <span className={`
                  text-sm font-bold tabular-nums flex-shrink-0
                  ${theme === "dark" ? "text-lime-400" : "text-lime-600"}
                `}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
