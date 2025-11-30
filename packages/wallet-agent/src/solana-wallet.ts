import type { AgentContext, AgentResult } from "@gicm/agent-core";
import type { WalletCommand, WalletAgentConfig } from "./types.js";
import { parseAmount } from "./parser.js";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

// Solana Agent Kit types (optional dependency) - using 'any' for flexibility
// The actual API may vary by version
type SolanaAgentKitInstance = {
  wallet_address: PublicKey;
  transfer: (to: PublicKey, amount: number, mint?: PublicKey) => Promise<string>;
  trade: (
    outputMint: PublicKey,
    inputAmount: number,
    inputMint?: PublicKey,
    slippageBps?: number
  ) => Promise<string>;
  deployToken: (...args: unknown[]) => Promise<{ mint: PublicKey }>;
};

export class SolanaWalletProvider {
  private config: WalletAgentConfig;
  private address: string | null = null;
  private rpcUrl: string;
  private connection: Connection | null = null;
  private keypair: Keypair | null = null;
  private agentKit: SolanaAgentKitInstance | null = null;

  constructor(config: WalletAgentConfig) {
    this.config = config;
    this.rpcUrl = this.getRpcUrl();
  }

  async initialize(): Promise<string> {
    // Initialize connection
    this.connection = new Connection(this.rpcUrl, "confirmed");

    // Initialize keypair from private key if provided
    if (this.config.privateKey) {
      try {
        // Support both base58 and JSON array formats
        let secretKey: Uint8Array;
        if (this.config.privateKey.startsWith("[")) {
          // JSON array format
          secretKey = Uint8Array.from(JSON.parse(this.config.privateKey));
        } else {
          // Base58 format - decode using base64 fallback
          // Try base64 first (more common in env vars)
          try {
            secretKey = Uint8Array.from(
              Buffer.from(this.config.privateKey, "base64")
            );
            // Validate length (64 bytes for ed25519)
            if (secretKey.length !== 64) {
              throw new Error("Invalid key length");
            }
          } catch {
            // Fallback: try as raw bytes encoded as hex or utf8
            secretKey = Uint8Array.from(
              Buffer.from(this.config.privateKey, "hex")
            );
          }
        }
        this.keypair = Keypair.fromSecretKey(secretKey);
        this.address = this.keypair.publicKey.toBase58();
      } catch {
        // Silent fail for security - don't leak key format errors
        this.address = null;
      }
    }

    // Try to initialize Solana Agent Kit for advanced features
    try {
      const solanaAgentKit = await import("solana-agent-kit").catch(() => null);
      if (solanaAgentKit && this.config.privateKey) {
        const { SolanaAgentKit } = solanaAgentKit;
        this.agentKit = new SolanaAgentKit(
          this.config.privateKey,
          this.rpcUrl,
          { OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "" }
        ) as SolanaAgentKitInstance;
        if (this.agentKit?.wallet_address) {
          this.address = this.agentKit.wallet_address.toBase58();
        }
      }
    } catch {
      // Solana Agent Kit not available - use basic functionality
    }

    return this.address ?? "not-initialized";
  }

  async executeCommand(
    command: WalletCommand,
    context: AgentContext
  ): Promise<AgentResult> {
    switch (command.action) {
      case "balance":
        return this.getBalance(command.address);
      case "transfer":
        return this.transfer(command.to, command.amount, command.token);
      case "swap":
        return this.swap(
          command.inputToken,
          command.outputToken,
          command.amount,
          command.slippage
        );
      case "deploy_token":
        return this.deployToken(
          command.name,
          command.symbol,
          command.decimals,
          command.initialSupply
        );
      default:
        return {
          agent: "wallet-agent",
          success: false,
          error: `Unsupported action: ${(command as WalletCommand).action}`,
          timestamp: Date.now(),
        };
    }
  }

