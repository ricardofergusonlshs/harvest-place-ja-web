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
  Smartphone,
  Sprout,
  Truck,
} from 'lucide-react';
import { fetchProducts } from '@/lib/services';
import { formatJmd } from '@/lib/format';
import type { Product } from '@/lib/types';

const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.harvestplaceja.myapp&pli=1';

const FALLBACK_PRODUCT_IMAGE = '/logo.png';
const CORRECT_SUPABASE_HOST = 'zvgvvsgjzfygbsqwawoh.supabase.co';
const WRONG_SUPABASE_HOST = 'zvgvvsgjzfyqbsqwawoh.supabase.co';

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
    return FALLBACK_PRODUCT_IMAGE;
  }

  const imageUrl = rawUrl.trim();

  if (!imageUrl) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  // Fix the old wrong Supabase project domain without changing the database.
  if (imageUrl.includes(WRONG_SUPABASE_HOST)) {
    return imageUrl.replace(WRONG_SUPABASE_HOST, CORRECT_SUPABASE_HOST);
  }

  // Keep valid full URLs exactly as they are.
  if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
    return imageUrl;
  }

  // Keep valid local public paths if any are used.
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // Convert storage paths like "products/ackee.jpg" into a full Supabase public URL.
  return `https://${CORRECT_SUPABASE_HOST}/storage/v1/object/public/product-images/${imageUrl}`;
}

const HERO_IMAGE = '/marketplace-hero-clean.png';
const HERO_IMAGE_FALLBACKS = ['/elite/hero-produce-box.png', '/elite/weekly-box-banner.png', FALLBACK_PRODUCT_IMAGE];
const FARM_STORY_IMAGE = '/elite/farmer-story.png';
const WEEKLY_BOX_IMAGE = '/elite/weekly-box-banner.png';
const READY_SOON_IMAGE = '/elite/ready-soon-card.png';
const APP_PHONE_IMAGE = '/elite/harvestplaceja-app-phone.png';
const GOOGLE_PLAY_BADGE_IMAGE = '/elite/google-play-badge.png';
const CERTIFIED_BADGE_IMAGE = '/elite/certified-jamaican-badge.png';

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

const trustChips: TrustChip[] = [
  { label: 'Farm Fresh', icon: Leaf },
  { label: 'Sustainable', icon: Sprout },
  { label: 'Secure Ordering', icon: ShieldCheck },
  { label: 'Fast Delivery', icon: Truck },
];

const shortcutCards: ShortcutCard[] = [
  {
    title: 'Fresh Picks',
    text: 'Shop our hand-selected farm-fresh produce.',
    label: 'Shop Now',
    href: '/shop',
    icon: Leaf,
  },
  {
    title: 'Ready Soon',
    text: "See what's coming fresh this week.",
    label: "See What's Coming",
    href: '/ready-soon',
    icon: CalendarDays,
  },
  {
    title: 'Weekly Box Deals',
    text: 'Save more with our curated harvest boxes.',
    label: 'Explore Boxes',
    href: '/my-box',
    icon: Package,
  },
  {
    title: 'Our Farm Story',
    text: 'Rooted in Jamaica. Grown with purpose.',
    label: 'Learn Our Story',
    href: '#farm-story',
    icon: Sprout,
  },
  {
    title: 'Use the App',
    text: 'Shop, track, and get fresh on the go.',
    label: 'Get the App',
    href: ANDROID_APP_URL,
    icon: Smartphone,
    external: true,
  },
];

