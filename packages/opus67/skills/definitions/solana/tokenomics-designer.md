# Tokenomics Designer Skill

**Skill ID:** `tokenomics-designer`
**Category:** Solana Development / Token Economics
**Complexity:** Expert
**Prerequisites:** Economics, Math, Solana tokens, DeFi
**Last Updated:** 2025-01-04

## Overview

Master the art and science of designing sustainable token economies for Solana projects. This skill covers token distribution models, vesting schedules, utility design, incentive mechanisms, bonding curves, deflationary mechanics, and economic modeling for long-term protocol success.

## Core Competencies

### 1. Token Supply Models
- Fixed vs. inflationary supply
- Emission schedules and decay curves
- Burn mechanisms and deflationary pressure
- Dynamic supply adjustment

### 2. Distribution Strategies
- Fair launch vs. pre-sale models
- Team and investor allocations
- Community incentives
- Liquidity bootstrapping

### 3. Utility Design
- Governance rights
- Fee discounts and cashbacks
- Staking rewards
- Access and premium features

### 4. Economic Security
- Sybil resistance
- Attack cost analysis
- Game theory and mechanism design
- Anti-whale mechanisms

## Token Economic Models

### 1. Fixed Supply Model

```typescript
// models/fixed-supply.ts
export interface FixedSupplyModel {
  totalSupply: number;
  distribution: {
    team: number;
    investors: number;
    community: number;
    treasury: number;
    liquidity: number;
  };
  vesting: VestingSchedule[];
  circulatingSupply: (timestamp: number) => number;
}

export interface VestingSchedule {
  recipient: string;
  amount: number;
  cliff: number; // months
  duration: number; // months
  linear: boolean;
}

export function createFixedSupplyModel(
  totalSupply: number,
  distribution: Record<string, number>
): FixedSupplyModel {
  // Validate distribution adds to 100%
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new Error('Distribution must sum to 100%');
  }

  return {
    totalSupply,
    distribution: {
      team: (distribution.team / 100) * totalSupply,
      investors: (distribution.investors / 100) * totalSupply,
      community: (distribution.community / 100) * totalSupply,
      treasury: (distribution.treasury / 100) * totalSupply,
      liquidity: (distribution.liquidity / 100) * totalSupply,
    },
    vesting: [],
    circulatingSupply: (timestamp: number) => {
      // Calculate based on vesting schedules
      return totalSupply;
    },
  };
}

// Example: Standard startup token model
export const STARTUP_MODEL: FixedSupplyModel = createFixedSupplyModel(
  1_000_000_000, // 1B tokens
  {
    team: 20,       // 20% team (4 year vest)
    investors: 15,  // 15% investors (2 year vest)
    community: 40,  // 40% community rewards
    treasury: 15,   // 15% treasury/DAO
    liquidity: 10,  // 10% initial liquidity
  }
);
```

### 2. Inflationary Model

```typescript
// models/inflationary.ts
export interface InflationaryModel {
  initialSupply: number;
  inflationRate: number; // Annual %
  inflationDecay: number; // Annual decay %
  minimumInflation: number; // Floor %
  emissionSchedule: EmissionSchedule;
}

export interface EmissionSchedule {
  calculateEmission: (
    currentSupply: number,
    year: number
  ) => number;
}

export function createInflationaryModel(
  initialSupply: number,
  initialInflation: number,
  decayRate: number,
  floor: number
): InflationaryModel {
  return {
    initialSupply,
    inflationRate: initialInflation,
    inflationDecay: decayRate,
    minimumInflation: floor,
    emissionSchedule: {
      calculateEmission: (currentSupply, year) => {
        // Calculate inflation rate with decay
        const decayedRate = Math.max(
          initialInflation * Math.pow(1 - decayRate, year),
          floor
        );

        // Annual emission
        return currentSupply * (decayedRate / 100);
      },
    },
  };
}

// Example: Solana-style inflation
export const SOLANA_INFLATION: InflationaryModel = createInflationaryModel(
  500_000_000,  // 500M initial
  8.0,          // 8% initial inflation
  0.15,         // 15% annual decay
  1.5           // 1.5% floor
);

// Calculate supply over time
export function projectSupply(
  model: InflationaryModel,
  years: number
): number[] {
  const supplies: number[] = [model.initialSupply];

  for (let year = 1; year <= years; year++) {
    const lastSupply = supplies[year - 1];
    const emission = model.emissionSchedule.calculateEmission(lastSupply, year);
    supplies.push(lastSupply + emission);
  }

  return supplies;
}
```

