# Anchor Instructor - Complete Anchor Framework Mastery

> **ID:** `anchor-instructor`
> **Tier:** 1 (Critical - Always Available)
> **Token Cost:** 10000
> **MCP Connections:** anchor
> **Anchor Version:** 0.30+

## 🎯 What This Skill Does

Master the Anchor framework for Solana program development. This skill covers complete Anchor program architecture, IDL parsing, PDA derivation, CPI patterns, testing strategies, and production deployment patterns.

**Core Capabilities:**
- Anchor program structure and best practices
- IDL (Interface Definition Language) parsing and generation
- PDA (Program Derived Address) design patterns
- CPI (Cross-Program Invocation) orchestration
- Account validation and constraints
- Anchor testing frameworks
- TypeScript client generation
- Natural language to Anchor instructions

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** anchor, instruction, idl, program, pda, cpi, anchor-lang, solana program
- **File Types:** .rs, .ts, .toml
- **Directories:** programs/, tests/, target/idl/

**Use this skill when:**
- Building Solana programs
- Designing account structures
- Implementing program instructions
- Writing program tests
- Generating TypeScript clients
- Debugging program errors
- Optimizing compute usage

## 🚀 Core Capabilities

### 1. Anchor Program Architecture

**Complete Program Structure:**

```rust
// programs/my-program/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod my_program {
    use super::*;

    /// Initialize a new account
    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let account = &mut ctx.accounts.account;
        account.authority = ctx.accounts.authority.key();
        account.data = data;
        account.bump = ctx.bumps.account;

        msg!("Account initialized with data: {}", data);
        Ok(())
    }

    /// Update account data
    pub fn update(ctx: Context<Update>, new_data: u64) -> Result<()> {
        let account = &mut ctx.accounts.account;

        require!(
            account.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );

        account.data = new_data;

        msg!("Account updated to: {}", new_data);
        Ok(())
    }

    /// Close account and return rent
    pub fn close(ctx: Context<Close>) -> Result<()> {
        msg!("Account closed");
        Ok(())
    }
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
pub struct MyAccount {
    pub authority: Pubkey,
    pub data: u64,
    pub bump: u8,
}

impl MyAccount {
    // Calculate space needed for account
    pub const LEN: usize = 8 + // discriminator
        32 + // authority pubkey
        8 +  // data u64
        1;   // bump u8
}

// ============================================================================
// Instruction Contexts
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = MyAccount::LEN,
        seeds = [b"account", authority.key().as_ref()],
        bump
    )]
    pub account: Account<'info, MyAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(
        mut,
        seeds = [b"account", authority.key().as_ref()],
        bump = account.bump,
        has_one = authority
    )]
    pub account: Account<'info, MyAccount>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        close = authority,
        seeds = [b"account", authority.key().as_ref()],
        bump = account.bump,
        has_one = authority
    )]
    pub account: Account<'info, MyAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Invalid data value provided")]
    InvalidData,
}
```

**Best Practices:**
- Use clear, descriptive names for instructions
- Group related accounts in contexts
- Define custom errors for better debugging
- Calculate exact space requirements
- Use const for account sizes
- Add comments for complex logic
- Log important state changes

**Common Patterns:**

```rust
// Pattern 1: Counter program (simple state)
#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}

#[program]
pub mod counter {
    use super::*;

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }
}

// Pattern 2: Token escrow (complex state)
#[account]
pub struct Escrow {
    pub initializer: Pubkey,
    pub initializer_token_account: Pubkey,
    pub initializer_amount: u64,
    pub taker_amount: u64,
    pub bump: u8,
}

// Pattern 3: NFT staking (nested accounts)
#[derive(Accounts)]
pub struct StakeNFT<'info> {
    #[account(
        init,
        payer = staker,
        space = StakeAccount::LEN,
        seeds = [b"stake", nft_mint.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub nft_token_account: Account<'info, TokenAccount>,

    pub nft_mint: Account<'info, Mint>,

    #[account(mut)]
    pub staker: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

### 2. PDA (Program Derived Address) Patterns

PDAs are addresses derived deterministically from seeds and a program ID.

**PDA Design Principles:**

```rust
// lib.rs - PDA Examples

// 1. User-specific account
// Seeds: [b"user", user_pubkey]
#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = user,
        space = UserAccount::LEN,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// 2. Vault account (program-owned SOL/tokens)
