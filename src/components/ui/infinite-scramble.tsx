"use client";

import { useState, useEffect } from "react";

interface InfiniteScrambleProps {
  length?: number;
  active: boolean;
  className?: string;
}

/**
 * InfiniteScramble Component
 * Generates random alphanumeric characters that NEVER stop changing
 * No target text - pure infinite scrambling
 */
export function InfiniteScramble({
  length = 44,
  active,
  className = ""
}: InfiniteScrambleProps) {
  const [text, setText] = useState("");
  const [mounted, setMounted] = useState(false);

  // Set mounted on client-side only
  useEffect(() => {
    setMounted(true);
    setText(generateRandomText(length));
  }, [length]);

  // Animate when active
  useEffect(() => {
    if (!active || !mounted) return;

    const intervalId = setInterval(() => {
      setText(generateRandomText(length));
    }, 50); // Change every 50ms for smooth continuous effect

    return () => clearInterval(intervalId);
  }, [active, length, mounted]);

  // Prevent hydration mismatch by rendering placeholder until mounted
  if (!mounted) {
    return <span className={className}>{"·".repeat(length)}</span>;
  }

  return <span className={className}>{text}</span>;
}

/**
 * Generate random alphanumeric text
 */
function generateRandomText(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
