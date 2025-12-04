# Jupiter Trader

> **ID:** `jupiter-trader`
> **Tier:** 1
> **Token Cost:** 8000
> **MCP Connections:** jupiter

## What This Skill Does

Expert-level Jupiter DEX aggregator integration for Solana token swaps with optimal routing, price impact analysis, slippage management, and MEV protection. Covers Jupiter V6 API, swap execution, limit orders, DCA strategies, and production trading patterns.

## When to Use

This skill is automatically loaded when:

- **Keywords:** swap, jupiter, buy token, sell token, exchange, dex, trade, quote, route
- **File Types:** .ts, .tsx, .js
- **Directories:** integrations/, defi/, trading/

---

## Core Capabilities

### 1. Quote API

The Jupiter Quote API finds the best price across all Solana DEXes. It aggregates liquidity from Raydium, Orca, Meteora, Phoenix, Lifinity, OpenBook, and 20+ other venues.

**API Endpoints:**

```typescript
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6/price';
const JUPITER_TOKEN_LIST = 'https://token.jup.ag/all';
```

**Quote Parameters Interface:**

```typescript
interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
  maxAccounts?: number;
  platformFeeBps?: number;
  excludeDexes?: string[];
  restrictIntermediateTokens?: boolean;
  swapMode?: 'ExactIn' | 'ExactOut';
}

interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: PlatformFee | null;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

interface RoutePlan {
  swapInfo: SwapInfo;
  percent: number;
}

interface SwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}
```

**Common Token Mints:**

```typescript
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
};
```

**Complete Quote Function:**

```typescript
async function getQuote(params: QuoteParams): Promise<QuoteResponse> {
  const {
    inputMint,
    outputMint,
    amount,
    slippageBps = 50,
    onlyDirectRoutes = false,
    maxAccounts = 64,
    swapMode = 'ExactIn',
  } = params;

  const queryParams = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: onlyDirectRoutes.toString(),
    maxAccounts: maxAccounts.toString(),
    swapMode,
  });

  const response = await fetch(JUPITER_QUOTE_API + '?' + queryParams.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error('Quote failed: ' + (error.error || response.statusText));
  }

  return response.json();
}
```

**Best Practices:**

- Always validate quote freshness using contextSlot
- Set appropriate slippageBps based on token liquidity (higher for meme coins)
- Use onlyDirectRoutes: true for time-sensitive trades
- Limit maxAccounts to 20-30 for faster transaction confirmation
- Cache token list locally to reduce API calls
- Implement exponential backoff for rate limiting (10 req/sec free tier)

**Common Gotchas:**

- Amount must be in smallest unit (lamports for SOL, not whole tokens)
- Quote is only valid for ~30 seconds before prices may change significantly
- priceImpactPct can be negative for favorable trades
- Some routes may fail if intermediate pools have insufficient liquidity
- ExactOut mode may return slightly different input amounts

---

### 2. Swap Execution

Execute swaps using versioned transactions for optimal performance and compute unit efficiency.

**Swap Request Interface:**

```typescript
interface SwapRequest {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  feeAccount?: string;
  trackingAccount?: string;
  computeUnitPriceMicroLamports?: number;
  prioritizationFeeLamports?: number;
  asLegacyTransaction?: boolean;
  useTokenLedger?: boolean;
  destinationTokenAccount?: string;
  dynamicComputeUnitLimit?: boolean;
  skipUserAccountsRpcCalls?: boolean;
}

interface SwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}
```

**Complete Swap Execution:**

```typescript
import {
  Connection,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';

async function executeSwap(
  connection: Connection,
  wallet: Keypair,
  quoteResponse: QuoteResponse,
  options?: {
    computeUnitPriceMicroLamports?: number;
    skipPreflight?: boolean;
  }
): Promise<string> {
  const computeUnitPriceMicroLamports = options?.computeUnitPriceMicroLamports || 1000;
  const skipPreflight = options?.skipPreflight || false;

  const swapResponse = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: wallet.publicKey.toString(),
      wrapAndUnwrapSol: true,
      computeUnitPriceMicroLamports,
      dynamicComputeUnitLimit: true,
    }),
  });

  if (!swapResponse.ok) {
    const error = await swapResponse.json();
    throw new Error('Swap request failed: ' + error.error);
  }

  const swapData = await swapResponse.json();

  const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  transaction.sign([wallet]);

  const rawTransaction = transaction.serialize();

  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight,
    preflightCommitment: 'confirmed',
    maxRetries: 3,
  });

  console.log('Transaction sent:', txid);

  const confirmation = await connection.confirmTransaction({
    signature: txid,
    blockhash: transaction.message.recentBlockhash,
    lastValidBlockHeight: swapData.lastValidBlockHeight,
  }, 'confirmed');

  if (confirmation.value.err) {
    throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
  }

  console.log('Swap confirmed: https://solscan.io/tx/' + txid);
  return txid;
}
```