### 3. Bonding Curve Model

```typescript
// models/bonding-curve.ts
export enum CurveType {
  LINEAR = 'LINEAR',
  EXPONENTIAL = 'EXPONENTIAL',
  LOGARITHMIC = 'LOGARITHMIC',
  SIGMOID = 'SIGMOID',
}

export interface BondingCurveModel {
  curveType: CurveType;
  reserveRatio: number; // 0-1, Bancor formula
  initialPrice: number;
  maxSupply?: number;
  calculatePrice: (supply: number) => number;
  calculateSupply: (price: number) => number;
}

export function createBondingCurve(
  type: CurveType,
  params: any
): BondingCurveModel {
  switch (type) {
    case CurveType.LINEAR:
      return createLinearCurve(params);
    case CurveType.EXPONENTIAL:
      return createExponentialCurve(params);
    case CurveType.LOGARITHMIC:
      return createLogarithmicCurve(params);
    case CurveType.SIGMOID:
      return createSigmoidCurve(params);
  }
}

function createLinearCurve(params: {
  slope: number;
  intercept: number;
}): BondingCurveModel {
  return {
    curveType: CurveType.LINEAR,
    reserveRatio: 1,
    initialPrice: params.intercept,
    calculatePrice: (supply) => params.slope * supply + params.intercept,
    calculateSupply: (price) => (price - params.intercept) / params.slope,
  };
}

function createExponentialCurve(params: {
  base: number;
  scale: number;
}): BondingCurveModel {
  return {
    curveType: CurveType.EXPONENTIAL,
    reserveRatio: 0.5,
    initialPrice: params.scale,
    calculatePrice: (supply) => params.scale * Math.pow(params.base, supply),
    calculateSupply: (price) => Math.log(price / params.scale) / Math.log(params.base),
  };
}

function createLogarithmicCurve(params: {
  scale: number;
  offset: number;
}): BondingCurveModel {
  return {
    curveType: CurveType.LOGARITHMIC,
    reserveRatio: 0.8,
    initialPrice: params.offset,
    calculatePrice: (supply) => params.scale * Math.log(supply + 1) + params.offset,
    calculateSupply: (price) => Math.exp((price - params.offset) / params.scale) - 1,
  };
}

function createSigmoidCurve(params: {
  midpoint: number;
  steepness: number;
  minPrice: number;
  maxPrice: number;
}): BondingCurveModel {
  return {
    curveType: CurveType.SIGMOID,
    reserveRatio: 0.5,
    initialPrice: params.minPrice,
    calculatePrice: (supply) => {
      const sigmoid = 1 / (1 + Math.exp(-params.steepness * (supply - params.midpoint)));
      return params.minPrice + sigmoid * (params.maxPrice - params.minPrice);
    },
    calculateSupply: (price) => {
      const normalized = (price - params.minPrice) / (params.maxPrice - params.minPrice);
      return params.midpoint - Math.log((1 / normalized) - 1) / params.steepness;
    },
  };
}

// Calculate buy/sell amounts with slippage
export function calculateBuy(
  curve: BondingCurveModel,
  currentSupply: number,
  amountIn: number
): { tokensOut: number; avgPrice: number; slippage: number } {
  const startPrice = curve.calculatePrice(currentSupply);

  // Integrate curve to find tokens out
  let tokensOut = 0;
  let totalCost = 0;
  const steps = 1000;
  const dx = amountIn / steps;

  for (let i = 0; i < steps; i++) {
    const supply = currentSupply + tokensOut;
    const price = curve.calculatePrice(supply);
    const dt = dx / price;
    tokensOut += dt;
    totalCost += dx;
  }

  const avgPrice = totalCost / tokensOut;
  const endPrice = curve.calculatePrice(currentSupply + tokensOut);
  const slippage = ((endPrice - startPrice) / startPrice) * 100;

  return { tokensOut, avgPrice, slippage };
}
```

