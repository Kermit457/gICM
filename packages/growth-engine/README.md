# @gicm/growth-engine

> Autonomous content and marketing automation - 10x traffic every 6 months

[![npm version](https://badge.fury.io/js/@gicm%2Fgrowth-engine.svg)](https://www.npmjs.com/package/@gicm/growth-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @gicm/growth-engine
# or
pnpm add @gicm/growth-engine
```

## Features

- **Blog Generator**: AI-powered posts with SEO optimization
- **Twitter Automation**: Scheduled posting and engagement
- **SEO System**: Keyword research and content optimization
- **Cron Automation**: Weekly blogs, daily tweets

## Quick Start

```typescript
import { GrowthEngine } from "@gicm/growth-engine";

const engine = new GrowthEngine({
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    postsPerDay: 5,
  },
  blog: {
    postsPerWeek: 3,
    seoOptimize: true,
  },
});

await engine.start();
```

## CLI Commands

```bash
gicm-growth start              # Start autonomous engine
gicm-growth generate blog      # Generate blog post
gicm-growth generate tweet     # Generate tweets
gicm-growth keywords <topic>   # Research keywords
gicm-growth status             # Show engine metrics
```

## License

MIT - Built by [gICM](https://gicm.dev)