// Seeds: [b"vault"]
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8,
        seeds = [b"vault"],
        bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// 3. Counter with index (multiple instances)
// Seeds: [b"counter", index_bytes]
#[derive(Accounts)]
#[instruction(index: u64)]
pub struct InitializeCounter<'info> {
    #[account(
        init,
        payer = payer,
        space = Counter::LEN,
        seeds = [b"counter", index.to_le_bytes().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// 4. Associated account (user + identifier)
// Seeds: [b"metadata", user_pubkey, collection_id]
#[derive(Accounts)]
#[instruction(collection_id: u64)]
pub struct InitializeMetadata<'info> {
    #[account(
        init,
        payer = user,
        space = Metadata::LEN,
        seeds = [
            b"metadata",
            user.key().as_ref(),
            collection_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub metadata: Account<'info, Metadata>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// 5. Token vault (for SPL tokens)
// Seeds: [b"token-vault", mint]
#[derive(Accounts)]
pub struct InitializeTokenVault<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"token-vault", mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = vault_authority,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// CHECK: Vault authority PDA
    #[account(
        seeds = [b"vault-authority"],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
```

**PDA Best Practices:**
- Use descriptive seed prefixes (b"user", b"vault")
- Include user pubkey for user-specific accounts
- Use sequential IDs for collections
- Store bump in account for validation
- Derive vault authorities as PDAs
- Keep seeds deterministic and collision-free

**Client-side PDA Derivation:**

```typescript
// client/pda.ts
import { PublicKey } from '@solana/web3.js';

export class PDAHelper {
  constructor(private programId: PublicKey) {}

  /**
   * Find user account PDA
   */
  findUserAccount(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), user.toBuffer()],
      this.programId
    );
  }

  /**
   * Find vault PDA
   */
  findVault(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault')],
      this.programId
    );
  }

  /**
   * Find counter PDA by index
   */
  findCounter(index: number): [PublicKey, number] {
    const indexBuffer = Buffer.alloc(8);
    indexBuffer.writeBigUInt64LE(BigInt(index));

    return PublicKey.findProgramAddressSync(
      [Buffer.from('counter'), indexBuffer],
      this.programId
    );
  }

  /**
   * Find metadata PDA
   */
  findMetadata(user: PublicKey, collectionId: number): [PublicKey, number] {
    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(BigInt(collectionId));

    return PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), user.toBuffer(), idBuffer],
      this.programId
    );
  }

  /**
   * Find token vault PDA
   */
  findTokenVault(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('token-vault'), mint.toBuffer()],
      this.programId
    );
  }

  /**
   * Find vault authority PDA
   */
  findVaultAuthority(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault-authority')],
      this.programId
    );
  }
}
```

### 3. CPI (Cross-Program Invocation)

Call other programs from your program.

**CPI Patterns:**

```rust
// lib.rs - CPI Examples

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

// 1. SPL Token Transfer CPI
pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    Ok(())
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// 2. System Program Transfer CPI (SOL)
pub fn transfer_sol(ctx: Context<TransferSOL>, amount: u64) -> Result<()> {
    let from = ctx.accounts.from.to_account_info();
    let to = ctx.accounts.to.to_account_info();

    **from.try_borrow_mut_lamports()? -= amount;
    **to.try_borrow_mut_lamports()? += amount;

    Ok(())
}

