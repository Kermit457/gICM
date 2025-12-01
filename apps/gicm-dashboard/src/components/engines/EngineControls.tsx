"use client";

import { api } from "@/lib/api";
import { useDashboardStore } from "@/lib/store";
import { Search, FileText, PenTool } from "lucide-react";

export function EngineControls() {
  const { fetchEngines, fetchEvents } = useDashboardStore();

  const handleRunDiscovery = async () => {
    try {
      const result = await api.runDiscovery();
      console.log("Discovery found:", result.found, "opportunities");
      fetchEvents();
    } catch (e) {
      console.error("Discovery failed:", e);
    }
  };

  const handleGenerateBlog = async () => {
    try {
      await api.generateContent("blog");
      fetchEvents();
    } catch (e) {
      console.error("Blog generation failed:", e);
    }
  };

  const handleGenerateTweet = async () => {
    try {
      await api.generateContent("tweet");
      fetchEvents();
    } catch (e) {
      console.error("Tweet generation failed:", e);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleRunDiscovery}
          className="flex flex-col items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Search className="w-6 h-6 text-blue-400 mb-2" />
          <span className="text-sm text-white">Run Discovery</span>
          <span className="text-xs text-gray-400">Product Engine</span>
        </button>

        <button
          onClick={handleGenerateBlog}
          className="flex flex-col items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <FileText className="w-6 h-6 text-green-400 mb-2" />
          <span className="text-sm text-white">Generate Blog</span>
          <span className="text-xs text-gray-400">Growth Engine</span>
        </button>

        <button
          onClick={handleGenerateTweet}
          className="flex flex-col items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <PenTool className="w-6 h-6 text-purple-400 mb-2" />
          <span className="text-sm text-white">Generate Tweet</span>
          <span className="text-xs text-gray-400">Growth Engine</span>
        </button>
      </div>
    </div>
  );
}
