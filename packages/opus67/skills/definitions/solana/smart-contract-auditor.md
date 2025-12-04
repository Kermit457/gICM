# Smart Contract Auditor Skill

**Skill ID:** `smart-contract-auditor`
**Category:** Solana Development / Security
**Complexity:** Expert
**Prerequisites:** Rust, Anchor, Solana internals, security principles
**Last Updated:** 2025-01-04

## Overview

Master comprehensive security auditing of Solana smart contracts (programs) including Anchor programs, native programs, and SPL implementations. This skill covers vulnerability detection, formal verification techniques, common attack vectors, audit methodologies, and production-grade security practices.

## Core Competencies

### 1. Vulnerability Classes
- Arithmetic overflow/underflow
- Account validation failures
- Privilege escalation
- Reentrancy attacks
- Oracle manipulation
- PDA collisions

### 2. Audit Methodology
- Static analysis
- Dynamic testing
- Formal verification
- Economic security analysis
- Attack tree modeling
- Threat modeling

### 3. Anchor-Specific Issues
- Account constraints
- Seed derivation
- CPI security
- Signer validation
- Reallocation bugs

### 4. Testing & Verification
- Fuzz testing
- Invariant testing
- Integration tests
- Mainnet fork testing
- Chaos engineering

## Audit Checklist

### Critical Security Checks

```rust
// audit/checklist.rs
use anchor_lang::prelude::*;

/// Comprehensive audit checklist for Solana programs
pub struct AuditChecklist {
    /// Program ID and metadata
    pub program_id: Pubkey,
    pub version: String,
    pub author: String,

    /// Security checks
    pub checks: Vec<SecurityCheck>,
}

#[derive(Debug, Clone)]
pub struct SecurityCheck {
    pub category: SecurityCategory,
    pub severity: Severity,
    pub status: CheckStatus,
    pub description: String,
    pub location: String,
    pub recommendation: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum SecurityCategory {
    // Account Security
    AccountValidation,
    SignerVerification,
    OwnerValidation,
    PDADerivation,

    // Arithmetic
    IntegerOverflow,
    DivisionByZero,
    PrecisionLoss,

    // Logic
    AccessControl,
    StateTransition,
    Reentrancy,

    // Economic
    OracleManipulation,
    FlashLoanAttack,
    FrontRunning,

    // Implementation
    ErrorHandling,
    InitializationSafety,
    UpgradeSafety,
}

#[derive(Debug, Clone, PartialEq, PartialOrd)]
pub enum Severity {
    Critical,   // Immediate funds loss
    High,       // Significant risk
    Medium,     // Potential exploit
    Low,        // Best practice
    Info,       // Informational
}

#[derive(Debug, Clone, PartialEq)]
pub enum CheckStatus {
    Pass,
    Fail,
    Warning,
    NotApplicable,
}

impl AuditChecklist {
    pub fn new(program_id: Pubkey) -> Self {
        Self {
            program_id,
            version: String::from("1.0.0"),
            author: String::new(),
            checks: Self::initialize_checks(),
        }
    }

    fn initialize_checks() -> Vec<SecurityCheck> {
        vec![
            // Account Validation Checks
            SecurityCheck {
                category: SecurityCategory::AccountValidation,
                severity: Severity::Critical,
                status: CheckStatus::Pass,
                description: "All accounts have owner checks".to_string(),
                location: "All instructions".to_string(),
                recommendation: "Use #[account(owner = ...)] constraint".to_string(),
            },
            SecurityCheck {
                category: SecurityCategory::SignerVerification,
                severity: Severity::Critical,
                status: CheckStatus::Pass,
                description: "Signer requirements enforced".to_string(),
                location: "All state-changing instructions".to_string(),
                recommendation: "Use #[account(signer)] constraint".to_string(),
            },
            SecurityCheck {
                category: SecurityCategory::PDADerivation,
                severity: Severity::High,
                status: CheckStatus::Pass,
                description: "PDA seeds are deterministic and collision-resistant".to_string(),
                location: "All PDA accounts".to_string(),
                recommendation: "Include unique identifiers in seeds".to_string(),
            },

            // Arithmetic Checks
            SecurityCheck {
                category: SecurityCategory::IntegerOverflow,
                severity: Severity::High,
                status: CheckStatus::Pass,
                description: "Checked arithmetic used everywhere".to_string(),
                location: "All mathematical operations".to_string(),
                recommendation: "Use checked_add, checked_mul, etc.".to_string(),
            },

            // Access Control
            SecurityCheck {
                category: SecurityCategory::AccessControl,
                severity: Severity::Critical,
                status: CheckStatus::Pass,
                description: "Proper authorization for privileged operations".to_string(),
                location: "Admin functions".to_string(),
                recommendation: "Validate authority account".to_string(),
            },

            // Economic Security
            SecurityCheck {
                category: SecurityCategory::OracleManipulation,
                severity: Severity::High,
                status: CheckStatus::Pass,
                description: "Oracle prices cannot be manipulated".to_string(),
                location: "Price feed consumption".to_string(),
                recommendation: "Use TWAP, multiple oracles, or on-chain verification".to_string(),
            },
        ]
    }

    /// Generate audit report
    pub fn generate_report(&self) -> AuditReport {
        let critical = self.checks.iter()
            .filter(|c| c.severity == Severity::Critical && c.status == CheckStatus::Fail)
            .count();
        let high = self.checks.iter()
            .filter(|c| c.severity == Severity::High && c.status == CheckStatus::Fail)
            .count();
        let medium = self.checks.iter()
            .filter(|c| c.severity == Severity::Medium && c.status == CheckStatus::Fail)
            .count();

        AuditReport {
            program_id: self.program_id,
            critical_issues: critical,
            high_issues: high,
            medium_issues: medium,
            total_checks: self.checks.len(),
            passed_checks: self.checks.iter().filter(|c| c.status == CheckStatus::Pass).count(),
            recommendation: if critical > 0 {
                "DO NOT DEPLOY - Critical issues found".to_string()
            } else if high > 0 {
                "Fix high severity issues before deployment".to_string()
            } else {
                "Safe to deploy with noted warnings".to_string()
            },
        }
    }
}

pub struct AuditReport {
    pub program_id: Pubkey,
    pub critical_issues: usize,
    pub high_issues: usize,
    pub medium_issues: usize,
    pub total_checks: usize,
    pub passed_checks: usize,
    pub recommendation: String,
}
```

