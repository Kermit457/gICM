"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Fallback WS URL if not imported
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3100/ws";

// HubEvent type for compatibility with hub.ts
export interface HubEvent {
  id: string;
  type: string;
  source: string;
  category: string;
  payload: Record<string, unknown>;
  timestamp: number;
  room?: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WebSocketMessage {
  type: "event" | "status" | "metrics" | "heartbeat" | string;
  payload: unknown;
  room?: string;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  /** Automatically reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
  /** Max reconnect attempts (0 = unlimited) */
  maxReconnectAttempts?: number;
  /** Enable heartbeat ping */
  heartbeat?: boolean;
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Rooms to subscribe to on connect */
  rooms?: string[];
  /** Callback when event received */
  onEvent?: (event: HubEvent) => void;
  /** Callback when any message received */
  onMessage?: (message: WebSocketMessage) => void;
  /** Callback when status changes */
  onStatusChange?: (status: ConnectionStatus) => void;
}

const DEFAULT_OPTIONS: Required<UseWebSocketOptions> = {
  autoReconnect: true,
  reconnectDelay: 3000,
  maxReconnectAttempts: 10,
  heartbeat: true,
  heartbeatInterval: 30000,
  rooms: [],
  onEvent: () => {},
  onMessage: () => {},
  onStatusChange: () => {},
};

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    if (mountedRef.current) {
      setStatus(newStatus);
      opts.onStatusChange(newStatus);
    }
  }, [opts]);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    if (opts.heartbeat && wsRef.current?.readyState === WebSocket.OPEN) {
      heartbeatInterval.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "ping" }));
        }
      }, opts.heartbeatInterval);
    }
  }, [opts.heartbeat, opts.heartbeatInterval, clearHeartbeat]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    clearHeartbeat();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    reconnectAttempts.current = 0;
    updateStatus("disconnected");
  }, [clearHeartbeat, updateStatus]);

  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.CONNECTING ||
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    updateStatus("connecting");
    setError(null);

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttempts.current = 0;
        updateStatus("connected");
        startHeartbeat();

        // Subscribe to default channels
        ws.send(JSON.stringify({ type: "subscribe", channels: ["events", "status", "metrics"] }));

        // Subscribe to rooms if specified
        if (opts.rooms.length > 0) {
          ws.send(JSON.stringify({ action: "subscribe", rooms: opts.rooms }));
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          opts.onMessage(message);

          // Handle different message types
          if (message.type === "event" && message.payload) {
            const hubEvent = message.payload as HubEvent;
            setEvents((prev) => [hubEvent, ...prev].slice(0, 100)); // Keep last 100 events
            opts.onEvent(hubEvent);
          }
        } catch (err) {
          console.warn("Failed to parse WebSocket message:", err);
        }
      };

      ws.onerror = (event) => {
        if (!mountedRef.current) return;
        console.error("WebSocket error:", event);
        setError("Connection error");
        updateStatus("error");
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        clearHeartbeat();

        // Don't reconnect if intentionally closed (code 1000)
        if (event.code === 1000) {
          updateStatus("disconnected");
          return;
        }

        updateStatus("disconnected");

        // Attempt reconnection
        if (opts.autoReconnect &&
            (opts.maxReconnectAttempts === 0 || reconnectAttempts.current < opts.maxReconnectAttempts)) {
          reconnectAttempts.current++;
          const delay = opts.reconnectDelay * Math.min(reconnectAttempts.current, 5); // Exponential backoff capped at 5x

          reconnectTimeout.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, delay);
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      updateStatus("error");
    }
  }, [opts, updateStatus, startHeartbeat, clearHeartbeat]);

  const send = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Subscribe to rooms dynamically
  const subscribe = useCallback((rooms: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && rooms.length > 0) {
      wsRef.current.send(JSON.stringify({ action: "subscribe", rooms }));
      return true;
    }
    return false;
  }, []);

  // Unsubscribe from rooms
  const unsubscribe = useCallback((rooms: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && rooms.length > 0) {
      wsRef.current.send(JSON.stringify({ action: "unsubscribe", rooms }));
      return true;
    }
    return false;
  }, []);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    events,
    lastMessage,
    error,
    isConnected: status === "connected",
    reconnectAttempts: reconnectAttempts.current,
    connect,
    disconnect,
    send,
    clearEvents,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook that combines WebSocket with polling fallback
 * Uses WebSocket when available, falls back to polling if connection fails
 */
export function useRealtimeData<T>(
  fetchFn: () => Promise<T | null>,
  options: UseWebSocketOptions & {
    /** Polling interval when WebSocket is not available (ms) */
    pollingInterval?: number;
    /** Whether to use polling at all */
    enablePolling?: boolean;
  } = {}
) {
  const { pollingInterval = 10000, enablePolling = true, ...wsOptions } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const ws = useWebSocket({
    ...wsOptions,
    onStatusChange: (status) => {
      wsOptions.onStatusChange?.(status);
      // When WebSocket connects, stop polling
      if (status === "connected" && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    },
  });

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        setLastFetch(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Start/stop polling based on WebSocket status
  useEffect(() => {
    mountedRef.current = true;

    // If WebSocket is not connected and polling is enabled, start polling
    if (!ws.isConnected && enablePolling) {
      // Don't start if already polling
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchData, pollingInterval);
      }
    } else if (ws.isConnected && pollingRef.current) {
      // Stop polling when WebSocket connects
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [ws.isConnected, enablePolling, pollingInterval, fetchData]);

  return {
    data,
    loading,
    lastFetch,
    refetch: fetchData,
    websocket: ws,
    isRealtime: ws.isConnected,
  };
}
