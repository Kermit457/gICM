"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Sparkles } from "lucide-react";

interface TickerEvent {
  id: string;
  user: string;
  action: "remixed" | "installed" | "starred";
  item: string;
  timestamp: number;
}

/**
 * LiveTicker Component
 * Horizontal scrolling ticker showing real-time offspring/remix activity
 */
export function LiveTicker() {
  const [events, setEvents] = useState<TickerEvent[]>([
    { id: "1", user: "dev_alpha", action: "remixed", item: "ICM Anchor Architect", timestamp: Date.now() },
    { id: "2", user: "crypto_builder", action: "installed", item: "Solana Anchor Mastery", timestamp: Date.now() - 1000 },
    { id: "3", user: "web3_ninja", action: "remixed", item: "Frontend Fusion Engine", timestamp: Date.now() - 2000 },
    { id: "4", user: "rust_wizard", action: "installed", item: "Rust Systems Architect", timestamp: Date.now() - 3000 },
    { id: "5", user: "defi_dev", action: "starred", item: "Database Schema Oracle", timestamp: Date.now() - 4000 },
  ]);

  // Simulate new events (in production, this would use SSE)
  useEffect(() => {
    const interval = setInterval(() => {
      const actions: TickerEvent["action"][] = ["remixed", "installed", "starred"];
      const items = [
        "ICM Anchor Architect",
        "Frontend Fusion Engine",
        "Rust Systems Architect",
        "TypeScript Precision Engineer",
        "Solana Anchor Mastery",
      ];
      const users = [
        "dev_alpha",
        "crypto_builder",
        "web3_ninja",
        "rust_wizard",
        "defi_dev",
        "solana_hacker",
      ];

      const newEvent: TickerEvent = {
        id: `${Date.now()}`,
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        item: items[Math.floor(Math.random() * items.length)],
        timestamp: Date.now(),
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (action: TickerEvent["action"]) => {
    if (action === "remixed") return <GitBranch size={14} className="text-lime-300" />;
    if (action === "starred") return <Sparkles size={14} className="text-yellow-400" />;
    return <div className="h-2 w-2 rounded-full bg-emerald-400" />;
  };

  const getActionColor = (action: TickerEvent["action"]) => {
    if (action === "remixed") return "text-lime-300";
    if (action === "starred") return "text-yellow-400";
    return "text-emerald-400";
  };

  return (
    <div className="w-full overflow-hidden py-1.5">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="relative flex overflow-hidden bg-black/90 backdrop-blur border-y border-lime-300/20 rounded-lg py-1.5 px-4">
          <motion.div
            className="flex gap-4 whitespace-nowrap"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {/* Duplicate events for seamless loop */}
            {[...events, ...events, ...events].map((event, idx) => (
              <div
                key={`${event.id}-${idx}`}
                className="flex items-center gap-2 text-sm"
              >
                {getActionIcon(event.action)}
                <span className="text-white/60">{event.user}</span>
                <span className={`font-semibold ${getActionColor(event.action)}`}>
                  {event.action}
                </span>
                <span className="text-white/90">{event.item}</span>
                <span className="text-white/30 mx-2">•</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
