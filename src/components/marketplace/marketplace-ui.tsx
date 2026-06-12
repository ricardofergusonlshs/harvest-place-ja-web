'use client';

import Image, { type ImageProps } from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  Bell,
  Carrot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Leaf,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Star,
  Store,
  Truck,
  Wheat,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';
import { fetchDealOfTheDayProducts, fetchProducts, fetchReadySoonProducts } from '@/lib/services';
import type { Product } from '@/lib/types';

type MarketMode = 'home' | 'shop';
type MarketProduct = {
  id: string | number;
  name: string;

  price?: number | string | null;
  unit?: string | null;
  image_url?: string | null;
  category?: string | null;
  description?: string | null;

  farm_name?: string | null;
  farmer_name?: string | null;
  parish?: string | null;

  stock_quantity?: number | string | null;

  is_local?: boolean | null;
  is_organic?: boolean | null;
  is_deal_of_day?: boolean | null;
  ready_soon?: boolean | null;

  discount_price?: number | string | null;
  original_price?: number | string | null;

  product_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  slug?: string | null;
  sku?: string | null;
};

type IconType = ComponentType<{ className?: string }>;

type CategoryConfig = {
  label: string;
  query: string;
  href: string;
  icon: IconType;
  image: string;
  alt: string;
};

type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'stock';
type FilterKey = 'in-stock' | 'ready-soon' | 'pre-order' | 'organic' | 'local' | 'pesticide-free' | 'premium' | 'deals';

type HeroSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  price: string;
  oldPrice?: string;
  href: string;
  cta: string;
  image: string;
  badge: string;
};

const HERO_IMAGE = '/elite/hero-produce-box.png';
const WEEKLY_IMAGE = '/elite/weekly-box-banner.png';
const READY_SOON_IMAGE = '/elite/ready-soon-card.png';
const FARMER_IMAGE = '/elite/farmer-story.png';
const DEFAULT_PRODUCT_IMAGE = '/logo.png';
const MARKET_TIMEOUT_MS = 18000;

const CATEGORY_IMAGES = {
  all: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  vegetables: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=900&q=80',
  herbs: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=80',
  roots: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=900&q=80',
  weeklyBoxes: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=900&q=80',
  vegan: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
  readySoon: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80',
  farmerSpecials: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80',
};

const categories: CategoryConfig[] = [
  {
    label: 'Vegetables',
    query: 'vegetable',
    href: '/shop?category=Vegetables',
    icon: Leaf,
    image: CATEGORY_IMAGES.vegetables,
    alt: 'Fresh green vegetables at a farmers market',
  },
  {
    label: 'Herbs',
    query: 'herb',
    href: '/shop?category=Herbs',
    icon: Sprout,
    image: CATEGORY_IMAGES.herbs,
    alt: 'Fresh herbs and leafy greens',
  },
  {
    label: 'Fruits',
    query: 'fruit',
    href: '/shop?category=Fruits',
    icon: Star,
    image: CATEGORY_IMAGES.fruits,
    alt: 'Fresh colorful tropical fruits',
  },
  {
    label: 'Roots',
    query: 'root',
    href: '/shop?category=Roots',
    icon: Carrot,
    image: CATEGORY_IMAGES.roots,
    alt: 'Fresh root vegetables',
  },
  {
    label: 'Weekly Boxes',
    query: 'box',
    href: '/weekly-box',
    icon: Package,
    image: CATEGORY_IMAGES.weeklyBoxes,
    alt: 'Box filled with fresh produce',
  },
  {
    label: 'Vegan Picks',
    query: 'vegan',
    href: '/shop?category=Vegan',
    icon: Wheat,
    image: CATEGORY_IMAGES.vegan,
    alt: 'Fresh vegan salad ingredients',
  },
  {
    label: 'Ready Soon',
    query: 'ready soon',
    href: '/ready-soon',
    icon: Bell,
    image: CATEGORY_IMAGES.readySoon,
    alt: 'Green plants growing in a greenhouse',
  },
  {
    label: 'Farmer Specials',
    query: 'farmer',
    href: '/shop?category=Farmer%20Specials',
    icon: Store,
    image: CATEGORY_IMAGES.farmerSpecials,
    alt: 'Farmer holding freshly harvested vegetables',
  },
];

const fallbackProducts: MarketProduct[] = [
  {
    id: 'featured-callaloo',
    name: 'Fresh Callaloo Bunch',
    price: 350,
    unit: 'bunch',
    category: 'Vegetables',
    farm_name: 'Kingston Farm Co-op',
    parish: 'Kingston',
    stock_quantity: 24,
    is_local: true,
    image_url: '/hero-produce.jpg',
  },
  {
    id: 'featured-peppers',
    name: 'Scotch Bonnet Peppers',
    price: 400,
    unit: '100g',
    category: 'Vegetables',
    farm_name: 'Spicy Hill Farm',
    parish: 'St. Elizabeth',
    stock_quantity: 32,
    is_local: true,
    is_deal_of_day: true,
    image_url: '/ready-soon.jpg',
  },
  {
    id: 'featured-ginger',
    name: 'Fresh Jamaican Ginger',
    price: 650,
    unit: '250g',
    category: 'Roots',
    farm_name: 'Harvest Place Farms',
    parish: 'St. Ann',
    stock_quantity: 7,
    is_local: true,
    is_organic: true,
    image_url: READY_SOON_IMAGE,
  },
  {
    id: 'featured-sweet-potato',
    name: 'Jamaican Sweet Potato',
    price: 500,
    unit: '500g',
    category: 'Roots',
    farm_name: 'Green Vale Farm',
    parish: 'Clarendon',
    stock_quantity: 18,
    is_local: true,
    image_url: '/weekly-box.jpg',
  },
  {
    id: 'featured-pineapple',
    name: 'Sweet Pineapple',
    price: 600,
    unit: 'each',
    category: 'Fruits',
    farm_name: 'Golden Fields',
    parish: 'St. Mary',
    stock_quantity: 10,
    is_local: true,
    image_url: WEEKLY_IMAGE,
  },
  {
    id: 'featured-onion',
    name: 'Bunching Onion',
    price: 300,
    unit: 'bunch',
    category: 'Herbs',
    farm_name: 'Fresh Roots Farm',
    parish: 'St. Catherine',
    stock_quantity: 21,
    is_local: true,
    image_url: HERO_IMAGE,
  },
];

