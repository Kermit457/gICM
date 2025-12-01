# Patterns That Work

## Singleton Pattern for Engines
```typescript
let instance: AutonomyEngine | null = null;
export function getAutonomy(): AutonomyEngine {
  if (!instance) {
    instance = new AutonomyEngine();
  }
  return instance;
}
```

## EventEmitter3 for Agents
Use `EventEmitter3` instead of Node's EventEmitter for better typing:
```typescript
import { EventEmitter } from "eventemitter3";
export class MyAgent extends EventEmitter<AgentEvents> {}
```

## Zod for Runtime Validation
Always validate at API boundaries:
```typescript
const InputSchema = z.object({ ... });
const validated = InputSchema.parse(input);
```

## Adapter Pattern for Engine Integration
Each engine has its own adapter in autonomy:
- `MoneyEngineAdapter`
- `GrowthEngineAdapter`
- `ProductEngineAdapter`
