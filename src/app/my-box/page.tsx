'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  Leaf,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  WalletCards,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { useCart } from '@/components/providers/cart-provider';
import { effectivePrice } from '@/lib/product';
import { formatJmd } from '@/lib/format';

const FALLBACK_IMAGE = '/logo.png';
const MY_BOX_IMAGE = '/elite/elite-my-box-banner.png';

const DELIVERY_FEE = 500;
const FREE_DELIVERY_TARGET = 6000;
const LOCAL_STORAGE_DRAFT_KEY = 'hpj_saved_box_draft';
const LOCAL_STORAGE_NOTE_KEY = 'hpj_box_customer_note';

const productImageMap: Record<string, string> = {
  ginger: '/product-images/product-ginger.png',
  ackee: '/product-images/product-ackee.png',
  callaloo: '/product-images/product-callaloo.png',
  'sweet potato': '/product-images/product-sweet-potato.png',
  garlic: '/product-images/product-garlic.png',
  thyme: '/product-images/product-thyme.png',
  okra: '/product-images/product-okra.png',
  lime: '/product-images/product-lime.png',
  pineapple: '/product-images/product-pineapple.png',
  avocado: '/product-images/product-avocado.png',
  soursop: '/product-images/product-soursop.png',
  'sweet sop': '/product-images/product-soursop.png',
  melon: '/product-images/product-melon.png',
  beetroot: '/product-images/product-beetroot.png',
  onion: '/product-images/product-onion.png',
  potato: '/product-images/product-potato.png',
};

type CartLine = ReturnType<typeof useCart>['lines'][number];
type FulfillmentMode = 'pickup' | 'delivery';

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

function productImageUrl(product: CartLine['product']) {
  const raw = product.image_url?.trim();

  if (raw) {
    if (raw.startsWith('http') || raw.startsWith('/')) return raw;
    return `/product-images/${raw}`;
  }

  const name = normalizeName(String(product.name || ''));
  if (productImageMap[name]) return productImageMap[name];

  const partialMatch = Object.entries(productImageMap).find(([key]) => name.includes(key));
  return partialMatch?.[1] || FALLBACK_IMAGE;
}

function getProductCategory(product: CartLine['product']) {
  const productExtra = product as CartLine['product'] & {
    category_name?: string | null;
    category?: string | null;
  };

  return productExtra.category_name || productExtra.category || 'Fresh produce';
}

function getProductFarm(product: CartLine['product']) {
  const productExtra = product as CartLine['product'] & {
    farm_name?: string | null;
    farmer_name?: string | null;
    parish?: string | null;
  };

  const farm = productExtra.farm_name || productExtra.farmer_name || 'The Harvest Place Ja';
  return productExtra.parish ? `${farm} • ${productExtra.parish}` : farm;
}

function getOriginalPrice(product: CartLine['product']) {
  const productExtra = product as CartLine['product'] & {
    original_price?: number | null;
    compare_at_price?: number | null;
    old_price?: number | null;
  };

  const current = Number(effectivePrice(product) || 0);
  const original = Number(
    productExtra.original_price ||
      productExtra.compare_at_price ||
      productExtra.old_price ||
      product.price ||
      current,
  );

  return original > current ? original : null;
}

function getLineTotal(line: CartLine) {
  return Number(effectivePrice(line.product) || 0) * Number(line.quantity || 0);
}

function getKnownStock(product: CartLine['product']) {
  const value = Number(product.stock_quantity || 0);
  return Number.isFinite(value) ? value : 0;
}

function isLineLowStock(line: CartLine) {
  const stock = getKnownStock(line.product);
  return stock > 0 && stock <= 3;
}

function isLineUnavailable(line: CartLine) {
  const stock = getKnownStock(line.product);
  return stock <= 0;
}

function buildBoxDraft(lines: CartLine[], note: string, fulfillment: FulfillmentMode) {
  return {
    saved_at: new Date().toISOString(),
    fulfillment,
    note,
    items: lines.map((line) => ({
      id: String(line.product.id),
      name: line.product.name,
      quantity: line.quantity,
      unit: line.product.unit || 'each',
      price: Number(effectivePrice(line.product) || 0),
      total: getLineTotal(line),
    })),
  };
}

