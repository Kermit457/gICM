import { NextRequest, NextResponse } from "next/server";
import { searchItems, type ItemKind } from "@/lib/data/registry";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const kind = searchParams.get("kind") as ItemKind | null;

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const results = searchItems(query, kind || undefined);
  return NextResponse.json(results);
}
