# Anchor Instructor

Comprehensive Anchor framework expertise for building secure, efficient Solana programs. Covers program architecture, account management, PDAs, CPIs, testing patterns, and production deployment.

---

## Metadata

- **ID**: anchor-instructor
- **Name**: Anchor Instructor
- **Category**: Solana Development
- **Tags**: anchor, solana, rust, smart-contracts, programs
- **Version**: 2.0.0
- **Token Estimate**: 4500

---

## Overview

Anchor is the dominant framework for Solana program development, providing:
- Declarative account validation with derive macros
- Automatic discriminator generation for type safety
- IDL generation for client code
- Built-in CPI helpers and PDA utilities
- Comprehensive testing framework

This skill covers Anchor from basic to advanced patterns including program architecture, security, optimization, and production deployment.

---

## Program Structure

### Basic Program Layout

```rust
// programs/my-program/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("YourProgramID111111111111111111111111111111");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let my_account = &mut ctx.accounts.my_account;
        my_account.authority = ctx.accounts.authority.key();
        my_account.data = data;
        my_account.bump = ctx.bumps.my_account;
        Ok(())
    }

    pub fn update(ctx: Context<Update>, new_data: u64) -> Result<()> {
        let my_account = &mut ctx.accounts.my_account;
        my_account.data = new_data;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MyAccount::INIT_SPACE,
        seeds = [b"my_account", authority.key().as_ref()],
        bump,
    )]
    pub my_account: Account<'info, MyAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(
        mut,
        seeds = [b"my_account", authority.key().as_ref()],
        bump = my_account.bump,
        constraint = my_account.authority == authority.key() @ ErrorCode::Unauthorized,
    )]
    pub my_account: Account<'info, MyAccount>,

    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct MyAccount {
    pub authority: Pubkey,
    pub data: u64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
}
```

### Advanced Program Architecture

```rust
// programs/defi-protocol/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("DefiProtoco1111111111111111111111111111111");

pub mod state;
pub mod instructions;
pub mod errors;
pub mod events;
pub mod utils;

use instructions::*;
use errors::*;
use events::*;

#[program]
pub mod defi_protocol {
    use super::*;

    // Admin instructions
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        fee_rate: u64,
    ) -> Result<()> {
        instructions::admin::initialize_protocol(ctx, fee_rate)
    }

    pub fn update_fee_rate(
        ctx: Context<UpdateFeeRate>,
        new_fee_rate: u64,
    ) -> Result<()> {
        instructions::admin::update_fee_rate(ctx, new_fee_rate)
    }

    pub fn pause_protocol(ctx: Context<PauseProtocol>) -> Result<()> {
        instructions::admin::pause_protocol(ctx)
    }

    // User instructions
    pub fn create_vault(
        ctx: Context<CreateVault>,
        name: String,
    ) -> Result<()> {
        instructions::vault::create_vault(ctx, name)
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        instructions::vault::deposit(ctx, amount)
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        instructions::vault::withdraw(ctx, amount)
    }

    // Swap instructions
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        instructions::swap::execute_swap(ctx, amount_in, minimum_amount_out)
    }
}
```

### State Module Organization

```rust
// programs/defi-protocol/src/state/mod.rs
pub mod protocol;
pub mod vault;
pub mod position;

pub use protocol::*;
pub use vault::*;
pub use position::*;

// programs/defi-protocol/src/state/protocol.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub fee_rate: u64,           // Basis points (10000 = 100%)
    pub total_tvl: u64,
    pub total_fees_collected: u64,
    pub paused: bool,
    pub bump: u8,
}

impl ProtocolState {
    pub const SEED: &'static [u8] = b"protocol_state";

    pub fn calculate_fee(&self, amount: u64) -> Result<u64> {
        amount
            .checked_mul(self.fee_rate)
            .and_then(|v| v.checked_div(10000))
            .ok_or(error!(crate::errors::ErrorCode::MathOverflow))
    }
}

// programs/defi-protocol/src/state/vault.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub owner: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub token_mint: Pubkey,
    pub token_vault: Pubkey,
    pub deposited_amount: u64,
    pub shares: u64,
    pub created_at: i64,
    pub last_update: i64,
    pub bump: u8,
}

impl Vault {
    pub const SEED: &'static [u8] = b"vault";

    pub fn calculate_shares(&self, amount: u64, total_supply: u64) -> Result<u64> {
        if total_supply == 0 || self.shares == 0 {
            return Ok(amount);
        }

        amount
            .checked_mul(self.shares)
            .and_then(|v| v.checked_div(self.deposited_amount))
            .ok_or(error!(crate::errors::ErrorCode::MathOverflow))
    }
}
```

