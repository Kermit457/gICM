"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  opus67Api,
  getOpus67WebSocket,
  type BrainStatus,
  type BrainResponse,
  type BrainMetrics,
  type ModeName,
  type Opus67WebSocketMessage,
} from "@/lib/api/opus67";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface UseOpus67Options {
  /** Auto-connect WebSocket on mount */
  autoConnect?: boolean;
  /** Polling interval when WebSocket is not connected (ms) */
  pollingInterval?: number;
  /** Enable polling fallback */
  enablePolling?: boolean;
}

const DEFAULT_OPTIONS: Required<UseOpus67Options> = {
  autoConnect: true,
  pollingInterval: 10000,
  enablePolling: true,
};

/**
 * Hook for connecting to OPUS 67 BRAIN
 */
export function useOpus67(options: UseOpus67Options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [status, setStatus] = useState<BrainStatus | null>(null);
  const [metrics, setMetrics] = useState<BrainMetrics | null>(null);
  const [history, setHistory] = useState<BrainResponse[]>([]);
  const [currentMode, setCurrentMode] = useState<ModeName>("auto");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const wsRef = useRef(getOpus67WebSocket());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [statusData, metricsData, historyData] = await Promise.all([
        opus67Api.getStatus(),
        opus67Api.getMetrics(),
        opus67Api.getHistory(10),
      ]);

      if (mountedRef.current) {
        setStatus(statusData);
        setMetrics(metricsData);
        setHistory(historyData);
        if (statusData?.mode) {
          setCurrentMode(statusData.mode);
        }
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Set mode
  const setMode = useCallback(async (mode: ModeName) => {
    const result = await opus67Api.setMode(mode);
    if (result) {
      setCurrentMode(result);
      await fetchData();
    }
    return result;
  }, [fetchData]);

  // Send query
  const query = useCallback(async (
    queryText: string,
    options?: { forceMode?: ModeName; forceCouncil?: boolean; skipMemory?: boolean }
  ) => {
    const result = await opus67Api.query(queryText, options);
    if (result) {
      setHistory((prev) => [result, ...prev].slice(0, 20));
      await fetchData();
    }
    return result;
  }, [fetchData]);

  // Evolution controls
  const startEvolution = useCallback(async () => {
    const success = await opus67Api.startEvolution();
    if (success) await fetchData();
    return success;
  }, [fetchData]);

  const stopEvolution = useCallback(async () => {
    const success = await opus67Api.stopEvolution();
    if (success) await fetchData();
    return success;
  }, [fetchData]);

  const runEvolutionCycle = useCallback(async () => {
    const success = await opus67Api.runEvolutionCycle();
    if (success) await fetchData();
    return success;
  }, [fetchData]);

  // Deliberation
  const deliberate = useCallback(async (question: string) => {
    return opus67Api.deliberate(question);
  }, []);

  // WebSocket setup
  useEffect(() => {
    mountedRef.current = true;
    const ws = wsRef.current;

    if (opts.autoConnect) {
      setConnectionStatus("connecting");
      ws.connect();
    }

    // Event handlers
    const unsubConnected = ws.on("connected", () => {
      if (mountedRef.current) {
        setConnectionStatus("connected");
        fetchData();
      }
    });

    const unsubDisconnected = ws.on("disconnected", () => {
      if (mountedRef.current) {
        setConnectionStatus("disconnected");
      }
    });

    const unsubError = ws.on("error", () => {
      if (mountedRef.current) {
        setConnectionStatus("error");
      }
    });

    const unsubStatus = ws.on("status", (data) => {
      if (mountedRef.current && data) {
        setStatus(data as BrainStatus);
        setLastUpdate(new Date());
      }
    });

    const unsubResponse = ws.on("response", (data) => {
      if (mountedRef.current && data) {
        const response = data as BrainResponse;
        setHistory((prev) => [response, ...prev].slice(0, 20));
      }
    });

    const unsubModeChange = ws.on("mode_change", (data) => {
      if (mountedRef.current && data) {
        const { to } = data as { from: ModeName; to: ModeName };
        setCurrentMode(to);
      }
    });

    // Initial fetch
    fetchData();

    return () => {
      mountedRef.current = false;
      unsubConnected();
      unsubDisconnected();
      unsubError();
      unsubStatus();
      unsubResponse();
      unsubModeChange();
    };
  }, [opts.autoConnect, fetchData]);

  // Polling fallback
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Only poll if not connected via WebSocket and polling is enabled
    if (opts.enablePolling && connectionStatus !== "connected") {
      pollingRef.current = setInterval(fetchData, opts.pollingInterval);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [connectionStatus, opts.enablePolling, opts.pollingInterval, fetchData]);

  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus === "connected",
    isRealtime: connectionStatus === "connected",

    // Data
    status,
    metrics,
    history,
    currentMode,
    loading,
    error,
    lastUpdate,

    // Actions
    setMode,
    query,
    deliberate,
    startEvolution,
    stopEvolution,
    runEvolutionCycle,
    refetch: fetchData,

    // WebSocket
    ws: wsRef.current,
  };
}

/**
 * Simplified hook for just OPUS 67 status
 */
export function useOpus67Status() {
  const { status, loading, error, isConnected, refetch } = useOpus67({
    enablePolling: true,
    pollingInterval: 15000,
  });

  return { status, loading, error, isConnected, refetch };
}

/**
 * Hook for OPUS 67 mode switching
 */
export function useOpus67Mode() {
  const { currentMode, setMode, loading } = useOpus67();
  return { mode: currentMode, setMode, loading };
}
