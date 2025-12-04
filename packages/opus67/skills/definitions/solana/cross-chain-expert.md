# Cross-Chain Expert - Multi-Chain Architecture & Interoperability

> **ID:** `cross-chain-expert`
> **Tier:** 2 (Domain Expertise)
> **Token Cost:** 8000
> **MCP Connections:** helius
> **Version:** 1.0

## 🎯 What This Skill Does

Master cross-chain architecture and interoperability patterns for building applications that span multiple blockchains. This skill covers bridge integration, chain abstraction, unified state management, and secure cross-chain messaging patterns.

**Core Capabilities:**
- Multi-chain architecture design
- Chain abstraction patterns
- Unified wallet and account management
- Cross-chain state synchronization
- Interoperability protocol integration
- Security patterns for cross-chain operations
- Gas optimization across chains
- Testing cross-chain flows

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** cross-chain, multi-chain, interop, bridge, chain abstraction, multichain
- **File Types:** .ts, .tsx, .rs
- **Directories:** N/A

**Use this skill when:**
- Building multi-chain applications
- Implementing chain abstraction layers
- Designing unified user experiences across chains
- Managing cross-chain asset transfers
- Synchronizing state across blockchains
- Implementing chain-agnostic protocols
- Optimizing multi-chain operations

## 🚀 Core Capabilities

### 1. Multi-Chain Architecture Design

**Architectural Patterns:**

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Unified UI, Chain-Agnostic Business Logic)            │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              Chain Abstraction Layer                     │
│  - Unified API                                          │
│  - Account Management                                   │
│  - Transaction Builder                                  │
│  - State Aggregator                                     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              Protocol Adapters                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Solana   │  │ Ethereum │  │ Polygon  │            │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │  ...       │
│  └──────────┘  └──────────┘  └──────────┘            │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                  Blockchain Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Solana   │  │ Ethereum │  │ Polygon  │            │
│  │ Mainnet  │  │ Mainnet  │  │ Mainnet  │  ...       │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// packages/multichain/src/types.ts
export enum ChainId {
  SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  ETHEREUM_MAINNET = 'eip155:1',
  POLYGON_MAINNET = 'eip155:137',
  BSC_MAINNET = 'eip155:56',
  ARBITRUM_MAINNET = 'eip155:42161',
}

export interface ChainConfig {
  chainId: ChainId;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconUrl?: string;
}

export interface ChainAdapter {
  chainId: ChainId;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getBalance(address: string, tokenAddress?: string): Promise<bigint>;
  sendTransaction(tx: UnifiedTransaction): Promise<string>;
  signMessage(message: string): Promise<string>;
  getTransactionStatus(txHash: string): Promise<TransactionStatus>;
}

export interface UnifiedTransaction {
  from: string;
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  chainId: ChainId;
  // Chain-specific fields
  [key: string]: any;
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  DROPPED = 'dropped',
}

// packages/multichain/src/chains/solana-adapter.ts
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { ChainAdapter, ChainId, UnifiedTransaction, TransactionStatus } from '../types';

export class SolanaAdapter implements ChainAdapter {
  chainId = ChainId.SOLANA_MAINNET;
  private connection: Connection;
  private wallet?: Keypair;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async connect(): Promise<void> {
    // Connect to wallet adapter
    console.log('Connected to Solana');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnected from Solana');
  }

  async getBalance(address: string, tokenAddress?: string): Promise<bigint> {
    const pubkey = new PublicKey(address);

    if (!tokenAddress) {
      // Native SOL balance
      const balance = await this.connection.getBalance(pubkey);
      return BigInt(balance);
    }

    // SPL token balance
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      pubkey,
      { mint: new PublicKey(tokenAddress) }
    );

