# Solana 2025 Stack

> **ID:** `solana-2025-stack`
> **Tier:** 1
> **Token Cost:** 12000
> **MCP Connections:** jupiter, helius, solana, pump_fun, dexscreener

## 🎯 What This Skill Does

Build production-ready Solana applications with modern tooling. This is the complete 2025 stack for Anchor programs, Jupiter integration, PDA patterns, Token-2022, and optimized RPC usage.

**Core Components:**
- Anchor 0.30+ program development
- Jupiter Aggregator V6 swap integration
- PDA (Program Derived Address) patterns
- Token-2022 (Token Extensions) standard
- Helius RPC optimization and webhooks
- Metaplex Core for NFTs
- Compressed NFTs (cNFTs)

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** solana, anchor, jupiter, pda, token-2022, helius, spl-token
- **File Types:** .rs (Rust programs), .ts (Anchor tests)
- **Directories:** programs/, tests/, target/

## 🚀 Core Capabilities

### 1. Anchor Program Development

**Philosophy:**
Anchor is the standard framework for Solana program development in 2025. It provides type safety, automatic account validation, and clean abstractions over raw Solana programming.

**Project Structure:**

```
my-solana-app/
├── Anchor.toml              # Anchor configuration
├── Cargo.toml               # Rust workspace
├── programs/
│   └── my-program/
│       ├── Cargo.toml       # Program dependencies
│       ├── Xfeat.toml      # Feature flags
│       └── src/
│           ├── lib.rs       # Program entrypoint
│           ├── state.rs     # Account structs
│           ├── instructions/
│           │   ├── mod.rs
│           │   ├── initialize.rs
│           │   └── transfer.rs
│           └── errors.rs    # Custom errors
├── tests/
│   └── my-program.ts        # TypeScript tests
├── migrations/
│   └── deploy.ts            # Deployment scripts
└── target/                  # Build artifacts
```

**Architecture:**

```rust
// programs/my-program/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("YourProgramIDHere111111111111111111111111111");

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        instructions::initialize(ctx, amount)
    }

    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        instructions::transfer(ctx, amount)
    }
}

// programs/my-program/src/state.rs
use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub amount: u64,
    pub bump: u8,
}

impl Vault {
    pub const LEN: usize = 8 + 32 + 8 + 1;
}

#[account]
pub struct UserAccount {
    pub owner: Pubkey,
    pub balance: u64,
    pub created_at: i64,
}

impl UserAccount {
    pub const LEN: usize = 8 + 32 + 8 + 8;
}

// programs/my-program/src/instructions/initialize.rs
use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Vault::LEN,
        seeds = [b"vault", authority.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
    require!(amount > 0, MyProgramError::InvalidAmount);

    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.authority.key();
    vault.amount = amount;
    vault.bump = ctx.bumps.vault;

    msg!("Vault initialized with amount: {}", amount);
    Ok(())
}

// programs/my-program/src/instructions/transfer.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
        has_one = authority @ MyProgramError::InvalidAuthority
    )]
    pub vault: Account<'info, Vault>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
    require!(amount > 0, MyProgramError::InvalidAmount);
    require!(amount <= ctx.accounts.vault.amount, MyProgramError::InsufficientFunds);

    // Transfer SPL tokens
    let cpi_accounts = SplTransfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    // Update vault
    ctx.accounts.vault.amount = ctx.accounts.vault.amount
        .checked_sub(amount)
        .ok_or(MyProgramError::Overflow)?;

    msg!("Transferred {} tokens", amount);
    Ok(())
}

// programs/my-program/src/instructions/mod.rs
pub mod initialize;
pub mod transfer;

pub use initialize::*;
pub use transfer::*;

// programs/my-program/src/errors.rs
use anchor_lang::prelude::*;

#[error_code]
pub enum MyProgramError {
    #[msg("Invalid amount provided")]
    InvalidAmount,

    #[msg("Invalid authority")]
    InvalidAuthority,

    #[msg("Insufficient funds in vault")]
    InsufficientFunds,

    #[msg("Arithmetic overflow")]
    Overflow,
}
```

**Testing:**

