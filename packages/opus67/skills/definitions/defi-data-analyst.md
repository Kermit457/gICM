# DeFi Data Analyst

> **ID:** `defi-data-analyst`
> **Tier:** 2
> **Token Cost:** 10000
> **MCP Connections:** birdeye, helius, santiment

## 🎯 What This Skill Does

- Query on-chain data from Solana, Ethereum, and other chains
- Analyze token holder distribution and concentration metrics
- Track liquidity pool metrics across DEXes (Raydium, Orca, Uniswap)
- Monitor whale movements and large transfers
- Calculate DeFi metrics: TVL, volume, fees, impermanent loss
- Build real-time analytics dashboards

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** tvl, volume, liquidity, holders, whale, market cap, dex, pool, reserves, birdeye, helius
- **File Types:** N/A
- **Directories:** N/A

## 🚀 Core Capabilities

### 1. Query On-Chain Data

Efficiently fetching and parsing blockchain data from RPC nodes and indexers.

**Best Practices:**
- Use Helius/QuickNode for reliable Solana RPC access
- Batch requests to minimize API calls (100-200 per batch)
- Cache frequently accessed data (token metadata, pool addresses)
- Use WebSockets for real-time updates
- Handle rate limits with exponential backoff

**Common Patterns:**

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { Helius } from 'helius-sdk';

// Solana RPC Setup
const connection = new Connection(
  process.env.HELIUS_RPC_URL,
  {
    commitment: 'confirmed',
    httpHeaders: {
      'Content-Type': 'application/json',
    },
  }
);

// Get token account balance
async function getTokenBalance(
  wallet: PublicKey,
  mint: PublicKey
): Promise<number> {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    wallet,
    { mint }
  );

  if (tokenAccounts.value.length === 0) return 0;

  const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
  return balance.uiAmount;
}

// Batch fetch multiple token accounts
async function getBatchTokenBalances(
  wallets: PublicKey[],
  mint: PublicKey
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  // Batch in groups of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
    const batch = wallets.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (wallet) => {
      const balance = await getTokenBalance(wallet, mint);
      results.set(wallet.toBase58(), balance);
    });

    await Promise.all(promises);

    // Rate limiting
    if (i + BATCH_SIZE < wallets.length) {
      await sleep(100);
    }
  }

  return results;
}

// Get all token holders using Helius DAS API
async function getAllTokenHolders(
  mint: string
): Promise<Array<{ owner: string; amount: number }>> {
  const helius = new Helius(process.env.HELIUS_API_KEY);

  const holders: Array<{ owner: string; amount: number }> = [];
  let page = 1;

  while (true) {
    const response = await helius.rpc.getTokenAccounts({
      mint,
      page,
      limit: 1000,
    });

    holders.push(
      ...response.token_accounts.map((account) => ({
        owner: account.owner,
        amount: account.amount,
      }))
    );

    if (response.token_accounts.length < 1000) break;
    page++;
  }

  return holders;
}

// Parse transaction for token transfers
interface TokenTransfer {
  from: string;
  to: string;
  amount: number;
  mint: string;
  timestamp: number;
}

async function parseTransactionForTransfers(
  signature: string
): Promise<TokenTransfer[]> {
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx || !tx.meta) return [];

  const transfers: TokenTransfer[] = [];

  for (const instruction of tx.transaction.message.instructions) {
    if (
      'parsed' in instruction &&
      instruction.program === 'spl-token' &&
      instruction.parsed.type === 'transfer'
    ) {
      transfers.push({
        from: instruction.parsed.info.source,
        to: instruction.parsed.info.destination,
        amount: instruction.parsed.info.amount,
        mint: instruction.parsed.info.mint,
        timestamp: tx.blockTime || 0,
      });
    }
  }

  return transfers;
}

