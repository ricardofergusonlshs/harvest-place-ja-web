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

import {
  clearSupabaseBrowserSession,
  getSupabaseBrowserClient,
} from '@/lib/supabase/client';
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

  const clearRoles = useCallback(() => {
    setIsAdmin(false);
    setFarmerProfile(null);
  }, []);

  const refreshRoles = useCallback(async () => {
    try {
      const [admin, farmer] = await Promise.all([
        safeRoleLookup(isCurrentUserAdminFromDatabase(), false),
        safeRoleLookup(fetchCurrentFarmerProfile(), null),
      ]);

      setIsAdmin(Boolean(admin));
      setFarmerProfile(farmer);
    } catch {
      clearRoles();
    }
  }, [clearRoles]);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    async function loadSession() {
      setLoading(true);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.warn('Auth session could not load. Clearing local session:', error);
          clearSupabaseBrowserSession();
          setSession(null);
          clearRoles();
          return;
        }

        setSession(data.session ?? null);

        if (data.session) {
          await refreshRoles();
        } else {
          clearRoles();
        }

        const listener = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          if (!mounted) return;

          try {
            setLoading(true);
            setSession(nextSession);

            if (nextSession) {
              await refreshRoles();
            } else {
              clearRoles();
            }
          } catch (error) {
            console.warn('Auth state update failed safely:', error);
            clearSupabaseBrowserSession();
            setSession(null);
            clearRoles();
          } finally {
            if (mounted) setLoading(false);
          }
        });

        unsubscribe = () => listener.data.subscription.unsubscribe();
      } catch (error) {
        console.warn('Auth provider recovered from session error:', error);

        if (!mounted) return;

        clearSupabaseBrowserSession();
        setSession(null);
        clearRoles();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadSession();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [clearRoles, refreshRoles]);

  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Sign out failed, clearing local session anyway:', error);
    }

    clearSupabaseBrowserSession();
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
    [session, loading, isAdmin, farmerProfile, refreshRoles, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function safeRoleLookup<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 8000,
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
