"use client";

import { CheckCircle2, XCircle, AlertCircle, FileCheck, Package } from "lucide-react";
import type { InstallationResult } from "@/lib/install-verification";
import { Card } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";

interface InstallVerificationDisplayProps {
  result: InstallationResult;
  compact?: boolean;
}

export function InstallVerificationDisplay({ result, compact = false }: InstallVerificationDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {result.success ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-700">Installed</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-700">Failed</span>
          </>
        )}
      </div>
    );
  }

  const filesSuccessRate =
    result.filesExpected.length > 0
      ? (result.filesCreated.length / result.filesExpected.length) * 100
      : 100;

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          {result.success ? (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          )}

          <div>
            <h3 className="font-semibold text-black">{result.itemName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {result.itemKind}
              </Badge>
              <span className="text-xs text-zinc-500">
                {new Date(result.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <Badge variant={result.success ? "default" : "destructive"} className="bg-black text-white">
          {result.success ? "Verified" : "Failed"}
        </Badge>
      </div>

      {/* Files Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-zinc-500" />
            <span className="font-medium text-black">Files</span>
          </div>
          <span className="text-zinc-600">
            {result.filesCreated.length} / {result.filesExpected.length}
          </span>
        </div>
        <Progress value={filesSuccessRate} className="h-2" />
      </div>

      {/* Dependencies */}
      {result.filesExpected.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm mb-2">
            <Package className="w-4 h-4 text-zinc-500" />
            <span className="font-medium text-black">Dependencies</span>
            <Badge variant={result.dependenciesResolved ? "default" : "destructive"} className="text-xs bg-black text-white">
              {result.dependenciesResolved ? "Resolved" : "Missing"}
            </Badge>
          </div>
        </div>
      )}

      {/* Missing Files */}
      {result.filesMissing.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 mb-1">Missing Files</p>
              <ul className="text-xs text-red-700 space-y-1">
                {result.filesMissing.map((file, idx) => (
                  <li key={idx} className="font-mono">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Missing Dependencies */}
      {result.dependenciesMissing.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900 mb-1">Missing Dependencies</p>
              <ul className="text-xs text-orange-700 space-y-1">
                {result.dependenciesMissing.map((dep, idx) => (
                  <li key={idx}>
                    {dep}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {result.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-900 mb-1">Error</p>
          <p className="text-xs text-red-700">{result.error}</p>
        </div>
      )}

      {/* Success Message */}
      {result.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Installation verified successfully!
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

interface InstallVerificationListProps {
  results: InstallationResult[];
  title?: string;
  emptyMessage?: string;
}

export function InstallVerificationList({
  results,
  title = "Installation History",
  emptyMessage = "No installations yet",
}: InstallVerificationListProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
        <p className="text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-black">{title}</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-zinc-600">{successful} successful</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-zinc-600">{failed} failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {results.map((result, idx) => (
          <InstallVerificationDisplay key={idx} result={result} />
        ))}
      </div>
    </div>
  );
}

interface InstallVerificationStatsProps {
  stats: {
    totalInstalls: number;
    successfulInstalls: number;
    failedInstalls: number;
    successRate: number;
    byKind: Record<string, number>;
  };
}

export function InstallVerificationStats({ stats }: InstallVerificationStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600 mb-1">Total Installs</p>
            <p className="text-2xl font-bold text-black">{stats.totalInstalls}</p>
          </div>
          <Package className="w-8 h-8 text-zinc-300" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600 mb-1">Successful</p>
            <p className="text-2xl font-bold text-green-600">{stats.successfulInstalls}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-green-300" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-600">{stats.failedInstalls}</p>
          </div>
          <XCircle className="w-8 h-8 text-red-300" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-black">{stats.successRate.toFixed(1)}%</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-lime-300 flex items-center justify-center">
            <span className="text-xs font-bold text-black">
              {Math.round(stats.successRate)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
