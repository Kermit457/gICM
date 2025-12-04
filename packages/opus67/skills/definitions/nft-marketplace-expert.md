# NFT Marketplace Expert

NFT marketplace integration specialist for building trading platforms on Solana. Covers Metaplex, Magic Eden, Tensor, listing/buying flows, royalty enforcement, and collection management.

---

## Metadata

- **ID**: nft-marketplace-expert
- **Name**: NFT Marketplace Expert
- **Category**: NFT/DeFi
- **Tags**: nft, marketplace, metaplex, magic-eden, tensor, trading
- **Version**: 2.0.0
- **Token Estimate**: 4100

---

## Overview

NFT marketplaces on Solana require integration with:
- **Metaplex Standards**: Token Metadata, Candy Machine, Collections
- **Marketplace Protocols**: Magic Eden, Tensor, Hyperspace
- **Royalty Systems**: Creator royalties, enforcement mechanisms
- **Listing/Bidding**: Escrow systems, auction mechanics
- **Collection Management**: Verification, traits, rarity

This skill covers marketplace integration patterns for NFT trading applications.

---

## Metaplex Integration

### Token Metadata Standard

```typescript
// metaplex/metadata.ts
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  CreateNftOutput,
} from '@metaplex-foundation/js';
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from '@solana/web3.js';

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: { trait_type: string; value: string }[];
  collection?: {
    name: string;
    family?: string;
  };
  properties?: {
    files?: { uri: string; type: string }[];
    creators?: { address: string; share: number }[];
  };
  seller_fee_basis_points?: number; // Royalties (e.g., 500 = 5%)
}

export class MetaplexNFTService {
  private metaplex: Metaplex;

  constructor(connection: Connection, payer: Keypair) {
    this.metaplex = Metaplex.make(connection)
      .use(keypairIdentity(payer))
      .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: clusterApiUrl('devnet'),
        timeout: 60000,
      }));
  }

  async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    const { uri } = await this.metaplex.nfts().uploadMetadata(metadata);
    return uri;
  }

  async uploadImage(
    imageBuffer: Buffer,
    fileName: string
  ): Promise<string> {
    const file = toMetaplexFile(imageBuffer, fileName);
    const imageUri = await this.metaplex.storage().upload(file);
    return imageUri;
  }

  async createNFT(
    metadata: NFTMetadata,
    options?: {
      collection?: PublicKey;
      maxSupply?: number;
      isMutable?: boolean;
    }
  ): Promise<CreateNftOutput> {
    // Upload metadata to Arweave/Bundlr
    const uri = await this.uploadMetadata(metadata);

    // Create NFT
    const { nft, response } = await this.metaplex.nfts().create({
      uri,
      name: metadata.name,
      symbol: metadata.symbol,
      sellerFeeBasisPoints: metadata.seller_fee_basis_points || 500,
      collection: options?.collection,
      maxSupply: options?.maxSupply,
      isMutable: options?.isMutable ?? true,
    });

    console.log('NFT created:', nft.address.toBase58());
    console.log('Metadata URI:', uri);

    return { nft, response };
  }

  async verifyCollection(
    nftMint: PublicKey,
    collectionMint: PublicKey,
    collectionAuthority: Keypair
  ): Promise<void> {
    await this.metaplex.nfts().verifyCollection({
      mintAddress: nftMint,
      collectionMintAddress: collectionMint,
      collectionAuthority,
    });

    console.log('NFT verified as part of collection');
  }

  async fetchNFT(mint: PublicKey) {
    return this.metaplex.nfts().findByMint({ mintAddress: mint });
  }

  async fetchAllByOwner(owner: PublicKey) {
    return this.metaplex.nfts().findAllByOwner({ owner });
  }

  async fetchAllByCollection(collection: PublicKey) {
    return this.metaplex.nfts().findAllByCollection({
      collection,
    });
  }

  async updateNFT(
    mint: PublicKey,
    updates: {
      name?: string;
      symbol?: string;
      uri?: string;
      sellerFeeBasisPoints?: number;
    }
  ): Promise<void> {
    const nft = await this.fetchNFT(mint);

    await this.metaplex.nfts().update({
      nftOrSft: nft,
      ...updates,
    });

    console.log('NFT updated');
  }
}
```

### Collection Management

