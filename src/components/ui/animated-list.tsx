"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  delay?: number;
  stagger?: number;
}

export function AnimatedList({
  children,
  className = "",
  delay = 0,
  stagger = 0.05,
}: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.4,
            delay: delay + index * stagger,
            ease: [0.22, 1, 0.36, 1], // Custom easing for smooth feel
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
