# @gicm/hyper-brain

gICM HYPER BRAIN - Knowledge ingestion, learning, and prediction system.

## Installation

```bash
npm install @gicm/hyper-brain
# or
pnpm add @gicm/hyper-brain
```

## Features

- **Knowledge Ingestion** - Ingest and process diverse data sources
- **Learning System** - Pattern recognition and continuous learning
- **Prediction Engine** - Generate predictions based on learned patterns
- **Win Tracking** - Track successes and optimize strategies

## Usage

```typescript
import { HyperBrain } from "@gicm/hyper-brain";

const brain = new HyperBrain({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

// Ingest knowledge
await brain.ingest({
  source: "github",
  data: repoAnalysis,
});

// Search knowledge base
const results = await brain.search("solana defi patterns");

// Get predictions
const prediction = await brain.predict({
  context: "market conditions",
  query: "optimal entry point",
});
```

## CLI

```bash
# Start the brain
gicm-brain start

# Ingest data
gicm-brain ingest --source github

# Search knowledge
gicm-brain search "defi yield strategies"

# View wins
gicm-brain wins

# Statistics
gicm-brain stats
```

## License

MIT
