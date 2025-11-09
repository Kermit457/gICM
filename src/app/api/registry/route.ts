import { NextResponse } from 'next/server';
import { REGISTRY } from '@/lib/registry';

export async function GET() {
  return NextResponse.json(REGISTRY);
}

export const runtime = 'nodejs';
export const dynamic = 'force-static';
