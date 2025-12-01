"use client";

import { formatPrice, formatLargeNumber } from "@/lib/utils";
import type { MarketData } from "@/lib/api";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketDataPanelProps {
  data: MarketData;
}

export function MarketDataPanel({ data }: MarketDataPanelProps) {
  const metrics = [
    { label: "Price", value: formatPrice(data.price) },
    { label: "Market Cap", value: formatLargeNumber(data.market_cap) },
    { label: "24h Volume", value: formatLargeNumber(data.volume_24h) },
    { label: "Liquidity", value: formatLargeNumber(data.liquidity || 0) },
    {
      label: "24h Change",
      value: `${data.change_24h?.toFixed(2) || 0}%`,
      isChange: true,
      positive: (data.change_24h || 0) >= 0,
    },
    {
      label: "7d Change",
      value: `${data.change_7d?.toFixed(2) || 0}%`,
      isChange: true,
      positive: (data.change_7d || 0) >= 0,
    },
    { label: "ATH", value: formatPrice(data.ath || 0) },
    {
      label: "From ATH",
      value: `${data.ath_change?.toFixed(1) || 0}%`,
      isChange: true,
      positive: false,
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Market Data</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <div key={i}>
            <p className="text-xs text-zinc-500 uppercase">{metric.label}</p>
            <p
              className={`text-lg font-semibold ${
                metric.isChange
                  ? metric.positive
                    ? "text-bullish"
                    : "text-bearish"
                  : "text-white"
              }`}
            >
              {metric.isChange && (
                <>
                  {metric.positive ? (
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 inline mr-1" />
                  )}
                </>
              )}
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
