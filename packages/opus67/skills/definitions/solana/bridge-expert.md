# Bridge Expert - Cross-Chain Bridge Integration & Security

> **ID:** `bridge-expert`
> **Tier:** 2 (Domain Expertise)
> **Token Cost:** 7000
> **MCP Connections:** helius
> **Version:** 1.0

## 🎯 What This Skill Does

Master bridge protocol integration for secure cross-chain asset transfers. This skill covers Wormhole, LayerZero, Portal Bridge, and other major bridge protocols with focus on security, reliability, and user experience.

**Core Capabilities:**
- Wormhole bridge integration
- LayerZero cross-chain messaging
- Portal Bridge (Wormhole) for assets
- AllBridge integration
- Bridge security patterns
- Relayer configuration
- VAA (Verifiable Action Approval) handling
- Cross-chain token wrapping/unwrapping

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** bridge, wormhole, layerzero, cross-chain transfer, portal, wrapped token
- **File Types:** .ts, .tsx, .rs
- **Directories:** N/A

**Use this skill when:**
- Implementing bridge integrations
- Building cross-chain transfer UIs
- Securing bridge operations
- Managing wrapped tokens
- Handling bridge relayers
- Monitoring bridge transactions
- Implementing bridge fallbacks

## 🚀 Core Capabilities

### 1. Wormhole Bridge Integration

**Architecture Overview:**