    if (tokenAccounts.value.length === 0) return BigInt(0);

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;
    return BigInt(balance);
  }

  async sendTransaction(tx: UnifiedTransaction): Promise<string> {
    // Convert unified transaction to Solana transaction
    const transaction = new Transaction();

    // Add instructions based on tx.data
    // This is simplified - real implementation would parse tx.data

    const signature = await this.connection.sendTransaction(transaction, []);
    return signature;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not connected');

    const messageBytes = new TextEncoder().encode(message);
    const signature = this.wallet.sign(messageBytes);
    return Buffer.from(signature).toString('hex');
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    const status = await this.connection.getSignatureStatus(txHash);

    if (!status.value) return TransactionStatus.PENDING;
    if (status.value.err) return TransactionStatus.FAILED;
    if (status.value.confirmationStatus === 'finalized') {
      return TransactionStatus.CONFIRMED;
    }

    return TransactionStatus.PENDING;
  }
}

// packages/multichain/src/chains/ethereum-adapter.ts
import { ethers } from 'ethers';
import { ChainAdapter, ChainId, UnifiedTransaction, TransactionStatus } from '../types';

export class EthereumAdapter implements ChainAdapter {
  chainId = ChainId.ETHEREUM_MAINNET;
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async connect(): Promise<void> {
    // Connect to MetaMask or other wallet
    console.log('Connected to Ethereum');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnected from Ethereum');
  }

  async getBalance(address: string, tokenAddress?: string): Promise<bigint> {
    if (!tokenAddress) {
      // Native ETH balance
      const balance = await this.provider.getBalance(address);
      return balance;
    }

    // ERC20 token balance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );

    const balance = await tokenContract.balanceOf(address);
    return balance;
  }

  async sendTransaction(tx: UnifiedTransaction): Promise<string> {
    if (!this.signer) throw new Error('Signer not connected');

    const ethTx = {
      to: tx.to,
      value: tx.value,
      data: tx.data,
      gasLimit: tx.gasLimit,
      gasPrice: tx.gasPrice,
    };

    const response = await this.signer.sendTransaction(ethTx);
    return response.hash;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not connected');
    return await this.signer.signMessage(message);
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    const receipt = await this.provider.getTransactionReceipt(txHash);

    if (!receipt) return TransactionStatus.PENDING;
    if (receipt.status === 0) return TransactionStatus.FAILED;
    if (receipt.status === 1) return TransactionStatus.CONFIRMED;

    return TransactionStatus.PENDING;
  }
}
```

### 2. Chain Abstraction Layer

**Unified Client:**

```typescript
// packages/multichain/src/client.ts
import { ChainAdapter, ChainId, UnifiedTransaction } from './types';
import { SolanaAdapter } from './chains/solana-adapter';
import { EthereumAdapter } from './chains/ethereum-adapter';

export class MultiChainClient {
  private adapters: Map<ChainId, ChainAdapter> = new Map();
  private connectedChains: Set<ChainId> = new Set();

  constructor(configs: Map<ChainId, { rpcUrl: string }>) {
    // Initialize adapters
    configs.forEach((config, chainId) => {
      const adapter = this.createAdapter(chainId, config.rpcUrl);
      this.adapters.set(chainId, adapter);
    });
  }

  private createAdapter(chainId: ChainId, rpcUrl: string): ChainAdapter {
    if (chainId.startsWith('solana:')) {
      return new SolanaAdapter(rpcUrl);
    } else if (chainId.startsWith('eip155:')) {
      // Determine which EVM chain
      return new EthereumAdapter(rpcUrl);
    }

    throw new Error(`Unsupported chain: ${chainId}`);
  }

  async connect(chainId: ChainId): Promise<void> {
    const adapter = this.adapters.get(chainId);
    if (!adapter) throw new Error(`No adapter for chain ${chainId}`);

    await adapter.connect();
    this.connectedChains.add(chainId);
  }

  async connectAll(): Promise<void> {
    await Promise.all(
      Array.from(this.adapters.keys()).map(chainId => this.connect(chainId))
    );
  }

  async disconnect(chainId: ChainId): Promise<void> {
    const adapter = this.adapters.get(chainId);
    if (!adapter) return;

    await adapter.disconnect();
    this.connectedChains.delete(chainId);
  }

