

## gICM Integration

This project is configured with gICM for enhanced AI development capabilities.

### Available MCP Tools

- `dev.search_code` - Semantic search across the codebase
- `dev.get_context_bundle` - Get relevant context for a task
- `dev.plan_change` - Generate implementation plans
- `dev.run_agent` - Execute specialized gICM agents
- `dev.status` - Check project and indexing status

### Usage

The gICM MCP server is configured in `.claude/settings.local.json`.
Use `gicm index` to update the codebase index when files change significantly.

### Autonomy Level

Current autonomy level: **2** (Bounded - auto-executes safe actions)