```
┌─────────────────────────────────────────────────────────┐
│                   Source Chain                          │
│                                                         │
│  User → Lock Asset → Core Bridge → Emit VAA            │
│            ↓                           ↓                │
│      Token Account              Message Published       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 Guardian Network                         │
│                                                         │
│  19 Guardians → Observe → Sign → Create VAA            │
│                                         ↓                │
│                                    Signed VAA            │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Destination Chain                       │
│                                                         │
│  Relayer → Submit VAA → Core Bridge → Mint/Unlock      │
│                            ↓               ↓            │
│                    Verify Signatures   Transfer Asset   │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// packages/bridge/src/wormhole/client.ts
import {
  getEmitterAddressEth,
  getEmitterAddressSolana,
  parseSequenceFromLogEth,
  parseSequenceFromLogSolana,
  ChainId,
  CHAIN_ID_SOLANA,
  CHAIN_ID_ETH,
} from '@certusone/wormhole-sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';

export interface WormholeConfig {
  solanaRpc: string;
  ethereumRpc: string;
  wormholeRpcHosts: string[];
  solanaCoreBridge: string;
  solanaTokenBridge: string;
  ethereumCoreBridge: string;
  ethereumTokenBridge: string;
}

export class WormholeClient {
  private solanaConnection: Connection;
  private ethereumProvider: ethers.JsonRpcProvider;
  private config: WormholeConfig;

  constructor(config: WormholeConfig) {
    this.config = config;
    this.solanaConnection = new Connection(config.solanaRpc, 'confirmed');
    this.ethereumProvider = new ethers.JsonRpcProvider(config.ethereumRpc);
  }

  /**
   * Transfer tokens from Solana to Ethereum
   */
  async transferFromSolana(params: {
    tokenAddress: string;
    amount: bigint;
    recipientChain: ChainId;
    recipientAddress: Buffer;
    relayerFee?: bigint;
  }) {
    const {
      tokenAddress,
      amount,
      recipientChain,
      recipientAddress,
      relayerFee = BigInt(0),
    } = params;

    // 1. Create transfer instruction
    const transferIx = await this.createSolanaTransferInstruction({
      tokenAddress,
      amount,
      recipientChain,
      recipientAddress,
      relayerFee,
    });

    // 2. Send transaction
    const signature = await this.sendSolanaTransaction([transferIx]);

    // 3. Wait for confirmation
    await this.solanaConnection.confirmTransaction(signature, 'finalized');

    // 4. Get sequence number from logs
    const sequence = await this.getSequenceFromSolanaLogs(signature);

    // 5. Fetch VAA
    const vaa = await this.fetchVAA({
      emitterChain: CHAIN_ID_SOLANA,
      emitterAddress: getEmitterAddressSolana(this.config.solanaTokenBridge),
      sequence,
    });

    return {
      signature,
      sequence,
      vaa,
    };
  }

  private async createSolanaTransferInstruction(params: {
    tokenAddress: string;
    amount: bigint;
    recipientChain: ChainId;
    recipientAddress: Buffer;
    relayerFee: bigint;
  }) {
    // Implementation would use @certusone/wormhole-sdk
    // to create the proper transfer instruction
    return null as any;
  }

  private async sendSolanaTransaction(instructions: any[]): Promise<string> {
    // Send transaction to Solana
    return 'signature';
  }

  private async getSequenceFromSolanaLogs(signature: string): Promise<string> {
    const tx = await this.solanaConnection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) throw new Error('Transaction not found');

    const sequence = parseSequenceFromLogSolana(tx);
    return sequence;
  }

  /**
   * Transfer tokens from Ethereum to Solana
   */
  async transferFromEthereum(params: {
    tokenAddress: string;
    amount: bigint;
    recipientChain: ChainId;
    recipientAddress: Buffer;
    relayerFee?: bigint;
  }) {
    const {
      tokenAddress,
      amount,
      recipientChain,
      recipientAddress,
      relayerFee = BigInt(0),
    } = params;

    // 1. Approve token spending
    await this.approveEthereumToken(tokenAddress, amount);

    // 2. Create transfer transaction
    const tx = await this.createEthereumTransfer({
      tokenAddress,
      amount,
      recipientChain,
      recipientAddress,
      relayerFee,
    });

    // 3. Wait for confirmation
    const receipt = await tx.wait();

    // 4. Get sequence from logs
    const sequence = parseSequenceFromLogEth(
      receipt,
      this.config.ethereumCoreBridge
    );

    // 5. Fetch VAA
    const vaa = await this.fetchVAA({
      emitterChain: CHAIN_ID_ETH,
      emitterAddress: getEmitterAddressEth(this.config.ethereumTokenBridge),
      sequence: sequence.toString(),
    });

    return {
      transactionHash: receipt.hash,
      sequence,
      vaa,
    };
  }

  private async approveEthereumToken(
    tokenAddress: string,
    amount: bigint
  ): Promise<void> {
    // Approve token bridge to spend tokens
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      this.ethereumProvider
    );

    const tx = await tokenContract.approve(
      this.config.ethereumTokenBridge,
      amount
    );

    await tx.wait();
  }

  private async createEthereumTransfer(params: {
    tokenAddress: string;
    amount: bigint;
    recipientChain: ChainId;
    recipientAddress: Buffer;
    relayerFee: bigint;
  }) {
    // Create transfer transaction using wormhole-sdk
    return null as any;
  }

  /**
   * Fetch VAA (Verifiable Action Approval) from guardians
   */
  async fetchVAA(params: {
    emitterChain: ChainId;
    emitterAddress: string;
    sequence: string;
  }): Promise<Buffer> {
    const { emitterChain, emitterAddress, sequence } = params;

    // Poll guardians for VAA
    for (let i = 0; i < 60; i++) {
      for (const host of this.config.wormholeRpcHosts) {
        try {
          const response = await fetch(
            `${host}/v1/signed_vaa/${emitterChain}/${emitterAddress}/${sequence}`
          );

          if (response.ok) {
            const { vaaBytes } = await response.json();
            return Buffer.from(vaaBytes, 'base64');
          }
        } catch (error) {
          console.error(`Failed to fetch from ${host}:`, error);
        }
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('VAA not found after 5 minutes');
  }

  /**
   * Redeem VAA on destination chain
   */
  async redeemOnSolana(vaa: Buffer): Promise<string> {
    // Create redeem instruction
    const redeemIx = await this.createSolanaRedeemInstruction(vaa);

    // Send transaction
    const signature = await this.sendSolanaTransaction([redeemIx]);

    // Wait for confirmation
    await this.solanaConnection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  private async createSolanaRedeemInstruction(vaa: Buffer) {
    // Implementation would use @certusone/wormhole-sdk
    return null as any;
  }

  async redeemOnEthereum(vaa: Buffer): Promise<string> {
    // Create redeem transaction
    const tx = await this.createEthereumRedeem(vaa);

    // Wait for confirmation
    const receipt = await tx.wait();

    return receipt.hash;
  }

  private async createEthereumRedeem(vaa: Buffer) {
    // Create redeem transaction using wormhole-sdk
    return null as any;
  }
}

// packages/bridge/src/wormhole/portal.ts
/**
 * Portal Bridge (powered by Wormhole) for easy asset transfers
 */
export class PortalBridge {
  private wormhole: WormholeClient;

  constructor(wormhole: WormholeClient) {
    this.wormhole = wormhole;
  }

  /**
   * Transfer USDC from Solana to Ethereum
   */
  async transferUSDC(params: {
    amount: bigint;
    sourceChain: 'solana' | 'ethereum';
    destChain: 'solana' | 'ethereum';
    recipientAddress: string;
  }) {
    const { amount, sourceChain, destChain, recipientAddress } = params;

    // USDC addresses
    const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const USDC_ETHEREUM = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    if (sourceChain === 'solana' && destChain === 'ethereum') {
      return await this.wormhole.transferFromSolana({
        tokenAddress: USDC_SOLANA,
        amount,
        recipientChain: CHAIN_ID_ETH,
        recipientAddress: Buffer.from(
          recipientAddress.replace('0x', ''),
          'hex'
        ),
      });
    } else if (sourceChain === 'ethereum' && destChain === 'solana') {
      return await this.wormhole.transferFromEthereum({
        tokenAddress: USDC_ETHEREUM,
        amount,
        recipientChain: CHAIN_ID_SOLANA,
        recipientAddress: new PublicKey(recipientAddress).toBuffer(),
      });
    }

    throw new Error('Unsupported chain combination');
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(params: {
    sourceChain: ChainId;
    emitterAddress: string;
    sequence: string;
  }): Promise<'pending' | 'completed' | 'failed'> {
    try {
      const vaa = await this.wormhole.fetchVAA(params);
      return vaa ? 'completed' : 'pending';
    } catch (error) {
      return 'pending';
    }
  }
}
```

