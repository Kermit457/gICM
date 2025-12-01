# Command: /memory

> Access and update persistent memory

## Description
The `/memory` command provides access to the persistent memory system for tracking decisions, wins, learnings, and improvements across sessions.

## Usage
```bash
/memory [action] [content]
```

## Actions

### Log a Win
```bash
/memory win "Completed circuit breaker implementation"
/memory win --value=10 "Full Integration Hub deployed"
```

### Record a Decision
```bash
/memory decision "Chose Bull over Agenda for job queue - better Redis support"
```

### Add a Learning
```bash
/memory learn "pnpm workspace:* requires explicit build order"
```

### Add Improvement Idea
```bash
/memory improve "Add caching layer to MCP server responses"
```

### View Memory
```bash
/memory show                # Show recent entries
/memory show wins           # Show recent wins
/memory show decisions      # Show recent decisions
```

### Search Memory
```bash
/memory search "typescript"
```

## Memory Categories
- `wins` - Achievements and completed features
- `decisions` - Architecture and technical decisions
- `learnings` - Lessons learned and patterns
- `improvements` - Ideas for future work
- `context` - Current sprint and priorities

## Files Updated
- `decisions/YYYY-MM.md` - Monthly decision log
- `wins/YYYY-MM.md` - Monthly wins log
- `learnings/bugs-fixed.md` - Bug solutions
- `learnings/patterns-discovered.md` - Useful patterns
- `improvements/backlog.md` - Ideas queue
- `improvements/completed.md` - Done items
- `context/current-sprint.md` - Active focus

## Best Practices
1. **Log wins immediately** - Don't wait until sprint end
2. **Include metrics** - Quantify impact when possible
3. **Add keywords** - Make entries searchable
4. **Link related items** - Reference related decisions/learnings

## Related
- See `.claude/memory/README.md` for full documentation
- Wins auto-tracked by post-bash hook
