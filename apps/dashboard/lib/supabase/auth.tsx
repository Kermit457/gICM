"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const signInWithGithub = async () => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/reset-password`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        signInWithGithub,
        signInWithGoogle,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected route wrapper
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gicm-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gicm-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    return null;
  }

  return <>{children}</>;
}
