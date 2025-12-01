import { NextRequest, NextResponse } from "next/server";
import { getAutonomy } from "@gicm/autonomy";

/**
 * POST /api/autonomy/reject - Reject a pending request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, reason } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { ok: false, error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const autonomy = getAutonomy();
    const result = await autonomy.reject(id, reason, "dashboard");

    if (!result) {
      return NextResponse.json(
        { ok: false, error: `Request ${id} not found in queue` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Request ${id} rejected`,
      request: result,
    });
  } catch (error) {
    console.error("[API] Autonomy reject error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to reject request" },
      { status: 500 }
    );
  }
}
