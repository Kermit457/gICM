# Bridge Expert

Cross-chain bridge integration specialist for secure asset transfers between blockchains. Covers Wormhole, LayerZero, Allbridge, and native bridge protocols with security best practices.

---

## Metadata

- **ID**: bridge-expert
- **Name**: Bridge Expert
- **Category**: Cross-Chain
- **Tags**: bridge, cross-chain, wormhole, layerzero, interoperability
- **Version**: 2.0.0
- **Token Estimate**: 4200

---

## Overview

Cross-chain bridges enable asset and message transfers between different blockchains. Key bridge types:

- **Lock & Mint**: Lock assets on source chain, mint wrapped on destination
- **Burn & Mint**: Burn on source, mint on destination (native tokens)
- **Liquidity Pool**: Swap via liquidity pools on both chains
- **Message Passing**: Generic message/data passing across chains

Major bridge protocols:
- **Wormhole**: Solana-native, supports 20+ chains, guardian network
- **LayerZero**: Omnichain messaging with ultra light nodes
- **Allbridge**: Multi-chain liquidity pools with stablecoin focus
- **Portal/Wormhole Token Bridge**: Token bridging via Wormhole

---

## Wormhole Integration

### Core Concepts

```typescript
// wormhole-types.ts
import {
  ChainId,
  CHAIN_ID_SOLANA,
  CHAIN_ID_ETH,
  CHAIN_ID_BSC,
  CHAIN_ID_POLYGON,
  CHAIN_ID_AVAX,
  CHAIN_ID_ARBITRUM,
} from '@certusone/wormhole-sdk';

export interface WormholeConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  rpcUrls: Record<ChainId, string>;
  bridgeAddresses: Record<ChainId, string>;
  tokenBridgeAddresses: Record<ChainId, string>;
}

export const MAINNET_CONFIG: WormholeConfig = {
  network: 'mainnet',
  rpcUrls: {
    [CHAIN_ID_SOLANA]: 'https://api.mainnet-beta.solana.com',
    [CHAIN_ID_ETH]: 'https://eth.llamarpc.com',
    [CHAIN_ID_BSC]: 'https://bsc-dataseed.binance.org',
    [CHAIN_ID_POLYGON]: 'https://polygon-rpc.com',
    [CHAIN_ID_AVAX]: 'https://api.avax.network/ext/bc/C/rpc',
    [CHAIN_ID_ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
  },
  bridgeAddresses: {
    [CHAIN_ID_SOLANA]: 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',
    [CHAIN_ID_ETH]: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
    // ... other chains
  },
  tokenBridgeAddresses: {
    [CHAIN_ID_SOLANA]: 'wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb',
    [CHAIN_ID_ETH]: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
    // ... other chains
  },
};

// VAA (Verifiable Action Approval) structure
export interface VAA {
  version: number;
  guardianSetIndex: number;
  signatures: VAASignature[];
  timestamp: number;
  nonce: number;
  emitterChain: ChainId;
  emitterAddress: Uint8Array;
  sequence: bigint;
  consistencyLevel: number;
  payload: Uint8Array;
}

export interface VAASignature {
  guardianSetIndex: number;
  signature: Uint8Array;
}
```

### Token Transfer (Solana to Ethereum)

