# Staking Expert - Staking Mechanisms & Rewards

> **ID:** `staking-expert`
> **Tier:** 2 (Domain Expertise)
> **Token Cost:** 6500
> **MCP Connections:** helius, solana
> **Version:** 1.0

## 🎯 What This Skill Does

Master staking mechanism implementation for tokens, NFTs, and liquid staking protocols. This skill covers stake pool creation, reward distribution, validator integration, and liquid staking derivatives with focus on security and capital efficiency.

**Core Capabilities:**
- Token staking programs
- NFT staking and yield generation
- Liquid staking protocols
- Validator stake pool management
- Reward calculation and distribution
- Unstaking and cooldown periods
- Staking derivatives (stSOL, mSOL)
- Auto-compounding strategies

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** staking, stake, validator, delegat, liquid staking, rewards, yield, stake pool
- **File Types:** .ts, .tsx, .rs
- **Directories:** programs/, anchor/

**Use this skill when:**
- Building staking platforms
- Implementing yield farming
- Creating liquid staking protocols
- Managing validator stake pools
- Calculating staking rewards
- Building NFT staking systems
- Implementing auto-compounding

## 🚀 Core Capabilities

### 1. Token Staking Program (Anchor)

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                    Staking Program                       │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Global    │  │     Pool     │  │     User     │  │
│  │    State    │  │     State    │  │    Stake     │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  Stake → Lock Tokens → Earn Rewards → Claim/Compound   │
│     ↓                                         ↓         │
│  Vault                                   User Wallet    │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

