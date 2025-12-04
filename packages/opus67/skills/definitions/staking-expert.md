# Staking Expert

Token staking protocol specialist for building and integrating staking systems. Covers single-sided staking, LP staking, liquid staking, reward distribution, and lock-up mechanisms.

---

## Metadata

- **ID**: staking-expert
- **Name**: Staking Expert
- **Category**: DeFi
- **Tags**: staking, yield, rewards, locking, liquid-staking
- **Version**: 2.0.0
- **Token Estimate**: 4200

---

## Overview

Staking protocols enable token holders to earn rewards by locking tokens:
- **Single-sided Staking**: Stake one token, earn rewards
- **LP Staking**: Stake LP tokens for additional yield
- **Liquid Staking**: Receive liquid derivatives while staking
- **Lock-up Staking**: Time-locked staking with boosted rewards
- **Delegated Staking**: Stake to validators or pools

This skill covers implementing and integrating staking systems on Solana.

---

## Single-Sided Staking Program

### Core Staking Contract

```rust
// programs/staking/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("Stak1ng111111111111111111111111111111111111");

#[program]
pub mod staking {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        reward_rate: u64,         // Rewards per second
        min_stake_duration: i64,   // Minimum lock time
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        pool.authority = ctx.accounts.authority.key();
        pool.stake_mint = ctx.accounts.stake_mint.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.stake_vault = ctx.accounts.stake_vault.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.reward_rate = reward_rate;
        pool.min_stake_duration = min_stake_duration;
        pool.total_staked = 0;
        pool.reward_per_token_stored = 0;
        pool.last_update_time = clock.unix_timestamp;
        pool.bump = ctx.bumps.pool;

        emit!(PoolInitialized {
            pool: pool.key(),
            stake_mint: pool.stake_mint,
            reward_mint: pool.reward_mint,
            reward_rate,
        });

        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;

        // Update reward per token
        update_reward_per_token(pool, clock.unix_timestamp)?;

        // Update user rewards
        if user_stake.staked_amount > 0 {
            user_stake.rewards_earned = calculate_pending_rewards(
                user_stake,
                pool.reward_per_token_stored,
            )?;
        }

        user_stake.reward_per_token_paid = pool.reward_per_token_stored;

        // Transfer tokens to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.stake_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update state
        user_stake.staked_amount = user_stake.staked_amount
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        user_stake.stake_time = clock.unix_timestamp;
        user_stake.unlock_time = clock.unix_timestamp + pool.min_stake_duration;

        pool.total_staked = pool.total_staked
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(Staked {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            amount,
            total_staked: user_stake.staked_amount,
        });

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;

        // Check lock period
        require!(
            clock.unix_timestamp >= user_stake.unlock_time,
            ErrorCode::StakeLocked
        );

        require!(
            user_stake.staked_amount >= amount,
            ErrorCode::InsufficientStake
        );

        // Update reward per token
        update_reward_per_token(pool, clock.unix_timestamp)?;

        // Calculate and update rewards
        user_stake.rewards_earned = calculate_pending_rewards(
            user_stake,
            pool.reward_per_token_stored,
        )?;
        user_stake.reward_per_token_paid = pool.reward_per_token_stored;

        // Transfer tokens from vault
        let pool_key = pool.key();
        let seeds = &[
            b"pool",
            pool.stake_mint.as_ref(),
            &[pool.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.stake_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        // Update state
        user_stake.staked_amount = user_stake.staked_amount
            .checked_sub(amount)
            .ok_or(ErrorCode::MathUnderflow)?;

        pool.total_staked = pool.total_staked
            .checked_sub(amount)
            .ok_or(ErrorCode::MathUnderflow)?;

        emit!(Unstaked {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            amount,
            remaining_staked: user_stake.staked_amount,
        });

        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;

        // Update reward per token
        update_reward_per_token(pool, clock.unix_timestamp)?;

        // Calculate total pending rewards
        let pending = calculate_pending_rewards(
            user_stake,
            pool.reward_per_token_stored,
        )?;

        require!(pending > 0, ErrorCode::NoRewardsToClaim);

        // Reset user reward state
        user_stake.rewards_earned = 0;
        user_stake.reward_per_token_paid = pool.reward_per_token_stored;

        // Transfer rewards
        let seeds = &[
            b"pool",
            pool.stake_mint.as_ref(),
            &[pool.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.reward_vault.to_account_info(),
                    to: ctx.accounts.user_reward_account.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer_seeds,
            ),
            pending,
        )?;

        emit!(RewardsClaimed {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            amount: pending,
        });

        Ok(())
    }

    pub fn add_rewards(ctx: Context<AddRewards>, amount: u64) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.funder_token_account.to_account_info(),
                    to: ctx.accounts.reward_vault.to_account_info(),
                    authority: ctx.accounts.funder.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(RewardsAdded {
            pool: ctx.accounts.pool.key(),
            funder: ctx.accounts.funder.key(),
            amount,
        });

        Ok(())
    }

    pub fn update_reward_rate(
        ctx: Context<UpdatePool>,
        new_rate: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // Update stored rewards before changing rate
        update_reward_per_token(pool, clock.unix_timestamp)?;

        let old_rate = pool.reward_rate;
        pool.reward_rate = new_rate;

        emit!(RewardRateUpdated {
            pool: pool.key(),
            old_rate,
            new_rate,
        });

        Ok(())
    }
}

// Helper functions
fn update_reward_per_token(pool: &mut Account<StakingPool>, current_time: i64) -> Result<()> {
    if pool.total_staked == 0 {
        pool.last_update_time = current_time;
        return Ok(());
    }

    let time_elapsed = current_time
        .checked_sub(pool.last_update_time)
        .ok_or(ErrorCode::MathUnderflow)? as u64;

    let reward_per_token_delta = time_elapsed
        .checked_mul(pool.reward_rate)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_mul(PRECISION)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(pool.total_staked)
        .ok_or(ErrorCode::MathOverflow)?;

    pool.reward_per_token_stored = pool.reward_per_token_stored
        .checked_add(reward_per_token_delta)
        .ok_or(ErrorCode::MathOverflow)?;

    pool.last_update_time = current_time;

    Ok(())
}

fn calculate_pending_rewards(
    user_stake: &UserStake,
    current_reward_per_token: u128,
) -> Result<u64> {
    let reward_delta = current_reward_per_token
        .checked_sub(user_stake.reward_per_token_paid)
        .ok_or(ErrorCode::MathUnderflow)?;

    let pending = (user_stake.staked_amount as u128)
        .checked_mul(reward_delta)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(PRECISION)
        .ok_or(ErrorCode::MathOverflow)? as u64;

    let total = pending
        .checked_add(user_stake.rewards_earned)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(total)
}

const PRECISION: u128 = 1_000_000_000_000; // 10^12 for precision

// Account structures
#[account]
#[derive(InitSpace)]
pub struct StakingPool {
    pub authority: Pubkey,
    pub stake_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub stake_vault: Pubkey,
    pub reward_vault: Pubkey,
    pub reward_rate: u64,
    pub min_stake_duration: i64,
    pub total_staked: u64,
    pub reward_per_token_stored: u128,
    pub last_update_time: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserStake {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub staked_amount: u64,
    pub stake_time: i64,
    pub unlock_time: i64,
    pub rewards_earned: u64,
    pub reward_per_token_paid: u128,
    pub bump: u8,
}

// Account contexts
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::INIT_SPACE,
        seeds = [b"pool", stake_mint.key().as_ref()],
        bump,
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(
        init,
        payer = authority,
        token::mint = stake_mint,
        token::authority = pool,
        seeds = [b"stake_vault", pool.key().as_ref()],
        bump,
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = reward_mint,
        token::authority = pool,
        seeds = [b"reward_vault", pool.key().as_ref()],
        bump,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub stake_mint: Account<'info, Mint>,
    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.stake_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStake::INIT_SPACE,
        seeds = [b"user_stake", pool.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        constraint = stake_vault.key() == pool.stake_vault,
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.mint == pool.stake_mint,
        constraint = user_token_account.owner == user.key(),
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.stake_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", pool.key().as_ref(), user.key().as_ref()],
        bump = user_stake.bump,
        constraint = user_stake.owner == user.key(),
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        constraint = stake_vault.key() == pool.stake_vault,
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.mint == pool.stake_mint,
        constraint = user_token_account.owner == user.key(),
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.stake_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", pool.key().as_ref(), user.key().as_ref()],
        bump = user_stake.bump,
        constraint = user_stake.owner == user.key(),
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        constraint = reward_vault.key() == pool.reward_vault,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_reward_account.mint == pool.reward_mint,
        constraint = user_reward_account.owner == user.key(),
    )]
    pub user_reward_account: Account<'info, TokenAccount>,

    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AddRewards<'info> {
    #[account(
        seeds = [b"pool", pool.stake_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        constraint = reward_vault.key() == pool.reward_vault,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = funder_token_account.mint == pool.reward_mint,
    )]
    pub funder_token_account: Account<'info, TokenAccount>,

    pub funder: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdatePool<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.stake_mint.as_ref()],
        bump = pool.bump,
        constraint = pool.authority == authority.key() @ ErrorCode::Unauthorized,
    )]
    pub pool: Account<'info, StakingPool>,

    pub authority: Signer<'info>,
}

// Events
#[event]
pub struct PoolInitialized {
    pub pool: Pubkey,
    pub stake_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_rate: u64,
}

#[event]
pub struct Staked {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub total_staked: u64,
}

#[event]
pub struct Unstaked {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub remaining_staked: u64,
}

#[event]
pub struct RewardsClaimed {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardsAdded {
    pub pool: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardRateUpdated {
    pub pool: Pubkey,
    pub old_rate: u64,
    pub new_rate: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Math underflow")]
    MathUnderflow,
    #[msg("Stake is still locked")]
    StakeLocked,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
    #[msg("Unauthorized")]
    Unauthorized,
}
```

