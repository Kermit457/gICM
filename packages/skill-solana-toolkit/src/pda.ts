/**
 * PDA (Program Derived Address) utilities
 * Helpers for working with PDAs on Solana
 */

import { PublicKey } from "@solana/web3.js";

// PDA derivation result
export interface PdaResult {
  publicKey: PublicKey;
  bump: number;
}

// Find PDA with caching
const pdaCache = new Map<string, PdaResult>();

export function findProgramAddress(
  seeds: (Buffer | Uint8Array | string | PublicKey)[],
  programId: PublicKey,
  useCache = true
): PdaResult {
  const normalizedSeeds = seeds.map((seed) => {
    if (typeof seed === "string") {
      return Buffer.from(seed);
    }
    if (seed instanceof PublicKey) {
      return seed.toBuffer();
    }
    return Buffer.from(seed);
  });

  const cacheKey = `${programId.toBase58()}-${normalizedSeeds.map((s) => s.toString("hex")).join("-")}`;

  if (useCache && pdaCache.has(cacheKey)) {
    return pdaCache.get(cacheKey)!;
  }

  const [publicKey, bump] = PublicKey.findProgramAddressSync(
    normalizedSeeds,
    programId
  );

  const result = { publicKey, bump };

  if (useCache) {
    pdaCache.set(cacheKey, result);
  }

  return result;
}

// Clear PDA cache
export function clearPdaCache(): void {
  pdaCache.clear();
}

// Common PDA patterns

// Metadata PDA for Metaplex
export function findMetadataPda(
  mint: PublicKey,
  tokenMetadataProgram = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
): PdaResult {
  return findProgramAddress(
    ["metadata", tokenMetadataProgram, mint],
    tokenMetadataProgram
  );
}

// Master Edition PDA
export function findMasterEditionPda(
  mint: PublicKey,
  tokenMetadataProgram = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
): PdaResult {
  return findProgramAddress(
    ["metadata", tokenMetadataProgram, mint, "edition"],
    tokenMetadataProgram
  );
}

// Associated Token Account PDA
export function findAssociatedTokenPda(
  wallet: PublicKey,
  mint: PublicKey,
  tokenProgramId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  associatedTokenProgramId = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
): PdaResult {
  return findProgramAddress(
    [wallet, tokenProgramId, mint],
    associatedTokenProgramId
  );
}

// Generic vault/authority PDA pattern
export function findVaultPda(
  seeds: string[],
  programId: PublicKey
): PdaResult {
  return findProgramAddress(seeds, programId);
}

// User state PDA (common pattern)
export function findUserStatePda(
  user: PublicKey,
  programId: PublicKey,
  prefix = "user"
): PdaResult {
  return findProgramAddress([prefix, user], programId);
}

// Pool PDA (for AMMs)
export function findPoolPda(
  tokenA: PublicKey,
  tokenB: PublicKey,
  programId: PublicKey,
  prefix = "pool"
): PdaResult {
  // Sort tokens for consistent derivation
  const [first, second] =
    tokenA.toBuffer().compare(tokenB.toBuffer()) < 0
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  return findProgramAddress([prefix, first, second], programId);
}

// Stake account PDA
export function findStakeAccountPda(
  staker: PublicKey,
  pool: PublicKey,
  programId: PublicKey
): PdaResult {
  return findProgramAddress(["stake", staker, pool], programId);
}

// Verify PDA
export function verifyPda(
  expected: PublicKey,
  seeds: (Buffer | Uint8Array | string | PublicKey)[],
  programId: PublicKey
): boolean {
  const { publicKey } = findProgramAddress(seeds, programId, false);
  return publicKey.equals(expected);
}

// Create seeds with bump
export function createSeedsWithBump(
  seeds: (Buffer | Uint8Array | string | PublicKey)[],
  bump: number
): Buffer[] {
  const normalizedSeeds = seeds.map((seed) => {
    if (typeof seed === "string") {
      return Buffer.from(seed);
    }
    if (seed instanceof PublicKey) {
      return seed.toBuffer();
    }
    return Buffer.from(seed);
  });

  return [...normalizedSeeds, Buffer.from([bump])];
}