```rust
// programs/staking/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("Stake11111111111111111111111111111111111111");

#[program]
pub mod staking {
    use super::*;

    /// Initialize the staking program
    pub fn initialize(
        ctx: Context<Initialize>,
        reward_rate: u64,        // Rewards per second per token (in basis points)
        min_stake_duration: i64, // Minimum staking duration in seconds
        unstake_cooldown: i64,   // Cooldown period for unstaking
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;

        global_state.authority = ctx.accounts.authority.key();
        global_state.reward_mint = ctx.accounts.reward_mint.key();
        global_state.stake_mint = ctx.accounts.stake_mint.key();
        global_state.reward_rate = reward_rate;
        global_state.min_stake_duration = min_stake_duration;
        global_state.unstake_cooldown = unstake_cooldown;
        global_state.total_staked = 0;
        global_state.last_update_time = Clock::get()?.unix_timestamp;
        global_state.bump = *ctx.bumps.get("global_state").unwrap();

        msg!("Staking program initialized");
        msg!("Reward rate: {} basis points per second", reward_rate);

        Ok(())
    }

    /// Create a staking pool
    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_id: u64,
        reward_rate: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        pool.authority = ctx.accounts.authority.key();
        pool.pool_id = pool_id;
        pool.stake_mint = ctx.accounts.stake_mint.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.stake_vault = ctx.accounts.stake_vault.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.reward_rate = reward_rate;
        pool.total_staked = 0;
        pool.total_rewards_distributed = 0;
        pool.last_update_time = Clock::get()?.unix_timestamp;
        pool.bump = *ctx.bumps.get("pool").unwrap();

        Ok(())
    }

    /// Stake tokens
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        let clock = Clock::get()?;
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;

        // Update pool rewards
        update_pool_rewards(pool, clock.unix_timestamp)?;

        // Transfer tokens from user to vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.stake_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        // Update user stake
        if user_stake.staked_amount == 0 {
            // First stake
            user_stake.user = ctx.accounts.user.key();
            user_stake.pool = pool.key();
            user_stake.staked_amount = amount;
            user_stake.stake_timestamp = clock.unix_timestamp;
            user_stake.last_claim_time = clock.unix_timestamp;
            user_stake.pending_rewards = 0;
            user_stake.bump = *ctx.bumps.get("user_stake").unwrap();
        } else {
            // Additional stake - calculate and add pending rewards
            let pending = calculate_pending_rewards(user_stake, pool, clock.unix_timestamp)?;
            user_stake.pending_rewards += pending;
            user_stake.staked_amount += amount;
            user_stake.last_claim_time = clock.unix_timestamp;
        }

        // Update pool
        pool.total_staked += amount;

        msg!("Staked {} tokens", amount);
        msg!("Total staked in pool: {}", pool.total_staked);

        Ok(())
    }

    /// Unstake tokens
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        let clock = Clock::get()?;
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;

        require!(
            user_stake.staked_amount >= amount,
            StakingError::InsufficientStake
        );

        // Check minimum stake duration
        let global_state = &ctx.accounts.global_state;
        let stake_duration = clock.unix_timestamp - user_stake.stake_timestamp;
        require!(
            stake_duration >= global_state.min_stake_duration,
            StakingError::StakeDurationNotMet
        );

        // Update pool rewards
        update_pool_rewards(pool, clock.unix_timestamp)?;

        // Calculate and add pending rewards
        let pending = calculate_pending_rewards(user_stake, pool, clock.unix_timestamp)?;
        user_stake.pending_rewards += pending;

        // Update user stake
        user_stake.staked_amount -= amount;
        user_stake.unstake_timestamp = clock.unix_timestamp;
        user_stake.unstaking_amount = amount;
        user_stake.last_claim_time = clock.unix_timestamp;

        // Update pool
        pool.total_staked -= amount;

        msg!("Initiated unstake of {} tokens", amount);
        msg!("Cooldown period: {} seconds", global_state.unstake_cooldown);

        Ok(())
    }

    /// Withdraw unstaked tokens after cooldown
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let clock = Clock::get()?;
        let global_state = &ctx.accounts.global_state;
        let user_stake = &mut ctx.accounts.user_stake;

        require!(
            user_stake.unstaking_amount > 0,
            StakingError::NoUnstakingTokens
        );

        // Check cooldown period
        let cooldown_elapsed = clock.unix_timestamp - user_stake.unstake_timestamp;
        require!(
            cooldown_elapsed >= global_state.unstake_cooldown,
            StakingError::CooldownNotMet
        );

        let amount = user_stake.unstaking_amount;

        // Transfer tokens from vault to user
        let pool = &ctx.accounts.pool;
        let seeds = &[
            b"pool",
            pool.pool_id.to_le_bytes().as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.stake_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, amount)?;

        // Clear unstaking amount
        user_stake.unstaking_amount = 0;

        msg!("Withdrawn {} tokens", amount);

        Ok(())
    }

    /// Claim rewards
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let clock = Clock::get()?;
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;

        // Update pool rewards
        update_pool_rewards(pool, clock.unix_timestamp)?;

        // Calculate total rewards
        let pending = calculate_pending_rewards(user_stake, pool, clock.unix_timestamp)?;
        let total_rewards = user_stake.pending_rewards + pending;

        require!(total_rewards > 0, StakingError::NoRewards);

        // Transfer rewards from vault to user
        let seeds = &[
            b"pool",
            pool.pool_id.to_le_bytes().as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reward_vault.to_account_info(),
                to: ctx.accounts.user_reward_account.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, total_rewards)?;

        // Update state
        user_stake.pending_rewards = 0;
        user_stake.last_claim_time = clock.unix_timestamp;
        pool.total_rewards_distributed += total_rewards;

        msg!("Claimed {} reward tokens", total_rewards);

        Ok(())
    }

    /// Compound rewards (stake them)
    pub fn compound(ctx: Context<Compound>) -> Result<()> {
        let clock = Clock::get()?;
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;

        // Update pool rewards
        update_pool_rewards(pool, clock.unix_timestamp)?;

        // Calculate total rewards
        let pending = calculate_pending_rewards(user_stake, pool, clock.unix_timestamp)?;
        let total_rewards = user_stake.pending_rewards + pending;

        require!(total_rewards > 0, StakingError::NoRewards);

        // Add rewards to staked amount
        user_stake.staked_amount += total_rewards;
        user_stake.pending_rewards = 0;
        user_stake.last_claim_time = clock.unix_timestamp;

        // Update pool
        pool.total_staked += total_rewards;

        msg!("Compounded {} reward tokens", total_rewards);

        Ok(())
    }
}

// Helper functions
fn update_pool_rewards(pool: &mut Pool, current_time: i64) -> Result<()> {
    if pool.total_staked == 0 {
        pool.last_update_time = current_time;
        return Ok(());
    }

    let time_elapsed = current_time - pool.last_update_time;
    if time_elapsed <= 0 {
        return Ok(());
    }

    pool.last_update_time = current_time;
    Ok(())
}

fn calculate_pending_rewards(
    user_stake: &UserStake,
    pool: &Pool,
    current_time: i64,
) -> Result<u64> {
    if user_stake.staked_amount == 0 {
        return Ok(0);
    }

    let time_elapsed = current_time - user_stake.last_claim_time;
    if time_elapsed <= 0 {
        return Ok(0);
    }

    // Calculate rewards: (staked_amount * reward_rate * time_elapsed) / (10000 * 86400)
    // reward_rate is in basis points per day, so we divide by 10000 and by seconds in a day
    let rewards = (user_stake.staked_amount as u128)
        .checked_mul(pool.reward_rate as u128)
        .unwrap()
        .checked_mul(time_elapsed as u128)
        .unwrap()
        .checked_div(10000 * 86400)
        .unwrap() as u64;

    Ok(rewards)
}

// Account structs
#[account]
pub struct GlobalState {
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub stake_mint: Pubkey,
    pub reward_rate: u64,
    pub min_stake_duration: i64,
    pub unstake_cooldown: i64,
    pub total_staked: u64,
    pub last_update_time: i64,
    pub bump: u8,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub pool_id: u64,
    pub stake_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub stake_vault: Pubkey,
    pub reward_vault: Pubkey,
    pub reward_rate: u64,
    pub total_staked: u64,
    pub total_rewards_distributed: u64,
    pub last_update_time: i64,
    pub bump: u8,
}

#[account]
pub struct UserStake {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub staked_amount: u64,
    pub pending_rewards: u64,
    pub stake_timestamp: i64,
    pub last_claim_time: i64,
    pub unstake_timestamp: i64,
    pub unstaking_amount: u64,
    pub bump: u8,
}

// Context structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    pub reward_mint: Account<'info, Mint>,
    pub stake_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct CreatePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    pub stake_mint: Account<'info, Mint>,
    pub reward_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = stake_mint,
        token::authority = pool,
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = reward_mint,
        token::authority = pool,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub stake_vault: Account<'info, TokenAccount>,

    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump = user_stake.bump
    )]
    pub user_stake: Account<'info, UserStake>,

    pub global_state: Account<'info, GlobalState>,

    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump = user_stake.bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(mut)]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub global_state: Account<'info, GlobalState>,

    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump = user_stake.bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_reward_account: Account<'info, TokenAccount>,

    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Compound<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump = user_stake.bump
    )]
    pub user_stake: Account<'info, UserStake>,

    pub user: Signer<'info>,
}

// Errors
#[error_code]
pub enum StakingError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("Minimum stake duration not met")]
    StakeDurationNotMet,
    #[msg("Cooldown period not met")]
    CooldownNotMet,
    #[msg("No rewards to claim")]
    NoRewards,
    #[msg("No unstaking tokens")]
    NoUnstakingTokens,
}
```

