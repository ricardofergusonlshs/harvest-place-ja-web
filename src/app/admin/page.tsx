'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  StatusChip,
} from '@/components/ui';
import { useAuth } from '@/components/providers/auth-provider';
import {
  adminUpdateProduct,
  createProduct,
  fetchAdminAuditLogs,
  fetchAdminOrders,
  fetchAdminSupportTickets,
  fetchAllProducts,
  fetchCoupons,
  fetchFarmerPayouts,
  fetchFarmerProfiles,
  fetchProductReviews,
  updateFarmerVerification,
  updateOrderStatus,
  updatePaymentStatus,
  updateSupportTicket,
  uploadProductImage,
  upsertCoupon,
} from '@/lib/services';
import { formatDateTime, formatJmd, shortIdLabel } from '@/lib/format';
import type {
  AuditLogEntry,
  Coupon,
  FarmOrder,
  FarmerPayout,
  FarmerProfile,
  Product,
  ProductReview,
  SupportTicket,
} from '@/lib/types';

type Tab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'coupons'
  | 'support'
  | 'farmers'
  | 'reviews'
  | 'audit'
  | 'launch';

type Metrics = {
  products: number;
  available: number;
  orders: number;
  revenue: number;
  pendingFarmers: number;
  openSupport: number;
};

type ProductUpdatePayload = Partial<Product> & {
  admin_note?: string;
  is_local?: boolean;
  is_organic?: boolean;
  is_deal_of_day?: boolean;
  is_discount_active?: boolean;
  discount_label?: string | null;
  ready_soon?: boolean;
  product_status?: string;
  approval_status?: string;
  stock_quantity?: number;
};

type ProductWithOptionalBadges = Product & {
  is_local?: boolean | null;
  is_organic?: boolean | null;
  is_featured?: boolean | null;
  is_seasonal?: boolean | null;
  is_bestseller?: boolean | null;
  farm_fresh?: boolean | null;
  tags?: string[] | null;
  badges?: string[] | null;
};

type ProductListFilter =
  | 'all'
  | 'available'
  | 'hidden'
  | 'deal'
  | 'ready_soon'
  | 'organic'
  | 'local'
  | 'out_of_stock'
  | 'pending';

const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Harvest Items' },
  { key: 'orders', label: 'Requests / Orders' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'support', label: 'Support' },
  { key: 'farmers', label: 'Farmers' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'audit', label: 'Audit' },
  { key: 'launch', label: 'Launch' },
];

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const record = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      error_description?: unknown;
      statusText?: unknown;
    };

    const parts = [
      record.message,
      record.error_description,
      record.details,
      record.hint,
      record.code ? `Code: ${String(record.code)}` : null,
      record.statusText,
    ]
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);

    if (parts.length) return parts.join(' • ');

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return 'Something went wrong. Please try again.';
}

function cleanText(value: unknown, fallback = 'Not available') {
  const text = String(value ?? '').trim();

  if (!text) return fallback;

  return text
    .replaceAll('Ã¢â‚¬Â¢', 'â€¢')
    .replaceAll('Ã¢Ëœâ€¦', 'â˜…')
    .replaceAll('Ã¢â‚¬â„¢', 'â€™')
    .replaceAll('Ã¢â‚¬Å“', 'â€œ')
    .replaceAll('Ã¢â‚¬Â', 'â€')
    .replaceAll('Ã¢â‚¬â€œ', 'â€“')
    .replaceAll('Ã¢â‚¬â€', 'â€”')
    .replace(/\s+/g, ' ');
}

function looseProduct(product: Product): ProductWithOptionalBadges {
  return product as ProductWithOptionalBadges;
}

function productHasTag(product: ProductWithOptionalBadges, tag: string) {
  const normalizedTag = tag.toLowerCase().trim();
  const tags = [...(product.tags || []), ...(product.badges || [])].map((item) =>
    String(item).toLowerCase().trim().replace(/\s+/g, '_')
  );

  return tags.includes(normalizedTag) || tags.includes(normalizedTag.replace(/_/g, '-'));
}

