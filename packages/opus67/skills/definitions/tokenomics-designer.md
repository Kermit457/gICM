# Tokenomics Designer

> **ID:** `tokenomics-designer`
> **Tier:** 3
> **Token Cost:** 7000
> **MCP Connections:** birdeye

## What This Skill Does

Complete tokenomics modeling including distribution schedules, vesting contracts, inflation/deflation mechanics, incentive structures, and economic simulations. Covers Solana SPL token creation, vesting program implementation, and production tokenomics patterns.

## When to Use

This skill is automatically loaded when:

- **Keywords:** tokenomics, vesting, distribution, inflation, allocation, supply, emission
- **File Types:** .rs, .ts, .tsx
- **Directories:** programs/, tokenomics/, contracts/

---

## Core Capabilities

### 1. Token Distribution Schedules

Design and implement token distribution with multiple stakeholder allocations.

**Distribution Model:**

```typescript
interface TokenDistribution {
  totalSupply: number;
  allocations: Allocation[];
  vestingSchedules: VestingSchedule[];
}

interface Allocation {
  name: string;
  percentage: number;
  tokens: number;
  vestingId?: string;
  description: string;
}

interface VestingSchedule {
  id: string;
  name: string;
  cliffMonths: number;
  vestingMonths: number;
  tgePercent: number;
}

const STANDARD_DISTRIBUTION: TokenDistribution = {
  totalSupply: 1_000_000_000,
  allocations: [
    {
      name: 'Community & Ecosystem',
      percentage: 40,
      tokens: 400_000_000,
      vestingId: 'community',
      description: 'Airdrops, grants, partnerships',
    },
    {
      name: 'Team & Advisors',
      percentage: 15,
      tokens: 150_000_000,
      vestingId: 'team',
      description: '4-year vesting with 1-year cliff',
    },
    {
      name: 'Investors',
      percentage: 20,
      tokens: 200_000_000,
      vestingId: 'investor',
      description: 'Seed and private rounds',
    },
    {
      name: 'Treasury',
      percentage: 15,
      tokens: 150_000_000,
      vestingId: 'treasury',
      description: 'Protocol-owned liquidity and reserves',
    },
    {
      name: 'Liquidity',
      percentage: 10,
      tokens: 100_000_000,
      description: 'DEX liquidity provision',
    },
  ],
  vestingSchedules: [
    {
      id: 'team',
      name: 'Team Vesting',
      cliffMonths: 12,
      vestingMonths: 48,
      tgePercent: 0,
    },
    {
      id: 'investor',
      name: 'Investor Vesting',
      cliffMonths: 6,
      vestingMonths: 24,
      tgePercent: 10,
    },
    {
      id: 'community',
      name: 'Community Vesting',
      cliffMonths: 0,
      vestingMonths: 36,
      tgePercent: 5,
    },
    {
      id: 'treasury',
      name: 'Treasury Vesting',
      cliffMonths: 0,
      vestingMonths: 48,
      tgePercent: 0,
    },
  ],
};
```

**Emission Calculator:**

```typescript
interface EmissionSchedule {
  month: number;
  newTokens: number;
  cumulativeTokens: number;
  circulatingPercent: number;
}

function calculateEmissionSchedule(
  distribution: TokenDistribution,
  months: number = 48
): EmissionSchedule[] {
  const schedule: EmissionSchedule[] = [];
  let cumulative = 0;

  for (let month = 0; month <= months; month++) {
    let monthlyEmission = 0;

    for (const allocation of distribution.allocations) {
      const vesting = distribution.vestingSchedules.find(
        v => v.id === allocation.vestingId
      );

      if (!vesting) {
        if (month === 0) {
          monthlyEmission += allocation.tokens;
        }
        continue;
      }

      if (month === 0) {
        monthlyEmission += allocation.tokens * (vesting.tgePercent / 100);
      } else if (month > vesting.cliffMonths && month <= vesting.cliffMonths + vesting.vestingMonths) {
        const remainingTokens = allocation.tokens * (1 - vesting.tgePercent / 100);
        monthlyEmission += remainingTokens / vesting.vestingMonths;
      }
    }

    cumulative += monthlyEmission;

    schedule.push({
      month,
      newTokens: Math.round(monthlyEmission),
      cumulativeTokens: Math.round(cumulative),
      circulatingPercent: (cumulative / distribution.totalSupply) * 100,
    });
  }

  return schedule;
}
```

