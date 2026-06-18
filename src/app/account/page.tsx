'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  ClipboardList,
  Gift,
  Headphones,
  LogOut,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  UserRound,
} from 'lucide-react';

import { Badge, Button, Card, EmptyState, LoadingState, StatusChip } from '@/components/ui';
import ReferEarnCard from '../../components/referrals/refer-earn-card';
import { useAuth } from '@/components/providers/auth-provider';
import {
  fetchCurrentCustomerProfile,
  fetchCustomerProductSubscriptions,
  fetchLoyaltySummary,
  fetchOrders,
  saveCurrentCustomerProfile,
} from '@/lib/services';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDate, formatJmd, safeEmailName, shortIdLabel } from '@/lib/format';
import type {
  CustomerProfile,
  CustomerProductSubscription,
  FarmOrder,
  LoyaltySummary,
} from '@/lib/types';

const SIGN_IN_HREF = '/auth?redirect=/account';
const CHECKOUT_NAME_KEY = 'hpj_checkout_customer_name';
const CHECKOUT_PHONE_KEY = 'hpj_checkout_customer_phone';
const CHECKOUT_ADDRESS_KEY = 'hpj_checkout_customer_address';

type AccountState = {
  profile: CustomerProfile | null;
  loyalty: LoyaltySummary;
  subs: CustomerProductSubscription[];
  orders: FarmOrder[];
};

const emptyState: AccountState = {
  profile: null,
  loyalty: { points: 0, lifetime_points: 0, tier: 'Seedling' },
  subs: [],
  orders: [],
};

function saveCheckoutIdentity(name: string, phone: string, address: string) {
  if (typeof window === 'undefined') return;

  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const cleanAddress = address.trim();

  if (cleanName) window.localStorage.setItem(CHECKOUT_NAME_KEY, cleanName);
  if (cleanPhone) window.localStorage.setItem(CHECKOUT_PHONE_KEY, cleanPhone);
  if (cleanAddress) window.localStorage.setItem(CHECKOUT_ADDRESS_KEY, cleanAddress);
}

