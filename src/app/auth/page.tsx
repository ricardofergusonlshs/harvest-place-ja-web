'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function safeNext(value: string | null) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const nextPath = safeNext(searchParams.get('next') || searchParams.get('redirect'));

  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isSignup = mode === 'signup';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (!cleanEmail || !password) {
        setMessage('Please enter your email and password.');
        return;
      }

      if (isSignup) {
        if (password.length < 6) {
          setMessage('Password must be at least 6 characters.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.user?.id) {
          try {
            const { error: customerError } = await supabase.from('customers').upsert(
              {
                user_id: data.user.id,
                email: cleanEmail,
                full_name: fullName.trim() || cleanEmail.split('@')[0],
              },
              { onConflict: 'user_id' }
            );

            if (customerError) {
              console.warn('Customer profile was not saved:', customerError.message);
            }
          } catch (customerError) {
            console.warn('Customer profile save failed:', customerError);
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData.session) {
          router.push(nextPath);
          router.refresh();
          return;
        }

        setMessage('Account created. Please check your email to confirm your account, then sign in.');
        setMode('login');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      router.push(nextPath);
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unable to continue. Please try again.';
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setLoading(true);
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (!cleanEmail) {
        setMessage('Enter your email first, then click magic link.');
        return;
      }

      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth?next=${encodeURIComponent(nextPath)}`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      setMessage('Magic link sent. Check your email to sign in.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unable to send magic link.';
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-220px)] bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_100%)] px-4 py-12 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-8 text-white shadow-[0_26px_80px_rgba(24,59,40,0.18)]">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3D9] text-[#183B28]">
            <Leaf className="h-7 w-7" />
          </div>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-[#DFA75A]">
            The Harvest Place Ja
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
            Sign in to continue.
          </h1>

          <p className="mt-4 max-w-md text-sm font-semibold leading-7 text-white/78">
            Access your box, checkout, orders, account details, subscriptions, and saved farm-market tools.
          </p>

          <div className="mt-8 grid gap-3 text-sm font-bold text-white/86">
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              Your farm box stays ready while you sign in.
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              New customers can create an account in seconds.
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_70px_rgba(24,59,40,0.10)] sm:p-8">
          <div className="mb-6 flex rounded-full border border-[#D8E5D4] bg-[#F4F9F2] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setMessage('');
              }}
              className={`flex-1 rounded-full px-4 py-3 text-sm font-black transition ${
                !isSignup ? 'bg-[#2D6741] text-white shadow-sm' : 'text-[#5F6A62] hover:text-[#183B28]'
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setMessage('');
              }}
              className={`flex-1 rounded-full px-4 py-3 text-sm font-black transition ${
                isSignup ? 'bg-[#2D6741] text-white shadow-sm' : 'text-[#5F6A62] hover:text-[#183B28]'
              }`}
            >
              Create account
            </button>
          </div>

          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#DFA75A]">
            {isSignup ? 'Create account' : 'Welcome back'}
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
            {isSignup ? 'Create your account' : 'Log in to your account'}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
            After signing in, you’ll continue to{' '}
            <span className="font-black text-[#183B28]">{nextPath}</span>.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {isSignup ? (
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#183B28]">
                  Full name
                </span>

                <span className="relative block">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2D6741]" />

                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your name"
                    className="h-[52px] w-full rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] px-4 py-3 pl-12 text-sm font-bold text-[#183B28] outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
                  />
                </span>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#183B28]">
                Email address
              </span>

              <span className="relative block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2D6741]" />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-[52px] w-full rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] px-4 py-3 pl-12 text-sm font-bold text-[#183B28] outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#183B28]">
                Password
              </span>

              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2D6741]" />

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-[52px] w-full rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] px-4 py-3 pl-12 text-sm font-bold text-[#183B28] outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
                />
              </span>
            </label>

            {message ? (
              <div className="rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] px-4 py-3 text-sm font-bold leading-6 text-[#8B5D18]">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#2D6741] px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.24)] transition hover:bg-[#183B28] disabled:cursor-not-allowed disabled:bg-[#D8E5D4] disabled:text-[#5F6A62]"
            >
              {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full rounded-full border border-[#D8E5D4] bg-white px-5 py-3.5 text-sm font-black text-[#183B28] transition hover:border-[#2D6741]/35 hover:bg-[#F4F9F2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send magic link instead
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
            <Link href="/" className="text-[#2D6741] hover:text-[#183B28]">
              Go home
            </Link>

            <Link href="/shop" className="text-[#2D6741] hover:text-[#183B28]">
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-220px)] bg-[#FAF8F0] px-4 py-12">
          <div className="mx-auto max-w-md rounded-[28px] border border-[#D8E5D4] bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-black text-[#183B28]">Loading sign in...</p>
          </div>
        </main>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}