# LP Automation Expert

> **ID:** `lp-automation`
> **Tier:** 3
> **Token Cost:** 6000
> **MCP Connections:** jupiter, raydium

## What This Skill Does

Complete liquidity provision automation including Raydium/Orca pool creation, concentrated liquidity (CLMM) management, auto-rebalancing strategies, impermanent loss calculation, and AMM integration patterns. Covers Meteora DLMM, Raydium CPMM/CLMM, and Orca Whirlpools.

## When to Use

This skill is automatically loaded when:

- **Keywords:** lp, liquidity pool, raydium, orca, amm, meteora, dlmm, clmm
- **File Types:** .ts, .rs
- **Directories:** integrations/, defi/, amm/

---

## Core Capabilities

### 1. Pool Creation

Create liquidity pools on various Solana AMMs.

**Raydium CPMM Pool:**

```typescript
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';

interface CreatePoolParams {
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseAmount: number;
  quoteAmount: number;
  startTime?: number;
}

const RAYDIUM_PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK');

async function createRaydiumPool(
  connection: Connection,
  payer: Keypair,
  params: CreatePoolParams
): Promise<string> {
  const { baseMint, quoteMint, baseAmount, quoteAmount } = params;

  const [ammId] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('amm'),
      baseMint.toBuffer(),
      quoteMint.toBuffer(),
    ],
    RAYDIUM_PROGRAM_ID
  );

  console.log('Creating pool:', ammId.toString());
  console.log('Base:', baseMint.toString(), 'Amount:', baseAmount);
  console.log('Quote:', quoteMint.toString(), 'Amount:', quoteAmount);

  return ammId.toString();
}
```

**Orca Whirlpool Creation:**

```typescript
const WHIRLPOOL_PROGRAM_ID = new PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc');

interface WhirlpoolConfig {
  tokenMintA: PublicKey;
  tokenMintB: PublicKey;
  tickSpacing: number;
  initialSqrtPrice: bigint;
  feeRate: number;
}

async function createWhirlpool(
  connection: Connection,
  payer: Keypair,
  config: WhirlpoolConfig
): Promise<PublicKey> {
  const { tokenMintA, tokenMintB, tickSpacing, initialSqrtPrice, feeRate } = config;

  const [whirlpool] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('whirlpool'),
      tokenMintA.toBuffer(),
      tokenMintB.toBuffer(),
      Buffer.from(new Uint16Array([tickSpacing]).buffer),
    ],
    WHIRLPOOL_PROGRAM_ID
  );

  console.log('Creating Whirlpool:', whirlpool.toString());
  return whirlpool;
}
```

**Meteora DLMM Pool:**

```typescript
const METEORA_DLMM_PROGRAM = new PublicKey('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo');

interface DLMMParams {
  tokenX: PublicKey;
  tokenY: PublicKey;
  binStep: number;
  baseFactor: number;
  activeId: number;
}

async function createDLMMPool(
  connection: Connection,
  payer: Keypair,
  params: DLMMParams
): Promise<PublicKey> {
  const [lbPair] = PublicKey.findProgramAddressSync(
    [
      params.tokenX.toBuffer(),
      params.tokenY.toBuffer(),
      Buffer.from(new Uint16Array([params.binStep]).buffer),
    ],
    METEORA_DLMM_PROGRAM
  );

  console.log('Creating DLMM Pool:', lbPair.toString());
  return lbPair;
}
```

---

### 2. Optimal LP Ranges

Calculate optimal price ranges for concentrated liquidity.

**Range Calculation:**

```typescript
interface LPRange {
  lowerPrice: number;
  upperPrice: number;
  lowerTick: number;
  upperTick: number;
  concentration: number;
}

function calculateOptimalRange(
  currentPrice: number,
  volatility: number,
  timeHorizonDays: number,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
): LPRange {
  const volatilityMultipliers = {
    conservative: 2.0,
    moderate: 1.5,
    aggressive: 1.0,
  };

  const multiplier = volatilityMultipliers[riskTolerance];
  const expectedMove = volatility * Math.sqrt(timeHorizonDays / 365) * multiplier;

  const lowerPrice = currentPrice * (1 - expectedMove);
  const upperPrice = currentPrice * (1 + expectedMove);

  const lowerTick = priceToTick(lowerPrice);
  const upperTick = priceToTick(upperPrice);

  const concentration = 1 / expectedMove;

  return {
    lowerPrice,
    upperPrice,
    lowerTick,
    upperTick,
    concentration,
  };
}

function priceToTick(price: number, tickSpacing: number = 1): number {
  const tick = Math.floor(Math.log(price) / Math.log(1.0001));
  return Math.round(tick / tickSpacing) * tickSpacing;
}

function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick);
}
```

