'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Home,
  Leaf,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sprout,
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
          setMessage('Checking your current Harvest Place session...');

          const { data, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) throw sessionError;

          if (!data.session) {
            throw new Error(
              'No active sign-in session was found. The link may have expired.'
            );
          }
        }

        setMessage('Sign in completed. Opening your farm-first dashboard...');

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
          <Card className="relative w-full overflow-hidden rounded-[34px] border border-red-200 bg-white p-7 text-center shadow-[0_24px_80px_rgba(24,59,40,0.12)] sm:p-8">
            <div className="pointer-events-none absolute right-[-70px] top-[-80px] h-44 w-44 rounded-full bg-red-50" aria-hidden="true" />
            <div className="pointer-events-none absolute bottom-[-90px] left-[-80px] h-48 w-48 rounded-full bg-[#FFF3D9]/60" aria-hidden="true" />

            <div className="relative z-10">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-50 text-red-700 shadow-sm">
                <AlertCircle className="h-8 w-8" />
              </div>

              <Badge tone="red" className="mt-5">
                Secure sign-in failed
              </Badge>

              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
                Sign in could not be completed
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-[#5F6A62]">
                {errorMessage ||
                  'The sign-in link may have expired or could not be verified. Please try signing in again to continue exploring farms safely.'}
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button href="/auth">
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>

                <Button href="/" variant="secondary">
                  <Home className="h-4 w-4" />
                  Back to farms
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <Card className="relative w-full overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-7 text-center shadow-[0_24px_80px_rgba(24,59,40,0.12)] sm:p-8">
          <div className="pointer-events-none absolute right-[-70px] top-[-80px] h-44 w-44 rounded-full bg-[#EAF5E7]" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-90px] left-[-80px] h-48 w-48 rounded-full bg-[#FFF3D9]/70" aria-hidden="true" />

          <div className="relative z-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#EAF5E7] text-[#2D6741] shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <Badge tone="green" className="mt-5">
              <LockKeyhole className="h-3 w-3" />
              Secure Harvest Place callback
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
              Opening your farm discovery account
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-[#5F6A62]">
              {message}
            </p>

            <div className="mt-6 grid gap-3 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4 text-left">
              <CallbackStep
                icon={<ShieldCheck className="h-4 w-4" />}
                text="Checking your secure Supabase session"
              />

              <CallbackStep
                icon={<Sprout className="h-4 w-4" />}
                text="Preparing farm discovery tools and harvest alerts"
              />

              <CallbackStep
                icon={<CheckCircle2 className="h-4 w-4" />}
                text="Keeping produce requests safely inside the platform"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-[#F0D6A7] bg-[#FFF3D9] px-4 py-3">
              <p className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#8B5D18]">
                <Leaf className="h-3.5 w-3.5" />
                Farm-first discovery
              </p>
              <p className="mt-1 text-xs font-bold leading-6 text-[#5F6A62]">
                Please do not close this page while your secure session is being completed.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function CallbackStep({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-[#5F6A62]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#2D6741] shadow-sm">
        {icon}
      </span>

      {text}
    </div>
  );
}
