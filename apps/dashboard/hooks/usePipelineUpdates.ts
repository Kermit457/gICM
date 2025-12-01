"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket, type ConnectionStatus } from "./useWebSocket";

// =========================================================================
// TYPES
// =========================================================================

export interface PipelineStep {
  id: string;
  tool: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  tokens?: number;
  cost?: number;
  error?: string;
  result?: unknown;
}

export interface PipelineState {
  executionId: string;
  pipelineId: string;
  pipelineName: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  currentStep?: string;
  message?: string;
  steps: PipelineStep[];
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  totalTokens: number;
  totalCost: number;
  error?: string;
  result?: unknown;
}

export interface UsePipelineUpdatesOptions {
  /** Auto-subscribe to pipeline room */
  autoSubscribe?: boolean;
  /** Called when pipeline starts */
  onStart?: (state: PipelineState) => void;
  /** Called on progress update */
  onProgress?: (progress: number, currentStep?: string) => void;
  /** Called when step starts */
  onStepStart?: (step: PipelineStep) => void;
  /** Called when step completes */
  onStepComplete?: (step: PipelineStep) => void;
  /** Called when step fails */
  onStepFail?: (step: PipelineStep) => void;
  /** Called when pipeline completes */
  onComplete?: (state: PipelineState) => void;
  /** Called when pipeline fails */
  onFail?: (state: PipelineState, error: string) => void;
}

export interface UsePipelineUpdatesReturn {
  /** Current pipeline state */
  state: PipelineState | null;
  /** Connection status */
  connectionStatus: ConnectionStatus;
  /** Whether connected */
  isConnected: boolean;
  /** Subscribe to a pipeline execution */
  subscribe: (executionId: string) => void;
  /** Unsubscribe from current pipeline */
  unsubscribe: () => void;
  /** Reset state */
  reset: () => void;
}

// =========================================================================
// HOOK
// =========================================================================

