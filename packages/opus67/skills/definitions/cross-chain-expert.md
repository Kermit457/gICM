# Cross-Chain Expert

Multi-chain architecture specialist for building interoperable blockchain applications. Covers cross-chain messaging, state synchronization, unified interfaces, and chain-agnostic design patterns.

---

## Metadata

- **ID**: cross-chain-expert
- **Name**: Cross-Chain Expert
- **Category**: Cross-Chain
- **Tags**: cross-chain, multi-chain, interoperability, architecture, messaging
- **Version**: 2.0.0
- **Token Estimate**: 4400

---

## Overview

Cross-chain applications require:
- **Chain Abstraction**: Unified interfaces across different blockchains
- **State Synchronization**: Keeping state consistent across chains
- **Message Passing**: Reliable cross-chain communication
- **Liquidity Management**: Optimizing capital across chains
- **Security**: Handling different trust models per chain

This skill covers architectural patterns for building robust multi-chain applications.

---

## Multi-Chain Architecture

### Chain-Agnostic Interface Design

```typescript
// chain-abstraction/types.ts
export enum ChainType {
  EVM = 'evm',
  SOLANA = 'solana',
  COSMOS = 'cosmos',
  MOVE = 'move', // Aptos, Sui
}

export interface ChainConfig {
  id: string;
  name: string;
  type: ChainType;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: Record<string, string>;
}

export interface ChainProvider {
  chainId: string;
  chainType: ChainType;

  // Account operations
  getAddress(): Promise<string>;
  getBalance(address: string): Promise<bigint>;

  // Transaction operations
  sendTransaction(tx: UniversalTransaction): Promise<string>;
  getTransaction(hash: string): Promise<TransactionReceipt>;
  waitForTransaction(hash: string, confirmations?: number): Promise<TransactionReceipt>;

  // Contract operations
  readContract(params: ReadContractParams): Promise<any>;
  writeContract(params: WriteContractParams): Promise<string>;

  // Signing
  signMessage(message: string): Promise<string>;
  signTypedData(data: TypedData): Promise<string>;
}

export interface UniversalTransaction {
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  // Chain-specific options
  options?: Record<string, any>;
}

export interface ReadContractParams {
  address: string;
  functionName: string;
  args?: any[];
  abi?: any[];
}

export interface WriteContractParams extends ReadContractParams {
  value?: bigint;
}

export interface TransactionReceipt {
  hash: string;
  status: 'success' | 'failed' | 'pending';
  blockNumber?: number;
  gasUsed?: bigint;
  logs?: Log[];
}
```

### Provider Factory

