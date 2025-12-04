# Jupiter Trader - Complete DEX Aggregator Integration

> **ID:** `jupiter-trader`
> **Tier:** 1 (Critical - Always Available)
> **Token Cost:** 8000
> **MCP Connections:** jupiter
> **Version:** 6 (Latest API)

## 🎯 What This Skill Does

Master Jupiter DEX aggregator integration for optimal token swapping on Solana. This skill covers the complete Jupiter v6 API, including quote fetching, route optimization, slippage protection, and swap execution with real production patterns.

**Core Capabilities:**
- Jupiter v6 API integration (latest)
- Quote fetching with price impact analysis
- Route optimization across all Solana DEXs
- Slippage management and MEV protection
- Versioned transaction support
- Priority fees and compute optimization
- Error handling and retry strategies

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** swap, jupiter, buy token, sell token, exchange, dex, quote, route, slippage
- **File Types:** .ts, .tsx, .rs
- **Directories:** N/A

**Use this skill when:**
- Building token swap interfaces
- Integrating DEX aggregation
- Calculating optimal swap routes
- Managing price impact and slippage
- Executing production swaps
- Building trading bots
- Implementing limit orders

## 🚀 Core Capabilities

### 1. Jupiter v6 API Integration

Jupiter v6 is the latest version with improved routing and reduced price impact.

**Architecture Overview:**
```
User Input → Quote API → Route Selection → Swap API → Transaction → Signature
     ↓
  Slippage
  Priority Fee
  Compute Units
```

**Setup:**