export function usePipelineUpdates(
  executionId?: string,
  options: UsePipelineUpdatesOptions = {}
): UsePipelineUpdatesReturn {
  const {
    autoSubscribe = true,
    onStart,
    onProgress,
    onStepStart,
    onStepComplete,
    onStepFail,
    onComplete,
    onFail,
  } = options;

  const [state, setState] = useState<PipelineState | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | undefined>(executionId);

  // WebSocket connection
  const ws = useWebSocket({
    autoReconnect: !!currentExecutionId,
    rooms: currentExecutionId ? [`pipeline:${currentExecutionId}`] : [],
    onEvent: (event) => {
      handleEvent(event.type, event.payload);
    },
  });

  // Handle incoming events
  const handleEvent = useCallback(
    (type: string, payload: unknown) => {
      const data = payload as Record<string, unknown>;

      switch (type) {
        case "pipeline:started": {
          const newState: PipelineState = {
            executionId: data.executionId as string,
            pipelineId: data.pipelineId as string,
            pipelineName: data.pipelineName as string,
            status: "running",
            progress: 0,
            steps: (data.steps as Array<{ id: string; tool: string; status?: string }>).map((s) => ({
              id: s.id,
              tool: s.tool,
              status: (s.status || "pending") as PipelineStep["status"],
            })),
            startedAt: data.startedAt as string,
            totalTokens: 0,
            totalCost: 0,
          };
          setState(newState);
          onStart?.(newState);
          break;
        }

        case "pipeline:progress": {
          const progress = data.progress as number;
          const currentStep = data.currentStep as string | undefined;
          const message = data.message as string | undefined;

          setState((prev) =>
            prev
              ? {
                  ...prev,
                  progress,
                  currentStep,
                  message,
                }
              : prev
          );
          onProgress?.(progress, currentStep);
          break;
        }

        case "pipeline:step:started": {
          const stepId = data.stepId as string;
          const startedAt = data.startedAt as string;

          setState((prev) => {
            if (!prev) return prev;

            const steps = prev.steps.map((s) =>
              s.id === stepId
                ? { ...s, status: "running" as const, startedAt }
                : s
            );

            return {
              ...prev,
              steps,
              currentStep: stepId,
            };
          });

          const step = state?.steps.find((s) => s.id === stepId);
          if (step) {
            onStepStart?.({ ...step, status: "running", startedAt });
          }
          break;
        }

        case "pipeline:step:completed": {
          const stepId = data.stepId as string;
          const completedAt = data.completedAt as string;
          const duration = data.duration as number | undefined;
          const tokens = data.tokens as number | undefined;
          const cost = data.cost as number | undefined;
          const result = data.result;

          setState((prev) => {
            if (!prev) return prev;

            const steps = prev.steps.map((s) =>
              s.id === stepId
                ? {
                    ...s,
                    status: "completed" as const,
                    completedAt,
                    duration,
                    tokens,
                    cost,
                    result,
                  }
                : s
            );

            return {
              ...prev,
              steps,
              totalTokens: prev.totalTokens + (tokens || 0),
              totalCost: prev.totalCost + (cost || 0),
            };
          });

          const step = state?.steps.find((s) => s.id === stepId);
          if (step) {
            onStepComplete?.({
              ...step,
              status: "completed",
              completedAt,
              duration,
              tokens,
              cost,
              result,
            });
          }
          break;
        }

        case "pipeline:step:failed": {
          const stepId = data.stepId as string;
          const error = data.error as string;
          const completedAt = data.completedAt as string;

          setState((prev) => {
            if (!prev) return prev;

            const steps = prev.steps.map((s) =>
              s.id === stepId
                ? { ...s, status: "failed" as const, completedAt, error }
                : s
            );

            return {
              ...prev,
              steps,
            };
          });

          const step = state?.steps.find((s) => s.id === stepId);
          if (step) {
            onStepFail?.({ ...step, status: "failed", completedAt, error });
          }
          break;
        }

        case "pipeline:completed": {
          const completedAt = data.completedAt as string;
          const duration = data.duration as number;
          const totalTokens = data.totalTokens as number;
          const totalCost = data.totalCost as number;
          const result = data.result;
          const steps = data.steps as Array<{
            id: string;
            tool: string;
            status: string;
            duration?: number;
            tokens?: number;
          }>;

          setState((prev) => {
            if (!prev) return prev;

            const newState: PipelineState = {
              ...prev,
              status: "completed",
              progress: 100,
              completedAt,
              duration,
              totalTokens,
              totalCost,
              result,
              steps: prev.steps.map((s) => {
                const updated = steps.find((us) => us.id === s.id);
                return updated
                  ? {
                      ...s,
                      status: updated.status as PipelineStep["status"],
                      duration: updated.duration,
                      tokens: updated.tokens,
                    }
                  : s;
              }),
            };

            onComplete?.(newState);
            return newState;
          });
          break;
        }

        case "pipeline:failed": {
          const completedAt = data.completedAt as string;
          const error = data.error as string;

          setState((prev) => {
            if (!prev) return prev;

            const newState: PipelineState = {
              ...prev,
              status: "failed",
              completedAt,
              error,
            };

            onFail?.(newState, error);
            return newState;
          });
          break;
        }

        case "pipeline:cancelled": {
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  status: "cancelled",
                  completedAt: new Date().toISOString(),
                }
              : prev
          );
          break;
        }
      }
    },
    [state, onStart, onProgress, onStepStart, onStepComplete, onStepFail, onComplete, onFail]
  );

  // Subscribe to a pipeline
  const subscribe = useCallback(
    (newExecutionId: string) => {
      // Unsubscribe from current
      if (currentExecutionId) {
        ws.unsubscribe([`pipeline:${currentExecutionId}`]);
      }

      // Subscribe to new
      setCurrentExecutionId(newExecutionId);
      setState(null);

      if (ws.isConnected) {
        ws.subscribe([`pipeline:${newExecutionId}`]);
      }
    },
    [currentExecutionId, ws]
  );

  // Unsubscribe from current pipeline
  const unsubscribe = useCallback(() => {
    if (currentExecutionId) {
      ws.unsubscribe([`pipeline:${currentExecutionId}`]);
    }
    setCurrentExecutionId(undefined);
    setState(null);
  }, [currentExecutionId, ws]);

  // Reset state
  const reset = useCallback(() => {
    setState(null);
  }, []);

  // Auto-subscribe when executionId changes
  useEffect(() => {
    if (executionId && autoSubscribe) {
      setCurrentExecutionId(executionId);
    }
  }, [executionId, autoSubscribe]);

  // Subscribe when connected
  useEffect(() => {
    if (ws.isConnected && currentExecutionId) {
      ws.subscribe([`pipeline:${currentExecutionId}`]);
    }
  }, [ws.isConnected, currentExecutionId, ws]);

  return {
    state,
    connectionStatus: ws.status,
    isConnected: ws.isConnected,
    subscribe,
    unsubscribe,
    reset,
  };
}

export default usePipelineUpdates;