```typescript
// chain-abstraction/provider-factory.ts
import { ChainConfig, ChainProvider, ChainType } from './types';
import { EVMProvider } from './providers/evm';
import { SolanaProvider } from './providers/solana';
import { CosmosProvider } from './providers/cosmos';

export class ProviderFactory {
  private static providers: Map<string, ChainProvider> = new Map();

  static createProvider(config: ChainConfig, signer?: any): ChainProvider {
    const key = `${config.id}-${signer ? 'signed' : 'readonly'}`;

    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }

    let provider: ChainProvider;

    switch (config.type) {
      case ChainType.EVM:
        provider = new EVMProvider(config, signer);
        break;
      case ChainType.SOLANA:
        provider = new SolanaProvider(config, signer);
        break;
      case ChainType.COSMOS:
        provider = new CosmosProvider(config, signer);
        break;
      default:
        throw new Error(`Unsupported chain type: ${config.type}`);
    }

    this.providers.set(key, provider);
    return provider;
  }

  static getProvider(chainId: string): ChainProvider | undefined {
    return this.providers.get(chainId);
  }
}

// EVM Provider Implementation
export class EVMProvider implements ChainProvider {
  chainId: string;
  chainType = ChainType.EVM;

  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(config: ChainConfig, signer?: ethers.Signer) {
    this.chainId = config.id;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = signer;
  }

  async getAddress(): Promise<string> {
    if (!this.signer) throw new Error('No signer connected');
    return this.signer.getAddress();
  }

  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  async sendTransaction(tx: UniversalTransaction): Promise<string> {
    if (!this.signer) throw new Error('No signer connected');

    const response = await this.signer.sendTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      gasLimit: tx.gasLimit,
    });

    return response.hash;
  }

  async readContract(params: ReadContractParams): Promise<any> {
    const contract = new ethers.Contract(
      params.address,
      params.abi || [],
      this.provider
    );

    return contract[params.functionName](...(params.args || []));
  }

  async writeContract(params: WriteContractParams): Promise<string> {
    if (!this.signer) throw new Error('No signer connected');

    const contract = new ethers.Contract(
      params.address,
      params.abi || [],
      this.signer
    );

    const tx = await contract[params.functionName](
      ...(params.args || []),
      { value: params.value }
    );

    return tx.hash;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) throw new Error('No signer connected');
    return this.signer.signMessage(message);
  }
}

// Solana Provider Implementation
export class SolanaProvider implements ChainProvider {
  chainId: string;
  chainType = ChainType.SOLANA;

  private connection: Connection;
  private wallet?: Keypair;

  constructor(config: ChainConfig, wallet?: Keypair) {
    this.chainId = config.id;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.wallet = wallet;
  }

  async getAddress(): Promise<string> {
    if (!this.wallet) throw new Error('No wallet connected');
    return this.wallet.publicKey.toBase58();
  }

  async getBalance(address: string): Promise<bigint> {
    const balance = await this.connection.getBalance(new PublicKey(address));
    return BigInt(balance);
  }

  async sendTransaction(tx: UniversalTransaction): Promise<string> {
    if (!this.wallet) throw new Error('No wallet connected');

    const transaction = new Transaction();

    // Add instructions based on tx.data
    // ... parse and add instructions

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.wallet]
    );

    return signature;
  }

  async readContract(params: ReadContractParams): Promise<any> {
    // For Solana, this typically means fetching account data
    const accountInfo = await this.connection.getAccountInfo(
      new PublicKey(params.address)
    );

    if (!accountInfo) return null;

    // Deserialize based on program
    // ... implement deserialization

    return accountInfo.data;
  }

  async writeContract(params: WriteContractParams): Promise<string> {
    // Build instruction from params
    // ... implement instruction building

    return this.sendTransaction({
      to: params.address,
      data: params.functionName,
    });
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) throw new Error('No wallet connected');

    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, this.wallet.secretKey);

    return Buffer.from(signature).toString('base64');
  }
}
```

---

## Cross-Chain Messaging

### Message Protocol

```typescript
// messaging/protocol.ts
export interface CrossChainMessage {
  id: string;
  sourceChain: string;
  destinationChain: string;
  sender: string;
  recipient: string;
  payload: Uint8Array;
  nonce: bigint;
  timestamp: number;
  gasLimit: bigint;
}

export interface MessageReceipt {
  messageId: string;
  sourceTxHash: string;
  destinationTxHash?: string;
  status: 'sent' | 'delivered' | 'executed' | 'failed';
  error?: string;
}

export interface MessageHandler {
  handleMessage(message: CrossChainMessage): Promise<void>;
}

// Message encoding/decoding
export class MessageCodec {
  static encode(message: CrossChainMessage): Uint8Array {
    // Use a deterministic encoding (e.g., borsh, protobuf)
    const encoder = new TextEncoder();
    const json = JSON.stringify({
      ...message,
      nonce: message.nonce.toString(),
      gasLimit: message.gasLimit.toString(),
      payload: Buffer.from(message.payload).toString('base64'),
    });
    return encoder.encode(json);
  }

  static decode(data: Uint8Array): CrossChainMessage {
    const decoder = new TextDecoder();
    const json = JSON.parse(decoder.decode(data));
    return {
      ...json,
      nonce: BigInt(json.nonce),
      gasLimit: BigInt(json.gasLimit),
      payload: Buffer.from(json.payload, 'base64'),
    };
  }

  static hashMessage(message: CrossChainMessage): string {
    const encoded = this.encode(message);
    return ethers.keccak256(encoded);
  }
}
```

### Cross-Chain Messenger