### 4. Deflationary Mechanics

```typescript
// models/deflationary.ts
export interface DeflationaryModel {
  burnRate: number; // % per transaction
  buybackRate: number; // % of fees
  burnSchedule: BurnSchedule[];
  projectedSupply: (years: number) => number[];
}

export interface BurnSchedule {
  trigger: 'transaction' | 'time' | 'milestone';
  amount: number;
  condition?: string;
}

export function createDeflationaryModel(
  transactionBurnRate: number,
  buybackBurnRate: number
): DeflationaryModel {
  return {
    burnRate: transactionBurnRate,
    buybackRate: buybackBurnRate,
    burnSchedule: [],
    projectedSupply: (years: number) => {
      // Model supply reduction over time
      const supplies: number[] = [];
      let currentSupply = 1_000_000_000;

      // Assume average daily transactions
      const avgDailyTxs = 10000;
      const avgTxAmount = 100;

      for (let year = 0; year < years; year++) {
        const dailyBurn = avgDailyTxs * avgTxAmount * (transactionBurnRate / 100);
        const annualBurn = dailyBurn * 365;
        currentSupply -= annualBurn;
        supplies.push(currentSupply);
      }

      return supplies;
    },
  };
}

// Example: 2% transaction burn
export const DEFLATIONARY_MODEL = createDeflationaryModel(
  2.0,  // 2% burn per transaction
  0.5   // 0.5% of fees to buyback & burn
);
```

## Vesting Implementation

```typescript
// lib/vesting-contract.ts
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createTransferInstruction } from '@solana/spl-token';

export interface VestingConfig {
  recipient: PublicKey;
  mint: PublicKey;
  totalAmount: bigint;
  startTime: number; // Unix timestamp
  cliffMonths: number;
  durationMonths: number;
  linear: boolean;
}

export class VestingSchedule {
  constructor(
    public config: VestingConfig,
    private connection: Connection
  ) {}

  /**
   * Calculate vested amount at given timestamp
   */
  calculateVested(timestamp: number): bigint {
    const { totalAmount, startTime, cliffMonths, durationMonths, linear } = this.config;

    // Before cliff
    const cliffEnd = startTime + cliffMonths * 30 * 24 * 60 * 60;
    if (timestamp < cliffEnd) {
      return 0n;
    }

    // After full vesting period
    const vestingEnd = startTime + durationMonths * 30 * 24 * 60 * 60;
    if (timestamp >= vestingEnd) {
      return totalAmount;
    }

    if (linear) {
      // Linear vesting
      const elapsed = timestamp - startTime;
      const total = durationMonths * 30 * 24 * 60 * 60;
      const ratio = elapsed / total;
      return BigInt(Math.floor(Number(totalAmount) * ratio));
    } else {
      // Cliff vesting (100% after cliff)
      return totalAmount;
    }
  }

  /**
   * Calculate claimable amount (vested - claimed)
   */
  async calculateClaimable(claimed: bigint): Promise<bigint> {
    const now = Math.floor(Date.now() / 1000);
    const vested = this.calculateVested(now);
    return vested - claimed;
  }

  /**
   * Generate vesting visualization
   */
  generateChart(months: number): { month: number; vested: number }[] {
    const startTime = this.config.startTime;
    const chart: { month: number; vested: number }[] = [];

    for (let month = 0; month <= months; month++) {
      const timestamp = startTime + month * 30 * 24 * 60 * 60;
      const vested = this.calculateVested(timestamp);
      chart.push({
        month,
        vested: Number(vested),
      });
    }

    return chart;
  }
}

// Example vesting schedules
export const TEAM_VESTING: VestingConfig = {
  recipient: PublicKey.default,
  mint: PublicKey.default,
  totalAmount: 200_000_000n,
  startTime: Date.now() / 1000,
  cliffMonths: 12,
  durationMonths: 48,
  linear: true,
};

export const INVESTOR_VESTING: VestingConfig = {
  recipient: PublicKey.default,
  mint: PublicKey.default,
  totalAmount: 150_000_000n,
  startTime: Date.now() / 1000,
  cliffMonths: 6,
  durationMonths: 24,
  linear: true,
};
```

