import { NextRequest, NextResponse } from "next/server";
import { resolveDependencies } from "@/lib/data/registry";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "itemIds array is required" },
        { status: 400 }
      );
    }

    const items = resolveDependencies(itemIds);

    // Calculate stats
    const byKind: Record<string, number> = {
      agent: 0,
      skill: 0,
      command: 0,
      mcp: 0,
      setting: 0,
    };

    let tokenSavings = 0;

    for (const item of items) {
      byKind[item.kind] = (byKind[item.kind] || 0) + 1;
      tokenSavings += item.tokenSavings || 0;
    }

    // Calculate dependency count (items added beyond the original request)
    const dependencyCount = items.length - itemIds.filter(id =>
      items.some(item => item.id === id || item.slug === id)
    ).length;

    return NextResponse.json({
      command: `npx @gicm/cli add ${items.map(i => `${i.kind}:${i.slug}`).join(" ")}`,
      items,
      stats: {
        selectedCount: itemIds.length,
        totalCount: items.length,
        dependencyCount: Math.max(0, dependencyCount),
        tokenSavings,
        byKind,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