export default function AccountPage() {
  const { user, loading: authLoading, isAdmin, farmerProfile, signOut } = useAuth();

  const [account, setAccount] = useState<AccountState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadAccount() {
      if (authLoading) return;

      if (!user) {
        setAccount(emptyState);
        setLoading(false);
        return;
      }

      setLoading(true);

      const [profile, loyalty, subs, orders] = await Promise.all([
        safeResolve(fetchCurrentCustomerProfile(), null),
        safeResolve(
          fetchLoyaltySummary(),
          { points: 0, lifetime_points: 0, tier: 'Seedling' } as LoyaltySummary,
        ),
        safeResolve(fetchCustomerProductSubscriptions(), [] as CustomerProductSubscription[]),
        safeResolve(fetchOrders(), [] as FarmOrder[]),
      ]);

      if (!alive) return;

      const fallbackName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        safeEmailName(user.email) ||
        '';

      const fallbackPhone =
        profile?.phone ||
        user.user_metadata?.phone ||
        user.user_metadata?.phone_number ||
        '';

      const fallbackAddress = profile?.address || user.user_metadata?.address || '';

      setAccount({ profile, loyalty, subs, orders });
      setName(fallbackName);
      setPhone(fallbackPhone);
      setAddress(fallbackAddress);
      saveCheckoutIdentity(fallbackName, fallbackPhone, fallbackAddress);
      setLoading(false);
    }

    void loadAccount();

    return () => {
      alive = false;
    };
  }, [authLoading, user]);

  const displayName = useMemo(
    () => name || account.profile?.full_name || safeEmailName(user?.email) || 'Harvest Customer',
    [name, account.profile?.full_name, user?.email],
  );

  const points = Number(account.loyalty.points || 0);
  const lifetimePoints = Number(account.loyalty.lifetime_points || 0);
  const tier = account.loyalty.tier || 'Seedling';
  const recentOrders = account.orders.slice(0, 3);

  async function saveProfile() {
    if (saving || !user) return;

    const cleanName = name.trim() || displayName;
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    setSaving(true);
    setMessage('Saving your profile...');

    try {
      await saveCurrentCustomerProfile({
        full_name: cleanName,
        phone: cleanPhone,
        address: cleanAddress,
      });

      saveCheckoutIdentity(cleanName, cleanPhone, cleanAddress);

      setAccount((current) => ({
        ...current,
        profile: {
          ...(current.profile || {}),
          full_name: cleanName,
          phone: cleanPhone,
          address: cleanAddress,
          email: user.email || current.profile?.email || '',
          user_id: user.id,
        } as CustomerProfile,
      }));

      try {
        const supabase = getSupabaseBrowserClient();

        await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
            name: cleanName,
            phone: cleanPhone,
            phone_number: cleanPhone,
            address: cleanAddress,
          },
        });
      } catch {
        // Auth metadata update is helpful but not required. Customer table + local checkout keys are enough.
      }

      setName(cleanName);
      setPhone(cleanPhone);
      setAddress(cleanAddress);
      setMessage('Profile saved successfully. Checkout will now use this name and phone automatically.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Profile could not be saved right now.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
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
        <div className="mx-auto max-w-4xl">
          <EmptyState
            title="Sign in to manage your Harvest Place account"
            subtitle="View your orders, manage fresh alerts, save delivery details, and get support."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button href={SIGN_IN_HREF}>Sign in</Button>
                <Button href="/shop" variant="secondary">
                  Continue shopping
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
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-[#D8E5D4] bg-white p-6 shadow-[0_22px_70px_rgba(24,59,40,0.08)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone={isAdmin ? 'gold' : 'green'}>
                {isAdmin ? 'Admin access' : farmerProfile?.verification_status || 'Customer account'}
              </Badge>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#183B28] sm:text-4xl">
                Welcome back, {displayName}
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62] sm:text-base">
                Manage your shopping, orders, fresh alerts, delivery details, rewards, and support in one simple place.
              </p>

              <p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#5F6A62]">
                <UserRound className="h-4 w-4 text-[#2D6741]" />
                {user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAdmin ? (
                <Button href="/admin" className="bg-[#DFA75A] text-[#183B28] hover:bg-[#F4C978]">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              ) : null}

              <Button href="/shop">Shop Produce</Button>
              <Button href="/my-box" variant="secondary">
                My Box
              </Button>
              <Button onClick={handleSignOut} variant="ghost">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </section>

        {isAdmin ? <AdminCommandCenter /> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <ActionCard href="/shop" title="Shop Produce" text="Browse fresh local items." icon={<Sprout className="h-5 w-5" />} />
          <ActionCard href="/my-box" title="My Box" text="Review selected items." icon={<ShoppingBag className="h-5 w-5" />} />
          <ActionCard href="/orders" title="Orders" text="Track your orders." icon={<PackageCheck className="h-5 w-5" />} />
          <ActionCard href="/ready-soon" title="Fresh Alerts" text="Manage ready-soon alerts." icon={<Bell className="h-5 w-5" />} />
          <ActionCard href="/support" title="Support" text="Get help quickly." icon={<Headphones className="h-5 w-5" />} />
          <ActionCard href="/refer-earn" title="Refer & Earn" text="Share and earn points." icon={<Gift className="h-5 w-5" />} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <SummaryCard
            title="Orders"
            value={account.orders.length.toString()}
            text="Track your latest purchases."
            href="/orders"
            icon={<PackageCheck className="h-6 w-6" />}
          />

          <SummaryCard
            title="Fresh Alerts"
            value={account.subs.length.toString()}
            text="Ready-soon alerts you follow."
            href="/ready-soon"
            icon={<Bell className="h-6 w-6" />}
          />

          <SummaryCard
            title="Rewards"
            value={points.toLocaleString()}
            text={`${tier} tier • ${lifetimePoints.toLocaleString()} lifetime points`}
            href="/account"
            icon={<Gift className="h-6 w-6" />}
          />
        </section>

        <ReferEarnCard />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
                  Orders
                </p>
                <h2 className="text-xl font-black text-[#183B28]">Recent orders</h2>
              </div>

              <Button href="/orders" variant="ghost" className="px-3 py-2">
                View all
              </Button>
            </div>

            {recentOrders.length ? (
              <div className="grid gap-3">
                {recentOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#D8E5D4] bg-[#F4F9F2] p-8 text-center">
                <PackageCheck className="mx-auto h-10 w-10 text-[#2D6741]" />
                <h3 className="mt-4 text-lg font-black text-[#183B28]">
                  No orders yet
                </h3>
                <p className="mt-2 text-sm font-semibold text-[#5F6A62]">
                  Start by shopping for fresh produce and building your box.
                </p>
                <Button href="/shop" className="mt-5">
                  Shop Produce
                </Button>
              </div>
            )}
          </Card>

          <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
                <MapPin className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
                  Delivery
                </p>
                <h2 className="text-xl font-black text-[#183B28]">Saved area</h2>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4">
              <p className="text-sm font-black text-[#183B28]">
                Primary delivery / pickup area
              </p>
              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-[#5F6A62]">
                {address || 'Add your parish, district, or pickup preference below.'}
              </p>
            </div>

            <p className="mt-4 text-xs font-bold leading-5 text-[#5F6A62]">
              Your phone and delivery details are private and only used for order support.
            </p>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
                Profile
              </p>
              <h2 className="text-xl font-black text-[#183B28]">
                Update your details
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#5F6A62]">
                These details will be used automatically at checkout.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" value={name} onChange={setName} />
              <Field
                label="Private phone"
                value={phone}
                onChange={setPhone}
                placeholder="Only used for order support"
              />

              <label className="grid gap-2 text-sm font-black text-[#183B28] md:col-span-2">
                Delivery parish / area
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Example: Kingston, Portmore, Mandeville, Montego Bay..."
                  className="min-h-24 rounded-2xl border border-[#D8E5D4] bg-white p-3 font-bold outline-none transition placeholder:text-[#5F6A62]/50 focus:border-[#2D6741]/50 focus:ring-4 focus:ring-[#2D6741]/10"
                />
              </label>
            </div>

            {message ? (
              <p className="mt-4 rounded-2xl bg-[#EAF5E7] px-4 py-3 text-sm font-bold text-[#2D6741]">
                {message}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
              <Button href="/checkout" variant="secondary">
                Go to checkout
              </Button>
            </div>
          </Card>

          <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
                  Support & security
                </p>
                <h2 className="text-xl font-black text-[#183B28]">
                  Account access
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <InfoRow label="Email" value={user.email || 'Not set'} />
              <InfoRow label="Admin" value={isAdmin ? 'Approved' : 'No admin access'} />
              <InfoRow label="Farmer profile" value={farmerProfile?.verification_status || 'No farmer profile'} />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button href="/support" variant="secondary">
                Open Support
              </Button>

              {isAdmin ? (
                <Button href="/admin" className="bg-[#DFA75A] text-[#183B28] hover:bg-[#F4C978]">
                  Admin Dashboard
                </Button>
              ) : null}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function AdminCommandCenter() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#DFA75A]/45 bg-[#073F2A] p-6 text-white shadow-[0_28px_90px_rgba(7,63,42,0.20)] sm:p-8">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2D6741]/70 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#DFA75A]/20 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#7A4F13]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin command center
          </span>

          <h2 className="mt-4 font-serif text-3xl font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-4xl">
            Manage The Harvest Place Ja faster.
          </h2>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78">
            Your admin dashboard is now highlighted here for quick access to orders, products, customer support, and marketplace activity.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/admin" className="bg-[#DFA75A] text-[#183B28] hover:bg-[#F4C978]">
              <BarChart3 className="mr-2 h-4 w-4" />
              Open Admin Dashboard
            </Button>

            <Button href="/orders" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/18">
              <ClipboardList className="mr-2 h-4 w-4" />
              Review Orders
            </Button>

            <Button href="/support" variant="ghost" className="border-white/20 bg-white/10 text-white hover:bg-white/18">
              <Headphones className="mr-2 h-4 w-4" />
              Support Inbox
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.75rem] border border-white/12 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
          <AdminQuickItem title="Orders" text="Check new orders and fulfilment status." />
          <AdminQuickItem title="Products" text="Update prices, stock, and product visibility." />
          <AdminQuickItem title="Support" text="Respond to customer requests and live chat." />
        </div>
      </div>
    </section>
  );
}

function AdminQuickItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
      <p className="text-sm font-black text-[#FFF3D9]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/70">{text}</p>
    </div>
  );
}

async function safeResolve<T>(promise: Promise<T>, fallback: T, timeoutMs = 16000): Promise<T> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), timeoutMs)),
    ]);
  } catch (error) {
    console.error('Account data failed to load:', error);
    return fallback;
  }
}

