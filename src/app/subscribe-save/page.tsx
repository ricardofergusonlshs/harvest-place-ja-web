'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductGrid } from '@/components/product/product-grid';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { fetchProducts } from '@/lib/services';
import type { Product } from '@/lib/types';

type SortOption = 'featured' | 'name' | 'discount';

function getMeta(product: Product) {
  return product as Product & Record<string, unknown>;
}

function getProductName(product: Product) {
  const item = getMeta(product);

  return String(item.name ?? item.title ?? '').trim();
}

function getProductSearchText(product: Product) {
  const item = getMeta(product);

  return [
    item.name,
    item.title,
    item.category,
    item.description,
    item.farmName,
    item.farm_name,
  ]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

function getSubscriptionDiscount(product: Product) {
  const item = getMeta(product);

  const discount =
    item.subscribe_save_discount_percent ?? item.subscribe_save_discount ?? 0;

  const numericDiscount = Number(discount);

  return Number.isFinite(numericDiscount) ? numericDiscount : 0;
}

function getProductDate(product: Product) {
  const item = getMeta(product);

  const rawDate =
    item.updatedAt ?? item.updated_at ?? item.createdAt ?? item.created_at;

  if (!rawDate) return 0;

  const timestamp = new Date(String(rawDate)).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function SubscribeSavePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('featured');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);

      const rows = await fetchProducts();

      const subscriptionProducts = rows.filter(
        (product) => product.subscribe_save_enabled,
      );

      setProducts(subscriptionProducts);
      setLastUpdated(new Date());
    } catch {
      setError('We could not load subscription products right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitialProducts() {
      try {
        setError(null);

        const rows = await fetchProducts();

        if (!mounted) return;

        const subscriptionProducts = rows.filter(
          (product) => product.subscribe_save_enabled,
        );

        setProducts(subscriptionProducts);
        setLastUpdated(new Date());
      } catch {
        if (!mounted) return;

        setError('We could not load subscription products right now.');
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
      ? products.filter((product) =>
          getProductSearchText(product).includes(normalizedQuery),
        )
      : products;

    return [...visibleProducts].sort((a, b) => {
      if (sort === 'name') {
        return getProductName(a).localeCompare(getProductName(b));
      }

      if (sort === 'discount') {
        return getSubscriptionDiscount(b) - getSubscriptionDiscount(a);
      }

      return getProductDate(b) - getProductDate(a);
    });
  }, [products, query, sort]);

  const bestDiscount = useMemo(() => {
    return products.reduce((highest, product) => {
      return Math.max(highest, getSubscriptionDiscount(product));
    }, 0);
  }, [products]);

  const hasProducts = products.length > 0;
  const hasFilteredProducts = filteredProducts.length > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <SectionHeader
            eyebrow="Recurring freshness"
            title="Subscribe & Save"
            subtitle="Build a weekly rhythm around fresh local staples, recurring customer subscriptions, and automatic savings on eligible products."
          />

          <Card className="bg-white/85 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              Subscription market
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-black tracking-tight text-farm-primaryDark">
                  {products.length}
                </p>
                <p className="mt-1 text-sm text-farm-muted">
                  Eligible products
                </p>
              </div>

              <div>
                <p className="text-3xl font-black tracking-tight text-farm-primaryDark">
                  {bestDiscount > 0 ? `${bestDiscount}%` : '—'}
                </p>
                <p className="mt-1 text-sm text-farm-muted">
                  Best available saving
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-farm-muted">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Subscription products will appear here once available.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button href="/shop">Shop all products</Button>

              <button
                type="button"
                onClick={loadProducts}
                disabled={refreshing}
                className="inline-flex items-center justify-center rounded-full border border-farm-border bg-white px-5 py-2.5 text-sm font-black text-farm-primaryDark shadow-sm transition hover:bg-farm-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </Card>
        </div>
      </section>

      {loading ? (
        <div className="mt-10">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="mt-10">
          <EmptyState
            title="Subscription products could not load"
            subtitle={error}
            action={
              <button
                type="button"
                onClick={loadProducts}
                className="inline-flex items-center justify-center rounded-full bg-farm-primary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90"
              >
                Try again
              </button>
            }
          />
        </div>
      ) : hasProducts ? (
        <>
          <section className="mt-8 rounded-[2rem] border border-farm-border bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-farm-primaryDark">
                  Subscription-ready products
                </h2>

                <p className="mt-1 text-sm leading-6 text-farm-muted">
                  Showing {filteredProducts.length} of {products.length}{' '}
                  products enabled for recurring freshness.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="subscription-search">
                  Search subscription products
                </label>

                <input
                  id="subscription-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, farms, categories…"
                  className="h-12 rounded-full border border-farm-border bg-farm-background px-5 text-sm font-medium text-farm-primaryDark outline-none transition placeholder:text-farm-muted focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 sm:w-80"
                />

                <label className="sr-only" htmlFor="subscription-sort">
                  Sort subscription products
                </label>

                <select
                  id="subscription-sort"
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as SortOption)
                  }
                  className="h-12 rounded-full border border-farm-border bg-farm-background px-5 text-sm font-black text-farm-primaryDark outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="featured">Featured first</option>
                  <option value="discount">Highest saving</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
          </section>

          <section className="mt-8">
            {hasFilteredProducts ? (
              <ProductGrid products={filteredProducts} />
            ) : (
              <EmptyState
                title="No matching subscription products"
                subtitle="Try searching by product name, farm, category, or description."
                action={
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="inline-flex items-center justify-center rounded-full bg-farm-primary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90"
                  >
                    Clear search
                  </button>
                }
              />
            )}
          </section>
        </>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="No subscription products yet"
            subtitle="Enable subscribe_save_enabled on products from admin to make recurring staples available here."
            action={<Button href="/shop">Shop available products</Button>}
          />
        </div>
      )}
    </main>
  );
}