**Visualization Data:**

```typescript
interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
  }>;
}

function generateStackedChartData(
  distribution: TokenDistribution,
  months: number = 48
): ChartData {
  const labels = Array.from({ length: months + 1 }, (_, i) => 'Month ' + i);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const datasets = distribution.allocations.map((allocation, index) => {
    const data: number[] = [];

    for (let month = 0; month <= months; month++) {
      const vesting = distribution.vestingSchedules.find(
        v => v.id === allocation.vestingId
      );

      let unlocked = 0;

      if (!vesting) {
        unlocked = month >= 0 ? allocation.tokens : 0;
      } else {
        if (month === 0) {
          unlocked = allocation.tokens * (vesting.tgePercent / 100);
        } else if (month <= vesting.cliffMonths) {
          unlocked = allocation.tokens * (vesting.tgePercent / 100);
        } else {
          const monthsVested = Math.min(month - vesting.cliffMonths, vesting.vestingMonths);
          const vestedPercent = monthsVested / vesting.vestingMonths;
          const remainingTokens = allocation.tokens * (1 - vesting.tgePercent / 100);
          unlocked = allocation.tokens * (vesting.tgePercent / 100) + remainingTokens * vestedPercent;
        }
      }

      data.push(Math.round(unlocked));
    }

    return {
      label: allocation.name,
      data,
      backgroundColor: colors[index % colors.length],
    };
  });

  return { labels, datasets };
}
```

---

### 2. Vesting Contracts

Implement on-chain vesting with Anchor framework.

**Anchor Vesting Program:**

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("VestingProgram111111111111111111111111111");

#[program]
pub mod vesting {
    use super::*;

    pub fn create_vesting_schedule(
        ctx: Context<CreateVestingSchedule>,
        total_amount: u64,
        start_timestamp: i64,
        cliff_seconds: i64,
        duration_seconds: i64,
        tge_amount: u64,
    ) -> Result<()> {
        let vesting = &mut ctx.accounts.vesting_account;

        vesting.beneficiary = ctx.accounts.beneficiary.key();
        vesting.mint = ctx.accounts.mint.key();
        vesting.total_amount = total_amount;
        vesting.released_amount = 0;
        vesting.start_timestamp = start_timestamp;
        vesting.cliff_timestamp = start_timestamp + cliff_seconds;
        vesting.end_timestamp = start_timestamp + cliff_seconds + duration_seconds;
        vesting.tge_amount = tge_amount;
        vesting.is_revocable = true;
        vesting.is_revoked = false;
        vesting.bump = *ctx.bumps.get("vesting_account").unwrap();

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.depositor_token_account.to_account_info(),
                    to: ctx.accounts.vesting_token_account.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            total_amount,
        )?;

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let vesting = &mut ctx.accounts.vesting_account;
        let clock = Clock::get()?;

        require!(!vesting.is_revoked, VestingError::VestingRevoked);

        let vested_amount = calculate_vested_amount(vesting, clock.unix_timestamp);
        let claimable = vested_amount - vesting.released_amount;

        require!(claimable > 0, VestingError::NothingToClaim);

        vesting.released_amount += claimable;

