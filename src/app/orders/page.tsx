'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Headphones,
  Mail,
  PackageCheck,
  Phone,
  RefreshCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  User,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  StatusChip,
  cn,
} from '@/components/ui';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDate, formatJmd, shortIdLabel } from '@/lib/format';

type OrderCustomer = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type LiveOrder = {
  id: string;
  customer_id: string | null;
  order_status?: string | null;
  fulfillment_type?: string | null;
  delivery_address?: string | null;
  delivery_status?: string | null;
  payment_status?: string | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  discount_amount?: number | null;
  total?: number | null;
  created_at?: string | null;
  customer?: OrderCustomer | null;
};

const REFRESH_EVERY_MS = 4000;

const STATUS_FILTERS = [
  'all',
  'pending',
  'preparing',
  'ready',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled',
];

const PAYMENT_FILTERS = [
  'all',
  'pending',
  'awaiting_bank_transfer',
  'paid',
  'failed',
  'refunded',
];

const FULFILLMENT_FILTERS = ['all', 'pickup', 'delivery'];

const DATE_FILTERS = [
  'all',
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'this_month',
  'custom',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'ready', label: 'Ready first' },
  { value: 'highest', label: 'Highest total' },
  { value: 'lowest', label: 'Lowest total' },
];

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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
      const rows = await fetchLiveOrdersWithCustomers();
      setOrders(rows);
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

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = [...orders];

    if (term) {
      list = list.filter((order) => orderSearchText(order).includes(term));
    }

    if (statusFilter !== 'all') {
      list = list.filter((order) => normalizeStatus(getOrderStatus(order)) === statusFilter);
    }

    if (paymentFilter !== 'all') {
      list = list.filter((order) => normalizeStatus(order.payment_status || 'pending') === paymentFilter);
    }

    if (fulfillmentFilter !== 'all') {
      list = list.filter((order) => normalizeStatus(getFulfillmentLabel(order)) === fulfillmentFilter);
    }

    if (dateFilter !== 'all') {
      list = list.filter((order) =>
        isInsideDateFilter(order.created_at, dateFilter, startDate, endDate),
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'oldest') return timeValue(a.created_at) - timeValue(b.created_at);
      if (sortBy === 'ready') return Number(isReadyStatus(getOrderStatus(b))) - Number(isReadyStatus(getOrderStatus(a)));
      if (sortBy === 'highest') return getOrderTotal(b) - getOrderTotal(a);
      if (sortBy === 'lowest') return getOrderTotal(a) - getOrderTotal(b);
      return timeValue(b.created_at) - timeValue(a.created_at);
    });

    return list;
  }, [orders, query, statusFilter, paymentFilter, fulfillmentFilter, dateFilter, startDate, endDate, sortBy]);

  async function refreshNow() {
    setRefreshing(true);
    await loadOrders();
  }

  function clearFilters() {
    setQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setFulfillmentFilter('all');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
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
                Live Supabase orders
              </Badge>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                My Orders Live
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/75 sm:text-base">
                Search by name, receipt number, email, phone, status, payment, pickup/delivery, or date.
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

        <Card className="mt-6 rounded-[2rem] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
          <div className="flex items-center gap-2 text-[#183B28]">
            <SlidersHorizontal className="h-5 w-5 text-[#2D6741]" />
            <h2 className="text-xl font-black">Search and filter orders</h2>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F6A62]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, phone, receipt..."
                className="w-full rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] py-4 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-[#2D6741]"
              />
            </label>

            <SelectBox value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} label="Status" />
            <SelectBox value={paymentFilter} onChange={setPaymentFilter} options={PAYMENT_FILTERS} label="Payment" />
            <SelectBox value={fulfillmentFilter} onChange={setFulfillmentFilter} options={FULFILLMENT_FILTERS} label="Method" />
            <SelectBox value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS} label="Date" />

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-4 text-sm font-black text-[#183B28] outline-none transition focus:border-[#2D6741]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {dateFilter === 'custom' ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2D6741]">
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-black text-[#183B28] outline-none focus:border-[#2D6741]"
                />
              </label>

              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#2D6741]">
                End date
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-black text-[#183B28] outline-none focus:border-[#2D6741]"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-[#5F6A62]">
              Showing <span className="text-[#183B28]">{filteredOrders.length}</span> of{' '}
              <span className="text-[#183B28]">{orders.length}</span> orders.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-[#D8E5D4] bg-white px-4 py-2 text-xs font-black text-[#183B28] transition hover:bg-[#F4F9F2]"
            >
              Clear filters
            </button>
          </div>
        </Card>

        {error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-5">
          {filteredOrders.length ? (
            filteredOrders.map((order) => <LiveOrderCard key={String(order.id)} order={order} />)
          ) : (
            <EmptyOrders hasOrders={orders.length > 0} />
          )}
        </section>

        <Card className="mt-6 rounded-[2rem] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
          <h2 className="text-xl font-black text-[#183B28]">Live order notes</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoLine icon={<PackageCheck className="h-5 w-5" />} text="Reads from Supabase orders and customers" />
            <InfoLine icon={<Clock className="h-5 w-5" />} text="Refreshes every 4 seconds" />
            <InfoLine icon={<Headphones className="h-5 w-5" />} text="Support sees the same order status" />
          </div>
        </Card>
      </section>
    </main>
  );
}

async function fetchLiveOrdersWithCustomers() {
  const supabase = getSupabaseBrowserClient();

  const { data: orderRows, error } = await supabase
    .from('orders')
    .select(
      'id, customer_id, order_status, fulfillment_type, delivery_address, delivery_status, payment_status, subtotal, delivery_fee, discount_amount, total, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(150);

  if (error) throw new Error(error.message);

  const orders = (orderRows || []) as LiveOrder[];
  const ids = Array.from(
    new Set(orders.map((order) => order.customer_id).filter(Boolean) as string[]),
  );

  if (!ids.length) return orders;

  const customerMap = new Map<string, OrderCustomer>();

  const { data: customersById } = await supabase
    .from('customers')
    .select('id, user_id, full_name, email, phone, address')
    .in('id', ids);

  ((customersById || []) as OrderCustomer[]).forEach((customer) => {
    customerMap.set(customer.id, customer);
    if (customer.user_id) customerMap.set(customer.user_id, customer);
  });

  const { data: customersByUserId } = await supabase
    .from('customers')
    .select('id, user_id, full_name, email, phone, address')
    .in('user_id', ids);

  ((customersByUserId || []) as OrderCustomer[]).forEach((customer) => {
    customerMap.set(customer.id, customer);
    if (customer.user_id) customerMap.set(customer.user_id, customer);
  });

  return orders.map((order) => ({
    ...order,
    customer: order.customer_id ? customerMap.get(order.customer_id) || null : null,
  }));
}

function LiveOrderCard({ order }: { order: LiveOrder }) {
  const status = getOrderStatus(order);
  const ready = isReadyStatus(status);
  const total = getOrderTotal(order);
  const customerName = customerDisplayName(order.customer);
  const customerEmail = order.customer?.email || 'No email saved';
  const customerPhone = order.customer?.phone || 'No phone saved';
  const fulfillment = getFulfillmentLabel(order);
  const paymentStatus = String(order.payment_status || 'pending');
  const deliveryAddress =
    order.delivery_address || order.customer?.address || 'No delivery address saved';

  return (
    <Card
      className={cn(
        'rounded-[2rem] border bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]',
        ready ? 'border-[#2D6741]/50 ring-4 ring-[#2D6741]/10' : 'border-[#D8E5D4]',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[#183B28]">
              Receipt #HPJ-{shortIdLabel(String(order.id))}
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
            {formatDate(String(order.created_at || ''))} • {fulfillment}
          </p>

          <div className="mt-4 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4">
            <p className="flex items-center gap-2 text-lg font-black text-[#183B28]">
              <User className="h-5 w-5 text-[#2D6741]" />
              {customerName}
            </p>

            <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-[#5F6A62]">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {customerEmail}
              </span>

              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {customerPhone}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoBox label="Payment" value={titleCase(paymentStatus)} />
              <InfoBox label="Pickup / Delivery" value={fulfillment} />
              <InfoBox
                label="Address"
                value={
                  fulfillment.toLowerCase().includes('delivery')
                    ? deliveryAddress
                    : 'Pickup order'
                }
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] px-5 py-3 text-right">
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

function SelectBox({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-4 text-sm font-black text-[#183B28] outline-none transition focus:border-[#2D6741]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option === 'all' ? `All ${label}` : titleCase(option)}
        </option>
      ))}
    </select>
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

function EmptyOrders({ hasOrders = false }: { hasOrders?: boolean }) {
  return (
    <Card className="rounded-[2rem] border border-dashed border-[#D8E5D4] bg-white p-10 text-center shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
      <ShoppingBag className="mx-auto h-12 w-12 text-[#2D6741]" />
      <h2 className="mt-5 text-2xl font-black text-[#183B28]">
        {hasOrders ? 'No matching orders found' : 'No orders yet'}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-[#5F6A62]">
        {hasOrders
          ? 'Try clearing filters or searching by a different name, phone, email, receipt number, or status.'
          : 'Checkout from My Box and your live order status will appear here.'}
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

function InfoLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F4F9F2] px-4 py-3 text-sm font-bold text-[#5F6A62]">
      <span className="text-[#2D6741]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#D8E5D4] bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2D6741]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-[#183B28]">{value}</p>
    </div>
  );
}

function customerDisplayName(customer?: OrderCustomer | null) {
  return customer?.full_name?.trim() || customer?.email?.trim() || 'Customer';
}

function orderSearchText(order: LiveOrder) {
  const receipt = `HPJ-${shortIdLabel(String(order.id))}`;
  const customer = order.customer;

  return [
    order.id,
    receipt,
    shortIdLabel(String(order.id)),
    customer?.full_name,
    customer?.email,
    customer?.phone,
    customer?.address,
    order.order_status,
    order.payment_status,
    order.fulfillment_type,
    order.delivery_address,
    order.delivery_status,
    String(order.total ?? ''),
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');
}

function getOrderStatus(order: LiveOrder) {
  return String(order.order_status || order.delivery_status || 'pending')
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
  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.delivery_fee || 0);
  const discount = Number(order.discount_amount || 0);

  return order.total ?? subtotal + deliveryFee - discount;
}

function getFulfillmentLabel(order: LiveOrder) {
  return String(order.fulfillment_type || 'pickup')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isInsideDateFilter(
  value: string | null | undefined,
  filter: string,
  startDate: string,
  endDate: string,
) {
  if (!value) return false;

  const orderDate = new Date(value);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (filter === 'today') return orderDate >= startOfToday && orderDate < startOfTomorrow;
  if (filter === 'yesterday') return orderDate >= startOfYesterday && orderDate < startOfToday;

  if (filter === 'last_7_days') {
    const date = new Date(now);
    date.setDate(now.getDate() - 7);
    return orderDate >= date;
  }

  if (filter === 'last_30_days') {
    const date = new Date(now);
    date.setDate(now.getDate() - 30);
    return orderDate >= date;
  }

  if (filter === 'this_month') return orderDate >= startOfMonth;

  if (filter === 'custom') {
    const customStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const customEnd = endDate ? new Date(`${endDate}T23:59:59`) : null;

    if (customStart && orderDate < customStart) return false;
    if (customEnd && orderDate > customEnd) return false;

    return true;
  }

  return true;
}

function timeValue(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