---

## Account Constraints

### Comprehensive Constraint Reference

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;

#[derive(Accounts)]
#[instruction(vault_id: u64, deposit_amount: u64)]
pub struct DepositToVault<'info> {
    // ===== PDA Accounts =====

    // Initialize a new PDA account
    #[account(
        init,
        payer = user,
        space = 8 + Deposit::INIT_SPACE,
        seeds = [
            b"deposit",
            vault.key().as_ref(),
            user.key().as_ref(),
            &vault_id.to_le_bytes(),
        ],
        bump,
    )]
    pub deposit: Account<'info, Deposit>,

    // Reference existing PDA with validation
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
        constraint = vault.is_active @ ErrorCode::VaultInactive,
        constraint = vault.token_mint == token_mint.key() @ ErrorCode::InvalidMint,
    )]
    pub vault: Account<'info, Vault>,

    // Protocol state PDA
    #[account(
        seeds = [ProtocolState::SEED],
        bump = protocol.bump,
        constraint = !protocol.paused @ ErrorCode::ProtocolPaused,
    )]
    pub protocol: Account<'info, ProtocolState>,

    // ===== Token Accounts =====

    // User's token account (source)
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user,
        constraint = user_token_account.amount >= deposit_amount @ ErrorCode::InsufficientFunds,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    // Vault's token account (destination)
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = vault_authority,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    // PDA authority for vault
    /// CHECK: PDA authority validated by seeds
    #[account(
        seeds = [b"vault_authority", vault.key().as_ref()],
        bump,
    )]
    pub vault_authority: AccountInfo<'info>,

    // Token mint for validation
    pub token_mint: Account<'info, Mint>,

    // ===== Signer Accounts =====

    #[account(mut)]
    pub user: Signer<'info>,

    // ===== Programs =====

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Account with init_if_needed (use carefully)
#[derive(Accounts)]
pub struct CreateOrUpdatePosition<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", pool.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub position: Account<'info, Position>,

    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Account reallocation
#[derive(Accounts)]
#[instruction(new_data_len: u32)]
pub struct ReallocAccount<'info> {
    #[account(
        mut,
        realloc = 8 + 32 + 8 + (new_data_len as usize),
        realloc::payer = payer,
        realloc::zero = false,
        constraint = expandable_account.authority == payer.key() @ ErrorCode::Unauthorized,
    )]
    pub expandable_account: Account<'info, ExpandableAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Closing accounts
#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"position", pool.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        constraint = position.owner == user.key() @ ErrorCode::Unauthorized,
        constraint = position.amount == 0 @ ErrorCode::PositionNotEmpty,
    )]
    pub position: Account<'info, Position>,

    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub user: Signer<'info>,
}
```

### Custom Constraint Functions

```rust
use anchor_lang::prelude::*;

// Define custom validation functions
impl Vault {
    pub fn is_valid_deposit(&self, amount: u64, max_deposit: u64) -> bool {
        self.is_active &&
        amount > 0 &&
        self.deposited_amount.checked_add(amount).map(|total| total <= max_deposit).unwrap_or(false)
    }

    pub fn has_sufficient_balance(&self, amount: u64) -> bool {
        self.deposited_amount >= amount
    }
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositWithCustomValidation<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
        // Custom validation using method
        constraint = vault.is_valid_deposit(amount, 1_000_000_000) @ ErrorCode::InvalidDeposit,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub depositor: Signer<'info>,
}

// Access control helper
pub fn is_admin(signer: &Pubkey, protocol: &ProtocolState) -> bool {
    *signer == protocol.authority
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [ProtocolState::SEED],
        bump = protocol.bump,
        constraint = is_admin(&admin.key(), &protocol) @ ErrorCode::Unauthorized,
    )]
    pub protocol: Account<'info, ProtocolState>,

    pub admin: Signer<'info>,
}
```

---

## PDA Patterns

### Common PDA Patterns

```rust
use anchor_lang::prelude::*;

// Pattern 1: Global singleton PDA
#[account]
pub struct GlobalConfig {
    pub authority: Pubkey,
    pub bump: u8,
}

