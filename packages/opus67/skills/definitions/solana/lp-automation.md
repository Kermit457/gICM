# LP Automation Skill

**Skill ID:** `lp-automation`
**Category:** Solana Development / DeFi
**Complexity:** Expert
**Prerequisites:** Solana, AMM mechanics, TypeScript, trading strategies
**Last Updated:** 2025-01-04

## Overview

Master automated liquidity provision (LP) strategies for Solana DEXs including Raydium, Orca, Meteora, and Jupiter. This skill covers concentrated liquidity management, impermanent loss mitigation, dynamic rebalancing, MEV protection, and advanced LP strategies for optimal yield.

## Core Competencies

### 1. AMM Mechanics
- Constant Product (x*y=k) formula
- Concentrated liquidity ranges
- Tick spacing and price ranges
- Fee tier optimization

### 2. LP Strategy Design
- Passive vs active management
- Range order strategies
- Mean reversion strategies
- Momentum strategies

### 3. Risk Management
- Impermanent loss calculation
- Hedging strategies
- Position sizing
- Stop-loss automation

### 4. Protocol Integration
- Raydium CLMM integration
- Orca Whirlpools
- Meteora DLMM
- Cross-DEX arbitrage

## Concentrated Liquidity Fundamentals

### Understanding Concentrated Liquidity

```typescript
// lib/concentrated-liquidity.ts
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface ConcentratedPosition {
  pool: PublicKey;
  tickLower: number;
  tickUpper: number;
  liquidity: BN;
  tokenA: PublicKey;
  tokenB: PublicKey;
  feeGrowthInside: {
    tokenA: BN;
    tokenB: BN;
  };
}

export class ConcentratedLiquidityMath {
  /**
   * Calculate token amounts for a given liquidity and price range
   */
  static getTokenAmountsFromLiquidity(
    liquidity: BN,
    currentSqrtPrice: BN,
    lowerSqrtPrice: BN,
    upperSqrtPrice: BN
  ): { amountA: BN; amountB: BN } {
    // When price is below range
    if (currentSqrtPrice.lte(lowerSqrtPrice)) {
      return {
        amountA: this.getAmount0ForLiquidity(lowerSqrtPrice, upperSqrtPrice, liquidity),
        amountB: new BN(0),
      };
    }

    // When price is above range
    if (currentSqrtPrice.gte(upperSqrtPrice)) {
      return {
        amountA: new BN(0),
        amountB: this.getAmount1ForLiquidity(lowerSqrtPrice, upperSqrtPrice, liquidity),
      };
    }

    // When price is in range
    return {
      amountA: this.getAmount0ForLiquidity(currentSqrtPrice, upperSqrtPrice, liquidity),
      amountB: this.getAmount1ForLiquidity(lowerSqrtPrice, currentSqrtPrice, liquidity),
    };
  }

  /**
   * Calculate liquidity for given token amounts
   */
  static getLiquidityFromAmounts(
    currentSqrtPrice: BN,
    lowerSqrtPrice: BN,
    upperSqrtPrice: BN,
    amountA: BN,
    amountB: BN
  ): BN {
    if (currentSqrtPrice.lte(lowerSqrtPrice)) {
      return this.getLiquidity0(lowerSqrtPrice, upperSqrtPrice, amountA);
    }

    if (currentSqrtPrice.gte(upperSqrtPrice)) {
      return this.getLiquidity1(lowerSqrtPrice, upperSqrtPrice, amountB);
    }

    const liquidity0 = this.getLiquidity0(currentSqrtPrice, upperSqrtPrice, amountA);
    const liquidity1 = this.getLiquidity1(lowerSqrtPrice, currentSqrtPrice, amountB);

    return BN.min(liquidity0, liquidity1);
  }

  private static getAmount0ForLiquidity(
    sqrtPriceA: BN,
    sqrtPriceB: BN,
    liquidity: BN
  ): BN {
    const sqrtPriceAX96 = sqrtPriceA;
    const sqrtPriceBX96 = sqrtPriceB;

    return liquidity
      .mul(sqrtPriceBX96.sub(sqrtPriceAX96))
      .div(sqrtPriceBX96)
      .div(sqrtPriceAX96);
  }

  private static getAmount1ForLiquidity(
    sqrtPriceA: BN,
    sqrtPriceB: BN,
    liquidity: BN
  ): BN {
    return liquidity.mul(sqrtPriceB.sub(sqrtPriceA));
  }

  private static getLiquidity0(sqrtPriceA: BN, sqrtPriceB: BN, amount0: BN): BN {
    return amount0.mul(sqrtPriceA).mul(sqrtPriceB).div(sqrtPriceB.sub(sqrtPriceA));
  }

  private static getLiquidity1(sqrtPriceA: BN, sqrtPriceB: BN, amount1: BN): BN {
    return amount1.div(sqrtPriceB.sub(sqrtPriceA));
  }

  /**
   * Calculate price from tick
   */
  static tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick);
  }

  /**
   * Calculate tick from price
   */
  static priceToTick(price: number): number {
    return Math.floor(Math.log(price) / Math.log(1.0001));
  }
}
```

