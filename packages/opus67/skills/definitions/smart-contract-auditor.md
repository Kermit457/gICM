# Smart Contract Auditor

Expert security auditing for Solana programs, Anchor smart contracts, and cross-program invocations. Identifies vulnerabilities, validates access controls, and ensures economic security.

---

## Metadata

- **ID**: smart-contract-auditor
- **Name**: Smart Contract Auditor
- **Category**: Security
- **Tags**: audit, security, solana, anchor, vulnerabilities, access-control
- **Version**: 2.0.0
- **Token Estimate**: 4800

---

## Overview

Solana smart contract security requires understanding unique attack vectors including:
- Missing signer checks and account validation
- PDA seed collisions and authority bypass
- Arithmetic overflow/underflow in token calculations
- Reentrancy through CPI (Cross-Program Invocation)
- Oracle manipulation and price feed attacks
- Account confusion and type cosplay attacks

This skill provides comprehensive audit methodologies, vulnerability detection patterns, and remediation strategies for production Solana programs.

---

## Core Audit Methodology

### Audit Phases

```typescript
// audit-framework.ts
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';

interface AuditFinding {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  title: string;
  description: string;
  location: string;
  recommendation: string;
  cweId?: string;
}

interface AuditReport {
  programId: string;
  programName: string;
  auditDate: Date;
  auditor: string;
  findings: AuditFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  passedChecks: string[];
  recommendations: string[];
}

class SolanaAuditor {
  private connection: Connection;
  private findings: AuditFinding[] = [];

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async auditProgram(
    programId: PublicKey,
    idl: Idl,
    sourceCode?: string
  ): Promise<AuditReport> {
    console.log(`Starting audit of program: ${programId.toBase58()}`);

    // Phase 1: Static Analysis
    await this.staticAnalysis(idl, sourceCode);

    // Phase 2: Account Validation Checks
    await this.validateAccountConstraints(idl);

    // Phase 3: Access Control Analysis
    await this.analyzeAccessControls(idl);

    // Phase 4: Arithmetic Safety
    await this.checkArithmeticSafety(sourceCode);

    // Phase 5: CPI Security
    await this.analyzeCPISecurity(idl, sourceCode);

    // Phase 6: Economic Security
    await this.analyzeEconomicSecurity(idl);

    // Phase 7: Oracle Integration
    await this.auditOracleUsage(sourceCode);

    return this.generateReport(programId.toBase58());
  }

  private async staticAnalysis(idl: Idl, sourceCode?: string): Promise<void> {
    // Check for dangerous patterns in source code
    if (sourceCode) {
      const dangerousPatterns = [
        { pattern: /invoke_signed\s*\(/, name: 'CPI with PDA signing' },
        { pattern: /unchecked\s*\{/, name: 'Unchecked arithmetic block' },
        { pattern: /as\s+u64/, name: 'Unsafe type casting' },
        { pattern: /unwrap\(\)/, name: 'Unwrap without error handling' },
        { pattern: /expect\(/, name: 'Expect without proper error' },
      ];

      for (const { pattern, name } of dangerousPatterns) {
        const matches = sourceCode.match(new RegExp(pattern, 'g'));
        if (matches && matches.length > 0) {
          this.addFinding({
            id: `STATIC-${Date.now()}`,
            severity: 'INFO',
            category: 'Static Analysis',
            title: `Found ${matches.length} instances of ${name}`,
            description: `The pattern "${name}" was found ${matches.length} times. Review each instance for security implications.`,
            location: 'Source code',
            recommendation: `Review each instance of ${name} for potential security issues.`,
          });
        }
      }
    }

    // Check IDL for missing discriminators
    if (idl.accounts) {
      for (const account of idl.accounts) {
        if (!account.name.includes('Account') && !account.name.includes('State')) {
          this.addFinding({
            id: `IDL-ACC-${account.name}`,
            severity: 'LOW',
            category: 'Naming Convention',
            title: `Account type "${account.name}" may lack clear naming`,
            description: 'Account types should clearly indicate they are accounts to prevent confusion.',
            location: `IDL: accounts.${account.name}`,
            recommendation: 'Consider renaming to include "Account" or "State" suffix.',
          });
        }
      }
    }
  }

  private async validateAccountConstraints(idl: Idl): Promise<void> {
    if (!idl.instructions) return;

    for (const instruction of idl.instructions) {
      for (const account of instruction.accounts) {
        // Check for missing mut constraint on writable accounts
        if (account.name.includes('vault') ||
            account.name.includes('treasury') ||
            account.name.includes('pool')) {
          if (!account.isMut) {
            this.addFinding({
              id: `CONSTRAINT-MUT-${instruction.name}-${account.name}`,
              severity: 'MEDIUM',
              category: 'Account Constraints',
              title: `Potentially missing mut constraint on ${account.name}`,
              description: `Account "${account.name}" in instruction "${instruction.name}" may need to be mutable based on naming convention.`,
              location: `Instruction: ${instruction.name}, Account: ${account.name}`,
              recommendation: 'Verify if this account should be mutable.',
            });
          }
        }

        // Check for missing signer constraint on authority accounts
        if (account.name.includes('authority') ||
            account.name.includes('admin') ||
            account.name.includes('owner')) {
          if (!account.isSigner) {
            this.addFinding({
              id: `CONSTRAINT-SIGNER-${instruction.name}-${account.name}`,
              severity: 'CRITICAL',
              category: 'Access Control',
              title: `Missing signer constraint on authority account`,
              description: `Account "${account.name}" appears to be an authority but is not marked as signer in instruction "${instruction.name}".`,
              location: `Instruction: ${instruction.name}, Account: ${account.name}`,
              recommendation: 'Add signer constraint to authority accounts.',
              cweId: 'CWE-862',
            });
          }
        }
      }
    }
  }

  private async analyzeAccessControls(idl: Idl): Promise<void> {
    const adminInstructions = [
      'initialize', 'set_fee', 'set_admin', 'pause', 'unpause',
      'withdraw', 'emergency_withdraw', 'update_config', 'upgrade'
    ];

    for (const instruction of idl.instructions || []) {
      const isAdminInstruction = adminInstructions.some(
        admin => instruction.name.toLowerCase().includes(admin)
      );

      if (isAdminInstruction) {
        const hasAuthorityAccount = instruction.accounts.some(
          acc => acc.name.includes('authority') ||
                 acc.name.includes('admin') ||
                 acc.name.includes('owner')
        );

        if (!hasAuthorityAccount) {
          this.addFinding({
            id: `ACCESS-${instruction.name}`,
            severity: 'CRITICAL',
            category: 'Access Control',
            title: `Admin instruction "${instruction.name}" may lack authority check`,
            description: `The instruction "${instruction.name}" appears to be an admin function but does not have an obvious authority account.`,
            location: `Instruction: ${instruction.name}`,
            recommendation: 'Add authority account with signer constraint.',
            cweId: 'CWE-285',
          });
        }
      }
    }
  }

  private async checkArithmeticSafety(sourceCode?: string): Promise<void> {
    if (!sourceCode) return;

    // Check for potential overflow patterns
    const overflowPatterns = [
      { pattern: /(\w+)\s*\+\s*(\w+)(?!\s*\.checked)/, name: 'Unchecked addition' },
      { pattern: /(\w+)\s*\*\s*(\w+)(?!\s*\.checked)/, name: 'Unchecked multiplication' },
      { pattern: /(\w+)\s*-\s*(\w+)(?!\s*\.checked)/, name: 'Unchecked subtraction' },
    ];

    // Check for safe math usage
    const hasCheckedMath = sourceCode.includes('checked_add') ||
                           sourceCode.includes('checked_sub') ||
                           sourceCode.includes('checked_mul');

    if (!hasCheckedMath && sourceCode.includes('u64') && sourceCode.includes('amount')) {
      this.addFinding({
        id: 'ARITHMETIC-OVERFLOW',
        severity: 'HIGH',
        category: 'Arithmetic Safety',
        title: 'Program may not use checked arithmetic',
        description: 'No checked arithmetic operations found. Solana programs should use checked_add, checked_sub, checked_mul to prevent overflow.',
        location: 'Source code',
        recommendation: 'Use checked arithmetic operations for all token amount calculations.',
        cweId: 'CWE-190',
      });
    }
  }

  private async analyzeCPISecurity(idl: Idl, sourceCode?: string): Promise<void> {
    if (!sourceCode) return;

    // Check for CPI without proper program ID validation
    if (sourceCode.includes('invoke') || sourceCode.includes('invoke_signed')) {
      const hasProgramIdCheck = sourceCode.includes('program_id') &&
                                 (sourceCode.includes('==') || sourceCode.includes('require'));

      if (!hasProgramIdCheck) {
        this.addFinding({
          id: 'CPI-PROGRAM-ID',
          severity: 'HIGH',
          category: 'CPI Security',
          title: 'CPI may lack program ID validation',
          description: 'Cross-program invocations should validate the target program ID to prevent malicious program substitution.',
          location: 'CPI invocation',
          recommendation: 'Always verify the program ID before making CPI calls.',
          cweId: 'CWE-346',
        });
      }
    }

    // Check for PDA verification in CPI
    if (sourceCode.includes('invoke_signed')) {
      const hasSeedValidation = sourceCode.includes('find_program_address') ||
                                 sourceCode.includes('create_program_address');

      if (!hasSeedValidation) {
        this.addFinding({
          id: 'CPI-PDA-SEEDS',
          severity: 'MEDIUM',
          category: 'CPI Security',
          title: 'PDA seeds may not be validated',
          description: 'When using invoke_signed, ensure PDA seeds are properly validated to prevent seed collision attacks.',
          location: 'CPI with PDA signing',
          recommendation: 'Validate PDA derivation matches expected seeds.',
        });
      }
    }
  }

  private async analyzeEconomicSecurity(idl: Idl): Promise<void> {
    // Check for reentrancy patterns
    const stateChangingInstructions = (idl.instructions || []).filter(
      inst => inst.accounts.some(acc => acc.isMut)
    );

    for (const instruction of stateChangingInstructions) {
      const hasTokenTransfer = instruction.accounts.some(
        acc => acc.name.includes('token') || acc.name.includes('vault')
      );

      if (hasTokenTransfer) {
        this.addFinding({
          id: `ECONOMIC-REENTRANCY-${instruction.name}`,
          severity: 'MEDIUM',
          category: 'Economic Security',
          title: `Instruction "${instruction.name}" involves token transfers`,
          description: 'Instructions involving token transfers should follow checks-effects-interactions pattern.',
          location: `Instruction: ${instruction.name}`,
          recommendation: 'Update state before making external calls. Use reentrancy guards.',
        });
      }
    }
  }

  private async auditOracleUsage(sourceCode?: string): Promise<void> {
    if (!sourceCode) return;

    const usesOracle = sourceCode.includes('pyth') ||
                       sourceCode.includes('switchboard') ||
                       sourceCode.includes('oracle') ||
                       sourceCode.includes('price_feed');

    if (usesOracle) {
      // Check for staleness validation
      const hasStaleCheck = sourceCode.includes('timestamp') ||
                            sourceCode.includes('valid_slot') ||
                            sourceCode.includes('max_age');

      if (!hasStaleCheck) {
        this.addFinding({
          id: 'ORACLE-STALENESS',
          severity: 'HIGH',
          category: 'Oracle Security',
          title: 'Oracle price staleness not validated',
          description: 'Oracle prices should be checked for staleness to prevent using outdated prices.',
          location: 'Oracle integration',
          recommendation: 'Add timestamp validation for oracle prices. Reject prices older than acceptable threshold.',
          cweId: 'CWE-367',
        });
      }

      // Check for confidence interval validation
      const hasConfidenceCheck = sourceCode.includes('confidence') ||
                                  sourceCode.includes('conf');

      if (!hasConfidenceCheck) {
        this.addFinding({
          id: 'ORACLE-CONFIDENCE',
          severity: 'MEDIUM',
          category: 'Oracle Security',
          title: 'Oracle confidence interval not validated',
          description: 'Oracle prices should validate confidence intervals to ensure price accuracy.',
          location: 'Oracle integration',
          recommendation: 'Check oracle confidence interval. Reject prices with low confidence.',
        });
      }
    }
  }

  private addFinding(finding: AuditFinding): void {
    this.findings.push(finding);
  }

  private generateReport(programId: string): AuditReport {
    const summary = {
      critical: this.findings.filter(f => f.severity === 'CRITICAL').length,
      high: this.findings.filter(f => f.severity === 'HIGH').length,
      medium: this.findings.filter(f => f.severity === 'MEDIUM').length,
      low: this.findings.filter(f => f.severity === 'LOW').length,
      info: this.findings.filter(f => f.severity === 'INFO').length,
    };

    return {
      programId,
      programName: 'Unknown',
      auditDate: new Date(),
      auditor: 'Automated Auditor',
      findings: this.findings,
      summary,
      passedChecks: [],
      recommendations: this.generateRecommendations(),
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.findings.some(f => f.category === 'Access Control')) {
      recommendations.push('Implement comprehensive access control with role-based permissions');
    }
    if (this.findings.some(f => f.category === 'Arithmetic Safety')) {
      recommendations.push('Use checked arithmetic for all numerical operations');
    }
    if (this.findings.some(f => f.category === 'Oracle Security')) {
      recommendations.push('Implement oracle price validation with staleness and confidence checks');
    }

    return recommendations;
  }
}
```