  async getBalance(
    chainId: ChainId,
    address: string,
    tokenAddress?: string
  ): Promise<bigint> {
    const adapter = this.adapters.get(chainId);
    if (!adapter) throw new Error(`No adapter for chain ${chainId}`);

    return adapter.getBalance(address, tokenAddress);
  }

  async getBalancesAcrossChains(
    addresses: Map<ChainId, string>,
    tokenAddress?: string
  ): Promise<Map<ChainId, bigint>> {
    const balances = new Map<ChainId, bigint>();

    await Promise.all(
      Array.from(addresses.entries()).map(async ([chainId, address]) => {
        try {
          const balance = await this.getBalance(chainId, address, tokenAddress);
          balances.set(chainId, balance);
        } catch (error) {
          console.error(`Failed to get balance on ${chainId}:`, error);
          balances.set(chainId, BigInt(0));
        }
      })
    );

    return balances;
  }

  async sendTransaction(tx: UnifiedTransaction): Promise<string> {
    const adapter = this.adapters.get(tx.chainId);
    if (!adapter) throw new Error(`No adapter for chain ${tx.chainId}`);

    return adapter.sendTransaction(tx);
  }

  async waitForTransaction(
    chainId: ChainId,
    txHash: string,
    timeout = 60000
  ): Promise<void> {
    const adapter = this.adapters.get(chainId);
    if (!adapter) throw new Error(`No adapter for chain ${chainId}`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await adapter.getTransactionStatus(txHash);

      if (status === 'confirmed') return;
      if (status === 'failed') throw new Error('Transaction failed');

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Transaction timeout');
  }
}

// packages/multichain/src/account-manager.ts
export interface UnifiedAccount {
  id: string;
  addresses: Map<ChainId, string>;
  primaryChain: ChainId;
}

export class AccountManager {
  private accounts: Map<string, UnifiedAccount> = new Map();

  createAccount(
    addresses: Map<ChainId, string>,
    primaryChain: ChainId
  ): UnifiedAccount {
    const id = this.generateAccountId(addresses);

    const account: UnifiedAccount = {
      id,
      addresses,
      primaryChain,
    };

    this.accounts.set(id, account);
    return account;
  }

  private generateAccountId(addresses: Map<ChainId, string>): string {
    // Generate deterministic ID from addresses
    const sortedAddresses = Array.from(addresses.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([chain, addr]) => `${chain}:${addr}`)
      .join('|');

    return Buffer.from(sortedAddresses).toString('base64').slice(0, 32);
  }

  getAccount(id: string): UnifiedAccount | undefined {
    return this.accounts.get(id);
  }

  getAddressForChain(accountId: string, chainId: ChainId): string | undefined {
    const account = this.accounts.get(accountId);
    return account?.addresses.get(chainId);
  }
}
```

### 3. Cross-Chain State Synchronization

**State Manager:**

```typescript
// packages/multichain/src/state-sync.ts
import { ChainId } from './types';

export interface CrossChainState<T> {
  data: T;
  chainStates: Map<ChainId, ChainState<T>>;
  lastSync: Date;
  conflictResolution: ConflictResolution;
}

export interface ChainState<T> {
  chainId: ChainId;
  data: T;
  blockNumber: bigint;
  blockHash: string;
  timestamp: Date;
  confirmed: boolean;
}

export enum ConflictResolution {
  LATEST = 'latest',
  CONSENSUS = 'consensus',
  PRIMARY_CHAIN = 'primary_chain',
  CUSTOM = 'custom',
}

export class CrossChainStateManager<T> {
  private states: Map<string, CrossChainState<T>> = new Map();
  private client: MultiChainClient;

  constructor(client: MultiChainClient) {
    this.client = client;
  }

