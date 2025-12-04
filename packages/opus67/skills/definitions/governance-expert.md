# Governance Expert

On-chain governance systems specialist for DAOs and protocol governance. Covers proposal systems, voting mechanisms, timelocks, delegation, and treasury management on Solana and EVM chains.

---

## Metadata

- **ID**: governance-expert
- **Name**: Governance Expert
- **Category**: DeFi/DAO
- **Tags**: governance, dao, voting, proposals, treasury, delegation
- **Version**: 2.0.0
- **Token Estimate**: 4300

---

## Overview

On-chain governance enables decentralized decision-making for protocols through:
- **Proposal Systems**: Creating and managing governance proposals
- **Voting Mechanisms**: Token-weighted, quadratic, conviction voting
- **Timelocks**: Delay execution for security review
- **Delegation**: Vote delegation for representation
- **Treasury Management**: Controlled fund disbursement

This skill covers governance implementation patterns for both Solana (SPL Governance, Realms) and EVM chains (Governor, Compound).

---

## Solana Governance (SPL Governance / Realms)

### Governance Program Structure

```rust
// programs/governance/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("GovERNANCE111111111111111111111111111111111");

#[program]
pub mod governance {
    use super::*;

    pub fn create_realm(
        ctx: Context<CreateRealm>,
        name: String,
        config: RealmConfig,
    ) -> Result<()> {
        let realm = &mut ctx.accounts.realm;
        realm.authority = ctx.accounts.authority.key();
        realm.name = name;
        realm.community_mint = ctx.accounts.community_mint.key();
        realm.council_mint = config.council_mint;
        realm.config = config;
        realm.bump = ctx.bumps.realm;
        realm.proposal_count = 0;

        emit!(RealmCreated {
            realm: realm.key(),
            name: realm.name.clone(),
            authority: realm.authority,
        });

        Ok(())
    }

    pub fn create_governance(
        ctx: Context<CreateGovernance>,
        config: GovernanceConfig,
    ) -> Result<()> {
        let governance = &mut ctx.accounts.governance;
        governance.realm = ctx.accounts.realm.key();
        governance.governed_account = ctx.accounts.governed_account.key();
        governance.config = config;
        governance.proposal_count = 0;
        governance.active_proposal_count = 0;
        governance.bump = ctx.bumps.governance;

        Ok(())
    }

    pub fn deposit_governing_tokens(
        ctx: Context<DepositGoverningTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_owner_record = &mut ctx.accounts.token_owner_record;

        // Transfer tokens to governance holding
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.source_token_account.to_account_info(),
                    to: ctx.accounts.governing_token_holding.to_account_info(),
                    authority: ctx.accounts.token_owner.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update token owner record
        token_owner_record.governing_token_deposit_amount = token_owner_record
            .governing_token_deposit_amount
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(TokensDeposited {
            realm: ctx.accounts.realm.key(),
            owner: ctx.accounts.token_owner.key(),
            amount,
            total_deposited: token_owner_record.governing_token_deposit_amount,
        });

        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        name: String,
        description_link: String,
        vote_type: VoteType,
    ) -> Result<()> {
        let realm = &ctx.accounts.realm;
        let governance = &mut ctx.accounts.governance;
        let proposal = &mut ctx.accounts.proposal;
        let token_owner_record = &ctx.accounts.token_owner_record;

        // Verify proposer has minimum tokens
        require!(
            token_owner_record.governing_token_deposit_amount >= governance.config.min_tokens_to_create_proposal,
            ErrorCode::InsufficientTokensToCreateProposal
        );

        let clock = Clock::get()?;

        proposal.governance = governance.key();
        proposal.token_owner_record = token_owner_record.key();
        proposal.name = name;
        proposal.description_link = description_link;
        proposal.vote_type = vote_type;
        proposal.state = ProposalState::Draft;
        proposal.draft_at = clock.unix_timestamp;
        proposal.signing_off_at = None;
        proposal.voting_at = None;
        proposal.voting_completed_at = None;
        proposal.executing_at = None;
        proposal.closed_at = None;
        proposal.deny_vote_weight = 0;
        proposal.veto_vote_weight = 0;
        proposal.options = vec![];
        proposal.bump = ctx.bumps.proposal;

        governance.proposal_count += 1;

        emit!(ProposalCreated {
            realm: realm.key(),
            governance: governance.key(),
            proposal: proposal.key(),
            proposer: ctx.accounts.proposer.key(),
            name: proposal.name.clone(),
        });

        Ok(())
    }

    pub fn add_signatory(
        ctx: Context<AddSignatory>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let signatory_record = &mut ctx.accounts.signatory_record;

        require!(
            proposal.state == ProposalState::Draft,
            ErrorCode::InvalidProposalState
        );

        signatory_record.proposal = proposal.key();
        signatory_record.signatory = ctx.accounts.signatory.key();
        signatory_record.signed_off = false;

        Ok(())
    }

    pub fn sign_off_proposal(
        ctx: Context<SignOffProposal>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let signatory_record = &mut ctx.accounts.signatory_record;

        require!(
            proposal.state == ProposalState::Draft,
            ErrorCode::InvalidProposalState
        );

        signatory_record.signed_off = true;

        // Check if all signatories have signed
        // If yes, transition to SigningOff state
        let clock = Clock::get()?;
        proposal.state = ProposalState::SigningOff;
        proposal.signing_off_at = Some(clock.unix_timestamp);

        // Start voting
        proposal.state = ProposalState::Voting;
        proposal.voting_at = Some(clock.unix_timestamp);

        Ok(())
    }

    pub fn cast_vote(
        ctx: Context<CastVote>,
        vote: Vote,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let token_owner_record = &ctx.accounts.token_owner_record;
        let vote_record = &mut ctx.accounts.vote_record;
        let clock = Clock::get()?;

        // Verify proposal is in voting state
        require!(
            proposal.state == ProposalState::Voting,
            ErrorCode::InvalidProposalState
        );

        // Verify voting period hasn't ended
        let voting_at = proposal.voting_at.ok_or(ErrorCode::VotingNotStarted)?;
        let voting_end = voting_at + ctx.accounts.governance.config.max_voting_time as i64;
        require!(
            clock.unix_timestamp <= voting_end,
            ErrorCode::VotingPeriodEnded
        );

        // Calculate vote weight
        let vote_weight = token_owner_record.governing_token_deposit_amount;

        // Record vote
        vote_record.proposal = proposal.key();
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.vote = vote.clone();
        vote_record.voter_weight = vote_weight;
        vote_record.voted_at = clock.unix_timestamp;

        // Update proposal vote counts
        match vote {
            Vote::Approve => {
                proposal.approve_vote_weight = proposal
                    .approve_vote_weight
                    .checked_add(vote_weight)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
            Vote::Deny => {
                proposal.deny_vote_weight = proposal
                    .deny_vote_weight
                    .checked_add(vote_weight)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
            Vote::Abstain => {}
            Vote::Veto => {
                proposal.veto_vote_weight = proposal
                    .veto_vote_weight
                    .checked_add(vote_weight)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
        }

        emit!(VoteCast {
            proposal: proposal.key(),
            voter: ctx.accounts.voter.key(),
            vote,
            weight: vote_weight,
        });

        Ok(())
    }

    pub fn finalize_vote(ctx: Context<FinalizeVote>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let governance = &ctx.accounts.governance;
        let clock = Clock::get()?;

        require!(
            proposal.state == ProposalState::Voting,
            ErrorCode::InvalidProposalState
        );

        // Check if voting period has ended
        let voting_at = proposal.voting_at.ok_or(ErrorCode::VotingNotStarted)?;
        let voting_end = voting_at + governance.config.max_voting_time as i64;
        require!(
            clock.unix_timestamp > voting_end,
            ErrorCode::VotingPeriodNotEnded
        );

        proposal.voting_completed_at = Some(clock.unix_timestamp);

        // Determine outcome
        let total_votes = proposal.approve_vote_weight + proposal.deny_vote_weight;
        let approval_quorum = governance.config.vote_threshold_percentage;

        let passed = if total_votes == 0 {
            false
        } else {
            let approval_percentage = (proposal.approve_vote_weight * 100) / total_votes;
            approval_percentage >= approval_quorum as u64
        };

        if passed {
            proposal.state = ProposalState::Succeeded;
        } else {
            proposal.state = ProposalState::Defeated;
        }

        emit!(VoteFinalized {
            proposal: proposal.key(),
            state: proposal.state.clone(),
            approve_votes: proposal.approve_vote_weight,
            deny_votes: proposal.deny_vote_weight,
        });

        Ok(())
    }

    pub fn execute_transaction(
        ctx: Context<ExecuteTransaction>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let governance = &ctx.accounts.governance;
        let clock = Clock::get()?;

        require!(
            proposal.state == ProposalState::Succeeded,
            ErrorCode::InvalidProposalState
        );

        // Check timelock has passed
        let voting_completed = proposal.voting_completed_at.ok_or(ErrorCode::VotingNotCompleted)?;
        let timelock_end = voting_completed + governance.config.min_instruction_hold_up_time as i64;
        require!(
            clock.unix_timestamp >= timelock_end,
            ErrorCode::TimelockNotExpired
        );

        proposal.state = ProposalState::Executing;
        proposal.executing_at = Some(clock.unix_timestamp);

        // Execute the proposal instructions via CPI
        // ... implementation depends on proposal type

        proposal.state = ProposalState::Completed;
        proposal.closed_at = Some(clock.unix_timestamp);

        emit!(ProposalExecuted {
            proposal: proposal.key(),
            executed_at: clock.unix_timestamp,
        });

        Ok(())
    }
}

// Account structures
#[account]
#[derive(InitSpace)]
pub struct Realm {
    pub authority: Pubkey,
    #[max_len(64)]
    pub name: String,
    pub community_mint: Pubkey,
    pub council_mint: Option<Pubkey>,
    pub config: RealmConfig,
    pub proposal_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Governance {
    pub realm: Pubkey,
    pub governed_account: Pubkey,
    pub config: GovernanceConfig,
    pub proposal_count: u32,
    pub active_proposal_count: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub governance: Pubkey,
    pub token_owner_record: Pubkey,
    #[max_len(128)]
    pub name: String,
    #[max_len(256)]
    pub description_link: String,
    pub vote_type: VoteType,
    pub state: ProposalState,
    pub draft_at: i64,
    pub signing_off_at: Option<i64>,
    pub voting_at: Option<i64>,
    pub voting_completed_at: Option<i64>,
    pub executing_at: Option<i64>,
    pub closed_at: Option<i64>,
    pub approve_vote_weight: u64,
    pub deny_vote_weight: u64,
    pub veto_vote_weight: u64,
    #[max_len(10)]
    pub options: Vec<ProposalOption>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TokenOwnerRecord {
    pub realm: Pubkey,
    pub governing_token_mint: Pubkey,
    pub governing_token_owner: Pubkey,
    pub governing_token_deposit_amount: u64,
    pub unrelinquished_votes_count: u32,
    pub total_votes_count: u32,
    pub governance_delegate: Option<Pubkey>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub vote: Vote,
    pub voter_weight: u64,
    pub voted_at: i64,
}

// Configuration structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct RealmConfig {
    pub use_council_mint: bool,
    pub min_community_weight_to_create_governance: u64,
    pub community_mint_max_vote_weight_source: MintMaxVoteWeightSource,
    pub council_mint: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct GovernanceConfig {
    pub vote_threshold_percentage: u8,
    pub min_community_weight_to_create_proposal: u64,
    pub min_tokens_to_create_proposal: u64,
    pub min_instruction_hold_up_time: u32,  // Timelock in seconds
    pub max_voting_time: u32,               // Voting period in seconds
    pub vote_tipping: VoteTipping,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum ProposalState {
    Draft,
    SigningOff,
    Voting,
    Succeeded,
    Defeated,
    Executing,
    Completed,
    Cancelled,
    Vetoed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum Vote {
    Approve,
    Deny,
    Abstain,
    Veto,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum VoteType {
    SingleChoice,
    MultiChoice { max_voter_options: u8, max_winning_options: u8 },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum VoteTipping {
    Strict,     // Full voting period required
    Early,      // Can end early if threshold reached
    Disabled,   // No tipping
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum MintMaxVoteWeightSource {
    SupplyFraction(u64),
    Absolute(u64),
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ProposalOption {
    #[max_len(64)]
    pub label: String,
    pub vote_weight: u64,
}

// Events
#[event]
pub struct RealmCreated {
    pub realm: Pubkey,
    pub name: String,
    pub authority: Pubkey,
}

#[event]
pub struct ProposalCreated {
    pub realm: Pubkey,
    pub governance: Pubkey,
    pub proposal: Pubkey,
    pub proposer: Pubkey,
    pub name: String,
}

#[event]
pub struct VoteCast {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub vote: Vote,
    pub weight: u64,
}

#[event]
pub struct VoteFinalized {
    pub proposal: Pubkey,
    pub state: ProposalState,
    pub approve_votes: u64,
    pub deny_votes: u64,
}

#[event]
pub struct ProposalExecuted {
    pub proposal: Pubkey,
    pub executed_at: i64,
}

#[event]
pub struct TokensDeposited {
    pub realm: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub total_deposited: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid proposal state")]
    InvalidProposalState,
    #[msg("Insufficient tokens to create proposal")]
    InsufficientTokensToCreateProposal,
    #[msg("Voting has not started")]
    VotingNotStarted,
    #[msg("Voting period has ended")]
    VotingPeriodEnded,
    #[msg("Voting period has not ended")]
    VotingPeriodNotEnded,
    #[msg("Voting not completed")]
    VotingNotCompleted,
    #[msg("Timelock not expired")]
    TimelockNotExpired,
}
```

