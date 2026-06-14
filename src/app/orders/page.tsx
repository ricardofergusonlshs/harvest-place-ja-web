'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Headphones,
  PackageCheck,
  RefreshCcw,
  ShoppingBag,
} from 'lucide-react';

import { Badge, Button, Card, EmptyState, LoadingState, StatusChip, cn } from '@/components/ui';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchOrders } from '@/lib/services';
import { formatDate, formatJmd, shortIdLabel } from '@/lib/format';
import type { FarmOrder } from '@/lib/types';

type LiveOrder = FarmOrder & {
  order_status?: string | null;
  delivery_status?: string | null;
  status?: string | null;
  fulfillment_type?: string | null;
  delivery_method?: string | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  total?: number | null;
  total_amount?: number | null;
  grand_total?: number | null;
};

const REFRESH_EVERY_MS = 4000;

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setError('');
      const rows = await fetchOrders();
      setOrders(rows as LiveOrder[]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Live orders failed to load:', err);
      setError(err instanceof Error ? err.message : 'Could not load live orders from Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    void loadOrders();

    const timer = window.setInterval(() => {
      void loadOrders();
    }, REFRESH_EVERY_MS);

    return () => window.clearInterval(timer);
  }, [authLoading, loadOrders]);

  const activeOrders = useMemo(
    () => orders.filter((order) => !isClosedStatus(getOrderStatus(order))),
    [orders],
  );

  const readyOrders = useMemo(
    () => activeOrders.filter((order) => isReadyStatus(getOrderStatus(order))),
    [activeOrders],
  );

  async function refreshNow() {
    setRefreshing(true);
    await loadOrders();
  }

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#FAF8F0] px-4 py-12 text-[#183B28] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            title="Sign in to track your orders live"
            subtitle="View pending, ready, pickup, delivery, and completed orders from the same Supabase account."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button href="/auth?redirect=/orders">Sign in</Button>
                <Button href="/my-box" variant="secondary">
                  View My Box
                </Button>
              </div>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F0] text-[#183B28]">
      <section className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-10">
        <section className="rounded-[2rem] bg-[#183B28] p-6 text-white shadow-[0_25px_80px_rgba(24,59,40,0.22)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone="gold">
                <Bell className="h-3 w-3" />
                Live Supabase status
              </Badge>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                My Orders Live
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/75 sm:text-base">
                Track pending, preparing, ready, pickup, delivery, and completed orders. This page refreshes from Supabase every 4 seconds.
              </p>

              <p className="mt-3 text-xs font-bold text-white/60">
                {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for update'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat label="Active orders" value={activeOrders.length} />
              <HeroStat label="Ready now" value={readyOrders.length} />
              <HeroStat label="Total orders" value={orders.length} />
            </div>
          </div>

          <button
            type="button"
            onClick={refreshNow}
            disabled={refreshing}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-[#EAF5E7] disabled:opacity-60"
          >
            <RefreshCcw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh now
          </button>
        </section>

        {error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-5">
          {orders.length ? (
            orders.map((order) => <LiveOrderCard key={String(order.id)} order={order} />)
          ) : (
            <EmptyOrders />
          )}
        </section>

        <Card className="mt-6 rounded-[2rem] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
          <h2 className="text-xl font-black text-[#183B28]">Live order notes</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoLine icon={<PackageCheck className="h-5 w-5" />} text="Reads from Supabase orders" />
            <InfoLine icon={<Clock className="h-5 w-5" />} text="Refreshes every 4 seconds" />
            <InfoLine icon={<Headphones className="h-5 w-5" />} text="Support sees the same order status" />
          </div>
        </Card>
      </section>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 text-center">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#DFA75A]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function EmptyOrders() {
  return (
    <Card className="rounded-[2rem] border border-dashed border-[#D8E5D4] bg-white p-10 text-center shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
      <ShoppingBag className="mx-auto h-12 w-12 text-[#2D6741]" />
      <h2 className="mt-5 text-2xl font-black text-[#183B28]">No orders yet</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-[#5F6A62]">
        Checkout from My Box and your live order status will appear here.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button href="/my-box">Go to My Box</Button>
        <Button href="/shop" variant="secondary">
          Shop Produce
        </Button>
      </div>
    </Card>
  );
}

function LiveOrderCard({ order }: { order: LiveOrder }) {
  const status = getOrderStatus(order);
  const ready = isReadyStatus(status);
  const total = getOrderTotal(order);

  return (
    <Card
      className={cn(
        'rounded-[2rem] border bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]',
        ready ? 'border-[#2D6741]/50 ring-4 ring-[#2D6741]/10' : 'border-[#D8E5D4]',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[#183B28]">
              Order #HPJ-{shortIdLabel(String(order.id))}
            </h2>

            <StatusChip status={status} />

            {ready ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5E7] px-3 py-1 text-xs font-black text-[#2D6741]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ready now
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-xs font-bold text-[#5F6A62]">
            {formatDate(String(order.created_at || ''))} • {getFulfillmentLabel(order)}
          </p>
        </div>

        <div className="rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] px-5 py-3 text-right">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5F6A62]">
            Total
          </p>
          <p className="mt-1 text-xl font-black text-[#183B28]">
            {typeof total === 'number' ? formatJmd(total) : 'Pending'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        {['pending', 'preparing', 'ready', 'delivered'].map((step) => {
          const active = getStatusIndex(status) >= getStatusIndex(step);

          return (
            <div
              key={step}
              className={cn(
                'rounded-2xl border px-3 py-3 text-center text-xs font-black uppercase tracking-[0.12em]',
                active
                  ? 'border-[#2D6741] bg-[#2D6741] text-white'
                  : 'border-[#D8E5D4] bg-white text-[#5F6A62]',
              )}
            >
              {step}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button href={`/orders/${order.id}`}>View Full Order</Button>
        <Button href="/support" variant="secondary">
          Get Help
        </Button>
      </div>
    </Card>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F4F9F2] px-4 py-3 text-sm font-bold text-[#5F6A62]">
      <span className="text-[#2D6741]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function getOrderStatus(order: LiveOrder) {
  return String(order.order_status || order.delivery_status || order.status || 'pending')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function isReadyStatus(status: string) {
  const value = normalizeStatus(status);
  return value === 'ready' || value === 'ready_for_pickup' || value === 'out_for_delivery';
}

function isClosedStatus(status: string) {
  const value = normalizeStatus(status);

  return (
    value === 'delivered' ||
    value === 'completed' ||
    value === 'cancelled' ||
    value === 'canceled' ||
    value === 'rejected'
  );
}

function normalizeStatus(status: string) {
  return String(status).trim().toLowerCase().replace(/\s+/g, '_');
}

function getStatusIndex(status: string) {
  const value = normalizeStatus(status);

  if (value.includes('deliver') || value.includes('complete')) return 3;
  if (value.includes('ready') || value.includes('pickup') || value.includes('out_for_delivery')) return 2;
  if (value.includes('prepar') || value.includes('pack')) return 1;
  return 0;
}

function getOrderTotal(order: LiveOrder) {
  return (
    order.total_amount ??
    order.grand_total ??
    order.total ??
    Number(order.subtotal || 0) + Number(order.delivery_fee || 0)
  );
}

function getFulfillmentLabel(order: LiveOrder) {
  return String(order.fulfillment_type || order.delivery_method || 'pickup')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