  async syncState(
    key: string,
    chains: ChainId[],
    fetcher: (chainId: ChainId) => Promise<ChainState<T>>,
    conflictResolution = ConflictResolution.LATEST
  ): Promise<CrossChainState<T>> {
    // Fetch state from all chains
    const chainStates = new Map<ChainId, ChainState<T>>();

    await Promise.all(
      chains.map(async (chainId) => {
        try {
          const state = await fetcher(chainId);
          chainStates.set(chainId, state);
        } catch (error) {
          console.error(`Failed to fetch state from ${chainId}:`, error);
        }
      })
    );

    // Resolve conflicts
    const resolvedData = this.resolveConflicts(chainStates, conflictResolution);

    const crossChainState: CrossChainState<T> = {
      data: resolvedData,
      chainStates,
      lastSync: new Date(),
      conflictResolution,
    };

    this.states.set(key, crossChainState);
    return crossChainState;
  }

  private resolveConflicts(
    chainStates: Map<ChainId, ChainState<T>>,
    strategy: ConflictResolution
  ): T {
    const states = Array.from(chainStates.values());

    if (states.length === 0) {
      throw new Error('No states to resolve');
    }

    switch (strategy) {
      case ConflictResolution.LATEST:
        // Use state with latest timestamp
        return states.reduce((latest, current) =>
          current.timestamp > latest.timestamp ? current : latest
        ).data;

      case ConflictResolution.CONSENSUS:
        // Use state that appears most frequently
        const dataMap = new Map<string, { data: T; count: number }>();

        states.forEach(state => {
          const key = JSON.stringify(state.data);
          const entry = dataMap.get(key);
          if (entry) {
            entry.count++;
          } else {
            dataMap.set(key, { data: state.data, count: 1 });
          }
        });

        let maxCount = 0;
        let consensusData = states[0].data;

        dataMap.forEach(({ data, count }) => {
          if (count > maxCount) {
            maxCount = count;
            consensusData = data;
          }
        });

        return consensusData;

      case ConflictResolution.PRIMARY_CHAIN:
        // Use first chain's state (assumed to be primary)
        return states[0].data;

      default:
        throw new Error(`Unsupported conflict resolution: ${strategy}`);
    }
  }

  getState(key: string): CrossChainState<T> | undefined {
    return this.states.get(key);
  }

