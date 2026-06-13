'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Gift,
  Headphones,
  Heart,
  Home,
  Leaf,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Star,
  Truck,
  UserRound,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, LoadingState, StatusChip, cn } from '@/components/ui';
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
  ['Overview', Home],
  ['Produce Requests', ShoppingBag],
  ['Followed Farms', Leaf],
  ['Fresh Alerts', Bell],
  ['Farm Messages', MessageCircle],
  ['Saved Delivery Areas', MapPin],
  ['Rewards & Points', Gift],
  ['Help & Support', Headphones],
  ['Account Settings', Pencil],
] as const;

type DashboardState = {
  profile: CustomerProfile | null;
  loyalty: LoyaltySummary;
  subs: CustomerProductSubscription[];
  orders: FarmOrder[];
  products: Product[];
};

type FarmSummary = {
  slug: string;
  farmName: string;
  parish: string;
  image: string;
  story: string;
  tags: string[];
  itemCount: number;
};

const emptyDashboard: DashboardState = {
  profile: null,
  loyalty: { points: 0, lifetime_points: 0, tier: 'Seedling' },
  subs: [],
  orders: [],
  products: [],
};

const offPlatformBlockedPhrases = [
  'call me',
  'text me',
  'whatsapp me',
  'whats app me',
  'send your number',
  'my number',
  'outside the app',
  'outside the website',
  'contact me directly',
  'message me directly',
  'dm me',
  'instagram',
  'facebook',
  'tiktok',
  'telegram',
];

export default function AccountPage() {
  const { user, loading: authLoading, farmerProfile, isAdmin, signOut } = useAuth();
  const [state, setState] = useState<DashboardState>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [privateContact, setPrivateContact] = useState('');
  const [address, setAddress] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [requestDraft, setRequestDraft] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const [profile, loyalty, subs, orders, products] = await Promise.all([
        safeResolve(fetchCurrentCustomerProfile(), null),
        safeResolve(fetchLoyaltySummary(), { points: 0, lifetime_points: 0, tier: 'Seedling' } as LoyaltySummary),
        safeResolve(fetchCustomerProductSubscriptions(), [] as CustomerProductSubscription[]),
        safeResolve(fetchOrders(), [] as FarmOrder[]),
        safeResolve(fetchProducts(), [] as Product[]),
      ]);

      if (!alive) return;

      setState({ profile, loyalty, subs, orders, products });
      setName(profile?.full_name || safeEmailName(user.email) || '');
      setPrivateContact(profile?.phone || '');
      setAddress(profile?.address || '');
      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [user, authLoading]);

  const displayName = useMemo(
    () => name || state.profile?.full_name || safeEmailName(user?.email) || 'Harvest Explorer',
    [name, state.profile?.full_name, user?.email]
  );

  const farms = useMemo(() => buildFarmSummaries(state.products), [state.products]);
  const points = Number(state.loyalty.points || 0);
  const requestTotal = state.orders.length;
  const alertTotal = state.subs.length;
  const favorites = state.products.slice(0, 4);
  const safeScore = Math.min(100, 76 + Math.min(24, requestTotal * 4 + alertTotal * 3));
  const subscriptionsLabel = state.subs.length
    ? `${state.subs.length} fresh alert${state.subs.length === 1 ? '' : 's'} active`
    : 'No fresh alerts yet';

  async function save() {
    setProfileMessage('Saving your farm discovery profile...');

    try {
      await saveCurrentCustomerProfile({
        full_name: name || displayName,
        phone: privateContact,
        address,
      });
      setProfileMessage('Profile saved. Your private contact details remain hidden from farms and customers.');
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Profile could not be saved right now.');
    }
  }

  function submitSafeRequestDraft() {
    const trimmed = requestDraft.trim();

    if (!trimmed) {
      setRequestMessage('Write a short produce request first.');
      return;
    }

    if (containsOffPlatformContact(trimmed)) {
      setRequestMessage('For your safety, please keep all communication and produce requests inside The Harvest Place Ja.');
      return;
    }

    setRequestMessage('This request looks safe. When request messaging is connected, it can be sent through the platform.');
  }

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-[1700px] px-4 py-10 sm:px-6 lg:px-10">
        <LoadingState />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          title="Sign in to explore farms safely"
          subtitle="Your farm follows, harvest alerts, produce requests, and platform messages stay inside The Harvest Place Ja."
          action={<Button href="/auth?redirect=/account">Sign in</Button>}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#183B28]">
      <div className="mx-auto max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
          <AccountSidebar
            isAdmin={isAdmin}
            farmerStatus={farmerProfile?.verification_status}
            onSignOut={signOut}
          />

          <div className="grid gap-6">
            <section className="grid gap-6 2xl:grid-cols-[1.35fr_0.82fr_0.82fr]">
              <WelcomeCard displayName={displayName} userEmail={user.email} />
              <DiscoveryScoreCard farms={farms.length} requests={requestTotal} alerts={alertTotal} />
              <SafetyCard score={safeScore} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <SafeRequestComposer
                value={requestDraft}
                message={requestMessage}
                onChange={setRequestDraft}
                onSubmit={submitSafeRequestDraft}
              />
              <FreshAlertCard alertTotal={alertTotal} subscriptionsLabel={subscriptionsLabel} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <FollowedFarmsCard farms={farms} />
              <div className="grid gap-6">
                <SavedDeliveryAreasCard profile={state.profile} address={address} />
                <RecentHarvestsCard products={favorites} />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <RecentRequestsCard orders={state.orders} products={state.products} />
              <FarmMessagesCard />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <TrustSecurityCard />
              <SupportCard />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <ProfileSettingsCard
                name={name}
                address={address}
                message={profileMessage}
                onName={setName}
                onAddress={setAddress}
                onSave={save}
              />
              <AccessCard
                email={user.email}
                isAdmin={isAdmin}
                farmerStatus={farmerProfile?.verification_status}
                subscriptionsLabel={subscriptionsLabel}
                points={points}
              />
            </section>
          </div>
        </div>
      </div>
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

