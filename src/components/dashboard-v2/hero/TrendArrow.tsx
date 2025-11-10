"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendArrowProps {
  value: number;
  theme: "dark" | "light";
}

export function TrendArrow({ value, theme }: TrendArrowProps) {
  const isPositive = value >= 0;

  return (
    <div className={`
      w-6 h-6 rounded-md flex items-center justify-center
      ${isPositive
        ? (theme === "dark" ? "bg-lime-500/20" : "bg-lime-100")
        : (theme === "dark" ? "bg-red-500/20" : "bg-red-100")
      }
    `}>
      {isPositive ? (
        <TrendingUp className={`w-4 h-4 ${theme === "dark" ? "text-lime-400" : "text-lime-600"}`} />
      ) : (
        <TrendingDown className={`w-4 h-4 ${theme === "dark" ? "text-red-400" : "text-red-600"}`} />
      )}
    </div>
  );
}
