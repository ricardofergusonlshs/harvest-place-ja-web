'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  fetchCurrentFarmerProfile,
  isCurrentUserAdminFromDatabase,
} from '@/lib/services';
import type { FarmerProfile } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  farmerProfile: FarmerProfile | null;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);

  const refreshRoles = useCallback(async () => {
    try {
      const [admin, farmer] = await Promise.all([
        safeRoleLookup(isCurrentUserAdminFromDatabase(), false),
        safeRoleLookup(fetchCurrentFarmerProfile(), null),
      ]);

      setIsAdmin(Boolean(admin));
      setFarmerProfile(farmer);
    } catch {
      setIsAdmin(false);
      setFarmerProfile(null);
    }
  }, []);

  const clearRoles = useCallback(() => {
    setIsAdmin(false);
    setFarmerProfile(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function loadSession() {
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          setSession(null);
          clearRoles();
          return;
        }

        setSession(data.session);

        if (data.session) {
          await refreshRoles();
        } else {
          clearRoles();
        }
      } catch {
        if (!mounted) return;

        setSession(null);
        clearRoles();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setLoading(true);

      try {
        if (nextSession) {
          await refreshRoles();
        } else {
          clearRoles();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearRoles, refreshRoles]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Sign out failed, clearing local session anyway:', error);
    }

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.toLowerCase().includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      sessionStorage.clear();
    } catch {
      // Browser storage may be unavailable in some private/incognito contexts.
    }

    setSession(null);
    clearRoles();

    window.location.href = '/';
  }, [clearRoles]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isAdmin,
      farmerProfile,
      refreshRoles,
      signOut,
    }),
    [session, loading, isAdmin, farmerProfile, refreshRoles, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function safeRoleLookup<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 10000
): Promise<T> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        window.setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}