```typescript
// wormhole-transfer.ts
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  CHAIN_ID_SOLANA,
  CHAIN_ID_ETH,
  getEmitterAddressSolana,
  parseSequenceFromLogSolana,
  transferFromSolana,
  getSignedVAAWithRetry,
  redeemOnEth,
  tryNativeToUint8Array,
} from '@certusone/wormhole-sdk';
import { ethers } from 'ethers';

interface TransferParams {
  solanaConnection: Connection;
  solanaWallet: Keypair;
  ethWallet: ethers.Wallet;
  tokenMint: PublicKey;
  amount: bigint;
  recipientAddress: string; // Ethereum address
}

export class WormholeBridge {
  private solanaConnection: Connection;
  private config: WormholeConfig;

  constructor(solanaRpc: string, config: WormholeConfig) {
    this.solanaConnection = new Connection(solanaRpc, 'confirmed');
    this.config = config;
  }

  async transferSolanaToEth(params: TransferParams): Promise<{
    sourceTransaction: string;
    vaa: Uint8Array;
    destinationTransaction: string;
  }> {
    const {
      solanaConnection,
      solanaWallet,
      ethWallet,
      tokenMint,
      amount,
      recipientAddress,
    } = params;

    console.log('Step 1: Initiating transfer from Solana...');

    // Get associated token account
    const fromTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      solanaWallet.publicKey
    );

    // Create transfer instruction
    const transaction = await transferFromSolana(
      solanaConnection,
      this.config.bridgeAddresses[CHAIN_ID_SOLANA],
      this.config.tokenBridgeAddresses[CHAIN_ID_SOLANA],
      solanaWallet.publicKey,
      fromTokenAccount,
      tokenMint,
      amount,
      tryNativeToUint8Array(recipientAddress, CHAIN_ID_ETH),
      CHAIN_ID_ETH
    );

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(
      solanaConnection,
      transaction,
      [solanaWallet]
    );

    console.log('Solana transaction:', signature);

    // Step 2: Get the sequence number from the transaction
    console.log('Step 2: Extracting sequence number...');

    const info = await solanaConnection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!info) {
      throw new Error('Transaction not found');
    }

    const sequence = parseSequenceFromLogSolana(info);
    const emitterAddress = await getEmitterAddressSolana(
      this.config.tokenBridgeAddresses[CHAIN_ID_SOLANA]
    );

    console.log('Sequence:', sequence);
    console.log('Emitter:', emitterAddress);

    // Step 3: Fetch the signed VAA from the guardian network
    console.log('Step 3: Fetching signed VAA from guardians...');

    const { vaaBytes } = await getSignedVAAWithRetry(
      ['https://wormhole-v2-mainnet-api.certus.one'],
      CHAIN_ID_SOLANA,
      emitterAddress,
      sequence,
      {
        transport: 'http',
      },
      1000, // retry delay
      30    // max retries
    );

    console.log('VAA fetched successfully');

    // Step 4: Redeem on Ethereum
    console.log('Step 4: Redeeming on Ethereum...');

    const ethProvider = new ethers.JsonRpcProvider(
      this.config.rpcUrls[CHAIN_ID_ETH]
    );
    const ethSigner = ethWallet.connect(ethProvider);

    const redeemTx = await redeemOnEth(
      this.config.tokenBridgeAddresses[CHAIN_ID_ETH],
      ethSigner,
      vaaBytes
    );

    console.log('Ethereum redemption tx:', redeemTx.hash);
    await redeemTx.wait();

    return {
      sourceTransaction: signature,
      vaa: vaaBytes,
      destinationTransaction: redeemTx.hash,
    };
  }

  async getTransferStatus(
    emitterChain: ChainId,
    emitterAddress: string,
    sequence: string
  ): Promise<'pending' | 'confirmed' | 'completed'> {
    try {
      const { vaaBytes } = await getSignedVAAWithRetry(
        ['https://wormhole-v2-mainnet-api.certus.one'],
        emitterChain,
        emitterAddress,
        sequence,
        { transport: 'http' },
        1000,
        3 // Few retries for status check
      );

      // VAA exists, check if redeemed
      // ... check destination chain for redemption

      return 'confirmed';
    } catch {
      return 'pending';
    }
  }
}
```

### Ethereum to Solana Transfer

