import { NextRequest, NextResponse } from "next/server";
import { getAutonomy } from "@gicm/autonomy";

export const dynamic = "force-dynamic";

/**
 * GET /api/autonomy/audit - Get audit log
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const category = searchParams.get("category");
    const decision = searchParams.get("decision");

    const autonomy = getAutonomy();
    let entries = autonomy.getAuditLog();

    // Filter by category if provided (category may not exist in published type)
    if (category) {
      entries = entries.filter((e) => (e as Record<string, unknown>).category === category);
    }

    // Filter by decision if provided
    if (decision) {
      entries = entries.filter((e) => e.type === decision);
    }

    // Limit results
    entries = entries.slice(0, limit);

    // Calculate stats
    const stats = {
      total: entries.length,
      autoExecuted: entries.filter((e) => e.type === "executed").length,
      approved: entries.filter((e) => e.type === "approved").length,
      rejected: entries.filter((e) => e.type === "rejected").length,
      escalated: entries.filter((e) => e.type === "escalated").length,
    };

    return NextResponse.json({
      ok: true,
      entries,
      stats,
    });
  } catch (error) {
    console.error("[API] Autonomy audit error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get audit log" },
      { status: 500 }
    );
  }
}