### Account Validation Patterns

```rust
// patterns/account-validation.rs
use anchor_lang::prelude::*;

/// ✅ SECURE: Comprehensive account validation
#[derive(Accounts)]
pub struct SecureTransfer<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = to.owner == token_program.key() @ ErrorCode::InvalidOwner,
        constraint = to.mint == from.mint @ ErrorCode::MintMismatch
    )]
    pub to: Account<'info, TokenAccount>,

    #[account(
        constraint = authority.key() == from.owner @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// ❌ INSECURE: Missing validations
#[derive(Accounts)]
pub struct InsecureTransfer<'info> {
    #[account(mut)]
    pub from: AccountInfo<'info>,  // No type checking!

    #[account(mut)]
    pub to: AccountInfo<'info>,    // No owner verification!

    pub authority: Signer<'info>,  // Signer, but not validated as owner!
}

/// ✅ SECURE: PDA validation
#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct SecurePDA<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user", user.as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// ❌ INSECURE: Unsafe PDA derivation
#[derive(Accounts)]
pub struct InsecurePDA<'info> {
    #[account(mut)]
    pub user_account: AccountInfo<'info>,  // Not validated as PDA!

    pub user: Signer<'info>,
}

/// Common validation patterns
impl<'info> SecureTransfer<'info> {
    /// Validate token account ownership
    pub fn validate_token_ownership(&self) -> Result<()> {
        require_keys_eq!(
            self.from.owner,
            self.authority.key(),
            ErrorCode::Unauthorized
        );
        Ok(())
    }

    /// Validate mint consistency
    pub fn validate_mint(&self) -> Result<()> {
        require_keys_eq!(
            self.from.mint,
            self.to.mint,
            ErrorCode::MintMismatch
        );
        Ok(())
    }

    /// Validate sufficient balance
    pub fn validate_balance(&self, amount: u64) -> Result<()> {
        require!(
            self.from.amount >= amount,
            ErrorCode::InsufficientBalance
        );
        Ok(())
    }
}
```

### Arithmetic Safety