### TypeScript Client for Realms

```typescript
// governance-client.ts
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

interface CreateProposalParams {
  realm: PublicKey;
  governance: PublicKey;
  name: string;
  descriptionLink: string;
  tokenOwnerRecord: PublicKey;
}

interface CastVoteParams {
  proposal: PublicKey;
  tokenOwnerRecord: PublicKey;
  vote: 'approve' | 'deny' | 'abstain' | 'veto';
}

export class GovernanceClient {
  private program: Program;
  private connection: Connection;

  constructor(program: Program, connection: Connection) {
    this.program = program;
    this.connection = connection;
  }

  async createRealm(
    name: string,
    communityMint: PublicKey,
    config: {
      minCommunityWeight: BN;
      useCouncil: boolean;
      councilMint?: PublicKey;
    }
  ): Promise<PublicKey> {
    const [realmPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('realm'), Buffer.from(name)],
      this.program.programId
    );

    await this.program.methods
      .createRealm(name, {
        useCouncilMint: config.useCouncil,
        minCommunityWeightToCreateGovernance: config.minCommunityWeight,
        communityMintMaxVoteWeightSource: { supplyFraction: [new BN(1)] },
        councilMint: config.councilMint || null,
      })
      .accounts({
        realm: realmPda,
        communityMint,
        authority: this.program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return realmPda;
  }

  async depositTokens(
    realm: PublicKey,
    mint: PublicKey,
    amount: BN
  ): Promise<string> {
    const [tokenOwnerRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('token_owner_record'),
        realm.toBuffer(),
        mint.toBuffer(),
        this.program.provider.publicKey!.toBuffer(),
      ],
      this.program.programId
    );

    const [governingTokenHolding] = PublicKey.findProgramAddressSync(
      [Buffer.from('governing_token_holding'), realm.toBuffer(), mint.toBuffer()],
      this.program.programId
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.program.provider.publicKey!
    );

    return this.program.methods
      .depositGoverningTokens(amount)
      .accounts({
        realm,
        tokenOwnerRecord: tokenOwnerRecordPda,
        governingTokenHolding,
        sourceTokenAccount: userTokenAccount,
        tokenOwner: this.program.provider.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async createProposal(params: CreateProposalParams): Promise<PublicKey> {
    const governance = await this.program.account.governance.fetch(params.governance);

    const [proposalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('proposal'),
        params.governance.toBuffer(),
        Buffer.from(governance.proposalCount.toString()),
      ],
      this.program.programId
    );

    await this.program.methods
      .createProposal(params.name, params.descriptionLink, { singleChoice: {} })
      .accounts({
        realm: params.realm,
        governance: params.governance,
        proposal: proposalPda,
        tokenOwnerRecord: params.tokenOwnerRecord,
        proposer: this.program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return proposalPda;
  }

  async castVote(params: CastVoteParams): Promise<string> {
    const proposal = await this.program.account.proposal.fetch(params.proposal);

    const [voteRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('vote_record'),
        params.proposal.toBuffer(),
        this.program.provider.publicKey!.toBuffer(),
      ],
      this.program.programId
    );

    const voteEnum = this.getVoteEnum(params.vote);

    return this.program.methods
      .castVote(voteEnum)
      .accounts({
        governance: proposal.governance,
        proposal: params.proposal,
        tokenOwnerRecord: params.tokenOwnerRecord,
        voteRecord: voteRecordPda,
        voter: this.program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async getProposal(address: PublicKey) {
    return this.program.account.proposal.fetch(address);
  }

  async getActiveProposals(governance: PublicKey) {
    const proposals = await this.program.account.proposal.all([
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: governance.toBase58(),
        },
      },
    ]);

    return proposals.filter(p =>
      p.account.state === 'voting' || p.account.state === 'succeeded'
    );
  }

  async getVotingPower(
    realm: PublicKey,
    mint: PublicKey,
    owner: PublicKey
  ): Promise<BN> {
    const [tokenOwnerRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('token_owner_record'),
        realm.toBuffer(),
        mint.toBuffer(),
        owner.toBuffer(),
      ],
      this.program.programId
    );

    try {
      const record = await this.program.account.tokenOwnerRecord.fetch(
        tokenOwnerRecordPda
      );
      return record.governingTokenDepositAmount;
    } catch {
      return new BN(0);
    }
  }

  private getVoteEnum(vote: string) {
    switch (vote) {
      case 'approve': return { approve: {} };
      case 'deny': return { deny: {} };
      case 'abstain': return { abstain: {} };
      case 'veto': return { veto: {} };
      default: throw new Error(`Invalid vote: ${vote}`);
    }
  }
}
```

