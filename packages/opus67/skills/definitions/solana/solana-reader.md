# Solana Chain Reader - Complete RPC & Account Parsing Guide

> **ID:** `solana-reader`
> **Tier:** 2 (High Priority)
> **Token Cost:** 6000
> **MCP Connections:** helius, solana
> **Web3.js Version:** 1.87+ and 2.0+

## 🎯 What This Skill Does

Master reading data from the Solana blockchain. This skill covers complete RPC querying, account deserialization, transaction parsing, and efficient data fetching patterns for production applications.

**Core Capabilities:**
- Wallet balance queries (SOL + tokens)
- Transaction history parsing
- Token account reading and parsing
- Program account filtering and reading
- Efficient data fetching with batching
- Account subscription patterns
- Transaction decoding

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** balance, wallet, transaction, on chain, account, query, read, fetch, parse
- **File Types:** .ts, .tsx, .rs
- **Directories:** N/A

**Use this skill when:**
- Building wallet dashboards
- Fetching token balances
- Reading transaction history
- Parsing program accounts
- Building blockchain explorers
- Monitoring on-chain events
- Validating transactions

## 🚀 Core Capabilities

### 1. Wallet Balance Queries

**Basic Balance Fetching:**

```typescript
// lib/solana/balance.ts
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class BalanceReader {
  constructor(private connection: Connection) {}

  /**
   * Get SOL balance for a wallet
   */
  async getSOLBalance(walletAddress: string): Promise<{
    lamports: number;
    sol: number;
  }> {
    const publicKey = new PublicKey(walletAddress);
    const lamports = await this.connection.getBalance(publicKey);

    return {
      lamports,
      sol: lamports / LAMPORTS_PER_SOL,
    };
  }

  /**
   * Get all token balances for a wallet
   */
  async getTokenBalances(walletAddress: string) {
    const publicKey = new PublicKey(walletAddress);

    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    return tokenAccounts.value.map(account => {
      const parsed = account.account.data.parsed.info;
      return {
        mint: parsed.mint,
        owner: parsed.owner,
        amount: parsed.tokenAmount.amount,
        decimals: parsed.tokenAmount.decimals,
        uiAmount: parsed.tokenAmount.uiAmount,
        uiAmountString: parsed.tokenAmount.uiAmountString,
      };
    });
  }

  /**
   * Get balance for a specific token
   */
  async getTokenBalance(
    walletAddress: string,
    tokenMint: string
  ): Promise<number | null> {
    const balances = await this.getTokenBalances(walletAddress);
    const tokenBalance = balances.find(b => b.mint === tokenMint);

    return tokenBalance ? tokenBalance.uiAmount : null;
  }

  /**
   * Get balances for multiple wallets (batched)
   */
  async getMultipleBalances(
    walletAddresses: string[]
  ): Promise<Map<string, number>> {
    const publicKeys = walletAddresses.map(addr => new PublicKey(addr));

    // Batch request using getMultipleAccountsInfo
    const accounts = await this.connection.getMultipleAccountsInfo(publicKeys);

    const balances = new Map<string, number>();

    accounts.forEach((account, index) => {
      if (account) {
        balances.set(
          walletAddresses[index],
          account.lamports / LAMPORTS_PER_SOL
        );
      } else {
        balances.set(walletAddresses[index], 0);
      }
    });

    return balances;
  }
}
```

**Best Practices:**
- Use `getParsedTokenAccountsByOwner` for token balances (automatic parsing)
- Batch balance requests with `getMultipleAccountsInfo` (up to 100 accounts)
- Cache balances for 5-10 seconds to reduce RPC calls
- Handle null accounts (non-existent wallets)
- Use `commitment: 'confirmed'` for faster responses

**Common Patterns:**

```typescript
// Pattern 1: Portfolio value calculation
async function getPortfolioValue(wallet: string) {
  const reader = new BalanceReader(connection);

  // Get SOL balance
  const solBalance = await reader.getSOLBalance(wallet);
  const solValue = solBalance.sol * solPrice;

  // Get token balances
  const tokens = await reader.getTokenBalances(wallet);

  let totalValue = solValue;

  for (const token of tokens) {
    const price = await getTokenPrice(token.mint);
    totalValue += (token.uiAmount || 0) * price;
  }

  return {
    totalValue,
    solValue,
    tokens: tokens.length,
  };
}

// Pattern 2: Balance change monitoring
async function watchBalance(wallet: string, callback: (balance: number) => void) {
  const publicKey = new PublicKey(wallet);

  // Subscribe to account changes
  const subscriptionId = connection.onAccountChange(
    publicKey,
    (accountInfo) => {
      const balance = accountInfo.lamports / LAMPORTS_PER_SOL;
      callback(balance);
    },
    'confirmed'
  );

  return () => connection.removeAccountChangeListener(subscriptionId);
}

// Pattern 3: Token balance with metadata
async function getTokenBalanceWithMetadata(wallet: string, mint: string) {
  const reader = new BalanceReader(connection);
  const balance = await reader.getTokenBalance(wallet, mint);

  // Fetch token metadata
  const metadata = await fetchTokenMetadata(mint);

  return {
    balance,
    symbol: metadata.symbol,
    name: metadata.name,
    decimals: metadata.decimals,
    logoURI: metadata.logoURI,
  };
}
```