```rust
// patterns/arithmetic-safety.rs
use anchor_lang::prelude::*;

/// ✅ SECURE: Safe arithmetic operations
pub fn safe_arithmetic_example(
    amount: u64,
    rate: u64,
    precision: u64,
) -> Result<u64> {
    // Use checked operations
    let scaled = amount
        .checked_mul(rate)
        .ok_or(ErrorCode::Overflow)?;

    let result = scaled
        .checked_div(precision)
        .ok_or(ErrorCode::DivisionByZero)?;

    Ok(result)
}

/// ❌ INSECURE: Unchecked arithmetic
pub fn unsafe_arithmetic_example(
    amount: u64,
    rate: u64,
    precision: u64,
) -> u64 {
    // Can overflow or panic!
    (amount * rate) / precision
}

/// ✅ SECURE: Safe percentage calculations
pub fn calculate_percentage(
    amount: u64,
    percentage: u64,  // Basis points (10000 = 100%)
) -> Result<u64> {
    require!(percentage <= 10000, ErrorCode::InvalidPercentage);

    amount
        .checked_mul(percentage)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000)
        .ok_or(ErrorCode::DivisionByZero)
}

/// ✅ SECURE: Safe token transfers with slippage
pub fn calculate_with_slippage(
    amount: u64,
    max_slippage_bps: u64,  // e.g., 50 = 0.5%
) -> Result<u64> {
    let slippage_amount = calculate_percentage(amount, max_slippage_bps)?;

    amount
        .checked_sub(slippage_amount)
        .ok_or(ErrorCode::Underflow)
}

/// Precision-safe calculations
pub struct PrecisionMath;

impl PrecisionMath {
    const PRECISION: u128 = 1_000_000_000_000; // 1e12

    /// Multiply two u64 values with precision
    pub fn mul(a: u64, b: u64) -> Result<u64> {
        let a_scaled = (a as u128)
            .checked_mul(Self::PRECISION)
            .ok_or(ErrorCode::Overflow)?;

        let result = a_scaled
            .checked_mul(b as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(Self::PRECISION)
            .ok_or(ErrorCode::DivisionByZero)?;

        u64::try_from(result).map_err(|_| error!(ErrorCode::Overflow))
    }

    /// Divide with precision
    pub fn div(a: u64, b: u64) -> Result<u64> {
        require!(b > 0, ErrorCode::DivisionByZero);

        let a_scaled = (a as u128)
            .checked_mul(Self::PRECISION)
            .ok_or(ErrorCode::Overflow)?;

        let result = a_scaled
            .checked_div(b as u128)
            .ok_or(ErrorCode::DivisionByZero)?
            .checked_div(Self::PRECISION)
            .ok_or(ErrorCode::DivisionByZero)?;

        u64::try_from(result).map_err(|_| error!(ErrorCode::Overflow))
    }
}
```

### Access Control Patterns

```rust
// patterns/access-control.rs
use anchor_lang::prelude::*;

/// ✅ SECURE: Role-based access control
#[account]
pub struct Config {
    pub authority: Pubkey,
    pub admin: Pubkey,
    pub paused: bool,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(
        constraint = config.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct AuthorityOnly<'info> {
    #[account(
        constraint = config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,
}

/// ✅ SECURE: Multi-sig pattern
#[account]
pub struct MultiSig {
    pub signers: Vec<Pubkey>,
    pub threshold: u8,
    pub nonce: u64,
}

#[derive(Accounts)]
pub struct ExecuteMultiSig<'info> {
    #[account(mut)]
    pub multi_sig: Account<'info, MultiSig>,

    /// CHECK: Verified in instruction logic
    pub signer1: Signer<'info>,

    /// CHECK: Verified in instruction logic
    pub signer2: Signer<'info>,

    /// CHECK: Verified in instruction logic
    pub signer3: Signer<'info>,
}

impl<'info> ExecuteMultiSig<'info> {
    pub fn validate_signatures(&self) -> Result<()> {
        let mut valid_signatures = 0;

        for signer in [&self.signer1, &self.signer2, &self.signer3] {
            if self.multi_sig.signers.contains(&signer.key()) {
                valid_signatures += 1;
            }
        }

        require!(
            valid_signatures >= self.multi_sig.threshold,
            ErrorCode::InsufficientSignatures
        );

        Ok(())
    }
}

/// ✅ SECURE: Pausable pattern
#[derive(Accounts)]
pub struct WhenNotPaused<'info> {
    #[account(
        constraint = !config.paused @ ErrorCode::Paused
    )]
    pub config: Account<'info, Config>,
}

/// ✅ SECURE: Time-lock pattern
#[account]
pub struct TimeLock {
    pub execution_time: i64,
    pub executed: bool,
}

#[derive(Accounts)]
pub struct ExecuteTimeLock<'info> {
    #[account(
        mut,
        constraint = !time_lock.executed @ ErrorCode::AlreadyExecuted,
        constraint = Clock::get()?.unix_timestamp >= time_lock.execution_time @ ErrorCode::TimeLockActive
    )]
    pub time_lock: Account<'info, TimeLock>,
}
```

