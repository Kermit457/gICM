# Wallet Integration Expert

> **ID:** `wallet-integration`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** helius

## What This Skill Does

Complete Solana wallet integration including adapter setup, multi-wallet support (Phantom, Solflare, Backpack, Ledger), transaction signing flows, connection state management, and production UX patterns. Covers React hooks, vanilla JS, and mobile integration.

## When to Use

This skill is automatically loaded when:

- **Keywords:** wallet, phantom, solflare, backpack, connect, sign, disconnect
- **File Types:** .tsx, .ts, .jsx
- **Directories:** components/, hooks/, providers/

---

## Core Capabilities

### 1. Wallet Adapter Setup

Configure Solana wallet adapter for React applications.

**Installation:**

```bash
npm install @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js
```

**Provider Setup:**

```tsx
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: ReactNode;
  network?: 'devnet' | 'mainnet-beta';
  customEndpoint?: string;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
  network = 'mainnet-beta',
  customEndpoint,
}) => {
  const endpoint = useMemo(
    () => customEndpoint || clusterApiUrl(network),
    [network, customEndpoint]
  );

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
```

**App Integration:**

```tsx
import { WalletContextProvider } from './WalletContextProvider';

function App() {
  return (
    <WalletContextProvider
      network="mainnet-beta"
      customEndpoint="https://your-rpc.com"
    >
      <YourApp />
    </WalletContextProvider>
  );
}
```

**Best Practices:**

- Use custom RPC endpoints for production
- Enable autoConnect for returning users
- Import wallet adapter styles
- Memoize wallets array to prevent re-renders
- Handle network changes gracefully

---

### 2. Transaction Signing

Build and sign transactions with connected wallets.

**Basic Transaction Signing:**

```tsx
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';

export function useSendSol() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  async function sendSol(
    recipient: string,
    amount: number
  ): Promise<string> {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(recipient),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    const signature = await sendTransaction(transaction, connection);

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return signature;
  }

  return { sendSol, isReady: !!publicKey };
}
```

**Versioned Transaction Signing:**

```tsx
import { VersionedTransaction, TransactionMessage } from '@solana/web3.js';

export function useVersionedTransaction() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  async function signAndSendVersioned(
    instructions: TransactionInstruction[]
  ): Promise<string> {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const messageV0 = new TransactionMessage({
      payerKey: publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    const signedTx = await signTransaction(transaction);

    const signature = await connection.sendRawTransaction(signedTx.serialize());

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return signature;
  }

  return { signAndSendVersioned };
}
```

**Multi-Signature Transactions:**

```tsx
async function signMultipleTransactions(
  transactions: Transaction[]
): Promise<Transaction[]> {
  const { signAllTransactions } = useWallet();

  if (!signAllTransactions) {
    throw new Error('Wallet does not support signing multiple transactions');
  }

  return signAllTransactions(transactions);
}
```

---

### 3. Connection State Management

Handle wallet connection states and events.

**Custom Hook:**

```tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState, useCallback } from 'react';

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  shortAddress: string | null;
  walletName: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: Error | null;
}

export function useWalletState(): WalletState {
  const {
    publicKey,
    connected,
    connecting,
    wallet,
    connect,
    disconnect,
  } = useWallet();

  const [error, setError] = useState<Error | null>(null);

  const handleConnect = useCallback(async () => {
    try {
      setError(null);
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Connection failed'));
    }
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    try {
      setError(null);
      await disconnect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Disconnect failed'));
    }
  }, [disconnect]);

  const address = publicKey?.toString() || null;
  const shortAddress = address
    ? address.slice(0, 4) + '...' + address.slice(-4)
    : null;

  return {
    isConnected: connected,
    isConnecting: connecting,
    address,
    shortAddress,
    walletName: wallet?.adapter.name || null,
    connect: handleConnect,
    disconnect: handleDisconnect,
    error,
  };
}
```

**Connection Events:**

```tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

export function useWalletEvents(callbacks: {
  onConnect?: (publicKey: PublicKey) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}) {
  const { publicKey, connected, wallet } = useWallet();

  useEffect(() => {
    if (connected && publicKey && callbacks.onConnect) {
      callbacks.onConnect(publicKey);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (!connected && callbacks.onDisconnect) {
      callbacks.onDisconnect();
    }
  }, [connected]);

  useEffect(() => {
    const adapter = wallet?.adapter;
    if (!adapter) return;

    const handleError = (error: Error) => {
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    };

    adapter.on('error', handleError);
    return () => {
      adapter.off('error', handleError);
    };
  }, [wallet]);
}
```

---

### 4. Multi-Wallet Support

Support multiple wallet providers with unified interface.

**Wallet Selection Component:**

```tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletIcon } from '@solana/wallet-adapter-react-ui';

export function WalletSelector() {
  const { wallets, select, wallet, connected, disconnect } = useWallet();

  if (connected && wallet) {
    return (
      <div className="flex items-center gap-2">
        <WalletIcon wallet={wallet} />
        <span>{wallet.adapter.name}</span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {wallets.map((w) => (
        <button
          key={w.adapter.name}
          onClick={() => select(w.adapter.name)}
          disabled={w.readyState !== 'Installed'}
          className="flex items-center gap-2 p-2 border rounded"
        >
          <WalletIcon wallet={w} />
          <span>{w.adapter.name}</span>
          {w.readyState !== 'Installed' && (
            <span className="text-xs text-gray-500">Not installed</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

**Wallet Detection:**

```tsx
interface WalletInfo {
  name: string;
  installed: boolean;
  icon: string;
  url: string;
}