```typescript
// eth-to-solana-transfer.ts
import { ethers } from 'ethers';
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
} from '@solana/web3.js';
import {
  CHAIN_ID_SOLANA,
  CHAIN_ID_ETH,
  transferFromEth,
  getEmitterAddressEth,
  parseSequenceFromLogEth,
  getSignedVAAWithRetry,
  postVaaSolana,
  redeemOnSolana,
  tryNativeToUint8Array,
} from '@certusone/wormhole-sdk';

interface EthToSolanaParams {
  ethProvider: ethers.Provider;
  ethSigner: ethers.Signer;
  solanaConnection: Connection;
  solanaWallet: Keypair;
  tokenAddress: string; // ERC-20 address
  amount: bigint;
  recipientAddress: PublicKey;
}

export async function transferEthToSolana(
  params: EthToSolanaParams,
  config: WormholeConfig
): Promise<{
  ethTransaction: string;
  vaa: Uint8Array;
  solanaTransaction: string;
}> {
  const {
    ethProvider,
    ethSigner,
    solanaConnection,
    solanaWallet,
    tokenAddress,
    amount,
    recipientAddress,
  } = params;

  console.log('Step 1: Approving token spend...');

  // Approve token bridge to spend tokens
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    ethSigner
  );

  const approveTx = await tokenContract.approve(
    config.tokenBridgeAddresses[CHAIN_ID_ETH],
    amount
  );
  await approveTx.wait();

  console.log('Step 2: Initiating transfer from Ethereum...');

  // Transfer tokens to Wormhole
  const receipt = await transferFromEth(
    config.tokenBridgeAddresses[CHAIN_ID_ETH],
    ethSigner,
    tokenAddress,
    amount,
    CHAIN_ID_SOLANA,
    tryNativeToUint8Array(recipientAddress.toBase58(), CHAIN_ID_SOLANA)
  );

  console.log('Ethereum transaction:', receipt.transactionHash);

  // Extract sequence number
  const sequence = parseSequenceFromLogEth(
    receipt,
    config.bridgeAddresses[CHAIN_ID_ETH]
  );
  const emitterAddress = getEmitterAddressEth(
    config.tokenBridgeAddresses[CHAIN_ID_ETH]
  );

  console.log('Step 3: Fetching signed VAA...');

  const { vaaBytes } = await getSignedVAAWithRetry(
    ['https://wormhole-v2-mainnet-api.certus.one'],
    CHAIN_ID_ETH,
    emitterAddress,
    sequence,
    { transport: 'http' },
    1000,
    60 // Ethereum has longer finality
  );

  console.log('Step 4: Posting VAA to Solana...');

  // Post VAA to Solana
  await postVaaSolana(
    solanaConnection,
    async (tx: Transaction) => {
      tx.partialSign(solanaWallet);
      return tx;
    },
    config.bridgeAddresses[CHAIN_ID_SOLANA],
    solanaWallet.publicKey,
    Buffer.from(vaaBytes)
  );

  console.log('Step 5: Redeeming on Solana...');

  // Redeem tokens on Solana
  const redeemTx = await redeemOnSolana(
    solanaConnection,
    config.bridgeAddresses[CHAIN_ID_SOLANA],
    config.tokenBridgeAddresses[CHAIN_ID_SOLANA],
    solanaWallet.publicKey,
    vaaBytes
  );

  const signature = await solanaConnection.sendRawTransaction(
    redeemTx.serialize()
  );
  await solanaConnection.confirmTransaction(signature, 'confirmed');

  console.log('Solana redemption:', signature);

  return {
    ethTransaction: receipt.transactionHash,
    vaa: vaaBytes,
    solanaTransaction: signature,
  };
}
```

---

## LayerZero Integration

### Message Passing