impl GlobalConfig {
    pub fn seeds() -> &'static [&'static [u8]] {
        &[b"global_config"]
    }

    pub fn find_pda(program_id: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(Self::seeds(), program_id)
    }
}

// Pattern 2: User-specific PDA
#[account]
pub struct UserAccount {
    pub owner: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

impl UserAccount {
    pub fn seeds(user: &Pubkey) -> [&[u8]; 2] {
        [b"user_account", user.as_ref()]
    }

    pub fn find_pda(user: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&Self::seeds(user), program_id)
    }
}

// Pattern 3: Multi-dimensional PDA (user + resource)
#[account]
pub struct Position {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub bump: u8,
}

impl Position {
    pub fn seeds<'a>(pool: &'a Pubkey, user: &'a Pubkey) -> [&'a [u8]; 3] {
        [b"position", pool.as_ref(), user.as_ref()]
    }

    pub fn find_pda(pool: &Pubkey, user: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&Self::seeds(pool, user), program_id)
    }
}

// Pattern 4: Sequential/indexed PDA
#[account]
pub struct Order {
    pub maker: Pubkey,
    pub order_id: u64,
    pub price: u64,
    pub amount: u64,
    pub bump: u8,
}

impl Order {
    pub fn seeds(maker: &Pubkey, order_id: u64) -> Vec<Vec<u8>> {
        vec![
            b"order".to_vec(),
            maker.to_bytes().to_vec(),
            order_id.to_le_bytes().to_vec(),
        ]
    }
}

// Pattern 5: Vault authority PDA (for token transfers)
pub fn get_vault_authority_seeds<'a>(
    vault_key: &'a Pubkey,
    bump: &'a [u8; 1],
) -> [&'a [u8]; 3] {
    [b"vault_authority", vault_key.as_ref(), bump]
}

pub fn transfer_from_vault<'info>(
    vault_token: &Account<'info, TokenAccount>,
    destination: &Account<'info, TokenAccount>,
    vault_authority: &AccountInfo<'info>,
    token_program: &Program<'info, Token>,
    vault_key: &Pubkey,
    bump: u8,
    amount: u64,
) -> Result<()> {
    let bump_bytes = [bump];
    let signer_seeds = get_vault_authority_seeds(vault_key, &bump_bytes);

    token::transfer(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            Transfer {
                from: vault_token.to_account_info(),
                to: destination.to_account_info(),
                authority: vault_authority.to_account_info(),
            },
            &[&signer_seeds],
        ),
        amount,
    )
}
```

### PDA Derivation in TypeScript

```typescript
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const PROGRAM_ID = new PublicKey('YourProgramID...');

// Global config PDA
export function findGlobalConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('global_config')],
    PROGRAM_ID
  );
}

// User account PDA
export function findUserAccountPda(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_account'), user.toBuffer()],
    PROGRAM_ID
  );
}

// Position PDA (pool + user)
export function findPositionPda(
  pool: PublicKey,
  user: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('position'), pool.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}

// Order PDA with numeric ID
export function findOrderPda(
  maker: PublicKey,
  orderId: BN | number
): [PublicKey, number] {
  const orderIdBn = typeof orderId === 'number' ? new BN(orderId) : orderId;
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('order'),
      maker.toBuffer(),
      orderIdBn.toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  );
}

// Vault authority PDA
export function findVaultAuthorityPda(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault_authority'), vault.toBuffer()],
    PROGRAM_ID
  );
}
```

---

## Cross-Program Invocation (CPI)

### Token Program CPIs

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, MintTo, Burn};

// Transfer tokens
pub fn transfer_tokens<'info>(
    from: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    authority: &Signer<'info>,
    token_program: &Program<'info, Token>,
    amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new(
            token_program.to_account_info(),
            Transfer {
                from: from.to_account_info(),
                to: to.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        amount,
    )
}

// Transfer with PDA signer
pub fn transfer_from_pda<'info>(
    from: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    pda_authority: &AccountInfo<'info>,
    token_program: &Program<'info, Token>,
    seeds: &[&[u8]],
    amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            Transfer {
                from: from.to_account_info(),
                to: to.to_account_info(),
                authority: pda_authority.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )
}

// Mint tokens
pub fn mint_tokens<'info>(
    mint: &Account<'info, Mint>,
    to: &Account<'info, TokenAccount>,
    mint_authority: &AccountInfo<'info>,
    token_program: &Program<'info, Token>,
    seeds: &[&[u8]],
    amount: u64,
) -> Result<()> {
    token::mint_to(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            MintTo {
                mint: mint.to_account_info(),
                to: to.to_account_info(),
                authority: mint_authority.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )
}

// Burn tokens
pub fn burn_tokens<'info>(
    mint: &Account<'info, Mint>,
    from: &Account<'info, TokenAccount>,
    authority: &Signer<'info>,
    token_program: &Program<'info, Token>,
    amount: u64,
) -> Result<()> {
    token::burn(
        CpiContext::new(
            token_program.to_account_info(),
            Burn {
                mint: mint.to_account_info(),
                from: from.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        amount,
    )
}
```