### CPI Security

```rust
// patterns/cpi-security.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// ✅ SECURE: CPI with proper validation
pub fn secure_token_transfer(
    ctx: Context<SecureTransfer>,
    amount: u64,
) -> Result<()> {
    // Validate before CPI
    require!(
        ctx.accounts.from.amount >= amount,
        ErrorCode::InsufficientBalance
    );

    // Use CPI with proper accounts
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

/// ❌ INSECURE: Unchecked CPI
pub fn insecure_token_transfer(
    ctx: Context<InsecureTransfer>,
    amount: u64,
) -> Result<()> {
    // No validation!
    // Using AccountInfo without type safety!

    let cpi_accounts = Transfer {
        from: ctx.accounts.from.clone(),
        to: ctx.accounts.to.clone(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    // This could call ANY program!
    let cpi_program = ctx.accounts.from.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;  // Dangerous!

    Ok(())
}

/// ✅ SECURE: CPI with PDA signer
pub fn cpi_with_pda_signer(
    ctx: Context<CpiWithPDA>,
    amount: u64,
    bump: u8,
) -> Result<()> {
    let seeds = &[
        b"authority",
        ctx.accounts.config.key().as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.pda_authority.to_account_info(),
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

### Reentrancy Protection

```rust
// patterns/reentrancy.rs
use anchor_lang::prelude::*;

/// ✅ SECURE: Reentrancy guard using state
#[account]
pub struct Pool {
    pub locked: bool,
    pub balance: u64,
}

#[derive(Accounts)]
pub struct WithReentrancyGuard<'info> {
    #[account(
        mut,
        constraint = !pool.locked @ ErrorCode::Reentrancy
    )]
    pub pool: Account<'info, Pool>,
}

pub fn secure_withdraw(
    ctx: Context<WithReentrancyGuard>,
    amount: u64,
) -> Result<()> {
    // Set lock
    ctx.accounts.pool.locked = true;

    // Checks
    require!(
        ctx.accounts.pool.balance >= amount,
        ErrorCode::InsufficientBalance
    );

    // Effects (update state before interactions)
    ctx.accounts.pool.balance = ctx.accounts.pool.balance
        .checked_sub(amount)
        .ok_or(ErrorCode::Underflow)?;

    // Interactions (CPI after state changes)
    // ... perform transfer ...

    // Release lock
    ctx.accounts.pool.locked = false;

    Ok(())
}

/// ✅ SECURE: Checks-Effects-Interactions pattern
pub fn secure_swap(
    ctx: Context<SecureSwap>,
    amount_in: u64,
) -> Result<()> {
    // 1. CHECKS
    let pool = &ctx.accounts.pool;
    require!(amount_in > 0, ErrorCode::InvalidAmount);
    require!(pool.reserve_in >= amount_in, ErrorCode::InsufficientReserve);

    // Calculate output
    let amount_out = calculate_swap_output(
        amount_in,
        pool.reserve_in,
        pool.reserve_out,
    )?;

    // 2. EFFECTS (update state)
    ctx.accounts.pool.reserve_in = pool.reserve_in
        .checked_add(amount_in)
        .ok_or(ErrorCode::Overflow)?;

    ctx.accounts.pool.reserve_out = pool.reserve_out
        .checked_sub(amount_out)
        .ok_or(ErrorCode::Underflow)?;

    // 3. INTERACTIONS (external calls last)
    // Transfer tokens...

    Ok(())
}

