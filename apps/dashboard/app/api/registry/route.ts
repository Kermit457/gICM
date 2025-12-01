import { NextResponse } from "next/server";
import { REGISTRY_ITEMS } from "@/lib/data/registry";

export async function GET() {
  return NextResponse.json(REGISTRY_ITEMS);
}
