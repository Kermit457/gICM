"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, Copy, Terminal, X } from "lucide-react";
import type { RegistryItem } from "@/types/registry";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { AuroraBackground } from "@/components/ui/aurora-background";

// Fake code for demo purposes
const MOCK_CODE: Record<string, string> = {
  "glass-card": `import { cn } from "@/lib/utils";

export function GlassCard({ children, className }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-white/10",
      "bg-white/5 backdrop-blur-md shadow-xl",
      className
    )}>
      {children}
    </div>
  );
}`,
  "aurora-background": `export function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%]
        bg-gradient-to-br from-blue-500/20 to-purple-500/20
        blur-[100px] animate-aurora" />
    </div>
  );
}`,
"neon-button": `export function NeonButton({ children }) {
  return (
    <button className="px-6 py-3 rounded-lg bg-[#00F0FF] text-black 
      font-bold shadow-[0_0_20px_-5px_#00F0FF] 
      hover:shadow-[0_0_30px_-5px_#00F0FF] transition-all">
      {children}
    </button>
  );
}`,
"animated-grid": `export function AnimatedGrid() {
    return (
        <div className="absolute inset-0 bg-[url('/grid.svg')] 
          bg-[length:50px_50px] opacity-20 animate-grid-scroll" />
    );
}`
};

interface DesignDetailModalProps {
  item: RegistryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DesignDetailModal({ item, isOpen, onClose }: DesignDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_CODE[item.slug] || "// Code not available");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInstall = () => {
      navigator.clipboard.writeText(item.install);
  }

  // Render the actual component (or a close approximation) for the large preview
  const renderPreview = () => {
      switch(item.slug) {
          case "glass-card":
              return (
                  <div className="p-20 bg-zinc-950 flex items-center justify-center h-full w-full">
                      <GlassCard className="w-96 h-64 p-8 flex flex-col justify-between">
                          <div className="space-y-2">
                              <div className="w-12 h-12 rounded-full bg-white/20" />
                              <div className="h-4 w-3/4 bg-white/20 rounded" />
                              <div className="h-4 w-1/2 bg-white/20 rounded" />
                          </div>
                          <div className="text-white/50 text-sm">Glass Card Preview</div>
                      </GlassCard>
                  </div>
              );
          case "aurora-background":
              return (
                  <div className="relative w-full h-full bg-zinc-950 overflow-hidden">
                       <AuroraBackground className="absolute inset-0" />
                       <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                           <h1 className="text-4xl font-bold text-white mix-blend-overlay">Aurora</h1>
                       </div>
                  </div>
              );
          case "neon-button":
              return (
                  <div className="w-full h-full bg-zinc-950 flex items-center justify-center gap-8">
                       <NeonButton>Default</NeonButton>
                       <NeonButton className="shadow-[0_0_30px_-5px_#00F0FF]">Hovered</NeonButton>
                  </div>
              );
          case "animated-grid":
              return (
                  <div className="w-full h-full bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                      <AnimatedGrid />
                      <div className="relative z-10 bg-black/80 p-4 rounded border border-white/10">
                          <span className="text-white">Perspective Grid</span>
                      </div>
                  </div>
              );
          default:
              return <div className="text-white">Preview not available</div>
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#0A0A0B] border border-white/10 p-0 overflow-hidden h-[80vh] flex flex-col">
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
                <div>
                    <DialogTitle className="text-xl font-bold text-white font-display">{item.name}</DialogTitle>
                    <DialogDescription className="text-zinc-400 mt-1">{item.description}</DialogDescription>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
                <div className="px-6 border-b border-white/10 bg-black/20">
                    <TabsList className="bg-transparent border-0 p-0 h-12 gap-6">
                        <TabsTrigger value="preview" className="bg-transparent border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#00F0FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00F0FF] rounded-none h-full px-0">Preview</TabsTrigger>
                        <TabsTrigger value="code" className="bg-transparent border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#00F0FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00F0FF] rounded-none h-full px-0">Code</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="preview" className="flex-1 m-0 min-h-0 relative">
                    {renderPreview()}
                </TabsContent>

                <TabsContent value="code" className="flex-1 m-0 min-h-0 bg-[#050505] p-0 overflow-auto">
                    <pre className="p-6 font-mono text-sm text-zinc-300 leading-relaxed">
                        {MOCK_CODE[item.slug] || "// Loading..."}
                    </pre>
                </TabsContent>
            </Tabs>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-[#0A0A0B] flex items-center justify-between">
            <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                <Terminal size={14} className="text-[#00F0FF]" />
                <code className="text-xs text-zinc-300 font-mono">{item.install}</code>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={handleCopy} className="border-white/10 hover:bg-white/5 text-white">
                    {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                    Copy Code
                </Button>
                <Button onClick={handleCopyInstall} className="bg-[#00F0FF] text-black hover:bg-[#00F0FF]/90 font-bold">
                    Install Component
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
