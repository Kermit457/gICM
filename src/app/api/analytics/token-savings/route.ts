import { NextResponse } from "next/server";
import type { AnalyticsEvent } from "@/types/analytics";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import {
  calculateTokenSavings,
  formatLargeNumber,
  formatCurrency,
} from "@/lib/token-savings";

const ANALYTICS_DIR = join(process.cwd(), ".analytics");
const EVENTS_FILE = join(ANALYTICS_DIR, "events.json");

async function readEvents(): Promise<AnalyticsEvent[]> {
  try {
    if (!existsSync(EVENTS_FILE)) {
      return [];
    }
    const data = await readFile(EVENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading events:", error);
    return [];
  }
}

export async function GET() {
  try {
    // Read all analytics events
    const allEvents = await readEvents();

    // Calculate token savings metrics
    const metrics = calculateTokenSavings(allEvents);

    // Format response for display
    const response = {
      // Raw values
      tokensSavedToday: metrics.tokensSavedToday,
      costSavedToday: metrics.costSavedToday,
      avgTokensPerStack: metrics.avgTokensPerStack,
      avgCostPerStack: metrics.avgCostPerStack,
      totalTokensSaved: metrics.totalTokensSaved,
      totalCostSaved: metrics.totalCostSaved,
      savingsRate: metrics.savingsRate,
      itemsSavedToday: metrics.itemsSavedToday,
      itemsSavedTotal: metrics.itemsSavedTotal,

      // Formatted values for display
      formatted: {
        tokensSavedToday: formatLargeNumber(metrics.tokensSavedToday),
        costSavedToday: formatCurrency(metrics.costSavedToday),
        avgTokensPerStack: formatLargeNumber(metrics.avgTokensPerStack),
        avgCostPerStack: formatCurrency(metrics.avgCostPerStack),
        totalTokensSaved: formatLargeNumber(metrics.totalTokensSaved),
        totalCostSaved: formatCurrency(metrics.totalCostSaved),
        savingsRate: `${metrics.savingsRate > 0 ? "+" : ""}${metrics.savingsRate}%`,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Token savings calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate token savings" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