### Impermanent Loss Calculator

```typescript
// lib/impermanent-loss.ts
export interface ImpermanentLossResult {
  loss: number; // % loss
  hodlValue: number;
  lpValue: number;
  feesEarned: number;
  netPnL: number;
}

export class ImpermanentLossCalculator {
  /**
   * Calculate IL for given price change
   */
  static calculateIL(
    priceChangeRatio: number,
    feesEarned: number = 0
  ): ImpermanentLossResult {
    // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const k = priceChangeRatio;
    const ilMultiplier = (2 * Math.sqrt(k)) / (1 + k);
    const ilPercent = (ilMultiplier - 1) * 100;

    // Calculate values (assuming $1000 initial)
    const initialValue = 1000;
    const hodlValue = initialValue * ((1 + k) / 2);
    const lpValue = initialValue * ilMultiplier;

    const loss = hodlValue - lpValue;
    const netPnL = lpValue + feesEarned - initialValue;

    return {
      loss: ilPercent,
      hodlValue,
      lpValue,
      feesEarned,
      netPnL,
    };
  }

  /**
   * Calculate IL for concentrated liquidity position
   */
  static calculateConcentratedIL(
    currentPrice: number,
    entryPrice: number,
    lowerPrice: number,
    upperPrice: number,
    feesEarned: number = 0
  ): ImpermanentLossResult {
    // Concentrated IL is lower when in range
    const priceRatio = currentPrice / entryPrice;

    // Check if in range
    if (currentPrice < lowerPrice || currentPrice > upperPrice) {
      // Out of range - no IL but also no fees
      return {
        loss: 0,
        hodlValue: 1000,
        lpValue: 1000,
        feesEarned: 0,
        netPnL: 0,
      };
    }

    // In range - calculate IL with range factor
    const rangeFactor = (upperPrice - lowerPrice) / entryPrice;
    const adjustedIL = this.calculateIL(priceRatio, feesEarned);

    // Concentrated positions have amplified IL
    return {
      ...adjustedIL,
      loss: adjustedIL.loss * (1 / rangeFactor),
    };
  }

  /**
   * Calculate breakeven fee APR to offset IL
   */
  static calculateBreakevenAPR(
    priceChangePercent: number,
    daysElapsed: number
  ): number {
    const priceRatio = 1 + priceChangePercent / 100;
    const il = this.calculateIL(priceRatio);

    // Annualized fee APR needed to break even
    const breakevenFees = Math.abs(il.loss * 10); // *10 because IL is in %
    const annualizedAPR = (breakevenFees / daysElapsed) * 365;

    return annualizedAPR;
  }
}
```

## Raydium CLMM Integration

