"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StackPresetsManager } from "@/components/organisms/stack-presets-manager";
import { ImportStackModal } from "@/components/organisms/import-stack-modal";
import { Plus, Download, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StackConfig } from "@/lib/remix";
import { getStackPresets, saveStackPreset } from "@/lib/remix";
import { REGISTRY } from "@/lib/registry";
import { getAllSampleStacks, cloneSampleStack } from "@/lib/sample-stacks";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StacksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    forked: 0,
    shared: 0,
  });

  // Check for import parameter in URL
  const importParam = searchParams.get("import");

  // Get all registry items
  const registryItems = REGISTRY;

  // Calculate stats from localStorage
  useEffect(() => {
    const calculateStats = () => {
      const presets = getStackPresets();
      const total = presets.length;
      const forked = presets.filter((p) => p.remixedFrom).length;

      // Count shared stacks (stacks with remixCount > 0 or that have been shared)
      // For MVP, we'll count stacks that have a remixCount property
      const shared = presets.filter((p) => p.remixCount && p.remixCount > 0).length;

      setStats({ total, forked, shared });
    };

    calculateStats();

    // Recalculate when window gains focus (in case changes in another tab)
    const handleFocus = () => calculateStats();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleLoadPreset = (stack: StackConfig) => {
    // Navigate to homepage with preload parameter
    router.push(`/?preload=${stack.id}`);
    toast.success("Loading stack...", {
      description: `"${stack.name}" will be loaded on the homepage`,
    });
  };

  const handleImportComplete = (stack: StackConfig) => {
    toast.success("Stack imported!", {
      description: "Your new stack is ready to use",
    });
  };

  const handleCreateNew = () => {
    router.push("/");
    toast("Create a new stack", {
      description: "Select items from the registry to build your stack",
    });
  };

  const handleCloneSample = (sampleId: string, sampleName: string) => {
    const cloned = cloneSampleStack(sampleId);
    if (!cloned) {
      toast.error("Failed to clone sample stack");
      return;
    }

    saveStackPreset(cloned);
    toast.success(`"${sampleName}" added to your stacks!`, {
      description: "You can now customize it or load it directly",
    });

    // Refresh stats
    const presets = getStackPresets();
    const total = presets.length;
    const forked = presets.filter((p) => p.remixedFrom).length;
    const shared = presets.filter((p) => p.remixCount && p.remixCount > 0).length;
    setStats({ total, forked, shared });
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="My Stacks"
        description="Manage your saved stack configurations, import from others, and share your workflows"
        icon={<Sparkles className="w-6 h-6 text-lime-300" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Import Stack
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Stack
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-lime-50 to-emerald-50 border border-lime-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Total Stacks</p>
                <p className="text-2xl font-bold text-black">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-lime-300/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-lime-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Forked Stacks</p>
                <p className="text-2xl font-bold text-black">{stats.forked}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-300/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Shared Stacks</p>
                <p className="text-2xl font-bold text-black">{stats.shared}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-300/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sample/Starter Stacks */}
        {stats.total === 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-2">
              Get Started with Sample Stacks
            </h2>
            <p className="text-zinc-600 mb-4">
              Try these pre-configured stacks to kickstart your development workflow
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAllSampleStacks().map((sample) => (
                <Card key={sample.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-black mb-1">{sample.name}</h3>
                      <div className="flex gap-2 flex-wrap">
                        {sample.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 mb-3 line-clamp-2">
                    {sample.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {sample.items.length} items
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleCloneSample(sample.id, sample.name)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add to My Stacks
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stack Presets Manager */}
        <StackPresetsManager
          onLoadPreset={handleLoadPreset}
          registryItems={registryItems}
        />

        {/* Import Modal */}
        <ImportStackModal
          open={importModalOpen || !!importParam}
          onOpenChange={setImportModalOpen}
          initialEncodedData={importParam || undefined}
          onImportComplete={handleImportComplete}
        />
      </main>
    </div>
  );
}

export default function StacksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <StacksPageContent />
    </Suspense>
  );
}
