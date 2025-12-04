/**
 * SPL Token utilities for Solana
 * Helpers for token account management and transfers
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { z } from "zod";

// Schemas
export const TokenBalanceSchema = z.object({
  mint: z.string(),
  owner: z.string(),
  amount: z.string(),
  decimals: z.number(),
  uiAmount: z.number(),
});

export type TokenBalance = z.infer<typeof TokenBalanceSchema>;

// Token Account Management
export async function getOrCreateAssociatedTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ address: PublicKey; instruction?: Transaction }> {
  const associatedToken = await getAssociatedTokenAddress(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  try {
    await getAccount(connection, associatedToken);
    return { address: associatedToken };
  } catch {
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        associatedToken,
        owner,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    return { address: associatedToken, instruction: transaction };
  }
}

// Token Balance Query
export async function getTokenBalance(
  connection: Connection,
  tokenAccount: PublicKey
): Promise<TokenBalance> {
  const account = await getAccount(connection, tokenAccount);
  const mint = await getMint(connection, account.mint);

  const uiAmount = Number(account.amount) / Math.pow(10, mint.decimals);

  return TokenBalanceSchema.parse({
    mint: account.mint.toBase58(),
    owner: account.owner.toBase58(),
    amount: account.amount.toString(),
    decimals: mint.decimals,
    uiAmount,
  });
}

// Get all token accounts for a wallet
export async function getWalletTokenAccounts(
  connection: Connection,
  wallet: PublicKey
): Promise<TokenBalance[]> {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });

  return tokenAccounts.value.map((account) => {
    const info = account.account.data.parsed.info;
    return TokenBalanceSchema.parse({
      mint: info.mint,
      owner: info.owner,
      amount: info.tokenAmount.amount,
      decimals: info.tokenAmount.decimals,
      uiAmount: info.tokenAmount.uiAmount,
    });
  });
}

// Transfer tokens
export async function createTokenTransferInstruction(params: {
  source: PublicKey;
  destination: PublicKey;
  owner: PublicKey;
  amount: bigint;
}): Promise<Transaction> {
  const { source, destination, owner, amount } = params;

  const transaction = new Transaction().add(
    createTransferInstruction(source, destination, owner, amount)
  );

  return transaction;
}

// Parse token amount with decimals
export function parseTokenAmount(amount: string | number, decimals: number): bigint {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.floor(numAmount * Math.pow(10, decimals)));
}

// Format token amount for display
export function formatTokenAmount(amount: bigint | string, decimals: number): string {
  const numAmount = typeof amount === "string" ? BigInt(amount) : amount;
  const divisor = BigInt(Math.pow(10, decimals));
  const whole = numAmount / divisor;
  const remainder = numAmount % divisor;

  if (remainder === 0n) {
    return whole.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, "0");
  const trimmed = remainderStr.replace(/0+$/, "");
  return `${whole}.${trimmed}`;
}