```typescript
// integrations/raydium-clmm.ts
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
} from '@solana/web3.js';
import {
  ClmmPoolInfo,
  PositionInfo,
  ApiV3PoolInfoConcentratedItem,
} from '@raydium-io/raydium-sdk-v2';

export class RaydiumCLMM {
  constructor(
    private connection: Connection,
    private wallet: Keypair
  ) {}

  /**
   * Fetch pool info
   */
  async getPoolInfo(poolId: PublicKey): Promise<ClmmPoolInfo> {
    // Fetch from Raydium API
    const response = await fetch(
      `https://api-v3.raydium.io/pools/info/ids?ids=${poolId.toBase58()}`
    );
    const data = await response.json();
    return data.data[0];
  }

  /**
   * Calculate optimal range for current market conditions
   */
  calculateOptimalRange(
    currentPrice: number,
    volatility: number,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  ): { lowerPrice: number; upperPrice: number } {
    // Volatility-based range sizing
    const rangeMultipliers = {
      conservative: 2.0, // ±100% (wide range)
      moderate: 1.5,     // ±50% (medium range)
      aggressive: 1.2,   // ±20% (tight range)
    };

    const multiplier = rangeMultipliers[riskTolerance];
    const adjustedVol = volatility * multiplier;

    return {
      lowerPrice: currentPrice * (1 - adjustedVol),
      upperPrice: currentPrice * (1 + adjustedVol),
    };
  }

  /**
   * Open concentrated liquidity position
   */
  async openPosition(
    poolId: PublicKey,
    lowerTick: number,
    upperTick: number,
    amountA: number,
    amountB: number
  ): Promise<string> {
    // Build instruction using Raydium SDK
    const instruction = await this.buildOpenPositionIx(
      poolId,
      lowerTick,
      upperTick,
      amountA,
      amountB
    );

    const transaction = new Transaction().add(instruction);

    // Send transaction
    const signature = await this.connection.sendTransaction(transaction, [
      this.wallet,
    ]);

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  /**
   * Add liquidity to existing position
   */
  async increaseLiquidity(
    positionId: PublicKey,
    amountA: number,
    amountB: number
  ): Promise<string> {
    const instruction = await this.buildIncreaseLiquidityIx(
      positionId,
      amountA,
      amountB
    );

    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [
      this.wallet,
    ]);

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  /**
   * Remove liquidity from position
   */
  async decreaseLiquidity(
    positionId: PublicKey,
    liquidityAmount: number
  ): Promise<string> {
    const instruction = await this.buildDecreaseLiquidityIx(
      positionId,
      liquidityAmount
    );

    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [
      this.wallet,
    ]);

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  /**
   * Collect fees from position
   */
  async collectFees(positionId: PublicKey): Promise<string> {
    const instruction = await this.buildCollectFeesIx(positionId);

    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [
      this.wallet,
    ]);

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  /**
   * Close position
   */
  async closePosition(positionId: PublicKey): Promise<string> {
    // First remove all liquidity
    const position = await this.getPositionInfo(positionId);
    await this.decreaseLiquidity(positionId, Number(position.liquidity));

    // Collect remaining fees
    await this.collectFees(positionId);

    // Close position account
    const instruction = await this.buildClosePositionIx(positionId);
    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [
      this.wallet,
    ]);

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  // Helper methods (implement using Raydium SDK)
  private async buildOpenPositionIx(...args: any[]): Promise<any> {
    // Implementation using @raydium-io/raydium-sdk-v2
    throw new Error('Implement using Raydium SDK');
  }

  private async buildIncreaseLiquidityIx(...args: any[]): Promise<any> {
    throw new Error('Implement using Raydium SDK');
  }

  private async buildDecreaseLiquidityIx(...args: any[]): Promise<any> {
    throw new Error('Implement using Raydium SDK');
  }

  private async buildCollectFeesIx(...args: any[]): Promise<any> {
    throw new Error('Implement using Raydium SDK');
  }

  private async buildClosePositionIx(...args: any[]): Promise<any> {
    throw new Error('Implement using Raydium SDK');
  }

  private async getPositionInfo(positionId: PublicKey): Promise<PositionInfo> {
    throw new Error('Implement using Raydium SDK');
  }
}
```

## LP Strategies

### 1. Mean Reversion Strategy

```typescript
// strategies/mean-reversion.ts
import { PublicKey } from '@solana/web3.js';
import { RaydiumCLMM } from '@/integrations/raydium-clmm';

export interface MeanReversionConfig {
  poolId: PublicKey;
  targetPrice: number;
  rangeWidth: number; // % from target
  rebalanceThreshold: number; // % price move
  checkInterval: number; // seconds
}

export class MeanReversionStrategy {
  private isRunning = false;
  private currentPosition: PublicKey | null = null;