        let seeds = &[
            b"vesting".as_ref(),
            vesting.beneficiary.as_ref(),
            vesting.mint.as_ref(),
            &[vesting.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vesting_token_account.to_account_info(),
                    to: ctx.accounts.beneficiary_token_account.to_account_info(),
                    authority: ctx.accounts.vesting_account.to_account_info(),
                },
                signer,
            ),
            claimable,
        )?;

        Ok(())
    }

    pub fn revoke(ctx: Context<Revoke>) -> Result<()> {
        let vesting = &mut ctx.accounts.vesting_account;
        let clock = Clock::get()?;

        require!(vesting.is_revocable, VestingError::NotRevocable);
        require!(!vesting.is_revoked, VestingError::AlreadyRevoked);

        let vested_amount = calculate_vested_amount(vesting, clock.unix_timestamp);
        let unvested = vesting.total_amount - vested_amount;

        vesting.is_revoked = true;

        if unvested > 0 {
            let seeds = &[
                b"vesting".as_ref(),
                vesting.beneficiary.as_ref(),
                vesting.mint.as_ref(),
                &[vesting.bump],
            ];
            let signer = &[&seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vesting_token_account.to_account_info(),
                        to: ctx.accounts.admin_token_account.to_account_info(),
                        authority: ctx.accounts.vesting_account.to_account_info(),
                    },
                    signer,
                ),
                unvested,
            )?;
        }

        Ok(())
    }
}

fn calculate_vested_amount(vesting: &VestingAccount, current_timestamp: i64) -> u64 {
    if current_timestamp < vesting.start_timestamp {
        return 0;
    }

    if current_timestamp < vesting.cliff_timestamp {
        return vesting.tge_amount;
    }

    if current_timestamp >= vesting.end_timestamp {
        return vesting.total_amount;
    }

    let vesting_duration = vesting.end_timestamp - vesting.cliff_timestamp;
    let time_vested = current_timestamp - vesting.cliff_timestamp;
    let linear_vested = vesting.total_amount - vesting.tge_amount;

    let vested = vesting.tge_amount + (linear_vested * time_vested as u64 / vesting_duration as u64);

    vested
}

#[derive(Accounts)]
pub struct CreateVestingSchedule<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    pub beneficiary: SystemAccount<'info>,

    pub mint: Account<'info, token::Mint>,

    #[account(
        init,
        payer = depositor,
        space = 8 + VestingAccount::INIT_SPACE,
        seeds = [b"vesting", beneficiary.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(
        init,
        payer = depositor,
        token::mint = mint,
        token::authority = vesting_account,
    )]
    pub vesting_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    pub beneficiary: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vesting", beneficiary.key().as_ref(), vesting_account.mint.as_ref()],
        bump = vesting_account.bump,
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(mut)]
    pub vesting_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub beneficiary_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Revoke<'info> {
    pub admin: Signer<'info>,

    #[account(mut)]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(mut)]
    pub vesting_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct VestingAccount {
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub total_amount: u64,
    pub released_amount: u64,
    pub start_timestamp: i64,
    pub cliff_timestamp: i64,
    pub end_timestamp: i64,
    pub tge_amount: u64,
    pub is_revocable: bool,
    pub is_revoked: bool,
    pub bump: u8,
}

#[error_code]
pub enum VestingError {
    #[msg("Vesting has been revoked")]
    VestingRevoked,
    #[msg("Nothing to claim")]
    NothingToClaim,
    #[msg("Vesting is not revocable")]
    NotRevocable,
    #[msg("Vesting already revoked")]
    AlreadyRevoked,
}
```

**TypeScript Client:**

```typescript
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

interface VestingScheduleParams {
  beneficiary: PublicKey;
  mint: PublicKey;
  totalAmount: number;
  startTimestamp: number;
  cliffSeconds: number;
  durationSeconds: number;
  tgeAmount: number;
}

async function createVestingSchedule(
  program: Program,
  depositor: Keypair,
  params: VestingScheduleParams
): Promise<string> {
  const [vestingAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('vesting'),
      params.beneficiary.toBuffer(),
      params.mint.toBuffer(),
    ],
    program.programId
  );

  const tx = await program.methods
    .createVestingSchedule(
      new BN(params.totalAmount),
      new BN(params.startTimestamp),
      new BN(params.cliffSeconds),
      new BN(params.durationSeconds),
      new BN(params.tgeAmount)
    )
    .accounts({
      depositor: depositor.publicKey,
      beneficiary: params.beneficiary,
      mint: params.mint,
      vestingAccount,
    })
    .signers([depositor])
    .rpc();

  return tx;
}