## Token Utility Frameworks

```typescript
// models/token-utility.ts
export enum UtilityType {
  GOVERNANCE = 'GOVERNANCE',
  FEE_DISCOUNT = 'FEE_DISCOUNT',
  STAKING_REWARDS = 'STAKING_REWARDS',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  REVENUE_SHARE = 'REVENUE_SHARE',
  LIQUIDITY_MINING = 'LIQUIDITY_MINING',
}

export interface TokenUtility {
  type: UtilityType;
  description: string;
  implementation: string;
  valueAccrual: number; // 0-100 score
}

export interface UtilityFramework {
  primary: TokenUtility[];
  secondary: TokenUtility[];
  calculateValue: (tokenAmount: number) => UtilityValue;
}

export interface UtilityValue {
  votingPower: number;
  feeDiscount: number; // %
  stakingAPY: number; // %
  accessLevel: number; // 0-100
  revenueShare: number; // %
}

export function createUtilityFramework(
  utilities: TokenUtility[]
): UtilityFramework {
  return {
    primary: utilities.filter(u => u.valueAccrual >= 70),
    secondary: utilities.filter(u => u.valueAccrual < 70),
    calculateValue: (tokenAmount: number) => {
      // Calculate utility value based on token holdings
      return {
        votingPower: tokenAmount,
        feeDiscount: Math.min(50, tokenAmount / 10000),
        stakingAPY: 15 + Math.log(tokenAmount) / 10,
        accessLevel: Math.min(100, tokenAmount / 1000),
        revenueShare: Math.min(10, tokenAmount / 100000),
      };
    },
  };
}

// Example: DeFi protocol token utility
export const DEFI_UTILITY: UtilityFramework = createUtilityFramework([
  {
    type: UtilityType.GOVERNANCE,
    description: '1 token = 1 vote on protocol parameters',
    implementation: 'On-chain governance via SPL Governance',
    valueAccrual: 90,
  },
  {
    type: UtilityType.FEE_DISCOUNT,
    description: 'Up to 50% discount on trading fees',
    implementation: 'Tiered system: 10k tokens = 10%, 100k = 30%, 1M = 50%',
    valueAccrual: 80,
  },
  {
    type: UtilityType.STAKING_REWARDS,
    description: 'Earn 15-25% APY on staked tokens',
    implementation: 'Staking contract with dynamic APY based on TVL',
    valueAccrual: 85,
  },
  {
    type: UtilityType.REVENUE_SHARE,
    description: 'Share of protocol revenue distributed to stakers',
    implementation: '30% of fees distributed proportionally',
    valueAccrual: 95,
  },
]);
```

## Economic Modeling