fn calculate_swap_output(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
) -> Result<u64> {
    // Constant product formula with fee
    let amount_in_with_fee = amount_in
        .checked_mul(997)
        .ok_or(ErrorCode::Overflow)?;

    let numerator = amount_in_with_fee
        .checked_mul(reserve_out)
        .ok_or(ErrorCode::Overflow)?;

    let denominator = reserve_in
        .checked_mul(1000)
        .ok_or(ErrorCode::Overflow)?
        .checked_add(amount_in_with_fee)
        .ok_or(ErrorCode::Overflow)?;

    numerator
        .checked_div(denominator)
        .ok_or(ErrorCode::DivisionByZero)
}
```

## Static Analysis Tools

```typescript
// tools/static-analyzer.ts
import * as fs from 'fs';
import * as path from 'path';

export interface Finding {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  code: string;
}

export class SolanaStaticAnalyzer {
  private findings: Finding[] = [];

  /**
   * Analyze Rust source files for common vulnerabilities
   */
  async analyzePath(dirPath: string): Promise<Finding[]> {
    this.findings = [];

    const files = this.getRustFiles(dirPath);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      this.analyzeFile(file, content);
    }

    return this.findings;
  }

  private analyzeFile(filePath: string, content: string): void {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      this.checkUncheckedArithmetic(filePath, index + 1, line);
      this.checkMissingOwnerCheck(filePath, index + 1, line);
      this.checkHardcodedAddresses(filePath, index + 1, line);
      this.checkUnsafeUnwrap(filePath, index + 1, line);
      this.checkMissingConstraints(filePath, index + 1, line);
    });
  }

  private checkUncheckedArithmetic(file: string, line: number, code: string): void {
    // Check for unchecked * / + -
    const uncheckedOps = [
      /(\w+)\s*\*\s*(\w+)(?!\s*\.checked_)/,
      /(\w+)\s*\/\s*(\w+)(?!\s*\.checked_)/,
      /(\w+)\s*\+\s*(\w+)(?!\s*\.checked_)/,
      /(\w+)\s*-\s*(\w+)(?!\s*\.checked_)/,
    ];

    for (const pattern of uncheckedOps) {
      if (pattern.test(code) && !code.includes('//')) {
        this.findings.push({
          file,
          line,
          severity: 'high',
          category: 'Arithmetic',
          description: 'Unchecked arithmetic operation - use checked_* methods',
          code: code.trim(),
        });
      }
    }
  }

  private checkMissingOwnerCheck(file: string, line: number, code: string): void {
    // Check for AccountInfo usage without owner validation
    if (
      code.includes('AccountInfo') &&
      !code.includes('#[account(') &&
      !code.includes('owner')
    ) {
      this.findings.push({
        file,
        line,
        severity: 'critical',
        category: 'Account Validation',
        description: 'AccountInfo without owner validation',
        code: code.trim(),
      });
    }
  }

  private checkHardcodedAddresses(file: string, line: number, code: string): void {
    // Check for hardcoded public keys
    const hardcodedKeyPattern = /Pubkey::from_str\(|pubkey!\(/;

    if (hardcodedKeyPattern.test(code)) {
      this.findings.push({
        file,
        line,
        severity: 'medium',
        category: 'Configuration',
        description: 'Hardcoded address - consider using constants or config',
        code: code.trim(),
      });
    }
  }

  private checkUnsafeUnwrap(file: string, line: number, code: string): void {
    // Check for .unwrap() usage
    if (code.includes('.unwrap()') && !code.includes('//')) {
      this.findings.push({
        file,
        line,
        severity: 'medium',
        category: 'Error Handling',
        description: 'Using unwrap() can cause panics - use proper error handling',
        code: code.trim(),
      });
    }
  }

  private checkMissingConstraints(file: string, line: number, code: string): void {
    // Check for #[account(mut)] without constraints
    if (code.includes('#[account(mut)]') && !code.includes('constraint')) {
      this.findings.push({
        file,
        line,
        severity: 'high',
        category: 'Account Validation',
        description: 'Mutable account without constraints',
        code: code.trim(),
      });
    }
  }

  private getRustFiles(dir: string): string[] {
    const files: string[] = [];

    const traverse = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.name.endsWith('.rs')) {
          files.push(fullPath);
        }
      }
    };

    traverse(dir);
    return files;
  }

  /**
   * Generate audit report
   */
  generateReport(): string {
    const critical = this.findings.filter(f => f.severity === 'critical').length;
    const high = this.findings.filter(f => f.severity === 'high').length;
    const medium = this.findings.filter(f => f.severity === 'medium').length;
    const low = this.findings.filter(f => f.severity === 'low').length;

    let report = '# Security Audit Report\n\n';
    report += `## Summary\n`;
    report += `- Critical: ${critical}\n`;
    report += `- High: ${high}\n`;
    report += `- Medium: ${medium}\n`;
    report += `- Low: ${low}\n`;
    report += `- Total: ${this.findings.length}\n\n`;

    report += `## Findings\n\n`;

    for (const finding of this.findings) {
      report += `### ${finding.severity.toUpperCase()}: ${finding.description}\n`;
      report += `**File:** ${finding.file}:${finding.line}\n`;
      report += `**Category:** ${finding.category}\n`;
      report += `**Code:**\n\`\`\`rust\n${finding.code}\n\`\`\`\n\n`;
    }

    return report;
  }
}
```

## Fuzz Testing

```rust
// tests/fuzz-test.rs
#![no_main]
use libfuzzer_sys::fuzz_target;
use arbitrary::Arbitrary;

