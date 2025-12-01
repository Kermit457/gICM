import { NextRequest, NextResponse } from "next/server";
import { resolveStackItems, type ItemKind } from "@/lib/data/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  const { stackId } = await params;
  const result = resolveStackItems(stackId);

  if (!result) {
    return NextResponse.json(
      { error: "Stack not found" },
      { status: 404 }
    );
  }

  const { stack, items, missing } = result;

  // Calculate stats
  const byKind: Record<string, number> = {
    agent: 0,
    skill: 0,
    command: 0,
    mcp: 0,
    setting: 0,
    workflow: 0,
  };

  let tokenSavings = 0;

  for (const item of items) {
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;
    tokenSavings += item.tokenSavings || 0;
  }

  return NextResponse.json({
    stack: {
      id: stack.id,
      name: stack.name,
      description: stack.description,
      tags: stack.tags,
      author: stack.author,
      version: stack.version,
      featured: stack.featured,
    },
    items,
    missingItems: missing,
    stats: {
      totalItems: items.length,
      missingCount: missing.length,
      byKind,
      tokenSavings,
    },
  });
}