```typescript
// models/economic-simulator.ts
export interface MarketConditions {
  userGrowthRate: number; // % per month
  tradingVolume: number; // daily average
  priceVolatility: number; // %
  competitorTokens: number;
}

export interface SimulationResult {
  month: number;
  price: number;
  marketCap: number;
  holders: number;
  dailyVolume: number;
  liquidityDepth: number;
}

export class EconomicSimulator {
  constructor(
    private tokenomics: any,
    private initialConditions: MarketConditions
  ) {}

  /**
   * Run Monte Carlo simulation
   */
  simulate(months: number, iterations: number = 1000): SimulationResult[] {
    const results: SimulationResult[][] = [];

    for (let i = 0; i < iterations; i++) {
      results.push(this.runSimulation(months));
    }

    // Average results
    return this.averageResults(results);
  }

  private runSimulation(months: number): SimulationResult[] {
    const results: SimulationResult[] = [];
    let price = 0.01; // Starting price
    let holders = 100;
    let volume = 10000;
    let liquidity = 100000;

    for (let month = 0; month < months; month++) {
      // User growth
      holders *= 1 + this.randomize(this.initialConditions.userGrowthRate / 100);

      // Volume growth
      volume *= 1 + this.randomize(0.2);

      // Price movement (simplified)
      const buyPressure = holders * 10;
      const sellPressure = volume * 0.1;
      const netPressure = buyPressure - sellPressure;
      price *= 1 + netPressure / liquidity;

      // Add volatility
      price *= 1 + this.randomize(this.initialConditions.priceVolatility / 100);

      // Liquidity grows with volume
      liquidity += volume * 0.01;

      results.push({
        month,
        price,
        marketCap: price * 1_000_000_000,
        holders,
        dailyVolume: volume,
        liquidityDepth: liquidity,
      });
    }

    return results;
  }

  private randomize(value: number): number {
    // Add +/- 20% randomness
    return value * (0.8 + Math.random() * 0.4);
  }

  private averageResults(results: SimulationResult[][]): SimulationResult[] {
    const averaged: SimulationResult[] = [];
    const months = results[0].length;

    for (let month = 0; month < months; month++) {
      const monthData = results.map(r => r[month]);
      averaged.push({
        month,
        price: this.average(monthData.map(d => d.price)),
        marketCap: this.average(monthData.map(d => d.marketCap)),
        holders: this.average(monthData.map(d => d.holders)),
        dailyVolume: this.average(monthData.map(d => d.dailyVolume)),
        liquidityDepth: this.average(monthData.map(d => d.liquidityDepth)),
      });
    }

    return averaged;
  }

  private average(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
```

## Distribution Strategies

```typescript
// strategies/distribution.ts
export enum DistributionMethod {
  AIRDROP = 'AIRDROP',
  LIQUIDITY_BOOTSTRAP = 'LIQUIDITY_BOOTSTRAP',
  FAIR_LAUNCH = 'FAIR_LAUNCH',
  ISPO = 'ISPO', // Initial Stake Pool Offering
  DUTCH_AUCTION = 'DUTCH_AUCTION',
}

export interface DistributionStrategy {
  method: DistributionMethod;
  allocation: number; // tokens
  duration: number; // days
  eligibilityCriteria: string[];
  antiSybil: boolean;
  vestingRequired: boolean;
}

// Airdrop strategy
export const AIRDROP_STRATEGY: DistributionStrategy = {
  method: DistributionMethod.AIRDROP,
  allocation: 100_000_000,
  duration: 7,
  eligibilityCriteria: [
    'Held NFT from collection X',
    'Made at least 5 transactions',
    'Account age > 6 months',
  ],
  antiSybil: true,
  vestingRequired: false,
};

// Liquidity Bootstrap Pool
export const LBP_STRATEGY: DistributionStrategy = {
  method: DistributionMethod.LIQUIDITY_BOOTSTRAP,
  allocation: 50_000_000,
  duration: 3,
  eligibilityCriteria: ['Anyone can participate'],
  antiSybil: false,
  vestingRequired: false,
};

// Fair Launch
export const FAIR_LAUNCH_STRATEGY: DistributionStrategy = {
  method: DistributionMethod.FAIR_LAUNCH,
  allocation: 1_000_000_000,
  duration: 1,
  eligibilityCriteria: ['First come first served', 'Max per wallet enforced'],
  antiSybil: true,
  vestingRequired: false,
};
```

## Incentive Mechanisms

