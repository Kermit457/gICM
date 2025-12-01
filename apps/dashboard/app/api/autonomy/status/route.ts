import { NextResponse } from "next/server";
import { getAutonomy } from "@gicm/autonomy";

/**
 * GET /api/autonomy/status - Get autonomy engine status
 */
export async function GET() {
  try {
    const autonomy = getAutonomy();
    const config = autonomy.getConfig();
    const boundaries = autonomy.getBoundaries();
    const queueStats = autonomy.getQueueStats();

    return NextResponse.json({
      ok: true,
      status: {
        level: config.level,
        levelName: ["manual", "bounded", "supervised", "delegated", "autonomous"][config.level - 1],
        running: true,
        boundaries,
        queue: queueStats,
      },
    });
  } catch (error) {
    console.error("[API] Autonomy status error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get autonomy status" },
      { status: 500 }
    );
  }
}
