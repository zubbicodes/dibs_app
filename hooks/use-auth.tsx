import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: Error | null }>;
  updateName: (fullName: string) => Promise<{ error: Error | null }>;
  updateAvatar: (avatarUrl: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the existing session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsLoading(false);
    });

    // Listen for auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,

      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
      },

      signUp: async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
      },

      signOut: async () => {
        await supabase.auth.signOut();
      },

      sendPasswordReset: async (email: string) => {
        // Sends a 6-digit OTP via email if the user exists.
        // shouldCreateUser: false prevents creating new accounts.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        return { error };
      },

      verifyOtp: async (email: string, token: string) => {
        // Verifies the 6-digit OTP and signs the user in (creates a session).
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });
        return { error };
      },

      updatePassword: async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error };
      },

      updateEmail: async (newEmail: string) => {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        return { error };
      },

      updateName: async (fullName: string) => {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
        return { error };
      },

      updateAvatar: async (avatarUrl: string) => {
        const { error } = await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl },
        });
        return { error };
      },

      refreshUser: async () => {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setSession((prev) =>
            prev ? { ...prev, user: data.user } : null
          );
        }
      },
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
