# @gicm/integration-hub

Central event bus, API gateway, and workflow automation for gICM platform.

## Installation

```bash
npm install @gicm/integration-hub
# or
pnpm add @gicm/integration-hub
```

## Features

- **Event Bus** - Centralized event routing between engines
- **API Gateway** - Unified REST/WebSocket API
- **Workflow Automation** - Cron-based task scheduling
- **Engine Integration** - Connects Money, Growth, Product engines

## Usage

```typescript
import { IntegrationHub } from "@gicm/integration-hub";

const hub = new IntegrationHub();

// Subscribe to events
hub.on("trade:executed", (event) => {
  console.log("Trade executed:", event);
});

// Publish events
hub.emit("discovery:found", {
  type: "github",
  repo: "cool-project",
  score: 85,
});

// Start API server
await hub.start({ port: 4000 });
```

## CLI

```bash
# Start the integration hub
gicm-hub start

# Start with custom port
gicm-hub start --port 5000
```

## API Endpoints

- `GET /health` - Health check
- `GET /events` - List recent events
- `POST /emit` - Emit an event
- `WS /ws` - WebSocket connection for real-time events

## License

MIT