// WebSocket for real-time updates
function subscribeToTokenAccount(
  tokenAccount: PublicKey,
  callback: (balance: number) => void
) {
  const subscriptionId = connection.onAccountChange(
    tokenAccount,
    (accountInfo) => {
      const data = accountInfo.data;
      // Parse token account data
      const amount = data.readBigUInt64LE(64);
      const decimals = data.readUInt8(44);
      const balance = Number(amount) / Math.pow(10, decimals);
      callback(balance);
    },
    'confirmed'
  );

  return () => connection.removeAccountChangeListener(subscriptionId);
}
```

**Gotchas:**
- RPC nodes have rate limits (usually 10-50 req/s)
- `confirmed` commitment is faster but less final than `finalized`
- Large token holder queries can timeout - paginate results
- WebSocket connections can drop - implement reconnection logic

### 2. Analyze Token Holder Distribution

Understanding token concentration and whale behavior.

**Best Practices:**
- Exclude burn addresses and program-owned accounts
- Calculate Gini coefficient for concentration measurement
- Track top 10/50/100 holder percentages over time
- Identify wallet clusters (same owner, different wallets)
- Use Helius's enriched data for wallet labels

**Common Patterns:**

```typescript
interface HolderMetrics {
  totalHolders: number;
  top10Percentage: number;
  top50Percentage: number;
  giniCoefficient: number;
  medianBalance: number;
  whaleCount: number; // >1% of supply
}

async function analyzeHolderDistribution(
  mint: string,
  totalSupply: number
): Promise<HolderMetrics> {
  const holders = await getAllTokenHolders(mint);

  // Filter out burn addresses and programs
  const BURN_ADDRESSES = [
    '1111111111111111111111111111111111',
    '11111111111111111111111111111111',
  ];

  const validHolders = holders
    .filter((h) => !BURN_ADDRESSES.includes(h.owner))
    .filter((h) => h.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalHolders = validHolders.length;

  // Top holder percentages
  const top10 = validHolders.slice(0, 10);
  const top50 = validHolders.slice(0, 50);

  const top10Amount = top10.reduce((sum, h) => sum + h.amount, 0);
  const top50Amount = top50.reduce((sum, h) => sum + h.amount, 0);

  const top10Percentage = (top10Amount / totalSupply) * 100;
  const top50Percentage = (top50Amount / totalSupply) * 100;

  // Gini coefficient (0 = perfect equality, 1 = perfect inequality)
  const gini = calculateGini(validHolders.map((h) => h.amount));

  // Median balance
  const medianBalance = validHolders[Math.floor(totalHolders / 2)]?.amount || 0;

  // Whale count (>1% of supply)
  const whaleThreshold = totalSupply * 0.01;
  const whaleCount = validHolders.filter((h) => h.amount > whaleThreshold).length;

  return {
    totalHolders,
    top10Percentage,
    top50Percentage,
    giniCoefficient: gini,
    medianBalance,
    whaleCount,
  };
}

function calculateGini(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = values.slice().sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((sum, v) => sum + v, 0);

  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (n - i) * sorted[i];
  }

  return (2 * numerator) / (n * total) - (n + 1) / n;
}

// Detect wallet clustering
interface WalletCluster {
  wallets: string[];
  totalBalance: number;
  percentageOfSupply: number;
}

