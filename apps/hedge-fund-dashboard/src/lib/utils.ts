import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  if (price < 100) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export function getSentimentColor(
  sentiment: string
): "bullish" | "bearish" | "neutral" {
  if (sentiment.includes("bullish")) return "bullish";
  if (sentiment.includes("bearish")) return "bearish";
  return "neutral";
}

export function getActionColor(action: string): string {
  switch (action.toLowerCase()) {
    case "bullish":
    case "buy":
      return "text-bullish bg-bullish/10 border-bullish/30";
    case "bearish":
    case "sell":
    case "avoid":
      return "text-bearish bg-bearish/10 border-bearish/30";
    default:
      return "text-neutral bg-neutral/10 border-neutral/30";
  }
}
