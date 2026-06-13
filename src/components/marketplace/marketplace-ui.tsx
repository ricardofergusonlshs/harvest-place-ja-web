'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  ArrowRight,
  Bell,
  Box,
  CheckCircle2,
  Download,
  Home,
  Leaf,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Truck,
} from 'lucide-react';
import { fetchProducts } from '@/lib/services';
import { formatJmd } from '@/lib/format';
import type { Product } from '@/lib/types';

const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.harvestplaceja.myapp&pli=1';
const HERO_IMAGE = '/elite/hero-produce-box.png';
const FARM_STORY_IMAGE = '/elite/farmer-story.png';
// Real wide HPJ box image used for the weekly box banner.
const WEEKLY_BOX_IMAGE = '/elite/hero-produce-box.png';
const APP_PHONE_IMAGE = '/elite/harvestplaceja-app-phone.png';
const GOOGLE_PLAY_BADGE_IMAGE = '/elite/google-play-badge.png';
const FALLBACK_PRODUCT_IMAGE = '/logo.png';

type MarketMode = 'home' | 'shop';
type ProductSort = 'featured' | 'price-low' | 'price-high' | 'stock';

type FeatureCard = {
  title: string;
  text: string;
  href: string;
  label: string;
  image: string;
  icon: ComponentType<{ className?: string }>;
};

type ProduceItem = {
  name: string;
  text: string;
  image: string;
};

const features: FeatureCard[] = [
  {
    title: "This Week's Harvest",
    text: "See what's fresh and ready now.",
    href: '/shop',
    label: 'Order Harvest',
    image: HERO_IMAGE,
    icon: Leaf,
  },
  {
    title: 'Harvest Boxes',
    text: 'Build a weekly box with fresh farm picks.',
    href: '/my-box',
    label: 'Build Your Box',
    image: WEEKLY_BOX_IMAGE,
    icon: Package,
  },
  {
    title: 'Farm Story',
    text: 'Rooted in Jamaica. Grown with purpose.',
    href: '#farm-story',
    label: 'Learn Our Story',
    image: FARM_STORY_IMAGE,
    icon: Home,
  },
  {
    title: 'Shop Now',
    text: 'Browse available produce and request items.',
    href: '/shop',
    label: 'Start Order',
    image: '/categories/vegetables.jpg',
    icon: ShoppingBag,
  },
];

const fallbackProduce: ProduceItem[] = [
  { name: 'Callaloo', text: 'Tender & Nutritious', image: '/categories/herbs.jpg' },
  { name: 'Sweet Pepper', text: 'Crisp & Colorful', image: '/categories/vegetables.jpg' },
  { name: 'Scallion', text: 'Fresh & Flavorful', image: '/categories/all-categories.jpg' },
  { name: 'Yam', text: 'Hearty & Wholesome', image: '/categories/roots.jpg' },
  { name: 'Lettuce', text: 'Crisp & Refreshing', image: '/categories/vegan-picks.jpg' },
  { name: 'Tomatoes', text: 'Juicy & Ripe', image: '/hero-produce.jpg' },
  { name: 'Herbs', text: 'Aromatic & Fresh', image: '/categories/herbs.jpg' },
];