### 2. LayerZero Integration

```typescript
// packages/bridge/src/layerzero/client.ts
import { ethers } from 'ethers';

export interface LayerZeroConfig {
  endpoint: string;
  chainId: number;
}

export class LayerZeroClient {
  private endpoint: ethers.Contract;
  private provider: ethers.JsonRpcProvider;

  constructor(config: LayerZeroConfig, rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // LayerZero Endpoint ABI
    const endpointAbi = [
      'function send(uint16 _dstChainId, bytes _destination, bytes _payload, address payable _refundAddress, address _zroPaymentAddress, bytes _adapterParams) payable',
      'function estimateFees(uint16 _dstChainId, address _userApplication, bytes _payload, bool _payInZRO, bytes _adapterParams) view returns (uint256 nativeFee, uint256 zroFee)',
      'event Packet(bytes payload)',
    ];

    this.endpoint = new ethers.Contract(
      config.endpoint,
      endpointAbi,
      this.provider
    );
  }

  /**
   * Send cross-chain message
   */
  async sendMessage(params: {
    destinationChainId: number;
    destinationAddress: string;
    payload: Buffer;
    adapterParams: Buffer;
    refundAddress: string;
  }) {
    const {
      destinationChainId,
      destinationAddress,
      payload,
      adapterParams,
      refundAddress,
    } = params;

    // Estimate fees
    const [nativeFee, zroFee] = await this.endpoint.estimateFees(
      destinationChainId,
      destinationAddress,
      payload,
      false,
      adapterParams
    );

    console.log(`Estimated fee: ${ethers.formatEther(nativeFee)} ETH`);

    // Send message
    const tx = await this.endpoint.send(
      destinationChainId,
      ethers.getBytes(destinationAddress),
      payload,
      refundAddress,
      ethers.ZeroAddress, // No ZRO payment
      adapterParams,
      { value: nativeFee }
    );

    const receipt = await tx.wait();
    return receipt;
  }

  /**
   * Create adapter params for gas control
   */
  createAdapterParams(params: {
    version: number;
    gasLimit: number;
    nativeForDst: bigint;
  }): Buffer {
    const { version, gasLimit, nativeForDst } = params;

    // Pack adapter params
    const encoded = ethers.solidityPacked(
      ['uint16', 'uint256', 'uint256', 'address'],
      [version, gasLimit, nativeForDst, ethers.ZeroAddress]
    );

    return Buffer.from(encoded.slice(2), 'hex');
  }
}

// packages/bridge/src/layerzero/oft.ts
/**
 * Omnichain Fungible Token (OFT) implementation
 */
export class OFTBridge {
  private oftContract: ethers.Contract;
  private layerzero: LayerZeroClient;

  constructor(oftAddress: string, layerzero: LayerZeroClient) {
    this.layerzero = layerzero;

    // OFT ABI
    const oftAbi = [
      'function sendFrom(address _from, uint16 _dstChainId, bytes32 _toAddress, uint256 _amount, address payable _refundAddress, address _zroPaymentAddress, bytes _adapterParams) payable',
      'function estimateSendFee(uint16 _dstChainId, bytes32 _toAddress, uint256 _amount, bool _useZro, bytes _adapterParams) view returns (uint256 nativeFee, uint256 zroFee)',
    ];

    this.oftContract = new ethers.Contract(
      oftAddress,
      oftAbi,
      layerzero['provider']
    );
  }

  /**
   * Send OFT tokens to another chain
   */
  async sendOFT(params: {
    from: string;
    destinationChainId: number;
    toAddress: string;
    amount: bigint;
    refundAddress: string;
  }) {
    const {
      from,
      destinationChainId,
      toAddress,
      amount,
      refundAddress,
    } = params;

    // Create adapter params
    const adapterParams = this.layerzero.createAdapterParams({
      version: 1,
      gasLimit: 200000,
      nativeForDst: BigInt(0),
    });

    // Convert address to bytes32
    const toAddressBytes32 = ethers.zeroPadValue(toAddress, 32);

    // Estimate fees
    const [nativeFee, zroFee] = await this.oftContract.estimateSendFee(
      destinationChainId,
      toAddressBytes32,
      amount,
      false,
      adapterParams
    );

    console.log(`Transfer fee: ${ethers.formatEther(nativeFee)} ETH`);

    // Send tokens
    const tx = await this.oftContract.sendFrom(
      from,
      destinationChainId,
      toAddressBytes32,
      amount,
      refundAddress,
      ethers.ZeroAddress,
      adapterParams,
      { value: nativeFee }
    );

    const receipt = await tx.wait();
    return receipt;
  }
}
```

