"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store";
import { useWebSocket } from "@/lib/websocket";
import { EngineCard } from "@/components/engines/EngineCard";
import { EngineControls } from "@/components/engines/EngineControls";
import { RefreshCw } from "lucide-react";

export default function EnginesPage() {
  const { engines, fetchEngines, loading } = useDashboardStore();

  useWebSocket();

  useEffect(() => {
    fetchEngines();
    const interval = setInterval(fetchEngines, 15000);
    return () => clearInterval(interval);
  }, [fetchEngines]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Engines</h1>
          <p className="text-gray-400 mt-1">Monitor engine health and run quick actions</p>
        </div>

        <button
          onClick={fetchEngines}
          disabled={loading.engines}
          className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          <RefreshCw className={"w-4 h-4 mr-2 " + (loading.engines ? "animate-spin" : "")} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {engines.map((engine) => (
          <EngineCard key={engine.id} engine={engine} />
        ))}
      </div>

      <EngineControls />
    </div>
  );
}
