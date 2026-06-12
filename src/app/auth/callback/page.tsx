import { Suspense } from 'react';
import { Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { AuthCallbackClient } from './auth-callback-client';

export const dynamic = 'force-dynamic';

function AuthCallbackFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <Card className="w-full rounded-[34px] border border-[#D8E5D4] bg-white p-7 text-center shadow-[0_24px_80px_rgba(24,59,40,0.12)] sm:p-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#EAF5E7] text-[#2D6741]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>

          <Badge tone="green" className="mt-5">
            <LockKeyhole className="h-3 w-3" />
            Secure sign in
          </Badge>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
            Finishing sign in
          </h1>

          <p className="mt-3 text-sm font-semibold leading-7 text-[#5F6A62]">
            Please wait while we securely complete your Supabase session.
          </p>

          <div className="mt-6 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4">
            <div className="flex items-center justify-center gap-3 text-sm font-bold text-[#5F6A62]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#2D6741]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Verifying your secure account link
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackClient />
    </Suspense>
  );
}