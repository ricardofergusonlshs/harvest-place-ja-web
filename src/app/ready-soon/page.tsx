'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CalendarDays,
  RefreshCw,
  Search,
  ShoppingBag,
  SortAsc,
  Sprout,
} from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { fetchReadySoonProducts } from '@/lib/services';
import type { Product } from '@/lib/types';

type SortOption = 'newest' | 'name';

function getProductText(product: Product) {
  const item = product as Product & Record<string, unknown>;

  return [
    item.name,
    item.title,
    item.description,
    item.category,
    item.farm_name,
    item.farmName,
    item.farmer_name,
    item.parish,
    item.product_status,
    item.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getProductDate(product: Product) {
  const item = product as Product & Record<string, unknown>;

  const rawDate =
    item.createdAt ??
    item.created_at ??
    item.updatedAt ??
    item.updated_at ??
    item.available_at ??
    item.harvest_date;

  if (!rawDate) return 0;

  const timestamp = new Date(String(rawDate)).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getProductName(product: Product) {
  const item = product as Product & Record<string, unknown>;

  return String(item.name ?? item.title ?? '').toLowerCase();
}

export default function ReadySoonPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadProducts = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const readySoonProducts = await fetchReadySoonProducts();

      setProducts(readySoonProducts || []);
      setLastUpdated(new Date());
    } catch {
      setProducts([]);
      setError('We could not load ready-soon products right now. Please refresh and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitialProducts() {
      setLoading(true);
      setError('');

      try {
        const readySoonProducts = await fetchReadySoonProducts();

        if (!mounted) return;

        setProducts(readySoonProducts || []);
        setLastUpdated(new Date());
      } catch {
        if (!mounted) return;

        setProducts([]);
        setError('We could not load ready-soon products right now. Please refresh and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const visibleProducts = normalizedQuery
      ? products.filter((product) => getProductText(product).includes(normalizedQuery))
      : products;

    return [...visibleProducts].sort((a, b) => {
      if (sort === 'name') {
        return getProductName(a).localeCompare(getProductName(b));
      }

      return getProductDate(b) - getProductDate(a);
    });
  }, [products, query, sort]);

  const hasProducts = products.length > 0;
  const hasFilteredProducts = filteredProducts.length > 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_48%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-10">
        <ReadySoonHero
          count={products.length}
          filteredCount={filteredProducts.length}
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onRefresh={() => loadProducts(true)}
        />

        {loading ? (
          <div className="mt-10">
            <LoadingState label="Loading ready-soon harvests..." />
          </div>
        ) : error ? (
          <div className="mt-10">
            <EmptyState
              title="Ready-soon products could not load"
              subtitle={error}
              action={
                <Button onClick={() => loadProducts(true)}>
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              }
            />
          </div>
        ) : hasProducts ? (
          <>
            <section className="mt-8">
              <SectionHeader
                eyebrow="Harvest watchlist"
                title="Upcoming fresh picks"
                subtitle="Search upcoming harvests, preview what farmers are preparing, and subscribe before items enter the main shop."
                action={
                  <div className="flex flex-wrap gap-3">
                    <Button href="/shop" variant="secondary">
                      <ShoppingBag className="h-4 w-4" />
                      Shop available
                    </Button>

                    <Button
                      onClick={() => loadProducts(true)}
                      variant="secondary"
                      disabled={refreshing}
                    >
                      <RefreshCw className="h-4 w-4" />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                }
              />
            </section>

            <Card className="mt-6 rounded-[30px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Badge tone="green">
                    <BellRing className="h-3 w-3" />
                    Ready Soon
                  </Badge>

                  <h2 className="mt-3 text-xl font-black tracking-[-0.035em] text-[#183B28]">
                    Manage upcoming harvests
                  </h2>

                  <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">
                    Showing {filteredProducts.length} of {products.length} upcoming products.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:min-w-[560px]">
                  <label className="relative block">
                    <span className="sr-only">Search ready-soon products</span>

                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D6741]" />

                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search products, farms, categories..."
                      className="h-12 w-full rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-4 pl-11 text-sm font-bold text-[#183B28] outline-none transition placeholder:text-[#5F6A62]/65 focus:border-[#2D6741] focus:bg-white focus:ring-4 focus:ring-[#2D6741]/10"
                    />
                  </label>

                  <label className="relative block">
                    <span className="sr-only">Sort ready-soon products</span>

                    <SortAsc className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D6741]" />

                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value as SortOption)}
                      className="h-12 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-4 pl-11 pr-10 text-sm font-black text-[#183B28] outline-none transition focus:border-[#2D6741] focus:bg-white focus:ring-4 focus:ring-[#2D6741]/10"
                    >
                      <option value="newest">Newest first</option>
                      <option value="name">Name A-Z</option>
                    </select>
                  </label>
                </div>
              </div>
            </Card>

            {hasFilteredProducts ? (
              <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </section>
            ) : (
              <div className="mt-10">
                <EmptyState
                  title="No matching ready-soon products"
                  subtitle="Try a different product name, farm, category, or status."
                  action={
                    <Button onClick={() => setQuery('')}>
                      Clear search
                    </Button>
                  }
                />
              </div>
            )}
          </>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="No ready-soon products"
              subtitle="When farmers or admins mark products as harvesting soon, they will appear here before entering normal shopping."
              action={<Button href="/shop">Shop available products</Button>}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function ReadySoonHero({
  count,
  filteredCount,
  lastUpdated,
  refreshing,
  onRefresh,
}: {
  count: number;
  filteredCount: number;
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge tone="gold">
            <Sprout className="h-3 w-3" />
            Harvesting soon
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            See what fresh harvests are coming next.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            Preview upcoming products, follow farmer harvest plans, and let customers subscribe for alerts before products reach the main shop.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/shop">
              Shop available now
            </Button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {refreshing ? 'Refreshing...' : 'Refresh harvests'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
          <HeroStat label="Upcoming" value={count} />
          <HeroStat label="Showing" value={filteredCount} />
          <HeroStat
            label="Updated"
            value={
              lastUpdated
                ? lastUpdated.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Soon'
            }
            icon={<CalendarDays className="h-4 w-4" />}
          />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/12 bg-white/10 p-5 backdrop-blur">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#DFA75A]">
        {icon}
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}