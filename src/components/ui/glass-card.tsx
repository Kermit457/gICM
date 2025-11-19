"use client";

import React, { useState, useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { CubeIcon, SparklesIcon, BoltIcon } from "@heroicons/react/24/outline";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    compact?: boolean;
    platforms?: string[];
    showPlatformFooter?: boolean;
}

const platformIcons: { [key: string]: React.ElementType } = {
    claude: CubeIcon,
    gemini: SparklesIcon,
    openai: BoltIcon,
};

export function GlassCard({
    children,
    className,
    hoverEffect = true,
    compact = false,
    platforms = [],
    showPlatformFooter = true,
    ...props
}: GlassCardProps) {
    const isUniversal = platforms.length > 1;
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!divRef.current || !hoverEffect) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => {
        if (hoverEffect) setOpacity(1);
    };

    const handleMouseLeave = () => {
        if (hoverEffect) setOpacity(0);
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            whileHover={hoverEffect ? { y: -2 } : {}}
            transition={{ duration: 0.2 }}
            className={cn(
                // Base: Very subtle glass, low noise, high quality border
                "relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#18181B]/60 backdrop-blur-md",
                "shadow-sm transition-all duration-300",
                compact ? "p-4" : "p-6",
                className
            )}
            {...props}
        >
            {/* Spotlight Overlay - White/Blue tint, very subtle */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-10"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.06), transparent 40%)`,
                }}
            />
            
            {/* Content */}
            <div className="relative z-20 flex-grow">{children}</div>

            {/* Footer with platform icons - Clean, monocolor */}
            {showPlatformFooter && (platforms.length > 0 || isUniversal) && (
                <div className="relative z-20 flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        {platforms.map((platform) => {
                            const Icon = platformIcons[platform];
                            return Icon ? (
                                <div key={platform} title={platform}>
                                    <Icon className="h-4 w-4 text-zinc-500 hover:text-zinc-300 transition-colors" />
                                </div>
                            ) : null;
                        })}
                    </div>
                    {isUniversal && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00F0FF]/5 border border-[#00F0FF]/10">
                            <div className="w-1 h-1 rounded-full bg-[#00F0FF]" />
                            <span className="text-[10px] font-medium text-[#00F0FF]/80 uppercase tracking-wider">
                                Universal
                            </span>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
