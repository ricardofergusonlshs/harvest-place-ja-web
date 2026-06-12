'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Gift,
  Headphones,
  Heart,
  Home,
  Leaf,
  LockKeyhole,
  LogOut,
  MapPin,
  PackageCheck,
  Pencil,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
  UserRound,
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
import {
  fetchCurrentCustomerProfile,
  fetchCustomerProductSubscriptions,
  fetchLoyaltySummary,
  fetchOrders,
  fetchProducts,
  saveCurrentCustomerProfile,
} from '@/lib/services';
import { formatDate, formatJmd, safeEmailName, shortIdLabel } from '@/lib/format';
import type {
  CustomerProfile,
  CustomerProductSubscription,
  FarmOrder,
  LoyaltySummary,
  Product,
} from '@/lib/types';

const ACCOUNT_ITEMS = [
  { label: 'Overview', icon: UserRound, href: '#overview' },
  { label: 'My Orders', icon: ShoppingBag, href: '/orders' },
  { label: 'My Subscriptions', icon: CalendarDays, href: '#subscriptions' },
  { label: 'Addresses', icon: MapPin, href: '#addresses' },
  { label: 'Payment Methods', icon: CreditCard, href: '#access' },
  { label: 'Rewards & Points', icon: Gift, href: '#rewards' },
  { label: 'Favorites', icon: Heart, href: '#favorites' },
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Help & Support', icon: Headphones, href: '/support' },
  { label: 'Account Settings', icon: Pencil, href: '#settings' },
] as const;

type DashboardState = {
  profile: CustomerProfile | null;
  loyalty: LoyaltySummary;
  subs: CustomerProductSubscription[];
  orders: FarmOrder[];
  products: Product[];
};

const emptyDashboard: DashboardState = {
  profile: null,
  loyalty: { points: 0, lifetime_points: 0, tier: 'Seedling' },
  subs: [],
  orders: [],
  products: [],
};