async function detectWalletClusters(
  holders: Array<{ owner: string; amount: number }>,
  totalSupply: number
): Promise<WalletCluster[]> {
  // Simple heuristic: wallets funded by same source in short timeframe
  const clusters: Map<string, string[]> = new Map();

  // Query transaction history for each holder
  for (const holder of holders) {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(holder.owner),
      { limit: 50 }
    );

    // Check first funding transaction
    if (signatures.length > 0) {
      const firstTx = signatures[signatures.length - 1];
      const parsed = await connection.getParsedTransaction(firstTx.signature);

      // Extract funding source
      const funder = parsed?.transaction.message.accountKeys[0]?.pubkey.toBase58();
      if (funder) {
        if (!clusters.has(funder)) {
          clusters.set(funder, []);
        }
        clusters.get(funder)!.push(holder.owner);
      }
    }
  }

  // Convert to WalletCluster objects
  const results: WalletCluster[] = [];
  for (const [funder, wallets] of clusters.entries()) {
    if (wallets.length > 1) {
      const totalBalance = wallets.reduce((sum, wallet) => {
        const holder = holders.find((h) => h.owner === wallet);
        return sum + (holder?.amount || 0);
      }, 0);

      results.push({
        wallets,
        totalBalance,
        percentageOfSupply: (totalBalance / totalSupply) * 100,
      });
    }
  }

  return results.sort((a, b) => b.totalBalance - a.totalBalance);
}
```

**Gotchas:**
- Burn addresses vary by chain (use canonical lists)
- Some DEX programs hold tokens temporarily (filter by program ID)
- Gini coefficient alone doesn't tell full story - combine with other metrics
- Wallet clustering detection is heuristic-based and imperfect

### 3. Track Liquidity Pool Metrics

Monitoring DEX pools for trading activity and health.

**Best Practices:**
- Query pool state every 60 seconds for real-time tracking
- Calculate price from reserves (constant product formula)
- Track volume over 1h, 24h, 7d windows
- Monitor for liquidity additions/removals
- Alert on unusual activity (>50% price movement, large swaps)

**Common Patterns:**

```typescript
import { BN } from '@coral-xyz/anchor';

interface PoolState {
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  price: number; // Token B per Token A
  tvl: number; // In USD
  volume24h: number;
  fees24h: number;
  lpSupply: number;
  timestamp: number;
}

// Raydium CPMM Pool Parser
async function getRaydiumPoolState(poolAddress: string): Promise<PoolState> {
  const poolAccount = await connection.getAccountInfo(new PublicKey(poolAddress));
  if (!poolAccount) throw new Error('Pool not found');

  // Parse Raydium pool data structure
  const data = poolAccount.data;

  // Raydium CPMM layout (offsets vary by version)
  const tokenA = new PublicKey(data.slice(8, 40));
  const tokenB = new PublicKey(data.slice(40, 72));
  const reserveA = new BN(data.slice(72, 80), 'le').toNumber();
  const reserveB = new BN(data.slice(80, 88), 'le').toNumber();
  const lpSupply = new BN(data.slice(88, 96), 'le').toNumber();

  // Calculate price (B per A)
  const price = reserveB / reserveA;

  // Fetch USD prices from Birdeye
  const [priceA, priceB] = await Promise.all([
    getBirdeyePrice(tokenA.toBase58()),
    getBirdeyePrice(tokenB.toBase58()),
  ]);

  // Calculate TVL
  const tvl = reserveA * priceA + reserveB * priceB;

  // Get 24h volume from recent transactions
  const volume24h = await calculate24hVolume(poolAddress);
  const fees24h = volume24h * 0.0025; // 0.25% fee

  return {
    poolAddress,
    tokenA: tokenA.toBase58(),
    tokenB: tokenB.toBase58(),
    reserveA,
    reserveB,
    price,
    tvl,
    volume24h,
    fees24h,
    lpSupply,
    timestamp: Date.now(),
  };
}

// Calculate 24h volume from swap events
async function calculate24hVolume(poolAddress: string): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const yesterday = now - 86400;

  const signatures = await connection.getSignaturesForAddress(
    new PublicKey(poolAddress),
    {
      limit: 1000,
    }
  );

  let volume = 0;

  for (const sig of signatures) {
    if (sig.blockTime && sig.blockTime < yesterday) break;

    const tx = await connection.getParsedTransaction(sig.signature);
    if (!tx || !tx.meta) continue;

    // Parse swap instructions
    for (const instruction of tx.transaction.message.instructions) {
      if ('parsed' in instruction && instruction.parsed.type === 'swap') {
        // Extract swap amount (depends on DEX program structure)
        const amount = instruction.parsed.info?.amount || 0;
        volume += amount;
      }
    }
  }

  return volume;
}

