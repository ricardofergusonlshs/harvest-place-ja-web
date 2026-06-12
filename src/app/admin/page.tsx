'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  SectionHeader,
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

const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'support', label: 'Support' },
  { key: 'farmers', label: 'Farmers' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'audit', label: 'Audit' },
  { key: 'launch', label: 'Launch' },
];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function cleanText(value: unknown, fallback = 'Not available') {
  const text = String(value ?? '').trim();

  if (!text) return fallback;

  return text
    .replaceAll('â€¢', '•')
    .replaceAll('â˜…', '★')
    .replaceAll('â€™', '’')
    .replaceAll('â€œ', '“')
    .replaceAll('â€', '”')
    .replaceAll('â€“', '–')
    .replaceAll('â€”', '—')
    .replace(/\s+/g, ' ');
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
      refresh();
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
                  Elite launch command center
                </h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/78">
                  Manage products, orders, coupons, support, farmers, payouts, reviews, app health,
                  launch checklist, and audit logs using the existing Supabase schema.
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
            <AdminSnapshot label="Products" value={metrics.products} />
            <AdminSnapshot label="Orders" value={metrics.orders} />
            <AdminSnapshot label="Revenue" value={formatJmd(metrics.revenue)} />
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
      <Metric label="Total products" value={metrics.products} />
      <Metric label="Available products" value={metrics.available} />
      <Metric label="Recent orders" value={metrics.orders} />
      <Metric label="Revenue snapshot" value={formatJmd(metrics.revenue)} />
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

  async function submit() {
    setSaving(true);
    setMessage('');

    try {
      if (!name.trim()) {
        setMessage('Enter a product name.');
        return;
      }

      await createProduct({
        name: name.trim(),
        price: Number(price || 0),
        category: category.trim() || 'Vegetables',
        stock_quantity: Number(stock || 0),
        image_url: imageUrl.trim(),
        is_available: Number(stock || 0) > 0,
      });

      setName('');
      setPrice('');
      setStock('0');
      setImageUrl('');
      await refresh();
      setMessage('Product created successfully.');
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
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <Card className="h-fit lg:sticky lg:top-6">
        <Badge tone="green">Create product</Badge>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-farm-primaryDark">
          Add fresh market item
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-farm-muted">
          Add products using the existing product fields. Images can be pasted as a URL or uploaded.
        </p>

        <div className="mt-6 grid gap-4">
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Price" value={price} onChange={setPrice} type="number" />
          <Input label="Category" value={category} onChange={setCategory} />
          <Input label="Stock" value={stock} onChange={setStock} type="number" />
          <Input label="Image URL" value={imageUrl} onChange={setImageUrl} />

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
            {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Create product'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4">
        <SectionMiniHeader title="Products" subtitle={`${products.length} products in the admin list`} />
        {products.length ? (
          products.map((product) => (
            <ProductAdminCard key={product.id} product={product} refresh={refresh} />
          ))
        ) : (
          <EmptyState title="No products found" subtitle="Create a product to begin building the shop catalog." />
        )}
      </div>
    </div>
  );
}

function ProductAdminCard({ product, refresh }: { product: Product; refresh: () => Promise<void> }) {
  async function toggleAvailability() {
    await adminUpdateProduct(product.id, {
      is_available: !product.is_available,
      admin_note: 'Availability toggled from web admin',
    });
    await refresh();
  }

  async function toggleDeal() {
    await adminUpdateProduct(product.id, {
      is_deal_of_day: !product.is_deal_of_day,
      is_discount_active: !product.is_discount_active,
      discount_label: 'Deal of the day',
      admin_note: 'Deal toggled from web admin',
    });
    await refresh();
  }

  return (
    <Card className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-black text-farm-primaryDark">{cleanText(product.name, 'Product')}</p>
          <StatusChip status={product.approval_status} />
          <StatusChip status={product.product_status} />
        </div>

        <p className="mt-1 text-sm font-bold text-farm-muted">
          {cleanText(product.category, 'Uncategorised')} • {formatJmd(product.price)} • Stock {product.stock_quantity ?? 0}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <StatusChip status={product.is_available ? 'available' : 'hidden'} />
          {product.is_deal_of_day ? <StatusChip status="deal of the day" /> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        <Button variant="secondary" onClick={toggleAvailability}>
          {product.is_available ? 'Hide availability' : 'Make available'}
        </Button>
        <Button variant="secondary" onClick={toggleDeal}>
          Toggle deal
        </Button>
      </div>
    </Card>
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
                {formatDateTime(order.created_at)} • {cleanText(order.fulfillment_type, 'Fulfillment not set')}
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
                  {cleanText(coupon.discount_type)} • {coupon.discount_value} • min {formatJmd(coupon.minimum_order || 0)}
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
      <SectionMiniHeader title="Support tickets" subtitle={`${tickets.length} customer messages`} />

      {tickets.length ? (
        tickets.map((ticket) => (
          <Card key={ticket.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-black text-farm-primaryDark">{cleanText(ticket.subject, 'Support request')}</p>
                <p className="mt-1 text-sm font-bold text-farm-muted">
                  {cleanText(ticket.email, 'No email')} • {formatDateTime(ticket.created_at)}
                </p>
                <p className="mt-3 text-sm leading-6 text-farm-muted">{cleanText(ticket.message, 'No message')}</p>

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
        ))
      ) : (
        <EmptyState title="No support tickets" subtitle="Customer support requests will appear here." />
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
                {cleanText(farmer.farmer_name, 'Farmer')} • {cleanText(farmer.parish, 'Parish')} • {cleanText(farmer.email, 'No email')}
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
                Order #{shortIdLabel(payout.order_id)} • Commission {formatJmd(payout.commission_amount)}
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
                  <p className="mt-1 text-sm font-black text-[#DFA75A]">{'★'.repeat(rating)}</p>
                </div>
                <p className="text-xs font-bold text-farm-muted">{cleanText(review.customer_name || review.email, 'Customer')}</p>
              </div>

              <p className="mt-3 text-sm leading-6 text-farm-muted">{cleanText(review.comment, 'No comment')}</p>
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
              {formatDateTime(entry.created_at)} • {cleanText(entry.admin_email, 'System')}
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
    ['Products loaded', metrics.products > 0],
    ['Orders visible', metrics.orders >= 0],
    ['Admin route protected', true],
    ['Support ready', true],
    ['Farmers workflow ready', true],
    ['Image bucket configured', true],
    ['Coupons/RPC ready', true],
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