### Custom Program CPI

```rust
use anchor_lang::prelude::*;

// External program interface
#[derive(Clone)]
pub struct OracleProgram;

impl anchor_lang::Id for OracleProgram {
    fn id() -> Pubkey {
        // Oracle program ID
        pubkey!("Orac1e11111111111111111111111111111111111111")
    }
}

// CPI to external program using raw invoke
pub fn get_price_via_cpi<'info>(
    oracle_program: &AccountInfo<'info>,
    price_feed: &AccountInfo<'info>,
) -> Result<u64> {
    // Build instruction
    let ix = anchor_lang::solana_program::instruction::Instruction {
        program_id: oracle_program.key(),
        accounts: vec![
            AccountMeta::new_readonly(price_feed.key(), false),
        ],
        data: vec![0], // GetPrice instruction discriminator
    };

    // Invoke
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[price_feed.to_account_info()],
    )?;

    // Parse return data
    let (_, return_data) = anchor_lang::solana_program::program::get_return_data()
        .ok_or(error!(ErrorCode::OracleError))?;

    let price = u64::from_le_bytes(
        return_data[..8].try_into().map_err(|_| error!(ErrorCode::OracleError))?
    );

    Ok(price)
}

// CPI with PDA signing
pub fn register_with_external_protocol<'info>(
    external_program: &AccountInfo<'info>,
    our_pda: &AccountInfo<'info>,
    config: &AccountInfo<'info>,
    seeds: &[&[u8]],
) -> Result<()> {
    let ix = anchor_lang::solana_program::instruction::Instruction {
        program_id: external_program.key(),
        accounts: vec![
            AccountMeta::new(our_pda.key(), true), // Our PDA signs
            AccountMeta::new(config.key(), false),
        ],
        data: vec![1], // Register instruction
    };

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            our_pda.to_account_info(),
            config.to_account_info(),
        ],
        &[seeds],
    )?;

    Ok(())
}
```

---

## Events and Logging

```rust
use anchor_lang::prelude::*;

// Define events
#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub vault: Pubkey,
    pub amount: u64,
    pub shares_minted: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub vault: Pubkey,
    pub shares_burned: u64,
    pub amount_received: u64,
    pub timestamp: i64,
}

#[event]
pub struct SwapEvent {
    pub user: Pubkey,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct AdminAction {
    pub admin: Pubkey,
    pub action: String,
    pub old_value: u64,
    pub new_value: u64,
    pub timestamp: i64,
}

// Emit events in instruction handlers
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let vault = &mut ctx.accounts.vault;

    // Calculate shares
    let shares = vault.calculate_shares(amount)?;

    // Update state
    vault.deposited_amount = vault.deposited_amount.checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    vault.shares = vault.shares.checked_add(shares)
        .ok_or(ErrorCode::MathOverflow)?;

    // Transfer tokens
    // ...

    // Emit event
    emit!(DepositEvent {
        user: ctx.accounts.user.key(),
        vault: vault.key(),
        amount,
        shares_minted: shares,
        timestamp: clock.unix_timestamp,
    });

    // Also log for easier debugging
    msg!("Deposit: user={}, amount={}, shares={}",
         ctx.accounts.user.key(), amount, shares);

    Ok(())
}
```

### Parsing Events in TypeScript