**Swap with Wallet Adapter (React):**

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';

export function useJupiterSwap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  async function swap(quoteResponse: QuoteResponse): Promise<string> {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch(JUPITER_SWAP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        computeUnitPriceMicroLamports: 5000,
      }),
    });

    const data = await response.json();

    const transaction = VersionedTransaction.deserialize(
      Buffer.from(data.swapTransaction, 'base64')
    );

    const signedTx = await signTransaction(transaction);

    const txid = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction({
      signature: txid,
      blockhash: transaction.message.recentBlockhash,
      lastValidBlockHeight: data.lastValidBlockHeight,
    });

    return txid;
  }

  return { swap };
}
```

**Best Practices:**

- Always use dynamicComputeUnitLimit: true to avoid overpaying
- Set reasonable priority fees based on network congestion
- Implement retry logic with fresh quotes on failure
- Use skipPreflight: true only for time-sensitive trades
- Always confirm transactions before updating UI
- Store transaction signatures for user history

**Common Gotchas:**

- Transaction size limit is 1232 bytes; complex routes may exceed this
- Legacy transactions have lower limits than versioned transactions
- Priority fees don't guarantee inclusion; market conditions vary
- Some wallets don't support versioned transactions (use asLegacyTransaction)
- Transaction may land but swap may partially fail (check token balances)

---

### 3. Price Impact Analysis

Price impact measures how much your trade moves the market price. High impact means you're getting a worse price due to trade size.

**Price Impact Severity Levels:**

```typescript
interface PriceImpactAnalysis {
  impactPercent: number;
  severity: 'negligible' | 'low' | 'medium' | 'high' | 'severe';
  recommendation: string;
  maxRecommendedSize: string;
}

function analyzePriceImpact(quote: QuoteResponse): PriceImpactAnalysis {
  const impactPercent = Math.abs(parseFloat(quote.priceImpactPct));

  let severity: PriceImpactAnalysis['severity'];
  let recommendation: string;

  if (impactPercent < 0.1) {
    severity = 'negligible';
    recommendation = 'Excellent execution. Trade at will.';
  } else if (impactPercent < 0.5) {
    severity = 'low';
    recommendation = 'Good execution. Proceed with trade.';
  } else if (impactPercent < 1.0) {
    severity = 'medium';
    recommendation = 'Acceptable impact. Consider splitting into 2-3 trades.';
  } else if (impactPercent < 3.0) {
    severity = 'high';
    recommendation = 'High impact. Split into smaller trades or use TWAP.';
  } else {
    severity = 'severe';
    recommendation = 'Severe impact. Use limit orders or DCA strategy.';
  }

  const currentAmount = BigInt(quote.inAmount);
  const impactRatio = impactPercent / 0.5;
  const maxRecommendedSize = (currentAmount / BigInt(Math.ceil(impactRatio))).toString();

  return {
    impactPercent,
    severity,
    recommendation,
    maxRecommendedSize,
  };
}
```

**Slippage Calculator:**

```typescript
interface SlippageRecommendation {
  minSlippageBps: number;
  recommendedSlippageBps: number;
  maxSlippageBps: number;
  explanation: string;
}

