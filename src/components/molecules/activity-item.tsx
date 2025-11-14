"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { LiveActivity } from "@/types/live-activity";
import {
  Eye,
  Plus,
  Minus,
  Package,
  Download,
  Search,
  Filter,
  Sparkles,
  CheckCircle,
  Terminal,
  Rocket,
} from "lucide-react";

interface ActivityItemProps {
  activity: LiveActivity;
}

const ICON_MAP = {
  eye: Eye,
  plus: Plus,
  minus: Minus,
  package: Package,
  download: Download,
  search: Search,
  filter: Filter,
  sparkles: Sparkles,
  "check-circle": CheckCircle,
  terminal: Terminal,
  rocket: Rocket,
};

const COLOR_MAP = {
  lime: "bg-lime-500/20 text-lime-400 border-lime-500/40",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  green: "bg-green-500/20 text-green-400 border-green-500/40",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/40",
};

export const ActivityItem = memo(function ActivityItem({ activity }: ActivityItemProps) {
  const IconComponent = ICON_MAP[activity.icon];
  const colorClass = COLOR_MAP[activity.color];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg ${colorClass} border flex items-center justify-center flex-shrink-0`}>
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium leading-tight">
          {activity.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-400">{activity.relativeTime}</span>
          {activity.isSimulated && process.env.NODE_ENV === "development" && (
            <span className="text-xs text-zinc-600">•</span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