```typescript
// layerzero-messaging.ts
import { ethers } from 'ethers';

// LayerZero chain IDs (different from Wormhole)
export const LZ_CHAIN_IDS = {
  ETHEREUM: 101,
  BSC: 102,
  AVALANCHE: 106,
  POLYGON: 109,
  ARBITRUM: 110,
  OPTIMISM: 111,
  FANTOM: 112,
  SOLANA: 168, // LayerZero Solana support
};

// LayerZero Endpoint ABI (simplified)
const LZ_ENDPOINT_ABI = [
  'function send(uint16 _dstChainId, bytes calldata _destination, bytes calldata _payload, address payable _refundAddress, address _zroPaymentAddress, bytes calldata _adapterParams) external payable',
  'function estimateFees(uint16 _dstChainId, address _userApplication, bytes calldata _payload, bool _payInZRO, bytes calldata _adapterParams) external view returns (uint nativeFee, uint zroFee)',
  'event Packet(uint64 nonce, uint16 localChainId, address srcAddress, uint16 dstChainId, bytes dstAddress, bytes payload)',
];

// OApp (Omnichain Application) ABI
const OAPP_ABI = [
  'function lzReceive(uint16 _srcChainId, bytes calldata _srcAddress, uint64 _nonce, bytes calldata _payload) external',
  'function setTrustedRemote(uint16 _srcChainId, bytes calldata _path) external',
  'function trustedRemoteLookup(uint16) external view returns (bytes memory)',
];

export class LayerZeroMessenger {
  private provider: ethers.Provider;
  private endpoint: ethers.Contract;

  constructor(
    provider: ethers.Provider,
    endpointAddress: string
  ) {
    this.provider = provider;
    this.endpoint = new ethers.Contract(
      endpointAddress,
      LZ_ENDPOINT_ABI,
      provider
    );
  }

  async estimateFee(
    dstChainId: number,
    oappAddress: string,
    payload: Uint8Array,
    adapterParams: Uint8Array = new Uint8Array()
  ): Promise<{ nativeFee: bigint; zroFee: bigint }> {
    const [nativeFee, zroFee] = await this.endpoint.estimateFees(
      dstChainId,
      oappAddress,
      payload,
      false, // Pay in native, not ZRO
      adapterParams
    );

    return { nativeFee, zroFee };
  }

  async sendMessage(
    signer: ethers.Signer,
    oappAddress: string,
    dstChainId: number,
    dstAddress: string,
    payload: Uint8Array,
    refundAddress: string,
    adapterParams?: Uint8Array
  ): Promise<ethers.TransactionResponse> {
    const oapp = new ethers.Contract(oappAddress, OAPP_ABI, signer);

    // Estimate fees
    const { nativeFee } = await this.estimateFee(
      dstChainId,
      oappAddress,
      payload,
      adapterParams
    );

    // Add 10% buffer for gas price fluctuations
    const feeWithBuffer = (nativeFee * 110n) / 100n;

    // Encode destination address
    const dstAddressBytes = ethers.zeroPadValue(dstAddress, 32);

    // Send message
    const tx = await this.endpoint.connect(signer).send(
      dstChainId,
      dstAddressBytes,
      payload,
      refundAddress,
      ethers.ZeroAddress, // No ZRO payment
      adapterParams || '0x',
      { value: feeWithBuffer }
    );

    return tx;
  }
}

// Cross-chain token transfer using LayerZero OFT (Omnichain Fungible Token)
export class OFTBridge {
  private oftContract: ethers.Contract;

  constructor(oftAddress: string, signer: ethers.Signer) {
    this.oftContract = new ethers.Contract(
      oftAddress,
      [
        'function sendFrom(address _from, uint16 _dstChainId, bytes calldata _toAddress, uint _amount, address payable _refundAddress, address _zroPaymentAddress, bytes calldata _adapterParams) external payable',
        'function estimateSendFee(uint16 _dstChainId, bytes calldata _toAddress, uint _amount, bool _useZro, bytes calldata _adapterParams) external view returns (uint nativeFee, uint zroFee)',
      ],
      signer
    );
  }

  async estimateSendFee(
    dstChainId: number,
    toAddress: string,
    amount: bigint
  ): Promise<bigint> {
    const toAddressBytes = ethers.zeroPadValue(toAddress, 32);

    const [nativeFee] = await this.oftContract.estimateSendFee(
      dstChainId,
      toAddressBytes,
      amount,
      false,
      '0x'
    );

    return nativeFee;
  }

  async send(
    dstChainId: number,
    toAddress: string,
    amount: bigint,
    refundAddress: string
  ): Promise<ethers.TransactionResponse> {
    const fee = await this.estimateSendFee(dstChainId, toAddress, amount);
    const feeWithBuffer = (fee * 115n) / 100n;

    const toAddressBytes = ethers.zeroPadValue(toAddress, 32);
    const senderAddress = await this.oftContract.runner?.getAddress();

    const tx = await this.oftContract.sendFrom(
      senderAddress,
      dstChainId,
      toAddressBytes,
      amount,
      refundAddress,
      ethers.ZeroAddress,
      '0x',
      { value: feeWithBuffer }
    );

    return tx;
  }
}
```

