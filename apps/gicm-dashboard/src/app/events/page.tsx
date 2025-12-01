"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store";
import { useWebSocket } from "@/lib/websocket";
import { EventsFeed } from "@/components/events/EventsFeed";

export default function EventsPage() {
  const { fetchEvents } = useDashboardStore();

  useWebSocket();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="text-gray-400 mt-1">Real-time system events and activity</p>
      </div>

      <EventsFeed />
    </div>
  );
}
