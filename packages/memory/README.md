# @gicm/memory

AI persistent memory storage with namespaces for the gICM platform.

## Features

- Key-value memory storage with namespaces
- Multiple storage backends (in-memory, Supabase)
- Full-text search across memories
- TTL (time-to-live) support
- Statistics tracking
- Event-driven architecture

## Installation

```bash
npm install @gicm/memory
# or
pnpm add @gicm/memory
```

## Usage

```typescript
import { Memory } from "@gicm/memory";

const memory = new Memory({
  namespace: "project-context",
  storage: "memory", // or "supabase"
});

// Store a memory
await memory.remember("user-preferences", {
  theme: "dark",
  language: "en",
});

// Recall a memory
const prefs = await memory.recall("user-preferences");

// Search memories
const results = await memory.search("theme");

// Delete a memory
await memory.forget("user-preferences");

// Get statistics
const stats = await memory.stats();
```

## CLI Commands

```bash
gicm memory remember <key>     # Store memory
gicm memory recall <key>       # Recall memory
gicm memory search <query>     # Search memories
gicm memory forget <key>       # Delete memory
gicm memory stats              # Memory statistics
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `dev.memory_remember` | Store a memory |
| `dev.memory_recall` | Recall a memory |
| `dev.memory_search` | Search memories |
| `dev.memory_forget` | Delete a memory |
| `dev.memory_stats` | Memory statistics |

## Storage Backends

### In-Memory (Default)
```typescript
const memory = new Memory({ storage: "memory" });
```

### Supabase
```typescript
import { SupabaseStorage } from "@gicm/memory";

const storage = new SupabaseStorage({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
});

const memory = new Memory({ storage });
```

## Configuration

```typescript
interface MemoryConfig {
  namespace: string;        // Memory namespace (default: "default")
  storage: "memory" | "supabase" | IMemoryStorage;
  defaultTTL?: number;      // Default TTL in seconds
  maxEntries?: number;      // Max entries per namespace
}
```

## Events

```typescript
memory.on("remembered", ({ key, value }) => {
  console.log(`Stored: ${key}`);
});

memory.on("recalled", ({ key, value }) => {
  console.log(`Retrieved: ${key}`);
});

memory.on("forgotten", ({ key }) => {
  console.log(`Deleted: ${key}`);
});
```

## License

MIT