```typescript
// packages/jupiter-integration/src/client.ts
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';

export class JupiterClient {
  private connection: Connection;
  private baseUrl = 'https://quote-api.jup.ag/v6';

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Get quote for token swap
   * @param inputMint - Input token mint address
   * @param outputMint - Output token mint address
   * @param amount - Amount in smallest unit (e.g., lamports for SOL)
   * @param slippageBps - Slippage in basis points (50 = 0.5%)
   */
  async getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
    onlyDirectRoutes?: boolean;
    asLegacyTransaction?: boolean;
  }) {
    const {
      inputMint,
      outputMint,
      amount,
      slippageBps = 50, // 0.5% default
      onlyDirectRoutes = false,
      asLegacyTransaction = false,
    } = params;

    const url = new URL(`${this.baseUrl}/quote`);
    url.searchParams.append('inputMint', inputMint);
    url.searchParams.append('outputMint', outputMint);
    url.searchParams.append('amount', amount.toString());
    url.searchParams.append('slippageBps', slippageBps.toString());

    if (onlyDirectRoutes) {
      url.searchParams.append('onlyDirectRoutes', 'true');
    }

    if (asLegacyTransaction) {
      url.searchParams.append('asLegacyTransaction', 'true');
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }

    return response.json() as Promise<QuoteResponse>;
  }

  /**
   * Get swap transaction for executing the quote
   */
  async getSwapTransaction(params: {
    quoteResponse: QuoteResponse;
    userPublicKey: string;
    wrapUnwrapSOL?: boolean;
    feeAccount?: string;
    prioritizationFeeLamports?: number;
    dynamicComputeUnitLimit?: boolean;
  }) {
    const {
      quoteResponse,
      userPublicKey,
      wrapUnwrapSOL = true,
      feeAccount,
      prioritizationFeeLamports,
      dynamicComputeUnitLimit = true,
    } = params;

    const swapRequest = {
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: wrapUnwrapSOL,
      dynamicComputeUnitLimit,
      ...(feeAccount && { feeAccount }),
      ...(prioritizationFeeLamports && {
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: prioritizationFeeLamports,
          },
        },
      }),
    };

    const response = await fetch(`${this.baseUrl}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequest),
    });

    if (!response.ok) {
      throw new Error(`Jupiter swap API error: ${response.statusText}`);
    }

    return response.json() as Promise<SwapResponse>;
  }

  /**
   * Execute swap with automatic retry and error handling
   */
  async executeSwap(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    userPublicKey: PublicKey;
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
    slippageBps?: number;
    prioritizationFeeLamports?: number;
  }): Promise<SwapResult> {
    const {
      inputMint,
      outputMint,
      amount,
      userPublicKey,
      signTransaction,
      slippageBps = 50,
      prioritizationFeeLamports = 1000,
    } = params;

    try {
      // Step 1: Get quote
      const quote = await this.getQuote({
        inputMint,
        outputMint,
        amount,
        slippageBps,
      });

      // Step 2: Get swap transaction
      const { swapTransaction } = await this.getSwapTransaction({
        quoteResponse: quote,
        userPublicKey: userPublicKey.toBase58(),
        prioritizationFeeLamports,
      });

      // Step 3: Deserialize and sign transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      const signedTransaction = await signTransaction(transaction);

      // Step 4: Send transaction with retry
      const txid = await this.sendAndConfirmTransaction(signedTransaction);

      return {
        success: true,
        signature: txid,
        inputAmount: amount,
        outputAmount: parseInt(quote.outAmount),
        priceImpactPct: quote.priceImpactPct,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send transaction with retry logic
   */
  private async sendAndConfirmTransaction(
    transaction: VersionedTransaction,
    maxRetries = 3
  ): Promise<string> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const signature = await this.connection.sendTransaction(transaction, {
          skipPreflight: false,
          maxRetries: 2,
        });

        // Wait for confirmation
        const confirmation = await this.connection.confirmTransaction(
          signature,
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        return signature;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Wait before retry (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }
}

// Types
export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: {
    amount: string;
    feeBps: number;
  } | null;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface SwapResponse {
  swapTransaction: string; // Base64 encoded transaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}

export interface SwapResult {
  success: boolean;
  signature?: string;
  inputAmount?: number;
  outputAmount?: number;
  priceImpactPct?: string;
  error?: string;
}
```

**Best Practices:**
- Always use the latest v6 API endpoint
- Enable `dynamicComputeUnitLimit` for optimal compute usage
- Use versioned transactions (not legacy)
- Set reasonable priority fees (1000-5000 lamports)
- Always check `priceImpactPct` before swapping
- Use `onlyDirectRoutes` for lower slippage on large trades

**Common Patterns:**
```typescript
// Pattern 1: Simple SOL → USDC swap
const client = new JupiterClient(process.env.RPC_URL!);

const result = await client.executeSwap({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: 1_000_000_000, // 1 SOL
  userPublicKey: wallet.publicKey,
  signTransaction: wallet.signTransaction,
  slippageBps: 50, // 0.5%
});

console.log('Swap signature:', result.signature);

// Pattern 2: Get best route without executing
const quote = await client.getQuote({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: 1_000_000_000,
  slippageBps: 50,
});

console.log('Output amount:', quote.outAmount);
console.log('Price impact:', quote.priceImpactPct);
console.log('Route:', quote.routePlan.map(r => r.swapInfo.label).join(' → '));

// Pattern 3: High-priority swap (frontrun protection)
const result = await client.executeSwap({
  inputMint: TOKEN_A,
  outputMint: TOKEN_B,
  amount: 1_000_000,
  userPublicKey: wallet.publicKey,
  signTransaction: wallet.signTransaction,
  slippageBps: 100, // 1% for volatile tokens
  prioritizationFeeLamports: 10_000, // High priority
});
```

**Gotchas:**
- ❌ Don't use legacy transactions (slower, higher fees)
- ❌ Don't ignore `priceImpactPct` (can cause huge losses)
- ❌ Don't use 0 slippage (transactions will fail)
- ❌ Don't skip priority fees in congested network
- ✅ Always deserialize transactions correctly
- ✅ Always confirm transactions before showing success
- ✅ Always handle network errors with retry logic

### 2. Quote Fetching & Route Analysis

**Understanding Jupiter Quotes:**

A quote contains:
- **Input/Output amounts** - What you give and get
- **Price impact** - How much your trade moves the market
- **Route plan** - Path through different DEXs
- **Slippage** - Max acceptable price change
- **Fees** - Platform and DEX fees

**Advanced Quote Patterns:**

```typescript
// src/quote-analyzer.ts
export class QuoteAnalyzer {
  /**
   * Compare multiple quotes to find the best one
   */
  async getBestQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageOptions: number[]; // [50, 100, 300]
  }) {
    const { inputMint, outputMint, amount, slippageOptions } = params;

    const client = new JupiterClient(process.env.RPC_URL!);

    const quotes = await Promise.all(
      slippageOptions.map(slippageBps =>
        client.getQuote({
          inputMint,
          outputMint,
          amount,
          slippageBps,
        })
      )
    );

    // Find quote with best output amount and acceptable impact
    const bestQuote = quotes.reduce((best, current) => {
      const currentOutput = parseInt(current.outAmount);
      const bestOutput = parseInt(best.outAmount);
      const currentImpact = parseFloat(current.priceImpactPct);

      // Prefer higher output with acceptable impact (<5%)
      if (currentOutput > bestOutput && currentImpact < 5) {
        return current;
      }
      return best;
    });

    return {
      quote: bestQuote,
      allQuotes: quotes,
      analysis: {
        bestOutput: bestQuote.outAmount,
        priceImpact: bestQuote.priceImpactPct,
        route: this.formatRoute(bestQuote.routePlan),
        estimatedFee: this.calculateTotalFee(bestQuote),
      },
    };
  }

  /**
   * Format route for display
   */
  private formatRoute(routePlan: RoutePlan[]): string {
    return routePlan
      .map(step => `${step.swapInfo.label} (${step.percent}%)`)
      .join(' → ');
  }

  /**
   * Calculate total fees in SOL
   */
  private calculateTotalFee(quote: QuoteResponse): number {
    let totalFee = 0;

    // Platform fee
    if (quote.platformFee) {
      totalFee += parseInt(quote.platformFee.amount);
    }

    // DEX fees
    quote.routePlan.forEach(step => {
      totalFee += parseInt(step.swapInfo.feeAmount);
    });

    return totalFee / 1e9; // Convert to SOL
  }

  /**
   * Calculate price per token
   */
  getPricePerToken(quote: QuoteResponse, inputDecimals: number, outputDecimals: number) {
    const inputAmount = parseInt(quote.inAmount) / Math.pow(10, inputDecimals);
    const outputAmount = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);

    return {
      price: outputAmount / inputAmount,
      inversePrice: inputAmount / outputAmount,
      formatted: `1 ${quote.inputMint.slice(0, 4)}... = ${(outputAmount / inputAmount).toFixed(6)} ${quote.outputMint.slice(0, 4)}...`,
    };
  }

  /**
   * Check if quote is acceptable for execution
   */
  isQuoteAcceptable(quote: QuoteResponse, maxImpactPct = 5): boolean {
    const impact = parseFloat(quote.priceImpactPct);
    const hasOutput = parseInt(quote.outAmount) > 0;
    const hasValidRoute = quote.routePlan.length > 0;

    return impact < maxImpactPct && hasOutput && hasValidRoute;
  }
}
```

**Best Practices:**
- Compare quotes with different slippage settings
- Always check price impact before execution
- Show users the complete route
- Calculate and display all fees
- Set maximum acceptable impact (usually 5%)
- Refresh quotes every 30 seconds in UI

### 3. Slippage Management

Slippage is the difference between expected and actual execution price.

**Slippage Guidelines:**

| Trade Size | Liquidity | Recommended Slippage |
|-----------|-----------|---------------------|
| Small (<$100) | High | 0.1% (10 bps) |
| Medium ($100-$10k) | High | 0.5% (50 bps) |
| Large (>$10k) | High | 1% (100 bps) |
| Any | Low liquidity | 2-5% (200-500 bps) |
| Meme coins | Low | 5-10% (500-1000 bps) |

**Adaptive Slippage Strategy:**

```typescript
// src/slippage-manager.ts
export class SlippageManager {
  /**
   * Calculate optimal slippage based on trade parameters
   */
  calculateOptimalSlippage(params: {
    inputAmount: number;
    inputMint: string;
    outputMint: string;
    liquidity: number;
    volatility: number;
  }): number {
    const { inputAmount, liquidity, volatility } = params;

    // Base slippage (in bps)
    let slippageBps = 50; // 0.5% default

    // Increase for large trades relative to liquidity
    const tradeImpact = inputAmount / liquidity;
    if (tradeImpact > 0.1) slippageBps += 50; // >10% of liquidity
    if (tradeImpact > 0.2) slippageBps += 100; // >20% of liquidity

    // Increase for volatile tokens
    if (volatility > 0.1) slippageBps += 50; // High volatility
    if (volatility > 0.2) slippageBps += 100; // Very high volatility

    // Cap at reasonable maximum
    return Math.min(slippageBps, 1000); // Max 10%
  }

  /**
   * Validate slippage before swap
   */
  validateSlippage(slippageBps: number, tradeValue: number): {
    valid: boolean;
    warning?: string;
  } {
    // Warn on high slippage
    if (slippageBps > 300) {
      return {
        valid: true,
        warning: `High slippage (${slippageBps / 100}%) - you may lose ${(tradeValue * slippageBps) / 10000} on this trade`,
      };
    }

    // Reject unreasonable slippage
    if (slippageBps > 1000) {
      return {
        valid: false,
        warning: 'Slippage too high (>10%) - trade rejected for safety',
      };
    }

    return { valid: true };
  }

  /**
   * Check actual slippage after execution
   */
  async checkActualSlippage(params: {
    expectedOutput: number;
    actualOutput: number;
    maxSlippageBps: number;
  }): Promise<{ acceptable: boolean; actualSlippageBps: number }> {
    const { expectedOutput, actualOutput, maxSlippageBps } = params;

    const slippage = (expectedOutput - actualOutput) / expectedOutput;
    const actualSlippageBps = Math.round(slippage * 10000);

    return {
      acceptable: actualSlippageBps <= maxSlippageBps,
      actualSlippageBps,
    };
  }
}
```

**Best Practices:**
- Start with 0.5% (50 bps) for normal tokens
- Increase to 1-2% for low liquidity
- Use 5%+ only for meme coins (with warning)
- Show users estimated loss from slippage
- Validate slippage before execution
- Check actual slippage after execution

### 4. Priority Fees & MEV Protection

**Understanding Priority Fees:**

Priority fees determine transaction ordering. Higher fees = faster execution.

```typescript
// src/priority-fee-manager.ts
export class PriorityFeeManager {
  /**
   * Get current priority fee recommendations
   */
  async getRecommendedFee(connection: Connection): Promise<{
    low: number;
    medium: number;
    high: number;
  }> {
    try {
      // Get recent prioritization fees
      const recentFees = await connection.getRecentPrioritizationFees();

      if (recentFees.length === 0) {
        return { low: 1_000, medium: 5_000, high: 10_000 };
      }

      const fees = recentFees
        .map(f => f.prioritizationFee)
        .sort((a, b) => a - b);

      return {
        low: fees[Math.floor(fees.length * 0.25)] || 1_000,
        medium: fees[Math.floor(fees.length * 0.50)] || 5_000,
        high: fees[Math.floor(fees.length * 0.75)] || 10_000,
      };
    } catch {
      return { low: 1_000, medium: 5_000, high: 10_000 };
    }
  }

  /**
   * Calculate optimal priority fee for trade
   */
  async calculateOptimalFee(params: {
    connection: Connection;
    tradeValue: number;
    urgency: 'low' | 'medium' | 'high';
  }): Promise<number> {
    const { connection, tradeValue, urgency } = params;

    const recommendations = await this.getRecommendedFee(connection);

    // Base fee on urgency
    let baseFee = recommendations[urgency];

    // Scale with trade value (larger trades deserve higher priority)
    if (tradeValue > 10_000) {
      baseFee *= 2;
    } else if (tradeValue > 100_000) {
      baseFee *= 5;
    }

    return Math.min(baseFee, 100_000); // Cap at 0.0001 SOL
  }
}
```

**MEV Protection Strategies:**

```typescript
/**
 * Execute swap with MEV protection
 */
async function swapWithMEVProtection(params: {
  client: JupiterClient;
  quote: QuoteResponse;
  userPublicKey: PublicKey;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
}) {
  const { client, quote, userPublicKey, signTransaction } = params;

  // Strategy 1: High priority fee
  const priorityFee = 50_000; // 0.00005 SOL - high priority

  // Strategy 2: Low slippage to prevent sandwich attacks
  const protectedQuote = await client.getQuote({
    inputMint: quote.inputMint,
    outputMint: quote.outputMint,
    amount: parseInt(quote.inAmount),
    slippageBps: 30, // Tight slippage = harder to sandwich
  });

  // Strategy 3: Use versioned transactions (faster)
  const { swapTransaction } = await client.getSwapTransaction({
    quoteResponse: protectedQuote,
    userPublicKey: userPublicKey.toBase58(),
    prioritizationFeeLamports: priorityFee,
    dynamicComputeUnitLimit: true,
  });

  // Execute
  const swapTxBuf = Buffer.from(swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTxBuf);
  const signed = await signTransaction(transaction);

  return await client.connection.sendTransaction(signed, {
    skipPreflight: false,
    maxRetries: 3,
  });
}
```

**Best Practices:**
- Use dynamic compute unit limits
- Set priority fees based on network conditions
- Use tight slippage for MEV protection
- Monitor mempool for suspicious activity
- Execute during low congestion when possible

## 💡 Real-World Examples

### Example 1: React Swap Component

Complete swap interface with Jupiter integration:

```typescript
// components/TokenSwap.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { JupiterClient, QuoteResponse } from '@/lib/jupiter';

export function TokenSwap() {
  const wallet = useWallet();
  const [inputMint, setInputMint] = useState('So11111111111111111111111111111111111111112'); // SOL
  const [outputMint, setOutputMint] = useState('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const client = new JupiterClient(process.env.NEXT_PUBLIC_RPC_URL!);

  // Fetch quote when amount changes
  useEffect(() => {
    if (!amount || parseFloat(amount) === 0) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setLoading(true);
      try {
        const amountLamports = parseFloat(amount) * 1e9;
        const quoteResponse = await client.getQuote({
          inputMint,
          outputMint,
          amount: Math.floor(amountLamports),
          slippageBps: 50,
        });
        setQuote(quoteResponse);
      } catch (error) {
        console.error('Error fetching quote:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce quote fetching
    const timeout = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeout);
  }, [amount, inputMint, outputMint]);

  const executeSwap = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !quote) return;

    setSwapping(true);
    try {
      const result = await client.executeSwap({
        inputMint,
        outputMint,
        amount: parseInt(quote.inAmount),
        userPublicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        slippageBps: 50,
        prioritizationFeeLamports: 5000,
      });

      if (result.success) {
        alert(`Swap successful! Signature: ${result.signature}`);
        setAmount('');
        setQuote(null);
      } else {
        alert(`Swap failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Swap error:', error);
      alert('Swap failed');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Swap Tokens</h2>

      {/* Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">You pay</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full px-4 py-2 border rounded"
        />
        <div className="text-sm text-gray-500 mt-1">SOL</div>
      </div>

      {/* Quote */}
      {loading && <div className="text-center py-4">Loading quote...</div>}

      {quote && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <div className="flex justify-between mb-2">
            <span>You receive</span>
            <span className="font-bold">
              {(parseInt(quote.outAmount) / 1e6).toFixed(2)} USDC
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Price impact</span>
            <span className={parseFloat(quote.priceImpactPct) > 5 ? 'text-red-600' : ''}>
              {quote.priceImpactPct}%
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Route</span>
            <span className="text-right">
              {quote.routePlan.map(r => r.swapInfo.label).join(' → ')}
            </span>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={executeSwap}
        disabled={!wallet.connected || !quote || swapping}
        className="w-full bg-blue-600 text-white py-3 rounded font-semibold disabled:bg-gray-300"
      >
        {!wallet.connected ? 'Connect Wallet' : swapping ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
}
```

### Example 2: Trading Bot

Automated trading bot with Jupiter:

```typescript
// bot/jupiter-bot.ts
import { JupiterClient } from './jupiter-client';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export class JupiterTradingBot {
  private client: JupiterClient;
  private wallet: Keypair;

  constructor(rpcUrl: string, privateKey: Uint8Array) {
    this.client = new JupiterClient(rpcUrl);
    this.wallet = Keypair.fromSecretKey(privateKey);
  }

  /**
   * Buy token when price drops below threshold
   */
  async buyDip(params: {
    tokenMint: string;
    maxPriceInSOL: number;
    amountSOL: number;
  }) {
    const { tokenMint, maxPriceInSOL, amountSOL } = params;

    // Get current price
    const quote = await this.client.getQuote({
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: tokenMint,
      amount: 1_000_000_000, // 1 SOL for price check
      slippageBps: 50,
    });

    const tokensPerSOL = parseInt(quote.outAmount);
    const priceInSOL = 1 / tokensPerSOL;

    console.log(`Current price: ${priceInSOL} SOL`);

    // Check if price is below threshold
    if (priceInSOL <= maxPriceInSOL) {
      console.log('Price below threshold, executing buy...');

      const result = await this.client.executeSwap({
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: tokenMint,
        amount: Math.floor(amountSOL * 1e9),
        userPublicKey: this.wallet.publicKey,
        signTransaction: async (tx) => {
          tx.sign([this.wallet]);
          return tx;
        },
        slippageBps: 100, // 1% slippage for safety
        prioritizationFeeLamports: 10_000, // High priority
      });

      if (result.success) {
        console.log(`Buy executed! Signature: ${result.signature}`);
        console.log(`Received: ${result.outputAmount} tokens`);
      } else {
        console.error(`Buy failed: ${result.error}`);
      }
    } else {
      console.log('Price too high, waiting...');
    }
  }

  /**
   * Take profit when price rises above threshold
   */
  async takeProfit(params: {
    tokenMint: string;
    minPriceInSOL: number;
    amountTokens: number;
  }) {
    const { tokenMint, minPriceInSOL, amountTokens } = params;

    // Similar to buyDip but reversed
    const quote = await this.client.getQuote({
      inputMint: tokenMint,
      outputMint: 'So11111111111111111111111111111111111111112', // SOL
      amount: Math.floor(amountTokens),
      slippageBps: 50,
    });

    const solPerToken = parseInt(quote.outAmount) / amountTokens;

    console.log(`Current price: ${solPerToken} SOL per token`);

    if (solPerToken >= minPriceInSOL) {
      console.log('Price above threshold, taking profit...');

      const result = await this.client.executeSwap({
        inputMint: tokenMint,
        outputMint: 'So11111111111111111111111111111111111111112',
        amount: Math.floor(amountTokens),
        userPublicKey: this.wallet.publicKey,
        signTransaction: async (tx) => {
          tx.sign([this.wallet]);
          return tx;
        },
        slippageBps: 100,
        prioritizationFeeLamports: 10_000,
      });

      if (result.success) {
        console.log(`Profit taken! Signature: ${result.signature}`);
        console.log(`Received: ${(result.outputAmount || 0) / 1e9} SOL`);
      }
    }
  }

  /**
   * Monitor and execute strategy continuously
   */
  async runStrategy(params: {
    tokenMint: string;
    buyPriceSOL: number;
    sellPriceSOL: number;
    tradeAmountSOL: number;
    intervalMs: number;
  }) {
    console.log('Starting trading bot...');

    setInterval(async () => {
      try {
        // Check buy opportunity
        await this.buyDip({
          tokenMint: params.tokenMint,
          maxPriceInSOL: params.buyPriceSOL,
          amountSOL: params.tradeAmountSOL,
        });

        // Check sell opportunity
        // (Would need to track current holdings)
      } catch (error) {
        console.error('Strategy error:', error);
      }
    }, params.intervalMs);
  }
}

// Usage
const bot = new JupiterTradingBot(
  process.env.RPC_URL!,
  Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY!))
);

bot.runStrategy({
  tokenMint: 'BONK_MINT_ADDRESS',
  buyPriceSOL: 0.0001,
  sellPriceSOL: 0.0002,
  tradeAmountSOL: 0.1,
  intervalMs: 60_000, // Check every minute
});
```

## 🔒 Security Best Practices

1. **Never expose private keys** in client-side code
2. **Always validate quotes** before execution
3. **Set reasonable slippage limits** (never >10%)
4. **Use priority fees** in production
5. **Monitor for failed transactions** and retry
6. **Test on devnet first** with every integration
7. **Rate limit API calls** to avoid blocks

## 🔗 Resources

- [Jupiter v6 API Docs](https://station.jup.ag/docs/apis/swap-api)
- [Jupiter SDK](https://github.com/jup-ag/jupiter-quote-api-node)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Jupiter Discord](https://discord.gg/jup)

## 📊 Performance Tips

- Cache quotes for 30 seconds
- Use connection pooling for RPC
- Batch multiple quote requests
- Use compressed transaction responses
- Monitor quote API latency
- Fallback to backup RPC if primary fails

---

**Last Updated:** 2025-12-04
**Jupiter API Version:** v6
**Tested on:** Solana mainnet-beta
