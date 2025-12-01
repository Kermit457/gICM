/**
 * Growth Engine Adapter
 *
 * Converts GrowthEngine to EngineConnections interface.
 */

import type { GrowthEngine } from "@gicm/growth-engine";
import type { EngineConnections } from "../daily-cycle.js";

export function createGrowthAdapter(engine: GrowthEngine): NonNullable<EngineConnections["growth"]> {
  return {
    generateContent: async (type: string) => {
      try {
        // GrowthEngine.generateNow() returns void
        const contentType = type === "blog" ? "blog" : type === "thread" ? "thread" : "tweet";
        await engine.generateNow(contentType);

        // Get latest status to find generated content
        const status = engine.getStatus();

        // For blogs
        if (type === "blog" && status.upcomingContent.blogPosts.length > 0) {
          const latest = status.upcomingContent.blogPosts[status.upcomingContent.blogPosts.length - 1];
          return { id: latest.id || `blog-${Date.now()}`, title: latest.title };
        }

        // For tweets/threads
        if ((type === "tweet" || type === "thread") && status.upcomingContent.tweets.length > 0) {
          const latest = status.upcomingContent.tweets[status.upcomingContent.tweets.length - 1];
          return { id: latest.id || `tweet-${Date.now()}`, title: latest.text?.slice(0, 50) + "..." || "Tweet" };
        }

        // Fallback
        return {
          id: `content-${Date.now()}`,
          title: `Generated ${type} content`,
        };
      } catch (error) {
        console.warn(`[GROWTH-ADAPTER] Content generation failed: ${error}`);
        return {
          id: `error-${Date.now()}`,
          title: `[Failed] ${type} generation`,
        };
      }
    },

    schedulePost: async (content, platform) => {
      try {
        // GrowthEngine doesn't have unified schedulePost
        // Use announceUpdate as proxy for announcements
        if (platform === "discord") {
          await engine.announceUpdate("content", [content.title]);
        } else {
          // Twitter is handled internally by the engine
          console.log(`[GROWTH-ADAPTER] Would schedule "${content.title}" to ${platform}`);
        }
      } catch (error) {
        console.warn(`[GROWTH-ADAPTER] Schedule post failed: ${error}`);
      }
    },
  };
}
