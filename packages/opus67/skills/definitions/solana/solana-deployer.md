# Solana Deployer - Complete Program Deployment & Management

> **ID:** `solana-deployer`
> **Tier:** 2 (High Priority)
> **Token Cost:** 7000
> **MCP Connections:** solana, helius
> **Solana CLI Version:** 1.18+

## 🎯 What This Skill Does

Master Solana program deployment, upgrade strategies, monitoring, and production management. This skill covers complete deployment workflows from local testing to mainnet, upgrade patterns, buffer management, and post-deployment monitoring.

**Core Capabilities:**
- Program deployment (devnet/mainnet)
- Program upgrades and versioning
- Buffer account management
- Upgrade authority patterns
- Deployment cost optimization
- Post-deployment monitoring
- Rollback strategies
- Multi-environment workflows

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** deploy, devnet, mainnet, upgrade, buffer, program, solana program deploy
- **File Types:** .so, .toml, .sh
- **Directories:** target/deploy/, scripts/

**Use this skill when:**
- Deploying Solana programs
- Upgrading existing programs
- Managing deployment environments
- Setting up CI/CD pipelines
- Monitoring program status
- Planning upgrade strategies
- Optimizing deployment costs

## 🚀 Core Capabilities

### 1. Program Deployment Workflow

**Complete Deployment Process:**

```bash
# ============================================================================
# STEP 1: Build Program
# ============================================================================

# Clean previous builds
anchor clean

# Build for deployment
anchor build

# Verify build output
ls -lh target/deploy/*.so

# Check program size (max 10MB on mainnet, expandable)
# Typical sizes: 100KB-500KB for normal programs

# ============================================================================
# STEP 2: Generate Program Keypair (first time only)
# ============================================================================

# Generate new program keypair
solana-keygen new -o target/deploy/my_program-keypair.json

# Get program ID
solana address -k target/deploy/my_program-keypair.json

# Update declare_id! in lib.rs with this address
# Then rebuild: anchor build

# ============================================================================
# STEP 3: Configure Network
# ============================================================================

# Devnet deployment
solana config set --url https://api.devnet.solana.com

# Mainnet deployment (production)
solana config set --url https://api.mainnet-beta.solana.com

# Or use custom RPC (recommended for mainnet)
solana config set --url https://your-rpc-provider.com

# Verify configuration
solana config get

# ============================================================================
# STEP 4: Fund Deployer Wallet
# ============================================================================

# Check balance
solana balance

# Devnet: Request airdrop
solana airdrop 2

# Mainnet: Transfer SOL from your wallet
# Deployment costs vary: 0.5-5 SOL depending on program size

# ============================================================================
# STEP 5: Deploy Program
# ============================================================================

# Deploy to devnet/mainnet
anchor deploy

# Or using solana CLI directly
solana program deploy target/deploy/my_program.so \
  --program-id target/deploy/my_program-keypair.json

# With custom buffer (for large programs)
solana program deploy target/deploy/my_program.so \
  --program-id target/deploy/my_program-keypair.json \
  --buffer buffer-keypair.json

# ============================================================================
# STEP 6: Verify Deployment
# ============================================================================

# Check program info
solana program show <PROGRAM_ID>

# Verify program data
solana account <PROGRAM_ID>

# Test program with client
# (Run integration tests)
```

**Automated Deployment Script:**

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# Configuration
NETWORK=$1
PROGRAM_NAME="my_program"
KEYPAIR_PATH="target/deploy/${PROGRAM_NAME}-keypair.json"

if [ -z "$NETWORK" ]; then
  echo "Usage: ./deploy.sh [devnet|mainnet]"
  exit 1
fi

echo "🚀 Deploying ${PROGRAM_NAME} to ${NETWORK}..."

# Set network
if [ "$NETWORK" = "devnet" ]; then
  RPC_URL="https://api.devnet.solana.com"
elif [ "$NETWORK" = "mainnet" ]; then
  RPC_URL="${MAINNET_RPC_URL}"
else
  echo "Invalid network: ${NETWORK}"
  exit 1
fi

solana config set --url $RPC_URL

# Check balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Current balance: ${BALANCE} SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
  echo "⚠️  Low balance. Please fund wallet."
  exit 1
fi

# Build program
echo "📦 Building program..."
anchor build

# Get program size
PROGRAM_SIZE=$(ls -lh target/deploy/${PROGRAM_NAME}.so | awk '{print $5}')
echo "Program size: ${PROGRAM_SIZE}"

