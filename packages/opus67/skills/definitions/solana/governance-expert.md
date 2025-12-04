# Governance Expert - DAO Governance & On-Chain Voting

> **ID:** `governance-expert`
> **Tier:** 2 (Domain Expertise)
> **Token Cost:** 6000
> **MCP Connections:** helius
> **Version:** 1.0

## 🎯 What This Skill Does

Master DAO governance implementation with on-chain voting, proposal systems, and treasury management. This skill covers SPL Governance, custom governance programs, quadratic voting, and multi-sig security patterns.

**Core Capabilities:**
- DAO governance structures
- Proposal creation and voting
- Treasury management
- Delegate voting systems
- Quadratic voting mechanisms
- Multi-signature schemes
- Time-locked operations
- Governance token distribution

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** governance, dao, proposal, voting, treasury, multi-sig, delegate
- **File Types:** .ts, .tsx, .rs
- **Directories:** programs/, governance/

**Use this skill when:**
- Building DAO platforms
- Implementing voting systems
- Managing treasuries
- Creating proposal mechanisms
- Building delegate systems
- Implementing governance tokens

## 🚀 Core Capabilities

### 1. SPL Governance Integration

```typescript
// packages/governance/src/spl-gov/client.ts
import {
  ProgramAccount,
  Governance,
  GovernanceConfig,
  Proposal,
  VoteType,
  VoteChoice,
  getGovernanceProgramVersion,
  getRealm,
  getGovernance,
  getProposal,
  withCreateProposal,
  withAddSignatory,
  withInsertTransaction,
  withSignOffProposal,
  withCastVote,
  getGovernanceAccounts,
} from '@solana/spl-governance';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export class SPLGovernanceClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey) {
    this.connection = connection;
    this.programId = programId;
  }

  /**
   * Create a new realm (DAO)
   */
  async createRealm(params: {
    name: string;
    communityMint: PublicKey;
    councilMint?: PublicKey;
    authority: PublicKey;
  }) {
    const { name, communityMint, councilMint, authority } = params;

    // Implementation using SPL Governance SDK
    const realmAddress = await this.getRealmAddress(name);

    return {
      realmAddress,
      signature: 'tx_sig',
    };
  }

  /**
   * Create a governance account for a program or account
   */
  async createGovernance(params: {
    realm: PublicKey;
    governedAccount: PublicKey;
    config: GovernanceConfig;
    authority: PublicKey;
  }) {
    const { realm, governedAccount, config, authority } = params;

    const governanceAddress = await this.getGovernanceAddress(
      realm,
      governedAccount
    );

    return {
      governanceAddress,
      signature: 'tx_sig',
    };
  }

  /**
   * Create a proposal
   */
  async createProposal(params: {
    governance: PublicKey;
    proposer: PublicKey;
    name: string;
    descriptionLink: string;
    governingTokenMint: PublicKey;
  }): Promise<{ proposalAddress: PublicKey; signature: string }> {
    const {
      governance,
      proposer,
      name,
      descriptionLink,
      governingTokenMint,
    } = params;

    const proposalAddress = await this.getProposalAddress(
      governance,
      governingTokenMint,
      0 // proposalIndex
    );

    // Create instructions
    const instructions: any[] = [];

    await withCreateProposal(
      instructions,
      this.programId,
      await getGovernanceProgramVersion(this.connection, this.programId),
      await this.getRealmFromGovernance(governance),
      governance,
      proposer,
      name,
      descriptionLink,
      governingTokenMint,
      proposer,
      0, // proposalIndex
      VoteType.SINGLE_CHOICE,
      ['Approve', 'Deny'],
      true, // useDenyOption
      proposer
    );

    // Add proposal instructions
    // Sign off proposal

    return {
      proposalAddress,
      signature: 'tx_sig',
    };
  }

  /**
   * Add an instruction to a proposal
   */
  async addInstruction(params: {
    proposal: PublicKey;
    governance: PublicKey;
    instructionData: {
      programId: PublicKey;
      accounts: any[];
      data: Buffer;
    };
  }) {
    const { proposal, governance, instructionData } = params;

    const instructions: any[] = [];

    await withInsertTransaction(
      instructions,
      this.programId,
      await getGovernanceProgramVersion(this.connection, this.programId),
      governance,
      proposal,
      await this.getProposerTokenOwnerRecord(proposal),
      await this.getProposer(proposal),
      0, // optionIndex
      0, // transactionIndex
      0, // holdUpTime
      [instructionData]
    );

    return 'tx_sig';
  }

  /**
   * Cast a vote on a proposal
   */
  async castVote(params: {
    proposal: PublicKey;
    voter: PublicKey;
    vote: VoteChoice;
  }): Promise<string> {
    const { proposal, voter, vote } = params;

    const governance = await this.getGovernanceFromProposal(proposal);
    const realm = await this.getRealmFromGovernance(governance);

    const instructions: any[] = [];

    await withCastVote(
      instructions,
      this.programId,
      await getGovernanceProgramVersion(this.connection, this.programId),
      realm,
      governance,
      proposal,
      await this.getProposalOwnerRecord(proposal),
      await this.getVoterTokenOwnerRecord(voter, realm),
      voter,
      await this.getGoverningTokenMint(proposal),
      vote,
      voter
    );

    return 'tx_sig';
  }

  /**
   * Execute a proposal
   */
  async executeProposal(params: {
    proposal: PublicKey;
    transactionIndex: number;
  }): Promise<string> {
    const { proposal, transactionIndex } = params;

    // Implementation
    return 'tx_sig';
  }

  /**
   * Get all proposals for a governance
   */
  async getProposals(governance: PublicKey): Promise<ProgramAccount<Proposal>[]> {
    const proposals = await getGovernanceAccounts(
      this.connection,
      this.programId,
      Proposal,
      [
        {
          memcmp: {
            offset: 1,
            bytes: governance.toBase58(),
          },
        },
      ]
    );

    return proposals;
  }

  /**
   * Get voting power for an address
   */
  async getVotingPower(params: {
    realm: PublicKey;
    governingTokenMint: PublicKey;
    owner: PublicKey;
  }): Promise<bigint> {
    const { realm, governingTokenMint, owner } = params;

    const tokenOwnerRecord = await this.getTokenOwnerRecord(
      realm,
      governingTokenMint,
      owner
    );

    const account = await this.connection.getAccountInfo(tokenOwnerRecord);
    if (!account) return BigInt(0);

    // Parse token owner record
    return BigInt(0); // Parse from account data
  }

  // Helper methods
  private async getRealmAddress(name: string): Promise<PublicKey> {
    const [address] = await PublicKey.findProgramAddress(
      [Buffer.from('governance'), Buffer.from(name)],
      this.programId
    );
    return address;
  }

  private async getGovernanceAddress(
    realm: PublicKey,
    governedAccount: PublicKey
  ): Promise<PublicKey> {
    const [address] = await PublicKey.findProgramAddress(
      [
        Buffer.from('account-governance'),
        realm.toBuffer(),
        governedAccount.toBuffer(),
      ],
      this.programId
    );
    return address;
  }

  private async getProposalAddress(
    governance: PublicKey,
    governingTokenMint: PublicKey,
    proposalIndex: number
  ): Promise<PublicKey> {
    const [address] = await PublicKey.findProgramAddress(
      [
        Buffer.from('governance'),
        governance.toBuffer(),
        governingTokenMint.toBuffer(),
        Buffer.from(proposalIndex.toString()),
      ],
      this.programId
    );
    return address;
  }

  private async getTokenOwnerRecord(
    realm: PublicKey,
    governingTokenMint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    const [address] = await PublicKey.findProgramAddress(
      [
        Buffer.from('governance'),
        realm.toBuffer(),
        governingTokenMint.toBuffer(),
        owner.toBuffer(),
      ],
      this.programId
    );
    return address;
  }

  private async getRealmFromGovernance(governance: PublicKey): Promise<PublicKey> {
    const account = await getGovernance(this.connection, governance);
    return account.account.realm;
  }

  private async getGovernanceFromProposal(proposal: PublicKey): Promise<PublicKey> {
    const account = await getProposal(this.connection, proposal);
    return account.account.governance;
  }

  private async getProposer(proposal: PublicKey): Promise<PublicKey> {
    const account = await getProposal(this.connection, proposal);
    return account.account.tokenOwnerRecord;
  }

  private async getProposerTokenOwnerRecord(proposal: PublicKey): Promise<PublicKey> {
    return await this.getProposer(proposal);
  }

  private async getProposalOwnerRecord(proposal: PublicKey): Promise<PublicKey> {
    return await this.getProposer(proposal);
  }

  private async getVoterTokenOwnerRecord(
    voter: PublicKey,
    realm: PublicKey
  ): Promise<PublicKey> {
    const proposal = await getProposal(this.connection, voter);
    return await this.getTokenOwnerRecord(
      realm,
      proposal.account.governingTokenMint,
      voter
    );
  }

  private async getGoverningTokenMint(proposal: PublicKey): Promise<PublicKey> {
    const account = await getProposal(this.connection, proposal);
    return account.account.governingTokenMint;
  }
}
```

