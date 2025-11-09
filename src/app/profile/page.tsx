"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PointsDisplay } from "@/components/ui/points-display";
import { AchievementsDisplay } from "@/components/ui/achievements-display";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  TrendingUp,
  Award,
  Activity,
  Calendar,
  Zap,
  Package,
  Share2,
  GitFork,
} from "lucide-react";
import { usePoints } from "@/hooks/use-points";
import { POINTS_CONFIG } from "@/lib/points";

export default function ProfilePage() {
  const router = useRouter();
  const { userPoints, loading, checkDailyVisit } = usePoints();

  // Check daily visit on mount
  useEffect(() => {
    checkDailyVisit();
  }, [checkDailyVisit]);

  if (loading || !userPoints) {
    return <ProfileSkeleton />;
  }

  const recentTransactions = [...userPoints.transactions]
    .reverse()
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Your Profile"
        description="Track your progress, achievements, and stats"
        icon={<User className="w-6 h-6 text-lime-300" />}
      />

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Points & Level */}
          <div className="lg:col-span-2 space-y-6">
            {/* Points Display */}
            <PointsDisplay userPoints={userPoints} variant="full" />

            {/* Tabs */}
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">
                  <Activity className="w-4 h-4 mr-2" />
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger value="achievements">
                  <Award className="w-4 h-4 mr-2" />
                  Achievements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-3 mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-lime-600" />
                    Recent Transactions
                  </h3>

                  {recentTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {recentTransactions.map((transaction) => {
                        const config = POINTS_CONFIG[transaction.action];

                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-lime-100 flex items-center justify-center text-sm">
                                {config.icon}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-black">
                                  {config.label}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {new Date(transaction.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-lime-100 text-lime-700 border-lime-300">
                              +{transaction.points}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Activity}
                      title="No activity yet"
                      description="Start building stacks and installing items to earn points and track your progress!"
                      action={{
                        label: "Browse Items",
                        onClick: () => router.push("/"),
                      }}
                    />
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="mt-4">
                <AchievementsDisplay userPoints={userPoints} variant="grid" />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-4">
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-lime-600" />
                Your Stats
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      🤖
                    </div>
                    <span className="text-sm text-zinc-700">Agents</span>
                  </div>
                  <span className="font-bold text-black">
                    {userPoints.stats.agentsInstalled}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      ⚡
                    </div>
                    <span className="text-sm text-zinc-700">Skills</span>
                  </div>
                  <span className="font-bold text-black">
                    {userPoints.stats.skillsInstalled}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      ⌘
                    </div>
                    <span className="text-sm text-zinc-700">Commands</span>
                  </div>
                  <span className="font-bold text-black">
                    {userPoints.stats.commandsInstalled}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      🔌
                    </div>
                    <span className="text-sm text-zinc-700">MCPs</span>
                  </div>
                  <span className="font-bold text-black">
                    {userPoints.stats.mcpsInstalled}
                  </span>
                </div>
              </div>
            </Card>

            {/* Stack Stats */}
            <Card className="p-4">
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-lime-600" />
                Stack Activity
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-700">Created</span>
                  </div>
                  <span className="font-bold text-black">
                    {userPoints.stats.stacksCreated}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-700">Forked</span>
                  </div>
                  <span className="font-bold text-black">
                    {userPoints.stats.stacksForked}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-700">Shared</span>
                  </div>
                  <span className="font-bold text-black">
                    {userPoints.stats.stacksShared}
                  </span>
                </div>
              </div>
            </Card>

            {/* Streak */}
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Streak
              </h3>

              <div className="text-center mb-3">
                <div className="text-5xl font-black text-orange-600 mb-1">
                  {userPoints.stats.dailyStreak}
                </div>
                <p className="text-sm text-orange-700 font-medium">
                  {userPoints.stats.dailyStreak === 1 ? "day" : "days"} in a row
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-orange-700 pt-3 border-t border-orange-200">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Last visit:</span>
                </div>
                <span className="font-medium">
                  {new Date(userPoints.stats.lastVisit).toLocaleDateString()}
                </span>
              </div>

              {userPoints.stats.longestStreak > userPoints.stats.dailyStreak && (
                <div className="flex items-center justify-between text-xs text-orange-600 mt-1">
                  <span>Longest streak:</span>
                  <span className="font-bold">{userPoints.stats.longestStreak} days</span>
                </div>
              )}
            </Card>

            {/* Points Earning Guide */}
            <Card className="p-4">
              <h3 className="font-semibold text-black mb-3">Earn More Points</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700">Install an agent</span>
                  <Badge variant="outline" className="text-xs">+15</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700">Create a stack</span>
                  <Badge variant="outline" className="text-xs">+50</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700">Share on social</span>
                  <Badge variant="outline" className="text-xs">+50</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700">Invite a friend</span>
                  <Badge variant="outline" className="text-xs">+100</Badge>
                </div>
              </div>
              <Button className="w-full mt-3" size="sm">
                View All Ways to Earn
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
