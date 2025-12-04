# Solana Deployer

> **ID:** `solana-deployer`
> **Tier:** 2
> **Token Cost:** 7000
> **MCP Connections:** solana, helius

## What This Skill Does

Complete Solana program deployment lifecycle management including devnet/mainnet deployments, program upgrades, buffer account management, upgrade authority handling, and deployment automation. Covers both native Solana programs and Anchor framework deployments.

## When to Use

This skill is automatically loaded when:

- **Keywords:** deploy, devnet, mainnet, upgrade, program, buffer, authority
- **File Types:** .rs, .so, .toml
- **Directories:** programs/, target/deploy/

---

## Core Capabilities

### 1. Program Deployment

Deploy Solana programs to devnet or mainnet using the Solana CLI or programmatic deployment.

**CLI Deployment:**

```bash
# Build program
cargo build-bpf

# Deploy to devnet
solana program deploy target/deploy/my_program.so --url devnet

# Deploy to mainnet with specific keypair
solana program deploy target/deploy/my_program.so \
  --url mainnet-beta \
  --keypair ~/.config/solana/deployer.json \
  --program-id my_program-keypair.json

# Deploy with priority fee
solana program deploy target/deploy/my_program.so \
  --url mainnet-beta \
  --with-compute-unit-price 1000
```

**Anchor Deployment:**

```bash
# Build and deploy with Anchor
anchor build
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet

# Deploy specific program
anchor deploy --program-name my_program --provider.cluster mainnet
```

**Programmatic Deployment:**

```typescript
import {
  Connection,
  Keypair,
  PublicKey,
  BpfLoader,
  BPF_LOADER_PROGRAM_ID,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as fs from 'fs';

interface DeployConfig {
  programPath: string;
  programKeypair: Keypair;
  payerKeypair: Keypair;
  cluster: 'devnet' | 'mainnet-beta' | 'localnet';
}

async function deployProgram(config: DeployConfig): Promise<PublicKey> {
  const { programPath, programKeypair, payerKeypair, cluster } = config;

  const endpoints: Record<string, string> = {
    'devnet': 'https://api.devnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
    'localnet': 'http://localhost:8899',
  };

  const connection = new Connection(endpoints[cluster], 'confirmed');

  // Read program binary
  const programData = fs.readFileSync(programPath);
  console.log('Program size:', programData.length, 'bytes');

  // Calculate rent
  const programRent = await connection.getMinimumBalanceForRentExemption(
    programData.length
  );

  console.log('Required rent:', programRent / 1e9, 'SOL');

  // Check payer balance
  const payerBalance = await connection.getBalance(payerKeypair.publicKey);
  if (payerBalance < programRent + 1e9) {
    throw new Error('Insufficient balance for deployment');
  }

  // Deploy using BpfLoader
  console.log('Deploying program...');

  const programId = await BpfLoader.load(
    connection,
    payerKeypair,
    programKeypair,
    programData,
    BPF_LOADER_PROGRAM_ID
  );

  console.log('Program deployed:', programId.toString());

  return programId;
}
```

**Best Practices:**

- Always test on devnet before mainnet deployment
- Use dedicated deployer keypair with limited funds
- Store program keypair securely for upgrades
- Verify program after deployment using solana program show
- Set up CI/CD for automated deployments
- Use priority fees during network congestion

**Common Gotchas:**

- Program binary must be under 10MB (or split into chunks)
- Deployer needs sufficient SOL for rent and transaction fees
- Program ID is derived from the program keypair
- First deployment creates immutable program unless upgradeable

---

### 2. Devnet/Mainnet Management

Manage deployments across different Solana clusters with environment-specific configurations.

**Environment Configuration:**

```typescript
interface ClusterConfig {
  name: 'devnet' | 'mainnet-beta' | 'localnet';
  endpoint: string;
  wsEndpoint: string;
  programIds: Record<string, string>;
  feePayer: string;
}

const CLUSTER_CONFIGS: Record<string, ClusterConfig> = {
  devnet: {
    name: 'devnet',
    endpoint: 'https://api.devnet.solana.com',
    wsEndpoint: 'wss://api.devnet.solana.com',
    programIds: {
      myProgram: 'DevnetProgramId11111111111111111111111111',
    },
    feePayer: 'devnet-deployer.json',
  },
  mainnet: {
    name: 'mainnet-beta',
    endpoint: 'https://api.mainnet-beta.solana.com',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com',
    programIds: {
      myProgram: 'MainnetProgramId1111111111111111111111111',
    },
    feePayer: 'mainnet-deployer.json',
  },
  localnet: {
    name: 'localnet',
    endpoint: 'http://localhost:8899',
    wsEndpoint: 'ws://localhost:8900',
    programIds: {
      myProgram: 'LocalProgramId111111111111111111111111111',
    },
    feePayer: 'local-deployer.json',
  },
};

function getClusterConfig(env: string): ClusterConfig {
  const config = CLUSTER_CONFIGS[env];
  if (!config) {
    throw new Error('Unknown cluster: ' + env);
  }
  return config;
}
```

