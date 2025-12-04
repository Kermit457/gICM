# NFT Marketplace Expert - Marketplace Architecture & Trading

> **ID:** `nft-marketplace-expert`
> **Tier:** 2 (Domain Expertise)
> **Token Cost:** 7500
> **MCP Connections:** helius
> **Version:** 1.0

## 🎯 What This Skill Does

Master NFT marketplace implementation with listing, bidding, auctions, and royalty enforcement. This skill covers marketplace architecture, escrow patterns, price discovery, and integration with major NFT standards (Metaplex, Token-2022).

**Core Capabilities:**
- Marketplace smart contracts
- Listing and delisting mechanisms
- Bidding and offer systems
- Dutch and English auctions
- Royalty enforcement
- Escrow management
- Collection management
- Trait-based filtering and pricing

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** nft marketplace, collection, listing, auction, bid, offer, royalty
- **File Types:** .ts, .tsx, .rs
- **Directories:** programs/, marketplace/

**Use this skill when:**
- Building NFT marketplaces
- Implementing auction systems
- Managing collections
- Enforcing royalties
- Creating escrow contracts
- Building bidding systems

## 🚀 Core Capabilities

### 1. Marketplace Program (Anchor)

```rust
// programs/marketplace/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, CloseAccount};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("Market111111111111111111111111111111111111");

#[program]
pub mod nft_marketplace {
    use super::*;

    /// Initialize marketplace
    pub fn initialize_marketplace(
        ctx: Context<InitializeMarketplace>,
        fee: u16, // Platform fee in basis points (e.g., 250 = 2.5%)
    ) -> Result<()> {
        let marketplace = &mut ctx.accounts.marketplace;

        marketplace.authority = ctx.accounts.authority.key();
        marketplace.treasury = ctx.accounts.treasury.key();
        marketplace.fee = fee;
        marketplace.total_listings = 0;
        marketplace.total_sales = 0;
        marketplace.total_volume = 0;
        marketplace.bump = *ctx.bumps.get("marketplace").unwrap();

        msg!("Marketplace initialized with {}% fee", fee as f64 / 100.0);

        Ok(())
    }

    /// List an NFT for sale
    pub fn list_nft(
        ctx: Context<ListNFT>,
        price: u64,
    ) -> Result<()> {
        require!(price > 0, MarketplaceError::InvalidPrice);

        let listing = &mut ctx.accounts.listing;
        let marketplace = &mut ctx.accounts.marketplace;
        let clock = Clock::get()?;

        // Transfer NFT to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.seller_nft_account.to_account_info(),
                to: ctx.accounts.escrow_nft_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, 1)?;

        // Create listing
        listing.marketplace = marketplace.key();
        listing.seller = ctx.accounts.seller.key();
        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        listing.listed_at = clock.unix_timestamp;
        listing.is_active = true;
        listing.bump = *ctx.bumps.get("listing").unwrap();

        marketplace.total_listings += 1;

        msg!("NFT listed for {} lamports", price);

        Ok(())
    }

    /// Delist an NFT
    pub fn delist_nft(ctx: Context<DelistNFT>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let marketplace = &ctx.accounts.marketplace;

        require!(listing.is_active, MarketplaceError::ListingNotActive);

        // Transfer NFT back to seller
        let seeds = &[
            b"listing",
            marketplace.key().as_ref(),
            listing.nft_mint.as_ref(),
            &[listing.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_nft_account.to_account_info(),
                to: ctx.accounts.seller_nft_account.to_account_info(),
                authority: listing.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, 1)?;

        // Close escrow account
        let close_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_nft_account.to_account_info(),
                destination: ctx.accounts.seller.to_account_info(),
                authority: listing.to_account_info(),
            },
            signer,
        );
        token::close_account(close_ctx)?;

        listing.is_active = false;

        msg!("NFT delisted");

        Ok(())
    }

    /// Buy an NFT
    pub fn buy_nft(ctx: Context<BuyNFT>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let marketplace = &mut ctx.accounts.marketplace;

        require!(listing.is_active, MarketplaceError::ListingNotActive);

        let price = listing.price;

        // Calculate fees
        let platform_fee = (price as u128 * marketplace.fee as u128 / 10000) as u64;
        let royalty_fee = calculate_royalty(
            &ctx.accounts.nft_metadata,
            price,
        )?;
        let seller_proceeds = price - platform_fee - royalty_fee;

        // Transfer SOL to seller
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? -= seller_proceeds;
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += seller_proceeds;

        // Transfer platform fee
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **marketplace.treasury.to_account_info().try_borrow_mut_lamports()? += platform_fee;

        // Transfer royalty fee if applicable
        if royalty_fee > 0 {
            **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? -= royalty_fee;
            **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += royalty_fee;
        }

        // Transfer NFT to buyer
        let seeds = &[
            b"listing",
            marketplace.key().as_ref(),
            listing.nft_mint.as_ref(),
            &[listing.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_nft_account.to_account_info(),
                to: ctx.accounts.buyer_nft_account.to_account_info(),
                authority: listing.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, 1)?;

        // Update marketplace stats
        marketplace.total_sales += 1;
        marketplace.total_volume += price;

        // Mark listing as inactive
        listing.is_active = false;

        msg!("NFT sold for {} lamports", price);
        msg!("Platform fee: {}, Royalty: {}, Seller: {}",
             platform_fee, royalty_fee, seller_proceeds);

        Ok(())
    }

    /// Make an offer on an NFT
    pub fn make_offer(
        ctx: Context<MakeOffer>,
        amount: u64,
        expiry: i64,
    ) -> Result<()> {
        require!(amount > 0, MarketplaceError::InvalidAmount);

        let offer = &mut ctx.accounts.offer;
        let clock = Clock::get()?;

        require!(expiry > clock.unix_timestamp, MarketplaceError::InvalidExpiry);

        // Lock buyer's funds in escrow
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? += amount;

        offer.marketplace = ctx.accounts.marketplace.key();
        offer.buyer = ctx.accounts.buyer.key();
        offer.nft_mint = ctx.accounts.nft_mint.key();
        offer.amount = amount;
        offer.expiry = expiry;
        offer.is_active = true;
        offer.bump = *ctx.bumps.get("offer").unwrap();

        msg!("Offer made: {} lamports, expires at {}", amount, expiry);

        Ok(())
    }

    /// Accept an offer
    pub fn accept_offer(ctx: Context<AcceptOffer>) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        let marketplace = &ctx.accounts.marketplace;
        let clock = Clock::get()?;

        require!(offer.is_active, MarketplaceError::OfferNotActive);
        require!(clock.unix_timestamp < offer.expiry, MarketplaceError::OfferExpired);

        let amount = offer.amount;

        // Calculate fees
        let platform_fee = (amount as u128 * marketplace.fee as u128 / 10000) as u64;
        let royalty_fee = calculate_royalty(&ctx.accounts.nft_metadata, amount)?;
        let seller_proceeds = amount - platform_fee - royalty_fee;

        // Transfer funds from escrow
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= amount;

        // Pay seller
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += seller_proceeds;

        // Pay platform fee
        **marketplace.treasury.to_account_info().try_borrow_mut_lamports()? += platform_fee;

        // Pay royalty
        if royalty_fee > 0 {
            **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += royalty_fee;
        }

        // Transfer NFT to buyer
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.seller_nft_account.to_account_info(),
                to: ctx.accounts.buyer_nft_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, 1)?;

        offer.is_active = false;

        msg!("Offer accepted for {} lamports", amount);

        Ok(())
    }

    /// Cancel an offer
    pub fn cancel_offer(ctx: Context<CancelOffer>) -> Result<()> {
        let offer = &mut ctx.accounts.offer;

        require!(offer.is_active, MarketplaceError::OfferNotActive);

        // Refund buyer
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= offer.amount;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += offer.amount;

        offer.is_active = false;

        msg!("Offer cancelled, refunded {} lamports", offer.amount);

        Ok(())
    }

    /// Create an auction
    pub fn create_auction(
        ctx: Context<CreateAuction>,
        start_price: u64,
        reserve_price: u64,
        duration: i64,
        auction_type: AuctionType,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let marketplace = &ctx.accounts.marketplace;
        let clock = Clock::get()?;

        require!(start_price > 0, MarketplaceError::InvalidPrice);
        require!(duration > 0, MarketplaceError::InvalidDuration);

        // Transfer NFT to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.seller_nft_account.to_account_info(),
                to: ctx.accounts.escrow_nft_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, 1)?;

        auction.marketplace = marketplace.key();
        auction.seller = ctx.accounts.seller.key();
        auction.nft_mint = ctx.accounts.nft_mint.key();
        auction.start_price = start_price;
        auction.reserve_price = reserve_price;
        auction.current_bid = 0;
        auction.highest_bidder = Pubkey::default();
        auction.start_time = clock.unix_timestamp;
        auction.end_time = clock.unix_timestamp + duration;
        auction.auction_type = auction_type;
        auction.is_active = true;
        auction.bump = *ctx.bumps.get("auction").unwrap();

        msg!("Auction created: {:?}, starting at {} lamports",
             auction_type, start_price);

        Ok(())
    }

    /// Place a bid
    pub fn place_bid(
        ctx: Context<PlaceBid>,
        amount: u64,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let clock = Clock::get()?;

        require!(auction.is_active, MarketplaceError::AuctionNotActive);
        require!(clock.unix_timestamp < auction.end_time, MarketplaceError::AuctionEnded);

        match auction.auction_type {
            AuctionType::English => {
                // English auction: bids must increase
                require!(
                    amount > auction.current_bid,
                    MarketplaceError::BidTooLow
                );

                // Refund previous bidder if any
                if auction.current_bid > 0 {
                    **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= auction.current_bid;
                    **auction.highest_bidder.to_account_info().try_borrow_mut_lamports()? += auction.current_bid;
                }

                // Lock new bid
                **ctx.accounts.bidder.to_account_info().try_borrow_mut_lamports()? -= amount;
                **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? += amount;

                auction.current_bid = amount;
                auction.highest_bidder = ctx.accounts.bidder.key();
            }
            AuctionType::Dutch => {
                // Dutch auction: price decreases over time
                let current_price = calculate_dutch_price(
                    auction.start_price,
                    auction.reserve_price,
                    auction.start_time,
                    auction.end_time,
                    clock.unix_timestamp,
                );

                require!(amount >= current_price, MarketplaceError::BidTooLow);

                // Accept first bid
                auction.current_bid = amount;
                auction.highest_bidder = ctx.accounts.bidder.key();
                auction.is_active = false; // End auction
            }
        }

        msg!("Bid placed: {} lamports", amount);

        Ok(())
    }

    /// Finalize auction
    pub fn finalize_auction(ctx: Context<FinalizeAuction>) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let marketplace = &ctx.accounts.marketplace;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp >= auction.end_time,
            MarketplaceError::AuctionNotEnded
        );

        if auction.current_bid < auction.reserve_price {
            // Reserve not met, return NFT
            let seeds = &[
                b"auction",
                marketplace.key().as_ref(),
                auction.nft_mint.as_ref(),
                &[auction.bump],
            ];
            let signer = &[&seeds[..]];

            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_nft_account.to_account_info(),
                    to: ctx.accounts.seller_nft_account.to_account_info(),
                    authority: auction.to_account_info(),
                },
                signer,
            );
            token::transfer(transfer_ctx, 1)?;

            // Refund highest bidder
            if auction.current_bid > 0 {
                **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= auction.current_bid;
                **auction.highest_bidder.to_account_info().try_borrow_mut_lamports()? += auction.current_bid;
            }

            msg!("Auction ended: reserve not met");
        } else {
            // Process sale
            let amount = auction.current_bid;
            let platform_fee = (amount as u128 * marketplace.fee as u128 / 10000) as u64;
            let royalty_fee = calculate_royalty(&ctx.accounts.nft_metadata, amount)?;
            let seller_proceeds = amount - platform_fee - royalty_fee;

            // Distribute funds
            **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += seller_proceeds;
            **marketplace.treasury.to_account_info().try_borrow_mut_lamports()? += platform_fee;

            if royalty_fee > 0 {
                **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += royalty_fee;
            }

            // Transfer NFT
            let seeds = &[
                b"auction",
                marketplace.key().as_ref(),
                auction.nft_mint.as_ref(),
                &[auction.bump],
            ];
            let signer = &[&seeds[..]];

            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_nft_account.to_account_info(),
                    to: ctx.accounts.winner_nft_account.to_account_info(),
                    authority: auction.to_account_info(),
                },
                signer,
            );
            token::transfer(transfer_ctx, 1)?;

            msg!("Auction finalized: sold for {} lamports", amount);
        }

        auction.is_active = false;

        Ok(())
    }
}

// Helper functions
fn calculate_royalty(
    metadata: &UncheckedAccount,
    price: u64,
) -> Result<u64> {
    // Parse Metaplex metadata and calculate royalty
    // Default 5% if not specified
    let royalty_percentage = 500; // 5% in basis points
    Ok((price as u128 * royalty_percentage / 10000) as u64)
}

fn calculate_dutch_price(
    start_price: u64,
    reserve_price: u64,
    start_time: i64,
    end_time: i64,
    current_time: i64,
) -> u64 {
    if current_time >= end_time {
        return reserve_price;
    }

    let elapsed = current_time - start_time;
    let duration = end_time - start_time;
    let price_drop = start_price - reserve_price;

    let current_drop = (price_drop as i64 * elapsed) / duration;
    start_price - current_drop as u64
}

// Account structs
#[account]
pub struct Marketplace {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub fee: u16,
    pub total_listings: u64,
    pub total_sales: u64,
    pub total_volume: u64,
    pub bump: u8,
}

#[account]
pub struct Listing {
    pub marketplace: Pubkey,
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub listed_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct Offer {
    pub marketplace: Pubkey,
    pub buyer: Pubkey,
    pub nft_mint: Pubkey,
    pub amount: u64,
    pub expiry: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AuctionType {
    English, // Price increases with bids
    Dutch,   // Price decreases over time
}

#[account]
pub struct Auction {
    pub marketplace: Pubkey,
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub start_price: u64,
    pub reserve_price: u64,
    pub current_bid: u64,
    pub highest_bidder: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub auction_type: AuctionType,
    pub is_active: bool,
    pub bump: u8,
}

// Context structs (abbreviated for brevity)
#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 2 + 8 + 8 + 8 + 1,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    /// CHECK: Treasury address
    pub treasury: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListNFT<'info> {
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 1,
        seeds = [b"listing", marketplace.key().as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
    #[account(mut)]
    pub seller_nft_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = seller,
        associated_token::mint = nft_mint,
        associated_token::authority = listing,
    )]
    pub escrow_nft_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyNFT<'info> {
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub escrow_nft_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_nft_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: SystemAccount<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Creator for royalties
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,
    /// CHECK: NFT metadata
    pub nft_metadata: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

// Additional context structs omitted for brevity

#[error_code]
pub enum MarketplaceError {
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid duration")]
    InvalidDuration,
    #[msg("Invalid expiry")]
    InvalidExpiry,
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Offer is not active")]
    OfferNotActive,
    #[msg("Offer has expired")]
    OfferExpired,
    #[msg("Auction is not active")]
    AuctionNotActive,
    #[msg("Auction has ended")]
    AuctionEnded,
    #[msg("Auction has not ended")]
    AuctionNotEnded,
    #[msg("Bid is too low")]
    BidTooLow,
}
```