---

## EVM Governance (OpenZeppelin Governor)

### Governor Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract DAOGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint48 _votingDelay,      // Blocks before voting starts
        uint32 _votingPeriod,     // Blocks voting lasts
        uint256 _proposalThreshold, // Tokens needed to create proposal
        uint256 _quorumNumerator   // Percentage of total supply for quorum
    )
        Governor("DAO Governor")
        GovernorSettings(_votingDelay, _votingPeriod, _proposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumNumerator)
        GovernorTimelockControl(_timelock)
    {}

    // Override required functions
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
```

### Governance Token with Delegation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    constructor()
        ERC20("Governance Token", "GOV")
        ERC20Permit("Governance Token")
    {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // Override required functions for ERC20Votes
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
```

### Treasury with Timelock

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract Treasury is TimelockController {
    constructor(
        uint256 minDelay,          // Minimum delay for execution (seconds)
        address[] memory proposers, // Who can propose
        address[] memory executors, // Who can execute
        address admin               // Admin (set to 0x0 for no admin)
    ) TimelockController(minDelay, proposers, executors, admin) {}

    // Treasury can receive ETH
    receive() external payable {}

    // Custom function for token transfers
    function transferToken(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(EXECUTOR_ROLE) {
        IERC20(token).transfer(to, amount);
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}
```

---

## Voting Mechanisms

### Quadratic Voting

```typescript
// voting/quadratic.ts
export class QuadraticVoting {
  /**
   * Calculate vote weight using quadratic formula
   * Cost = votes^2
   * So votes = sqrt(tokens_spent)
   */
  static calculateVoteWeight(tokensSpent: bigint): bigint {
    // Square root of tokens spent
    return sqrt(tokensSpent);
  }

  /**
   * Calculate cost to cast a certain number of votes
   */
  static calculateCost(votes: bigint): bigint {
    return votes * votes;
  }

  /**
   * Optimal vote distribution across proposals
   */
  static optimizeVotes(
    totalTokens: bigint,
    proposalPriorities: number[] // Higher = more important
  ): bigint[] {
    const totalPriority = proposalPriorities.reduce((a, b) => a + b, 0);

    return proposalPriorities.map(priority => {
      const allocation = (Number(totalTokens) * priority) / totalPriority;
      return this.calculateVoteWeight(BigInt(Math.floor(allocation)));
    });
  }
}

function sqrt(value: bigint): bigint {
  if (value < 0n) throw new Error('Square root of negative number');
  if (value < 2n) return value;

  let x = value;
  let y = (x + 1n) / 2n;

  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }

  return x;
}
```

### Conviction Voting

```rust
// conviction-voting.rs
use anchor_lang::prelude::*;

/// Conviction voting: Vote weight increases over time as tokens remain staked
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum Conviction {
    None,       // 0.1x, no lockup
    Locked1x,   // 1x, 1 week lockup
    Locked2x,   // 2x, 2 week lockup
    Locked3x,   // 3x, 4 week lockup
    Locked4x,   // 4x, 8 week lockup
    Locked5x,   // 5x, 16 week lockup
    Locked6x,   // 6x, 32 week lockup
}

impl Conviction {
    pub fn multiplier(&self) -> u64 {
        match self {
            Conviction::None => 1,      // 0.1x (divided by 10 later)
            Conviction::Locked1x => 10,
            Conviction::Locked2x => 20,
            Conviction::Locked3x => 30,
            Conviction::Locked4x => 40,
            Conviction::Locked5x => 50,
            Conviction::Locked6x => 60,
        }
    }

    pub fn lock_periods(&self) -> u64 {
        match self {
            Conviction::None => 0,
            Conviction::Locked1x => 1,
            Conviction::Locked2x => 2,
            Conviction::Locked3x => 4,
            Conviction::Locked4x => 8,
            Conviction::Locked5x => 16,
            Conviction::Locked6x => 32,
        }
    }
}

#[account]
pub struct ConvictionVote {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub amount: u64,
    pub conviction: Conviction,
    pub vote_time: i64,
    pub unlocks_at: i64,
}

impl ConvictionVote {
    pub const LOCK_PERIOD: i64 = 604800; // 1 week in seconds

    pub fn calculate_vote_weight(&self) -> u64 {
        // Weight = amount * conviction_multiplier / 10
        self.amount
            .checked_mul(self.conviction.multiplier())
            .unwrap_or(0)
            .checked_div(10)
            .unwrap_or(0)
    }

    pub fn calculate_unlock_time(&self) -> i64 {
        self.vote_time + (Self::LOCK_PERIOD * self.conviction.lock_periods() as i64)
    }

    pub fn can_unlock(&self, current_time: i64) -> bool {
        current_time >= self.unlocks_at
    }
}

pub fn cast_conviction_vote(
    ctx: Context<CastConvictionVote>,
    amount: u64,
    conviction: Conviction,
) -> Result<()> {
    let clock = Clock::get()?;
    let vote = &mut ctx.accounts.conviction_vote;

    vote.voter = ctx.accounts.voter.key();
    vote.proposal = ctx.accounts.proposal.key();
    vote.amount = amount;
    vote.conviction = conviction;
    vote.vote_time = clock.unix_timestamp;
    vote.unlocks_at = vote.calculate_unlock_time();

    let weight = vote.calculate_vote_weight();

    // Update proposal vote count
    let proposal = &mut ctx.accounts.proposal;
    proposal.conviction_votes = proposal.conviction_votes
        .checked_add(weight)
        .ok_or(ErrorCode::MathOverflow)?;

    msg!("Conviction vote cast: {} tokens at {:?} = {} weight",
         amount, conviction, weight);

    Ok(())
}
```

---

## Delegation System

```typescript
// delegation/delegate-manager.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

interface DelegationInfo {
  delegator: PublicKey;
  delegate: PublicKey;
  amount: BN;
  delegatedAt: Date;
}

interface DelegateProfile {
  address: PublicKey;
  totalDelegated: BN;
  delegatorCount: number;
  votingHistory: VotingRecord[];
  participationRate: number;
}

interface VotingRecord {
  proposalId: string;
  vote: string;
  timestamp: Date;
}

export class DelegationManager {
  private delegations: Map<string, DelegationInfo[]> = new Map();

  async delegateVotes(
    delegator: PublicKey,
    delegate: PublicKey,
    amount: BN
  ): Promise<void> {
    const key = delegator.toBase58();
    const existing = this.delegations.get(key) || [];

    // Check if already delegating to this delegate
    const existingDelegation = existing.find(
      d => d.delegate.equals(delegate)
    );

    if (existingDelegation) {
      existingDelegation.amount = existingDelegation.amount.add(amount);
    } else {
      existing.push({
        delegator,
        delegate,
        amount,
        delegatedAt: new Date(),
      });
    }

    this.delegations.set(key, existing);
  }

  async undelegateVotes(
    delegator: PublicKey,
    delegate: PublicKey,
    amount?: BN
  ): Promise<void> {
    const key = delegator.toBase58();
    const delegations = this.delegations.get(key) || [];

    const delegationIndex = delegations.findIndex(
      d => d.delegate.equals(delegate)
    );

    if (delegationIndex === -1) {
      throw new Error('No delegation found');
    }

    if (amount) {
      delegations[delegationIndex].amount = delegations[delegationIndex].amount.sub(amount);

      if (delegations[delegationIndex].amount.lte(new BN(0))) {
        delegations.splice(delegationIndex, 1);
      }
    } else {
      delegations.splice(delegationIndex, 1);
    }

    this.delegations.set(key, delegations);
  }

  async getDelegateProfile(delegate: PublicKey): Promise<DelegateProfile> {
    let totalDelegated = new BN(0);
    let delegatorCount = 0;

    for (const delegations of this.delegations.values()) {
      for (const delegation of delegations) {
        if (delegation.delegate.equals(delegate)) {
          totalDelegated = totalDelegated.add(delegation.amount);
          delegatorCount++;
        }
      }
    }

    return {
      address: delegate,
      totalDelegated,
      delegatorCount,
      votingHistory: [], // Would fetch from governance program
      participationRate: 0, // Calculate from voting history
    };
  }

  async getVotingPower(
    address: PublicKey,
    ownTokens: BN
  ): Promise<{
    own: BN;
    delegated: BN;
    total: BN;
  }> {
    let delegated = new BN(0);

    for (const delegations of this.delegations.values()) {
      for (const delegation of delegations) {
        if (delegation.delegate.equals(address)) {
          delegated = delegated.add(delegation.amount);
        }
      }
    }

    return {
      own: ownTokens,
      delegated,
      total: ownTokens.add(delegated),
    };
  }

  async getDelegations(delegator: PublicKey): Promise<DelegationInfo[]> {
    return this.delegations.get(delegator.toBase58()) || [];
  }
}
```

---

## Treasury Management

```typescript
// treasury/treasury-manager.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

interface TreasuryBalance {
  token: PublicKey;
  symbol: string;
  balance: BN;
  usdValue: number;
}

interface SpendingRequest {
  id: string;
  recipient: PublicKey;
  token: PublicKey;
  amount: BN;
  description: string;
  proposalId: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
}

export class TreasuryManager {
  private treasury: PublicKey;
  private governanceProgram: PublicKey;

  constructor(treasury: PublicKey, governanceProgram: PublicKey) {
    this.treasury = treasury;
    this.governanceProgram = governanceProgram;
  }

  async getBalances(connection: Connection): Promise<TreasuryBalance[]> {
    const balances: TreasuryBalance[] = [];

    // Get SOL balance
    const solBalance = await connection.getBalance(this.treasury);
    balances.push({
      token: PublicKey.default, // Native SOL
      symbol: 'SOL',
      balance: new BN(solBalance),
      usdValue: 0, // Would fetch from oracle
    });

    // Get token accounts owned by treasury
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      this.treasury,
      { programId: TOKEN_PROGRAM_ID }
    );

    for (const { account } of tokenAccounts.value) {
      const parsed = account.data.parsed.info;
      balances.push({
        token: new PublicKey(parsed.mint),
        symbol: '', // Would lookup from token registry
        balance: new BN(parsed.tokenAmount.amount),
        usdValue: 0,
      });
    }

    return balances;
  }

  async createSpendingProposal(
    request: Omit<SpendingRequest, 'id' | 'status' | 'proposalId'>
  ): Promise<string> {
    // Create proposal through governance program
    // This would create a proposal with instructions to transfer tokens

    const proposalId = `SPEND-${Date.now()}`;

    console.log('Creating spending proposal:', {
      ...request,
      proposalId,
    });

    return proposalId;
  }

  async executeApprovedSpending(
    proposalId: string,
    request: SpendingRequest
  ): Promise<string> {
    // Execute the transfer after proposal passes and timelock expires

    if (request.status !== 'approved') {
      throw new Error('Spending request not approved');
    }

    // Build and execute transaction
    // ... implementation

    return 'transaction_signature';
  }

  async getSpendingHistory(): Promise<SpendingRequest[]> {
    // Fetch historical spending from governance events
    return [];
  }

  async getMonthlySpending(): Promise<{
    month: string;
    total: BN;
    breakdown: { category: string; amount: BN }[];
  }> {
    // Aggregate spending by month
    return {
      month: new Date().toISOString().slice(0, 7),
      total: new BN(0),
      breakdown: [],
    };
  }
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
```

---

## Testing Governance

```typescript
// tests/governance.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { BN } from '@coral-xyz/anchor';

describe('Governance', () => {
  let governanceClient: GovernanceClient;
  let realm: PublicKey;
  let governance: PublicKey;

  beforeAll(async () => {
    // Setup governance infrastructure
  });

  describe('Proposals', () => {
    it('should create proposal with sufficient tokens', async () => {
      const proposal = await governanceClient.createProposal({
        realm,
        governance,
        name: 'Test Proposal',
        descriptionLink: 'https://forum.dao.xyz/proposal/1',
        tokenOwnerRecord,
      });

      expect(proposal).toBeDefined();

      const proposalData = await governanceClient.getProposal(proposal);
      expect(proposalData.name).toBe('Test Proposal');
      expect(proposalData.state).toBe('draft');
    });

    it('should reject proposal without sufficient tokens', async () => {
      // User with insufficient tokens
      await expect(
        governanceClient.createProposal({
          realm,
          governance,
          name: 'Unauthorized Proposal',
          descriptionLink: 'https://...',
          tokenOwnerRecord: insufficientTokenRecord,
        })
      ).rejects.toThrow(/InsufficientTokensToCreateProposal/);
    });
  });

  describe('Voting', () => {
    let proposal: PublicKey;

    beforeAll(async () => {
      // Create and advance proposal to voting state
    });

    it('should cast approve vote', async () => {
      const tx = await governanceClient.castVote({
        proposal,
        tokenOwnerRecord,
        vote: 'approve',
      });

      expect(tx).toBeDefined();

      const proposalData = await governanceClient.getProposal(proposal);
      expect(proposalData.approveVoteWeight.gt(new BN(0))).toBe(true);
    });

    it('should calculate voting power correctly', async () => {
      const power = await governanceClient.getVotingPower(
        realm,
        communityMint,
        user.publicKey
      );

      expect(power.eq(new BN(1000))).toBe(true);
    });
  });

  describe('Delegation', () => {
    it('should delegate votes', async () => {
      const delegationManager = new DelegationManager();

      await delegationManager.delegateVotes(
        delegator,
        delegate,
        new BN(500)
      );

      const profile = await delegationManager.getDelegateProfile(delegate);
      expect(profile.totalDelegated.eq(new BN(500))).toBe(true);
    });

    it('should calculate combined voting power', async () => {
      const delegationManager = new DelegationManager();

      const power = await delegationManager.getVotingPower(
        delegate,
        new BN(1000) // Own tokens
      );

      expect(power.total.eq(new BN(1500))).toBe(true); // 1000 own + 500 delegated
    });
  });

  describe('Quadratic Voting', () => {
    it('should calculate quadratic vote weight', () => {
      // 100 tokens = 10 votes (sqrt(100))
      const weight = QuadraticVoting.calculateVoteWeight(BigInt(100));
      expect(weight).toBe(10n);

      // 10000 tokens = 100 votes
      const weight2 = QuadraticVoting.calculateVoteWeight(BigInt(10000));
      expect(weight2).toBe(100n);
    });

    it('should calculate vote cost', () => {
      // 10 votes costs 100 tokens
      const cost = QuadraticVoting.calculateCost(10n);
      expect(cost).toBe(100n);
    });
  });
});
```

---

## Related Skills

- **tokenomics-designer** - Governance token economics
- **smart-contract-auditor** - Governance security auditing
- **staking-expert** - Token staking for voting power

---

## Further Reading

- [SPL Governance](https://github.com/solana-labs/solana-program-library/tree/master/governance)
- [Realms Documentation](https://docs.realms.today/)
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/4.x/governance)
- [Compound Governance](https://compound.finance/docs/governance)
- [Conviction Voting](https://blog.aragon.org/introducing-conviction-voting-2/)