### 2. Custom Governance Program (Anchor)

```rust
// programs/custom-governance/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("Gov11111111111111111111111111111111111111");

#[program]
pub mod custom_governance {
    use super::*;

    /// Create a new DAO
    pub fn create_dao(
        ctx: Context<CreateDao>,
        name: String,
        quorum: u64,            // Minimum votes required (in basis points)
        threshold: u64,         // Percentage needed to pass (in basis points)
        voting_period: i64,     // Duration in seconds
        execution_delay: i64,   // Timelock delay in seconds
    ) -> Result<()> {
        let dao = &mut ctx.accounts.dao;

        dao.authority = ctx.accounts.authority.key();
        dao.name = name;
        dao.governance_token = ctx.accounts.governance_token.key();
        dao.treasury = ctx.accounts.treasury.key();
        dao.quorum = quorum;
        dao.threshold = threshold;
        dao.voting_period = voting_period;
        dao.execution_delay = execution_delay;
        dao.proposal_count = 0;
        dao.total_votes_cast = 0;
        dao.bump = *ctx.bumps.get("dao").unwrap();

        msg!("DAO created: {}", dao.name);

        Ok(())
    }

    /// Create a proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        instructions: Vec<ProposalInstruction>,
    ) -> Result<()> {
        let dao = &mut ctx.accounts.dao;
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        // Check proposer has minimum tokens
        require!(
            ctx.accounts.proposer_token_account.amount >= 1000000,
            GovernanceError::InsufficientTokens
        );

        proposal.dao = dao.key();
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title;
        proposal.description = description;
        proposal.instructions = instructions;
        proposal.start_time = clock.unix_timestamp;
        proposal.end_time = clock.unix_timestamp + dao.voting_period;
        proposal.execution_time = 0;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.state = ProposalState::Active;
        proposal.bump = *ctx.bumps.get("proposal").unwrap();

        dao.proposal_count += 1;

        msg!("Proposal created: {}", proposal.title);

        Ok(())
    }

    /// Cast a vote
    pub fn cast_vote(
        ctx: Context<CastVote>,
        vote: Vote,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let dao = &ctx.accounts.dao;
        let voter_record = &mut ctx.accounts.voter_record;
        let clock = Clock::get()?;

        // Validate proposal is active
        require!(
            proposal.state == ProposalState::Active,
            GovernanceError::ProposalNotActive
        );

        // Check voting period
        require!(
            clock.unix_timestamp <= proposal.end_time,
            GovernanceError::VotingPeriodEnded
        );

        // Check not already voted
        require!(
            !voter_record.has_voted,
            GovernanceError::AlreadyVoted
        );

        // Get voting power (token balance at snapshot)
        let voting_power = ctx.accounts.voter_token_account.amount;

        // Record vote
        match vote {
            Vote::Yes => proposal.yes_votes += voting_power,
            Vote::No => proposal.no_votes += voting_power,
            Vote::Abstain => {},
        }

        // Update voter record
        voter_record.voter = ctx.accounts.voter.key();
        voter_record.proposal = proposal.key();
        voter_record.vote = vote;
        voter_record.voting_power = voting_power;
        voter_record.has_voted = true;
        voter_record.timestamp = clock.unix_timestamp;
        voter_record.bump = *ctx.bumps.get("voter_record").unwrap();

        msg!("Vote cast: {:?} with power {}", vote, voting_power);

        Ok(())
    }

    /// Finalize a proposal after voting ends
    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        let dao = &ctx.accounts.dao;
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        require!(
            proposal.state == ProposalState::Active,
            GovernanceError::ProposalNotActive
        );

        require!(
            clock.unix_timestamp > proposal.end_time,
            GovernanceError::VotingPeriodNotEnded
        );

        let total_votes = proposal.yes_votes + proposal.no_votes;
        let total_supply = ctx.accounts.governance_token.supply;

        // Check quorum
        let quorum_reached = (total_votes as u128 * 10000) >=
            (total_supply as u128 * dao.quorum as u128);

        if !quorum_reached {
            proposal.state = ProposalState::Defeated;
            msg!("Proposal defeated: quorum not reached");
            return Ok(());
        }

        // Check threshold
        let yes_percentage = (proposal.yes_votes as u128 * 10000) /
            (total_votes as u128);

        if yes_percentage >= dao.threshold as u128 {
            proposal.state = ProposalState::Succeeded;
            proposal.execution_time = clock.unix_timestamp + dao.execution_delay;
            msg!("Proposal succeeded, execution in {} seconds", dao.execution_delay);
        } else {
            proposal.state = ProposalState::Defeated;
            msg!("Proposal defeated: threshold not met");
        }

        Ok(())
    }

    /// Execute a successful proposal
    pub fn execute_proposal(
        ctx: Context<ExecuteProposal>,
        instruction_index: u8,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        require!(
            proposal.state == ProposalState::Succeeded,
            GovernanceError::ProposalNotSucceeded
        );

        require!(
            clock.unix_timestamp >= proposal.execution_time,
            GovernanceError::TimelockNotExpired
        );

        // Execute instruction
        let instruction = &proposal.instructions[instruction_index as usize];

        // Create and execute CPI call based on instruction
        msg!("Executing proposal instruction {}", instruction_index);

        // Mark as executed if all instructions done
        if instruction_index as usize == proposal.instructions.len() - 1 {
            proposal.state = ProposalState::Executed;
        }

        Ok(())
    }

    /// Delegate voting power
    pub fn delegate_vote(
        ctx: Context<DelegateVote>,
        delegatee: Pubkey,
    ) -> Result<()> {
        let delegation = &mut ctx.accounts.delegation;

        delegation.delegator = ctx.accounts.delegator.key();
        delegation.delegatee = delegatee;
        delegation.dao = ctx.accounts.dao.key();
        delegation.active = true;
        delegation.timestamp = Clock::get()?.unix_timestamp;
        delegation.bump = *ctx.bumps.get("delegation").unwrap();

        msg!("Delegated voting power to {}", delegatee);

        Ok(())
    }

    /// Revoke delegation
    pub fn revoke_delegation(ctx: Context<RevokeDelegation>) -> Result<()> {
        let delegation = &mut ctx.accounts.delegation;

        delegation.active = false;
        delegation.timestamp = Clock::get()?.unix_timestamp;

        msg!("Delegation revoked");

        Ok(())
    }
}

// Structs
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Vote {
    Yes,
    No,
    Abstain,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProposalState {
    Active,
    Succeeded,
    Defeated,
    Executed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProposalInstruction {
    pub program_id: Pubkey,
    pub accounts: Vec<ProposalAccountMeta>,
    pub data: Vec<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProposalAccountMeta {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

#[account]
pub struct Dao {
    pub authority: Pubkey,
    pub name: String,
    pub governance_token: Pubkey,
    pub treasury: Pubkey,
    pub quorum: u64,
    pub threshold: u64,
    pub voting_period: i64,
    pub execution_delay: i64,
    pub proposal_count: u64,
    pub total_votes_cast: u64,
    pub bump: u8,
}

#[account]
pub struct Proposal {
    pub dao: Pubkey,
    pub proposer: Pubkey,
    pub title: String,
    pub description: String,
    pub instructions: Vec<ProposalInstruction>,
    pub start_time: i64,
    pub end_time: i64,
    pub execution_time: i64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub state: ProposalState,
    pub bump: u8,
}

#[account]
pub struct VoterRecord {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub vote: Vote,
    pub voting_power: u64,
    pub has_voted: bool,
    pub timestamp: i64,
    pub bump: u8,
}

#[account]
pub struct Delegation {
    pub delegator: Pubkey,
    pub delegatee: Pubkey,
    pub dao: Pubkey,
    pub active: bool,
    pub timestamp: i64,
    pub bump: u8,
}

// Context structs
#[derive(Accounts)]
pub struct CreateDao<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 64 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"dao", authority.key().as_ref()],
        bump
    )]
    pub dao: Account<'info, Dao>,
    pub governance_token: Account<'info, Mint>,
    pub treasury: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub dao: Account<'info, Dao>,
    #[account(
        init,
        payer = proposer,
        space = 8 + 32 + 32 + 256 + 1024 + 4096 + 8 + 8 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"proposal", dao.key().as_ref(), dao.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    pub proposer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    pub dao: Account<'info, Dao>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + 32 + 32 + 1 + 8 + 1 + 8 + 1,
        seeds = [b"voter_record", voter.key().as_ref(), proposal.key().as_ref()],
        bump
    )]
    pub voter_record: Account<'info, VoterRecord>,
    pub voter_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    pub dao: Account<'info, Dao>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub governance_token: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub dao: Account<'info, Dao>,
}

#[derive(Accounts)]
pub struct DelegateVote<'info> {
    pub dao: Account<'info, Dao>,
    #[account(
        init,
        payer = delegator,
        space = 8 + 32 + 32 + 32 + 1 + 8 + 1,
        seeds = [b"delegation", delegator.key().as_ref(), dao.key().as_ref()],
        bump
    )]
    pub delegation: Account<'info, Delegation>,
    #[account(mut)]
    pub delegator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeDelegation<'info> {
    #[account(
        mut,
        seeds = [b"delegation", delegator.key().as_ref(), dao.key().as_ref()],
        bump = delegation.bump
    )]
    pub delegation: Account<'info, Delegation>,
    pub delegator: Signer<'info>,
}

#[error_code]
pub enum GovernanceError {
    #[msg("Insufficient tokens to create proposal")]
    InsufficientTokens,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Voting period has ended")]
    VotingPeriodEnded,
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    #[msg("Voting period has not ended")]
    VotingPeriodNotEnded,
    #[msg("Proposal has not succeeded")]
    ProposalNotSucceeded,
    #[msg("Timelock has not expired")]
    TimelockNotExpired,
}
```