```typescript
// mechanisms/incentives.ts
export interface IncentiveMechanism {
  name: string;
  targetBehavior: string;
  rewardFormula: (action: any) => number;
  cooldown: number; // seconds
  maxRewardPerUser: number;
}

// Liquidity mining incentive
export const LIQUIDITY_MINING: IncentiveMechanism = {
  name: 'Liquidity Mining',
  targetBehavior: 'Provide liquidity to AMM pools',
  rewardFormula: (action: { lpTokens: number; duration: number }) => {
    // Reward = LP tokens * time * APY
    const apyPerSecond = 0.20 / (365 * 24 * 60 * 60);
    return action.lpTokens * action.duration * apyPerSecond;
  },
  cooldown: 0,
  maxRewardPerUser: 1_000_000,
};

// Trading incentive
export const TRADING_REWARDS: IncentiveMechanism = {
  name: 'Trading Rewards',
  targetBehavior: 'Execute trades on the platform',
  rewardFormula: (action: { volume: number; fee: number }) => {
    // Reward = 50% of fees paid back in tokens
    return action.fee * 0.5;
  },
  cooldown: 0,
  maxRewardPerUser: 500_000,
};

// Governance participation
export const GOVERNANCE_REWARDS: IncentiveMechanism = {
  name: 'Governance Participation',
  targetBehavior: 'Vote on proposals',
  rewardFormula: (action: { votingPower: number }) => {
    // Fixed reward per vote
    return Math.min(100, action.votingPower / 1000);
  },
  cooldown: 24 * 60 * 60, // 1 day
  maxRewardPerUser: 10_000,
};
```

## Game Theory Analysis

```typescript
// analysis/game-theory.ts
export interface GameTheoryScenario {
  name: string;
  actors: string[];
  payoffMatrix: number[][];
  nashEquilibrium: string;
  dominantStrategy?: string;
}

// Liquidity provision game
export const LP_GAME: GameTheoryScenario = {
  name: 'Liquidity Provider Dilemma',
  actors: ['Early LP', 'Late LP', 'No LP'],
  payoffMatrix: [
    [50, 70, 100],  // Early LP payoffs
    [30, 40, 60],   // Late LP payoffs
    [0, 0, 0],      // No LP payoffs
  ],
  nashEquilibrium: 'Early LP',
  dominantStrategy: 'Provide liquidity early',
};

// Staking game
export const STAKING_GAME: GameTheoryScenario = {
  name: 'Staking vs Trading',
  actors: ['Stake', 'Trade', 'Hold'],
  payoffMatrix: [
    [15, 10, 5],   // Stake payoffs (APY)
    [-20, 30, 0],  // Trade payoffs (risky)
    [0, 0, 0],     // Hold payoffs
  ],
  nashEquilibrium: 'Stake',
  dominantStrategy: 'Stake for long-term',
};

// Calculate expected value
export function calculateExpectedValue(
  scenario: GameTheoryScenario,
  probabilities: number[]
): number {
  let ev = 0;
  for (let i = 0; i < scenario.payoffMatrix[0].length; i++) {
    ev += scenario.payoffMatrix[0][i] * probabilities[i];
  }
  return ev;
}
```

## Anti-Whale Mechanisms