---

## Allbridge Integration

```typescript
// allbridge-transfer.ts
import { AllbridgeCoreSdk, ChainSymbol, TokenInfo } from '@allbridge/bridge-core-sdk';

export class AllbridgeBridge {
  private sdk: AllbridgeCoreSdk;

  constructor(rpcUrls: Record<ChainSymbol, string>) {
    this.sdk = new AllbridgeCoreSdk({
      solanaRpcUrl: rpcUrls[ChainSymbol.SOL],
      ethereumRpcUrl: rpcUrls[ChainSymbol.ETH],
      // ... other chains
    });
  }

  async getAvailableTokens(): Promise<Map<ChainSymbol, TokenInfo[]>> {
    const chainDetails = await this.sdk.chainDetailsMap();
    const tokens = new Map<ChainSymbol, TokenInfo[]>();

    for (const [chain, details] of Object.entries(chainDetails)) {
      tokens.set(chain as ChainSymbol, details.tokens);
    }

    return tokens;
  }

  async getTransferQuote(
    sourceChain: ChainSymbol,
    destChain: ChainSymbol,
    sourceToken: string,
    destToken: string,
    amount: string
  ): Promise<{
    estimatedAmount: string;
    fee: string;
    estimatedTime: number;
  }> {
    const sourceTokenInfo = await this.sdk.getTokenInfo(sourceChain, sourceToken);
    const destTokenInfo = await this.sdk.getTokenInfo(destChain, destToken);

    const quote = await this.sdk.getReceiveAmountAndGas({
      sourceChainToken: sourceTokenInfo,
      destinationChainToken: destTokenInfo,
      amount,
    });

    return {
      estimatedAmount: quote.amountToReceive,
      fee: quote.feePercent.toString(),
      estimatedTime: 300, // ~5 minutes typical
    };
  }

  async initiateTransfer(
    sourceChain: ChainSymbol,
    destChain: ChainSymbol,
    sourceToken: string,
    destToken: string,
    amount: string,
    senderAddress: string,
    recipientAddress: string,
    signer: any // Chain-specific signer
  ): Promise<string> {
    const sourceTokenInfo = await this.sdk.getTokenInfo(sourceChain, sourceToken);
    const destTokenInfo = await this.sdk.getTokenInfo(destChain, destToken);

    // For Solana source
    if (sourceChain === ChainSymbol.SOL) {
      const txId = await this.sdk.send({
        amount,
        sourceChainToken: sourceTokenInfo,
        destinationChainToken: destTokenInfo,
        fromAccountAddress: senderAddress,
        toAccountAddress: recipientAddress,
        signer,
      });

      return txId;
    }

    // For EVM source
    const tx = await this.sdk.send({
      amount,
      sourceChainToken: sourceTokenInfo,
      destinationChainToken: destTokenInfo,
      fromAccountAddress: senderAddress,
      toAccountAddress: recipientAddress,
      signer,
    });

    return tx;
  }
}
```

---

## Security Considerations

### Bridge Security Checklist

