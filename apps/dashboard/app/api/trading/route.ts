import { NextResponse } from "next/server";
import {
  positionsRepo,
  tradesRepo,
  dailyStatsRepo,
  isSupabaseConfigured,
} from "../../../lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured", configured: false },
      { status: 503 }
    );
  }

  try {
    const [positions, trades, todayStats, recentStats] = await Promise.all([
      positionsRepo.getOpen(),
      tradesRepo.getToday(),
      dailyStatsRepo.getToday(),
      dailyStatsRepo.getRecent(7),
    ]);

    // Calculate trading metrics
    const totalPnL = await dailyStatsRepo.getTotalPnL();
    const weeklyPnL = recentStats.reduce((sum, s) => sum + (s.pnl || 0), 0);
    const dailyPnL = todayStats?.pnl ?? 0;

    return NextResponse.json({
      positions,
      trades,
      stats: {
        dailyPnL,
        weeklyPnL,
        totalPnL,
        tradesCount: todayStats?.trades_count ?? trades.length,
        activeBots: positions.filter((p) => p.status === "open").length,
      },
      configured: true,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error("Trading API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trading data", configured: true },
      { status: 500 }
    );
  }
}
