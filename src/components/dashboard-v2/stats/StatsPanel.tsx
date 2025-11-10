"use client";

import { useState, useEffect } from "react";
import type { LiveStatsResponse } from "@/types/live-activity";
import { DollarSign, Coins, TrendingUp, Zap } from "lucide-react";
import { AnimatedCounter } from "../hero/AnimatedCounter";

interface StatsPanelProps {
  theme: "dark" | "light";
}

export function StatsPanel({ theme }: StatsPanelProps) {
  return (
    <div className={`
      h-[600px] rounded-2xl border p-6 overflow-y-auto custom-scrollbar
      ${theme === "dark" ? "glass-card" : "glass-card-light bg-white"}
    `}>
      {/* Token Savings = Money Savings */}
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className={`w-6 h-6 ${theme === "dark" ? "text-lime-400" : "text-lime-600"}`} />
        <h3 className={`
          text-lg font-black uppercase tracking-wide
          ${theme === "dark" ? "text-white" : "text-black"}
        `}>
          💰 Token Savings = Money Savings
        </h3>
      </div>

      <div className="space-y-4">
        {/* Tokens Saved Today */}
        <div className={`
          p-4 rounded-xl border animate-pulse-glow
          ${theme === "dark"
            ? "bg-gradient-to-br from-lime-500/10 to-transparent border-lime-500/30"
            : "bg-gradient-to-br from-lime-50 to-transparent border-lime-200"
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-5 h-5 ${theme === "dark" ? "text-lime-400" : "text-lime-600"}`} />
            <span className={`text-xs font-bold uppercase ${theme === "dark" ? "text-lime-400" : "text-lime-600"}`}>
              Tokens Saved Today
            </span>
          </div>
          <div className={`text-3xl font-black ${theme === "dark" ? "text-white" : "text-black"}`}>
            <AnimatedCounter value={2847} /> tokens
          </div>
          <p className={`text-xl font-bold mt-1 ${theme === "dark" ? "text-lime-400" : "text-lime-600"}`}>
            $142.35 saved
          </p>
        </div>

        {/* Additional Metrics */}
        <div className="space-y-3">
          <div className={`
            p-3 rounded-lg border
            ${theme === "dark"
              ? "bg-white/5 border-white/8"
              : "bg-white border-black/20"
            }
          `}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Coins className={`w-4 h-4 ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`} />
                <span className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                  Avg Tokens/Stack
                </span>
              </div>
              <span className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
                127 tokens
              </span>
            </div>
            <p className={`text-xs text-right ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}>
              $6.35 saved/stack
            </p>
          </div>

          <div className={`
            p-3 rounded-lg border
            ${theme === "dark"
              ? "bg-white/5 border-white/8"
              : "bg-white border-black/20"
            }
          `}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                <span className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                  Total Tokens Saved
                </span>
              </div>
              <span className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
                1.2M
              </span>
            </div>
            <p className={`text-xs text-right ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
              $60,000 total saved
            </p>
          </div>

          <div className={`
            p-3 rounded-lg border
            ${theme === "dark"
              ? "bg-white/5 border-white/8"
              : "bg-white border-black/20"
            }
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
                <span className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                  Savings Rate
                </span>
              </div>
              <span className={`text-sm font-bold ${theme === "dark" ? "text-lime-400" : "text-lime-600"}`}>
                +43% this week
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