**Position Sizing:**

```typescript
interface PositionSizing {
  tokenAAmount: number;
  tokenBAmount: number;
  valueUsd: number;
  capitalEfficiency: number;
}

function calculatePositionSize(
  totalCapitalUsd: number,
  currentPrice: number,
  lowerPrice: number,
  upperPrice: number
): PositionSizing {
  const sqrtP = Math.sqrt(currentPrice);
  const sqrtPa = Math.sqrt(lowerPrice);
  const sqrtPb = Math.sqrt(upperPrice);

  const L = totalCapitalUsd / (2 * sqrtP - sqrtPa - currentPrice / sqrtPb);

  const tokenAAmount = L * (sqrtPb - sqrtP) / (sqrtP * sqrtPb);
  const tokenBAmount = L * (sqrtP - sqrtPa);

  const fullRangeCapital = totalCapitalUsd / 2;
  const concentratedCapital = tokenAAmount * currentPrice + tokenBAmount;
  const capitalEfficiency = fullRangeCapital / concentratedCapital;

  return {
    tokenAAmount,
    tokenBAmount,
    valueUsd: totalCapitalUsd,
    capitalEfficiency,
  };
}
```

---

### 3. Auto-Rebalancing

Implement automated position rebalancing strategies.

**Rebalance Strategy:**

```typescript
interface RebalanceCondition {
  priceDeviationPercent: number;
  timeIntervalHours: number;
  gasThreshold: number;
}

interface PositionState {
  currentPrice: number;
  lowerPrice: number;
  upperPrice: number;
  tokenABalance: number;
  tokenBBalance: number;
  lastRebalanceTime: number;
}

function shouldRebalance(
  position: PositionState,
  conditions: RebalanceCondition
): { shouldRebalance: boolean; reason: string } {
  const { currentPrice, lowerPrice, upperPrice, lastRebalanceTime } = position;

  const rangeCenter = (lowerPrice + upperPrice) / 2;
  const deviation = Math.abs(currentPrice - rangeCenter) / rangeCenter * 100;

  if (deviation > conditions.priceDeviationPercent) {
    return {
      shouldRebalance: true,
      reason: 'Price deviation: ' + deviation.toFixed(2) + '%',
    };
  }

  const hoursSinceRebalance = (Date.now() - lastRebalanceTime) / (1000 * 60 * 60);

  if (hoursSinceRebalance > conditions.timeIntervalHours) {
    return {
      shouldRebalance: true,
      reason: 'Time interval exceeded: ' + hoursSinceRebalance.toFixed(1) + ' hours',
    };
  }

  if (currentPrice <= lowerPrice || currentPrice >= upperPrice) {
    return {
      shouldRebalance: true,
      reason: 'Price out of range',
    };
  }

  return {
    shouldRebalance: false,
    reason: 'Position healthy',
  };
}
```

**Rebalance Execution:**

```typescript
interface RebalanceResult {
  success: boolean;
  newLowerPrice: number;
  newUpperPrice: number;
  gasCost: number;
  swapAmount: number;
  txSignature?: string;
}

async function executeRebalance(
  connection: Connection,
  wallet: Keypair,
  position: PositionState,
  newRange: LPRange
): Promise<RebalanceResult> {
  console.log('Executing rebalance...');
  console.log('Old range:', position.lowerPrice, '-', position.upperPrice);
  console.log('New range:', newRange.lowerPrice, '-', newRange.upperPrice);

  const oldValue = position.tokenABalance * position.currentPrice + position.tokenBBalance;
  const newPosition = calculatePositionSize(
    oldValue,
    position.currentPrice,
    newRange.lowerPrice,
    newRange.upperPrice
  );

  const tokenADiff = newPosition.tokenAAmount - position.tokenABalance;
  const swapNeeded = Math.abs(tokenADiff);

  console.log('Swap needed:', swapNeeded);

  return {
    success: true,
    newLowerPrice: newRange.lowerPrice,
    newUpperPrice: newRange.upperPrice,
    gasCost: 0.001,
    swapAmount: swapNeeded,
  };
}
```

