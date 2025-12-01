"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store";
import { useWebSocket } from "@/lib/websocket";
import { BrainStatusCard } from "@/components/brain/BrainStatusCard";
import { CurrentPhaseCard } from "@/components/brain/CurrentPhaseCard";
import { MetricsCard } from "@/components/brain/MetricsCard";

export default function BrainPage() {
  const { fetchBrainStatus, fetchEngines, fetchEvents } = useDashboardStore();

  // Connect to WebSocket for real-time updates
  useWebSocket();

  // Fetch initial data
  useEffect(() => {
    fetchBrainStatus();
    fetchEngines();
    fetchEvents();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchBrainStatus();
      fetchEngines();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBrainStatus, fetchEngines, fetchEvents]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Brain Overview</h1>
        <p className="text-gray-400 mt-1">Monitor and control the gICM autonomous brain</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BrainStatusCard />
        </div>
        <div>
          <MetricsCard />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentPhaseCard />
      </div>
    </div>
  );
}
