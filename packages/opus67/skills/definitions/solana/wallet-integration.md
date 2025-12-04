# Wallet Integration Skill

**Skill ID:** `wallet-integration`
**Category:** Solana Development
**Complexity:** Advanced
**Prerequisites:** TypeScript, React, Solana fundamentals
**Last Updated:** 2025-01-04

## Overview

Master Solana wallet integration for web applications using modern wallet adapters, multi-wallet support, and best practices for secure transaction signing. This skill covers Wallet Adapter v2, mobile wallet integration, transaction management, and production-ready patterns.

## Core Competencies

### 1. Wallet Adapter Setup
- @solana/wallet-adapter-react integration
- Multi-wallet support (Phantom, Solflare, Backpack, etc.)
- Auto-connect and wallet persistence
- Network configuration (mainnet, devnet, testnet)

### 2. Transaction Handling
- Transaction building and signing
- Versioned transactions
- Transaction simulation and preflight
- Error handling and retry logic
- Transaction confirmation strategies

### 3. Mobile Wallet Support
- Mobile Wallet Adapter (MWA)
- Deep linking
- QR code signing
- Progressive Web App (PWA) patterns

### 4. Security Best Practices
- Wallet connection verification
- Transaction validation
- Phishing protection
- User confirmation flows

## Technical Implementation

### Complete Wallet Provider Setup

```typescript
// providers/WalletProvider.tsx
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import default styles
require('@solana/wallet-adapter-react-ui/styles.css');

interface Props {
  children: ReactNode;
  network?: WalletAdapterNetwork;
  endpoint?: string;
}

export const SolanaWalletProvider: FC<Props> = ({
  children,
  network = WalletAdapterNetwork.Mainnet,
  endpoint,
}) => {
  // Use custom RPC or fallback to public
  const rpcEndpoint = useMemo(() => {
    if (endpoint) return endpoint;

    // Production: Use private RPC (Helius, QuickNode, etc.)
    if (process.env.NEXT_PUBLIC_RPC_ENDPOINT) {
      return process.env.NEXT_PUBLIC_RPC_ENDPOINT;
    }

    // Fallback to public RPC (not recommended for production)
    return clusterApiUrl(network);
  }, [endpoint, network]);

  // Initialize wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
```

### Custom Wallet Connection Hook

```typescript
// hooks/useWalletConnection.ts
import { useCallback, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: PublicKey | null;
  balance: number | null;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}

export function useWalletConnection() {
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    signTransaction,
    signAllTransactions,
  } = useWallet();

  const [state, setState] = useState<WalletConnectionState>({
    isConnected: connected,
    isConnecting: connecting,
    publicKey,
    balance: null,
    network: 'mainnet-beta',
  });

  // Fetch balance when wallet connects
  useEffect(() => {
    if (!publicKey) {
      setState(prev => ({ ...prev, balance: null }));
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            balance: balance / 1e9, // Convert lamports to SOL
          }));
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();

    // Poll balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicKey, connection]);

  // Update connection state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: connected,
      isConnecting: connecting,
      publicKey,
    }));
  }, [connected, connecting, publicKey]);

  // Disconnect with cleanup
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setState({
        isConnected: false,
        isConnecting: false,
        publicKey: null,
        balance: null,
        network: 'mainnet-beta',
      });
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [disconnect]);

  return {
    ...state,
    disconnect: handleDisconnect,
    signTransaction,
    signAllTransactions,
  };
}
```

### Transaction Builder and Executor

