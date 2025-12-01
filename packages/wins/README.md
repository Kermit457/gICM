# @gicm/wins

gICM Win Tracker - Track wins, streaks, and achievements.

## Installation

```bash
npm install @gicm/wins
# or
pnpm add @gicm/wins
```

## Features

- **Win Tracking** - Record and track wins
- **Streaks** - Track winning and losing streaks
- **Achievements** - Unlock achievements based on performance
- **CLI Interface** - Command-line win management

## Usage

```typescript
import { WinTracker } from "@gicm/wins";

const tracker = new WinTracker();

// Record a win
tracker.recordWin({
  type: "trade",
  profit: 150,
  details: "SOL/USDC swing trade",
});

// Get current streak
const streak = tracker.getCurrentStreak();
console.log(`Current streak: ${streak} wins`);

// Get statistics
const stats = tracker.getStats();
console.log(stats);
// { totalWins: 42, bestStreak: 7, winRate: 68% }
```

## CLI

```bash
# Record a win
wins add "Successful arbitrage trade"

# View all wins
wins list

# View stats
wins stats

# Check achievements
wins achievements
```

## License

MIT
