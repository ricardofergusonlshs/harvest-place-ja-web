'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Gift,
  Loader2,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';

import {
  getReferralSummary,
  PLAY_STORE_URL,
  type ReferralSummary,
} from '../../lib/referrals';

type ReferEarnCardProps = {
  compact?: boolean;
  className?: string;
};

const FRIENDLY_COPY =
  'Share fresh local produce with family and friends. Earn points when they place their first order.';

export default function ReferEarnCard({
  compact = false,
  className = '',
}: ReferEarnCardProps) {
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadReferral() {
      setLoading(true);
      setMessage('');

      try {
        const data = await getReferralSummary();

        if (!alive) return;

        setSummary(data);
      } catch (error) {
        if (!alive) return;

        setSummary(null);
        setMessage(
          error instanceof Error
            ? error.message
            : 'Could not load your referral code.',
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadReferral();

    return () => {
      alive = false;
    };
  }, []);

  const shareText = useMemo(() => {
    if (!summary) return FRIENDLY_COPY;

    return `${FRIENDLY_COPY}\n\nJoin The Harvest Place Ja here:\n${summary.referral_link}`;
  }, [summary]);

  async function copyLink() {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary.referral_link);
      setMessage('Referral link copied.');
    } catch {
      setMessage('Copy failed. Please highlight and copy the link manually.');
    }
  }

  async function shareLink() {
    if (!summary) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The Harvest Place Ja',
          text: FRIENDLY_COPY,
          url: summary.referral_link,
        });

        setMessage('Share sheet opened.');
        return;
      } catch {
        // User may cancel the share sheet. Fall back to copy.
      }
    }

    await copyLink();
  }

  async function shareAndroidApp() {
    const text = summary
      ? `${FRIENDLY_COPY}\n\nWebsite referral link:\n${summary.referral_link}\n\nAndroid app:\n${PLAY_STORE_URL}`
      : `Download The Harvest Place Ja Android app:\n${PLAY_STORE_URL}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The Harvest Place Ja Android App',
          text,
        });

        setMessage('App share sheet opened.');
        return;
      } catch {
        // User may cancel the share sheet. Fall back to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setMessage('Android app share text copied.');
    } catch {
      setMessage('Could not open sharing. Please copy the Play Store link manually.');
    }
  }

  const isDatabaseSetupMessage = message
    .toLowerCase()
    .includes('referral database setup needed');

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[2rem] border border-[#D8E5D4] bg-[#073F2A] text-white shadow-[0_24px_80px_rgba(7,63,42,0.16)]',
        compact ? 'p-5' : 'p-6 sm:p-8',
        className,
      ].join(' ')}
    >
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#2D6741]/70 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#DFA75A]/22 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#7A4F13]">
            <Gift className="h-3.5 w-3.5" />
            Refer & Earn
          </span>

          <h2 className="mt-4 font-serif text-3xl font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-4xl">
            Share with family and friends.
          </h2>

          <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-white/80">
            {FRIENDLY_COPY}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <RewardPill
              icon={<Users className="h-4 w-4" />}
              label="Tracked"
              text="Friend joins"
            />
            <RewardPill
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="100 pts"
              text="First order"
            />
            <RewardPill
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Protected"
              text="Once per friend"
            />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
          {loading ? (
            <div className="grid min-h-48 place-items-center text-white/78">
              <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin" />
                <p className="mt-3 text-sm font-black">
                  Preparing your referral link...
                </p>
              </div>
            </div>
          ) : summary ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
                    Your points
                  </p>
                  <p className="mt-1 text-4xl font-black tracking-[-0.05em]">
                    {summary.points.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                  <p className="text-xs font-black text-white/58">Code</p>
                  <p className="font-black text-[#FFF3D9]">
                    {summary.referral_code}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/12 bg-white/10 p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/56">
                  Your referral link
                </p>
                <p className="mt-2 break-all text-sm font-black leading-6 text-white">
                  {summary.referral_link}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#FFF3D9] px-4 text-sm font-black text-[#183B28] transition hover:bg-white"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>

                <button
                  type="button"
                  onClick={shareLink}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/18"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>

                <button
                  type="button"
                  onClick={shareAndroidApp}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/18"
                >
                  <Smartphone className="h-4 w-4" />
                  App
                </button>
              </div>

              <div className="mt-5 grid gap-2 rounded-2xl bg-white/8 p-3 text-xs font-bold leading-5 text-white/70">
                <p>Friends joined: {summary.referred_join_count.toLocaleString()}</p>
                <p>
                  First-order rewards:{' '}
                  {summary.referred_order_count.toLocaleString()}
                </p>
                <p>Lifetime points: {summary.lifetime_points.toLocaleString()}</p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-white/12 bg-white/10 p-5">
              <p className="text-sm font-bold leading-6 text-white/78">
                Sign in to create your referral link and start earning points.
              </p>

              <Link
                href="/auth?redirect=/account"
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-[#FFF3D9] px-5 text-sm font-black text-[#183B28]"
              >
                Sign in
              </Link>
            </div>
          )}

          {message ? (
            <div
              className={[
                'mt-4 rounded-2xl px-4 py-3 text-sm font-bold leading-6',
                isDatabaseSetupMessage
                  ? 'border border-[#DFA75A]/35 bg-[#FFF3D9] text-[#7A4F13]'
                  : 'bg-white/10 text-[#FFF3D9]',
              ].join(' ')}
            >
              <p>{message}</p>

              {isDatabaseSetupMessage ? (
                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em]">
                  Run the referral SQL fix in Supabase.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RewardPill({
  icon,
  label,
  text,
}: {
  icon: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 p-3">
      <div className="flex items-center gap-2 text-[#FFF3D9]">
        {icon}
        <span className="text-sm font-black">{label}</span>
      </div>
      <p className="mt-1 text-xs font-bold text-white/62">{text}</p>
    </div>
  );
}
