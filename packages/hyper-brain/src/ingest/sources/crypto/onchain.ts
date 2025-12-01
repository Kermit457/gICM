/**
 * On-Chain Data Source
 *
 * Ingests blockchain data from Helius, pump.fun, etc.
 */

import { BaseSource, RawItem } from "../base.js";
import type { SourceType } from "../../../types/index.js";

export class OnChainSource extends BaseSource {
  name = "onchain";
  type: SourceType = "onchain";
  interval = 60 * 1000; // Every minute

  private heliusApiKey: string;
  private trackedWallets: string[] = [];

  constructor() {
    super();
    this.heliusApiKey = process.env.HELIUS_API_KEY || "";
    this.rateLimit = { requests: 30, window: 60000 };
    this.loadTrackedWallets();
  }

  async fetch(): Promise<RawItem[]> {
    const items: RawItem[] = [];

    // Fetch new token deployments from pump.fun
    const pumpTokens = await this.fetchPumpFunTokens();
    items.push(...pumpTokens);

    // Fetch whale transactions if API key available
    if (this.heliusApiKey) {
      const whaleTransactions = await this.fetchWhaleTransactions();
      items.push(...whaleTransactions);
    }

    return items;
  }

  private async fetchPumpFunTokens(): Promise<RawItem[]> {
    const items: RawItem[] = [];

    try {
      const response = await this.rateLimitedFetch(
        "https://frontend-api.pump.fun/coins/latest?limit=50"
      );

      if (!response.ok) {
        this.logger.warn(`pump.fun API returned ${response.status}`);
        return items;
      }

      const tokens = await response.json() as Array<{
        mint: string;
        name: string;
        symbol: string;
        description?: string;
        creator: string;
        usd_market_cap?: number;
        created_timestamp: string;
        twitter?: string;
        telegram?: string;
        website?: string;
      }>;

      for (const token of tokens) {
        items.push({
          id: this.generateId("pumpfun", token.mint),
          source: "pumpfun",
          type: "token_launch",
          content: `New token: ${token.name} (${token.symbol})${token.description ? ` - ${token.description}` : ""}`,
          metadata: {
            mint: token.mint,
            name: token.name,
            symbol: token.symbol,
            creator: token.creator,
            marketCap: token.usd_market_cap,
            twitter: token.twitter,
            telegram: token.telegram,
            website: token.website,
          },
          timestamp: new Date(token.created_timestamp).getTime(),
        });
      }

      this.logger.info(`Fetched ${items.length} tokens from pump.fun`);
    } catch (error) {
      this.logger.error(`Failed to fetch pump.fun tokens: ${error}`);
    }

    return items;
  }

  private async fetchWhaleTransactions(): Promise<RawItem[]> {
    const items: RawItem[] = [];

    for (const wallet of this.trackedWallets.slice(0, 5)) {
      try {
        const response = await this.rateLimitedFetch(
          `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${this.heliusApiKey}&limit=10`
        );

        if (!response.ok) continue;

        const transactions = await response.json() as Array<{
          signature: string;
          type: string;
          timestamp: number;
          description?: string;
          tokenTransfers?: Array<{
            mint: string;
            tokenAmount: number;
            fromUserAccount: string;
            toUserAccount: string;
          }>;
        }>;

        for (const tx of transactions) {
          if (this.isSignificantTransaction(tx)) {
            items.push({
              id: this.generateId("helius", tx.signature),
              source: "helius",
              type: "transaction",
              content: tx.description || `Whale transaction: ${tx.type}`,
              metadata: {
                signature: tx.signature,
                wallet,
                type: tx.type,
                tokenTransfers: tx.tokenTransfers,
              },
              timestamp: tx.timestamp * 1000,
            });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to fetch wallet ${wallet.slice(0, 8)}...: ${error}`);
      }
    }

    return items;
  }

  private isSignificantTransaction(tx: { tokenTransfers?: Array<{ tokenAmount: number }> }): boolean {
    // Filter for significant transactions (large amounts)
    if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
      return tx.tokenTransfers.some((t) => t.tokenAmount > 10000);
    }
    return false;
  }

  private loadTrackedWallets(): void {
    // Well-known whale wallets (placeholders - would be real addresses)
    this.trackedWallets = [
      // Add tracked wallet addresses here
    ];
  }
}