---

## Vulnerability Patterns

### 1. Missing Signer Checks

```rust
// VULNERABLE: No signer check on authority
pub fn withdraw_vulnerable(ctx: Context<WithdrawVulnerable>, amount: u64) -> Result<()> {
    // Anyone can call this - authority is not validated as signer!
    let vault = &mut ctx.accounts.vault;

    // Transfer funds - DANGEROUS without signer check
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawVulnerable<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    /// CHECK: VULNERABLE - Not marked as Signer!
    pub vault_authority: AccountInfo<'info>,
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

// SECURE: Proper signer check on authority
pub fn withdraw_secure(ctx: Context<WithdrawSecure>, amount: u64) -> Result<()> {
    // Authority must sign - validated by Anchor
    let vault = &mut ctx.accounts.vault;

    // Verify authority matches vault's authority
    require!(
        ctx.accounts.authority.key() == vault.authority,
        ErrorCode::Unauthorized
    );

    // Safe to transfer with validated authority
    let seeds = &[
        b"vault",
        vault.authority.as_ref(),
        &[vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
                authority: ctx.accounts.vault_pda.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawSecure<'info> {
    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        constraint = vault_token.owner == vault_pda.key(),
    )]
    pub vault_token: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for the vault
    #[account(
        seeds = [b"vault_authority", vault.key().as_ref()],
        bump,
    )]
    pub vault_pda: AccountInfo<'info>,
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,
    // SECURE: Authority must be a signer
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

### 2. Account Type Confusion (Type Cosplay)

```rust
// VULNERABLE: No discriminator check - account type confusion possible
#[account]
pub struct VaultVulnerable {
    pub authority: Pubkey,
    pub balance: u64,
    pub is_initialized: bool,
}