#[derive(Arbitrary, Debug)]
struct FuzzInput {
    amount: u64,
    rate: u64,
    precision: u64,
}

fuzz_target!(|input: FuzzInput| {
    // Fuzz test arithmetic operations
    let _ = safe_arithmetic(input.amount, input.rate, input.precision);
});

fn safe_arithmetic(amount: u64, rate: u64, precision: u64) -> Option<u64> {
    amount
        .checked_mul(rate)?
        .checked_div(precision)
}

// Run with: cargo fuzz run fuzz_arithmetic
```

## Integration Testing

```typescript
// tests/integration.test.ts
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { expect } from 'chai';

describe('Security Integration Tests', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.YourProgram as Program<YourProgram>;

  it('should prevent unauthorized access', async () => {
    const attacker = anchor.web3.Keypair.generate();

    try {
      await program.methods
        .adminOnlyFunction()
        .accounts({
          admin: attacker.publicKey,
          config: configPda,
        })
        .signers([attacker])
        .rpc();

      expect.fail('Should have thrown error');
    } catch (err) {
      expect(err.toString()).to.include('Unauthorized');
    }
  });

  it('should prevent integer overflow', async () => {
    const maxU64 = new anchor.BN('18446744073709551615');

    try {
      await program.methods
        .addAmount(maxU64, new anchor.BN(1))
        .rpc();

      expect.fail('Should have thrown error');
    } catch (err) {
      expect(err.toString()).to.include('Overflow');
    }
  });

  it('should validate PDA derivation', async () => {
    const fakeUser = PublicKey.default;

    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), fakeUser.toBuffer()],
      program.programId
    );

    try {
      // Try to use PDA for different user
      await program.methods
        .updateUserData()
        .accounts({
          userAccount: userPda,
          user: provider.wallet.publicKey,
        })
        .rpc();

      expect.fail('Should have thrown error');
    } catch (err) {
      expect(err.toString()).to.include('ConstraintSeeds');
    }
  });
});
```

## Economic Security Analysis

```typescript
// analysis/economic-security.ts
export interface EconomicModel {
  tvl: number;
  dailyVolume: number;
  attackCost: number;
  potentialProfit: number;
  attackVectors: AttackVector[];
}

export interface AttackVector {
  name: string;
  cost: number;
  probability: number;
  impact: number;
  mitigation: string;
}

export class EconomicSecurityAnalyzer {
  /**
   * Analyze economic attack vectors
   */
  analyzeProtocol(model: EconomicModel): SecurityAssessment {
    const vectors = [
      this.analyzeFlashLoan(model),
      this.analyzeFrontRunning(model),
      this.analyzeOracleManipulation(model),
      this.analyzeLiquidityDrain(model),
    ];

    const totalRisk = vectors.reduce((sum, v) => sum + v.cost * v.probability, 0);
    const profitable = totalRisk < model.potentialProfit;

    return {
      vectors,
      totalRisk,
      profitable,
      recommendation: profitable
        ? 'High risk - implement additional safeguards'
        : 'Economic security acceptable',
    };
  }

