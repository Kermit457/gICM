"use client";

import { useDashboardStore } from "@/lib/store";
import { EventItem } from "./EventItem";
import { Activity, RefreshCw } from "lucide-react";

export function EventsFeed() {
  const { events, fetchEvents, loading } = useDashboardStore();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Live Events</h2>
          <span className="text-xs text-gray-500">({events.length})</span>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading.events}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
        >
          <RefreshCw className={"w-4 h-4 " + (loading.events ? "animate-spin" : "")} />
        </button>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No events yet</p>
            <p className="text-xs mt-1">Events will appear here in real-time</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