```typescript
// lib/transaction-executor.ts
import {
  Connection,
  Transaction,
  VersionedTransaction,
  TransactionInstruction,
  PublicKey,
  SendOptions,
  Commitment,
  TransactionSignature,
  RpcResponseAndContext,
  SignatureStatus,
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

export interface TransactionResult {
  signature: TransactionSignature;
  success: boolean;
  error?: string;
}

export interface TransactionOptions {
  commitment?: Commitment;
  skipPreflight?: boolean;
  maxRetries?: number;
  preflightCommitment?: Commitment;
}

export class TransactionExecutor {
  constructor(
    private connection: Connection,
    private wallet: WalletContextState
  ) {}

  /**
   * Build, sign, and send a transaction
   */
  async execute(
    instructions: TransactionInstruction[],
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    const {
      commitment = 'confirmed',
      skipPreflight = false,
      maxRetries = 3,
      preflightCommitment = 'processed',
    } = options;

    if (!this.wallet.publicKey || !this.wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      // Build transaction
      const transaction = await this.buildTransaction(instructions);

      // Simulate first
      if (!skipPreflight) {
        await this.simulateTransaction(transaction);
      }

      // Sign transaction
      const signedTx = await this.wallet.signTransaction(transaction);

      // Send with retry logic
      const signature = await this.sendWithRetry(
        signedTx,
        { skipPreflight, preflightCommitment, maxRetries: 0 },
        maxRetries
      );

      // Confirm transaction
      const confirmed = await this.confirmTransaction(signature, commitment);

      if (!confirmed) {
        return {
          signature,
          success: false,
          error: 'Transaction failed to confirm',
        };
      }

      return {
        signature,
        success: true,
      };
    } catch (error) {
      console.error('Transaction execution failed:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build transaction with recent blockhash
   */
  private async buildTransaction(
    instructions: TransactionInstruction[]
  ): Promise<Transaction> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const transaction = new Transaction();
    transaction.add(...instructions);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash('finalized');

    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = this.wallet.publicKey;

    return transaction;
  }

  /**
   * Simulate transaction before sending
   */
  private async simulateTransaction(transaction: Transaction): Promise<void> {
    try {
      const simulation = await this.connection.simulateTransaction(transaction);

      if (simulation.value.err) {
        throw new Error(
          `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`
        );
      }

      console.log('Simulation logs:', simulation.value.logs);
    } catch (error) {
      throw new Error(`Simulation error: ${error}`);
    }
  }

  /**
   * Send transaction with retry logic
   */
  private async sendWithRetry(
    transaction: Transaction,
    options: SendOptions,
    maxRetries: number
  ): Promise<TransactionSignature> {
    let lastError: Error | null = null;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const rawTx = transaction.serialize();
        const signature = await this.connection.sendRawTransaction(rawTx, options);
        return signature;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Transaction send attempt ${i + 1} failed:`, error);

        if (i < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }

  /**
   * Confirm transaction with timeout
   */
  private async confirmTransaction(
    signature: TransactionSignature,
    commitment: Commitment = 'confirmed',
    timeoutMs: number = 60000
  ): Promise<boolean> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      try {
        const status = await this.connection.getSignatureStatus(signature);

        if (status.value?.confirmationStatus === commitment ||
            status.value?.confirmationStatus === 'finalized') {
          return status.value.err === null;
        }

        if (status.value?.err) {
          console.error('Transaction error:', status.value.err);
          return false;
        }
      } catch (error) {
        console.warn('Error checking transaction status:', error);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Transaction confirmation timeout');
  }

  /**
   * Execute multiple transactions in sequence
   */
  async executeBatch(
    instructionBatches: TransactionInstruction[][],
    options: TransactionOptions = {}
  ): Promise<TransactionResult[]> {
    const results: TransactionResult[] = [];

    for (const instructions of instructionBatches) {
      const result = await this.execute(instructions, options);
      results.push(result);

      if (!result.success) {
        // Stop on first failure
        break;
      }
    }

    return results;
  }
}
```

### Versioned Transaction Support

```typescript
// lib/versioned-transaction.ts
import {
  Connection,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  PublicKey,
  AddressLookupTableAccount,
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

export class VersionedTransactionBuilder {
  constructor(
    private connection: Connection,
    private wallet: WalletContextState
  ) {}

  /**
   * Build versioned transaction with lookup tables
   */
  async build(
    instructions: TransactionInstruction[],
    lookupTableAddresses?: PublicKey[]
  ): Promise<VersionedTransaction> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');

    // Fetch lookup tables if provided
    const lookupTables: AddressLookupTableAccount[] = [];
    if (lookupTableAddresses) {
      for (const address of lookupTableAddresses) {
        const table = await this.connection.getAddressLookupTable(address);
        if (table.value) {
          lookupTables.push(table.value);
        }
      }
    }

    // Create message
    const message = new TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message(lookupTables);

    return new VersionedTransaction(message);
  }

  /**
   * Sign and send versioned transaction
   */
  async execute(
    instructions: TransactionInstruction[],
    lookupTableAddresses?: PublicKey[]
  ): Promise<string> {
    if (!this.wallet.signTransaction) {
      throw new Error('Wallet does not support signing');
    }

    // Build transaction
    const transaction = await this.build(instructions, lookupTableAddresses);

    // Sign
    const signedTx = await this.wallet.signTransaction(transaction);

    // Send
    const signature = await this.connection.sendTransaction(signedTx);

    // Confirm
    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }
}
```

### Mobile Wallet Adapter Integration

```typescript
// lib/mobile-wallet-adapter.ts
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  Connection,
  Transaction,
  TransactionInstruction,
  PublicKey,
} from '@solana/web3.js';