---

### 4. AMM Integration

Integrate with multiple AMM protocols.

**Unified AMM Interface:**

```typescript
interface AMMProvider {
  name: string;
  programId: PublicKey;
  getPoolInfo(poolAddress: PublicKey): Promise<PoolInfo>;
  addLiquidity(params: AddLiquidityParams): Promise<string>;
  removeLiquidity(params: RemoveLiquidityParams): Promise<string>;
  swap(params: SwapParams): Promise<string>;
}

interface PoolInfo {
  address: string;
  tokenA: { mint: string; reserve: number };
  tokenB: { mint: string; reserve: number };
  fee: number;
  tvl: number;
  apr: number;
}

interface AddLiquidityParams {
  poolAddress: PublicKey;
  tokenAAmount: number;
  tokenBAmount: number;
  slippage: number;
}

interface RemoveLiquidityParams {
  poolAddress: PublicKey;
  lpTokenAmount: number;
  slippage: number;
}

interface SwapParams {
  poolAddress: PublicKey;
  inputMint: PublicKey;
  outputMint: PublicKey;
  amount: number;
  slippage: number;
}
```

**Raydium Integration:**

```typescript
class RaydiumProvider implements AMMProvider {
  name = 'Raydium';
  programId = RAYDIUM_PROGRAM_ID;

  constructor(private connection: Connection) {}

  async getPoolInfo(poolAddress: PublicKey): Promise<PoolInfo> {
    const accountInfo = await this.connection.getAccountInfo(poolAddress);

    if (!accountInfo) {
      throw new Error('Pool not found');
    }

    return {
      address: poolAddress.toString(),
      tokenA: { mint: '', reserve: 0 },
      tokenB: { mint: '', reserve: 0 },
      fee: 0.25,
      tvl: 0,
      apr: 0,
    };
  }

  async addLiquidity(params: AddLiquidityParams): Promise<string> {
    console.log('Adding liquidity to Raydium pool:', params.poolAddress.toString());
    return 'tx_signature';
  }

  async removeLiquidity(params: RemoveLiquidityParams): Promise<string> {
    console.log('Removing liquidity from Raydium pool:', params.poolAddress.toString());
    return 'tx_signature';
  }

  async swap(params: SwapParams): Promise<string> {
    console.log('Swapping on Raydium pool:', params.poolAddress.toString());
    return 'tx_signature';
  }
}
```

**Orca Integration:**

```typescript
class OrcaProvider implements AMMProvider {
  name = 'Orca';
  programId = WHIRLPOOL_PROGRAM_ID;

  constructor(private connection: Connection) {}

  async getPoolInfo(poolAddress: PublicKey): Promise<PoolInfo> {
    const accountInfo = await this.connection.getAccountInfo(poolAddress);

    if (!accountInfo) {
      throw new Error('Pool not found');
    }

    return {
      address: poolAddress.toString(),
      tokenA: { mint: '', reserve: 0 },
      tokenB: { mint: '', reserve: 0 },
      fee: 0.3,
      tvl: 0,
      apr: 0,
    };
  }

  async addLiquidity(params: AddLiquidityParams): Promise<string> {
    console.log('Adding liquidity to Orca pool:', params.poolAddress.toString());
    return 'tx_signature';
  }

  async removeLiquidity(params: RemoveLiquidityParams): Promise<string> {
    console.log('Removing liquidity from Orca pool:', params.poolAddress.toString());
    return 'tx_signature';
  }

  async swap(params: SwapParams): Promise<string> {
    console.log('Swapping on Orca pool:', params.poolAddress.toString());
    return 'tx_signature';
  }
}
```

---

## Impermanent Loss

**IL Calculation:**

