# @gicm/watcher

Live file watching system with auto-reindex for the gICM platform.

## Features

- Real-time file system monitoring
- Debounced change events
- Incremental indexing
- Supabase sync support
- Configurable ignore patterns
- Event-driven architecture

## Installation

```bash
npm install @gicm/watcher
# or
pnpm add @gicm/watcher
```

## Usage

```typescript
import { FileWatcher } from "@gicm/watcher";

const watcher = new FileWatcher({
  paths: ["./src"],
  ignore: ["node_modules", ".git", "dist"],
  debounceMs: 300,
});

// Start watching
await watcher.start();

// Listen for changes
watcher.on("change", (change) => {
  console.log(`${change.type}: ${change.path}`);
});

// Get recent changes
const changes = watcher.getChanges();

// Trigger manual reindex
await watcher.reindex();

// Stop watching
await watcher.stop();
```

## CLI Commands

```bash
gicm watch start              # Start file watcher
gicm watch stop               # Stop watcher
gicm watch status             # Show status
gicm watch changes            # Recent changes
gicm watch reindex            # Trigger re-indexing
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `dev.watch_status` | File watcher status |
| `dev.watch_changes` | Recent file changes |
| `dev.watch_reindex` | Trigger re-indexing |
| `dev.watch_clear` | Clear change history |

## Components

### FileWatcher
Main file watching class using chokidar.

```typescript
const watcher = new FileWatcher({
  paths: ["./src", "./lib"],
  ignore: ["node_modules/**", "*.log"],
  debounceMs: 300,
});
```

### Debouncer
Utility for debouncing rapid file changes.

```typescript
import { Debouncer } from "@gicm/watcher";

const debouncer = new Debouncer(300);
debouncer.debounce("key", () => {
  console.log("Debounced!");
});
```

### IncrementalIndexer
Indexes only changed files for efficiency.

```typescript
import { IncrementalIndexer } from "@gicm/watcher";

const indexer = new IncrementalIndexer({
  batchSize: 10,
  indexEndpoint: "http://localhost:8000/index",
});

await indexer.index(changedFiles);
```

### SupabaseSync
Syncs file changes to Supabase.

```typescript
import { createSyncFromEnv } from "@gicm/watcher";

const sync = createSyncFromEnv();
await sync.sync(changes);
```

## Configuration

```typescript
interface WatcherConfig {
  paths: string[];           // Paths to watch
  ignore?: string[];         // Patterns to ignore
  debounceMs?: number;       // Debounce delay (default: 300)
  persistent?: boolean;      // Keep process alive
  maxChanges?: number;       // Max changes to store
}
```

## Events

```typescript
watcher.on("change", (change: FileChange) => {
  // { type: "add" | "change" | "unlink", path: string, timestamp: Date }
});

watcher.on("error", (error: Error) => {
  console.error("Watch error:", error);
});

watcher.on("ready", () => {
  console.log("Watcher ready");
});
```

## License

MIT