  constructor(
    private config: MeanReversionConfig,
    private clmm: RaydiumCLMM
  ) {}

  /**
   * Start strategy
   */
  async start(): Promise<void> {
    this.isRunning = true;

    while (this.isRunning) {
      await this.checkAndRebalance();
      await this.sleep(this.config.checkInterval * 1000);
    }
  }

  /**
   * Stop strategy
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Check position and rebalance if needed
   */
  private async checkAndRebalance(): Promise<void> {
    try {
      const pool = await this.clmm.getPoolInfo(this.config.poolId);
      const currentPrice = pool.price;

      // Calculate distance from target
      const priceDeviation =
        ((currentPrice - this.config.targetPrice) / this.config.targetPrice) * 100;

      console.log(`Current price: ${currentPrice}, Deviation: ${priceDeviation.toFixed(2)}%`);

      // Check if rebalance needed
      if (Math.abs(priceDeviation) > this.config.rebalanceThreshold) {
        console.log('Rebalancing position...');
        await this.rebalance(currentPrice);
      }
    } catch (error) {
      console.error('Error in mean reversion strategy:', error);
    }
  }

  /**
   * Rebalance position around current price
   */
  private async rebalance(currentPrice: number): Promise<void> {
    // Close existing position if any
    if (this.currentPosition) {
      await this.clmm.closePosition(this.currentPosition);
      this.currentPosition = null;
    }

    // Calculate new range centered on current price
    const rangeMultiplier = this.config.rangeWidth / 100;
    const lowerPrice = currentPrice * (1 - rangeMultiplier);
    const upperPrice = currentPrice * (1 + rangeMultiplier);

    // Convert to ticks
    const lowerTick = this.priceToTick(lowerPrice);
    const upperTick = this.priceToTick(upperPrice);

    // Open new position
    const signature = await this.clmm.openPosition(
      this.config.poolId,
      lowerTick,
      upperTick,
      1000, // Amount A (adjust based on available balance)
      1000  // Amount B
    );

    console.log(`Opened new position: ${signature}`);
  }

