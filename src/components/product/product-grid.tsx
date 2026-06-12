'use client';

import { useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { effectivePrice } from '@/lib/product';
import { Badge, Button, Card, EmptyState, cn } from '@/components/ui';
import type { Product } from '@/lib/types';

type SortOption = 'featured' | 'name' | 'price-low' | 'price-high';

function getProductSearchText(product: Product) {
  return [
    product.name,
    product.description,
    product.category,
    product.farm_name,
    product.farmer_name,
    product.parish,
    product.product_status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getProductPrice(product: Product) {
  return Number(effectivePrice(product) || 0);
}

export function ProductGrid({
  products,
  showFilters = true,
}: {
  products: Product[];
  showFilters?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortOption>('featured');

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter((item): item is string => Boolean(item))
      )
    ).sort();

    return ['All', ...uniqueCategories];
  }, [products]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const visibleProducts = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery || getProductSearchText(product).includes(normalizedQuery);

      const matchesCategory =
        category === 'All' || product.category === category;

      return matchesQuery && matchesCategory;
    });

    return [...visibleProducts].sort((a, b) => {
      if (sort === 'name') {
        return String(a.name || '').localeCompare(String(b.name || ''));
      }

      if (sort === 'price-low') {
        return getProductPrice(a) - getProductPrice(b);
      }

      if (sort === 'price-high') {
        return getProductPrice(b) - getProductPrice(a);
      }

      const aDealRank = Number(a.deal_rank || 999);
      const bDealRank = Number(b.deal_rank || 999);

      if (a.is_deal_of_day && !b.is_deal_of_day) return -1;
      if (!a.is_deal_of_day && b.is_deal_of_day) return 1;

      return aDealRank - bDealRank;
    });
  }, [products, query, category, sort]);

  const hasActiveFilters =
    Boolean(query.trim()) || category !== 'All' || sort !== 'featured';

  function clearFilters() {
    setQuery('');
    setCategory('All');
    setSort('featured');
  }

  return (
    <div>
      {showFilters ? (
        <Card className="mb-7 rounded-[30px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone="green">
                <Filter className="h-3 w-3" />
                Fresh filters
              </Badge>

              <h2 className="mt-3 text-xl font-black tracking-[-0.035em] text-[#183B28]">
                Browse fresh picks
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">
                Showing {filtered.length} of {products.length} product
                {products.length === 1 ? '' : 's'}.
              </p>
            </div>

            <div className="grid gap-3 lg:min-w-[620px] lg:grid-cols-[1fr_190px]">
              <label className="relative block">
                <span className="sr-only">Search products</span>

                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D6741]" />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search produce, farms, categories..."
                  className="h-12 w-full rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-4 pl-11 text-sm font-bold text-[#183B28] outline-none transition placeholder:text-[#5F6A62]/65 focus:border-[#2D6741] focus:bg-white focus:ring-4 focus:ring-[#2D6741]/10"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Sort products</span>

                <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D6741]" />

                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="h-12 w-full rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-4 pl-11 text-sm font-black text-[#183B28] outline-none transition focus:border-[#2D6741] focus:bg-white focus:ring-4 focus:ring-[#2D6741]/10"
                >
                  <option value="featured">Featured first</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price low-high</option>
                  <option value="price-high">Price high-low</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-black transition',
                  category === item
                    ? 'border-[#2D6741] bg-[#2D6741] text-white shadow-[0_12px_28px_rgba(45,103,65,0.22)]'
                    : 'border-[#D8E5D4] bg-[#F4F9F2] text-[#5F6A62] hover:border-[#2D6741]/40 hover:bg-white hover:text-[#183B28]'
                )}
              >
                {item}
              </button>
            ))}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-full border border-[#DFA75A]/35 bg-[#FFF3D9] px-4 py-2 text-sm font-black text-[#8B5D18] transition hover:bg-white"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No fresh picks found"
          subtitle="Try a different search or category. Fresh local products update as farms restock."
          action={
            hasActiveFilters ? (
              <Button onClick={clearFilters}>
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            ) : (
              <Button href="/shop">Back to shop</Button>
            )
          }
        />
      )}
    </div>
  );
}