'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  SectionHeader,
  StatusChip,
  cn,
} from '@/components/ui';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchOrders } from '@/lib/services';
import { formatDateTime, formatJmd, shortIdLabel } from '@/lib/format';
import type { FarmOrder } from '@/lib/types';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<FarmOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadOrders(showRefreshState = false) {
    if (!user) return;

    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const rows = await fetchOrders();
      setOrders(rows);
    } catch {
      setOrders([]);
      setError('Your orders could not be loaded. Please refresh and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      if (authLoading) return;

      if (!user) {
        if (active) setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const rows = await fetchOrders();
        if (active) setOrders(rows);
      } catch {
        if (active) {
          setOrders([]);
          setError('Your orders could not be loaded. Please refresh and try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const totals = useMemo(() => {
    const deliveredWords = ['delivered', 'completed', 'complete', 'cancelled', 'canceled'];

    const activeOrders = orders.filter((order) => {
      const statusText = `${order.order_status || ''} ${order.status || ''} ${order.delivery_status || ''}`.toLowerCase();
      return !deliveredWords.some((word) => statusText.includes(word));
    });

    return {
      orders: orders.length,
      spent: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      active: activeOrders.length,
    };
  }, [orders]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-[1350px]">
          <LoadingState label="Loading your order tracker..." />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-5xl">
          <EmptyState
            title="Sign in to view orders"
            subtitle="Your order history and receipts are protected by your account."
            action={
              <Button href="/auth?redirect=/orders&next=/orders">
                Sign in
              </Button>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_44%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1350px] px-4 py-8 sm:px-6 lg:px-10">
        <OrdersHero
          totalOrders={totals.orders}
          activeOrders={totals.active}
          totalSpent={totals.spent}
        />

        <div className="mt-8">
          <SectionHeader
            eyebrow="Order tracker"
            title="Your farm orders"
            subtitle="Track payment, fulfillment, pickup or delivery, and item details in one polished dashboard."
            action={
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => loadOrders(true)}
                  disabled={refreshing}
                >
                  <RefreshCw className="h-4 w-4" />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>

                <Button href="/shop">
                  Shop fresh picks
                </Button>
              </div>
            }
          />
        </div>

        {error ? (
          <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
            {error}
          </div>
        ) : null}

        {!orders.length ? (
          <div className="mt-6">
            <EmptyState
              title="No orders yet"
              subtitle="When you place your first farm order, it will appear here with premium tracking."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Button href="/shop">Shop fresh picks</Button>
                  <Button href="/weekly-box" variant="secondary">
                    Build weekly box
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard
                icon={<ShoppingBag className="h-5 w-5" />}
                label="Total orders"
                value={String(totals.orders)}
              />

              <MetricCard
                icon={<Clock className="h-5 w-5" />}
                label="Active orders"
                value={String(totals.active)}
              />

              <MetricCard
                icon={<ShieldCheck className="h-5 w-5" />}
                label="Lifetime spend"
                value={formatJmd(totals.spent)}
              />
            </div>

            <div className="mt-6 grid gap-5">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function OrdersHero({
  totalOrders,
  activeOrders,
  totalSpent,
}: {
  totalOrders: number;
  activeOrders: number;
  totalSpent: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge tone="gold">
            <Truck className="h-3 w-3" />
            Farm order tracker
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Track every fresh order with confidence.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            View your order history, payment status, fulfillment progress, pickup or delivery details, and fresh market receipts.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
          <HeroStat label="Orders" value={totalOrders} />
          <HeroStat label="Active" value={activeOrders} />
          <HeroStat label="Spent" value={formatJmd(totalSpent)} />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.10)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-farm-primarySoft text-farm-primary">
        {icon}
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-farm-muted">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-farm-primaryDark">
        {value}
      </p>
    </Card>
  );
}

function OrderCard({ order }: { order: FarmOrder }) {
  const status = order.order_status || order.status || 'confirmed';
  const paymentStatus = order.payment_status || 'pending';
  const deliveryStatus = order.delivery_status || 'pending';
  const fulfillmentType = order.fulfillment_type || 'pickup';

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="group rounded-[30px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(24,59,40,0.12)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">Order #{shortIdLabel(order.id)}</Badge>
              <StatusChip status={status} />
              <StatusChip status={paymentStatus} />
              <StatusChip status={deliveryStatus} />
            </div>

            <h3 className="mt-3 text-2xl font-black tracking-[-0.035em] text-farm-primaryDark">
              {formatJmd(order.total || 0)}
            </h3>

            <p className="mt-1 text-sm font-bold text-farm-muted">
              {formatDateTime(order.created_at)} • {fulfillmentType}
              {order.scheduled_date ? ` • ${order.scheduled_date}` : ''}
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-farm-border bg-white px-4 py-2 text-sm font-black text-farm-primary transition group-hover:border-farm-primary/35 group-hover:bg-farm-primarySoft">
            View details
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>

        <OrderTimeline status={status} deliveryStatus={deliveryStatus} />
      </Card>
    </Link>
  );
}

function OrderTimeline({
  status,
  deliveryStatus,
}: {
  status?: string | null;
  deliveryStatus?: string | null;
}) {
  const text = `${status || ''} ${deliveryStatus || ''}`.toLowerCase();

  const current = text.includes('deliver') || text.includes('complete')
    ? 4
    : text.includes('out')
      ? 3
      : text.includes('transit') || text.includes('ship')
        ? 2
        : text.includes('pack') || text.includes('prepar')
          ? 1
          : 0;

  const steps = [
    { label: 'Confirmed', icon: CheckCircle2 },
    { label: 'Packed', icon: PackageCheck },
    { label: 'In transit', icon: Truck },
    { label: 'Out for delivery', icon: Truck },
    { label: 'Delivered', icon: CheckCircle2 },
  ];

  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const done = index <= current;

        return (
          <div
            key={step.label}
            className={cn(
              'rounded-2xl border p-3 text-center transition',
              done
                ? 'border-farm-primary/20 bg-farm-primarySoft text-farm-primaryDark'
                : 'border-farm-border bg-white text-farm-muted'
            )}
          >
            <Icon className="mx-auto h-4 w-4" />
            <p className="mt-2 text-[11px] font-black">{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}