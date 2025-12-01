"use client";

import { useDashboardStore } from "@/lib/store";
import { Wallet, Clock, RefreshCw } from "lucide-react";

export function TreasuryOverview() {
  const { treasury, fetchTreasury, loading } = useDashboardStore();

  const formatUsd = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatCrypto = (value: number, decimals = 4) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Wallet className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">Treasury</h2>
        </div>

        <button
          onClick={fetchTreasury}
          disabled={loading.treasury}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
        >
          <RefreshCw className={"w-4 h-4 " + (loading.treasury ? "animate-spin" : "")} />
        </button>
      </div>

      {!treasury ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-700 rounded w-2/3"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center py-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Total Value</p>
            <p className="text-3xl font-bold text-white">
              {formatUsd(treasury.totalUsd)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">SOL Balance</p>
              <p className="text-xl font-semibold text-white">
                {formatCrypto(treasury.solBalance)} SOL
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">USDC Balance</p>
              <p className="text-xl font-semibold text-white">
                {formatCrypto(treasury.usdcBalance, 2)} USDC
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-blue-900/30 rounded-lg">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Runway</p>
              <p className="text-lg font-semibold text-white">
                {treasury.runway.toFixed(1)} months
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
