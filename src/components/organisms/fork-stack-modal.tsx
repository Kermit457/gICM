"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GitFork, Loader2, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { RegistryItem } from "@/types/registry";
import type { StackConfig } from "@/lib/remix";
import { forkStack, saveStackPreset, trackRemix } from "@/lib/remix";

interface ForkStackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalStack: StackConfig;
  items: RegistryItem[];
  onForkComplete?: (forkedStack: StackConfig) => void;
}

export function ForkStackModal({
  open,
  onOpenChange,
  originalStack,
  items,
  onForkComplete,
}: ForkStackModalProps) {
  const [name, setName] = useState(`${originalStack.name} (Forked)`);
  const [description, setDescription] = useState(originalStack.description || "");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFork = async () => {
    if (!name.trim()) {
      toast.error("Please enter a stack name");
      return;
    }

    setLoading(true);

    try {
      // Create forked stack
      const forkedStack = forkStack(
        originalStack,
        name.trim(),
        author.trim() || undefined
      );

      // Update description if changed
      if (description.trim() && description !== originalStack.description) {
        forkedStack.description = description.trim();
      }

      // Save to local presets
      saveStackPreset(forkedStack);

      // Track the remix
      await trackRemix(originalStack.id, forkedStack.id, author.trim() || undefined);

      toast.success("Stack forked successfully!", {
        description: `Created "${forkedStack.name}"`,
      });

      // Call completion callback
      if (onForkComplete) {
        onForkComplete(forkedStack);
      }

      // Close modal
      onOpenChange(false);

      // Reset form
      setTimeout(() => {
        setName(`${originalStack.name} (Forked)`);
        setDescription(originalStack.description || "");
        setAuthor("");
      }, 300);
    } catch (error) {
      toast.error("Failed to fork stack", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-lime-300" />
            Fork Stack
          </DialogTitle>
          <DialogDescription>
            Create your own copy of this stack to customize and share
          </DialogDescription>
        </DialogHeader>

        {/* Original Stack Info */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-black text-sm">Original Stack</h4>
              <Badge variant="outline" className="text-xs">
                {items.length} items
              </Badge>
            </div>
            <p className="text-sm font-medium text-zinc-900">{originalStack.name}</p>
            {originalStack.description && (
              <p className="text-xs text-zinc-600 mt-1">{originalStack.description}</p>
            )}
            {originalStack.author && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                <User className="w-3 h-3" />
                <span>by {originalStack.author}</span>
              </div>
            )}
            {originalStack.remixedFrom && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-lime-600">
                <GitFork className="w-3 h-3" />
                <span>Already a remix</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Stack Name */}
          <div>
            <Label htmlFor="fork-name" className="text-sm font-medium text-black">
              Stack Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fork-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Stack"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="fork-description" className="text-sm font-medium text-black">
              Description
            </Label>
            <Textarea
              id="fork-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes your stack unique..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Author */}
          <div>
            <Label htmlFor="fork-author" className="text-sm font-medium text-black">
              Your Name / Handle
            </Label>
            <p className="text-xs text-zinc-500 mb-1">
              Optional - will be shown as the creator of this fork
            </p>
            <Input
              id="fork-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="@yourusername"
              className="mt-1"
            />
          </div>

          {/* Info about forking */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-medium mb-1">What happens when you fork?</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Creates a new independent copy of the stack</li>
                  <li>Includes all {items.length} items from the original</li>
                  <li>Maintains attribution to the original creator</li>
                  <li>Saved to your local presets for easy access</li>
                  <li>You can customize items after forking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Items Preview */}
          <div>
            <Label className="text-sm font-medium text-black mb-2 block">
              Items Included ({items.length})
            </Label>
            <div className="max-h-32 overflow-y-auto border border-zinc-200 rounded-lg p-2 space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-1 px-2 hover:bg-zinc-50 rounded"
                >
                  <span className="font-medium text-black">{item.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {item.kind}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleFork} disabled={loading || !name.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Forking...
              </>
            ) : (
              <>
                <GitFork className="w-4 h-4 mr-2" />
                Fork Stack
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
