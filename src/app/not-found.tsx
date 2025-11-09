import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-300 via-emerald-300 to-teal-300 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-12 text-center">
          {/* 404 Display */}
          <div className="mb-8">
            <h1 className="text-9xl font-black text-black mb-4">404</h1>
            <div className="h-1 w-32 bg-lime-500 mx-auto rounded-full mb-6" />
          </div>

          {/* Message */}
          <h2 className="text-3xl font-black text-black mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-black/60 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button className="gap-2 bg-lime-500 hover:bg-lime-600 text-black font-bold">
                <Home size={18} />
                Back to Home
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="gap-2 border-black/20 hover:border-black/40">
                <Search size={18} />
                Browse Catalog
              </Button>
            </Link>
          </div>

          {/* Additional Help */}
          <div className="mt-12 pt-8 border-t border-black/10">
            <p className="text-sm text-black/50 mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <Link href="/" className="text-black/60 hover:text-black font-medium transition-colors">
                Agents
              </Link>
              <span className="text-black/30">•</span>
              <Link href="/" className="text-black/60 hover:text-black font-medium transition-colors">
                Skills
              </Link>
              <span className="text-black/30">•</span>
              <Link href="/" className="text-black/60 hover:text-black font-medium transition-colors">
                Commands
              </Link>
              <span className="text-black/30">•</span>
              <Link href="/workflow" className="text-black/60 hover:text-black font-medium transition-colors">
                AI Builder
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