```typescript
// bridge-security.ts

export interface BridgeSecurityCheck {
  name: string;
  check: () => Promise<boolean>;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export const bridgeSecurityChecks: BridgeSecurityCheck[] = [
  {
    name: 'Verify Bridge Contract',
    check: async () => {
      // Verify contract is official bridge contract
      // Check against known addresses
      return true;
    },
    severity: 'critical',
    recommendation: 'Always verify bridge contract addresses against official sources',
  },
  {
    name: 'Check Guardian Status',
    check: async () => {
      // For Wormhole: verify guardian set is active
      // Check quorum is met
      return true;
    },
    severity: 'critical',
    recommendation: 'Ensure guardian network has sufficient quorum for VAA signing',
  },
  {
    name: 'Validate VAA Signatures',
    check: async () => {
      // Verify VAA has required number of guardian signatures
      // Check signatures are valid
      return true;
    },
    severity: 'critical',
    recommendation: 'Never accept VAAs with insufficient or invalid signatures',
  },
  {
    name: 'Check Token Authenticity',
    check: async () => {
      // Verify wrapped token is from legitimate bridge
      // Check token origin chain
      return true;
    },
    severity: 'high',
    recommendation: 'Verify wrapped tokens originate from trusted bridge contracts',
  },
  {
    name: 'Monitor Bridge Liquidity',
    check: async () => {
      // Check bridge has sufficient liquidity
      // Avoid bridges with low TVL
      return true;
    },
    severity: 'medium',
    recommendation: 'Use bridges with deep liquidity to ensure redemption',
  },
];

// VAA Validation
export function validateVAA(vaa: Uint8Array, expectedGuardians: number): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check version
  if (vaa[0] !== 1) {
    errors.push('Invalid VAA version');
  }

  // Check guardian set index
  const guardianSetIndex = (vaa[1] << 24) | (vaa[2] << 16) | (vaa[3] << 8) | vaa[4];

  // Check number of signatures
  const signatureCount = vaa[5];
  const requiredSignatures = Math.floor((expectedGuardians * 2) / 3) + 1;

  if (signatureCount < requiredSignatures) {
    errors.push(`Insufficient signatures: ${signatureCount} < ${requiredSignatures}`);
  }

  // Verify each signature (simplified)
  // In production, verify ECDSA signatures against guardian public keys

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Rate limiting for bridge operations
export class BridgeRateLimiter {
  private transferHistory: Map<string, number[]> = new Map();
  private limits: {
    maxTransfersPerHour: number;
    maxAmountPerHour: bigint;
    cooldownSeconds: number;
  };

  constructor(limits?: Partial<typeof BridgeRateLimiter.prototype.limits>) {
    this.limits = {
      maxTransfersPerHour: 10,
      maxAmountPerHour: BigInt('1000000000000'), // 1M in smallest units
      cooldownSeconds: 60,
      ...limits,
    };
  }

  canTransfer(userAddress: string, amount: bigint): {
    allowed: boolean;
    reason?: string;
    waitSeconds?: number;
  } {
    const now = Date.now();
    const hourAgo = now - 3600000;

    const userHistory = this.transferHistory.get(userAddress) || [];
    const recentTransfers = userHistory.filter(t => t > hourAgo);

    // Check transfer count limit
    if (recentTransfers.length >= this.limits.maxTransfersPerHour) {
      const oldestRecent = Math.min(...recentTransfers);
      const waitSeconds = Math.ceil((oldestRecent + 3600000 - now) / 1000);

      return {
        allowed: false,
        reason: 'Hourly transfer limit reached',
        waitSeconds,
      };
    }

    // Check cooldown
    if (recentTransfers.length > 0) {
      const lastTransfer = Math.max(...recentTransfers);
      const secondsSinceLastTransfer = (now - lastTransfer) / 1000;

      if (secondsSinceLastTransfer < this.limits.cooldownSeconds) {
        return {
          allowed: false,
          reason: 'Cooldown period active',
          waitSeconds: Math.ceil(this.limits.cooldownSeconds - secondsSinceLastTransfer),
        };
      }
    }

    return { allowed: true };
  }

  recordTransfer(userAddress: string): void {
    const history = this.transferHistory.get(userAddress) || [];
    history.push(Date.now());
    this.transferHistory.set(userAddress, history);
  }
}
```

