"use client";

import { useDashboardStore } from "@/lib/store";
import { PieChart } from "lucide-react";

const allocationColors: Record<string, string> = {
  trading: "bg-blue-500",
  growth: "bg-green-500",
  operations: "bg-purple-500",
  reserve: "bg-yellow-500",
  default: "bg-gray-500",
};

export function AllocationChart() {
  const treasury = useDashboardStore((s) => s.treasury);

  if (!treasury?.allocations) {
    return null;
  }

  const allocations = Object.entries(treasury.allocations);
  const total = allocations.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <PieChart className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Allocations</h2>
      </div>

      <div className="space-y-3">
        {allocations.map(([name, value]) => {
          const percentage = total > 0 ? (value / total) * 100 : 0;
          const colorClass = allocationColors[name] || allocationColors.default;

          return (
            <div key={name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400 capitalize">{name}</span>
                <span className="text-sm text-white">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={"h-full rounded-full " + colorClass}
                  style={{ width: percentage + "%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
