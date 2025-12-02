"use client";

import { useState, useEffect } from "react";
import { Zap, Wifi, WifiOff, Menu, X, Bell } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

export function Header({ onMenuToggle, menuOpen }: HeaderProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Check connection to Integration Hub
    const checkConnection = async () => {
      try {
        const hubUrl = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:3100";
        const res = await fetch(`${hubUrl}/api/status`, {
          method: "GET",
          signal: AbortSignal.timeout(2000)
        });
        setConnected(res.ok);
      } catch {
        setConnected(false);
      }
    };

    checkConnection();
    const connTimer = setInterval(checkConnection, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(connTimer);
    };
  }, []);

  const currentPhase = () => {
    if (!time) return "...";
    const hour = time.getUTCHours();
    if (hour < 4) return "Morning Scan";
    if (hour < 6) return "Decision Planning";
    if (hour < 20) return "Execution";
    if (hour < 22) return "Reflection";
    return "Maintenance";
  };

  if (!mounted) {
    return (
      <header className="border-b border-gicm-border bg-gicm-dark px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-gicm-primary" />
            <div>
              <h1 className="text-xl font-bold">gICM Empire</h1>
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-gicm-border bg-gicm-dark px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo and Menu Button */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-3">
            <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-gicm-primary" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">gICM Empire</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Autonomous AI Platform</p>
            </div>
          </Link>
        </div>

        {/* Right: Status indicators */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Connection status - compact on mobile */}
          <div className="flex items-center gap-1 sm:gap-2">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs hidden sm:inline ${connected ? "text-green-400" : "text-red-400"}`}>
              {connected ? "Connected" : "Offline"}
            </span>
          </div>

          {/* Notifications - shown on all sizes */}
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gicm-primary rounded-full" />
          </button>

          {/* Time and Phase - hidden on mobile */}
          <div className="text-right hidden md:block">
            <div className="text-base lg:text-lg font-mono">
              {time ? time.toLocaleTimeString() : "--:--:--"}
            </div>
            <div className="text-xs text-gicm-primary">{currentPhase()}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