### Emergency Procedures

```typescript
// bridge-emergency.ts

export interface EmergencyConfig {
  pauseThreshold: {
    failedTransfers: number;
    timeWindowMinutes: number;
  };
  alertContacts: string[];
  fallbackBridges: string[];
}

export class BridgeMonitor {
  private failedTransfers: { timestamp: number; txHash: string; error: string }[] = [];
  private config: EmergencyConfig;
  private isPaused = false;

  constructor(config: EmergencyConfig) {
    this.config = config;
  }

  recordFailure(txHash: string, error: string): void {
    this.failedTransfers.push({
      timestamp: Date.now(),
      txHash,
      error,
    });

    this.checkThreshold();
  }

  private checkThreshold(): void {
    const windowStart = Date.now() - this.config.pauseThreshold.timeWindowMinutes * 60000;
    const recentFailures = this.failedTransfers.filter(f => f.timestamp > windowStart);

    if (recentFailures.length >= this.config.pauseThreshold.failedTransfers) {
      this.triggerEmergencyPause(recentFailures);
    }
  }

  private async triggerEmergencyPause(failures: typeof this.failedTransfers): Promise<void> {
    this.isPaused = true;

    console.error('EMERGENCY: Bridge paused due to multiple failures');
    console.error('Recent failures:', failures);

    // Alert team
    for (const contact of this.config.alertContacts) {
      await this.sendAlert(contact, {
        type: 'BRIDGE_EMERGENCY_PAUSE',
        failures: failures.length,
        lastFailure: failures[failures.length - 1],
      });
    }
  }

  private async sendAlert(contact: string, data: any): Promise<void> {
    // Implement alerting (Slack, PagerDuty, email, etc.)
    console.log(`Alert sent to ${contact}:`, data);
  }

  canOperate(): boolean {
    return !this.isPaused;
  }

  resume(): void {
    this.isPaused = false;
    this.failedTransfers = [];
  }
}

// Stuck transfer recovery
export async function recoverStuckTransfer(
  bridge: string,
  txHash: string,
  chain: string
): Promise<{
  status: 'recovered' | 'pending' | 'failed';
  action?: string;
}> {
  // Check VAA status for Wormhole
  if (bridge === 'wormhole') {
    // Check if VAA was signed
    // If signed but not redeemed, attempt redemption
    // If not signed, wait for guardians

    return {
      status: 'pending',
      action: 'Waiting for guardian signatures',
    };
  }

  // Check LayerZero message status
  if (bridge === 'layerzero') {
    // Check endpoint for message status
    // Retry delivery if needed

    return {
      status: 'pending',
      action: 'Message in transit',
    };
  }

  return {
    status: 'failed',
    action: 'Contact bridge support with transaction hash',
  };
}
```

---

## Testing Bridge Integration