export default function AccountPage() {
  const { user, loading: authLoading, farmerProfile, isAdmin, signOut } = useAuth();

  const [state, setState] = useState<DashboardState>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(
    async (showRefreshState = false) => {
      if (!user) return;

      if (showRefreshState) setRefreshing(true);
      else setLoading(true);

      setError('');

      const [profile, loyalty, subs, orders, products] = await Promise.all([
        safeResolve(fetchCurrentCustomerProfile(), null),
        safeResolve(fetchLoyaltySummary(), {
          points: 0,
          lifetime_points: 0,
          tier: 'Seedling',
        } as LoyaltySummary),
        safeResolve(fetchCustomerProductSubscriptions(), [] as CustomerProductSubscription[]),
        safeResolve(fetchOrders(), [] as FarmOrder[]),
        safeResolve(fetchProducts(), [] as Product[]),
      ]);

      setState({ profile, loyalty, subs, orders, products });
      setName(profile?.full_name || safeEmailName(user.email) || '');
      setPhone(profile?.phone || '');
      setAddress(profile?.address || '');
      setLoading(false);
      setRefreshing(false);
    },
    [user]
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      if (authLoading) return;

      if (!user) {
        if (alive) setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [profile, loyalty, subs, orders, products] = await Promise.all([
          safeResolve(fetchCurrentCustomerProfile(), null),
          safeResolve(fetchLoyaltySummary(), {
            points: 0,
            lifetime_points: 0,
            tier: 'Seedling',
          } as LoyaltySummary),
          safeResolve(fetchCustomerProductSubscriptions(), [] as CustomerProductSubscription[]),
          safeResolve(fetchOrders(), [] as FarmOrder[]),
          safeResolve(fetchProducts(), [] as Product[]),
        ]);

        if (!alive) return;

        setState({ profile, loyalty, subs, orders, products });
        setName(profile?.full_name || safeEmailName(user.email) || '');
        setPhone(profile?.phone || '');
        setAddress(profile?.address || '');
      } catch {
        if (!alive) return;
        setState(emptyDashboard);
        setError('Your account dashboard could not fully load. You can refresh or continue shopping.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [user, authLoading]);

  const displayName = useMemo(() => {
    return name || state.profile?.full_name || safeEmailName(user?.email) || 'Harvest customer';
  }, [name, state.profile?.full_name, user?.email]);

  const points = Number(state.loyalty.points || 0);
  const lifetimePoints = Number(state.loyalty.lifetime_points || points || 0);
  const tier = state.loyalty.tier || 'Seedling';
  const orderTotal = state.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const savings = Math.max(0, Math.round(orderTotal * 0.08));
  const favorites = state.products.slice(0, 4);
  const subscriptionsLabel = state.subs.length
    ? `${state.subs.length} active plan${state.subs.length === 1 ? '' : 's'}`
    : 'No active plans yet';

  async function save() {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await saveCurrentCustomerProfile({
        full_name: name.trim() || displayName,
        phone: phone.trim(),
        address: address.trim(),
      });

      setMessage('Profile saved successfully.');
      await loadDashboard(true);
    } catch (err) {
      setMessage('');
      setError(err instanceof Error ? err.message : 'Profile could not be saved right now.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-[1500px]">
          <LoadingState label="Loading your account dashboard..." />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-12 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl">
          <EmptyState
            title="Sign in to unlock your dashboard"
            subtitle="Orders, rewards, addresses, subscriptions, support, farmer access, and account tools require Supabase Auth."
            action={<Button href="/auth?redirect=/account&next=/account">Sign in</Button>}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_46%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[270px_1fr]">
          <AccountSidebar
            isAdmin={isAdmin}
            farmerStatus={farmerProfile?.verification_status}
            onSignOut={handleSignOut}
          />

          <div className="grid gap-6">
            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
                {error}
              </div>
            ) : null}

            <AccountHero
              displayName={displayName}
              userEmail={user.email}
              points={points}
              tier={tier}
              refreshing={refreshing}
              onRefresh={() => loadDashboard(true)}
            />

            <section id="overview" className="grid gap-6 2xl:grid-cols-[1.05fr_0.85fr_0.85fr]">
              <LoyaltyCard points={points} lifetimePoints={lifetimePoints} tier={tier} />
              <SavingsCard amount={savings} orderTotal={orderTotal} />
              <AccessCard
                email={user.email}
                isAdmin={isAdmin}
                farmerStatus={farmerProfile?.verification_status}
                subscriptionsLabel={subscriptionsLabel}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
              <RecentOrdersCard orders={state.orders} products={state.products} />

              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-1">
                <SavedAddressesCard profile={state.profile} address={address} />
                <FavoritesCard products={favorites} />
                <SupportCard />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <NotificationsCard />
              <TrustSecurityCard />
            </section>

            <section id="settings" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <ProfileSettingsCard
                name={name}
                phone={phone}
                address={address}
                message={message}
                saving={saving}
                onName={setName}
                onPhone={setPhone}
                onAddress={setAddress}
                onSave={save}
              />

              <AccountActionsCard />
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

async function safeResolve<T>(promise: Promise<T>, fallback: T, timeoutMs = 18000): Promise<T> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), timeoutMs)),
    ]);
  } catch {
    return fallback;
  }
}

