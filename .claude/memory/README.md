# gICM Memory System

Persistent memory across sessions for decisions, wins, learnings, and improvements.

## Structure
- `decisions/` - Architectural decisions and rationale
- `wins/` - Achievements and completed features
- `learnings/` - Lessons learned and patterns
- `improvements/` - Ideas and completed improvements
- `context/` - Current sprint and priorities

## Usage
Use `/memory <action> <content>` command:
```bash
/memory win "Completed circuit breaker implementation"
/memory decision "Chose Bull for job queue - better Redis support"
/memory learn "pnpm workspace:* needs explicit build order"
/memory improve "Add caching to MCP server"
```

## Files
- Monthly logs: `2025-12.md`
- Ongoing: `backlog.md`, `completed.md`
- Current: `current-sprint.md`