  private async getBalance(address?: string): Promise<AgentResult> {
    const targetAddress = address || this.address;
    if (!targetAddress) {
      return {
        agent: "wallet-agent",
        success: false,
        error: "No wallet address available",
        timestamp: Date.now(),
      };
    }

    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getBalance",
        params: [targetAddress],
        id: 1,
      }),
    });

    const data = (await response.json()) as { result?: { value?: number } };
    const lamports = data.result?.value ?? 0;
    const balance = parseAmount(BigInt(lamports), 9);

    return {
      agent: "wallet-agent",
      success: true,
      data: {
        address: targetAddress,
        balance,
        symbol: "SOL",
        network: this.config.network,
      },
      timestamp: Date.now(),
    };
  }

  private async transfer(
    to: string,
    amount: string,
    token?: string
  ): Promise<AgentResult> {
    // Try Solana Agent Kit first (supports SPL tokens via Jupiter)
    if (this.agentKit) {
      try {
        const toPublicKey = new PublicKey(to);
        const amountNum = parseFloat(amount);
        const mintKey = token ? new PublicKey(token) : undefined;

        const txSignature = await this.agentKit.transfer(
          toPublicKey,
          amountNum,
          mintKey
        );

        return {
          agent: "wallet-agent",
          success: true,
          data: {
            signature: txSignature,
            to,
            amount,
            token: token ?? "SOL",
            explorer: `https://solscan.io/tx/${txSignature}`,
          },
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          agent: "wallet-agent",
          success: false,
          error: error instanceof Error ? error.message : "Transfer failed",
          data: { to, amount, token },
          timestamp: Date.now(),
        };
      }
    }

    // Fallback: Basic SOL transfer using web3.js
    if (!this.keypair || !this.connection) {
      return {
        agent: "wallet-agent",
        success: false,
        error: "Wallet not initialized. Provide privateKey in config.",
        data: { to, amount, token },
        timestamp: Date.now(),
      };
    }

    if (token) {
      return {
        agent: "wallet-agent",
        success: false,
        error: "SPL token transfer requires Solana Agent Kit. Install: pnpm add solana-agent-kit",
        data: { to, amount, token },
        timestamp: Date.now(),
      };
    }

    try {
      const toPublicKey = new PublicKey(to);
      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.keypair.publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair]
      );

      return {
        agent: "wallet-agent",
        success: true,
        data: {
          signature,
          to,
          amount,
          token: "SOL",
          explorer: `https://solscan.io/tx/${signature}`,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        agent: "wallet-agent",
        success: false,
        error: error instanceof Error ? error.message : "Transfer failed",
        data: { to, amount, token },
        timestamp: Date.now(),
      };
    }
  }

  private async swap(
    inputToken: string,
    outputToken: string,
    amount: string,
    slippage: number
  ): Promise<AgentResult> {
    if (!this.agentKit) {
      return {
        agent: "wallet-agent",
        success: false,
        error: "Jupiter swap requires Solana Agent Kit. Install: pnpm add solana-agent-kit",
        data: { inputToken, outputToken, amount, slippage, dex: "Jupiter" },
        timestamp: Date.now(),
      };
    }

    try {
      const outputMint = new PublicKey(outputToken);
      const inputMint = inputToken.toLowerCase() === "sol"
        ? undefined
        : new PublicKey(inputToken);
      const amountNum = parseFloat(amount);
      const slippageBps = Math.floor(slippage * 100); // Convert 0.5% to 50 bps

      const txSignature = await this.agentKit.trade(
        outputMint,
        amountNum,
        inputMint,
        slippageBps
      );

      return {
        agent: "wallet-agent",
        success: true,
        data: {
          signature: txSignature,
          inputToken,
          outputToken,
          amount,
          slippage,
          dex: "Jupiter",
          explorer: `https://solscan.io/tx/${txSignature}`,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        agent: "wallet-agent",
        success: false,
        error: error instanceof Error ? error.message : "Swap failed",
        data: { inputToken, outputToken, amount, slippage, dex: "Jupiter" },
        timestamp: Date.now(),
      };
    }
  }

  private async deployToken(
    name: string,
    symbol: string,
    decimals: number,
    initialSupply?: string
  ): Promise<AgentResult> {
    if (!this.agentKit) {
      return {
        agent: "wallet-agent",
        success: false,
        error: "Token deployment requires Solana Agent Kit. Install: pnpm add solana-agent-kit",
        data: { name, symbol, decimals, initialSupply },
        timestamp: Date.now(),
      };
    }

    try {
      const supply = initialSupply ? parseInt(initialSupply, 10) : undefined;

      const result = await this.agentKit.deployToken(
        name,
        "", // URI - can be added to config later
        symbol,
        decimals,
        supply
      );

      return {
        agent: "wallet-agent",
        success: true,
        data: {
          mint: result.mint.toBase58(),
          name,
          symbol,
          decimals,
          initialSupply: supply,
          explorer: `https://solscan.io/token/${result.mint.toBase58()}`,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        agent: "wallet-agent",
        success: false,
        error: error instanceof Error ? error.message : "Token deployment failed",
        data: { name, symbol, decimals, initialSupply },
        timestamp: Date.now(),
      };
    }
  }

  private getRpcUrl(): string {
    const rpcUrls: Record<string, string> = {
      "mainnet-beta": "https://api.mainnet-beta.solana.com",
      devnet: "https://api.devnet.solana.com",
      testnet: "https://api.testnet.solana.com",
    };
    return rpcUrls[this.config.network] || rpcUrls["mainnet-beta"];
  }
}
