# @gicm/autonomy

> Level 2+ Bounded Autonomous Execution with Human Oversight

[![npm version](https://badge.fury.io/js/@gicm%2Fautonomy.svg)](https://www.npmjs.com/package/@gicm/autonomy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/autonomy
# or
pnpm add @gicm/autonomy
```

## Features

- **Risk Classification**: Score actions 0-100 based on financial impact, reversibility, category
- **Decision Routing**: auto_execute | queue_approval | escalate | reject
- **Boundary Enforcement**: Daily limits, value thresholds, blocked operations
- **Approval Queue**: Priority-ordered with auto-expiration and batch operations
- **Audit Trail**: Hash-chain integrity for complete action history

## Quick Start

```typescript
import { AutonomyEngine } from "@gicm/autonomy";

const autonomy = new AutonomyEngine({
  autonomyLevel: 2, // Bounded autonomy
  boundaries: {
    financial: { maxAutoExpense: 50, maxDailySpend: 100 },
    content: { maxAutoPostsPerDay: 10 },
  },
});

// Route an action
const decision = await autonomy.route({
  type: "trading",
  name: "dca_buy",
  description: "DCA buy 10 SOL",
  value: 10,
  category: "trading",
});

if (decision.action === "auto_execute") {
  // Safe to execute automatically
  await executeAction();
} else if (decision.action === "queue_approval") {
  // Needs human approval
  console.log(`Queued for approval: ${decision.requestId}`);
}
```

## CLI Commands

```bash
gicm-autonomy status           # Show engine status
gicm-autonomy queue            # List pending approvals
gicm-autonomy approve <id>     # Approve a request
gicm-autonomy reject <id>      # Reject a request
gicm-autonomy batch-approve    # Batch approve (--safe, --category)
gicm-autonomy boundaries       # Show/update boundaries
gicm-autonomy audit            # View audit log
```

## Risk Thresholds

| Risk Score | Category | Action |
|------------|----------|--------|
| 0-20 | Safe | auto_execute |
| 21-40 | Low | auto_execute or queue |
| 41-60 | Medium | queue_approval |
| 61-80 | High | escalate |
| 81-100 | Critical | reject |

## Exports

| Export | Description |
|--------|-------------|
| `@gicm/autonomy` | Main AutonomyEngine |
| `@gicm/autonomy/decision` | RiskClassifier, BoundaryChecker |
| `@gicm/autonomy/execution` | AutoExecutor, RollbackManager |
| `@gicm/autonomy/approval` | ApprovalQueue, BatchApproval |
| `@gicm/autonomy/audit` | AuditLogger |

## License

MIT - Built by [gICM](https://gicm.dev)
