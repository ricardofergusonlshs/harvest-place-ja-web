import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  PackageCheck,
  Route,
  ServerCog,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { Badge, Card, SectionHeader } from '@/components/ui';

type AuditItem = {
  title: string;
  copy: string;
  status: 'critical' | 'required' | 'recommended';
  icon: LucideIcon;
};

const auditItems: AuditItem[] = [
  {
    title: 'Environment variables',
    copy: 'Supabase URL and anon key should live in .env.local. Service-role keys must never be exposed in browser code, client components, or public repositories.',
    status: 'critical',
    icon: KeyRound,
  },
  {
    title: 'RLS policies',
    copy: 'Customer, admin, farmer, support, review, notification, order, payout, and profile policies should be enforced server-side in Supabase.',
    status: 'critical',
    icon: LockKeyhole,
  },
  {
    title: 'Protected admin RPCs',
    copy: 'Functions such as admin_update_product, admin_upsert_coupon, and admin_fetch_audit_logs should validate admin access inside SQL before returning or changing data.',
    status: 'critical',
    icon: ServerCog,
  },
  {
    title: 'Checkout integrity',
    copy: 'secure_checkout and secure_checkout_with_coupon should validate stock, product status, prices, coupons, customer identity, and order totals before creating an order.',
    status: 'critical',
    icon: PackageCheck,
  },
  {
    title: 'Storage bucket',
    copy: 'The product-images bucket should allow intended public reads while restricting uploads and updates to approved admins or verified farmers.',
    status: 'required',
    icon: UploadCloud,
  },
  {
    title: 'Auth redirects',
    copy: 'Register deployed /auth/callback and /reset-password URLs in Supabase Auth settings for local development and production domains.',
    status: 'required',
    icon: Route,
  },
  {
    title: 'Order access',
    copy: 'Customers should only read their own orders, order items, notifications, support tickets, subscriptions, and saved profile information.',
    status: 'critical',
    icon: Database,
  },
  {
    title: 'Launch review',
    copy: 'Before production release, test sign-up, login, magic links, password reset, checkout, order detail loading, admin routes, and farmer approval workflows.',
    status: 'recommended',
    icon: FileCheck2,
  },
];

const launchChecks = [
  'Supabase Auth callback URL is registered',
  'Reset password URL is registered',
  'RLS is enabled on protected tables',
  'Admin RPCs validate admin role in SQL',
  'Checkout RPC returns the created order ID',
  'Customers cannot read another customer order',
  'Farmers cannot approve their own products',
  'Product image uploads are role-restricted',
] as const;

export default function SecurityAuditPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <SecurityHero />

        <div className="mt-8">
          <SectionHeader
            eyebrow="Security"
            title="Security audit"
            subtitle="Launch checklist for Supabase Auth, RLS, storage, admin RPCs, checkout validation, and production web deployment."
          />
        </div>

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <SummaryCard
            icon={ShieldCheck}
            title="Protect access"
            text="Keep customer, farmer, and admin routes backed by Supabase Auth and RLS policies."
          />

          <SummaryCard
            icon={ServerCog}
            title="Validate server-side"
            text="Sensitive actions should be checked in SQL functions, policies, and database rules."
          />

          <SummaryCard
            icon={CheckCircle2}
            title="Test before launch"
            text="Confirm checkout, auth redirects, admin actions, and order access before going public."
          />
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {auditItems.map((item) => (
            <AuditCard key={item.title} item={item} />
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
            <Badge tone="gold">
              <FileCheck2 className="h-3 w-3" />
              Launch checklist
            </Badge>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
              Must-check items before production
            </h2>

            <div className="mt-6 grid gap-3">
              {launchChecks.map((check) => (
                <div
                  key={check}
                  className="flex items-center gap-3 rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-black text-[#183B28]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2D6741] text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {check}
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_24px_70px_rgba(24,59,40,0.16)] sm:p-8">
            <Badge tone="gold">
              <AlertTriangle className="h-3 w-3" />
              Important warning
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
              Frontend checks are not enough.
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/76">
              Buttons, hidden pages, and client-side route guards improve the user experience, but they do not secure the database by themselves. Sensitive actions must be protected by Supabase Auth, RLS policies, RPC validation, and role checks.
            </p>

            <div className="mt-6 grid gap-3">
              <SecurityLine text="Never expose service-role keys in client code." />
              <SecurityLine text="Never trust prices, stock, coupons, or totals sent from the browser." />
              <SecurityLine text="Never rely only on hidden admin links to protect admin data." />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/trust-center"
                className="inline-flex items-center justify-center rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-white"
              >
                Trust Center
              </Link>

              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
              >
                Contact support
              </Link>
            </div>
          </Card>
        </section>

        <Card className="mt-8 rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
          <div className="rounded-[24px] border border-[#DFA75A]/35 bg-[#FFF3D9] p-5">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#8B5D18]">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#183B28]">
                  Final production note
                </h2>

                <p className="mt-2 text-sm font-semibold leading-7 text-[#5F6A62]">
                  This page is a launch checklist. It does not prove the app is secure by itself. Before public release, test each Supabase policy, RPC, storage rule, and protected route using customer, farmer, admin, and signed-out accounts.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function SecurityHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge tone="gold">
            <ShieldCheck className="h-3 w-3" />
            Security readiness
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Secure the marketplace before launch.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            Review Supabase Auth, RLS, protected RPCs, storage rules, checkout validation, and deployment redirects before customers begin ordering.
          </p>
        </div>

        <div className="rounded-3xl border border-white/12 bg-white/10 p-5 text-white backdrop-blur lg:max-w-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#DFA75A]">
            Priority
          </p>

          <p className="mt-3 text-2xl font-black tracking-[-0.035em]">
            High before launch
          </p>

          <p className="mt-3 text-sm font-semibold leading-6 text-white/74">
            Complete these checks before accepting real customer orders or farmer submissions.
          </p>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        <Icon className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-xl font-black text-[#183B28]">
        {title}
      </h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
        {text}
      </p>
    </Card>
  );
}

function AuditCard({ item }: { item: AuditItem }) {
  const Icon = item.icon;

  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.10)]">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <Badge tone={item.status === 'critical' ? 'red' : item.status === 'required' ? 'gold' : 'green'}>
            {item.status === 'critical'
              ? 'Critical'
              : item.status === 'required'
                ? 'Required'
                : 'Recommended'}
          </Badge>

          <h2 className="mt-3 text-xl font-black tracking-[-0.035em] text-[#183B28]">
            {item.title}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-7 text-[#5F6A62]">
            {item.copy}
          </p>
        </div>
      </div>
    </Card>
  );
}

function SecurityLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 p-4 text-sm font-semibold leading-6 text-white/78">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FFF3D9] text-[#183B28]">
        <LockKeyhole className="h-4 w-4" />
      </span>
      {text}
    </div>
  );
}