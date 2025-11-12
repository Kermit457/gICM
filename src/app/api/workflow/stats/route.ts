import { NextResponse } from 'next/server';
import { getAPIUsageStats } from '@/lib/api-usage';

export async function GET() {
  try {
    const stats = getAPIUsageStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get API usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
