"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Wallet,
  TrendingUp,
  Package,
  Target,
  Store,
  Activity,
  CircleDot,
  Lightbulb,
  Sliders,
  Workflow,
  BarChart3,
  Users,
  Shield,
  ChevronDown,
  X,
} from "lucide-react";

const tabs = [
  { href: "/command", label: "Command", icon: Sliders },
  { href: "/brain", label: "Brain", icon: Brain },
  { href: "/pipelines", label: "Pipelines", icon: Workflow },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/treasury", label: "Treasury", icon: Wallet },
  { href: "/trading", label: "Trading", icon: TrendingUp },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/autonomy", label: "Autonomy", icon: Shield },
  { href: "/growth", label: "Growth", icon: TrendingUp },
  { href: "/product", label: "Product", icon: Package },
  { href: "/hunter", label: "Hunter", icon: Target },
  { href: "/predictions", label: "Predictions", icon: CircleDot },
  { href: "/brainstorm", label: "Brainstorm", icon: Lightbulb },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/events", label: "Events", icon: Activity },
];

// Primary tabs shown on desktop
const primaryTabs = tabs.slice(0, 8);
// Secondary tabs in dropdown
const secondaryTabs = tabs.slice(8);

interface TabNavProps {
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

export function TabNav({ mobileMenuOpen, onMobileMenuClose }: TabNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    onMobileMenuClose?.();
  }, [pathname, onMobileMenuClose]);

  const isActive = (href: string) => pathname === href || (pathname === "/" && href === "/brain");

  if (!mounted) {
    return (
      <nav className="border-b border-gicm-border bg-gicm-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 h-12" />
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileMenuClose}
          />

          {/* Menu Panel */}
          <nav className="absolute left-0 top-0 bottom-0 w-72 bg-gicm-card border-r border-gicm-border overflow-y-auto">
            <div className="sticky top-0 p-4 border-b border-gicm-border bg-gicm-card flex items-center justify-between">
              <span className="text-lg font-semibold">Navigation</span>
              <button
                onClick={onMobileMenuClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-gicm-primary text-black"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="border-b border-gicm-border bg-gicm-card/50 backdrop-blur-sm sticky top-0 z-40 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center py-2">
            {/* Primary tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {primaryTabs.map((tab) => {
                const active = isActive(tab.href);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      active
                        ? "bg-gicm-primary text-black"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            {/* More dropdown */}
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  secondaryTabs.some((t) => isActive(t.href))
                    ? "bg-gicm-primary text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                More
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-gicm-card border border-gicm-border rounded-lg shadow-xl overflow-hidden">
                  {secondaryTabs.map((tab) => {
                    const active = isActive(tab.href);
                    const Icon = tab.icon;
                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                          active
                            ? "bg-gicm-primary text-black"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile compact nav - shows current page */}
      <nav className="border-b border-gicm-border bg-gicm-card/50 backdrop-blur-sm sticky top-0 z-40 lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {tabs.slice(0, 6).map((tab) => {
              const active = isActive(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? "bg-gicm-primary text-black"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