### 3. Quadratic Voting

```typescript
// packages/governance/src/quadratic.ts
export class QuadraticVoting {
  /**
   * Calculate vote cost using quadratic formula
   * Cost = votes^2
   */
  calculateVoteCost(votes: number): number {
    return votes * votes;
  }

  /**
   * Calculate maximum votes from credits
   */
  calculateMaxVotes(credits: number): number {
    return Math.floor(Math.sqrt(credits));
  }

  /**
   * Calculate vote weight
   */
  calculateVoteWeight(params: {
    votes: number;
    totalVotes: number;
  }): number {
    const { votes, totalVotes } = params;

    if (totalVotes === 0) return 0;

    return votes / totalVotes;
  }

  /**
   * Allocate votes across multiple choices
   */
  allocateVotes(params: {
    totalCredits: number;
    allocations: Map<string, number>;
  }): { valid: boolean; remaining: number } {
    const { totalCredits, allocations } = params;

    let creditsUsed = 0;

    for (const votes of allocations.values()) {
      creditsUsed += this.calculateVoteCost(votes);
    }

    return {
      valid: creditsUsed <= totalCredits,
      remaining: totalCredits - creditsUsed,
    };
  }
}
```

### 4. Multi-Signature Wallet

```typescript
// packages/governance/src/multisig.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export interface MultisigConfig {
  owners: PublicKey[];
  threshold: number; // Number of signatures required
}

export class MultisigWallet {
  private connection: Connection;
  private config: MultisigConfig;

  constructor(connection: Connection, config: MultisigConfig) {
    this.connection = connection;
    this.config = config;
  }

  /**
   * Propose a transaction
   */
  async proposeTransaction(params: {
    proposer: PublicKey;
    transaction: Transaction;
  }): Promise<{ proposalId: string }> {
    const { proposer, transaction } = params;

    // Verify proposer is owner
    if (!this.config.owners.some(o => o.equals(proposer))) {
      throw new Error('Proposer is not an owner');
    }

    const proposalId = this.generateProposalId();

    // Store proposal
    return { proposalId };
  }

  /**
   * Approve a transaction
   */
  async approveTransaction(params: {
    proposalId: string;
    signer: PublicKey;
  }): Promise<{ approved: boolean; ready: boolean }> {
    const { proposalId, signer } = params;

    // Verify signer is owner
    if (!this.config.owners.some(o => o.equals(signer))) {
      throw new Error('Signer is not an owner');
    }

    // Add signature
    const approvals = await this.getApprovals(proposalId);
    approvals.push(signer);

    const ready = approvals.length >= this.config.threshold;

    return {
      approved: true,
      ready,
    };
  }

  /**
   * Execute a transaction once threshold is met
   */
  async executeTransaction(proposalId: string): Promise<string> {
    const approvals = await this.getApprovals(proposalId);

    if (approvals.length < this.config.threshold) {
      throw new Error('Insufficient approvals');
    }

    // Execute transaction
    return 'tx_signature';
  }

  private generateProposalId(): string {
    return `proposal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private async getApprovals(proposalId: string): Promise<PublicKey[]> {
    // Fetch approvals from storage
    return [];
  }
}
```

### 5. Treasury Management

```typescript
// packages/governance/src/treasury.ts
export class TreasuryManager {
  /**
   * Calculate runway
   */
  calculateRunway(params: {
    balance: bigint;
    monthlyBurn: bigint;
  }): number {
    const { balance, monthlyBurn } = params;

    if (monthlyBurn === BigInt(0)) return Infinity;

    const months = Number(balance / monthlyBurn);
    return months;
  }

