import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  Database,
  FileCheck2,
  Fingerprint,
  Leaf,
  LockKeyhole,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Store,
  Truck,
  UserCheck,
} from 'lucide-react';
import { Badge, Card, SectionHeader } from '@/components/ui';

type TrustItem = {
  title: string;
  copy: string;
  icon: LucideIcon;
};

const trustItems: TrustItem[] = [
  {
    title: 'Freshness and origin records',
    copy: 'Traceability records can help customers understand where products come from, how they were handled, and when they were harvested.',
    icon: Sprout,
  },
  {
    title: 'Protected Supabase Auth sessions',
    copy: 'Customer, farmer, and admin access should be protected through Supabase Auth sessions and secure account workflows.',
    icon: LockKeyhole,
  },
  {
    title: 'RLS-backed customer, admin, and farmer data',
    copy: 'Sensitive marketplace data should remain protected behind Row Level Security policies and database-side permission rules.',
    icon: Database,
  },
  {
    title: 'Order confirmation and support records',
    copy: 'Order details, support tickets, admin replies, and customer messages help create a reliable post-purchase experience.',
    icon: ReceiptText,
  },
  {
    title: 'Verified farmer approval workflow',
    copy: 'Farmer profiles and product approvals help protect marketplace quality before products appear for shoppers.',
    icon: UserCheck,
  },
  {
    title: 'Secure checkout RPC stock validation',
    copy: 'Stock should be checked securely before checkout completes so customers receive accurate order confirmations.',
    icon: ShieldCheck,
  },
];

const pillars = [
  {
    title: 'Fresh market confidence',
    text: 'Customers can browse products, review farm details, build a box, and track order status.',
    icon: Leaf,
  },
  {
    title: 'Protected operations',
    text: 'Admin, farmer, product, order, and payout workflows should stay protected by approved roles.',
    icon: Fingerprint,
  },
  {
    title: 'Clear support path',
    text: 'Support tickets, order records, photos, and admin replies help resolve issues fairly.',
    icon: FileCheck2,
  },
] as const;

const workflowSteps = [
  'Customer shops fresh products',
  'Cart is reviewed before checkout',
  'Stock is checked securely',
  'Order status is tracked',
  'Support records stay available',
] as const;

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <TrustHero />

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <Card
                key={pillar.title}
                className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
                  <Icon className="h-5 w-5" />
                </div>

                <h2 className="mt-4 text-xl font-black tracking-[-0.035em] text-[#183B28]">
                  {pillar.title}
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
                  {pillar.text}
                </p>
              </Card>
            );
          })}
        </section>

        <div className="mt-8">
          <SectionHeader
            eyebrow="Trust"
            title="Trust Center"
            subtitle="Clear products, secure checkout, order tracking, support, farmer verification, and protected admin operations are built into the market."
          />
        </div>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          {trustItems.map((item) => (
            <TrustFeatureCard key={item.title} item={item} />
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
            <Badge tone="gold">
              <CheckCircle2 className="h-3 w-3" />
              Trusted workflow
            </Badge>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
              How the marketplace builds confidence
            </h2>

            <div className="mt-6 grid gap-3">
              {workflowSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-black text-[#183B28]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2D6741] text-xs font-black text-white">
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_24px_70px_rgba(24,59,40,0.16)] sm:p-8">
            <Badge tone="gold">
              <ShieldCheck className="h-3 w-3" />
              Security reminder
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
              Trust depends on strong database rules.
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/76">
              Frontend checks make the app easier to use, but sensitive actions should still be protected by Supabase Auth, Row Level Security, RPC validation, and role-based access.
            </p>

            <div className="mt-6 grid gap-3">
              <SecurityLine icon={LockKeyhole} text="Protect customer account data." />
              <SecurityLine icon={Store} text="Restrict farmer and admin tools to approved users." />
              <SecurityLine icon={PackageCheck} text="Validate stock and orders before checkout is completed." />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-white"
              >
                Shop fresh picks
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
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#183B28]">
                  Launch note
                </h2>

                <p className="mt-2 text-sm font-semibold leading-7 text-[#5F6A62]">
                  This page explains the trust features in the web app. Before public launch, confirm that Supabase RLS policies, admin permissions, farmer approval rules, storage access, and checkout RPC validation are fully tested.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function TrustHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge tone="gold">
            <ShieldCheck className="h-3 w-3" />
            Trust and safety
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Built for secure fresh-market shopping.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            The Harvest Place Ja combines product clarity, protected accounts, secure checkout, support records, and farmer verification into one trustworthy marketplace experience.
          </p>
        </div>

        <div className="rounded-3xl border border-white/12 bg-white/10 p-5 text-white backdrop-blur lg:max-w-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#DFA75A]">
            Trust focus
          </p>

          <p className="mt-3 text-2xl font-black tracking-[-0.035em]">
            Fresh, secure, traceable
          </p>

          <p className="mt-3 text-sm font-semibold leading-6 text-white/74">
            Customers can shop with more confidence when products, orders, support, and protected access work together.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustFeatureCard({ item }: { item: TrustItem }) {
  const Icon = item.icon;

  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.10)]">
      <Badge tone="gold">Trusted workflow</Badge>

      <div className="mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        <Icon className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-xl font-black tracking-[-0.035em] text-[#183B28]">
        {item.title}
      </h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
        {item.copy}
      </p>
    </Card>
  );
}

function SecurityLine({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 p-4 text-sm font-semibold leading-6 text-white/78">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFF3D9] text-[#183B28]">
        <Icon className="h-4 w-4" />
      </span>
      {text}
    </div>
  );
}