**Anchor Configuration:**

```toml
# Anchor.toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
my_program = "DevnetProgramId11111111111111111111111111"

[programs.mainnet]
my_program = "MainnetProgramId1111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[test]
startup_wait = 5000

[test.validator]
url = "https://api.devnet.solana.com"
```

**Multi-Cluster Deployment Script:**

```typescript
import { execSync } from 'child_process';

interface DeploymentResult {
  cluster: string;
  programId: string;
  txSignature: string;
  timestamp: number;
}

async function deployToCluster(cluster: string): Promise<DeploymentResult> {
  console.log('Deploying to', cluster + '...');

  // Build program
  execSync('anchor build', { stdio: 'inherit' });

  // Deploy
  const output = execSync(
    'anchor deploy --provider.cluster ' + cluster,
    { encoding: 'utf8' }
  );

  // Parse program ID from output
  const programIdMatch = output.match(/Program Id: (\w+)/);
  const txMatch = output.match(/Signature: (\w+)/);

  return {
    cluster,
    programId: programIdMatch ? programIdMatch[1] : 'unknown',
    txSignature: txMatch ? txMatch[1] : 'unknown',
    timestamp: Date.now(),
  };
}

async function deployPipeline() {
  const results: DeploymentResult[] = [];

  // Deploy to devnet first
  results.push(await deployToCluster('devnet'));
  console.log('Devnet deployment complete');

  // Run integration tests on devnet
  console.log('Running integration tests...');
  execSync('anchor test --provider.cluster devnet', { stdio: 'inherit' });

  // Prompt for mainnet deployment
  console.log('Devnet tests passed. Ready for mainnet deployment.');

  // Deploy to mainnet
  results.push(await deployToCluster('mainnet'));
  console.log('Mainnet deployment complete');

  return results;
}
```

**Best Practices:**

- Maintain separate program IDs for each cluster
- Use environment variables for sensitive configurations
- Implement deployment gates (tests must pass before mainnet)
- Keep deployment logs with timestamps and signatures
- Use dedicated RPC endpoints for production deployments

---

### 3. Upgrade Authority

Manage program upgrade authority for secure program updates.

**Upgrade Authority Concepts:**

```typescript
// Program accounts structure for upgradeable programs
interface ProgramAccountInfo {
  programDataAccount: PublicKey;    // Holds program binary
  upgradeAuthority: PublicKey | null; // Can upgrade program
  slot: number;                      // Last deployed slot
}

// Upgradeable Loader Program
const UPGRADEABLE_LOADER = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111'
);
```

**Get Program Info:**

```typescript
import {
  Connection,
  PublicKey,
} from '@solana/web3.js';

interface ProgramInfo {
  programId: string;
  programDataAccount: string;
  upgradeAuthority: string | null;
  lastDeploySlot: number;
  dataLen: number;
}

async function getProgramInfo(
  connection: Connection,
  programId: PublicKey
): Promise<ProgramInfo> {
  const programAccountInfo = await connection.getAccountInfo(programId);

  if (!programAccountInfo) {
    throw new Error('Program not found');
  }

  // Parse program account data
  // First byte is account type (2 = Program)
  // Next 32 bytes are program data account address
  const programDataAccount = new PublicKey(
    programAccountInfo.data.slice(4, 36)
  );

  const programDataInfo = await connection.getAccountInfo(programDataAccount);

  if (!programDataInfo) {
    throw new Error('Program data account not found');
  }

  // Parse program data account
  // Byte 0-3: Account type
  // Byte 4-11: Slot
  // Byte 12-44: Upgrade authority (or none)
  const slot = programDataInfo.data.readBigUInt64LE(4);

  const authorityOption = programDataInfo.data[12];
  let upgradeAuthority: string | null = null;

  if (authorityOption === 1) {
    upgradeAuthority = new PublicKey(
      programDataInfo.data.slice(13, 45)
    ).toString();
  }

  return {
    programId: programId.toString(),
    programDataAccount: programDataAccount.toString(),
    upgradeAuthority,
    lastDeploySlot: Number(slot),
    dataLen: programDataInfo.data.length,
  };
}
```

