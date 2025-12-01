# @gicm/orchestrator

> Multi-agent orchestration - Workflow coordination and routing

[![npm version](https://badge.fury.io/js/@gicm%2Forchestrator.svg)](https://www.npmjs.com/package/@gicm/orchestrator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/orchestrator
# or
pnpm add @gicm/orchestrator
```

## Features

- **Multi-Agent Coordination**: Route tasks to specialized agents
- **Workflow Engine**: Define complex multi-step workflows
- **Event Bus**: Pub/sub for agent communication
- **Autonomy Integration**: Bounded autonomous execution

## Quick Start

```typescript
import { Orchestrator } from "@gicm/orchestrator";

const orchestrator = new Orchestrator({
  agents: {
    wallet: walletAgent,
    defi: defiAgent,
    hunter: hunterAgent,
  },
});

// Route a complex task
const result = await orchestrator.run({
  task: "Find and buy the best yield opportunity under 10 SOL",
});
```

## License

MIT - Built by [gICM](https://gicm.dev)