export interface MobileWalletConfig {
  appName: string;
  appIcon?: string;
  cluster: 'mainnet-beta' | 'devnet' | 'testnet';
}

export class MobileWalletAdapter {
  constructor(
    private config: MobileWalletConfig,
    private connection: Connection
  ) {}

  /**
   * Connect to mobile wallet
   */
  async connect(): Promise<PublicKey> {
    try {
      const authorization = await transact(async (wallet) => {
        const authResult = await wallet.authorize({
          cluster: this.config.cluster,
          identity: {
            name: this.config.appName,
            uri: window.location.origin,
            icon: this.config.appIcon,
          },
        });

        return authResult;
      });

      return new PublicKey(authorization.accounts[0].address);
    } catch (error) {
      console.error('Mobile wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Sign and send transaction via mobile wallet
   */
  async signAndSend(instructions: TransactionInstruction[]): Promise<string> {
    try {
      const signature = await transact(async (wallet) => {
        // Build transaction
        const { blockhash } = await this.connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: new PublicKey(wallet.accounts[0].address),
          recentBlockhash: blockhash,
        }).add(...instructions);

        // Sign
        const signedTxs = await wallet.signTransactions({
          transactions: [transaction],
        });

        // Send
        const sig = await this.connection.sendRawTransaction(
          signedTxs[0]
        );

        return sig;
      });

      return signature;
    } catch (error) {
      console.error('Mobile transaction failed:', error);
      throw error;
    }
  }

  /**
   * Check if mobile wallet adapter is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' &&
           'solana' in window &&
           'isMobile' in (window.solana as any);
  }
}
```

### Wallet Button Component

```typescript
// components/WalletButton.tsx
import { FC, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { truncateAddress } from '@/lib/utils';

export const WalletButton: FC = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setIsDropdownOpen(false);
  }, [disconnect]);

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full" />
        {publicKey && truncateAddress(publicKey.toBase58())}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
```

### Transaction Status Component

```typescript
// components/TransactionStatus.tsx
import { FC, useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { TransactionSignature } from '@solana/web3.js';

interface Props {
  signature: TransactionSignature;
  onConfirmed?: () => void;
  onError?: (error: string) => void;
}

export const TransactionStatus: FC<Props> = ({
  signature,
  onConfirmed,
  onError
}) => {
  const { connection } = useConnection();
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'error'>('pending');
  const [confirmations, setConfirmations] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const result = await connection.getSignatureStatus(signature);

        if (cancelled) return;

        if (result.value?.confirmationStatus === 'finalized') {
          setStatus('confirmed');
          setConfirmations(31); // Max confirmations
          onConfirmed?.();
          clearInterval(interval);
        } else if (result.value?.confirmationStatus === 'confirmed') {
          setStatus('confirmed');
          setConfirmations(result.value.confirmations || 0);
        } else if (result.value?.err) {
          setStatus('error');
          onError?.(JSON.stringify(result.value.err));
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to check transaction status:', error);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [signature, connection, onConfirmed, onError]);

  return (
    <div className="flex items-center gap-2">
      {status === 'pending' && (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent" />
          <span className="text-sm">Confirming... ({confirmations}/31)</span>
        </>
      )}
      {status === 'confirmed' && (
        <>
          <div className="text-green-600">✓</div>
          <span className="text-sm text-green-600">Confirmed</span>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-red-600">✗</div>
          <span className="text-sm text-red-600">Failed</span>
        </>
      )}
      <a
        href={`https://solscan.io/tx/${signature}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-purple-600 hover:underline"
      >
        View on Solscan
      </a>
    </div>
  );
};
```

## Production Patterns

### 1. Transaction Queue System

```typescript
// lib/transaction-queue.ts
import { TransactionInstruction } from '@solana/web3.js';
import { TransactionExecutor, TransactionResult } from './transaction-executor';

interface QueuedTransaction {
  id: string;
  instructions: TransactionInstruction[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: TransactionResult;
  priority: number;
}

export class TransactionQueue {
  private queue: QueuedTransaction[] = [];
  private processing = false;

  constructor(private executor: TransactionExecutor) {}

  /**
   * Add transaction to queue
   */
  add(
    instructions: TransactionInstruction[],
    priority: number = 0
  ): string {
    const id = Math.random().toString(36).substring(7);

    this.queue.push({
      id,
      instructions,
      status: 'pending',
      priority,
    });

    // Sort by priority
    this.queue.sort((a, b) => b.priority - a.priority);

    // Start processing if not already
    if (!this.processing) {
      this.process();
    }

    return id;
  }

  /**
   * Process queue
   */
  private async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const tx = this.queue[0];
      tx.status = 'processing';

      try {
        const result = await this.executor.execute(tx.instructions);
        tx.result = result;
        tx.status = result.success ? 'completed' : 'failed';
      } catch (error) {
        tx.status = 'failed';
        tx.result = {
          signature: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      this.queue.shift();
    }

    this.processing = false;
  }

  /**
   * Get queue status
   */
  getStatus(): QueuedTransaction[] {
    return [...this.queue];
  }
}
```

### 2. Wallet Persistence

```typescript
// lib/wallet-persistence.ts
const WALLET_STORAGE_KEY = 'solana-wallet-preference';

export function saveWalletPreference(walletName: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WALLET_STORAGE_KEY, walletName);
}

