"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBundleStore } from "@/lib/store/bundle";
import { getStackFromCurrentUrl } from "@/lib/share";
import { REGISTRY } from "@/lib/registry";
import { toast } from "sonner";

export function ImportStackBanner() {
  const [stackIds, setStackIds] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const { addItem, clearBundle } = useBundleStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a stack parameter in the URL
    const ids = getStackFromCurrentUrl();
    if (ids.length > 0) {
      setStackIds(ids);
      setShow(true);
    }
  }, [searchParams]);

  if (!show || stackIds.length === 0) {
    return null;
  }

  const items = stackIds
    .map(id => REGISTRY.find(item => item.id === id))
    .filter(Boolean);

  const validItemCount = items.length;
  const invalidItemCount = stackIds.length - validItemCount;

  const handleImport = () => {
    // Clear existing stack
    clearBundle();

    // Add all items
    items.forEach(item => {
      if (item) addItem(item);
    });

    // Remove stack param from URL
    router.replace('/');

    toast.success(`Imported ${validItemCount} items into your stack!`, {
      description: invalidItemCount > 0
        ? `${invalidItemCount} items were not found in the registry`
        : undefined
    });

    setShow(false);
  };

  const handleDismiss = () => {
    // Remove stack param from URL
    router.replace('/');
    setShow(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
      <div className="rounded-xl border border-lime-500 bg-lime-50 p-6 flex items-start gap-4 shadow-lg">
        <div className="h-12 w-12 rounded-xl bg-lime-500 grid place-items-center flex-shrink-0">
          <Package className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-black mb-1">
            Import Shared Stack
          </h3>
          <p className="text-sm text-black/80 mb-4">
            Someone shared a stack with you! It contains {validItemCount} item{validItemCount !== 1 ? 's' : ''}.
            {invalidItemCount > 0 && (
              <span className="text-amber-600">
                {' '}({invalidItemCount} unavailable)
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleImport}
              className="bg-lime-500 hover:bg-lime-600 text-black font-bold gap-2"
            >
              <Download className="w-4 h-4" />
              Import to My Stack
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="border-black/20"
            >
              Dismiss
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
