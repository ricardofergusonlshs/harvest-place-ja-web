'use client';

import Image from 'next/image';
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';

import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { useCart } from '@/components/providers/cart-provider';
import { effectivePrice } from '@/lib/product';
import { formatJmd } from '@/lib/format';

const FALLBACK_IMAGE = '/logo.png';

type CartLine = ReturnType<typeof useCart>['lines'][number];

export default function MyBoxPage() {
  const { lines, count, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();

  const deliveryEstimate = subtotal > 0 ? 500 : 0;
  const estimatedTotal = subtotal + deliveryEstimate;

  if (!lines.length) {
    return (
      <main className="min-h-screen bg-[#FAF8F0] px-4 py-10 text-[#183B28] sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl">
          <EmptyState
            title="Your box is empty"
            subtitle="Start shopping fresh Jamaican produce and add items to your box."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button href="/shop">Shop Produce</Button>
                <Button href="/orders" variant="secondary">
                  Track My Orders Live
                </Button>
              </div>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F0] text-[#183B28]">
      <section className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-[1.75rem] border border-[#D8E5D4] bg-white/90 p-5 shadow-[0_16px_45px_rgba(24,59,40,0.06)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge tone="green">
                <ShoppingBag className="h-3 w-3" />
                My Box
              </Badge>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#183B28] sm:text-4xl">
                Review your cart
              </h1>

              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62]">
                Check your items, adjust quantities, remove anything you do not need, then continue to checkout.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button href="/shop" variant="secondary">
                Shop more produce
              </Button>
              <Button href="/checkout">
                Continue to Checkout
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-4">
            <Card className="rounded-[1.5rem] border border-[#D8E5D4] bg-white p-4 shadow-[0_12px_35px_rgba(24,59,40,0.04)] sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-black text-[#183B28] sm:text-2xl">
                  Items in your box
                </h2>

                <p className="text-sm font-black text-[#5F6A62]">
                  Subtotal ({count} item{count === 1 ? '' : 's'}):{' '}
                  <span className="text-[#183B28]">{formatJmd(subtotal)}</span>
                </p>
              </div>
            </Card>

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

            <Card className="rounded-[1.5rem] border border-[#D8E5D4] bg-white p-5 shadow-[0_12px_35px_rgba(24,59,40,0.04)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#183B28]">
                    Need a fresh start?
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[#5F6A62]">
                    Clear your box and choose fresh items again.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Box
                </button>
              </div>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card className="rounded-[1.75rem] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_65px_rgba(24,59,40,0.10)] xl:sticky xl:top-28">
              <Badge tone="gold">
                <ShieldCheck className="h-3 w-3" />
                Secure box summary
              </Badge>

              <h2 className="mt-4 text-2xl font-black text-[#183B28]">
                Your estimate
              </h2>

              <div className="mt-5 grid gap-3 text-sm font-bold text-[#5F6A62]">
                <SummaryRow label={`Items (${count})`} value={formatJmd(subtotal)} />
                <SummaryRow label="Estimated delivery" value={formatJmd(deliveryEstimate)} />
                <SummaryRow label="Pickup option" value="Available at checkout" />

                <div className="mt-2 border-t border-[#D8E5D4] pt-4">
                  <div className="flex items-center justify-between gap-4 text-xl font-black text-[#183B28]">
                    <span>Total</span>
                    <span>{formatJmd(estimatedTotal)}</span>
                  </div>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#5F6A62]">
                    Final delivery fee and availability are confirmed at checkout.
                  </p>
                </div>
              </div>

              <Button href="/checkout" className="mt-6 w-full">
                Continue to Checkout
              </Button>

              <Button href="/shop" variant="secondary" className="mt-3 w-full">
                Add More Items
              </Button>
            </Card>

            <Card className="rounded-[1.75rem] border border-[#D8E5D4] bg-[#F4F9F2] p-5">
              <div className="grid gap-3 text-sm font-bold text-[#5F6A62]">
                <TrustLine
                  icon={<ShieldCheck className="h-4 w-4" />}
                  text="Secure checkout before order confirmation"
                />
                <TrustLine
                  icon={<Truck className="h-4 w-4" />}
                  text="Pickup and delivery confirmed at checkout"
                />
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </main>
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
  const productExtra = product as typeof product & {
    farm_name?: string | null;
    farmer_name?: string | null;
    parish?: string | null;
    category_name?: string | null;
    category?: string | null;
  };

  const price = Number(effectivePrice(product) || 0);
  const lineTotal = price * Number(line.quantity || 0);
  const imageUrl = product.image_url || FALLBACK_IMAGE;
  const categoryLabel = productExtra.category_name || productExtra.category || 'Fresh produce';

  return (
    <Card className="rounded-[1.75rem] border border-[#D8E5D4] bg-white p-4 shadow-[0_14px_40px_rgba(24,59,40,0.05)] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)_160px] lg:items-center">
        <div className="relative h-40 overflow-hidden rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] lg:h-36">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="160px"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">{categoryLabel}</Badge>
            {product.is_local ? <Badge tone="green">Local</Badge> : null}
            {product.is_organic ? <Badge tone="gold">Organic</Badge> : null}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <h3 className="text-2xl font-black leading-tight text-[#183B28]">
                {product.name}
              </h3>

              <p className="mt-1 text-sm font-semibold leading-5 text-[#5F6A62]">
                {productExtra.farm_name || productExtra.farmer_name || 'The Harvest Place Ja'}
                {productExtra.parish ? ` • ${productExtra.parish}` : ''}
              </p>

              <p className="mt-2 text-sm font-black text-[#2D6741]">
                {formatJmd(price)} {product.unit ? `/ ${product.unit}` : ''}
              </p>

              <p className="mt-1 text-xs font-bold text-[#5F6A62]">
                {Number(product.stock_quantity || 0) > 0
                  ? `${product.stock_quantity} available`
                  : 'Availability will be confirmed'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <div className="inline-flex items-center overflow-hidden rounded-full border border-[#D8E5D4] bg-white">
                <button
                  type="button"
                  onClick={onMinus}
                  className="grid h-11 w-11 place-items-center text-[#183B28] transition hover:bg-[#EAF5E7]"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="min-w-12 px-4 text-center text-sm font-black text-[#183B28]">
                  {line.quantity}
                </span>

                <button
                  type="button"
                  onClick={onPlus}
                  className="grid h-11 w-11 place-items-center text-[#183B28] transition hover:bg-[#EAF5E7]"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-red-700 transition hover:bg-red-50"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] px-5 py-4 text-left lg:text-right">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5F6A62]">
            Item total
          </p>
          <p className="mt-1 text-2xl font-black text-[#183B28]">
            {formatJmd(lineTotal)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="font-black text-[#183B28]">{value}</span>
    </div>
  );
}

function TrustLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#2D6741]">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
