'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Leaf,
  PackageCheck,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Truck,
  WalletCards,
} from 'lucide-react';

import {
  Badge,
  Card,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { ProductGrid } from '@/components/product/product-grid';
import { fetchProducts } from '@/lib/services';
import { formatJmd } from '@/lib/format';
import type { Product } from '@/lib/types';

const WEEKLY_IMAGE = '/elite/weekly-box-banner.png';
const HERO_FALLBACK = '/elite/hero-produce-box.png';

type BoxPlan = {
  id: string;
  title: string;
  price: number;
  badge: string;
  copy: string;
  bestFor: string;
  includes: string[];
  href: string;
  featured?: boolean;
};

type BudgetFilter = 'all' | 'under-500' | '500-1000' | 'over-1000';

const plans: BoxPlan[] = [
  {
    id: 'starter',
    title: 'Fresh Starter',
    price: 2500,
    badge: 'Simple weekly box',
    copy: 'A practical starter box with greens, herbs, fruits, and everyday staples.',
    bestFor: 'Singles, couples, or first-time shoppers',
    includes: ['Leafy greens', 'Fresh herbs', '2–3 fruits', '1 ground provision'],
    href: '/shop',
  },
  {
    id: 'family',
    title: 'Family Market',
    price: 4500,
    badge: 'Best value',
    copy: 'A larger box designed for family meals, prep days, and shared cooking.',
    bestFor: 'Families and weekly meal prep',
    includes: ['Vegetables', 'Ground provisions', 'Fruits', 'Herbs', 'Farmer specials'],
    href: '/shop',
    featured: true,
  },
  {
    id: 'vegan',
    title: 'Vegan Pantry',
    price: 3500,
    badge: 'Plant-based',
    copy: 'Plant-based staples, roots, herbs, fruits, and seasonal farmer picks.',
    bestFor: 'Plant-forward cooking and healthy meal planning',
    includes: ['Roots', 'Greens', 'Seasonal fruit', 'Herbs', 'Fresh add-ons'],
    href: '/shop',
  },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function productPrice(product: Product) {
  return Number(product.price || 0);
}

function productStock(product: Product) {
  return Number(product.stock_quantity || 0);
}

function productCategory(product: Product) {
  return String(product.category || 'Fresh produce');
}

function isAvailable(product: Product) {
  return product.is_available && product.product_status !== 'hidden' && productStock(product) > 0;
}

function getCategories(products: Product[]) {
  return Array.from(new Set(products.map(productCategory).filter(Boolean))).sort();
}

function budgetMatches(product: Product, budget: BudgetFilter) {
  const price = productPrice(product);

  if (budget === 'under-500') return price < 500;
  if (budget === '500-1000') return price >= 500 && price <= 1000;
  if (budget === 'over-1000') return price > 1000;

  return true;
}

function getPlanSuggestion(planId: string) {
  if (planId === 'starter') return 'Start with everyday staples, then add 2–3 fresh extras.';
  if (planId === 'family') return 'Build around roots, vegetables, herbs, and fruits for full meals.';
  if (planId === 'vegan') return 'Choose greens, roots, herbs, and high-fibre tropical fruits.';

  return 'Choose fresh items and build a box that fits your kitchen.';
}

export default function WeeklyBoxPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [budget, setBudget] = useState<BudgetFilter>('all');
  const [selectedPlan, setSelectedPlan] = useState('family');

  async function loadProducts({ silent = false }: { silent?: boolean } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const rows = await fetchProducts();
      setProducts(rows || []);
    } catch {
      setError('We could not load the weekly box products right now. Please refresh and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const rows = await fetchProducts();
        if (!mounted) return;
        setProducts(rows || []);
      } catch {
        if (!mounted) return;
        setError('We could not load the weekly box products right now. Please refresh and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => ['All', ...getCategories(products)], [products]);

  const availableProducts = useMemo(() => {
    return products.filter(isAvailable);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = normalizeText(query);

    return availableProducts
      .filter((product) => {
        const haystack = normalizeText(
          `${product.name || ''} ${product.description || ''} ${product.category || ''} ${product.unit || ''}`,
        );

        const matchesQuery = !term || haystack.includes(term);
        const matchesCategory = category === 'All' || productCategory(product) === category;
        const matchesBudget = budgetMatches(product, budget);

        return matchesQuery && matchesCategory && matchesBudget;
      })
      .sort((a, b) => {
        const stockDiff = productStock(b) - productStock(a);
        if (stockDiff !== 0) return stockDiff;

        return productPrice(a) - productPrice(b);
      })
      .slice(0, 12);
  }, [availableProducts, query, category, budget]);

  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan) || plans[1];

  const stats = useMemo(() => {
    const totalStock = availableProducts.reduce((sum, product) => sum + productStock(product), 0);
    const categoriesCount = getCategories(availableProducts).length;
    const lowestPrice = availableProducts.length ? Math.min(...availableProducts.map(productPrice)) : 0;

    return {
      items: availableProducts.length,
      stock: totalStock,
      categories: categoriesCount,
      lowestPrice,
    };
  }, [availableProducts]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_48%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <WeeklyBoxHero selectedPlan={selectedPlanData} stats={stats} />

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <Plan
              key={plan.id}
              plan={plan}
              selected={selectedPlan === plan.id}
              onSelect={() => setSelectedPlan(plan.id)}
            />
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_20px_60px_rgba(24,59,40,0.08)] sm:p-8">
            <Badge tone="green">
              <PackageCheck className="h-3 w-3" />
              Smart box builder
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
              Build a box that fits your kitchen.
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62]">
              Choose a box plan, filter fresh items, add your staples to My Box, then checkout once. This turns the weekly box page into a useful MVP sales funnel.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Step number="1" title="Choose plan" text="Pick the weekly box size that fits your kitchen." />
              <Step number="2" title="Add items" text="Use the filtered builder to add produce to My Box." />
              <Step number="3" title="Checkout" text="Confirm pickup or delivery and complete the order." />
            </div>

            <div className="mt-6 rounded-[24px] border border-[#BFD5BC] bg-[#F7FBF5] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#DFA75A]">
                Plan guidance
              </p>
              <h3 className="mt-2 text-xl font-black text-[#183B28]">
                {selectedPlanData.title}: {selectedPlanData.bestFor}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
                {getPlanSuggestion(selectedPlanData.id)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedPlanData.includes.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#2D6741] ring-1 ring-[#D8E5D4]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-[28px] border border-[#0F4A2F] bg-[#073F2A] p-6 text-white shadow-[0_24px_70px_rgba(7,63,42,0.22)] sm:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,63,42,1)_0%,rgba(15,74,47,0.98)_48%,rgba(24,59,40,1)_100%)]" />
            <div className="absolute right-[-80px] top-[-90px] h-64 w-64 rounded-full bg-[#2D6741]/35 blur-3xl" />
            <div className="absolute bottom-[-90px] left-[-90px] h-64 w-64 rounded-full bg-[#DFA75A]/18 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#7A4F13] shadow-sm">
                <HeartHandshake className="h-3.5 w-3.5" />
                Fresh benefits
              </span>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Why shoppers love weekly boxes.
              </h2>

              <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-white/82">
                Clear weekly planning, local produce, flexible shopping, and a smooth path from box builder to checkout.
              </p>

              <div className="mt-6 grid gap-3">
                <Benefit icon={<CalendarDays className="h-4 w-4" />} title="Less planning" text="Your core produce is handled for the week." />
                <Benefit icon={<Leaf className="h-4 w-4" />} title="More local support" text="Every order helps support Jamaican farmers and suppliers." />
                <Benefit icon={<Truck className="h-4 w-4" />} title="Flexible shopping" text="Add extra products whenever your kitchen needs more." />
                <Benefit icon={<ShieldCheck className="h-4 w-4" />} title="Cleaner ordering" text="Build your box, review it in My Box, then checkout securely." />
              </div>
            </div>
          </Card>
        </section>

        <section id="box-items" className="mt-10 scroll-mt-28">
          <SectionHeader
            eyebrow="Box builder"
            title="Add fresh items to your weekly box"
            subtitle="Search and filter live products, add staples to My Box, then checkout when you are ready."
            action={
              <button
                type="button"
                onClick={() => loadProducts({ silent: true })}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-[#F4F9F2] disabled:opacity-60"
              >
                <RefreshCcw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                {refreshing ? 'Refreshing...' : 'Refresh items'}
              </button>
            }
          />

          <BuilderControls
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
            budget={budget}
            onBudgetChange={setBudget}
          />

          {error ? (
            <div className="mt-6 rounded-[24px] border border-[#DFA75A]/40 bg-[#FFF3D9] px-5 py-4 text-sm font-bold leading-6 text-[#8B5D18]">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            {loading ? (
              <LoadingState label="Loading fresh box items..." />
            ) : filteredProducts.length ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#5F6A62]">
                    Showing <span className="font-black text-[#183B28]">{filteredProducts.length}</span> suggested item{filteredProducts.length === 1 ? '' : 's'} for your weekly box.
                  </p>

                  <Link
                    href="/my-box"
                    className="inline-flex items-center gap-2 rounded-full bg-[#183B28] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(24,59,40,0.18)] transition hover:bg-[#2D6741]"
                  >
                    Review My Box
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <ProductGrid products={filteredProducts} />
              </>
            ) : (
              <Card className="rounded-[28px] border border-dashed border-[#D8E5D4] bg-white p-10 text-center">
                <Badge tone="green">Fresh start</Badge>
                <h3 className="mt-4 text-2xl font-black text-[#183B28]">
                  No matching weekly box items
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#5F6A62]">
                  Try clearing your search, choosing another category, or shopping all available produce.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setCategory('All');
                      setBudget('all');
                    }}
                    className="inline-flex rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-[#F4F9F2]"
                  >
                    Clear filters
                  </button>
                  <Link
                    href="/shop"
                    className="inline-flex rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.24)] transition hover:bg-[#183B28]"
                  >
                    Shop all produce
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function WeeklyBoxHero({
  selectedPlan,
  stats,
}: {
  selectedPlan: BoxPlan;
  stats: {
    items: number;
    stock: number;
    categories: number;
    lowestPrice: number;
  };
}) {
  const [imageSrc, setImageSrc] = useState(WEEKLY_IMAGE);

  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] shadow-[0_30px_90px_rgba(24,59,40,0.22)]">
      <Image
        src={imageSrc}
        alt="The Harvest Place Ja weekly farm box"
        fill
        priority
        className="object-cover object-center opacity-48"
        sizes="100vw"
        onError={() => setImageSrc(HERO_FALLBACK)}
        unoptimized
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,59,40,0.97)_0%,rgba(24,59,40,0.86)_42%,rgba(24,59,40,0.28)_100%)]" />

      <div className="relative z-10 grid min-h-[450px] items-center gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_460px] lg:px-10 lg:py-10">
        <div className="max-w-3xl">
          <Badge tone="gold">
            <ShoppingBasket className="h-3 w-3" />
            Weekly farm box
          </Badge>

          <h1 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Build your weekly farm box.
          </h1>

          <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/82">
            Fresh Jamaican produce, pantry staples, herbs, roots, fruits, and farmer picks packed into one simple weekly box.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="#box-items"
              className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] shadow-[0_14px_30px_rgba(255,243,217,0.18)] transition hover:bg-white"
            >
              Start building
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/my-box"
              className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
            >
              Review My Box
              <PackageCheck className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/14 bg-white/12 p-5 text-white shadow-2xl backdrop-blur-md">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#DFA75A]">
            Selected plan
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.035em]">
            {selectedPlan.title}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
            {selectedPlan.copy}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <HeroStat label="Fresh items" value={String(stats.items)} />
            <HeroStat label="Categories" value={String(stats.categories)} />
            <HeroStat label="Live stock" value={String(stats.stock)} />
            <HeroStat label="From" value={stats.lowestPrice ? formatJmd(stats.lowestPrice) : 'Soon'} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#DFA75A]">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function Plan({
  plan,
  selected,
  onSelect,
}: {
  plan: BoxPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[28px] border p-6 text-left shadow-[0_18px_50px_rgba(24,59,40,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(24,59,40,0.12)] ${
        selected
          ? 'border-[#DFA75A] bg-[#183B28] text-white ring-4 ring-[#DFA75A]/20'
          : plan.featured
            ? 'border-[#2D6741]/50 bg-[#F7FBF5] text-[#183B28]'
            : 'border-[#D8E5D4] bg-white text-[#183B28]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <Badge tone={selected ? 'gold' : plan.featured ? 'green' : 'green'}>
          {plan.badge}
        </Badge>

        {selected ? (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FFF3D9] text-[#183B28]">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-[-0.035em]">
        {plan.title}
      </h3>

      <p className={`mt-2 text-lg font-black ${selected ? 'text-[#FFF3D9]' : 'text-[#2D6741]'}`}>
        From {formatJmd(plan.price)}
      </p>

      <p className={`mt-3 text-sm font-semibold leading-6 ${selected ? 'text-white/78' : 'text-[#5F6A62]'}`}>
        {plan.copy}
      </p>

      <span className={`mt-5 inline-flex rounded-full px-5 py-3 text-sm font-black transition ${
        selected
          ? 'bg-[#FFF3D9] text-[#183B28]'
          : 'bg-[#2D6741] text-white'
      }`}>
        {selected ? 'Selected' : 'Select plan'}
      </span>
    </button>
  );
}

function BuilderControls({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
  budget,
  onBudgetChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  budget: BudgetFilter;
  onBudgetChange: (value: BudgetFilter) => void;
}) {
  return (
    <Card className="mt-6 rounded-[28px] border border-[#D8E5D4] bg-white/94 p-3 shadow-[0_18px_55px_rgba(24,59,40,0.07)] backdrop-blur">
      <div className="grid gap-3 lg:grid-cols-[1fr_240px_220px]">
        <label className="flex h-[54px] items-center gap-3 rounded-2xl bg-[#F4F9F2] px-4 ring-1 ring-[#D8E5D4]/70">
          <Search className="h-4 w-4 text-[#2D6741]" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search weekly box items..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#5F6A62]/60"
          />
        </label>

        <label className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D6741]" />
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="h-[54px] w-full appearance-none rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 pl-11 text-sm font-black text-[#183B28] outline-none focus:border-[#2D6741]"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'All categories' : item}
              </option>
            ))}
          </select>
        </label>

        <label className="relative">
          <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#DFA75A]" />
          <select
            value={budget}
            onChange={(event) => onBudgetChange(event.target.value as BudgetFilter)}
            className="h-[54px] w-full appearance-none rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 pl-11 text-sm font-black text-[#183B28] outline-none focus:border-[#2D6741]"
          >
            <option value="all">All prices</option>
            <option value="under-500">Under JMD $500</option>
            <option value="500-1000">JMD $500–$1,000</option>
            <option value="over-1000">Over JMD $1,000</option>
          </select>
        </label>
      </div>
    </Card>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] p-4">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#2D6741] text-sm font-black text-white">
        {number}
      </div>
      <h3 className="mt-3 text-sm font-black text-[#183B28]">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#5F6A62]">{text}</p>
    </div>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/18 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FFF3D9] text-[#7A4F13] shadow-sm">
        {icon}
      </span>
      <div>
        <h3 className="text-base font-black text-white">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-white/82">{text}</p>
      </div>
    </div>
  );
}