```typescript
interface ILResult {
  ilPercent: number;
  ilValue: number;
  holdValue: number;
  lpValue: number;
  breakEvenFees: number;
}

function calculateImpermanentLoss(
  initialPriceRatio: number,
  currentPriceRatio: number,
  initialValueUsd: number
): ILResult {
  const k = currentPriceRatio / initialPriceRatio;

  const ilPercent = 2 * Math.sqrt(k) / (1 + k) - 1;
  const ilValue = initialValueUsd * Math.abs(ilPercent);

  const holdValue = initialValueUsd * (1 + k) / 2;
  const lpValue = initialValueUsd * Math.sqrt(k);

  const breakEvenFees = ilValue;

  return {
    ilPercent: ilPercent * 100,
    ilValue,
    holdValue,
    lpValue,
    breakEvenFees,
  };
}

function calculateConcentratedIL(
  initialPrice: number,
  currentPrice: number,
  lowerPrice: number,
  upperPrice: number,
  initialValueUsd: number
): ILResult {
  if (currentPrice < lowerPrice || currentPrice > upperPrice) {
    const ilPercent = currentPrice < lowerPrice
      ? (currentPrice / initialPrice - 1) * 100
      : (initialPrice / currentPrice - 1) * 100;

    return {
      ilPercent,
      ilValue: initialValueUsd * Math.abs(ilPercent) / 100,
      holdValue: initialValueUsd * (currentPrice / initialPrice),
      lpValue: initialValueUsd * Math.min(currentPrice / initialPrice, initialPrice / currentPrice),
      breakEvenFees: initialValueUsd * Math.abs(ilPercent) / 100,
    };
  }

  const fullRangeIL = calculateImpermanentLoss(initialPrice, currentPrice, initialValueUsd);

  const concentration = Math.sqrt(upperPrice / lowerPrice);
  const amplifiedIL = fullRangeIL.ilPercent * concentration;

  return {
    ilPercent: amplifiedIL,
    ilValue: initialValueUsd * Math.abs(amplifiedIL) / 100,
    holdValue: fullRangeIL.holdValue,
    lpValue: fullRangeIL.lpValue,
    breakEvenFees: initialValueUsd * Math.abs(amplifiedIL) / 100,
  };
}
```

---

## Real-World Examples

### Example 1: LP Position Manager

```typescript
interface LPPosition {
  poolAddress: string;
  provider: string;
  tokenA: { mint: string; amount: number };
  tokenB: { mint: string; amount: number };
  lowerPrice: number;
  upperPrice: number;
  lpTokens: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  feesEarned: number;
  il: number;
}

class LPPositionManager {
  private positions: Map<string, LPPosition> = new Map();

  async openPosition(
    provider: AMMProvider,
    params: {
      poolAddress: PublicKey;
      tokenAAmount: number;
      tokenBAmount: number;
      lowerPrice: number;
      upperPrice: number;
    }
  ): Promise<string> {
    const positionId = params.poolAddress.toString() + '_' + Date.now();

    const txSignature = await provider.addLiquidity({
      poolAddress: params.poolAddress,
      tokenAAmount: params.tokenAAmount,
      tokenBAmount: params.tokenBAmount,
      slippage: 1,
    });

    const poolInfo = await provider.getPoolInfo(params.poolAddress);

    const position: LPPosition = {
      poolAddress: params.poolAddress.toString(),
      provider: provider.name,
      tokenA: { mint: poolInfo.tokenA.mint, amount: params.tokenAAmount },
      tokenB: { mint: poolInfo.tokenB.mint, amount: params.tokenBAmount },
      lowerPrice: params.lowerPrice,
      upperPrice: params.upperPrice,
      lpTokens: 0,
      entryPrice: params.tokenBAmount / params.tokenAAmount,
      currentPrice: params.tokenBAmount / params.tokenAAmount,
      unrealizedPnL: 0,
      feesEarned: 0,
      il: 0,
    };

    this.positions.set(positionId, position);
    return positionId;
  }

  async closePosition(positionId: string, provider: AMMProvider): Promise<string> {
    const position = this.positions.get(positionId);

    if (!position) {
      throw new Error('Position not found');
    }

    const txSignature = await provider.removeLiquidity({
      poolAddress: new PublicKey(position.poolAddress),
      lpTokenAmount: position.lpTokens,
      slippage: 1,
    });

    this.positions.delete(positionId);
    return txSignature;
  }

  getPositions(): LPPosition[] {
    return Array.from(this.positions.values());
  }

  async updatePositions(): Promise<void> {
    for (const [id, position] of this.positions) {
      const ilResult = calculateConcentratedIL(
        position.entryPrice,
        position.currentPrice,
        position.lowerPrice,
        position.upperPrice,
        position.tokenA.amount * position.entryPrice + position.tokenB.amount
      );

      position.il = ilResult.ilPercent;
      position.unrealizedPnL = ilResult.lpValue - (position.tokenA.amount * position.entryPrice + position.tokenB.amount);
    }
  }
}
```

