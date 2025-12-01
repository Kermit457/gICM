"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Chrome,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGithub, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleGithub = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGithub();
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gicm-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gicm-primary/20 mb-4">
            <Zap className="w-8 h-8 text-gicm-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to gICM</h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-8">
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGithub}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 border border-gicm-border rounded-lg transition-colors disabled:opacity-50"
            >
              <Github className="w-5 h-5" />
              <span className="text-white">Continue with GitHub</span>
            </button>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 border border-gicm-border rounded-lg transition-colors disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              <span className="text-white">Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gicm-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gicm-card text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gicm-border bg-white/5" />
                <span className="text-gray-400">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-gicm-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="text-center mt-6 text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-gicm-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