---

## TypeScript Staking Client

```typescript
// staking-client.ts
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface StakingPoolInfo {
  authority: PublicKey;
  stakeMint: PublicKey;
  rewardMint: PublicKey;
  totalStaked: BN;
  rewardRate: BN;
  minStakeDuration: BN;
}

interface UserStakeInfo {
  stakedAmount: BN;
  stakeTime: BN;
  unlockTime: BN;
  pendingRewards: BN;
}

export class StakingClient {
  private program: Program;
  private connection: Connection;

  constructor(program: Program, connection: Connection) {
    this.program = program;
    this.connection = connection;
  }

  // Pool management
  async initializePool(
    authority: Keypair,
    stakeMint: PublicKey,
    rewardMint: PublicKey,
    rewardRate: BN,
    minStakeDuration: BN
  ): Promise<PublicKey> {
    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool'), stakeMint.toBuffer()],
      this.program.programId
    );

    const [stakeVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake_vault'), poolPda.toBuffer()],
      this.program.programId
    );

    const [rewardVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('reward_vault'), poolPda.toBuffer()],
      this.program.programId
    );

    await this.program.methods
      .initializePool(rewardRate, minStakeDuration)
      .accounts({
        pool: poolPda,
        stakeVault,
        rewardVault,
        stakeMint,
        rewardMint,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([authority])
      .rpc();

    return poolPda;
  }

  async getPoolInfo(pool: PublicKey): Promise<StakingPoolInfo> {
    const poolAccount = await this.program.account.stakingPool.fetch(pool);

    return {
      authority: poolAccount.authority,
      stakeMint: poolAccount.stakeMint,
      rewardMint: poolAccount.rewardMint,
      totalStaked: poolAccount.totalStaked,
      rewardRate: poolAccount.rewardRate,
      minStakeDuration: poolAccount.minStakeDuration,
    };
  }

  // User operations
  async stake(
    user: Keypair,
    pool: PublicKey,
    amount: BN
  ): Promise<string> {
    const poolInfo = await this.getPoolInfo(pool);

    const [userStakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_stake'), pool.toBuffer(), user.publicKey.toBuffer()],
      this.program.programId
    );

    const [stakeVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake_vault'), pool.toBuffer()],
      this.program.programId
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      poolInfo.stakeMint,
      user.publicKey
    );

    return this.program.methods
      .stake(amount)
      .accounts({
        pool,
        userStake: userStakePda,
        stakeVault,
        userTokenAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
  }

  async unstake(
    user: Keypair,
    pool: PublicKey,
    amount: BN
  ): Promise<string> {
    const poolInfo = await this.getPoolInfo(pool);

    const [userStakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_stake'), pool.toBuffer(), user.publicKey.toBuffer()],
      this.program.programId
    );

    const [stakeVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake_vault'), pool.toBuffer()],
      this.program.programId
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      poolInfo.stakeMint,
      user.publicKey
    );

    return this.program.methods
      .unstake(amount)
      .accounts({
        pool,
        userStake: userStakePda,
        stakeVault,
        userTokenAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();
  }

  async claimRewards(user: Keypair, pool: PublicKey): Promise<string> {
    const poolInfo = await this.getPoolInfo(pool);

    const [userStakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_stake'), pool.toBuffer(), user.publicKey.toBuffer()],
      this.program.programId
    );

    const [rewardVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('reward_vault'), pool.toBuffer()],
      this.program.programId
    );

    const userRewardAccount = await getAssociatedTokenAddress(
      poolInfo.rewardMint,
      user.publicKey
    );

    return this.program.methods
      .claimRewards()
      .accounts({
        pool,
        userStake: userStakePda,
        rewardVault,
        userRewardAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();
  }

  async getUserStakeInfo(
    pool: PublicKey,
    user: PublicKey
  ): Promise<UserStakeInfo | null> {
    const [userStakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_stake'), pool.toBuffer(), user.toBuffer()],
      this.program.programId
    );

    try {
      const userStake = await this.program.account.userStake.fetch(userStakePda);
      const poolAccount = await this.program.account.stakingPool.fetch(pool);

      // Calculate pending rewards
      const pendingRewards = this.calculatePendingRewards(
        userStake,
        poolAccount
      );

      return {
        stakedAmount: userStake.stakedAmount,
        stakeTime: userStake.stakeTime,
        unlockTime: userStake.unlockTime,
        pendingRewards: new BN(pendingRewards),
      };
    } catch {
      return null;
    }
  }

  private calculatePendingRewards(userStake: any, pool: any): number {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeElapsed = currentTime - pool.lastUpdateTime.toNumber();

    if (pool.totalStaked.eq(new BN(0))) {
      return userStake.rewardsEarned.toNumber();
    }

    const PRECISION = 1e12;
    const rewardPerTokenDelta =
      (timeElapsed * pool.rewardRate.toNumber() * PRECISION) /
      pool.totalStaked.toNumber();

    const currentRewardPerToken =
      pool.rewardPerTokenStored.toNumber() + rewardPerTokenDelta;

    const rewardDelta =
      currentRewardPerToken - userStake.rewardPerTokenPaid.toNumber();

    const pending =
      (userStake.stakedAmount.toNumber() * rewardDelta) / PRECISION;

    return Math.floor(pending + userStake.rewardsEarned.toNumber());
  }

  // APY calculation
  calculateAPY(pool: StakingPoolInfo, tokenPrice?: number): number {
    if (pool.totalStaked.eq(new BN(0))) return 0;

    const annualRewards = pool.rewardRate.toNumber() * 365 * 24 * 60 * 60;
    const apr = (annualRewards / pool.totalStaked.toNumber()) * 100;

    // Convert APR to APY (assuming daily compounding)
    const apy = (Math.pow(1 + apr / 365 / 100, 365) - 1) * 100;

    return apy;
  }
}
```