### Example 2: Auto-Compounding Vault

```typescript
interface VaultConfig {
  poolAddress: PublicKey;
  provider: AMMProvider;
  compoundInterval: number;
  minCompoundAmount: number;
}

class AutoCompoundingVault {
  private lastCompound: number = 0;

  constructor(
    private connection: Connection,
    private config: VaultConfig
  ) {}

  async compound(): Promise<string | null> {
    const now = Date.now();

    if (now - this.lastCompound < this.config.compoundInterval) {
      console.log('Too soon to compound');
      return null;
    }

    const poolInfo = await this.config.provider.getPoolInfo(this.config.poolAddress);
    const pendingRewards = 0;

    if (pendingRewards < this.config.minCompoundAmount) {
      console.log('Rewards below minimum:', pendingRewards);
      return null;
    }

    console.log('Compounding', pendingRewards, 'in rewards');

    const txSignature = await this.config.provider.addLiquidity({
      poolAddress: this.config.poolAddress,
      tokenAAmount: pendingRewards / 2,
      tokenBAmount: pendingRewards / 2,
      slippage: 1,
    });

    this.lastCompound = now;
    return txSignature;
  }

  async startAutoCompound(intervalMs: number): Promise<void> {
    setInterval(async () => {
      try {
        await this.compound();
      } catch (error) {
        console.error('Compound failed:', error);
      }
    }, intervalMs);
  }
}
```

---

## Testing

```typescript
import { start } from 'solana-bankrun';

describe('LP Automation', () => {
  test('should calculate impermanent loss correctly', () => {
    const result = calculateImpermanentLoss(100, 200, 10000);

    expect(result.ilPercent).toBeCloseTo(-5.72, 1);
    expect(result.holdValue).toBe(15000);
  });

  test('should calculate optimal LP range', () => {
    const range = calculateOptimalRange(100, 0.5, 30, 'moderate');

    expect(range.lowerPrice).toBeLessThan(100);
    expect(range.upperPrice).toBeGreaterThan(100);
    expect(range.concentration).toBeGreaterThan(1);
  });

  test('should determine rebalance need', () => {
    const position: PositionState = {
      currentPrice: 150,
      lowerPrice: 80,
      upperPrice: 120,
      tokenABalance: 100,
      tokenBBalance: 10000,
      lastRebalanceTime: Date.now() - 1000 * 60 * 60 * 25,
    };

    const result = shouldRebalance(position, {
      priceDeviationPercent: 10,
      timeIntervalHours: 24,
      gasThreshold: 0.01,
    });

    expect(result.shouldRebalance).toBe(true);
  });
});
```

---

## Security Considerations

1. **Validate pool addresses** before providing liquidity
2. **Set appropriate slippage** for add/remove liquidity
3. **Monitor for rug pulls** in new pools
4. **Calculate IL before entering** positions
5. **Use circuit breakers** for auto-rebalancing
6. **Audit smart contracts** for custom vaults

---

## Related Skills

- **jupiter-trader** - Token swaps for rebalancing
- **solana-reader** - Pool data queries
- **tokenomics-designer** - Token distribution

---

## Further Reading

- Raydium Docs: https://docs.raydium.io/
- Orca Whirlpools: https://docs.orca.so/
- Meteora DLMM: https://docs.meteora.ag/

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