```typescript
// mechanisms/anti-whale.ts
export interface AntiWhaleMechanism {
  name: string;
  description: string;
  implementation: string;
  effectiveness: number; // 0-100
}

export const ANTI_WHALE_MECHANISMS: AntiWhaleMechanism[] = [
  {
    name: 'Max Transaction Size',
    description: 'Limit single transaction to 0.1% of supply',
    implementation: 'Token program transfer hook',
    effectiveness: 70,
  },
  {
    name: 'Progressive Fee',
    description: 'Higher fees for larger transactions',
    implementation: 'Fee = baseRate + (amount / supply) * 10',
    effectiveness: 80,
  },
  {
    name: 'Holding Period',
    description: 'Minimum 7 day hold before selling',
    implementation: 'Transfer restriction in token metadata',
    effectiveness: 60,
  },
  {
    name: 'Quadratic Voting',
    description: 'Vote cost increases quadratically',
    implementation: 'Cost = votes^2 tokens',
    effectiveness: 90,
  },
  {
    name: 'Per-Wallet Cap',
    description: 'Maximum 1% of supply per wallet',
    implementation: 'Enforced at mint level',
    effectiveness: 75,
  },
];

export function implementAntiWhale(
  mechanism: AntiWhaleMechanism,
  tokenAmount: number,
  supply: number
): { allowed: boolean; fee?: number; reason?: string } {
  const percentage = (tokenAmount / supply) * 100;

  switch (mechanism.name) {
    case 'Max Transaction Size':
      if (percentage > 0.1) {
        return {
          allowed: false,
          reason: `Transaction exceeds 0.1% limit (${percentage.toFixed(4)}%)`,
        };
      }
      return { allowed: true };

    case 'Progressive Fee':
      const baseFee = 0.01;
      const progressiveFee = baseFee + percentage * 0.1;
      return {
        allowed: true,
        fee: progressiveFee,
      };

    default:
      return { allowed: true };
  }
}
```

## Tokenomics Dashboard

```typescript
// dashboard/tokenomics-dashboard.tsx
import { FC } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';

export interface TokenMetrics {
  price: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  holders: number;
  dailyVolume: number;
  liquidity: number;
}

export const TokenomicsDashboard: FC<{ metrics: TokenMetrics }> = ({
  metrics,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {/* Price Card */}
      <MetricCard title="Token Price" value={`$${metrics.price.toFixed(4)}`} />

      {/* Market Cap */}
      <MetricCard
        title="Market Cap"
        value={`$${(metrics.marketCap / 1e6).toFixed(2)}M`}
      />

      {/* Circulating Supply */}
      <MetricCard
        title="Circulating Supply"
        value={`${(metrics.circulatingSupply / 1e6).toFixed(2)}M`}
        subtitle={`${((metrics.circulatingSupply / metrics.totalSupply) * 100).toFixed(1)}% of total`}
      />

      {/* Holders */}
      <MetricCard
        title="Token Holders"
        value={metrics.holders.toLocaleString()}
      />

      {/* Volume */}
      <MetricCard
        title="24h Volume"
        value={`$${(metrics.dailyVolume / 1e3).toFixed(1)}K`}
      />

      {/* Liquidity */}
      <MetricCard
        title="Liquidity"
        value={`$${(metrics.liquidity / 1e6).toFixed(2)}M`}
      />
    </div>
  );
};

const MetricCard: FC<{
  title: string;
  value: string;
  subtitle?: string;
}> = ({ title, value, subtitle }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
    <p className="text-2xl font-bold mb-1">{value}</p>
    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
  </div>
);
```

## Security Considerations

```typescript
// security/tokenomics-security.ts
export interface SecurityCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
}

export function auditTokenomics(model: any): SecurityCheck[] {
  const checks: SecurityCheck[] = [];

  // Check 1: Distribution concentration
  const topHolderShare = 20; // Example: 20%
  if (topHolderShare > 50) {
    checks.push({
      name: 'Distribution Concentration',
      status: 'fail',
      message: 'Top holder owns >50% - severe centralization risk',
    });
  } else if (topHolderShare > 20) {
    checks.push({
      name: 'Distribution Concentration',
      status: 'warning',
      message: 'Top holder owns >20% - moderate centralization risk',
    });
  } else {
    checks.push({
      name: 'Distribution Concentration',
      status: 'pass',
      message: 'Healthy distribution',
    });
  }

  // Check 2: Liquidity depth
  const liquidityRatio = 0.05; // 5% of market cap
  if (liquidityRatio < 0.02) {
    checks.push({
      name: 'Liquidity Depth',
      status: 'fail',
      message: 'Liquidity <2% of market cap - high slippage risk',
    });
  } else if (liquidityRatio < 0.05) {
    checks.push({
      name: 'Liquidity Depth',
      status: 'warning',
      message: 'Liquidity <5% of market cap - moderate slippage',
    });
  } else {
    checks.push({
      name: 'Liquidity Depth',
      status: 'pass',
      message: 'Adequate liquidity',
    });
  }

  // Check 3: Vesting schedules
  const hasTeamVesting = true;
  if (!hasTeamVesting) {
    checks.push({
      name: 'Team Vesting',
      status: 'fail',
      message: 'No team vesting - dump risk',
    });
  } else {
    checks.push({
      name: 'Team Vesting',
      status: 'pass',
      message: 'Team tokens are vested',
    });
  }

  // Check 4: Mint authority
  const mintAuthority = null;
  if (mintAuthority) {
    checks.push({
      name: 'Mint Authority',
      status: 'warning',
      message: 'Mint authority still active - inflation risk',
    });
  } else {
    checks.push({
      name: 'Mint Authority',
      status: 'pass',
      message: 'Mint authority revoked',
    });
  }

  return checks;
}
```