const trustFeatures = [
  { icon: Leaf, title: 'Local farms', text: 'Sourced from trusted Jamaican growers.' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Protected payments and reliable confirmations.' },
  { icon: Truck, title: 'Fresh delivery', text: 'Islandwide delivery packed with care.' },
  { icon: CheckCircle2, title: 'Quality checked', text: 'Every box is inspected before handoff.' },
  { icon: Store, title: 'Farmer supported', text: 'Your purchase supports local livelihoods.' },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function toNumber(value: unknown, fallback = 0) {
  const number = typeof value === 'string' ? Number(value.replace(/[^0-9.-]/g, '')) : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function money(value: unknown) {
  return `JMD $${toNumber(value).toLocaleString('en-JM', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function productPrice(product: MarketProduct) {
  return toNumber(product.discount_price ?? product.price ?? 0);
}

function originalPrice(product: MarketProduct) {
  const original = toNumber(product.original_price ?? 0);
  const current = productPrice(product);
  return original > current ? original : null;
}

function isAddable(product: MarketProduct) {
  if (product.ready_soon) return false;

  if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
    return toNumber(product.stock_quantity, 0) > 0;
  }

  return true;
}

function productBadge(product: MarketProduct) {
  if (product.ready_soon) return 'Ready Soon';
  if (product.is_deal_of_day || originalPrice(product)) return 'Deal';
  if (product.is_organic) return 'Organic';
  if (product.farmer_name || product.farm_name) return 'Farmer Pick';
  if (product.is_local !== false) return 'Fresh';
  return 'Local';
}

function stockLabel(product: MarketProduct) {
  if (product.ready_soon) return 'Ready soon';

  if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
    const stock = toNumber(product.stock_quantity, 0);

    if (stock <= 0) return 'Out of stock';
    if (stock <= 8) return `${stock} left`;

    return 'In stock';
  }

  return 'Available';
}

function normalizeProduct(product: Product | MarketProduct): MarketProduct {
  const item = product as Record<string, unknown>;

  return {
    id: String(item.id ?? item.slug ?? item.sku ?? item.name ?? 'market-item'),
    name: String(item.name ?? 'Fresh market item'),

    price:
      item.price === null || item.price === undefined
        ? undefined
        : (item.price as number | string),

    unit:
      typeof item.unit === 'string' && item.unit.trim()
        ? item.unit
        : 'each',

    image_url:
      typeof item.image_url === 'string' && item.image_url.trim()
        ? item.image_url
        : DEFAULT_PRODUCT_IMAGE,

    category:
      typeof item.category === 'string' && item.category.trim()
        ? item.category
        : 'Fresh produce',

    description:
      typeof item.description === 'string' && item.description.trim()
        ? item.description
        : null,

    farm_name:
      typeof item.farm_name === 'string' && item.farm_name.trim()
        ? item.farm_name
        : typeof item.farmer_name === 'string' && item.farmer_name.trim()
          ? item.farmer_name
          : 'Local partner farm',

    farmer_name:
      typeof item.farmer_name === 'string' && item.farmer_name.trim()
        ? item.farmer_name
        : null,

    parish:
      typeof item.parish === 'string' && item.parish.trim()
        ? item.parish
        : 'Jamaica',

    stock_quantity:
      typeof item.stock_quantity === 'number' ||
      typeof item.stock_quantity === 'string'
        ? item.stock_quantity
        : null,

    is_local: item.is_local === false ? false : true,
    is_organic: Boolean(item.is_organic),
    is_deal_of_day: Boolean(item.is_deal_of_day),

    ready_soon:
      Boolean(item.ready_soon) ||
      String(item.product_status ?? '').toLowerCase() === 'ready_soon',

    discount_price:
      item.discount_price === null || item.discount_price === undefined
        ? undefined
        : (item.discount_price as number | string),

    original_price:
      item.original_price === null || item.original_price === undefined
        ? undefined
        : (item.original_price as number | string),

    product_status:
      typeof item.product_status === 'string' ? item.product_status : null,

    created_at:
      typeof item.created_at === 'string' ? item.created_at : null,

    updated_at:
      typeof item.updated_at === 'string' ? item.updated_at : null,

    slug:
      typeof item.slug === 'string' ? item.slug : null,

    sku:
      typeof item.sku === 'string' ? item.sku : null,
  };
}

function normalizeProducts(products: Array<Product | MarketProduct> = []) {
  return products.map(normalizeProduct);
}

function asCartProduct(product: MarketProduct): Product {
  return normalizeProduct(product) as unknown as Product;
}

export function MarketplaceHomePage() {
  return <MarketplacePage mode="home" />;
}

export function MarketplaceShopPage() {
  return <MarketplacePage mode="shop" />;
}

type CategoryWithCount = CategoryConfig & { count: number };

type HomeMarketplaceLayoutProps = {
  catalog: MarketProduct[];
  freshDeals: MarketProduct[];
  readySoonProduct?: MarketProduct;
  categoryStats: CategoryWithCount[];
  notice: string | null;
  loading: boolean;
  selectCategory: (category: CategoryWithCount) => void;
};

type ShopMarketplaceLayoutProps = {
  categoryStats: CategoryWithCount[];
  activeCategory: string;
  activeTag: string;
  query: string;
  setQuery: (value: string) => void;
  submitSearch: (event: FormEvent<HTMLFormElement>) => void;
  selectCategory: (category: CategoryWithCount) => void;
  clearFilters: () => void;
  activeFilters: Set<FilterKey>;
  toggleFilter: (filter: FilterKey) => void;
  visibleProducts: MarketProduct[];
  loading: boolean;
  notice: string | null;
  sort: SortMode;
  setSort: (value: SortMode) => void;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (value: boolean) => void;
};

function MarketplacePage({ mode }: { mode: MarketMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [deals, setDeals] = useState<MarketProduct[]>([]);
  const [readySoon, setReadySoon] = useState<MarketProduct[]>([]);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') ?? 'All');
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') ?? '');
  const [sort, setSort] = useState<SortMode>((searchParams.get('sort') as SortMode) || 'featured');
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setActiveCategory(searchParams.get('category') ?? 'All');
    setActiveTag(searchParams.get('tag') ?? '');
    setSort((searchParams.get('sort') as SortMode) || 'featured');
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
      setNotice('Fresh market items are taking a little longer to load. You can still explore today’s featured picks.');
    }, MARKET_TIMEOUT_MS);

    async function loadMarket() {
      setLoading(true);
      setNotice(null);

      try {
        const [productRows, dealRows, soonRows] = await Promise.all([
          fetchProducts(),
          fetchDealOfTheDayProducts().catch(() => []),
          fetchReadySoonProducts().catch(() => []),
        ]);

        if (!mounted) return;

        const normalizedProducts = normalizeProducts(productRows);
        const normalizedDeals = normalizeProducts(dealRows);
        const normalizedReadySoon = normalizeProducts(soonRows);

        setProducts(normalizedProducts);
        setDeals(normalizedDeals);
        setReadySoon(normalizedReadySoon);

        if (!normalizedProducts.length) {
          setNotice('Today’s live market list is still being refreshed. Featured picks are shown below.');
        }
      } catch {
        if (!mounted) return;
        setNotice('Fresh market items are taking a little longer to load. You can still explore today’s featured picks.');
      } finally {
        window.clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    }

    loadMarket();

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, []);

  const catalog = products.length ? products : normalizeProducts(fallbackProducts);
  const dealShelf = (deals.length ? deals : catalog.filter((item) => item.is_deal_of_day || originalPrice(item))).slice(0, 10);
  const freshDeals = dealShelf.length ? dealShelf : catalog.slice(0, 10);
  const readySoonProduct = readySoon[0] || catalog.find((item) => item.ready_soon) || catalog[1];

  const categoryStats = useMemo<CategoryWithCount[]>(() => {
    return categories.map((category) => {
      const count = category.label === 'Ready Soon'
        ? catalog.filter((item) => item.ready_soon).length
        : catalog.filter((item) => `${item.category ?? ''} ${item.name ?? ''}`.toLowerCase().includes(category.query.toLowerCase())).length;
      return { ...category, count: count || Math.max(2, Math.round(catalog.length / 6)) };
    });
  }, [catalog]);

  function updateUrl(next: { q?: string; category?: string; tag?: string; sort?: SortMode }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) next.q ? params.set('q', next.q) : params.delete('q');
    if (next.category !== undefined) {
      next.category && next.category !== 'All' ? params.set('category', next.category) : params.delete('category');
      if (next.category && next.category !== 'All') params.delete('tag');
    }
    if (next.tag !== undefined) {
      next.tag ? params.set('tag', next.tag) : params.delete('tag');
      if (next.tag) params.delete('category');
    }
    if (next.sort !== undefined) next.sort !== 'featured' ? params.set('sort', next.sort) : params.delete('sort');
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  }

  function selectCategory(category: CategoryWithCount) {
    if (category.href === '/weekly-box' || category.href === '/ready-soon') {
      router.push(category.href);
      return;
    }
    const tag = category.label === 'Vegan Picks' ? 'vegan' : category.label === 'Farmer Specials' ? 'farmer-specials' : '';
    setActiveTag(tag);
    setActiveCategory(tag ? 'All' : category.label);
    updateUrl(tag ? { tag, category: 'All' } : { category: category.label, tag: '' });
  }

  function clearFilters() {
    setQuery('');
    setActiveCategory('All');
    setActiveTag('');
    setSort('featured');
    setActiveFilters(new Set());
    setMobileFiltersOpen(false);
    router.push('/shop', { scroll: false });
  }

  function toggleFilter(filter: FilterKey) {
    setActiveFilters((current) => {
      const next = new Set(current);
      next.has(filter) ? next.delete(filter) : next.add(filter);
      return next;
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl({ q: query.trim() });
  }

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedCategory = activeCategory.toLowerCase();
    let rows = catalog.filter((product) => {
      const haystack = `${product.name} ${product.description ?? ''} ${product.category ?? ''} ${product.farm_name ?? ''} ${product.farmer_name ?? ''} ${product.parish ?? ''} ${product.unit ?? ''}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesCategory = activeCategory === 'All' || haystack.includes(normalizedCategory.replace('roots', 'root').replace('weekly boxes', 'box'));
      const matchesTag = !activeTag
        || (activeTag === 'deals' && (product.is_deal_of_day || originalPrice(product)))
        || (activeTag === 'vegan' && ['vegetable', 'fruit', 'herb', 'root', 'vegan'].some((word) => haystack.includes(word)))
        || (activeTag === 'farmer-specials' && Boolean(product.farm_name || product.farmer_name));
      if (!matchesQuery || !matchesCategory || !matchesTag) return false;
      for (const filter of activeFilters) {
        if (filter === 'in-stock' && !isAddable(product)) return false;
        if (filter === 'ready-soon' && !product.ready_soon) return false;
        if (filter === 'pre-order' && !String(product.product_status ?? '').toLowerCase().includes('pre')) return false;
        if (filter === 'organic' && !product.is_organic) return false;
        if (filter === 'local' && product.is_local === false) return false;
        if (filter === 'pesticide-free' && !haystack.includes('pesticide')) return false;
        if (filter === 'premium' && !haystack.includes('premium') && !product.is_organic) return false;
        if (filter === 'deals' && !product.is_deal_of_day && !originalPrice(product)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === 'price-asc') return productPrice(a) - productPrice(b);
      if (sort === 'price-desc') return productPrice(b) - productPrice(a);
      if (sort === 'newest') return String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''));
      if (sort === 'stock') return Number(b.stock_quantity ?? 0) - Number(a.stock_quantity ?? 0);
      return Number(a.is_deal_of_day ? 0 : 1) - Number(b.is_deal_of_day ? 0 : 1);
    });
    return rows;
  }, [activeCategory, activeFilters, activeTag, catalog, query, sort]);

  if (mode === 'home') {
    return (
      <HomeMarketplaceLayout
        catalog={catalog}
        freshDeals={freshDeals}
        readySoonProduct={readySoonProduct}
        categoryStats={categoryStats}
        notice={notice}
        loading={loading}
        selectCategory={selectCategory}
      />
    );
  }

  return (
    <ShopMarketplaceLayout
      categoryStats={categoryStats}
      activeCategory={activeCategory}
      activeTag={activeTag}
      query={query}
      setQuery={setQuery}
      submitSearch={submitSearch}
      selectCategory={selectCategory}
      clearFilters={clearFilters}
      activeFilters={activeFilters}
      toggleFilter={toggleFilter}
      visibleProducts={visibleProducts}
      loading={loading}
      notice={notice}
      sort={sort}
      setSort={(next) => {
        setSort(next);
        updateUrl({ sort: next });
      }}
      mobileFiltersOpen={mobileFiltersOpen}
      setMobileFiltersOpen={setMobileFiltersOpen}
    />
  );
}