```typescript
// bridge.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('Bridge Integration Tests', () => {
  describe('Wormhole', () => {
    it('should estimate transfer fees correctly', async () => {
      const bridge = new WormholeBridge(/* config */);

      const fee = await bridge.estimateFee(
        CHAIN_ID_SOLANA,
        CHAIN_ID_ETH,
        BigInt('1000000000') // 1 SOL
      );

      expect(fee).toBeGreaterThan(0n);
    });

    it('should validate VAA signatures', async () => {
      const mockVAA = createMockVAA({
        signatures: 13, // 2/3 + 1 of 19 guardians
        emitterChain: CHAIN_ID_SOLANA,
      });

      const result = validateVAA(mockVAA, 19);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject VAA with insufficient signatures', async () => {
      const mockVAA = createMockVAA({
        signatures: 5, // Less than 2/3 + 1
        emitterChain: CHAIN_ID_SOLANA,
      });

      const result = validateVAA(mockVAA, 19);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Insufficient signatures');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce transfer limits', async () => {
      const limiter = new BridgeRateLimiter({
        maxTransfersPerHour: 3,
        cooldownSeconds: 0,
      });

      const user = 'user123';

      // First 3 transfers allowed
      for (let i = 0; i < 3; i++) {
        const result = limiter.canTransfer(user, BigInt(1000));
        expect(result.allowed).toBe(true);
        limiter.recordTransfer(user);
      }

      // 4th transfer blocked
      const result = limiter.canTransfer(user, BigInt(1000));
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Hourly transfer limit reached');
    });

    it('should enforce cooldown period', async () => {
      const limiter = new BridgeRateLimiter({
        maxTransfersPerHour: 100,
        cooldownSeconds: 60,
      });

      const user = 'user456';

      limiter.recordTransfer(user);

      const result = limiter.canTransfer(user, BigInt(1000));
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cooldown period active');
      expect(result.waitSeconds).toBeGreaterThan(0);
    });
  });

  describe('Emergency Procedures', () => {
    it('should pause after threshold failures', async () => {
      const monitor = new BridgeMonitor({
        pauseThreshold: {
          failedTransfers: 3,
          timeWindowMinutes: 5,
        },
        alertContacts: ['admin@example.com'],
        fallbackBridges: [],
      });

      // Record failures
      monitor.recordFailure('tx1', 'Network error');
      monitor.recordFailure('tx2', 'Timeout');

      expect(monitor.canOperate()).toBe(true);

      monitor.recordFailure('tx3', 'Unknown error');

      expect(monitor.canOperate()).toBe(false);
    });
  });
});
```

---

## Bridge Selection Guide

### Choosing the Right Bridge

| Factor | Wormhole | LayerZero | Allbridge |
|--------|----------|-----------|-----------|
| Security Model | Guardian Network (19 validators) | Oracle + Relayer | Multi-sig + Pool |
| Chains Supported | 20+ | 30+ | 15+ |
| Finality Time | ~15 min | ~5 min | ~5 min |
| Best For | Solana transfers | EVM chains | Stablecoins |
| Native Token Support | Yes | Via OFT | Via Pools |
| Message Passing | Yes | Yes | Limited |

### Decision Matrix

```typescript
export function selectBridge(params: {
  sourceChain: string;
  destChain: string;
  tokenType: 'native' | 'wrapped' | 'stablecoin';
  amount: bigint;
  priority: 'speed' | 'security' | 'cost';
}): 'wormhole' | 'layerzero' | 'allbridge' {
  const { sourceChain, destChain, tokenType, amount, priority } = params;

  // Solana transfers: prefer Wormhole
  if (sourceChain === 'solana' || destChain === 'solana') {
    return 'wormhole';
  }

  // Stablecoin transfers: prefer Allbridge for liquidity
  if (tokenType === 'stablecoin' && priority !== 'security') {
    return 'allbridge';
  }

  // Large amounts: prefer Wormhole for security
  if (amount > BigInt('1000000000000000000000')) { // > 1000 tokens
    return 'wormhole';
  }

  // Speed priority: LayerZero
  if (priority === 'speed') {
    return 'layerzero';
  }

  // Default to Wormhole for security
  return 'wormhole';
}
```

---

## Related Skills

- **cross-chain-expert** - General cross-chain architecture
- **solana-deployer** - Deploying bridge-related programs
- **smart-contract-auditor** - Auditing bridge contracts
- **wallet-integration** - Multi-chain wallet support

---

## Further Reading

- [Wormhole Documentation](https://docs.wormhole.com/)
- [LayerZero Documentation](https://layerzero.gitbook.io/)
- [Allbridge Core SDK](https://docs.allbridge.io/)
- [Cross-Chain Security Best Practices](https://blog.chainalysis.com/reports/cross-chain-bridge-hacks/)
- [Wormhole Guardian Network](https://wormhole.com/network/)