#[account]
pub struct UserAccountVulnerable {
    pub owner: Pubkey,        // Same position as authority!
    pub deposited: u64,       // Same position as balance!
    pub active: bool,         // Same position as is_initialized!
}

// An attacker could pass a UserAccount where Vault is expected
// if the account sizes match and there's no discriminator validation

// SECURE: Anchor adds 8-byte discriminator automatically
// But add explicit type marker for defense in depth
#[account]
pub struct VaultSecure {
    pub account_type: u8,     // Explicit type marker: 1 = Vault
    pub authority: Pubkey,
    pub balance: u64,
    pub is_initialized: bool,
    pub bump: u8,
}

impl VaultSecure {
    pub const ACCOUNT_TYPE: u8 = 1;
    pub const SIZE: usize = 1 + 32 + 8 + 1 + 1;
}

#[account]
pub struct UserAccountSecure {
    pub account_type: u8,     // Explicit type marker: 2 = User
    pub owner: Pubkey,
    pub deposited: u64,
    pub active: bool,
    pub bump: u8,
}

impl UserAccountSecure {
    pub const ACCOUNT_TYPE: u8 = 2;
    pub const SIZE: usize = 1 + 32 + 8 + 1 + 1;
}

// Validation function
pub fn validate_vault(vault: &VaultSecure) -> Result<()> {
    require!(
        vault.account_type == VaultSecure::ACCOUNT_TYPE,
        ErrorCode::InvalidAccountType
    );
    Ok(())
}
```

### 3. PDA Seed Collision

```rust
// VULNERABLE: Predictable seeds without unique identifier
// Attacker could front-run and create account with same seeds
pub fn create_user_account_vulnerable(
    ctx: Context<CreateUserVulnerable>,
) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.owner = ctx.accounts.user.key();
    user_account.balance = 0;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserVulnerable<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserAccount::SIZE,
        // VULNERABLE: Only uses "user" as seed - collision possible
        seeds = [b"user"],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// SECURE: Include unique identifiers in seeds
pub fn create_user_account_secure(
    ctx: Context<CreateUserSecure>,
) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.owner = ctx.accounts.user.key();
    user_account.balance = 0;
    user_account.bump = ctx.bumps.user_account;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserSecure<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserAccount::SIZE,
        // SECURE: User pubkey in seeds ensures uniqueness
        seeds = [b"user_account", user.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// For multi-dimensional PDAs (e.g., user + pool)
#[derive(Accounts)]
pub struct CreatePositionSecure<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Position::SIZE,
        // SECURE: Multiple unique seeds
        seeds = [
            b"position",
            pool.key().as_ref(),
            user.key().as_ref(),
        ],
        bump,
    )]
    pub position: Account<'info, Position>,
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### 4. Arithmetic Overflow/Underflow

```rust
use anchor_lang::prelude::*;

// VULNERABLE: Native arithmetic can overflow
pub fn calculate_rewards_vulnerable(
    staked_amount: u64,
    reward_rate: u64,
    time_elapsed: u64,
) -> u64 {
    // This can overflow silently in release builds!
    staked_amount * reward_rate * time_elapsed / 1_000_000
}

// SECURE: Use checked arithmetic
pub fn calculate_rewards_secure(
    staked_amount: u64,
    reward_rate: u64,
    time_elapsed: u64,
) -> Result<u64> {
    // Step-by-step with overflow checks
    let step1 = staked_amount
        .checked_mul(reward_rate)
        .ok_or(ErrorCode::MathOverflow)?;

    let step2 = step1
        .checked_mul(time_elapsed)
        .ok_or(ErrorCode::MathOverflow)?;

    let result = step2
        .checked_div(1_000_000)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(result)
}

// SECURE: Using u128 for intermediate calculations
pub fn calculate_rewards_u128(
    staked_amount: u64,
    reward_rate: u64,
    time_elapsed: u64,
) -> Result<u64> {
    // Use u128 for intermediate to prevent overflow
    let numerator = (staked_amount as u128)
        .checked_mul(reward_rate as u128)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_mul(time_elapsed as u128)
        .ok_or(ErrorCode::MathOverflow)?;

    let result = numerator
        .checked_div(1_000_000)
        .ok_or(ErrorCode::MathOverflow)?;

    // Verify result fits in u64
    if result > u64::MAX as u128 {
        return Err(ErrorCode::MathOverflow.into());
    }

    Ok(result as u64)
}

// Using Anchor's fixed-point math library
use anchor_lang::solana_program::program_pack::Pack;

/// Fixed-point number with 6 decimal places
#[derive(Clone, Copy, Debug)]
pub struct FixedPoint {
    pub value: u128,
}

impl FixedPoint {
    pub const PRECISION: u128 = 1_000_000;

    pub fn from_u64(value: u64) -> Self {
        Self {
            value: (value as u128) * Self::PRECISION,
        }
    }

    pub fn checked_mul(&self, other: &Self) -> Option<Self> {
        self.value
            .checked_mul(other.value)?
            .checked_div(Self::PRECISION)
            .map(|value| Self { value })
    }

    pub fn checked_div(&self, other: &Self) -> Option<Self> {
        if other.value == 0 {
            return None;
        }
        self.value
            .checked_mul(Self::PRECISION)?
            .checked_div(other.value)
            .map(|value| Self { value })
    }

    pub fn to_u64(&self) -> Option<u64> {
        let rounded = self.value.checked_div(Self::PRECISION)?;
        if rounded > u64::MAX as u128 {
            return None;
        }
        Some(rounded as u64)
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow occurred")]
    MathOverflow,
    #[msg("Math underflow occurred")]
    MathUnderflow,
    #[msg("Division by zero")]
    DivisionByZero,
}
```