function calculateSlippage(
  tokenVolatility: 'stable' | 'normal' | 'high' | 'meme',
  priceImpactPct: number,
  urgency: 'low' | 'normal' | 'high'
): SlippageRecommendation {
  const baseSlippage: Record<string, number> = {
    stable: 10,
    normal: 50,
    high: 100,
    meme: 300,
  };

  const impactAdjustment = Math.ceil(priceImpactPct * 100);

  const urgencyMultiplier: Record<string, number> = {
    low: 0.8,
    normal: 1.0,
    high: 1.5,
  };

  const base = baseSlippage[tokenVolatility];
  const recommended = Math.ceil(
    (base + impactAdjustment) * urgencyMultiplier[urgency]
  );

  return {
    minSlippageBps: Math.max(10, Math.floor(recommended * 0.5)),
    recommendedSlippageBps: recommended,
    maxSlippageBps: Math.min(1000, recommended * 2),
    explanation: 'Based on ' + tokenVolatility + ' volatility and ' + urgency + ' urgency.',
  };
}
```

**Real-time Price Monitoring:**

```typescript
interface PriceData {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  confidence: number;
}

async function getTokenPrice(mintAddress: string): Promise<PriceData> {
  const response = await fetch(
    JUPITER_PRICE_API + '?ids=' + mintAddress + '&vsToken=USDC'
  );
  const data = await response.json();
  return data.data[mintAddress];
}

async function getMultiplePrices(mints: string[]): Promise<Record<string, PriceData>> {
  const response = await fetch(
    JUPITER_PRICE_API + '?ids=' + mints.join(',') + '&vsToken=USDC'
  );
  const data = await response.json();
  return data.data;
}

async function waitForPrice(
  inputMint: string,
  outputMint: string,
  targetPrice: number,
  direction: 'above' | 'below',
  checkIntervalMs: number = 5000
): Promise<void> {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        const quote = await getQuote({
          inputMint,
          outputMint,
          amount: '1000000000',
        });

        const currentPrice = Number(quote.outAmount) / Number(quote.inAmount);

        const conditionMet = direction === 'above'
          ? currentPrice >= targetPrice
          : currentPrice <= targetPrice;

        if (conditionMet) {
          clearInterval(interval);
          resolve();
        }
      } catch (error) {
        console.warn('Price check failed:', error);
      }
    }, checkIntervalMs);
  });
}
```

---

### 4. Limit Orders

Jupiter Limit Orders allow placing orders that execute when price targets are met.

**Limit Order Interfaces:**

```typescript
interface CreateLimitOrderParams {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  expiredAt?: number;
  base: string;
}

interface LimitOrder {
  publicKey: string;
  account: {
    maker: string;
    inputMint: string;
    outputMint: string;
    oriInAmount: string;
    oriOutAmount: string;
    inAmount: string;
    outAmount: string;
    expiredAt: number | null;
    base: string;
  };
}
```

**Create Limit Order:**

```typescript
import { Keypair, Transaction } from '@solana/web3.js';

const JUPITER_LIMIT_API = 'https://jup.ag/api/limit/v1';

async function createLimitOrder(
  connection: Connection,
  wallet: Keypair,
  params: CreateLimitOrderParams
): Promise<string> {
  const base = Keypair.generate();

  const response = await fetch(JUPITER_LIMIT_API + '/createOrder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner: wallet.publicKey.toString(),
      inAmount: params.inAmount,
      outAmount: params.outAmount,
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      expiredAt: params.expiredAt || null,
      base: base.publicKey.toString(),
    }),
  });

  const data = await response.json();

  const transaction = Transaction.from(Buffer.from(data.tx, 'base64'));
  transaction.sign(wallet, base);

  const txid = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(txid);

  console.log('Limit order created:', txid);
  return txid;
}

function calculateLimitPrice(
  inAmount: string,
  inDecimals: number,
  outAmount: string,
  outDecimals: number
): number {
  const inValue = Number(inAmount) / Math.pow(10, inDecimals);
  const outValue = Number(outAmount) / Math.pow(10, outDecimals);
  return outValue / inValue;
}

async function placeBuyOrder(
  connection: Connection,
  wallet: Keypair,
  usdcAmount: number,
  targetSolPrice: number
) {
  const solAmount = usdcAmount / targetSolPrice;

  await createLimitOrder(connection, wallet, {
    inputMint: TOKENS.USDC,
    outputMint: TOKENS.SOL,
    inAmount: (usdcAmount * 1e6).toString(),
    outAmount: (solAmount * 1e9).toString(),
    base: Keypair.generate().publicKey.toString(),
  });
}
```

**Query and Cancel Orders:**

```typescript
async function getOpenOrders(walletAddress: string): Promise<LimitOrder[]> {
  const response = await fetch(
    JUPITER_LIMIT_API + '/openOrders?wallet=' + walletAddress
  );
  return response.json();
}

