# @gicm/workflow-engine

Multi-agent workflow orchestration engine for the gICM platform.

## Features

- Define multi-step workflows with YAML or TypeScript
- Sequential and parallel step execution
- Built-in error handling strategies (fail, retry, continue, fallback)
- Workflow templates for common patterns
- Cron-based scheduling
- Event-driven architecture
- File-based workflow storage

## Installation

```bash
npm install @gicm/workflow-engine
# or
pnpm add @gicm/workflow-engine
```

## Usage

```typescript
import { WorkflowEngine } from "@gicm/workflow-engine";

const engine = new WorkflowEngine();

// Define a workflow
const workflow = await engine.create({
  name: "deploy-pipeline",
  description: "Build, test, and deploy",
  steps: [
    {
      id: "build",
      name: "Build Project",
      agent: "builder-agent",
      input: { command: "pnpm build" },
    },
    {
      id: "test",
      name: "Run Tests",
      agent: "test-agent",
      input: { command: "pnpm test" },
      dependsOn: ["build"],
    },
    {
      id: "deploy",
      name: "Deploy",
      agent: "deployer-agent",
      input: { target: "production" },
      dependsOn: ["test"],
    },
  ],
  onError: "fail",
});

// Execute workflow
const execution = await engine.run(workflow.id);

// Check status
const status = await engine.status(execution.id);
```

## CLI Commands

```bash
gicm workflow create <name>    # Create workflow
gicm workflow list             # List workflows
gicm workflow run <name>       # Execute workflow
gicm workflow status [id]      # Check status
gicm workflow delete <name>    # Delete workflow
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `dev.workflow_create` | Create workflow definition |
| `dev.workflow_run` | Execute workflow |
| `dev.workflow_status` | Get execution status |
| `dev.workflow_list` | List available workflows |

## Workflow Definition

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers?: WorkflowTrigger[];
  onError?: ErrorStrategy;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

interface WorkflowStep {
  id: string;
  name: string;
  agent: string;           // Agent to execute this step
  input?: unknown;         // Input for the agent
  dependsOn?: string[];    // Step dependencies
  condition?: string;      // Conditional execution
  timeout?: number;        // Step timeout
  retries?: number;        // Retry count
  onError?: ErrorStrategy; // Step-level error handling
}
```

## Error Strategies

```typescript
type ErrorStrategy = "fail" | "retry" | "continue" | "fallback";
```

- **fail**: Stop workflow on error (default)
- **retry**: Retry step with exponential backoff
- **continue**: Skip failed step, continue workflow
- **fallback**: Execute fallback step

## Templates

Built-in workflow templates for common patterns:

```typescript
import { templates, getTemplate } from "@gicm/workflow-engine/templates";

// Get a template
const ciTemplate = getTemplate("ci-pipeline");

// List all templates
const allTemplates = listTemplates();
```

### Available Templates

| Template | Description |
|----------|-------------|
| `ci-pipeline` | Build, test, deploy pipeline |
| `code-review` | Automated code review workflow |
| `data-pipeline` | ETL data processing |
| `security-scan` | Security audit workflow |

## Scheduling

```typescript
const workflow = await engine.create({
  name: "daily-backup",
  triggers: [
    {
      type: "cron",
      schedule: "0 0 * * *", // Daily at midnight
    },
  ],
  steps: [...],
});
```

## Events

```typescript
engine.on("workflow:started", ({ workflowId, executionId }) => {
  console.log(`Started: ${workflowId}`);
});

engine.on("step:completed", ({ stepId, result }) => {
  console.log(`Step ${stepId} completed`);
});

engine.on("workflow:completed", ({ executionId, status }) => {
  console.log(`Workflow ${status}`);
});

engine.on("workflow:failed", ({ executionId, error }) => {
  console.error(`Failed: ${error.message}`);
});
```

## License

MIT
