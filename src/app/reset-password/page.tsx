'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        setHasSession(Boolean(data.session));
      } catch {
        if (!mounted) return;

        setHasSession(false);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage('');
    setError('');

    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!cleanPassword || !cleanConfirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        throw new Error(
          'Your reset session was not found. Please open the latest password reset link from your email.'
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) throw updateError;

      setPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully. You can now sign in with your new password.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Password could not be updated. Please request a new reset link and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-8 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-5xl">
        <ResetHero />

        <div className="mt-8">
          <SectionHeader
            eyebrow="Account recovery"
            title="Reset password"
            subtitle="Create a new password for your Harvest Place Ja account after opening the recovery link from your email."
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
            <Badge tone="green">
              <KeyRound className="h-3 w-3" />
              New password
            </Badge>

            <form onSubmit={updatePassword} className="mt-6 grid gap-5">
              <PasswordField
                label="New password"
                value={password}
                onChange={setPassword}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((value) => !value)}
              />

              <PasswordField
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((value) => !value)}
              />

              {checkingSession ? (
                <div className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-bold text-[#5F6A62]">
                  Checking your reset session...
                </div>
              ) : !hasSession ? (
                <div className="rounded-2xl border border-[#DFA75A]/40 bg-[#FFF3D9] px-4 py-3 text-sm font-bold leading-6 text-[#8B5D18]">
                  <span className="inline-flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Reset session not detected.
                  </span>
                  <p className="mt-1">
                    Open the latest password recovery link from your email, then set your new password here.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#2D6741]/20 bg-[#EAF5E7] px-4 py-3 text-sm font-bold text-[#2D6741]">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Recovery session detected.
                  </span>
                </div>
              )}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-[#2D6741]/20 bg-[#EAF5E7] px-4 py-3 text-sm font-black text-[#2D6741]">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || checkingSession}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2D6741] px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.22)] transition hover:bg-[#183B28] disabled:cursor-not-allowed disabled:bg-[#D8E5D4] disabled:text-[#5F6A62]"
              >
                <LockKeyhole className="h-4 w-4" />
                {loading ? 'Updating password...' : 'Update password'}
              </button>

              {message ? (
                <Button href="/auth" variant="secondary" className="w-full">
                  Go to sign in
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </form>
          </Card>

          <Card className="rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_24px_70px_rgba(24,59,40,0.16)] sm:p-8">
            <Badge tone="gold">
              <ShieldCheck className="h-3 w-3" />
              Account safety
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
              Keep your account protected.
            </h2>

            <div className="mt-6 grid gap-3">
              <SecurityTip text="Use at least 6 characters. A longer password is better." />
              <SecurityTip text="Do not reuse the same password from another app." />
              <SecurityTip text="After updating, sign in again with your new password." />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="inline-flex rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-white"
              >
                Back to sign in
              </Link>

              <Link
                href="/support"
                className="inline-flex rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
              >
                Contact support
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function ResetHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10">
        <Badge tone="gold">
          <LockKeyhole className="h-3 w-3" />
          Secure recovery
        </Badge>

        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
          Create a fresh password for your account.
        </h1>

        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
          Use the recovery link from your email, enter a new password, and return to shopping securely.
        </p>
      </div>
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#183B28]">
      {label}

      <span className="relative block">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2D6741]" />

        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter password"
          className="h-[52px] w-full rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] px-4 py-3 pl-12 pr-12 text-sm font-bold text-[#183B28] outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[#2D6741] transition hover:bg-[#EAF5E7]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

function SecurityTip({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 text-sm font-semibold leading-6 text-white/78">
      {text}
    </div>
  );
}