### 2. NFT Staking

```typescript
// packages/nft-staking/src/client.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

export interface NFTStakeConfig {
  programId: PublicKey;
  poolAddress: PublicKey;
  rewardMint: PublicKey;
}

export class NFTStakingClient {
  private connection: Connection;
  private program: Program;

  constructor(connection: Connection, program: Program) {
    this.connection = connection;
    this.program = program;
  }

  /**
   * Stake an NFT
   */
  async stakeNFT(params: {
    nftMint: PublicKey;
    userPublicKey: PublicKey;
  }): Promise<string> {
    const { nftMint, userPublicKey } = params;

    // Get NFT token account
    const nftTokenAccount = await this.getNFTTokenAccount(
      userPublicKey,
      nftMint
    );

    // Create stake instruction
    const tx = await this.program.methods
      .stakeNft()
      .accounts({
        user: userPublicKey,
        nftMint,
        nftTokenAccount,
        // ... other accounts
      })
      .transaction();

    // Send and confirm
    const signature = await this.connection.sendTransaction(tx, []);
    await this.connection.confirmTransaction(signature);

    return signature;
  }

  /**
   * Unstake an NFT
   */
  async unstakeNFT(params: {
    nftMint: PublicKey;
    userPublicKey: PublicKey;
  }): Promise<string> {
    const { nftMint, userPublicKey } = params;

    const tx = await this.program.methods
      .unstakeNft()
      .accounts({
        user: userPublicKey,
        nftMint,
        // ... other accounts
      })
      .transaction();

    const signature = await this.connection.sendTransaction(tx, []);
    await this.connection.confirmTransaction(signature);

    return signature;
  }

  /**
   * Calculate NFT staking rewards
   */
  async calculateRewards(params: {
    nftMint: PublicKey;
    userPublicKey: PublicKey;
  }): Promise<bigint> {
    const { nftMint, userPublicKey } = params;

    const userStake = await this.program.account.userNftStake.fetch(
      await this.getUserStakeAddress(userPublicKey, nftMint)
    );

    const stakeTime = Date.now() / 1000 - userStake.stakeTimestamp.toNumber();
    const rewardRate = 100; // 100 tokens per day

    const rewards = BigInt(
      Math.floor((stakeTime / 86400) * rewardRate * 1e9)
    );

    return rewards;
  }

  private async getNFTTokenAccount(
    owner: PublicKey,
    mint: PublicKey
  ): Promise<PublicKey> {
    // Get token account for NFT
    const accounts = await this.connection.getParsedTokenAccountsByOwner(
      owner,
      { mint }
    );

    if (accounts.value.length === 0) {
      throw new Error('NFT token account not found');
    }

    return accounts.value[0].pubkey;
  }

  private async getUserStakeAddress(
    user: PublicKey,
    nftMint: PublicKey
  ): Promise<PublicKey> {
    const [address] = await PublicKey.findProgramAddress(
      [
        Buffer.from('user_nft_stake'),
        user.toBuffer(),
        nftMint.toBuffer(),
      ],
      this.program.programId
    );

    return address;
  }
}
```