```typescript
// messaging/messenger.ts
import { ChainProvider, ProviderFactory } from '../chain-abstraction';
import { CrossChainMessage, MessageReceipt, MessageCodec } from './protocol';

export class CrossChainMessenger {
  private providers: Map<string, ChainProvider>;
  private pendingMessages: Map<string, CrossChainMessage>;
  private messageHandlers: Map<string, MessageHandler>;

  constructor() {
    this.providers = new Map();
    this.pendingMessages = new Map();
    this.messageHandlers = new Map();
  }

  registerChain(chainId: string, provider: ChainProvider): void {
    this.providers.set(chainId, provider);
  }

  registerHandler(messageType: string, handler: MessageHandler): void {
    this.messageHandlers.set(messageType, handler);
  }

  async sendMessage(
    sourceChain: string,
    destinationChain: string,
    recipient: string,
    payload: Uint8Array,
    options?: { gasLimit?: bigint }
  ): Promise<MessageReceipt> {
    const sourceProvider = this.providers.get(sourceChain);
    if (!sourceProvider) {
      throw new Error(`Chain ${sourceChain} not registered`);
    }

    const sender = await sourceProvider.getAddress();
    const nonce = BigInt(Date.now());

    const message: CrossChainMessage = {
      id: `${sourceChain}-${destinationChain}-${nonce}`,
      sourceChain,
      destinationChain,
      sender,
      recipient,
      payload,
      nonce,
      timestamp: Date.now(),
      gasLimit: options?.gasLimit || BigInt(500000),
    };

    // Encode and send message
    const encodedMessage = MessageCodec.encode(message);

    // Send to messaging protocol (Wormhole, LayerZero, etc.)
    const txHash = await this.submitToMessagingProtocol(
      sourceProvider,
      message,
      encodedMessage
    );

    this.pendingMessages.set(message.id, message);

    return {
      messageId: message.id,
      sourceTxHash: txHash,
      status: 'sent',
    };
  }

  private async submitToMessagingProtocol(
    provider: ChainProvider,
    message: CrossChainMessage,
    encodedMessage: Uint8Array
  ): Promise<string> {
    // Implementation depends on messaging protocol
    // This is a simplified example

    const messengerContract = '0x...'; // Protocol-specific address

    return provider.writeContract({
      address: messengerContract,
      functionName: 'sendMessage',
      args: [
        message.destinationChain,
        message.recipient,
        encodedMessage,
        message.gasLimit,
      ],
      abi: MESSENGER_ABI,
    });
  }

  async getMessageStatus(messageId: string): Promise<MessageReceipt> {
    const message = this.pendingMessages.get(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Check destination chain for delivery
    const destProvider = this.providers.get(message.destinationChain);
    if (!destProvider) {
      throw new Error(`Destination chain ${message.destinationChain} not registered`);
    }

    // Query messaging protocol for status
    // ... implementation

    return {
      messageId,
      sourceTxHash: '',
      status: 'delivered',
    };
  }

  // Listener for incoming messages
  async startListening(chainId: string): Promise<void> {
    const provider = this.providers.get(chainId);
    if (!provider) return;

    // Subscribe to message events
    // Implementation depends on chain type and messaging protocol

    console.log(`Listening for messages on ${chainId}`);
  }

  async processIncomingMessage(
    message: CrossChainMessage
  ): Promise<void> {
    // Validate message
    const messageHash = MessageCodec.hashMessage(message);

    // Find handler
    const handler = this.messageHandlers.get('default');
    if (!handler) {
      console.warn(`No handler for message ${message.id}`);
      return;
    }

    await handler.handleMessage(message);
  }
}

const MESSENGER_ABI = [
  'function sendMessage(uint16 destChain, bytes recipient, bytes payload, uint256 gasLimit) external payable returns (bytes32 messageId)',
  'event MessageSent(bytes32 indexed messageId, uint16 destChain, bytes recipient)',
  'event MessageReceived(bytes32 indexed messageId, uint16 srcChain, bytes sender, bytes payload)',
];
```

---

## State Synchronization

### Cross-Chain State Manager

