// src/tracker.ts
import { EventEmitter } from "events";

// src/streaks.ts
var StreakManager = class {
  storage;
  constructor(storage) {
    this.storage = storage;
  }
  async getCurrent() {
    const streak = await this.storage.getStreak();
    const now = Date.now();
    const today = this.getDateString(now);
    const lastWinDate = streak.lastWinAt ? this.getDateString(streak.lastWinAt) : null;
    if (!lastWinDate) {
      return streak;
    }
    if (lastWinDate === today) {
      return streak;
    }
    const yesterday = this.getDateString(now - 24 * 60 * 60 * 1e3);
    if (lastWinDate === yesterday) {
      return streak;
    }
    if (streak.current > 0) {
      streak.current = 0;
      streak.startedAt = 0;
      await this.storage.saveStreak(streak);
    }
    return streak;
  }
  async recordWin() {
    const streak = await this.storage.getStreak();
    const now = Date.now();
    const today = this.getDateString(now);
    const lastWinDate = streak.lastWinAt ? this.getDateString(streak.lastWinAt) : null;
    if (!lastWinDate) {
      const newStreak = {
        current: 1,
        longest: 1,
        startedAt: now,
        lastWinAt: now
      };
      await this.storage.saveStreak(newStreak);
      return newStreak;
    }
    if (lastWinDate === today) {
      return streak;
    }
    const yesterday = this.getDateString(now - 24 * 60 * 60 * 1e3);
    if (lastWinDate === yesterday) {
      streak.current += 1;
      streak.lastWinAt = now;
      if (streak.current > streak.longest) {
        streak.longest = streak.current;
      }
    } else {
      streak.current = 1;
      streak.startedAt = now;
      streak.lastWinAt = now;
    }
    await this.storage.saveStreak(streak);
    return streak;
  }
  getDateString(timestamp) {
    return new Date(timestamp).toISOString().split("T")[0];
  }
};