// Monitor pool for changes
interface PoolChange {
  type: 'swap' | 'add_liquidity' | 'remove_liquidity';
  user: string;
  amount: number;
  priceImpact?: number;
  timestamp: number;
}

async function monitorPoolChanges(
  poolAddress: string,
  callback: (change: PoolChange) => void
) {
  let lastSignature: string | undefined;

  setInterval(async () => {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(poolAddress),
      { limit: 10, until: lastSignature }
    );

    if (signatures.length === 0) return;

    lastSignature = signatures[0].signature;

    for (const sig of signatures.reverse()) {
      const tx = await connection.getParsedTransaction(sig.signature);
      if (!tx || !tx.meta) continue;

      const change = parsePoolTransaction(tx);
      if (change) {
        callback(change);
      }
    }
  }, 5000); // Poll every 5 seconds
}

// Birdeye API integration
async function getBirdeyePrice(mint: string): Promise<number> {
  const response = await fetch(
    `https://public-api.birdeye.so/defi/price?address=${mint}`,
    {
      headers: {
        'X-API-KEY': process.env.BIRDEYE_API_KEY!,
      },
    }
  );

  const data = await response.json();
  return data.data.value;
}

async function getBirdeyePoolOverview(poolAddress: string) {
  const response = await fetch(
    `https://public-api.birdeye.so/defi/v3/pool?address=${poolAddress}`,
    {
      headers: {
        'X-API-KEY': process.env.BIRDEYE_API_KEY!,
      },
    }
  );

  const data = await response.json();
  return {
    liquidity: data.data.liquidity,
    volume24h: data.data.volume24h,
    priceChange24h: data.data.priceChange24h,
    txns24h: data.data.trade24h,
  };
}
```

**Gotchas:**
- Each DEX has different pool data structures (Raydium vs Orca vs Meteora)
- Historical volume requires parsing all transactions (expensive)
- Use Birdeye/DexScreener APIs for aggregated data when possible
- Price can be manipulated in low-liquidity pools

### 4. Monitor Whale Movements

Detecting and alerting on large token transfers.

**Best Practices:**
- Define whale threshold (e.g., >1% of supply or >$100k)
- Track both inflows and outflows
- Correlate with price movements
- Identify known whale wallets (CEX hot wallets, team, VCs)
- Use Helius Enhanced Transactions for rich context

**Common Patterns:**

```typescript
interface WhaleTransfer {
  signature: string;
  from: string;
  to: string;
  amount: number;
  amountUSD: number;
  percentOfSupply: number;
  fromLabel?: string;
  toLabel?: string;
  timestamp: number;
}

async function monitorWhaleTransfers(
  mint: string,
  thresholdUSD: number,
  callback: (transfer: WhaleTransfer) => void
) {
  const connection = new Connection(process.env.HELIUS_RPC_URL);
  const helius = new Helius(process.env.HELIUS_API_KEY);

  // Subscribe to all token transfers
  const subscriptionId = connection.onLogs(
    new PublicKey(mint),
    async (logs) => {
      // Parse logs for transfer events
      const signature = logs.signature;

      const enriched = await helius.rpc.getEnhancedTransaction(signature);
      if (!enriched) return;

      for (const transfer of enriched.tokenTransfers || []) {
        if (transfer.mint !== mint) continue;

        const amountUSD = transfer.tokenAmount * (await getBirdeyePrice(mint));

        if (amountUSD >= thresholdUSD) {
          callback({
            signature,
            from: transfer.fromUserAccount,
            to: transfer.toUserAccount,
            amount: transfer.tokenAmount,
            amountUSD,
            percentOfSupply: (transfer.tokenAmount / totalSupply) * 100,
            fromLabel: enriched.source, // Helius provides wallet labels
            toLabel: enriched.type,
            timestamp: enriched.timestamp,
          });
        }
      }
    },
    'confirmed'
  );

  return () => connection.removeOnLogsListener(subscriptionId);
}