**Transfer Upgrade Authority:**

```typescript
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

async function transferUpgradeAuthority(
  connection: Connection,
  currentAuthority: Keypair,
  programId: PublicKey,
  newAuthority: PublicKey
): Promise<string> {
  const programInfo = await getProgramInfo(connection, programId);

  const programDataAccount = new PublicKey(programInfo.programDataAccount);

  // Create SetAuthority instruction
  const instruction = {
    programId: UPGRADEABLE_LOADER,
    keys: [
      { pubkey: programDataAccount, isSigner: false, isWritable: true },
      { pubkey: currentAuthority.publicKey, isSigner: true, isWritable: false },
      { pubkey: newAuthority, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([4]), // SetAuthority instruction
  };

  const transaction = new Transaction().add(instruction);

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [currentAuthority]
  );

  console.log('Authority transferred:', signature);
  return signature;
}
```

**Revoke Upgrade Authority (Make Immutable):**

```typescript
async function revokeUpgradeAuthority(
  connection: Connection,
  currentAuthority: Keypair,
  programId: PublicKey
): Promise<string> {
  const programInfo = await getProgramInfo(connection, programId);

  const programDataAccount = new PublicKey(programInfo.programDataAccount);

  // SetAuthority to None
  const instruction = {
    programId: UPGRADEABLE_LOADER,
    keys: [
      { pubkey: programDataAccount, isSigner: false, isWritable: true },
      { pubkey: currentAuthority.publicKey, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([4, 0]), // SetAuthority with None option
  };

  const transaction = new Transaction().add(instruction);

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [currentAuthority]
  );

  console.log('Upgrade authority revoked. Program is now immutable.');
  return signature;
}
```

**Multi-Sig Upgrade Authority:**

```typescript
// Using Squads multisig for upgrade authority
import { Squads } from '@sqds/sdk';

async function setupMultisigAuthority(
  connection: Connection,
  programId: PublicKey,
  members: PublicKey[],
  threshold: number
): Promise<PublicKey> {
  const squads = Squads.endpoint(connection.rpcEndpoint);

  // Create multisig
  const multisigAccount = await squads.createMultisig(
    threshold,
    members,
    'Program Upgrade Multisig'
  );

  console.log('Multisig created:', multisigAccount.publicKey.toString());

  // Transfer upgrade authority to multisig
  // ... transfer authority implementation

  return multisigAccount.publicKey;
}
```

**Best Practices:**

- Use multisig for mainnet upgrade authority
- Never expose upgrade authority private keys
- Document authority transfer procedures
- Consider time-locked upgrades for sensitive programs
- Test upgrade process on devnet before mainnet

---

### 4. Buffer Accounts

Manage buffer accounts for large program uploads and upgrades.

**Buffer Account Lifecycle:**

```typescript
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

const UPGRADEABLE_LOADER = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111'
);

interface BufferInfo {
  bufferAddress: string;
  authority: string | null;
  dataLen: number;
}

async function createBuffer(
  connection: Connection,
  payer: Keypair,
  authority: PublicKey,
  programLen: number
): Promise<Keypair> {
  const buffer = Keypair.generate();

  // Calculate buffer account size
  // Header: 37 bytes (1 byte type + 4 bytes padding + 32 bytes authority)
  const bufferSize = 37 + programLen;

  const lamports = await connection.getMinimumBalanceForRentExemption(bufferSize);

  // Create buffer account
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: buffer.publicKey,
    lamports,
    space: bufferSize,
    programId: UPGRADEABLE_LOADER,
  });

  // Initialize buffer
  const initBufferIx = {
    programId: UPGRADEABLE_LOADER,
    keys: [
      { pubkey: buffer.publicKey, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([0]), // InitializeBuffer instruction
  };

  const transaction = new Transaction()
    .add(createAccountIx)
    .add(initBufferIx);

  await sendAndConfirmTransaction(connection, transaction, [payer, buffer]);

  console.log('Buffer created:', buffer.publicKey.toString());
  return buffer;
}

async function writeToBuffer(
  connection: Connection,
  authority: Keypair,
  buffer: PublicKey,
  programData: Buffer
): Promise<void> {
  const CHUNK_SIZE = 900; // Safe chunk size for transaction limits
  const chunks = Math.ceil(programData.length / CHUNK_SIZE);

  console.log('Writing', chunks, 'chunks to buffer...');

  for (let i = 0; i < chunks; i++) {
    const offset = i * CHUNK_SIZE;
    const chunk = programData.slice(offset, offset + CHUNK_SIZE);

    const writeIx = {
      programId: UPGRADEABLE_LOADER,
      keys: [
        { pubkey: buffer, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: false },
      ],
      data: Buffer.concat([
        Buffer.from([1]), // Write instruction
        Buffer.from(new Uint32Array([offset]).buffer), // Offset
        chunk,
      ]),
    };

    const transaction = new Transaction().add(writeIx);
    await sendAndConfirmTransaction(connection, transaction, [authority]);

    console.log('Chunk', i + 1, '/', chunks, 'written');
  }

  console.log('Buffer write complete');
}
```

