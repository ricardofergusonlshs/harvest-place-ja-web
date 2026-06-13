'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock,
  RefreshCw,
  ShieldCheck,
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
  fetchFarmNotifications,
  markNotificationsRead,
} from '@/lib/services';
import { formatDateTime } from '@/lib/format';
import type { FarmNotification } from '@/lib/types';

type BrowserPermission = NotificationPermission | 'unsupported';

const offPlatformBlockedPhrases = [
  'call me',
  'text me',
  'whatsapp',
  'whats app',
  'send your number',
  'my number',
  'outside the app',
  'outside the website',
  'contact me directly',
  'message me directly',
  'dm me',
];

function containsOffPlatformContact(value: unknown) {
  const text = String(value ?? '').toLowerCase();
  const phonePattern = /(\+?\d[\d\s().-]{6,}\d)/;
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const linkPattern = /(https?:\/\/|www\.|\.com|\.net|\.org|\.co|wa\.me|instagram|facebook|tiktok|telegram)/i;
  const socialHandlePattern = /(^|\s)@[a-z0-9._-]{3,}/i;

  return (
    phonePattern.test(text) ||
    emailPattern.test(text) ||
    linkPattern.test(text) ||
    socialHandlePattern.test(text) ||
    offPlatformBlockedPhrases.some((phrase) => text.includes(phrase))
  );
}

function safeNotificationMessage(value: unknown) {
  const text = String(value ?? '').trim();

  if (!text) {
    return 'A new platform update is available in your Harvest Place Ja account.';
  }

  if (containsOffPlatformContact(text)) {
    return 'This notification was hidden because it may contain off-platform contact details. For safety, all produce requests, messages, and order discussions must stay inside The Harvest Place Ja.';
  }

  return text;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<FarmNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [permission, setPermission] = useState<BrowserPermission>('unsupported');

  const unreadCount = useMemo(() => {
    return items.filter((item) => !Boolean(item.read || item.is_read)).length;
  }, [items]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      if (authLoading) return;

      setError('');
      setMessage('');

      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const rows = await fetchFarmNotifications();
        if (!mounted) return;
        setItems(rows);
      } catch {
        if (!mounted) return;
        setError('Harvest alerts could not be loaded. Please refresh and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  async function refreshNotifications() {
    setRefreshing(true);
    setError('');
    setMessage('');

    try {
      const rows = await fetchFarmNotifications();
      setItems(rows);
      setMessage('Harvest alerts refreshed.');
    } catch {
      setError('Harvest alerts could not be refreshed.');
    } finally {
      setRefreshing(false);
    }
  }

  async function readAll() {
    setRefreshing(true);
    setError('');
    setMessage('');

    try {
      await markNotificationsRead();
      const rows = await fetchFarmNotifications();
      setItems(rows);
      setMessage('All notifications marked as read.');
    } catch {
      setError('Harvest alerts could not be marked as read.');
    } finally {
      setRefreshing(false);
    }
  }

  async function requestBrowserNotifications() {
    setError('');
    setMessage('');

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      setError('Browser notifications are not supported on this device or browser.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setMessage('Harvest alerts enabled successfully.');
      } else if (result === 'denied') {
        setError('Harvest alerts are blocked. You can enable them from your browser settings.');
      } else {
        setMessage('Harvest alerts were not enabled yet.');
      }
    } catch {
      setError('Browser alerts could not be enabled.');
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-5xl">
          <LoadingState label="Loading harvest alerts..." />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-5xl">
          <EmptyState
            title="Sign in to view harvest alerts"
            subtitle="Farm follows, harvest alerts, request replies, and platform messages are private to your account."
            action={
              <Button href="/auth?redirect=/notifications&next=/notifications">
                Sign in
              </Button>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <NotificationsHero unreadCount={unreadCount} totalCount={items.length} />

        <div className="mt-8">
          <SectionHeader
            eyebrow="Platform alerts"
            title="Harvest alerts & platform messages"
            subtitle="Farm updates, ready-soon harvest alerts, safe produce request replies, support messages, and account notices from The Harvest Place Ja."
            action={
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={requestBrowserNotifications}
                  variant="secondary"
                >
                  <BellRing className="h-4 w-4" />
                  {permission === 'granted' ? 'Alerts enabled' : 'Enable alerts'}
                </Button>

                <Button
                  onClick={refreshNotifications}
                  variant="secondary"
                  disabled={refreshing}
                >
                  <RefreshCw className="h-4 w-4" />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>

                {items.length ? (
                  <Button
                    onClick={readAll}
                    variant="secondary"
                    disabled={refreshing || unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark read
                  </Button>
                ) : null}
              </div>
            }
          />
        </div>

        {error ? (
          <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-3xl border border-[#2D6741]/15 bg-[#EAF5E7] px-5 py-4 text-sm font-black text-[#2D6741]">
            {message}
          </div>
        ) : null}

        {!items.length ? (
          <div className="mt-6">
            <EmptyState
              title="No harvest alerts yet"
              subtitle="Farm updates, ready-soon harvest alerts, safe request replies, and support messages will appear here."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {items.map((item) => (
              <NotificationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function NotificationsHero({
  unreadCount,
  totalCount,
}: {
  unreadCount: number;
  totalCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge tone="gold">
            <Bell className="h-3 w-3" />
            Farm discovery alerts
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Stay updated on farms you follow.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            Track harvest updates, ready-soon alerts, safe produce request replies, support messages, and important platform notices in one place.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[330px]">
          <div className="rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
              Unread
            </p>
            <p className="mt-2 text-4xl font-black">{unreadCount}</p>
          </div>

          <div className="rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
              Total
            </p>
            <p className="mt-2 text-4xl font-black">{totalCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotificationCard({ item }: { item: FarmNotification }) {
  const isRead = Boolean(item.read || item.is_read);

  return (
    <Card
      className={`rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.10)] ${
        isRead
          ? 'border-[#D8E5D4] bg-white'
          : 'border-[#2D6741]/30 bg-[#F4F9F2]'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
              isRead
                ? 'bg-[#EAF5E7] text-[#2D6741]'
                : 'bg-[#2D6741] text-white'
            }`}
          >
            {isRead ? (
              <CheckCheck className="h-5 w-5" />
            ) : (
              <BellRing className="h-5 w-5" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-[#183B28]">
                {String(item.title || 'Harvest Place Ja update')}
              </h2>

              {!isRead ? <Badge tone="gold">New</Badge> : null}
            </div>

            <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
              {safeNotificationMessage(item.message)}
            </p>

            {containsOffPlatformContact(item.message) ? (
              <p className="mt-3 rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] p-3 text-xs font-black leading-5 text-[#8B5D18]">
                Safety note: outside contact details are hidden. Keep all produce requests and messages inside the platform.
              </p>
            ) : null}

            <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#5F6A62]">
              <Clock className="h-3.5 w-3.5 text-[#2D6741]" />
              {formatDateTime(item.created_at)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusChip status={isRead ? 'read' : 'unread'} />
          <ShieldCheck className="h-4 w-4 text-[#2D6741]" />
        </div>
      </div>
    </Card>
  );
}