async function getOrderHistory(walletAddress: string): Promise<LimitOrder[]> {
  const response = await fetch(
    JUPITER_LIMIT_API + '/orderHistory?wallet=' + walletAddress
  );
  return response.json();
}

async function cancelLimitOrder(
  connection: Connection,
  wallet: Keypair,
  orderPublicKey: string
): Promise<string> {
  const response = await fetch(JUPITER_LIMIT_API + '/cancelOrders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner: wallet.publicKey.toString(),
      orders: [orderPublicKey],
    }),
  });

  const data = await response.json();

  const transaction = Transaction.from(Buffer.from(data.txs[0], 'base64'));
  transaction.sign(wallet);

  const txid = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(txid);

  return txid;
}

async function cancelAllOrders(
  connection: Connection,
  wallet: Keypair
): Promise<string[]> {
  const openOrders = await getOpenOrders(wallet.publicKey.toString());

  if (openOrders.length === 0) return [];

  const response = await fetch(JUPITER_LIMIT_API + '/cancelOrders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner: wallet.publicKey.toString(),
      orders: openOrders.map(o => o.publicKey),
    }),
  });

  const data = await response.json();
  const txids: string[] = [];

  for (const tx of data.txs) {
    const transaction = Transaction.from(Buffer.from(tx, 'base64'));
    transaction.sign(wallet);
    const txid = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(txid);
    txids.push(txid);
  }

  return txids;
}
```

---

### 5. DCA (Dollar Cost Averaging)

Jupiter DCA allows automated recurring purchases to smooth out volatility.

**DCA Interfaces:**

```typescript
interface CreateDCAParams {
  inputMint: string;
  outputMint: string;
  totalInAmount: string;
  inAmountPerCycle: string;
  cycleFrequency: number;
  minOutAmount?: string;
  maxOutAmount?: string;
  startAt?: number;
}

interface DCAAccount {
  publicKey: string;
  account: {
    user: string;
    inputMint: string;
    outputMint: string;
    idx: number;
    nextCycleAt: number;
    inDeposited: string;
    inWithdrawn: string;
    outWithdrawn: string;
    inUsed: string;
    outReceived: string;
    inAmountPerCycle: string;
    cycleFrequency: number;
    createdAt: number;
    bump: number;
  };
}
```

**Create DCA Position:**

```typescript
const JUPITER_DCA_API = 'https://jup.ag/api/dca/v1';

async function createDCA(
  connection: Connection,
  wallet: Keypair,
  params: CreateDCAParams
): Promise<string> {
  const response = await fetch(JUPITER_DCA_API + '/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: wallet.publicKey.toString(),
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      totalInAmount: params.totalInAmount,
      inAmountPerCycle: params.inAmountPerCycle,
      cycleFrequency: params.cycleFrequency,
      minOutAmount: params.minOutAmount,
      maxOutAmount: params.maxOutAmount,
      startAt: params.startAt,
    }),
  });

  const data = await response.json();

  const transaction = Transaction.from(Buffer.from(data.tx, 'base64'));
  transaction.sign(wallet);

  const txid = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(txid);

  return txid;
}

async function setupWeeklyDCA(
  connection: Connection,
  wallet: Keypair,
  totalUsdcAmount: number,
  daysToComplete: number
) {
  const cyclesPerDay = 4;
  const totalCycles = daysToComplete * cyclesPerDay;
  const amountPerCycle = Math.floor((totalUsdcAmount * 1e6) / totalCycles);
  const cycleFrequency = (24 * 60 * 60) / cyclesPerDay;

  await createDCA(connection, wallet, {
    inputMint: TOKENS.USDC,
    outputMint: TOKENS.SOL,
    totalInAmount: (totalUsdcAmount * 1e6).toString(),
    inAmountPerCycle: amountPerCycle.toString(),
    cycleFrequency,
    startAt: Math.floor(Date.now() / 1000) + 60,
  });
}
```

**Manage DCA Positions:**

```typescript
async function getDCAPositions(walletAddress: string): Promise<DCAAccount[]> {
  const response = await fetch(
    JUPITER_DCA_API + '/positions?user=' + walletAddress
  );
  return response.json();
}

