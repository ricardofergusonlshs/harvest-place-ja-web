'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Banknote,
  BarChart3,
  CheckCircle2,
  Clock,
  ImagePlus,
  Leaf,
  PackageCheck,
  RefreshCw,
  Save,
  ShoppingBag,
  Sprout,
  Store,
  Truck,
  UploadCloud,
  UserRound,
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
import {
  createFarmerProduct,
  fetchCurrentFarmerProfile,
  fetchFarmerOrderSummaries,
  fetchFarmerPayouts,
  fetchFarmerProducts,
  saveFarmerProfile,
  uploadProductImage,
} from '@/lib/services';
import { formatDateTime, formatJmd } from '@/lib/format';
import type {
  FarmerOrderSummary,
  FarmerPayout,
  FarmerProfile,
  Product,
} from '@/lib/types';

type Tab = 'dashboard' | 'profile' | 'products' | 'orders' | 'earnings';

const tabs: Array<{ value: Tab; label: string; icon: ReactNode }> = [
  { value: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'profile', label: 'Profile', icon: <UserRound className="h-4 w-4" /> },
  { value: 'products', label: 'Products', icon: <Sprout className="h-4 w-4" /> },
  { value: 'orders', label: 'Orders', icon: <Truck className="h-4 w-4" /> },
  { value: 'earnings', label: 'Earnings', icon: <Banknote className="h-4 w-4" /> },
];