  private priceToTick(price: number): number {
    return Math.floor(Math.log(price) / Math.log(1.0001));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Range Order Strategy

```typescript
// strategies/range-order.ts
export interface RangeOrderConfig {
  poolId: PublicKey;
  entryPrice: number;
  exitPrice: number;
  size: number;
  takeProfit: number; // %
}

export class RangeOrderStrategy {
  constructor(
    private config: RangeOrderConfig,
    private clmm: RaydiumCLMM
  ) {}

  /**
   * Execute range order (similar to limit order)
   */
  async execute(): Promise<void> {
    const { entryPrice, exitPrice } = this.config;

    // Set narrow range around target prices
    const tickWidth = 10; // Very tight range
    const lowerTick = this.priceToTick(Math.min(entryPrice, exitPrice));
    const upperTick = lowerTick + tickWidth;

    // Open position
    await this.clmm.openPosition(
      this.config.poolId,
      lowerTick,
      upperTick,
      this.config.size,
      0 // Single-sided liquidity
    );

    // Monitor for exit
    await this.monitorForExit();
  }

  private async monitorForExit(): Promise<void> {
    // Monitor price and close when take profit hit
    while (true) {
      const pool = await this.clmm.getPoolInfo(this.config.poolId);
      const currentPrice = pool.price;

      const priceChange =
        ((currentPrice - this.config.entryPrice) / this.config.entryPrice) * 100;

      if (priceChange >= this.config.takeProfit) {
        console.log('Take profit hit, closing position');
        // Close position
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private priceToTick(price: number): number {
    return Math.floor(Math.log(price) / Math.log(1.0001));
  }
}
```

### 3. Liquidity Mining Optimizer

```typescript
// strategies/liquidity-mining.ts
export interface PoolAPR {
  poolId: PublicKey;
  tradingAPR: number;
  farmingAPR: number;
  totalAPR: number;
  tvl: number;
  volume24h: number;
}

export class LiquidityMiningOptimizer {
  constructor(private clmm: RaydiumCLMM) {}

  /**
   * Find best pools for liquidity mining
   */
  async findBestPools(minAPR: number = 20): Promise<PoolAPR[]> {
    // Fetch all CLMM pools
    const pools = await this.fetchAllPools();

    // Calculate APR for each
    const poolAPRs = await Promise.all(
      pools.map(pool => this.calculatePoolAPR(pool))
    );

    // Filter and sort
    return poolAPRs
      .filter(p => p.totalAPR >= minAPR)
      .sort((a, b) => b.totalAPR - a.totalAPR);
  }

  /**
   * Calculate pool APR from fees and rewards
   */
  private async calculatePoolAPR(pool: any): Promise<PoolAPR> {
    const { volume24h, tvl, farmRewards } = pool;

    // Trading fee APR (assuming 0.3% fee tier)
    const dailyFees = volume24h * 0.003;
    const tradingAPR = (dailyFees * 365 * 100) / tvl;

    // Farming reward APR
    const farmingAPR = farmRewards ? (farmRewards * 365 * 100) / tvl : 0;

    return {
      poolId: pool.id,
      tradingAPR,
      farmingAPR,
      totalAPR: tradingAPR + farmingAPR,
      tvl,
      volume24h,
    };
  }

  /**
   * Auto-compound rewards
   */
  async autoCompound(positionId: PublicKey): Promise<void> {
    // Collect fees
    await this.clmm.collectFees(positionId);

    // Get collected amounts
    const fees = await this.getCollectedFees(positionId);

    // Add back to position
    await this.clmm.increaseLiquidity(positionId, fees.amountA, fees.amountB);

    console.log('Auto-compounded fees into position');
  }

  private async fetchAllPools(): Promise<any[]> {
    // Fetch from Raydium API
    const response = await fetch('https://api-v3.raydium.io/pools/info/list');
    const data = await response.json();
    return data.data.filter((p: any) => p.type === 'Concentrated');
  }

  private async getCollectedFees(positionId: PublicKey): Promise<any> {
    // Implementation to fetch collected fees
    return { amountA: 0, amountB: 0 };
  }
}
```

## Risk Management

```typescript
// lib/risk-management.ts
export interface RiskParameters {
  maxPositionSize: number; // USD
  maxIL: number; // %
  stopLoss: number; // %
  maxSlippage: number; // %
  minLiquidity: number; // USD
}

export class RiskManager {
  constructor(private params: RiskParameters) {}

  /**
   * Validate position before opening
   */
  validatePosition(
    positionSize: number,
    poolLiquidity: number,
    expectedIL: number
  ): { valid: boolean; reason?: string } {
    // Check position size
    if (positionSize > this.params.maxPositionSize) {
      return {
        valid: false,
        reason: `Position size $${positionSize} exceeds max $${this.params.maxPositionSize}`,
      };
    }

    // Check pool liquidity
    if (poolLiquidity < this.params.minLiquidity) {
      return {
        valid: false,
        reason: `Pool liquidity $${poolLiquidity} below minimum $${this.params.minLiquidity}`,
      };
    }

    // Check expected IL
    if (expectedIL > this.params.maxIL) {
      return {
        valid: false,
        reason: `Expected IL ${expectedIL}% exceeds max ${this.params.maxIL}%`,
      };
    }

    return { valid: true };
  }

  /**
   * Calculate position size based on risk
   */
  calculatePositionSize(
    accountBalance: number,
    volatility: number,
    riskPercent: number = 2
  ): number {
    // Risk-based position sizing
    // More volatile = smaller position
    const volatilityAdjustment = 1 / (1 + volatility);
    const riskAmount = accountBalance * (riskPercent / 100);
    return riskAmount * volatilityAdjustment;
  }

  /**
   * Check if stop loss should be triggered
   */
  shouldStopLoss(
    entryValue: number,
    currentValue: number,
    feesEarned: number
  ): boolean {
    const netPnL = ((currentValue + feesEarned - entryValue) / entryValue) * 100;
    return netPnL <= -this.params.stopLoss;
  }
}
```

## MEV Protection

```typescript
// lib/mev-protection.ts
import { Connection, Transaction } from '@solana/web3.js';

export class MEVProtection {
  constructor(private connection: Connection) {}

  /**
   * Send transaction with Jito MEV protection
   */
  async sendWithJitoProtection(
    transaction: Transaction,
    tipLamports: number = 10000
  ): Promise<string> {
    // Add Jito tip instruction
    const jitoTipInstruction = this.createJitoTipInstruction(tipLamports);
    transaction.add(jitoTipInstruction);

    // Send to Jito RPC
    const jitoRPC = 'https://mainnet.block-engine.jito.wtf/api/v1/transactions';

    const serializedTx = transaction.serialize();
    const base64Tx = serializedTx.toString('base64');

    const response = await fetch(jitoRPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendTransaction',
        params: [base64Tx],
      }),
    });

    const data = await response.json();
    return data.result;
  }

  private createJitoTipInstruction(tipLamports: number): any {
    // Create Jito tip instruction
    // Implementation depends on Jito SDK
    throw new Error('Implement Jito tip instruction');
  }

  /**
   * Check for sandwich attack risk
   */
  async checkSandwichRisk(
    poolId: string,
    tradeSize: number
  ): Promise<{ risk: 'low' | 'medium' | 'high'; reason: string }> {
    // Analyze recent transactions for sandwich patterns
    // Check pool depth vs trade size
    // Monitor mempool for suspicious activity

    const priceImpact = 0.5; // Calculate actual impact

    if (priceImpact < 0.5) {
      return { risk: 'low', reason: 'Price impact < 0.5%' };
    } else if (priceImpact < 2) {
      return { risk: 'medium', reason: 'Price impact 0.5-2%' };
    } else {
      return { risk: 'high', reason: 'Price impact > 2%' };
    }
  }
}
```

## Performance Tracking

```typescript
// lib/performance-tracker.ts
export interface PositionPerformance {
  positionId: string;
  entryTime: number;
  exitTime?: number;
  entryValue: number;
  currentValue: number;
  feesEarned: number;
  ilLoss: number;
  netPnL: number;
  roi: number; // %
  apr: number; // Annualized
}

export class PerformanceTracker {
  private positions: Map<string, PositionPerformance> = new Map();

  /**
   * Track new position
   */
  trackPosition(positionId: string, entryValue: number): void {
    this.positions.set(positionId, {
      positionId,
      entryTime: Date.now(),
      entryValue,
      currentValue: entryValue,
      feesEarned: 0,
      ilLoss: 0,
      netPnL: 0,
      roi: 0,
      apr: 0,
    });
  }

  /**
   * Update position performance
   */
  updatePosition(
    positionId: string,
    currentValue: number,
    feesEarned: number,
    ilLoss: number
  ): void {
    const position = this.positions.get(positionId);
    if (!position) return;

    const netPnL = currentValue + feesEarned - ilLoss - position.entryValue;
    const roi = (netPnL / position.entryValue) * 100;

    // Calculate annualized return
    const daysElapsed = (Date.now() - position.entryTime) / (1000 * 60 * 60 * 24);
    const apr = (roi / daysElapsed) * 365;

    this.positions.set(positionId, {
      ...position,
      currentValue,
      feesEarned,
      ilLoss,
      netPnL,
      roi,
      apr,
    });
  }

  /**
   * Close position tracking
   */
  closePosition(positionId: string): void {
    const position = this.positions.get(positionId);
    if (!position) return;

    position.exitTime = Date.now();
    this.positions.set(positionId, position);
  }

  /**
   * Get portfolio statistics
   */
  getPortfolioStats(): {
    totalValue: number;
    totalPnL: number;
    avgROI: number;
    avgAPR: number;
    winRate: number;
  } {
    const positions = Array.from(this.positions.values());

    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPnL = positions.reduce((sum, p) => sum + p.netPnL, 0);
    const avgROI =
      positions.reduce((sum, p) => sum + p.roi, 0) / positions.length;
    const avgAPR =
      positions.reduce((sum, p) => sum + p.apr, 0) / positions.length;

    const winners = positions.filter(p => p.netPnL > 0).length;
    const winRate = (winners / positions.length) * 100;

    return {
      totalValue,
      totalPnL,
      avgROI,
      avgAPR,
      winRate,
    };
  }
}
```

## Automation Framework

```typescript
// lib/lp-automation.ts
export interface AutomationConfig {
  strategy: 'mean-reversion' | 'range-order' | 'liquidity-mining';
  pools: PublicKey[];
  rebalanceInterval: number; // seconds
  autoCompound: boolean;
  riskParams: RiskParameters;
}

export class LPAutomation {
  private isRunning = false;
  private strategies: Map<string, any> = new Map();

  constructor(
    private config: AutomationConfig,
    private clmm: RaydiumCLMM,
    private performanceTracker: PerformanceTracker
  ) {}

  /**
   * Start automation
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Initialize strategies for each pool
    for (const poolId of this.config.pools) {
      const strategy = this.createStrategy(poolId);
      this.strategies.set(poolId.toBase58(), strategy);
    }

    // Run main loop
    while (this.isRunning) {
      await this.runCycle();
      await this.sleep(this.config.rebalanceInterval * 1000);
    }
  }

  /**
   * Stop automation
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    // Close all positions
    for (const [poolId, strategy] of this.strategies) {
      if (strategy.currentPosition) {
        await this.clmm.closePosition(strategy.currentPosition);
      }
    }
  }

  /**
   * Run automation cycle
   */
  private async runCycle(): Promise<void> {
    console.log('Running automation cycle...');

    for (const [poolId, strategy] of this.strategies) {
      try {
        // Execute strategy
        await strategy.execute();

        // Auto-compound if enabled
        if (this.config.autoCompound && strategy.currentPosition) {
          const optimizer = new LiquidityMiningOptimizer(this.clmm);
          await optimizer.autoCompound(strategy.currentPosition);
        }

        // Update performance tracking
        await this.updatePerformance(strategy);
      } catch (error) {
        console.error(`Error in strategy for pool ${poolId}:`, error);
      }
    }

    // Log stats
    const stats = this.performanceTracker.getPortfolioStats();
    console.log('Portfolio Stats:', stats);
  }

  private createStrategy(poolId: PublicKey): any {
    // Create strategy based on config
    switch (this.config.strategy) {
      case 'mean-reversion':
        return new MeanReversionStrategy(
          {
            poolId,
            targetPrice: 1.0,
            rangeWidth: 10,
            rebalanceThreshold: 5,
            checkInterval: 60,
          },
          this.clmm
        );
      default:
        throw new Error(`Unknown strategy: ${this.config.strategy}`);
    }
  }

  private async updatePerformance(strategy: any): Promise<void> {
    if (!strategy.currentPosition) return;

    // Fetch current position value
    const position = await this.clmm.getPositionInfo(strategy.currentPosition);
    // Update tracker (implementation details omitted)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Best Practices

1. **Start Conservative**: Wide ranges, low leverage
2. **Monitor IL**: Track vs HODL continuously
3. **Auto-Compound**: Reinvest fees regularly
4. **Diversify**: Multiple pools, strategies
5. **Use Stop-Losses**: Protect against black swans
6. **MEV Protection**: Use Jito or private RPC
7. **Test on Devnet**: Validate strategies first
8. **Track Performance**: Measure APR, Sharpe ratio
9. **Manage Risk**: Position sizing, max drawdown
10. **Stay Informed**: Monitor pool changes, upgrades

## Common Pitfalls

1. **Too Tight Ranges**: Frequent rebalancing = high costs
2. **Ignoring IL**: Fees may not offset losses
3. **No Stop-Loss**: Can lose 50%+ in volatile markets
4. **Over-Leveraging**: Liquidation risk in concentrated positions
5. **Ignoring Gas**: Rebalancing costs add up
6. **No MEV Protection**: Sandwiched by bots
7. **One Pool Risk**: Diversify across pairs
8. **No Auto-Compound**: Missing exponential growth
9. **Emotional Trading**: Stick to the strategy
10. **Neglecting Monitoring**: Set up alerts

## Key Takeaways

1. **Concentrated liquidity amplifies everything**: More fees, more IL
2. **Active management beats passive** in most markets
3. **IL is real** but can be offset by fees
4. **Automation is essential** for competitive returns
5. **Risk management** separates winners from losers
6. **Backtesting** on historical data is critical
7. **MEV protection** is not optional on Solana
8. **Multiple strategies** reduce risk
9. **Continuous monitoring** catches issues early
10. **Keep learning** - DeFi evolves fast