```typescript
import { Program, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

interface DepositEvent {
  user: PublicKey;
  vault: PublicKey;
  amount: BN;
  sharesMinted: BN;
  timestamp: BN;
}

export async function subscribeToEvents(
  program: Program,
  connection: Connection
) {
  // Subscribe to program logs
  const subscriptionId = connection.onLogs(
    program.programId,
    (logs, context) => {
      // Parse events from logs
      const events = parseEventsFromLogs(program, logs.logs);

      for (const event of events) {
        if (event.name === 'DepositEvent') {
          const data = event.data as DepositEvent;
          console.log('Deposit:', {
            user: data.user.toBase58(),
            vault: data.vault.toBase58(),
            amount: data.amount.toString(),
            shares: data.sharesMinted.toString(),
          });
        }
      }
    },
    'confirmed'
  );

  return subscriptionId;
}

function parseEventsFromLogs(program: Program, logs: string[]) {
  const events: { name: string; data: any }[] = [];

  for (const log of logs) {
    if (log.startsWith('Program data:')) {
      const base64Data = log.replace('Program data: ', '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Get event discriminator (first 8 bytes)
      const discriminator = buffer.slice(0, 8);

      // Find matching event in IDL
      for (const eventDef of program.idl.events || []) {
        const eventDiscriminator = Buffer.from(
          anchor.utils.sha256.hash(`event:${eventDef.name}`).slice(0, 8)
        );

        if (discriminator.equals(eventDiscriminator)) {
          // Decode event data
          const coder = new anchor.BorshEventCoder(program.idl);
          const decoded = coder.decode(buffer);

          events.push({
            name: eventDef.name,
            data: decoded,
          });
          break;
        }
      }
    }
  }

  return events;
}

// Historical event fetching
export async function fetchHistoricalEvents(
  program: Program,
  connection: Connection,
  fromSlot: number,
  toSlot?: number
): Promise<any[]> {
  const signatures = await connection.getSignaturesForAddress(
    program.programId,
    { minContextSlot: fromSlot }
  );

  const events: any[] = [];

  for (const sig of signatures) {
    const tx = await connection.getTransaction(sig.signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (tx?.meta?.logMessages) {
      const parsedEvents = parseEventsFromLogs(program, tx.meta.logMessages);
      events.push(...parsedEvents.map(e => ({
        ...e,
        signature: sig.signature,
        slot: tx.slot,
        blockTime: tx.blockTime,
      })));
    }
  }

  return events;
}
```

---

## Testing Patterns

### Unit Tests with Bankrun