const trustItems = [
  {
    title: 'Freshly Harvested',
    text: 'Picked at peak freshness for maximum flavor.',
    icon: Leaf,
  },
  {
    title: 'Grown With Care',
    text: 'Sustainable practices that care for our land.',
    icon: Sprout,
  },
  {
    title: 'Safe Ordering',
    text: 'Secure orders and easy, hassle-free ordering.',
    icon: ShieldCheck,
  },
  {
    title: 'Reliable Delivery or Pickup',
    text: 'Choose delivery or pickup that fits your schedule.',
    icon: Truck,
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function productImage(product: Product) {
  return product.image_url || FALLBACK_PRODUCT_IMAGE;
}

function productAvailable(product: Product) {
  return Number(product.stock_quantity || 0) > 0 && product.is_available && product.product_status !== 'hidden';
}

function stockLabel(product: Product) {
  if (product.ready_soon || product.product_status === 'ready_soon') return 'Ready soon';
  if (productAvailable(product)) return `${Number(product.stock_quantity || 0)} in stock`;
  return 'Check availability';
}

function productCategories(products: Product[]) {
  return Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort();
}

function filterAndSortProducts(products: Product[], query: string, category: string, sort: ProductSort) {
  const normalizedQuery = query.trim().toLowerCase();
  let rows = products.filter((product) => {
    const haystack = `${product.name} ${product.description || ''} ${product.category || ''} ${product.unit || ''}`.toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    const matchesCategory = category === 'All' || product.category === category;
    return matchesQuery && matchesCategory;
  });

  rows = [...rows].sort((a, b) => {
    if (sort === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
    if (sort === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
    if (sort === 'stock') return Number(b.stock_quantity || 0) - Number(a.stock_quantity || 0);
    return Number(b.is_deal_of_day ? 1 : 0) - Number(a.is_deal_of_day ? 1 : 0);
  });

  return rows;
}

function ProductImage({ product, className = 'object-contain p-3' }: { product: Product; className?: string }) {
  const [src, setSrc] = useState(productImage(product));

  useEffect(() => {
    setSrc(productImage(product));
  }, [product.image_url]);

  return (
    <Image
      src={src}
      alt={product.name}
      fill
      sizes="(max-width: 768px) 50vw, 240px"
      unoptimized={src.startsWith('http')}
      className={className}
      onError={() => setSrc(FALLBACK_PRODUCT_IMAGE)}
    />
  );
}

function LiveHarvestProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-[22px] border border-[#D8E5D4] bg-white shadow-[0_14px_35px_rgba(24,59,40,0.07)] transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(24,59,40,0.12)]">
      <Link href={`/product/${product.id}`} className={cx('relative block overflow-hidden bg-[#F4F9F2]', compact ? 'h-32' : 'h-48')}>
        <ProductImage product={product} />
      </Link>

      <div className="p-4 text-center">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#DFA75A]">
          {product.category || 'Fresh produce'}
        </p>
        <Link href={`/product/${product.id}`} className="mt-1 line-clamp-1 block text-base font-black text-[#183B28] hover:text-[#2D6741]">
          {product.name}
        </Link>
        <p className="mt-1 text-sm font-semibold text-[#5F6A62]">
          {formatJmd(Number(product.price || 0))} / {product.unit || 'each'}
        </p>
        <p className="mt-2 truncate text-xs font-black text-[#5F6A62]">{stockLabel(product)}</p>
        <Link
          href={`/product/${product.id}`}
          className="mt-4 inline-flex rounded-lg bg-[#2D6741] px-4 py-2 text-xs font-black text-white transition hover:bg-[#183B28]"
        >
          Order Item
        </Link>
      </div>
    </article>
  );
}

function FallbackProduceCard({ item }: { item: ProduceItem }) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-[#D8E5D4] bg-white shadow-[0_14px_35px_rgba(24,59,40,0.07)]">
      <div className="relative h-32 bg-[#F4F9F2]">
        <Image src={item.image} alt={item.name} fill sizes="220px" className="object-cover" />
      </div>
      <div className="p-4 text-center">
        <h3 className="text-base font-black text-[#183B28]">{item.name}</h3>
        <p className="mt-1 text-xs font-semibold text-[#5F6A62]">{item.text}</p>
        <Link href="/shop" className="mt-4 inline-flex rounded-lg bg-[#2D6741] px-4 py-2 text-xs font-black text-white transition hover:bg-[#183B28]">
          Shop Now
        </Link>
      </div>
    </article>
  );
}

function HarvestProductSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-[#D8E5D4] bg-white shadow-[0_14px_35px_rgba(24,59,40,0.07)]">
      <div className={cx('animate-pulse bg-[#EAF5E7]', compact ? 'h-32' : 'h-48')} />
      <div className="p-4 text-center">
        <div className="mx-auto h-3 w-16 animate-pulse rounded-full bg-[#EAF5E7]" />
        <div className="mx-auto mt-3 h-4 w-28 animate-pulse rounded-full bg-[#EAF5E7]" />
        <div className="mx-auto mt-3 h-8 w-24 animate-pulse rounded-lg bg-[#EAF5E7]" />
      </div>
    </article>
  );
}

function PremiumButton({ href, children, variant = 'primary' }: { href: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'gold' }) {
  const className =
    variant === 'primary'
      ? 'bg-[#183B28] text-white shadow-[0_18px_40px_rgba(24,59,40,0.24)] hover:bg-[#2D6741]'
      : variant === 'gold'
        ? 'border border-[#DFA75A]/55 bg-[#FFF3D9] text-[#183B28] hover:bg-[#F9E2B3]'
        : 'border border-[#DFA75A]/55 bg-white/75 text-[#B5791E] hover:bg-[#FFF3D9]';

  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${className}`}>
      {children}
    </Link>
  );
}

function AndroidButton({ children = 'Get Android App', variant = 'gold' }: { children?: ReactNode; variant?: 'gold' | 'green' }) {
  const className =
    variant === 'green'
      ? 'bg-[#183B28] text-white shadow-[0_18px_40px_rgba(24,59,40,0.24)] hover:bg-[#2D6741]'
      : 'bg-[#DFA75A] text-[#183B28] shadow-[0_18px_40px_rgba(223,167,90,0.24)] hover:bg-[#F0BD73]';

  return (
    <a href={ANDROID_APP_URL} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${className}`}>
      <Download className="h-4 w-4" />
      {children}
    </a>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-[#DFA75A] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#183B28]">
      {children}
    </span>
  );
}