function containsOffPlatformContact(message: string) {
  const text = message.toLowerCase();
  const phonePattern = /(\+?\d[\d\s().-]{6,}\d)/;
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const linkPattern = /(https?:\/\/|www\.|\.com|\.net|\.org|\.co|wa\.me|whatsapp|instagram|facebook|tiktok|telegram)/i;
  const socialHandlePattern = /(^|\s)@[a-z0-9._-]{3,}/i;

  return (
    phonePattern.test(text) ||
    emailPattern.test(text) ||
    linkPattern.test(text) ||
    socialHandlePattern.test(text) ||
    offPlatformBlockedPhrases.some((phrase) => text.includes(phrase))
  );
}

function makeFarmSlug(value: unknown) {
  return (
    String(value ?? 'local-farm')
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'local-farm'
  );
}

function productFarmName(product: Product) {
  const item = product as Product & {
    farm_name?: string | null;
    farmer_name?: string | null;
  };

  return item.farm_name || item.farmer_name || 'Local Partner Farm';
}

function productParish(product: Product) {
  const item = product as Product & {
    parish?: string | null;
  };

  return item.parish || 'Jamaica';
}

function productCategory(product: Product) {
  const item = product as Product & {
    category?: string | null;
  };

  return item.category || 'Fresh Harvest';
}

function buildFarmSummaries(products: Product[]): FarmSummary[] {
  if (!products.length) return fallbackFarms();

  const grouped = new Map<string, FarmSummary>();

  products.forEach((product, index) => {
    const farmName = productFarmName(product);
    const slug = makeFarmSlug(farmName);
    const existing = grouped.get(slug);
    const image = product.image_url || fallbackFarmImages[index % fallbackFarmImages.length];
    const tag = productCategory(product);

    if (existing) {
      existing.itemCount += 1;
      if (!existing.tags.includes(tag)) existing.tags.push(tag);
      return;
    }

    grouped.set(slug, {
      slug,
      farmName,
      parish: productParish(product),
      image,
      story: 'Explore this farm profile to see its own available produce, harvest updates, and safe platform requests.',
      tags: [tag, 'Farm Profile', 'Safe Requests'],
      itemCount: 1,
    });
  });

  return Array.from(grouped.values()).slice(0, 6);
}

const fallbackFarmImages = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
];