### 5. Reentrancy via CPI

```rust
// VULNERABLE: State updated after CPI - reentrancy possible
pub fn withdraw_vulnerable(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // CPI call BEFORE state update - VULNERABLE!
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token.to_account_info(),
                to: ctx.accounts.user_token.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount,
    )?;

    // State update AFTER CPI - attacker can re-enter before this
    let vault = &mut ctx.accounts.vault;
    vault.balance = vault.balance.checked_sub(amount)
        .ok_or(ErrorCode::InsufficientFunds)?;

    Ok(())
}

// SECURE: Checks-Effects-Interactions pattern
pub fn withdraw_secure(ctx: Context<WithdrawSecure>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // 1. CHECKS: Validate all preconditions
    require!(vault.balance >= amount, ErrorCode::InsufficientFunds);
    require!(!vault.locked, ErrorCode::VaultLocked);

    // 2. EFFECTS: Update state BEFORE external calls
    vault.balance = vault.balance.checked_sub(amount)
        .ok_or(ErrorCode::MathUnderflow)?;
    vault.last_withdrawal = Clock::get()?.unix_timestamp;

    // 3. INTERACTIONS: External calls LAST
    let seeds = &[
        b"vault",
        vault.authority.as_ref(),
        &[vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token.to_account_info(),
                to: ctx.accounts.user_token.to_account_info(),
                authority: ctx.accounts.vault_pda.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    emit!(WithdrawalEvent {
        vault: ctx.accounts.vault.key(),
        user: ctx.accounts.user.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// SECURE: Reentrancy guard pattern
#[account]
pub struct VaultWithGuard {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
    pub locked: bool,           // Reentrancy guard
    pub last_withdrawal: i64,
}

pub fn withdraw_with_guard(ctx: Context<WithdrawGuarded>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // Acquire reentrancy lock
    require!(!vault.locked, ErrorCode::ReentrancyDetected);
    vault.locked = true;

    // Perform withdrawal logic...
    require!(vault.balance >= amount, ErrorCode::InsufficientFunds);
    vault.balance = vault.balance.checked_sub(amount)
        .ok_or(ErrorCode::MathUnderflow)?;

    // CPI call
    let seeds = &[b"vault", vault.authority.as_ref(), &[vault.bump]];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token.to_account_info(),
                to: ctx.accounts.user_token.to_account_info(),
                authority: ctx.accounts.vault_pda.to_account_info(),
            },
            &[&seeds[..]],
        ),
        amount,
    )?;

    // Release reentrancy lock
    vault.locked = false;

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Reentrancy detected")]
    ReentrancyDetected,
    #[msg("Vault is locked")]
    VaultLocked,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Math underflow")]
    MathUnderflow,
}
```

### 6. Oracle Manipulation

```rust
use pyth_sdk_solana::{load_price_feed_from_account_info, Price, PriceFeed};

// VULNERABLE: No oracle validation
pub fn swap_vulnerable(
    ctx: Context<SwapVulnerable>,
    amount_in: u64,
) -> Result<()> {
    let price_account = &ctx.accounts.price_feed;
    let price_feed = load_price_feed_from_account_info(price_account)
        .map_err(|_| ErrorCode::InvalidPriceFeed)?;

    // VULNERABLE: Using price without any validation!
    let price = price_feed.get_current_price()
        .ok_or(ErrorCode::PriceUnavailable)?;

    // Calculate swap - could use stale/manipulated price
    let amount_out = calculate_output(amount_in, price.price as u64);

    // Execute swap...
    Ok(())
}

// SECURE: Comprehensive oracle validation
pub fn swap_secure(
    ctx: Context<SwapSecure>,
    amount_in: u64,
    max_price_age_seconds: u64,
    min_confidence_ratio: u64,  // e.g., 100 means confidence must be < 1% of price
) -> Result<()> {
    let price_account = &ctx.accounts.price_feed;
    let clock = Clock::get()?;

    // Load and validate price feed
    let price_feed = load_price_feed_from_account_info(price_account)
        .map_err(|_| ErrorCode::InvalidPriceFeed)?;

    // Get price with Solana-specific timestamp
    let current_price = price_feed
        .get_price_no_older_than(clock.unix_timestamp, max_price_age_seconds as i64)
        .ok_or(ErrorCode::StalePriceFeed)?;

    // Validate price is positive
    require!(current_price.price > 0, ErrorCode::InvalidPrice);

    // Validate confidence interval (lower is better)
    // confidence / price should be less than threshold
    let confidence_ratio = (current_price.conf as u128)
        .checked_mul(10000)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(current_price.price.abs() as u128)
        .ok_or(ErrorCode::MathOverflow)?;

    require!(
        confidence_ratio < min_confidence_ratio as u128,
        ErrorCode::LowConfidencePrice
    );

    // Validate exponent is reasonable
    require!(
        current_price.expo >= -12 && current_price.expo <= 12,
        ErrorCode::InvalidPriceExponent
    );

    msg!(
        "Price: {} x 10^{}, Confidence: {}, Age: {}s",
        current_price.price,
        current_price.expo,
        current_price.conf,
        clock.unix_timestamp - current_price.publish_time
    );

    // Calculate with validated price
    let amount_out = calculate_output_safe(
        amount_in,
        current_price.price,
        current_price.expo,
    )?;

    // Apply slippage protection
    let min_output = ctx.accounts.user_config.min_output;
    require!(amount_out >= min_output, ErrorCode::SlippageExceeded);

    // Execute swap...
    Ok(())
}

fn calculate_output_safe(
    amount_in: u64,
    price: i64,
    expo: i32,
) -> Result<u64> {
    // Handle negative exponent (most common)
    let price_u128 = price.abs() as u128;
    let amount_u128 = amount_in as u128;

    let result = if expo < 0 {
        let divisor = 10u128.pow((-expo) as u32);
        amount_u128
            .checked_mul(price_u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(divisor)
            .ok_or(ErrorCode::MathOverflow)?
    } else {
        let multiplier = 10u128.pow(expo as u32);
        amount_u128
            .checked_mul(price_u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_mul(multiplier)
            .ok_or(ErrorCode::MathOverflow)?
    };

    if result > u64::MAX as u128 {
        return Err(ErrorCode::MathOverflow.into());
    }

    Ok(result as u64)
}

// Multi-oracle validation for critical operations
pub fn swap_multi_oracle(
    ctx: Context<SwapMultiOracle>,
    amount_in: u64,
) -> Result<()> {
    // Get prices from multiple oracles
    let pyth_price = get_pyth_price(&ctx.accounts.pyth_feed)?;
    let switchboard_price = get_switchboard_price(&ctx.accounts.switchboard_feed)?;

    // Calculate deviation between oracles
    let deviation = calculate_deviation(pyth_price, switchboard_price);

    // Reject if oracles deviate too much (potential manipulation)
    const MAX_DEVIATION_BPS: u64 = 100; // 1%
    require!(deviation < MAX_DEVIATION_BPS, ErrorCode::OracleDeviation);

    // Use average of oracles
    let avg_price = (pyth_price + switchboard_price) / 2;

    // Continue with validated price...
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid price feed")]
    InvalidPriceFeed,
    #[msg("Price feed is stale")]
    StalePriceFeed,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Price confidence too low")]
    LowConfidencePrice,
    #[msg("Invalid price exponent")]
    InvalidPriceExponent,
    #[msg("Slippage exceeded")]
    SlippageExceeded,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Oracle prices deviate too much")]
    OracleDeviation,
    #[msg("Price unavailable")]
    PriceUnavailable,
}
```

