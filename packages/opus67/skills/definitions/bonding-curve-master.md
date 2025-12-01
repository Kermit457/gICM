# Bonding Curve Master

You are an expert in bonding curve mathematics, token economics, and AMM design.

## Core Mathematics

### Constant Product (x * y = k)

The most common AMM formula used by Uniswap, Raydium, etc.

```
reserve_sol * reserve_token = k (constant)

Price = reserve_sol / reserve_token

Buy tokens:
  tokens_out = reserve_token - k / (reserve_sol + sol_in)
  tokens_out = reserve_token * sol_in / (reserve_sol + sol_in)

Sell tokens:
  sol_out = reserve_sol - k / (reserve_token + tokens_in)
  sol_out = reserve_sol * tokens_in / (reserve_token + tokens_in)
```

### Implementation (Rust)

```rust
pub fn calculate_buy(
    reserve_sol: u64,
    reserve_token: u64,
    sol_in: u64,
) -> Result<u64> {
    // tokens_out = reserve_token * sol_in / (reserve_sol + sol_in)
    let numerator = (reserve_token as u128)
        .checked_mul(sol_in as u128)
        .ok_or(ErrorCode::Overflow)?;
    
    let denominator = (reserve_sol as u128)
        .checked_add(sol_in as u128)
        .ok_or(ErrorCode::Overflow)?;
    
    let tokens_out = numerator
        .checked_div(denominator)
        .ok_or(ErrorCode::Overflow)?;
    
    Ok(u64::try_from(tokens_out).map_err(|_| ErrorCode::Overflow)?)
}

pub fn calculate_sell(
    reserve_sol: u64,
    reserve_token: u64,
    tokens_in: u64,
) -> Result<u64> {
    // sol_out = reserve_sol * tokens_in / (reserve_token + tokens_in)
    let numerator = (reserve_sol as u128)
        .checked_mul(tokens_in as u128)
        .ok_or(ErrorCode::Overflow)?;
    
    let denominator = (reserve_token as u128)
        .checked_add(tokens_in as u128)
        .ok_or(ErrorCode::Overflow)?;
    
    let sol_out = numerator
        .checked_div(denominator)
        .ok_or(ErrorCode::Overflow)?;
    
    Ok(u64::try_from(sol_out).map_err(|_| ErrorCode::Overflow)?)
}
```

### Price Impact & Slippage

```rust
pub fn calculate_price_impact(
    reserve_sol: u64,
    reserve_token: u64,
    sol_in: u64,
) -> u64 {
    // Current price
    let price_before = (reserve_sol as u128) * PRECISION / (reserve_token as u128);
    
    // New reserves after trade
    let new_reserve_sol = reserve_sol + sol_in;
    let tokens_out = calculate_buy(reserve_sol, reserve_token, sol_in)?;
    let new_reserve_token = reserve_token - tokens_out;
    
    // New price
    let price_after = (new_reserve_sol as u128) * PRECISION / (new_reserve_token as u128);
    
    // Impact in basis points
    let impact = (price_after - price_before) * 10000 / price_before;
    impact as u64
}

pub fn check_slippage(
    expected_out: u64,
    actual_out: u64,
    max_slippage_bps: u64,
) -> Result<()> {
    let min_out = expected_out
        .checked_mul(10000 - max_slippage_bps)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000)
        .ok_or(ErrorCode::Overflow)?;
    
    require!(actual_out >= min_out, ErrorCode::SlippageExceeded);
    Ok(())
}
```

## ICM Motion Specifics

### Virtual Reserves (Pump.fun Style)

```rust
#[account]
pub struct BondingCurve {
    pub mint: Pubkey,
    pub authority: Pubkey,
    
    // Virtual reserves (not real SOL/tokens)
    pub virtual_sol_reserve: u64,    // Starts at 30 SOL
    pub virtual_token_reserve: u64,  // Starts at 1B tokens
    
    // Real reserves (actual holdings)
    pub real_sol_reserve: u64,       // Starts at 0
    pub real_token_reserve: u64,     // Starts at total supply
    
    // State
    pub total_supply: u64,
    pub is_frozen: bool,
    pub migration_threshold: u64,    // 85 SOL
    pub bump: u8,
}

impl BondingCurve {
    pub const INITIAL_VIRTUAL_SOL: u64 = 30_000_000_000;      // 30 SOL
    pub const INITIAL_VIRTUAL_TOKEN: u64 = 1_000_000_000_000; // 1B tokens
    pub const MIGRATION_THRESHOLD: u64 = 85_000_000_000;      // 85 SOL
    
    pub fn get_price(&self) -> u64 {
        // Price = virtual_sol / virtual_token (in lamports per token)
        (self.virtual_sol_reserve as u128)
            .checked_mul(1_000_000) // 6 decimal precision
            .unwrap()
            .checked_div(self.virtual_token_reserve as u128)
            .unwrap() as u64
    }
    
    pub fn should_migrate(&self) -> bool {
        self.real_sol_reserve >= self.migration_threshold
    }
}
```

### Fee Structure

```rust
pub const BUY_FEE_BPS: u64 = 100;   // 1%
pub const SELL_FEE_BPS: u64 = 100;  // 1%

pub fn apply_buy_fee(sol_in: u64) -> Result<(u64, u64)> {
    let fee = sol_in
        .checked_mul(BUY_FEE_BPS)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000)
        .ok_or(ErrorCode::Overflow)?;
    
    let sol_after_fee = sol_in
        .checked_sub(fee)
        .ok_or(ErrorCode::Overflow)?;
    
    Ok((sol_after_fee, fee))
}

pub fn apply_sell_fee(sol_out: u64) -> Result<(u64, u64)> {
    let fee = sol_out
        .checked_mul(SELL_FEE_BPS)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000)
        .ok_or(ErrorCode::Overflow)?;
    
    let sol_after_fee = sol_out
        .checked_sub(fee)
        .ok_or(ErrorCode::Overflow)?;
    
    Ok((sol_after_fee, fee))
}
```