### 2. Marketplace Client (TypeScript)

```typescript
// packages/marketplace/src/client.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

export class MarketplaceClient {
  private connection: Connection;
  private program: Program;

  constructor(connection: Connection, program: Program) {
    this.connection = connection;
    this.program = program;
  }

  /**
   * Get all active listings
   */
  async getListings(): Promise<any[]> {
    const listings = await this.program.account.listing.all([
      {
        memcmp: {
          offset: 8 + 32 + 32 + 32 + 8 + 8, // offset to is_active field
          bytes: '01', // true
        },
      },
    ]);

    return listings;
  }

  /**
   * Get listings by collection
   */
  async getListingsByCollection(collection: PublicKey): Promise<any[]> {
    // Fetch all listings and filter by collection
    const allListings = await this.getListings();

    // Filter by verified collection
    return allListings.filter(listing => {
      // Check if NFT belongs to collection
      return true; // Implement collection check
    });
  }

  /**
   * Get floor price for a collection
   */
  async getFloorPrice(collection: PublicKey): Promise<bigint> {
    const listings = await this.getListingsByCollection(collection);

    if (listings.length === 0) return BigInt(0);

    const prices = listings.map(l => BigInt(l.account.price));
    return prices.reduce((min, price) => (price < min ? price : min));
  }

  /**
   * Calculate market stats
   */
  async getMarketStats(): Promise<{
    totalListings: number;
    totalSales: number;
    totalVolume: bigint;
    avgPrice: bigint;
  }> {
    const marketplace = await this.program.account.marketplace.fetch(
      await this.getMarketplaceAddress()
    );

    const avgPrice = marketplace.totalSales > 0
      ? BigInt(marketplace.totalVolume) / BigInt(marketplace.totalSales)
      : BigInt(0);

    return {
      totalListings: marketplace.totalListings,
      totalSales: marketplace.totalSales,
      totalVolume: BigInt(marketplace.totalVolume),
      avgPrice,
    };
  }

  private async getMarketplaceAddress(): Promise<PublicKey> {
    const [address] = await PublicKey.findProgramAddress(
      [Buffer.from('marketplace')],
      this.program.programId
    );
    return address;
  }
}
```