export function useDetectedWallets(): WalletInfo[] {
  const { wallets } = useWallet();

  return wallets.map((w) => ({
    name: w.adapter.name,
    installed: w.readyState === 'Installed',
    icon: w.adapter.icon,
    url: w.adapter.url,
  }));
}
```

---

## Real-World Examples

### Example 1: Complete Wallet Button

```tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';

export function WalletButton() {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [showMenu, setShowMenu] = useState(false);

  if (connecting) {
    return (
      <button disabled className="btn-primary opacity-50">
        Connecting...
      </button>
    );
  }

  if (connected && publicKey) {
    const shortAddress = publicKey.toString().slice(0, 4) + '...' + publicKey.toString().slice(-4);

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="btn-primary"
        >
          {shortAddress}
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg">
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey.toString());
                setShowMenu(false);
              }}
              className="w-full p-2 text-left hover:bg-gray-100"
            >
              Copy Address
            </button>
            <a
              href={'https://solscan.io/account/' + publicKey.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 hover:bg-gray-100"
            >
              View on Solscan
            </a>
            <button
              onClick={() => {
                disconnect();
                setShowMenu(false);
              }}
              className="w-full p-2 text-left text-red-600 hover:bg-gray-100"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={() => setVisible(true)} className="btn-primary">
      Connect Wallet
    </button>
  );
}
```

### Example 2: Transaction Builder with UI

```tsx
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

interface TransactionStatus {
  status: 'idle' | 'building' | 'signing' | 'sending' | 'confirming' | 'success' | 'error';
  message?: string;
  signature?: string;
}

export function SendSolForm() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ status: 'idle' });

  async function handleSend() {
    if (!publicKey) {
      setTxStatus({ status: 'error', message: 'Wallet not connected' });
      return;
    }

    try {
      setTxStatus({ status: 'building' });

      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipient);
      } catch {
        throw new Error('Invalid recipient address');
      }

      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
      if (isNaN(lamports) || lamports <= 0) {
        throw new Error('Invalid amount');
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      setTxStatus({ status: 'signing' });
      const signature = await sendTransaction(transaction, connection);

      setTxStatus({ status: 'confirming', signature });

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      setTxStatus({ status: 'success', signature });
      setRecipient('');
      setAmount('');
    } catch (error) {
      setTxStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Transaction failed',
      });
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">Send SOL</h2>

      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        placeholder="Amount in SOL"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        onClick={handleSend}
        disabled={txStatus.status !== 'idle' && txStatus.status !== 'success' && txStatus.status !== 'error'}
        className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {txStatus.status === 'idle' || txStatus.status === 'success' || txStatus.status === 'error'
          ? 'Send'
          : txStatus.status === 'building'
          ? 'Building...'
          : txStatus.status === 'signing'
          ? 'Sign in wallet...'
          : txStatus.status === 'sending'
          ? 'Sending...'
          : 'Confirming...'}
      </button>

      {txStatus.status === 'success' && txStatus.signature && (
        <div className="p-2 bg-green-100 rounded">
          <p className="text-green-800">Transaction successful!</p>
          <a
            href={'https://solscan.io/tx/' + txStatus.signature}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            View on Solscan
          </a>
        </div>
      )}

      {txStatus.status === 'error' && (
        <div className="p-2 bg-red-100 rounded">
          <p className="text-red-800">{txStatus.message}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Message Signing for Authentication

```tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import bs58 from 'bs58';

interface AuthState {
  authenticated: boolean;
  signature?: string;
  message?: string;
}

export function useWalletAuth() {
  const { publicKey, signMessage } = useWallet();
  const [authState, setAuthState] = useState<AuthState>({ authenticated: false });

  async function authenticate(): Promise<boolean> {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet does not support message signing');
    }

    const timestamp = Date.now();
    const message = 'Sign this message to authenticate.\n\nTimestamp: ' + timestamp + '\nAddress: ' + publicKey.toString();

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);

      const isValid = await verifySignature(publicKey.toString(), message, signatureBase58);

      if (isValid) {
        setAuthState({
          authenticated: true,
          signature: signatureBase58,
          message,
        });
        return true;
      }

      return false;
    } catch {
      setAuthState({ authenticated: false });
      return false;
    }
  }

  function logout() {
    setAuthState({ authenticated: false });
  }

  return {
    authenticated: authState.authenticated,
    authenticate,
    logout,
    signature: authState.signature,
  };
}

async function verifySignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  const { sign } = await import('tweetnacl');
  const publicKey = bs58.decode(address);
  const signatureBytes = bs58.decode(signature);
  const messageBytes = new TextEncoder().encode(message);

  return sign.detached.verify(messageBytes, signatureBytes, publicKey);
}
```

---

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletContextProvider } from './WalletContextProvider';
import { WalletButton } from './WalletButton';

const mockWallet = {
  publicKey: { toString: () => 'TestAddress123456789' },
  connected: false,
  connecting: false,
  disconnect: jest.fn(),
};

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockWallet,
}));

describe('WalletButton', () => {
  test('shows connect button when disconnected', () => {
    render(
      <WalletContextProvider>
        <WalletButton />
      </WalletContextProvider>
    );

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });
});
```

---

## Security Considerations

1. **Never request private keys** from users
2. **Validate all transaction parameters** before signing
3. **Show transaction details** in confirmation dialogs
4. **Use secure RPC endpoints** with authentication
5. **Handle wallet disconnection** gracefully
6. **Implement session timeouts** for authenticated users
7. **Verify signatures server-side** for authentication

---

## Related Skills

- **jupiter-trader** - Token swaps with wallet
- **solana-reader** - Read wallet data
- **solana-deployer** - Deploy programs

---

## Further Reading

- Wallet Adapter: https://github.com/solana-labs/wallet-adapter
- Phantom Docs: https://docs.phantom.app/
- Solflare Docs: https://docs.solflare.com/

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