// src/achievements.ts
var ACHIEVEMENTS = [
  // Win count achievements
  {
    id: "first_win",
    name: "First Blood",
    description: "Record your first win",
    icon: "first",
    requirement: { type: "wins", target: 1 },
    points: 100,
    rarity: "common"
  },
  {
    id: "10_wins",
    name: "Getting Started",
    description: "Record 10 wins",
    icon: "star",
    requirement: { type: "wins", target: 10 },
    points: 250,
    rarity: "common"
  },
  {
    id: "100_wins",
    name: "Centurion",
    description: "Record 100 wins",
    icon: "100",
    requirement: { type: "wins", target: 100 },
    points: 1e3,
    rarity: "rare"
  },
  {
    id: "1000_wins",
    name: "Win Machine",
    description: "Record 1,000 wins",
    icon: "trophy",
    requirement: { type: "wins", target: 1e3 },
    points: 5e3,
    rarity: "epic"
  },
  // Streak achievements
  {
    id: "3_day_streak",
    name: "Hat Trick",
    description: "Maintain a 3-day win streak",
    icon: "fire",
    requirement: { type: "streak", target: 3 },
    points: 100,
    rarity: "common"
  },
  {
    id: "7_day_streak",
    name: "Week Warrior",
    description: "Maintain a 7-day win streak",
    icon: "fire2",
    requirement: { type: "streak", target: 7 },
    points: 500,
    rarity: "rare"
  },
  {
    id: "30_day_streak",
    name: "Monthly Monster",
    description: "Maintain a 30-day win streak",
    icon: "fire3",
    requirement: { type: "streak", target: 30 },
    points: 2e3,
    rarity: "epic"
  },
  {
    id: "100_day_streak",
    name: "Unstoppable",
    description: "Maintain a 100-day win streak",
    icon: "diamond",
    requirement: { type: "streak", target: 100 },
    points: 1e4,
    rarity: "legendary"
  },
  // Category achievements
  {
    id: "money_master",
    name: "Money Master",
    description: "Record 100 money wins",
    icon: "money",
    requirement: { type: "category", target: 100, category: "money" },
    points: 1e3,
    rarity: "rare"
  },
  {
    id: "growth_guru",
    name: "Growth Guru",
    description: "Record 100 growth wins",
    icon: "chart",
    requirement: { type: "category", target: 100, category: "growth" },
    points: 1e3,
    rarity: "rare"
  },
  {
    id: "product_pro",
    name: "Product Pro",
    description: "Record 100 product wins",
    icon: "wrench",
    requirement: { type: "category", target: 100, category: "product" },
    points: 1e3,
    rarity: "rare"
  },
  // Combo achievements
  {
    id: "diversified",
    name: "Diversified",
    description: "Win in all 5 categories in one day",
    icon: "rainbow",
    requirement: { type: "custom", target: 5 },
    points: 500,
    rarity: "rare"
  },
  // Points achievements
  {
    id: "10k_points",
    name: "Point Collector",
    description: "Accumulate 10,000 points",
    icon: "target",
    requirement: { type: "points", target: 1e4 },
    points: 1e3,
    rarity: "rare"
  },
  {
    id: "100k_points",
    name: "Point Hoarder",
    description: "Accumulate 100,000 points",
    icon: "target2",
    requirement: { type: "points", target: 1e5 },
    points: 5e3,
    rarity: "epic"
  },
  {
    id: "1m_points",
    name: "Point Millionaire",
    description: "Accumulate 1,000,000 points",
    icon: "crown",
    requirement: { type: "points", target: 1e6 },
    points: 5e4,
    rarity: "legendary"
  }
];
var AchievementManager = class {
  storage;
  unlocked = /* @__PURE__ */ new Set();
  constructor(storage) {
    this.storage = storage;
    this.loadUnlocked();
  }
  async checkAll(wins, streak) {
    await this.loadUnlocked();
    const newlyUnlocked = [];
    const totalPoints = wins.reduce((sum, w) => sum + w.totalPoints, 0);
    for (const achievement of ACHIEVEMENTS) {
      if (this.unlocked.has(achievement.id)) continue;
      let unlocked = false;
      switch (achievement.requirement.type) {
        case "wins":
          unlocked = wins.length >= achievement.requirement.target;
          break;
        case "streak":
          unlocked = streak.current >= achievement.requirement.target || streak.longest >= achievement.requirement.target;
          break;
        case "points":
          unlocked = totalPoints >= achievement.requirement.target;
          break;
        case "category":
          const categoryWins = wins.filter(
            (w) => w.category === achievement.requirement.category
          );
          unlocked = categoryWins.length >= achievement.requirement.target;
          break;
        case "custom":
          if (achievement.id === "diversified") {
            const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
            const todayWins = wins.filter(
              (w) => new Date(w.timestamp).toISOString().split("T")[0] === today
            );
            const categories = new Set(todayWins.map((w) => w.category));
            unlocked = categories.size >= 5;
          }
          break;
      }
      if (unlocked) {
        const unlockedAchievement = { ...achievement, unlockedAt: Date.now() };
        this.unlocked.add(achievement.id);
        newlyUnlocked.push(unlockedAchievement);
        console.log(`
  ACHIEVEMENT UNLOCKED: ${achievement.name} (+${achievement.points} pts)`);
      }
    }
    if (newlyUnlocked.length > 0) {
      await this.saveUnlocked();
    }
    return newlyUnlocked;
  }
  async getUnlocked() {
    await this.loadUnlocked();
    return ACHIEVEMENTS.filter((a) => this.unlocked.has(a.id)).map((a) => ({
      ...a,
      unlockedAt: Date.now()
    }));
  }
  async getAll() {
    await this.loadUnlocked();
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      unlockedAt: this.unlocked.has(a.id) ? Date.now() : void 0
    }));
  }
  async loadUnlocked() {
    const data = await this.storage.getAchievements();
    this.unlocked = new Set(data.map((a) => a.id));
  }
  async saveUnlocked() {
    const unlocked = ACHIEVEMENTS.filter((a) => this.unlocked.has(a.id)).map((a) => ({
      ...a,
      unlockedAt: Date.now()
    }));
    await this.storage.saveAchievements(unlocked);
  }
};

// src/multipliers.ts
function calculateMultipliers(streak, todayWins, newCategory) {
  const streakMultiplier = 1 + streak.current * 0.1;
  const categoriesHit = new Set(todayWins.map((w) => w.category));
  categoriesHit.add(newCategory);
  let comboMultiplier = 1;
  if (categoriesHit.size >= 5) {
    comboMultiplier = 5;
  } else if (categoriesHit.size >= 4) {
    comboMultiplier = 3;
  } else if (categoriesHit.size >= 3) {
    comboMultiplier = 2;
  } else if (categoriesHit.size >= 2) {
    comboMultiplier = 1.5;
  }
  return {
    streakMultiplier: Math.round(streakMultiplier * 10) / 10,
    comboMultiplier
  };
}
function getStreakBonus(streakDays) {
  if (streakDays >= 100) return 1e4;
  if (streakDays >= 30) return 2e3;
  if (streakDays >= 7) return 500;
  if (streakDays >= 3) return 100;
  return 0;
}