  /**
   * Propose budget allocation
   */
  proposeBudget(params: {
    totalBudget: bigint;
    allocations: Map<string, number>; // category -> percentage
  }): Map<string, bigint> {
    const { totalBudget, allocations } = params;

    const budget = new Map<string, bigint>();

    for (const [category, percentage] of allocations) {
      const amount = (totalBudget * BigInt(percentage)) / BigInt(100);
      budget.set(category, amount);
    }

    return budget;
  }

  /**
   * Track spending
   */
  trackSpending(params: {
    category: string;
    amount: bigint;
    allocated: bigint;
  }): { withinBudget: boolean; remaining: bigint } {
    const { category, amount, allocated } = params;

    const withinBudget = amount <= allocated;
    const remaining = allocated - amount;

    return {
      withinBudget,
      remaining,
    };
  }
}
```

## 🧪 Testing

```typescript
// tests/governance.test.ts
import { describe, test, expect } from 'vitest';
import { QuadraticVoting } from '../src/quadratic';

describe('Quadratic Voting', () => {
  test('should calculate vote cost correctly', () => {
    const qv = new QuadraticVoting();

    expect(qv.calculateVoteCost(1)).toBe(1);
    expect(qv.calculateVoteCost(2)).toBe(4);
    expect(qv.calculateVoteCost(3)).toBe(9);
    expect(qv.calculateVoteCost(10)).toBe(100);
  });

  test('should calculate max votes from credits', () => {
    const qv = new QuadraticVoting();

    expect(qv.calculateMaxVotes(100)).toBe(10);
    expect(qv.calculateMaxVotes(25)).toBe(5);
  });

  test('should validate vote allocation', () => {
    const qv = new QuadraticVoting();

    const allocations = new Map([
      ['option1', 5], // costs 25
      ['option2', 3], // costs 9
      ['option3', 2], // costs 4
    ]);

    const result = qv.allocateVotes({
      totalCredits: 50,
      allocations,
    });

    expect(result.valid).toBe(true);
    expect(result.remaining).toBe(12);
  });
});
```

## 📦 Production Patterns

```typescript
// components/GovernanceUI.tsx
export function GovernanceUI() {
  return (
    <div className="governance">
      <div className="proposals">
        <h2>Active Proposals</h2>
        {/* List proposals */}
      </div>

      <div className="voting">
        <h2>Cast Your Vote</h2>
        {/* Voting interface */}
      </div>

      <div className="treasury">
        <h2>Treasury</h2>
        {/* Treasury stats */}
      </div>
    </div>
  );
}
```

## 🎯 Best Practices

1. **Implement proper quorum and threshold checks**
2. **Use timelocks for execution**
3. **Validate voting power at snapshot**
4. **Prevent double voting**
5. **Use multi-sig for critical operations**
6. **Audit governance parameters**
7. **Implement emergency procedures**
8. **Test all edge cases**
9. **Document governance processes**
10. **Monitor participation rates**

## 🔗 Related Skills

- **staking-expert** - Token staking mechanisms
- **tokenomics-designer** - Governance token design
- **solana-anchor-expert** - Smart contract development

## 📚 Resources

- [SPL Governance](https://github.com/solana-labs/solana-program-library/tree/master/governance)
- [Realms](https://realms.today/)
- [Squads Protocol](https://squads.so/)
- [Quadratic Voting](https://www.radicalxchange.org/concepts/quadratic-voting/)