---

## Access Control Patterns

### Role-Based Access Control (RBAC)

```rust
use anchor_lang::prelude::*;
use std::collections::BTreeSet;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Role {
    Admin = 0,
    Operator = 1,
    Guardian = 2,
    User = 3,
}

#[account]
pub struct AccessControl {
    pub authority: Pubkey,           // Super admin
    pub admins: [Pubkey; 5],         // Multi-admin support
    pub admin_count: u8,
    pub operators: [Pubkey; 10],     // Operators for day-to-day
    pub operator_count: u8,
    pub guardians: [Pubkey; 3],      // Emergency pause capability
    pub guardian_count: u8,
    pub paused: bool,
    pub bump: u8,
}

impl AccessControl {
    pub const SIZE: usize = 32 + (32 * 5) + 1 + (32 * 10) + 1 + (32 * 3) + 1 + 1 + 1;

    pub fn has_role(&self, address: &Pubkey, role: Role) -> bool {
        match role {
            Role::Admin => {
                *address == self.authority ||
                self.admins[..self.admin_count as usize].contains(address)
            }
            Role::Operator => {
                self.has_role(address, Role::Admin) ||
                self.operators[..self.operator_count as usize].contains(address)
            }
            Role::Guardian => {
                self.has_role(address, Role::Admin) ||
                self.guardians[..self.guardian_count as usize].contains(address)
            }
            Role::User => true, // Everyone has user role
        }
    }

    pub fn require_role(&self, address: &Pubkey, role: Role) -> Result<()> {
        require!(self.has_role(address, role), ErrorCode::Unauthorized);
        Ok(())
    }

    pub fn require_not_paused(&self) -> Result<()> {
        require!(!self.paused, ErrorCode::ProtocolPaused);
        Ok(())
    }
}

// Macro for role checking
macro_rules! require_role {
    ($access_control:expr, $signer:expr, $role:expr) => {
        require!(
            $access_control.has_role(&$signer.key(), $role),
            ErrorCode::Unauthorized
        );
    };
}

// Admin-only instruction
pub fn set_fee_rate(ctx: Context<AdminOnly>, new_fee_rate: u64) -> Result<()> {
    let access_control = &ctx.accounts.access_control;

    // Verify admin role
    require_role!(access_control, ctx.accounts.admin, Role::Admin);

    // Verify not paused
    access_control.require_not_paused()?;

    // Validate fee rate
    require!(new_fee_rate <= 10000, ErrorCode::InvalidFeeRate); // Max 100%

    let config = &mut ctx.accounts.config;
    config.fee_rate = new_fee_rate;

    emit!(FeeRateChanged {
        old_rate: config.fee_rate,
        new_rate: new_fee_rate,
        admin: ctx.accounts.admin.key(),
    });

    Ok(())
}

// Guardian can pause
pub fn emergency_pause(ctx: Context<GuardianOnly>) -> Result<()> {
    let access_control = &mut ctx.accounts.access_control;

    // Verify guardian role
    require_role!(access_control, ctx.accounts.guardian, Role::Guardian);

    access_control.paused = true;

    emit!(ProtocolPaused {
        guardian: ctx.accounts.guardian.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// Only super admin can unpause
pub fn unpause(ctx: Context<SuperAdminOnly>) -> Result<()> {
    let access_control = &mut ctx.accounts.access_control;

    // Only super admin (authority) can unpause
    require!(
        ctx.accounts.authority.key() == access_control.authority,
        ErrorCode::Unauthorized
    );

    access_control.paused = false;

    emit!(ProtocolUnpaused {
        authority: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(
        seeds = [b"access_control"],
        bump = access_control.bump,
    )]
    pub access_control: Account<'info, AccessControl>,
    #[account(mut)]
    pub config: Account<'info, ProtocolConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct GuardianOnly<'info> {
    #[account(
        mut,
        seeds = [b"access_control"],
        bump = access_control.bump,
    )]
    pub access_control: Account<'info, AccessControl>,
    pub guardian: Signer<'info>,
}

#[derive(Accounts)]
pub struct SuperAdminOnly<'info> {
    #[account(
        mut,
        seeds = [b"access_control"],
        bump = access_control.bump,
        constraint = authority.key() == access_control.authority @ ErrorCode::Unauthorized,
    )]
    pub access_control: Account<'info, AccessControl>,
    pub authority: Signer<'info>,
}

#[event]
pub struct FeeRateChanged {
    pub old_rate: u64,
    pub new_rate: u64,
    pub admin: Pubkey,
}

#[event]
pub struct ProtocolPaused {
    pub guardian: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProtocolUnpaused {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Protocol is paused")]
    ProtocolPaused,
    #[msg("Invalid fee rate")]
    InvalidFeeRate,
}
```

