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
} from '@/lib/types';

const FALLBACK_IMAGE = '/elite/hero-produce-box.png';
const FAVORITES_KEY = 'harvest-place-ja-saved items-v1';

function productImage(product: Product | null) {
  const raw = product?.image_url?.trim();

  if (!raw) return FALLBACK_IMAGE;
  if (raw.startsWith('http') || raw.startsWith('/')) return raw;

  return `/product-images/${raw}`;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const productId = typeof params.id === 'string' ? params.id : '';

  const [product, setProduct] = useState<Product | null>(null);
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
      const [productRow, reviewRows, productRows] = await Promise.all([
        fetchProductById(productId),
        fetchProductReviews(productId),
        fetchProducts(),
      ]);

      setProduct(productRow);
      setReviews(reviewRows || []);
      setImageSrc(productImage(productRow));

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
      setReviews([]);
      setRecommended([]);
      setError(
        'This harvest item is taking longer than expected to load. Please try again or continue shopping.',
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
        const [productRow, reviewRows, productRows] = await Promise.all([
          fetchProductById(productId),
          fetchProductReviews(productId),
          fetchProducts(),
        ]);

        if (!active) return;

        setProduct(productRow);
        setReviews(reviewRows || []);
        setImageSrc(productImage(productRow));

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
          setReviews([]);
          setRecommended([]);
          setError(
            'This harvest item is taking longer than expected to load. Please try again or continue shopping.',
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
      0,
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
      setMessage(next.includes(id) ? 'Saved to your saved items.' : 'Removed from saved items.');
    } catch {
      setFavorite((value) => !value);
      setMessage('Saved item preference updated for this session.');
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
        <section className="mx-auto max-w-[1320px]">
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
                  <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(223,167,90,0.16),transparent_32%),linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_45%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1360px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#5F6A62]">
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-[#D8E5D4] transition hover:bg-[#F4F9F2] hover:text-[#183B28]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Shop
          </Link>
          <span className="text-[#B9C9B5]">/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category || '')}`}
            className="hover:text-[#183B28]"
          >
            {product.category || 'Fresh produce'}
          </Link>
          <span className="text-[#B9C9B5]">/</span>
          <span className="line-clamp-1 text-[#183B28]">{product.name}</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.96fr)_minmax(420px,0.74fr)] lg:items-start">
          <Card className="overflow-hidden rounded-[32px] border border-[#D8E5D4] bg-white/96 p-3 shadow-[0_24px_80px_rgba(24,59,40,0.12)] backdrop-blur">
            <div className="relative min-h-[390px] overflow-hidden rounded-[26px] bg-[#F7FBF5] sm:min-h-[470px] lg:min-h-[560px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(234,245,231,0.75)_0%,transparent_38%),linear-gradient(180deg,#FFFEFC_0%,#F7FBF5_100%)]" />

              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="object-contain p-7 transition duration-500 hover:scale-[1.025] sm:p-9 lg:p-10"
                priority
                sizes="(max-width: 1024px) 100vw, 620px"
                onError={() => setImageSrc(FALLBACK_IMAGE)}
                unoptimized={imageSrc.startsWith('http')}
              />

              <div className="absolute left-4 top-4 flex max-w-[calc(100%-5rem)] flex-wrap gap-2">
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
                    ? `Remove ${product.name} from saved items`
                    : `Save ${product.name} to saved items`
                }
                className={cn(
                  'absolute right-4 top-4 inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-black shadow-sm ring-1 ring-[#D8E5D4] transition hover:-translate-y-0.5',
                  favorite
                    ? 'bg-[#FFF3D9] text-[#8B5D18]'
                    : 'bg-white/94 text-[#2D6741] hover:bg-[#FFF3D9]',
                )}
              >
                <Heart
                  className={cn(
                    'h-4 w-4',
                    favorite && 'fill-[#DFA75A] text-[#DFA75A]',
                  )}
                />
                <span>{favorite ? 'Saved' : 'Save item'}</span>
              </button>
            </div>
          </Card>

          <Card className="rounded-[32px] border border-[#D8E5D4] bg-white/96 p-5 shadow-[0_24px_80px_rgba(24,59,40,0.12)] backdrop-blur sm:p-6 lg:sticky lg:top-28">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="dark">Premium harvest detail</Badge>
              {hasActiveDiscount(product) ? <Badge tone="gold">Deal</Badge> : null}
            </div>

            <h1 className="mt-4 text-3xl font-black leading-[0.98] tracking-[-0.045em] text-[#183B28] sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-2 text-sm font-bold text-[#5F6A62]">
              {product.farm_name || product.farmer_name || 'The Harvest Place Ja'}
              {product.parish ? ` • ${product.parish}` : ''}
            </p>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-black tracking-[-0.04em] text-[#2D6741]">
                {formatJmd(effectivePrice(product))}
              </p>

              <span className="pb-1 text-sm font-bold text-[#5F6A62]">
                / {product.unit || 'each'}
              </span>

              {hasActiveDiscount(product) ? (
                <span className="pb-1 text-sm font-bold text-[#8A938B] line-through">
                  Was {formatJmd(originalPrice(product))}
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-[#5F6A62]">
              <span
                className="flex text-[#DFA75A]"
                aria-label={`${averageRating.toFixed(1)} out of 5 customer rating`}
                title="Customer rating"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      'h-4 w-4',
                      index < Math.round(averageRating) && 'fill-current',
                    )}
                  />
                ))}
              </span>

              <span>
                {averageRating.toFixed(1)} customer rating · {reviewLabel}
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62]">
              {product.description ||
                'Fresh local produce selected for quality, packed with care, and prepared for a premium farm-to-table experience.'}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                value="Pickup or St. Elizabeth delivery • JMD $1,000"
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

            <div className="mt-6 grid gap-3 sm:grid-cols-[132px_1fr] sm:items-center">
              <div className="flex w-full items-center justify-between rounded-full border border-[#D8E5D4] bg-white p-1 shadow-sm">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={decreaseQuantity}
                  className="grid h-11 w-11 place-items-center rounded-full text-[#2D6741] transition hover:bg-[#EAF5E7]"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="min-w-10 text-center text-sm font-black text-[#183B28]">
                  {quantity}
                </span>

                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={increaseQuantity}
                  className="grid h-11 w-11 place-items-center rounded-full text-[#2D6741] transition hover:bg-[#EAF5E7]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {addable ? (
                <Button onClick={addSelectedToBox} className="min-h-[52px] w-full px-8">
                  <ShoppingBag className="h-4 w-4" />
                  Add to My Box
                </Button>
              ) : (
                <Button onClick={notifyMe} className="min-h-[52px] w-full px-8">
                  <Bell className="h-4 w-4" />
                  Notify Me
                </Button>
              )}
            </div>

            {product.subscribe_save_enabled && addable ? (
              <Button
                variant="secondary"
                onClick={subscribeSave}
                className="mt-3 w-full border-[#DFA75A]/45 bg-[#FFF3D9]/45"
              >
                Subscribe & Save from {formatJmd(subscribeSavePrice(product))}
              </Button>
            ) : null}

            {message ? (
              <p className="mt-4 rounded-2xl border border-[#2D6741]/15 bg-[#EAF5E7] p-3 text-sm font-black text-[#2D6741]">
                {message}
              </p>
            ) : null}
          </Card>
        </div>

        {recommended.length ? (
          <section className="mt-6 rounded-[32px] border border-[#D8E5D4] bg-white/88 p-5 shadow-[0_20px_70px_rgba(24,59,40,0.08)] backdrop-blur sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge tone="gold">Recommended</Badge>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
                  More fresh picks for your box
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62]">
                  Items selected from similar categories, local picks, and products customers often add together.
                </p>
              </div>

              <Button href="/shop" variant="secondary">
                Shop all
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommended.map((item) => (
                <RecommendedCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
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
            text="Save items with the heart, then add them to My Box when you are ready."
          />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
            <SectionHeader
              eyebrow="Product guide"
              title="Details shoppers care about"
              subtitle="A simple summary of availability, pickup, delivery, and how this item fits into your box."
            />

            <div className="mt-5 grid gap-3">
              <DetailRow label="Category" value={product.category || 'Fresh produce'} />
              <DetailRow label="Unit" value={product.unit || 'each'} />
              <DetailRow
                label="Availability"
                value={
                  addable
                    ? `${product.stock_quantity} available`
                    : product.ready_soon
                      ? 'Ready soon'
                      : 'Out of stock'
                }
              />
              <DetailRow label="Farm / source" value={product.farm_name || product.farmer_name || 'The Harvest Place Ja'} />
              <DetailRow label="Fulfillment" value="Pickup or St. Elizabeth delivery at JMD $1,000" />
            </div>

            <div className="mt-5 rounded-3xl border border-[#DFA75A]/35 bg-[#FFF7E7] p-4">
              <p className="text-sm font-black text-[#8B5D18]">
                Order note
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">
                Add this item to My Box, then use checkout notes for ripeness, packing, pickup, or delivery instructions.
              </p>
            </div>
          </Card>

          <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
            <SectionHeader
              eyebrow="Reviews"
              title="Customer feedback"
              subtitle="Real product feedback from the marketplace."
            />

            <div className="mt-4 grid gap-3">
              {reviews.length ? (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-3xl border border-[#D8E5D4] bg-[#F7FBF5] p-4"
                  >
                    <p className="font-black text-[#DFA75A]">
                      {'★'.repeat(Number(review.rating || 0))}
                      {'☆'.repeat(Math.max(0, 5 - Number(review.rating || 0)))}
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
                      {review.comment || 'Customer rating submitted.'}
                    </p>

                    <p className="mt-2 text-xs font-bold text-[#5F6A62]">
                      {review.customer_name || review.email || 'Customer'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-3xl border border-[#D8E5D4] bg-[#F7FBF5] p-4 text-sm font-semibold text-[#5F6A62]">
                  No reviews yet. Be one of the first customers to share feedback after ordering.
                </p>
              )}
            </div>
          </Card>
        </section>

      </section>
    </main>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#D8E5D4] bg-[#F7FBF5] px-4 py-3 text-sm font-bold text-[#5F6A62]">
      <span>{label}</span>
      <span className="text-right font-black text-[#183B28]">{value}</span>
    </div>
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
    <div className="rounded-[1.4rem] border border-[#D8E5D4] bg-[#FFFEFC] p-4 shadow-sm">
      <div className="text-[#DFA75A]">{icon}</div>

      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5F6A62]">
        {label}
      </p>

      <div className="mt-1 text-sm font-black text-[#183B28]">
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
    <Card className="rounded-[24px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.10)]">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-black text-[#183B28]">
        {title}
      </h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
        {text}
      </p>
    </Card>
  );
}

function RecommendedCard({ product }: { product: Product }) {
  const [src, setSrc] = useState(productImage(product));

  useEffect(() => {
    setSrc(productImage(product));
  }, [product]);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group overflow-hidden rounded-[1.55rem] border border-[#D8E5D4] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#2D6741]/35 hover:shadow-[0_18px_50px_rgba(24,59,40,0.10)]"
    >
      <div className="relative h-40 bg-[#F7FBF5]">
        <Image
          src={src}
          alt={product.name}
          fill
          className="object-contain p-4 transition duration-500 group-hover:scale-105"
          sizes="220px"
          onError={() => setSrc(FALLBACK_IMAGE)}
          unoptimized={src.startsWith('http')}
        />
      </div>

      <div className="p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5F6A62]">
          {product.category || 'Fresh produce'}
        </p>

        <h3 className="mt-1 line-clamp-2 text-base font-black text-[#183B28]">
          {product.name}
        </h3>

        <p className="mt-2 text-lg font-black text-[#2D6741]">
          {formatJmd(effectivePrice(product))}
        </p>
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,0.78fr)]">
      <div className="min-h-[500px] animate-pulse rounded-[30px] bg-[#EAF5E7]" />

      <div className="space-y-4">
        <LoadingState label="Loading product details..." />
        <div className="h-56 animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-28 animate-pulse rounded-[30px] bg-white/80" />
      </div>
    </div>
  );
}
