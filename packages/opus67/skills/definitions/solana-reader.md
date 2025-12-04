# Solana Chain Reader

> **ID:** `solana-reader`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** helius, solana

## What This Skill Does

Comprehensive Solana blockchain data reading including wallet balances, transaction history, token account parsing, program account deserialization, and real-time subscription patterns. Covers RPC methods, Helius enhanced APIs, and production-ready query patterns.

## When to Use

This skill is automatically loaded when:

- **Keywords:** balance, wallet, transaction, on-chain, query, read, fetch, account
- **File Types:** .ts, .tsx, .js
- **Directories:** services/, api/, utils/

---

## Core Capabilities

### 1. Wallet Balance Queries

Query SOL and SPL token balances with multiple methods and providers.

**Basic SOL Balance:**

```typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function getSolBalance(
  connection: Connection,
  walletAddress: string
): Promise<number> {
  const publicKey = new PublicKey(walletAddress);
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

async function getMultipleSolBalances(
  connection: Connection,
  addresses: string[]
): Promise<Map<string, number>> {
  const publicKeys = addresses.map(addr => new PublicKey(addr));

  const balances = await connection.getMultipleAccountsInfo(publicKeys);

  const result = new Map<string, number>();

  for (let i = 0; i < addresses.length; i++) {
    const lamports = balances[i]?.lamports || 0;
    result.set(addresses[i], lamports / LAMPORTS_PER_SOL);
  }

  return result;
}
```

**SPL Token Balances:**

```typescript
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';

interface TokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
}

async function getTokenBalances(
  connection: Connection,
  walletAddress: string
): Promise<TokenBalance[]> {
  const publicKey = new PublicKey(walletAddress);

  const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  const balances: TokenBalance[] = [];

  for (const { account } of tokenAccounts.value) {
    const data = AccountLayout.decode(account.data);

    balances.push({
      mint: new PublicKey(data.mint).toString(),
      amount: data.amount.toString(),
      decimals: 0,
      uiAmount: 0,
    });
  }

  // Get mint info for decimals
  const mints = [...new Set(balances.map(b => b.mint))];
  const mintInfos = await Promise.all(
    mints.map(mint => connection.getParsedAccountInfo(new PublicKey(mint)))
  );

  const mintDecimals = new Map<string, number>();
  for (let i = 0; i < mints.length; i++) {
    const data = mintInfos[i].value?.data as any;
    if (data?.parsed?.info?.decimals !== undefined) {
      mintDecimals.set(mints[i], data.parsed.info.decimals);
    }
  }

  return balances.map(b => {
    const decimals = mintDecimals.get(b.mint) || 0;
    return {
      ...b,
      decimals,
      uiAmount: Number(b.amount) / Math.pow(10, decimals),
    };
  });
}
```

**Helius Enhanced Balance API:**

```typescript
interface HeliusBalance {
  nativeBalance: number;
  tokens: Array<{
    mint: string;
    amount: number;
    decimals: number;
    tokenAccount: string;
  }>;
}

async function getHeliusBalances(
  apiKey: string,
  walletAddress: string
): Promise<HeliusBalance> {
  const response = await fetch(
    'https://api.helius.xyz/v0/addresses/' + walletAddress + '/balances?api-key=' + apiKey
  );

  if (!response.ok) {
    throw new Error('Helius API error: ' + response.statusText);
  }

  return response.json();
}
```

**Best Practices:**

- Use getMultipleAccountsInfo for batching requests
- Cache token metadata (decimals, symbols)
- Implement retry logic for RPC failures
- Use enhanced APIs (Helius, Triton) for production
- Consider WebSocket subscriptions for real-time updates

---

### 2. Transaction History

Fetch and parse transaction history with filtering and pagination.

**Basic Transaction History:**