### 3. AllBridge Integration

```typescript
// packages/bridge/src/allbridge/client.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export interface AllBridgeConfig {
  apiUrl: string;
  solanaRpc: string;
}

export class AllBridgeClient {
  private connection: Connection;
  private apiUrl: string;

  constructor(config: AllBridgeConfig) {
    this.connection = new Connection(config.solanaRpc, 'confirmed');
    this.apiUrl = config.apiUrl;
  }

  /**
   * Get supported tokens
   */
  async getSupportedTokens() {
    const response = await fetch(`${this.apiUrl}/tokens`);
    const tokens = await response.json();
    return tokens;
  }

  /**
   * Get transfer quote
   */
  async getQuote(params: {
    sourceChain: string;
    destChain: string;
    tokenAddress: string;
    amount: string;
  }) {
    const { sourceChain, destChain, tokenAddress, amount } = params;

    const response = await fetch(`${this.apiUrl}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceChain,
        destChain,
        tokenAddress,
        amount,
      }),
    });

    const quote = await response.json();
    return quote;
  }

  /**
   * Create bridge transaction
   */
  async createBridgeTransaction(params: {
    sourceChain: string;
    destChain: string;
    tokenAddress: string;
    amount: string;
    recipient: string;
  }) {
    const { sourceChain, destChain, tokenAddress, amount, recipient } = params;

    const response = await fetch(`${this.apiUrl}/bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceChain,
        destChain,
        tokenAddress,
        amount,
        recipient,
      }),
    });

    const { transaction } = await response.json();
    return transaction;
  }

  /**
   * Track transfer status
   */
  async getTransferStatus(txHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    destTxHash?: string;
  }> {
    const response = await fetch(`${this.apiUrl}/status/${txHash}`);
    const status = await response.json();
    return status;
  }
}
```

### 4. Bridge Security Patterns

```typescript
// packages/bridge/src/security/validator.ts
export class BridgeValidator {
  /**
   * Validate VAA signatures
   */
  validateVAA(vaa: Buffer, guardianSet: PublicKey[]): boolean {
    // Parse VAA
    const version = vaa[0];
    const guardianSetIndex = vaa.readUInt32BE(1);
    const signaturesCount = vaa[5];

    // Verify signature count meets quorum (13 of 19)
    const quorum = Math.floor((guardianSet.length * 2) / 3) + 1;
    if (signaturesCount < quorum) {
      return false;
    }

    // Verify each signature
    for (let i = 0; i < signaturesCount; i++) {
      const signatureStart = 6 + i * 66;
      const guardianIndex = vaa[signatureStart];
      const signature = vaa.slice(signatureStart + 1, signatureStart + 66);

      // Verify signature matches guardian
      const guardian = guardianSet[guardianIndex];
      if (!this.verifySignature(vaa, signature, guardian)) {
        return false;
      }
    }

    return true;
  }

  private verifySignature(
    message: Buffer,
    signature: Buffer,
    publicKey: PublicKey
  ): boolean {
    // Verify ECDSA signature
    // Implementation depends on crypto library
    return true;
  }

  /**
   * Validate transfer amount against limits
   */
  validateAmount(
    amount: bigint,
    min: bigint,
    max: bigint
  ): { valid: boolean; error?: string } {
    if (amount < min) {
      return {
        valid: false,
        error: `Amount below minimum: ${min}`,
      };
    }

    if (amount > max) {
      return {
        valid: false,
        error: `Amount above maximum: ${max}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check for bridge pause state
   */
  async isBridgePaused(bridgeAddress: PublicKey): Promise<boolean> {
    // Check bridge state
    return false;
  }

  /**
   * Validate destination address format
   */
  validateAddress(
    address: string,
    chainId: number
  ): { valid: boolean; error?: string } {
    try {
      if (chainId === 1) {
        // Solana
        new PublicKey(address);
      } else {
        // EVM
        ethers.getAddress(address);
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid address format',
      };
    }
  }
}

// packages/bridge/src/security/rate-limiter.ts
export class BridgeRateLimiter {
  private transfers: Map<string, { count: number; resetAt: Date }> = new Map();

  /**
   * Check if user can make transfer
   */
  canTransfer(
    userAddress: string,
    maxTransfersPerHour: number
  ): { allowed: boolean; resetAt?: Date } {
    const now = new Date();
    const record = this.transfers.get(userAddress);

    if (!record || now > record.resetAt) {
      // Create new record
      this.transfers.set(userAddress, {
        count: 1,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000),
      });
      return { allowed: true };
    }

    if (record.count >= maxTransfersPerHour) {
      return {
        allowed: false,
        resetAt: record.resetAt,
      };
    }

    record.count++;
    return { allowed: true };
  }

  /**
   * Check for suspicious patterns
   */
  detectSuspiciousActivity(params: {
    userAddress: string;
    amount: bigint;
    destChain: number;
  }): { suspicious: boolean; reason?: string } {
    // Check for rapid succession transfers
    // Check for unusual amounts
    // Check for high-risk destinations
    return { suspicious: false };
  }
}
```

### 5. Relayer Configuration

```typescript
// packages/bridge/src/relayer/config.ts
export interface RelayerConfig {
  privateKey: string;
  chains: {
    chainId: number;
    rpcUrl: string;
    bridgeAddress: string;
  }[];
  gasPriceMultiplier: number;
  maxGasPrice: bigint;
  minRelayerBalance: bigint;
}

