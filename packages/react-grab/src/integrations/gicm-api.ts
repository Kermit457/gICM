/**
 * gICM API Client - Fetch component suggestions
 */

import type { GICMSuggestion } from "../types.js";

export async function fetchGICMSuggestions(
  elementContext: string,
  apiUrl: string
): Promise<GICMSuggestion[]> {
  try {
    const response = await fetch(`${apiUrl}/search/by-element`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        element_context: elementContext,
        include_similar: true,
        limit: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error("[gICM Grab] API error:", error);
    return [];
  }
}