```typescript
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

interface TransactionInfo {
  signature: string;
  slot: number;
  timestamp: number | null;
  success: boolean;
  fee: number;
  type: string;
}

async function getTransactionHistory(
  connection: Connection,
  walletAddress: string,
  limit: number = 20
): Promise<TransactionInfo[]> {
  const publicKey = new PublicKey(walletAddress);

  const signatures = await connection.getSignaturesForAddress(publicKey, {
    limit,
  });

  const transactions: TransactionInfo[] = [];

  for (const sig of signatures) {
    transactions.push({
      signature: sig.signature,
      slot: sig.slot,
      timestamp: sig.blockTime,
      success: sig.err === null,
      fee: 0,
      type: 'unknown',
    });
  }

  return transactions;
}

async function getTransactionDetails(
  connection: Connection,
  signature: string
): Promise<ParsedTransactionWithMeta | null> {
  return connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });
}
```

**Paginated History:**

```typescript
interface PaginatedHistory {
  transactions: TransactionInfo[];
  hasMore: boolean;
  lastSignature: string | null;
}

async function getPaginatedHistory(
  connection: Connection,
  walletAddress: string,
  options: {
    limit?: number;
    before?: string;
    until?: string;
  } = {}
): Promise<PaginatedHistory> {
  const { limit = 20, before, until } = options;
  const publicKey = new PublicKey(walletAddress);

  const signatures = await connection.getSignaturesForAddress(publicKey, {
    limit: limit + 1,
    before,
    until,
  });

  const hasMore = signatures.length > limit;
  const results = hasMore ? signatures.slice(0, limit) : signatures;

  const transactions: TransactionInfo[] = results.map(sig => ({
    signature: sig.signature,
    slot: sig.slot,
    timestamp: sig.blockTime,
    success: sig.err === null,
    fee: 0,
    type: 'unknown',
  }));

  return {
    transactions,
    hasMore,
    lastSignature: results.length > 0 ? results[results.length - 1].signature : null,
  };
}
```

**Helius Enhanced History:**

```typescript
interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  fee: number;
  feePayer: string;
  source: string;
  description: string;
  tokenTransfers: Array<{
    mint: string;
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
  }>;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
}

async function getHeliusTransactions(
  apiKey: string,
  walletAddress: string,
  options: {
    type?: string;
    before?: string;
    limit?: number;
  } = {}
): Promise<HeliusTransaction[]> {
  const params = new URLSearchParams({
    'api-key': apiKey,
  });

  if (options.type) params.append('type', options.type);
  if (options.before) params.append('before', options.before);
  if (options.limit) params.append('limit', options.limit.toString());

  const response = await fetch(
    'https://api.helius.xyz/v0/addresses/' + walletAddress + '/transactions?' + params
  );

  return response.json();
}
```

**Transaction Type Detection:**

```typescript
function detectTransactionType(tx: ParsedTransactionWithMeta): string {
  const instructions = tx.transaction.message.instructions;

  for (const ix of instructions) {
    if ('parsed' in ix) {
      const programId = ix.programId.toString();
      const type = ix.parsed?.type;

      if (programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        if (type === 'transfer') return 'TOKEN_TRANSFER';
        if (type === 'transferChecked') return 'TOKEN_TRANSFER';
      }

      if (programId === '11111111111111111111111111111111') {
        if (type === 'transfer') return 'SOL_TRANSFER';
      }

      if (programId === 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4') {
        return 'JUPITER_SWAP';
      }
    }
  }

  return 'UNKNOWN';
}
```

---

### 3. Token Account Parsing

Parse and decode SPL token accounts with metadata.

**Token Account Structure:**

