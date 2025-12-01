# Wins Log

## Format
```markdown
### [Title]
- **Type:** feature|bugfix|performance|security|dx
- **Impact:** high|medium|low
- **Value:** 1-10
- **Description:** What was accomplished
```

## Quick Add
```bash
/memory win "Description of achievement"
```

## Tracked Automatically
Post-bash hook tracks:
- Successful builds (+1)
- Tests passed (+1)
- Packages published (+10)
- Deployments (+5)