---

## Liquid Staking

```typescript
// liquid-staking/lst-program.ts
// Liquid staking allows users to stake and receive a liquid derivative token

interface LiquidStakingPool {
  stakeMint: PublicKey;       // Original token
  lstMint: PublicKey;         // Liquid staking token
  exchangeRate: number;        // LST per stake token
  totalStaked: BN;
  totalLstSupply: BN;
}

export class LiquidStakingClient {
  private program: Program;

  constructor(program: Program) {
    this.program = program;
  }

  /**
   * Stake tokens and receive LST
   * LST amount = stakeAmount * exchangeRate
   */
  async stake(
    user: Keypair,
    pool: PublicKey,
    amount: BN
  ): Promise<{ signature: string; lstReceived: BN }> {
    const poolInfo = await this.getPoolInfo(pool);
    const lstAmount = this.calculateLstAmount(amount, poolInfo.exchangeRate);

    const signature = await this.program.methods
      .liquidStake(amount)
      .accounts({
        pool,
        user: user.publicKey,
        // ... other accounts
      })
      .signers([user])
      .rpc();

    return { signature, lstReceived: lstAmount };
  }

  /**
   * Unstake by burning LST and receiving original tokens + rewards
   */
  async unstake(
    user: Keypair,
    pool: PublicKey,
    lstAmount: BN
  ): Promise<{ signature: string; tokensReceived: BN }> {
    const poolInfo = await this.getPoolInfo(pool);
    const tokensReceived = this.calculateTokenAmount(lstAmount, poolInfo.exchangeRate);

    const signature = await this.program.methods
      .liquidUnstake(lstAmount)
      .accounts({
        pool,
        user: user.publicKey,
        // ... other accounts
      })
      .signers([user])
      .rpc();

    return { signature, tokensReceived };
  }

  /**
   * Calculate LST amount from stake tokens
   * As rewards accrue, exchange rate increases
   */
  private calculateLstAmount(stakeAmount: BN, exchangeRate: number): BN {
    // LST = stakeAmount / exchangeRate
    // exchangeRate starts at 1.0 and increases as rewards accrue
    return new BN(Math.floor(stakeAmount.toNumber() / exchangeRate));
  }

  private calculateTokenAmount(lstAmount: BN, exchangeRate: number): BN {
    // tokens = lstAmount * exchangeRate
    return new BN(Math.floor(lstAmount.toNumber() * exchangeRate));
  }

  async getPoolInfo(pool: PublicKey): Promise<LiquidStakingPool> {
    const poolAccount = await this.program.account.liquidStakingPool.fetch(pool);
    return {
      stakeMint: poolAccount.stakeMint,
      lstMint: poolAccount.lstMint,
      exchangeRate: poolAccount.totalLstSupply.eq(new BN(0))
        ? 1.0
        : poolAccount.totalStaked.toNumber() / poolAccount.totalLstSupply.toNumber(),
      totalStaked: poolAccount.totalStaked,
      totalLstSupply: poolAccount.totalLstSupply,
    };
  }

  /**
   * Get user's position value in underlying tokens
   */
  async getUserPosition(
    pool: PublicKey,
    user: PublicKey
  ): Promise<{
    lstBalance: BN;
    underlyingValue: BN;
    earnedRewards: BN;
  }> {
    const poolInfo = await this.getPoolInfo(pool);

    // Get user's LST balance
    const lstTokenAccount = await getAssociatedTokenAddress(
      poolInfo.lstMint,
      user
    );

    const balance = await this.program.provider.connection.getTokenAccountBalance(
      lstTokenAccount
    );

    const lstBalance = new BN(balance.value.amount);
    const underlyingValue = this.calculateTokenAmount(lstBalance, poolInfo.exchangeRate);

    // Rewards = underlyingValue - original deposit
    // This requires tracking original deposit amount

    return {
      lstBalance,
      underlyingValue,
      earnedRewards: new BN(0), // Would need historical tracking
    };
  }
}
```

