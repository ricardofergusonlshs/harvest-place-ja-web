'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Download,
  Leaf,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sprout,
  Truck,
} from 'lucide-react';

import { fetchProducts } from '@/lib/services';
import { formatJmd } from '@/lib/format';
import { useCart } from '@/components/providers/cart-provider';
import { canAddToCart, effectivePrice, hasActiveDiscount, originalPrice } from '@/lib/product';
import type { Product } from '@/lib/types';

const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.harvestplaceja.myapp&pli=1';

const FALLBACK_PRODUCT_IMAGE = '/logo.png';
const CORRECT_SUPABASE_HOST = 'zvgvvsgjzfygbsqwawoh.supabase.co';
const WRONG_SUPABASE_HOST = 'zvgvvsgjzfyqbsqwawoh.supabase.co';

const HERO_IMAGE = '/elite/elite-home-hero.png';
const FARM_STORY_IMAGE = '/elite/elite-farm-story.png';
const WEEKLY_BOX_IMAGE = '/elite/elite-weekly-box-banner.png';
const APP_PHONE_IMAGE = '/elite/harvestplaceja-app-phone.png';
const ANDROID_BACKGROUND_IMAGE = '/elite/ANDROID_BACKGROUND_IMAGE.png';
const GOOGLE_PLAY_BADGE_IMAGE = '/elite/google-play-badge.png';
const CERTIFIED_BADGE_IMAGE = '/elite/certified-jamaican-badge.png';

const ANDROID_BACKGROUND_FALLBACKS = [
  '/elite/android-image.png',
  '/elite/elite-app-promo-banner.png',
  FARM_STORY_IMAGE,
  HERO_IMAGE,
  FALLBACK_PRODUCT_IMAGE,
];
const SHOP_HERO_IMAGE = '/elite/elite-shop-hero-bg.png';
const BACKGROUND_PATTERN_IMAGE = '/elite/elite-background-pattern.png';

const HERO_IMAGE_FALLBACKS = [
  '/marketplace-hero-clean.png',
  '/elite/hero-produce-box.png',
  '/elite/weekly-box-banner.png',
  FALLBACK_PRODUCT_IMAGE,
];

const FARM_STORY_FALLBACKS = ['/elite/farmer-story.png', HERO_IMAGE, FALLBACK_PRODUCT_IMAGE];
const WEEKLY_BOX_FALLBACKS = ['/elite/weekly-box-banner.png', HERO_IMAGE, FALLBACK_PRODUCT_IMAGE];
const SHOP_HERO_FALLBACKS = [HERO_IMAGE, '/elite/hero-produce-box.png', FALLBACK_PRODUCT_IMAGE];

export type MarketMode = 'home' | 'shop';
type ProductSort = 'featured' | 'price-low' | 'price-high' | 'stock';

type ShortcutCard = {
  title: string;
  text: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
};

type TrustChip = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type FallbackProduce = {
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  image: string;
};

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
  beet: '/product-images/product-beetroot.png',
  onion: '/product-images/product-onion.png',
  potato: '/product-images/product-potato.png',
};

const trustChips: TrustChip[] = [
  { label: 'Farm fresh', icon: Leaf },
  { label: 'Jamaican grown', icon: Sprout },
  { label: 'Secure ordering', icon: ShieldCheck },
  { label: 'Pickup or delivery', icon: Truck },
];

const shortcutCards: ShortcutCard[] = [
  {
    title: 'Fresh Picks',
    text: 'Premium produce selected for this week’s harvest.',
    label: 'Shop Now',
    href: '/shop',
    icon: Leaf,
  },
  {
    title: 'Ready Soon',
    text: "See what’s coming fresh from the farm next.",
    label: "See What's Coming",
    href: '/ready-soon',
    icon: CalendarDays,
  },
  {
    title: 'Weekly Box Deals',
    text: 'Curated harvest boxes packed for value and freshness.',
    label: 'Build Your Box',
    href: '/my-box',
    icon: Package,
  },
  {
    title: 'Our Farm Story',
    text: 'Rooted in Jamaica. Grown with care and purpose.',
    label: 'Learn Our Story',
    href: '#farm-story',
    icon: Sprout,
  },
  {
    title: 'Use the App',
    text: 'Shop, request items, and track orders on the go.',
    label: 'Get the App',
    href: ANDROID_APP_URL,
    icon: Smartphone,
    external: true,
  },
];