export function loadWalletPreference(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(WALLET_STORAGE_KEY);
}

export function clearWalletPreference(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WALLET_STORAGE_KEY);
}
```

### 3. Network Detection

```typescript
// lib/network-detection.ts
import { Connection, clusterApiUrl } from '@solana/web3.js';

export async function detectNetwork(
  connection: Connection
): Promise<'mainnet-beta' | 'devnet' | 'testnet' | 'localnet'> {
  const genesisHash = await connection.getGenesisHash();

  // Known genesis hashes
  const MAINNET_GENESIS = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
  const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
  const TESTNET_GENESIS = '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY';

  if (genesisHash === MAINNET_GENESIS) return 'mainnet-beta';
  if (genesisHash === DEVNET_GENESIS) return 'devnet';
  if (genesisHash === TESTNET_GENESIS) return 'testnet';
  return 'localnet';
}
```

## Security Best Practices

### 1. Transaction Validation

```typescript
// lib/transaction-validator.ts
import { Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js';

export class TransactionValidator {
  /**
   * Validate transaction before signing
   */
  static validate(transaction: Transaction, expectedPayer: PublicKey): void {
    // Check fee payer
    if (!transaction.feePayer?.equals(expectedPayer)) {
      throw new Error('Invalid fee payer');
    }

    // Check for empty transaction
    if (transaction.instructions.length === 0) {
      throw new Error('Transaction has no instructions');
    }

    // Check for blockhash
    if (!transaction.recentBlockhash) {
      throw new Error('Transaction missing recent blockhash');
    }

    // Validate each instruction
    transaction.instructions.forEach((ix, index) => {
      this.validateInstruction(ix, index);
    });
  }

  /**
   * Validate individual instruction
   */
  private static validateInstruction(
    instruction: TransactionInstruction,
    index: number
  ): void {
    if (!instruction.programId) {
      throw new Error(`Instruction ${index} missing program ID`);
    }

    if (!instruction.keys || instruction.keys.length === 0) {
      throw new Error(`Instruction ${index} has no account keys`);
    }
  }

  /**
   * Check for known malicious programs
   */
  static checkProgramSafety(programId: PublicKey): boolean {
    const KNOWN_SAFE_PROGRAMS = [
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token
      '11111111111111111111111111111111', // System Program
      'ComputeBudget111111111111111111111111111111', // Compute Budget
    ];

    const programIdStr = programId.toBase58();
    return KNOWN_SAFE_PROGRAMS.includes(programIdStr);
  }
}
```

### 2. User Confirmation

```typescript
// components/TransactionConfirmation.tsx
import { FC } from 'react';
import { Transaction, PublicKey } from '@solana/web3.js';
import { formatSOL } from '@/lib/utils';

interface Props {
  transaction: Transaction;
  estimatedFee: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TransactionConfirmation: FC<Props> = ({
  transaction,
  estimatedFee,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Confirm Transaction</h2>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Instructions</span>
            <span className="font-medium">{transaction.instructions.length}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated Fee</span>
            <span className="font-medium">{formatSOL(estimatedFee)} SOL</span>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-gray-500">
              Review the transaction details carefully before confirming.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Common Patterns

### 1. Token Transfer

```typescript
// lib/token-transfer.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

export async function transferToken(
  connection: Connection,
  sender: PublicKey,
  recipient: PublicKey,
  mint: PublicKey,
  amount: bigint
): Promise<Transaction> {
  // Get sender's token account
  const senderTokenAccount = await getAssociatedTokenAddress(mint, sender);

  // Get or create recipient's token account
  const recipientTokenAccount = await getAssociatedTokenAddress(mint, recipient);

  const transaction = new Transaction();

  // Check if recipient account exists
  const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
  if (!accountInfo) {
    // Create recipient token account
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender, // payer
        recipientTokenAccount,
        recipient,
        mint
      )
    );
  }

  // Add transfer instruction
  transaction.add(
    createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      sender,
      amount
    )
  );

  return transaction;
}
```

### 2. SOL Transfer

```typescript
// lib/sol-transfer.ts
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export function createSOLTransfer(
  sender: PublicKey,
  recipient: PublicKey,
  amountSOL: number
): Transaction {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: recipient,
      lamports: amountSOL * LAMPORTS_PER_SOL,
    })
  );

  return transaction;
}
```

## Error Handling

```typescript
// lib/wallet-errors.ts
export enum WalletErrorCode {
  NOT_CONNECTED = 'NOT_CONNECTED',
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export class WalletError extends Error {
  constructor(
    public code: WalletErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export function handleWalletError(error: any): WalletError {
  if (error.code === 4001) {
    return new WalletError(
      WalletErrorCode.USER_REJECTED,
      'User rejected the transaction'
    );
  }

  if (error.message?.includes('insufficient funds')) {
    return new WalletError(
      WalletErrorCode.INSUFFICIENT_FUNDS,
      'Insufficient funds for transaction'
    );
  }

  if (error.message?.includes('not connected')) {
    return new WalletError(
      WalletErrorCode.NOT_CONNECTED,
      'Wallet not connected'
    );
  }

  return new WalletError(
    WalletErrorCode.TRANSACTION_FAILED,
    error.message || 'Transaction failed',
    error
  );
}
```

## Testing

```typescript
// tests/wallet-integration.test.ts
import { describe, it, expect, vi } from 'vitest';
import { PublicKey, Connection } from '@solana/web3.js';
import { TransactionExecutor } from '@/lib/transaction-executor';

describe('TransactionExecutor', () => {
  it('should build transaction with correct parameters', async () => {
    const mockConnection = {
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'test-blockhash',
        lastValidBlockHeight: 1000,
      }),
    } as any;

    const mockWallet = {
      publicKey: new PublicKey('11111111111111111111111111111111'),
      signTransaction: vi.fn(),
    } as any;

    const executor = new TransactionExecutor(mockConnection, mockWallet);

    // Test implementation
  });
});
```

## Key Takeaways

1. **Always validate transactions** before signing
2. **Use versioned transactions** for lower fees
3. **Implement retry logic** for reliability
4. **Support multiple wallets** for better UX
5. **Handle mobile wallets** separately
6. **Confirm transactions** properly
7. **Store wallet preferences** locally
8. **Show transaction status** to users
9. **Test thoroughly** on devnet first
10. **Monitor for errors** and handle gracefully
