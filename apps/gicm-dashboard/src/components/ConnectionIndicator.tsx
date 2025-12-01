"use client";

import { useDashboardStore } from "@/lib/store";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionIndicator() {
  const connected = useDashboardStore((s) => s.connected);

  return (
    <div className="flex items-center space-x-2">
      {connected ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-500">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-500">Disconnected</span>
        </>
      )}
    </div>
  );
}