---

## Lock-up Staking with Multipliers

```rust
// Boosted staking with time-based multipliers
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum LockPeriod {
    None,        // No lock, 1x multiplier
    OneMonth,    // 30 days, 1.25x
    ThreeMonths, // 90 days, 1.5x
    SixMonths,   // 180 days, 2x
    OneYear,     // 365 days, 3x
}

impl LockPeriod {
    pub fn duration_seconds(&self) -> i64 {
        match self {
            LockPeriod::None => 0,
            LockPeriod::OneMonth => 30 * 24 * 60 * 60,
            LockPeriod::ThreeMonths => 90 * 24 * 60 * 60,
            LockPeriod::SixMonths => 180 * 24 * 60 * 60,
            LockPeriod::OneYear => 365 * 24 * 60 * 60,
        }
    }

    pub fn multiplier(&self) -> u64 {
        match self {
            LockPeriod::None => 100,        // 1.0x
            LockPeriod::OneMonth => 125,    // 1.25x
            LockPeriod::ThreeMonths => 150, // 1.5x
            LockPeriod::SixMonths => 200,   // 2.0x
            LockPeriod::OneYear => 300,     // 3.0x
        }
    }
}

#[account]
pub struct LockedStake {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub lock_period: LockPeriod,
    pub stake_time: i64,
    pub unlock_time: i64,
    pub boost_multiplier: u64, // 100 = 1x
}

impl LockedStake {
    pub fn effective_stake(&self) -> u64 {
        (self.amount as u128)
            .checked_mul(self.boost_multiplier as u128)
            .unwrap()
            .checked_div(100)
            .unwrap() as u64
    }

    pub fn can_withdraw(&self, current_time: i64) -> bool {
        current_time >= self.unlock_time
    }

    pub fn early_withdraw_penalty(&self, current_time: i64) -> u64 {
        if current_time >= self.unlock_time {
            return 0;
        }

        let total_lock = self.unlock_time - self.stake_time;
        let elapsed = current_time - self.stake_time;
        let remaining_ratio = ((total_lock - elapsed) as u64 * 100) / total_lock as u64;

        // Penalty = 10% of remaining lock ratio
        // e.g., 50% remaining = 5% penalty
        (self.amount * remaining_ratio * 10) / 10000
    }
}

pub fn stake_with_lock(
    ctx: Context<StakeWithLock>,
    amount: u64,
    lock_period: LockPeriod,
) -> Result<()> {
    let stake = &mut ctx.accounts.locked_stake;
    let clock = Clock::get()?;

    stake.owner = ctx.accounts.user.key();
    stake.pool = ctx.accounts.pool.key();
    stake.amount = amount;
    stake.lock_period = lock_period;
    stake.stake_time = clock.unix_timestamp;
    stake.unlock_time = clock.unix_timestamp + lock_period.duration_seconds();
    stake.boost_multiplier = lock_period.multiplier();

    // Transfer tokens...

    let effective = stake.effective_stake();
    msg!("Staked {} tokens with {}x boost = {} effective",
         amount, stake.boost_multiplier as f64 / 100.0, effective);

    Ok(())
}

pub fn early_withdraw(ctx: Context<EarlyWithdraw>) -> Result<()> {
    let stake = &ctx.accounts.locked_stake;
    let clock = Clock::get()?;

    let penalty = stake.early_withdraw_penalty(clock.unix_timestamp);
    let amount_after_penalty = stake.amount.checked_sub(penalty)
        .ok_or(ErrorCode::MathUnderflow)?;

    msg!("Early withdraw: {} - {} penalty = {} received",
         stake.amount, penalty, amount_after_penalty);

    // Transfer tokens with penalty deducted
    // Penalty goes to reward pool or is burned

    Ok(())
}
```