# Deploy
echo "🚢 Deploying..."
START_TIME=$(date +%s)

anchor deploy --provider.cluster $NETWORK

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "✅ Deployment complete in ${DURATION}s"

# Get program ID
PROGRAM_ID=$(solana address -k $KEYPAIR_PATH)
echo "Program ID: ${PROGRAM_ID}"

# Verify
echo "🔍 Verifying deployment..."
solana program show $PROGRAM_ID

# Save deployment info
cat > deployments/${NETWORK}.json <<EOF
{
  "network": "${NETWORK}",
  "programId": "${PROGRAM_ID}",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "programSize": "${PROGRAM_SIZE}",
  "deployer": "$(solana address)"
}
EOF

echo "📝 Deployment info saved to deployments/${NETWORK}.json"
echo "🎉 Deployment successful!"
```

**Best Practices:**
- Always test on devnet first
- Use dedicated deployer wallet
- Keep program keypair secure (backup!)
- Verify program ID matches declare_id!
- Check balance before deployment
- Save deployment metadata
- Test immediately after deployment

### 2. Program Upgrade Strategies

**Upgrade Workflow:**

```bash
# ============================================================================
# Option 1: Direct Upgrade (Simple)
# ============================================================================

# Build new version
anchor build

# Upgrade deployed program
anchor upgrade target/deploy/my_program.so \
  --program-id <PROGRAM_ID>

# ============================================================================
# Option 2: Buffer Upload (Safer - Two-Step)
# ============================================================================

# Step 1: Write new program to buffer
solana program write-buffer target/deploy/my_program.so

# This returns BUFFER_ADDRESS
# Example: BufferGYqE5N8YqvNJ4GBnE5Hqnpe3d9JKYvKH8WP7TY

# Step 2: Deploy buffer to program (after testing)
solana program deploy --program-id <PROGRAM_ID> \
  --buffer <BUFFER_ADDRESS>

# ============================================================================
# Option 3: Upgrade with Governance (Production)
# ============================================================================

# 1. Set upgrade authority to governance program
solana program set-upgrade-authority <PROGRAM_ID> \
  --new-upgrade-authority <GOVERNANCE_PROGRAM>

# 2. Create governance proposal for upgrade
# 3. Voting period
# 4. Execute upgrade via governance

# ============================================================================
# Version Management
# ============================================================================

# Add version to your program
#[account]
pub struct ProgramVersion {
    pub major: u8,
    pub minor: u8,
    pub patch: u8,
}

// Update in upgrade instruction
pub fn upgrade(ctx: Context<Upgrade>) -> Result<()> {
    let version = &mut ctx.accounts.version;
    version.minor += 1;
    msg!("Upgraded to version {}.{}.{}", version.major, version.minor, version.patch);
    Ok(())
}
```

**Safe Upgrade Script:**

```bash
#!/bin/bash
# scripts/upgrade.sh

set -e

NETWORK=$1
PROGRAM_ID=$2

if [ -z "$NETWORK" ] || [ -z "$PROGRAM_ID" ]; then
  echo "Usage: ./upgrade.sh [devnet|mainnet] <PROGRAM_ID>"
  exit 1
fi

echo "🔄 Upgrading program ${PROGRAM_ID} on ${NETWORK}..."

# Set network
if [ "$NETWORK" = "devnet" ]; then
  RPC_URL="https://api.devnet.solana.com"
elif [ "$NETWORK" = "mainnet" ]; then
  RPC_URL="${MAINNET_RPC_URL}"
fi

solana config set --url $RPC_URL

# Build new version
echo "📦 Building new version..."
anchor build

# Verify upgrade authority
CURRENT_AUTHORITY=$(solana program show $PROGRAM_ID | grep "Upgrade Authority" | awk '{print $3}')
MY_ADDRESS=$(solana address)

if [ "$CURRENT_AUTHORITY" != "$MY_ADDRESS" ]; then
  echo "❌ You are not the upgrade authority"
  echo "Current authority: $CURRENT_AUTHORITY"
  echo "Your address: $MY_ADDRESS"
  exit 1
fi

# Create backup
echo "💾 Creating buffer backup..."
BUFFER=$(solana program write-buffer target/deploy/my_program.so --output json | jq -r '.buffer')

echo "Buffer created: ${BUFFER}"
echo "Saving buffer to backups/${NETWORK}-buffer.txt"
echo $BUFFER > backups/${NETWORK}-buffer.txt

