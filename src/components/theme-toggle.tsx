"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="h-9 w-9 rounded-lg border border-black/20 bg-white/90 backdrop-blur grid place-items-center">
        <Sun className="h-4 w-4 text-black" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-lg border border-black/20 dark:border-white/20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur grid place-items-center hover:bg-white dark:hover:bg-zinc-800 transition-colors"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-lime-300" />
      ) : (
        <Moon className="h-4 w-4 text-black" />
      )}
    </button>
  );
}
