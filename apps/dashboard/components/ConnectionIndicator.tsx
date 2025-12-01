"use client";

import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/hooks/useWebSocket";

const statusConfig = {
  connected: {
    icon: Wifi,
    label: "Real-time",
    color: "text-green-400",
    dot: "bg-green-400 animate-pulse",
    bg: "bg-green-500/10 border-green-500/30",
  },
  connecting: {
    icon: Wifi,
    label: "Connecting...",
    color: "text-yellow-400",
    dot: "bg-yellow-400 animate-pulse",
    bg: "bg-yellow-500/10 border-yellow-500/30",
  },
  disconnected: {
    icon: WifiOff,
    label: "Offline",
    color: "text-gray-400",
    dot: "bg-gray-400",
    bg: "bg-gray-500/10 border-gray-500/30",
  },
  error: {
    icon: WifiOff,
    label: "Error",
    color: "text-red-400",
    dot: "bg-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  },
};

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  isRealtime?: boolean;
  compact?: boolean;
}

export function ConnectionIndicator({ status, isRealtime, compact = false }: ConnectionIndicatorProps) {
  const config = statusConfig[status] || statusConfig.disconnected;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg} border`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bg} border`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>
          {isRealtime ? "Real-time" : config.label}
        </span>
      </div>
    </div>
  );
}

export default ConnectionIndicator;
