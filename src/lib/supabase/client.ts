'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function requiredEnv(name: string, value: string | undefined) {
  if (!value || !value.trim()) {
    throw new Error(`Missing ${name}. Add it to .env.local and Vercel Environment Variables.`);
  }

  return value.trim();
}

function isExpiredSupabaseSession(value: string | null) {
  if (!value) return false;

  try {
    const parsed = JSON.parse(value);
    const expiresAt = Number(parsed?.expires_at || parsed?.currentSession?.expires_at || 0);

    if (!expiresAt) return false;

    const nowSeconds = Math.floor(Date.now() / 1000);

    return expiresAt <= nowSeconds + 60;
  } catch {
    return false;
  }
}

const safeSupabaseStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return null;

    const value = window.localStorage.getItem(key);

    if (
      key.startsWith('sb-') &&
      key.includes('auth-token') &&
      isExpiredSupabaseSession(value)
    ) {
      window.localStorage.removeItem(key);
      return null;
    }

    return value;
  },

  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },

  removeItem(key: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

async function safeBrowserFetch(input: RequestInfo | URL, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch (error) {
    console.warn('Supabase network request failed:', error);

    return new Response(
      JSON.stringify({
        error: 'network_error',
        message: 'Supabase request failed safely.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

export function getSupabaseBrowserClient() {
  const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      global: {
        fetch: safeBrowserFetch,
      },
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: safeSupabaseStorage,
      },
    });
  }

  return browserClient;
}

export function clearSupabaseBrowserSession() {
  if (typeof window === 'undefined') return;

  Object.keys(window.localStorage).forEach((key) => {
    if (key.startsWith('sb-') || key.toLowerCase().includes('supabase')) {
      window.localStorage.removeItem(key);
    }
  });

  try {
    window.sessionStorage.clear();
  } catch {
    // Ignore storage errors.
  }
}