**Deploy from Buffer:**

```typescript
async function deployFromBuffer(
  connection: Connection,
  payer: Keypair,
  programKeypair: Keypair,
  buffer: PublicKey,
  upgradeAuthority: PublicKey
): Promise<PublicKey> {
  // Calculate program data account address
  const [programDataAccount] = PublicKey.findProgramAddressSync(
    [programKeypair.publicKey.toBuffer()],
    UPGRADEABLE_LOADER
  );

  const programAccountSize = 36; // Program account header
  const programAccountRent = await connection.getMinimumBalanceForRentExemption(
    programAccountSize
  );

  // Create program account
  const createProgramIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: programKeypair.publicKey,
    lamports: programAccountRent,
    space: programAccountSize,
    programId: UPGRADEABLE_LOADER,
  });

  // Deploy from buffer instruction
  const deployIx = {
    programId: UPGRADEABLE_LOADER,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: programDataAccount, isSigner: false, isWritable: true },
      { pubkey: programKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: buffer, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: upgradeAuthority, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([2, 0, 0, 0]), // DeployWithMaxDataLen instruction
  };

  const transaction = new Transaction()
    .add(createProgramIx)
    .add(deployIx);

  await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, programKeypair]
  );

  console.log('Program deployed:', programKeypair.publicKey.toString());
  return programKeypair.publicKey;
}
```

**Close Buffer (Reclaim Rent):**

```typescript
async function closeBuffer(
  connection: Connection,
  authority: Keypair,
  buffer: PublicKey,
  recipient: PublicKey
): Promise<string> {
  const closeIx = {
    programId: UPGRADEABLE_LOADER,
    keys: [
      { pubkey: buffer, isSigner: false, isWritable: true },
      { pubkey: recipient, isSigner: false, isWritable: true },
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([5]), // Close instruction
  };

  const transaction = new Transaction().add(closeIx);

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [authority]
  );

  console.log('Buffer closed, rent reclaimed:', signature);
  return signature;
}
```

**List Buffers:**

```typescript
async function listBuffers(
  connection: Connection,
  authority: PublicKey
): Promise<BufferInfo[]> {
  const accounts = await connection.getProgramAccounts(UPGRADEABLE_LOADER, {
    filters: [
      { dataSize: 37 }, // Buffer header size (without data)
      {
        memcmp: {
          offset: 5, // Authority offset in buffer account
          bytes: authority.toBase58(),
        },
      },
    ],
  });

  return accounts.map(({ pubkey, account }) => ({
    bufferAddress: pubkey.toString(),
    authority: authority.toString(),
    dataLen: account.data.length,
  }));
}
```

---

## Program Upgrades

**Upgrade Existing Program:**

```typescript
async function upgradeProgram(
  connection: Connection,
  upgradeAuthority: Keypair,
  programId: PublicKey,
  buffer: PublicKey,
  spillAccount: PublicKey
): Promise<string> {
  const programInfo = await getProgramInfo(connection, programId);
  const programDataAccount = new PublicKey(programInfo.programDataAccount);

  const upgradeIx = {
    programId: UPGRADEABLE_LOADER,
    keys: [
      { pubkey: programDataAccount, isSigner: false, isWritable: true },
      { pubkey: programId, isSigner: false, isWritable: true },
      { pubkey: buffer, isSigner: false, isWritable: true },
      { pubkey: spillAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: upgradeAuthority.publicKey, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([3]), // Upgrade instruction
  };

  const transaction = new Transaction().add(upgradeIx);

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [upgradeAuthority]
  );

  console.log('Program upgraded:', signature);
  return signature;
}
```