```typescript
// tests/vault.test.ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { startAnchor, BanksClient, ProgramTestContext } from 'solana-bankrun';
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN, Program, AnchorProvider } from '@coral-xyz/anchor';
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from '@solana/spl-token';

describe('Vault Program', () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let program: Program;
  let provider: AnchorProvider;

  let admin: Keypair;
  let user: Keypair;
  let tokenMint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultPda: PublicKey;
  let vaultBump: number;

  beforeAll(async () => {
    // Initialize keypairs
    admin = Keypair.generate();
    user = Keypair.generate();

    // Start Bankrun with funded accounts
    context = await startAnchor(
      './programs/vault',
      [],
      [
        {
          address: admin.publicKey,
          info: {
            lamports: 100 * LAMPORTS_PER_SOL,
            data: Buffer.from([]),
            owner: SystemProgram.programId,
            executable: false,
          },
        },
        {
          address: user.publicKey,
          info: {
            lamports: 100 * LAMPORTS_PER_SOL,
            data: Buffer.from([]),
            owner: SystemProgram.programId,
            executable: false,
          },
        },
      ]
    );

    client = context.banksClient;
    provider = new AnchorProvider(
      // Create connection from banks client
      { commitment: 'confirmed' } as any,
      { publicKey: admin.publicKey } as any,
      { commitment: 'confirmed' }
    );

    // Find PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), admin.publicKey.toBuffer()],
      program.programId
    );
  });

  beforeEach(async () => {
    // Reset state if needed
  });

  describe('initialize', () => {
    it('should initialize vault with correct parameters', async () => {
      const name = 'Test Vault';
      const feeRate = new BN(100); // 1%

      await program.methods
        .initialize(name, feeRate)
        .accounts({
          vault: vaultPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      // Fetch and verify vault state
      const vault = await program.account.vault.fetch(vaultPda);

      expect(vault.authority.toBase58()).toBe(admin.publicKey.toBase58());
      expect(vault.name).toBe(name);
      expect(vault.feeRate.toNumber()).toBe(100);
      expect(vault.bump).toBe(vaultBump);
    });

    it('should reject invalid fee rate', async () => {
      const name = 'Invalid Vault';
      const feeRate = new BN(10001); // > 100%

      await expect(
        program.methods
          .initialize(name, feeRate)
          .accounts({
            vault: vaultPda,
            authority: admin.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc()
      ).rejects.toThrow(/InvalidFeeRate/);
    });
  });

  describe('deposit', () => {
    const depositAmount = new BN(1_000_000_000); // 1 token

    beforeAll(async () => {
      // Create token mint and user token account
      // Mint tokens to user
    });

    it('should deposit tokens and mint shares', async () => {
      const vaultBefore = await program.account.vault.fetch(vaultPda);
      const userBalanceBefore = (await getAccount(
        connection,
        userTokenAccount
      )).amount;

      await program.methods
        .deposit(depositAmount)
        .accounts({
          vault: vaultPda,
          userTokenAccount,
          vaultTokenAccount,
          user: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      const vaultAfter = await program.account.vault.fetch(vaultPda);
      const userBalanceAfter = (await getAccount(
        connection,
        userTokenAccount
      )).amount;

      // Verify state changes
      expect(vaultAfter.totalDeposited.sub(vaultBefore.totalDeposited).toString())
        .toBe(depositAmount.toString());
      expect(Number(userBalanceBefore) - Number(userBalanceAfter))
        .toBe(depositAmount.toNumber());
    });

    it('should reject deposit when paused', async () => {
      // Pause the vault
      await program.methods
        .pause()
        .accounts({
          vault: vaultPda,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      await expect(
        program.methods
          .deposit(depositAmount)
          .accounts({
            vault: vaultPda,
            userTokenAccount,
            vaultTokenAccount,
            user: user.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user])
          .rpc()
      ).rejects.toThrow(/VaultPaused/);

      // Unpause for subsequent tests
      await program.methods
        .unpause()
        .accounts({
          vault: vaultPda,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();
    });
  });

  describe('withdraw', () => {
    it('should withdraw tokens proportional to shares', async () => {
      // Test withdrawal logic
    });

    it('should prevent withdrawal of more than balance', async () => {
      const excessiveAmount = new BN('999999999999999');

      await expect(
        program.methods
          .withdraw(excessiveAmount)
          .accounts({
            vault: vaultPda,
            user: user.publicKey,
            // ... other accounts
          })
          .signers([user])
          .rpc()
      ).rejects.toThrow(/InsufficientBalance/);
    });
  });

  describe('access control', () => {
    it('should reject non-admin from admin functions', async () => {
      await expect(
        program.methods
          .setFeeRate(new BN(200))
          .accounts({
            vault: vaultPda,
            authority: user.publicKey, // User is not admin
          })
          .signers([user])
          .rpc()
      ).rejects.toThrow(/Unauthorized/);
    });

    it('should allow admin to update fee rate', async () => {
      const newFeeRate = new BN(200);

      await program.methods
        .setFeeRate(newFeeRate)
        .accounts({
          vault: vaultPda,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      const vault = await program.account.vault.fetch(vaultPda);
      expect(vault.feeRate.toNumber()).toBe(200);
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/full-flow.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('Full Protocol Flow', () => {
  // ... setup

  it('should complete full user journey', async () => {
    // 1. Admin initializes protocol
    await program.methods
      .initializeProtocol(new BN(100))
      .accounts({ /* ... */ })
      .signers([admin])
      .rpc();

    // 2. Admin creates pool
    await program.methods
      .createPool(tokenMintA, tokenMintB)
      .accounts({ /* ... */ })
      .signers([admin])
      .rpc();

    // 3. User deposits to pool
    const depositTx = await program.methods
      .deposit(new BN(1_000_000))
      .accounts({ /* ... */ })
      .signers([user])
      .rpc();

    // 4. User swaps tokens
    const swapTx = await program.methods
      .swap(new BN(500_000), new BN(450_000)) // 10% slippage
      .accounts({ /* ... */ })
      .signers([user])
      .rpc();

    // 5. User withdraws
    const withdrawTx = await program.methods
      .withdraw(new BN(500_000))
      .accounts({ /* ... */ })
      .signers([user])
      .rpc();

    // 6. Verify final state
    const userBalance = await getTokenBalance(userTokenAccount);
    expect(userBalance).toBeGreaterThan(0);

    const poolState = await program.account.pool.fetch(poolPda);
    expect(poolState.totalLiquidity.toNumber()).toBeGreaterThan(0);
  });
});
```

---

## Optimization Techniques

### Space Optimization

