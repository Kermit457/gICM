import { NextRequest, NextResponse } from "next/server";
import { getItemBySlug } from "@/lib/data/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const item = getItemBySlug(slug);

  if (!item) {
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(item);
}
