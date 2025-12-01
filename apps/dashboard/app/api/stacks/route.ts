import { NextResponse } from "next/server";
import { STACKS, getItemBySlug } from "@/lib/data/registry";

export async function GET() {
  const stacks = STACKS.map(stack => ({
    id: stack.id,
    name: stack.name,
    description: stack.description,
    itemCount: stack.items.length,
    tags: stack.tags,
    author: stack.author,
    version: stack.version,
    featured: stack.featured,
    createdAt: stack.createdAt,
    updatedAt: stack.updatedAt,
  }));

  return NextResponse.json({
    stacks,
    total: stacks.length,
  });
}