// Identify known whale wallets
const KNOWN_WHALES: Map<string, string> = new Map([
  ['Binance1...', 'Binance Hot Wallet'],
  ['Team1...', 'Team Wallet'],
  ['VC1...', 'Sequoia Capital'],
]);

function enrichWhaleAddress(address: string): string | undefined {
  return KNOWN_WHALES.get(address);
}

// Whale activity dashboard data
interface WhaleActivity {
  wallet: string;
  label?: string;
  balance: number;
  balanceUSD: number;
  percentOfSupply: number;
  recentActivity: Array<{
    type: 'buy' | 'sell' | 'transfer';
    amount: number;
    timestamp: number;
  }>;
  profitLoss?: number;
}

async function getWhaleActivityReport(
  mint: string,
  thresholdPercent: number = 0.5
): Promise<WhaleActivity[]> {
  const totalSupply = await getTotalSupply(mint);
  const holders = await getAllTokenHolders(mint);
  const price = await getBirdeyePrice(mint);

  const whaleThreshold = totalSupply * (thresholdPercent / 100);
  const whales = holders.filter((h) => h.amount > whaleThreshold);

  const activities: WhaleActivity[] = [];

  for (const whale of whales) {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(whale.owner),
      { limit: 100 }
    );

    const recentActivity = [];
    for (const sig of signatures.slice(0, 20)) {
      const tx = await connection.getParsedTransaction(sig.signature);
      if (!tx) continue;

      // Parse for buy/sell/transfer
      // ... (implementation details)

      recentActivity.push({
        type: 'buy', // or 'sell', 'transfer'
        amount: 0,
        timestamp: sig.blockTime || 0,
      });
    }

    activities.push({
      wallet: whale.owner,
      label: enrichWhaleAddress(whale.owner),
      balance: whale.amount,
      balanceUSD: whale.amount * price,
      percentOfSupply: (whale.amount / totalSupply) * 100,
      recentActivity,
    });
  }

  return activities.sort((a, b) => b.balance - a.balance);
}
```

**Gotchas:**
- WebSocket connections can drop during high activity
- Helius Enhanced Transactions have rate limits
- CEX deposit/withdrawal addresses change frequently
- Transfer != buy/sell (could be wallet to wallet)

## 💡 Real-World Examples

### Example 1: Real-Time Pool Monitor Dashboard

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { EventEmitter } from 'events';

class PoolMonitor extends EventEmitter {
  private connection: Connection;
  private pools: Map<string, PoolState> = new Map();
  private updateInterval: NodeJS.Timer;

  constructor(rpcUrl: string, poolAddresses: string[]) {
    super();
    this.connection = new Connection(rpcUrl);

    // Initialize monitoring
    this.startMonitoring(poolAddresses);
  }

  private startMonitoring(poolAddresses: string[]) {
    this.updateInterval = setInterval(async () => {
      for (const poolAddress of poolAddresses) {
        try {
          const currentState = await getRaydiumPoolState(poolAddress);
          const previousState = this.pools.get(poolAddress);

          if (previousState) {
            // Detect significant changes
            const priceChange =
              ((currentState.price - previousState.price) / previousState.price) *
              100;

            if (Math.abs(priceChange) > 5) {
              this.emit('priceAlert', {
                pool: poolAddress,
                priceChange,
                currentPrice: currentState.price,
              });
            }

            const volumeChange = currentState.volume24h - previousState.volume24h;
            if (volumeChange > 100000) {
              this.emit('volumeSpike', {
                pool: poolAddress,
                volumeChange,
              });
            }
          }

          this.pools.set(poolAddress, currentState);
          this.emit('update', currentState);
        } catch (error) {
          this.emit('error', { pool: poolAddress, error });
        }
      }
    }, 10000); // Update every 10 seconds
  }

  stop() {
    clearInterval(this.updateInterval);
  }

  getPoolState(poolAddress: string): PoolState | undefined {
    return this.pools.get(poolAddress);
  }
}

// Usage
const monitor = new PoolMonitor(process.env.HELIUS_RPC_URL, [
  'RaydiumPoolAddress1',
  'RaydiumPoolAddress2',
]);

monitor.on('update', (state: PoolState) => {
  console.log(`Pool ${state.poolAddress}: Price ${state.price}, TVL $${state.tvl}`);
});

monitor.on('priceAlert', (alert) => {
  console.log(`ALERT: Price changed ${alert.priceChange}% in pool ${alert.pool}`);
  // Send to Discord, Telegram, etc.
});

monitor.on('volumeSpike', (spike) => {
  console.log(`Volume spike detected: +$${spike.volumeChange}`);
});
```

