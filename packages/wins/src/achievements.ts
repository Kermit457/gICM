import type { Achievement, Win, Streak } from "./types.js";
import type { Storage } from "./storage.js";

const ACHIEVEMENTS: Achievement[] = [
  // Win count achievements
  {
    id: "first_win",
    name: "First Blood",
    description: "Record your first win",
    icon: "first",
    requirement: { type: "wins", target: 1 },
    points: 100,
    rarity: "common",
  },
  {
    id: "10_wins",
    name: "Getting Started",
    description: "Record 10 wins",
    icon: "star",
    requirement: { type: "wins", target: 10 },
    points: 250,
    rarity: "common",
  },
  {
    id: "100_wins",
    name: "Centurion",
    description: "Record 100 wins",
    icon: "100",
    requirement: { type: "wins", target: 100 },
    points: 1000,
    rarity: "rare",
  },
  {
    id: "1000_wins",
    name: "Win Machine",
    description: "Record 1,000 wins",
    icon: "trophy",
    requirement: { type: "wins", target: 1000 },
    points: 5000,
    rarity: "epic",
  },

  // Streak achievements
  {
    id: "3_day_streak",
    name: "Hat Trick",
    description: "Maintain a 3-day win streak",
    icon: "fire",
    requirement: { type: "streak", target: 3 },
    points: 100,
    rarity: "common",
  },
  {
    id: "7_day_streak",
    name: "Week Warrior",
    description: "Maintain a 7-day win streak",
    icon: "fire2",
    requirement: { type: "streak", target: 7 },
    points: 500,
    rarity: "rare",
  },
  {
    id: "30_day_streak",
    name: "Monthly Monster",
    description: "Maintain a 30-day win streak",
    icon: "fire3",
    requirement: { type: "streak", target: 30 },
    points: 2000,
    rarity: "epic",
  },
  {
    id: "100_day_streak",
    name: "Unstoppable",
    description: "Maintain a 100-day win streak",
    icon: "diamond",
    requirement: { type: "streak", target: 100 },
    points: 10000,
    rarity: "legendary",
  },

  // Category achievements
  {
    id: "money_master",
    name: "Money Master",
    description: "Record 100 money wins",
    icon: "money",
    requirement: { type: "category", target: 100, category: "money" },
    points: 1000,
    rarity: "rare",
  },
  {
    id: "growth_guru",
    name: "Growth Guru",
    description: "Record 100 growth wins",
    icon: "chart",
    requirement: { type: "category", target: 100, category: "growth" },
    points: 1000,
    rarity: "rare",
  },
  {
    id: "product_pro",
    name: "Product Pro",
    description: "Record 100 product wins",
    icon: "wrench",
    requirement: { type: "category", target: 100, category: "product" },
    points: 1000,
    rarity: "rare",
  },

  // Combo achievements
  {
    id: "diversified",
    name: "Diversified",
    description: "Win in all 5 categories in one day",
    icon: "rainbow",
    requirement: { type: "custom", target: 5 },
    points: 500,
    rarity: "rare",
  },

  // Points achievements
  {
    id: "10k_points",
    name: "Point Collector",
    description: "Accumulate 10,000 points",
    icon: "target",
    requirement: { type: "points", target: 10000 },
    points: 1000,
    rarity: "rare",
  },
  {
    id: "100k_points",
    name: "Point Hoarder",
    description: "Accumulate 100,000 points",
    icon: "target2",
    requirement: { type: "points", target: 100000 },
    points: 5000,
    rarity: "epic",
  },
  {
    id: "1m_points",
    name: "Point Millionaire",
    description: "Accumulate 1,000,000 points",
    icon: "crown",
    requirement: { type: "points", target: 1000000 },
    points: 50000,
    rarity: "legendary",
  },
];

export class AchievementManager {
  private storage: Storage;
  private unlocked: Set<string> = new Set();

  constructor(storage: Storage) {
    this.storage = storage;
    this.loadUnlocked();
  }

  async checkAll(wins: Win[], streak: Streak): Promise<Achievement[]> {
    await this.loadUnlocked();
    const newlyUnlocked: Achievement[] = [];
    const totalPoints = wins.reduce((sum, w) => sum + w.totalPoints, 0);

    for (const achievement of ACHIEVEMENTS) {
      if (this.unlocked.has(achievement.id)) continue;

      let unlocked = false;

      switch (achievement.requirement.type) {
        case "wins":
          unlocked = wins.length >= achievement.requirement.target;
          break;
        case "streak":
          unlocked = streak.current >= achievement.requirement.target ||
            streak.longest >= achievement.requirement.target;
          break;
        case "points":
          unlocked = totalPoints >= achievement.requirement.target;
          break;
        case "category":
          const categoryWins = wins.filter(
            w => w.category === achievement.requirement.category
          );
          unlocked = categoryWins.length >= achievement.requirement.target;
          break;
        case "custom":
          if (achievement.id === "diversified") {
            const today = new Date().toISOString().split("T")[0];
            const todayWins = wins.filter(
              w => new Date(w.timestamp).toISOString().split("T")[0] === today
            );
            const categories = new Set(todayWins.map(w => w.category));
            unlocked = categories.size >= 5;
          }
          break;
      }

      if (unlocked) {
        const unlockedAchievement = { ...achievement, unlockedAt: Date.now() };
        this.unlocked.add(achievement.id);
        newlyUnlocked.push(unlockedAchievement);
        console.log(`\n  ACHIEVEMENT UNLOCKED: ${achievement.name} (+${achievement.points} pts)`);
      }
    }

    if (newlyUnlocked.length > 0) {
      await this.saveUnlocked();
    }

    return newlyUnlocked;
  }

  async getUnlocked(): Promise<Achievement[]> {
    await this.loadUnlocked();
    return ACHIEVEMENTS.filter(a => this.unlocked.has(a.id)).map(a => ({
      ...a,
      unlockedAt: Date.now(),
    }));
  }

  async getAll(): Promise<Achievement[]> {
    await this.loadUnlocked();
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlockedAt: this.unlocked.has(a.id) ? Date.now() : undefined,
    }));
  }

  private async loadUnlocked(): Promise<void> {
    const data = await this.storage.getAchievements();
    this.unlocked = new Set(data.map((a) => a.id));
  }

  private async saveUnlocked(): Promise<void> {
    const unlocked = ACHIEVEMENTS.filter(a => this.unlocked.has(a.id)).map(a => ({
      ...a,
      unlockedAt: Date.now(),
    }));
    await this.storage.saveAchievements(unlocked);
  }
}