### 3. Liquid Staking Protocol

```typescript
// packages/liquid-staking/src/protocol.ts
import { Connection, PublicKey } from '@solana/web3.js';

export interface LiquidStakingConfig {
  stakeMint: PublicKey;      // Original token (e.g., SOL)
  liquidMint: PublicKey;     // Liquid staking token (e.g., stSOL)
  validatorVoteAccount: PublicKey;
  fee: number;               // Protocol fee in basis points
}

export class LiquidStakingProtocol {
  private connection: Connection;
  private config: LiquidStakingConfig;
  private exchangeRate: number = 1.0; // Dynamic exchange rate

  constructor(connection: Connection, config: LiquidStakingConfig) {
    this.connection = connection;
    this.config = config;
  }

  /**
   * Stake and receive liquid staking tokens
   */
  async deposit(amount: bigint): Promise<{
    signature: string;
    liquidTokensReceived: bigint;
  }> {
    // Calculate liquid tokens to receive based on exchange rate
    const liquidTokens = this.calculateDepositAmount(amount);

    // Stake SOL with validator
    // Mint liquid staking tokens to user

    return {
      signature: 'tx_signature',
      liquidTokensReceived: liquidTokens,
    };
  }

  /**
   * Burn liquid staking tokens and unstake
   */
  async withdraw(liquidAmount: bigint): Promise<{
    signature: string;
    tokensReceived: bigint;
  }> {
    // Calculate tokens to receive based on exchange rate
    const tokens = this.calculateWithdrawAmount(liquidAmount);

    // Burn liquid staking tokens
    // Unstake SOL from validator

    return {
      signature: 'tx_signature',
      tokensReceived: tokens,
    };
  }

  /**
   * Calculate exchange rate
   * stSOL = SOL * exchange_rate
   */
  async updateExchangeRate(): Promise<void> {
    // Get total SOL staked
    const totalStaked = await this.getTotalStaked();

    // Get total stSOL supply
    const totalLiquidSupply = await this.getTotalLiquidSupply();

    // Calculate new exchange rate including rewards
    if (totalLiquidSupply > BigInt(0)) {
      this.exchangeRate = Number(totalStaked) / Number(totalLiquidSupply);
    }
  }

  private calculateDepositAmount(amount: bigint): bigint {
    // account for fees
    const fee = (amount * BigInt(this.config.fee)) / BigInt(10000);
    const netAmount = amount - fee;

    // Convert to liquid tokens
    const liquidTokens = BigInt(
      Math.floor(Number(netAmount) / this.exchangeRate)
    );

    return liquidTokens;
  }

  private calculateWithdrawAmount(liquidAmount: bigint): bigint {
    // Convert liquid tokens back to original
    const tokens = BigInt(
      Math.floor(Number(liquidAmount) * this.exchangeRate)
    );

    // Account for fees
    const fee = (tokens * BigInt(this.config.fee)) / BigInt(10000);
    const netTokens = tokens - fee;

    return netTokens;
  }

  private async getTotalStaked(): Promise<bigint> {
    // Get total staked from validator
    return BigInt(1000000);
  }

  private async getTotalLiquidSupply(): Promise<bigint> {
    // Get total liquid token supply
    const mintInfo = await this.connection.getParsedAccountInfo(
      this.config.liquidMint
    );

    const supply = (mintInfo.value?.data as any).parsed.info.supply;
    return BigInt(supply);
  }

  /**
   * Get current APY
   */
  async getAPY(): Promise<number> {
    // Calculate APY based on validator performance and rewards
    return 5.5; // 5.5% APY
  }
}
```

