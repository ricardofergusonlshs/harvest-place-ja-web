'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Home,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function getSafeNextPath(value: string | null) {
  if (!value) return '/account';

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/account';
  }

  return value;
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);

  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState('Securely completing your sign in...');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (handledRef.current) return;

    handledRef.current = true;

    async function completeAuthCallback() {
      const supabase = getSupabaseBrowserClient();

      const next = getSafeNextPath(
        searchParams.get('next') || searchParams.get('redirect')
      );

      const error =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        '';

      if (error) {
        setFailed(true);
        setErrorMessage(error);
        return;
      }

      try {
        const code = searchParams.get('code');

        if (code) {
          setMessage('Verifying your secure sign-in link...');

          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) throw exchangeError;
        } else {
          setMessage('Checking your current session...');

          const { data, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) throw sessionError;

          if (!data.session) {
            throw new Error(
              'No active sign-in session was found. The link may have expired.'
            );
          }
        }

        setMessage('Sign in completed. Redirecting...');

        window.setTimeout(() => {
          router.replace(next);
          router.refresh();
        }, 500);
      } catch (err) {
        setFailed(true);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'The sign-in link may have expired or could not be verified.'
        );
      }
    }

    void completeAuthCallback();
  }, [router, searchParams]);

  if (failed) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 text-[#1E2A21] sm:px-6 lg:px-10">
        <section className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <Card className="w-full rounded-[34px] border border-red-200 bg-white p-7 text-center shadow-[0_24px_80px_rgba(24,59,40,0.12)] sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-50 text-red-700">
              <AlertCircle className="h-8 w-8" />
            </div>

            <Badge tone="red" className="mt-5">
              Sign-in failed
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
              Sign in could not be completed
            </h1>

            <p className="mt-3 text-sm font-semibold leading-7 text-[#5F6A62]">
              {errorMessage ||
                'The sign-in link may have expired or could not be verified. Please try signing in again.'}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/auth">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>

              <Button href="/" variant="secondary">
                <Home className="h-4 w-4" />
                Go home
              </Button>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <Card className="w-full rounded-[34px] border border-[#D8E5D4] bg-white p-7 text-center shadow-[0_24px_80px_rgba(24,59,40,0.12)] sm:p-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#EAF5E7] text-[#2D6741]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>

          <Badge tone="green" className="mt-5">
            <LockKeyhole className="h-3 w-3" />
            Secure callback
          </Badge>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
            Finishing sign in
          </h1>

          <p className="mt-3 text-sm font-semibold leading-7 text-[#5F6A62]">
            {message}
          </p>

          <div className="mt-6 grid gap-3 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4 text-left">
            <CallbackStep
              icon={<ShieldCheck className="h-4 w-4" />}
              text="Checking the secure Supabase session"
            />

            <CallbackStep
              icon={<CheckCircle2 className="h-4 w-4" />}
              text="Preparing your marketplace account"
            />
          </div>

          <p className="mt-5 text-xs font-bold leading-6 text-[#5F6A62]">
            Please do not close this page while your session is being completed.
          </p>
        </Card>
      </section>
    </main>
  );
}

function CallbackStep({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-[#5F6A62]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#2D6741]">
        {icon}
      </span>

      {text}
    </div>
  );
}