function getOrderStatus(order: FarmOrder) {
  const item = order as FarmOrder & {
    delivery_status?: string | null;
    order_status?: string | null;
    status?: string | null;
  };

  return item.delivery_status || item.order_status || item.status || 'pending';
}

function getOrderTotal(order: FarmOrder) {
  const item = order as FarmOrder & {
    total_amount?: number | null;
    grand_total?: number | null;
    total?: number | null;
    subtotal?: number | null;
  };

  return item.total_amount ?? item.grand_total ?? item.total ?? item.subtotal ?? null;
}

function getFulfillmentLabel(order: FarmOrder) {
  const item = order as FarmOrder & {
    fulfillment_type?: string | null;
    delivery_method?: string | null;
  };

  return item.fulfillment_type || item.delivery_method || 'Fulfillment pending';
}

function OrderRow({ order }: { order: FarmOrder }) {
  const status = getOrderStatus(order);
  const total = getOrderTotal(order);

  return (
    <a
      href={`/orders/${order.id}`}
      className="block rounded-3xl border border-[#D8E5D4] bg-[#FFFEFC] p-4 transition hover:border-[#2D6741]/35 hover:bg-[#EAF5E7]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#183B28]">
              Order #HPJ-{shortIdLabel(order.id)}
            </p>
            <StatusChip status={status} />
          </div>

          <p className="mt-1 text-xs font-bold text-[#5F6A62]">
            {formatDate(order.created_at)} • {getFulfillmentLabel(order)} •{' '}
            {typeof total === 'number' ? formatJmd(total) : 'Total pending'}
          </p>
        </div>
      </div>
    </a>
  );
}

