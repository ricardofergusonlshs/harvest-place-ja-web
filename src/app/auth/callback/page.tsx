import { Suspense, type ReactNode } from 'react';
import { Loader2, LockKeyhole, ShieldCheck, Sprout } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { AuthCallbackClient } from './auth-callback-client';

export const dynamic = 'force-dynamic';

function AuthCallbackFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <Card className="relative w-full overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-7 text-center shadow-[0_24px_80px_rgba(24,59,40,0.12)] sm:p-8">
          <div
            className="pointer-events-none absolute right-[-90px] top-[-90px] h-44 w-44 rounded-full bg-[#EAF5E7]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-[-90px] left-[-90px] h-44 w-44 rounded-full bg-[#FFF3D9]"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#EAF5E7] text-[#2D6741] shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <Badge tone="green" className="mt-5">
              <LockKeyhole className="h-3 w-3" />
              Secure platform sign in
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
              Finishing sign in
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-[#5F6A62]">
              Please wait while we securely prepare your Harvest Place Ja account for farm discovery, safe produce requests, and platform-only messages.
            </p>

            <div className="mt-6 grid gap-3 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4 text-left">
              <CallbackFallbackStep
                icon={<ShieldCheck className="h-4 w-4" />}
                text="Verifying your secure account link"
              />

              <CallbackFallbackStep
                icon={<Sprout className="h-4 w-4" />}
                text="Preparing your farm discovery dashboard"
              />
            </div>

            <p className="mt-5 text-xs font-bold leading-6 text-[#5F6A62]">
              Please do not close this page while your secure session is being completed.
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}

function CallbackFallbackStep({
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
      <span>{text}</span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackClient />
    </Suspense>
  );
}
