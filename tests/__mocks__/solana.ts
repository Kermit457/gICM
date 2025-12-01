/**
 * Solana Mocks for Testing
 *
 * Provides mock implementations of @solana/web3.js classes
 */

import { vi } from "vitest";

// Mock Keypair
export class MockKeypair {
  publicKey = {
    toBase58: () => "MockPubKey123456789",
    toString: () => "MockPubKey123456789",
  };
  secretKey = new Uint8Array(64).fill(0);

  static generate() {
    return new MockKeypair();
  }

  static fromSecretKey() {
    return new MockKeypair();
  }
}

// Mock Connection
export class MockConnection {
  private balances: Map<string, number> = new Map();

  constructor(public endpoint: string = "https://api.mainnet-beta.solana.com") {
    // Default balances for testing
    this.balances.set("MockPubKey123456789", 1_000_000_000); // 1 SOL in lamports
  }

  async getBalance(pubkey: { toBase58: () => string }): Promise<number> {
    return this.balances.get(pubkey.toBase58()) ?? 0;
  }

  async getLatestBlockhash() {
    return {
      blockhash: "MockBlockhash123",
      lastValidBlockHeight: 100000,
    };
  }

  async sendRawTransaction() {
    return "MockTxSignature123";
  }

  async confirmTransaction() {
    return { value: { err: null } };
  }

  // Test helpers
  setBalance(pubkey: string, lamports: number) {
    this.balances.set(pubkey, lamports);
  }
}

// Mock PublicKey
export class MockPublicKey {
  constructor(public address: string = "MockPubKey123456789") {}

  toBase58() {
    return this.address;
  }

  toString() {
    return this.address;
  }

  equals(other: MockPublicKey) {
    return this.address === other.address;
  }
}

// Export mock factory
export function createSolanaMocks() {
  return {
    Keypair: MockKeypair,
    Connection: MockConnection,
    PublicKey: MockPublicKey,
  };
}

// Module mock helper for vitest
export function mockSolanaWeb3js() {
  vi.mock("@solana/web3.js", () => ({
    Keypair: MockKeypair,
    Connection: MockConnection,
    PublicKey: MockPublicKey,
    LAMPORTS_PER_SOL: 1_000_000_000,
  }));
}