---

## Staking Analytics

```typescript
// analytics/staking-analytics.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

interface StakingMetrics {
  tvl: number;                    // Total Value Locked in USD
  totalStakers: number;
  averageStake: number;
  apr: number;
  apy: number;
  distributedRewards: number;
  pendingRewards: number;
}

interface StakerDistribution {
  range: string;
  count: number;
  percentage: number;
  totalStaked: number;
}

export class StakingAnalytics {
  private connection: Connection;
  private program: Program;

  constructor(connection: Connection, program: Program) {
    this.connection = connection;
    this.program = program;
  }

  async getPoolMetrics(
    pool: PublicKey,
    tokenPrice: number
  ): Promise<StakingMetrics> {
    const poolAccount = await this.program.account.stakingPool.fetch(pool);

    // Get all user stakes
    const userStakes = await this.program.account.userStake.all([
      { memcmp: { offset: 8 + 32, bytes: pool.toBase58() } },
    ]);

    const totalStaked = poolAccount.totalStaked.toNumber();
    const tvl = (totalStaked / 1e9) * tokenPrice; // Assuming 9 decimals

    // Calculate APR
    const annualRewards = poolAccount.rewardRate.toNumber() * 365 * 24 * 60 * 60;
    const apr = totalStaked > 0 ? (annualRewards / totalStaked) * 100 : 0;

    // Calculate APY (daily compounding)
    const apy = (Math.pow(1 + apr / 365 / 100, 365) - 1) * 100;

    // Calculate distributed and pending rewards
    let pendingRewards = 0;
    for (const stake of userStakes) {
      pendingRewards += this.calculatePendingRewards(stake.account, poolAccount);
    }

    return {
      tvl,
      totalStakers: userStakes.length,
      averageStake: userStakes.length > 0 ? totalStaked / userStakes.length : 0,
      apr,
      apy,
      distributedRewards: 0, // Would need historical data
      pendingRewards,
    };
  }

  async getStakerDistribution(pool: PublicKey): Promise<StakerDistribution[]> {
    const userStakes = await this.program.account.userStake.all([
      { memcmp: { offset: 8 + 32, bytes: pool.toBase58() } },
    ]);

    const ranges = [
      { min: 0, max: 100, label: '0-100' },
      { min: 100, max: 1000, label: '100-1K' },
      { min: 1000, max: 10000, label: '1K-10K' },
      { min: 10000, max: 100000, label: '10K-100K' },
      { min: 100000, max: Infinity, label: '100K+' },
    ];

    const distribution: StakerDistribution[] = [];

    for (const range of ranges) {
      const stakersInRange = userStakes.filter(s => {
        const amount = s.account.stakedAmount.toNumber() / 1e9;
        return amount >= range.min && amount < range.max;
      });

      const totalInRange = stakersInRange.reduce(
        (sum, s) => sum + s.account.stakedAmount.toNumber(),
        0
      );

      distribution.push({
        range: range.label,
        count: stakersInRange.length,
        percentage: (stakersInRange.length / userStakes.length) * 100,
        totalStaked: totalInRange / 1e9,
      });
    }

    return distribution;
  }

  async getTopStakers(pool: PublicKey, limit = 10): Promise<{
    address: string;
    stakedAmount: number;
    percentage: number;
  }[]> {
    const poolAccount = await this.program.account.stakingPool.fetch(pool);
    const userStakes = await this.program.account.userStake.all([
      { memcmp: { offset: 8 + 32, bytes: pool.toBase58() } },
    ]);

    // Sort by staked amount
    userStakes.sort((a, b) =>
      b.account.stakedAmount.toNumber() - a.account.stakedAmount.toNumber()
    );

    const totalStaked = poolAccount.totalStaked.toNumber();

    return userStakes.slice(0, limit).map(s => ({
      address: s.account.owner.toBase58(),
      stakedAmount: s.account.stakedAmount.toNumber() / 1e9,
      percentage: (s.account.stakedAmount.toNumber() / totalStaked) * 100,
    }));
  }

  private calculatePendingRewards(userStake: any, pool: any): number {
    // Same calculation as in StakingClient
    const currentTime = Math.floor(Date.now() / 1000);
    const timeElapsed = currentTime - pool.lastUpdateTime.toNumber();

    if (pool.totalStaked.eq(new BN(0))) {
      return userStake.rewardsEarned.toNumber();
    }

    const PRECISION = 1e12;
    const rewardPerTokenDelta =
      (timeElapsed * pool.rewardRate.toNumber() * PRECISION) /
      pool.totalStaked.toNumber();

    const currentRewardPerToken =
      pool.rewardPerTokenStored.toNumber() + rewardPerTokenDelta;

    const rewardDelta =
      currentRewardPerToken - userStake.rewardPerTokenPaid.toNumber();

    return Math.floor(
      (userStake.stakedAmount.toNumber() * rewardDelta) / PRECISION +
      userStake.rewardsEarned.toNumber()
    );
  }
}
```

