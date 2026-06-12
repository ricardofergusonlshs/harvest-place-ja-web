'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Eye,
  Leaf,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { Button, Badge, Card, cn } from '@/components/ui';
import { useCart } from '@/components/providers/cart-provider';
import {
  canAddToCart,
  discountPercentDisplay,
  effectivePrice,
  hasActiveDiscount,
  lowStockLabel,
  originalPrice,
  showAsDealOfDay,
  subscribeSavePrice,
} from '@/lib/product';
import { formatJmd } from '@/lib/format';
import type { Product } from '@/lib/types';
import { subscribeToProductReadyAlert } from '@/lib/services';

const FALLBACK_IMAGE = '/logo.png';

export function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const { addToCart } = useCart();

  const [imageSrc, setImageSrc] = useState(product.image_url || FALLBACK_IMAGE);
  const [notice, setNotice] = useState('');
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    setImageSrc(product.image_url || FALLBACK_IMAGE);
  }, [product.image_url]);

  const canAdd = canAddToCart(product);
  const stockLabel = lowStockLabel(product);
  const price = effectivePrice(product);
  const wasPrice = originalPrice(product);

  const farmLine = useMemo(() => {
    const farm = product.farm_name || product.farmer_name || 'Harvest Place farm';
    return product.parish ? `${farm} • ${product.parish}` : farm;
  }, [product.farm_name, product.farmer_name, product.parish]);

  function addProductToBox() {
    if (!canAdd) return;

    addToCart(product);
    setNotice('Added to My Box.');
  }

  async function notifyMe() {
    if (!product.ready_soon) return;

    setNotice('');
    setNotifying(true);

    try {
      await subscribeToProductReadyAlert(product);
      setNotice('Ready-soon alert saved.');
    } catch {
      try {
        const key = 'harvest-place-ja-ready-soon-alerts-v1';
        const stored = JSON.parse(localStorage.getItem(key) || '[]') as string[];
        const next = Array.from(new Set([...stored, String(product.id)]));
        localStorage.setItem(key, JSON.stringify(next));
        setNotice('Alert saved on this device.');
      } catch {
        setNotice('Please sign in to save this alert.');
      }
    } finally {
      setNotifying(false);
    }
  }

  return (
    <Card
      interactive
      className="group overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white p-0 shadow-[0_18px_50px_rgba(24,59,40,0.07)]"
    >
      <Link
        href={`/product/${product.id}`}
        className={cn(
          'relative block overflow-hidden bg-[#F4F9F2]',
          compact ? 'aspect-[4/3]' : 'aspect-[1.15/1]'
        )}
        aria-label={`View ${product.name}`}
      >
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-contain p-5 transition duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          onError={() => setImageSrc(FALLBACK_IMAGE)}
        />

        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/85 via-white/40 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {showAsDealOfDay(product) ? (
            <Badge tone="gold">
              <Sparkles className="h-3 w-3" />
              Deal
            </Badge>
          ) : null}

          {product.is_organic ? (
            <Badge tone="green">
              <Leaf className="h-3 w-3" />
              Organic
            </Badge>
          ) : null}

          {product.is_local ? <Badge tone="white">Local</Badge> : null}
        </div>

        {hasActiveDiscount(product) ? (
          <div className="absolute right-3 top-3 rounded-full bg-farm-danger px-3 py-1 text-xs font-black text-white shadow-sm">
            -{discountPercentDisplay(product)}%
          </div>
        ) : null}
      </Link>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-farm-accent">
              {product.category || 'Fresh produce'}
            </p>

            <Link
              href={`/product/${product.id}`}
              className="mt-1 line-clamp-2 block text-lg font-black leading-tight text-farm-primaryDark transition hover:text-farm-primary"
            >
              {product.name}
            </Link>

            <p className="mt-1 line-clamp-1 text-xs font-bold text-farm-muted">
              {farmLine}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-lg font-black text-farm-primaryDark">
              {formatJmd(price)}
            </p>

            {hasActiveDiscount(product) ? (
              <p className="text-xs font-bold text-farm-muted line-through">
                {formatJmd(wasPrice)}
              </p>
            ) : null}

            <p className="text-[11px] font-bold text-farm-muted">
              /{product.unit || 'each'}
            </p>
          </div>
        </div>

        {!compact && product.description ? (
          <p className="mb-4 line-clamp-2 text-sm font-semibold leading-6 text-farm-muted">
            {product.description}
          </p>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          {product.subscribe_save_enabled && canAdd ? (
            <Badge tone="gold">
              <Star className="h-3 w-3" />
              Subscribe {formatJmd(subscribeSavePrice(product))}
            </Badge>
          ) : null}

          {stockLabel ? (
            <Badge tone="red">{stockLabel}</Badge>
          ) : (
            <Badge tone={canAdd ? 'green' : product.ready_soon ? 'gold' : 'red'}>
              {canAdd
                ? `${Number(product.stock_quantity || 0)} in stock`
                : product.ready_soon
                  ? 'Harvesting soon'
                  : 'Unavailable'}
            </Badge>
          )}
        </div>

        {notice ? (
          <p className="mb-4 rounded-2xl border border-farm-primary/15 bg-farm-primarySoft px-3 py-2 text-xs font-black text-farm-primary">
            {notice}
          </p>
        ) : null}

        <div className="flex gap-2">
          {canAdd ? (
            <Button onClick={addProductToBox} className="flex-1">
              <ShoppingBag className="h-4 w-4" />
              Add
            </Button>
          ) : product.ready_soon ? (
            <Button
              onClick={() => void notifyMe()}
              disabled={notifying}
              className="flex-1"
            >
              <Bell className="h-4 w-4" />
              {notifying ? 'Saving...' : 'Notify me'}
            </Button>
          ) : (
            <Button
              href={`/product/${product.id}`}
              variant="secondary"
              className="flex-1"
            >
              Details
            </Button>
          )}

          <Button href={`/product/${product.id}`} variant="secondary">
            <Eye className="h-4 w-4" />
            View
          </Button>
        </div>
      </div>
    </Card>
  );
}