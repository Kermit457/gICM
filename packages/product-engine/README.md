# @gicm/product-engine

> Autonomous product development - Discovery, building, quality, deployment

[![npm version](https://badge.fury.io/js/@gicm%2Fproduct-engine.svg)](https://www.npmjs.com/package/@gicm/product-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/product-engine
# or
pnpm add @gicm/product-engine
```

## Features

- **Discovery System**: Scans competitors, GitHub trends, HackerNews
- **Opportunity Evaluation**: LLM-powered scoring
- **Agent Builder**: Auto-generates agents from templates
- **Quality Gate**: Automated testing + AI code review

## Quick Start

```typescript
import { ProductEngine } from "@gicm/product-engine";

const engine = new ProductEngine({
  discoveryInterval: "0 */6 * * *", // Every 6 hours
  autoApproveThreshold: 80,
});

await engine.start();
```

## CLI Commands

```bash
gicm-product start          # Start autonomous engine
gicm-product discover       # Run discovery now
gicm-product backlog        # View opportunity backlog
gicm-product approve <id>   # Approve for building
gicm-product build          # Build next approved
gicm-product status         # Show engine metrics
```

## License

MIT - Built by [gICM](https://gicm.dev)