export default function FarmerPage() {
  const { user, loading: authLoading, refreshRoles } = useAuth();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FarmerOrderSummary[]>([]);
  const [payouts, setPayouts] = useState<FarmerPayout[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const farmer = await fetchCurrentFarmerProfile();

      setProfile(farmer);

      if (!farmer) {
        setProducts([]);
        setOrders([]);
        setPayouts([]);
        return;
      }

      const [productRows, orderRows, payoutRows] = await Promise.all([
        fetchFarmerProducts(farmer.id),
        fetchFarmerOrderSummaries(farmer.id),
        fetchFarmerPayouts(farmer.id),
      ]);

      setProducts(productRows || []);
      setOrders(orderRows || []);
      setPayouts(payoutRows || []);
    } catch (err) {
      console.error('Farmer portal failed to load:', err);
      setProfile(null);
      setProducts([]);
      setOrders([]);
      setPayouts([]);
      setError('Farmer portal data could not be loaded right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    void refresh(false);
  }, [authLoading, user, refresh]);

  const earnings = useMemo(() => {
    return orders.reduce(
      (sum, item) => sum + Number(item.farmer_earning_amount || 0),
      0
    );
  }, [orders]);

  const pendingProducts = useMemo(() => {
    return products.filter((product) => {
      const status = String(product.approval_status || '').toLowerCase();
      return status && status !== 'approved';
    }).length;
  }, [products]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-7xl">
          <LoadingState label="Loading farmer market..." />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-5xl">
          <EmptyState
            title="Farmer sign-in required"
            subtitle="Sign in to submit a farm profile, list products, and monitor orders or earnings."
            action={<Button href="/auth?redirect=/farmer">Sign in</Button>}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <FarmerHero
          profile={profile}
          products={products.length}
          orders={orders.length}
          earnings={earnings}
          refreshing={refreshing}
          onRefresh={() => void refresh(true)}
        />

        <div className="mt-8">
          <SectionHeader
            eyebrow="Farmer portal"
            title="Grow with The Harvest Place Ja"
            subtitle="Submit your farmer profile, manage products, monitor farm orders, and view payout or earnings summaries."
            action={
              <Button
                onClick={() => void refresh(true)}
                variant="secondary"
                disabled={refreshing}
              >
                <RefreshCw className="h-4 w-4" />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            }
          />
        </div>

        {error ? (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition',
                tab === item.value
                  ? 'border-[#2D6741] bg-[#2D6741] text-white shadow-[0_12px_28px_rgba(45,103,65,0.22)]'
                  : 'border-[#D8E5D4] bg-white text-[#5F6A62] hover:border-[#2D6741]/40 hover:bg-[#F4F9F2] hover:text-[#183B28]'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {!profile ? (
          <FarmerProfileForm
            refresh={async () => {
              await refresh(true);
              await refreshRoles();
            }}
          />
        ) : (
          <>
            <ProfileStatusCard profile={profile} />

            {tab === 'dashboard' ? (
              <Dashboard
                products={products}
                orders={orders}
                earnings={earnings}
                payouts={payouts}
                pendingProducts={pendingProducts}
              />
            ) : null}

            {tab === 'profile' ? (
              <FarmerProfileForm
                existing={profile}
                refresh={async () => {
                  await refresh(true);
                  await refreshRoles();
                }}
              />
            ) : null}

            {tab === 'products' ? (
              <FarmerProducts
                profile={profile}
                products={products}
                refresh={() => refresh(true)}
              />
            ) : null}

            {tab === 'orders' ? <FarmerOrders orders={orders} /> : null}

            {tab === 'earnings' ? (
              <FarmerEarnings earnings={earnings} payouts={payouts} />
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

function FarmerHero({
  profile,
  products,
  orders,
  earnings,
  refreshing,
  onRefresh,
}: {
  profile: FarmerProfile | null;
  products: number;
  orders: number;
  earnings: number;
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
            <Leaf className="h-3 w-3" />
            Farmer marketplace
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            {profile ? `Welcome, ${profile.farm_name}.` : 'Start selling fresh Jamaican produce.'}
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            Create a farmer profile, submit products for approval, monitor farm order lines, and track estimated earnings.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/shop">View marketplace</Button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {refreshing ? 'Refreshing...' : 'Refresh portal'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
          <HeroStat label="Products" value={products} />
          <HeroStat label="Order lines" value={orders} />
          <HeroStat label="Earnings" value={formatJmd(earnings)} wide />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  wide,
}: {
  label: string;
  value: string | number;
  wide?: boolean;
}) {
  return (
    <div className={cn('rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur', wide && 'sm:col-span-1')}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function ProfileStatusCard({ profile }: { profile: FarmerProfile }) {
  return (
    <Card className="mb-6 rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge tone="gold">{profile.farm_name}</Badge>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
            {profile.farmer_name}
          </h2>

          <p className="mt-1 text-sm font-bold text-[#5F6A62]">
            {profile.parish || 'Parish not set'} • {profile.email || 'Email not set'}
          </p>
        </div>

        <StatusChip status={profile.verification_status} />
      </div>

      {profile.verification_status !== 'approved' ? (
        <p className="mt-4 rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] p-3 text-sm font-bold leading-6 text-[#8B5D18]">
          Your profile is saved. Product submissions may remain pending until admin verification is approved.
        </p>
      ) : (
        <p className="mt-4 rounded-2xl border border-[#2D6741]/20 bg-[#EAF5E7] p-3 text-sm font-bold leading-6 text-[#2D6741]">
          Your farmer profile is approved. You can submit and manage products in the marketplace.
        </p>
      )}
    </Card>
  );
}

function Dashboard({
  products,
  orders,
  earnings,
  payouts,
  pendingProducts,
}: {
  products: Product[];
  orders: FarmerOrderSummary[];
  earnings: number;
  payouts: FarmerPayout[];
  pendingProducts: number;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Metric icon={<Sprout className="h-5 w-5" />} label="Submitted products" value={products.length} />
      <Metric icon={<Clock className="h-5 w-5" />} label="Pending products" value={pendingProducts} />
      <Metric icon={<Truck className="h-5 w-5" />} label="Farm order lines" value={orders.length} />
      <Metric icon={<Banknote className="h-5 w-5" />} label="Estimated earnings" value={formatJmd(earnings)} />
      <Metric icon={<PackageCheck className="h-5 w-5" />} label="Payout records" value={payouts.length} />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </div>

      <p className="mt-4 text-3xl font-black tracking-[-0.035em] text-[#183B28]">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold text-[#5F6A62]">{label}</p>
    </Card>
  );
}

function FarmerProfileForm({
  existing,
  refresh,
}: {
  existing?: FarmerProfile;
  refresh: () => Promise<void>;
}) {
  const [farmName, setFarmName] = useState(existing?.farm_name || '');
  const [farmerName, setFarmerName] = useState(existing?.farmer_name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [parish, setParish] = useState(existing?.parish || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [bio, setBio] = useState(existing?.bio || '');
  const [payoutMethod, setPayoutMethod] = useState(
    existing?.payout_method || 'bank_transfer'
  );
  const [payoutDetails, setPayoutDetails] = useState(existing?.payout_details || '');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setMessage('');
    setError('');

    if (!farmName.trim() || !farmerName.trim()) {
      setError('Please enter both farm name and farmer name.');
      return;
    }

    setSaving(true);

    try {
      await saveFarmerProfile({
        farm_name: farmName.trim(),
        farmer_name: farmerName.trim(),
        phone: phone.trim(),
        parish: parish.trim(),
        address: address.trim(),
        bio: bio.trim(),
        payout_method: payoutMethod.trim(),
        payout_details: payoutDetails.trim(),
      });

      setMessage('Farmer profile saved for admin review.');
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Farmer profile could not be saved right now.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
      <Badge tone="gold">
        <Store className="h-3 w-3" />
        Farmer onboarding
      </Badge>

      <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
        {existing ? 'Update farmer profile' : 'Create farmer profile'}
      </h2>

      <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62]">
        Add your farm details so the marketplace team can review and approve your farmer profile.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Input label="Farm name" value={farmName} onChange={setFarmName} />
        <Input label="Farmer name" value={farmerName} onChange={setFarmerName} />
        <Input label="Phone" value={phone} onChange={setPhone} />
        <Input label="Parish" value={parish} onChange={setParish} />
        <Input label="Address" value={address} onChange={setAddress} />
        <Input label="Payout method" value={payoutMethod} onChange={setPayoutMethod} />

        <Textarea label="Bio" value={bio} onChange={setBio} />
        <Textarea
          label="Payout details"
          value={payoutDetails}
          onChange={setPayoutDetails}
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-2xl border border-[#2D6741]/20 bg-[#EAF5E7] px-4 py-3 text-sm font-black text-[#2D6741]">
          {message}
        </p>
      ) : null}

      <Button onClick={submit} disabled={saving} className="mt-6">
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save farmer profile'}
      </Button>
    </Card>
  );
}

function FarmerProducts({
  profile,
  products,
  refresh,
}: {
  profile: FarmerProfile;
  products: Product[];
  refresh: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('Vegetables');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('each');
  const [imageUrl, setImageUrl] = useState('');
  const [organic, setOrganic] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function upload(file: File | null) {
    if (!file) return;

    setNotice('');
    setError('');
    setUploading(true);

    try {
      const url = await uploadProductImage(file, `farmers/${profile.id}`, false);
      setImageUrl(url);
      setNotice('Product image uploaded.');
    } catch {
      setError('Image upload failed. You can paste an image URL instead.');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setNotice('');
    setError('');

    if (!name.trim() || !price.trim()) {
      setError('Please enter a product name and price.');
      return;
    }

    setSubmitting(true);

    try {
      await createFarmerProduct(profile, {
        name: name.trim(),
        price: Number(price),
        stock_quantity: Number(stock || 0),
        category: category.trim() || 'Fresh Produce',
        description: description.trim(),
        unit: unit.trim() || 'each',
        image_url: imageUrl.trim(),
        is_organic: organic,
      });

      setName('');
      setPrice('');
      setStock('0');
      setCategory('Vegetables');
      setDescription('');
      setUnit('each');
      setImageUrl('');
      setOrganic(false);

      setNotice('Product submitted for approval.');
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Product could not be submitted right now.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
        <Badge tone="green">
          <ImagePlus className="h-3 w-3" />
          Submit product
        </Badge>

        <div className="mt-5 grid gap-3">
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Price" value={price} onChange={setPrice} type="number" />
          <Input label="Stock" value={stock} onChange={setStock} type="number" />
          <Input label="Category" value={category} onChange={setCategory} />
          <Input label="Unit" value={unit} onChange={setUnit} />
          <Input label="Description" value={description} onChange={setDescription} />
          <Input label="Image URL" value={imageUrl} onChange={setImageUrl} />

          <label className="grid gap-2 text-sm font-black text-[#183B28]">
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void upload(event.target.files?.[0] || null)}
              className="rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] p-3 text-sm font-bold text-[#183B28]"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-black text-[#183B28]">
            <input
              type="checkbox"
              checked={organic}
              onChange={(event) => setOrganic(event.target.checked)}
            />
            Organic
          </label>

          {notice ? (
            <p className="rounded-2xl border border-[#2D6741]/20 bg-[#EAF5E7] px-4 py-3 text-sm font-black text-[#2D6741]">
              {notice}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
              {error}
            </p>
          ) : null}

          <Button onClick={submit} disabled={uploading || submitting}>
            <UploadCloud className="h-4 w-4" />
            {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit for approval'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {products.length ? (
          products.map((product) => (
            <Card
              key={product.id}
              className="rounded-[26px] border border-[#D8E5D4] bg-white p-5 shadow-[0_14px_40px_rgba(24,59,40,0.06)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black text-[#183B28]">{product.name}</p>
                  <p className="mt-1 text-sm font-bold text-[#5F6A62]">
                    {formatJmd(product.price)} • Stock {product.stock_quantity} •{' '}
                    {product.category}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusChip status={product.approval_status} />
                  <StatusChip status={product.product_status} />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No products submitted yet"
            subtitle="Submit your first fresh product for marketplace approval."
          />
        )}
      </div>
    </div>
  );
}

function FarmerOrders({ orders }: { orders: FarmerOrderSummary[] }) {
  if (!orders.length) {
    return (
      <EmptyState
        title="No farmer orders yet"
        subtitle="Order lines connected to your farmer profile will appear here."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order, index) => (
        <Card
          key={`${order.order_id}-${index}`}
          className="rounded-[26px] border border-[#D8E5D4] bg-white p-5 shadow-[0_14px_40px_rgba(24,59,40,0.06)]"
        >
          <p className="font-black text-[#183B28]">{order.product_name}</p>

          <p className="mt-1 text-sm font-bold text-[#5F6A62]">
            Order #{String(order.order_id).slice(0, 6).toUpperCase()} • Qty{' '}
            {order.quantity}
          </p>

          <p className="mt-3 text-lg font-black text-[#2D6741]">
            Earned {formatJmd(order.farmer_earning_amount)}
          </p>
        </Card>
      ))}
    </div>
  );
}

function FarmerEarnings({
  earnings,
  payouts,
}: {
  earnings: number;
  payouts: FarmerPayout[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
        <Badge tone="gold">
          <Banknote className="h-3 w-3" />
          Earnings
        </Badge>

        <p className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#183B28]">
          {formatJmd(earnings)}
        </p>

        <p className="mt-2 text-sm font-bold leading-6 text-[#5F6A62]">
          Estimated from order item farmer earning amounts.
        </p>
      </Card>

      <div className="grid gap-3">
        {payouts.length ? (
          payouts.map((payout) => (
            <Card
              key={payout.id}
              className="rounded-[26px] border border-[#D8E5D4] bg-white p-5 shadow-[0_14px_40px_rgba(24,59,40,0.06)]"
            >
              <p className="font-black text-[#183B28]">
                {formatJmd(payout.net_amount)}
              </p>

              <p className="mt-1 text-sm font-bold text-[#5F6A62]">
                {payout.payout_method || 'Payout'} •{' '}
                {formatDateTime(payout.created_at)}
              </p>

              <div className="mt-3">
                <StatusChip status={payout.payout_status} />
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No payouts yet"
            subtitle="Payout records will appear when the marketplace creates payment summaries."
          />
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#183B28]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[52px] rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] px-4 py-3 text-sm font-bold text-[#183B28] outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#183B28] md:col-span-2">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] p-4 text-sm font-bold leading-6 text-[#183B28] outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
      />
    </label>
  );
}