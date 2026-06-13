'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Bell,
  Leaf,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sprout,
  UserRound,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function safeNext(value: string | null) {
  if (!value) return '/account';
  if (!value.startsWith('/')) return '/account';
  if (value.startsWith('//')) return '/account';
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
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    try {
      if (!cleanEmail || !cleanPassword) {
        setMessage('Please enter your email and password.');
        return;
      }

      if (cleanPassword.length < 6) {
        setMessage('Password must be at least 6 characters.');
        return;
      }

      if (isSignup && !cleanName) {
        setMessage('Please enter your full name.');
        return;
      }

      if (isSignup) {
        const redirectTo =
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
            : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: cleanName,
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
                full_name: cleanName || cleanEmail.split('@')[0],
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
        password: cleanPassword,
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
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      setMessage('Magic link sent. Check your email to sign in securely.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unable to send magic link.';
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-220px)] bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_55%,#FFFEFC_100%)] px-4 py-12 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <AuthHero />

        <div className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_80px_rgba(24,59,40,0.12)] sm:p-8">
          <div
            className="pointer-events-none absolute right-[-90px] top-[-90px] h-44 w-44 rounded-full bg-[#EAF5E7]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-[-110px] left-[-110px] h-52 w-52 rounded-full bg-[#FFF3D9]"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="mb-6 flex rounded-full border border-[#D8E5D4] bg-[#F4F9F2] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage('');
                }}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-black transition ${
                  !isSignup
                    ? 'bg-[#2D6741] text-white shadow-sm'
                    : 'text-[#5F6A62] hover:text-[#183B28]'
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
                  isSignup
                    ? 'bg-[#2D6741] text-white shadow-sm'
                    : 'text-[#5F6A62] hover:text-[#183B28]'
                }`}
              >
                Create account
              </button>
            </div>

            <p className="w-fit rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#8B5D18]">
              {isSignup ? 'Join the platform' : 'Welcome back'}
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] text-[#183B28]">
              {isSignup ? 'Create your Harvest Place account' : 'Sign in to explore farms'}
            </h2>

            <p className="mt-3 text-sm font-semibold leading-7 text-[#5F6A62]">
              {isSignup
                ? 'Create an account to follow farms, receive harvest alerts, and send safe produce requests inside The Harvest Place Ja.'
                : 'Access your followed farms, harvest alerts, safe messages, and produce requests.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {isSignup ? (
                <Field
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  icon={<UserRound className="h-5 w-5" />}
                  placeholder="Your name"
                />
              ) : null}

              <Field
                label="Email address"
                value={email}
                onChange={setEmail}
                icon={<Mail className="h-5 w-5" />}
                placeholder="you@example.com"
                type="email"
              />

              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                icon={<LockKeyhole className="h-5 w-5" />}
                placeholder="Enter your password"
                type="password"
              />

              {message ? (
                <div className="rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] px-4 py-3 text-sm font-bold leading-6 text-[#8B5D18]">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2D6741] px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.24)] transition hover:bg-[#183B28] disabled:cursor-not-allowed disabled:bg-[#D8E5D4] disabled:text-[#5F6A62]"
              >
                <LockKeyhole className="h-4 w-4" />
                {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-5 py-3.5 text-sm font-black text-[#183B28] transition hover:border-[#2D6741]/35 hover:bg-[#F4F9F2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                Email me a secure magic link
              </button>
            </form>

            <div className="mt-6 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
                Platform safety
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
                For safety, all produce requests, messages, and order discussions should stay inside The Harvest Place Ja.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
              <Link href="/" className="inline-flex items-center gap-2 text-[#2D6741] hover:text-[#183B28]">
                Go home
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link href="/farmer" className="inline-flex items-center gap-2 text-[#2D6741] hover:text-[#183B28]">
                Explore farms
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-8 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#183B28]">
          <Leaf className="h-3.5 w-3.5" />
          The Harvest Place Ja
        </div>

        <h1 className="mt-5 max-w-xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
          Discover Jamaican farms. Request safely.
        </h1>

        <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-white/78 sm:text-base">
          Sign in to follow local farms, view harvest updates, request produce, and keep every message inside the platform.
        </p>

        <div className="mt-7 grid gap-3">
          <HeroLine icon={<Sprout className="h-5 w-5" />} text="Explore farm profiles before viewing produce" />
          <HeroLine icon={<Bell className="h-5 w-5" />} text="Receive harvest alerts from farms you follow" />
          <HeroLine icon={<MessageCircle className="h-5 w-5" />} text="Send safe platform-only produce requests" />
          <HeroLine icon={<ShieldCheck className="h-5 w-5" />} text="No public phone, WhatsApp, or email sharing" />
        </div>
      </div>
    </section>
  );
}

function HeroLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 p-4 text-sm font-semibold text-white/78 backdrop-blur">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FFF3D9] text-[#183B28]">
        {icon}
      </span>
      {text}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#183B28]">
        {label}
      </span>

      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6741]">
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-[52px] w-full rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] px-4 py-3 pl-12 text-sm font-bold text-[#183B28] outline-none transition placeholder:text-[#5F6A62]/60 focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
        />
      </span>
    </label>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-220px)] bg-[#FAF8F0] px-4 py-12">
          <div className="mx-auto max-w-md rounded-[28px] border border-[#D8E5D4] bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-black text-[#183B28]">Loading secure sign in...</p>
          </div>
        </main>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
