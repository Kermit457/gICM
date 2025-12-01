import { NextResponse } from "next/server";
import { getAutonomy } from "@gicm/autonomy";

/**
 * GET /api/autonomy/status - Get autonomy engine status
 */
export async function GET() {
  try {
    const autonomy = getAutonomy();
    const status = autonomy.getStatus();
    const boundaries = autonomy.getBoundaries();
    const level = autonomy.getLevel();

    return NextResponse.json({
      ok: true,
      status: {
        level,
        levelName: ["manual", "bounded", "supervised", "delegated", "autonomous"][level - 1],
        running: status.running,
        boundaries,
        queue: status.queue,
        usage: status.usage,
        executor: status.executor,
        audit: status.audit,
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
