"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Share2,
  GitFork,
  Download,
  Trash2,
  MoreVertical,
  User,
  Calendar,
  Package,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { RegistryItem } from "@/types/registry";
import type { StackConfig } from "@/lib/remix";
import {
  getStackPresets,
  deleteStackPreset,
  generateShareURL,
  copyToClipboard,
} from "@/lib/remix";
import { RemixModal } from "./remix-modal";
import { ForkStackModal } from "./fork-stack-modal";

interface StackPresetsManagerProps {
  onLoadPreset?: (stack: StackConfig) => void;
  registryItems: RegistryItem[];
}

export function StackPresetsManager({
  onLoadPreset,
  registryItems,
}: StackPresetsManagerProps) {
  const [presets, setPresets] = useState<StackConfig[]>([]);
  const [selectedStack, setSelectedStack] = useState<StackConfig | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [forkModalOpen, setForkModalOpen] = useState(false);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    const saved = getStackPresets();
    setPresets(saved);
  };

  const handleDelete = (stackId: string, stackName: string) => {
    if (confirm(`Delete "${stackName}"? This cannot be undone.`)) {
      try {
        deleteStackPreset(stackId);
        loadPresets();
        toast.success("Stack deleted", {
          description: `"${stackName}" has been removed`,
        });
      } catch (error) {
        toast.error("Failed to delete stack");
      }
    }
  };

  const handleQuickShare = async (stack: StackConfig) => {
    try {
      const url = generateShareURL(stack);
      await copyToClipboard(url);
      toast.success("Share link copied!", {
        description: "Anyone can now import this stack",
      });
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDownload = (stack: StackConfig) => {
    const a = document.createElement("a");
    a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(stack, null, 2)
    )}`;
    a.download = `${stack.id}.json`;
    a.click();
    toast.success("Stack JSON downloaded");
  };

  const handleShare = (stack: StackConfig) => {
    setSelectedStack(stack);
    setShareModalOpen(true);
  };

  const handleFork = (stack: StackConfig) => {
    setSelectedStack(stack);
    setForkModalOpen(true);
  };

  const getStackItems = (stack: StackConfig): RegistryItem[] => {
    return stack.items
      .map((itemId) => registryItems.find((item) => item.id === itemId))
      .filter((item): item is RegistryItem => item !== undefined);
  };

  if (presets.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
        <p className="text-zinc-500 mb-2">No saved stacks yet</p>
        <p className="text-sm text-zinc-400">
          Create a stack or import one from a share link to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black">Your Stacks</h2>
          <p className="text-sm text-zinc-500">{presets.length} saved configurations</p>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((stack) => {
          const items = getStackItems(stack);
          const itemsExist = items.length;
          const itemsMissing = stack.items.length - itemsExist;

          return (
            <Card key={stack.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-black truncate">{stack.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {stack.items.length} items
                    </Badge>
                    {stack.version && (
                      <Badge variant="outline" className="text-xs">
                        v{stack.version}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* More menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleShare(stack)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickShare(stack)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFork(stack)}>
                      <GitFork className="w-4 h-4 mr-2" />
                      Fork
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(stack)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download JSON
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(stack.id, stack.name)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              {stack.description && (
                <p className="text-sm text-zinc-600 mb-3 line-clamp-2">
                  {stack.description}
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-2 text-xs text-zinc-500 mb-3">
                {stack.author && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>{stack.author}</span>
                  </div>
                )}
                {stack.updatedAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>Updated {new Date(stack.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {stack.remixedFrom && (
                  <div className="flex items-center gap-1.5 text-lime-600">
                    <GitFork className="w-3 h-3" />
                    <span>Forked from {stack.remixedFrom}</span>
                  </div>
                )}
              </div>

              {/* Warning if items missing */}
              {itemsMissing > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-900">
                      {itemsMissing} item{itemsMissing === 1 ? "" : "s"} not found in registry
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {stack.tags && stack.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {stack.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                  {stack.tags.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{stack.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onLoadPreset?.(stack)}
                >
                  Load Stack
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare(stack)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modals */}
      {selectedStack && (
        <>
          <RemixModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            stack={selectedStack}
            items={getStackItems(selectedStack)}
          />
          <ForkStackModal
            open={forkModalOpen}
            onOpenChange={setForkModalOpen}
            originalStack={selectedStack}
            items={getStackItems(selectedStack)}
            onForkComplete={(forkedStack) => {
              loadPresets();
              toast.success("Stack forked!", {
                description: "Your forked stack is now available",
              });
            }}
          />
        </>
      )}
    </div>
  );
}