```typescript
// state-sync/state-manager.ts
export interface ChainState {
  chainId: string;
  blockNumber: number;
  timestamp: number;
  data: Record<string, any>;
}

export interface StateUpdate {
  key: string;
  value: any;
  sourceChain: string;
  sourceBlock: number;
  proof?: Uint8Array; // Merkle proof for verification
}

export class CrossChainStateManager {
  private states: Map<string, ChainState> = new Map();
  private syncQueue: StateUpdate[] = [];
  private messenger: CrossChainMessenger;

  constructor(messenger: CrossChainMessenger) {
    this.messenger = messenger;
  }

  async updateState(
    chainId: string,
    key: string,
    value: any,
    propagateToChains: string[]
  ): Promise<void> {
    // Update local state
    const state = this.states.get(chainId) || {
      chainId,
      blockNumber: 0,
      timestamp: Date.now(),
      data: {},
    };

    state.data[key] = value;
    state.timestamp = Date.now();
    this.states.set(chainId, state);

    // Propagate to other chains
    for (const destChain of propagateToChains) {
      const update: StateUpdate = {
        key,
        value,
        sourceChain: chainId,
        sourceBlock: state.blockNumber,
      };

      await this.propagateUpdate(destChain, update);
    }
  }

  private async propagateUpdate(
    destChain: string,
    update: StateUpdate
  ): Promise<void> {
    const payload = new TextEncoder().encode(JSON.stringify(update));

    await this.messenger.sendMessage(
      update.sourceChain,
      destChain,
      'state-receiver', // Contract that handles state updates
      payload
    );
  }

  async getState(chainId: string, key: string): Promise<any> {
    const state = this.states.get(chainId);
    if (!state) return undefined;
    return state.data[key];
  }

  async syncFromChain(chainId: string): Promise<void> {
    const provider = ProviderFactory.getProvider(chainId);
    if (!provider) return;

    // Fetch latest state from chain
    // ... implementation depends on state storage contract
  }

  // Merkle proof verification for state
  verifyStateProof(
    update: StateUpdate,
    stateRoot: Uint8Array
  ): boolean {
    if (!update.proof) return false;

    // Verify Merkle proof
    // ... implementation

    return true;
  }
}
```

### Optimistic State Updates

```typescript
// state-sync/optimistic-updates.ts
export interface OptimisticUpdate {
  id: string;
  update: StateUpdate;
  submittedAt: number;
  challengePeriod: number; // seconds
  challenged: boolean;
  finalized: boolean;
}

export class OptimisticStateSync {
  private updates: Map<string, OptimisticUpdate> = new Map();
  private challengePeriod = 3600; // 1 hour default

  async submitUpdate(update: StateUpdate): Promise<string> {
    const id = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const optimisticUpdate: OptimisticUpdate = {
      id,
      update,
      submittedAt: Date.now(),
      challengePeriod: this.challengePeriod,
      challenged: false,
      finalized: false,
    };

    this.updates.set(id, optimisticUpdate);

    // Start finalization timer
    setTimeout(() => {
      this.tryFinalize(id);
    }, this.challengePeriod * 1000);

    return id;
  }

  async challengeUpdate(
    updateId: string,
    proof: Uint8Array
  ): Promise<boolean> {
    const update = this.updates.get(updateId);
    if (!update) return false;

    const now = Date.now();
    const deadline = update.submittedAt + update.challengePeriod * 1000;

    if (now > deadline) {
      return false; // Challenge period expired
    }

    // Verify challenge proof
    const validChallenge = this.verifyChallenge(update, proof);

    if (validChallenge) {
      update.challenged = true;
      // Slash submitter, revert update
      await this.revertUpdate(update);
      return true;
    }

    return false;
  }

  private async tryFinalize(updateId: string): Promise<void> {
    const update = this.updates.get(updateId);
    if (!update || update.challenged || update.finalized) return;

    update.finalized = true;
    console.log(`Update ${updateId} finalized`);

    // Apply update to canonical state
    // ... implementation
  }

  private verifyChallenge(
    update: OptimisticUpdate,
    proof: Uint8Array
  ): boolean {
    // Verify fraud proof
    // ... implementation
    return false;
  }

  private async revertUpdate(update: OptimisticUpdate): Promise<void> {
    // Revert the update and slash stake
    // ... implementation
  }
}
```

---

## Unified Token Interface

### Cross-Chain Token