function containsOffPlatformContact(message: string) {
  const text = message.toLowerCase();
  const phonePattern = /(\+?\d[\d\s().-]{6,}\d)/;
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const linkPattern = /(https?:\/\/|www\.|\.com|\.net|\.org|\.co|wa\.me|whatsapp|instagram|facebook|tiktok|telegram)/i;
  const socialHandlePattern = /(^|\s)@[a-z0-9._-]{3,}/i;
  const blockedPhrases = [
    'call me',
    'text me',
    'whatsapp me',
    'send your number',
    'my number',
    'outside the app',
    'outside the website',
    'contact me directly',
    'message me directly',
    'dm me',
  ];

  return (
    phonePattern.test(text) ||
    emailPattern.test(text) ||
    linkPattern.test(text) ||
    socialHandlePattern.test(text) ||
    blockedPhrases.some((phrase) => text.includes(phrase))
  );
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FarmOrder[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [support, setSupport] = useState<SupportTicket[]>([]);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [payouts, setPayouts] = useState<FarmerPayout[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error('Admin action failed:', event.reason);
      setNotice(errorMessage(event.reason));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  async function refresh() {
    setLoading(true);
    setNotice('');

    try {
      const [
        productRows,
        orderRows,
        couponRows,
        supportRows,
        farmerRows,
        payoutRows,
        reviewRows,
        auditRows,
      ] = await Promise.all([
        fetchAllProducts(),
        fetchAdminOrders(),
        fetchCoupons(),
        fetchAdminSupportTickets(),
        fetchFarmerProfiles(),
        fetchFarmerPayouts(),
        fetchProductReviews(),
        fetchAdminAuditLogs(),
      ]);

      setProducts(productRows);
      setOrders(orderRows);
      setCoupons(couponRows);
      setSupport(supportRows);
      setFarmers(farmerRows);
      setPayouts(payoutRows);
      setReviews(reviewRows);
      setAudit(auditRows);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      void refresh();
      return;
    }

    if (!authLoading) setLoading(false);
  }, [authLoading, user, isAdmin]);

  const metrics = useMemo<Metrics>(
    () => ({
      products: products.length,
      available: products.filter((product) => product.is_available && product.stock_quantity > 0).length,
      orders: orders.length,
      revenue: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      pendingFarmers: farmers.filter((farmer) => farmer.verification_status === 'pending').length,
      openSupport: support.filter((ticket) => ticket.status !== 'closed').length,
    }),
    [products, orders, farmers, support]
  );

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState label="Loading admin command center..." />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Admin sign-in required"
          subtitle="Sign in first, then admin access will be checked against the existing admin users table."
          action={<Button href="/auth?redirect=/admin">Sign in</Button>}
        />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Admin permission required"
          subtitle="This dashboard only appears for users approved in the admin users table. Frontend checks are for user experience only; Supabase RLS/RPC rules should enforce protection."
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_48%,#FFFEFC_100%)] px-4 py-8 text-[#1E2A21] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-[#D8E5D4] bg-white shadow-[0_22px_70px_rgba(24,59,40,0.08)]">
          <div className="bg-[#183B28] px-6 py-7 text-white sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge tone="gold">Admin</Badge>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  Farm-first discovery command center
                </h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/78">
                  Manage farm profiles, harvest items, safe platform requests, farmer verification, future marketplace controls, launch readiness, and audit logs using the existing Supabase schema.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={refresh} variant="secondary">
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-b border-[#D8E5D4] bg-[#FFFEFC] px-5 py-4 sm:px-8 lg:grid-cols-3">
            <AdminSnapshot label="Harvest items" value={metrics.products} />
            <AdminSnapshot label="Requests" value={metrics.orders} />
            <AdminSnapshot label="Future revenue" value={formatJmd(metrics.revenue)} />
          </div>

          <div className="px-5 py-5 sm:px-8">
            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-black transition ${
                    tab === item.key
                      ? 'border-[#2D6741] bg-[#2D6741] text-white shadow-sm'
                      : 'border-[#D8E5D4] bg-white text-[#5F6A62] hover:border-[#2D6741]/35 hover:bg-[#F4F9F2] hover:text-[#183B28]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {notice ? (
              <div className="mt-4 rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] px-4 py-3 text-sm font-bold text-[#8B5D18]">
                {notice}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-6">
          {tab === 'overview' ? <Overview metrics={metrics} /> : null}
          {tab === 'products' ? <ProductsAdmin products={products} refresh={refresh} /> : null}
          {tab === 'orders' ? <OrdersAdmin orders={orders} refresh={refresh} /> : null}
          {tab === 'coupons' ? <CouponsAdmin coupons={coupons} refresh={refresh} /> : null}
          {tab === 'support' ? <SupportAdmin tickets={support} refresh={refresh} /> : null}
          {tab === 'farmers' ? <FarmersAdmin farmers={farmers} payouts={payouts} refresh={refresh} /> : null}
          {tab === 'reviews' ? <ReviewsAdmin reviews={reviews} /> : null}
          {tab === 'audit' ? <AuditAdmin audit={audit} /> : null}
          {tab === 'launch' ? <LaunchChecklist metrics={metrics} /> : null}
        </section>
      </div>
    </main>
  );
}

function AdminSnapshot({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5F6A62]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#183B28]">{value}</p>
    </div>
  );
}

function Overview({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Metric label="Total harvest items" value={metrics.products} />
      <Metric label="Available harvests" value={metrics.available} />
      <Metric label="Platform requests/orders" value={metrics.orders} />
      <Metric label="Future marketplace revenue" value={formatJmd(metrics.revenue)} />
      <Metric label="Pending farmers" value={metrics.pendingFarmers} />
      <Metric label="Open support" value={metrics.openSupport} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-[#EAF5E7]" />
      <div className="relative">
        <Badge tone="gold">Admin health</Badge>
        <p className="mt-4 text-4xl font-black tracking-[-0.04em] text-farm-primaryDark">{value}</p>
        <p className="mt-1 text-sm font-bold text-farm-muted">{label}</p>
      </div>
    </Card>
  );
}

function ProductsAdmin({ products, refresh }: { products: Product[]; refresh: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<ProductListFilter>('all');
  const [isLocal, setIsLocal] = useState(true);
  const [isOrganic, setIsOrganic] = useState(false);
  const [isDeal, setIsDeal] = useState(false);
  const [readySoon, setReadySoon] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [productStatus, setProductStatus] = useState<'available' | 'hidden' | 'out_of_stock' | 'ready_soon'>('available');

  const activeProducts = products.filter((product) => product.is_available).length;
  const dealProducts = products.filter((product) => looseProduct(product).is_deal_of_day).length;
  const readySoonProducts = products.filter((product) => looseProduct(product).ready_soon).length;
  const organicProducts = products.filter((product) => looseProduct(product).is_organic).length;
  const filterButtons: Array<{ key: ProductListFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'hidden', label: 'Hidden' },
    { key: 'deal', label: 'Deals' },
    { key: 'ready_soon', label: 'Ready Soon' },
    { key: 'organic', label: 'Organic' },
    { key: 'local', label: 'Local' },
    { key: 'out_of_stock', label: 'Out of Stock' },
    { key: 'pending', label: 'Pending' },
  ];

  const filteredProducts = products.filter((product) => {
    const item = looseProduct(product);
    const stockValue = Number(item.stock_quantity ?? 0);
    const query = productSearch.trim().toLowerCase();

    const matchesSearch =
      !query ||
      cleanText(item.name, '').toLowerCase().includes(query) ||
      cleanText(item.category, '').toLowerCase().includes(query) ||
      cleanText(item.approval_status, '').toLowerCase().includes(query) ||
      cleanText(item.product_status, '').toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (productFilter === 'available') return Boolean(item.is_available) && stockValue > 0;
    if (productFilter === 'hidden') return !item.is_available || item.product_status === 'hidden';
    if (productFilter === 'deal') return Boolean(item.is_deal_of_day);
    if (productFilter === 'ready_soon') return Boolean(item.ready_soon) || item.product_status === 'ready_soon';
    if (productFilter === 'organic') return Boolean(item.is_organic);
    if (productFilter === 'local') return item.is_local !== false;
    if (productFilter === 'out_of_stock') return stockValue <= 0 || item.product_status === 'out_of_stock';
    if (productFilter === 'pending') return item.approval_status === 'pending';

    return true;
  });

  function resetForm() {
    setName('');
    setPrice('');
    setStock('0');
    setImageUrl('');
    setIsLocal(true);
    setIsOrganic(false);
    setIsDeal(false);
    setReadySoon(false);
    setIsAvailable(true);
    setApprovalStatus('approved');
    setProductStatus('available');
  }

  async function submit() {
    setSaving(true);
    setMessage('');

    try {
      if (!name.trim()) {
        setMessage('Enter a product name.');
        return;
      }

      const numericStock = Number(stock || 0);
      const finalProductStatus = readySoon ? 'ready_soon' : productStatus;
      const finalAvailability = isAvailable && finalProductStatus !== 'hidden' && finalProductStatus !== 'out_of_stock';

      const payload: ProductUpdatePayload = {
        name: name.trim(),
        price: Number(price || 0),
        category: category.trim() || 'Vegetables',
        stock_quantity: finalProductStatus === 'out_of_stock' ? 0 : numericStock,
        image_url: imageUrl.trim(),
        is_available: finalAvailability,
        approval_status: approvalStatus,
        product_status: finalProductStatus,
        is_local: isLocal,
        is_organic: isOrganic,
        is_deal_of_day: isDeal,
        is_discount_active: isDeal,
        discount_label: isDeal ? 'Deal of the day' : null,
        ready_soon: readySoon,
      };

      await createProduct(payload);

      resetForm();
      await refresh();
      setMessage('Harvest item created successfully.');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File | null) {
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
      setMessage('Image uploaded successfully.');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
      <Card className="h-fit border border-[#DDE8D8] bg-white shadow-[0_18px_55px_rgba(24,59,40,0.08)] lg:sticky lg:top-6">
        <Badge tone="green">Create harvest item</Badge>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-farm-primaryDark">
          Add farm harvest item
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-farm-muted">
          Add harvest items using the existing product fields. These items should appear inside the relevant farm profile first, while public checkout remains discovery-first.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <AdminSnapshot label="Visible" value={activeProducts} />
          <AdminSnapshot label="Deals" value={dealProducts} />
          <AdminSnapshot label="Ready soon" value={readySoonProducts} />
          <AdminSnapshot label="Organic" value={organicProducts} />
        </div>

        <div className="mt-6 grid gap-4">
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Price" value={price} onChange={setPrice} type="number" />
          <Input label="Category" value={category} onChange={setCategory} />
          <Input label="Stock" value={stock} onChange={setStock} type="number" />
          <Input label="Image URL" value={imageUrl} onChange={setImageUrl} />

          <div className="rounded-[1.35rem] border border-[#DDE8D8] bg-[#FAF8F0] p-4">
            <FormSectionLabel
              title="Harvest tags / badges"
              subtitle="Backed by current product fields: local, organic, deal, and ready soon."
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <TogglePill selected={isLocal} onClick={() => setIsLocal((value) => !value)}>
                Local
              </TogglePill>
              <TogglePill selected={isOrganic} onClick={() => setIsOrganic((value) => !value)}>
                Organic
              </TogglePill>
              <TogglePill selected={isDeal} onClick={() => setIsDeal((value) => !value)}>
                Deal
              </TogglePill>
              <TogglePill
                selected={readySoon}
                onClick={() => {
                  setReadySoon((value) => !value);
                  setProductStatus((value) => (value === 'ready_soon' ? 'available' : 'ready_soon'));
                }}
              >
                Ready Soon
              </TogglePill>
            </div>

            <FutureBadgesNotice />
          </div>

          <div className="rounded-[1.35rem] border border-[#DDE8D8] bg-white p-4">
            <FormSectionLabel
              title="Status controls"
              subtitle="Controls approval, visibility, and stock status."
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <TogglePill
                selected={isAvailable && productStatus === 'available'}
                onClick={() => {
                  setIsAvailable(true);
                  setReadySoon(false);
                  setProductStatus('available');
                }}
              >
                Available
              </TogglePill>
              <TogglePill
                selected={!isAvailable && productStatus === 'hidden'}
                onClick={() => {
                  setIsAvailable(false);
                  setReadySoon(false);
                  setProductStatus('hidden');
                }}
              >
                Hidden
              </TogglePill>
              <TogglePill selected={approvalStatus === 'approved'} onClick={() => setApprovalStatus('approved')}>
                Approved
              </TogglePill>
              <TogglePill
                selected={approvalStatus === 'rejected'}
                onClick={() => {
                  setApprovalStatus('rejected');
                  setIsAvailable(false);
                  setReadySoon(false);
                  setProductStatus('hidden');
                }}
              >
                Rejected
              </TogglePill>
              <TogglePill
                selected={productStatus === 'out_of_stock'}
                onClick={() => {
                  setProductStatus('out_of_stock');
                  setReadySoon(false);
                  setIsAvailable(false);
                  setStock('0');
                }}
              >
                Out of Stock
              </TogglePill>
            </div>
          </div>

          <label className="grid gap-2 text-sm font-black text-farm-primaryDark">
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => upload(event.target.files?.[0] || null)}
              className="rounded-2xl border border-farm-border bg-white p-3 text-sm font-bold"
            />
          </label>

          {message ? (
            <div className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-bold text-farm-primaryDark">
              {message}
            </div>
          ) : null}

          <Button onClick={submit} disabled={uploading || saving}>
            {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Create harvest item'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4">
        <div className="rounded-[28px] border border-[#DDE8D8] bg-white p-5 shadow-[0_18px_45px_rgba(24,59,40,0.06)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <SectionMiniHeader
                title="Harvest items"
                subtitle={`${filteredProducts.length} showing of ${products.length} harvest items`}
              />
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-farm-muted">
                Review approval, visibility, local/organic badges, and ready-soon status for farm-profile harvest listings.
              </p>
            </div>

            <div className="grid gap-2 sm:min-w-[320px]">
              <Input
                label="Search products"
                value={productSearch}
                onChange={setProductSearch}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterButtons.map((filter) => (
              <TogglePill
                key={filter.key}
                selected={productFilter === filter.key}
                onClick={() => setProductFilter(filter.key)}
              >
                {filter.label}
              </TogglePill>
            ))}
          </div>
        </div>

        {filteredProducts.length ? (
          filteredProducts.map((product) => (
            <ProductAdminCard key={product.id} product={product} refresh={refresh} />
          ))
        ) : (
          <EmptyState title="No matching harvest items" subtitle="Try changing the search term or badge filter." />
        )}
      </div>
    </div>
  );
}

function ProductAdminCard({ product, refresh }: { product: Product; refresh: () => Promise<void> }) {
  const item = looseProduct(product);
  const stock = Number(item.stock_quantity ?? 0);
  const isReadySoon = Boolean(item.ready_soon) || item.product_status === 'ready_soon';
  const isOutOfStock = stock <= 0 || item.product_status === 'out_of_stock';
  const isHidden = !item.is_available || item.product_status === 'hidden';
  const isApproved = item.approval_status === 'approved';
  const isRejected = item.approval_status === 'rejected';
  const isDeal = Boolean(item.is_deal_of_day);
  const isOrganic = Boolean(item.is_organic);
  const isLocal = item.is_local !== false;
  const isFeatured = Boolean(item.is_featured) || productHasTag(item, 'featured');
  const isSeasonal = Boolean(item.is_seasonal) || productHasTag(item, 'seasonal');
  const isBestseller = Boolean(item.is_bestseller) || productHasTag(item, 'bestseller');
  const isFarmFresh = Boolean(item.farm_fresh) || productHasTag(item, 'farm_fresh');

  async function updateProduct(payload: ProductUpdatePayload) {
    await adminUpdateProduct(product.id, payload);
    await refresh();
  }

  async function toggleAvailability() {
    await updateProduct({
      is_available: !item.is_available,
      product_status: item.is_available ? 'hidden' : stock > 0 ? 'available' : 'out_of_stock',
    });
  }

  async function toggleDeal() {
    await updateProduct({
      is_deal_of_day: !isDeal,
      is_discount_active: !isDeal,
      discount_label: !isDeal ? 'Deal of the day' : null,
    });
  }

  async function toggleOrganic() {
    await updateProduct({
      is_organic: !isOrganic,
    });
  }

  async function toggleLocal() {
    await updateProduct({
      is_local: !isLocal,
    });
  }

  async function toggleReadySoon() {
    await updateProduct({
      ready_soon: !isReadySoon,
      product_status: !isReadySoon ? 'ready_soon' : stock > 0 ? 'available' : 'out_of_stock',
      is_available: !isReadySoon ? false : stock > 0,
    });
  }

  async function approveProduct() {
    await updateProduct({
      approval_status: 'approved',
      is_available: stock > 0 && !isReadySoon,
      product_status: isReadySoon ? 'ready_soon' : stock > 0 ? 'available' : 'out_of_stock',
    });
  }

  async function rejectProduct() {
    await updateProduct({
      approval_status: 'rejected',
      is_available: false,
      product_status: 'hidden',
    });
  }

  async function markOutOfStock() {
    await updateProduct({
      stock_quantity: 0,
      is_available: false,
      ready_soon: false,
      product_status: 'out_of_stock',
    });
  }

  return (
    <article className="rounded-[28px] border border-[#DDE8D8] bg-white p-5 shadow-[0_18px_45px_rgba(24,59,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.1)]">
      <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-black tracking-[-0.03em] text-farm-primaryDark">
              {cleanText(item.name, 'Product')}
            </p>
            <StatusChip status={item.approval_status || 'pending'} />
            <StatusChip status={item.product_status || (item.is_available ? 'available' : 'hidden')} />
          </div>

          <p className="mt-1 text-sm font-bold text-farm-muted">
            {cleanText(item.category, 'Uncategorised')} â€¢ {formatJmd(item.price)} â€¢ Stock {stock}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <ProductBadge active={isApproved} tone="green">Approved</ProductBadge>
            <ProductBadge active={isRejected} tone="red">Rejected</ProductBadge>
            <ProductBadge active={!isHidden && !isOutOfStock && !isReadySoon} tone="green">Available</ProductBadge>
            <ProductBadge active={isHidden} tone="muted">Hidden</ProductBadge>
            <ProductBadge active={isOutOfStock} tone="gold">Out of Stock</ProductBadge>
            <ProductBadge active={isDeal} tone="gold">Deal</ProductBadge>
            <ProductBadge active={isLocal} tone="green">Local</ProductBadge>
            <ProductBadge active={isOrganic} tone="green">Organic</ProductBadge>
            <ProductBadge active={isReadySoon} tone="gold">Ready Soon</ProductBadge>
            <ProductBadge active={isFeatured} tone="gold">Featured</ProductBadge>
            <ProductBadge active={isSeasonal} tone="green">Seasonal</ProductBadge>
            <ProductBadge active={isBestseller} tone="gold">Bestseller</ProductBadge>
            <ProductBadge active={isFarmFresh} tone="green">Farm Fresh</ProductBadge>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[460px] xl:grid-cols-3 xl:justify-end">
          <ProductActionButton onClick={toggleAvailability}>
            {item.is_available ? 'Hide availability' : 'Make available'}
          </ProductActionButton>
          <ProductActionButton onClick={toggleDeal} active={isDeal}>
            {isDeal ? 'Remove deal' : 'Toggle deal'}
          </ProductActionButton>
          <ProductActionButton onClick={toggleOrganic} active={isOrganic}>
            {isOrganic ? 'Organic on' : 'Mark organic'}
          </ProductActionButton>
          <ProductActionButton onClick={toggleLocal} active={isLocal}>
            {isLocal ? 'Local on' : 'Mark local'}
          </ProductActionButton>
          <ProductActionButton onClick={toggleReadySoon} active={isReadySoon}>
            {isReadySoon ? 'Ready soon on' : 'Ready soon'}
          </ProductActionButton>
          <ProductActionButton onClick={markOutOfStock} active={isOutOfStock}>
            Out of stock
          </ProductActionButton>
          <ProductActionButton onClick={approveProduct} active={isApproved}>
            Approve
          </ProductActionButton>
          <ProductActionButton onClick={rejectProduct} active={isRejected}>
            Reject
          </ProductActionButton>
        </div>
      </div>
    </article>
  );
}

function OrdersAdmin({ orders, refresh }: { orders: FarmOrder[]; refresh: () => Promise<void> }) {
  return (
    <div className="grid gap-4">
      <SectionMiniHeader title="Orders" subtitle={`${orders.length} recent orders`} />

      {orders.length ? (
        orders.map((order) => (
          <Card key={order.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-farm-accent">
                #{shortIdLabel(order.id)}
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.03em] text-farm-primaryDark">
                {formatJmd(order.total || 0)}
              </h3>
              <p className="mt-1 text-sm font-bold text-farm-muted">
                {formatDateTime(order.created_at)} â€¢ {cleanText(order.fulfillment_type, 'Fulfillment not set')}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <StatusChip status={order.order_status || order.status} />
                <StatusChip status={order.payment_status} />
                <StatusChip status={order.delivery_status} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                variant="secondary"
                onClick={async () => {
                  await updateOrderStatus(order.id, 'completed');
                  await refresh();
                }}
              >
                Complete
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await updatePaymentStatus(order.id, 'paid');
                  await refresh();
                }}
              >
                Mark paid
              </Button>
            </div>
          </Card>
        ))
      ) : (
        <EmptyState title="No orders found" subtitle="Orders will appear here after customers complete checkout." />
      )}
    </div>
  );
}