### 3. Trait-Based Pricing

```typescript
// packages/marketplace/src/traits.ts
export interface Trait {
  trait_type: string;
  value: string;
  rarity?: number; // 0-100
}

export class TraitPricing {
  /**
   * Calculate price based on traits
   */
  calculateTraitValue(params: {
    traits: Trait[];
    floorPrice: bigint;
    rarityMultipliers: Map<string, number>;
  }): bigint {
    const { traits, floorPrice, rarityMultipliers } = params;

    let multiplier = 1.0;

    for (const trait of traits) {
      const key = `${trait.trait_type}:${trait.value}`;
      const traitMultiplier = rarityMultipliers.get(key) || 1.0;

      multiplier *= traitMultiplier;
    }

    return BigInt(Math.floor(Number(floorPrice) * multiplier));
  }

  /**
   * Calculate trait rarity
   */
  calculateRarity(params: {
    trait: Trait;
    totalSupply: number;
    traitCount: number;
  }): number {
    const { trait, totalSupply, traitCount } = params;

    if (totalSupply === 0) return 0;

    // Rarity = (1 - (trait_count / total_supply)) * 100
    const rarity = (1 - traitCount / totalSupply) * 100;

    return Math.min(Math.max(rarity, 0), 100);
  }

  /**
   * Calculate rarity score for NFT
   */
  calculateRarityScore(traits: Trait[]): number {
    if (traits.length === 0) return 0;

    const avgRarity =
      traits.reduce((sum, trait) => sum + (trait.rarity || 0), 0) /
      traits.length;

    return avgRarity;
  }
}
```