```typescript
// tokens/unified-token.ts
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

export interface ChainTokenInfo extends TokenInfo {
  chainId: string;
  address: string;
  isNative: boolean;
  isWrapped: boolean;
  bridgeProvider?: string;
}

export interface TokenBalance {
  chainId: string;
  address: string;
  balance: bigint;
  usdValue?: number;
}

export class UnifiedToken {
  readonly symbol: string;
  readonly name: string;
  private chainTokens: Map<string, ChainTokenInfo>;

  constructor(info: TokenInfo) {
    this.symbol = info.symbol;
    this.name = info.name;
    this.chainTokens = new Map();
  }

  addChainToken(info: ChainTokenInfo): void {
    this.chainTokens.set(info.chainId, info);
  }

  getChainToken(chainId: string): ChainTokenInfo | undefined {
    return this.chainTokens.get(chainId);
  }

  getSupportedChains(): string[] {
    return Array.from(this.chainTokens.keys());
  }

  async getBalances(
    address: string,
    providers: Map<string, ChainProvider>
  ): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = [];

    for (const [chainId, tokenInfo] of this.chainTokens) {
      const provider = providers.get(chainId);
      if (!provider) continue;

      try {
        let balance: bigint;

        if (tokenInfo.isNative) {
          balance = await provider.getBalance(address);
        } else {
          balance = await provider.readContract({
            address: tokenInfo.address,
            functionName: 'balanceOf',
            args: [address],
            abi: ERC20_ABI,
          });
        }

        balances.push({
          chainId,
          address: tokenInfo.address,
          balance,
        });
      } catch (error) {
        console.error(`Failed to get balance on ${chainId}:`, error);
      }
    }

    return balances;
  }

  async getTotalBalance(
    address: string,
    providers: Map<string, ChainProvider>
  ): Promise<bigint> {
    const balances = await this.getBalances(address, providers);
    return balances.reduce((sum, b) => sum + b.balance, 0n);
  }
}

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];
```

### Token Registry

```typescript
// tokens/registry.ts
export class TokenRegistry {
  private tokens: Map<string, UnifiedToken> = new Map();

  constructor() {
    this.initializeCommonTokens();
  }

  private initializeCommonTokens(): void {
    // USDC
    const usdc = new UnifiedToken({
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    });

    usdc.addChainToken({
      chainId: 'ethereum',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      isNative: false,
      isWrapped: false,
    });

    usdc.addChainToken({
      chainId: 'solana',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      isNative: false,
      isWrapped: false,
    });

    usdc.addChainToken({
      chainId: 'polygon',
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      isNative: false,
      isWrapped: true, // Bridged USDC on Polygon
      bridgeProvider: 'PoS Bridge',
    });

    this.tokens.set('USDC', usdc);

    // Add more common tokens...
  }

  getToken(symbol: string): UnifiedToken | undefined {
    return this.tokens.get(symbol.toUpperCase());
  }

  registerToken(token: UnifiedToken): void {
    this.tokens.set(token.symbol.toUpperCase(), token);
  }

  getAllTokens(): UnifiedToken[] {
    return Array.from(this.tokens.values());
  }

  getTokensOnChain(chainId: string): ChainTokenInfo[] {
    const tokens: ChainTokenInfo[] = [];

    for (const token of this.tokens.values()) {
      const chainToken = token.getChainToken(chainId);
      if (chainToken) {
        tokens.push(chainToken);
      }
    }

    return tokens;
  }
}
```

---

## Cross-Chain Swaps

### Aggregated Swap Router

