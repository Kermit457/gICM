"use client";

import { Brain, DollarSign, TrendingUp, Package } from "lucide-react";
import type { EngineHealth } from "@/lib/api";

const engineIcons: Record<string, typeof Brain> = {
  brain: Brain,
  money: DollarSign,
  growth: TrendingUp,
  product: Package,
};

const engineNames: Record<string, string> = {
  brain: "Brain",
  money: "Money Engine",
  growth: "Growth Engine",
  product: "Product Engine",
  trading: "Trading Engine",
};

interface EngineCardProps {
  engine: EngineHealth;
}

export function EngineCard({ engine }: EngineCardProps) {
  const Icon = engineIcons[engine.id] || Brain;
  const name = engineNames[engine.id] || engine.id;

  const statusColors = {
    healthy: "bg-green-500",
    degraded: "bg-yellow-500",
    offline: "bg-gray-500",
  };

  const statusBgColors = {
    healthy: "bg-green-900/30 border-green-500/50",
    degraded: "bg-yellow-900/30 border-yellow-500/50",
    offline: "bg-gray-800 border-gray-600",
  };

  return (
    <div
      className={
        "rounded-lg p-4 border " + statusBgColors[engine.status]
      }
    >
      <div className="flex items-center space-x-3 mb-3">
        <div
          className={
            "w-10 h-10 rounded-lg flex items-center justify-center " +
            (engine.status === "healthy"
              ? "bg-green-600"
              : engine.status === "degraded"
              ? "bg-yellow-600"
              : "bg-gray-600")
          }
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{name}</h3>
          <div className="flex items-center space-x-2">
            <div className={"w-2 h-2 rounded-full " + statusColors[engine.status]} />
            <span className="text-xs text-gray-400 capitalize">{engine.status}</span>
          </div>
        </div>
      </div>

      {engine.lastHeartbeat && (
        <div className="text-xs text-gray-500">
          Last seen: {new Date(engine.lastHeartbeat).toLocaleTimeString()}
        </div>
      )}

      {engine.error && (
        <div className="mt-2 p-2 bg-red-900/30 rounded text-xs text-red-400">
          {engine.error}
        </div>
      )}
    </div>
  );
}
