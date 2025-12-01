import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Win, Streak, Achievement } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Storage {
  private dataDir: string;
  private winsFile: string;
  private streaksFile: string;
  private achievementsFile: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || join(__dirname, "..", "data");
    this.winsFile = join(this.dataDir, "wins.json");
    this.streaksFile = join(this.dataDir, "streaks.json");
    this.achievementsFile = join(this.dataDir, "achievements.json");
  }

  async ensureDataDir(): Promise<void> {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }
  }

  // WINS
  async getWins(): Promise<Win[]> {
    await this.ensureDataDir();
    try {
      const data = await readFile(this.winsFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async appendWin(win: Win): Promise<void> {
    const wins = await this.getWins();
    wins.push(win);
    await this.saveWins(wins);
  }

  async saveWins(wins: Win[]): Promise<void> {
    await this.ensureDataDir();
    await writeFile(this.winsFile, JSON.stringify(wins, null, 2));
  }

  // STREAKS
  async getStreak(): Promise<Streak> {
    await this.ensureDataDir();
    try {
      const data = await readFile(this.streaksFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return {
        current: 0,
        longest: 0,
        startedAt: 0,
        lastWinAt: 0,
      };
    }
  }

  async saveStreak(streak: Streak): Promise<void> {
    await this.ensureDataDir();
    await writeFile(this.streaksFile, JSON.stringify(streak, null, 2));
  }

  // ACHIEVEMENTS
  async getAchievements(): Promise<Achievement[]> {
    await this.ensureDataDir();
    try {
      const data = await readFile(this.achievementsFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveAchievements(achievements: Achievement[]): Promise<void> {
    await this.ensureDataDir();
    await writeFile(this.achievementsFile, JSON.stringify(achievements, null, 2));
  }
}
