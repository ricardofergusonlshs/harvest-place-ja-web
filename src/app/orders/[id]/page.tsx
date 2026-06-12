'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
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
import { fetchOrderDetails } from '@/lib/services';
import { formatDateTime, formatJmd, shortIdLabel } from '@/lib/format';
import type { FarmOrder } from '@/lib/types';

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
          <section className="mx-auto max-w-6xl">
            <LoadingState label="Loading premium order tracker..." />
          </section>
        </main>
      }
    >
      <OrderDetailContent />
    </Suspense>
  );
}

function OrderDetailContent() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();

  const orderId = typeof params.id === 'string' ? params.id : '';
  const success = search.get('success') === 'true';

  const [order, setOrder] = useState<FarmOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadOrder(showRefreshState = false) {
    if (!orderId) {
      setLoading(false);
      setError('No order ID was found in the page address.');
      return;
    }

    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const row = await fetchOrderDetails(orderId);
      setOrder(row);
    } catch (err) {
      console.error('Order details failed to load:', err);
      setOrder(null);
      setError(
        'This order could not be loaded. It may not exist, or your account may not have permission to view it.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      if (!orderId) {
        if (active) {
          setLoading(false);
          setError('No order ID was found in the page address.');
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const row = await fetchOrderDetails(orderId);
        if (active) setOrder(row);
      } catch (err) {
        console.error('Order details failed to load:', err);

        if (active) {
          setOrder(null);
          setError(
            'This order could not be loaded. It may not exist, or your account may not have permission to view it.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-6xl">
          <LoadingState label="Loading premium order tracker..." />
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-5xl">
          {error ? (
            <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
              {error}
            </div>
          ) : null}

          <EmptyState
            title="Order not found"
            subtitle="This order could not be loaded. Check your account, refresh the page, or contact support."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => loadOrder(true)} variant="secondary">
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>

                <Button href="/orders">
                  Back to orders
                </Button>
              </div>
            }
          />
        </section>
      </main>
    );
  }

  const items = order.order_items || [];
  const status = order.order_status || order.status || 'confirmed';
  const paymentStatus = order.payment_status || 'pending';
  const deliveryStatus = order.delivery_status || 'pending';

  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_44%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1250px] px-4 py-8 sm:px-6 lg:px-10">
        {success ? (
          <div className="mb-6 rounded-3xl border border-[#2D6741]/20 bg-[#EAF5E7] p-4 text-sm font-black text-[#2D6741]">
            Order placed successfully. Your premium order tracker is ready.
          </div>
        ) : null}

        <OrderHero
          order={order}
          status={status}
          paymentStatus={paymentStatus}
          deliveryStatus={deliveryStatus}
          itemCount={itemCount}
        />

        <div className="mt-8">
          <SectionHeader
            eyebrow={`Order #${shortIdLabel(order.id)}`}
            title="Premium order tracker"
            subtitle="Follow payment, fulfillment, delivery, and farm item details from your order."
            action={
              <div className="flex flex-wrap gap-3">
                <Button href="/orders" variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Back to orders
                </Button>

                <Button
                  onClick={() => loadOrder(true)}
                  variant="secondary"
                  disabled={refreshing}
                >
                  <RefreshCw className="h-4 w-4" />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>

                <Button href="/support" variant="secondary">
                  Contact support
                </Button>
              </div>
            }
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_390px]">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
            <OrderTimeline status={status} deliveryStatus={deliveryStatus} />

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <Badge tone="green">Farm items</Badge>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
                    Order items
                  </h2>
                </div>

                <span className="rounded-full bg-[#EAF5E7] px-4 py-2 text-sm font-black text-[#2D6741]">
                  {itemCount} item{itemCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid gap-3">
                {items.length ? (
                  items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex flex-col gap-3 rounded-3xl border border-[#D8E5D4] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-black text-[#183B28]">
                          {item.product_name || 'Farm item'}
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#5F6A62]">
                          Qty {item.quantity}
                          {item.farm_name ? ` • ${item.farm_name}` : ''}
                        </p>
                      </div>

                      <p className="font-black text-[#183B28]">
                        {formatJmd(item.line_total || 0)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4 text-sm font-semibold text-[#5F6A62]">
                    Item details are not available yet.
                  </p>
                )}
              </div>
            </div>

            {order.notes ? (
              <div className="mt-6 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2D6741]">
                  Order notes
                </p>

                <pre className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#5F6A62]">
                  {order.notes}
                </pre>
              </div>
            ) : null}
          </Card>

          <aside className="space-y-5">
            <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
              <Badge tone="gold">
                <ReceiptText className="h-3 w-3" />
                Receipt
              </Badge>

              <div className="mt-5 grid gap-3 text-sm font-bold text-[#5F6A62]">
                <Row label="Created" value={formatDateTime(order.created_at)} />
                <Row label="Fulfillment" value={order.fulfillment_type || 'pickup'} />
                <Row
                  label="Scheduled"
                  value={`${order.scheduled_date || 'Not set'} ${order.scheduled_time || ''}`.trim()}
                />
                <Row label="Payment" value={order.payment_method || 'Not set'} />
                <Row label="Subtotal" value={formatJmd(order.subtotal || 0)} />
                <Row label="Delivery" value={formatJmd(order.delivery_fee || 0)} />
                <Row label="Discount" value={`-${formatJmd(order.discount_amount || 0)}`} />

                <div className="flex justify-between border-t border-[#D8E5D4] pt-3 text-xl font-black text-[#183B28]">
                  <span>Total</span>
                  <span>{formatJmd(order.total || 0)}</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
              <div className="grid gap-3">
                <StatusLine label="Order" status={status} />
                <StatusLine label="Payment" status={paymentStatus} />
                <StatusLine label="Delivery" status={deliveryStatus} />
              </div>
            </Card>

            <Card className="rounded-[28px] border border-[#D8E5D4] bg-[#183B28] p-5 text-white shadow-[0_18px_50px_rgba(24,59,40,0.10)]">
              <Badge tone="gold">
                <ShieldCheck className="h-3 w-3" />
                Support ready
              </Badge>

              <h3 className="mt-4 text-xl font-black">
                Need help with this order?
              </h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-white/76">
                Contact support with your order number and we will help you check payment, pickup, delivery, or item details.
              </p>

              <Link
                href="/support"
                className="mt-5 inline-flex rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-white"
              >
                Contact support
              </Link>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function OrderHero({
  order,
  status,
  paymentStatus,
  deliveryStatus,
  itemCount,
}: {
  order: FarmOrder;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  itemCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge tone="gold">
            <PackageCheck className="h-3 w-3" />
            Order #{shortIdLabel(order.id)}
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Your harvest order is being tracked.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            View your fresh item list, payment status, pickup or delivery details, and order progress in one place.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusChip status={status} />
            <StatusChip status={paymentStatus} />
            <StatusChip status={deliveryStatus} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
          <HeroStat label="Total" value={formatJmd(order.total || 0)} />
          <HeroStat label="Items" value={itemCount} />
          <HeroStat label="Created" value={formatDateTime(order.created_at)} wide />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | number;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur',
        wide ? 'sm:col-span-2' : ''
      )}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className="text-right text-[#183B28]">{value}</span>
    </div>
  );
}

function StatusLine({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#D8E5D4] bg-white p-3">
      <span className="text-sm font-black text-[#183B28]">{label}</span>
      <StatusChip status={status} />
    </div>
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

  const current =
    text.includes('deliver') || text.includes('complete')
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
    { label: 'Delivered', icon: Clock },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const done = index <= current;

        return (
          <div
            key={step.label}
            className={cn(
              'rounded-2xl border p-4 text-center transition',
              done
                ? 'border-[#2D6741]/20 bg-[#EAF5E7] text-[#183B28]'
                : 'border-[#D8E5D4] bg-white text-[#5F6A62]'
            )}
          >
            <Icon className="mx-auto h-5 w-5" />
            <p className="mt-2 text-xs font-black">{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}