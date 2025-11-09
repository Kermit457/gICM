import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, GitFork, ExternalLink, Github } from "lucide-react";
import { REGISTRY, getItemById } from "@/lib/registry";
import { QualityScore } from "@/components/molecules/quality-score";
import { InstallCard } from "@/components/molecules/install-card";
import { AgentPromptViewer } from "@/components/molecules/agent-prompt-viewer";
import { readFileSync } from "fs";
import { join } from "path";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Use dynamic rendering to avoid build-time file reading issues
export const dynamic = 'force-dynamic';

// Generate static params for all registry items
export async function generateStaticParams() {
  return REGISTRY.map((item) => ({
    slug: item.slug,
  }));
}

// Helper to get item by slug
function getItemBySlug(slug: string) {
  return REGISTRY.find((item) => item.slug === slug);
}

// Helper to read agent/skill/command markdown file
function readPromptFile(filePath: string): string | null {
  try {
    const fullPath = join(process.cwd(), filePath);
    return readFileSync(fullPath, "utf-8");
  } catch (error) {
    console.warn(`Could not read file: ${filePath}`, error);
    return null;
  }
}

// Format number with commas
const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

export default async function ItemDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getItemBySlug(slug);

  if (!item) {
    notFound();
  }

  // Read the full agent prompt from markdown file
  const promptContent = item.files?.[0] ? readPromptFile(item.files[0]) : null;

  // Get related items from same category (exclude current item)
  const relatedItems = REGISTRY
    .filter((i) => i.category === item.category && i.id !== item.id)
    .slice(0, 3);

  // Get dependencies
  const dependencies = (item.dependencies || [])
    .map((depId) => getItemById(depId))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-300 via-emerald-300 to-teal-300">
      {/* Header */}
      <div className="border-b border-black/20 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-black/80 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Catalog
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6">
        {/* Hero Section */}
        <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6">
          <div className="flex items-start justify-between gap-6">
            {/* Left: Icon + Info */}
            <div className="flex gap-4">
              <div className="h-20 w-20 rounded-2xl bg-black text-lime-300 grid place-items-center font-black text-4xl flex-shrink-0">
                g
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-black">{item.name}</h1>
                  <span className="px-2 py-1 rounded-lg bg-black/10 text-black text-xs font-semibold uppercase">
                    {item.kind}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">{item.category}</p>
                <p className="text-sm text-black/80 leading-relaxed max-w-2xl">
                  {item.longDescription || item.description}
                </p>
                {item.modelRecommendation && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-lime-300/20 border border-lime-300/40 text-xs font-semibold text-black">
                    Recommended: Claude {item.modelRecommendation.charAt(0).toUpperCase() + item.modelRecommendation.slice(1)}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quality Score */}
            <div className="flex-shrink-0">
              <QualityScore item={item} size="lg" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 pt-6 border-t border-black/10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-black text-black">{formatNumber(item.installs || 0)}</div>
              <div className="text-xs text-zinc-600 flex items-center gap-1">
                <Download size={12} /> Installs
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-black">{formatNumber(item.remixes || 0)}</div>
              <div className="text-xs text-zinc-600 flex items-center gap-1">
                <GitFork size={12} /> Remixes
              </div>
            </div>
            {item.tokenSavings && (
              <div>
                <div className="text-2xl font-black text-lime-600">{item.tokenSavings}%</div>
                <div className="text-xs text-zinc-600">Token Savings</div>
              </div>
            )}
            <div>
              <div className="text-2xl font-black text-black">{(item.dependencies || []).length}</div>
              <div className="text-xs text-zinc-600">Dependencies</div>
            </div>
          </div>
        </div>

        {/* Installation Card */}
        <InstallCard item={item} />

        {/* Full Agent Prompt */}
        {promptContent && (
          <AgentPromptViewer
            content={promptContent}
            fileName={item.files?.[0]}
          />
        )}

        {/* Metadata Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tags */}
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-4 space-y-3">
            <h3 className="text-sm font-semibold text-black">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-lg bg-black/5 text-black text-xs font-medium hover:bg-black/10 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Files */}
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-4 space-y-3">
            <h3 className="text-sm font-semibold text-black">Files Included</h3>
            <div className="space-y-1">
              {(item.files || []).map((file) => (
                <div
                  key={file}
                  className="font-mono text-xs text-zinc-600 bg-black/5 px-2 py-1 rounded"
                >
                  {file}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dependencies */}
        {dependencies.length > 0 && (
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-4 space-y-3">
            <h3 className="text-sm font-semibold text-black">Dependencies</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {dependencies.map((dep: any) => (
                <Link
                  key={dep.id}
                  href={`/items/${dep.slug}`}
                  className="p-3 rounded-lg border border-black/20 hover:border-black/40 bg-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-black text-lime-300 grid place-items-center font-black text-sm flex-shrink-0">
                      g
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-black truncate">{dep.name}</div>
                      <div className="text-xs text-zinc-600">{dep.kind}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-4 space-y-3">
            <h3 className="text-sm font-semibold text-black">Related Items from {item.category}</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {relatedItems.map((related) => (
                <Link
                  key={related.id}
                  href={`/items/${related.slug}`}
                  className="p-3 rounded-lg border border-black/20 hover:border-black/40 bg-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-black text-lime-300 grid place-items-center font-black text-sm flex-shrink-0">
                      g
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-black truncate">{related.name}</div>
                      <div className="text-xs text-zinc-600 truncate">{related.description}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* External Links */}
        {(item.docsUrl || item.repoPath) && (
          <div className="flex gap-3">
            {item.docsUrl && (
              <a
                href={item.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-black/40 text-black/80 hover:border-black/80 hover:bg-black/5 text-sm transition-colors"
              >
                <ExternalLink size={16} />
                View Docs
              </a>
            )}
            {item.repoPath && (
              <a
                href={`https://github.com/${item.repoPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-black/40 text-black/80 hover:border-black/80 hover:bg-black/5 text-sm transition-colors"
              >
                <Github size={16} />
                View on GitHub
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
