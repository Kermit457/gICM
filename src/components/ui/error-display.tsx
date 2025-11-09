"use client";

import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "./button";

export interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: "inline" | "card" | "banner";
}

export function ErrorDisplay({
  title = "Error",
  message,
  onRetry,
  onDismiss,
  variant = "card",
}: ErrorDisplayProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-900">{title}</p>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs font-medium text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="bg-red-600 text-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{message}</p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="bg-white text-red-600 border-white hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>

      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>

      <p className="text-sm text-zinc-600 mb-6 max-w-md mx-auto">{message}</p>

      {(onRetry || onDismiss) && (
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="bg-black text-white hover:bg-black/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="outline"
              className="border-black/20 hover:bg-black/5"
            >
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
