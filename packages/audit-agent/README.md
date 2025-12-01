# @gicm/audit-agent

> AI-powered smart contract security auditor - Vulnerability detection for Solidity & Rust

[![npm version](https://badge.fury.io/js/@gicm%2Faudit-agent.svg)](https://www.npmjs.com/package/@gicm/audit-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/audit-agent
# or
pnpm add @gicm/audit-agent
```

## Features

- **Solidity Auditing**: Reentrancy, overflow, access control
- **Rust/Anchor Auditing**: PDA validation, signer checks
- **OWASP Coverage**: Top smart contract vulnerabilities
- **Report Generation**: Detailed findings with severity

## Quick Start

```typescript
import { AuditAgent } from "@gicm/audit-agent";

const agent = new AuditAgent();

const report = await agent.run({
  source: "./contracts/MyContract.sol",
  depth: "comprehensive",
});
```

## License

MIT - Built by [gICM](https://gicm.dev)