```typescript
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface ParsedTokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: bigint;
  decimals: number;
  uiAmount: number;
  delegate: string | null;
  delegatedAmount: bigint;
  isNative: boolean;
  closeAuthority: string | null;
}

async function parseTokenAccount(
  connection: Connection,
  tokenAccountAddress: string
): Promise<ParsedTokenAccount> {
  const publicKey = new PublicKey(tokenAccountAddress);
  const accountInfo = await connection.getAccountInfo(publicKey);

  if (!accountInfo) {
    throw new Error('Token account not found');
  }

  const data = AccountLayout.decode(accountInfo.data);

  const mintInfo = await connection.getAccountInfo(new PublicKey(data.mint));
  const mintData = MintLayout.decode(mintInfo!.data);

  const amount = data.amount;
  const decimals = mintData.decimals;

  return {
    address: tokenAccountAddress,
    mint: new PublicKey(data.mint).toString(),
    owner: new PublicKey(data.owner).toString(),
    amount,
    decimals,
    uiAmount: Number(amount) / Math.pow(10, decimals),
    delegate: data.delegateOption ? new PublicKey(data.delegate).toString() : null,
    delegatedAmount: data.delegatedAmount,
    isNative: data.isNativeOption === 1,
    closeAuthority: data.closeAuthorityOption ? new PublicKey(data.closeAuthority).toString() : null,
  };
}
```

**Get Associated Token Address:**

```typescript
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

function getATA(
  walletAddress: string,
  mintAddress: string
): string {
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(mintAddress);

  const ata = getAssociatedTokenAddressSync(mint, wallet);
  return ata.toString();
}

async function getOrCreateATA(
  connection: Connection,
  wallet: Keypair,
  mintAddress: string
): Promise<string> {
  const mint = new PublicKey(mintAddress);
  const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey);

  const accountInfo = await connection.getAccountInfo(ata);

  if (!accountInfo) {
    const { createAssociatedTokenAccountInstruction } = await import('@solana/spl-token');

    const ix = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      ata,
      wallet.publicKey,
      mint
    );

    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(connection, tx, [wallet]);
  }

  return ata.toString();
}
```

**Token Metadata (Metaplex):**

```typescript
interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
  image?: string;
}

async function getTokenMetadata(
  connection: Connection,
  mintAddress: string
): Promise<TokenMetadata | null> {
  const mint = new PublicKey(mintAddress);

  const METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM
  );

  const accountInfo = await connection.getAccountInfo(metadataAddress);

  if (!accountInfo) {
    return null;
  }

  const data = accountInfo.data;

  const nameLength = data.readUInt32LE(65);
  const name = data.slice(69, 69 + nameLength).toString('utf8').replace(/\0/g, '');

  const symbolOffset = 69 + nameLength;
  const symbolLength = data.readUInt32LE(symbolOffset);
  const symbol = data.slice(symbolOffset + 4, symbolOffset + 4 + symbolLength).toString('utf8').replace(/\0/g, '');

  const uriOffset = symbolOffset + 4 + symbolLength;
  const uriLength = data.readUInt32LE(uriOffset);
  const uri = data.slice(uriOffset + 4, uriOffset + 4 + uriLength).toString('utf8').replace(/\0/g, '');

  return { name: name.trim(), symbol: symbol.trim(), uri: uri.trim() };
}
```

---

### 4. Program Account Reading

Read and deserialize program-specific accounts.

**Generic Account Reading:**

```typescript
async function getProgramAccounts(
  connection: Connection,
  programId: string,
  filters?: Array<{ memcmp?: { offset: number; bytes: string }; dataSize?: number }>
): Promise<Array<{ pubkey: PublicKey; account: AccountInfo<Buffer> }>> {
  const program = new PublicKey(programId);

  const accounts = await connection.getProgramAccounts(program, {
    filters,
  });

  return accounts;
}
```

**Anchor Account Deserialization:**

```typescript
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';

async function deserializeAnchorAccount<T>(
  connection: Connection,
  programId: string,
  accountAddress: string,
  idl: Idl,
  accountName: string
): Promise<T> {
  const provider = new AnchorProvider(
    connection,
    {} as any,
    { commitment: 'confirmed' }
  );

  const program = new Program(idl, new PublicKey(programId), provider);

  const account = await program.account[accountName].fetch(
    new PublicKey(accountAddress)
  );

  return account as T;
}
```