  async watchState(
    key: string,
    chains: ChainId[],
    fetcher: (chainId: ChainId) => Promise<ChainState<T>>,
    callback: (state: CrossChainState<T>) => void,
    interval = 10000
  ): Promise<() => void> {
    // Initial sync
    let state = await this.syncState(key, chains, fetcher);
    callback(state);

    // Poll for updates
    const intervalId = setInterval(async () => {
      state = await this.syncState(key, chains, fetcher);
      callback(state);
    }, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

// Usage example
import { MultiChainClient } from './client';
import { ChainId } from './types';

interface TokenBalance {
  balance: bigint;
  decimals: number;
}

const client = new MultiChainClient(
  new Map([
    [ChainId.SOLANA_MAINNET, { rpcUrl: process.env.SOLANA_RPC! }],
    [ChainId.ETHEREUM_MAINNET, { rpcUrl: process.env.ETH_RPC! }],
  ])
);

const stateManager = new CrossChainStateManager<TokenBalance>(client);

// Sync token balance across chains
const userAddress = 'user123';
const tokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

const balanceState = await stateManager.syncState(
  `balance:${userAddress}:${tokenMint}`,
  [ChainId.SOLANA_MAINNET, ChainId.ETHEREUM_MAINNET],
  async (chainId) => {
    const balance = await client.getBalance(chainId, userAddress, tokenMint);

    return {
      chainId,
      data: { balance, decimals: 6 },
      blockNumber: BigInt(0), // Get from chain
      blockHash: '', // Get from chain
      timestamp: new Date(),
      confirmed: true,
    };
  },
  ConflictResolution.CONSENSUS
);

console.log('Total balance:', balanceState.data.balance);
```

### 4. Cross-Chain Message Passing

**Message Protocol:**

```typescript
// packages/multichain/src/messaging.ts
export interface CrossChainMessage {
  id: string;
  sourceChain: ChainId;
  destinationChain: ChainId;
  sender: string;
  recipient: string;
  payload: Buffer;
  nonce: bigint;
  timestamp: Date;
  signature: string;
}

export interface MessageBridge {
  sendMessage(message: CrossChainMessage): Promise<string>;
  receiveMessage(messageId: string): Promise<CrossChainMessage>;
  getMessageStatus(messageId: string): Promise<MessageStatus>;
}

export enum MessageStatus {
  PENDING = 'pending',
  RELAYED = 'relayed',
  EXECUTED = 'executed',
  FAILED = 'failed',
}

export class CrossChainMessenger {
  private bridges: Map<string, MessageBridge> = new Map();
  private client: MultiChainClient;

  constructor(client: MultiChainClient) {
    this.client = client;
  }

  registerBridge(
    sourceChain: ChainId,
    destChain: ChainId,
    bridge: MessageBridge
  ): void {
    const key = `${sourceChain}->${destChain}`;
    this.bridges.set(key, bridge);
  }

  async sendMessage(
    sourceChain: ChainId,
    destChain: ChainId,
    sender: string,
    recipient: string,
    payload: Buffer
  ): Promise<string> {
    const key = `${sourceChain}->${destChain}`;
    const bridge = this.bridges.get(key);

    if (!bridge) {
      throw new Error(`No bridge found for ${key}`);
    }

    const message: CrossChainMessage = {
      id: this.generateMessageId(),
      sourceChain,
      destinationChain: destChain,
      sender,
      recipient,
      payload,
      nonce: BigInt(Date.now()),
      timestamp: new Date(),
      signature: '', // Sign with sender's key
    };

    const messageId = await bridge.sendMessage(message);
    return messageId;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  async waitForMessage(
    sourceChain: ChainId,
    destChain: ChainId,
    messageId: string,
    timeout = 300000 // 5 minutes
  ): Promise<CrossChainMessage> {
    const key = `${sourceChain}->${destChain}`;
    const bridge = this.bridges.get(key);

    if (!bridge) {
      throw new Error(`No bridge found for ${key}`);
    }

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await bridge.getMessageStatus(messageId);

      if (status === MessageStatus.EXECUTED) {
        return await bridge.receiveMessage(messageId);
      }

      if (status === MessageStatus.FAILED) {
        throw new Error('Message delivery failed');
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Message delivery timeout');
  }
}
```

### 5. Gas Optimization Across Chains

**Gas Manager:**

```typescript
// packages/multichain/src/gas-manager.ts
export interface GasEstimate {
  chainId: ChainId;
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostUSD: number;
}

export class GasManager {
  private client: MultiChainClient;
  private priceOracles: Map<ChainId, () => Promise<number>> = new Map();

  constructor(client: MultiChainClient) {
    this.client = client;
  }

  async estimateGas(
    tx: UnifiedTransaction
  ): Promise<GasEstimate> {
    // Chain-specific gas estimation
    const chainId = tx.chainId;

    if (chainId.startsWith('solana:')) {
      return this.estimateSolanaGas(tx);
    } else if (chainId.startsWith('eip155:')) {
      return this.estimateEvmGas(tx);
    }

    throw new Error(`Unsupported chain: ${chainId}`);
  }

  private async estimateSolanaGas(
    tx: UnifiedTransaction
  ): Promise<GasEstimate> {
    // Solana uses compute units and lamports
    const computeUnits = BigInt(200000); // Estimate
    const computeUnitPrice = BigInt(1); // microlamports

    const estimatedCost = (computeUnits * computeUnitPrice) / BigInt(1000000);
    const solPrice = await this.getTokenPrice(tx.chainId, 'SOL');

    return {
      chainId: tx.chainId,
      gasLimit: computeUnits,
      gasPrice: computeUnitPrice,
      estimatedCost,
      estimatedCostUSD: Number(estimatedCost) * solPrice / 1e9,
    };
  }

  private async estimateEvmGas(
    tx: UnifiedTransaction
  ): Promise<GasEstimate> {
    // EVM gas estimation
    const gasLimit = tx.gasLimit || BigInt(21000);
    const gasPrice = tx.gasPrice || BigInt(0);

    const estimatedCost = gasLimit * gasPrice;
    const ethPrice = await this.getTokenPrice(tx.chainId, 'ETH');

    return {
      chainId: tx.chainId,
      gasLimit,
      gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      estimatedCost,
      estimatedCostUSD: Number(estimatedCost) * ethPrice / 1e18,
    };
  }

  async getCheapestChain(
    chains: ChainId[],
    txType: 'transfer' | 'swap' | 'contract'
  ): Promise<ChainId> {
    const estimates = await Promise.all(
      chains.map(async (chainId) => {
        const mockTx: UnifiedTransaction = {
          from: '0x0',
          to: '0x0',
          chainId,
        };

        const estimate = await this.estimateGas(mockTx);
        return { chainId, cost: estimate.estimatedCostUSD };
      })
    );

    return estimates.reduce((cheapest, current) =>
      current.cost < cheapest.cost ? current : cheapest
    ).chainId;
  }

  private async getTokenPrice(chainId: ChainId, symbol: string): Promise<number> {
    const oracle = this.priceOracles.get(chainId);
    if (oracle) return oracle();

    // Default prices (should fetch from oracle)
    if (symbol === 'SOL') return 100;
    if (symbol === 'ETH') return 2000;
    return 1;
  }
}
```

## 🔒 Security Patterns

### 1. Cross-Chain Verification

```typescript
// packages/multichain/src/security.ts
export class CrossChainVerifier {
  async verifyTransaction(
    txHash: string,
    sourceChain: ChainId,
    destChain: ChainId
  ): Promise<boolean> {
    // Verify transaction on source chain
    const sourceTx = await this.getTransaction(sourceChain, txHash);
    if (!sourceTx) return false;

    // Verify corresponding transaction on destination chain
    const destTxHash = await this.findCorrespondingTx(destChain, sourceTx);
    if (!destTxHash) return false;

    // Verify message integrity
    return this.verifyMessageIntegrity(sourceTx, destTxHash);
  }

  private async getTransaction(
    chainId: ChainId,
    txHash: string
  ): Promise<any> {
    // Fetch transaction from chain
    return null;
  }

  private async findCorrespondingTx(
    chainId: ChainId,
    sourceTx: any
  ): Promise<string | null> {
    // Find corresponding transaction on destination chain
    return null;
  }

  private verifyMessageIntegrity(
    sourceTx: any,
    destTx: any
  ): boolean {
    // Verify message hasn't been tampered with
    return true;
  }
}
```

### 2. Slippage Protection

```typescript
export class SlippageProtector {
  async protectCrossChainSwap(
    sourceAmount: bigint,
    minDestAmount: bigint,
    maxSlippageBps: number
  ): Promise<boolean> {
    const actualSlippage = this.calculateSlippage(
      sourceAmount,
      minDestAmount
    );

    return actualSlippage <= maxSlippageBps;
  }

  private calculateSlippage(
    inputAmount: bigint,
    outputAmount: bigint
  ): number {
    // Simplified - real calculation would consider exchange rates
    const expected = inputAmount;
    const actual = outputAmount;

    if (expected === BigInt(0)) return 0;

    const slippage = Number(
      (expected - actual) * BigInt(10000) / expected
    );

    return slippage;
  }
}
```

## 🧪 Testing Strategies

```typescript
// packages/multichain/src/__tests__/integration.test.ts
import { describe, test, expect } from 'vitest';
import { MultiChainClient } from '../client';
import { ChainId } from '../types';

describe('Multi-Chain Integration', () => {
  test('should connect to multiple chains', async () => {
    const client = new MultiChainClient(
      new Map([
        [ChainId.SOLANA_MAINNET, { rpcUrl: 'http://localhost:8899' }],
        [ChainId.ETHEREUM_MAINNET, { rpcUrl: 'http://localhost:8545' }],
      ])
    );

    await client.connectAll();

    // Verify connections
    expect(client['connectedChains'].size).toBe(2);
  });

  test('should fetch balances across chains', async () => {
    const client = new MultiChainClient(
      new Map([
        [ChainId.SOLANA_MAINNET, { rpcUrl: process.env.SOLANA_RPC! }],
        [ChainId.ETHEREUM_MAINNET, { rpcUrl: process.env.ETH_RPC! }],
      ])
    );

    const addresses = new Map([
      [ChainId.SOLANA_MAINNET, 'Sol...'],
      [ChainId.ETHEREUM_MAINNET, '0x...'],
    ]);

    const balances = await client.getBalancesAcrossChains(addresses);

    expect(balances.size).toBe(2);
  });

  test('should estimate gas on cheapest chain', async () => {
    const gasManager = new GasManager(client);

    const cheapest = await gasManager.getCheapestChain(
      [ChainId.SOLANA_MAINNET, ChainId.ETHEREUM_MAINNET],
      'transfer'
    );

    expect(cheapest).toBeDefined();
  });
});
```

## 📦 Production Patterns

### 1. Chain Abstraction with Fallbacks

```typescript
export class ResilientMultiChainClient extends MultiChainClient {
  private fallbackRpcs: Map<ChainId, string[]> = new Map();

  async getBalanceWithFallback(
    chainId: ChainId,
    address: string,
    tokenAddress?: string
  ): Promise<bigint> {
    try {
      return await this.getBalance(chainId, address, tokenAddress);
    } catch (error) {
      console.error(`Primary RPC failed, trying fallbacks:`, error);

      const fallbacks = this.fallbackRpcs.get(chainId) || [];

      for (const rpcUrl of fallbacks) {
        try {
          const adapter = this.createAdapter(chainId, rpcUrl);
          return await adapter.getBalance(address, tokenAddress);
        } catch (fallbackError) {
          console.error(`Fallback RPC failed:`, fallbackError);
        }
      }

      throw new Error(`All RPCs failed for chain ${chainId}`);
    }
  }
}
```

### 2. Transaction Queue for Multi-Chain Operations

```typescript
interface QueuedTransaction {
  id: string;
  tx: UnifiedTransaction;
  priority: number;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

export class TransactionQueue {
  private queue: QueuedTransaction[] = [];
  private processing = false;

  async enqueue(
    tx: UnifiedTransaction,
    priority = 0,
    maxAttempts = 3
  ): Promise<string> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    this.queue.push({
      id,
      tx,
      priority,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts,
    });

    this.queue.sort((a, b) => b.priority - a.priority);

    if (!this.processing) {
      this.process();
    }

    return id;
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      try {
        // Send transaction
        item.attempts++;
        console.log(`Processing transaction ${item.id}`);

        // If failed and has attempts left, re-queue
      } catch (error) {
        if (item.attempts < item.maxAttempts) {
          this.queue.unshift(item);
        } else {
          console.error(`Transaction ${item.id} failed after max attempts`);
        }
      }
    }

    this.processing = false;
  }
}
```

## 🎯 Best Practices

1. **Always verify cross-chain transactions on both chains**
2. **Implement timeout and retry mechanisms**
3. **Use fallback RPC endpoints for reliability**
4. **Monitor gas costs and optimize routing**
5. **Validate addresses for each chain format**
6. **Implement proper error handling for each chain**
7. **Test on testnets before mainnet deployment**
8. **Use chain-agnostic abstractions where possible**
9. **Implement circuit breakers for bridge operations**
10. **Monitor bridge security and pause if needed**

## 🔗 Related Skills

- **bridge-expert** - Detailed bridge protocol integration
- **solana-reader** - Solana-specific chain queries
- **jupiter-trader** - Cross-chain swaps via Jupiter
- **wallet-integration** - Multi-wallet support

## 📚 Resources

- [CAIP Standards](https://github.com/ChainAgnostic/CAIPs)
- [Wormhole Documentation](https://docs.wormhole.com/)
- [LayerZero Documentation](https://layerzero.network/developers)
- [Axelar Documentation](https://docs.axelar.dev/)
- [Chainlink CCIP](https://docs.chain.link/ccip)