## Best Practices

1. **Align Incentives**: Token utility should benefit both holders and protocol
2. **Vest Team Tokens**: Minimum 2-4 year vesting with 6-12 month cliff
3. **Anti-Whale Measures**: Protect against manipulation
4. **Transparent Metrics**: Public dashboards and on-chain data
5. **Sustainable Rewards**: Ensure incentives don't drain treasury
6. **Iterative Design**: Start simple, add complexity gradually
7. **Community Input**: Governance over key parameters
8. **Stress Testing**: Model various market scenarios
9. **Legal Compliance**: Consult lawyers on securities law
10. **Fair Launch**: Consider alternatives to VC-heavy models

## Key Metrics to Track

```typescript
// metrics/kpis.ts
export interface TokenKPIs {
  // Price & Market
  price: number;
  marketCap: number;
  fullyDilutedValuation: number;
  priceChange24h: number;

  // Supply
  circulatingSupply: number;
  totalSupply: number;
  burnedTokens: number;
  lockedTokens: number;

  // Holders
  totalHolders: number;
  activeHolders: number; // Transacted in last 30 days
  whaleConcentration: number; // % held by top 10
  giniCoefficient: number; // 0-1, distribution inequality

  // Trading
  volume24h: number;
  trades24h: number;
  avgTradeSize: number;
  volumeChange24h: number;

  // Liquidity
  totalLiquidity: number;
  liquidityRatio: number; // Liquidity / Market Cap
  slippage1k: number; // Slippage for $1k trade

  // Utility
  stakingRatio: number; // % of supply staked
  governanceParticipation: number; // % of holders who voted
  utilityScore: number; // Composite metric

  // Health
  velocityRatio: number; // Volume / Market Cap
  holderGrowthRate: number; // % per month
  sustainabilityScore: number; // 0-100
}
```

## Common Pitfalls

1. **Over-complexity**: Start simple, add features gradually
2. **Misaligned incentives**: Token should benefit from protocol success
3. **Unsustainable rewards**: >100% APY can't last
4. **Poor distribution**: 80% to team/investors = failure
5. **No utility**: "Governance token" alone isn't enough
6. **Weak liquidity**: <2% of market cap is dangerous
7. **No burn mechanism**: Pure inflation often fails
8. **Whale dominance**: Top 10 holders >50% is risky
9. **Short vesting**: <2 years for team is red flag
10. **Ignoring game theory**: Model adversarial behavior

## Key Takeaways

1. **Tokenomics is hard**: Most projects get it wrong
2. **Align incentives**: Long-term value creation for all stakeholders
3. **Model extensively**: Use simulators and stress tests
4. **Start conservative**: Easy to add utility, hard to remove
5. **Fair distribution**: Community >50% is ideal
6. **Vest appropriately**: Longer is better for trust
7. **Build utility first**: Speculation won't sustain
8. **Monitor metrics**: Track KPIs religiously
9. **Iterate carefully**: Governance for major changes
10. **Learn from failures**: Study what didn't work and why
