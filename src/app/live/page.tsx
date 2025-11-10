"use client";

import { LiveActivityTicker } from "@/components/organisms/live-activity-ticker";
import { LiveStatsPanel } from "@/components/organisms/live-stats-panel";
import { motion } from "framer-motion";

export default function LivePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="relative border-b border-white/10 bg-gradient-to-r from-black via-zinc-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-300/5 via-emerald-300/5 to-transparent" />
        <div className="relative z-10 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-lime-400 shadow-lg grid place-items-center">
              <span className="text-black font-black text-2xl">g</span>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                gICM<span className="text-lime-400">://LIVE</span>
              </h1>
              <p className="text-xs text-zinc-400">
                Real-time Activity Dashboard
              </p>
            </div>
          </div>

          {/* Live Indicator */}
          <motion.div
            animate={{
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/50"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-400 uppercase tracking-wide">
              LIVE
            </span>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-81px)] grid grid-cols-12 gap-4 p-4">
        {/* Stats Panel - Left */}
        <div className="col-span-3 h-full">
          <LiveStatsPanel />
        </div>

        {/* Activity Feed - Right */}
        <div className="col-span-9 h-full">
          <div className="h-full bg-black/50 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
            <LiveActivityTicker />
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <div className="fixed bottom-4 left-4 text-xs text-zinc-600">
        <p>
          gICM Marketplace • Public Dashboard
        </p>
      </div>

      {/* Embed Instructions */}
      <div className="fixed bottom-4 right-4 text-xs text-zinc-600 max-w-xs">
        <p className="text-right">
          Embed this page on your website or stream it on displays
        </p>
      </div>
    </div>
  );
}
