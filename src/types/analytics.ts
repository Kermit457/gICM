export type AnalyticsEventType =
  | 'item_view'
  | 'item_add_to_stack'
  | 'item_remove_from_stack'
  | 'bundle_created'
  | 'bundle_copied'
  | 'search_query'
  | 'filter_applied';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  itemId?: string;
  itemKind?: 'agent' | 'skill' | 'command' | 'mcp' | 'setting';
  itemSlug?: string;
  bundleSize?: number;
  searchQuery?: string;
  filterValue?: string;
  sessionId: string;
}

export interface AnalyticsStats {
  totalEvents: number;
  uniqueItems: number;
  uniqueVisitors?: number;
  itemsViewed?: number;
  searchCount?: number;
  bundleDownloads?: number;
  popularItems: ItemPopularity[];
  trendingItems: ItemPopularity[];
  popularCombinations: BundleCombination[];
  recentActivity: AnalyticsEvent[];
  statsByKind: {
    agent: number;
    skill: number;
    command: number;
    mcp: number;
    setting: number;
  };
  // Additional stats for dashboard
  topItems?: Array<{ name: string; count: number }>;
  byKind?: Record<string, number>;
  dailyEvents?: Array<{ date: string; count: number }>;
}

export interface ItemPopularity {
  itemId: string;
  itemName: string;
  itemKind: string;
  itemSlug: string;
  views: number;
  addedToStack: number;
  score: number;
}

export interface BundleCombination {
  items: string[];
  count: number;
  avgBundleSize: number;
}