// src/storage.ts
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = dirname(__filename2);
var Storage = class {
  dataDir;
  winsFile;
  streaksFile;
  achievementsFile;
  constructor(dataDir) {
    this.dataDir = dataDir || join(__dirname2, "..", "data");
    this.winsFile = join(this.dataDir, "wins.json");
    this.streaksFile = join(this.dataDir, "streaks.json");
    this.achievementsFile = join(this.dataDir, "achievements.json");
  }
  async ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }
  }
  // WINS
  async getWins() {
    await this.ensureDataDir();
    try {
      const data = await readFile(this.winsFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  async appendWin(win) {
    const wins = await this.getWins();
    wins.push(win);
    await this.saveWins(wins);
  }
  async saveWins(wins) {
    await this.ensureDataDir();
    await writeFile(this.winsFile, JSON.stringify(wins, null, 2));
  }
  // STREAKS
  async getStreak() {
    await this.ensureDataDir();
    try {
      const data = await readFile(this.streaksFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return {
        current: 0,
        longest: 0,
        startedAt: 0,
        lastWinAt: 0
      };
    }
  }
  async saveStreak(streak) {
    await this.ensureDataDir();
    await writeFile(this.streaksFile, JSON.stringify(streak, null, 2));
  }
  // ACHIEVEMENTS
  async getAchievements() {
    await this.ensureDataDir();
    try {
      const data = await readFile(this.achievementsFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  async saveAchievements(achievements) {
    await this.ensureDataDir();
    await writeFile(this.achievementsFile, JSON.stringify(achievements, null, 2));
  }
};

// src/tracker.ts
var WinTracker = class extends EventEmitter {
  storage;
  streaks;
  achievements;
  constructor(dataDir) {
    super();
    this.storage = new Storage(dataDir);
    this.streaks = new StreakManager(this.storage);
    this.achievements = new AchievementManager(this.storage);
  }
  /**
   * Record a win
   */
  async recordWin(input) {
    const streak = await this.streaks.getCurrent();
    const todayWins = await this.getTodayWins();
    const { streakMultiplier, comboMultiplier } = calculateMultipliers(
      streak,
      todayWins,
      input.category
    );
    const basePoints = this.calculateBasePoints(input.value, input.category);
    const totalPoints = Math.round(basePoints * streakMultiplier * comboMultiplier);
    const win = {
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
      totalPoints
    };
    await this.storage.appendWin(win);
    const newStreak = await this.streaks.recordWin();
    const newAchievements = await this.achievements.checkAll(
      await this.getAllWins(),
      newStreak
    );
    this.emit("win", win);
    if (newAchievements.length > 0) {
      for (const achievement of newAchievements) {
        this.emit("achievement", achievement);
      }
    }
    console.log(`
  WIN: ${win.title} (+${totalPoints} pts)`);
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
  async getTodayWins() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const allWins = await this.storage.getWins();
    return allWins.filter(
      (w) => new Date(w.timestamp).toISOString().split("T")[0] === today
    );
  }
  /**
   * Get today's stats
   */
  async getTodayStats() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const wins = await this.getTodayWins();
    const streak = await this.streaks.getCurrent();
    const byCategory = {
      money: 0,
      growth: 0,
      product: 0,
      intelligence: 0,
      agent: 0
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
      achievements: []
    };
  }
  /**
   * Get all-time stats
   */
  async getAllTimeStats() {
    const wins = await this.getAllWins();
    const streak = await this.streaks.getCurrent();
    const achievements = await this.achievements.getUnlocked();
    const byCategory = {
      money: 0,
      growth: 0,
      product: 0,
      intelligence: 0,
      agent: 0
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
      achievements: achievements.length
    };
  }
  /**
   * Get all wins
   */
  async getAllWins() {
    return this.storage.getWins();
  }
  /**
   * Get streak info
   */
  async getStreak() {
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
  calculateBasePoints(value, category) {
    const categoryMultiplier = {
      money: 1,
      // $1 = 1 point
      growth: 0.01,
      // 100 views = 1 point
      product: 50,
      // 1 feature = 50 points
      intelligence: 100,
      // 1 pattern = 100 points
      agent: 10
      // 1 success = 10 points
    };
    return Math.max(1, Math.round(value * categoryMultiplier[category]));
  }
};
export {
  AchievementManager,
  Storage,
  StreakManager,
  WinTracker,
  calculateMultipliers,
  getStreakBonus
};
//# sourceMappingURL=index.js.map