const fallbackProduce: FallbackProduce[] = [
  { name: 'Ginger', category: 'Ground Provisions', price: 500, unit: 'each', stock: 1, image: '/product-images/product-ginger.png' },
  { name: 'Garlic', category: 'Vegetables', price: 300, unit: 'lb', stock: 7, image: '/product-images/product-garlic.png' },
  { name: 'Sweet Potato', category: 'Ground Provisions', price: 400, unit: 'lb', stock: 13, image: '/product-images/product-sweet-potato.png' },
  { name: 'Ackee', category: 'Fruit', price: 400, unit: 'dozen', stock: 5, image: '/product-images/product-ackee.png' },
  { name: 'Okra', category: 'Vegetables', price: 300, unit: 'dozen', stock: 11, image: '/product-images/product-okra.png' },
  { name: 'Pineapple', category: 'Fruit', price: 300, unit: 'each', stock: 12, image: '/product-images/product-pineapple.png' },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

function localProductFallback(product: Product) {
  const name = normalizeName(String(product.name || ''));
  if (productImageMap[name]) return productImageMap[name];

  const partialMatch = Object.entries(productImageMap).find(([key]) => name.includes(key));
  return partialMatch?.[1] || FALLBACK_PRODUCT_IMAGE;
}

function forceProduceImage(product: Product): string {
  const record = product as Product & Record<string, unknown>;

  const rawUrl =
    record.image_url ??
    record.imageUrl ??
    record.image ??
    record.photo_url ??
    record.photoUrl ??
    '';

  if (typeof rawUrl !== 'string') {
    return localProductFallback(product);
  }

  const imageUrl = rawUrl.trim();

  if (!imageUrl) {
    return localProductFallback(product);
  }

  if (imageUrl.includes(WRONG_SUPABASE_HOST)) {
    return imageUrl.replace(WRONG_SUPABASE_HOST, CORRECT_SUPABASE_HOST);
  }

  if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  return `https://${CORRECT_SUPABASE_HOST}/storage/v1/object/public/product-images/${imageUrl}`;
}

function productAvailable(product: Product) {
  return Number(product.stock_quantity || 0) > 0 && product.is_available && product.product_status !== 'hidden';
}

function stockLabel(product: Product) {
  if (product.ready_soon || product.product_status === 'ready_soon') return 'Ready soon';
  if (productAvailable(product)) return `${Number(product.stock_quantity || 0)} in stock`;
  return 'Request availability';
}

function productCategories(products: Product[]) {
  return Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort();
}

function filterAndSortProducts(products: Product[], query: string, category: string, sort: ProductSort) {
  const normalizedQuery = query.trim().toLowerCase();

  const rows = products.filter((product) => {
    const haystack = `${product.name} ${product.description || ''} ${product.category || ''} ${product.unit || ''}`.toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    const matchesCategory = category === 'All' || product.category === category;
    return matchesQuery && matchesCategory;
  });

  return [...rows].sort((a, b) => {
    if (sort === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
    if (sort === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
    if (sort === 'stock') return Number(b.stock_quantity || 0) - Number(a.stock_quantity || 0);
    return Number(b.is_deal_of_day ? 1 : 0) - Number(a.is_deal_of_day ? 1 : 0);
  });
}

function SafePublicImage({
  src,
  fallbackSrcs = [],
  alt,
  className,
  sizes,
  priority = false,
}: {
  src: string;
  fallbackSrcs?: string[];
  alt: string;
  className: string;
  sizes: string;
  priority?: boolean;
}) {
  const candidates = useMemo(() => [src, ...fallbackSrcs, FALLBACK_PRODUCT_IMAGE], [src, fallbackSrcs]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src]);

  return (
    <Image
      src={candidates[index] || FALLBACK_PRODUCT_IMAGE}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      unoptimized
      onError={() => setIndex((current) => Math.min(current + 1, candidates.length - 1))}
    />
  );
}

function ProductImage({ product, className = 'object-contain p-5' }: { product: Product; className?: string }) {
  const fallback = localProductFallback(product);
  const [src, setSrc] = useState(forceProduceImage(product));

  useEffect(() => {
    setSrc(forceProduceImage(product));
  }, [product.image_url, product.name]);

  return (
    <Image
      src={src}
      alt={product.name}
      fill
      sizes="(max-width: 640px) 88vw, (max-width: 1024px) 40vw, 260px"
      className={className}
      unoptimized={src.startsWith('http')}
      onError={() => setSrc(src === fallback ? FALLBACK_PRODUCT_IMAGE : fallback)}
    />
  );
}

function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#123D28] px-6 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(18,61,40,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#2D6741] hover:shadow-[0_24px_60px_rgba(18,61,40,0.32)]"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#DFA75A]/65 bg-white/88 px-6 py-3 text-sm font-black text-[#9B681C] shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-[#FFF3D9] hover:text-[#70460E]"
    >
      {children}
    </Link>
  );
}

function ExternalButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#123D28] px-6 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(18,61,40,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#2D6741]"
    >
      {children}
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DFA75A]">{eyebrow}</p> : null}
        <h2 className="font-serif text-3xl font-black tracking-[-0.04em] text-[#123D28] sm:text-[2.45rem]">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function MarketplaceHomePage() {
  return <MarketplacePage mode="home" />;
}

export function MarketplaceShopPage() {
  return <MarketplacePage mode="shop" />;
}

export function MarketplacePage({ mode }: { mode: MarketMode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setNotice('');

      try {
        const rows = await fetchProducts();
        if (!active) return;
        setProducts(rows.filter((product) => product.is_available || product.ready_soon || Number(product.stock_quantity || 0) > 0));
      } catch {
        if (active) setNotice('The live shop is taking longer to load. Try refreshing, or check Supabase product permissions.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return mode === 'shop' ? (
    <ShopLayout products={products} loading={loading} notice={notice} />
  ) : (
    <HomeLayout products={products} loading={loading} notice={notice} />
  );
}

function HomeLayout({ products, loading, notice }: { products: Product[]; loading: boolean; notice: string }) {
  const previewProducts = products.slice(0, 6);

  return (
    <div className="bg-[#FAF8F0] text-[#123D28]">
      <HeroSection />
      {notice ? <Notice>{notice}</Notice> : null}
      <ShortcutSection />
      <FarmStorySection />
      <FreshFromFarmSection products={previewProducts} loading={loading} />
      <WeeklyBoxSection />
      <AppSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#FFFDF7_0%,#FAF8F0_56%,#EAF5E7_100%)]">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `url(${BACKGROUND_PATTERN_IMAGE})`, backgroundSize: '520px 520px' }} />
      <div className="mx-auto max-w-[1450px] px-4 pb-6 pt-7 sm:px-6 lg:px-10 lg:pb-9 lg:pt-9">
        <div className="relative min-h-[610px] overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_30px_90px_rgba(18,61,40,0.12)] sm:min-h-[620px] lg:min-h-[560px]">
          <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#FFF3D9]/65 blur-3xl" />
          <div className="absolute right-[-100px] top-[-90px] h-80 w-80 rounded-full bg-[#EAF5E7] blur-2xl" />

          <div className="absolute inset-0 hidden overflow-hidden lg:block">
            <SafePublicImage
              src={HERO_IMAGE}
              fallbackSrcs={HERO_IMAGE_FALLBACKS}
              alt="Premium Jamaican produce basket"
              priority
              sizes="1450px"
              className="object-cover object-[82%_center]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#FFFDF7_0%,rgba(255,253,247,0.98)_24%,rgba(255,253,247,0.82)_42%,rgba(255,253,247,0.20)_62%,rgba(255,253,247,0)_86%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#123D28]/10" />
          </div>

          <div className="absolute inset-x-0 bottom-0 block h-[350px] overflow-hidden lg:hidden">
            <SafePublicImage
              src={HERO_IMAGE}
              fallbackSrcs={HERO_IMAGE_FALLBACKS}
              alt="Premium Jamaican produce basket"
              priority
              sizes="100vw"
              className="object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF7] via-[#FFFDF7]/82 to-transparent" />
          </div>

          <div className="absolute right-6 top-6 z-30 hidden h-[96px] w-[96px] rounded-full bg-white/20 p-1 shadow-[0_18px_45px_rgba(18,61,40,0.16)] backdrop-blur-[1px] sm:block lg:right-10 lg:top-9 lg:h-[136px] lg:w-[136px] xl:right-12 xl:top-10 xl:h-[150px] xl:w-[150px]">
            <Image
              src={CERTIFIED_BADGE_IMAGE}
              alt="100% local Jamaican badge"
              fill
              sizes="150px"
              className="object-contain"
              unoptimized
            />
          </div>

          <div className="relative z-20 flex min-h-[610px] flex-col justify-start px-6 py-8 sm:min-h-[620px] sm:px-8 sm:py-10 lg:min-h-[560px] lg:w-[52%] lg:justify-center lg:px-11 lg:py-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF5E7] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#2D6741] ring-1 ring-[#2D6741]/10">
              <Leaf className="h-3.5 w-3.5" />
              Grown with care in Jamaica
            </span>

            <h1 className="mt-5 max-w-[720px] font-serif text-[clamp(3.15rem,5.7vw,5.8rem)] font-black leading-[0.9] tracking-[-0.065em] text-[#123D28]">
              Fresh From
              <br />
              Our Farm To
              <br />
              Your Table
            </h1>

            <p className="mt-5 max-w-[560px] text-base font-semibold leading-7 text-[#4F5D53] sm:text-[17px] sm:leading-8">
              Hand-picked Jamaican produce, curated weekly boxes, and secure local ordering built for fresh, simple farm-to-table living.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="/shop">
                <Leaf className="h-4 w-4" />
                Shop Fresh Produce
              </PrimaryButton>

              <SecondaryButton href="/my-box">
                <Package className="h-4 w-4" />
                Build Your Box
              </SecondaryButton>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#5F6A62] sm:flex sm:flex-wrap sm:gap-5">
              {trustChips.map((item) => {
                const Icon = item.icon;
                return (
                  <span key={item.label} className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#2D6741]" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function ShortcutSection() {
  return (
    <section className="relative z-10 mx-auto -mt-4 max-w-[1450px] px-4 pb-8 sm:px-6 lg:px-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {shortcutCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="group flex h-full min-h-[140px] flex-col overflow-hidden rounded-[26px] border border-[#D8E5D4] bg-white/92 p-5 shadow-[0_20px_60px_rgba(18,61,40,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_28px_80px_rgba(18,61,40,0.14)]">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741] ring-1 ring-[#2D6741]/10">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-[#DFA75A] transition group-hover:translate-x-1" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-black leading-tight text-[#123D28]">{card.title}</h3>
              <p className="mt-2 min-h-[42px] text-xs font-semibold leading-5 text-[#5F6A62]">{card.text}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-black uppercase tracking-[0.08em] text-[#123D28]">
                {card.label}
              </span>
            </div>
          );

          return card.external ? (
            <a key={card.title} href={card.href} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            <Link key={card.title} href={card.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FarmStorySection() {
  return (
    <section id="farm-story" className="mx-auto max-w-[1450px] px-4 pb-8 sm:px-6 lg:px-10">
      <div className="grid overflow-hidden rounded-[32px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_26px_80px_rgba(18,61,40,0.09)] lg:grid-cols-[0.98fr_1.02fr]">
        <div className="relative min-h-[300px] overflow-hidden lg:min-h-[390px]">
          <SafePublicImage
            src={FARM_STORY_IMAGE}
            fallbackSrcs={FARM_STORY_FALLBACKS}
            alt="Jamaican farm fields and fresh produce"
            sizes="(min-width: 1024px) 690px, 100vw"
            className="object-cover object-center transition duration-700 hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#FFFDF7]/55 lg:bg-gradient-to-r" />

          <div className="absolute bottom-6 left-6 z-20 rounded-3xl border border-white/45 bg-white/86 px-5 py-4 shadow-[0_22px_60px_rgba(18,61,40,0.16)] backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B681C]">
              Premium local market
            </p>
            <p className="mt-1 text-sm font-black text-[#123D28]">
              Fresh • Local • Jamaican
            </p>
          </div>
        </div>

        <div className="relative flex items-center overflow-hidden px-6 py-8 sm:px-9 lg:px-12">
          <div className="absolute -right-24 top-8 h-80 w-80 rounded-full bg-[#EAF5E7]/90" />
          <div className="absolute right-10 bottom-4 hidden text-[#2D6741]/[0.045] lg:block">
            <Leaf className="h-52 w-52" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DFA75A]">Our farm, our promise.</p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl font-black leading-[1.02] tracking-[-0.04em] text-[#123D28] sm:text-4xl lg:text-[2.8rem]">
              Rooted in Jamaica. Grown with Purpose.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#4F5D53] sm:text-base sm:leading-8">
              We are building a premium local market experience around fresh produce, clear ordering, trusted fulfillment, and a stronger connection between Jamaican farms and families.
            </p>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#4F5D53] sm:text-base sm:leading-8">
              Every section of the marketplace is designed to feel clean, safe, modern, and still deeply Jamaican.
            </p>
            <div className="mt-6">
              <PrimaryButton href="/my-box">
                <Download className="h-4 w-4" />
                Build Your Box
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FreshFromFarmSection({ products, loading }: { products: Product[]; loading: boolean }) {
  return (
    <section className="mx-auto max-w-[1450px] px-4 pb-8 sm:px-6 lg:px-10">
      <SectionHeading
        eyebrow="Fresh from the farm"
        title="Premium picks for your table"
        subtitle="Clean product cards, stronger images, clearer stock, and faster request actions."
        action={
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-[#123D28] transition hover:bg-white">
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {loading && products.length === 0
          ? Array.from({ length: 6 }).map((_, index) => <ProductSkeleton key={`product-skeleton-${index}`} />)
          : products.length
            ? products.map((product) => <LiveProductCard key={product.id} product={product} compact />)
            : fallbackProduce.map((item) => <FallbackProductCard key={item.name} item={item} />)}
      </div>
    </section>
  );
}

function LiveProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const available = canAddToCart(product);
  const stock = stockLabel(product);
  const currentPrice = effectivePrice(product);
  const oldPrice = originalPrice(product);
  const discounted = hasActiveDiscount(product);

  function handleAddToBox() {
    if (!available) return;

    addToCart(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#D8E5D4] bg-white shadow-[0_10px_28px_rgba(18,61,40,0.07)] transition duration-300 hover:-translate-y-0.5 hover:border-[#BFD5BC] hover:shadow-[0_18px_44px_rgba(18,61,40,0.13)]">
      <Link href={`/product/${product.id}`} className={cx('relative block overflow-hidden bg-[#F7FBF5]', compact ? 'h-44' : 'h-52')}>
        <ProductImage product={product} className="object-contain p-4 transition duration-300 group-hover:scale-[1.04]" />

        <div className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#2D6741] shadow-sm backdrop-blur">
          {product.category || 'Fresh'}
        </div>

        {discounted ? (
          <div className="absolute right-3 top-3 rounded-full bg-[#DFA75A] px-3 py-1 text-[10px] font-black text-[#123D28] shadow-sm">
            Deal
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/product/${product.id}`} className="line-clamp-2 min-h-[48px] text-[17px] font-black leading-6 text-[#123D28] transition hover:text-[#2D6741] hover:underline">
          {product.name}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-black tracking-[-0.03em] text-[#111827]">
            {formatJmd(currentPrice)}
          </span>
          <span className="text-xs font-semibold text-[#5F6A62]">/ {product.unit || 'each'}</span>
        </div>

        {discounted ? (
          <p className="mt-1 text-xs font-bold text-[#5F6A62]">
            Was <span className="line-through">{formatJmd(oldPrice)}</span>
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black', available ? 'bg-[#EAF5E7] text-[#2D6741]' : 'bg-[#FFF3D9] text-[#9B681C]')}>
            <span className={cx('h-2 w-2 rounded-full', available ? 'bg-[#2D6741]' : 'bg-[#DFA75A]')} />
            {stock}
          </span>
          <span className="rounded-full bg-[#FFFDF7] px-3 py-1 text-xs font-black text-[#5F6A62] ring-1 ring-[#D8E5D4]">
            Local farm pick
          </span>
        </div>

        <p className="mt-3 text-xs font-semibold leading-5 text-[#5F6A62]">
          Farm pickup available • Delivery confirmed at checkout
        </p>

        <div className="mt-auto grid gap-2 pt-4">
          <button
            type="button"
            onClick={handleAddToBox}
            disabled={!available}
            className={cx(
              'flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-black shadow-sm transition',
              available
                ? added
                  ? 'bg-[#2D6741] text-white'
                  : 'bg-[#FFD66B] text-[#123D28] hover:bg-[#F7C948]'
                : 'cursor-not-allowed bg-[#E5E7EB] text-[#6B7280]'
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            {available ? (added ? 'Added to Box' : 'Add to Box') : 'Unavailable'}
          </button>

          <Link
            href={`/product/${product.id}`}
            className="flex min-h-[38px] items-center justify-center rounded-full border border-[#D8E5D4] bg-white px-4 py-2 text-xs font-black text-[#123D28] transition hover:bg-[#F4F9F2]"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

function FallbackProductCard({ item }: { item: FallbackProduce }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[#D8E5D4] bg-white shadow-[0_10px_28px_rgba(18,61,40,0.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(18,61,40,0.13)]">
      <Link href="/shop" className="relative block h-52 overflow-hidden bg-[#F7FBF5]">
        <Image src={item.image} alt={item.name} fill sizes="260px" className="object-contain p-4 transition duration-300 hover:scale-[1.04]" unoptimized />
        <div className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#2D6741] shadow-sm backdrop-blur">
          {item.category}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[48px] text-[17px] font-black leading-6 text-[#123D28]">{item.name}</h3>
        <p className="mt-2 text-xl font-black tracking-[-0.03em] text-[#111827]">
          {formatJmd(item.price)} <span className="text-xs font-semibold text-[#5F6A62]">/ {item.unit}</span>
        </p>
        <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF5E7] px-3 py-1 text-xs font-black text-[#2D6741]"><span className="h-2 w-2 rounded-full bg-[#2D6741]" />{item.stock} in stock</p>
        <p className="mt-3 text-xs font-semibold leading-5 text-[#5F6A62]">Farm pickup available • Delivery confirmed at checkout</p>

        <Link href="/shop" className="mt-auto flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-[#FFD66B] px-4 py-2 text-sm font-black text-[#123D28] shadow-sm transition hover:bg-[#F7C948]">
          <ShoppingCart className="h-4 w-4" />
          Add to Box
        </Link>
      </div>
    </article>
  );
}

function ProductSkeleton() {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[#D8E5D4] bg-white shadow-[0_14px_42px_rgba(18,61,40,0.075)]">
      <div className="h-44 animate-pulse bg-[#EAF5E7]" />
      <div className="p-4">
        <div className="h-3 w-16 animate-pulse rounded-full bg-[#EAF5E7]" />
        <div className="mt-3 h-5 w-28 animate-pulse rounded-full bg-[#EAF5E7]" />
        <div className="mt-4 h-11 w-full animate-pulse rounded-2xl bg-[#EAF5E7]" />
      </div>
    </article>
  );
}

function WeeklyBoxSection() {
  return (
    <section className="mx-auto max-w-[1450px] px-4 pb-8 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[30px] bg-[#0B3A25] shadow-[0_28px_80px_rgba(18,61,40,0.22)]">
        <div className="absolute inset-0">
          <SafePublicImage
            src={WEEKLY_BOX_IMAGE}
            fallbackSrcs={WEEKLY_BOX_FALLBACKS}
            alt="Weekly harvest boxes filled with fresh produce"
            sizes="1450px"
            className="object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B3A25] via-[#0B3A25]/78 to-[#0B3A25]/30" />
          <div className="absolute inset-y-0 right-0 w-[42%] bg-gradient-to-l from-[#0B3A25]/90 to-transparent" />
        </div>

        <div className="relative z-10 grid gap-6 px-6 py-8 sm:px-9 lg:min-h-[280px] lg:grid-cols-[1fr_0.42fr] lg:items-center lg:px-11">
          <div className="max-w-2xl text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DFA75A]">This week's harvest</p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl font-black leading-[1.02] tracking-[-0.04em] sm:text-4xl lg:text-[3rem]">
              Carefully packed weekly harvest boxes
            </h2>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-white/86 sm:text-base">
              Enjoy the best of the season with curated boxes packed with premium, fresh produce straight from the farm.
            </p>
          </div>

          <div className="rounded-[26px] border border-white/18 bg-white/12 p-5 text-white shadow-[0_22px_55px_rgba(0,0,0,0.14)] backdrop-blur-md">
            <ul className="space-y-3 text-sm font-bold text-white/90">
              {['Farm-fresh & seasonal', 'Curated for quality', 'Delivered with care'].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-[#DFA75A]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/my-box" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#123D28] transition hover:-translate-y-0.5 hover:bg-[#FFF3D9]">
              <Package className="h-4 w-4" />
              Build Your Box
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppSection() {
  return (
    <section className="mx-auto max-w-[1450px] px-4 pb-12 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[32px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_26px_80px_rgba(18,61,40,0.10)]">
        <div className="absolute inset-0">
          <SafePublicImage
            src={ANDROID_BACKGROUND_IMAGE}
            fallbackSrcs={ANDROID_BACKGROUND_FALLBACKS}
            alt=""
            sizes="1450px"
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#FFFDF7_0%,#FFFDF7_43%,rgba(255,253,247,0.88)_57%,rgba(255,253,247,0.38)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(223,167,90,0.10),transparent_28%),radial-gradient(circle_at_78%_72%,rgba(45,103,65,0.08),transparent_32%)]" />
        </div>

        <div className="relative z-10 grid gap-6 px-6 py-8 sm:px-8 lg:min-h-[340px] lg:grid-cols-[0.48fr_0.52fr] lg:items-center lg:px-11">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DFA75A]">On the go</p>
            <h2 className="mt-2 font-serif text-3xl font-black leading-tight tracking-[-0.04em] text-[#123D28] sm:text-4xl lg:text-[2.65rem]">
              Take the farm with you
            </h2>
            <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-[#4F5D53] sm:text-base">
              Shop fresh produce, view deals, build your box, and track your orders from the Harvest Place Ja app.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ExternalButton href={ANDROID_APP_URL}>
                <Download className="h-4 w-4" />
                Get Android App
              </ExternalButton>

              <SecondaryButton href="/shop">
                <ShoppingBag className="h-4 w-4" />
                Shop Fresh Picks
              </SecondaryButton>
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden lg:min-h-[360px]">
            <div className="absolute left-0 top-6 hidden h-[76%] w-px bg-[#D8E5D4] lg:block" />

            <div className="absolute bottom-[-70px] left-1/2 z-20 h-[390px] w-[214px] -translate-x-1/2 sm:bottom-[-80px] sm:h-[420px] sm:w-[232px] lg:left-[14%] lg:h-[455px] lg:w-[252px] lg:translate-x-0 xl:left-[16%] xl:h-[475px] xl:w-[262px]">
              <Image
                src={APP_PHONE_IMAGE}
                alt="The Harvest Place Ja Android app"
                fill
                sizes="270px"
                className="object-contain object-bottom drop-shadow-[0_34px_50px_rgba(18,61,40,0.20)]"
                unoptimized
              />
            </div>

            <a
              href={ANDROID_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-5 top-5 z-30 hidden transition hover:-translate-y-0.5 lg:block"
              aria-label="Get The Harvest Place Ja app on Google Play"
            >
              <Image
                src={GOOGLE_PLAY_BADGE_IMAGE}
                alt="Get it on Google Play"
                width={190}
                height={58}
                className="h-auto w-[180px] object-contain drop-shadow-[0_12px_22px_rgba(18,61,40,0.16)]"
                unoptimized
              />
            </a>

            <div className="absolute bottom-8 right-6 hidden rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_24px_70px_rgba(18,61,40,0.12)] backdrop-blur-md lg:block">
              <div className="grid gap-3 text-xs font-black text-[#123D28]">
                {['Easy ordering', 'Track your orders', 'Exclusive app deals'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-[#2D6741]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1450px] px-4 pb-6 sm:px-6 lg:px-10">
      <div className="rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] px-4 py-3 text-sm font-black text-[#8B5D18]">
        {children}
      </div>
    </div>
  );
}

function ShopLayout({ products, loading, notice }: { products: Product[]; loading: boolean; notice: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<ProductSort>('featured');

  const categories = useMemo(() => ['All', ...productCategories(products)], [products]);
  const filtered = useMemo(() => filterAndSortProducts(products, query, category, sort), [products, query, category, sort]);

  return (
    <div className="min-h-screen bg-[#FAF8F0] text-[#123D28]">
      <section className="relative overflow-hidden border-b border-[#D8E5D4] bg-[#FFFDF7]">
        <div className="absolute inset-0">
          <SafePublicImage
            src={SHOP_HERO_IMAGE}
            fallbackSrcs={SHOP_HERO_FALLBACKS}
            alt=""
            sizes="100vw"
            className="object-cover object-center opacity-32"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#FFFDF7_0%,rgba(255,253,247,0.92)_46%,rgba(234,245,231,0.72)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1450px] px-4 py-9 sm:px-6 lg:px-10 lg:py-11">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DFA75A]">Shop fresh produce</p>
          <h1 className="mt-3 font-serif text-4xl font-black leading-tight tracking-[-0.045em] text-[#123D28] sm:text-5xl lg:text-6xl">
            This Week&apos;s Harvest
          </h1>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-8 text-[#4F5D53]">
            Fresh Jamaican produce available from The Harvest Place Ja. Search, filter, and request items with confidence.
          </p>

          <div className="mt-7 grid gap-3 rounded-[26px] border border-[#D8E5D4] bg-white/88 p-3 shadow-[0_22px_60px_rgba(18,61,40,0.10)] backdrop-blur lg:grid-cols-[1fr_220px_220px]">
            <label className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-[#F7FBF5] px-4 ring-1 ring-[#D8E5D4]/60">
              <Search className="h-5 w-5 text-[#2D6741]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search harvest items..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#5F6A62]/70"
              />
            </label>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-[52px] rounded-2xl border border-[#D8E5D4] bg-white px-4 text-sm font-black text-[#123D28] outline-none transition focus:border-[#2D6741]"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProductSort)}
              className="min-h-[52px] rounded-2xl border border-[#D8E5D4] bg-white px-4 text-sm font-black text-[#123D28] outline-none transition focus:border-[#2D6741]"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock">Most Stock</option>
            </select>
          </div>
        </div>
      </section>

      {notice ? <Notice>{notice}</Notice> : null}

      <section className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-10">
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => <ProductSkeleton key={`shop-loading-${index}`} />)}
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {filtered.map((product) => <LiveProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-[30px] border border-[#D8E5D4] bg-white p-10 text-center shadow-[0_20px_60px_rgba(18,61,40,0.08)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
              <Leaf className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-serif text-3xl font-black text-[#123D28]">No harvest items available right now.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-[#5F6A62]">
              Try another search or check Ready Soon for produce coming next.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <SecondaryButton href="/ready-soon">View Ready Soon</SecondaryButton>
              <PrimaryButton href="/my-box">Build Your Box</PrimaryButton>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