**Gotchas:**
- ❌ Don't query individual accounts in a loop (use batching)
- ❌ Don't ignore account rent (minimum 0.00089088 SOL)
- ❌ Don't assume token accounts exist (check for null)
- ✅ Always use parsed methods for token accounts
- ✅ Always handle network errors with retry
- ✅ Cache results to minimize RPC calls

### 2. Transaction History Parsing

**Fetching and Parsing Transactions:**

```typescript
// lib/solana/transactions.ts
import {
  Connection,
  PublicKey,
  ParsedTransactionWithMeta,
  ConfirmedSignatureInfo,
} from '@solana/web3.js';

export class TransactionReader {
  constructor(private connection: Connection) {}

  /**
   * Get transaction signatures for an address
   */
  async getTransactionSignatures(
    address: string,
    limit = 100
  ): Promise<ConfirmedSignatureInfo[]> {
    const publicKey = new PublicKey(address);

    const signatures = await this.connection.getSignaturesForAddress(
      publicKey,
      { limit }
    );

    return signatures;
  }

  /**
   * Get parsed transaction details
   */
  async getTransaction(signature: string): Promise<ParsedTransactionWithMeta | null> {
    return await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  }

  /**
   * Get recent transactions with details
   */
  async getRecentTransactions(
    address: string,
    limit = 50
  ): Promise<TransactionWithDetails[]> {
    const signatures = await this.getTransactionSignatures(address, limit);

    // Batch fetch transactions (chunks of 100)
    const transactions = await Promise.all(
      signatures.map(sig => this.getTransaction(sig.signature))
    );

    return transactions
      .filter((tx): tx is ParsedTransactionWithMeta => tx !== null)
      .map(tx => this.parseTransaction(tx));
  }

  /**
   * Parse transaction into readable format
   */
  private parseTransaction(tx: ParsedTransactionWithMeta): TransactionWithDetails {
    const { blockTime, meta, transaction } = tx;

    // Extract relevant data
    const fee = meta?.fee || 0;
    const success = meta?.err === null;
    const preBalances = meta?.preBalances || [];
    const postBalances = meta?.postBalances || [];

    // Calculate balance changes
    const balanceChanges = preBalances.map((pre, index) => ({
      address: transaction.message.accountKeys[index].pubkey.toBase58(),
      change: (postBalances[index] || 0) - pre,
    }));

    // Extract token transfers
    const tokenTransfers = this.extractTokenTransfers(tx);

    // Extract program interactions
    const programs = transaction.message.instructions.map(ix => {
      if ('programId' in ix) {
        return ix.programId.toBase58();
      }
      return 'Unknown';
    });

    return {
      signature: tx.transaction.signatures[0],
      blockTime: blockTime || 0,
      success,
      fee: fee / LAMPORTS_PER_SOL,
      balanceChanges,
      tokenTransfers,
      programs: [...new Set(programs)],
    };
  }

  /**
   * Extract token transfers from transaction
   */
  private extractTokenTransfers(tx: ParsedTransactionWithMeta): TokenTransfer[] {
    const transfers: TokenTransfer[] = [];

    // Check preTokenBalances and postTokenBalances
    const preTokenBalances = tx.meta?.preTokenBalances || [];
    const postTokenBalances = tx.meta?.postTokenBalances || [];

    // Group by account index
    const balancesByAccount = new Map<number, {
      pre?: typeof preTokenBalances[0];
      post?: typeof postTokenBalances[0];
    }>();

    preTokenBalances.forEach(pre => {
      balancesByAccount.set(pre.accountIndex, { pre });
    });

    postTokenBalances.forEach(post => {
      const existing = balancesByAccount.get(post.accountIndex);
      balancesByAccount.set(post.accountIndex, {
        ...existing,
        post,
      });
    });

    // Calculate transfers
    balancesByAccount.forEach(({ pre, post }) => {
      if (!pre || !post) return;

      const preAmount = parseFloat(pre.uiTokenAmount.uiAmountString);
      const postAmount = parseFloat(post.uiTokenAmount.uiAmountString);
      const change = postAmount - preAmount;

      if (change !== 0) {
        transfers.push({
          mint: post.mint,
          amount: Math.abs(change),
          direction: change > 0 ? 'in' : 'out',
          decimals: post.uiTokenAmount.decimals,
        });
      }
    });

    return transfers;
  }

  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(params: {
    address: string;
    before?: string;
    limit?: number;
  }) {
    const { address, before, limit = 50 } = params;
    const publicKey = new PublicKey(address);

    const signatures = await this.connection.getSignaturesForAddress(
      publicKey,
      {
        before,
        limit,
      }
    );

    return {
      signatures: signatures.map(sig => sig.signature),
      lastSignature: signatures[signatures.length - 1]?.signature,
      hasMore: signatures.length === limit,
    };
  }
}

// Types
interface TransactionWithDetails {
  signature: string;
  blockTime: number;
  success: boolean;
  fee: number;
  balanceChanges: Array<{
    address: string;
    change: number;
  }>;
  tokenTransfers: TokenTransfer[];
  programs: string[];
}

interface TokenTransfer {
  mint: string;
  amount: number;
  direction: 'in' | 'out';
  decimals: number;
}
```

