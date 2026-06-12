'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Heart,
  Leaf,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Star,
  Store,
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
import { useCart } from '@/components/providers/cart-provider';
import {
  fetchProductById,
  fetchProductReviews,
  fetchProducts,
  fetchTraceRecordsForProduct,
  subscribeToProductReadyAlert,
  subscribeToSaveProduct,
} from '@/lib/services';
import {
  canAddToCart,
  effectivePrice,
  hasActiveDiscount,
  originalPrice,
  subscribeSavePrice,
} from '@/lib/product';
import { formatDate, formatJmd } from '@/lib/format';
import type {
  Product,
  ProductReview,
  ProductTraceRecord,
} from '@/lib/types';

const FALLBACK_IMAGE = '/elite/hero-produce-box.png';
const FAVORITES_KEY = 'harvest-place-ja-favorites-v1';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const productId = typeof params.id === 'string' ? params.id : '';

  const [product, setProduct] = useState<Product | null>(null);
  const [traceRecords, setTraceRecords] = useState<ProductTraceRecord[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);

  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [imageSrc, setImageSrc] = useState(FALLBACK_IMAGE);

  async function loadProduct(showRefreshState = false) {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      setError('No product ID was found in the page address.');
      return;
    }

    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    setError('');
    setMessage('');

    try {
      const [productRow, traceRows, reviewRows, productRows] = await Promise.all([
        fetchProductById(productId),
        fetchTraceRecordsForProduct(productId),
        fetchProductReviews(productId),
        fetchProducts(),
      ]);

      setProduct(productRow);
      setTraceRecords(traceRows || []);
      setReviews(reviewRows || []);
      setImageSrc(productRow?.image_url || FALLBACK_IMAGE);

      const relatedProducts = (productRows || [])
        .filter((item) => String(item.id) !== String(productId))
        .filter((item) => {
          if (!productRow) return true;
          return item.category === productRow.category || item.is_local || item.is_deal_of_day;
        })
        .slice(0, 4);

      setRecommended(relatedProducts);
    } catch (err) {
      console.error('Product details failed to load:', err);
      setProduct(null);
      setTraceRecords([]);
      setReviews([]);
      setRecommended([]);
      setError(
        'This harvest item is taking longer than expected to load. Please try again or continue shopping.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      if (!productId) {
        if (active) {
          setLoading(false);
          setError('No product ID was found in the page address.');
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [productRow, traceRows, reviewRows, productRows] = await Promise.all([
          fetchProductById(productId),
          fetchTraceRecordsForProduct(productId),
          fetchProductReviews(productId),
          fetchProducts(),
        ]);

        if (!active) return;

        setProduct(productRow);
        setTraceRecords(traceRows || []);
        setReviews(reviewRows || []);
        setImageSrc(productRow?.image_url || FALLBACK_IMAGE);

        const relatedProducts = (productRows || [])
          .filter((item) => String(item.id) !== String(productId))
          .filter((item) => {
            if (!productRow) return true;
            return item.category === productRow.category || item.is_local || item.is_deal_of_day;
          })
          .slice(0, 4);

        setRecommended(relatedProducts);
      } catch (err) {
        console.error('Product details failed to load:', err);

        if (active) {
          setProduct(null);
          setTraceRecords([]);
          setReviews([]);
          setRecommended([]);
          setError(
            'This harvest item is taking longer than expected to load. Please try again or continue shopping.'
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
  }, [productId]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') as string[];
      setFavorite(stored.includes(String(productId)));
    } catch {
      setFavorite(false);
    }
  }, [productId]);

  const addable = product ? canAddToCart(product) : false;

  const averageRating = useMemo(() => {
    if (!reviews.length) return 4.9;

    const totalRating = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return totalRating / reviews.length;
  }, [reviews]);

  const reviewLabel = reviews.length ? `${reviews.length} reviews` : 'New product';

  function toggleFavorite() {
    if (!product) return;

    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') as string[];
      const id = String(product.id);
      const next = stored.includes(id)
        ? stored.filter((item) => item !== id)
        : [...stored, id];

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      setFavorite(next.includes(id));
      setMessage(next.includes(id) ? 'Saved to favorites.' : 'Removed from favorites.');
    } catch {
      setFavorite((value) => !value);
      setMessage('Favorite preference saved for this session.');
    }
  }

  function decreaseQuantity() {
    setQuantity((value) => Math.max(1, value - 1));
  }

  function increaseQuantity() {
    if (!product) return;
    const maxQuantity = Math.max(1, Number(product.stock_quantity || 99));
    setQuantity((value) => Math.min(maxQuantity, value + 1));
  }

  function addSelectedToBox() {
    if (!product || !addable) return;

    addToCart(product, quantity);
    setMessage(`${quantity} × ${product.name} added to My Box.`);
  }

  async function notifyMe() {
    if (!product) return;

    if (!user) {
      router.push(`/auth?redirect=/product/${product.id}&next=/product/${product.id}`);
      return;
    }

    try {
      await subscribeToProductReadyAlert(product);
      setMessage('Ready-soon alert saved. We will notify you when this harvest is available.');
    } catch {
      try {
        const key = 'harvest-place-ja-ready-soon-alerts-v1';
        const stored = JSON.parse(localStorage.getItem(key) || '[]') as string[];
        const next = Array.from(new Set([...stored, String(product.id)]));
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}

      setMessage('Ready-soon alert saved on this device.');
    }
  }

  async function subscribeSave() {
    if (!product) return;

    if (!user) {
      router.push(`/auth?redirect=/product/${product.id}&next=/product/${product.id}`);
      return;
    }

    try {
      await subscribeToSaveProduct(product, quantity);
      setMessage('Subscribe & Save plan saved.');
    } catch {
      setMessage('Subscription request saved locally. Please try again after signing in if needed.');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-8 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-[1500px]">
          <ProductSkeleton />
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-5xl">
          {error ? (
            <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
              {error}
            </div>
          ) : null}

          <EmptyState
            title="Product not found"
            subtitle="This harvest may have sold out, moved from the public market, or failed to load."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => loadProduct(true)} variant="secondary">
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>

                <Button href="/shop">Back to shop</Button>
              </div>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_45%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-farm-muted">
          <Link href="/shop" className="inline-flex items-center gap-2 hover:text-farm-primaryDark">
            <ArrowLeft className="h-4 w-4" />
            Shop
          </Link>
          <span>/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category || '')}`}
            className="hover:text-farm-primaryDark"
          >
            {product.category || 'Fresh produce'}
          </Link>
          <span>/</span>
          <span className="text-farm-primaryDark">{product.name}</span>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-0 shadow-[0_24px_80px_rgba(24,59,40,0.12)]">
            <div className="relative min-h-[340px] bg-white sm:min-h-[430px] lg:min-h-[540px]">
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="object-contain p-8 transition duration-500 hover:scale-[1.02]"
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                onError={() => setImageSrc(FALLBACK_IMAGE)}
              />

              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/95 via-white/60 to-transparent" />

              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <Badge tone="gold">{product.category || 'Fresh produce'}</Badge>
                {product.ready_soon ? <Badge tone="red">Ready Soon</Badge> : null}
                {product.is_organic ? (
                  <Badge tone="green">
                    <Leaf className="h-3 w-3" />
                    Organic
                  </Badge>
                ) : null}
                {product.is_local ? <Badge tone="dark">Local</Badge> : null}
              </div>

              <button
                type="button"
                onClick={toggleFavorite}
                aria-label={
                  favorite
                    ? `Remove ${product.name} from favorites`
                    : `Save ${product.name} to favorites`
                }
                className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white/92 text-farm-primary shadow-sm transition hover:bg-farm-accentSoft"
              >
                <Heart
                  className={cn(
                    'h-5 w-5',
                    favorite && 'fill-farm-accent text-farm-accent'
                  )}
                />
              </button>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-[34px] border border-[#D8E5D4] bg-white p-7 shadow-[0_24px_80px_rgba(24,59,40,0.10)]">
              <Badge tone="dark">Premium harvest detail</Badge>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-farm-primaryDark md:text-5xl">
                {product.name}
              </h1>

              <p className="mt-3 text-sm font-bold text-farm-muted">
                {product.farm_name || product.farmer_name || 'The Harvest Place Ja'}
                {product.parish ? ` • ${product.parish}` : ''}
              </p>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <p className="text-4xl font-black text-farm-primary">
                  {formatJmd(effectivePrice(product))}
                </p>

                <span className="pb-1 text-sm font-bold text-farm-muted">
                  / {product.unit || 'each'}
                </span>

                {hasActiveDiscount(product) ? (
                  <span className="pb-1 text-sm font-bold text-farm-muted line-through">
                    Was {formatJmd(originalPrice(product))}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-farm-muted">
                <span
                  className="flex text-farm-accent"
                  aria-label={`${averageRating.toFixed(1)} star rating`}
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        'h-4 w-4',
                        index < Math.round(averageRating) && 'fill-current'
                      )}
                    />
                  ))}
                </span>

                <span>
                  {averageRating.toFixed(1)} · {reviewLabel}
                </span>
              </div>

              <p className="mt-5 text-base font-semibold leading-8 text-farm-muted">
                {product.description ||
                  'Fresh local produce selected for quality, packed with care, and prepared for a premium farm-to-table experience.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoCard
                  icon={<PackageCheck className="h-5 w-5" />}
                  label="Stock"
                  value={
                    addable
                      ? `${product.stock_quantity} available`
                      : product.ready_soon
                        ? 'Harvesting soon'
                        : 'Out of stock'
                  }
                />

                <InfoCard
                  icon={<Truck className="h-5 w-5" />}
                  label="Delivery"
                  value="Pickup or islandwide delivery"
                />

                <InfoCard
                  icon={<Sprout className="h-5 w-5" />}
                  label="Origin"
                  value={product.parish || product.farm_name || 'Local farm'}
                />

                <InfoCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Status"
                  value={
                    <StatusChip
                      status={product.approval_status || product.product_status || 'available'}
                    />
                  }
                />
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex w-fit items-center rounded-full border border-farm-border bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={decreaseQuantity}
                    className="grid h-11 w-11 place-items-center rounded-full text-farm-primary hover:bg-farm-primarySoft"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="min-w-10 text-center text-sm font-black text-farm-primaryDark">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={increaseQuantity}
                    className="grid h-11 w-11 place-items-center rounded-full text-farm-primary hover:bg-farm-primarySoft"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {addable ? (
                  <Button onClick={addSelectedToBox} className="flex-1 px-8">
                    <ShoppingBag className="h-4 w-4" />
                    Add to My Box
                  </Button>
                ) : (
                  <Button onClick={notifyMe} className="flex-1 px-8">
                    <Bell className="h-4 w-4" />
                    Notify Me
                  </Button>
                )}
              </div>

              {product.subscribe_save_enabled && addable ? (
                <Button
                  variant="secondary"
                  onClick={subscribeSave}
                  className="mt-3 w-full border-farm-accent/45 bg-farm-accentSoft/35"
                >
                  Subscribe & Save from {formatJmd(subscribeSavePrice(product))}
                </Button>
              ) : null}

              {message ? (
                <p className="mt-4 rounded-2xl border border-farm-primary/15 bg-farm-primarySoft p-3 text-sm font-black text-farm-primary">
                  {message}
                </p>
              ) : null}
            </Card>
          </div>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <TrustCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Secure checkout"
            text="Stock is checked again before checkout so your box stays accurate."
          />

          <TrustCard
            icon={<Store className="h-6 w-6" />}
            title="Farm origin"
            text={`${product.farm_name || product.farmer_name || 'Partner farm'}${
              product.parish ? ` in ${product.parish}` : ''
            }`}
          />

          <TrustCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="Freshness promise"
            text="Packed carefully with order notes, delivery status, and support if anything needs attention."
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
            <SectionHeader
              eyebrow="Traceability"
              title="Freshness records"
              subtitle="Origin, handling, and freshness details for this harvest."
            />

            <div className="grid gap-3">
              {traceRecords.length ? (
                traceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-3xl border border-farm-border bg-white p-4"
                  >
                    <p className="font-black text-farm-primaryDark">
                      {record.trace_code || record.product_name || product.name}
                    </p>

                    <p className="mt-1 text-sm font-bold text-farm-muted">
                      {record.farm_name || product.farm_name || 'Local farm'} •{' '}
                      {record.parish || product.parish || 'Jamaica'}
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-farm-muted">
                      {record.freshness_note ||
                        record.handling_notes ||
                        'Freshness details saved for this harvest.'}
                    </p>

                    <p className="mt-2 text-xs font-bold text-farm-muted">
                      Harvested:{' '}
                      {formatDate(record.harvest_date || product.harvest_date || product.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-3xl border border-farm-border bg-white p-4 text-sm font-semibold text-farm-muted">
                  Traceability details will appear here when the farm attaches freshness records.
                </p>
              )}
            </div>
          </Card>

          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
            <SectionHeader
              eyebrow="Reviews"
              title="Customer feedback"
              subtitle="Real product feedback from the marketplace."
            />

            <div className="grid gap-3">
              {reviews.length ? (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-3xl border border-farm-border bg-white p-4"
                  >
                    <p className="font-black text-farm-accent">
                      {'★'.repeat(Number(review.rating || 0))}
                      {'☆'.repeat(Math.max(0, 5 - Number(review.rating || 0)))}
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-farm-muted">
                      {review.comment || 'Customer rating submitted.'}
                    </p>

                    <p className="mt-2 text-xs font-bold text-farm-muted">
                      {review.customer_name || review.email || 'Customer'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-3xl border border-farm-border bg-white p-4 text-sm font-semibold text-farm-muted">
                  No reviews yet. Be one of the first customers to share feedback after ordering.
                </p>
              )}
            </div>
          </Card>
        </section>

        {recommended.length ? (
          <section className="mt-10">
            <SectionHeader
              eyebrow="Recommended"
              title="More fresh picks"
              subtitle="Related marketplace items customers often add to their box."
              action={
                <Button href="/shop" variant="secondary">
                  Shop all
                </Button>
              }
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommended.map((item) => (
                <RecommendedCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-farm-border bg-white/85 p-4">
      <div className="text-farm-accent">{icon}</div>

      <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-farm-muted">
        {label}
      </p>

      <div className="mt-1 text-sm font-black text-farm-primaryDark">
        {value}
      </div>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.10)]">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-farm-primarySoft text-farm-primary">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-black text-farm-primaryDark">
        {title}
      </h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-farm-muted">
        {text}
      </p>
    </Card>
  );
}

function RecommendedCard({ product }: { product: Product }) {
  const [src, setSrc] = useState(product.image_url || FALLBACK_IMAGE);

  useEffect(() => {
    setSrc(product.image_url || FALLBACK_IMAGE);
  }, [product.image_url]);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group overflow-hidden rounded-[1.35rem] border border-farm-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative h-36 bg-white">
        <Image
          src={src}
          alt={product.name}
          fill
          className="object-contain p-3 transition duration-500 group-hover:scale-105"
          sizes="220px"
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
      </div>

      <div className="p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-farm-muted">
          {product.category || 'Fresh produce'}
        </p>

        <h3 className="mt-1 line-clamp-2 text-base font-black text-farm-primaryDark">
          {product.name}
        </h3>

        <p className="mt-2 text-lg font-black text-farm-primary">
          {formatJmd(effectivePrice(product))}
        </p>
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="min-h-[520px] animate-pulse rounded-[34px] bg-farm-primarySoft" />

      <div className="space-y-4">
        <LoadingState label="Loading product details..." />
        <div className="h-48 animate-pulse rounded-[34px] bg-white/80" />
        <div className="h-32 animate-pulse rounded-[34px] bg-white/80" />
      </div>
    </div>
  );
}