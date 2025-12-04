/**
 * Jupiter swap utilities
 * Helpers for token swaps via Jupiter aggregator
 */

import { PublicKey, VersionedTransaction, Connection } from "@solana/web3.js";
import { z } from "zod";

// Jupiter API endpoints
export const JUPITER_API = {
  V6_QUOTE: "https://quote-api.jup.ag/v6/quote",
  V6_SWAP: "https://quote-api.jup.ag/v6/swap",
  PRICE: "https://price.jup.ag/v6/price",
  TOKEN_LIST: "https://token.jup.ag/all",
} as const;

// Common token mints
export const TOKENS = {
  SOL: new PublicKey("So11111111111111111111111111111111111111112"),
  USDC: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  USDT: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
  BONK: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
  JUP: new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"),
  RAY: new PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"),
} as const;

// Quote response schema
export const JupiterQuoteSchema = z.object({
  inputMint: z.string(),
  outputMint: z.string(),
  inAmount: z.string(),
  outAmount: z.string(),
  priceImpactPct: z.string(),
  marketInfos: z.array(z.object({
    id: z.string(),
    label: z.string(),
    inputMint: z.string(),
    outputMint: z.string(),
    inAmount: z.string(),
    outAmount: z.string(),
    lpFee: z.object({
      amount: z.string(),
      mint: z.string(),
      pct: z.string(),
    }),
    platformFee: z.object({
      amount: z.string(),
      mint: z.string(),
      pct: z.string(),
    }),
  })),
  slippageBps: z.number(),
  otherAmountThreshold: z.string(),
  swapMode: z.string(),
  routePlan: z.array(z.object({
    swapInfo: z.object({
      ammKey: z.string(),
      label: z.string().optional(),
      inputMint: z.string(),
      outputMint: z.string(),
      inAmount: z.string(),
      outAmount: z.string(),
      feeAmount: z.string(),
      feeMint: z.string(),
    }),
    percent: z.number(),
  })),
});

export type JupiterQuote = z.infer<typeof JupiterQuoteSchema>;

// Get swap quote
export async function getJupiterQuote(params: {
  inputMint: string | PublicKey;
  outputMint: string | PublicKey;
  amount: string | number;
  slippageBps?: number;
  onlyDirectRoutes?: boolean;
}): Promise<JupiterQuote> {
  const { inputMint, outputMint, amount, slippageBps = 50, onlyDirectRoutes = false } = params;

  const url = new URL(JUPITER_API.V6_QUOTE);
  url.searchParams.set("inputMint", inputMint.toString());
  url.searchParams.set("outputMint", outputMint.toString());
  url.searchParams.set("amount", amount.toString());
  url.searchParams.set("slippageBps", slippageBps.toString());
  if (onlyDirectRoutes) {
    url.searchParams.set("onlyDirectRoutes", "true");
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Jupiter quote failed: ${response.statusText}`);
  }

  const data = await response.json();
  return JupiterQuoteSchema.parse(data);
}

// Get swap transaction
export async function getJupiterSwapTransaction(params: {
  quote: JupiterQuote;
  userPublicKey: string | PublicKey;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number;
}): Promise<VersionedTransaction> {
  const {
    quote,
    userPublicKey,
    wrapAndUnwrapSol = true,
    dynamicComputeUnitLimit = true,
    prioritizationFeeLamports,
  } = params;

  const response = await fetch(JUPITER_API.V6_SWAP, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: userPublicKey.toString(),
      wrapAndUnwrapSol,
      dynamicComputeUnitLimit,
      prioritizationFeeLamports,
    }),
  });

  if (!response.ok) {
    throw new Error(`Jupiter swap failed: ${response.statusText}`);
  }

  const { swapTransaction } = await response.json();
  const transactionBuffer = Buffer.from(swapTransaction, "base64");
  return VersionedTransaction.deserialize(transactionBuffer);
}

// Price API
export const JupiterPriceSchema = z.object({
  data: z.record(z.object({
    id: z.string(),
    mintSymbol: z.string(),
    vsToken: z.string(),
    vsTokenSymbol: z.string(),
    price: z.number(),
  })),
  timeTaken: z.number(),
});

export type JupiterPrice = z.infer<typeof JupiterPriceSchema>;

export async function getTokenPrice(
  mints: (string | PublicKey)[],
  vsToken: string = "USDC"
): Promise<JupiterPrice> {
  const ids = mints.map((m) => m.toString()).join(",");
  const url = `${JUPITER_API.PRICE}?ids=${ids}&vsToken=${vsToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jupiter price API failed: ${response.statusText}`);
  }

  const data = await response.json();
  return JupiterPriceSchema.parse(data);
}

// Calculate output amount with slippage
export function calculateMinimumReceived(
  outAmount: string,
  slippageBps: number
): bigint {
  const amount = BigInt(outAmount);
  const slippageFactor = BigInt(10000 - slippageBps);
  return (amount * slippageFactor) / 10000n;
}
