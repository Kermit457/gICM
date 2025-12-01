# Integration Hub - Quick Context Loader

> **For AI Agents:** Read this file first when resuming work on the Integration Hub

---

## TL;DR

```
Project: gICM Integration Hub (PTC Platform)
Location: packages/integration-hub/
Phase 8: ✅ COMPLETE (all 6 features)
Phase 9: 🔜 READY TO START
Next Task: 9A - Multi-Tenancy & RBAC
```

---

## What is Integration Hub?

Central coordination platform for gICM with:
- **Pipeline Management** - Create, execute, schedule pipelines
- **Tool Registry** - Register and execute tools programmatically
- **Event Bus** - Cross-service communication
- **Analytics** - Usage metrics and cost tracking
- **Marketplace** - Share and discover pipeline templates

---

## Completed Work (Phase 1-8)

### Core Infrastructure
- `src/hub.ts` - Main IntegrationHub class
- `src/event-bus.ts` - EventEmitter-based event system
- `src/engine-manager.ts` - Engine health & coordination
- `src/analytics.ts` - Metrics collection

### API Layer
- `src/api/server.ts` - Fastify REST server
- `src/api/routes.ts` - API endpoints
- `src/api/websocket.ts` - Real-time WebSocket manager
- `src/api/openapi.ts` - OpenAPI 3.1 spec

### Data Layer
- `src/storage/supabase.ts` - Database client
- `src/storage/migrations/*.sql` - Schema migrations
- `src/queue/` - Bull job queue

### Phase 8 Features
- `src/scheduler/` - Cron-based scheduling
- `src/budgets/` - Cost tracking & alerts
- `src/marketplace/` - Template marketplace
- `src/notifications/` - Webhook delivery

### Dashboard (apps/dashboard)
- `/pipelines` - Main pipeline list
- `/pipelines/schedules` - Schedule management
- `/pipelines/budgets` - Budget & alerts
- `/pipelines/marketplace` - Template browser
- `/pipelines/api-docs` - Interactive API docs
- `/e2e/*.spec.ts` - Playwright tests

---

## Phase 9 Roadmap

| ID | Feature | Priority | Effort |
|----|---------|----------|--------|
| 9A | Multi-Tenancy & RBAC | P0 | Large |
| 9B | Audit Logging | P0 | Medium |
| 9C | Advanced Caching | P1 | Medium |
| 9D | Plugin System | P1 | Large |
| 9E | SDK Generation | P2 | Medium |
| 9F | Performance Dashboard | P2 | Medium |

**Recommended Start:** 9A (Multi-Tenancy) - Foundation for enterprise features

---

## Key Patterns

### Zod Schemas First
```typescript
// Always define schema first
export const SomethingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  // ...
});
export type Something = z.infer<typeof SomethingSchema>;
```

### EventEmitter Pattern
```typescript
export class SomeManager extends EventEmitter<SomeEvents> {
  constructor(config: Config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
}
```

### Singleton + Factory
```typescript
let instance: SomeManager | null = null;

export function getSomeManager(config?: Config): SomeManager {
  if (!instance) {
    instance = new SomeManager(config);
  }
  return instance;
}

export function createSomeManager(config?: Config): SomeManager {
  return new SomeManager(config);
}
```

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Types | `types.ts` | `src/budgets/types.ts` |
| Manager | `*-manager.ts` | `src/budgets/budget-manager.ts` |
| Index | `index.ts` | `src/budgets/index.ts` |
| Migration | `NNN_name.sql` | `003_budgets.sql` |
| Component | `PascalCase.tsx` | `BudgetCard.tsx` |
| Test | `*.spec.ts` | `budgets.spec.ts` |

---

## Commands

```bash
# Build
pnpm --filter @gicm/integration-hub build

# Build dashboard
pnpm --filter dashboard build

# Run E2E tests
cd apps/dashboard && npx playwright test

# Run specific test
npx playwright test budgets.spec.ts
```

---

## Starting Phase 9A

**Files to Create:**
```
packages/integration-hub/src/auth/
├── types.ts              # Role, Permission, Org schemas
├── rbac-manager.ts       # Permission checking
├── permissions.ts        # Permission definitions
└── index.ts

packages/integration-hub/src/storage/migrations/
└── 004_rbac.sql          # Organizations, members, roles tables

apps/dashboard/app/settings/team/
└── page.tsx              # Team management UI

apps/dashboard/components/team/
├── MemberList.tsx
├── InviteModal.tsx
└── RoleSelect.tsx
```

**Key Decisions:**
- Roles: Owner > Admin > Editor > Viewer
- Org-level isolation for all resources
- Permission format: `resource:action` (e.g., `pipeline:create`)

---

## More Documentation

- **Full Backlog:** `BACKLOG.md`
- **Project Status:** `PROJECT_STATUS.md`
- **Main CLAUDE.md:** `../../CLAUDE.md`

---

*Load this file at the start of any session to quickly understand the project state.*
