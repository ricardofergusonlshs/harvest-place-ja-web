'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Gift,
  Leaf,
  Share2,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { APP_NAME } from '@/lib/config';

export default function InvitePage() {
  const [origin, setOrigin] = useState('');
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const inviteText = useMemo(() => {
    return `I found a fresh local farm market app you may like: ${APP_NAME}. Browse fresh produce, build your weekly box, and track farm orders here: ${origin}`;
  }, [origin]);

  async function copyInvite() {
    setMessage('');

    try {
      await navigator.clipboard.writeText(inviteText);
      setMessage('Invite message copied to your clipboard.');
    } catch {
      setMessage('Copy failed. You can manually copy the invite link from your browser.');
    }
  }

  async function share() {
    setSharing(true);
    setMessage('');

    try {
      if (navigator.share) {
        await navigator.share({
          title: APP_NAME,
          text: inviteText,
          url: origin,
        });

        setMessage('Invite shared successfully.');
        return;
      }

      await copyInvite();
    } catch {
      setMessage('Sharing was cancelled or could not be completed.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_48%,#FFFEFC_100%)] px-4 py-8 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Invite"
          title="Share The Harvest Place Ja"
          subtitle="Invite customers, farmers, family, and friends to browse fresh local produce, build weekly boxes, and track farm orders."
        />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <Card className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:p-8">
            <div className="absolute right-[-80px] top-[-80px] h-64 w-64 rounded-full bg-[#2D6741] opacity-60 blur-3xl" />
            <div className="absolute bottom-[-90px] left-[-80px] h-64 w-64 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

            <div className="relative z-10">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#FFF3D9] text-[#183B28] shadow-lg">
                <Share2 className="h-8 w-8" />
              </div>

              <Badge tone="gold" className="mt-6">
                Fresh market invite
              </Badge>

              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                Help more people find fresh local food.
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
                Share the market with shoppers who want fresh produce, farmers who want more visibility, and families who want easier weekly shopping.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button onClick={share} disabled={sharing}>
                  {sharing ? 'Opening share...' : 'Share invite link'}
                </Button>

                <button
                  type="button"
                  onClick={copyInvite}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
                >
                  <Copy className="h-4 w-4" />
                  Copy message
                </button>
              </div>

              {message ? (
                <div className="mt-5 rounded-2xl border border-white/16 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur">
                  {message}
                </div>
              ) : null}
            </div>
          </Card>

          <div className="grid gap-4">
            <InviteBenefit
              icon={<Leaf className="h-5 w-5" />}
              title="For shoppers"
              text="Invite people to shop fresh vegetables, roots, herbs, fruits, and weekly boxes."
            />

            <InviteBenefit
              icon={<Users className="h-5 w-5" />}
              title="For farmers"
              text="Help local growers connect with customers and promote their fresh produce."
            />

            <InviteBenefit
              icon={<Gift className="h-5 w-5" />}
              title="For families"
              text="Make it easier for households to discover local food and reorder their favorites."
            />

            <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
              <Badge tone="green">Invite link</Badge>

              <div className="mt-4 rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3">
                <p className="break-all text-sm font-bold leading-6 text-[#183B28]">
                  {origin || 'Loading invite link...'}
                </p>
              </div>

              <button
                type="button"
                onClick={copyInvite}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.22)] transition hover:bg-[#183B28]"
              >
                <Copy className="h-4 w-4" />
                Copy invite
              </button>
            </Card>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard
            icon={<Smartphone className="h-5 w-5" />}
            title="Install on phone"
            text="On mobile browsers, open the browser menu and choose Add to Home Screen or Install App if available."
          />

          <InfoCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Share anywhere"
            text="Send the link by WhatsApp, email, text message, social media, or customer groups."
          />

          <InfoCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Easy access"
            text="Customers can browse, build their box, checkout, and track their orders from the web app."
          />
        </section>

        <Card className="mt-8 rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge tone="gold">Suggested message</Badge>

              <p className="mt-4 rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] p-4 text-sm font-semibold leading-7 text-[#5F6A62]">
                {inviteText || `I found a fresh local farm market app you may like: ${APP_NAME}.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                type="button"
                onClick={copyInvite}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#183B28] transition hover:border-[#2D6741]/35 hover:bg-[#F4F9F2]"
              >
                <Copy className="h-4 w-4" />
                Copy text
              </button>

              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.22)] transition hover:bg-[#183B28]"
              >
                View market
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function InviteBenefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="flex gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-black text-[#183B28]">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">{text}</p>
        </div>
      </div>
    </Card>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </div>

      <h3 className="mt-4 text-xl font-black text-[#183B28]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">{text}</p>
    </div>
  );
}