'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  KeyRound,
  Leaf,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'signup' | 'reset';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

export function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const next = safeNextPath(searchParams.get('next') || searchParams.get('redirect'));

  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isReset = mode === 'reset';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage('');
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isReset && cleanPassword.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }

    if (isSignup && !cleanName) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (isReset) {
        const redirectTo =
          typeof window !== 'undefined'
            ? `${window.location.origin}/reset-password`
            : undefined;

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          { redirectTo }
        );

        if (resetError) throw resetError;

        setMessage('Password reset link sent. Please check your email.');
        setLoading(false);
        return;
      }

      if (isSignup) {
        const redirectTo =
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
            : undefined;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: cleanName,
            },
          },
        });

        if (signUpError) throw signUpError;

        try {
          await supabase.from('customers').upsert(
            {
              id: data.user?.id,
              email: cleanEmail,
              full_name: cleanName,
            },
            { onConflict: 'id' }
          );
        } catch {
          // Customer profile can still be completed later from the account page.
        }

        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }

        setMessage('Account created. Please check your email to confirm your account.');
        setLoading(false);
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (loginError) throw loginError;

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setMessage('');
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address first.');
      return;
    }

    setLoading(true);

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
          : undefined;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (otpError) throw otpError;

      setMessage('Magic sign-in link sent. Please check your email.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Magic link could not be sent. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-8 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <AuthHero />

        <Card className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_80px_rgba(24,59,40,0.12)] sm:p-8">
          <div className="pointer-events-none absolute right-[-90px] top-[-90px] h-44 w-44 rounded-full bg-[#EAF5E7]" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-90px] left-[-90px] h-44 w-44 rounded-full bg-[#FFF3D9]" aria-hidden="true" />

          <div className="relative z-10">
            <Badge tone="green">
              <LockKeyhole className="h-3 w-3" />
              Secure platform account
            </Badge>

            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#183B28]">
              {isLogin ? 'Sign in to explore farms' : isSignup ? 'Create your farm discovery account' : 'Reset your password'}
            </h1>

            <p className="mt-3 text-sm font-semibold leading-7 text-[#5F6A62]">
              {isLogin
                ? 'Access followed farms, harvest alerts, safe produce requests, and platform-only messages.'
                : isSignup
                  ? 'Join The Harvest Place Ja to explore Jamaican farms, follow harvest updates, and request produce safely inside the platform.'
                  : 'Enter your email and we will send you a secure password reset link.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              {isSignup ? (
                <Field
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  icon={<UserRound className="h-5 w-5" />}
                  placeholder="Your full name"
                />
              ) : null}

              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                icon={<Mail className="h-5 w-5" />}
                placeholder="you@example.com"
                type="email"
              />

              {!isReset ? (
                <Field
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  icon={<KeyRound className="h-5 w-5" />}
                  placeholder="Enter password"
                  type="password"
                />
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-[#2D6741]/20 bg-[#EAF5E7] px-4 py-3 text-sm font-black text-[#2D6741]">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {message}
                  </span>
                </div>
              ) : null}

              <Button type="submit" disabled={loading} className="w-full">
                <LockKeyhole className="h-4 w-4" />
                {loading
                  ? 'Please wait...'
                  : isLogin
                    ? 'Sign in'
                    : isSignup
                      ? 'Create account'
                      : 'Send reset link'}
              </Button>

              {!isReset ? (
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#D8E5D4] bg-[#FFFEFC] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-[#F4F9F2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  Email me a magic link
                </button>
              ) : null}
            </form>

            <div className="mt-6 grid gap-3 border-t border-[#D8E5D4] pt-5 text-sm font-bold text-[#5F6A62]">
              {isLogin ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-left text-[#2D6741] hover:text-[#183B28]"
                  >
                    New to The Harvest Place Ja? Create an account
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-left text-[#2D6741] hover:text-[#183B28]"
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-left text-[#2D6741] hover:text-[#183B28]"
                >
                  Already have an account? Sign in
                </button>
              )}

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[#2D6741] hover:text-[#183B28]"
              >
                Go home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function AuthHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-8 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" aria-hidden="true" />

      <div className="relative z-10">
        <Badge tone="gold">
          <Leaf className="h-3 w-3" />
          The Harvest Place Ja
        </Badge>

        <h2 className="mt-5 max-w-xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
          Discover Jamaican farms with a secure platform account.
        </h2>

        <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-white/78 sm:text-base">
          Sign in to follow farms, view harvest updates, request items safely, and keep all messages inside The Harvest Place Ja.
        </p>

        <div className="mt-7 grid gap-3">
          <HeroLine icon={<Sprout className="h-5 w-5" />} text="Explore farm profiles before viewing produce" />
          <HeroLine icon={<MessageCircle className="h-5 w-5" />} text="Send safe produce requests inside the platform" />
          <HeroLine icon={<Bell className="h-5 w-5" />} text="Follow farms and receive harvest alerts" />
          <HeroLine icon={<ShieldCheck className="h-5 w-5" />} text="No public phone, WhatsApp, or direct contact sharing" />
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
    <label className="grid gap-2 text-sm font-black text-[#183B28]">
      {label}

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
