"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { hubApi, type EnrichedEvent, type EventCategory } from "@/lib/api/hub";
import { WS_URL } from "@/lib/api/hub";
import Link from "next/link";

interface ActivityFeedProps {
  limit?: number;
  category?: string;
  showFilters?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

const SEVERITY_COLORS = {
  info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  success: "text-green-400 bg-green-500/10 border-green-500/20",
  warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

const SEVERITY_DOT = {
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

export function ActivityFeed({
  limit = 50,
  category: initialCategory,
  showFilters = true,
  autoRefresh = true,
  className = "",
}: ActivityFeedProps) {
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    const result = await hubApi.getEnrichedEvents(limit, selectedCategory);
    if (result?.events) {
      setEvents(result.events);
    }
    setLoading(false);
  }, [limit, selectedCategory]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    const result = await hubApi.getEventCategories();
    if (result?.categories) {
      setCategories(result.categories);
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!autoRefresh) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[ActivityFeed] WebSocket connected");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // When we receive a new event, add it to the top of the list
        if (data.id && data.category) {
          // Simple enrichment for real-time events
          const enriched: EnrichedEvent = {
            id: data.id,
            timestamp: data.timestamp || Date.now(),
            source: data.source || "system",
            category: data.category,
            type: data.type,
            payload: data.payload || {},
            title: data.title || `${data.category}: ${data.type}`,
            description: data.description || "",
            icon: data.icon || "📌",
            categoryIcon: data.categoryIcon || "📌",
            color: data.color || "gray",
            severity: data.severity || "info",
            actions: data.actions || [],
          };

          // Filter by category if set
          if (selectedCategory && enriched.category !== selectedCategory) {
            return;
          }

          setEvents((prev) => [enriched, ...prev.slice(0, limit - 1)]);
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      console.log("[ActivityFeed] WebSocket disconnected");
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [autoRefresh, selectedCategory, limit]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [fetchEvents, fetchCategories]);

  // Polling fallback when WS is disconnected
  useEffect(() => {
    if (connected || !autoRefresh) return;

    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [connected, autoRefresh, fetchEvents]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Activity Feed</h3>
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-500"}`}
            title={connected ? "Real-time connected" : "Polling mode"}
          />
        </div>
        <button
          onClick={fetchEvents}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Category Filters */}
      {showFilters && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              !selectedCategory
                ? "bg-gicm-primary text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === cat.id
                  ? "bg-gicm-primary text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-gicm-primary border-t-transparent rounded-full" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-2xl block mb-2">📭</span>
            No events yet. The system is learning...
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`relative p-3 rounded-lg border transition-all cursor-pointer ${
                SEVERITY_COLORS[event.severity]
              } ${expandedEvent === event.id ? "ring-1 ring-white/20" : ""}`}
              onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
            >
              {/* Severity indicator */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                  SEVERITY_DOT[event.severity]
                }`}
              />

              <div className="flex items-start gap-3 ml-2">
                {/* Icon */}
                <span className="text-lg flex-shrink-0">{event.icon}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white truncate">{event.title}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                  )}

                  {/* Expanded details */}
                  {expandedEvent === event.id && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      {/* Source & Category */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300">
                          {event.categoryIcon} {event.category}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300">
                          Source: {event.source}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300">
                          Type: {event.type}
                        </span>
                      </div>

                      {/* Payload preview */}
                      {Object.keys(event.payload).length > 0 && (
                        <pre className="text-xs text-gray-500 bg-black/20 p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2).slice(0, 200)}
                          {JSON.stringify(event.payload).length > 200 && "..."}
                        </pre>
                      )}

                      {/* Actions */}
                      {event.actions.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {event.actions.map((action) => (
                            action.href ? (
                              <Link
                                key={action.id}
                                href={action.href}
                                className="text-xs px-3 py-1.5 rounded bg-gicm-primary/20 text-gicm-primary hover:bg-gicm-primary/30 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {action.icon} {action.label}
                              </Link>
                            ) : (
                              <button
                                key={action.id}
                                className="text-xs px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Emit action event
                                  console.log("Action:", action.action, event.relatedId);
                                }}
                              >
                                {action.icon} {action.label}
                              </button>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-center">
          <span className="text-xs text-gray-500">
            Showing {events.length} events
            {selectedCategory && ` in ${selectedCategory}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
