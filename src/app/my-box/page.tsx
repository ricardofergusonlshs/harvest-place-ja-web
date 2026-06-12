'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeader,
} from '@/components/ui';
import { useCart } from '@/components/providers/cart-provider';
import { effectivePrice } from '@/lib/product';
import { formatJmd } from '@/lib/format';

const FALLBACK_IMAGE = '/elite/weekly-box-banner.png';

type CartLine = ReturnType<typeof useCart>['lines'][number];

export default function MyBoxPage() {
  const { lines, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();

  const [coupon, setCoupon] = useState('');
  const [message, setMessage] = useState('');

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  );

  const estimatedDelivery = subtotal > 0 ? 800 : 0;
  const loyaltyPoints = Math.floor(subtotal / 100);

  const estimatedTotal = useMemo(
    () => subtotal + estimatedDelivery,
    [subtotal, estimatedDelivery]
  );

  function saveCoupon() {
    const cleanCoupon = coupon.trim().toUpperCase();

    if (!cleanCoupon) {
      setMessage('Enter a coupon code to apply it during checkout.');
      return;
    }

    try {
      localStorage.setItem('harvest-place-ja-pending-coupon', cleanCoupon);
      setMessage(`${cleanCoupon} saved. It will be validated securely at checkout.`);
    } catch {
      setMessage('Coupon could not be saved on this device. You can enter it again at checkout.');
    }
  }

  if (!lines.length) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-10 text-[#1E2A21] sm:px-6 lg:px-10">
        <section className="mx-auto max-w-5xl">
          <EmptyState
            title="Your box is empty"
            subtitle="Build your fresh market box with local produce, weekly staples, and ready-soon favorites."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button href="/shop">Shop Fresh Picks</Button>
                <Button href="/weekly-box" variant="secondary">
                  Build Weekly Box
                </Button>
              </div>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_44%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-10">
        <BoxHero itemCount={itemCount} subtotal={subtotal} />

        <div className="mt-8">
          <SectionHeader
            eyebrow="My Box"
            title="Review your fresh picks"
            subtitle="Adjust quantities, check your box summary, and continue to secure checkout when everything looks right."
            action={
              <div className="flex flex-wrap gap-3">
                <Button href="/shop" variant="secondary">
                  Continue shopping
                </Button>
                <Button href="/checkout">
                  Secure checkout
                </Button>
              </div>
            }
          />
        </div>

        {message ? (
          <div className="mb-5 mt-5 rounded-3xl border border-farm-primary/15 bg-farm-primarySoft p-4 text-sm font-black text-farm-primary">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_410px]">
          <div className="grid gap-4">
            {lines.map((line) => (
              <CartItemCard
                key={String(line.product.id)}
                line={line}
                onUpdate={(productId, quantity) => updateQuantity(productId, quantity)}
                onRemove={(productId) => removeFromCart(productId)}
              />
            ))}

            <Card className="flex flex-col gap-4 rounded-[28px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-farm-primaryDark">
                  Need to start fresh?
                </h3>
                <p className="mt-1 text-sm font-semibold text-farm-muted">
                  Clear the box and build a new market order from scratch.
                </p>
              </div>

              <Button variant="danger" onClick={clearCart}>
                <XCircle className="h-4 w-4" />
                Clear box
              </Button>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="sticky top-32 h-fit rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_70px_rgba(24,59,40,0.10)]">
              <Badge tone="gold">
                <ShieldCheck className="h-3 w-3" />
                Secure order summary
              </Badge>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-farm-primaryDark">
                Box summary
              </h2>

              <div className="mt-5 grid gap-3 text-sm font-bold text-farm-muted">
                <SummaryRow label="Items" value={itemCount} />
                <SummaryRow label="Subtotal" value={formatJmd(subtotal)} />
                <SummaryRow label="Estimated delivery" value={formatJmd(estimatedDelivery)} />

                <div className="flex justify-between text-farm-success">
                  <span>Loyalty preview</span>
                  <span>{loyaltyPoints} pts</span>
                </div>

                <div className="flex justify-between border-t border-farm-border pt-4 text-xl font-black text-farm-primaryDark">
                  <span>Estimated total</span>
                  <span>{formatJmd(estimatedTotal)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-3">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#183B28]">
                  Coupon code
                </label>

                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder="e.g. FRESH10"
                    className="min-w-0 flex-1 rounded-full border border-farm-border bg-white px-4 py-3 text-sm font-bold outline-none focus:border-farm-primary"
                  />

                  <Button variant="secondary" onClick={saveCoupon}>
                    Save
                  </Button>
                </div>
              </div>

              <Button href="/checkout" className="mt-5 w-full">
                <ShoppingBag className="h-4 w-4" />
                Checkout securely
              </Button>

              <Button href="/shop" variant="ghost" className="mt-2 w-full">
                Add more fresh picks
              </Button>
            </Card>

            <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.06)]">
              <div className="grid gap-3 text-sm font-bold text-farm-muted">
                <TrustLine
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Stock checked at checkout"
                />
                <TrustLine
                  icon={<Truck className="h-4 w-4" />}
                  title="Pickup or islandwide delivery"
                />
                <TrustLine
                  icon={<ShoppingBag className="h-4 w-4" />}
                  title="Cart persists on this device"
                />
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function BoxHero({
  itemCount,
  subtotal,
}: {
  itemCount: number;
  subtotal: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.22)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge tone="gold">
            <Sparkles className="h-3 w-3" />
            Fresh box review
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Your market box is almost ready.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            Review your fresh picks, adjust quantities, save a coupon, and checkout securely when everything looks right.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[330px]">
          <div className="rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
              Items
            </p>
            <p className="mt-2 text-4xl font-black">{itemCount}</p>
          </div>

          <div className="rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
              Subtotal
            </p>
            <p className="mt-2 text-3xl font-black">{formatJmd(subtotal)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CartItemCard({
  line,
  onUpdate,
  onRemove,
}: {
  line: CartLine;
  onUpdate: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  const [src, setSrc] = useState(line.product.image_url || FALLBACK_IMAGE);
  const unitPrice = effectivePrice(line.product);
  const productId = String(line.product.id);

  useEffect(() => {
    setSrc(line.product.image_url || FALLBACK_IMAGE);
  }, [line.product.image_url]);

  function decreaseQuantity() {
    const nextQuantity = Math.max(1, line.quantity - 1);
    onUpdate(productId, nextQuantity);
  }

  function increaseQuantity() {
    onUpdate(productId, line.quantity + 1);
  }

  return (
    <Card className="grid gap-4 rounded-[28px] border border-[#D8E5D4] bg-white p-4 shadow-[0_18px_50px_rgba(24,59,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.10)] sm:grid-cols-[132px_1fr_auto] sm:items-center">
      <Link
        href={`/product/${productId}`}
        className="relative h-36 overflow-hidden rounded-[1.35rem] bg-farm-primarySoft sm:h-30"
      >
        <Image
          src={src}
          alt={line.product.name}
          fill
          className="object-cover"
          sizes="160px"
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
      </Link>

      <div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">{line.product.category || 'Fresh produce'}</Badge>
          {line.product.is_local ? <Badge tone="gold">Local</Badge> : null}
        </div>

        <Link
          href={`/product/${productId}`}
          className="mt-2 block text-xl font-black text-farm-primaryDark transition hover:text-farm-primary"
        >
          {line.product.name}
        </Link>

        <p className="mt-1 text-sm font-bold text-farm-muted">
          {formatJmd(unitPrice)} / {line.product.unit || 'each'}
          {line.product.farm_name ? ` • ${line.product.farm_name}` : ''}
        </p>

        <p className="mt-2 inline-flex rounded-full bg-[#EAF5E7] px-3 py-1 text-xs font-black text-farm-success">
          {line.product.stock_quantity ?? 'Available'} available
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
        <div className="flex items-center gap-2 rounded-full border border-farm-border bg-white p-1">
          <button
            type="button"
            aria-label={`Decrease ${line.product.name}`}
            onClick={decreaseQuantity}
            className="rounded-full p-2 text-farm-primary transition hover:bg-farm-primarySoft"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="min-w-8 text-center text-sm font-black">
            {line.quantity}
          </span>

          <button
            type="button"
            aria-label={`Increase ${line.product.name}`}
            onClick={increaseQuantity}
            className="rounded-full p-2 text-farm-primary transition hover:bg-farm-primarySoft"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <p className="text-lg font-black text-farm-primaryDark">
          {formatJmd(unitPrice * line.quantity)}
        </p>

        <button
          type="button"
          onClick={() => onRemove(productId)}
          aria-label={`Remove ${line.product.name}`}
          className="rounded-full p-2 text-farm-danger transition hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TrustLine({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-farm-primarySoft text-farm-primary">
        {icon}
      </span>
      <span>{title}</span>
    </div>
  );
}