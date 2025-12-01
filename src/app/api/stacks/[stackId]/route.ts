/**
 * Stack API - Get stack by ID
 *
 * GET /api/stacks/:stackId
 * Returns stack definition with all items
 */

import { NextResponse } from "next/server";
import { SAMPLE_STACKS, getSampleStackById } from "@/lib/sample-stacks";
import { REGISTRY } from "@/lib/registry";
import type { RegistryItem } from "@/types/registry";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stackId: string }> }
) {
  const { stackId } = await params;

  // Find stack in sample stacks
  const stack = getSampleStackById(stackId);

  if (!stack) {
    return NextResponse.json(
      { error: `Stack not found: ${stackId}` },
      { status: 404 }
    );
  }

  // Resolve all items in the stack
  const resolvedItems: RegistryItem[] = [];
  const missingItems: string[] = [];

  for (const itemId of stack.items) {
    // Look up item in registry by ID or slug
    const item = REGISTRY.find(
      (r) => r.id === itemId || r.slug === itemId
    );

    if (item) {
      resolvedItems.push(item);
    } else {
      missingItems.push(itemId);
    }
  }

  // Calculate stats
  const byKind = {
    agent: resolvedItems.filter((i) => i.kind === "agent").length,
    skill: resolvedItems.filter((i) => i.kind === "skill").length,
    command: resolvedItems.filter((i) => i.kind === "command").length,
    mcp: resolvedItems.filter((i) => i.kind === "mcp").length,
    setting: resolvedItems.filter((i) => i.kind === "setting").length,
    workflow: resolvedItems.filter((i) => i.kind === "workflow").length,
  };

  const totalTokenSavings = resolvedItems.reduce(
    (sum, item) => sum + (item.tokenSavings || 0),
    0
  );

  return NextResponse.json({
    stack: {
      id: stack.id,
      name: stack.name,
      description: stack.description,
      tags: stack.tags,
      author: stack.author,
      version: stack.version,
      featured: stack.featured || false,
    },
    items: resolvedItems,
    missingItems,
    stats: {
      totalItems: resolvedItems.length,
      missingCount: missingItems.length,
      byKind,
      tokenSavings: totalTokenSavings,
    },
  });
}