function ActionCard({
  href,
  title,
  text,
  icon,
}: {
  href: string;
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded-[1.5rem] border border-[#D8E5D4] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6741]/40 hover:bg-[#EAF5E7] hover:shadow-lg"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </span>

      <span className="mt-4 block text-sm font-black text-[#183B28]">{title}</span>
      <span className="mt-1 block text-xs font-semibold leading-5 text-[#5F6A62]">{text}</span>
    </a>
  );
}

function SummaryCard({
  title,
  value,
  text,
  href,
  icon,
}: {
  title: string;
  value: string;
  text: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#5F6A62]">{title}</p>
          <p className="mt-1 text-3xl font-black text-[#183B28]">{value}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
            {text}
          </p>
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
          {icon}
        </div>
      </div>

      <Button href={href} variant="secondary" className="mt-5 w-full border-[#D8E5D4]">
        Open
      </Button>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#183B28]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8E5D4] bg-white p-3 font-bold outline-none transition placeholder:text-[#5F6A62]/50 focus:border-[#2D6741]/50 focus:ring-4 focus:ring-[#2D6741]/10"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#D8E5D4] bg-white px-4 py-3 text-sm font-bold text-[#5F6A62]">
      <span>{label}</span>
      <span className="text-right font-black text-[#183B28]">{value}</span>
    </div>
  );
}
