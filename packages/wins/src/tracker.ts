import { EventEmitter } from "events";
import type { Win, WinCategory, DailyStats, Streak, AllTimeStats } from "./types.js";
import { StreakManager } from "./streaks.js";
import { AchievementManager } from "./achievements.js";
import { calculateMultipliers } from "./multipliers.js";
import { Storage } from "./storage.js";

export class WinTracker extends EventEmitter {
  private storage: Storage;
  private streaks: StreakManager;
  private achievements: AchievementManager;

  constructor(dataDir?: string) {
    super();
    this.storage = new Storage(dataDir);
    this.streaks = new StreakManager(this.storage);
    this.achievements = new AchievementManager(this.storage);
  }

  /**
   * Record a win
   */
  async recordWin(input: {
    category: WinCategory;
    subcategory?: string;
    title: string;
    description?: string;
    value: number;
    unit: string;
    source?: Win["source"];
  }): Promise<Win> {

    // Get current streak
    const streak = await this.streaks.getCurrent();

    // Calculate multipliers
    const todayWins = await this.getTodayWins();
    const { streakMultiplier, comboMultiplier } = calculateMultipliers(
      streak,
      todayWins,
      input.category
    );

    // Calculate points
    const basePoints = this.calculateBasePoints(input.value, input.category);
    const totalPoints = Math.round(basePoints * streakMultiplier * comboMultiplier);

    // Create win
    const win: Win = {
      id: `win_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      category: input.category,
      subcategory: input.subcategory || "general",
      title: input.title,
      description: input.description || "",
      value: input.value,
      unit: input.unit,
      source: input.source || {},
      basePoints,
      streakMultiplier,
      comboMultiplier,
      totalPoints,
    };

    // Save
    await this.storage.appendWin(win);

    // Update streak
    const newStreak = await this.streaks.recordWin();

    // Check achievements
    const newAchievements = await this.achievements.checkAll(
      await this.getAllWins(),
      newStreak
    );

    // Emit events
    this.emit("win", win);

    if (newAchievements.length > 0) {
      for (const achievement of newAchievements) {
        this.emit("achievement", achievement);
      }
    }

    // Log
    console.log(`\n  WIN: ${win.title} (+${totalPoints} pts)`);
    if (streakMultiplier > 1) {
      console.log(`     Streak: ${newStreak.current} days (${streakMultiplier.toFixed(1)}x)`);
    }
    if (comboMultiplier > 1) {
      console.log(`     Combo: ${comboMultiplier}x`);
    }

    return win;
  }

  /**
   * Get today's wins
   */
  async getTodayWins(): Promise<Win[]> {
    const today = new Date().toISOString().split("T")[0];
    const allWins = await this.storage.getWins();
    return allWins.filter(w =>
      new Date(w.timestamp).toISOString().split("T")[0] === today
    );
  }

  /**
   * Get today's stats
   */
  async getTodayStats(): Promise<DailyStats> {
    const today = new Date().toISOString().split("T")[0];
    const wins = await this.getTodayWins();
    const streak = await this.streaks.getCurrent();

    const byCategory: Record<WinCategory, number> = {
      money: 0,
      growth: 0,
      product: 0,
      intelligence: 0,
      agent: 0,
    };

    for (const win of wins) {
      byCategory[win.category]++;
    }

    return {
      date: today,
      wins,
      totalWins: wins.length,
      totalPoints: wins.reduce((sum, w) => sum + w.totalPoints, 0),
      byCategory,
      streakDay: streak.current,
      achievements: [],
    };
  }

  /**
   * Get all-time stats
   */
  async getAllTimeStats(): Promise<AllTimeStats> {
    const wins = await this.getAllWins();
    const streak = await this.streaks.getCurrent();
    const achievements = await this.achievements.getUnlocked();

    const byCategory: Record<WinCategory, number> = {
      money: 0,
      growth: 0,
      product: 0,
      intelligence: 0,
      agent: 0,
    };

    for (const win of wins) {
      byCategory[win.category]++;
    }

    return {
      totalWins: wins.length,
      totalPoints: wins.reduce((sum, w) => sum + w.totalPoints, 0),
      currentStreak: streak.current,
      longestStreak: streak.longest,
      byCategory,
      achievements: achievements.length,
    };
  }

  /**
   * Get all wins
   */
  async getAllWins(): Promise<Win[]> {
    return this.storage.getWins();
  }

  /**
   * Get streak info
   */
  async getStreak(): Promise<Streak> {
    return this.streaks.getCurrent();
  }

  /**
   * Get all achievements
   */
  async getAchievements() {
    return this.achievements.getAll();
  }

  /**
   * Get unlocked achievements
   */
  async getUnlockedAchievements() {
    return this.achievements.getUnlocked();
  }

  private calculateBasePoints(value: number, category: WinCategory): number {
    // Base points depend on category and value
    const categoryMultiplier: Record<WinCategory, number> = {
      money: 1,          // $1 = 1 point
      growth: 0.01,      // 100 views = 1 point
      product: 50,       // 1 feature = 50 points
      intelligence: 100, // 1 pattern = 100 points
      agent: 10,         // 1 success = 10 points
    };

    return Math.max(1, Math.round(value * categoryMultiplier[category]));
  }
}
