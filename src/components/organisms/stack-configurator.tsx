"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AgentCard } from "@/components/molecules/agent-card";
import { useBundleStore } from "@/lib/store/bundle";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import type { RegistryItem, ItemKind } from "@/types/registry";
import { analytics } from "@/lib/analytics";

interface StackConfiguratorProps {
  agents: RegistryItem[];
  skills: RegistryItem[];
  commands: RegistryItem[];
  mcps: RegistryItem[];
}

export function StackConfigurator({ agents, skills, commands, mcps }: StackConfiguratorProps) {
  const [activeTab, setActiveTab] = useState<ItemKind>("agent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { itemCount } = useBundleStore();

  // Get current items based on active tab
  const currentItems = useMemo(() => {
    switch (activeTab) {
      case "agent":
        return agents;
      case "skill":
        return skills;
      case "command":
        return commands;
      case "mcp":
        return mcps;
      default:
        return [];
    }
  }, [activeTab, agents, skills, commands, mcps]);

  // Filter items by search and category
  const filteredItems = useMemo(() => {
    let items = currentItems;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      items = items.filter((item) => item.category === selectedCategory);
    }

    return items;
  }, [currentItems, searchQuery, selectedCategory]);

  // Get unique categories for current tab
  const categories = useMemo(() => {
    const cats = new Set(currentItems.map((item) => item.category));
    return Array.from(cats).sort();
  }, [currentItems]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value) {
      analytics.trackSearchQuery(value);
    }
  };

  // Handle category filter
  const handleCategoryFilter = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      analytics.trackFilterApplied(category);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ItemKind)}>
        {/* Tabs Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 pb-4">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="agent" className="relative">
              Agents
              <Badge variant="secondary" className="ml-2 px-2 text-xs">
                {agents.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="skill" className="relative">
              Skills
              <Badge variant="secondary" className="ml-2 px-2 text-xs">
                {skills.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="command" className="relative">
              Commands
              <Badge variant="secondary" className="ml-2 px-2 text-xs">
                {commands.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="mcp" className="relative">
              MCPs
              <Badge variant="secondary" className="ml-2 px-2 text-xs">
                {mcps.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder={`Search ${activeTab}s...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Category Filters */}
            {showFilters && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Categories</span>
                  {(searchQuery || selectedCategory) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="cursor-pointer hover:bg-lime-500/20 transition-colors"
                      onClick={() => handleCategoryFilter(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <span>
                {filteredItems.length} of {currentItems.length} {activeTab}s
                {selectedCategory && ` in ${selectedCategory}`}
              </span>
              <span className="text-lime-500 font-medium">{itemCount()} in stack</span>
            </div>
          </div>
        </div>

        {/* Tab Contents */}
        <TabsContent value="agent" className="mt-6">
          <ItemGrid items={filteredItems} />
        </TabsContent>

        <TabsContent value="skill" className="mt-6">
          <ItemGrid items={filteredItems} />
        </TabsContent>

        <TabsContent value="command" className="mt-6">
          <ItemGrid items={filteredItems} />
        </TabsContent>

        <TabsContent value="mcp" className="mt-6">
          <ItemGrid items={filteredItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Grid component for displaying items
function ItemGrid({ items }: { items: RegistryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Filter className="h-12 w-12 text-zinc-600 mb-4" />
        <h3 className="text-lg font-medium text-zinc-400">No items found</h3>
        <p className="text-sm text-zinc-500 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <AgentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