// 3. CPI with PDA Signer (program authority)
pub fn transfer_from_vault(
    ctx: Context<TransferFromVault>,
    amount: u64
) -> Result<()> {
    let authority_seeds = &[
        b"vault-authority",
        &[ctx.accounts.vault_authority_bump],
    ];
    let signer_seeds = &[&authority_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.recipient.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(
        cpi_program,
        cpi_accounts,
        signer_seeds,
    );

    token::transfer(cpi_ctx, amount)?;

    Ok(())
}

#[derive(Accounts)]
pub struct TransferFromVault<'info> {
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault_authority,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: Vault authority PDA
    #[account(
        seeds = [b"vault-authority"],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

// 4. Calling another Anchor program
use other_program::program::OtherProgram;
use other_program::cpi::accounts::OtherInstruction;

pub fn call_other_program(ctx: Context<CallOtherProgram>) -> Result<()> {
    let cpi_accounts = OtherInstruction {
        account: ctx.accounts.other_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.other_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    other_program::cpi::other_instruction(cpi_ctx, args)?;

    Ok(())
}

// 5. Complex CPI - Mint NFT
pub fn mint_nft(ctx: Context<MintNFT>) -> Result<()> {
    // Mint token to recipient
    let mint_to_cpi = token::MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };

    let authority_seeds = &[
        b"mint-authority",
        &[ctx.accounts.mint_authority_bump],
    ];
    let signer_seeds = &[&authority_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        mint_to_cpi,
        signer_seeds,
    );

    token::mint_to(cpi_ctx, 1)?; // Mint 1 NFT

    // Set authority to None (freeze mint)
    let set_authority_cpi = token::SetAuthority {
        current_authority: ctx.accounts.mint_authority.to_account_info(),
        account_or_mint: ctx.accounts.mint.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        set_authority_cpi,
        signer_seeds,
    );

    token::set_authority(
        cpi_ctx,
        token::spl_token::instruction::AuthorityType::MintTokens,
        None,
    )?;

    Ok(())
}
```

**CPI Best Practices:**
- Always use `CpiContext::new_with_signer` for PDA signers
- Validate all accounts before CPI
- Handle CPI errors gracefully
- Document which programs you call
- Test CPI interactions thoroughly
- Be aware of compute unit costs

### 4. Account Validation & Constraints

**Comprehensive Constraint Examples:**

```rust
// Account constraint patterns

#[derive(Accounts)]
pub struct ValidatedAccounts<'info> {
    // 1. Basic constraints
    #[account(mut)]  // Account is mutable
    pub user: Signer<'info>,  // Must sign transaction

    // 2. Ownership constraint
    #[account(
        constraint = account.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub account: Account<'info, MyAccount>,

    // 3. has_one constraint (checks foreign key)
    #[account(
        mut,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub data_account: Account<'info, DataAccount>,

    pub authority: Signer<'info>,

    // 4. Seeds constraint (validates PDA)
    #[account(
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    // 5. close constraint (returns rent to recipient)
    #[account(
        mut,
        close = user
    )]
    pub account_to_close: Account<'info, TempAccount>,

    // 6. Token account constraints
    #[account(
        mut,
        token::mint = mint,
        token::authority = user,
    )]
    pub token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    // 7. Associated token constraint
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub associated_token: Account<'info, TokenAccount>,

    // 8. Custom constraint
    #[account(
        constraint = account.amount >= MIN_AMOUNT @ ErrorCode::InsufficientAmount,
        constraint = account.expiry > Clock::get()?.unix_timestamp @ ErrorCode::Expired,
    )]
    pub validated_account: Account<'info, ValidatedAccount>,

    // 9. Realloc constraint (resize account)
    #[account(
        mut,
        realloc = new_size,
        realloc::payer = user,
        realloc::zero = false,
    )]
    pub resizable_account: Account<'info, ResizableAccount>,
}
```

## 💡 Real-World Examples

### Example 1: Complete Token Staking Program

```rust
// programs/staking/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Stake111111111111111111111111111111111111");

const REWARD_RATE: u64 = 100; // Tokens per day per staked token

#[program]
pub mod staking {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        reward_duration: i64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.staking_mint = ctx.accounts.staking_mint.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.reward_duration = reward_duration;
        pool.total_staked = 0;
        pool.bump = ctx.bumps.pool;

        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let stake_account = &mut ctx.accounts.stake_account;
        let pool = &mut ctx.accounts.pool;

        // Update rewards before changing stake
        Self::update_rewards(stake_account, pool)?;

        // Transfer tokens to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

        // Update state
        stake_account.staked_amount += amount;
        stake_account.last_update_time = Clock::get()?.unix_timestamp;
        pool.total_staked += amount;

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        require!(
            stake_account.staked_amount >= amount,
            ErrorCode::InsufficientStake
        );

        let pool = &mut ctx.accounts.pool;

        // Update and claim rewards
        Self::update_rewards(stake_account, pool)?;

        // Transfer tokens from vault
        let authority_seeds = &[
            b"vault-authority",
            &[ctx.bumps.vault_authority],
        ];
        let signer_seeds = &[&authority_seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, amount)?;

        // Update state
        stake_account.staked_amount -= amount;
        pool.total_staked -= amount;