# Wait for confirmation
read -p "Deploy buffer ${BUFFER} to program ${PROGRAM_ID}? (yes/no) " -n 3 -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Upgrade cancelled"
  exit 0
fi

# Deploy buffer to program
echo "🚀 Deploying upgrade..."
solana program deploy --program-id $PROGRAM_ID --buffer $BUFFER

echo "✅ Upgrade complete!"

# Verify
echo "🔍 Verifying upgrade..."
solana program show $PROGRAM_ID

# Log upgrade
cat >> deployments/upgrades.log <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "network": "${NETWORK}",
  "programId": "${PROGRAM_ID}",
  "buffer": "${BUFFER}",
  "upgrader": "${MY_ADDRESS}"
}
EOF

echo "📝 Upgrade logged to deployments/upgrades.log"
```

**Best Practices:**
- Use buffer method for mainnet upgrades
- Test upgrade on devnet first
- Keep backup of previous version
- Document upgrade in version account
- Notify users before upgrade
- Monitor after upgrade
- Have rollback plan ready

### 3. Upgrade Authority Management

**Authority Patterns:**

```typescript
// lib/authority-manager.ts
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { execSync } from 'child_process';

export class UpgradeAuthorityManager {
  constructor(
    private connection: Connection,
    private programId: PublicKey
  ) {}

  /**
   * Get current upgrade authority
   */
  async getUpgradeAuthority(): Promise<PublicKey | null> {
    const programInfo = await this.connection.getAccountInfo(this.programId);

    if (!programInfo) {
      throw new Error('Program not found');
    }

    // Parse program data to extract upgrade authority
    // Located at bytes 13-44 in ProgramData account
    const upgradeAuthority = programInfo.data.slice(13, 45);

    return new PublicKey(upgradeAuthority);
  }

  /**
   * Transfer upgrade authority to new address
   */
  async transferAuthority(
    newAuthority: PublicKey,
    currentAuthority: Keypair
  ): Promise<string> {
    const command = `solana program set-upgrade-authority ${this.programId.toBase58()} \\
      --new-upgrade-authority ${newAuthority.toBase58()} \\
      --upgrade-authority ${currentAuthority.publicKey.toBase58()}`;

    try {
      const output = execSync(command, { encoding: 'utf-8' });
      const signature = output.match(/Signature: (\w+)/)?.[1];

      return signature || '';
    } catch (error) {
      throw new Error(`Failed to transfer authority: ${error}`);
    }
  }

  /**
   * Revoke upgrade authority (make program immutable)
   */
  async revokeAuthority(currentAuthority: Keypair): Promise<string> {
    const command = `solana program set-upgrade-authority ${this.programId.toBase58()} \\
      --final \\
      --upgrade-authority ${currentAuthority.publicKey.toBase58()}`;

    try {
      const output = execSync(command, { encoding: 'utf-8' });
      const signature = output.match(/Signature: (\w+)/)?.[1];

      return signature || '';
    } catch (error) {
      throw new Error(`Failed to revoke authority: ${error}`);
    }
  }

  /**
   * Set upgrade authority to multisig
   */
  async setMultisigAuthority(
    multisigAddress: PublicKey,
    currentAuthority: Keypair
  ): Promise<string> {
    return await this.transferAuthority(multisigAddress, currentAuthority);
  }

  /**
   * Set upgrade authority to governance
   */
  async setGovernanceAuthority(
    governanceProgram: PublicKey,
    currentAuthority: Keypair
  ): Promise<string> {
    return await this.transferAuthority(governanceProgram, currentAuthority);
  }
}
```

**Authority Best Practices:**

1. **Development Phase**: Keep authority with team wallet
2. **Testing Phase**: Transfer to multisig (2/3 or 3/5)
3. **Production Phase**: Transfer to governance program
4. **Final Phase**: Consider making immutable (revoke authority)

**Example Governance Setup:**

```rust
// Upgrade through governance
use spl_governance::instruction::upgrade_program;

pub fn propose_upgrade(
    ctx: Context<ProposeUpgrade>,
    buffer: Pubkey,
) -> Result<()> {
    // Create governance proposal
    let proposal = create_proposal(
        &ctx.accounts.governance,
        "Upgrade program to v2.0",
    )?;

    // Add upgrade instruction to proposal
    let upgrade_ix = upgrade_program(
        ctx.accounts.program.key(),
        buffer,
        ctx.accounts.upgrade_authority.key(),
    );

    add_instruction_to_proposal(proposal, upgrade_ix)?;

    Ok(())
}
```

### 4. Deployment Cost Optimization

**Understanding Deployment Costs:**

```
Program Size → Buffer Size → Rent Cost