**Full Upgrade Workflow:**

```typescript
import * as fs from 'fs';

async function fullUpgradeWorkflow(
  connection: Connection,
  upgradeAuthority: Keypair,
  programId: PublicKey,
  newProgramPath: string
): Promise<string> {
  console.log('Starting upgrade workflow...');

  // 1. Read new program binary
  const programData = fs.readFileSync(newProgramPath);
  console.log('New program size:', programData.length, 'bytes');

  // 2. Create buffer
  const buffer = await createBuffer(
    connection,
    upgradeAuthority,
    upgradeAuthority.publicKey,
    programData.length
  );

  // 3. Write program to buffer
  await writeToBuffer(
    connection,
    upgradeAuthority,
    buffer.publicKey,
    programData
  );

  // 4. Upgrade program
  const signature = await upgradeProgram(
    connection,
    upgradeAuthority,
    programId,
    buffer.publicKey,
    upgradeAuthority.publicKey // Spill account receives buffer rent
  );

  // 5. Verify upgrade
  const newProgramInfo = await getProgramInfo(connection, programId);
  console.log('Program upgraded at slot:', newProgramInfo.lastDeploySlot);

  return signature;
}
```

---

## Real-World Examples

### Example 1: Anchor Project Deployment

```typescript
import { execSync } from 'child_process';
import * as fs from 'fs';

interface AnchorDeployResult {
  programId: string;
  cluster: string;
  idlAddress?: string;
  txSignature: string;
}

async function deployAnchorProject(
  cluster: 'devnet' | 'mainnet'
): Promise<AnchorDeployResult> {
  // 1. Build
  console.log('Building Anchor project...');
  execSync('anchor build', { stdio: 'inherit' });

  // 2. Get program ID from keypair
  const keypairPath = 'target/deploy/my_program-keypair.json';
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  const programKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  const programId = programKeypair.publicKey.toString();

  // 3. Deploy program
  console.log('Deploying to', cluster + '...');
  const deployOutput = execSync(
    'anchor deploy --provider.cluster ' + cluster,
    { encoding: 'utf8' }
  );

  // 4. Upload IDL
  console.log('Uploading IDL...');
  const idlOutput = execSync(
    'anchor idl init --filepath target/idl/my_program.json --provider.cluster ' + cluster + ' ' + programId,
    { encoding: 'utf8' }
  );

  const idlMatch = idlOutput.match(/Idl account: (\w+)/);

  return {
    programId,
    cluster,
    idlAddress: idlMatch ? idlMatch[1] : undefined,
    txSignature: deployOutput.match(/Signature: (\w+)/)?.[1] || '',
  };
}
```

### Example 2: CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Solana Program

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      cluster:
        description: 'Target cluster'
        required: true
        default: 'devnet'
        type: choice
        options:
          - devnet
          - mainnet

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Solana
        uses: metaplex-foundation/actions/install-solana@v1
        with:
          version: 1.17.0

      - name: Setup Anchor
        run: |
          npm install -g @coral-xyz/anchor-cli
          anchor --version

      - name: Build
        run: anchor build

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: program-binary
          path: target/deploy/

  deploy-devnet:
    needs: build
    runs-on: ubuntu-latest
    if: github.event.inputs.cluster == 'devnet' || github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3

      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: program-binary
          path: target/deploy/

      - name: Setup Solana
        uses: metaplex-foundation/actions/install-solana@v1

      - name: Configure
        run: |
          solana config set --url devnet
          echo "${{ secrets.DEVNET_DEPLOYER_KEY }}" > deployer.json
          solana config set --keypair deployer.json

      - name: Deploy
        run: |
          solana program deploy target/deploy/my_program.so \
            --program-id target/deploy/my_program-keypair.json

  deploy-mainnet:
    needs: [build, deploy-devnet]
    runs-on: ubuntu-latest
    if: github.event.inputs.cluster == 'mainnet'
    environment: mainnet
    steps:
      - uses: actions/checkout@v3

      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: program-binary
          path: target/deploy/

      - name: Setup Solana
        uses: metaplex-foundation/actions/install-solana@v1

      - name: Configure
        run: |
          solana config set --url mainnet-beta
          echo "${{ secrets.MAINNET_DEPLOYER_KEY }}" > deployer.json
          solana config set --keypair deployer.json

      - name: Deploy
        run: |
          solana program deploy target/deploy/my_program.so \
            --program-id target/deploy/my_program-keypair.json \
            --with-compute-unit-price 5000