```typescript
// swaps/aggregator.ts
export interface SwapQuote {
  inputToken: ChainTokenInfo;
  outputToken: ChainTokenInfo;
  inputAmount: bigint;
  outputAmount: bigint;
  route: SwapRoute[];
  estimatedGas: bigint;
  priceImpact: number;
  provider: string;
}

export interface SwapRoute {
  chainId: string;
  protocol: string;
  inputToken: string;
  outputToken: string;
  inputAmount: bigint;
  outputAmount: bigint;
}

export class CrossChainSwapAggregator {
  private providers: Map<string, ChainProvider>;
  private dexAggregators: Map<string, DEXAggregator>;

  constructor() {
    this.providers = new Map();
    this.dexAggregators = new Map();
  }

  async getQuote(
    inputChain: string,
    outputChain: string,
    inputToken: string,
    outputToken: string,
    amount: bigint,
    slippageBps: number = 50
  ): Promise<SwapQuote[]> {
    const quotes: SwapQuote[] = [];

    // Same-chain swap
    if (inputChain === outputChain) {
      const dex = this.dexAggregators.get(inputChain);
      if (dex) {
        const quote = await dex.getQuote(inputToken, outputToken, amount);
        quotes.push(quote);
      }
      return quotes;
    }

    // Cross-chain: find best route
    // Option 1: Direct bridge + swap on destination
    // Option 2: Swap on source + bridge
    // Option 3: Bridge to intermediate chain + swap + bridge

    // Calculate Option 1
    const bridgeQuote = await this.getBridgeQuote(
      inputChain,
      outputChain,
      inputToken,
      amount
    );

    const destDex = this.dexAggregators.get(outputChain);
    if (destDex && bridgeQuote) {
      const swapQuote = await destDex.getQuote(
        bridgeQuote.outputToken,
        outputToken,
        bridgeQuote.outputAmount
      );

      quotes.push({
        inputToken: { chainId: inputChain, address: inputToken } as ChainTokenInfo,
        outputToken: { chainId: outputChain, address: outputToken } as ChainTokenInfo,
        inputAmount: amount,
        outputAmount: swapQuote.outputAmount,
        route: [
          {
            chainId: inputChain,
            protocol: 'bridge',
            inputToken,
            outputToken: bridgeQuote.outputToken,
            inputAmount: amount,
            outputAmount: bridgeQuote.outputAmount,
          },
          {
            chainId: outputChain,
            protocol: swapQuote.provider,
            inputToken: bridgeQuote.outputToken,
            outputToken,
            inputAmount: bridgeQuote.outputAmount,
            outputAmount: swapQuote.outputAmount,
          },
        ],
        estimatedGas: bridgeQuote.gas + swapQuote.estimatedGas,
        priceImpact: swapQuote.priceImpact,
        provider: 'aggregator',
      });
    }

    // Sort by output amount
    quotes.sort((a, b) =>
      Number(b.outputAmount - a.outputAmount)
    );

    return quotes;
  }

  async executeSwap(
    quote: SwapQuote,
    userAddress: string,
    options?: { deadline?: number }
  ): Promise<{ txHashes: string[] }> {
    const txHashes: string[] = [];

    for (const step of quote.route) {
      const provider = this.providers.get(step.chainId);
      if (!provider) {
        throw new Error(`Provider not found for chain ${step.chainId}`);
      }

      if (step.protocol === 'bridge') {
        // Execute bridge
        const hash = await this.executeBridge(
          step.chainId,
          quote.outputToken.chainId,
          step.inputToken,
          step.inputAmount,
          userAddress
        );
        txHashes.push(hash);

        // Wait for bridge completion
        await this.waitForBridge(hash);
      } else {
        // Execute swap
        const dex = this.dexAggregators.get(step.chainId);
        if (dex) {
          const hash = await dex.executeSwap(
            step.inputToken,
            step.outputToken,
            step.inputAmount,
            step.outputAmount,
            userAddress,
            options?.deadline
          );
          txHashes.push(hash);
        }
      }
    }

    return { txHashes };
  }

  private async getBridgeQuote(
    sourceChain: string,
    destChain: string,
    token: string,
    amount: bigint
  ): Promise<{
    outputToken: string;
    outputAmount: bigint;
    gas: bigint;
  } | null> {
    // Query bridge protocols for quote
    // ... implementation
    return null;
  }

  private async executeBridge(
    sourceChain: string,
    destChain: string,
    token: string,
    amount: bigint,
    recipient: string
  ): Promise<string> {
    // Execute bridge transaction
    // ... implementation
    return '';
  }

  private async waitForBridge(txHash: string): Promise<void> {
    // Wait for bridge completion
    // ... implementation with retry logic
  }
}

interface DEXAggregator {
  getQuote(inputToken: string, outputToken: string, amount: bigint): Promise<SwapQuote>;
  executeSwap(
    inputToken: string,
    outputToken: string,
    inputAmount: bigint,
    minOutputAmount: bigint,
    recipient: string,
    deadline?: number
  ): Promise<string>;
}
```

---

## Security Patterns

### Cross-Chain Validation

