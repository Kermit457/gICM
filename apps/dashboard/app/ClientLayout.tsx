"use client";

import { useState, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { TabNav } from "../components/layout/TabNav";
import { AuthProvider } from "../lib/supabase/auth";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <AuthProvider>
      <Header onMenuToggle={handleMenuToggle} menuOpen={mobileMenuOpen} />
      <TabNav mobileMenuOpen={mobileMenuOpen} onMobileMenuClose={handleMenuClose} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
    </AuthProvider>
  );
}