  private analyzeFlashLoan(model: EconomicModel): AttackVector {
    // Flash loan attacks cost only gas fees
    const cost = 0.1; // SOL for gas

    // Profit potential from price manipulation
    const potentialProfit = model.tvl * 0.01; // 1% of TVL

    return {
      name: 'Flash Loan Attack',
      cost,
      probability: 0.3,
      impact: potentialProfit,
      mitigation: 'Use TWAP oracles, add reentrancy guards',
    };
  }

  private analyzeFrontRunning(model: EconomicModel): AttackVector {
    const cost = 0.05; // Jito tip + gas

    // MEV from frontrunning trades
    const potentialProfit = model.dailyVolume * 0.001; // 0.1% of volume

    return {
      name: 'Frontrunning/MEV',
      cost,
      probability: 0.7,
      impact: potentialProfit,
      mitigation: 'Use Jito bundles, implement slippage protection',
    };
  }

  private analyzeOracleManipulation(model: EconomicModel): AttackVector {
    // Cost to manipulate oracle
    const cost = model.tvl * 0.1; // Need 10% of TVL

    const potentialProfit = model.tvl * 0.5; // Could drain 50%

    return {
      name: 'Oracle Manipulation',
      cost,
      probability: 0.1,
      impact: potentialProfit,
      mitigation: 'Use multiple oracles, implement TWAP',
    };
  }

  private analyzeLiquidityDrain(model: EconomicModel): AttackVector {
    const cost = model.tvl * 0.3; // Need 30% of TVL

    const potentialProfit = model.tvl * 0.7; // Could drain remaining

    return {
      name: 'Liquidity Drain',
      cost,
      probability: 0.05,
      impact: potentialProfit,
      mitigation: 'Implement withdrawal limits, time delays',
    };
  }
}

interface SecurityAssessment {
  vectors: AttackVector[];
  totalRisk: number;
  profitable: boolean;
  recommendation: string;
}
```

## Best Practices Checklist

```markdown
## Pre-Deployment Security Checklist

### Account Validation
- [ ] All accounts have owner checks
- [ ] Signer requirements enforced
- [ ] PDA seeds are collision-resistant
- [ ] Account data is validated before use
- [ ] Rent-exempt checks for persistent accounts

### Arithmetic
- [ ] All math uses checked operations
- [ ] Division by zero prevented
- [ ] Precision loss minimized
- [ ] Overflow/underflow impossible

### Access Control
- [ ] Authorization enforced on admin functions
- [ ] Multi-sig for critical operations
- [ ] Time-locks on sensitive changes
- [ ] Pausable for emergencies

### CPI Security
- [ ] CPI targets validated
- [ ] Signer seeds secure
- [ ] Account ownership verified before CPI
- [ ] Return values checked

### Economic Security
- [ ] Flash loan attacks considered
- [ ] MEV/frontrunning mitigated
- [ ] Oracle manipulation prevented
- [ ] Incentive alignment verified

### Testing
- [ ] >90% code coverage
- [ ] Fuzz testing on critical paths
- [ ] Integration tests for all flows
- [ ] Mainnet fork testing completed

### Deployment
- [ ] Program upgrade authority secured
- [ ] Admin keys in cold storage
- [ ] Monitoring and alerts configured
- [ ] Incident response plan ready
```

## Tools & Resources

1. **Static Analysis**: Custom analyzer (above), Sec3 auditor
2. **Fuzz Testing**: cargo-fuzz, Trdelnik
3. **Formal Verification**: Certora, Runtime Verification
4. **Audit Firms**: OtterSec, Zellic, Trail of Bits
5. **Bug Bounties**: Immunefi, HackerOne

## Common Vulnerabilities

1. Missing owner checks
2. Unchecked arithmetic
3. PDA seed collisions
4. Signer validation failures
5. Missing initialization checks
6. Unsafe account reallocation
7. Integer overflow in rewards
8. Oracle price manipulation
9. Flash loan attacks
10. Reentrancy via CPI

## Key Takeaways

1. **Assume hostile environment** - every input is malicious
2. **Validate everything** - accounts, amounts, addresses
3. **Use checked math** - always
4. **Test extensively** - unit, integration, fuzz, fork
5. **Get audited** - by professionals before mainnet
6. **Start simple** - add complexity gradually
7. **Monitor actively** - alerts on suspicious activity
8. **Plan for failure** - pausable, upgradeable
9. **Economic security matters** - model attack profitability
10. **Learn from others** - study past exploits