### Buy Implementation

```rust
pub fn buy(ctx: Context<Buy>, sol_amount: u64, min_tokens_out: u64) -> Result<()> {
    let curve = &mut ctx.accounts.curve;
    
    require!(!curve.is_frozen, ErrorCode::CurveFrozen);
    
    // Apply fee
    let (sol_after_fee, fee) = apply_buy_fee(sol_amount)?;
    
    // Calculate tokens out using virtual reserves
    let tokens_out = calculate_buy(
        curve.virtual_sol_reserve,
        curve.virtual_token_reserve,
        sol_after_fee,
    )?;
    
    // Slippage check
    require!(tokens_out >= min_tokens_out, ErrorCode::SlippageExceeded);
    
    // Update virtual reserves
    curve.virtual_sol_reserve = curve.virtual_sol_reserve
        .checked_add(sol_after_fee)
        .ok_or(ErrorCode::Overflow)?;
    curve.virtual_token_reserve = curve.virtual_token_reserve
        .checked_sub(tokens_out)
        .ok_or(ErrorCode::Overflow)?;
    
    // Update real reserves
    curve.real_sol_reserve = curve.real_sol_reserve
        .checked_add(sol_amount) // Full amount including fee
        .ok_or(ErrorCode::Overflow)?;
    curve.real_token_reserve = curve.real_token_reserve
        .checked_sub(tokens_out)
        .ok_or(ErrorCode::Overflow)?;
    
    // Transfer SOL from buyer to curve PDA
    transfer_sol(
        &ctx.accounts.buyer,
        &ctx.accounts.curve_sol_vault,
        sol_amount,
    )?;
    
    // Transfer tokens from curve to buyer
    transfer_tokens_with_pda(
        &ctx.accounts.curve_token_vault,
        &ctx.accounts.buyer_token_account,
        tokens_out,
        curve_signer_seeds,
    )?;
    
    // Emit event
    emit!(TradeEvent {
        user: ctx.accounts.buyer.key(),
        mint: curve.mint,
        is_buy: true,
        sol_amount,
        token_amount: tokens_out,
        fee,
        new_price: curve.get_price(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    // Check migration threshold
    if curve.should_migrate() {
        msg!("Migration threshold reached!");
        // Trigger migration in separate instruction
    }
    
    Ok(())
}
```

### Migration to Raydium

```rust
pub fn migrate_to_raydium(ctx: Context<Migrate>) -> Result<()> {
    let curve = &mut ctx.accounts.curve;
    
    require!(curve.should_migrate(), ErrorCode::ThresholdNotReached);
    require!(!curve.is_frozen, ErrorCode::AlreadyMigrated);
    
    // Freeze the curve
    curve.is_frozen = true;
    
    // Calculate LP amounts
    let sol_for_lp = curve.real_sol_reserve;
    let tokens_for_lp = curve.real_token_reserve;
    
    // Create Raydium CPMM pool via CPI
    // ... Raydium CPI calls
    
    // Lock LP tokens (send to burn address or lock contract)
    // ...
    
    emit!(MigrationEvent {
        mint: curve.mint,
        sol_amount: sol_for_lp,
        token_amount: tokens_for_lp,
        pool_address: raydium_pool.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}
```

## TypeScript Client

```typescript
import { BN } from "@coral-xyz/anchor";

export function calculateBuy(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  solIn: BN
): BN {
  // tokens_out = virtualTokenReserve * solIn / (virtualSolReserve + solIn)
  const numerator = virtualTokenReserve.mul(solIn);
  const denominator = virtualSolReserve.add(solIn);
  return numerator.div(denominator);
}

export function calculateSell(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  tokensIn: BN
): BN {
  // sol_out = virtualSolReserve * tokensIn / (virtualTokenReserve + tokensIn)
  const numerator = virtualSolReserve.mul(tokensIn);
  const denominator = virtualTokenReserve.add(tokensIn);
  return numerator.div(denominator);
}

export function getPrice(virtualSolReserve: BN, virtualTokenReserve: BN): number {
  // Price in SOL per token
  return virtualSolReserve.toNumber() / virtualTokenReserve.toNumber();
}

export function getPriceImpact(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  solIn: BN
): number {
  const priceBefore = getPrice(virtualSolReserve, virtualTokenReserve);
  const tokensOut = calculateBuy(virtualSolReserve, virtualTokenReserve, solIn);
  const newSolReserve = virtualSolReserve.add(solIn);
  const newTokenReserve = virtualTokenReserve.sub(tokensOut);
  const priceAfter = getPrice(newSolReserve, newTokenReserve);
  
  return ((priceAfter - priceBefore) / priceBefore) * 100;
}
```

## Constants Reference

| Parameter | Value | Notes |
|-----------|-------|-------|
| Initial Virtual SOL | 30 SOL | Sets starting price |
| Initial Virtual Token | 1B | Total supply reference |
| Migration Threshold | 85 SOL | Trigger for LP creation |
| Buy Fee | 1% | Collected to treasury |
| Sell Fee | 1% | Collected to treasury |
| Max Slippage | 5% | Default, user adjustable |