```

### Example 3: Programmatic Upgrade with Verification

```typescript
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface UpgradeVerification {
  programId: string;
  previousHash: string;
  newHash: string;
  upgradeSignature: string;
  verified: boolean;
}

async function upgradeWithVerification(
  connection: Connection,
  upgradeAuthority: Keypair,
  programId: PublicKey,
  newProgramPath: string
): Promise<UpgradeVerification> {
  // 1. Get current program hash
  const programInfo = await getProgramInfo(connection, programId);
  const programDataAccount = new PublicKey(programInfo.programDataAccount);
  const currentData = await connection.getAccountInfo(programDataAccount);
  const previousHash = crypto
    .createHash('sha256')
    .update(currentData!.data)
    .digest('hex');

  console.log('Current program hash:', previousHash);

  // 2. Hash new program
  const newProgramData = fs.readFileSync(newProgramPath);
  const newHash = crypto
    .createHash('sha256')
    .update(newProgramData)
    .digest('hex');

  console.log('New program hash:', newHash);

  // 3. Perform upgrade
  const signature = await fullUpgradeWorkflow(
    connection,
    upgradeAuthority,
    programId,
    newProgramPath
  );

  // 4. Verify upgrade
  const updatedData = await connection.getAccountInfo(programDataAccount);
  const verifiedHash = crypto
    .createHash('sha256')
    .update(updatedData!.data)
    .digest('hex');

  const verified = verifiedHash !== previousHash;

  return {
    programId: programId.toString(),
    previousHash,
    newHash,
    upgradeSignature: signature,
    verified,
  };
}
```

---

## Testing with Bankrun

```typescript
import { start } from 'solana-bankrun';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as fs from 'fs';

describe('Program Deployment', () => {
  let context: any;
  let connection: Connection;
  let payer: Keypair;

  beforeAll(async () => {
    context = await start([], []);
    connection = new Connection(context.banksClient);
    payer = Keypair.generate();

    await context.banksClient.requestAirdrop(
      payer.publicKey,
      100 * LAMPORTS_PER_SOL
    );
  });

  test('should deploy program', async () => {
    const programKeypair = Keypair.generate();
    const programPath = 'target/deploy/my_program.so';

    if (!fs.existsSync(programPath)) {
      console.log('Skipping: program binary not found');
      return;
    }

    const programId = await deployProgram({
      programPath,
      programKeypair,
      payerKeypair: payer,
      cluster: 'localnet',
    });

    expect(programId.toString()).toBe(programKeypair.publicKey.toString());

    // Verify program exists
    const accountInfo = await connection.getAccountInfo(programId);
    expect(accountInfo).not.toBeNull();
    expect(accountInfo!.executable).toBe(true);
  });

  test('should get program info', async () => {
    const programId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

    const info = await getProgramInfo(connection, programId);

    expect(info.programId).toBe(programId.toString());
    expect(info.dataLen).toBeGreaterThan(0);
  });
});
```

---

## Security Considerations

1. **Protect upgrade authority keys** - use hardware wallets or multisig
2. **Never commit keypairs** to version control
3. **Use CI/CD secrets** for automated deployments
4. **Verify program hashes** before and after upgrades
5. **Consider time-locks** for mainnet upgrades
6. **Audit programs** before deployment
7. **Test upgrades on devnet** before mainnet
8. **Document all deployments** with signatures and timestamps
9. **Use separate deployer accounts** with limited funds
10. **Monitor program accounts** for unexpected changes

---

## Related Skills

- **anchor-instructor** - Anchor framework development
- **smart-contract-auditor** - Security auditing
- **solana-reader** - Query program accounts
- **wallet-integration** - Signing deployments

---

## Further Reading

- Solana Program Deploy: https://docs.solana.com/cli/deploy-a-program
- Upgradeable Programs: https://docs.solana.com/developing/on-chain-programs/upgradeable-programs
- Anchor Deploy: https://www.anchor-lang.com/docs/cli#deploy
- Squads Multisig: https://squads.so/docs

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
