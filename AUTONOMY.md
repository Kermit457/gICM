# gICM Autonomy System - Standard Operating Procedures

> **Package:** `@gicm/autonomy`
> **Version:** 1.0.0
> **Last Updated:** 2025-11-29
> **Status:** Production Ready

---

## Overview

The gICM Autonomy System enables **bounded autonomous execution** for the gICM platform. It provides a framework where:

- **Safe/low-risk actions** auto-execute immediately
- **Medium-risk actions** queue for batch review
- **High-risk actions** escalate to human immediately
- **Critical actions** (e.g., production deploys) NEVER auto-execute

This system was built across 4 Claude Code sessions and implements Level 2+ autonomy with complete audit trails.

---

## Quick Start

```bash
# Build the package
cd packages/autonomy && pnpm build

# Check status
node dist/cli.js status

# View pending approvals
node dist/cli.js queue

# Approve a request
node dist/cli.js approve <id>

# Reject a request
node dist/cli.js reject <id> --reason "Not needed"
```

---

## Autonomy Levels

| Level | Name | Description |
|-------|------|-------------|
| 1 | Manual | All actions require approval |
| 2 | Bounded | Safe actions auto-execute, others queue |
| 3 | Supervised | Most actions auto-execute, high-risk queues |
| 4 | Autonomous | All actions auto-execute (with boundaries) |

**Default: Level 2** - Recommended for production use.

---

## Risk Classification

### Risk Factors (Weighted)

| Factor | Weight | Description |
|--------|--------|-------------|
| Financial Value | 35% | Dollar amount involved |
| Reversibility | 20% | Can action be undone? |
| Category Risk | 15% | Trading > Deployment > Content |
| Urgency | 15% | Time pressure increases risk |
| External Visibility | 15% | Public-facing = higher risk |

### Risk Levels

| Level | Score Range | Default Behavior |
|-------|-------------|------------------|
| Safe | 0-20 | Auto-execute |
| Low | 21-40 | Auto-execute (content), Queue (trading) |
| Medium | 41-60 | Queue for approval |
| High | 61-80 | Escalate immediately |
| Critical | 81-100 | Reject or escalate |

---

## Decision Flow

```
┌─────────────────┐
│  Action Input   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Risk Classifier │ → Calculate 0-100 score
└────────┬────────┘
         ▼
┌─────────────────┐
│Boundary Checker │ → Enforce daily limits, blocked keywords
└────────┬────────┘
         ▼
┌─────────────────┐
│ Decision Router │ → Route based on level + assessment
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ▼         ▼            ▼            ▼
┌───────┐ ┌───────┐  ┌──────────┐  ┌────────┐
│ AUTO  │ │ QUEUE │  │ ESCALATE │  │ REJECT │
│EXECUTE│ │APPROVAL│  │          │  │        │
└───────┘ └───────┘  └──────────┘  └────────┘
    ↓         ↓            ↓
    └─────────┴────────────┘
                  ↓
           ┌───────────┐
           │   AUDIT   │
           │   TRAIL   │
           └───────────┘
```

---

## Default Boundaries

### Financial Boundaries
```json
{
  "maxAutoExpense": 50,       // Max $ for auto-execution
  "maxQueuedExpense": 200,    // Max $ for queued items
  "maxDailySpend": 100,       // Daily spending limit
  "maxTradeSize": 500,        // Max single trade size
  "requireApprovalAbove": 100 // Always queue above this
}
```

### Content Boundaries
```json
{
  "maxAutoPostsPerDay": 10,   // Auto tweets per day
  "maxAutoBlogsPerWeek": 3,   // Auto blog posts per week
  "blockedKeywords": ["guaranteed", "financial advice", "100% returns"],
  "requireReviewForTopics": ["politics", "competitors"]
}
```

### Development Boundaries
```json
{
  "maxAutoCommitLines": 100,  // Auto-commit up to 100 lines
  "allowedBranches": ["feature/*", "fix/*", "chore/*"],
  "autoDeployToProduction": false,  // NEVER auto-deploy to prod
  "requireReviewForPaths": [".env", "secrets/", "migrations/"]
}
```

