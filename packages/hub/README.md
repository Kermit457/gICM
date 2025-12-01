# @gicm/hub

Integration hub connecting all gICM engines with real-time events and APIs.

## Installation

```bash
npm install @gicm/hub
# or
pnpm add @gicm/hub
```

## Features

- **Event Bus** - Real-time event routing between components
- **API Server** - Fastify-based REST and WebSocket APIs
- **Engine Coordination** - Connects Hyper Brain and other engines
- **CLI Interface** - Easy management via command line

## Usage

```typescript
import { Hub } from "@gicm/hub";

const hub = new Hub();

// Listen for events
hub.on("brain:insight", (data) => {
  console.log("New insight:", data);
});

// Start the hub
await hub.start({ port: 4000 });
```

## CLI

```bash
# Start the hub
gicm-hub start

# Check status
gicm-hub status
```

## License

MIT