### 4. Collection Manager

```typescript
// packages/marketplace/src/collection.ts
export interface Collection {
  address: PublicKey;
  name: string;
  symbol: string;
  totalSupply: number;
  verified: boolean;
  floorPrice: bigint;
  volume24h: bigint;
  listings: number;
}

export class CollectionManager {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Verify collection
   */
  async verifyCollection(params: {
    collection: PublicKey;
    nftMint: PublicKey;
  }): Promise<boolean> {
    const { collection, nftMint } = params;

    // Fetch NFT metadata
    const metadata = await this.getMetadata(nftMint);

    // Check if collection matches
    if (!metadata.collection) return false;

    return metadata.collection.key.equals(collection) &&
           metadata.collection.verified;
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(collection: PublicKey): Promise<{
    floorPrice: bigint;
    volume24h: bigint;
    sales24h: number;
    avgPrice: bigint;
    owners: number;
  }> {
    // Implementation would query marketplace data
    return {
      floorPrice: BigInt(1000000),
      volume24h: BigInt(10000000),
      sales24h: 10,
      avgPrice: BigInt(1000000),
      owners: 500,
    };
  }

  private async getMetadata(mint: PublicKey): Promise<any> {
    // Fetch Metaplex metadata
    return null;
  }
}
```

## 🧪 Testing