Examples (approximate):
- 100 KB program = ~0.5 SOL rent
- 500 KB program = ~2.5 SOL rent
- 1 MB program = ~5 SOL rent

Formula: rent = size_bytes * 6960 lamports per byte
```

**Cost Optimization Strategies:**

```bash
# ============================================================================
# 1. Optimize Binary Size
# ============================================================================

# Enable size optimizations in Cargo.toml
[profile.release]
opt-level = 'z'     # Optimize for size
lto = true          # Link-time optimization
codegen-units = 1   # Better optimization
strip = true        # Strip symbols

# Build with optimizations
anchor build -- --release

# ============================================================================
# 2. Use Buffer Account Reuse
# ============================================================================

# Create buffer once
BUFFER=$(solana program write-buffer target/deploy/program.so)

# Deploy from buffer
solana program deploy --program-id <PROGRAM_ID> --buffer $BUFFER

# Buffer can be reused for testing without re-uploading

# ============================================================================
# 3. Partial Upgrades (for large programs)
# ============================================================================

# Split program into smaller parts if possible
# Deploy core functionality first
# Add features in subsequent upgrades

# ============================================================================
# 4. Estimate costs before deployment
# ============================================================================

# Get program size
PROGRAM_SIZE=$(stat -f%z target/deploy/program.so)

# Calculate rent
RENT_LAMPORTS=$((PROGRAM_SIZE * 6960))
RENT_SOL=$(echo "scale=4; $RENT_LAMPORTS / 1000000000" | bc)

echo "Estimated deployment cost: ${RENT_SOL} SOL"
```

**Deployment Cost Calculator:**

```typescript
// tools/cost-calculator.ts
import * as fs from 'fs';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export class DeploymentCostCalculator {
  private LAMPORTS_PER_BYTE = 6960;

  /**
   * Calculate deployment cost for program
   */
  calculateCost(programPath: string): {
    sizeBytes: number;
    sizeMB: number;
    rentLamports: number;
    rentSOL: number;
    estimatedTotal: number;
  } {
    const stats = fs.statSync(programPath);
    const sizeBytes = stats.size;
    const sizeMB = sizeBytes / (1024 * 1024);

    const rentLamports = sizeBytes * this.LAMPORTS_PER_BYTE;
    const rentSOL = rentLamports / LAMPORTS_PER_SOL;

    // Add transaction fees (estimate ~0.01 SOL)
    const estimatedTotal = rentSOL + 0.01;

    return {
      sizeBytes,
      sizeMB,
      rentLamports,
      rentSOL,
      estimatedTotal,
    };
  }

  /**
   * Compare costs across different builds
   */
  compareCosts(programs: { name: string; path: string }[]) {
    console.log('Deployment Cost Comparison:\n');

    programs.forEach(program => {
      const cost = this.calculateCost(program.path);

      console.log(`${program.name}:`);
      console.log(`  Size: ${cost.sizeMB.toFixed(2)} MB (${cost.sizeBytes.toLocaleString()} bytes)`);
      console.log(`  Rent: ${cost.rentSOL.toFixed(4)} SOL`);
      console.log(`  Total: ~${cost.estimatedTotal.toFixed(4)} SOL\n`);
    });
  }
}

// Usage
const calculator = new DeploymentCostCalculator();

const programs = [
  { name: 'Debug Build', path: 'target/debug/program.so' },
  { name: 'Release Build', path: 'target/release/program.so' },
  { name: 'Optimized Build', path: 'target/deploy/program.so' },
];