function HomeMarketplaceLayout({ catalog, freshDeals, readySoonProduct, categoryStats, notice, loading, selectCategory }: HomeMarketplaceLayoutProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_44%,#FFFEFC_100%)] text-[#1E2A21]">
      <MarketplaceHero products={catalog} readySoonProduct={readySoonProduct} />

      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        {notice ? <MarketNotice>{notice}</MarketNotice> : null}
        {loading ? <LoadingProductSkeleton /> : null}

        <HomeCategoryPreview categories={categoryStats.slice(0, 6)} onSelectCategory={selectCategory} />

        <ProductShelf
          title="Today’s Fresh Deals"
          subtitle="A curated preview of fresh local picks, weekly favorites, and limited harvests."
          products={freshDeals.slice(0, 5)}
        />

        <HomePromoGrid readySoonProduct={readySoonProduct} />
        <WeeklyBoxBanner />
        <FarmerFeatureGrid products={catalog} />
        <TrustSection />
      </main>
    </div>
  );
}

function ShopMarketplaceLayout({ categoryStats, activeCategory, activeTag, query, setQuery, submitSearch, selectCategory, clearFilters, activeFilters, toggleFilter, visibleProducts, loading, notice, sort, setSort, mobileFiltersOpen, setMobileFiltersOpen }: ShopMarketplaceLayoutProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_48%,#FFFEFC_100%)] text-[#1E2A21]">
      <ShopHeader />

      <section className="relative z-20 border-y border-[#D8E5D4]/80 bg-white/90 shadow-[0_18px_55px_rgba(24,59,40,0.06)] backdrop-blur-xl">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-10">
          <MarketSearch query={query} setQuery={setQuery} onSubmit={submitSearch} />
          <CategoryStrip categories={categoryStats} activeCategory={activeCategory} activeTag={activeTag} setActiveCategory={selectCategory} clearFilters={clearFilters} />
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        {notice ? <MarketNotice>{notice}</MarketNotice> : null}

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <FilterPanel activeFilters={activeFilters} onToggleFilter={toggleFilter} onClear={clearFilters} productCount={visibleProducts.length} />
          <ProductDiscovery products={visibleProducts} mode="shop" loading={loading} sort={sort} setSort={setSort} openFilters={() => setMobileFiltersOpen(true)} />
        </section>

        <TrustSection />
      </main>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[80] bg-[#102D1F]/55 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto rounded-l-[28px] bg-[#FFFEFC] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">Refine market</p>
                <h2 className="mt-1 text-xl font-black text-[#183B28]">Filter products</h2>
              </div>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="grid h-11 w-11 place-items-center rounded-full border border-[#D8E5D4] bg-white text-xl font-black text-[#2D6741] shadow-sm transition hover:border-[#2D6741]/35 hover:bg-[#EAF5E7]">×</button>
            </div>
            <FilterPanel activeFilters={activeFilters} onToggleFilter={toggleFilter} onClear={clearFilters} productCount={visibleProducts.length} mobile />
            <button type="button" onClick={() => setMobileFiltersOpen(false)} className="mt-5 w-full rounded-full bg-[#2D6741] px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.24)] transition hover:bg-[#183B28]">
              Show {visibleProducts.length} items
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ShopHeader() {
  return (
    <section className="relative overflow-hidden bg-[#FAF8F0]">
      <div className="absolute left-[-120px] top-[-160px] h-[320px] w-[320px] rounded-full bg-[#EAF5E7] blur-3xl" aria-hidden="true" />
      <div className="absolute right-[-120px] bottom-[-170px] h-[320px] w-[320px] rounded-full bg-[#FFF3D9] blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
        <div className="rounded-[30px] border border-[#D8E5D4]/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(24,59,40,0.08)] ring-1 ring-white/80 sm:p-7 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-3xl">
            <MarketBadge tone="gold">Shop the market</MarketBadge>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.045em] text-[#183B28] sm:text-4xl lg:text-5xl">
              Shop Fresh Local Produce
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62] sm:text-base">
              Browse trusted Jamaican farm produce, filter by harvest type, and add fresh picks straight to your box.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:mt-0 lg:w-[430px]">
            <ShopStat value="Fresh" label="daily picks" />
            <ShopStat value="Local" label="farm routes" />
            <ShopStat value="Easy" label="box checkout" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ShopStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-center">
      <p className="text-base font-black text-[#183B28]">{value}</p>
      <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#5F6A62]">{label}</p>
    </div>
  );
}

function HomeCategoryPreview({ categories, onSelectCategory }: { categories: CategoryWithCount[]; onSelectCategory: (category: CategoryWithCount) => void }) {
  return (
    <section className="mb-7 rounded-[30px] border border-[#D8E5D4] bg-white/90 p-5 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-6">
      <SectionHeader
        eyebrow="Start fresh"
        title="Explore popular market sections"
        subtitle="Quick links to the most popular harvest categories without turning the homepage into a full catalog."
        actionHref="/shop"
        actionLabel="Open full shop"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {categories.map((category) => (
          <button
            key={category.label}
            type="button"
            onClick={() => onSelectCategory(category)}
            className="group flex items-center gap-3 rounded-[20px] border border-[#D8E5D4] bg-[#FFFEFC] p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6741]/35 hover:bg-[#F4F9F2] hover:shadow-[0_16px_42px_rgba(24,59,40,0.10)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/15"
          >
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#EAF5E7]">
              <span className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${category.image})` }} />
              <span className="absolute inset-0 bg-[#183B28]/10" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-[#183B28]">{category.label}</span>
              <span className="mt-0.5 block text-xs font-bold text-[#5F6A62]">{category.count} picks</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function HomePromoGrid({ readySoonProduct }: { readySoonProduct?: MarketProduct }) {
  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <Link href="/ready-soon" className="group relative overflow-hidden rounded-[30px] border border-[#F0D6A7] bg-[#FFF3D9] p-6 shadow-[0_18px_55px_rgba(24,59,40,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(24,59,40,0.13)]">
        <SafeImage src={READY_SOON_IMAGE} alt="Ready soon harvest alerts" fill className="object-cover object-right opacity-20 transition duration-500 group-hover:scale-105" sizes="720px" fallback={DEFAULT_PRODUCT_IMAGE} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFF3D9] via-[#FFF3D9]/90 to-[#FFF3D9]/60" />
        <div className="relative z-10 max-w-md">
          <MarketBadge tone="gold">Ready Soon</MarketBadge>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#183B28] sm:text-3xl">Know what is coming next</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
            Get alerts for seasonal produce and limited harvests{readySoonProduct ? ` like ${readySoonProduct.name}` : ''}.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2D6741] px-4 py-2 text-xs font-black text-white">View ready soon <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </Link>

      <Link href="/shop?category=Farmer%20Specials" className="group relative overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-[#EAF5E7] p-6 shadow-[0_18px_55px_rgba(24,59,40,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(24,59,40,0.13)]">
        <SafeImage src={FARMER_IMAGE} alt="Jamaican farmer specials" fill className="object-cover object-right opacity-25 transition duration-500 group-hover:scale-105" sizes="720px" fallback={DEFAULT_PRODUCT_IMAGE} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#EAF5E7] via-[#EAF5E7]/90 to-[#EAF5E7]/60" />
        <div className="relative z-10 max-w-md">
          <MarketBadge tone="green">Farmer Specials</MarketBadge>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#183B28] sm:text-3xl">Buy directly from local growers</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
            Discover partner farm specials and support Jamaican farmers with every order.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#183B28]">Shop specials <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </Link>
    </section>
  );
}


function MarketplaceHero({ products, readySoonProduct }: { products: MarketProduct[]; readySoonProduct?: MarketProduct }) {
  const slides = useMemo<HeroSlide[]>(() => {
    const firstFarm = products.find((item) => item.farm_name || item.farmer_name);

    return [
      {
        eyebrow: 'Fresh Jamaican Market',
        title: 'Fresh produce, beautifully delivered.',
        subtitle: 'Shop vegetables, herbs, fruits, roots, weekly boxes, and farmer specials from trusted Jamaican growers.',
        price: 'Fresh daily',
        href: '/shop',
        cta: 'Shop now',
        image: HERO_IMAGE,
        badge: 'Local harvests',
      },
      {
        eyebrow: 'Weekly Box',
        title: 'Your weekly box, your way',
        subtitle: 'Choose local vegetables, roots, herbs, fruits, and pantry staples in one flexible farm box.',
        price: 'From JMD $2,500',
        href: '/weekly-box',
        cta: 'Build your box',
        image: WEEKLY_IMAGE,
        badge: 'Flexible plans',
      },
      {
        eyebrow: 'Ready Soon Alerts',
        title: readySoonProduct?.name || 'Never miss a fresh drop',
        subtitle: 'Get notified when seasonal harvests and limited farmer picks are ready to order.',
        price: readySoonProduct ? money(productPrice(readySoonProduct)) : 'Alerts open',
        href: '/ready-soon',
        cta: 'View ready soon',
        image: READY_SOON_IMAGE,
        badge: 'Limited harvest',
      },
      {
        eyebrow: 'Farmer Specials',
        title: firstFarm?.farm_name || firstFarm?.farmer_name || 'Support local growers',
        subtitle: 'Shop partner-farm specials and support Jamaican farms with every box.',
        price: 'Farmer picks',
        href: '/shop?category=Farmer%20Specials',
        cta: 'Shop specials',
        image: FARMER_IMAGE,
        badge: 'From local farms',
      },
    ];
  }, [products, readySoonProduct]);

  return (
    <section className="relative overflow-hidden bg-[#FAF8F0]">
      <div className="absolute left-[-140px] top-[-150px] h-[340px] w-[340px] rounded-full bg-[#EAF5E7] blur-3xl" aria-hidden="true" />
      <div className="absolute right-[-150px] top-20 h-[340px] w-[340px] rounded-full bg-[#FFF3D9] blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1500px] px-4 pb-7 pt-5 sm:px-6 lg:px-10 lg:pb-8 lg:pt-6">
        <HeroIntro />

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_350px]">
          <HeroCarousel slides={slides} />

          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:content-start">
            <PromoTile tone="dark" title="Build Your Weekly Box" subtitle="Custom boxes tailored to your kitchen." cta="Build" href="/weekly-box" image={WEEKLY_IMAGE} />
            <PromoTile tone="gold" title="Ready Soon Alerts" subtitle="Know before harvests sell out." cta="Alerts" href="/ready-soon" image={READY_SOON_IMAGE} />
            <PromoTile tone="green" title="Farmer Specials" subtitle="Exclusive local farm deals." cta="Shop" href="/shop?category=Farmer%20Specials" image={FARMER_IMAGE} />
          </aside>
        </div>
      </div>
    </section>
  );
}



function HeroIntro() {
  return (
    <article className="relative overflow-hidden rounded-[26px] border border-[#D8E5D4]/80 bg-white/90 px-5 py-4 shadow-[0_16px_45px_rgba(24,59,40,0.08)] ring-1 ring-white/80 backdrop-blur sm:px-6 lg:px-7">
      <div className="absolute right-[-80px] top-[-90px] h-44 w-44 rounded-full bg-[#EAF5E7]" aria-hidden="true" />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <MarketBadge tone="gold">Fresh from Jamaican farms</MarketBadge>
          <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-4">
            <h1 className="text-3xl font-black leading-[0.98] tracking-[-0.045em] text-[#183B28] sm:text-4xl lg:text-[42px]">
              Shop Fresh. Eat Well. Support Local.
            </h1>
            <p className="max-w-xl text-sm font-semibold leading-6 text-[#5F6A62] lg:pb-1">
              Handpicked produce, carefully packed, and delivered fresh from trusted Jamaican growers.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
          <div className="grid gap-2 sm:grid-cols-2 lg:hidden xl:grid">
            <HeroPromise icon={<Truck className="h-4 w-4" />} title="Fresh delivery" text="Packed with care" />
            <HeroPromise icon={<ShieldCheck className="h-4 w-4" />} title="Secure checkout" text="Protected payments" />
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <MarketButton href="/shop" className="px-4 py-2.5 text-xs">Shop now</MarketButton>
            <MarketButton href="/weekly-box" variant="light" className="px-4 py-2.5 text-xs">Build box</MarketButton>
          </div>
        </div>
      </div>
    </article>
  );
}



function HeroPromise({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#D8E5D4] bg-white px-4 py-3 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">{icon}</span>
      <span>
        <span className="block text-sm font-black text-[#183B28]">{title}</span>
        <span className="block text-xs font-bold text-[#5F6A62]">{text}</span>
      </span>
    </div>
  );
}

function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const slide = slides[active] || slides[0];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5600);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <article className="group relative min-h-[390px] overflow-hidden rounded-[30px] bg-[#183B28] shadow-[0_26px_80px_rgba(24,59,40,0.20)] ring-1 ring-[#183B28]/10 sm:min-h-[420px] lg:min-h-[430px]">
      <SafeImage
        src={slide.image}
        alt={slide.title}
        fill
        className="object-cover object-[68%_center] transition duration-700 group-hover:scale-[1.025]"
        sizes="(max-width: 1024px) 100vw, 760px"
        fallback={HERO_IMAGE}
        priority
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,38,24,0.94)_0%,rgba(12,48,30,0.82)_34%,rgba(12,48,30,0.36)_68%,rgba(12,48,30,0.08)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,243,217,0.18),transparent_32%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#082618]/45 to-transparent" />

      <div className="relative z-10 flex min-h-[390px] max-w-[92%] flex-col justify-center p-6 sm:min-h-[420px] sm:max-w-[600px] sm:p-8 lg:min-h-[430px] lg:max-w-[54%] lg:p-9">
        <div className="flex flex-wrap items-center gap-2">
          <MarketBadge tone="gold">{slide.eyebrow}</MarketBadge>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur">
            {slide.badge}
          </span>
        </div>

        <h2 className="mt-5 text-4xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-5xl lg:text-[52px]">
          {slide.title}
        </h2>
        <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-white/90 sm:text-base sm:leading-7">
          {slide.subtitle}
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <span className="text-3xl font-black text-white">{slide.price}</span>
          {slide.oldPrice ? <span className="pb-1 text-sm font-bold text-white/45 line-through">{slide.oldPrice}</span> : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <MarketButton href={slide.href} variant="cream">{slide.cta}</MarketButton>
          <MarketButton href="/trust-center" variant="glass">Why trust us</MarketButton>
        </div>
      </div>

      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous hero slide"
          onClick={() => setActive((current) => (current === 0 ? slides.length - 1 : current - 1))}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-white hover:text-[#183B28] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next hero slide"
          onClick={() => setActive((current) => (current + 1) % slides.length)}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-white hover:text-[#183B28] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-8 left-1/5 z-20 flex -translate-x-1/5 gap-2">
        {slides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-label={`Show ${item.title}`}
            onClick={() => setActive(index)}
            className={cx('h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70', active === index ? 'w-9 bg-[#FFF3D9]' : 'w-2.5 bg-white/55 hover:bg-white')}
          />
        ))}
      </div>
    </article>
  );
}


function PromoTile({
  title,
  subtitle,
  cta,
  href,
  image,
  tone,
}: {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  tone: 'dark' | 'gold' | 'green';
}) {
  return (
    <Link
      href={href}
      className={cx(
        'group relative min-h-[118px] overflow-hidden rounded-[24px] border p-4 shadow-[0_14px_38px_rgba(24,59,40,0.09)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_54px_rgba(24,59,40,0.14)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/20 lg:min-h-[128px]',
        tone === 'dark' && 'border-[#183B28] bg-[#183B28] text-white',
        tone === 'gold' && 'border-[#F0D6A7] bg-[#FFF3D9] text-[#183B28]',
        tone === 'green' && 'border-[#D8E5D4] bg-[#EAF5E7] text-[#183B28]'
      )}
    >
      <SafeImage
        src={image}
        alt=""
        fill
        className="object-cover object-[72%_center] opacity-60 transition duration-500 group-hover:scale-105"
        sizes="(max-width: 1024px) 33vw, 320px"
        fallback={DEFAULT_PRODUCT_IMAGE}
      />

      <div
        className={cx(
          'absolute inset-0',
          tone === 'dark' && 'bg-gradient-to-r from-[#183B28] via-[#183B28]/90 to-[#183B28]/30',
          tone === 'gold' && 'bg-gradient-to-r from-[#FFF3D9] via-[#FFF3D9]/90 to-[#FFF3D9]/35',
          tone === 'green' && 'bg-gradient-to-r from-[#EAF5E7] via-[#EAF5E7]/90 to-[#EAF5E7]/35'
        )}
      />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />

      <div className="relative z-10 flex min-h-[84px] max-w-[72%] flex-col justify-between lg:min-h-[92px]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">
            {tone === 'dark' ? 'Weekly' : tone === 'gold' ? 'Soon' : 'Farmer'}
          </p>
          <h3 className="mt-1 text-base font-black leading-tight tracking-[-0.02em] lg:text-[17px]">
            {title}
          </h3>
          <p className={cx('mt-1.5 text-xs font-semibold leading-4', tone === 'dark' ? 'text-white/85' : 'text-[#5F6A62]')}>
            {subtitle}
          </p>
        </div>

        <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-current/20 bg-white/15 px-3 py-1.5 text-[11px] font-black backdrop-blur">
          {cta}
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}


function MarketSearch({ query, setQuery, onSubmit }: { query: string; setQuery: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-center" role="search">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-5 top-1/5 h-5 w-5 -translate-y-1/5 text-[#2D6741]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search products"
          placeholder="Search callaloo, Scotch bonnet, herbs, farms..."
          className="h-[60px] w-full rounded-full border border-[#D8E5D4] bg-white py-3 pl-14 pr-[7.5rem] text-sm font-bold text-[#183B28] shadow-[0_12px_36px_rgba(24,59,40,0.07)] outline-none transition placeholder:text-[#5F6A62]/60 focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
        />
        <button type="submit" className="absolute right-1.5 top-1/5 -translate-y-1/5 rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(45,103,65,0.24)] transition hover:bg-[#183B28] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/20">
          Search
        </button>
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniPromise icon={<Truck className="h-4 w-4" />} title="Next-day delivery" text="Order by 12pm" />
        <MiniPromise icon={<ShieldCheck className="h-4 w-4" />} title="Fresh guarantee" text="Quality checked" />
        <MiniPromise icon={<MapPin className="h-4 w-4" />} title="Islandwide" text="Local farm routes" />
      </div>
    </form>
  );
}

function MiniPromise({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] px-4 py-3 shadow-sm transition hover:border-[#2D6741]/30 hover:bg-[#F4F9F2]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black text-[#183B28]">{title}</span>
        <span className="block truncate text-[11px] font-bold text-[#5F6A62]">{text}</span>
      </span>
    </div>
  );
}

function CategoryStrip({ categories, activeCategory, activeTag, setActiveCategory, clearFilters }: { categories: Array<CategoryConfig & { count: number }>; activeCategory: string; activeTag: string; setActiveCategory: (value: CategoryConfig & { count: number }) => void; clearFilters: () => void }) {
  const allCount = categories.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="mt-5 grid gap-3 overflow-x-auto pb-2 [grid-auto-columns:minmax(180px,1fr)] [grid-auto-flow:column] [scrollbar-width:none] lg:grid-flow-row lg:grid-cols-5 xl:grid-cols-9 [&::-webkit-scrollbar]:hidden">
      <CategoryButton
        active={activeCategory === 'All' && !activeTag}
        label="All Produce"
        count={allCount}
        icon={Package}
        image={CATEGORY_IMAGES.all}
        alt="Fresh produce selection at a market"
        onClick={clearFilters}
      />

      {categories.map((item) => {
        const active =
          item.label === 'Vegan Picks'
            ? activeTag === 'vegan'
            : item.label === 'Farmer Specials'
              ? activeTag === 'farmer-specials'
              : activeCategory === item.label;

        return (
          <CategoryButton
            key={item.label}
            active={active}
            label={item.label}
            count={item.count}
            icon={item.icon}
            image={item.image}
            alt={item.alt}
            onClick={() => setActiveCategory(item)}
          />
        );
      })}
    </div>
  );
}


function CategoryButton({
  label,
  count,
  icon: Icon,
  image,
  alt,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: IconType;
  image: string;
  alt: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'group flex min-h-[76px] items-center gap-3 rounded-[20px] border bg-white p-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(24,59,40,0.10)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/15',
        active ? 'border-[#2D6741] bg-[#EAF5E7] ring-2 ring-[#2D6741]/15' : 'border-[#D8E5D4] hover:border-[#2D6741]/35'
      )}
    >
      <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#F4F9F2] shadow-sm" role="img" aria-label={alt}>
        <span className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${image})` }} />
        <span className="absolute inset-0 bg-[#183B28]/10" />
        <span className="absolute left-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-[#2D6741] shadow-sm backdrop-blur">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black leading-tight text-[#183B28]">{label}</span>
        <span className="mt-1 block truncate text-[11px] font-bold text-[#5F6A62]">Fresh local picks</span>
      </span>

      <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black', active ? 'bg-white text-[#2D6741]' : 'bg-[#F4F9F2] text-[#5F6A62]')}>
        {count}
      </span>
    </button>
  );
}


function ProductShelf({ title, subtitle, products }: { title: string; subtitle: string; products: MarketProduct[] }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white/95 p-5 shadow-[0_22px_70px_rgba(24,59,40,0.08)] sm:p-6">
      <SectionHeader eyebrow="Fresh value" title={title} subtitle={subtitle} actionHref="/shop?tag=deals" actionLabel="View all deals" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {products.slice(0, 5).map((product, index) => <DealCard key={String(product.id) || index} product={product} />)}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle, actionHref, actionLabel }: { eyebrow?: string; title: string; subtitle?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#183B28] sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62]">{subtitle}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-2 text-xs font-black text-[#2D6741] transition hover:border-[#2D6741]/35 hover:bg-[#EAF5E7] hover:text-[#183B28] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/10">
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function DealCard({ product }: { product: MarketProduct }) {
  const { addToCart } = useCart();
  const addable = isAddable(product);

  return (
    <article className="group grid min-h-[148px] grid-cols-[102px_1fr] gap-3 rounded-[22px] border border-[#D8E5D4] bg-[#FFFEFC] p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#2D6741]/35 hover:bg-white hover:shadow-[0_22px_60px_rgba(24,59,40,0.12)]">
      <Link href={`/product/${product.id}`} className="relative h-full min-h-[116px] overflow-hidden rounded-[18px] bg-[#F4F9F2] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/15">
        <SafeImage src={product.image_url || HERO_IMAGE} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="140px" fallback={HERO_IMAGE} />
        <MarketBadge className="absolute bottom-2 left-2" tone={product.is_deal_of_day ? 'gold' : 'green'}>{productBadge(product)}</MarketBadge>
      </Link>
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#5F6A62]">{product.category || 'Fresh produce'}</p>
        <Link href={`/product/${product.id}`} className="mt-1 line-clamp-2 text-sm font-black leading-tight text-[#183B28] transition hover:text-[#2D6741] focus:outline-none focus-visible:text-[#2D6741]">{product.name}</Link>
        <p className="mt-1 text-base font-black text-[#183B28]">{money(productPrice(product))} <span className="text-[11px] font-bold text-[#5F6A62]">/ {product.unit || 'each'}</span></p>
        <p className="mt-1 truncate text-[11px] font-bold text-[#5F6A62]">{stockLabel(product)}</p>
        <button
          type="button"
          onClick={() => addable && addToCart(asCartProduct(product))}
          disabled={!addable}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2D6741] px-3 py-2 text-[11px] font-black text-white shadow-[0_10px_24px_rgba(45,103,65,0.20)] transition hover:bg-[#183B28] disabled:cursor-not-allowed disabled:bg-[#D8E5D4] disabled:text-[#5F6A62] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/20"
        >
          Add to Box <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function FilterPanel({ activeFilters, onToggleFilter, onClear, productCount, mobile = false }: { activeFilters: Set<FilterKey>; onToggleFilter: (filter: FilterKey) => void; onClear: () => void; productCount: number; mobile?: boolean }) {
  return (
    <aside className={cx('h-fit rounded-[28px] border border-[#D8E5D4] bg-white/95 p-5 shadow-[0_18px_50px_rgba(24,59,40,0.07)]', !mobile && 'hidden lg:block lg:sticky lg:top-5')}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#DFA75A]">Market filters</p>
          <h3 className="mt-1 inline-flex items-center gap-2 text-base font-black text-[#183B28]"><Filter className="h-4 w-4" /> Filters</h3>
          <p className="mt-1 text-xs font-semibold text-[#5F6A62]">{productCount} matching items</p>
        </div>
        <button type="button" onClick={onClear} className="rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-3 py-1.5 text-xs font-black text-[#2D6741] transition hover:bg-[#EAF5E7] hover:text-[#183B28] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/10">Clear</button>
      </div>
      <FilterGroup title="Availability" items={[["in-stock", 'In stock'], ['ready-soon', 'Ready soon'], ['pre-order', 'Pre-order']]} activeFilters={activeFilters} onToggleFilter={onToggleFilter} />
      <FilterGroup title="Labels" items={[["organic", 'Organic'], ['local', 'Local'], ['pesticide-free', 'Pesticide free'], ['premium', 'Premium']]} activeFilters={activeFilters} onToggleFilter={onToggleFilter} />
      <FilterGroup title="Harvest" items={[["deals", 'Deal of the day']]} activeFilters={activeFilters} onToggleFilter={onToggleFilter} />
    </aside>
  );
}

function FilterGroup({ title, items, activeFilters, onToggleFilter }: { title: string; items: Array<[FilterKey, string]>; activeFilters: Set<FilterKey>; onToggleFilter: (filter: FilterKey) => void }) {
  return (
    <div className="border-t border-[#D8E5D4] py-4 first:border-t-0 first:pt-0">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#183B28]">{title}</p>
      <div className="space-y-2">
        {items.map(([key, label]) => {
          const checked = activeFilters.has(key);
          return (
            <label key={key} className={cx('flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-sm font-bold transition', checked ? 'border-[#2D6741]/35 bg-[#EAF5E7] text-[#183B28]' : 'border-transparent text-[#5F6A62] hover:border-[#D8E5D4] hover:bg-[#F4F9F2]')}>
              <span>{label}</span>
              <input checked={checked} onChange={() => onToggleFilter(key)} type="checkbox" className="h-4 w-4 rounded border-[#D8E5D4] accent-[#2D6741]" />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ProductDiscovery({ products, mode, loading, sort, setSort, openFilters }: { products: MarketProduct[]; mode: MarketMode; loading: boolean; sort: SortMode; setSort: (value: SortMode) => void; openFilters: () => void }) {
  const max = mode === 'shop' ? 30 : 10;
  return (
    <section className="min-w-0">
      <div className="mb-5 rounded-[28px] border border-[#D8E5D4] bg-white/90 p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#DFA75A]">Fresh marketplace</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#183B28]">{products.length} products available</h2>
          <p className="mt-1 text-sm font-semibold text-[#5F6A62]">Popular picks from local farms and partner growers.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
          <button type="button" onClick={openFilters} className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-4 py-2.5 text-xs font-black text-[#183B28] shadow-sm transition hover:border-[#2D6741]/35 hover:bg-[#F4F9F2] lg:hidden">
            <Filter className="h-4 w-4" /> Filters
          </button>
          <label className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-4 py-2.5 text-xs font-black text-[#183B28] shadow-sm transition hover:border-[#2D6741]/35 hover:bg-[#F4F9F2]">
            Sort by:
            <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="bg-transparent text-xs font-black outline-none">
              <option value="featured">Featured</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="newest">Newest</option>
              <option value="stock">In stock first</option>
            </select>
            <SlidersHorizontal className="h-4 w-4 text-[#2D6741]" />
          </label>
        </div>
      </div>
      {loading ? (
        <LoadingProductSkeleton compact />
      ) : products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.slice(0, max).map((product, index) => <ProductCard key={String(product.id) || index} product={product} />)}
        </div>
      ) : (
        <EmptyMarketState />
      )}
    </section>
  );
}

function ProductCard({ product }: { product: MarketProduct }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [notice, setNotice] = useState('');
  const addable = isAddable(product);
  const old = originalPrice(product);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('hpj_favorites') || '[]') as Array<string | number>;
      setFavorite(ids.map(String).includes(String(product.id)));
    } catch {
      setFavorite(false);
    }
  }, [product.id]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  }

  function toggleFavorite(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    try {
      const ids = new Set((JSON.parse(localStorage.getItem('hpj_favorites') || '[]') as Array<string | number>).map(String));
      const id = String(product.id);
      ids.has(id) ? ids.delete(id) : ids.add(id);
      localStorage.setItem('hpj_favorites', JSON.stringify(Array.from(ids)));
      setFavorite(ids.has(id));
      flash(ids.has(id) ? 'Saved to favorites' : 'Removed from favorites');
    } catch {
      setFavorite((value) => !value);
      flash('Favorite updated');
    }
  }

  function notifyMe() {
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent('/ready-soon')}`);
      return;
    }
    try {
      const ids = new Set((JSON.parse(localStorage.getItem('hpj_ready_soon_alerts') || '[]') as Array<string | number>).map(String));
      ids.add(String(product.id));
      localStorage.setItem('hpj_ready_soon_alerts', JSON.stringify(Array.from(ids)));
    } catch {}
    flash('Alert saved. We’ll notify you when it is ready.');
  }

  function addSelectedQuantity() {
    if (product.ready_soon && !addable) {
      notifyMe();
      return;
    }
    if (!addable) return;
    for (let index = 0; index < quantity; index += 1) addToCart(asCartProduct(product));
    flash(quantity > 1 ? `${quantity} added to My Box` : 'Added to My Box');
  }

  return (
    <article className="group flex min-h-[438px] flex-col overflow-hidden rounded-[26px] border border-[#D8E5D4] bg-white shadow-[0_14px_42px_rgba(24,59,40,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#2D6741]/30 hover:shadow-[0_24px_70px_rgba(24,59,40,0.13)]">
      <div className="relative h-48 overflow-hidden bg-[#F4F9F2]">
        <Link href={`/product/${product.id}`} aria-label={`View ${product.name}`} className="absolute inset-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/15">
          <SafeImage src={product.image_url || HERO_IMAGE} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 280px" fallback={HERO_IMAGE} />
        </Link>
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent" />
        <MarketBadge className="absolute left-3 top-3" tone={product.is_deal_of_day ? 'gold' : product.ready_soon ? 'purple' : 'green'}>{productBadge(product)}</MarketBadge>
        <button type="button" onClick={toggleFavorite} aria-label={favorite ? `Remove ${product.name} from favorites` : `Save ${product.name}`} className={cx('absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#2D6741] shadow-sm backdrop-blur transition hover:bg-[#FFF3D9] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80', favorite && 'text-red-600')}>
          <Heart className={cx('h-4 w-4', favorite && 'fill-current')} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#5F6A62]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2D6741]" />
          <span className="truncate">{product.farm_name || product.farmer_name || 'Local partner farm'}</span>
        </div>
        <Link href={`/product/${product.id}`} className="mt-2 line-clamp-2 min-h-[44px] text-base font-black leading-snug text-[#183B28] transition hover:text-[#2D6741] focus:outline-none focus-visible:text-[#2D6741]">
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-[#5F6A62]">
          <span className="rounded-full bg-[#F4F9F2] px-2.5 py-1">{product.parish || product.category || 'Jamaica'}</span>
          <span className={cx('rounded-full px-2.5 py-1', addable ? 'bg-[#EAF5E7] text-[#2D6741]' : product.ready_soon ? 'bg-[#F2EEFF] text-[#6D5BD0]' : 'bg-[#FFF3D9] text-[#8B5D18]')}>{stockLabel(product)}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <span className="text-2xl font-black tracking-[-0.03em] text-[#183B28]">{money(productPrice(product))}</span>
          <span className="pb-1 text-xs font-bold text-[#5F6A62]">/ {product.unit || 'each'}</span>
          {old ? <span className="pb-1 text-xs font-bold text-[#5F6A62]/60 line-through">{money(old)}</span> : null}
        </div>
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-11 items-center rounded-full border border-[#D8E5D4] bg-[#F4F9F2]">
              <button type="button" aria-label={`Decrease quantity for ${product.name}`} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-11 w-10 place-items-center text-[#2D6741] transition hover:text-[#183B28] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6741]/20"><Minus className="h-3.5 w-3.5" /></button>
              <span className="min-w-5 text-center text-xs font-black text-[#183B28]">{quantity}</span>
              <button type="button" aria-label={`Increase quantity for ${product.name}`} onClick={() => setQuantity((value) => Math.min(99, value + 1))} className="grid h-11 w-10 place-items-center text-[#2D6741] transition hover:text-[#183B28] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6741]/20"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            <button
              type="button"
              disabled={!addable && !product.ready_soon}
              onClick={addSelectedQuantity}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#2D6741] px-4 text-xs font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.22)] transition hover:bg-[#183B28] disabled:cursor-not-allowed disabled:bg-[#D8E5D4] disabled:text-[#5F6A62] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/20"
            >
              {product.ready_soon && !addable ? 'Notify Me' : addable ? 'Add to Box' : 'Out of stock'}
            </button>
          </div>
          {notice ? <p className="mt-3 rounded-2xl border border-[#D8E5D4] bg-[#EAF5E7] px-3 py-2 text-xs font-black text-[#183B28]">{notice}</p> : null}
        </div>
      </div>
    </article>
  );
}

function WeeklyBoxBanner() {
  return (
    <section className="relative mt-10 overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-[#183B28] shadow-[0_30px_90px_rgba(24,59,40,0.18)]">
      <div className="absolute inset-0">
        <SafeImage
          src={WEEKLY_IMAGE}
          alt=""
          fill
          className="object-cover opacity-20"
          sizes="1500px"
          fallback={HERO_IMAGE}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,59,40,0.98)_0%,rgba(24,59,40,0.94)_42%,rgba(24,59,40,0.78)_72%,rgba(24,59,40,0.58)_100%)]" />
      </div>

      <div className="relative z-10 grid items-center gap-7 p-6 sm:p-8 lg:grid-cols-[340px_1fr_auto] lg:p-10">
        <div className="relative hidden h-52 overflow-hidden rounded-[28px] border border-white/20 bg-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:block">
          <SafeImage
            src={WEEKLY_IMAGE}
            alt="Fresh produce weekly box"
            fill
            className="object-cover"
            sizes="360px"
            fallback={HERO_IMAGE}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#183B28]/45 via-transparent to-transparent" />
        </div>

        <div className="max-w-3xl">
          <MarketBadge tone="gold">Make it easy. Make it fresh.</MarketBadge>

          <h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl">
            Your Weekly Box, Your Way
          </h2>

          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/85">
            Choose your produce, skip anytime, and keep your kitchen stocked
            with fresh local harvests from Jamaican farms.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { href: '/shop', label: 'Choose favorites' },
              { href: '/trust-center', label: 'Delivered fresh' },
              { href: '/subscribe-save', label: 'Flexible plans' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex lg:justify-end">
          <MarketButton
            href="/weekly-box"
            variant="cream"
            className="w-full justify-center whitespace-nowrap sm:w-auto"
          >
            Build Your Weekly Box
          </MarketButton>
        </div>
      </div>
    </section>
  );
}

function FarmerFeatureGrid({ products }: { products: MarketProduct[] }) {
  const farms = useMemo(() => {
    const unique = new Map<string, MarketProduct>();
    products.forEach((product) => {
      const farm = product.farm_name || product.farmer_name;
      if (farm && !unique.has(farm)) unique.set(farm, product);
    });
    const values = Array.from(unique.values()).slice(0, 3);
    return values.length ? values : fallbackProducts.slice(0, 3);
  }, [products]);

  return (
    <section className="mt-10">
      <SectionHeader eyebrow="Featured Jamaican farms" title="Meet the growers behind the market" subtitle="Real partner farms, local produce, and careful harvest standards behind every box." actionHref="/farmer" actionLabel="Sell with us" />
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {farms.map((product, index) => (
          <Link href={`/shop?farm=${encodeURIComponent(String(product.farm_name || product.farmer_name || product.name))}`} key={`${product.farm_name || product.name}-${index}`} className="group block overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-white shadow-[0_16px_48px_rgba(24,59,40,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#2D6741]/30 hover:shadow-[0_24px_70px_rgba(24,59,40,0.12)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/15">
            <div className="relative h-48 bg-[#F4F9F2]">
              <SafeImage src={index === 0 ? FARMER_IMAGE : product.image_url || HERO_IMAGE} alt={product.farm_name || product.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 420px" fallback={FARMER_IMAGE} />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#102D1F]/70 to-transparent" />
              <MarketBadge className="absolute bottom-3 left-3" tone="green">Verified farm</MarketBadge>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-black tracking-[-0.03em] text-[#183B28]">{product.farm_name || product.farmer_name || 'Harvest partner farm'}</h3>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#5F6A62]"><MapPin className="h-4 w-4 text-[#2D6741]" />{product.parish || 'Jamaica'}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#5F6A62]">Known for {product.category?.toLowerCase() || 'fresh seasonal produce'} and careful harvest standards.</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrustSection() {
  const links = ['/farmer', '/security-audit', '/trust-center', '/trust-center', '/farmer'];
  return (
    <section className="mt-10 rounded-[32px] border border-[#D8E5D4] bg-white/95 p-5 shadow-[0_22px_70px_rgba(24,59,40,0.07)] sm:p-6">
      <SectionHeader eyebrow="Why shoppers trust us" title="Built for fresh, safe, reliable local shopping" subtitle="Everything on the page should help customers feel confident before they add to their box." />
      <div className="mt-5 grid gap-4 md:grid-cols-5">
        {trustFeatures.map(({ icon: Icon, title, text }, index) => (
          <Link key={title} href={links[index] || '/trust-center'} className="rounded-[24px] border border-[#D8E5D4] bg-[#F4F9F2] p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-[#2D6741]/30 hover:bg-[#EAF5E7] hover:shadow-[0_18px_50px_rgba(24,59,40,0.08)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2D6741]/15">
            <div className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-full bg-white text-[#2D6741] shadow-sm"><Icon className="h-6 w-6" /></div>
            <h3 className="mt-3 text-sm font-black uppercase tracking-[0.12em] text-[#183B28]">{title}</h3>
            <p className="mt-2 text-xs font-semibold leading-5 text-[#5F6A62]">{text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyMarketState() {
  return (
    <div className="rounded-[30px] border border-dashed border-[#D8E5D4] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]"><Search className="h-7 w-7" /></div>
      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[#183B28]">No matching fresh picks</h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#5F6A62]">Try a different search or category. New harvests are added as farms confirm availability.</p>
      <MarketButton href="/shop" className="mt-6">Shop all produce</MarketButton>
    </div>
  );
}

function MarketNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 rounded-[22px] border border-[#DFA75A]/35 bg-[#FFF3D9] px-5 py-4 text-sm font-bold text-[#8B5D18] shadow-sm">
      {children}
    </div>
  );
}

function LoadingProductSkeleton({ compact = false }: { compact?: boolean }) {
  const count = compact ? 8 : 5;
  return (
    <div className={cx('grid gap-4', compact ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5')}>
      {Array.from({ length: count }).map((_, index) => <div key={index} className="h-[310px] animate-pulse rounded-[26px] border border-[#D8E5D4]/70 bg-white/80 shadow-sm" />)}
    </div>
  );
}

function MarketButton({ href, children, variant = 'dark', className }: { href: string; children: ReactNode; variant?: 'dark' | 'light' | 'cream' | 'glass'; className?: string }) {
  return (
    <Link
      href={href}
      className={cx(
        'inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4',
        variant === 'dark' && 'bg-[#2D6741] text-white shadow-[0_14px_30px_rgba(45,103,65,0.24)] hover:bg-[#183B28] focus-visible:ring-[#2D6741]/20',
        variant === 'light' && 'border border-[#D8E5D4] bg-white text-[#183B28] shadow-sm hover:border-[#2D6741]/35 hover:bg-[#F4F9F2] focus-visible:ring-[#2D6741]/15',
        variant === 'cream' && 'bg-[#FFF3D9] text-[#183B28] shadow-[0_12px_30px_rgba(255,243,217,0.2)] hover:bg-white focus-visible:ring-white/35',
        variant === 'glass' && 'border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 focus-visible:ring-white/30',
        className
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function MarketBadge({ children, tone = 'green', className }: { children: ReactNode; tone?: 'green' | 'gold' | 'purple'; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] shadow-sm',
        tone === 'green' && 'bg-[#2D6741] text-white',
        tone === 'gold' && 'bg-[#DFA75A] text-[#183B28]',
        tone === 'purple' && 'bg-[#6D5BD0] text-white',
        className
      )}
    >
      {children}
    </span>
  );
}

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src?: string | null;
  fallback?: string;
};

function SafeImage({ src, fallback = DEFAULT_PRODUCT_IMAGE, alt, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallback);

  useEffect(() => {
    setCurrentSrc(src || fallback);
  }, [fallback, src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized
      onError={() => {
        if (currentSrc !== fallback) setCurrentSrc(fallback);
      }}
    />
  );
}
