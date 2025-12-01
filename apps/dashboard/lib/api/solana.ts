/**
 * Solana Wallet Balance API (via server-side route to avoid CORS)
 */

export interface WalletBalance {
  sol: number;
  usdc: number;
  solPrice: number;
  totalUsd: number;
  address: string;
  lastUpdated: number;
}

export async function getWalletBalance(): Promise<WalletBalance | null> {
  try {
    const res = await fetch("/api/wallet", {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const solanaApi = {
  getWalletBalance,
};
