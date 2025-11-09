"use client";

import { ThemeToggle } from "@/components/theme-toggle";

/**
 * HeroBanner Component
 * Compact profile header with theme toggle
 */
export function HeroBanner() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-4">
      <div className="flex items-start justify-between">
        {/* Left: Logo and Info */}
        <div>
          {/* Logo */}
          <div className="mb-2">
            <div className="h-12 w-12 rounded-2xl bg-black dark:bg-lime-300 shadow-lg dark:shadow-xl grid place-items-center">
              <span className="text-lime-300 dark:text-black font-black text-2xl">g</span>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pb-3">
            <h1 className="text-xl md:text-2xl font-black text-black dark:text-white">
              gICM://SEND
            </h1>
            <p className="text-black/80 dark:text-white/80 text-xs md:text-sm mt-0.5">
              No Rights Reserved. • Vibecoding Marketplace
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}
