import { NextRequest, NextResponse } from "next/server";
import { getAutonomy } from "@gicm/autonomy";

/**
 * GET /api/autonomy/boundaries - Get current boundaries
 */
export async function GET() {
  try {
    const autonomy = getAutonomy();
    const boundaries = autonomy.getBoundaries();

    return NextResponse.json({
      ok: true,
      boundaries,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error("[API] Autonomy boundaries GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get boundaries" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/autonomy/boundaries - Update boundaries
 */
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid boundaries data" },
        { status: 400 }
      );
    }

    const autonomy = getAutonomy();
    autonomy.updateBoundaries(updates);
    const boundaries = autonomy.getBoundaries();

    console.log("[AUTONOMY] Boundaries updated:", updates);

    return NextResponse.json({
      ok: true,
      message: "Boundaries updated",
      boundaries,
    });
  } catch (error) {
    console.error("[API] Autonomy boundaries PUT error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update boundaries" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/autonomy/boundaries/reset - Reset to defaults
 */
export async function POST() {
  try {
    const autonomy = getAutonomy();
    // Reset by setting all to default values
    autonomy.updateBoundaries({
      financial: {
        maxAutoExpense: 50,
        maxQueuedExpense: 200,
        maxDailySpend: 100,
        maxTradeSize: 500,
        maxDailyTradingLossPercent: 5,
        minTreasuryBalance: 100,
      },
      content: { maxAutoPostsPerDay: 10, maxAutoBlogsPerWeek: 3, requireReviewForTopics: [] },
      development: {
        maxAutoCommitLines: 100,
        maxAutoFilesChanged: 10,
        requireReviewForPaths: [],
        autoDeployToStaging: true,
        autoDeployToProduction: false,
      },
    });
    const boundaries = autonomy.getBoundaries();

    return NextResponse.json({
      ok: true,
      message: "Boundaries reset to defaults",
      boundaries,
    });
  } catch (error) {
    console.error("[API] Autonomy boundaries reset error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to reset boundaries" },
      { status: 500 }
    );
  }
}