### 4. Reward Distribution System

```typescript
// packages/staking/src/rewards.ts
export interface RewardConfig {
  baseRate: number;          // Base reward rate in basis points
  boostMultiplier: number;   // Multiplier for long-term stakers
  boostThreshold: number;    // Time threshold for boost (in seconds)
}

export class RewardDistributor {
  private config: RewardConfig;

  constructor(config: RewardConfig) {
    this.config = config;
  }

  /**
   * Calculate rewards for a stake
   */
  calculateRewards(params: {
    stakedAmount: bigint;
    stakeDuration: number; // in seconds
    lastClaimTime: number;
  }): bigint {
    const { stakedAmount, stakeDuration, lastClaimTime } = params;

    const currentTime = Date.now() / 1000;
    const timeElapsed = currentTime - lastClaimTime;

    // Base rewards
    let rewards = this.calculateBaseRewards(stakedAmount, timeElapsed);

    // Apply boost for long-term stakers
    if (stakeDuration >= this.config.boostThreshold) {
      rewards = this.applyBoost(rewards, stakeDuration);
    }

    return rewards;
  }

  private calculateBaseRewards(amount: bigint, duration: number): bigint {
    // rewards = (amount * rate * duration) / (10000 * 86400)
    const rewards = (
      (amount * BigInt(this.config.baseRate) * BigInt(Math.floor(duration)))
      / BigInt(10000 * 86400)
    );

    return rewards;
  }

  private applyBoost(rewards: bigint, stakeDuration: number): bigint {
    // Progressive boost based on stake duration
    let multiplier = 100; // 1.0x

    if (stakeDuration >= 365 * 86400) {
      // 1 year: 2x boost
      multiplier = 200;
    } else if (stakeDuration >= 180 * 86400) {
      // 6 months: 1.5x boost
      multiplier = 150;
    } else if (stakeDuration >= 90 * 86400) {
      // 3 months: 1.25x boost
      multiplier = 125;
    }

    return (rewards * BigInt(multiplier)) / BigInt(100);
  }

  /**
   * Calculate APY for a given stake
   */
  calculateAPY(params: {
    stakedAmount: bigint;
    stakeDuration: number;
  }): number {
    const { stakedAmount, stakeDuration } = params;

    // Calculate annual rewards
    const annualRewards = this.calculateBaseRewards(
      stakedAmount,
      365 * 86400
    );

    // Apply boost
    const boostedRewards = this.applyBoost(annualRewards, stakeDuration);

    // Calculate APY
    const apy = (Number(boostedRewards) / Number(stakedAmount)) * 100;

    return apy;
  }
}
```

