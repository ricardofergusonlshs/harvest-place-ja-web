import type { ReactNode } from 'react';
import Link from 'next/link';
import { Gift, ShieldCheck, Sparkles, Users } from 'lucide-react';

import ReferEarnCard from '../../components/referrals/refer-earn-card';

export const metadata = {
  title: 'Refer & Earn | The Harvest Place Ja',
  description: 'Share The Harvest Place Ja with family and friends and earn reward points.',
};

export default function ReferEarnPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#183B28]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_80px_rgba(24,59,40,0.10)] sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#EAF5E7] blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#FFF3D9] blur-3xl" />

          <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#7A4F13]">
                <Gift className="h-3.5 w-3.5" />
                Refer & Earn
              </span>

              <h1 className="mt-5 max-w-3xl font-serif text-4xl font-black leading-[0.96] tracking-[-0.05em] text-[#183B28] sm:text-5xl lg:text-6xl">
                Earn points by sharing fresh local produce.
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62] sm:text-base">
                Share fresh local produce with family and friends. Earn points when they place their first order.
              </p>
            </div>

            <div className="rounded-3xl border border-[#D8E5D4] bg-[#F7FBF5] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
                Reward rule
              </p>
              <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#183B28]">
                Points after first order
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#5F6A62]">
                Clicks do not earn points. Rewards are awarded after a referred customer completes their first order.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <ReferEarnCard />
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <RuleCard
            icon={<Users className="h-5 w-5" />}
            title="Share your link"
            text="Copy your referral link or share it directly with family and friends."
          />
          <RuleCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Friend orders"
            text="Your friend signs up using your link and places their first completed order."
          />
          <RuleCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Points protected"
            text="No self-referrals, no click-only points, and one reward per new customer."
          />
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#2D6741] px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#183B28]"
          >
            Shop produce
          </Link>

          <Link
            href="/account"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D8E5D4] bg-white px-6 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-[#F4F9F2]"
          >
            Open account
          </Link>
        </div>
      </section>
    </main>
  );
}

function RuleCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </div>
      <h2 className="mt-4 text-xl font-black text-[#183B28]">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">{text}</p>
    </article>
  );
}
