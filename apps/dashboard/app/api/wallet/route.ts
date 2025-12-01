import { NextResponse } from "next/server";

const HELIUS_RPC = process.env.HELIUS_RPC || "https://api.mainnet-beta.solana.com";
const WALLET_ADDRESS = process.env.NEXT_PUBLIC_GICM_WALLET;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_DECIMALS = 9;

async function getSolPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return 230;
    const data = await res.json();
    return data.solana?.usd ?? 230;
  } catch {
    return 230;
  }
}

async function getSolBalance(address: string): Promise<number> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const lamports = data.result?.value ?? 0;
    return lamports / Math.pow(10, SOL_DECIMALS);
  } catch {
    return 0;
  }
}

async function getUsdcBalance(address: string): Promise<number> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          address,
          { mint: USDC_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const accounts = data.result?.value ?? [];
    if (accounts.length === 0) return 0;
    return accounts[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  if (!WALLET_ADDRESS) {
    return NextResponse.json({ error: "No wallet configured" }, { status: 400 });
  }

  try {
    const [sol, usdc, solPrice] = await Promise.all([
      getSolBalance(WALLET_ADDRESS),
      getUsdcBalance(WALLET_ADDRESS),
      getSolPrice(),
    ]);

    const totalUsd = sol * solPrice + usdc;

    return NextResponse.json({
      sol,
      usdc,
      solPrice,
      totalUsd,
      address: WALLET_ADDRESS,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
  }
}