### 5. Auto-Compounding Strategy

```typescript
// packages/staking/src/auto-compound.ts
export class AutoCompoundStrategy {
  private minCompoundAmount: bigint;
  private compoundInterval: number; // in seconds

  constructor(minCompoundAmount: bigint, compoundInterval: number) {
    this.minCompoundAmount = minCompoundAmount;
    this.compoundInterval = compoundInterval;
  }

  /**
   * Check if compound should be triggered
   */
  shouldCompound(params: {
    pendingRewards: bigint;
    lastCompoundTime: number;
  }): boolean {
    const { pendingRewards, lastCompoundTime } = params;

    // Check minimum amount
    if (pendingRewards < this.minCompoundAmount) {
      return false;
    }

    // Check time interval
    const currentTime = Date.now() / 1000;
    const timeSinceLastCompound = currentTime - lastCompoundTime;

    return timeSinceLastCompound >= this.compoundInterval;
  }

  /**
   * Calculate optimal compound frequency
   */
  calculateOptimalFrequency(params: {
    stakedAmount: bigint;
    rewardRate: number;
    gasCost: bigint;
  }): number {
    const { stakedAmount, rewardRate, gasCost } = params;

    // Calculate daily rewards
    const dailyRewards = (stakedAmount * BigInt(rewardRate)) / BigInt(10000);

    // Find optimal frequency where rewards > gas costs
    if (dailyRewards > gasCost * BigInt(2)) {
      return 86400; // Daily
    } else if (dailyRewards * BigInt(7) > gasCost * BigInt(2)) {
      return 7 * 86400; // Weekly
    } else {
      return 30 * 86400; // Monthly
    }
  }

  /**
   * Simulate compound growth
   */
  simulateGrowth(params: {
    initialAmount: bigint;
    rewardRate: number;
    duration: number; // in days
    compoundFrequency: number; // in days
  }): bigint {
    const { initialAmount, rewardRate, duration, compoundFrequency } = params;

    let amount = initialAmount;
    const compounds = Math.floor(duration / compoundFrequency);

    for (let i = 0; i < compounds; i++) {
      const rewards = this.calculatePeriodRewards(
        amount,
        rewardRate,
        compoundFrequency
      );
      amount += rewards;
    }

    return amount;
  }

  private calculatePeriodRewards(
    amount: bigint,
    rate: number,
    days: number
  ): bigint {
    return (amount * BigInt(rate) * BigInt(days)) / BigInt(10000);
  }
}
```

## 🔒 Security Patterns

### 1. Reentrancy Protection