```typescript
// tests/marketplace.test.ts
import { describe, test, expect } from 'vitest';
import { TraitPricing } from '../src/traits';

describe('NFT Marketplace', () => {
  test('should calculate trait-based price', () => {
    const pricing = new TraitPricing();

    const traits = [
      { trait_type: 'Background', value: 'Gold', rarity: 95 },
      { trait_type: 'Eyes', value: 'Laser', rarity: 80 },
    ];

    const multipliers = new Map([
      ['Background:Gold', 2.0],
      ['Eyes:Laser', 1.5],
    ]);

    const price = pricing.calculateTraitValue({
      traits,
      floorPrice: BigInt(1000000),
      rarityMultipliers: multipliers,
    });

    // Floor * 2.0 * 1.5 = 3x floor
    expect(price).toBe(BigInt(3000000));
  });

  test('should calculate rarity score', () => {
    const pricing = new TraitPricing();

    const traits = [
      { trait_type: 'Background', value: 'Gold', rarity: 95 },
      { trait_type: 'Eyes', value: 'Normal', rarity: 10 },
    ];

    const score = pricing.calculateRarityScore(traits);

    expect(score).toBe(52.5); // (95 + 10) / 2
  });
});
```

## 📦 Production Patterns

```typescript
// components/MarketplaceUI.tsx
export function MarketplaceUI() {
  return (
    <div className="marketplace">
      <div className="filters">
        <select>
          <option>All Collections</option>
        </select>
        <input type="range" placeholder="Price range" />
        <div className="traits">
          {/* Trait filters */}
        </div>
      </div>

      <div className="listings">
        {/* NFT cards */}
      </div>

      <div className="stats">
        <div>Floor: 1.5 SOL</div>
        <div>Volume: 150 SOL</div>
        <div>Sales: 42</div>
      </div>
    </div>
  );
}
```

## 🎯 Best Practices

1. **Implement proper escrow for all trades**
2. **Enforce royalties on-chain**
3. **Validate NFT ownership before operations**
4. **Use secure price discovery mechanisms**
5. **Implement bid increments for auctions**
6. **Add expiry times for offers**
7. **Verify collection authenticity**
8. **Handle edge cases (0 bids, etc.)**
9. **Implement proper refund logic**
10. **Test all auction types thoroughly**

## 🔗 Related Skills

- **solana-anchor-expert** - Program development
- **tokenomics-designer** - Royalty structures
- **governance-expert** - DAO-owned marketplaces

## 📚 Resources

- [Metaplex Documentation](https://docs.metaplex.com/)
- [Magic Eden](https://magiceden.io/)
- [Tensor Trade](https://www.tensor.trade/)
- [OpenSea](https://opensea.io/)
