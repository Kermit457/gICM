"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    showRadialOverlay?: boolean;
}

export function AuroraBackground({
    className,
    children,
    showRadialOverlay = false, // Default to false for cleaner look
    ...props
}: AuroraBackgroundProps) {
    return (
        <div className={cn("relative w-full min-h-screen bg-[#0A0A0B] text-white", className)} {...props}>
            {/* Ambient Background Wash - Subtle & Premium */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Top Center - Soft Blue/Purple Wash */}
                <div 
                    className="absolute top-[-20%] left-[10%] w-[80vw] h-[60vh] rounded-full bg-[radial-gradient(circle,rgba(78,130,238,0.15)_0%,transparent_70%)] blur-[100px] animate-pulse-glow" 
                    style={{ animationDuration: '8s' }}
                />
                
                {/* Bottom Right - Subtle Teal Wash */}
                <div 
                    className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.08)_0%,transparent_70%)] blur-[120px]" 
                />
                
                {/* Grain Texture for "Film" look */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