function buildEstimateText(lines: CartLine[], subtotal: number, deliveryEstimate: number, estimatedTotal: number, fulfillment: FulfillmentMode) {
  const items = lines
    .map((line) => {
      const price = Number(effectivePrice(line.product) || 0);
      return `${line.quantity} x ${line.product.name} @ ${formatJmd(price)} = ${formatJmd(getLineTotal(line))}`;
    })
    .join('\n');

  return `The Harvest Place Ja Box Estimate\n\n${items}\n\nMethod: ${fulfillment === 'delivery' ? 'Delivery' : 'Farm pickup'}\nSubtotal: ${formatJmd(subtotal)}\nDelivery: ${formatJmd(deliveryEstimate)}\nEstimated total: ${formatJmd(estimatedTotal)}`;
}

export default function MyBoxPage() {
  const { lines, count, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();

  const [fulfillment, setFulfillment] = useState<FulfillmentMode>('delivery');
  const [note, setNote] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const unavailableCount = useMemo(() => lines.filter(isLineUnavailable).length, [lines]);
  const lowStockCount = useMemo(() => lines.filter(isLineLowStock).length, [lines]);

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();

    lines.forEach((line) => {
      const category = getProductCategory(line.product);
      map.set(category, (map.get(category) || 0) + Number(line.quantity || 0));
    });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [lines]);

  const savings = useMemo(() => {
    return lines.reduce((total, line) => {
      const current = Number(effectivePrice(line.product) || 0);
      const original = getOriginalPrice(line.product);

      if (!original) return total;

      return total + Math.max(0, original - current) * Number(line.quantity || 0);
    }, 0);
  }, [lines]);

  const deliveryEstimate = subtotal > 0 && fulfillment === 'delivery' && subtotal < FREE_DELIVERY_TARGET ? DELIVERY_FEE : 0;
  const estimatedTotal = subtotal + deliveryEstimate;
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_TARGET - subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_TARGET) * 100));
  const checkoutReady = lines.length > 0 && unavailableCount === 0;

  function saveDraftBox() {
    if (typeof window === 'undefined') return;

    const draft = buildBoxDraft(lines, note, fulfillment);
    window.localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
    window.localStorage.setItem(LOCAL_STORAGE_NOTE_KEY, note);
    setSavedMessage('Box draft saved on this device.');
    window.setTimeout(() => setSavedMessage(''), 2500);
  }

  async function copyEstimate() {
    const estimate = buildEstimateText(lines, subtotal, deliveryEstimate, estimatedTotal, fulfillment);

    try {
      await navigator.clipboard.writeText(estimate);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!lines.length) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_100%)] px-4 py-10 text-[#123D28] sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl">
          <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-[#D8E5D4] bg-[#123D28] p-8 text-white shadow-[0_26px_80px_rgba(18,61,40,0.18)]">
            <div className="absolute inset-0 opacity-35">
              <Image src={MY_BOX_IMAGE} alt="" fill sizes="100vw" className="object-cover object-center" unoptimized />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#123D28] via-[#123D28]/86 to-[#123D28]/40" />

            <div className="relative z-10 max-w-2xl">
              <Badge tone="gold">
                <ShoppingBag className="h-3 w-3" />
                My Box
              </Badge>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Build your fresh box
              </h1>

              <p className="mt-3 text-sm font-semibold leading-7 text-white/80 sm:text-base">
                Choose premium Jamaican produce, build a weekly box, and checkout when you are ready.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/shop">Shop Produce</Button>
                <Button href="/orders" variant="secondary">
                  Track Orders
                </Button>
              </div>
            </div>
          </div>

          <EmptyState
            title="Your box is empty"
            subtitle="Start with fresh picks, then come back here to review your box like a professional checkout cart."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button href="/shop">Start shopping</Button>
                <Button href="/weekly-box" variant="secondary">
                  View weekly boxes
                </Button>
              </div>
            }
          />

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <MvpInfoCard
              icon={<Leaf className="h-5 w-5" />}
              title="Fresh picks"
              text="Add produce from the live shop and review everything in one clean box."
            />
            <MvpInfoCard
              icon={<Truck className="h-5 w-5" />}
              title="Pickup or delivery"
              text="Choose the best fulfilment option before you checkout."
            />
            <MvpInfoCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Secure estimate"
              text="See subtotal, delivery, savings, and item readiness before confirming."
            />
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#123D28]">
      <section className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <BoxHero
          count={count}
          subtotal={subtotal}
          checkoutReady={checkoutReady}
          unavailableCount={unavailableCount}
          lowStockCount={lowStockCount}
        />

        {savedMessage ? (
          <div className="mb-5 rounded-3xl border border-[#2D6741]/15 bg-[#EAF5E7] px-5 py-3 text-sm font-black text-[#2D6741]">
            {savedMessage}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="space-y-4">
            <SmartCartToolbar
              count={count}
              subtotal={subtotal}
              savings={savings}
              freeDeliveryRemaining={freeDeliveryRemaining}
              freeDeliveryProgress={freeDeliveryProgress}
              fulfillment={fulfillment}
              onFulfillmentChange={setFulfillment}
            />

            {unavailableCount || lowStockCount ? (
              <Card className="rounded-[1.75rem] border border-[#DFA75A]/30 bg-[#FFF7E7] p-5 shadow-[0_16px_48px_rgba(159,104,28,0.08)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9B681C]">
                      Box attention
                    </p>
                    <h2 className="mt-1 text-xl font-black text-[#123D28]">
                      {unavailableCount
                        ? `${unavailableCount} item${unavailableCount === 1 ? '' : 's'} may need availability confirmation`
                        : `${lowStockCount} low-stock item${lowStockCount === 1 ? '' : 's'} in your box`}
                    </h2>
                  </div>
                  <Link href="/shop" className="inline-flex items-center justify-center rounded-full border border-[#DFA75A]/50 bg-white px-5 py-3 text-sm font-black text-[#9B681C] transition hover:bg-[#FFF3D9]">
                    Shop alternatives
                  </Link>
                </div>
              </Card>
            ) : null}

            <div className="grid gap-4">
              {lines.map((line) => (
                <CartItemCard
                  key={String(line.product.id)}
                  line={line}
                  onMinus={() => updateQuantity(String(line.product.id), line.quantity - 1)}
                  onPlus={() => updateQuantity(String(line.product.id), line.quantity + 1)}
                  onRemove={() => removeFromCart(String(line.product.id))}
                />
              ))}
            </div>

            <Card className="rounded-[1.75rem] border border-[#D8E5D4] bg-white p-5 shadow-[0_14px_45px_rgba(18,61,40,0.05)]">
              <div className="grid gap-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <h3 className="text-lg font-black text-[#123D28]">
                      Box tools
                    </h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">
                      Save a draft, copy your estimate, or clear your box and start again.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={saveDraftBox}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5 py-3 text-sm font-black text-[#123D28] transition hover:bg-[#EAF5E7]"
                    >
                      <PackageCheck className="h-4 w-4" />
                      Save Draft
                    </button>

                    <button
                      type="button"
                      onClick={copyEstimate}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#123D28] transition hover:bg-[#F4F9F2]"
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? 'Copied' : 'Copy Estimate'}
                    </button>

                    <button
                      type="button"
                      onClick={clearCart}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Box
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <BoxNote value={note} onChange={setNote} />
                  <BoxInsights categories={categorySummary} lowStockCount={lowStockCount} unavailableCount={unavailableCount} />
                </div>
              </div>
            </Card>
          </section>

          <aside className="space-y-4">
            <OrderSummary
              count={count}
              subtotal={subtotal}
              savings={savings}
              deliveryEstimate={deliveryEstimate}
              estimatedTotal={estimatedTotal}
              fulfillment={fulfillment}
              checkoutReady={checkoutReady}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}

function BoxHero({
  count,
  subtotal,
  checkoutReady,
  unavailableCount,
  lowStockCount,
}: {
  count: number;
  subtotal: number;
  checkoutReady: boolean;
  unavailableCount: number;
  lowStockCount: number;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-[2.25rem] border border-[#D8E5D4] bg-[#123D28] p-6 text-white shadow-[0_30px_90px_rgba(18,61,40,0.22)] sm:p-8">
      <div className="absolute inset-0 opacity-45">
        <Image src={MY_BOX_IMAGE} alt="" fill sizes="1480px" className="object-cover object-center" unoptimized />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#123D28] via-[#123D28]/90 to-[#123D28]/28" />
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#DFA75A]/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge tone="gold">
            <ShoppingBag className="h-3 w-3" />
            Smart My Box
          </Badge>

          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.055em] sm:text-5xl">
            Review your fresh box
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/82">
            A cleaner, faster cart experience for fresh produce, weekly boxes, pickup, delivery, and checkout confidence.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <HeroMetric label="Items" value={String(count)} />
          <HeroMetric label="Subtotal" value={formatJmd(subtotal)} />
          <HeroMetric
            label="Readiness"
            value={checkoutReady ? 'Ready' : `${unavailableCount + lowStockCount} alerts`}
          />
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/15 bg-white/12 px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#DFA75A]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function SmartCartToolbar({
  count,
  subtotal,
  savings,
  freeDeliveryRemaining,
  freeDeliveryProgress,
  fulfillment,
  onFulfillmentChange,
}: {
  count: number;
  subtotal: number;
  savings: number;
  freeDeliveryRemaining: number;
  freeDeliveryProgress: number;
  fulfillment: FulfillmentMode;
  onFulfillmentChange: (value: FulfillmentMode) => void;
}) {
  return (
    <Card className="rounded-[1.9rem] border border-[#D8E5D4] bg-white/94 p-5 shadow-[0_18px_55px_rgba(18,61,40,0.06)] backdrop-blur">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">
              <BadgeCheck className="h-3 w-3" />
              {count} item{count === 1 ? '' : 's'}
            </Badge>
            {savings > 0 ? (
              <Badge tone="gold">
                <Gift className="h-3 w-3" />
                Save {formatJmd(savings)}
              </Badge>
            ) : null}
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#123D28]">
            Items in your box
          </h2>

          <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">
            Subtotal: <span className="font-black text-[#123D28]">{formatJmd(subtotal)}</span>
          </p>

          <div className="mt-4 max-w-xl">
            <div className="h-2 overflow-hidden rounded-full bg-[#EAF5E7]">
              <div
                className="h-full rounded-full bg-[#DFA75A] transition-all"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-bold text-[#5F6A62]">
              {freeDeliveryRemaining > 0
                ? `${formatJmd(freeDeliveryRemaining)} away from free delivery target.`
                : 'You reached the free delivery target.'}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
          <FulfillmentButton
            active={fulfillment === 'delivery'}
            icon={<Truck className="h-4 w-4" />}
            label="Delivery"
            onClick={() => onFulfillmentChange('delivery')}
          />
          <FulfillmentButton
            active={fulfillment === 'pickup'}
            icon={<MapPin className="h-4 w-4" />}
            label="Pickup"
            onClick={() => onFulfillmentChange('pickup')}
          />
        </div>
      </div>
    </Card>
  );
}

function FulfillmentButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition',
        active
          ? 'border-[#2D6741] bg-[#2D6741] text-white shadow-[0_12px_30px_rgba(45,103,65,0.22)]'
          : 'border-[#D8E5D4] bg-[#F7FBF5] text-[#123D28] hover:bg-[#EAF5E7]',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

function CartItemCard({
  line,
  onMinus,
  onPlus,
  onRemove,
}: {
  line: CartLine;
  onMinus: () => void;
  onPlus: () => void;
  onRemove: () => void;
}) {
  const product = line.product;
  const price = Number(effectivePrice(product) || 0);
  const lineTotal = getLineTotal(line);
  const imageUrl = productImageUrl(product);
  const categoryLabel = getProductCategory(product);
  const farmLabel = getProductFarm(product);
  const originalPrice = getOriginalPrice(product);
  const stock = getKnownStock(product);
  const unavailable = stock <= 0;
  const lowStock = stock > 0 && stock <= 3;
  const canIncrease = stock <= 0 || line.quantity < stock;

  return (
    <Card className="group overflow-hidden rounded-[1.9rem] border border-[#D8E5D4] bg-white shadow-[0_16px_48px_rgba(18,61,40,0.06)] transition hover:-translate-y-0.5 hover:border-[#BFD5BC] hover:shadow-[0_24px_70px_rgba(18,61,40,0.11)]">
      <div className="grid gap-0 lg:grid-cols-[190px_minmax(0,1fr)_190px] lg:items-stretch">
        <Link href={`/product/${product.id}`} className="relative block min-h-[210px] overflow-hidden bg-[#F7FBF5]">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-6 transition duration-500 group-hover:scale-105"
            sizes="220px"
            unoptimized={imageUrl.startsWith('http')}
          />

          <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#2D6741] shadow-sm">
            {categoryLabel}
          </span>
        </Link>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Local</Badge>
            {product.is_organic ? <Badge tone="gold">Organic</Badge> : null}
            {lowStock ? <Badge tone="gold">Low stock</Badge> : null}
          </div>

          <Link href={`/product/${product.id}`}>
            <h3 className="mt-3 text-2xl font-black leading-tight tracking-[-0.025em] text-[#123D28] transition hover:text-[#2D6741]">
              {product.name}
            </h3>
          </Link>

          <p className="mt-1 text-sm font-semibold leading-5 text-[#5F6A62]">
            {farmLabel}
          </p>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p className="text-2xl font-black text-[#123D28]">
              {formatJmd(price)}
            </p>
            <span className="text-sm font-bold text-[#5F6A62]">
              / {product.unit || 'each'}
            </span>
            {originalPrice ? (
              <span className="text-sm font-bold text-[#8A938B] line-through">
                {formatJmd(originalPrice)}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <span
              className={[
                'inline-flex items-center gap-2 rounded-full px-3 py-1',
                unavailable ? 'bg-red-50 text-red-700' : 'bg-[#EAF5E7] text-[#2D6741]',
              ].join(' ')}
            >
              <span className={unavailable ? 'h-2 w-2 rounded-full bg-red-600' : 'h-2 w-2 rounded-full bg-[#2D6741]'} />
              {unavailable ? 'Confirm availability' : `${stock} available`}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7E7] px-3 py-1 text-[#9B681C]">
              <Clock3 className="h-3.5 w-3.5" />
              Pickup or delivery
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-[#D8E5D4] bg-[#F7FBF5] p-5 lg:border-l lg:border-t-0">
          <div className="rounded-[1.35rem] border border-[#D8E5D4] bg-white px-4 py-4 text-left lg:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5F6A62]">
              Item total
            </p>
            <p className="mt-1 text-2xl font-black text-[#123D28]">
              {formatJmd(lineTotal)}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="inline-flex items-center justify-between overflow-hidden rounded-full border border-[#D8E5D4] bg-white shadow-sm">
              <button
                type="button"
                onClick={onMinus}
                className="grid h-11 w-12 place-items-center text-[#123D28] transition hover:bg-[#EAF5E7]"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="min-w-12 px-4 text-center text-sm font-black text-[#123D28]">
                {line.quantity}
              </span>

              <button
                type="button"
                onClick={onPlus}
                disabled={!canIncrease}
                className="grid h-11 w-12 place-items-center text-[#123D28] transition hover:bg-[#EAF5E7] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OrderSummary({
  count,
  subtotal,
  savings,
  deliveryEstimate,
  estimatedTotal,
  fulfillment,
  checkoutReady,
}: {
  count: number;
  subtotal: number;
  savings: number;
  deliveryEstimate: number;
  estimatedTotal: number;
  fulfillment: FulfillmentMode;
  checkoutReady: boolean;
}) {
  return (
    <Card className="rounded-[1.95rem] border border-[#D8E5D4] bg-white/96 p-6 shadow-[0_30px_85px_rgba(18,61,40,0.13)] backdrop-blur xl:sticky xl:top-28">
      <Badge tone="gold">
        <ShieldCheck className="h-3 w-3" />
        Secure box summary
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-[#123D28]">
        Your estimate
      </h2>

      <div className="mt-5 grid gap-3 text-sm font-bold text-[#5F6A62]">
        <SummaryRow label={`Items (${count})`} value={formatJmd(subtotal)} />
        {savings > 0 ? <SummaryRow label="You save" value={`-${formatJmd(savings)}`} highlight /> : null}
        <SummaryRow label="Fulfilment" value={fulfillment === 'delivery' ? 'Delivery' : 'Farm pickup'} />
        <SummaryRow
          label="Delivery"
          value={fulfillment === 'delivery' ? formatJmd(deliveryEstimate) : 'Not needed'}
        />

        <div className="mt-2 border-t border-[#D8E5D4] pt-4">
          <div className="flex items-center justify-between gap-4 text-xl font-black text-[#123D28]">
            <span>Total</span>
            <span>{formatJmd(estimatedTotal)}</span>
          </div>

          <p className="mt-2 text-xs font-semibold leading-5 text-[#5F6A62]">
            Final availability, pickup time, and delivery fee are confirmed at checkout.
          </p>
        </div>
      </div>

      <Link
        href={checkoutReady ? '/checkout' : '/shop'}
        className={[
          'mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition',
          checkoutReady
            ? 'bg-[#123D28] text-white shadow-[0_18px_45px_rgba(18,61,40,0.25)] hover:bg-[#2D6741]'
            : 'bg-[#FFF7E7] text-[#9B681C] hover:bg-[#FFF3D9]',
        ].join(' ')}
      >
        {checkoutReady ? (
          <>
            <WalletCards className="h-4 w-4" />
            Continue to Checkout
          </>
        ) : (
          <>
            <RotateCcw className="h-4 w-4" />
            Review Alternatives
          </>
        )}
      </Link>

      <Button href="/shop" variant="secondary" className="mt-3 w-full">
        Add More Items
      </Button>

      <div className="mt-5 grid gap-3 rounded-[1.35rem] bg-[#F4F9F2] p-4 text-sm font-bold text-[#5F6A62]">
        <TrustLine icon={<ShieldCheck className="h-4 w-4" />} text="Secure checkout before final order confirmation" />
        <TrustLine icon={<Truck className="h-4 w-4" />} text="Pickup and delivery options remain available" />
        <TrustLine icon={<CheckCircle2 className="h-4 w-4" />} text="Live item availability checked before fulfilment" />
      </div>
    </Card>
  );
}

function BoxNote({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.65rem] border border-[#D8E5D4] bg-[#F7FBF5] p-5">
      <Badge tone="green">
        <Sparkles className="h-3 w-3" />
        Box note
      </Badge>

      <label className="mt-4 grid gap-2 text-sm font-black text-[#123D28]">
        Optional note for checkout
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Example: Please include firm green bananas if available."
          className="min-h-[118px] rounded-2xl border border-[#D8E5D4] bg-white p-4 text-sm font-semibold leading-6 outline-none transition placeholder:text-[#5F6A62]/55 focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
        />
      </label>
    </div>
  );
}

function BoxInsights({
  categories,
  lowStockCount,
  unavailableCount,
}: {
  categories: Array<[string, number]>;
  lowStockCount: number;
  unavailableCount: number;
}) {
  return (
    <div className="rounded-[1.65rem] border border-[#D8E5D4] bg-[#F7FBF5] p-5">
      <Badge tone="green">
        <Tag className="h-3 w-3" />
        Box insights
      </Badge>

      <div className="mt-4 grid gap-3">
        {categories.length ? (
          categories.slice(0, 5).map(([category, quantity]) => (
            <div key={category} className="flex items-center justify-between rounded-2xl bg-[#F4F9F2] px-4 py-3 text-sm font-black">
              <span className="text-[#123D28]">{category}</span>
              <span className="text-[#2D6741]">{quantity}</span>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-[#5F6A62]">No category data yet.</p>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-xs font-bold text-[#5F6A62]">
        <p>{lowStockCount} low-stock item{lowStockCount === 1 ? '' : 's'}</p>
        <p>{unavailableCount} availability alert{unavailableCount === 1 ? '' : 's'}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className={highlight ? 'font-black text-[#2D6741]' : 'font-black text-[#123D28]'}>
        {value}
      </span>
    </div>
  );
}

function TrustLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#2D6741]">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

function MvpInfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Card className="rounded-[1.75rem] border border-[#D8E5D4] bg-white p-5 shadow-[0_16px_48px_rgba(18,61,40,0.06)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-black text-[#123D28]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">{text}</p>
    </Card>
  );
}