async function claimVestedTokens(
  program: Program,
  beneficiary: Keypair,
  mint: PublicKey
): Promise<string> {
  const [vestingAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('vesting'),
      beneficiary.publicKey.toBuffer(),
      mint.toBuffer(),
    ],
    program.programId
  );

  const tx = await program.methods
    .claim()
    .accounts({
      beneficiary: beneficiary.publicKey,
      vestingAccount,
    })
    .signers([beneficiary])
    .rpc();

  return tx;
}

async function getVestingInfo(
  program: Program,
  beneficiary: PublicKey,
  mint: PublicKey
): Promise<{
  totalAmount: number;
  releasedAmount: number;
  claimableAmount: number;
  vestedPercent: number;
}> {
  const [vestingAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('vesting'), beneficiary.toBuffer(), mint.toBuffer()],
    program.programId
  );

  const account = await program.account.vestingAccount.fetch(vestingAccount);
  const now = Math.floor(Date.now() / 1000);

  let vestedAmount: number;

  if (now < account.startTimestamp.toNumber()) {
    vestedAmount = 0;
  } else if (now < account.cliffTimestamp.toNumber()) {
    vestedAmount = account.tgeAmount.toNumber();
  } else if (now >= account.endTimestamp.toNumber()) {
    vestedAmount = account.totalAmount.toNumber();
  } else {
    const vestingDuration = account.endTimestamp.toNumber() - account.cliffTimestamp.toNumber();
    const timeVested = now - account.cliffTimestamp.toNumber();
    const linearVested = account.totalAmount.toNumber() - account.tgeAmount.toNumber();
    vestedAmount = account.tgeAmount.toNumber() + Math.floor(linearVested * timeVested / vestingDuration);
  }

  const claimableAmount = vestedAmount - account.releasedAmount.toNumber();

  return {
    totalAmount: account.totalAmount.toNumber(),
    releasedAmount: account.releasedAmount.toNumber(),
    claimableAmount,
    vestedPercent: (vestedAmount / account.totalAmount.toNumber()) * 100,
  };
}
```

---

### 3. Inflation/Deflation Mechanics

Model and implement token supply dynamics.

**Inflation Model:**

```typescript
interface InflationParams {
  initialRate: number;
  terminalRate: number;
  decayRate: number;
}

function calculateInflationRate(
  params: InflationParams,
  year: number
): number {
  const { initialRate, terminalRate, decayRate } = params;

  const rate = terminalRate + (initialRate - terminalRate) * Math.exp(-decayRate * year);
  return rate;
}

function projectSupply(
  initialSupply: number,
  inflationParams: InflationParams,
  years: number
): Array<{ year: number; supply: number; inflationRate: number }> {
  const projections = [];
  let currentSupply = initialSupply;

  for (let year = 0; year <= years; year++) {
    const inflationRate = calculateInflationRate(inflationParams, year);
    const newTokens = currentSupply * inflationRate;

    projections.push({
      year,
      supply: Math.round(currentSupply),
      inflationRate: inflationRate * 100,
    });

    currentSupply += newTokens;
  }

  return projections;
}
```

**Deflation Mechanisms:**

```typescript
interface DeflationMechanism {
  type: 'burn' | 'buyback' | 'fee';
  rate: number;
  source: string;
  description: string;
}

const DEFLATION_MECHANISMS: DeflationMechanism[] = [
  {
    type: 'burn',
    rate: 0.5,
    source: 'transaction_fees',
    description: '0.5% of transaction fees burned',
  },
  {
    type: 'buyback',
    rate: 0.2,
    source: 'protocol_revenue',
    description: '20% of protocol revenue used for buybacks',
  },
];

function calculateNetInflation(
  grossInflation: number,
  deflationRate: number,
  supply: number,
  transactionVolume: number,
  protocolRevenue: number
): number {
  const burnedFromFees = transactionVolume * 0.005;
  const buybackAmount = protocolRevenue * 0.2;
  const totalDeflation = burnedFromFees + buybackAmount;

  const netNewTokens = supply * grossInflation - totalDeflation;
  return netNewTokens / supply;
}
```

**Burn Implementation:**

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token, TokenAccount, Mint};

#[program]
pub mod token_burn {
    use super::*;

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(TokensBurned {
            amount,
            burner: ctx.accounts.authority.key(),
            new_supply: ctx.accounts.mint.supply - amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct TokensBurned {
    pub amount: u64,
    pub burner: Pubkey,
    pub new_supply: u64,
}
```

