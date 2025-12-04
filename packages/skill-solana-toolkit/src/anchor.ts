/**
 * Anchor program utilities
 * Helpers for working with Anchor programs on Solana
 */

import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { z } from "zod";

// Common Anchor program IDs
export const ANCHOR_PROGRAMS = {
  TOKEN_METADATA: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
  ASSOCIATED_TOKEN: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
  TOKEN: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  TOKEN_2022: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
  SYSTEM: SystemProgram.programId,
  RENT: SYSVAR_RENT_PUBKEY,
} as const;

// Anchor discriminator calculation
export function getAnchorDiscriminator(name: string): Buffer {
  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();
  const data = encoder.encode(`global:${name}`);

  // Simplified hash - in real usage, use actual sha256
  // This is a placeholder for the pattern
  const hash = Buffer.alloc(8);
  let acc = 0;
  for (const byte of data) {
    acc = (acc + byte) % 256;
  }
  hash.writeUInt8(acc, 0);

  return hash;
}

// Account data parsing helpers
export const AnchorAccountHeaderSchema = z.object({
  discriminator: z.instanceof(Buffer),
  data: z.instanceof(Buffer),
});

export function parseAnchorAccount<T extends z.ZodTypeAny>(
  data: Buffer,
  schema: T,
  expectedDiscriminator?: Buffer
): z.infer<T> {
  const discriminator = data.slice(0, 8);

  if (expectedDiscriminator && !discriminator.equals(expectedDiscriminator)) {
    throw new Error("Account discriminator mismatch");
  }

  const accountData = data.slice(8);
  // In real usage, deserialize according to Borsh schema
  return schema.parse(accountData);
}

// Anchor context builder pattern
export interface AnchorContext {
  accounts: Record<string, PublicKey>;
  signers: PublicKey[];
  remainingAccounts?: PublicKey[];
}

export function buildAnchorContext(params: {
  accounts: Record<string, PublicKey | string>;
  signers?: (PublicKey | string)[];
  remainingAccounts?: (PublicKey | string)[];
}): AnchorContext {
  const toPublicKey = (key: PublicKey | string): PublicKey => {
    return typeof key === "string" ? new PublicKey(key) : key;
  };

  return {
    accounts: Object.fromEntries(
      Object.entries(params.accounts).map(([k, v]) => [k, toPublicKey(v)])
    ),
    signers: params.signers?.map(toPublicKey) ?? [],
    remainingAccounts: params.remainingAccounts?.map(toPublicKey),
  };
}

// IDL type helpers
export interface AnchorIdl {
  version: string;
  name: string;
  instructions: AnchorInstruction[];
  accounts?: AnchorAccountDef[];
  types?: AnchorTypeDef[];
  events?: AnchorEvent[];
  errors?: AnchorError[];
}

export interface AnchorInstruction {
  name: string;
  accounts: {
    name: string;
    isMut: boolean;
    isSigner: boolean;
  }[];
  args: {
    name: string;
    type: string | object;
  }[];
}

export interface AnchorAccountDef {
  name: string;
  type: {
    kind: "struct";
    fields: { name: string; type: string | object }[];
  };
}

export interface AnchorTypeDef {
  name: string;
  type: object;
}

export interface AnchorEvent {
  name: string;
  fields: { name: string; type: string; index: boolean }[];
}

export interface AnchorError {
  code: number;
  name: string;
  msg: string;
}

// Generate instruction accounts from IDL
export function generateInstructionAccounts(
  instruction: AnchorInstruction,
  context: AnchorContext
): { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] {
  return instruction.accounts.map((acc) => ({
    pubkey: context.accounts[acc.name],
    isSigner: acc.isSigner,
    isWritable: acc.isMut,
  }));
}