calculator.compareCosts(programs);
```

## 💡 Real-World Examples

### Example 1: Complete CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Solana Program

on:
  push:
    branches: [main]
    paths:
      - 'programs/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - devnet
          - mainnet

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true

      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH

      - name: Install Anchor
        run: |
          cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.0 anchor-cli

      - name: Build Program
        run: anchor build

      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: program-binary
          path: target/deploy/*.so

  deploy-devnet:
    needs: build
    if: github.event_name == 'push' || inputs.environment == 'devnet'
    runs-on: ubuntu-latest
    environment: devnet
    steps:
      - uses: actions/checkout@v3

      - name: Download Artifact
        uses: actions/download-artifact@v3
        with:
          name: program-binary
          path: target/deploy/

      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH

      - name: Setup Solana Wallet
        run: |
          echo "${{ secrets.DEVNET_DEPLOYER_KEY }}" > deployer.json
          solana config set --keypair deployer.json
          solana config set --url https://api.devnet.solana.com

      - name: Deploy to Devnet
        run: |
          solana program deploy target/deploy/my_program.so \
            --program-id target/deploy/my_program-keypair.json

      - name: Verify Deployment
        run: |
          PROGRAM_ID=$(solana address -k target/deploy/my_program-keypair.json)
          solana program show $PROGRAM_ID

  deploy-mainnet:
    needs: build
    if: inputs.environment == 'mainnet'
    runs-on: ubuntu-latest
    environment: mainnet
    steps:
      - uses: actions/checkout@v3

      - name: Download Artifact
        uses: actions/download-artifact@v3
        with:
          name: program-binary
          path: target/deploy/

      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH

      - name: Setup Solana Wallet
        run: |
          echo "${{ secrets.MAINNET_DEPLOYER_KEY }}" > deployer.json
          solana config set --keypair deployer.json
          solana config set --url ${{ secrets.MAINNET_RPC_URL }}

      - name: Create Buffer
        id: buffer
        run: |
          BUFFER=$(solana program write-buffer target/deploy/my_program.so --output json | jq -r '.buffer')
          echo "buffer=$BUFFER" >> $GITHUB_OUTPUT

      - name: Deploy to Mainnet
        run: |
          solana program deploy \
            --program-id target/deploy/my_program-keypair.json \
            --buffer ${{ steps.buffer.outputs.buffer }}

      - name: Verify Deployment
        run: |
          PROGRAM_ID=$(solana address -k target/deploy/my_program-keypair.json)
          solana program show $PROGRAM_ID

      - name: Notify Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Program deployed to mainnet!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Example 2: Deployment Monitoring Dashboard

```typescript
// tools/deployment-monitor.ts
import { Connection, PublicKey } from '@solana/web3.js';

export class DeploymentMonitor {
  constructor(
    private connection: Connection,
    private programId: PublicKey
  ) {}

  /**
   * Get program deployment info
   */
  async getDeploymentInfo() {
    const accountInfo = await this.connection.getAccountInfo(this.programId);

    if (!accountInfo) {
      throw new Error('Program not found');
    }

    return {
      lamports: accountInfo.lamports,
      size: accountInfo.data.length,
      owner: accountInfo.owner.toBase58(),
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch,
    };
  }

  /**
   * Monitor program for changes
   */
  async watchProgram(callback: (change: any) => void) {
    const subscriptionId = this.connection.onAccountChange(
      this.programId,
      (accountInfo, context) => {
        callback({
          timestamp: Date.now(),
          slot: context.slot,
          lamports: accountInfo.lamports,
          dataSize: accountInfo.data.length,
        });
      },
      'confirmed'
    );

    return () => this.connection.removeAccountChangeListener(subscriptionId);
  }

  /**
   * Get upgrade history
   */
  async getUpgradeHistory(limit = 10) {
    const signatures = await this.connection.getSignaturesForAddress(
      this.programId,
      { limit }
    );

    const upgrades = [];

    for (const sig of signatures) {
      const tx = await this.connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      // Check if transaction contains upgrade instruction
      if (tx?.meta?.logMessages?.some(log => log.includes('Upgrade'))) {
        upgrades.push({
          signature: sig.signature,
          slot: sig.slot,
          timestamp: sig.blockTime,
        });
      }
    }

    return upgrades;
  }
}
```

## 🔒 Security Checklist

Before deploying to mainnet:

- [ ] Program audited by security firm
- [ ] All tests passing (unit + integration)
- [ ] Tested on devnet for 2+ weeks
- [ ] Upgrade authority set to multisig/governance
- [ ] Emergency pause mechanism implemented
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented
- [ ] Team trained on upgrade procedures

## 🔗 Resources

- [Solana CLI Reference](https://docs.solana.com/cli)
- [Program Deployment Guide](https://docs.solana.com/cli/deploy-a-program)
- [Anchor Deployment](https://book.anchor-lang.com/anchor_in_depth/deployment.html)
- [SPL Governance](https://github.com/solana-labs/solana-program-library/tree/master/governance)

---

**Last Updated:** 2025-12-04
**Solana CLI Version:** 1.18+
**Tested on:** Devnet, Mainnet-beta
