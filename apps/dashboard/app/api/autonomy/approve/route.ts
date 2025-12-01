import { NextRequest, NextResponse } from "next/server";
import { getAutonomy } from "@gicm/autonomy";

/**
 * POST /api/autonomy/approve - Approve a pending request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, feedback } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    const autonomy = getAutonomy();
    const result = await autonomy.approve(id, "dashboard", feedback);

    if (!result) {
      return NextResponse.json(
        { ok: false, error: `Request ${id} not found in queue` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Request ${id} approved`,
      request: result,
    });
  } catch (error) {
    console.error("[API] Autonomy approve error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to approve request" },
      { status: 500 }
    );
  }
}