```typescript
// metaplex/collections.ts
import {
  Metaplex,
  PublicKey,
  Keypair,
} from '@metaplex-foundation/js';

export interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  image: string;
  sellerFeeBasisPoints: number;
  creators: { address: string; share: number }[];
}

export class CollectionManager {
  private metaplex: Metaplex;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }

  async createCollection(config: CollectionConfig): Promise<{
    collectionMint: PublicKey;
    collectionAuthority: PublicKey;
  }> {
    // Upload collection metadata
    const { uri } = await this.metaplex.nfts().uploadMetadata({
      name: config.name,
      symbol: config.symbol,
      description: config.description,
      image: config.image,
      properties: {
        creators: config.creators.map(c => ({
          address: c.address,
          share: c.share,
        })),
      },
      seller_fee_basis_points: config.sellerFeeBasisPoints,
    });

    // Create collection NFT
    const { nft } = await this.metaplex.nfts().create({
      uri,
      name: config.name,
      symbol: config.symbol,
      sellerFeeBasisPoints: config.sellerFeeBasisPoints,
      isCollection: true,
    });

    return {
      collectionMint: nft.address,
      collectionAuthority: this.metaplex.identity().publicKey,
    };
  }

  async getCollectionStats(collectionMint: PublicKey): Promise<{
    totalSupply: number;
    uniqueHolders: number;
    floorPrice?: number;
    listed: number;
  }> {
    // Fetch all NFTs in collection
    const nfts = await this.metaplex.nfts().findAllByCollection({
      collection: collectionMint,
    });

    // Calculate unique holders
    const holders = new Set<string>();
    for (const nft of nfts) {
      if ('owner' in nft && nft.owner) {
        holders.add(nft.owner.toBase58());
      }
    }

    return {
      totalSupply: nfts.length,
      uniqueHolders: holders.size,
      floorPrice: undefined, // Would fetch from marketplace
      listed: 0, // Would fetch from marketplace
    };
  }

  async getCollectionNFTs(
    collectionMint: PublicKey,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: 'price' | 'rarity' | 'recent';
    }
  ) {
    const allNfts = await this.metaplex.nfts().findAllByCollection({
      collection: collectionMint,
    });

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const start = (page - 1) * limit;

    return {
      nfts: allNfts.slice(start, start + limit),
      total: allNfts.length,
      page,
      totalPages: Math.ceil(allNfts.length / limit),
    };
  }
}
```

---

## Magic Eden Integration

### Magic Eden SDK