async function closeDCA(
  connection: Connection,
  wallet: Keypair,
  dcaPublicKey: string
): Promise<string> {
  const response = await fetch(JUPITER_DCA_API + '/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: wallet.publicKey.toString(),
      dca: dcaPublicKey,
    }),
  });

  const data = await response.json();

  const transaction = Transaction.from(Buffer.from(data.tx, 'base64'));
  transaction.sign(wallet);

  const txid = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(txid);

  return txid;
}

async function withdrawDCA(
  connection: Connection,
  wallet: Keypair,
  dcaPublicKey: string
): Promise<string> {
  const response = await fetch(JUPITER_DCA_API + '/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: wallet.publicKey.toString(),
      dca: dcaPublicKey,
    }),
  });

  const data = await response.json();

  const transaction = Transaction.from(Buffer.from(data.tx, 'base64'));
  transaction.sign(wallet);

  const txid = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(txid);

  return txid;
}
```

---

## Route Optimization

**Route Analysis:**

```typescript
interface RouteAnalysis {
  totalHops: number;
  dexesUsed: string[];
  splitPercentages: number[];
  estimatedFees: number;
  gasEstimate: number;
}

function analyzeRoute(quote: QuoteResponse): RouteAnalysis {
  const routePlan = quote.routePlan;

  const dexesUsed = Array.from(new Set(routePlan.map(r => r.swapInfo.label)));
  const splitPercentages = routePlan.map(r => r.percent);

  const estimatedFees = routePlan.reduce((total, route) => {
    return total + Number(route.swapInfo.feeAmount);
  }, 0);

  return {
    totalHops: routePlan.length,
    dexesUsed,
    splitPercentages,
    estimatedFees,
    gasEstimate: routePlan.length * 50000,
  };
}

async function compareRoutes(
  inputMint: string,
  outputMint: string,
  amount: string
): Promise<{ direct: QuoteResponse | null; optimal: QuoteResponse }> {
  const results = await Promise.all([
    getQuote({ inputMint, outputMint, amount, onlyDirectRoutes: true }).catch(() => null),
    getQuote({ inputMint, outputMint, amount, onlyDirectRoutes: false }),
  ]);

  const directQuote = results[0];
  const optimalQuote = results[1];

  if (directQuote) {
    const directOutput = BigInt(directQuote.outAmount);
    const optimalOutput = BigInt(optimalQuote.outAmount);
    const improvement = Number((optimalOutput - directOutput) * 10000n / directOutput) / 100;

    console.log('Route comparison:');
    console.log('  Direct:', directOutput.toString(), '(1 hop)');
    console.log('  Optimal:', optimalOutput.toString(), '(' + optimalQuote.routePlan.length + ' hops)');
    console.log('  Improvement:', improvement.toFixed(2) + '%');
  }

  return { direct: directQuote, optimal: optimalQuote };
}
```

---

## MEV Protection with Jito

```typescript
const JITO_TIP_ACCOUNTS = [
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
];

function getRandomJitoTipAccount(): string {
  return JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)];
}

async function executeSwapWithJito(
  connection: Connection,
  wallet: Keypair,
  quoteResponse: QuoteResponse,
  tipLamports: number = 10000
): Promise<string> {
  const swapResponse = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: wallet.publicKey.toString(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });

  const swapData = await swapResponse.json();

  const transaction = VersionedTransaction.deserialize(
    Buffer.from(swapData.swapTransaction, 'base64')
  );

  transaction.sign([wallet]);

  const JITO_BLOCK_ENGINE = 'https://mainnet.block-engine.jito.wtf/api/v1/transactions';

  const response = await fetch(JITO_BLOCK_ENGINE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: [
        Buffer.from(transaction.serialize()).toString('base64'),
        { encoding: 'base64' },
      ],
    }),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error('Jito submission failed: ' + result.error.message);
  }

  return result.result;
}
```

---

## Real-World Examples

### Example 1: SOL to USDC Swap

```typescript
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface SwapResult {
  success: boolean;
  txid?: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  route: string[];
  error?: string;
}

