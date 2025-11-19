"use client";

import { useState, ReactNode } from "react";
import { Copy, Eye, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { formatProductName } from "@/lib/utils";
import type { RegistryItem } from "@/types/registry";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { toast } from "sonner";

interface DesignCardProps {
  item: RegistryItem;
  onClick: () => void;
}

// Mock components for preview
const GlassCardPreview = () => (
  <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-950/50">
    <div className="w-40 h-24 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg flex flex-col p-3">
      <div className="w-8 h-8 rounded-full bg-white/10 mb-2" />
      <div className="w-20 h-2 bg-white/10 rounded mb-1" />
      <div className="w-12 h-2 bg-white/10 rounded" />
    </div>
  </div>
);

const AuroraPreview = () => (
  <div className="w-full h-full relative overflow-hidden bg-zinc-950">
    <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] rounded-full bg-[#00F0FF]/20 blur-[40px] animate-pulse" />
    <div className="absolute bottom-[-50%] right-[-20%] w-[150%] h-[150%] rounded-full bg-[#7000FF]/20 blur-[40px] animate-pulse delay-1000" />
  </div>
);

const NeonButtonPreview = () => (
  <div className="w-full h-full flex items-center justify-center bg-zinc-950">
     <button className="px-4 py-2 rounded-lg bg-[#00F0FF] text-black font-bold text-xs shadow-[0_0_15px_-5px_#00F0FF]">
        Action
     </button>
  </div>
);

const GridPreview = () => (
  <div className="w-full h-full bg-[#050505] relative overflow-hidden">
    <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        transform: 'perspective(500px) rotateX(60deg) translateY(-50px) scale(1.5)'
    }} />
  </div>
);

const PREVIEWS: Record<string, ReactNode> = {
  "glass-card": <GlassCardPreview />,
  "aurora-background": <AuroraPreview />,
  "neon-button": <NeonButtonPreview />,
  "animated-grid": <GridPreview />,
};

export function DesignCard({ item, onClick }: DesignCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.install);
    setCopied(true);
    toast.success("Install command copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="group relative rounded-xl border border-white/10 bg-[#0A0A0B] overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#00F0FF]/50 hover:shadow-[0_0_20px_-10px_rgba(0,240,255,0.3)] h-[280px] flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Preview Area (Top 60%) */}
      <div className="h-[60%] w-full relative overflow-hidden bg-black/20">
        {PREVIEWS[item.slug] || <div className="w-full h-full grid place-items-center text-zinc-700">No Preview</div>}
        
        {/* Overlay */}
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-4 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button 
                className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                <Eye size={14} /> View Details
            </button>
            <button 
                className="px-4 py-2 rounded-lg bg-[#00F0FF] text-black font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform"
                onClick={handleCopy}
            >
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy Install
            </button>
        </div>
      </div>

      {/* Details Area (Bottom 40%) */}
      <div className="h-[40%] p-4 flex flex-col justify-between border-t border-white/5 bg-white/[0.02]">
        <div>
            <h3 className="text-lg font-bold text-white font-display">{formatProductName(item.name)}</h3>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{item.description}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
            {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-500">
                    {tag}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
}