### Example 2: Token Health Score Calculator

```typescript
interface TokenHealthScore {
  overall: number; // 0-100
  liquidityScore: number;
  holderScore: number;
  volumeScore: number;
  flags: string[];
}

async function calculateTokenHealth(mint: string): Promise<TokenHealthScore> {
  const [holders, pool, price] = await Promise.all([
    getAllTokenHolders(mint),
    getRaydiumPoolState(await findMainPool(mint)),
    getBirdeyePrice(mint),
  ]);

  const totalSupply = holders.reduce((sum, h) => sum + h.amount, 0);
  const metrics = await analyzeHolderDistribution(mint, totalSupply);

  const flags: string[] = [];
  let liquidityScore = 0;
  let holderScore = 0;
  let volumeScore = 0;

  // Liquidity Score (0-40 points)
  if (pool.tvl > 1000000) liquidityScore = 40;
  else if (pool.tvl > 500000) liquidityScore = 30;
  else if (pool.tvl > 100000) liquidityScore = 20;
  else if (pool.tvl > 50000) liquidityScore = 10;
  else flags.push('Low liquidity (<$50k)');

  // Holder Score (0-30 points)
  if (metrics.top10Percentage < 30) holderScore += 15;
  else if (metrics.top10Percentage < 50) holderScore += 10;
  else if (metrics.top10Percentage < 70) holderScore += 5;
  else flags.push('High concentration (top 10 hold >70%)');

  if (metrics.totalHolders > 1000) holderScore += 15;
  else if (metrics.totalHolders > 500) holderScore += 10;
  else if (metrics.totalHolders > 100) holderScore += 5;
  else flags.push('Few holders (<100)');

  // Volume Score (0-30 points)
  const volumeToTVLRatio = pool.volume24h / pool.tvl;
  if (volumeToTVLRatio > 2) volumeScore = 30;
  else if (volumeToTVLRatio > 1) volumeScore = 20;
  else if (volumeToTVLRatio > 0.5) volumeScore = 10;
  else flags.push('Low trading volume');

  const overall = liquidityScore + holderScore + volumeScore;

  return {
    overall,
    liquidityScore,
    holderScore,
    volumeScore,
    flags,
  };
}
```

## 🔗 Related Skills

- **solana-anchor-expert** - Building on-chain programs with data structures
- **bonding-curve-master** - Understanding AMM mathematics
- **crypto-twitter-analyst** - Correlating social sentiment with on-chain data
- **typescript-senior** - Type-safe data processing pipelines

## 📖 Further Reading

- [Helius Developer Docs](https://docs.helius.dev/)
- [Birdeye API Documentation](https://docs.birdeye.so/)
- [Solana Cookbook - Accounts](https://solanacookbook.com/core-concepts/accounts.html)
- [DeFi Pulse - TVL Methodology](https://defipulse.com/blog/how-we-calculate-tvl)
- [Token Terminal - Metrics Guide](https://tokenterminal.com/resources/guides)
- [Messari Research - DeFi Metrics](https://messari.io/research)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