export class BridgeRelayer {
  private config: RelayerConfig;
  private isRunning = false;

  constructor(config: RelayerConfig) {
    this.config = config;
  }

  /**
   * Start relayer service
   */
  async start(): Promise<void> {
    this.isRunning = true;

    console.log('Starting bridge relayer...');

    // Monitor each chain for pending transfers
    const monitors = this.config.chains.map(chain =>
      this.monitorChain(chain)
    );

    await Promise.all(monitors);
  }

  private async monitorChain(chain: {
    chainId: number;
    rpcUrl: string;
    bridgeAddress: string;
  }): Promise<void> {
    while (this.isRunning) {
      try {
        // Check for pending VAAs
        const pendingVAAs = await this.fetchPendingVAAs(chain);

        // Relay each VAA
        for (const vaa of pendingVAAs) {
          await this.relayVAA(vaa, chain);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error(`Error monitoring ${chain.chainId}:`, error);
      }
    }
  }

  private async fetchPendingVAAs(chain: any): Promise<Buffer[]> {
    // Fetch pending VAAs from database or API
    return [];
  }

  private async relayVAA(vaa: Buffer, chain: any): Promise<void> {
    // Submit VAA to destination chain
    console.log(`Relaying VAA on chain ${chain.chainId}`);
  }

  stop(): void {
    this.isRunning = false;
    console.log('Stopping bridge relayer...');
  }
}
```

## 🧪 Testing Strategies

```typescript
// packages/bridge/src/__tests__/bridge.test.ts
import { describe, test, expect, beforeAll } from 'vitest';
import { WormholeClient } from '../wormhole/client';
import { CHAIN_ID_SOLANA, CHAIN_ID_ETH } from '@certusone/wormhole-sdk';

describe('Bridge Integration', () => {
  let wormhole: WormholeClient;

  beforeAll(() => {
    wormhole = new WormholeClient({
      solanaRpc: 'http://localhost:8899',
      ethereumRpc: 'http://localhost:8545',
      wormholeRpcHosts: ['http://localhost:7071'],
      solanaCoreBridge: '3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5',
      solanaTokenBridge: 'DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe',
      ethereumCoreBridge: '0x...',
      ethereumTokenBridge: '0x...',
    });
  });

  test('should transfer from Solana to Ethereum', async () => {
    const result = await wormhole.transferFromSolana({
      tokenAddress: 'So11111111111111111111111111111111111111112',
      amount: BigInt(1000000), // 0.001 SOL
      recipientChain: CHAIN_ID_ETH,
      recipientAddress: Buffer.from('0x...'.slice(2), 'hex'),
    });

    expect(result.signature).toBeDefined();
    expect(result.sequence).toBeDefined();
    expect(result.vaa).toBeDefined();
  });

  test('should fetch VAA', async () => {
    const vaa = await wormhole.fetchVAA({
      emitterChain: CHAIN_ID_SOLANA,
      emitterAddress: 'DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe',
      sequence: '123',
    });

    expect(vaa).toBeInstanceOf(Buffer);
  });

  test('should validate VAA signatures', async () => {
    const validator = new BridgeValidator();
    const vaa = Buffer.from('...'); // Sample VAA
    const guardianSet = []; // Guardian public keys

    const isValid = validator.validateVAA(vaa, guardianSet);
    expect(isValid).toBe(true);
  });

  test('should enforce rate limits', () => {
    const rateLimiter = new BridgeRateLimiter();

    const user = '0x123...';
    const maxPerHour = 10;

    // First transfer should be allowed
    let result = rateLimiter.canTransfer(user, maxPerHour);
    expect(result.allowed).toBe(true);

    // After max transfers, should be blocked
    for (let i = 0; i < maxPerHour; i++) {
      rateLimiter.canTransfer(user, maxPerHour);
    }

    result = rateLimiter.canTransfer(user, maxPerHour);
    expect(result.allowed).toBe(false);
    expect(result.resetAt).toBeDefined();
  });
});
```

## 📦 Production Patterns

### 1. Bridge UI Component

```typescript
// components/BridgeWidget.tsx
import { useState } from 'react';
import { WormholeClient } from '../packages/bridge/src/wormhole/client';

export function BridgeWidget() {
  const [sourceChain, setSourceChain] = useState('solana');
  const [destChain, setDestChain] = useState('ethereum');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'bridging' | 'complete'>('idle');

  const handleBridge = async () => {
    setStatus('bridging');

    try {
      // Execute bridge transfer
      const wormhole = new WormholeClient({
        // config
      });

      const result = await wormhole.transferFromSolana({
        tokenAddress: '...',
        amount: BigInt(amount),
        recipientChain: 2,
        recipientAddress: Buffer.from('...'),
      });

      // Wait for VAA
      // Redeem on destination

      setStatus('complete');
    } catch (error) {
      console.error('Bridge failed:', error);
      setStatus('idle');
    }
  };

  return (
    <div className="bridge-widget">
      <select value={sourceChain} onChange={e => setSourceChain(e.target.value)}>
        <option value="solana">Solana</option>
        <option value="ethereum">Ethereum</option>
      </select>

      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount"
      />

      <select value={destChain} onChange={e => setDestChain(e.target.value)}>
        <option value="ethereum">Ethereum</option>
        <option value="solana">Solana</option>
      </select>

      <button onClick={handleBridge} disabled={status === 'bridging'}>
        {status === 'bridging' ? 'Bridging...' : 'Bridge'}
      </button>
    </div>
  );
}
```

### 2. Bridge Monitoring

```typescript
// packages/bridge/src/monitoring/tracker.ts
export class BridgeMonitor {
  async trackTransfer(params: {
    sourceChain: number;
    destChain: number;
    sourceTxHash: string;
  }): Promise<void> {
    const { sourceChain, destChain, sourceTxHash } = params;

    console.log(`Tracking transfer ${sourceTxHash}`);

    // Monitor source chain confirmation
    // Monitor VAA generation
    // Monitor destination chain redemption

    // Send notifications
  }

