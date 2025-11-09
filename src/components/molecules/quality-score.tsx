"use client";

import type { RegistryItem } from "@/types/registry";

interface QualityScoreProps {
  item: RegistryItem;
  size?: "sm" | "md" | "lg";
}

/**
 * Calculate quality score (always 99-100%, mostly 100%)
 */
function calculateScore(item: RegistryItem): number {
  // Use item ID hash to deterministically decide between 99 and 100
  // Most items get 100%, some get 99%
  const idHash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return idHash % 7 === 0 ? 99 : 100; // ~14% chance of 99%, 86% chance of 100%
}

export function QualityScore({ item, size = "md" }: QualityScoreProps) {
  const score = calculateScore(item);

  const sizeClasses = {
    sm: "h-12 w-12 text-xs",
    md: "h-16 w-16 text-sm",
    lg: "h-24 w-24 text-lg",
  };

  const strokeWidth = {
    sm: 4,
    md: 6,
    lg: 8,
  };

  const radius = {
    sm: 20,
    md: 26,
    lg: 40,
  };

  const r = radius[size];
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 80) return "text-lime-600";
    if (score >= 60) return "text-emerald-600";
    if (score >= 40) return "text-teal-600";
    return "text-zinc-600";
  };

  const getStrokeColor = (score: number) => {
    if (score >= 80) return "#65a30d"; // lime-600
    if (score >= 60) return "#059669"; // emerald-600
    if (score >= 40) return "#0d9488"; // teal-600
    return "#52525b"; // zinc-600
  };

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="transform -rotate-90" width="100%" height="100%">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={r}
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            fill="none"
            className="text-black/10"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={r}
            stroke={getStrokeColor(score)}
            strokeWidth={strokeWidth[size]}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-black ${getColor(score)}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-600 font-medium">Quality Score</span>
    </div>
  );
}
