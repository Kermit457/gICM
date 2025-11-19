"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface NeonButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function NeonButton({ children, className, variant = 'primary', ...props }: NeonButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative group px-6 py-3 font-bold text-sm uppercase tracking-wider rounded-lg overflow-hidden transition-all duration-300',
        // Base styles
        isPrimary 
          ? 'text-black bg-[#00F0FF] border border-[#00F0FF]' 
          : 'text-[#00F0FF] bg-transparent border border-[#00F0FF]/50 hover:border-[#00F0FF]',
        // Glow effects
        isPrimary 
          ? 'shadow-[0_0_20px_-5px_rgba(0,240,255,0.6)] hover:shadow-[0_0_30px_-5px_rgba(0,240,255,0.8)]' 
          : 'hover:shadow-[0_0_20px_-5px_rgba(0,240,255,0.4)] hover:bg-[#00F0FF]/10',
        className
      )}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
      
      <span className="relative z-10 flex items-center gap-2 justify-center">
        {children}
      </span>
    </motion.button>
  );
}