---

### 4. Incentive Structures

Design staking, rewards, and governance incentives.

**Staking Rewards Model:**

```typescript
interface StakingParams {
  baseApy: number;
  maxApy: number;
  lockupMultipliers: { days: number; multiplier: number }[];
  emissionsPerDay: number;
}

const STAKING_PARAMS: StakingParams = {
  baseApy: 5,
  maxApy: 20,
  lockupMultipliers: [
    { days: 0, multiplier: 1.0 },
    { days: 30, multiplier: 1.25 },
    { days: 90, multiplier: 1.5 },
    { days: 180, multiplier: 2.0 },
    { days: 365, multiplier: 3.0 },
  ],
  emissionsPerDay: 100000,
};

function calculateStakingRewards(
  stakedAmount: number,
  lockupDays: number,
  totalStaked: number,
  params: StakingParams
): { dailyRewards: number; apy: number } {
  const multiplier = params.lockupMultipliers
    .filter(m => lockupDays >= m.days)
    .reduce((max, m) => m.multiplier > max ? m.multiplier : max, 1.0);

  const effectiveStake = stakedAmount * multiplier;
  const shareOfPool = effectiveStake / (totalStaked * 1.5);
  const dailyRewards = params.emissionsPerDay * shareOfPool;

  const annualRewards = dailyRewards * 365;
  const apy = (annualRewards / stakedAmount) * 100;

  return {
    dailyRewards,
    apy: Math.min(apy, params.maxApy),
  };
}
```

**Governance Token Model:**

```typescript
interface GovernanceParams {
  proposalThreshold: number;
  votingPeriodDays: number;
  quorumPercent: number;
  timelockDays: number;
}

interface VotingPower {
  tokenBalance: number;
  stakedBalance: number;
  lockupBonus: number;
  delegatedPower: number;
  totalPower: number;
}

function calculateVotingPower(
  tokenBalance: number,
  stakedBalance: number,
  lockupDays: number,
  delegatedPower: number
): VotingPower {
  const lockupMultiplier = Math.min(1 + lockupDays / 365, 4);
  const lockupBonus = stakedBalance * (lockupMultiplier - 1);

  const totalPower = tokenBalance + stakedBalance + lockupBonus + delegatedPower;

  return {
    tokenBalance,
    stakedBalance,
    lockupBonus,
    delegatedPower,
    totalPower,
  };
}
```

---

## Real-World Examples

### Example 1: Token Launch Configuration

```typescript
interface LaunchConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  distribution: TokenDistribution;
  launchDate: Date;
  initialPrice: number;
  fdv: number;
}

function createLaunchConfig(
  name: string,
  symbol: string,
  totalSupply: number,
  initialPrice: number
): LaunchConfig {
  return {
    name,
    symbol,
    decimals: 9,
    totalSupply,
    distribution: STANDARD_DISTRIBUTION,
    launchDate: new Date(),
    initialPrice,
    fdv: totalSupply * initialPrice,
  };
}

function generateLaunchReport(config: LaunchConfig): string {
  const emissions = calculateEmissionSchedule(config.distribution, 48);

  let report = '# ' + config.name + ' (' + config.symbol + ') Tokenomics\n\n';
  report += '## Overview\n';
  report += '- Total Supply: ' + config.totalSupply.toLocaleString() + '\n';
  report += '- Initial Price: $' + config.initialPrice + '\n';
  report += '- FDV: $' + config.fdv.toLocaleString() + '\n\n';

  report += '## Distribution\n';
  for (const alloc of config.distribution.allocations) {
    report += '- ' + alloc.name + ': ' + alloc.percentage + '% (' + alloc.tokens.toLocaleString() + ' tokens)\n';
  }

  report += '\n## Vesting Schedules\n';
  for (const schedule of config.distribution.vestingSchedules) {
    report += '- ' + schedule.name + ': ' + schedule.cliffMonths + ' month cliff, ' + schedule.vestingMonths + ' month vesting, ' + schedule.tgePercent + '% TGE\n';
  }

  report += '\n## Emission Schedule\n';
  const milestones = [0, 6, 12, 24, 36, 48];
  for (const month of milestones) {
    const data = emissions[month];
    if (data) {
      report += '- Month ' + month + ': ' + data.circulatingPercent.toFixed(1) + '% circulating (' + data.cumulativeTokens.toLocaleString() + ' tokens)\n';
    }
  }

  return report;
}
```