### Multi-Signature Authorization

```rust
#[account]
pub struct MultiSig {
    pub threshold: u8,               // Required signatures
    pub signers: [Pubkey; 7],        // Max 7 signers
    pub signer_count: u8,
    pub nonce: u64,                  // For replay protection
    pub bump: u8,
}

#[account]
pub struct PendingTransaction {
    pub multisig: Pubkey,
    pub instruction_data: Vec<u8>,   // Serialized instruction
    pub target_program: Pubkey,
    pub signers: [bool; 7],          // Who has signed
    pub signature_count: u8,
    pub executed: bool,
    pub created_at: i64,
    pub expires_at: i64,
}

impl PendingTransaction {
    pub const MAX_SIZE: usize = 32 + 1000 + 32 + 7 + 1 + 1 + 8 + 8;
}

pub fn propose_transaction(
    ctx: Context<ProposeTransaction>,
    instruction_data: Vec<u8>,
    target_program: Pubkey,
    expiry_seconds: i64,
) -> Result<()> {
    let multisig = &ctx.accounts.multisig;
    let proposer = &ctx.accounts.proposer;
    let clock = Clock::get()?;

    // Verify proposer is a signer
    let signer_index = multisig.signers[..multisig.signer_count as usize]
        .iter()
        .position(|s| s == proposer.key)
        .ok_or(ErrorCode::NotASigner)?;

    let pending_tx = &mut ctx.accounts.pending_transaction;
    pending_tx.multisig = multisig.key();
    pending_tx.instruction_data = instruction_data;
    pending_tx.target_program = target_program;
    pending_tx.signers = [false; 7];
    pending_tx.signers[signer_index] = true;
    pending_tx.signature_count = 1;
    pending_tx.executed = false;
    pending_tx.created_at = clock.unix_timestamp;
    pending_tx.expires_at = clock.unix_timestamp + expiry_seconds;

    Ok(())
}

pub fn approve_transaction(ctx: Context<ApproveTransaction>) -> Result<()> {
    let multisig = &ctx.accounts.multisig;
    let approver = &ctx.accounts.approver;
    let pending_tx = &mut ctx.accounts.pending_transaction;
    let clock = Clock::get()?;

    // Check not expired
    require!(
        clock.unix_timestamp < pending_tx.expires_at,
        ErrorCode::TransactionExpired
    );

    // Check not already executed
    require!(!pending_tx.executed, ErrorCode::AlreadyExecuted);

    // Find approver in signers
    let signer_index = multisig.signers[..multisig.signer_count as usize]
        .iter()
        .position(|s| s == approver.key)
        .ok_or(ErrorCode::NotASigner)?;

    // Check hasn't already signed
    require!(
        !pending_tx.signers[signer_index],
        ErrorCode::AlreadySigned
    );

    // Record signature
    pending_tx.signers[signer_index] = true;
    pending_tx.signature_count += 1;

    Ok(())
}

pub fn execute_transaction(ctx: Context<ExecuteTransaction>) -> Result<()> {
    let multisig = &ctx.accounts.multisig;
    let pending_tx = &mut ctx.accounts.pending_transaction;
    let clock = Clock::get()?;

    // Check not expired
    require!(
        clock.unix_timestamp < pending_tx.expires_at,
        ErrorCode::TransactionExpired
    );

    // Check not already executed
    require!(!pending_tx.executed, ErrorCode::AlreadyExecuted);

    // Check threshold met
    require!(
        pending_tx.signature_count >= multisig.threshold,
        ErrorCode::ThresholdNotMet
    );

    // Mark as executed (before CPI to prevent reentrancy)
    pending_tx.executed = true;

    // Execute the transaction via CPI
    // ... (CPI logic here)

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Not a signer of this multisig")]
    NotASigner,
    #[msg("Transaction has expired")]
    TransactionExpired,
    #[msg("Transaction already executed")]
    AlreadyExecuted,
    #[msg("Already signed this transaction")]
    AlreadySigned,
    #[msg("Signature threshold not met")]
    ThresholdNotMet,
}
```

---

## Automated Security Checks

### TypeScript Security Scanner