const fallbackProduce: FallbackProduce[] = [
  { name: 'Oregano', category: 'Herbs', price: 150, unit: 'bunch', stock: 8, image: '/categories/herbs.jpg' },
  { name: 'Garlic', category: 'Vegetables', price: 300, unit: 'lb', stock: 9, image: '/categories/vegetables.jpg' },
  { name: 'Sweet Potato', category: 'Ground Provisions', price: 400, unit: 'lb', stock: 14, image: '/categories/roots.jpg' },
  { name: 'Sweet Sop', category: 'Fruit', price: 100, unit: 'each', stock: 22, image: '/categories/fruits.jpg' },
  { name: 'Potato', category: 'Vegetables', price: 500, unit: 'bag', stock: 11, image: '/categories/vegetables.jpg' },
  { name: 'Melon', category: 'Fruit', price: 150, unit: 'each', stock: 9, image: '/categories/fruits.jpg' },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function productImage(product: Product) {
  const imageUrl = forceProduceImage(product);
  return imageUrl || FALLBACK_PRODUCT_IMAGE;
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

function ProductImage({ product, className = 'object-contain p-4' }: { product: Product; className?: string }) {
  const [src, setSrc] = useState(forceProduceImage(product));

  useEffect(() => {
    setSrc(forceProduceImage(product));
  }, [product.image_url]);

  return (
    <Image
      src={src}
      alt={product.name}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
      className={className}
      unoptimized={src.startsWith('http')}
      onError={() => setSrc(FALLBACK_PRODUCT_IMAGE)}
    />
  );
}

function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#183B28] px-6 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(24,59,40,0.22)] transition hover:-translate-y-0.5 hover:bg-[#2D6741]"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#DFA75A]/60 bg-white/82 px-6 py-3 text-sm font-black text-[#9B681C] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF3D9]"
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
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#183B28] px-6 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(24,59,40,0.22)] transition hover:-translate-y-0.5 hover:bg-[#2D6741]"
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
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">{eyebrow}</p> : null}
        <h2 className="font-serif text-3xl font-black tracking-[-0.035em] text-[#183B28] sm:text-[2.35rem]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm font-semibold text-[#5F6A62]">{subtitle}</p> : null}
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
    <div className="bg-[#FAF8F0] text-[#183B28]">
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
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#FFFDF7_0%,#FAF8F0_58%,#EAF5E7_100%)]">
      <div className="mx-auto max-w-[1450px] px-4 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8 lg:px-10 lg:pb-8 lg:pt-8">
        <div className="relative min-h-[560px] overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_24px_70px_rgba(24,59,40,0.10)] sm:min-h-[590px] lg:min-h-[520px] xl:min-h-[540px]">
          <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#FFF3D9]/55 blur-3xl" />
          <div className="absolute right-[-100px] top-[-90px] h-72 w-72 rounded-full bg-[#EAF5E7] blur-2xl" />

          {/* Full hero image layer: spreads across the card and fades into the content */}
          <div className="absolute inset-0 hidden overflow-hidden lg:block">
            <SafePublicImage
              src={HERO_IMAGE}
              fallbackSrcs={HERO_IMAGE_FALLBACKS}
              alt="Fresh Jamaican vegetables in a basket"
              priority
              sizes="1450px"
              className="object-cover object-[82%_center]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#FFFDF7_0%,rgba(255,253,247,0.98)_23%,rgba(255,253,247,0.82)_39%,rgba(255,253,247,0.22)_59%,rgba(255,253,247,0)_82%)]" />
            <div className="absolute inset-y-0 left-0 w-[60%] bg-[radial-gradient(circle_at_8%_28%,rgba(255,243,217,0.52),transparent_36%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF7]/5 via-transparent to-[#183B28]/8" />
          </div>

          {/* Mobile/tablet image layer */}
          <div className="absolute inset-x-0 bottom-0 block h-[330px] overflow-hidden lg:hidden">
            <SafePublicImage
              src={HERO_IMAGE}
              fallbackSrcs={HERO_IMAGE_FALLBACKS}
              alt="Fresh Jamaican vegetables in a basket"
              priority
              sizes="100vw"
              className="object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF7] via-[#FFFDF7]/76 to-transparent" />
          </div>

          <div className="relative z-20 flex min-h-[560px] flex-col justify-start px-6 py-8 sm:min-h-[590px] sm:px-8 sm:py-10 lg:min-h-[520px] lg:w-[52%] lg:justify-center lg:px-10 lg:py-12 xl:min-h-[540px] xl:w-[50%] xl:px-11">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF5E7] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#2D6741] ring-1 ring-[#2D6741]/10 sm:px-5">
              <Leaf className="h-3.5 w-3.5" />
              Grown with care in Jamaica
            </span>

            <h1 className="mt-5 max-w-[650px] font-serif text-[clamp(3.25rem,5.8vw,5.35rem)] font-black leading-[0.93] tracking-[-0.058em] text-[#183B28]">
              Fresh From
              <br />
              Our Farm To
              <br />
              Your Table
              <Leaf className="ml-2 inline h-8 w-8 text-[#2D6741]/70 sm:h-9 sm:w-9" />
            </h1>

            <p className="mt-5 max-w-[520px] text-base font-semibold leading-7 text-[#5F6A62] sm:text-[17px] sm:leading-8">
              Hand-picked. Naturally grown. Always fresh. Premium Jamaican produce delivered with care.
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

            <div className="mt-6 grid grid-cols-2 gap-3 text-[11px] font-black text-[#5F6A62] sm:flex sm:flex-wrap sm:gap-5">
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

          {/* Certified Jamaican badge PNG */}
          <div className="absolute right-4 top-4 z-30 hidden sm:block lg:right-7 lg:top-7">
            <div className="relative h-[110px] w-[110px] rounded-full lg:h-[128px] lg:w-[128px]">
              <Image
                src={CERTIFIED_BADGE_IMAGE}
                alt="Certified Jamaican premium quality badge"
                fill
                priority
                sizes="(max-width: 1024px) 110px, 128px"
                className="object-contain drop-shadow-[0_16px_34px_rgba(24,59,40,0.32)]"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShortcutSection() {
  return (
    <section className="relative z-10 mx-auto -mt-3 max-w-[1450px] px-4 pb-7 sm:px-6 lg:px-10">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {shortcutCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="group flex h-full min-h-[122px] flex-col rounded-[22px] border border-[#D8E5D4] bg-white/92 p-4 shadow-[0_18px_55px_rgba(24,59,40,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_70px_rgba(24,59,40,0.12)]">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741] ring-1 ring-[#2D6741]/10">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-serif text-lg font-black leading-tight text-[#183B28]">{card.title}</h3>
              <p className="mt-1 min-h-[34px] text-[11px] font-semibold leading-4 text-[#5F6A62]">{card.text}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-3 text-xs font-black text-[#183B28]">
                {card.label}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
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
    <section id="farm-story" className="mx-auto max-w-[1450px] px-4 pb-7 sm:px-6 lg:px-10">
      <div className="grid overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_22px_70px_rgba(24,59,40,0.08)] lg:grid-cols-[0.96fr_1.04fr]">
        <div className="relative min-h-[270px] overflow-hidden lg:min-h-[300px] xl:min-h-[330px]">
          <SafePublicImage
            src={FARM_STORY_IMAGE}
            fallbackSrcs={[HERO_IMAGE]}
            alt="Jamaican farm fields and fresh produce"
            sizes="(min-width: 1024px) 650px, 100vw"
            className="object-cover object-center transition duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#FFFDF7]/55 lg:bg-gradient-to-r" />
        </div>

        <div className="relative flex items-center overflow-hidden px-6 py-7 sm:px-9 sm:py-8 lg:px-10">
          <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-[#EAF5E7]/80" />
          <div className="absolute right-8 bottom-4 hidden text-[#2D6741]/[0.05] lg:block">
            <Leaf className="h-48 w-48" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DFA75A]">Our farm, our promise.</p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl font-black leading-[1.04] tracking-[-0.035em] text-[#183B28] sm:text-4xl lg:text-[2.55rem]">
              Rooted in Jamaica. Grown with Purpose.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#4F5D53] sm:text-base sm:leading-8">
              We are a family-run farm committed to growing premium, chemical-conscious produce using sustainable methods that respect our land and nourish our community.
            </p>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#4F5D53] sm:text-base sm:leading-8">
              From our fields in Jamaica to your table, we promise freshness, quality, and a farm experience you can trust.
            </p>
            <div className="mt-5">
              <PrimaryButton href="#farm-story">
                <Leaf className="h-4 w-4" />
                Explore Our Farm
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
    <section className="mx-auto max-w-[1450px] px-4 pb-7 sm:px-6 lg:px-10">
      <SectionHeading
        title="Fresh From The Farm"
        subtitle="Hand-picked. Naturally grown. Always fresh."
        action={
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-[#183B28] transition hover:bg-white">
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {loading && products.length === 0
          ? Array.from({ length: 6 }).map((_, index) => <ProductSkeleton key={`product-skeleton-${index}`} />)
          : products.length
            ? products.map((product) => <LiveProductCard key={product.id} product={product} />)
            : fallbackProduce.map((item) => <FallbackProductCard key={item.name} item={item} />)}
      </div>
    </section>
  );
}

function LiveProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-[21px] border border-[#D8E5D4] bg-white shadow-[0_12px_34px_rgba(24,59,40,0.075)] transition hover:-translate-y-1 hover:shadow-[0_22px_62px_rgba(24,59,40,0.13)]">
      <Link href={`/product/${product.id}`} className="relative block h-36 bg-[#F7FBF5]">
        <ProductImage product={product} />
      </Link>

      <div className="p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#DFA75A]">{product.category || 'Fresh produce'}</p>
        <Link href={`/product/${product.id}`} className="mt-1 line-clamp-1 block text-base font-black text-[#183B28] hover:text-[#2D6741]">
          {product.name}
        </Link>
        <p className="mt-1 text-sm font-bold text-[#1E2A21]">
          {formatJmd(Number(product.price || 0))} <span className="text-xs font-semibold text-[#5F6A62]">/ {product.unit || 'each'}</span>
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#5F6A62]">
          <span className="h-2 w-2 rounded-full bg-[#2D6741]" />
          {stockLabel(product)}
        </p>
        <Link
          href={`/product/${product.id}`}
          className="mt-3 flex min-h-[38px] items-center justify-center gap-2 rounded-xl bg-[#2D6741] px-4 py-2 text-xs font-black text-white transition hover:bg-[#183B28]"
        >
          <ShoppingBag className="h-4 w-4" />
          Request Item
        </Link>
      </div>
    </article>
  );
}

function FallbackProductCard({ item }: { item: FallbackProduce }) {
  return (
    <article className="overflow-hidden rounded-[21px] border border-[#D8E5D4] bg-white shadow-[0_12px_34px_rgba(24,59,40,0.075)]">
      <div className="relative h-36 bg-[#F7FBF5]">
        <Image src={item.image} alt={item.name} fill sizes="240px" className="object-contain p-4" unoptimized />
      </div>
      <div className="p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#DFA75A]">{item.category}</p>
        <h3 className="mt-1 text-base font-black text-[#183B28]">{item.name}</h3>
        <p className="mt-1 text-sm font-bold text-[#1E2A21]">{formatJmd(item.price)} <span className="text-xs font-semibold text-[#5F6A62]">/ {item.unit}</span></p>
        <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#5F6A62]"><span className="h-2 w-2 rounded-full bg-[#2D6741]" />{item.stock} in stock</p>
        <Link href="/shop" className="mt-3 flex min-h-[38px] items-center justify-center gap-2 rounded-xl bg-[#2D6741] px-4 py-2 text-xs font-black text-white transition hover:bg-[#183B28]">
          <ShoppingBag className="h-4 w-4" />
          Request Item
        </Link>
      </div>
    </article>
  );
}

function ProductSkeleton() {
  return (
    <article className="overflow-hidden rounded-[21px] border border-[#D8E5D4] bg-white shadow-[0_12px_34px_rgba(24,59,40,0.075)]">
      <div className="h-40 animate-pulse bg-[#EAF5E7]" />
      <div className="p-4">
        <div className="h-3 w-16 animate-pulse rounded-full bg-[#EAF5E7]" />
        <div className="mt-3 h-5 w-28 animate-pulse rounded-full bg-[#EAF5E7]" />
        <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-[#EAF5E7]" />
      </div>
    </article>
  );
}

function WeeklyBoxSection() {
  return (
    <section className="mx-auto max-w-[1450px] px-4 pb-7 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[26px] bg-[#0B3A25] shadow-[0_22px_66px_rgba(24,59,40,0.18)]">
        <div className="absolute inset-0">
          <SafePublicImage
            src={WEEKLY_BOX_IMAGE}
            fallbackSrcs={[HERO_IMAGE]}
            alt="Weekly harvest boxes filled with fresh produce"
            sizes="1450px"
            className="object-cover object-center opacity-78"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B3A25] via-[#0B3A25]/76 to-[#0B3A25]/35" />
          <div className="absolute inset-y-0 right-0 w-[42%] bg-gradient-to-l from-[#0B3A25]/95 to-transparent" />
        </div>

        <div className="relative z-10 grid gap-6 px-6 py-7 sm:px-9 lg:min-h-[220px] lg:grid-cols-[1fr_0.4fr] lg:items-center lg:px-10 lg:py-8">
          <div className="max-w-2xl text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">This week's harvest</p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl font-black leading-[1.02] tracking-[-0.035em] sm:text-4xl lg:text-[2.75rem]">
              Carefully packed weekly harvest boxes
            </h2>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-white/86 sm:text-base">
              Enjoy the best of the season with our curated boxesâ€”packed with premium, fresh produce straight from our farm to you.
            </p>
          </div>

          <div className="rounded-[22px] border border-white/16 bg-white/10 p-5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <ul className="space-y-3 text-sm font-bold text-white/88">
              {['Farm-fresh & seasonal', 'Curated for quality', 'Delivered with care'].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-[#DFA75A]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/my-box" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#183B28] transition hover:-translate-y-0.5 hover:bg-[#FFF3D9]">
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
    <section className="mx-auto max-w-[1450px] px-4 pb-10 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_22px_66px_rgba(24,59,40,0.10)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(45,103,65,0.18),transparent_30%),linear-gradient(90deg,#FFFDF7_0%,#FFFDF7_42%,rgba(234,245,231,0.86)_72%,rgba(255,243,217,0.36)_100%)]" />

        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <SafePublicImage
            src={FARM_STORY_IMAGE}
            fallbackSrcs={[HERO_IMAGE]}
            alt=""
            sizes="900px"
            className="object-cover object-center opacity-33 blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFFDF7] via-[#FFFDF7]/60 to-[#183B28]/14" />
        </div>

        <div className="relative z-10 grid gap-5 px-6 py-6 sm:px-8 lg:min-h-[245px] lg:grid-cols-[0.44fr_0.29fr_0.27fr] lg:items-center lg:px-10 lg:py-0">
          <div className="lg:py-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DFA75A]">On the go</p>
            <h2 className="mt-2 font-serif text-3xl font-black leading-tight tracking-[-0.035em] text-[#183B28] sm:text-4xl lg:text-[2.45rem]">
              Take the farm with you
            </h2>
            <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-[#4F5D53] sm:text-base">
              Shop fresh produce, view deals, build your box, and track your orders from the Harvest Place Ja app.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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

          <div className="relative order-3 mx-auto h-[270px] w-full max-w-[240px] overflow-visible lg:order-none lg:h-[245px] lg:max-w-[260px] lg:self-end">
            <div className="absolute bottom-2 left-1/2 h-[82%] w-[86%] -translate-x-1/2 rounded-full bg-[#EAF5E7]/75 blur-2xl" />
            <Image
              src={APP_PHONE_IMAGE}
              alt="Harvest Place Ja Android app showing deals, fresh products, My Box, Orders, and Account navigation"
              fill
              sizes="(min-width: 1024px) 260px, 240px"
              className="relative z-10 object-contain object-bottom drop-shadow-[0_22px_44px_rgba(24,59,40,0.25)]"
              unoptimized
            />
          </div>

          <div className="order-2 flex flex-col items-start gap-3 lg:order-none lg:items-end">
            <a href={ANDROID_APP_URL} target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play" className="inline-flex transition hover:-translate-y-0.5">
              <span className="relative block h-[48px] w-[158px] overflow-hidden rounded-xl shadow-[0_18px_45px_rgba(0,0,0,0.22)] sm:h-[54px] sm:w-[180px]">
                <Image src={GOOGLE_PLAY_BADGE_IMAGE} alt="Get it on Google Play" fill sizes="190px" className="object-contain" unoptimized />
              </span>
            </a>

            <div className="mt-2 grid gap-2 text-xs font-black text-[#183B28]">
              {['Easy Ordering', 'Track Your Orders', 'Exclusive App Deals'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/82 px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#2D6741]" />
                  {item}
                </span>
              ))}
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
    <div className="min-h-screen bg-[#FAF8F0] text-[#183B28]">
      <section className="border-b border-[#D8E5D4] bg-[radial-gradient(circle_at_top_left,#FFFFFF_0%,#FAF8F0_45%,#EAF5E7_100%)]">
        <div className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-10 lg:py-8">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DFA75A]">Shop fresh produce</p>
          <h1 className="mt-3 font-serif text-4xl font-black leading-tight tracking-[-0.045em] text-[#183B28] sm:text-5xl lg:text-6xl">
            This Week's Harvest
          </h1>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-8 text-[#5F6A62]">
            Fresh produce available from The Harvest Place Ja.
          </p>

          <div className="mt-6 grid gap-3 rounded-[24px] border border-[#D8E5D4] bg-white/80 p-3 shadow-[0_18px_50px_rgba(24,59,40,0.08)] lg:grid-cols-[1fr_220px_220px]">
            <label className="flex min-h-[48px] items-center gap-3 rounded-2xl bg-[#F7FBF5] px-4">
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
              className="min-h-[48px] rounded-2xl border border-[#D8E5D4] bg-white px-4 text-sm font-black text-[#183B28] outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProductSort)}
              className="min-h-[48px] rounded-2xl border border-[#D8E5D4] bg-white px-4 text-sm font-black text-[#183B28] outline-none"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => <ProductSkeleton key={`shop-loading-${index}`} />)}
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {filtered.map((product) => <LiveProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-[28px] border border-[#D8E5D4] bg-white p-10 text-center shadow-[0_18px_55px_rgba(24,59,40,0.08)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
              <Leaf className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-serif text-3xl font-black text-[#183B28]">No harvest items available right now.</h2>
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