```typescript
// tests/my-program.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("my-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MyProgram as Program<MyProgram>;
  const authority = provider.wallet.publicKey;

  let vaultPda: PublicKey;
  let vaultBump: number;

  before(async () => {
    // Derive PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), authority.toBuffer()],
      program.programId
    );
  });

  it("Initializes vault", async () => {
    const amount = new anchor.BN(1000);

    const tx = await program.methods
      .initialize(amount)
      .accounts({
        vault: vaultPda,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction signature:", tx);

    // Fetch and verify account
    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.authority.toBase58()).to.equal(authority.toBase58());
    expect(vault.amount.toNumber()).to.equal(1000);
    expect(vault.bump).to.equal(vaultBump);
  });

  it("Transfers tokens", async () => {
    // Implementation depends on SPL token setup
    // This is a simplified example
  });

  it("Fails with invalid amount", async () => {
    try {
      await program.methods
        .initialize(new anchor.BN(0))
        .accounts({
          vault: vaultPda,
          authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("InvalidAmount");
    }
  });
});
```

**Best Practices:**
- Use PDAs for program-owned accounts (no private keys needed)
- Validate all account ownership and constraints
- Use checked math operations to prevent overflow
- Implement comprehensive error handling
- Write unit tests for all instructions
- Use feature flags for different environments
- Keep instruction logic focused and composable
- Document all account constraints
- Use proper Anchor constraints (#[account(...)])
- Test on devnet before mainnet

**Common Patterns:**

```rust
// State versioning for upgrades
#[account]
pub struct VaultV1 {
    pub version: u8,  // Add version field
    pub authority: Pubkey,
    pub amount: u64,
}

// Close account and reclaim rent
#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(
        mut,
        close = authority,  // Send rent to authority
        has_one = authority
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// Realloc for dynamic sizing
#[derive(Accounts)]
#[instruction(new_size: u16)]
pub struct ResizeAccount<'info> {
    #[account(
        mut,
        realloc = 8 + 4 + (new_size as usize),
        realloc::payer = payer,
        realloc::zero = false,
    )]
    pub account: Account<'info, DynamicAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
```

**Gotchas:**
- PDAs can't sign transactions (use invoke_signed)
- Account discriminators (8 bytes) are automatically added by Anchor
- Seeds must be deterministic (no dynamic data like Clock)
- Max account size is 10MB
- CPI (Cross-Program Invocation) has a depth limit of 4
- Rent must be paid for all accounts
- Account reallocation is limited to 10KB per instruction

### 2. Jupiter Swap Integration

**Philosophy:**
Jupiter Aggregator is the best way to swap tokens on Solana. It finds optimal routes across all DEXes and provides a simple API.

**Architecture:**

```typescript
// src/jupiter/swap.ts
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@coral-xyz/anchor';

export class JupiterSwap {
  private connection: Connection;
  private wallet: Wallet;
  private apiUrl: string;

  constructor(config: {
    rpcUrl: string;
    wallet: Wallet;
    apiUrl?: string;
  }) {
    this.connection = new Connection(config.rpcUrl);
    this.wallet = config.wallet;
    this.apiUrl = config.apiUrl || 'https://quote-api.jup.ag/v6';
  }

  /**
   * Get quote for a swap
   */
  async getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number; // 50 = 0.5%
  }): Promise<any> {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;

    const response = await fetch(
      `${this.apiUrl}/quote?` +
        `inputMint=${inputMint}&` +
        `outputMint=${outputMint}&` +
        `amount=${amount}&` +
        `slippageBps=${slippageBps}`
    );

    if (!response.ok) {
      throw new Error(`Jupiter quote failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute swap
   */
  async swap(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
  }): Promise<string> {
    // 1. Get quote
    const quote = await this.getQuote(params);

    console.log('Quote:', {
      inputAmount: quote.inAmount,
      outputAmount: quote.outAmount,
      priceImpact: quote.priceImpactPct,
      route: quote.routePlan.map((r: any) => r.swapInfo.label).join(' -> '),
    });

    // 2. Get swap transaction
    const swapResponse = await fetch(`${this.apiUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: this.wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!swapResponse.ok) {
      throw new Error(`Jupiter swap failed: ${swapResponse.statusText}`);
    }

    const { swapTransaction } = await swapResponse.json();

    // 3. Deserialize and sign transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    transaction.sign([this.wallet.payer]);

    // 4. Send transaction
    const rawTransaction = transaction.serialize();
    const txid = await this.connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      maxRetries: 3,
    });

    // 5. Confirm transaction
    await this.connection.confirmTransaction(txid, 'confirmed');

    console.log('Swap executed:', txid);
    return txid;
  }

  /**
   * Get all supported tokens
   */
  async getTokenList(): Promise<Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  }>> {
    const response = await fetch(`${this.apiUrl}/tokens`);
    return await response.json();
  }

  /**
   * Get token price in USDC
   */
  async getPrice(mintAddress: string): Promise<number> {
    const response = await fetch(
      `${this.apiUrl}/price?ids=${mintAddress}`
    );

    const data = await response.json();
    return data.data[mintAddress]?.price || 0;
  }

  /**
   * Swap with retry logic
   */
  async swapWithRetry(
    params: {
      inputMint: string;
      outputMint: string;
      amount: number;
      slippageBps?: number;
    },
    maxRetries: number = 3
  ): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.swap(params);
      } catch (error: any) {
        console.error(`Swap attempt ${i + 1} failed:`, error.message);

        if (i === maxRetries - 1) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * Math.pow(2, i))
        );
      }
    }

    throw new Error('Max retries exceeded');
  }
}

// Example usage
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function swapExample() {
  const jupiter = new JupiterSwap({
    rpcUrl: process.env.HELIUS_RPC_URL!,
    wallet: myWallet,
  });

  // Swap 1 SOL for USDC
  const txid = await jupiter.swap({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: 1_000_000_000, // 1 SOL (9 decimals)
    slippageBps: 50, // 0.5% slippage
  });

  console.log('Swap transaction:', txid);
}
```

**React Integration:**

```typescript
// src/hooks/useJupiterSwap.ts
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { JupiterSwap } from '../jupiter/swap';

export function useJupiterSwap() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swap = async (params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
  }) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const jupiter = new JupiterSwap({
        rpcUrl: connection.rpcEndpoint,
        wallet: wallet as any,
      });

      const txid = await jupiter.swap(params);
      return txid;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { swap, loading, error };
}

// Component usage
function SwapWidget() {
  const { swap, loading } = useJupiterSwap();

  const handleSwap = async () => {
    try {
      const txid = await swap({
        inputMint: SOL_MINT,
        outputMint: USDC_MINT,
        amount: 1_000_000_000,
        slippageBps: 50,
      });

      alert(`Swap successful! TX: ${txid}`);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  return (
    <button onClick={handleSwap} disabled={loading}>
      {loading ? 'Swapping...' : 'Swap 1 SOL to USDC'}
    </button>
  );
}
```

**Best Practices:**
- Always check price impact before swapping
- Use appropriate slippage tolerance (0.5-1% for stable pairs)
- Enable dynamic compute units for better execution
- Set priority fees for faster confirmation
- Wrap/unwrap SOL automatically
- Show route information to users
- Implement retry logic for failed swaps
- Monitor for sandwich attacks (high price impact)
- Use versioned transactions for Jupiter V6

**Common Patterns:**

```typescript
// Price comparison across DEXes
async function comparePrices(
  jupiter: JupiterSwap,
  inputMint: string,
  outputMint: string,
  amount: number
) {
  const quote = await jupiter.getQuote({
    inputMint,
    outputMint,
    amount,
  });

  return {
    bestPrice: quote.outAmount,
    route: quote.routePlan.map((r: any) => ({
      dex: r.swapInfo.label,
      amountIn: r.swapInfo.inAmount,
      amountOut: r.swapInfo.outAmount,
    })),
  };
}

// Dollar Cost Averaging (DCA)
async function setupDCA(
  jupiter: JupiterSwap,
  params: {
    inputMint: string;
    outputMint: string;
    totalAmount: number;
    frequency: number; // seconds
    numOrders: number;
  }
) {
  const amountPerOrder = params.totalAmount / params.numOrders;

  for (let i = 0; i < params.numOrders; i++) {
    await new Promise(resolve => setTimeout(resolve, params.frequency * 1000));

    try {
      await jupiter.swap({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: amountPerOrder,
      });

      console.log(`DCA order ${i + 1}/${params.numOrders} completed`);
    } catch (error) {
      console.error(`DCA order ${i + 1} failed:`, error);
    }
  }
}
```

**Gotchas:**
- Jupiter quotes expire after 20 seconds
- Price impact can be high for large trades
- Not all token pairs have direct routes
- Failed swaps still consume transaction fees
- Versioned transactions require recent RPC nodes

### 3. PDA (Program Derived Address) Patterns

**Philosophy:**
PDAs are deterministic addresses owned by programs. They're the foundation of Solana program architecture and enable secure, keyless account management.

**Architecture:**

```rust
// Common PDA patterns

// 1. Single PDA per user
#[derive(Accounts)]
pub struct UserPDA<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// 2. Global state PDA
#[derive(Accounts)]
pub struct GlobalState<'info> {
    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + 32 + 8 + 1,
        seeds = [b"global_state"],
        bump
    )]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// 3. Token vault PDA
#[derive(Accounts)]
pub struct TokenVault<'info> {
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [b"vault", mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// 4. Escrow PDA
#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = maker,
        space = 8 + 32 + 32 + 8 + 8 + 1,
        seeds = [
            b"escrow",
            maker.key().as_ref(),
            escrow_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub maker: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// 5. Metadata PDA (following Metaplex pattern)
#[derive(Accounts)]
pub struct CreateMetadata<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 200,
        seeds = [
            b"metadata",
            program_id.as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub metadata: Account<'info, Metadata>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// 6. Associated PDA (multiple per user)
#[derive(Accounts)]
#[instruction(item_id: String)]
pub struct CreateItem<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 8,
        seeds = [
            b"item",
            user.key().as_ref(),
            item_id.as_bytes()
        ],
        bump
    )]
    pub item: Account<'info, Item>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Signing with PDAs (CPI)
pub fn transfer_from_vault(ctx: Context<TransferFromVault>, amount: u64) -> Result<()> {
    let mint = ctx.accounts.mint.key();
    let seeds = &[
        b"vault",
        mint.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token.to_account_info(),
        to: ctx.accounts.destination.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
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
```

**TypeScript Client:**

```typescript
// src/pda/utils.ts
import { PublicKey } from '@solana/web3.js';

export function findProgramAddress(
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

export function findUserPDA(
  user: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return findProgramAddress(
    [Buffer.from('user'), user.toBuffer()],
    programId
  );
}

export function findVaultPDA(
  mint: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return findProgramAddress(
    [Buffer.from('vault'), mint.toBuffer()],
    programId
  );
}

export function findEscrowPDA(
  maker: PublicKey,
  escrowId: number,
  programId: PublicKey
): [PublicKey, number] {
  const buffer = Buffer.allocUnsafe(8);
  buffer.writeBigUInt64LE(BigInt(escrowId));

  return findProgramAddress(
    [Buffer.from('escrow'), maker.toBuffer(), buffer],
    programId
  );
}

export function findMetadataPDA(
  mint: PublicKey,
  metaplexProgramId: PublicKey
): [PublicKey, number] {
  return findProgramAddress(
    [
      Buffer.from('metadata'),
      metaplexProgramId.toBuffer(),
      mint.toBuffer(),
    ],
    metaplexProgramId
  );
}

// Usage in tests
describe('PDA Tests', () => {
  it('Derives user PDA correctly', async () => {
    const [userPda, bump] = findUserPDA(user.publicKey, program.programId);

    await program.methods
      .createUser()
      .accounts({
        userAccount: userPda,
        user: user.publicKey,
      })
      .signers([user])
      .rpc();

    const account = await program.account.userAccount.fetch(userPda);
    expect(account.owner.toBase58()).to.equal(user.publicKey.toBase58());
  });
});
```

**Best Practices:**
- Store bump in account to avoid recomputation
- Use meaningful seed prefixes (b"vault", b"user")
- Keep seeds deterministic (no dynamic runtime data)
- Document PDA derivation in comments
- Test PDA collisions (rare but possible)
- Use init_if_needed carefully (security risk)
- Validate PDA ownership in constraints
- Cache PDAs on client side
- Use consistent seed ordering

**Common Patterns:**

```rust
// PDA with version for upgrades
seeds = [b"vault", b"v1", mint.key().as_ref()],

// PDA with multiple identifiers
seeds = [
    b"order",
    user.key().as_ref(),
    market.key().as_ref(),
    order_id.to_le_bytes().as_ref()
],

// Canonical bump (most efficient)
#[account(
    seeds = [b"vault"],
    bump = vault.bump,  // Store and reuse
)]

// PDA authority pattern
#[account(
    mut,
    seeds = [b"authority"],
    bump,
    constraint = authority.key() == program_authority
)]
```

**Gotchas:**
- Only one bump value per seed combination is valid
- PDAs are off-curve (can't sign without invoke_signed)
- Seed length limit is 32 bytes per seed
- Max 16 seeds per PDA
- Finding bump is computationally expensive (store it)
- PDA can own other PDAs

### 4. Token-2022 (Token Extensions)

**Philosophy:**
Token-2022 (also called Token Extensions) is the evolution of SPL Token with built-in features like transfer fees, interest, and confidential transfers.

**Architecture:**

```rust
// Cargo.toml
[dependencies]
anchor-lang = "0.30.0"
anchor-spl = "0.30.0"
spl-token-2022 = "0.9.0"

// programs/token-extensions/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{self, Token2022, MintTo, Transfer},
    associated_token::AssociatedToken,
};
use spl_token_2022::{
    extension::{
        transfer_fee::TransferFeeConfig,
        interest_bearing_mint::InterestBearingConfig,
        ExtensionType,
    },
    state::Mint as Token2022Mint,
};

declare_id!("YourProgramID");

#[program]
pub mod token_extensions {
    use super::*;

    // Create mint with transfer fee extension
    pub fn create_mint_with_transfer_fee(
        ctx: Context<CreateMintWithTransferFee>,
        decimals: u8,
        transfer_fee_basis_points: u16,
        max_fee: u64,
    ) -> Result<()> {
        // Mint is initialized with transfer fee extension
        // in the account initialization
        Ok(())
    }

    // Create mint with interest bearing extension
    pub fn create_mint_with_interest(
        ctx: Context<CreateMintWithInterest>,
        decimals: u8,
        rate: i16,  // Basis points per year
    ) -> Result<()> {
        Ok(())
    }

    // Mint tokens
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        token_2022::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    // Transfer with automatic fee deduction
    pub fn transfer_tokens(
        ctx: Context<TransferTokens>,
        amount: u64,
    ) -> Result<()> {
        // Transfer fee is automatically deducted if enabled
        token_2022::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(decimals: u8, transfer_fee_basis_points: u16, max_fee: u64)]
pub struct CreateMintWithTransferFee<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = decimals,
        mint::authority = authority,
        mint::freeze_authority = authority,
        extensions::transfer_fee::fee_config_authority = authority,
        extensions::transfer_fee::withdraw_withheld_authority = authority,
        extensions::transfer_fee::transfer_fee_basis_points = transfer_fee_basis_points,
        extensions::transfer_fee::maximum_fee = max_fee,
    )]
    pub mint: InterfaceAccount<'info, Token2022Mint>,

    /// CHECK: Authority for mint
    pub authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(decimals: u8, rate: i16)]
pub struct CreateMintWithInterest<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = decimals,
        mint::authority = authority,
        extensions::interest_bearing_config::rate = rate,
        extensions::interest_bearing_config::rate_authority = authority,
    )]
    pub mint: InterfaceAccount<'info, Token2022Mint>,

    /// CHECK: Authority
    pub authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Token2022Mint>,

    #[account(mut)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub to: InterfaceAccount<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
}
```

**TypeScript Client:**

```typescript
// src/token2022/client.ts
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createInitializeInterestBearingMintInstruction,
  getMintLen,
  ExtensionType,
} from '@solana/spl-token';

export async function createMintWithTransferFee(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,
  decimals: number,
  transferFeeBasisPoints: number,
  maxFee: bigint
): Promise<PublicKey> {
  const mint = Keypair.generate();

  // Calculate space for mint with transfer fee extension
  const extensions = [ExtensionType.TransferFeeConfig];
  const mintLen = getMintLen(extensions);

  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mint.publicKey,
      mintAuthority,
      mintAuthority,
      transferFeeBasisPoints,
      maxFee,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      mintAuthority,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  await connection.sendTransaction(transaction, [payer, mint]);

  return mint.publicKey;
}

export async function createMintWithInterest(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,
  decimals: number,
  rate: number // Basis points per year
): Promise<PublicKey> {
  const mint = Keypair.generate();

  const extensions = [ExtensionType.InterestBearingConfig];
  const mintLen = getMintLen(extensions);

  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeInterestBearingMintInstruction(
      mint.publicKey,
      mintAuthority,
      rate,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      mintAuthority,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  await connection.sendTransaction(transaction, [payer, mint]);

  return mint.publicKey;
}
```

**Best Practices:**
- Use Token-2022 for new projects (more features)
- Understand extension costs (more space = more rent)
- Test transfer fees thoroughly (affects UX)
- Document which extensions are enabled
- Handle fee calculations on client side
- Use appropriate extension combinations
- Consider backwards compatibility with SPL Token
- Audit extension interactions

**Common Patterns:**

```typescript
// Query transfer fee
import { getTransferFeeConfig } from '@solana/spl-token';

async function getTransferFee(
  connection: Connection,
  mint: PublicKey
): Promise<{ feeBasisPoints: number; maxFee: bigint }> {
  const mintInfo = await connection.getAccountInfo(mint);
  if (!mintInfo) throw new Error('Mint not found');

  const config = getTransferFeeConfig(mintInfo);
  if (!config) throw new Error('No transfer fee config');

  return {
    feeBasisPoints: config.newerTransferFee.transferFeeBasisPoints,
    maxFee: config.newerTransferFee.maximumFee,
  };
}

// Calculate fee for transfer
function calculateFee(
  amount: bigint,
  feeBasisPoints: number,
  maxFee: bigint
): bigint {
  const fee = (amount * BigInt(feeBasisPoints)) / BigInt(10000);
  return fee > maxFee ? maxFee : fee;
}
```

**Gotchas:**
- Token-2022 is NOT backwards compatible with SPL Token
- Not all wallets support Token-2022 yet
- Transfer fees are deducted from recipient's amount
- Extensions increase mint account size (more rent)
- Some extensions are mutually exclusive

### 5. Helius RPC Optimization

**Philosophy:**
Helius provides the best Solana RPC infrastructure with enhanced APIs, webhooks, and optimizations. Essential for production applications.

**Architecture:**

```typescript
// src/helius/client.ts
import { Connection, PublicKey } from '@solana/web3.js';
import fetch from 'cross-fetch';

export class HeliusClient {
  private connection: Connection;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, network: 'mainnet-beta' | 'devnet' = 'mainnet-beta') {
    this.apiKey = apiKey;
    this.baseUrl = `https://api.helius.xyz/v0`;
    this.connection = new Connection(
      `https://${network}.helius-rpc.com/?api-key=${apiKey}`,
      'confirmed'
    );
  }

  /**
   * Get enhanced transaction with parsed data
   */
  async getEnhancedTransaction(signature: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/transactions?api-key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: [signature],
        }),
      }
    );

    const data = await response.json();
    return data[0];
  }

  /**
   * Get parsed transaction history for address
   */
  async getTransactionHistory(
    address: string,
    options?: {
      limit?: number;
      before?: string;
      until?: string;
    }
  ): Promise<any[]> {
    const params = new URLSearchParams({
      'api-key': this.apiKey,
      address,
      ...(options?.limit && { limit: options.limit.toString() }),
      ...(options?.before && { before: options.before }),
      ...(options?.until && { until: options.until }),
    });

    const response = await fetch(
      `${this.baseUrl}/addresses/${address}/transactions?${params}`
    );

    return await response.json();
  }

  /**
   * Get all assets (tokens + NFTs) owned by address
   */
  async getAssets(
    owner: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/addresses/${owner}/balances?api-key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: options?.page || 1,
          limit: options?.limit || 100,
        }),
      }
    );

    return await response.json();
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(mintAddresses: string[]): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/nfts?api-key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddresses,
        }),
      }
    );

    return await response.json();
  }

  /**
   * Create webhook for monitoring addresses
   */
  async createWebhook(params: {
    webhookURL: string;
    accountAddresses: string[];
    transactionTypes?: string[];
  }): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/webhooks?api-key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookURL: params.webhookURL,
          accountAddresses: params.accountAddresses,
          transactionTypes: params.transactionTypes || ['Any'],
          webhookType: 'enhanced',
        }),
      }
    );

    const data = await response.json();
    return data.webhookID;
  }

  /**
   * Get webhook status
   */
  async getWebhook(webhookId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/webhooks/${webhookId}?api-key=${this.apiKey}`
    );

    return await response.json();
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await fetch(
      `${this.baseUrl}/webhooks/${webhookId}?api-key=${this.apiKey}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Get priority fee recommendation
   */
  async getPriorityFee(options?: {
    accountKeys?: string[];
    percentile?: number;
  }): Promise<number> {
    const response = await fetch(
      `${this.baseUrl}/priority-fee?api-key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountKeys: options?.accountKeys || [],
          percentile: options?.percentile || 50,
        }),
      }
    );

    const data = await response.json();
    return data.priorityFee;
  }

  /**
   * Standard connection (for web3.js operations)
   */
  getConnection(): Connection {
    return this.connection;
  }
}
```

**Best Practices:**
- Use enhanced transactions for better parsing
- Implement webhooks for real-time monitoring
- Query priority fees before transactions
- Batch NFT metadata requests
- Use Helius for transaction history (faster than RPC)
- Monitor API usage and rate limits
- Cache frequently accessed data
- Use appropriate RPC endpoint (dedicated > shared)

**Common Patterns:**

```typescript
// Transaction monitoring with webhooks
async function monitorWallet(helius: HeliusClient, address: string) {
  const webhookId = await helius.createWebhook({
    webhookURL: 'https://your-app.com/api/webhook',
    accountAddresses: [address],
    transactionTypes: ['Any'],
  });

  console.log('Webhook created:', webhookId);

  // Your webhook endpoint receives:
  // POST /api/webhook
  // Body: { signature, type, timestamp, ... }
}

// Optimized transaction sending
async function sendOptimizedTransaction(
  helius: HeliusClient,
  transaction: Transaction,
  signers: Keypair[]
) {
  // Get recommended priority fee
  const priorityFee = await helius.getPriorityFee();

  // Add compute budget and priority fee
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee })
  );

  // Send with retry
  const connection = helius.getConnection();
  const signature = await connection.sendTransaction(transaction, signers, {
    skipPreflight: false,
    maxRetries: 3,
  });

  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}
```

**Gotchas:**
- Webhooks have delivery guarantees but can be delayed
- Enhanced transactions may have different format than raw
- Priority fees fluctuate (query frequently)
- Rate limits apply (check your plan)
- Webhook retries can cause duplicates (idempotency needed)

## 💡 Real-World Examples

### Example 1: Token Swap DEX with Jupiter

A complete decentralized exchange interface using Jupiter.

```typescript
// src/examples/dex.tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { JupiterSwap } from '../jupiter/swap';
import { HeliusClient } from '../helius/client';

export function SwapInterface() {
  const wallet = useWallet();
  const [inputMint, setInputMint] = useState('SOL');
  const [outputMint, setOutputMint] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const helius = new HeliusClient(process.env.HELIUS_API_KEY!);
  const jupiter = new JupiterSwap({
    rpcUrl: helius.getConnection().rpcEndpoint,
    wallet: wallet as any,
  });

  const fetchQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      const amountInSmallestUnit = parseFloat(amount) * 1e9; // SOL decimals
      const quote = await jupiter.getQuote({
        inputMint: MINT_ADDRESSES[inputMint],
        outputMint: MINT_ADDRESSES[outputMint],
        amount: amountInSmallestUnit,
        slippageBps: 50,
      });

      setQuote(quote);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote || !wallet.publicKey) return;

    setLoading(true);
    try {
      const txid = await jupiter.swap({
        inputMint: MINT_ADDRESSES[inputMint],
        outputMint: MINT_ADDRESSES[outputMint],
        amount: quote.inAmount,
        slippageBps: 50,
      });

      alert(`Swap successful! TX: ${txid}`);
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Swap Tokens</h2>

      {/* Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">From</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={fetchQuote}
            className="flex-1 px-3 py-2 border rounded"
            placeholder="0.0"
          />
          <select
            value={inputMint}
            onChange={(e) => setInputMint(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option>SOL</option>
            <option>USDC</option>
          </select>
        </div>
      </div>

      {/* Output */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">To</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={quote ? (quote.outAmount / 1e6).toFixed(2) : ''}
            readOnly
            className="flex-1 px-3 py-2 border rounded bg-gray-50"
            placeholder="0.0"
          />
          <select
            value={outputMint}
            onChange={(e) => setOutputMint(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option>USDC</option>
            <option>SOL</option>
          </select>
        </div>
      </div>

      {/* Quote details */}
      {quote && (
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
          <div className="flex justify-between mb-1">
            <span>Rate:</span>
            <span>{(quote.outAmount / quote.inAmount).toFixed(6)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Price Impact:</span>
            <span className={quote.priceImpactPct > 1 ? 'text-red-600' : ''}>
              {quote.priceImpactPct}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Route:</span>
            <span className="text-xs">
              {quote.routePlan.map((r: any) => r.swapInfo.label).join(' → ')}
            </span>
          </div>
        </div>
      )}

      {/* Swap button */}
      <button
        onClick={executeSwap}
        disabled={!quote || loading || !wallet.connected}
        className="w-full py-3 bg-blue-600 text-white rounded font-medium disabled:bg-gray-300"
      >
        {loading ? 'Processing...' : wallet.connected ? 'Swap' : 'Connect Wallet'}
      </button>
    </div>
  );
}

const MINT_ADDRESSES: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};
```

### Example 2: NFT Minting with Metaplex Core

Complete NFT minting implementation.

```typescript
// src/examples/nft-mint.ts
import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import { Connection, Keypair } from '@solana/web3.js';
import fs from 'fs';

export async function mintNFT(params: {
  connection: Connection;
  payer: Keypair;
  name: string;
  symbol: string;
  description: string;
  imagePath: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}) {
  const metaplex = Metaplex.make(params.connection)
    .use(keypairIdentity(params.payer))
    .use(bundlrStorage());

  // 1. Upload image
  console.log('Uploading image...');
  const imageBuffer = fs.readFileSync(params.imagePath);
  const imageUri = await metaplex.storage().upload(imageBuffer);
  console.log('Image uploaded:', imageUri);

  // 2. Upload metadata
  console.log('Uploading metadata...');
  const { uri: metadataUri } = await metaplex.nfts().uploadMetadata({
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: imageUri,
    attributes: params.attributes || [],
  });
  console.log('Metadata uploaded:', metadataUri);

  // 3. Mint NFT
  console.log('Minting NFT...');
  const { nft } = await metaplex.nfts().create({
    uri: metadataUri,
    name: params.name,
    symbol: params.symbol,
    sellerFeeBasisPoints: 500, // 5% royalty
  });

  console.log('NFT minted:', nft.address.toBase58());
  return nft;
}

// Usage
const nft = await mintNFT({
  connection: new Connection('https://api.mainnet-beta.solana.com'),
  payer: myKeypair,
  name: 'My Cool NFT',
  symbol: 'COOL',
  description: 'This is a cool NFT',
  imagePath: './image.png',
  attributes: [
    { trait_type: 'Background', value: 'Blue' },
    { trait_type: 'Rarity', value: 'Rare' },
  ],
});
```

## 🔗 Related Skills

- **react-nextjs-stack** - Frontend for Solana dApps
- **rust-performance** - Optimize Anchor programs
- **api-design-patterns** - Build Solana indexers
- **testing-patterns** - Test Solana programs

## 📖 Further Reading

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Jupiter Documentation](https://docs.jup.ag/)
- [Helius Documentation](https://docs.helius.dev/)
- [Token-2022 Guide](https://spl.solana.com/token-2022)
- [Metaplex Documentation](https://docs.metaplex.com/)
- [Solana Program Library](https://github.com/solana-labs/solana-program-library)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
