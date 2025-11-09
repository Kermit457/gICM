# /deploy-rollback

Reverts to previous deployment versions.

## Usage

```bash
/deploy-rollback [--to-version=1.1.0]
```

## Features

- Identifies previous version
- Executes rollback procedures
- Runs health checks
- Updates DNS/load balancer

## Example

```bash
/deploy-rollback --to-version=1.1.0
```

---

**Version:** 1.0.0
