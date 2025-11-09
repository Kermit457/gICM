"use client";

import { Card } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Button } from "./button";
import { Sparkles, TrendingUp, Award, Zap } from "lucide-react";
import type { UserPoints } from "@/lib/points";

interface PointsDisplayProps {
  userPoints: UserPoints;
  variant?: "full" | "compact" | "mini";
  onViewDetails?: () => void;
}

export function PointsDisplay({
  userPoints,
  variant = "full",
  onViewDetails,
}: PointsDisplayProps) {
  const progressPercentage = userPoints.nextLevel
    ? ((userPoints.totalPoints - userPoints.currentLevel.minPoints) /
        (userPoints.nextLevel.minPoints - userPoints.currentLevel.minPoints)) *
      100
    : 100;

  if (variant === "mini") {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: `${userPoints.currentLevel.color}20` }}
        >
          {userPoints.currentLevel.badge}
        </div>
        <div>
          <p className="text-xs font-medium text-black">
            {userPoints.totalPoints.toLocaleString()} pts
          </p>
          <p className="text-[10px] text-zinc-500">{userPoints.currentLevel.name}</p>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: `${userPoints.currentLevel.color}20` }}
            >
              {userPoints.currentLevel.badge}
            </div>
            <div>
              <p className="font-semibold text-black">{userPoints.currentLevel.name}</p>
              <p className="text-xs text-zinc-500">
                Level {userPoints.currentLevel.level}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-black">
              {userPoints.totalPoints.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500">points</p>
          </div>
        </div>

        {userPoints.nextLevel && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-500">Progress to {userPoints.nextLevel.name}</span>
              <span className="font-medium text-black">
                {userPoints.pointsToNextLevel} to go
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </Card>
    );
  }

  // Full variant
  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-md"
            style={{
              backgroundColor: `${userPoints.currentLevel.color}20`,
              border: `2px solid ${userPoints.currentLevel.color}`,
            }}
          >
            {userPoints.currentLevel.badge}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-black">
              {userPoints.currentLevel.name}
            </h3>
            <p className="text-sm text-zinc-600">Level {userPoints.currentLevel.level}</p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-lg font-bold px-3 py-1"
          style={{ borderColor: userPoints.currentLevel.color }}
        >
          <Sparkles className="w-4 h-4 mr-1" style={{ color: userPoints.currentLevel.color }} />
          {userPoints.totalPoints.toLocaleString()}
        </Badge>
      </div>

      {/* Progress to next level */}
      {userPoints.nextLevel && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-black">
                Next: {userPoints.nextLevel.name} {userPoints.nextLevel.badge}
              </span>
            </div>
            <span className="text-sm text-zinc-600">
              {userPoints.pointsToNextLevel.toLocaleString()} points to go
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex items-center justify-between text-xs text-zinc-500 mt-1">
            <span>{userPoints.currentLevel.minPoints.toLocaleString()}</span>
            <span>{userPoints.nextLevel.minPoints.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-zinc-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-black">{userPoints.stats.agentsInstalled}</p>
          <p className="text-xs text-zinc-500">Agents</p>
        </div>
        <div className="bg-zinc-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-black">{userPoints.stats.skillsInstalled}</p>
          <p className="text-xs text-zinc-500">Skills</p>
        </div>
        <div className="bg-zinc-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-black">{userPoints.stats.stacksCreated}</p>
          <p className="text-xs text-zinc-500">Stacks</p>
        </div>
        <div className="bg-zinc-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 text-orange-500" />
            <p className="text-xl font-bold text-black">{userPoints.stats.dailyStreak}</p>
          </div>
          <p className="text-xs text-zinc-500">Day Streak</p>
        </div>
      </div>

      {/* Perks */}
      {userPoints.currentLevel.perks && userPoints.currentLevel.perks.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-black mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-lime-600" />
            Your Perks
          </p>
          <ul className="space-y-1">
            {userPoints.currentLevel.perks.map((perk, idx) => (
              <li key={idx} className="text-xs text-zinc-600 flex items-center gap-1.5">
                <span className="text-lime-600">✓</span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievements */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-medium text-black">
            {userPoints.achievements.length} Achievements
          </span>
        </div>
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View All
          </Button>
        )}
      </div>
    </Card>
  );
}
