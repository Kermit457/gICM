# @gicm/ptc-coordinator

Programmatic Tool Calling (PTC) Coordinator - Orchestrate gICM agents via generated code pipelines.

## Installation

```bash
npm install @gicm/ptc-coordinator
# or
pnpm add @gicm/ptc-coordinator
```

## Features

- **Pipeline Generation** - LLM generates executable pipelines
- **Tool Orchestration** - Coordinate multiple agents
- **Template Library** - Pre-built pipeline templates
- **Type-Safe** - Full TypeScript support with Zod validation

## Usage

```typescript
import { PTCCoordinator } from "@gicm/ptc-coordinator";

const coordinator = new PTCCoordinator();

// Execute a natural language request
const result = await coordinator.execute(
  "Analyze SOL/USDC, check wallet balance, and suggest entry points"
);

// The coordinator:
// 1. Generates a pipeline from the request
// 2. Executes each step with appropriate agents
// 3. Returns structured results
```

### Using Templates

```typescript
import { templates } from "@gicm/ptc-coordinator/templates";

// Use a pre-built template
const pipeline = templates.tradingAnalysis({
  pair: "SOL/USDC",
  timeframe: "4h",
});

const result = await coordinator.runPipeline(pipeline);
```

## How It Works

1. **Parse Request** - Natural language to structured intent
2. **Generate Pipeline** - Create executable code steps
3. **Validate** - Type-check with Zod schemas
4. **Execute** - Run agents in sequence/parallel
5. **Aggregate** - Combine results and return

## License

MIT