        Ok(())
    }

    fn update_rewards(
        stake_account: &mut StakeAccount,
        pool: &Pool,
    ) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        let time_elapsed = current_time - stake_account.last_update_time;

        if time_elapsed > 0 {
            let rewards = (stake_account.staked_amount as u128)
                .checked_mul(REWARD_RATE as u128)
                .unwrap()
                .checked_mul(time_elapsed as u128)
                .unwrap()
                / 86400; // Rewards per day

            stake_account.pending_rewards += rewards as u64;
            stake_account.last_update_time = current_time;
        }

        Ok(())
    }
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub staking_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_duration: i64,
    pub total_staked: u64,
    pub bump: u8,
}

#[account]
pub struct StakeAccount {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub staked_amount: u64,
    pub pending_rewards: u64,
    pub last_update_time: i64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1,
        seeds = [b"pool", staking_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    pub staking_mint: Account<'info, Mint>,
    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"stake", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        associated_token::mint = pool.staking_mint,
        associated_token::authority = pool,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = pool.staking_mint,
        token::authority = user,
    )]
    pub user_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient stake")]
    InsufficientStake,
}
```

### Example 2: TypeScript Client

```typescript
// client/staking-client.ts
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Staking } from '../target/types/staking';

export class StakingClient {
  constructor(
    private program: Program<Staking>,
    private provider: anchor.AnchorProvider
  ) {}

  async initializePool(
    stakingMint: PublicKey,
    rewardMint: PublicKey,
    rewardDuration: number
  ) {
    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool'), stakingMint.toBuffer()],
      this.program.programId
    );

    await this.program.methods
      .initializePool(new anchor.BN(rewardDuration))
      .accounts({
        pool,
        stakingMint,
        rewardMint,
        authority: this.provider.wallet.publicKey,
      })
      .rpc();

    return pool;
  }

  async stake(pool: PublicKey, amount: number) {
    const [stakeAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('stake'),
        pool.toBuffer(),
        this.provider.wallet.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const poolAccount = await this.program.account.pool.fetch(pool);

    const vault = await this.getAssociatedTokenAddress(
      poolAccount.stakingMint,
      pool
    );

    const userToken = await this.getAssociatedTokenAddress(
      poolAccount.stakingMint,
      this.provider.wallet.publicKey
    );

    await this.program.methods
      .stake(new anchor.BN(amount))
      .accounts({
        stakeAccount,
        pool,
        vault,
        userToken,
        user: this.provider.wallet.publicKey,
      })
      .rpc();

    return stakeAccount;
  }

  async unstake(pool: PublicKey, amount: number) {
    const [stakeAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('stake'),
        pool.toBuffer(),
        this.provider.wallet.publicKey.toBuffer(),
      ],
      this.program.programId
    );

    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault-authority')],
      this.program.programId
    );

    const poolAccount = await this.program.account.pool.fetch(pool);

    const vault = await this.getAssociatedTokenAddress(
      poolAccount.stakingMint,
      pool
    );

    const userToken = await this.getAssociatedTokenAddress(
      poolAccount.stakingMint,
      this.provider.wallet.publicKey
    );

    await this.program.methods
      .unstake(new anchor.BN(amount))
      .accounts({
        stakeAccount,
        pool,
        vault,
        vaultAuthority,
        userToken,
        user: this.provider.wallet.publicKey,
      })
      .rpc();
  }

  private async getAssociatedTokenAddress(
    mint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    const { getAssociatedTokenAddressSync } = await import('@solana/spl-token');
    return getAssociatedTokenAddressSync(mint, owner, true);
  }
}
```

## 🔒 Security Best Practices

1. **Always validate account ownership** with constraints
2. **Use has_one for foreign key validation**
3. **Never trust unchecked accounts** without validation
4. **Validate PDAs with seeds constraint**
5. **Check for integer overflow** in calculations
6. **Use require! for runtime checks**
7. **Test all error paths** thoroughly
8. **Audit before mainnet deployment**

## 🔗 Resources

- [Anchor Book](https://book.anchor-lang.com/)
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/tests)
- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Discord](https://discord.gg/anchor)

---

**Last Updated:** 2025-12-04
**Anchor Version:** 0.30+
**Tested on:** Localnet, Devnet, Mainnet-beta
