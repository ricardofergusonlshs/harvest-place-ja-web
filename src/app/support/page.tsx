'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Mail,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  SectionHeader,
  StatusChip,
} from '@/components/ui';
import { useAuth } from '@/components/providers/auth-provider';
import {
  createSupportTicket,
  fetchMySupportTickets,
} from '@/lib/services';
import { formatDateTime } from '@/lib/format';
import type { SupportTicket } from '@/lib/types';

export default function SupportPage() {
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      if (authLoading) return;

      if (!user) {
        setTickets([]);
        return;
      }

      setLoadingTickets(true);
      setError('');

      try {
        const rows = await fetchMySupportTickets();

        if (!active) return;

        setTickets(rows || []);
      } catch {
        if (!active) return;

        setTickets([]);
        setError('Your support tickets could not be loaded right now.');
      } finally {
        if (active) setLoadingTickets(false);
      }
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  async function refreshTickets() {
    if (!user) return;

    setRefreshing(true);
    setError('');
    setNotice('');

    try {
      const rows = await fetchMySupportTickets();
      setTickets(rows || []);
      setNotice('Support tickets refreshed.');
    } catch {
      setError('Support tickets could not be refreshed.');
    } finally {
      setRefreshing(false);
    }
  }

  async function submit() {
    setNotice('');
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanEmail || !cleanSubject || !cleanMessage) {
      setError('Please complete your email, subject, and message.');
      return;
    }

    setSubmitting(true);

    try {
      await createSupportTicket({
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
      });

      setSubject('');
      setMessage('');
      setNotice('Support ticket created successfully.');

      if (user) {
        const rows = await fetchMySupportTickets();
        setTickets(rows || []);
      }
    } catch {
      setError('Support ticket could not be created. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <SupportHero />

        <div className="mt-8">
          <SectionHeader
            eyebrow="Support"
            title="How can we help?"
            subtitle="Ask about orders, delivery, products, weekly boxes, payments, farmer onboarding, or account access."
            action={
              user ? (
                <Button
                  onClick={refreshTickets}
                  variant="secondary"
                  disabled={refreshing}
                >
                  <RefreshCw className="h-4 w-4" />
                  {refreshing ? 'Refreshing...' : 'Refresh tickets'}
                </Button>
              ) : null
            }
          />
        </div>

        {error ? (
          <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="mt-5 rounded-3xl border border-[#2D6741]/20 bg-[#EAF5E7] px-5 py-4 text-sm font-black text-[#2D6741]">
            {notice}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
            <Badge tone="green">
              <MessageSquareText className="h-3 w-3" />
              Create ticket
            </Badge>

            <div className="mt-6 grid gap-4">
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                icon={<Mail className="h-5 w-5" />}
                placeholder="you@example.com"
              />

              <Field
                label="Subject"
                value={subject}
                onChange={setSubject}
                icon={<HelpCircle className="h-5 w-5" />}
                placeholder="Example: Delivery question"
              />

              <label className="grid gap-2 text-sm font-black text-[#183B28]">
                Message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us what happened or what you need help with..."
                  className="min-h-[150px] rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] p-4 text-sm font-bold leading-6 text-[#183B28] outline-none transition placeholder:text-[#5F6A62]/60 focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
                />
              </label>

              <Button onClick={submit} disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? 'Creating ticket...' : 'Create ticket'}
              </Button>
            </div>
          </Card>

          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone="gold">
                <Clock className="h-3 w-3" />
                Saved replies
              </Badge>

              <span className="rounded-full bg-[#EAF5E7] px-3 py-1 text-xs font-black text-[#2D6741]">
                {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {authLoading || loadingTickets ? (
                <LoadingState label="Loading support tickets..." />
              ) : tickets.length ? (
                tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))
              ) : (
                <EmptyState
                  title="No support tickets yet"
                  subtitle="Create one here and your replies will appear in this panel."
                />
              )}
            </div>
          </Card>
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <SupportInfo
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Account support"
            text="Get help with signing in, password recovery, account details, and order history."
          />

          <SupportInfo
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Order help"
            text="Ask about delivery, pickup, payment status, missing items, or refund review."
          />

          <SupportInfo
            icon={<Sparkles className="h-5 w-5" />}
            title="Market guidance"
            text="Ask about weekly boxes, Ready Soon alerts, farmer onboarding, or product availability."
          />
        </section>
      </section>
    </main>
  );
}

function SupportHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10">
        <Badge tone="gold">
          <MessageSquareText className="h-3 w-3" />
          Customer support
        </Badge>

        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
          Get help with your fresh market experience.
        </h1>

        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
          Send a support request about orders, delivery, payments, products, weekly boxes, account access, or farmer onboarding.
        </p>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#183B28]">
      {label}

      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6741]">
          {icon}
        </span>

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-[52px] w-full rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] px-4 py-3 pl-12 text-sm font-bold text-[#183B28] outline-none transition placeholder:text-[#5F6A62]/60 focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
        />
      </span>
    </label>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="rounded-3xl border border-[#D8E5D4] bg-[#FFFEFC] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#183B28]">
            {ticket.subject || 'Support ticket'}
          </p>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
            {ticket.message}
          </p>
        </div>

        <StatusChip status={ticket.status || 'open'} />
      </div>

      {ticket.admin_reply ? (
        <div className="mt-4 rounded-2xl border border-[#2D6741]/15 bg-[#EAF5E7] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2D6741]">
            Admin reply
          </p>

          <p className="mt-2 text-sm font-bold leading-6 text-[#2D6741]">
            {ticket.admin_reply}
          </p>
        </div>
      ) : null}

      <p className="mt-3 text-xs font-bold text-[#5F6A62]">
        {formatDateTime(ticket.created_at)}
      </p>
    </div>
  );
}

function SupportInfo({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-black text-[#183B28]">
        {title}
      </h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
        {text}
      </p>
    </Card>
  );
}