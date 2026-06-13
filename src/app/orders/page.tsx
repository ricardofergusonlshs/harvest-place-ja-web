'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  PackageCheck,
  RefreshCcw,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchOrders } from '@/lib/services';
import type { FarmOrder } from '@/lib/types';

type OrderItemLike = {
  id?: string;
  product_id?: string | null;
  product_name?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  line_total?: number | string | null;
};

type OrderWithItems = FarmOrder & {
  order_items?: OrderItemLike[] | null;
  created_at?: string | null;
  id: string;
  order_status?: string | null;
  status?: string | null;
  fulfillment_type?: string | null;
  subtotal?: number | string | null;
  delivery_fee?: number | string | null;
  discount_amount?: number | string | null;
  total?: number | string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  delivery_status?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  delivery_address?: string | null;
  delivery_zone?: string | null;
};

function toNumber(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatJmdLocal(value: unknown) {
  return new Intl.NumberFormat('en-JM', {
    style: 'currency',
    currency: 'JMD',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDateLocal(value?: string | null) {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not set';
  return new Intl.DateTimeFormat('en-JM', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function shortOrderId(id?: string | null) {
  return String(id || '').slice(0, 8).toUpperCase();
}

function cleanLabel(value?: string | null, fallback = 'Pending') {
  const text = String(value || '').trim();
  if (!text) return fallback;
  return text
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function orderStatus(order: OrderWithItems) {
  return order.delivery_status || order.order_status || order.status || 'pending';
}

function statusStyle(status?: string | null) {
  const value = String(status || '').toLowerCase();

  if (value.includes('deliver') || value.includes('complete') || value.includes('paid')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (value.includes('ready') || value.includes('pack') || value.includes('confirm')) {
    return 'border-[#D8E5D4] bg-[#EAF5E7] text-[#2D6741]';
  }

  if (value.includes('cancel') || value.includes('fail') || value.includes('refund')) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-[#F0D6A7] bg-[#FFF3D9] text-[#8A5A12]';
}

function orderTotal(order: OrderWithItems) {
  const total = toNumber(order.total);
  if (total > 0) return total;
  return Math.max(
    0,
    toNumber(order.subtotal) + toNumber(order.delivery_fee) - toNumber(order.discount_amount),
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadOrders = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const rows = (await fetchOrders()) as OrderWithItems[];
      setOrders(rows || []);
    } catch (error) {
      console.error('Failed to load orders', error);
      setOrders([]);
      setMessage('Orders could not load. Check your Supabase order policies and customer link.');
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const summary = useMemo(() => {
    const active = orders.filter((order) => !String(orderStatus(order)).toLowerCase().includes('deliver')).length;
    const delivered = orders.filter((order) => String(orderStatus(order)).toLowerCase().includes('deliver')).length;
    const total = orders.reduce((sum, order) => sum + orderTotal(order), 0);
    return { active, delivered, total };
  }, [orders]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 text-[#183B28] sm:px-6 lg:px-10">
        <section className="mx-auto max-w-[1350px]">
          <div className="rounded-[32px] border border-[#D8E5D4] bg-white p-10 text-center shadow-[0_24px_80px_rgba(24,59,40,0.08)]">
            <RefreshCcw className="mx-auto h-9 w-9 animate-spin text-[#2D6741]" />
            <h1 className="mt-4 font-serif text-3xl font-black text-[#183B28]">Loading your orders...</h1>
            <p className="mt-2 text-sm font-semibold text-[#5F6A62]">Checking Supabase for your farm orders.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 text-[#183B28] sm:px-6 lg:px-10">
        <section className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-[#D8E5D4] bg-white p-10 text-center shadow-[0_24px_80px_rgba(24,59,40,0.08)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#EAF5E7] text-[#2D6741]">
              <PackageCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-5 font-serif text-4xl font-black tracking-[-0.04em] text-[#183B28]">Sign in to view orders</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-[#5F6A62]">
              Use the same account you use in the Harvest Place Ja Android app to see your order history, pickup, delivery, and payment status.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/auth?redirect=/orders" className="rounded-full bg-[#2D6741] px-6 py-3 text-sm font-black text-white shadow-[0_16px_35px_rgba(45,103,65,0.22)] transition hover:bg-[#183B28]">
                Sign in
              </Link>
              <Link href="/shop" className="rounded-full border border-[#D8E5D4] bg-white px-6 py-3 text-sm font-black text-[#183B28] transition hover:bg-[#F4F9F2]">
                Shop fresh picks
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-8 text-[#183B28] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-[1350px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8A5A12]">
              Order tracker
            </span>
            <h1 className="mt-4 font-serif text-4xl font-black tracking-[-0.05em] text-[#183B28] sm:text-5xl lg:text-6xl">
              Your farm orders
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#5F6A62] sm:text-base">
              Orders placed from the Android app and website will appear here when they are connected to the same Supabase customer account.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-[#F4F9F2]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
            <Link href="/shop" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white shadow-[0_16px_35px_rgba(45,103,65,0.22)] transition hover:bg-[#183B28]">
              <ShoppingBag className="h-4 w-4" />
              Shop fresh picks
            </Link>
          </div>
        </div>

        {message ? (
          <div className="mt-6 flex gap-3 rounded-3xl border border-[#F0D6A7] bg-[#FFF3D9] p-4 text-sm font-bold text-[#8A5A12]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{message}</p>
          </div>
        ) : null}

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <SummaryCard icon={PackageCheck} label="Total orders" value={orders.length} />
          <SummaryCard icon={Clock} label="Active orders" value={summary.active} />
          <SummaryCard icon={CreditCard} label="Order value" value={formatJmdLocal(summary.total)} />
        </div>

        {!orders.length ? (
          <div className="mt-7 rounded-[34px] border border-[#D8E5D4] bg-white p-10 text-center shadow-[0_24px_80px_rgba(24,59,40,0.08)] sm:p-14">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-[#EAF5E7] text-[#2D6741] shadow-[0_18px_45px_rgba(45,103,65,0.12)]">
              <PackageCheck className="h-10 w-10" />
            </div>
            <span className="mt-7 inline-flex rounded-full bg-[#EAF5E7] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#2D6741]">
              Fresh start
            </span>
            <h2 className="mt-4 font-serif text-3xl font-black tracking-[-0.04em] text-[#183B28]">No orders yet</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-7 text-[#5F6A62]">
              If you already ordered in the Android app, make sure you are signed in on the website with the same email used in the app.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/shop" className="rounded-full bg-[#2D6741] px-6 py-3 text-sm font-black text-white shadow-[0_16px_35px_rgba(45,103,65,0.22)] transition hover:bg-[#183B28]">
                Shop fresh picks
              </Link>
              <Link href="/my-box" className="rounded-full border border-[#D8E5D4] bg-white px-6 py-3 text-sm font-black text-[#183B28] transition hover:bg-[#F4F9F2]">
                Build weekly box
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-7 grid gap-5">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof PackageCheck; label: string; value: string | number }) {
  return (
    <div className="rounded-[26px] border border-[#D8E5D4] bg-white p-5 shadow-[0_16px_45px_rgba(24,59,40,0.06)]">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#DFA75A]">{label}</p>
          <p className="mt-1 text-2xl font-black text-[#183B28]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const status = orderStatus(order);
  const total = orderTotal(order);
  const items = Array.isArray(order.order_items) ? order.order_items : [];

  return (
    <article className="overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white shadow-[0_20px_60px_rgba(24,59,40,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(24,59,40,0.10)]">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#DFA75A]">Order #HPJ-{shortOrderId(order.id)}</p>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusStyle(status)}`}>
              {cleanLabel(status)}
            </span>
            {order.payment_status ? (
              <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusStyle(order.payment_status)}`}>
                {cleanLabel(order.payment_status)}
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 font-serif text-2xl font-black tracking-[-0.035em] text-[#183B28] sm:text-3xl">
            {formatJmdLocal(total)}
          </h2>

          <div className="mt-4 grid gap-3 text-sm font-semibold text-[#5F6A62] sm:grid-cols-2 lg:grid-cols-4">
            <InfoPill icon={CalendarDays} label="Placed" value={formatDateLocal(order.created_at)} />
            <InfoPill icon={Truck} label="Fulfillment" value={cleanLabel(order.fulfillment_type, 'Pickup / Delivery')} />
            <InfoPill icon={CreditCard} label="Payment" value={cleanLabel(order.payment_method || order.payment_status, 'Pending')} />
            <InfoPill icon={Clock} label="Schedule" value={order.scheduled_date ? `${order.scheduled_date}${order.scheduled_time ? ` • ${order.scheduled_time}` : ''}` : 'To be confirmed'} />
          </div>

          {items.length ? (
            <div className="mt-5 rounded-2xl border border-[#D8E5D4] bg-[#F8FAF2] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">Items</p>
              <div className="mt-3 grid gap-2">
                {items.slice(0, 4).map((item, index) => (
                  <div key={item.id || `${item.product_name}-${index}`} className="flex items-center justify-between gap-4 text-sm font-bold text-[#183B28]">
                    <span className="min-w-0 truncate">{item.product_name || 'Harvest item'} × {toNumber(item.quantity) || 1}</span>
                    <span className="shrink-0 text-[#5F6A62]">{formatJmdLocal(item.line_total || item.unit_price || 0)}</span>
                  </div>
                ))}
                {items.length > 4 ? <p className="text-xs font-bold text-[#5F6A62]">+{items.length - 4} more items</p> : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <Link href={`/orders/${order.id}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white shadow-[0_16px_35px_rgba(45,103,65,0.22)] transition hover:bg-[#183B28]">
            Track order
            <CheckCircle2 className="h-4 w-4" />
          </Link>
          <Link href="/support" className="inline-flex items-center justify-center rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-[#F4F9F2]">
            Need help?
          </Link>
        </div>
      </div>
    </article>
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#D8E5D4] bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[#2D6741]">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#5F6A62]">{value}</p>
    </div>
  );
}
