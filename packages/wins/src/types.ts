export type WinCategory = "money" | "growth" | "product" | "intelligence" | "agent";

export interface Win {
  id: string;
  timestamp: number;

  // Classification
  category: WinCategory;
  subcategory: string;

  // Details
  title: string;
  description: string;

  // Value
  value: number;
  unit: string;  // "$", "views", "%", "count"

  // Attribution
  source: {
    engine?: string;
    agentId?: string;
    actionId?: string;
  };

  // Points
  basePoints: number;
  streakMultiplier: number;
  comboMultiplier: number;
  totalPoints: number;
}

export interface Streak {
  current: number;
  longest: number;
  startedAt: number;
  lastWinAt: number;
}

export interface DailyStats {
  date: string;
  wins: Win[];
  totalWins: number;
  totalPoints: number;
  byCategory: Record<WinCategory, number>;
  streakDay: number;
  achievements: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;

  // Requirements
  requirement: {
    type: "wins" | "streak" | "points" | "category" | "custom";
    target: number;
    category?: WinCategory;
  };

  // Reward
  points: number;
  rarity: "common" | "rare" | "epic" | "legendary";

  // Status
  unlockedAt?: number;
}

export interface AgentStats {
  agentId: string;
  name: string;

  totalWins: number;
  totalPoints: number;
  successRate: number;

  // Ranking
  rank: number;
  previousRank: number;
  trend: "up" | "down" | "same";
}

export interface AllTimeStats {
  totalWins: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  byCategory: Record<WinCategory, number>;
  achievements: number;
}
