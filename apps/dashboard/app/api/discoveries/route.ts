import { NextResponse } from "next/server";
import { discoveriesRepo, isSupabaseConfigured } from "../../../lib/supabase";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured", configured: false },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    const discoveries = source
      ? await discoveriesRepo.getBySource(source, limit)
      : await discoveriesRepo.getRecent(limit);

    // Group by source for stats
    const bySource = discoveries.reduce(
      (acc, d) => {
        acc[d.source] = (acc[d.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      discoveries,
      stats: {
        total: discoveries.length,
        bySource,
      },
      configured: true,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error("Discoveries API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discoveries", configured: true },
      { status: 500 }
    );
  }
}