```typescript
// security/validation.ts
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class CrossChainValidator {
  validateMessage(message: CrossChainMessage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate source chain
    if (!SUPPORTED_CHAINS.includes(message.sourceChain)) {
      errors.push(`Unsupported source chain: ${message.sourceChain}`);
    }

    // Validate destination chain
    if (!SUPPORTED_CHAINS.includes(message.destinationChain)) {
      errors.push(`Unsupported destination chain: ${message.destinationChain}`);
    }

    // Validate addresses
    if (!this.isValidAddress(message.sender, message.sourceChain)) {
      errors.push('Invalid sender address');
    }

    if (!this.isValidAddress(message.recipient, message.destinationChain)) {
      errors.push('Invalid recipient address');
    }

    // Validate nonce (prevent replay)
    if (message.nonce <= 0n) {
      errors.push('Invalid nonce');
    }

    // Validate timestamp
    const now = Date.now();
    const messageAge = now - message.timestamp;

    if (messageAge > 3600000) { // 1 hour
      warnings.push('Message is older than 1 hour');
    }

    if (message.timestamp > now + 60000) { // 1 minute in future
      errors.push('Message timestamp is in the future');
    }

    // Validate gas limit
    if (message.gasLimit < 21000n) {
      warnings.push('Gas limit may be too low');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isValidAddress(address: string, chainId: string): boolean {
    const chainType = getChainType(chainId);

    switch (chainType) {
      case ChainType.EVM:
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case ChainType.SOLANA:
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      default:
        return true;
    }
  }

  validateSwapQuote(quote: SwapQuote): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check price impact
    if (quote.priceImpact > 5) {
      warnings.push(`High price impact: ${quote.priceImpact}%`);
    }

    if (quote.priceImpact > 10) {
      errors.push(`Price impact too high: ${quote.priceImpact}%`);
    }

    // Validate route
    if (quote.route.length === 0) {
      errors.push('Empty swap route');
    }

    if (quote.route.length > 5) {
      warnings.push('Complex route may increase failure risk');
    }

    // Verify amounts
    if (quote.outputAmount === 0n) {
      errors.push('Output amount is zero');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

const SUPPORTED_CHAINS = [
  'ethereum',
  'polygon',
  'arbitrum',
  'optimism',
  'avalanche',
  'bsc',
  'solana',
];

function getChainType(chainId: string): ChainType {
  if (chainId === 'solana') return ChainType.SOLANA;
  return ChainType.EVM;
}
```

### Rate Limiting and Circuit Breaker

```typescript
// security/rate-limit.ts
export class CrossChainRateLimiter {
  private requestCounts: Map<string, number[]> = new Map();
  private limits: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };

  constructor(limits?: Partial<typeof CrossChainRateLimiter.prototype.limits>) {
    this.limits = {
      perMinute: 10,
      perHour: 100,
      perDay: 500,
      ...limits,
    };
  }

  canMakeRequest(userId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const requests = this.requestCounts.get(userId) || [];

    // Filter to relevant windows
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;

    const lastMinute = requests.filter(t => t > minuteAgo);
    const lastHour = requests.filter(t => t > hourAgo);
    const lastDay = requests.filter(t => t > dayAgo);

    if (lastMinute.length >= this.limits.perMinute) {
      const retryAfter = Math.ceil((minuteAgo + 60000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    if (lastHour.length >= this.limits.perHour) {
      const retryAfter = Math.ceil((hourAgo + 3600000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    if (lastDay.length >= this.limits.perDay) {
      const retryAfter = Math.ceil((dayAgo + 86400000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  }

  recordRequest(userId: string): void {
    const requests = this.requestCounts.get(userId) || [];
    requests.push(Date.now());
    this.requestCounts.set(userId, requests);
  }
}

export class CircuitBreaker {
  private failures: Map<string, number[]> = new Map();
  private state: Map<string, 'closed' | 'open' | 'half-open'> = new Map();
  private config: {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenRequests: number;
  };

  constructor(config?: Partial<typeof CircuitBreaker.prototype.config>) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      halfOpenRequests: 3,
      ...config,
    };
  }

  canRequest(chainId: string): boolean {
    const state = this.state.get(chainId) || 'closed';
    return state !== 'open';
  }

  recordSuccess(chainId: string): void {
    const state = this.state.get(chainId);

    if (state === 'half-open') {
      this.state.set(chainId, 'closed');
      this.failures.delete(chainId);
    }
  }

  recordFailure(chainId: string): void {
    const failures = this.failures.get(chainId) || [];
    failures.push(Date.now());
    this.failures.set(chainId, failures);

    // Check if threshold exceeded
    const recentFailures = failures.filter(
      t => t > Date.now() - this.config.resetTimeout
    );

    if (recentFailures.length >= this.config.failureThreshold) {
      this.state.set(chainId, 'open');

      // Set timeout to half-open
      setTimeout(() => {
        if (this.state.get(chainId) === 'open') {
          this.state.set(chainId, 'half-open');
        }
      }, this.config.resetTimeout);
    }
  }

  getState(chainId: string): 'closed' | 'open' | 'half-open' {
    return this.state.get(chainId) || 'closed';
  }
}
```