```typescript
// marketplaces/magic-eden.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

const ME_API_BASE = 'https://api-mainnet.magiceden.dev/v2';

export interface MEListing {
  pdaAddress: string;
  auctionHouse: string;
  tokenAddress: string;
  tokenMint: string;
  seller: string;
  sellerReferral: string;
  tokenSize: number;
  price: number; // In SOL
  expiry: number;
}

export interface MEActivity {
  signature: string;
  type: 'list' | 'delist' | 'buyNow' | 'bid' | 'cancelBid';
  source: string;
  tokenMint: string;
  collection: string;
  slot: number;
  blockTime: number;
  buyer?: string;
  seller?: string;
  price: number;
}

export class MagicEdenClient {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${ME_API_BASE}${endpoint}`, { headers });

    if (!response.ok) {
      throw new Error(`Magic Eden API error: ${response.status}`);
    }

    return response.json();
  }

  // Collection endpoints
  async getCollectionStats(symbol: string) {
    return this.fetch<{
      symbol: string;
      floorPrice: number;
      listedCount: number;
      volumeAll: number;
    }>(`/collections/${symbol}/stats`);
  }

  async getCollectionListings(
    symbol: string,
    options?: { offset?: number; limit?: number }
  ): Promise<MEListing[]> {
    const params = new URLSearchParams({
      offset: String(options?.offset || 0),
      limit: String(options?.limit || 20),
    });

    return this.fetch<MEListing[]>(
      `/collections/${symbol}/listings?${params}`
    );
  }

  async getCollectionActivities(
    symbol: string,
    options?: { offset?: number; limit?: number }
  ): Promise<MEActivity[]> {
    const params = new URLSearchParams({
      offset: String(options?.offset || 0),
      limit: String(options?.limit || 100),
    });

    return this.fetch<MEActivity[]>(
      `/collections/${symbol}/activities?${params}`
    );
  }

  // Token endpoints
  async getTokenListings(mintAddress: string): Promise<MEListing[]> {
    return this.fetch<MEListing[]>(`/tokens/${mintAddress}/listings`);
  }

  async getTokenActivities(mintAddress: string): Promise<MEActivity[]> {
    return this.fetch<MEActivity[]>(`/tokens/${mintAddress}/activities`);
  }

  // Instruction builders
  async getBuyInstruction(
    buyer: string,
    seller: string,
    auctionHouseAddress: string,
    tokenMint: string,
    price: number, // In lamports
    sellerExpiry?: number
  ): Promise<{ tx: string }> {
    const response = await fetch(`${ME_API_BASE}/instructions/buy_now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer,
        seller,
        auctionHouseAddress,
        tokenMint,
        price,
        sellerExpiry: sellerExpiry || -1,
      }),
    });

    return response.json();
  }

  async getListInstruction(
    seller: string,
    auctionHouseAddress: string,
    tokenMint: string,
    tokenAccount: string,
    price: number, // In lamports
    expiry?: number
  ): Promise<{ tx: string }> {
    const response = await fetch(`${ME_API_BASE}/instructions/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seller,
        auctionHouseAddress,
        tokenMint,
        tokenAccount,
        price,
        expiry: expiry || -1,
      }),
    });

    return response.json();
  }

  async getDelistInstruction(
    seller: string,
    auctionHouseAddress: string,
    tokenMint: string,
    tokenAccount: string
  ): Promise<{ tx: string }> {
    const response = await fetch(`${ME_API_BASE}/instructions/sell_cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seller,
        auctionHouseAddress,
        tokenMint,
        tokenAccount,
      }),
    });

    return response.json();
  }
}
```

### Magic Eden Trading

```typescript
// marketplaces/magic-eden-trading.ts
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { MagicEdenClient } from './magic-eden';

export class MagicEdenTrader {
  private client: MagicEdenClient;
  private connection: Connection;

  constructor(connection: Connection, apiKey?: string) {
    this.connection = connection;
    this.client = new MagicEdenClient(apiKey);
  }

  async listNFT(
    seller: Keypair,
    tokenMint: PublicKey,
    priceSOL: number,
    options?: {
      expiryDays?: number;
    }
  ): Promise<string> {
    // Get token account
    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      seller.publicKey,
      { mint: tokenMint }
    );

    if (tokenAccounts.value.length === 0) {
      throw new Error('Token account not found');
    }

    const tokenAccount = tokenAccounts.value[0].pubkey;
    const priceInLamports = Math.floor(priceSOL * LAMPORTS_PER_SOL);

    // Calculate expiry (default 7 days)
    const expiryDays = options?.expiryDays || 7;
    const expiry = Math.floor(Date.now() / 1000) + expiryDays * 24 * 60 * 60;

    // Get listing instruction from Magic Eden
    const { tx: serializedTx } = await this.client.getListInstruction(
      seller.publicKey.toBase58(),
      ME_AUCTION_HOUSE, // Magic Eden auction house
      tokenMint.toBase58(),
      tokenAccount.toBase58(),
      priceInLamports,
      expiry
    );

    // Deserialize and sign transaction
    const txBuffer = Buffer.from(serializedTx, 'base64');
    const transaction = VersionedTransaction.deserialize(txBuffer);

    transaction.sign([seller]);

    // Send transaction
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    console.log('NFT listed on Magic Eden:', signature);
    return signature;
  }

  async buyNFT(
    buyer: Keypair,
    listing: MEListing
  ): Promise<string> {
    const priceInLamports = Math.floor(listing.price * LAMPORTS_PER_SOL);

    // Get buy instruction from Magic Eden
    const { tx: serializedTx } = await this.client.getBuyInstruction(
      buyer.publicKey.toBase58(),
      listing.seller,
      listing.auctionHouse,
      listing.tokenMint,
      priceInLamports,
      listing.expiry
    );

    // Deserialize and sign transaction
    const txBuffer = Buffer.from(serializedTx, 'base64');
    const transaction = VersionedTransaction.deserialize(txBuffer);

    transaction.sign([buyer]);

    // Send transaction
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    console.log('NFT purchased on Magic Eden:', signature);
    return signature;
  }

  async delistNFT(
    seller: Keypair,
    tokenMint: PublicKey
  ): Promise<string> {
    // Get current listing
    const listings = await this.client.getTokenListings(tokenMint.toBase58());

    if (listings.length === 0) {
      throw new Error('No active listing found');
    }

    const listing = listings[0];

    // Get token account
    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      seller.publicKey,
      { mint: tokenMint }
    );

    const tokenAccount = tokenAccounts.value[0].pubkey;

    // Get delist instruction
    const { tx: serializedTx } = await this.client.getDelistInstruction(
      seller.publicKey.toBase58(),
      listing.auctionHouse,
      tokenMint.toBase58(),
      tokenAccount.toBase58()
    );

    // Deserialize and sign transaction
    const txBuffer = Buffer.from(serializedTx, 'base64');
    const transaction = VersionedTransaction.deserialize(txBuffer);

    transaction.sign([seller]);

    // Send transaction
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    console.log('NFT delisted from Magic Eden:', signature);
    return signature;
  }

  async getFloorListing(collectionSymbol: string): Promise<MEListing | null> {
    const listings = await this.client.getCollectionListings(
      collectionSymbol,
      { limit: 1 }
    );

    return listings[0] || null;
  }
}

const ME_AUCTION_HOUSE = 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe';
```

---

## Tensor Integration

```typescript
// marketplaces/tensor.ts
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const TENSOR_API = 'https://api.tensor.so/graphql';

export interface TensorListing {
  mint: string;
  seller: string;
  price: number; // In lamports
  expiry?: number;
  owner: string;
}

export interface TensorBid {
  bidder: string;
  price: number;
  expiry?: number;
}

export class TensorClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async graphql<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(TENSOR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TENSOR-API-KEY': this.apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  }

  async getCollectionStats(slug: string) {
    const query = `
      query CollectionStats($slug: String!) {
        instrumentTV2(slug: $slug) {
          slug
          name
          statsV2 {
            currency
            buyNowPrice
            sellNowPrice
            numListed
            numMints
            floor1h
            floor24h
            floor7d
            volume1h
            volume24h
            volume7d
          }
        }
      }
    `;

    return this.graphql<{
      instrumentTV2: {
        slug: string;
        name: string;
        statsV2: {
          buyNowPrice: string;
          sellNowPrice: string;
          numListed: number;
          numMints: number;
          floor1h: string;
          floor24h: string;
          floor7d: string;
          volume1h: string;
          volume24h: string;
          volume7d: string;
        };
      };
    }>(query, { slug });
  }

  async getActiveListings(slug: string, limit = 20) {
    const query = `
      query ActiveListings($slug: String!, $limit: Int!) {
        activeListingsV2(slug: $slug, limit: $limit, sortBy: PriceAsc) {
          txs {
            mint {
              onchainId
            }
            tx {
              sellerId
              grossAmount
              grossAmountUnit
            }
          }
        }
      }
    `;

    return this.graphql<{
      activeListingsV2: {
        txs: {
          mint: { onchainId: string };
          tx: {
            sellerId: string;
            grossAmount: string;
            grossAmountUnit: string;
          };
        }[];
      };
    }>(query, { slug, limit });
  }

  async getBuyTx(
    buyer: string,
    mint: string,
    maxPrice: number // In lamports
  ): Promise<string> {
    const query = `
      query BuyTx($buyer: String!, $mint: String!, $maxPrice: Decimal!) {
        tswapBuyNftTx(
          buyer: $buyer
          mint: $mint
          maxPrice: $maxPrice
        ) {
          txs {
            tx
            lastValidBlockHeight
          }
        }
      }
    `;

    const result = await this.graphql<{
      tswapBuyNftTx: {
        txs: { tx: string; lastValidBlockHeight: number }[];
      };
    }>(query, {
      buyer,
      mint,
      maxPrice: maxPrice.toString(),
    });

    return result.tswapBuyNftTx.txs[0]?.tx;
  }

  async getListTx(
    seller: string,
    mint: string,
    price: number // In lamports
  ): Promise<string> {
    const query = `
      query ListTx($seller: String!, $mint: String!, $price: Decimal!) {
        tswapListNftTx(
          seller: $seller
          mint: $mint
          price: $price
        ) {
          txs {
            tx
            lastValidBlockHeight
          }
        }
      }
    `;

    const result = await this.graphql<{
      tswapListNftTx: {
        txs: { tx: string; lastValidBlockHeight: number }[];
      };
    }>(query, {
      seller,
      mint,
      price: price.toString(),
    });

    return result.tswapListNftTx.txs[0]?.tx;
  }

  async getDelistTx(
    seller: string,
    mint: string
  ): Promise<string> {
    const query = `
      query DelistTx($seller: String!, $mint: String!) {
        tswapDelistNftTx(
          seller: $seller
          mint: $mint
        ) {
          txs {
            tx
            lastValidBlockHeight
          }
        }
      }
    `;

    const result = await this.graphql<{
      tswapDelistNftTx: {
        txs: { tx: string; lastValidBlockHeight: number }[];
      };
    }>(query, { seller, mint });

    return result.tswapDelistNftTx.txs[0]?.tx;
  }
}

export class TensorTrader {
  private client: TensorClient;
  private connection: Connection;

  constructor(connection: Connection, apiKey: string) {
    this.connection = connection;
    this.client = new TensorClient(apiKey);
  }

  async listNFT(
    seller: Keypair,
    mint: PublicKey,
    priceSOL: number
  ): Promise<string> {
    const priceInLamports = Math.floor(priceSOL * LAMPORTS_PER_SOL);

    const serializedTx = await this.client.getListTx(
      seller.publicKey.toBase58(),
      mint.toBase58(),
      priceInLamports
    );

    const txBuffer = Buffer.from(serializedTx, 'base64');
    const transaction = Transaction.from(txBuffer);

    transaction.sign(seller);

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  async buyNFT(
    buyer: Keypair,
    mint: PublicKey,
    maxPriceSOL: number
  ): Promise<string> {
    const maxPriceLamports = Math.floor(maxPriceSOL * LAMPORTS_PER_SOL);

    const serializedTx = await this.client.getBuyTx(
      buyer.publicKey.toBase58(),
      mint.toBase58(),
      maxPriceLamports
    );

    const txBuffer = Buffer.from(serializedTx, 'base64');
    const transaction = Transaction.from(txBuffer);

    transaction.sign(buyer);

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  async delistNFT(seller: Keypair, mint: PublicKey): Promise<string> {
    const serializedTx = await this.client.getDelistTx(
      seller.publicKey.toBase58(),
      mint.toBase58()
    );

    const txBuffer = Buffer.from(serializedTx, 'base64');
    const transaction = Transaction.from(txBuffer);

    transaction.sign(seller);

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }
}
```

---

## Marketplace Aggregator

```typescript
// aggregator/nft-aggregator.ts
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { MagicEdenTrader, MEListing } from '../marketplaces/magic-eden-trading';
import { TensorTrader, TensorClient } from '../marketplaces/tensor';

export interface AggregatedListing {
  marketplace: 'magic_eden' | 'tensor' | 'hyperspace';
  mint: string;
  seller: string;
  price: number; // In SOL
  expiry?: number;
  url: string;
}

export interface BestPrice {
  mint: string;
  bestListing: AggregatedListing;
  allListings: AggregatedListing[];
}

export class NFTAggregator {
  private meTrader: MagicEdenTrader;
  private tensorTrader: TensorTrader;
  private connection: Connection;

  constructor(
    connection: Connection,
    tensorApiKey: string,
    meApiKey?: string
  ) {
    this.connection = connection;
    this.meTrader = new MagicEdenTrader(connection, meApiKey);
    this.tensorTrader = new TensorTrader(connection, tensorApiKey);
  }

  async findBestPrice(
    mint: PublicKey
  ): Promise<BestPrice | null> {
    const allListings: AggregatedListing[] = [];

    // Fetch from Magic Eden
    try {
      const meClient = new MagicEdenClient();
      const meListings = await meClient.getTokenListings(mint.toBase58());

      for (const listing of meListings) {
        allListings.push({
          marketplace: 'magic_eden',
          mint: listing.tokenMint,
          seller: listing.seller,
          price: listing.price,
          expiry: listing.expiry,
          url: `https://magiceden.io/item-details/${listing.tokenMint}`,
        });
      }
    } catch (error) {
      console.warn('Failed to fetch Magic Eden listings:', error);
    }

    // Fetch from Tensor
    try {
      const tensorClient = new TensorClient(process.env.TENSOR_API_KEY!);
      // Would need collection slug to fetch from Tensor
    } catch (error) {
      console.warn('Failed to fetch Tensor listings:', error);
    }

    if (allListings.length === 0) {
      return null;
    }

    // Sort by price
    allListings.sort((a, b) => a.price - b.price);

    return {
      mint: mint.toBase58(),
      bestListing: allListings[0],
      allListings,
    };
  }

  async sweepFloor(
    buyer: Keypair,
    collectionSymbol: string,
    maxPriceSOL: number,
    quantity: number,
    options?: {
      preferredMarketplace?: 'magic_eden' | 'tensor';
      skipHighRarity?: boolean;
    }
  ): Promise<string[]> {
    const signatures: string[] = [];

    // Get floor listings from Magic Eden
    const meClient = new MagicEdenClient();
    const listings = await meClient.getCollectionListings(collectionSymbol, {
      limit: quantity * 2, // Get extra in case some fail
    });

    // Filter by max price
    const eligibleListings = listings.filter(l => l.price <= maxPriceSOL);

    // Buy up to quantity
    for (let i = 0; i < Math.min(quantity, eligibleListings.length); i++) {
      try {
        const sig = await this.meTrader.buyNFT(buyer, eligibleListings[i]);
        signatures.push(sig);
        console.log(`Purchased NFT ${i + 1}/${quantity}: ${sig}`);
      } catch (error) {
        console.error(`Failed to purchase listing ${i}:`, error);
      }
    }

    return signatures;
  }

  async listOnAllMarketplaces(
    seller: Keypair,
    mint: PublicKey,
    priceSOL: number
  ): Promise<{ marketplace: string; signature?: string; error?: string }[]> {
    const results: { marketplace: string; signature?: string; error?: string }[] = [];

    // List on Magic Eden
    try {
      const meSig = await this.meTrader.listNFT(seller, mint, priceSOL);
      results.push({ marketplace: 'magic_eden', signature: meSig });
    } catch (error) {
      results.push({
        marketplace: 'magic_eden',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // List on Tensor
    try {
      const tensorSig = await this.tensorTrader.listNFT(seller, mint, priceSOL);
      results.push({ marketplace: 'tensor', signature: tensorSig });
    } catch (error) {
      results.push({
        marketplace: 'tensor',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return results;
  }
}
```

---

## Royalty Enforcement

```typescript
// royalties/royalty-manager.ts
import { Connection, PublicKey } from '@solana/web3.js';

export interface RoyaltyInfo {
  creators: { address: string; share: number }[];
  sellerFeeBasisPoints: number;
  enforced: boolean;
}

export class RoyaltyManager {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async getRoyaltyInfo(mint: PublicKey): Promise<RoyaltyInfo | null> {
    // Fetch metadata account
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METAPLEX_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METAPLEX_PROGRAM_ID
    );

    const accountInfo = await this.connection.getAccountInfo(metadataPda);
    if (!accountInfo) return null;

    // Parse metadata (simplified)
    const data = accountInfo.data;
    // ... parse metadata structure

    return {
      creators: [],
      sellerFeeBasisPoints: 500, // 5%
      enforced: true,
    };
  }

  calculateRoyalty(
    salePrice: number,
    sellerFeeBasisPoints: number
  ): {
    royaltyAmount: number;
    sellerProceeds: number;
  } {
    const royaltyAmount = (salePrice * sellerFeeBasisPoints) / 10000;
    return {
      royaltyAmount,
      sellerProceeds: salePrice - royaltyAmount,
    };
  }

  distributeRoyalties(
    totalRoyalty: number,
    creators: { address: string; share: number }[]
  ): { address: string; amount: number }[] {
    return creators.map(creator => ({
      address: creator.address,
      amount: (totalRoyalty * creator.share) / 100,
    }));
  }

  async checkRoyaltyEnforcement(
    mint: PublicKey,
    marketplace: string
  ): Promise<{
    enforced: boolean;
    mechanism: string;
  }> {
    // Check if marketplace enforces royalties
    const enforcingMarketplaces = ['magic_eden', 'tensor'];

    return {
      enforced: enforcingMarketplaces.includes(marketplace),
      mechanism: marketplace === 'tensor' ? 'tcomp' : 'auction_house',
    };
  }
}

const METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
```

---

## Testing NFT Marketplace

```typescript
// tests/marketplace.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('NFT Marketplace Integration', () => {
  let connection: Connection;
  let seller: Keypair;
  let buyer: Keypair;
  let testNftMint: PublicKey;

  beforeAll(async () => {
    connection = new Connection('http://localhost:8899', 'confirmed');
    seller = Keypair.generate();
    buyer = Keypair.generate();

    // Airdrop SOL
    await connection.requestAirdrop(seller.publicKey, 10 * LAMPORTS_PER_SOL);
    await connection.requestAirdrop(buyer.publicKey, 10 * LAMPORTS_PER_SOL);

    // Create test NFT
    // ... create NFT for testing
  });

  describe('Listing', () => {
    it('should list NFT on Magic Eden', async () => {
      const trader = new MagicEdenTrader(connection);

      const signature = await trader.listNFT(
        seller,
        testNftMint,
        1.5 // 1.5 SOL
      );

      expect(signature).toBeDefined();

      // Verify listing
      const client = new MagicEdenClient();
      const listings = await client.getTokenListings(testNftMint.toBase58());
      expect(listings.length).toBeGreaterThan(0);
      expect(listings[0].price).toBe(1.5);
    });

    it('should list NFT on multiple marketplaces', async () => {
      const aggregator = new NFTAggregator(
        connection,
        process.env.TENSOR_API_KEY!
      );

      const results = await aggregator.listOnAllMarketplaces(
        seller,
        testNftMint,
        2.0
      );

      expect(results.some(r => r.marketplace === 'magic_eden')).toBe(true);
      expect(results.filter(r => r.signature).length).toBeGreaterThan(0);
    });
  });

  describe('Buying', () => {
    it('should buy NFT at floor price', async () => {
      const trader = new MagicEdenTrader(connection);

      // First list an NFT
      await trader.listNFT(seller, testNftMint, 1.0);

      // Get listing
      const client = new MagicEdenClient();
      const listings = await client.getTokenListings(testNftMint.toBase58());

      // Buy
      const signature = await trader.buyNFT(buyer, listings[0]);

      expect(signature).toBeDefined();

      // Verify ownership transferred
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        buyer.publicKey,
        { mint: testNftMint }
      );

      expect(tokenAccounts.value.length).toBeGreaterThan(0);
    });
  });

  describe('Aggregation', () => {
    it('should find best price across marketplaces', async () => {
      const aggregator = new NFTAggregator(
        connection,
        process.env.TENSOR_API_KEY!
      );

      const bestPrice = await aggregator.findBestPrice(testNftMint);

      if (bestPrice) {
        expect(bestPrice.bestListing.price).toBeLessThanOrEqual(
          bestPrice.allListings[bestPrice.allListings.length - 1].price
        );
      }
    });
  });

  describe('Royalties', () => {
    it('should calculate royalty distribution', () => {
      const manager = new RoyaltyManager(connection);

      const result = manager.calculateRoyalty(10, 500); // 10 SOL, 5%

      expect(result.royaltyAmount).toBe(0.5);
      expect(result.sellerProceeds).toBe(9.5);
    });

    it('should distribute to multiple creators', () => {
      const manager = new RoyaltyManager(connection);

      const distribution = manager.distributeRoyalties(1.0, [
        { address: 'creator1', share: 80 },
        { address: 'creator2', share: 20 },
      ]);

      expect(distribution[0].amount).toBe(0.8);
      expect(distribution[1].amount).toBe(0.2);
    });
  });
});
```

---

## Related Skills

- **solana-reader** - Reading NFT metadata and ownership
- **wallet-integration** - Wallet connection for NFT transactions
- **smart-contract-auditor** - Auditing NFT marketplace contracts

---

## Further Reading

- [Metaplex Documentation](https://docs.metaplex.com/)
- [Magic Eden Developer Docs](https://docs.magiceden.io/)
- [Tensor API Documentation](https://docs.tensor.so/)
- [Solana NFT Standard](https://docs.metaplex.com/programs/token-metadata/)
- [Candy Machine V3](https://docs.metaplex.com/programs/candy-machine/)
