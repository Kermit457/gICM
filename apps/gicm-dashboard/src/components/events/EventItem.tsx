"use client";

import type { HubEvent } from "@/lib/api";
import {
  Brain,
  Cpu,
  Search,
  Hammer,
  FileText,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from "lucide-react";

const categoryIcons: Record<string, typeof Brain> = {
  brain: Brain,
  engine: Cpu,
  discovery: Search,
  build: Hammer,
  content: FileText,
  trade: TrendingUp,
  treasury: Wallet,
  error: AlertTriangle,
};

const categoryColors: Record<string, string> = {
  brain: "text-blue-400 bg-blue-900/30",
  engine: "text-purple-400 bg-purple-900/30",
  discovery: "text-cyan-400 bg-cyan-900/30",
  build: "text-orange-400 bg-orange-900/30",
  content: "text-green-400 bg-green-900/30",
  trade: "text-yellow-400 bg-yellow-900/30",
  treasury: "text-emerald-400 bg-emerald-900/30",
  error: "text-red-400 bg-red-900/30",
};

interface EventItemProps {
  event: HubEvent;
}

export function EventItem({ event }: EventItemProps) {
  const Icon = categoryIcons[event.category] || Brain;
  const colorClass = categoryColors[event.category] || "text-gray-400 bg-gray-900/30";

  const time = new Date(event.timestamp).toLocaleTimeString();
  const hasPayload = Object.keys(event.payload).length > 0;

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-700/50 last:border-0">
      <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " + colorClass}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white truncate">
            {event.type.replace(".", ": ").replace(/_/g, " ")}
          </p>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{time}</span>
        </div>

        <p className="text-xs text-gray-400">{event.source}</p>

        {hasPayload && (
          <div className="mt-1 p-2 bg-gray-900/50 rounded text-xs text-gray-500 font-mono">
            {JSON.stringify(event.payload, null, 0).slice(0, 100)}
            {JSON.stringify(event.payload).length > 100 && "..."}
          </div>
        )}
      </div>
    </div>
  );
}