---

## Testing Cross-Chain

```typescript
// tests/cross-chain.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('Cross-Chain Integration', () => {
  describe('Message Passing', () => {
    it('should encode and decode messages correctly', () => {
      const message: CrossChainMessage = {
        id: 'test-1',
        sourceChain: 'ethereum',
        destinationChain: 'solana',
        sender: '0x1234567890123456789012345678901234567890',
        recipient: 'GHoKvtRf3RrYvQkDxVe5Q7qNdJrgbMFYDNZJPzqL5hzk',
        payload: new Uint8Array([1, 2, 3, 4]),
        nonce: BigInt(12345),
        timestamp: Date.now(),
        gasLimit: BigInt(500000),
      };

      const encoded = MessageCodec.encode(message);
      const decoded = MessageCodec.decode(encoded);

      expect(decoded.id).toBe(message.id);
      expect(decoded.sourceChain).toBe(message.sourceChain);
      expect(decoded.nonce).toBe(message.nonce);
    });

    it('should validate messages correctly', () => {
      const validator = new CrossChainValidator();

      const validMessage: CrossChainMessage = {
        id: 'test-2',
        sourceChain: 'ethereum',
        destinationChain: 'polygon',
        sender: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        payload: new Uint8Array([1, 2, 3]),
        nonce: BigInt(1),
        timestamp: Date.now(),
        gasLimit: BigInt(100000),
      };

      const result = validator.validateMessage(validMessage);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid addresses', () => {
      const validator = new CrossChainValidator();

      const invalidMessage: CrossChainMessage = {
        id: 'test-3',
        sourceChain: 'ethereum',
        destinationChain: 'polygon',
        sender: 'invalid-address',
        recipient: '0xabcd',
        payload: new Uint8Array([]),
        nonce: BigInt(1),
        timestamp: Date.now(),
        gasLimit: BigInt(100000),
      };

      const result = validator.validateMessage(invalidMessage);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid sender address');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', () => {
      const limiter = new CrossChainRateLimiter({
        perMinute: 2,
        perHour: 10,
        perDay: 100,
      });

      const user = 'user-123';

      // First 2 requests should pass
      expect(limiter.canMakeRequest(user).allowed).toBe(true);
      limiter.recordRequest(user);

      expect(limiter.canMakeRequest(user).allowed).toBe(true);
      limiter.recordRequest(user);

      // 3rd request should be blocked
      const result = limiter.canMakeRequest(user);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after threshold failures', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      const chain = 'ethereum';

      // Record failures
      breaker.recordFailure(chain);
      breaker.recordFailure(chain);
      expect(breaker.canRequest(chain)).toBe(true);

      breaker.recordFailure(chain);
      expect(breaker.canRequest(chain)).toBe(false);
      expect(breaker.getState(chain)).toBe('open');
    });
  });
});
```

---

## Related Skills

- **bridge-expert** - Specific bridge protocol integrations
- **wallet-integration** - Multi-chain wallet support
- **jupiter-trader** - Solana DEX aggregation
- **smart-contract-auditor** - Cross-chain security auditing

---

## Further Reading

- [Cross-Chain Interoperability Protocol (CCIP)](https://chain.link/cross-chain)
- [Wormhole xDapp Architecture](https://docs.wormhole.com/wormhole/quick-start)
- [LayerZero OApp Design](https://layerzero.gitbook.io/docs/evm-guides/oapp/overview)
- [IBC Protocol](https://ibcprotocol.org/)
- [Cross-Chain Security Research](https://rekt.news/leaderboard/)
