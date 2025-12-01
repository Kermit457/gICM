/**
 * Stacks API - List all available stacks
 *
 * GET /api/stacks
 * Returns all sample stacks
 */

import { NextResponse } from "next/server";
import { SAMPLE_STACKS } from "@/lib/sample-stacks";

export async function GET() {
  const stacks = SAMPLE_STACKS.map((stack) => ({
    id: stack.id,
    name: stack.name,
    description: stack.description,
    itemCount: stack.items.length,
    tags: stack.tags,
    author: stack.author,
    version: stack.version,
    featured: stack.featured || false,
    createdAt: stack.createdAt,
    updatedAt: stack.updatedAt,
  }));

  return NextResponse.json({
    stacks,
    total: stacks.length,
  });
}