**Borsh Deserialization:**

```typescript
import * as borsh from 'borsh';

interface MyAccountData {
  authority: Uint8Array;
  balance: bigint;
  timestamp: bigint;
  isInitialized: boolean;
}

const MyAccountSchema = new Map([
  [
    'MyAccountData',
    {
      kind: 'struct',
      fields: [
        ['authority', [32]],
        ['balance', 'u64'],
        ['timestamp', 'i64'],
        ['isInitialized', 'u8'],
      ],
    },
  ],
]);

function deserializeAccount(data: Buffer): MyAccountData {
  return borsh.deserialize(MyAccountSchema, 'MyAccountData', data);
}

async function readProgramAccount(
  connection: Connection,
  accountAddress: string
): Promise<MyAccountData> {
  const publicKey = new PublicKey(accountAddress);
  const accountInfo = await connection.getAccountInfo(publicKey);

  if (!accountInfo) {
    throw new Error('Account not found');
  }

  return deserializeAccount(accountInfo.data);
}
```

---

## Real-Time Subscriptions

**Account Change Subscription:**

```typescript
function subscribeToAccount(
  connection: Connection,
  accountAddress: string,
  callback: (accountInfo: AccountInfo<Buffer>) => void
): number {
  const publicKey = new PublicKey(accountAddress);

  const subscriptionId = connection.onAccountChange(
    publicKey,
    (accountInfo) => {
      callback(accountInfo);
    },
    'confirmed'
  );

  return subscriptionId;
}

function unsubscribe(connection: Connection, subscriptionId: number): void {
  connection.removeAccountChangeListener(subscriptionId);
}
```

**Program Account Subscription:**

```typescript
function subscribeToProgramAccounts(
  connection: Connection,
  programId: string,
  callback: (keyedAccountInfo: { accountId: PublicKey; accountInfo: AccountInfo<Buffer> }) => void,
  filters?: Array<{ memcmp?: { offset: number; bytes: string }; dataSize?: number }>
): number {
  const program = new PublicKey(programId);

  const subscriptionId = connection.onProgramAccountChange(
    program,
    (keyedAccountInfo) => {
      callback(keyedAccountInfo);
    },
    'confirmed',
    filters
  );

  return subscriptionId;
}
```

**Logs Subscription:**

```typescript
function subscribeToLogs(
  connection: Connection,
  filter: PublicKey | 'all' | 'allWithVotes',
  callback: (logs: { signature: string; logs: string[] }) => void
): number {
  const subscriptionId = connection.onLogs(
    filter,
    (logs) => {
      callback({
        signature: logs.signature,
        logs: logs.logs,
      });
    },
    'confirmed'
  );

  return subscriptionId;
}
```

---

## Real-World Examples

### Example 1: Portfolio Dashboard

```typescript
interface PortfolioSummary {
  totalValueUsd: number;
  solBalance: number;
  tokens: Array<{
    mint: string;
    symbol: string;
    balance: number;
    valueUsd: number;
  }>;
}

async function getPortfolioSummary(
  connection: Connection,
  walletAddress: string,
  tokenPrices: Map<string, number>
): Promise<PortfolioSummary> {
  const solBalance = await getSolBalance(connection, walletAddress);
  const solPrice = tokenPrices.get('SOL') || 0;

  const tokenBalances = await getTokenBalances(connection, walletAddress);

  const tokens = await Promise.all(
    tokenBalances.map(async (balance) => {
      const metadata = await getTokenMetadata(connection, balance.mint);
      const price = tokenPrices.get(balance.mint) || 0;

      return {
        mint: balance.mint,
        symbol: metadata?.symbol || 'UNKNOWN',
        balance: balance.uiAmount,
        valueUsd: balance.uiAmount * price,
      };
    })
  );

  const tokensValue = tokens.reduce((sum, t) => sum + t.valueUsd, 0);

  return {
    totalValueUsd: solBalance * solPrice + tokensValue,
    solBalance,
    tokens: tokens.filter(t => t.balance > 0),
  };
}
```