async function swapSolToUsdc(
  connection: Connection,
  wallet: Keypair,
  solAmount: number,
  maxSlippageBps: number = 100
): Promise<SwapResult> {
  const inputAmount = Math.floor(solAmount * LAMPORTS_PER_SOL).toString();

  try {
    console.log('Getting quote for', solAmount, 'SOL...');
    const quote = await getQuote({
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      amount: inputAmount,
      slippageBps: maxSlippageBps,
    });

    const impact = analyzePriceImpact(quote);
    console.log('Price impact:', impact.impactPercent.toFixed(2) + '%', '(' + impact.severity + ')');

    if (impact.severity === 'severe') {
      return {
        success: false,
        inputAmount,
        outputAmount: quote.outAmount,
        priceImpact: quote.priceImpactPct,
        route: quote.routePlan.map(r => r.swapInfo.label),
        error: 'Price impact too high',
      };
    }

    const txid = await executeSwap(connection, wallet, quote);

    return {
      success: true,
      txid,
      inputAmount,
      outputAmount: quote.outAmount,
      priceImpact: quote.priceImpactPct,
      route: quote.routePlan.map(r => r.swapInfo.label),
    };

  } catch (error) {
    return {
      success: false,
      inputAmount,
      outputAmount: '0',
      priceImpact: '0',
      route: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Example 2: Portfolio Rebalance

```typescript
interface TokenBalance {
  mint: string;
  symbol: string;
  amount: string;
  decimals: number;
  valueUsd: number;
}

interface RebalanceTarget {
  symbol: string;
  targetPercent: number;
}

interface RebalancePlan {
  sells: Array<{ token: string; amount: string; valueUsd: number }>;
  buys: Array<{ token: string; amount: string; valueUsd: number }>;
}

async function calculateRebalance(
  balances: TokenBalance[],
  targets: RebalanceTarget[]
): Promise<RebalancePlan> {
  const totalValue = balances.reduce((sum, b) => sum + b.valueUsd, 0);
  const sells: RebalancePlan['sells'] = [];
  const buys: RebalancePlan['buys'] = [];

  for (const target of targets) {
    const balance = balances.find(b => b.symbol === target.symbol);
    const currentValue = balance?.valueUsd || 0;
    const targetValue = totalValue * (target.targetPercent / 100);
    const difference = targetValue - currentValue;

    if (Math.abs(difference) < 10) continue;

    if (difference < 0) {
      const sellAmount = Math.abs(difference);
      const tokenAmount = (sellAmount / currentValue) * Number(balance!.amount);
      sells.push({ token: target.symbol, amount: tokenAmount.toString(), valueUsd: sellAmount });
    } else {
      buys.push({ token: target.symbol, amount: '0', valueUsd: difference });
    }
  }

  return { sells, buys };
}

async function executeRebalance(
  connection: Connection,
  wallet: Keypair,
  plan: RebalancePlan
): Promise<string[]> {
  const txids: string[] = [];

  for (const sell of plan.sells) {
    const tokenEntry = Object.entries(TOKENS).find(([k]) => k === sell.token);
    if (!tokenEntry) continue;

    const quote = await getQuote({
      inputMint: tokenEntry[1],
      outputMint: TOKENS.USDC,
      amount: sell.amount,
      slippageBps: 100,
    });

    const txid = await executeSwap(connection, wallet, quote);
    txids.push(txid);
  }

  await new Promise(r => setTimeout(r, 2000));

  for (const buy of plan.buys) {
    const tokenEntry = Object.entries(TOKENS).find(([k]) => k === buy.token);
    if (!tokenEntry) continue;

    const quote = await getQuote({
      inputMint: TOKENS.USDC,
      outputMint: tokenEntry[1],
      amount: Math.floor(buy.valueUsd * 1e6).toString(),
      slippageBps: 100,
    });

    const txid = await executeSwap(connection, wallet, quote);
    txids.push(txid);
  }

  return txids;
}
```

### Example 3: Arbitrage Detection

```typescript
interface ArbitrageOpportunity {
  path: string[];
  profitPercent: number;
  profitAmount: string;
  inputAmount: string;
}

async function detectCircularArbitrage(
  baseToken: string,
  intermediateTokens: string[],
  inputAmount: string
): Promise<ArbitrageOpportunity | null> {
  for (const intermediate of intermediateTokens) {
    try {
      const quote1 = await getQuote({
        inputMint: baseToken,
        outputMint: intermediate,
        amount: inputAmount,
        onlyDirectRoutes: true,
      });

      const quote2 = await getQuote({
        inputMint: intermediate,
        outputMint: baseToken,
        amount: quote1.outAmount,
        onlyDirectRoutes: true,
      });

      const inputBigInt = BigInt(inputAmount);
      const outputBigInt = BigInt(quote2.outAmount);

      if (outputBigInt > inputBigInt) {
        const profit = outputBigInt - inputBigInt;
        const profitPercent = Number(profit * 10000n / inputBigInt) / 100;

        if (profitPercent > 0.1) {
          const intermediateEntry = Object.entries(TOKENS).find(([, v]) => v === intermediate);
          const baseEntry = Object.entries(TOKENS).find(([, v]) => v === baseToken);

          return {
            path: [baseEntry?.[0] || baseToken, intermediateEntry?.[0] || intermediate, baseEntry?.[0] || baseToken],
            profitPercent,
            profitAmount: profit.toString(),
            inputAmount,
          };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function scanArbitrage(): Promise<void> {
  const opportunities = await Promise.all([
    detectCircularArbitrage(TOKENS.SOL, [TOKENS.USDC, TOKENS.USDT], '1000000000'),
    detectCircularArbitrage(TOKENS.USDC, [TOKENS.SOL, TOKENS.USDT], '1000000000'),
  ]);

  const validOpps = opportunities.filter((o): o is ArbitrageOpportunity => o !== null);

  if (validOpps.length > 0) {
    console.log('Arbitrage opportunities:');
    for (const opp of validOpps) {
      console.log('  Path:', opp.path.join(' -> '));
      console.log('  Profit:', opp.profitPercent.toFixed(2) + '%');
    }
  } else {
    console.log('No arbitrage opportunities found');
  }
}
```

---

## Testing with Bankrun

```typescript
import { start } from 'solana-bankrun';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('Jupiter Integration', () => {
  let context: any;
  let connection: Connection;
  let wallet: Keypair;

  beforeAll(async () => {
    context = await start([], []);
    connection = new Connection(context.banksClient);
    wallet = Keypair.generate();

    await context.banksClient.requestAirdrop(wallet.publicKey, 10 * LAMPORTS_PER_SOL);
  });

  test('should get valid quote', async () => {
    const quote = await getQuote({
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      amount: LAMPORTS_PER_SOL.toString(),
    });

    expect(quote.inputMint).toBe(TOKENS.SOL);
    expect(quote.outputMint).toBe(TOKENS.USDC);
    expect(BigInt(quote.outAmount)).toBeGreaterThan(0n);
  });

  test('should calculate price impact correctly', () => {
    const mockQuote: QuoteResponse = {
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      inAmount: '1000000000',
      outAmount: '150000000',
      otherAmountThreshold: '148500000',
      swapMode: 'ExactIn',
      slippageBps: 100,
      platformFee: null,
      priceImpactPct: '0.5',
      routePlan: [],
      contextSlot: 0,
      timeTaken: 100,
    };

    const analysis = analyzePriceImpact(mockQuote);
    expect(analysis.severity).toBe('low');
  });

  test('should recommend appropriate slippage', () => {
    const recommendation = calculateSlippage('meme', 2.5, 'high');
    expect(recommendation.recommendedSlippageBps).toBeGreaterThan(300);
    expect(recommendation.maxSlippageBps).toBeLessThanOrEqual(1000);
  });
});
```

---

## Security Considerations

1. **Never expose private keys** in client-side code or logs
2. **Validate all quotes** before execution - check price impact and slippage
3. **Use Jito for MEV protection** on high-value trades
4. **Rate limit API calls** (10 req/sec free tier)
5. **Verify transaction contents** before signing
6. **Set appropriate deadlines** for transactions
7. **Monitor for sandwich attacks**
8. **Use hardware wallets** for production
9. **Implement circuit breakers** for loss limits
10. **Audit token contracts** before trading

---

## Related Skills

- **solana-reader** - Query wallet balances and transaction history
- **wallet-integration** - Connect Phantom, Solflare, Backpack wallets
- **lp-automation** - Provide liquidity on Raydium/Orca after swaps
- **tokenomics-designer** - Understand token economics before trading

---

## Further Reading

- Jupiter V6 API: https://station.jup.ag/docs/apis/swap-api
- Jupiter Limit Orders: https://station.jup.ag/guides/limit-order
- Jupiter DCA: https://station.jup.ag/guides/dca
- Jito MEV Protection: https://jito-foundation.gitbook.io/mev
- Solana Transactions: https://solana.com/docs/core/transactions

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
