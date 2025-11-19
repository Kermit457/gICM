'use client';

import { useState } from 'react';
import { Rocket, Loader2, ExternalLink, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import type { RegistryItem } from '@/types/registry';

interface DeployButtonProps {
  item: RegistryItem;
}

export function DeployButton({ item }: DeployButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<{
    success: boolean;
    url?: string;
    error?: string;
  } | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'bolt' | 'lovable'>('bolt');

  // Check if item is deployable
  const isDeployable = ['agent', 'skill', 'workflow'].includes(item.kind) &&
                       item.files &&
                       item.files.length > 0;

  if (!isDeployable) {
    return null;
  }

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentResult(null);

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemSlug: item.slug,
          platform: selectedPlatform,
          projectName: `${item.slug}-deployed`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDeploymentResult({
          success: true,
          url: result.project.url,
        });
      } else {
        setDeploymentResult({
          success: false,
          error: result.error || 'Deployment failed',
        });
      }
    } catch (error) {
      setDeploymentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#7000FF]/20 border border-white/10 grid place-items-center">
            <Rocket className="h-5 w-5 text-[#00F0FF]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Deploy to Platform
            </h3>
            <p className="text-sm text-zinc-400">
              One-click deployment to Bolt.new or Lovable.dev
            </p>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedPlatform('bolt')}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              selectedPlatform === 'bolt'
                ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-left">
              <div className="font-bold text-white">⚡ Bolt.new</div>
              <div className="text-xs text-zinc-400">StackBlitz WebContainers</div>
            </div>
          </button>

          <button
            onClick={() => setSelectedPlatform('lovable')}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              selectedPlatform === 'lovable'
                ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)]'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-left">
              <div className="font-bold text-white">💜 Lovable.dev</div>
              <div className="text-xs text-zinc-400">Supabase + Shadcn</div>
            </div>
          </button>
        </div>

        {/* Deploy Button */}
        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full bg-gradient-to-r from-[#00F0FF] to-[#7000FF] hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.5)] transition-all"
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Deploy to {selectedPlatform === 'bolt' ? 'Bolt.new' : 'Lovable.dev'}
            </>
          )}
        </Button>

        {/* Deployment Result */}
        {deploymentResult && (
          <div
            className={`p-4 rounded-xl border ${
              deploymentResult.success
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-red-500/10 border-red-500/50'
            }`}
          >
            {deploymentResult.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="font-bold">Deployment Successful!</span>
                </div>
                <a
                  href={deploymentResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white hover:text-[#00F0FF] transition-colors"
                >
                  Open Project <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-red-400">
                <X className="h-5 w-5 flex-shrink-0" />
                <div>
                  <div className="font-bold">Deployment Failed</div>
                  <div className="text-sm text-red-300 mt-1">
                    {deploymentResult.error}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-zinc-500 space-y-1">
          <p>• Deploys {item.name} with all dependencies</p>
          <p>• Creates a shareable project URL</p>
          <p>• No account required for Bolt.new</p>
        </div>
      </div>
    </GlassCard>
  );
}
