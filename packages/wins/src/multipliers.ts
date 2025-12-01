import type { Streak, Win, WinCategory } from "./types.js";

export function calculateMultipliers(
  streak: Streak,
  todayWins: Win[],
  newCategory: WinCategory
): { streakMultiplier: number; comboMultiplier: number } {

  // Streak multiplier: +10% per consecutive day
  const streakMultiplier = 1 + (streak.current * 0.1);

  // Combo multiplier: based on category diversity today
  const categoriesHit = new Set(todayWins.map(w => w.category));
  categoriesHit.add(newCategory);

  let comboMultiplier = 1;
  if (categoriesHit.size >= 5) {
    comboMultiplier = 5;  // ALL categories = 5x (LEGENDARY)
  } else if (categoriesHit.size >= 4) {
    comboMultiplier = 3;
  } else if (categoriesHit.size >= 3) {
    comboMultiplier = 2;
  } else if (categoriesHit.size >= 2) {
    comboMultiplier = 1.5;
  }

  return {
    streakMultiplier: Math.round(streakMultiplier * 10) / 10,
    comboMultiplier,
  };
}

/**
 * Calculate streak bonus for milestone days
 */
export function getStreakBonus(streakDays: number): number {
  if (streakDays >= 100) return 10000;
  if (streakDays >= 30) return 2000;
  if (streakDays >= 7) return 500;
  if (streakDays >= 3) return 100;
  return 0;
}
