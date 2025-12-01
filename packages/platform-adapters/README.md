# @gicm/platform-adapters

Platform adapters for Bolt, Lovable, and universal AI code editors.

## Installation

```bash
npm install @gicm/platform-adapters
# or
pnpm add @gicm/platform-adapters
```

## Features

- **Bolt Adapter** - Integration with Bolt.new
- **Lovable Adapter** - Integration with Lovable.dev
- **Universal Adapter** - Works with any AI code editor

## Usage

```typescript
// Main exports
import { BoltAdapter, LovableAdapter, UniversalAdapter } from "@gicm/platform-adapters";

// Or import specific adapters
import { BoltAdapter } from "@gicm/platform-adapters/bolt";
import { LovableAdapter } from "@gicm/platform-adapters/lovable";
import { UniversalAdapter } from "@gicm/platform-adapters/universal";
```

### Bolt Adapter

```typescript
import { BoltAdapter } from "@gicm/platform-adapters/bolt";

const adapter = new BoltAdapter();
const context = adapter.extractContext(element);
```

### Lovable Adapter

```typescript
import { LovableAdapter } from "@gicm/platform-adapters/lovable";

const adapter = new LovableAdapter();
const context = adapter.extractContext(element);
```

### Universal Adapter

```typescript
import { UniversalAdapter } from "@gicm/platform-adapters/universal";

const adapter = new UniversalAdapter({
  platform: "custom",
});
const context = adapter.extractContext(element);
```

## License

MIT