### Trading Boundaries
```json
{
  "maxDCAAmount": 50,         // Max DCA per buy
  "allowedAssets": ["SOL", "USDC", "GICM"],
  "blockedPairs": [],
  "requireApprovalForNewTokens": true
}
```

---

## CLI Commands

### Status & Monitoring

```bash
# Show full engine status
gicm-autonomy status

# Show queue with JSON output
gicm-autonomy queue --json

# View audit log (last 20 entries)
gicm-autonomy audit -n 20

# Filter audit by type
gicm-autonomy audit --type action_executed

# Show statistics
gicm-autonomy stats
```

### Approval Management

```bash
# Approve single request
gicm-autonomy approve <id>

# Approve with feedback
gicm-autonomy approve <id> --feedback "Looks good"

# Reject with reason
gicm-autonomy reject <id> --reason "Not needed at this time"

# Batch approve all safe items
gicm-autonomy batch-approve --safe

# Batch approve by category
gicm-autonomy batch-approve --category content

# Batch approve by risk level
gicm-autonomy batch-approve --risk low
```

### Boundary Management

```bash
# Show current boundaries
gicm-autonomy boundaries

# Show as JSON
gicm-autonomy boundaries --json

# Update boundary (future)
gicm-autonomy boundaries --set maxAutoExpense=100
```

---

## Integration with Engines

### MoneyEngine Integration

```typescript
import { getAutonomy, MoneyEngineAdapter } from "@gicm/autonomy";

const autonomy = getAutonomy();
const moneyAdapter = new MoneyEngineAdapter();

// Create DCA action
const action = moneyAdapter.createDCAAction({
  asset: "SOL",
  amount: 10,
  fromAsset: "USDC",
});

// Route through autonomy
const decision = await autonomy.route(action);

if (decision.outcome === "auto_execute") {
  // Already executed automatically
  console.log("DCA executed:", decision);
} else if (decision.outcome === "queue_approval") {
  // Waiting for approval
  console.log("Queued for approval:", decision.id);
}
```

### GrowthEngine Integration

```typescript
import { getAutonomy, GrowthEngineAdapter } from "@gicm/autonomy";

const autonomy = getAutonomy();
const growthAdapter = new GrowthEngineAdapter();

// Create tweet action
const action = growthAdapter.createTweetAction({
  content: "Excited to announce our new feature! #gICM",
});

const decision = await autonomy.route(action);
```

### ProductEngine Integration

```typescript
import { getAutonomy, ProductEngineAdapter } from "@gicm/autonomy";

const autonomy = getAutonomy();
const productAdapter = new ProductEngineAdapter();

// Create commit action
const action = productAdapter.createCommitAction({
  message: "fix: resolve authentication bug",
  files: ["src/auth.ts"],
  linesAdded: 15,
  linesRemoved: 5,
});

const decision = await autonomy.route(action);

// Production deploy (will NEVER auto-execute)
const deployAction = productAdapter.createProductionDeployAction({
  package: "@gicm/wallet-agent",
  version: "1.2.0",
});

const deployDecision = await autonomy.route(deployAction);
// deployDecision.outcome === "escalate" (always for prod deploys)
```

---

## Event Handling

```typescript
import { getAutonomy } from "@gicm/autonomy";

const autonomy = getAutonomy();

// Listen for auto-executions
autonomy.on("execution:completed", (result) => {
  console.log(`Auto-executed: ${result.actionId}`);
});

// Listen for queued items
autonomy.on("approval:queued", (request) => {
  console.log(`Queued: ${request.id} - ${request.decision.action.description}`);
});

// Listen for escalations
autonomy.on("escalation", (request) => {
  console.log(`ESCALATION: ${request.decision.action.description}`);
  // Send Telegram/Discord notification
});
```

---

## Environment Variables

```bash
# Required
GICM_AUTONOMY_LEVEL=2                # 1-4, default: 2

# Optional - Approval Queue
GICM_APPROVAL_EXPIRE_HOURS=24        # Auto-expire pending items
GICM_MAX_PENDING_ITEMS=100           # Max queue size

# Optional - Notifications
TELEGRAM_BOT_TOKEN=<token>           # Telegram notifications
TELEGRAM_CHAT_ID=<chat_id>           # Telegram chat ID
DISCORD_WEBHOOK_URL=<url>            # Discord notifications
GICM_NOTIFICATION_RATE_LIMIT=10      # Max notifications/minute

# Optional - Audit
GICM_AUDIT_RETENTION_DAYS=30         # Keep audit logs for 30 days
```

