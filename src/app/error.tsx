"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (replace with error tracking service like Sentry in production)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-300 via-emerald-300 to-teal-300 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-12 text-center">
          {/* Error Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Message */}
          <h2 className="text-3xl font-black text-black mb-4">
            Something Went Wrong
          </h2>
          <p className="text-lg text-black/60 mb-8 max-w-md mx-auto">
            We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-left">
              <p className="text-sm font-mono text-red-800 dark:text-red-400 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={reset}
              className="gap-2 bg-lime-500 hover:bg-lime-600 text-black font-bold"
            >
              <RefreshCw size={18} />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" className="gap-2 border-black/20 hover:border-black/40">
                <Home size={18} />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Additional Help */}
          <div className="mt-12 pt-8 border-t border-black/10">
            <p className="text-sm text-black/50 mb-4">
              Still having issues?
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a
                href="https://github.com/gicm/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/60 hover:text-black font-medium transition-colors"
              >
                Report Issue
              </a>
              <span className="text-black/30">•</span>
              <a
                href="https://docs.claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/60 hover:text-black font-medium transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