function AccountSidebar({
  isAdmin,
  farmerStatus,
  onSignOut,
}: {
  isAdmin: boolean;
  farmerStatus?: string | null;
  onSignOut: () => Promise<void>;
}) {
  return (
    <aside className="rounded-[32px] border border-[#D8E5D4] bg-white/95 p-4 shadow-[0_24px_70px_rgba(24,59,40,0.08)] backdrop-blur xl:sticky xl:top-32 xl:self-start">
      <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#183B28]">
        My Account
      </p>

      <div className="mt-2 grid gap-1">
        {ACCOUNT_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const active = index === 0;
          const className = cn(
            'relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-extrabold transition',
            active
              ? 'bg-[#EAF5E7] text-[#183B28] before:absolute before:left-0 before:top-2 before:h-8 before:w-1 before:rounded-r-full before:bg-[#2D6741]'
              : 'text-[#5F6A62] hover:bg-[#EAF5E7] hover:text-[#183B28]'
          );

          if (item.href.startsWith('#')) {
            return (
              <a key={item.label} href={item.href} className={className}>
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-[#5F6A62] transition hover:bg-[#FFF3D9] hover:text-[#183B28]"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-[#D8E5D4] bg-[#EAF5E7] p-4">
        <p className="text-base font-black leading-tight text-[#183B28]">
          Real Farms. Real People. Real Jamaican Goodness.
        </p>

        <p className="mt-2 text-xs font-semibold leading-5 text-[#5F6A62]">
          Thank you for supporting local farmers and sustainable communities.
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <Badge tone={isAdmin ? 'gold' : 'green'}>
              {isAdmin ? 'Admin access' : farmerStatus || 'Market member'}
            </Badge>

            <p className="mt-3 text-[11px] font-black text-[#183B28]">
              The Harvest Place Ja Team
            </p>
          </div>

          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-sm">
            <Image src="/logo.png" alt="The Harvest Place Ja" fill className="object-cover" sizes="80px" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function AccountHero({
  displayName,
  userEmail,
  points,
  tier,
  refreshing,
  onRefresh,
}: {
  displayName: string;
  userEmail?: string;
  points: number;
  tier: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge tone="gold">
            <Sparkles className="h-3 w-3" />
            Customer dashboard
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Welcome back, {displayName}.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            Manage your orders, rewards, subscriptions, addresses, saved products, support, and secure account details in one place.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone="green">{userEmail || 'Secure account'}</Badge>
            <Badge tone="gold">{tier}</Badge>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/shop">Shop fresh picks</Button>
            <Button href="/orders" variant="secondary">View orders</Button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
          <HeroStat label="Points" value={points.toLocaleString()} />
          <HeroStat label="Tier" value={tier} />
          <HeroStat label="Status" value="Protected" wide />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value, wide = false }: { label: string; value: string | number; wide?: boolean }) {
  return (
    <div className={cn('rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur', wide ? 'sm:col-span-2' : '')}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function LoyaltyCard({ points, lifetimePoints, tier }: { points: number; lifetimePoints: number; tier: string }) {
  const target = 1500;
  const progress = Math.min(100, Math.round((points / target) * 100));

  return (
    <Card id="rewards" className="rounded-[30px] border border-[#D8E5D4] bg-white p-7 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-[#DFA75A]/35 bg-[#FFF3D9] text-[#DFA75A]">
          <Gift className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-[#5F6A62]">Your Loyalty Status</p>
          <h2 className="mt-1 text-2xl font-black text-[#183B28]">{tier}</h2>

          <div className="mt-5 flex items-end justify-between text-sm">
            <span className="font-black text-[#183B28]">{points.toLocaleString()} Points</span>
            <span className="text-xs font-bold text-[#5F6A62]">{target.toLocaleString()} Points</span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAF5E7]">
            <div className="h-full rounded-full bg-[#DFA75A]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 text-center text-[11px] font-bold text-[#5F6A62]">
        <MiniReward icon={<Star className="h-4 w-4" />} label="Exclusive Offers" />
        <MiniReward icon={<Truck className="h-4 w-4" />} label="Priority Delivery" />
        <MiniReward icon={<MapPin className="h-4 w-4" />} label="Member Pricing" />
        <MiniReward icon={<Gift className="h-4 w-4" />} label="Birthday Rewards" />
      </div>

      <p className="mt-5 rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-bold text-[#5F6A62]">
        Lifetime points: <span className="font-black text-[#183B28]">{lifetimePoints.toLocaleString()}</span>
      </p>
    </Card>
  );
}

function SavingsCard({ amount, orderTotal }: { amount: number; orderTotal: number }) {
  return (
    <Card className="rounded-[30px] border border-[#DFA75A]/30 bg-gradient-to-br from-[#FFF3D9] via-white to-white p-7 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <p className="text-sm font-black text-[#183B28]">You&apos;re Saving More</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-black text-[#2D6741]">
            {formatJmd(amount).replace('.00', '')}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
            estimated savings from member pricing and market rewards.
          </p>
        </div>

        <div className="grid h-24 w-24 place-items-center rounded-full bg-white/75 text-[#2D6741] shadow-sm">
          <Leaf className="h-12 w-12" />
        </div>
      </div>

      <p className="mt-5 rounded-2xl border border-[#D8E5D4] bg-white/75 px-4 py-3 text-sm font-bold text-[#5F6A62]">
        Order total tracked: <span className="font-black text-[#183B28]">{formatJmd(orderTotal)}</span>
      </p>
    </Card>
  );
}

function RecentOrdersCard({ orders, products }: { orders: FarmOrder[]; products: Product[] }) {
  const visible = orders.slice(0, 2);

  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] lg:p-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-[#183B28]">Recent Orders</h2>
        <Button href="/orders" variant="ghost" className="px-3 py-2">View all</Button>
      </div>

      {visible.length ? (
        <div className="grid gap-4">
          {visible.map((order, index) => (
            <OrderCard key={order.id} order={order} products={products.slice(index * 5, index * 5 + 5)} />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#D8E5D4] bg-[#EAF5E7]/35 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-[#2D6741] shadow-sm">
            <ShoppingBag className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-lg font-black text-[#183B28]">No orders yet</h3>
          <p className="mt-2 text-sm font-semibold text-[#5F6A62]">Your order tracker will appear here after checkout.</p>
          <Button href="/shop" className="mt-5">Shop fresh picks</Button>
        </div>
      )}
    </Card>
  );
}

function OrderCard({ order, products }: { order: FarmOrder; products: Product[] }) {
  const status = order.delivery_status || order.order_status || order.status || 'confirmed';

  return (
    <div className="rounded-[24px] border border-[#D8E5D4] bg-white p-5 shadow-[0_10px_35px_rgba(24,59,40,0.05)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#183B28]">Order #HPJ-{shortIdLabel(order.id)}</h3>
            <StatusChip status={status} />
          </div>

          <p className="mt-2 text-xs font-bold text-[#5F6A62]">
            {formatDate(order.created_at)} • {formatJmd(order.total || 0)} • {order.fulfillment_type || 'Pickup / delivery'}
          </p>

          <p className="mt-1 text-xs font-bold text-[#5F6A62]">
            Estimated delivery: {order.scheduled_date ? formatDate(order.scheduled_date) : 'To be confirmed'} {order.scheduled_time ? `• ${order.scheduled_time}` : ''}
          </p>
        </div>

        <ChevronRight className="hidden h-5 w-5 text-[#5F6A62] md:block" />
      </div>

      <OrderTimeline status={status} />

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex -space-x-2">
          {(products.length ? products : fallbackProduce()).slice(0, 5).map((product, index) => (
            <ProductThumb key={`${product.name}-${index}`} product={product} />
          ))}

          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white bg-[#EAF5E7] text-xs font-black text-[#2D6741]">
            +{Math.max(1, products.length)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button href={`/orders/${order.id}`} className="px-5 py-2.5">Track Order</Button>
          <Button href={`/orders/${order.id}`} variant="secondary" className="px-5 py-2.5">View Details</Button>
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ status }: { status: string }) {
  const steps = ['Confirmed', 'Packed', 'In Transit', 'Out for Delivery', 'Delivered'];
  const lower = status.toLowerCase();
  const active = lower.includes('deliver') || lower.includes('complete')
    ? 4
    : lower.includes('out')
      ? 3
      : lower.includes('transit') || lower.includes('ship')
        ? 2
        : lower.includes('pack') || lower.includes('prepar')
          ? 1
          : 0;

  return (
    <div className="mt-5 grid grid-cols-5 gap-2">
      {steps.map((step, index) => (
        <div key={step} className="text-center">
          <div
            className={cn(
              'mx-auto grid h-7 w-7 place-items-center rounded-full border text-[11px] font-black',
              index <= active
                ? 'border-[#2D6741] bg-[#2D6741] text-white'
                : 'border-[#D8E5D4] bg-white text-[#5F6A62]'
            )}
          >
            {index <= active ? <Check className="h-3.5 w-3.5" /> : index + 1}
          </div>

          <p className={cn('mt-1 hidden text-[10px] font-black md:block', index <= active ? 'text-[#183B28]' : 'text-[#5F6A62]')}>
            {step}
          </p>
        </div>
      ))}
    </div>
  );
}

function SavedAddressesCard({ profile, address }: { profile: CustomerProfile | null; address: string }) {
  return (
    <Card id="addresses" className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-black text-[#183B28]">Saved Addresses</h2>
        <a href="#settings" className="text-xs font-black text-[#2D6741]">Edit</a>
      </div>

      <AddressBlock
        label="Home"
        badge="Default"
        address={address || profile?.address || 'Add your delivery address in profile settings'}
        phone={profile?.phone}
      />

      <AddressBlock label="Work" address="Optional second delivery location" phone="Add later" muted />
    </Card>
  );
}

function AddressBlock({
  label,
  badge,
  address,
  phone,
  muted = false,
}: {
  label: string;
  badge?: string;
  address: string;
  phone?: string | null;
  muted?: boolean;
}) {
  return (
    <div className={cn('mt-3 rounded-2xl border border-[#D8E5D4] bg-white p-4', muted && 'border-dashed bg-[#EAF5E7]/20')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-[#183B28]">{label}</p>
          {badge ? <Badge tone="green" className="py-0.5 text-[10px]">{badge}</Badge> : null}
        </div>

        <Pencil className="h-4 w-4 text-[#5F6A62]" />
      </div>

      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-5 text-[#5F6A62]">{address}</p>
      <p className="mt-1 text-xs font-bold text-[#5F6A62]">{phone || 'Phone not set'}</p>
    </div>
  );
}

function FavoritesCard({ products }: { products: Product[] }) {
  const cards = products.length ? products : fallbackProduce();

  return (
    <Card id="favorites" className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-black text-[#183B28]">Favorites & Recently Viewed</h2>
        <Link href="/shop" className="text-xs font-black text-[#2D6741]">View all</Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.slice(0, 4).map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} className="relative rounded-2xl border border-[#D8E5D4] bg-white p-2 text-center transition hover:-translate-y-0.5 hover:shadow-sm">
            <Heart className="absolute right-2 top-2 h-3.5 w-3.5 text-[#DFA75A]" />
            <div className="relative mx-auto h-16 w-full overflow-hidden rounded-xl bg-[#EAF5E7]">
              <Image src={product.image_url || '/logo.png'} alt={product.name} fill className="object-cover" sizes="90px" />
            </div>
            <p className="mt-2 truncate text-[11px] font-black text-[#183B28]">{product.name}</p>
            <p className="text-[10px] font-bold text-[#5F6A62]">{formatJmd(product.price)}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function SupportCard() {
  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <h2 className="font-black text-[#183B28]">Support & Help</h2>
      <p className="mt-1 text-sm font-semibold text-[#5F6A62]">How can we help you today?</p>

      <div className="mt-4 grid gap-2">
        <SupportRow href="/support" icon={<Headphones className="h-5 w-5" />} title="Open a ticket" copy="Send your question to support" />
        <SupportRow href="/trust" icon={<ShieldCheck className="h-5 w-5" />} title="Visit Trust Center" copy="Review safety and marketplace workflows" />
        <SupportRow href="/support" icon={<PhoneCall className="h-5 w-5" />} title="Request a callback" copy="Ask support to contact you" />
      </div>
    </Card>
  );
}

function NotificationsCard() {
  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-[#183B28]">Notifications & Preferences</h2>
          <p className="mt-1 text-sm font-semibold text-[#5F6A62]">Manage order updates, offers, and weekly reminders.</p>
        </div>

        <Link href="/notifications">
          <ChevronRight className="h-5 w-5 text-[#5F6A62]" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <ToggleItem icon={<PackageCheck className="h-5 w-5" />} label="Order Updates" copy="Order status alerts" on />
        <ToggleItem icon={<Sparkles className="h-5 w-5" />} label="Promotions" copy="Deals and offers" on />
        <ToggleItem icon={<Leaf className="h-5 w-5" />} label="New Arrivals" copy="Fresh product alerts" on />
        <ToggleItem icon={<CalendarDays className="h-5 w-5" />} label="Weekly Box" copy="Box reminders" />
      </div>
    </Card>
  );
}

function TrustSecurityCard() {
  return (
    <Card className="relative overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="absolute right-4 top-6 grid h-24 w-24 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
        <ShieldCheck className="h-12 w-12" />
      </div>

      <h2 className="font-black text-[#183B28]">Trust & Security</h2>

      <div className="mt-6 grid gap-4 pr-20 sm:grid-cols-2">
        <TrustLine icon={<LockKeyhole className="h-5 w-5" />} title="Secure account" copy="Protected by Supabase Auth" />
        <TrustLine icon={<Leaf className="h-5 w-5" />} title="Freshness promise" copy="Support is available when issues happen" />
        <TrustLine icon={<Truck className="h-5 w-5" />} title="Delivery tracking" copy="Follow pickup and delivery status" />
      </div>
    </Card>
  );
}

function ProfileSettingsCard({
  name,
  phone,
  address,
  message,
  saving,
  onName,
  onPhone,
  onAddress,
  onSave,
}: {
  name: string;
  phone: string;
  address: string;
  message: string;
  saving: boolean;
  onName: (value: string) => void;
  onPhone: (value: string) => void;
  onAddress: (value: string) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="mb-5">
        <Badge tone="green">Profile settings</Badge>
        <h2 className="mt-3 font-black text-[#183B28]">Quick Profile Update</h2>
        <p className="mt-1 text-sm font-semibold text-[#5F6A62]">Keep your name, phone, and delivery address ready for checkout.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" value={name} onChange={onName} />
        <Field label="Phone" value={phone} onChange={onPhone} />

        <label className="grid gap-2 text-sm font-black text-[#183B28] md:col-span-2">
          Address
          <textarea
            value={address}
            onChange={(event) => onAddress(event.target.value)}
            className="min-h-24 rounded-2xl border border-[#D8E5D4] bg-white p-3 font-bold outline-none transition focus:border-[#2D6741]/50 focus:ring-4 focus:ring-[#2D6741]/10"
          />
        </label>
      </div>

      {message ? <p className="mt-4 text-sm font-bold text-[#2D6741]">{message}</p> : null}

      <Button onClick={onSave} disabled={saving} className="mt-5">
        {saving ? 'Saving...' : 'Save profile'}
      </Button>
    </Card>
  );
}

function AccessCard({
  email,
  isAdmin,
  farmerStatus,
  subscriptionsLabel,
}: {
  email?: string;
  isAdmin: boolean;
  farmerStatus?: string | null;
  subscriptionsLabel: string;
}) {
  return (
    <Card id="access" className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <h2 className="font-black text-[#183B28]">Account Access</h2>

      <div className="mt-4 grid gap-3 text-sm font-bold text-[#5F6A62]">
        <InfoRow label="Email" value={email || 'Not set'} />
        <InfoRow label="Admin" value={isAdmin ? 'Approved' : 'No admin access'} />
        <InfoRow label="Farmer" value={farmerStatus || 'No profile'} />
        <InfoRow label="Subscriptions" value={subscriptionsLabel} />
      </div>
    </Card>
  );
}

function AccountActionsCard() {
  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_24px_70px_rgba(24,59,40,0.16)]">
      <Badge tone="gold">Account tools</Badge>

      <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
        Keep your market account organized.
      </h2>

      <p className="mt-3 text-sm font-semibold leading-7 text-white/76">
        Visit your order tracker, support center, notifications, and weekly box tools whenever you need to update your shopping experience.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <LinkButton href="/orders" label="View orders" />
        <LinkButton href="/notifications" label="Notifications" />
        <LinkButton href="/support" label="Support" />
        <LinkButton href="/weekly-box" label="Weekly box" />
      </div>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#183B28]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#D8E5D4] bg-white p-3 font-bold outline-none transition focus:border-[#2D6741]/50 focus:ring-4 focus:ring-[#2D6741]/10"
      />
    </label>
  );
}

function MiniReward({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="grid justify-items-center gap-1">
      <span className="text-[#2D6741]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function ProductThumb({ product }: { product: Product }) {
  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-xl border-2 border-white bg-[#EAF5E7] shadow-sm">
      <Image src={product.image_url || '/logo.png'} alt={product.name} fill className="object-cover" sizes="40px" />
    </div>
  );
}

function SupportRow({ href, icon, title, copy }: { href: string; icon: ReactNode; title: string; copy: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-2xl p-3 text-left transition hover:bg-[#EAF5E7]">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[#183B28]">{title}</span>
        <span className="block text-xs font-semibold text-[#5F6A62]">{copy}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-[#5F6A62]" />
    </Link>
  );
}

function ToggleItem({ icon, label, copy, on = false }: { icon: ReactNode; label: string; copy: string; on?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#2D6741]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[#183B28]">{label}</span>
        <span className="block text-xs font-semibold text-[#5F6A62]">{copy}</span>
      </span>
      <span className={cn('relative h-6 w-11 rounded-full transition', on ? 'bg-[#2D6741]' : 'bg-[#EAF5E7]')}>
        <span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition', on ? 'left-6' : 'left-1')} />
      </span>
    </div>
  );
}

function TrustLine({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[#2D6741]">{icon}</span>
      <span>
        <span className="block text-sm font-black text-[#183B28]">{title}</span>
        <span className="block text-xs font-semibold leading-5 text-[#5F6A62]">{copy}</span>
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#D8E5D4] bg-white px-4 py-3">
      <span>{label}</span>
      <span className="text-right font-black text-[#183B28]">{value}</span>
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
    >
      {label}
    </Link>
  );
}

function fallbackProduce(): Product[] {
  return ['Callaloo', 'Sweet Potatoes', 'Scotch Bonnet Peppers', 'Fresh Thyme'].map((name, index) => ({
    id: `fallback-${index}`,
    name,
    price: [450, 350, 650, 180][index],
    unit: 'each',
    image_url: '/logo.png',
    is_available: true,
    stock_quantity: 12,
    category: 'Fresh Produce',
    is_organic: index === 2,
    is_local: true,
    approval_status: 'approved',
    platform_commission_percent: 10,
    is_discount_active: false,
    product_status: 'available',
    ready_soon: false,
    is_deal_of_day: false,
    deal_rank: 999,
    subscribe_save_enabled: false,
    subscribe_save_discount_percent: 5,
  }));
}
