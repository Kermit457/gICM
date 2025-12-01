"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Cpu, Wallet, Activity } from "lucide-react";
import { ConnectionIndicator } from "./ConnectionIndicator";

const navItems = [
  { href: "/brain", label: "Brain", icon: Brain },
  { href: "/engines", label: "Engines", icon: Cpu },
  { href: "/treasury", label: "Treasury", icon: Wallet },
  { href: "/events", label: "Events", icon: Activity },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">gICM</span>
            </Link>

            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium " +
                      (isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white")
                    }
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <ConnectionIndicator />
        </div>
      </div>
    </nav>
  );
}