```typescript
// security-scanner.ts
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

interface SecurityCheck {
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  check: (idl: anchor.Idl) => SecurityIssue[];
}

interface SecurityIssue {
  title: string;
  description: string;
  location: string;
  recommendation: string;
}

const securityChecks: SecurityCheck[] = [
  {
    name: 'Missing Signer Checks',
    severity: 'CRITICAL',
    check: (idl) => {
      const issues: SecurityIssue[] = [];

      for (const instruction of idl.instructions || []) {
        for (const account of instruction.accounts) {
          // Check authority/admin/owner accounts that aren't signers
          if (
            (account.name.toLowerCase().includes('authority') ||
             account.name.toLowerCase().includes('admin') ||
             account.name.toLowerCase().includes('owner')) &&
            !account.isSigner
          ) {
            issues.push({
              title: `Missing signer on ${account.name}`,
              description: `The account "${account.name}" in instruction "${instruction.name}" appears to be an authority but is not marked as signer.`,
              location: `Instruction: ${instruction.name}`,
              recommendation: 'Add signer constraint to authority accounts.',
            });
          }
        }
      }

      return issues;
    },
  },
  {
    name: 'Missing Account Ownership Checks',
    severity: 'HIGH',
    check: (idl) => {
      const issues: SecurityIssue[] = [];

      for (const instruction of idl.instructions || []) {
        // Check for token accounts without ownership constraints
        const tokenAccounts = instruction.accounts.filter(
          acc => acc.name.toLowerCase().includes('token') ||
                 acc.name.toLowerCase().includes('vault')
        );

        if (tokenAccounts.length > 0) {
          issues.push({
            title: 'Token accounts detected - verify ownership',
            description: `Instruction "${instruction.name}" uses token accounts. Ensure proper ownership validation.`,
            location: `Instruction: ${instruction.name}`,
            recommendation: 'Add owner constraints on token accounts.',
          });
        }
      }

      return issues;
    },
  },
  {
    name: 'Admin Functions Without Access Control',
    severity: 'CRITICAL',
    check: (idl) => {
      const issues: SecurityIssue[] = [];
      const adminKeywords = ['set', 'update', 'withdraw', 'emergency', 'pause', 'admin', 'config'];

      for (const instruction of idl.instructions || []) {
        const isAdminFunction = adminKeywords.some(
          keyword => instruction.name.toLowerCase().includes(keyword)
        );

        if (isAdminFunction) {
          const hasAuthority = instruction.accounts.some(
            acc => acc.isSigner && (
              acc.name.toLowerCase().includes('authority') ||
              acc.name.toLowerCase().includes('admin') ||
              acc.name.toLowerCase().includes('owner')
            )
          );

          if (!hasAuthority) {
            issues.push({
              title: `Admin function "${instruction.name}" may lack access control`,
              description: `The instruction "${instruction.name}" appears to be an admin function but no authority signer was detected.`,
              location: `Instruction: ${instruction.name}`,
              recommendation: 'Add authority signer with proper validation.',
            });
          }
        }
      }

      return issues;
    },
  },
  {
    name: 'Potential PDA Collision',
    severity: 'MEDIUM',
    check: (idl) => {
      const issues: SecurityIssue[] = [];
      const pdaAccounts = new Map<string, string[]>();

      for (const instruction of idl.instructions || []) {
        for (const account of instruction.accounts) {
          // Look for accounts with seeds (PDAs)
          // Note: IDL may not have full seed info, so this is heuristic
          if (account.name.toLowerCase().includes('pda') ||
              account.name.toLowerCase().includes('vault') ||
              account.name.toLowerCase().includes('state')) {
            if (!pdaAccounts.has(account.name)) {
              pdaAccounts.set(account.name, []);
            }
            pdaAccounts.get(account.name)!.push(instruction.name);
          }
        }
      }

      // Check for PDAs used in multiple instructions (potential collision risk)
      for (const [name, instructions] of pdaAccounts) {
        if (instructions.length > 1) {
          issues.push({
            title: `PDA "${name}" used across multiple instructions`,
            description: `The PDA "${name}" is used in: ${instructions.join(', ')}. Verify seeds are unique per context.`,
            location: 'Multiple instructions',
            recommendation: 'Ensure PDA seeds include unique identifiers.',
          });
        }
      }

      return issues;
    },
  },
];

export async function runSecurityScan(idl: anchor.Idl): Promise<{
  issues: SecurityIssue[];
  summary: { critical: number; high: number; medium: number; low: number };
}> {
  const allIssues: SecurityIssue[] = [];
  const summary = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const check of securityChecks) {
    const issues = check.check(idl);
    allIssues.push(...issues);

    switch (check.severity) {
      case 'CRITICAL': summary.critical += issues.length; break;
      case 'HIGH': summary.high += issues.length; break;
      case 'MEDIUM': summary.medium += issues.length; break;
      case 'LOW': summary.low += issues.length; break;
    }
  }

  return { issues: allIssues, summary };
}

// On-chain verification
export async function verifyOnChainSecurity(
  connection: Connection,
  programId: PublicKey
): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  // Check if program is upgradeable
  const programAccountInfo = await connection.getAccountInfo(programId);
  if (programAccountInfo) {
    // BPF Loader Upgradeable programs have upgrade authority
    // Check if upgrade authority is set
    // ... implementation
  }

  // Check program data account
  const [programDataAddress] = PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')
  );

  const programData = await connection.getAccountInfo(programDataAddress);
  if (programData) {
    // Parse upgrade authority from program data
    // First 4 bytes: variant tag
    // Next 8 bytes: slot deployed
    // Next 1 byte: has authority flag
    // Next 32 bytes: authority pubkey (if has_authority is true)
    const hasAuthority = programData.data[12] === 1;

    if (hasAuthority) {
      issues.push({
        title: 'Program is upgradeable',
        description: 'This program has an upgrade authority set, meaning it can be modified.',
        location: 'Program account',
        recommendation: 'Consider revoking upgrade authority for immutability, or implement timelock for upgrades.',
      });
    }
  }

  return issues;
}
```

---

## Testing Security with Bankrun

