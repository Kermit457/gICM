"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGridProps {
  className?: string;
}

export function AnimatedGrid({ className }: AnimatedGridProps) {
  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-[#05050A]", className)}>
      {/* Base Grid */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}
      />

      {/* Moving Perspective Grid */}
      <div className="absolute inset-0 z-10 perspective-grid-container opacity-30">
        <div className="perspective-grid" />
      </div>

      <style jsx>{`
        .perspective-grid-container {
          perspective: 1000px;
          transform-style: preserve-3d;
        }
        .perspective-grid {
          position: absolute;
          width: 200%;
          height: 200%;
          left: -50%;
          top: -50%;
          background-image: 
            linear-gradient(to right, rgba(0, 240, 255, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.2) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: rotateX(60deg);
          animation: grid-move 20s linear infinite;
        }
        @keyframes grid-move {
          0% { transform: rotateX(60deg) translateY(0); }
          100% { transform: rotateX(60deg) translateY(60px); }
        }
      `}</style>
    </div>
  );
}