```rust
use anchor_lang::prelude::*;

// Unoptimized - 113 bytes
#[account]
pub struct UnoptimizedAccount {
    pub authority: Pubkey,    // 32 bytes
    pub is_active: bool,      // 1 byte + 7 padding
    pub balance: u64,         // 8 bytes
    pub is_locked: bool,      // 1 byte + 7 padding
    pub created_at: i64,      // 8 bytes
    pub bump: u8,             // 1 byte + 7 padding
    pub total_deposits: u64,  // 8 bytes
    pub status: u8,           // 1 byte + 7 padding
}

// Optimized - 91 bytes (packed bools and u8s together)
#[account]
pub struct OptimizedAccount {
    pub authority: Pubkey,    // 32 bytes
    pub balance: u64,         // 8 bytes
    pub total_deposits: u64,  // 8 bytes
    pub created_at: i64,      // 8 bytes
    // Pack small types together
    pub is_active: bool,      // 1 byte
    pub is_locked: bool,      // 1 byte
    pub status: u8,           // 1 byte
    pub bump: u8,             // 1 byte
    // Total small types: 4 bytes + 4 padding
}

// Using bitflags for multiple booleans
bitflags::bitflags! {
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
    pub struct AccountFlags: u8 {
        const ACTIVE = 0b00000001;
        const LOCKED = 0b00000010;
        const VERIFIED = 0b00000100;
        const PREMIUM = 0b00001000;
    }
}

#[account]
pub struct FlagOptimizedAccount {
    pub authority: Pubkey,    // 32 bytes
    pub balance: u64,         // 8 bytes
    pub flags: u8,            // 1 byte (replaces 4 bools = 32 bytes)
    pub bump: u8,             // 1 byte
}

impl FlagOptimizedAccount {
    pub fn is_active(&self) -> bool {
        self.flags & AccountFlags::ACTIVE.bits() != 0
    }

    pub fn set_active(&mut self, active: bool) {
        if active {
            self.flags |= AccountFlags::ACTIVE.bits();
        } else {
            self.flags &= !AccountFlags::ACTIVE.bits();
        }
    }
}
```

### Compute Optimization

```rust
use anchor_lang::prelude::*;

// Avoid redundant account fetches
pub fn process_batch(ctx: Context<ProcessBatch>, amounts: Vec<u64>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // Bad: Multiple fetches of clock
    // for amount in &amounts {
    //     let clock = Clock::get()?; // Fetched in each iteration
    //     vault.last_update = clock.unix_timestamp;
    // }

    // Good: Single fetch
    let clock = Clock::get()?;
    let timestamp = clock.unix_timestamp;

    for amount in &amounts {
        vault.process_single(*amount, timestamp)?;
    }

    Ok(())
}

// Use iterators instead of loops with indexing
pub fn sum_balances(accounts: &[AccountInfo]) -> Result<u64> {
    // Bad: Index-based iteration
    // let mut total = 0u64;
    // for i in 0..accounts.len() {
    //     total += parse_balance(&accounts[i])?;
    // }

    // Good: Iterator
    accounts
        .iter()
        .try_fold(0u64, |acc, account| {
            let balance = parse_balance(account)?;
            acc.checked_add(balance).ok_or(error!(ErrorCode::Overflow))
        })
}

// Minimize serialization
pub fn update_single_field(ctx: Context<UpdateField>, new_value: u64) -> Result<()> {
    // Bad: Load entire account, modify, serialize entire account
    // let account = &mut ctx.accounts.large_account;
    // account.single_field = new_value;

    // Good for very large accounts: Direct byte manipulation
    let account_data = &mut ctx.accounts.large_account.try_borrow_mut_data()?;
    let offset = 8 + 32; // discriminator + pubkey
    account_data[offset..offset + 8].copy_from_slice(&new_value.to_le_bytes());

    Ok(())
}

// Batch operations
pub fn batch_transfer(
    ctx: Context<BatchTransfer>,
    recipients: Vec<Pubkey>,
    amounts: Vec<u64>,
) -> Result<()> {
    require!(recipients.len() == amounts.len(), ErrorCode::LengthMismatch);
    require!(recipients.len() <= 10, ErrorCode::TooManyRecipients);

    let remaining_accounts = &ctx.remaining_accounts;
    require!(remaining_accounts.len() == recipients.len(), ErrorCode::AccountMismatch);

    for (i, (recipient, amount)) in recipients.iter().zip(amounts.iter()).enumerate() {
        // Validate and transfer to each recipient
        let recipient_account = &remaining_accounts[i];
        require!(recipient_account.key() == *recipient, ErrorCode::InvalidRecipient);

        // Transfer...
    }

    Ok(())
}
```

---