```typescript
// security-tests.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { startAnchor, BanksClient, ProgramTestContext } from 'solana-bankrun';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';

describe('Security Tests', () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let program: Program;
  let admin: Keypair;
  let attacker: Keypair;
  let vault: PublicKey;

  beforeAll(async () => {
    admin = Keypair.generate();
    attacker = Keypair.generate();

    context = await startAnchor(
      './programs/secure-vault',
      [],
      [
        { address: admin.publicKey, info: { lamports: 10_000_000_000, data: Buffer.from([]), owner: SystemProgram.programId, executable: false } },
        { address: attacker.publicKey, info: { lamports: 10_000_000_000, data: Buffer.from([]), owner: SystemProgram.programId, executable: false } },
      ]
    );

    client = context.banksClient;
    program = anchor.workspace.SecureVault;

    [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), admin.publicKey.toBuffer()],
      program.programId
    );
  });

  describe('Access Control', () => {
    it('should reject unauthorized admin actions', async () => {
      // Attacker tries to call admin function
      await expect(
        program.methods
          .setFeeRate(new BN(500))
          .accounts({
            vault,
            authority: attacker.publicKey,
          })
          .signers([attacker])
          .rpc()
      ).rejects.toThrow(/Unauthorized/);
    });

    it('should reject missing signer', async () => {
      await expect(
        program.methods
          .withdraw(new BN(1000))
          .accounts({
            vault,
            authority: admin.publicKey,
            recipient: attacker.publicKey,
          })
          // Missing .signers([admin])
          .rpc()
      ).rejects.toThrow(/Signature verification failed/);
    });

    it('should accept valid admin actions', async () => {
      await program.methods
        .setFeeRate(new BN(500))
        .accounts({
          vault,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      const vaultData = await program.account.vault.fetch(vault);
      expect(vaultData.feeRate.toNumber()).toBe(500);
    });
  });

  describe('Arithmetic Safety', () => {
    it('should handle maximum values without overflow', async () => {
      const maxAmount = new BN('18446744073709551615'); // u64::MAX

      // This should either succeed with correct handling or fail gracefully
      await expect(
        program.methods
          .deposit(maxAmount)
          .accounts({
            vault,
            depositor: admin.publicKey,
          })
          .signers([admin])
          .rpc()
      ).rejects.toThrow(/overflow|insufficient/i);
    });

    it('should prevent underflow on withdrawal', async () => {
      // Try to withdraw more than balance
      await expect(
        program.methods
          .withdraw(new BN('999999999999999'))
          .accounts({
            vault,
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc()
      ).rejects.toThrow(/InsufficientFunds|underflow/i);
    });
  });

  describe('Reentrancy Protection', () => {
    it('should prevent reentrancy attacks', async () => {
      // Deploy malicious program that tries to re-enter
      // ... setup malicious CPI callback

      // This test would need a malicious program deployed
      // that attempts to call back into the vault during withdraw

      // For now, verify the lock mechanism
      const vaultData = await program.account.vault.fetch(vault);
      expect(vaultData.locked).toBe(false);
    });
  });

  describe('PDA Security', () => {
    it('should reject invalid PDA derivation', async () => {
      // Try to use wrong seeds for PDA
      const [wrongPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('wrong_seed')],
        program.programId
      );

      await expect(
        program.methods
          .accessVault()
          .accounts({
            vault: wrongPda, // Wrong PDA
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc()
      ).rejects.toThrow(/ConstraintSeeds|AccountNotInitialized/i);
    });

    it('should validate PDA ownership', async () => {
      // Create a fake account with same address structure
      // Anchor should reject it due to discriminator mismatch

      const fakeAccount = Keypair.generate();

      await expect(
        program.methods
          .accessVault()
          .accounts({
            vault: fakeAccount.publicKey, // Non-PDA account
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc()
      ).rejects.toThrow(/ConstraintSeeds|InvalidAccountDiscriminator/i);
    });
  });

  describe('Oracle Manipulation', () => {
    it('should reject stale oracle prices', async () => {
      // Mock an oracle with stale timestamp
      const staleOracleData = createMockOracleData({
        price: 100_000_000,
        confidence: 1_000_000,
        publishTime: Date.now() / 1000 - 3600, // 1 hour old
      });

      // ... set up stale oracle account

      await expect(
        program.methods
          .swapWithOracle(new BN(1000))
          .accounts({
            // ... accounts including stale oracle
          })
          .signers([admin])
          .rpc()
      ).rejects.toThrow(/StalePriceFeed/i);
    });

    it('should reject low confidence prices', async () => {
      // Mock an oracle with low confidence
      const lowConfOracle = createMockOracleData({
        price: 100_000_000,
        confidence: 50_000_000, // 50% confidence interval
        publishTime: Date.now() / 1000,
      });

      // ... test implementation
    });
  });

  describe('Emergency Functions', () => {
    it('should allow guardian to pause', async () => {
      await program.methods
        .emergencyPause()
        .accounts({
          accessControl: await getAccessControlPda(),
          guardian: admin.publicKey, // Admin is also guardian
        })
        .signers([admin])
        .rpc();

      const accessControl = await program.account.accessControl.fetch(
        await getAccessControlPda()
      );
      expect(accessControl.paused).toBe(true);
    });

    it('should block operations when paused', async () => {
      await expect(
        program.methods
          .deposit(new BN(1000))
          .accounts({
            vault,
            depositor: admin.publicKey,
          })
          .signers([admin])
          .rpc()
      ).rejects.toThrow(/ProtocolPaused/);
    });
  });
});

// Helper functions
function createMockOracleData(params: {
  price: number;
  confidence: number;
  publishTime: number;
}): Buffer {
  // Create mock Pyth price feed data
  const buffer = Buffer.alloc(100);
  // ... serialize according to Pyth format
  return buffer;
}

async function getAccessControlPda(): Promise<PublicKey> {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('access_control')],
    anchor.workspace.SecureVault.programId
  );
  return pda;
}
```

---

## Audit Report Template

```markdown
# Security Audit Report

## Executive Summary
- **Program**: [Program Name]
- **Program ID**: [Pubkey]
- **Audit Date**: [Date]
- **Auditor**: [Name/Firm]
- **Commit Hash**: [Git hash]

### Risk Summary
| Severity | Count | Status |
|----------|-------|--------|
| Critical | X | Fixed/Acknowledged |
| High | X | Fixed/Acknowledged |
| Medium | X | Fixed/Acknowledged |
| Low | X | Fixed/Acknowledged |
| Info | X | Acknowledged |

## Scope
- Contracts audited: [list]
- Lines of code: [number]
- Methods: [number]

## Findings

### [CRITICAL-01] Missing Signer Check on Admin Function
**Severity**: Critical
**Location**: `lib.rs:142`
**Status**: Fixed

**Description**:
The `withdraw_all` function does not verify that the `authority` account is a signer.

**Impact**:
Any user can drain the vault by passing the admin's public key.

**Recommendation**:
Add `Signer` constraint:
```rust
pub authority: Signer<'info>,
```

**Resolution**:
Fixed in commit abc123.

---

### [HIGH-01] Arithmetic Overflow in Reward Calculation
...

## Appendix
### A. Test Coverage
### B. Gas Optimization Suggestions
### C. Code Quality Observations
```

---

## Security Checklist

Before deploying to mainnet, verify:

### Access Control
- [ ] All admin functions require signer verification
- [ ] Role-based access control implemented
- [ ] Multi-sig for critical operations
- [ ] Upgrade authority properly managed

### Account Validation
- [ ] All PDAs use unique, collision-resistant seeds
- [ ] Account ownership validated
- [ ] Discriminators used for account type safety
- [ ] Close account properly transfers rent

### Arithmetic
- [ ] Checked math for all calculations
- [ ] u128 intermediates for large multiplications
- [ ] Underflow impossible on subtractions
- [ ] Division by zero handled

### Oracle Security
- [ ] Price staleness checked
- [ ] Confidence intervals validated
- [ ] Multiple oracle sources considered
- [ ] Fallback prices implemented

### CPI Security
- [ ] Target program IDs validated
- [ ] PDA seeds verified before signing
- [ ] Checks-Effects-Interactions pattern
- [ ] Reentrancy guards where needed

### Economic Security
- [ ] Slippage protection on swaps
- [ ] Flash loan attack resistance
- [ ] Price manipulation resistance
- [ ] Withdrawal limits implemented

### Emergency Response
- [ ] Pause functionality exists
- [ ] Guardian role for emergencies
- [ ] Upgrade timelock implemented
- [ ] Emergency withdraw available

---

## Related Skills

- **anchor-instructor** - Anchor framework patterns
- **solana-deployer** - Safe program deployment
- **governance-expert** - On-chain governance security
- **staking-expert** - Staking protocol security

---

## Further Reading

- [Solana Security Best Practices](https://github.com/coral-xyz/sealevel-attacks)
- [Anchor Security Considerations](https://book.anchor-lang.com/anchor_in_depth/security.html)
- [Neodyme Solana Security Workshop](https://workshop.neodyme.io/)
- [Soteria Static Analyzer](https://www.soteria.dev/)
- [Sec3 Audit Resources](https://www.sec3.dev/)