export function MarketplaceHomePage() {
  return <MarketplacePage mode="home" />;
}

export function MarketplaceShopPage() {
  return <MarketplacePage mode="shop" />;
}

export function MarketplacePage({ mode }: { mode: MarketMode }) {
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    async function loadShopProducts() {
      setProductsLoading(true);
      setNotice('');

      try {
        const rows = await fetchProducts();
        if (!active) return;
        setShopProducts(rows.filter((product) => product.is_available || product.ready_soon || Number(product.stock_quantity || 0) > 0));
      } catch {
        if (active) setNotice('The live shop is taking longer to load. Try refreshing, or check Supabase product permissions.');
      } finally {
        if (active) setProductsLoading(false);
      }
    }

    void loadShopProducts();

    return () => {
      active = false;
    };
  }, []);

  return mode === 'shop' ? (
    <ShopLayout products={shopProducts} loading={productsLoading} notice={notice} />
  ) : (
    <HomeLayout products={shopProducts} loading={productsLoading} notice={notice} />
  );
}

function HomeLayout({ products, loading, notice }: { products: Product[]; loading: boolean; notice: string }) {
  const harvestProducts = products.slice(0, 7);

  return (
    <main className="bg-[#FAF8F0] text-[#183B28]">
      <section className="relative overflow-hidden border-b border-[#D8E5D4] bg-[radial-gradient(circle_at_top_left,#FFFFFF_0%,#FAF8F0_44%,#EAF5E7_100%)]">
        <div className="mx-auto max-w-[1450px] px-4 pb-7 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-[#FFFEFC] shadow-[0_22px_70px_rgba(24,59,40,0.09)] sm:rounded-[34px]">
            <div className="absolute left-[30%] top-[-110px] hidden h-72 w-72 rounded-full bg-[#FFF3D9]/70 blur-3xl lg:block" />
            <div className="absolute right-[-80px] top-[-90px] h-64 w-64 rounded-full bg-[#EAF5E7]" />

            <div className="relative grid gap-0 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
              <div className="relative z-20 px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-12 xl:px-12 xl:py-14">
                <Eyebrow>Fresh from our farm to you</Eyebrow>

                <h1 className="mt-6 font-serif text-[clamp(2.55rem,8vw,4.75rem)] font-black leading-[0.95] tracking-[-0.045em] text-[#183B28] lg:text-[clamp(3.6rem,5vw,4.75rem)]">
                  <span className="block sm:whitespace-nowrap">Fresh From Our Farm</span>
                  <span className="block">To Your Table</span>
                </h1>

                <p className="mt-5 max-w-[470px] text-sm font-semibold leading-7 text-[#5F6A62] sm:text-base sm:leading-8">
                  Discover this week's harvest, build your produce box, and enjoy a premium farm experience with The Harvest Place Ja.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <PremiumButton href="/shop">
                    <Leaf className="h-4 w-4" />
                    View This Week's Harvest
                  </PremiumButton>

                  <PremiumButton href="/my-box" variant="secondary">
                    <Box className="h-4 w-4" />
                    Build Your Box
                  </PremiumButton>
                </div>
              </div>

              <div className="relative min-h-[260px] overflow-hidden sm:min-h-[340px] lg:-ml-16 lg:min-h-[430px] xl:-ml-24 xl:min-h-[470px]">
                <Image
                  src={HERO_IMAGE}
                  alt="Fresh Jamaican produce in a harvest crate"
                  fill
                  priority
                  sizes="(min-width: 1280px) 780px, (min-width: 1024px) 650px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-[#FFFEFC] via-[#FFFEFC]/78 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FFFEFC]/30 via-[#FFFEFC]/8 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#FFFEFC]/25 to-transparent" />
                <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/20 px-4 py-2 shadow-[0_14px_38px_rgba(24,59,40,0.16)] backdrop-blur-md sm:right-5 sm:top-5">
                  <CheckCircle2 className="h-4 w-4 text-[#DFA75A] drop-shadow" />
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-white drop-shadow-sm">
                    Verified Farm
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-6 grid max-w-[1380px] grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group relative min-h-[150px] overflow-hidden rounded-[24px] border border-[#D8E5D4] bg-white shadow-[0_14px_36px_rgba(24,59,40,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(24,59,40,0.11)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2D6741]"
                >
                  <div className="absolute inset-y-0 left-0 w-[62%] overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={`${feature.title} image`}
                      fill
                      sizes="(min-width: 1280px) 260px, (min-width: 640px) 340px, 70vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-white" />
                    <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-r from-transparent to-white" />
                  </div>

                  <div className="absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-[#183B28]/95 text-white shadow-[0_14px_30px_rgba(24,59,40,0.22)] sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="relative z-10 ml-[48%] flex min-h-[150px] flex-col justify-center p-5 sm:p-6">
                    <h3 className="font-serif text-xl font-black leading-tight tracking-[-0.02em] text-[#183B28] sm:text-2xl">
                      {feature.title}
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#183B28]">
                      {feature.label}
                      <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {notice ? <Notice>{notice}</Notice> : null}
      <FarmStorySection />
      <FreshFromFarmSection products={harvestProducts} loading={loading} />
      <WeeklyBoxSection />
      <TrustSection />
      <AppSection />
    </main>
  );
}

function ShopLayout({ products, loading, notice }: { products: Product[]; loading: boolean; notice: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<ProductSort>('featured');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') || '');
    setCategory(params.get('category') || 'All');
  }, []);

  const categories = useMemo(() => productCategories(products), [products]);
  const visibleProducts = useMemo(() => filterAndSortProducts(products, query, category, sort), [products, query, category, sort]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-5 py-8 text-[#183B28] sm:px-8 lg:px-10">
      <section className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_80px_rgba(24,59,40,0.10)] sm:p-8 lg:p-10">
          <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-[#EAF5E7] blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-90px] h-72 w-72 rounded-full bg-[#FFF3D9] blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>This Week's Harvest</Eyebrow>
              <h1 className="mt-4 max-w-3xl font-serif text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#183B28] sm:text-5xl lg:text-6xl">
                Order fresh produce from The Harvest Place Ja
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62] sm:text-base">
                Fresh produce available from The Harvest Place Ja. Order items, build your box, or open the Android app for the full experience.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <PremiumButton href="/my-box" variant="secondary">
                <Package className="h-4 w-4" />
                Build Your Box
              </PremiumButton>
              <AndroidButton />
            </div>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 lg:grid-cols-[1fr_230px_180px]">
            <label className="flex h-13 min-h-[52px] items-center gap-3 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5">
              <Search className="h-4 w-4 text-[#2D6741]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search produce..."
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#183B28] outline-none placeholder:text-[#5F6A62]"
              />
            </label>

            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-13 min-h-[52px] rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5 text-sm font-black text-[#183B28] outline-none">
              <option value="All">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select value={sort} onChange={(event) => setSort(event.target.value as ProductSort)} className="h-13 min-h-[52px] rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5 text-sm font-black text-[#183B28] outline-none">
              <option value="featured">Featured</option>
              <option value="price-low">Price low</option>
              <option value="price-high">Price high</option>
              <option value="stock">Stock</option>
            </select>
          </div>

          {notice ? <div className="relative z-10 mt-5 rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] px-4 py-3 text-sm font-black text-[#8B5D18]">{notice}</div> : null}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading && !products.length
            ? Array.from({ length: 8 }).map((_, index) => <HarvestProductSkeleton key={`shop-loading-${index}`} />)
            : visibleProducts.length
              ? visibleProducts.map((product) => <LiveHarvestProductCard key={product.id} product={product} />)
              : (
                <div className="col-span-full rounded-[30px] border border-dashed border-[#D8E5D4] bg-white p-10 text-center shadow-sm">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-[#2D6741]" />
                  <h2 className="mt-4 font-serif text-3xl font-black text-[#183B28]">No matching harvest items</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#5F6A62]">
                    Try a different search or category. New produce will appear here when it is added to the shop.
                  </p>
                  <button type="button" onClick={() => { setQuery(''); setCategory('All'); }} className="mt-6 rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white">
                    Clear filters
                  </button>
                </div>
              )}
        </div>
      </section>
    </main>
  );
}

function FarmStorySection() {
  return (
    <section id="farm-story" className="mx-auto max-w-[1450px] px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
      <div className="grid overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-white shadow-[0_20px_60px_rgba(24,59,40,0.07)] lg:grid-cols-[0.9fr_1fr]">
        <div className="relative min-h-[250px] sm:min-h-[320px]">
          <Image src={FARM_STORY_IMAGE} alt="Farmer holding fresh produce in Jamaica" fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
        </div>

        <div className="relative overflow-hidden px-5 py-7 sm:px-8 sm:py-8 lg:px-12">
          <div className="absolute -right-10 bottom-0 h-56 w-56 rounded-full border border-[#DFA75A]/20" />
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">Our farm story</p>
          <h2 className="mt-3 font-serif text-3xl font-black tracking-[-0.035em] text-[#183B28] sm:text-4xl">
            Rooted in Jamaica. Grown with Purpose.
          </h2>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[#4F5D53] sm:text-base">
            We are a family-run farm committed to growing premium, chemical-conscious produce using sustainable methods that respect our land and nourish our community.
          </p>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#4F5D53] sm:text-base">
            From our fields in Jamaica to your table, we promise freshness, quality, and a farm experience you can trust.
          </p>
          <div className="mt-6">
            <PremiumButton href="/#farm-story">
              <Leaf className="h-4 w-4" />
              Explore Our Farm
            </PremiumButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function FreshFromFarmSection({ products, loading }: { products: Product[]; loading: boolean }) {
  return (
    <section className="mx-auto max-w-[1450px] px-4 pb-7 sm:px-6 sm:pb-8 lg:px-10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-black tracking-[-0.035em] text-[#183B28] sm:text-4xl">Fresh From The Farm</h2>
          <p className="mt-1 text-sm font-semibold text-[#5F6A62]">Hand-picked. Naturally grown. Always fresh.</p>
        </div>
        <Link href="/shop" className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#183B28] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F4F9F2]">
          Shop Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
        {loading && products.length === 0
          ? Array.from({ length: 7 }).map((_, index) => <HarvestProductSkeleton key={`harvest-loading-${index}`} compact />)
          : products.length
            ? products.map((product) => <LiveHarvestProductCard key={product.id} product={product} compact />)
            : fallbackProduce.map((item) => <FallbackProduceCard key={item.name} item={item} />)}
      </div>
    </section>
  );
}

function WeeklyBoxSection() {
  return (
    <section className="mx-auto max-w-[1450px] px-4 pb-7 sm:px-6 sm:pb-8 lg:px-10">
      <div className="grid overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_22px_65px_rgba(24,59,40,0.08)] lg:min-h-[292px] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[245px] overflow-hidden sm:min-h-[285px] lg:min-h-full">
          <Image
            src={WEEKLY_BOX_IMAGE}
            alt="Weekly harvest box filled with fresh produce"
            fill
            sizes="(min-width: 1024px) 690px, 100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#183B28]/10 via-transparent to-transparent" />

          <div
            className="absolute inset-y-0 -right-24 z-10 hidden w-52 bg-[#FFFDF7] lg:block"
            style={{ clipPath: 'ellipse(72% 92% at 100% 50%)' }}
          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FFFDF7]/85 via-[#FFFDF7]/25 to-transparent lg:hidden" />
        </div>

        <div className="relative flex min-h-[250px] items-center overflow-hidden bg-[#FFFDF7] px-6 py-8 sm:px-9 sm:py-10 lg:-ml-10 lg:px-14 lg:py-10">
          <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-[#EAF5E7]/80" />
          <div className="absolute right-10 top-10 hidden h-44 w-44 rounded-full border border-[#D8E5D4]/70 lg:block" />
          <div className="absolute right-10 bottom-6 hidden text-[#2D6741]/[0.06] lg:block">
            <Leaf className="h-44 w-44" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">
              Farm fresh delivered
            </p>

            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-black leading-[1.08] tracking-[-0.035em] text-[#183B28] sm:text-4xl lg:text-4xl">
              Carefully packed weekly harvest boxes
            </h2>

            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-[#4F5D53] sm:text-base">
              Enjoy the best of the season with our curated boxes—packed with premium, fresh produce straight from our farm to you.
            </p>

            <div className="mt-6">
              <PremiumButton href="/my-box">
                <Package className="h-4 w-4" />
                Build Your Box
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="mx-auto max-w-[1450px] px-4 pb-7 sm:px-6 sm:pb-8 lg:px-10">
      <div className="grid gap-4 rounded-[24px] border border-[#D8E5D4] bg-white/75 p-4 shadow-[0_18px_55px_rgba(24,59,40,0.06)] md:grid-cols-2 xl:grid-cols-4">
        {trustItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex items-center gap-4 rounded-2xl bg-[#FFFEFC] p-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#2D6741]/15 bg-[#EAF5E7] text-[#2D6741]">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-black text-[#183B28]">{item.title}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#5F6A62]">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AppSection() {
  return (
    <section className="mx-auto max-w-[1450px] px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10">
      <div className="relative overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-[#F8FAF2] shadow-[0_22px_65px_rgba(24,59,40,0.08)]">
        <div className="absolute inset-y-0 right-0 hidden w-[62%] lg:block">
          <Image
            src={FARM_STORY_IMAGE}
            alt=""
            fill
            sizes="900px"
            className="object-cover opacity-45 blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAF2] via-[#F8FAF2]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#183B28]/10 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 grid gap-6 px-6 py-7 sm:px-10 lg:grid-cols-[0.48fr_0.32fr_0.20fr] lg:items-center lg:px-14 lg:py-0">
          <div className="py-3 lg:py-10">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">
              On the go
            </p>

            <h2 className="mt-2 font-serif text-3xl font-black tracking-[-0.035em] text-[#183B28] sm:text-4xl">
              Take the farm with you
            </h2>

            <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-[#4F5D53] sm:text-base">
              Order, track, and stay updated—right from your phone. Use the Harvest Place Ja Android app for the best farm experience.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={ANDROID_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#183B28] px-6 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(24,59,40,0.20)] transition hover:-translate-y-0.5 hover:bg-[#2D6741]"
              >
                <Download className="h-4 w-4" />
                Get Android App
              </a>

              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DFA75A]/60 bg-white/70 px-6 py-3 text-sm font-black text-[#B5791E] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF3D9]"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop Now
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[255px] w-full max-w-[310px] self-end overflow-visible lg:block">
            <Image
              src={APP_PHONE_IMAGE}
              alt="Harvest Place Ja Android app preview"
              fill
              sizes="330px"
              className="object-contain object-bottom drop-shadow-[0_24px_45px_rgba(24,59,40,0.28)]"
            />
          </div>

          <div className="flex items-center justify-start pb-3 lg:justify-end lg:pb-0">
            <a
              href={ANDROID_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get it on Google Play"
              className="inline-flex transition hover:-translate-y-0.5"
            >
              <span className="relative block h-[52px] w-[170px] overflow-hidden rounded-xl shadow-[0_18px_45px_rgba(0,0,0,0.22)] sm:h-[58px] sm:w-[190px]">
                <Image
                  src={GOOGLE_PLAY_BADGE_IMAGE}
                  alt="Get it on Google Play"
                  fill
                  sizes="(max-width: 640px) 170px, 190px"
                  className="object-contain"
                />
              </span>
            </a>
          </div>

          <div className="relative mx-auto h-[360px] w-full max-w-[250px] overflow-visible lg:hidden">
            <Image
              src={APP_PHONE_IMAGE}
              alt="Harvest Place Ja Android app preview"
              fill
              sizes="260px"
              className="object-contain drop-shadow-[0_24px_45px_rgba(24,59,40,0.24)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mt-7 max-w-[1500px] px-5 sm:px-8 lg:px-10">
      <div className="rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] px-4 py-3 text-sm font-black text-[#8B5D18]">
        {children}
      </div>
    </div>
  );
}