**Best Practices:**
- Use `maxSupportedTransactionVersion: 0` for versioned transactions
- Batch transaction fetches (but not too many at once)
- Parse token balances for transfers
- Cache transaction data (it's immutable)
- Show loading states during fetching
- Handle failed transactions gracefully

**Common Patterns:**

```typescript
// Pattern 1: Transaction feed with infinite scroll
async function getTransactionFeed(wallet: string, page = 1, perPage = 20) {
  const reader = new TransactionReader(connection);

  // Calculate which signatures to fetch
  const allSignatures = await reader.getTransactionSignatures(wallet, 1000);
  const startIndex = (page - 1) * perPage;
  const signatures = allSignatures.slice(startIndex, startIndex + perPage);

  const transactions = await Promise.all(
    signatures.map(sig => reader.getTransaction(sig.signature))
  );

  return {
    transactions: transactions.filter(tx => tx !== null),
    hasMore: startIndex + perPage < allSignatures.length,
    nextPage: page + 1,
  };
}

// Pattern 2: Filter transactions by type
async function getSwapTransactions(wallet: string) {
  const reader = new TransactionReader(connection);
  const txs = await reader.getRecentTransactions(wallet);

  return txs.filter(tx =>
    tx.programs.includes('JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB') // Jupiter
  );
}

// Pattern 3: Transaction status checker
async function waitForTransaction(signature: string, timeout = 60000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (tx) {
      return {
        confirmed: true,
        success: tx.meta?.err === null,
      };
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return {
    confirmed: false,
    success: false,
  };
}
```

### 3. Token Account Parsing

**Reading and Parsing Token Accounts:**

```typescript
// lib/solana/token-accounts.ts
import {
  Connection,
  PublicKey,
  AccountInfo,
  ParsedAccountData,
} from '@solana/web3.js';
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class TokenAccountReader {
  constructor(private connection: Connection) {}

  /**
   * Get all token accounts for a wallet
   */
  async getTokenAccounts(owner: string) {
    const ownerPublicKey = new PublicKey(owner);

    const accounts = await this.connection.getParsedTokenAccountsByOwner(
      ownerPublicKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    return accounts.value.map(account => ({
      pubkey: account.pubkey.toBase58(),
      mint: account.account.data.parsed.info.mint,
      owner: account.account.data.parsed.info.owner,
      amount: account.account.data.parsed.info.tokenAmount.amount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals,
      uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
      state: account.account.data.parsed.info.state,
    }));
  }

  /**
   * Get token account address (derived from owner + mint)
   */
  async getAssociatedTokenAddress(
    owner: string,
    mint: string
  ): Promise<PublicKey> {
    const { PublicKey: PK } = await import('@solana/web3.js');
    const { getAssociatedTokenAddressSync } = await import('@solana/spl-token');

    return getAssociatedTokenAddressSync(
      new PK(mint),
      new PK(owner),
      false,
      TOKEN_PROGRAM_ID
    );
  }

  /**
   * Read raw token account data (for custom parsing)
   */
  async getTokenAccountRaw(tokenAccount: string) {
    const publicKey = new PublicKey(tokenAccount);
    const account = await this.connection.getAccountInfo(publicKey);

    if (!account) {
      throw new Error('Token account not found');
    }

    // Decode using SPL Token layout
    const data = AccountLayout.decode(account.data);

    return {
      mint: new PublicKey(data.mint).toBase58(),
      owner: new PublicKey(data.owner).toBase58(),
      amount: data.amount.toString(),
      delegate: data.delegate ? new PublicKey(data.delegate).toBase58() : null,
      delegatedAmount: data.delegatedAmount.toString(),
      isInitialized: data.state !== 0,
      isFrozen: data.state === 2,
      isNative: data.isNative,
      closeAuthority: data.closeAuthority
        ? new PublicKey(data.closeAuthority).toBase58()
        : null,
    };
  }

  /**
   * Get all token accounts for a specific mint
   */
  async getTokenAccountsByMint(mint: string) {
    const mintPublicKey = new PublicKey(mint);

    const accounts = await this.connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          { dataSize: 165 }, // Token account size
          {
            memcmp: {
              offset: 0,
              bytes: mintPublicKey.toBase58(),
            },
          },
        ],
      }
    );

    return accounts.map(account => {
      const parsed = (account.account.data as ParsedAccountData).parsed;
      return {
        pubkey: account.pubkey.toBase58(),
        owner: parsed.info.owner,
        amount: parsed.info.tokenAmount.uiAmount,
      };
    });
  }

  /**
   * Get largest token holders
   */
  async getLargestHolders(mint: string, limit = 20) {
    const accounts = await this.getTokenAccountsByMint(mint);

    return accounts
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit)
      .map((account, index) => ({
        rank: index + 1,
        address: account.owner,
        amount: account.amount,
      }));
  }
}
```

**Best Practices:**
- Use parsed methods when possible (automatic deserialization)
- Cache derived addresses (they don't change)
- Filter by dataSize to reduce bandwidth
- Use memcmp for efficient on-chain filtering
- Handle empty token accounts (0 balance)

### 4. Program Account Reading

**Reading Program-Owned Accounts:**

```typescript
// lib/solana/program-accounts.ts
import { Connection, PublicKey, GetProgramAccountsFilter } from '@solana/web3.js';

export class ProgramAccountReader {
  constructor(private connection: Connection) {}

  /**
   * Get all accounts owned by a program
   */
  async getProgramAccounts(
    programId: string,
    filters?: GetProgramAccountsFilter[]
  ) {
    const programPublicKey = new PublicKey(programId);

    const accounts = await this.connection.getProgramAccounts(
      programPublicKey,
      { filters }
    );

    return accounts.map(account => ({
      pubkey: account.pubkey.toBase58(),
      data: account.account.data,
      lamports: account.account.lamports,
      owner: account.account.owner.toBase58(),
      executable: account.account.executable,
      rentEpoch: account.account.rentEpoch,
    }));
  }

  /**
   * Get parsed program accounts (for standard programs)
   */
  async getParsedProgramAccounts(programId: string) {
    const programPublicKey = new PublicKey(programId);

    return await this.connection.getParsedProgramAccounts(programPublicKey);
  }

  /**
   * Filter accounts by size
   */
  async getAccountsBySize(programId: string, dataSize: number) {
    return await this.getProgramAccounts(programId, [
      { dataSize },
    ]);
  }

  /**
   * Filter accounts by memcmp (memory compare)
   */
  async getAccountsByFilter(
    programId: string,
    offset: number,
    bytes: string
  ) {
    return await this.getProgramAccounts(programId, [
      {
        memcmp: {
          offset,
          bytes,
        },
      },
    ]);
  }

  /**
   * Example: Get all PDAs derived from a specific seed
   */
  async getPDAsByAuthority(programId: string, authority: string) {
    // Filter by authority field at offset 8 (after discriminator)
    return await this.getAccountsByFilter(programId, 8, authority);
  }
}
```

**Advanced: Anchor Program Account Parsing:**

```typescript
// lib/solana/anchor-accounts.ts
import { BorshAccountsCoder } from '@coral-xyz/anchor';
import { IDL } from './idl'; // Your program's IDL

export class AnchorAccountReader {
  private coder: BorshAccountsCoder;

  constructor(private connection: Connection, programId: string) {
    this.coder = new BorshAccountsCoder(IDL);
  }

  /**
   * Fetch and decode Anchor account
   */
  async fetchAccount<T = any>(
    accountAddress: string,
    accountType: string
  ): Promise<T> {
    const publicKey = new PublicKey(accountAddress);
    const accountInfo = await this.connection.getAccountInfo(publicKey);

    if (!accountInfo) {
      throw new Error('Account not found');
    }

    // Decode using Anchor's coder
    const decoded = this.coder.decode(accountType, accountInfo.data);

    return decoded as T;
  }

  /**
   * Fetch multiple accounts
   */
  async fetchMultipleAccounts<T = any>(
    addresses: string[],
    accountType: string
  ): Promise<T[]> {
    const publicKeys = addresses.map(addr => new PublicKey(addr));
    const accounts = await this.connection.getMultipleAccountsInfo(publicKeys);

    return accounts.map(account => {
      if (!account) return null;
      return this.coder.decode(accountType, account.data) as T;
    }).filter((acc): acc is T => acc !== null);
  }
}
```

**Best Practices:**
- Use filters to reduce data transfer
- Combine `dataSize` + `memcmp` for efficiency
- Parse account data on-chain when possible
- Cache program account data (refresh periodically)
- Use subscriptions for real-time updates

## 💡 Real-World Examples

### Example 1: Wallet Dashboard

Complete wallet dashboard with all data:

```typescript
// components/WalletDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BalanceReader, TransactionReader } from '@/lib/solana';

export function WalletDashboard() {
  const { publicKey } = useWallet();
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;

    const fetchData = async () => {
      const balanceReader = new BalanceReader(connection);
      const txReader = new TransactionReader(connection);

      try {
        // Fetch SOL balance
        const { sol } = await balanceReader.getSOLBalance(publicKey.toBase58());
        setSolBalance(sol);

        // Fetch token balances
        const tokenBalances = await balanceReader.getTokenBalances(
          publicKey.toBase58()
        );
        setTokens(tokenBalances);

        // Fetch recent transactions
        const recentTxs = await txReader.getRecentTransactions(
          publicKey.toBase58(),
          20
        );
        setTransactions(recentTxs);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [publicKey]);

  if (!publicKey) {
    return <div>Connect wallet to view dashboard</div>;
  }

  if (loading) {
    return <div>Loading wallet data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* SOL Balance */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">SOL Balance</h2>
        <div className="text-4xl font-bold text-blue-600">
          {solBalance.toFixed(4)} SOL
        </div>
      </div>

      {/* Token Balances */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Tokens</h2>
        <div className="space-y-2">
          {tokens.map(token => (
            <div key={token.mint} className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="font-mono text-sm">{token.mint.slice(0, 8)}...</span>
              <span className="font-semibold">{token.uiAmountString}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.signature} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-sm">{tx.signature.slice(0, 16)}...</span>
                <span className={tx.success ? 'text-green-600' : 'text-red-600'}>
                  {tx.success ? 'Success' : 'Failed'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {new Date(tx.blockTime * 1000).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Token Holder Analyzer

Analyze token distribution:

```typescript
// tools/token-analyzer.ts
import { TokenAccountReader } from './token-accounts';

async function analyzeToken(mint: string) {
  const reader = new TokenAccountReader(connection);

  // Get all holders
  const holders = await reader.getLargestHolders(mint, 100);

  // Calculate distribution metrics
  const totalSupply = holders.reduce((sum, h) => sum + h.amount, 0);

  const top10Share = holders
    .slice(0, 10)
    .reduce((sum, h) => sum + h.amount, 0) / totalSupply;

  const top50Share = holders
    .slice(0, 50)
    .reduce((sum, h) => sum + h.amount, 0) / totalSupply;

  console.log(`Token Analysis for ${mint}`);
  console.log(`Total Holders: ${holders.length}`);
  console.log(`Top 10 holders own: ${(top10Share * 100).toFixed(2)}%`);
  console.log(`Top 50 holders own: ${(top50Share * 100).toFixed(2)}%`);

  console.log('\nTop 10 Holders:');
  holders.slice(0, 10).forEach(holder => {
    const share = (holder.amount / totalSupply) * 100;
    console.log(`${holder.rank}. ${holder.address}: ${holder.amount} (${share.toFixed(2)}%)`);
  });
}

// Usage
analyzeToken('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
```

## 🔒 Security Best Practices

1. **Always validate public keys** before querying
2. **Rate limit RPC calls** to avoid throttling
3. **Use confirmed commitment** for user-facing data
4. **Cache immutable data** (transactions, metadata)
5. **Handle null accounts** gracefully
6. **Don't trust on-chain data** without validation

## 🔗 Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Helius RPC Docs](https://docs.helius.dev/)
- [SPL Token Program](https://spl.solana.com/token)

---

**Last Updated:** 2025-12-04
**Solana Web3.js Version:** 1.87+
**Tested on:** Mainnet-beta
