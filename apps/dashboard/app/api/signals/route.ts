import { NextResponse } from "next/server";
import { signalsRepo, isSupabaseConfigured } from "../../../lib/supabase";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured", configured: false },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const signals =
      status === "queued"
        ? await signalsRepo.getQueued(limit)
        : await signalsRepo.getRecent(limit);

    // Calculate stats
    const queued = signals.filter((s) => s.status === "queued").length;
    const executed = signals.filter((s) => s.status === "executed").length;
    const rejected = signals.filter((s) => s.status === "rejected").length;

    return NextResponse.json({
      signals,
      stats: {
        total: signals.length,
        queued,
        executed,
        rejected,
      },
      configured: true,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error("Signals API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals", configured: true },
      { status: 500 }
    );
  }
}
