import { NextRequest, NextResponse } from "next/server";
import { searchItems, type ItemKind } from "@/lib/data/registry";

interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

interface ToolSearchResult {
  tool: ToolDefinition;
  metadata: {
    id: string;
    kind: string;
    category: string;
    tags: string[];
    install: string;
    platforms: string[];
    qualityScore: number;
    installs: number;
  };
  score: number;
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await request.json();
    const { query, limit = 10, platform, kind, minQuality } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Search for items
    const items = searchItems(query, kind as ItemKind | undefined);

    // Convert to tool format and calculate scores
    const mappedResults = items
      .slice(0, limit)
      .map((item, index) => {
        // Calculate quality score based on installs and token savings
        const installScore = Math.min(100, (item.installs || 0) / 50);
        const savingsScore = Math.min(100, (item.tokenSavings || 0) / 100);
        const qualityScore = Math.round((installScore + savingsScore) / 2);

        if (minQuality && qualityScore < minQuality) {
          return null;
        }

        const tool: ToolDefinition = {
          name: item.slug.replace(/-/g, "_"),
          description: item.description,
          input_schema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                description: `Action to perform with ${item.name}`,
              },
            },
            required: [],
          },
        };

        return {
          tool,
          metadata: {
            id: item.id,
            kind: item.kind,
            category: item.category,
            tags: item.tags,
            install: item.install,
            platforms: platform ? [platform] : ["claude", "gemini", "openai"],
            qualityScore,
            installs: item.installs || 0,
          },
          score: 1 - index * 0.05, // Simple relevance score
        } as ToolSearchResult;
      });

    const results = mappedResults.filter((r): r is ToolSearchResult => r !== null);

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      tools: results.map(r => r.tool),
      results,
      meta: {
        query,
        totalMatches: results.length,
        searchTime,
        platform,
        kind,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