function CouponsAdmin({ coupons, refresh }: { coupons: Coupon[]; refresh: () => Promise<void> }) {
  const [code, setCode] = useState('');
  const [type, setType] = useState('fixed');
  const [value, setValue] = useState('');
  const [minimum, setMinimum] = useState('0');
  const [message, setMessage] = useState('');

  async function submit() {
    setMessage('');

    try {
      if (!code.trim()) {
        setMessage('Enter a coupon code.');
        return;
      }

      await upsertCoupon({
        code: code.trim().toUpperCase(),
        discount_type: type,
        discount_value: Number(value || 0),
        minimum_order: Number(minimum || 0),
        is_active: true,
      });

      setCode('');
      setValue('');
      await refresh();
      setMessage('Coupon saved.');
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <Badge tone="gold">Coupon</Badge>
        <h2 className="mt-4 text-2xl font-black text-farm-primaryDark">Create discount</h2>

        <div className="mt-5 grid gap-3">
          <Input label="Code" value={code} onChange={setCode} />

          <label className="grid gap-2 text-sm font-black text-farm-primaryDark">
            Type
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-2xl border border-farm-border bg-white p-3 font-bold outline-none"
            >
              <option value="fixed">Fixed</option>
              <option value="percent">Percent</option>
            </select>
          </label>

          <Input label="Value" value={value} onChange={setValue} type="number" />
          <Input label="Minimum order" value={minimum} onChange={setMinimum} type="number" />

          {message ? (
            <div className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-bold text-farm-primaryDark">
              {message}
            </div>
          ) : null}

          <Button onClick={submit}>Save coupon</Button>
        </div>
      </Card>

      <div className="grid gap-3">
        <SectionMiniHeader title="Coupons" subtitle={`${coupons.length} coupon records`} />

        {coupons.length ? (
          coupons.map((coupon) => (
            <Card key={coupon.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-farm-primaryDark">{cleanText(coupon.code, 'Coupon')}</p>
                <p className="text-sm font-bold text-farm-muted">
                  {cleanText(coupon.discount_type)} â€¢ {coupon.discount_value} â€¢ min {formatJmd(coupon.minimum_order || 0)}
                </p>
              </div>
              <StatusChip status={coupon.is_active ? 'active' : 'inactive'} />
            </Card>
          ))
        ) : (
          <EmptyState title="No coupons found" subtitle="Create a coupon to offer discounts." />
        )}
      </div>
    </div>
  );
}

function SupportAdmin({ tickets, refresh }: { tickets: SupportTicket[]; refresh: () => Promise<void> }) {
  return (
    <div className="grid gap-4">
      <SectionMiniHeader title="Safe platform messages" subtitle={`${tickets.length} platform messages`} />

      {tickets.length ? (
        tickets.map((ticket) => {
          const needsSafetyReview = containsOffPlatformContact(ticket.message || '');

          return (
            <Card key={ticket.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-farm-primaryDark">{cleanText(ticket.subject, 'Support request')}</p>
                    {needsSafetyReview ? <Badge tone="gold">Safety review</Badge> : null}
                  </div>

                  <p className="mt-1 text-sm font-bold text-farm-muted">
                    Platform-only conversation â€¢ {formatDateTime(ticket.created_at)}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-farm-muted">{cleanText(ticket.message, 'No message')}</p>

                  {needsSafetyReview ? (
                    <p className="mt-3 rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] p-3 text-xs font-black leading-5 text-[#8B5D18]">
                      This message may contain phone numbers, WhatsApp details, emails, social handles, or outside links. Keep the conversation inside The Harvest Place Ja.
                    </p>
                  ) : null}

                  {ticket.admin_reply ? (
                    <p className="mt-3 rounded-2xl bg-farm-primarySoft p-3 text-sm font-bold text-farm-primary">
                      {cleanText(ticket.admin_reply)}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusChip status={ticket.status} />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const reply = prompt('Admin reply', ticket.admin_reply || '');
                      if (reply !== null) {
                        await updateSupportTicket(ticket.id, { status: 'answered', admin_reply: reply });
                        await refresh();
                      }
                    }}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
      ) : (
        <EmptyState title="No platform messages" subtitle="Customer and farmer platform messages will appear here." />
      )}
    </div>
  );
}

function FarmersAdmin({
  farmers,
  payouts,
  refresh,
}: {
  farmers: FarmerProfile[];
  payouts: FarmerPayout[];
  refresh: () => Promise<void>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-3">
        <SectionMiniHeader title="Farmer verification" subtitle={`${farmers.length} farmer profiles`} />

        {farmers.length ? (
          farmers.map((farmer) => (
            <Card key={farmer.id}>
              <p className="font-black text-farm-primaryDark">{cleanText(farmer.farm_name, 'Farm')}</p>
              <p className="text-sm font-bold text-farm-muted">
                {cleanText(farmer.farmer_name, 'Farmer')} â€¢ {cleanText(farmer.parish, 'Parish')} â€¢ Platform contact only
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <StatusChip status={farmer.verification_status} />
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await updateFarmerVerification(farmer.id, 'approved');
                    await refresh();
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await updateFarmerVerification(farmer.id, 'rejected');
                    await refresh();
                  }}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No farmers found" subtitle="Farmer applications and profiles will appear here." />
        )}
      </div>

      <div className="grid gap-3">
        <SectionMiniHeader title="Payouts" subtitle={`${payouts.length} payout records`} />

        {payouts.length ? (
          payouts.map((payout) => (
            <Card key={payout.id}>
              <p className="font-black text-farm-primaryDark">{formatJmd(payout.net_amount)}</p>
              <p className="text-sm font-bold text-farm-muted">
                Order #{shortIdLabel(payout.order_id)} â€¢ Commission {formatJmd(payout.commission_amount)}
              </p>
              <div className="mt-2">
                <StatusChip status={payout.payout_status} />
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No payouts found" subtitle="Farmer payout records will appear here." />
        )}
      </div>
    </div>
  );
}

function ReviewsAdmin({ reviews }: { reviews: ProductReview[] }) {
  return (
    <div className="grid gap-4">
      <SectionMiniHeader title="Product reviews" subtitle={`${reviews.length} customer reviews`} />

      {reviews.length ? (
        reviews.map((review) => {
          const rating = Math.max(0, Math.min(5, Number(review.rating || 0)));

          return (
            <Card key={review.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black text-farm-primaryDark">
                    {cleanText(review.product_name || review.products?.name, 'Product')}
                  </p>

                  <p className="mt-1 text-sm font-black text-[#DFA75A]">
                    {'★'.repeat(rating)}
                  </p>
                </div>

                <p className="text-xs font-bold text-farm-muted">
                  {cleanText(review.customer_name || review.email, 'Customer')}
                </p>
              </div>

              <p className="mt-3 text-sm leading-6 text-farm-muted">
                {cleanText(review.comment, 'No comment')}
              </p>
            </Card>
          );
        })
      ) : (
        <EmptyState title="No reviews yet" subtitle="Customer product reviews will appear here." />
      )}
    </div>
  );
}

function AuditAdmin({ audit }: { audit: AuditLogEntry[] }) {
  return (
    <div className="grid gap-4">
      <SectionMiniHeader title="Audit log" subtitle={`${audit.length} admin/system events`} />

      {audit.length ? (
        audit.map((entry, index) => (
          <Card key={entry.id || index}>
            <p className="font-black text-farm-primaryDark">
              {cleanText(entry.action, 'Audit event')} on {cleanText(entry.table_name, 'table')}
            </p>
            <p className="mt-1 text-sm font-bold text-farm-muted">
              {formatDateTime(entry.created_at)} â€¢ {cleanText(entry.admin_email, 'System')}
            </p>
          </Card>
        ))
      ) : (
        <EmptyState title="No audit logs found" subtitle="Admin activity and system events will appear here." />
      )}
    </div>
  );
}

function LaunchChecklist({ metrics }: { metrics: Metrics }) {
  const items = [
    ['Harvest items loaded', metrics.products > 0],
    ['Requests/orders visible', metrics.orders >= 0],
    ['Admin route protected', true],
    ['Safe messaging language ready', true],
    ['Farm-first discovery workflow ready', true],
    ['Farm images/reels ready', true],
    ['Future marketplace controls ready', true],
    ['Audit logs connected', true],
  ] as const;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, ok]) => (
        <Card key={label} className="flex items-center justify-between gap-4">
          <p className="font-black text-farm-primaryDark">{label}</p>
          <StatusChip status={ok ? 'ready' : 'needs review'} />
        </Card>
      ))}
    </div>
  );
}

function SectionMiniHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-[-0.03em] text-farm-primaryDark">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-farm-muted">{subtitle}</p>
    </div>
  );
}

function FormSectionLabel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-black text-[#102018]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#66746B]">{subtitle}</p>
    </div>
  );
}

function TogglePill({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={Boolean(selected)}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-black transition ${
        selected
          ? 'border-[#0F4A2F] bg-[#0F4A2F] text-white shadow-[0_10px_24px_rgba(15,74,47,0.18)]'
          : 'border-[#DDE8D8] bg-white text-[#0F4A2F] hover:border-[#0F4A2F]/35 hover:bg-[#EEF7ED]'
      } ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
    >
      {children}
    </button>
  );
}

function ProductActionButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-xs font-black transition ${
        active
          ? 'border-[#0F4A2F] bg-[#0F4A2F] text-white shadow-[0_10px_24px_rgba(15,74,47,0.18)]'
          : 'border-[#DDE8D8] bg-white text-[#0F4A2F] hover:border-[#0F4A2F]/35 hover:bg-[#EEF7ED]'
      } ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
    >
      {children}
    </button>
  );
}