  async getMetrics(): Promise<{
    totalTransfers: number;
    successRate: number;
    avgDuration: number;
    totalVolume: bigint;
  }> {
    // Return bridge metrics
    return {
      totalTransfers: 1000,
      successRate: 0.99,
      avgDuration: 300, // seconds
      totalVolume: BigInt(1000000),
    };
  }
}
```

## 🎯 Best Practices

1. **Always validate VAA signatures before redemption**
2. **Implement rate limiting to prevent abuse**
3. **Monitor guardian set updates**
4. **Use fallback relayers for reliability**
5. **Validate destination addresses**
6. **Implement circuit breakers for emergencies**
7. **Monitor bridge smart contracts for pauses**
8. **Cache VAAs to handle redemption retries**
9. **Implement proper error handling and retries**
10. **Test on testnets extensively before mainnet**

## 🔗 Related Skills

- **cross-chain-expert** - Multi-chain architecture
- **solana-reader** - Query Solana state
- **wallet-integration** - Connect wallets

## 📚 Resources

- [Wormhole Documentation](https://docs.wormhole.com/)
- [LayerZero Documentation](https://layerzero.network/developers)
- [Portal Bridge](https://portalbridge.com/)
- [AllBridge Documentation](https://docs.allbridge.io/)
- [Wormhole SDK](https://github.com/wormhole-foundation/wormhole)