```rust
// Add to staking program
#[account]
pub struct StakingLock {
    pub is_locked: bool,
}

pub fn stake_with_lock(ctx: Context<StakeWithLock>, amount: u64) -> Result<()> {
    let lock = &mut ctx.accounts.lock;
    require!(!lock.is_locked, StakingError::Locked);

    lock.is_locked = true;

    // Perform stake operations

    lock.is_locked = false;
    Ok(())
}
```

### 2. Overflow Protection

```rust
pub fn safe_add_rewards(current: u64, rewards: u64) -> Result<u64> {
    current
        .checked_add(rewards)
        .ok_or(StakingError::Overflow.into())
}
```

## 🧪 Testing

```typescript
// tests/staking.test.ts
import { describe, test, expect } from 'vitest';
import { RewardDistributor } from '../src/rewards';

describe('Staking Rewards', () => {
  test('should calculate base rewards correctly', () => {
    const distributor = new RewardDistributor({
      baseRate: 1000, // 10% APY
      boostMultiplier: 200,
      boostThreshold: 90 * 86400,
    });

    const rewards = distributor.calculateRewards({
      stakedAmount: BigInt(1000000),
      stakeDuration: 0,
      lastClaimTime: Date.now() / 1000 - 86400, // 1 day ago
    });

    // Should earn ~27.4 tokens per day (10% / 365 days)
    expect(Number(rewards)).toBeGreaterThan(20);
    expect(Number(rewards)).toBeLessThan(30);
  });

  test('should apply boost for long-term stakers', () => {
    const distributor = new RewardDistributor({
      baseRate: 1000,
      boostMultiplier: 200,
      boostThreshold: 90 * 86400,
    });

    const rewards = distributor.calculateRewards({
      stakedAmount: BigInt(1000000),
      stakeDuration: 365 * 86400, // 1 year
      lastClaimTime: Date.now() / 1000 - 86400,
    });

    // Should get 2x boost
    expect(Number(rewards)).toBeGreaterThan(50);
  });
});
```

## 📦 Production Patterns

### 1. Staking Dashboard

```typescript
// components/StakingDashboard.tsx
import { useState, useEffect } from 'react';

export function StakingDashboard() {
  const [stats, setStats] = useState({
    totalStaked: BigInt(0),
    userStake: BigInt(0),
    pendingRewards: BigInt(0),
    apy: 0,
  });

  useEffect(() => {
    // Fetch staking stats
  }, []);

  return (
    <div className="staking-dashboard">
      <div className="stat-card">
        <h3>Your Stake</h3>
        <p>{stats.userStake.toString()} tokens</p>
      </div>

      <div className="stat-card">
        <h3>Pending Rewards</h3>
        <p>{stats.pendingRewards.toString()} tokens</p>
      </div>

      <div className="stat-card">
        <h3>Current APY</h3>
        <p>{stats.apy.toFixed(2)}%</p>
      </div>

      <div className="actions">
        <button>Stake</button>
        <button>Unstake</button>
        <button>Claim Rewards</button>
        <button>Compound</button>
      </div>
    </div>
  );
}
```

## 🎯 Best Practices

1. **Implement cooldown periods to prevent flash attacks**
2. **Use time-weighted rewards for fairness**
3. **Add emergency pause functionality**
4. **Validate all staking amounts**
5. **Track reward distribution accurately**
6. **Implement slashing protection**
7. **Use secure random for reward distribution**
8. **Test edge cases thoroughly**
9. **Monitor pool health continuously**
10. **Implement withdraw limits if needed**

## 🔗 Related Skills

- **governance-expert** - DAO governance and voting
- **tokenomics-designer** - Token economics design
- **solana-anchor-expert** - Anchor program development

## 📚 Resources

- [Solana Staking Documentation](https://docs.solana.com/staking)
- [Marinade Finance](https://marinade.finance/)
- [Lido on Solana](https://lido.fi/)
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/tests)
