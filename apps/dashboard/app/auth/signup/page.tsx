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
  User,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../../lib/supabase/auth";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGithub, signInWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase", met: /[A-Z]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.met);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
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

  if (success) {
    return (
      <div className="min-h-screen bg-gicm-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 mb-6">
            We&apos;ve sent a confirmation link to <span className="text-white">{email}</span>.
            Click the link to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center py-3 px-6 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 transition-colors"
          >
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
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 mt-2">Join gICM and start automating</p>
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
              <span className="px-4 bg-gicm-card text-gray-500">or sign up with email</span>
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
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary/50"
                />
              </div>
            </div>

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
                  placeholder="Create a password"
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
              {/* Password requirements */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          req.met ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      <span className={req.met ? "text-green-400" : "text-gray-500"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-green-500/50 focus:border-green-500/50"
                        : "border-red-500/50 focus:border-red-500/50"
                      : "border-gicm-border focus:border-gicm-primary/50"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5 rounded border-gicm-border bg-white/5"
              />
              <span className="text-sm text-gray-400">
                I agree to the{" "}
                <Link href="/terms" className="text-gicm-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-gicm-primary hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !allRequirementsMet || !passwordsMatch}
              className="w-full py-3 bg-gicm-primary text-black font-medium rounded-lg hover:bg-gicm-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <p className="text-center mt-6 text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-gicm-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
