"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store";
import { useWebSocket } from "@/lib/websocket";
import { TreasuryOverview } from "@/components/treasury/TreasuryOverview";
import { AllocationChart } from "@/components/treasury/AllocationChart";

export default function TreasuryPage() {
  const { fetchTreasury } = useDashboardStore();

  useWebSocket();

  useEffect(() => {
    fetchTreasury();
    const interval = setInterval(fetchTreasury, 60000);
    return () => clearInterval(interval);
  }, [fetchTreasury]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Treasury</h1>
        <p className="text-gray-400 mt-1">Financial overview and allocations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TreasuryOverview />
        <AllocationChart />
      </div>
    </div>
  );
}