### Example 2: Transaction Monitor

```typescript
interface TransactionMonitor {
  start(): void;
  stop(): void;
  onTransaction: (tx: HeliusTransaction) => void;
}

function createTransactionMonitor(
  connection: Connection,
  walletAddress: string
): TransactionMonitor {
  let subscriptionId: number | null = null;
  let onTransaction: (tx: any) => void = () => {};

  return {
    onTransaction: (callback) => {
      onTransaction = callback;
    },

    start() {
      const publicKey = new PublicKey(walletAddress);

      subscriptionId = connection.onLogs(
        publicKey,
        async (logs) => {
          if (logs.err) return;

          const tx = await connection.getParsedTransaction(logs.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (tx) {
            onTransaction({
              signature: logs.signature,
              timestamp: tx.blockTime,
              type: detectTransactionType(tx),
              logs: logs.logs,
            });
          }
        },
        'confirmed'
      );

      console.log('Monitoring started for:', walletAddress);
    },

    stop() {
      if (subscriptionId !== null) {
        connection.removeOnLogsListener(subscriptionId);
        subscriptionId = null;
        console.log('Monitoring stopped');
      }
    },
  };
}
```

### Example 3: NFT Collection Reader

```typescript
interface NFTMetadata {
  mint: string;
  name: string;
  symbol: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

async function getWalletNFTs(
  connection: Connection,
  walletAddress: string
): Promise<NFTMetadata[]> {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(walletAddress),
    { programId: TOKEN_PROGRAM_ID }
  );

  const nfts: NFTMetadata[] = [];

  for (const { account } of tokenAccounts.value) {
    const data = account.data.parsed.info;

    if (data.tokenAmount.decimals === 0 && data.tokenAmount.uiAmount === 1) {
      const metadata = await getTokenMetadata(connection, data.mint);

      if (metadata && metadata.uri) {
        try {
          const jsonResponse = await fetch(metadata.uri);
          const json = await jsonResponse.json();

          nfts.push({
            mint: data.mint,
            name: json.name || metadata.name,
            symbol: metadata.symbol,
            image: json.image || '',
            attributes: json.attributes || [],
          });
        } catch {
          nfts.push({
            mint: data.mint,
            name: metadata.name,
            symbol: metadata.symbol,
            image: '',
            attributes: [],
          });
        }
      }
    }
  }

  return nfts;
}
```

---

## Testing with Bankrun

```typescript
import { start } from 'solana-bankrun';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('Solana Reader', () => {
  let context: any;
  let connection: Connection;
  let wallet: Keypair;

  beforeAll(async () => {
    context = await start([], []);
    connection = new Connection(context.banksClient);
    wallet = Keypair.generate();

    await context.banksClient.requestAirdrop(wallet.publicKey, 10 * LAMPORTS_PER_SOL);
  });

  test('should get SOL balance', async () => {
    const balance = await getSolBalance(connection, wallet.publicKey.toString());
    expect(balance).toBe(10);
  });

  test('should handle non-existent accounts', async () => {
    const randomKey = Keypair.generate().publicKey.toString();
    const balance = await getSolBalance(connection, randomKey);
    expect(balance).toBe(0);
  });
});
```

---

## Security Considerations

1. **Validate all public keys** before queries
2. **Handle RPC errors gracefully** with retries
3. **Rate limit requests** to avoid bans
4. **Cache frequently accessed data**
5. **Use secure RPC endpoints** for production
6. **Verify account ownership** before trusting data
7. **Don't expose API keys** in client-side code

---

## Related Skills

- **jupiter-trader** - Token swaps
- **wallet-integration** - Wallet connections
- **lp-automation** - LP position reading

---

## Further Reading

- Solana Web3.js: https://solana-labs.github.io/solana-web3.js/
- Helius API: https://docs.helius.dev/
- SPL Token: https://spl.solana.com/token

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