---

## Safe Actions Registry

Actions that auto-execute without approval (at Level 2+):

### Trading
- `dca_buy` - DCA purchases within limits
- `paper_trade` - Paper trading simulation

### Content
- `tweet_post` - Single tweets (within daily limit)
- `tweet_reply` - Tweet replies
- `blog_draft` - Blog draft generation

### Development
- `code_commit` - Commits under 100 lines to allowed branches
- `quality_gate` - Quality gate checks
- `deploy_staging` - Staging deployments

### Never Auto-Execute
- `deploy_production` - Production deployments
- `large_swap` - Swaps over threshold
- `new_token_trade` - First trade of new token
- Any action with `urgency: "critical"`

---

## Audit Trail

Every action is logged with:

```typescript
interface AuditEntry {
  id: string;              // Unique entry ID
  timestamp: number;       // Unix timestamp
  type: AuditEntryType;    // action_received, decision_made, executed, etc.
  actionId: string;        // Reference to action
  decisionId?: string;     // Reference to decision
  previousHash: string;    // Hash of previous entry (chain integrity)
  metadata: Record<string, unknown>;
}
```

### Audit Entry Types
- `action_received` - Action submitted to system
- `risk_assessed` - Risk classification completed
- `decision_made` - Routing decision made
- `boundary_violation` - Boundary check failed
- `queued_approval` - Added to approval queue
- `approved` - Human approved
- `rejected` - Human rejected
- `executed` - Action executed
- `execution_failed` - Execution failed
- `rolled_back` - Action rolled back
- `escalated` - Escalated to human

---

## Architecture Files

```
packages/autonomy/
├── src/
│   ├── index.ts                    # AutonomyEngine (main export)
│   ├── cli.ts                      # CLI interface
│   ├── core/
│   │   ├── types.ts                # Zod schemas
│   │   ├── config.ts               # Configuration
│   │   └── constants.ts            # Risk weights/thresholds
│   ├── decision/
│   │   ├── risk-classifier.ts      # Risk scoring
│   │   ├── boundary-checker.ts     # Limit enforcement
│   │   └── decision-router.ts      # Routing logic
│   ├── execution/
│   │   ├── auto-executor.ts        # Auto-execution
│   │   ├── safe-actions.ts         # Safe action registry
│   │   └── rollback-manager.ts     # Rollback support
│   ├── approval/
│   │   ├── approval-queue.ts       # Queue management
│   │   ├── notification-manager.ts # Notifications
│   │   └── batch-approval.ts       # Batch operations
│   ├── audit/
│   │   └── audit-logger.ts         # Audit trail
│   └── integration/
│       ├── engine-adapter.ts       # Base adapter
│       ├── money-adapter.ts        # MoneyEngine
│       ├── growth-adapter.ts       # GrowthEngine
│       └── product-adapter.ts      # ProductEngine
├── data/
│   └── boundaries.json             # Default boundaries
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

## Troubleshooting

### "Autonomy engine not running"
```typescript
const autonomy = getAutonomy();
autonomy.start(); // Make sure to start the engine
```

### Actions always rejected
Check boundaries:
```bash
gicm-autonomy boundaries --json
```
Ensure action values are within limits.

### Notifications not sending
Check environment variables:
```bash
echo $TELEGRAM_BOT_TOKEN
echo $DISCORD_WEBHOOK_URL
```
Test with:
```bash
gicm-autonomy status  # Shows "notificationsConfigured: true/false"
```

### Queue full
```bash
gicm-autonomy stats  # Check pending count
gicm-autonomy batch-approve --safe  # Clear safe items
```

---

## Security Considerations

1. **Never store private keys in autonomy config**
2. **Production deploys ALWAYS require human approval**
3. **Audit logs should be backed up regularly**
4. **Use Level 2 for production systems**
5. **Review boundaries weekly**
6. **Monitor escalations - they indicate potential issues**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-29 | Initial release with full Level 2+ autonomy |

---

*This document is part of the gICM platform SOP system.*
