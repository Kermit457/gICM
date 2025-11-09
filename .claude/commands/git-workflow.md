# /git-workflow

Orchestrates complete git workflows.

## Usage

```bash
/git-workflow <type> [--branch-name=feature/xyz]
```

## Types

- `feature` - Feature branch workflow
- `hotfix` - Hotfix branch workflow
- `release` - Release branch workflow

## Steps

- Creates branch from main
- Sets up commit conventions
- Prepares PR template
- Runs pre-commit hooks

## Example

```bash
/git-workflow feature --branch-name=feature/wallet-connect
```

---

**Version:** 1.0.0
