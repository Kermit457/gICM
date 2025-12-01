"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, Loader2, Zap, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError("Authentication not configured");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gicm-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 mb-6">
            We&apos;ve sent a password reset link to <span className="text-white">{email}</span>.
            Click the link to reset your password.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gicm-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gicm-primary/20 mb-4">
            <Zap className="w-8 h-8 text-gicm-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-gray-400 mt-2">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Card */}
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-8">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </div>

        {/* Back to login */}
        <p className="text-center mt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