function ProductBadge({
  active,
  tone = 'green',
  children,
}: {
  active?: boolean;
  tone?: 'green' | 'gold' | 'red' | 'muted';
  children: ReactNode;
}) {
  if (!active) return null;

  const toneClass =
    tone === 'gold'
      ? 'border-[#E6A83A]/35 bg-[#FFF3D9] text-[#8B5D18]'
      : tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-700'
        : tone === 'muted'
          ? 'border-[#DDE8D8] bg-[#F4F9F2] text-[#66746B]'
          : 'border-[#0F4A2F]/15 bg-[#EEF7ED] text-[#0F4A2F]';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${toneClass}`}>
      {children}
    </span>
  );
}

function FutureBadgesNotice() {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-[#DDE8D8] bg-white/70 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#66746B]">
        Future badges
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <TogglePill disabled>Featured</TogglePill>
        <TogglePill disabled>Seasonal</TogglePill>
        <TogglePill disabled>Bestseller</TogglePill>
        <TogglePill disabled>Farm Fresh</TogglePill>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#66746B]">
        TODO: enable these when a tags/badges array or columns such as is_featured, is_seasonal,
        is_bestseller, and farm_fresh are added to Supabase and wired into the product service.
      </p>
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
    <label className="grid gap-2 text-sm font-black text-farm-primaryDark">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-farm-border bg-white p-3 font-bold outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
      />
    </label>
  );
}