---

## Testing Staking

```typescript
// tests/staking.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { startAnchor, BanksClient } from 'solana-bankrun';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

describe('Staking Program', () => {
  let context;
  let client: BanksClient;
  let program;
  let admin: Keypair;
  let user: Keypair;
  let stakeMint: PublicKey;
  let rewardMint: PublicKey;
  let pool: PublicKey;

  beforeAll(async () => {
    admin = Keypair.generate();
    user = Keypair.generate();

    context = await startAnchor('./programs/staking', [], [
      { address: admin.publicKey, info: { lamports: 100 * LAMPORTS_PER_SOL } },
      { address: user.publicKey, info: { lamports: 100 * LAMPORTS_PER_SOL } },
    ]);

    client = context.banksClient;
    // Create mints, initialize pool...
  });

  describe('Pool Initialization', () => {
    it('should initialize staking pool', async () => {
      const rewardRate = new BN(1000); // 1000 per second
      const minDuration = new BN(0);   // No minimum lock

      const stakingClient = new StakingClient(program, context.connection);
      pool = await stakingClient.initializePool(
        admin,
        stakeMint,
        rewardMint,
        rewardRate,
        minDuration
      );

      const poolInfo = await stakingClient.getPoolInfo(pool);
      expect(poolInfo.rewardRate.eq(rewardRate)).toBe(true);
    });
  });

  describe('Staking', () => {
    it('should stake tokens', async () => {
      const stakingClient = new StakingClient(program, context.connection);
      const amount = new BN(1000000000); // 1 token

      const tx = await stakingClient.stake(user, pool, amount);
      expect(tx).toBeDefined();

      const userInfo = await stakingClient.getUserStakeInfo(pool, user.publicKey);
      expect(userInfo?.stakedAmount.eq(amount)).toBe(true);
    });

    it('should accumulate rewards over time', async () => {
      // Advance time
      await advanceTime(context, 3600); // 1 hour

      const stakingClient = new StakingClient(program, context.connection);
      const userInfo = await stakingClient.getUserStakeInfo(pool, user.publicKey);

      expect(userInfo?.pendingRewards.gt(new BN(0))).toBe(true);
    });

    it('should claim rewards', async () => {
      const stakingClient = new StakingClient(program, context.connection);

      const before = await stakingClient.getUserStakeInfo(pool, user.publicKey);
      const pendingBefore = before?.pendingRewards || new BN(0);

      await stakingClient.claimRewards(user, pool);

      const after = await stakingClient.getUserStakeInfo(pool, user.publicKey);
      expect(after?.pendingRewards.lt(pendingBefore)).toBe(true);
    });

    it('should unstake tokens', async () => {
      const stakingClient = new StakingClient(program, context.connection);
      const userInfo = await stakingClient.getUserStakeInfo(pool, user.publicKey);
      const stakedAmount = userInfo?.stakedAmount || new BN(0);

      await stakingClient.unstake(user, pool, stakedAmount);

      const afterUnstake = await stakingClient.getUserStakeInfo(pool, user.publicKey);
      expect(afterUnstake?.stakedAmount.eq(new BN(0))).toBe(true);
    });
  });

  describe('Lock-up Staking', () => {
    it('should apply boost multiplier for locked stake', async () => {
      // Test lock-up staking with multipliers
    });

    it('should enforce lock period', async () => {
      // Test that early withdrawal fails or applies penalty
    });
  });

  describe('APY Calculation', () => {
    it('should calculate correct APY', async () => {
      const stakingClient = new StakingClient(program, context.connection);
      const poolInfo = await stakingClient.getPoolInfo(pool);

      const apy = stakingClient.calculateAPY(poolInfo);

      // With 1000 rewards/second and 1 token staked:
      // Annual rewards = 1000 * 365 * 24 * 60 * 60 = 31,536,000,000
      // This would be > 100% APY
      expect(apy).toBeGreaterThan(0);
    });
  });
});

async function advanceTime(context: any, seconds: number) {
  // Bankrun-specific time advancement
  const clock = await context.banksClient.getClock();
  context.setClock({
    ...clock,
    unixTimestamp: BigInt(Number(clock.unixTimestamp) + seconds),
  });
}
```

---

## Related Skills

- **tokenomics-designer** - Token emission and staking economics
- **governance-expert** - Staking for voting power
- **lp-automation** - LP token staking

---

## Further Reading

- [Solana Staking Program Library](https://github.com/solana-labs/solana-program-library/tree/master/stake-pool)
- [Marinade Finance Architecture](https://docs.marinade.finance/)
- [Lido on Solana](https://docs.lido.fi/guides/staking-guide)
- [Synthetix Staking Model](https://docs.synthetix.io/staking/)
