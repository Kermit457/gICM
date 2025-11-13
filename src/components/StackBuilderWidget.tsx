"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, X, Package } from "lucide-react";
import { useBundleStore } from "@/lib/store/bundle";
import { Button } from "./ui/button";
import { formatProductName } from "@/lib/utils";

export function StackBuilderWidget() {
  const { getActiveStack, itemCount, openCart, closeCart, isOpen, removeItem } = useBundleStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only showing after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Get items from active stack
  const activeStack = getActiveStack();
  const items = activeStack?.items || [];
  const count = items.length;

  if (count === 0) {
    return null; // Don't show widget if stack is empty
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={openCart}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-black font-semibold px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="bg-black text-lime-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-black">
            {count}
          </span>
        </button>
      )}

      {/* Slide-out Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="border-b border-black/10 p-6 bg-lime-500/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-black text-lime-300 grid place-items-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-black">Your Stack</h2>
                    <p className="text-sm text-black/60">{count} items selected</p>
                  </div>
                </div>
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Link
                  href="/analytics"
                  onClick={closeCart}
                  className="text-black/60 hover:text-black underline inline-flex items-center gap-1"
                >
                  📊 Analytics
                </Link>
                <span className="text-black/20">|</span>
                <Link
                  href="/workflow"
                  onClick={closeCart}
                  className="text-black/60 hover:text-black underline inline-flex items-center gap-1"
                >
                  ✨ AI Builder
                </Link>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12 text-black/40">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Your stack is empty</p>
                </div>
              ) : (
                items.map(({ item }) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-black/10 bg-white hover:border-lime-500/50 transition-colors group"
                  >
                    <div className="h-12 w-12 rounded-lg bg-black text-lime-300 grid place-items-center font-black text-sm flex-shrink-0">
                      g
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-black truncate">{formatProductName(item.name)}</h3>
                      <p className="text-xs text-black/60 uppercase tracking-wide">{item.kind}</p>
                      {item.tokenSavings && (
                        <p className="text-xs text-lime-600 font-medium mt-1">
                          {item.tokenSavings}% token savings
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                      title="Remove from stack"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-black/10 p-6 space-y-3 bg-lime-500/5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Total Token Savings:</span>
                <span className="text-lime-600 font-black text-lg">
                  {items.reduce((sum, { item }) => sum + (item.tokenSavings || 0), 0)}%
                </span>
              </div>

              <Link href="/stack" onClick={closeCart}>
                <Button className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold">
                  View & Install Stack
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