### Example 2: Vesting Dashboard

```tsx
import { useEffect, useState } from 'react';

interface VestingDashboardProps {
  beneficiary: string;
  mint: string;
}

export function VestingDashboard({ beneficiary, mint }: VestingDashboardProps) {
  const [vestingInfo, setVestingInfo] = useState<{
    totalAmount: number;
    releasedAmount: number;
    claimableAmount: number;
    vestedPercent: number;
  } | null>(null);

  useEffect(() => {
    async function loadVestingInfo() {
      const info = await getVestingInfo(
        program,
        new PublicKey(beneficiary),
        new PublicKey(mint)
      );
      setVestingInfo(info);
    }

    loadVestingInfo();
    const interval = setInterval(loadVestingInfo, 60000);
    return () => clearInterval(interval);
  }, [beneficiary, mint]);

  if (!vestingInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Your Vesting</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-100 rounded">
          <div className="text-sm text-gray-600">Total Allocation</div>
          <div className="text-xl font-bold">
            {vestingInfo.totalAmount.toLocaleString()} tokens
          </div>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <div className="text-sm text-gray-600">Vested</div>
          <div className="text-xl font-bold">
            {vestingInfo.vestedPercent.toFixed(1)}%
          </div>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <div className="text-sm text-gray-600">Claimed</div>
          <div className="text-xl font-bold">
            {vestingInfo.releasedAmount.toLocaleString()} tokens
          </div>
        </div>

        <div className="p-4 bg-green-100 rounded">
          <div className="text-sm text-green-600">Claimable Now</div>
          <div className="text-xl font-bold text-green-800">
            {vestingInfo.claimableAmount.toLocaleString()} tokens
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: vestingInfo.vestedPercent + '%' }}
          />
        </div>
      </div>

      <button
        onClick={() => claimVestedTokens(program, wallet, new PublicKey(mint))}
        disabled={vestingInfo.claimableAmount === 0}
        className="w-full p-3 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Claim {vestingInfo.claimableAmount.toLocaleString()} Tokens
      </button>
    </div>
  );
}
```

---

## Testing

```typescript
import { start } from 'solana-bankrun';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('Tokenomics', () => {
  test('should calculate emission schedule correctly', () => {
    const emissions = calculateEmissionSchedule(STANDARD_DISTRIBUTION, 48);

    expect(emissions[0].circulatingPercent).toBeLessThan(20);
    expect(emissions[12].circulatingPercent).toBeGreaterThan(20);
    expect(emissions[48].circulatingPercent).toBeGreaterThan(80);
  });

  test('should calculate staking rewards', () => {
    const rewards = calculateStakingRewards(
      1000000,
      365,
      10000000,
      STAKING_PARAMS
    );

    expect(rewards.apy).toBeGreaterThan(STAKING_PARAMS.baseApy);
    expect(rewards.apy).toBeLessThanOrEqual(STAKING_PARAMS.maxApy);
  });
});
```

---

## Security Considerations

1. **Audit vesting contracts** before deployment
2. **Use timelock for admin functions**
3. **Implement emergency pause** functionality
4. **Verify distribution math** carefully
5. **Consider front-running** in reward claims
6. **Document all tokenomics** publicly

---

## Related Skills

- **solana-deployer** - Deploy token programs
- **smart-contract-auditor** - Audit tokenomics
- **lp-automation** - Liquidity provision

---

## Further Reading

- SPL Token: https://spl.solana.com/token
- Anchor Lang: https://www.anchor-lang.com/
- Token Economics: https://tokenomicshub.xyz/

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
