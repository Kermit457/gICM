import type { Streak } from "./types.js";
import type { Storage } from "./storage.js";

export class StreakManager {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async getCurrent(): Promise<Streak> {
    const streak = await this.storage.getStreak();

    // Check if streak is broken (no win yesterday)
    const now = Date.now();
    const today = this.getDateString(now);
    const lastWinDate = streak.lastWinAt ? this.getDateString(streak.lastWinAt) : null;

    if (!lastWinDate) {
      return streak;
    }

    // If last win was today, streak is still active
    if (lastWinDate === today) {
      return streak;
    }

    // If last win was yesterday, streak is still active
    const yesterday = this.getDateString(now - 24 * 60 * 60 * 1000);
    if (lastWinDate === yesterday) {
      return streak;
    }

    // Streak is broken - reset current but keep longest
    if (streak.current > 0) {
      streak.current = 0;
      streak.startedAt = 0;
      await this.storage.saveStreak(streak);
    }

    return streak;
  }

  async recordWin(): Promise<Streak> {
    const streak = await this.storage.getStreak();
    const now = Date.now();
    const today = this.getDateString(now);
    const lastWinDate = streak.lastWinAt ? this.getDateString(streak.lastWinAt) : null;

    // If this is the first win ever
    if (!lastWinDate) {
      const newStreak: Streak = {
        current: 1,
        longest: 1,
        startedAt: now,
        lastWinAt: now,
      };
      await this.storage.saveStreak(newStreak);
      return newStreak;
    }

    // If already won today, don't increment streak
    if (lastWinDate === today) {
      return streak;
    }

    // Check if streak continues
    const yesterday = this.getDateString(now - 24 * 60 * 60 * 1000);

    if (lastWinDate === yesterday) {
      // Continue streak
      streak.current += 1;
      streak.lastWinAt = now;
      if (streak.current > streak.longest) {
        streak.longest = streak.current;
      }
    } else {
      // Start new streak
      streak.current = 1;
      streak.startedAt = now;
      streak.lastWinAt = now;
    }

    await this.storage.saveStreak(streak);
    return streak;
  }

  private getDateString(timestamp: number): string {
    return new Date(timestamp).toISOString().split("T")[0];
  }
}
