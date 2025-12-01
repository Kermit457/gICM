import { EventEmitter } from 'events';

type WinCategory = "money" | "growth" | "product" | "intelligence" | "agent";
interface Win {
    id: string;
    timestamp: number;
    category: WinCategory;
    subcategory: string;
    title: string;
    description: string;
    value: number;
    unit: string;
    source: {
        engine?: string;
        agentId?: string;
        actionId?: string;
    };
    basePoints: number;
    streakMultiplier: number;
    comboMultiplier: number;
    totalPoints: number;
}
interface Streak {
    current: number;
    longest: number;
    startedAt: number;
    lastWinAt: number;
}
interface DailyStats {
    date: string;
    wins: Win[];
    totalWins: number;
    totalPoints: number;
    byCategory: Record<WinCategory, number>;
    streakDay: number;
    achievements: string[];
}
interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: {
        type: "wins" | "streak" | "points" | "category" | "custom";
        target: number;
        category?: WinCategory;
    };
    points: number;
    rarity: "common" | "rare" | "epic" | "legendary";
    unlockedAt?: number;
}
interface AgentStats {
    agentId: string;
    name: string;
    totalWins: number;
    totalPoints: number;
    successRate: number;
    rank: number;
    previousRank: number;
    trend: "up" | "down" | "same";
}
interface AllTimeStats {
    totalWins: number;
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
    byCategory: Record<WinCategory, number>;
    achievements: number;
}

declare class WinTracker extends EventEmitter {
    private storage;
    private streaks;
    private achievements;
    constructor(dataDir?: string);
    /**
     * Record a win
     */
    recordWin(input: {
        category: WinCategory;
        subcategory?: string;
        title: string;
        description?: string;
        value: number;
        unit: string;
        source?: Win["source"];
    }): Promise<Win>;
    /**
     * Get today's wins
     */
    getTodayWins(): Promise<Win[]>;
    /**
     * Get today's stats
     */
    getTodayStats(): Promise<DailyStats>;
    /**
     * Get all-time stats
     */
    getAllTimeStats(): Promise<AllTimeStats>;
    /**
     * Get all wins
     */
    getAllWins(): Promise<Win[]>;
    /**
     * Get streak info
     */
    getStreak(): Promise<Streak>;
    /**
     * Get all achievements
     */
    getAchievements(): Promise<Achievement[]>;
    /**
     * Get unlocked achievements
     */
    getUnlockedAchievements(): Promise<Achievement[]>;
    private calculateBasePoints;
}

declare class Storage {
    private dataDir;
    private winsFile;
    private streaksFile;
    private achievementsFile;
    constructor(dataDir?: string);
    ensureDataDir(): Promise<void>;
    getWins(): Promise<Win[]>;
    appendWin(win: Win): Promise<void>;
    saveWins(wins: Win[]): Promise<void>;
    getStreak(): Promise<Streak>;
    saveStreak(streak: Streak): Promise<void>;
    getAchievements(): Promise<Achievement[]>;
    saveAchievements(achievements: Achievement[]): Promise<void>;
}

declare class StreakManager {
    private storage;
    constructor(storage: Storage);
    getCurrent(): Promise<Streak>;
    recordWin(): Promise<Streak>;
    private getDateString;
}

declare class AchievementManager {
    private storage;
    private unlocked;
    constructor(storage: Storage);
    checkAll(wins: Win[], streak: Streak): Promise<Achievement[]>;
    getUnlocked(): Promise<Achievement[]>;
    getAll(): Promise<Achievement[]>;
    private loadUnlocked;
    private saveUnlocked;
}

declare function calculateMultipliers(streak: Streak, todayWins: Win[], newCategory: WinCategory): {
    streakMultiplier: number;
    comboMultiplier: number;
};
/**
 * Calculate streak bonus for milestone days
 */
declare function getStreakBonus(streakDays: number): number;

export { type Achievement, AchievementManager, type AgentStats, type AllTimeStats, type DailyStats, Storage, type Streak, StreakManager, type Win, type WinCategory, WinTracker, calculateMultipliers, getStreakBonus };
