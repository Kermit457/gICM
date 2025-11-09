"use client";

import { useState, useCallback, useEffect } from "react";
import type { PointAction, UserPoints, Achievement } from "@/lib/points";
import {
  getUserPoints,
  saveUserPoints,
  awardPoints,
  addTransaction,
  updateDailyStreak,
  canEarnPoints,
  checkAchievements,
  POINTS_CONFIG,
} from "@/lib/points";
import { toast } from "sonner";

export function usePoints() {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  // Load points on mount
  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = useCallback(() => {
    setLoading(true);
    try {
      const points = getUserPoints();
      setUserPoints(points);
    } catch (error) {
      console.error("Failed to load points:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh points from storage
   */
  const refresh = useCallback(() => {
    loadPoints();
  }, [loadPoints]);

  /**
   * Award points for an action
   */
  const earn = useCallback(
    async (
      action: PointAction,
      options?: {
        metadata?: Record<string, any>;
        statUpdate?: Partial<UserPoints["stats"]>;
        showToast?: boolean;
        silent?: boolean;
      }
    ): Promise<{ success: boolean; points?: number; achievements?: Achievement[] }> => {
      const { metadata, statUpdate, showToast = true, silent = false } = options || {};

      if (!userPoints) {
        return { success: false };
      }

      // Check if can earn
      const check = canEarnPoints(action, userPoints);
      if (!check.can) {
        if (!silent && showToast) {
          toast.error("Cannot earn points", {
            description: check.reason,
          });
        }
        return { success: false };
      }

      // Create transaction
      const transaction = awardPoints(action, metadata);

      // Add transaction and update
      const updated = addTransaction(transaction, statUpdate);

      // Check for new achievements
      const newAchievements = checkAchievements(updated).filter(
        (a) => !userPoints.achievements.includes(a.id)
      );

      setUserPoints(updated);

      // Show toast
      if (showToast && !silent) {
        const config = POINTS_CONFIG[action];

        // Show achievement toasts
        if (newAchievements.length > 0) {
          newAchievements.forEach((achievement) => {
            toast.success(`🎉 Achievement Unlocked!`, {
              description: `${achievement.icon} ${achievement.name} (+${achievement.points} points)`,
            });
          });
        }

        // Show points earned toast
        toast.success(`+${config.points} points`, {
          description: config.label,
        });

        // Show level up toast if level changed
        if (updated.currentLevel.level > userPoints.currentLevel.level) {
          toast.success(`🎊 Level Up!`, {
            description: `You're now ${updated.currentLevel.name} ${updated.currentLevel.badge}`,
          });
        }
      }

      return {
        success: true,
        points: transaction.points,
        achievements: newAchievements,
      };
    },
    [userPoints]
  );

  /**
   * Update daily streak (call on app load)
   */
  const checkDailyVisit = useCallback(async (): Promise<void> => {
    try {
      const updated = updateDailyStreak();
      setUserPoints(updated);
    } catch (error) {
      console.error("Failed to update daily streak:", error);
    }
  }, []);

  /**
   * Manually update stats
   */
  const updateStats = useCallback(
    (statUpdate: Partial<UserPoints["stats"]>): void => {
      if (!userPoints) return;

      const updated = {
        ...userPoints,
        stats: {
          ...userPoints.stats,
          ...statUpdate,
        },
      };

      saveUserPoints(updated);
      setUserPoints(updated);
    },
    [userPoints]
  );

  /**
   * Get progress percentage to next level
   */
  const getProgressPercentage = useCallback((): number => {
    if (!userPoints || !userPoints.nextLevel) return 100;

    const currentLevelMin = userPoints.currentLevel.minPoints;
    const nextLevelMin = userPoints.nextLevel.minPoints;
    const pointsInLevel = nextLevelMin - currentLevelMin;
    const pointsEarned = userPoints.totalPoints - currentLevelMin;

    return (pointsEarned / pointsInLevel) * 100;
  }, [userPoints]);

  /**
   * Get all unlocked achievements
   */
  const getUnlockedAchievements = useCallback((): Achievement[] => {
    if (!userPoints) return [];

    const allAchievements = checkAchievements(userPoints);
    return allAchievements.filter((a) => userPoints.achievements.includes(a.id));
  }, [userPoints]);

  /**
   * Get achievement progress
   */
  const getAchievementProgress = useCallback(
    (achievementId: string): number => {
      if (!userPoints) return 0;

      // This is a simplified version - real implementation would parse requirements
      const achievement = checkAchievements(userPoints).find((a) => a.id === achievementId);
      if (!achievement) return 0;

      // Example: parse requirement and calculate progress
      // For now, return 0 if not unlocked, 100 if unlocked
      return userPoints.achievements.includes(achievementId) ? 100 : 0;
    },
    [userPoints]
  );

  return {
    userPoints,
    loading,
    earn,
    refresh,
    checkDailyVisit,
    updateStats,
    getProgressPercentage,
    getUnlockedAchievements,
    getAchievementProgress,
  };
}