function fallbackFarms(): FarmSummary[] {
  return [
    {
      slug: 'green-vale-farms',
      farmName: 'Green Vale Farms',
      parish: 'St. Catherine',
      image: fallbackFarmImages[0],
      story: 'A family-run farm sharing seasonal vegetables, roots, and herbs through safe platform requests.',
      tags: ['Vegetables', 'Roots', 'Herbs'],
      itemCount: 3,
    },
    {
      slug: 'sunland-organics',
      farmName: 'Sunland Organics',
      parish: 'Clarendon',
      image: fallbackFarmImages[1],
      story: 'Organic-focused growers sharing farm stories and available produce through The Harvest Place Ja.',
      tags: ['Organic', 'Vegetables', 'Farm Stories'],
      itemCount: 2,
    },
    {
      slug: 'blue-mountain-greens',
      farmName: 'Blue Mountain Greens',
      parish: 'Portland',
      image: fallbackFarmImages[2],
      story: 'A hillside farm profile ready for harvest updates, fresh alerts, and safe requests.',
      tags: ['Greens', 'Seasonal', 'Ready Soon'],
      itemCount: 4,
    },
  ];
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
    <aside className="rounded-[2rem] border border-[#D8E5D4] bg-white/92 p-4 shadow-[0_22px_70px_rgba(24,59,40,0.08)] xl:sticky xl:top-32 xl:self-start">
      <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#183B28]">
        Farm Discovery Account
      </p>

      <div className="mt-2 grid gap-1">
        {ACCOUNT_ITEMS.map(([label, Icon], index) => (
          <button
            key={label}
            className={cn(
              'relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-[#5F6A62] transition hover:bg-[#EAF5E7] hover:text-[#183B28]',
              index === 0 &&
                'bg-[#EAF5E7] text-[#183B28] before:absolute before:left-0 before:top-2 before:h-8 before:w-1 before:rounded-r-full before:bg-[#2D6741]'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}

        <button
          onClick={onSignOut}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-[#5F6A62] transition hover:bg-[#FFF3D9] hover:text-[#183B28]"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#D8E5D4] bg-[#EAF5E7] p-4">
        <p className="text-base font-black leading-tight text-[#183B28]">
          Explore farms first. Request produce safely.
        </p>
        <p className="mt-2 text-xs font-semibold leading-5 text-[#5F6A62]">
          The Harvest Place Ja keeps messages, requests, and future orders inside the platform.
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <Badge tone={isAdmin ? 'gold' : 'green'}>{isAdmin ? 'Admin access' : farmerStatus || 'Discovery member'}</Badge>
            <p className="mt-3 text-[11px] font-black text-[#183B28]">No public phone sharing</p>
          </div>
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-sm">
            <Image src="/logo.png" alt="The Harvest Place Ja" fill className="object-cover" sizes="80px" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function WelcomeCard({ displayName, userEmail }: { displayName: string; userEmail?: string }) {
  return (
    <Card className="relative min-h-[230px] overflow-hidden border-[#D8E5D4] bg-white p-0 shadow-[0_22px_70px_rgba(24,59,40,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_22%,rgba(223,167,90,0.22),transparent_18rem),linear-gradient(90deg,#fff_0%,rgba(255,255,255,0.96)_48%,rgba(234,245,231,0.45)_100%)]" />
      <div className="absolute right-0 top-0 hidden h-full w-1/2 opacity-95 md:block">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />
        <Image src="/logo.png" alt="The Harvest Place Ja" fill className="object-contain p-10 opacity-20" sizes="480px" />
      </div>

      <div className="relative z-10 p-7 lg:p-8">
        <p className="text-sm font-bold text-[#5F6A62]">Welcome back,</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#183B28] lg:text-4xl">
          {displayName || 'Harvest Explorer'}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-black text-[#DFA75A]">
          <Sparkles className="h-4 w-4" />
          Farm-first discovery account
        </div>
        <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-[#5F6A62]">
          Explore Jamaican farms, follow harvest updates, and send safe produce requests without sharing phone numbers,
          WhatsApp, email, or social media handles.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/farmer">Explore Farms</Button>
          <Button href="/ready-soon" variant="secondary" className="border-[#DFA75A]/45 bg-white/75">
            Join Fresh Alerts
          </Button>
          <Badge tone="green">{userEmail || 'Secure platform account'}</Badge>
        </div>
      </div>
    </Card>
  );
}

function DiscoveryScoreCard({
  farms,
  requests,
  alerts,
}: {
  farms: number;
  requests: number;
  alerts: number;
}) {
  return (
    <Card className="border-[#D8E5D4] bg-white p-7 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-[#D8E5D4] bg-[#EAF5E7] text-[#2D6741]">
          <Leaf className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#5F6A62]">Your Discovery Hub</p>
          <h2 className="mt-1 text-2xl font-black text-[#183B28]">Farm-first activity</h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <MiniStat value={farms} label="Farms" />
        <MiniStat value={requests} label="Requests" />
        <MiniStat value={alerts} label="Alerts" />
      </div>

      <Button href="/farmer" variant="secondary" className="mt-5 w-full border-[#D8E5D4]">
        View Farm Profiles
      </Button>
    </Card>
  );
}

function SafetyCard({ score }: { score: number }) {
  return (
    <Card className="border-[#F0D6A7] bg-gradient-to-br from-[#FFF3D9] via-white to-white p-7 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#2D6741] shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-black text-[#183B28]">Safety-first platform</p>
          <h2 className="mt-1 text-2xl font-black text-[#183B28]">{score}% Safe Flow</h2>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-[#5F6A62]">
        Requests stay inside the website. Direct contact sharing is blocked in customer-to-farmer messages.
      </p>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EAF5E7]">
        <div className="h-full rounded-full bg-[#2D6741]" style={{ width: `${score}%` }} />
      </div>
    </Card>
  );
}

function SafeRequestComposer({
  value,
  message,
  onChange,
  onSubmit,
}: {
  value: string;
  message: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const unsafe = Boolean(value.trim()) && containsOffPlatformContact(value);

  return (
    <Card className="border-[#D8E5D4] bg-white p-6 lg:p-7 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">Safe produce request</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
            Draft a platform-safe request
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62]">
            Customers can ask about availability, quantities, and pickup/delivery options without exchanging private contact details.
          </p>
        </div>
        <Badge tone={unsafe ? 'gold' : 'green'}>{unsafe ? 'Needs edit' : 'Safety ready'}</Badge>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: Hi Green Vale Farms, I would like to request callaloo for this weekend. Is it available?"
        className={cn(
          'mt-5 min-h-32 w-full rounded-[24px] border bg-white p-4 text-sm font-semibold leading-6 text-[#183B28] outline-none transition placeholder:text-[#5F6A62]/60 focus:ring-4',
          unsafe
            ? 'border-[#DFA75A] focus:ring-[#DFA75A]/15'
            : 'border-[#D8E5D4] focus:border-[#2D6741]/50 focus:ring-[#2D6741]/10'
        )}
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn('text-sm font-bold', unsafe ? 'text-[#8B5D18]' : 'text-[#5F6A62]')}>
          {unsafe
            ? 'For your safety, remove phone numbers, emails, links, social handles, and direct-contact phrases.'
            : 'Messages should stay inside The Harvest Place Ja.'}
        </p>
        <Button onClick={onSubmit}>Check Request</Button>
      </div>

      {message ? (
        <p className={cn('mt-4 rounded-2xl px-4 py-3 text-sm font-black', message.includes('safety') ? 'bg-[#FFF3D9] text-[#8B5D18]' : 'bg-[#EAF5E7] text-[#2D6741]')}>
          {message}
        </p>
      ) : null}
    </Card>
  );
}

function FreshAlertCard({
  alertTotal,
  subscriptionsLabel,
}: {
  alertTotal: number;
  subscriptionsLabel: string;
}) {
  return (
    <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#5F6A62]">Fresh Alerts</p>
          <h2 className="mt-1 text-2xl font-black text-[#183B28]">
            {alertTotal || 'No'} active alert{alertTotal === 1 ? '' : 's'}
          </h2>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-[#5F6A62]">
        {subscriptionsLabel}. Follow farms and receive harvest updates before requesting items.
      </p>
      <Button href="/ready-soon" variant="secondary" className="mt-5 w-full border-[#D8E5D4]">
        Manage Fresh Alerts
      </Button>
    </Card>
  );
}

function FollowedFarmsCard({ farms }: { farms: FarmSummary[] }) {
  return (
    <Card className="border-[#D8E5D4] bg-white p-6 lg:p-7 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">Explore farms to see what’s fresh</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#183B28]">Followed & suggested farms</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62]">
            Each farmer manages their own available produce. Choose a farm to view current harvests, request items, and follow future updates.
          </p>
        </div>
        <Button href="/farmer" variant="secondary" className="border-[#D8E5D4]">
          Explore Farms
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {farms.slice(0, 6).map((farm) => (
          <FarmCard key={farm.slug} farm={farm} />
        ))}
      </div>
    </Card>
  );
}

function FarmCard({ farm }: { farm: FarmSummary }) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-[#D8E5D4] bg-[#FFFEFC] shadow-[0_14px_38px_rgba(24,59,40,0.06)]">
      <div className="relative h-36 bg-[#EAF5E7]">
        <Image src={farm.image} alt={farm.farmName} fill className="object-cover" sizes="340px" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-[#2D6741] shadow-sm">
          {farm.itemCount} farm update{farm.itemCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-[-0.02em] text-[#183B28]">{farm.farmName}</h3>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-black text-[#5F6A62]">
              <MapPin className="h-3.5 w-3.5 text-[#2D6741]" />
              {farm.parish}
            </p>
          </div>
          <Heart className="h-5 w-5 text-[#DFA75A]" />
        </div>

        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-[#5F6A62]">{farm.story}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {farm.tags.slice(0, 3).map((tag) => (
            <span key={`${farm.slug}-${tag}`} className="rounded-full bg-[#EAF5E7] px-3 py-1 text-[10px] font-black text-[#2D6741]">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-2">
          <Button href={`/farms/${farm.slug}`} className="w-full">
            View Farm
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button href="/account" variant="secondary" className="border-[#D8E5D4] px-3 py-2 text-[11px]">
              Message on Platform
            </Button>
            <Button href="/ready-soon" variant="secondary" className="border-[#F0D6A7] bg-[#FFF3D9] px-3 py-2 text-[11px]">
              Follow This Farm
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SavedDeliveryAreasCard({
  profile,
  address,
}: {
  profile: CustomerProfile | null;
  address: string;
}) {
  return (
    <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-black text-[#183B28]">Saved Delivery Areas</h2>
        <button className="text-xs font-black text-[#2D6741]">Manage</button>
      </div>
      <AddressBlock
        label="Primary area"
        badge="Private"
        address={address || profile?.address || 'Add your delivery parish or area in profile settings'}
      />
      <AddressBlock label="Second area" address="Optional second delivery area" muted />
      <p className="mt-4 rounded-2xl bg-[#EAF5E7] px-4 py-3 text-xs font-bold leading-5 text-[#2D6741]">
        Your private delivery details are not shown publicly to farms or customers.
      </p>
    </Card>
  );
}

function AddressBlock({
  label,
  badge,
  address,
  muted = false,
}: {
  label: string;
  badge?: string;
  address: string;
  muted?: boolean;
}) {
  return (
    <div className={cn('mt-3 rounded-2xl border border-[#D8E5D4] bg-white p-4', muted && 'border-dashed bg-[#EAF5E7]/30')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-[#183B28]">{label}</p>
          {badge ? <Badge tone="green" className="py-0.5 text-[10px]">{badge}</Badge> : null}
        </div>
        <Pencil className="h-4 w-4 text-[#5F6A62]" />
      </div>
      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-5 text-[#5F6A62]">{address}</p>
    </div>
  );
}

function RecentHarvestsCard({ products }: { products: Product[] }) {
  const cards = products.length ? products : fallbackProduce();

  return (
    <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-black text-[#183B28]">Saved Harvest Previews</h2>
        <button className="text-xs font-black text-[#2D6741]">View Farms</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.slice(0, 4).map((product, index) => (
          <div key={`${product.id}-${index}`} className="relative rounded-2xl border border-[#D8E5D4] bg-white p-2 text-center">
            <Heart className="absolute right-2 top-2 h-3.5 w-3.5 text-[#DFA75A]" />
            <div className="relative mx-auto h-16 w-full overflow-hidden rounded-xl bg-[#EAF5E7]">
              <Image src={product.image_url || '/logo.png'} alt={product.name} fill className="object-cover" sizes="90px" />
            </div>
            <p className="mt-2 truncate text-[11px] font-black text-[#183B28]">{product.name}</p>
            <p className="truncate text-[10px] font-bold text-[#5F6A62]">{productFarmName(product)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentRequestsCard({
  orders,
  products,
}: {
  orders: FarmOrder[];
  products: Product[];
}) {
  const visible = orders.slice(0, 2);

  return (
    <Card className="border-[#D8E5D4] bg-white p-6 lg:p-7 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">Produce requests</p>
          <h2 className="text-xl font-black text-[#183B28]">Recent request activity</h2>
        </div>
        <Button href="/orders" variant="ghost" className="px-3 py-2">
          View All
        </Button>
      </div>

      {visible.length ? (
        <div className="grid gap-4">
          {visible.map((order, index) => (
            <RequestCard
              key={order.id}
              order={order}
              products={products.slice(index * 5, index * 5 + 5)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-[#D8E5D4] bg-[#EAF5E7]/35 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-[#2D6741] shadow-sm">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-black text-[#183B28]">No produce requests yet</h3>
          <p className="mt-2 text-sm font-semibold text-[#5F6A62]">
            Choose a farm profile, view that farm’s produce, and request items safely inside the platform.
          </p>
          <Button href="/farmer" className="mt-5">Explore Farms</Button>
        </div>
      )}
    </Card>
  );
}

function RequestCard({ order, products }: { order: FarmOrder; products: Product[] }) {
  const status = order.delivery_status || order.order_status || order.status || 'requested';

  return (
    <div className="rounded-[1.35rem] border border-[#D8E5D4] bg-white p-5 shadow-[0_10px_35px_rgba(24,59,40,0.05)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#183B28]">Request #HPJ-{shortIdLabel(order.id)}</h3>
            <StatusChip status={status} />
          </div>
          <p className="mt-2 text-xs font-bold text-[#5F6A62]">
            {formatDate(order.created_at)} • Safe platform conversation • {order.fulfillment_type || 'Request details pending'}
          </p>
        </div>
        <ChevronRight className="hidden h-5 w-5 text-[#5F6A62] md:block" />
      </div>

      <RequestTimeline status={status} />

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex -space-x-2">
          {(products.length ? products : fallbackProduce()).slice(0, 5).map((product, index) => (
            <ProductThumb key={`${product.name}-${index}`} product={product} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={`/orders/${order.id}`} className="px-5 py-2.5">View Request</Button>
          <Button href="/account" variant="secondary" className="px-5 py-2.5">Message on Platform</Button>
        </div>
      </div>
    </div>
  );
}

function RequestTimeline({ status }: { status: string }) {
  const steps = ['Requested', 'Farm Review', 'Availability', 'Confirmed'];
  const lower = status.toLowerCase();
  const active = lower.includes('confirm') || lower.includes('deliver')
    ? 3
    : lower.includes('available') || lower.includes('ready')
      ? 2
      : lower.includes('review') || lower.includes('pack')
        ? 1
        : 0;

  return (
    <div className="mt-5 grid grid-cols-4 gap-2">
      {steps.map((step, index) => (
        <div key={step} className="text-center">
          <div className={cn('mx-auto grid h-7 w-7 place-items-center rounded-full border text-[11px] font-black', index <= active ? 'border-[#2D6741] bg-[#2D6741] text-white' : 'border-[#D8E5D4] bg-white text-[#5F6A62]')}>
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

function FarmMessagesCard() {
  return (
    <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <h2 className="font-black text-[#183B28]">Farm Messages</h2>
      <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">
        Customer and farmer discussion should happen inside The Harvest Place Ja so requests can be tracked safely.
      </p>

      <div className="mt-5 grid gap-3">
        <MessageRule icon={<ShieldCheck className="h-5 w-5" />} title="No direct contact sharing" copy="Phone numbers, WhatsApp, emails, links, and social handles are blocked." />
        <MessageRule icon={<MessageCircle className="h-5 w-5" />} title="Platform messages only" copy="Farmers reply through their dashboard and customers reply through their account." />
        <MessageRule icon={<PackageCheck className="h-5 w-5" />} title="Requests stay recorded" copy="This helps with follow-ups, disputes, and future marketplace checkout." />
      </div>
    </Card>
  );
}

function MessageRule({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">{icon}</span>
      <span>
        <span className="block text-sm font-black text-[#183B28]">{title}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-[#5F6A62]">{copy}</span>
      </span>
    </div>
  );
}

function TrustSecurityCard() {
  return (
    <Card className="relative overflow-hidden border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="absolute right-4 top-6 grid h-24 w-24 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
        <ShieldCheck className="h-12 w-12" />
      </div>
      <h2 className="font-black text-[#183B28]">Trust & Safety</h2>
      <p className="mt-2 max-w-xl pr-24 text-sm font-semibold leading-6 text-[#5F6A62]">
        For safety, all produce requests, messages, and order discussions must stay inside The Harvest Place Ja.
      </p>
      <div className="mt-6 grid gap-4 pr-20 sm:grid-cols-2">
        <TrustLine icon={<LockKeyhole className="h-5 w-5" />} title="Contact sharing blocked" copy="No phone, WhatsApp, email, links, or social handles in requests." />
        <TrustLine icon={<Sprout className="h-5 w-5" />} title="Farm-first discovery" copy="Customers view a farm profile before requesting produce." />
        <TrustLine icon={<Truck className="h-5 w-5" />} title="Future delivery ready" copy="Checkout and delivery can be introduced later without changing the trust model." />
      </div>
    </Card>
  );
}

function SupportCard() {
  return (
    <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <h2 className="font-black text-[#183B28]">Support & Help</h2>
      <p className="mt-1 text-sm font-semibold text-[#5F6A62]">Need help with farms, requests, or account safety?</p>
      <div className="mt-4 grid gap-2">
        <SupportRow icon={<Headphones className="h-5 w-5" />} title="Message support" copy="Keep support discussion inside the platform" />
        <SupportRow icon={<ShieldCheck className="h-5 w-5" />} title="Trust & Safety Center" copy="Learn why direct contact sharing is blocked" />
        <SupportRow icon={<Leaf className="h-5 w-5" />} title="Farmer discovery help" copy="Find farms by parish, story, or harvest type" />
      </div>
    </Card>
  );
}

function ProfileSettingsCard({
  name,
  address,
  message,
  onName,
  onAddress,
  onSave,
}: {
  name: string;
  address: string;
  message: string;
  onName: (value: string) => void;
  onAddress: (value: string) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <div className="mb-5">
        <h2 className="font-black text-[#183B28]">Profile Settings</h2>
        <p className="mt-1 text-sm font-semibold text-[#5F6A62]">
          Keep your account details private while using platform-safe requests.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" value={name} onChange={onName} />
        <label className="grid gap-2 text-sm font-black text-[#183B28] md:col-span-2">
          Delivery parish / area
          <textarea
            value={address}
            onChange={(event) => onAddress(event.target.value)}
            className="min-h-24 rounded-2xl border border-[#D8E5D4] bg-white p-3 font-bold outline-none transition focus:border-[#2D6741]/50 focus:ring-4 focus:ring-[#2D6741]/10"
          />
        </label>
      </div>
      {message ? <p className="mt-4 text-sm font-bold text-[#2D6741]">{message}</p> : null}
      <Button onClick={onSave} className="mt-5">Save profile</Button>
    </Card>
  );
}

function AccessCard({
  email,
  isAdmin,
  farmerStatus,
  subscriptionsLabel,
  points,
}: {
  email?: string;
  isAdmin: boolean;
  farmerStatus?: string | null;
  subscriptionsLabel: string;
  points: number;
}) {
  return (
    <Card className="border-[#D8E5D4] bg-white p-6 shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <h2 className="font-black text-[#183B28]">Account Access</h2>
      <div className="mt-4 grid gap-3 text-sm font-bold text-[#5F6A62]">
        <InfoRow label="Email" value={email || 'Not set'} />
        <InfoRow label="Admin" value={isAdmin ? 'Approved' : 'No admin access'} />
        <InfoRow label="Farmer profile" value={farmerStatus || 'No profile'} />
        <InfoRow label="Fresh alerts" value={subscriptionsLabel} />
        <InfoRow label="Discovery points" value={`${points.toLocaleString()} points`} />
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
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

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-3 py-3">
      <p className="text-lg font-black text-[#183B28]">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#5F6A62]">{label}</p>
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

function SupportRow({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <button className="flex items-center justify-between gap-3 rounded-2xl p-3 text-left transition hover:bg-[#EAF5E7]">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[#183B28]">{title}</span>
        <span className="block text-xs font-semibold text-[#5F6A62]">{copy}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-[#5F6A62]" />
    </button>
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
