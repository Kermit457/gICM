import { NextResponse } from "next/server";
import { getAutonomy } from "@gicm/autonomy";

/**
 * GET /api/autonomy/queue - Get pending approval queue
 */
export async function GET() {
  try {
    const autonomy = getAutonomy();
    const queue = autonomy.getQueue();
    const stats = autonomy.getQueueStats();

    return NextResponse.json({
      ok: true,
      queue,
      stats,
    });
  } catch (error) {
    console.error("[API] Autonomy queue error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get queue", queue: [], stats: { pending: 0, approved: 0, rejected: 0 } },
      { status: 500 }
    );
  }
}
