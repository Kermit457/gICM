"use client";

import { useState } from "react";
import { toast } from "sonner";

export interface APIError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export function useApiError() {
  const [error, setError] = useState<APIError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = (error: unknown, context?: string) => {
    console.error(`API Error${context ? ` (${context})` : ''}:`, error);

    let errorMessage = "An unexpected error occurred";
    let errorCode: string | undefined;
    let errorDetails: Record<string, unknown> | undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      const err = error as Record<string, unknown>;
      errorMessage = (err.message as string) || (err.error as string) || errorMessage;
      errorCode = err.code as string | undefined;
      errorDetails = err.details as Record<string, unknown> | undefined;
    }

    const apiError: APIError = {
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
    };

    setError(apiError);

    // Show toast notification
    toast.error(context ? `${context}: ${errorMessage}` : errorMessage, {
      duration: 5000,
      action: errorCode === "NETWORK_ERROR" ? {
        label: "Retry",
        onClick: () => window.location.reload(),
      } : undefined,
    });

    return apiError;
  };

  const clearError = () => {
    setError(null);
  };

  const executeAsync = async <T,>(
    apiCall: () => Promise<T>,
    options?: {
      context?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: APIError) => void;
      successMessage?: string;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    clearError();

    try {
      const result = await apiCall();

      if (options?.successMessage) {
        toast.success(options.successMessage);
      }

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (err) {
      const apiError = handleError(err, options?.context);

      if (options?.onError) {
        options.onError(apiError);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeAsync,
  };
}

// Helper function for fetch with error handling
export async function fetchWithError<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Response body is not JSON, use status text
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error: Please check your internet connection");
    }
    throw error;
  }
}

// Retry helper for failed API calls
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}