## Error Handling

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    // Access control errors (6000-6099)
    #[msg("You are not authorized to perform this action")]
    Unauthorized = 6000,

    #[msg("Invalid authority provided")]
    InvalidAuthority = 6001,

    #[msg("Signer is not the owner")]
    NotOwner = 6002,

    // State errors (6100-6199)
    #[msg("Account is not initialized")]
    NotInitialized = 6100,

    #[msg("Account is already initialized")]
    AlreadyInitialized = 6101,

    #[msg("Protocol is paused")]
    ProtocolPaused = 6102,

    #[msg("Vault is not active")]
    VaultInactive = 6103,

    // Validation errors (6200-6299)
    #[msg("Invalid amount provided")]
    InvalidAmount = 6200,

    #[msg("Amount exceeds maximum")]
    AmountExceedsMax = 6201,

    #[msg("Amount below minimum")]
    AmountBelowMin = 6202,

    #[msg("Invalid fee rate")]
    InvalidFeeRate = 6203,

    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded = 6204,

    // Math errors (6300-6399)
    #[msg("Math overflow")]
    MathOverflow = 6300,

    #[msg("Math underflow")]
    MathUnderflow = 6301,

    #[msg("Division by zero")]
    DivisionByZero = 6302,

    // Token errors (6400-6499)
    #[msg("Insufficient balance")]
    InsufficientBalance = 6400,

    #[msg("Invalid mint")]
    InvalidMint = 6401,

    #[msg("Invalid token account")]
    InvalidTokenAccount = 6402,

    // Oracle errors (6500-6599)
    #[msg("Oracle price is stale")]
    StalePriceFeed = 6500,

    #[msg("Oracle price has low confidence")]
    LowConfidencePrice = 6501,

    #[msg("Invalid oracle account")]
    InvalidOracle = 6502,
}

// Custom require macro with error
macro_rules! require_auth {
    ($condition:expr, $signer:expr) => {
        if !$condition {
            msg!("Unauthorized access attempt by: {}", $signer);
            return Err(error!(ErrorCode::Unauthorized));
        }
    };
}

// Usage
pub fn admin_function(ctx: Context<AdminFunction>) -> Result<()> {
    require_auth!(
        ctx.accounts.protocol.authority == ctx.accounts.admin.key(),
        ctx.accounts.admin.key()
    );

    // Continue with admin logic...
    Ok(())
}
```

---

## Security Best Practices

```rust
// Security checklist implementation
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SecureInstruction<'info> {
    // 1. Always validate account ownership
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        // Explicit ownership check
        constraint = vault.owner == owner.key() @ ErrorCode::NotOwner,
    )]
    pub vault: Account<'info, Vault>,

    // 2. Always require signer for authority
    pub owner: Signer<'info>,

    // 3. Validate token account constraints
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = owner,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    // 4. Validate against protocol state
    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        constraint = !protocol.paused @ ErrorCode::ProtocolPaused,
    )]
    pub protocol: Account<'info, Protocol>,

    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

impl<'info> SecureInstruction<'info> {
    // 5. Validate instruction arguments
    pub fn validate_amount(&self, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(
            amount <= self.vault.max_deposit,
            ErrorCode::AmountExceedsMax
        );
        require!(
            amount >= self.vault.min_deposit,
            ErrorCode::AmountBelowMin
        );
        Ok(())
    }
}

pub fn secure_deposit(ctx: Context<SecureInstruction>, amount: u64) -> Result<()> {
    // Validate
    ctx.accounts.validate_amount(amount)?;

    let vault = &mut ctx.accounts.vault;

    // Effects (state changes) before interactions (CPI)
    vault.total_deposited = vault.total_deposited
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;

    vault.last_deposit = Clock::get()?.unix_timestamp;

    // Interactions (CPI) last
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        amount,
    )?;

    // Emit event for monitoring
    emit!(DepositEvent {
        user: ctx.accounts.owner.key(),
        vault: vault.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

---

## Related Skills

- **smart-contract-auditor** - Security auditing for Anchor programs
- **solana-deployer** - Program deployment and upgrades
- **solana-reader** - Reading on-chain state
- **tokenomics-designer** - Token economics design

---

## Further Reading

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Cookbook - Anchor](https://solanacookbook.com/gaming/anchor.html)
- [Anchor Examples Repository](https://github.com/coral-xyz/anchor/tree/master/examples)
- [Neodyme Security Workshop](https://workshop.neodyme.io/)
