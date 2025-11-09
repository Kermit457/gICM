# /deploy-prepare-release

Validates and prepares release packages.

## Usage

```bash
/deploy-prepare-release <version>
```

## Steps

- Updates version numbers
- Generates changelog
- Runs pre-release checks
- Creates git tag
- Builds production bundle

## Example

```bash
/deploy-prepare-release 1.2.0
```

---

**Version:** 1.0.0
