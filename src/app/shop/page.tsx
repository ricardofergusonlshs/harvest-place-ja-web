import { Suspense, type ReactNode } from 'react';
import {
  BadgeCheck,
  Leaf,
  Loader2,
  PackageCheck,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Truck,
} from 'lucide-react';

import { MarketplaceShopPage } from '@/components/marketplace/marketplace-ui';

export const dynamic = 'force-dynamic';

function ShopLoadingState() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(223,167,90,0.14),transparent_34%),linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-8 text-[#183B28] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white/95 p-6 shadow-[0_24px_80px_rgba(24,59,40,0.10)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-[#EAF5E7] blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-90px] h-72 w-72 rounded-full bg-[#FFF3D9] blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#9B681C] ring-1 ring-[#DFA75A]/35">
              <ShoppingBasket className="h-3.5 w-3.5" />
              This Week&apos;s Harvest
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <h1 className="max-w-3xl font-serif text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#183B28] sm:text-5xl lg:text-6xl">
                  Loading fresh shop items...
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62] sm:text-base">
                  We are preparing the latest produce, prices, stock, and farm-fresh picks from The Harvest Place Ja.
                </p>
              </div>

              <div className="grid gap-3 rounded-[26px] border border-[#D8E5D4] bg-[#F7FBF5] p-4 shadow-sm">
                <LoadingTrustLine icon={<BadgeCheck className="h-4 w-4" />} text="Checking live availability" />
                <LoadingTrustLine icon={<PackageCheck className="h-4 w-4" />} text="Preparing product cards" />
                <LoadingTrustLine icon={<Truck className="h-4 w-4" />} text="Pickup and delivery ready" />
              </div>
            </div>

            <div className="mt-8 grid gap-3 rounded-[28px] border border-[#D8E5D4] bg-white/90 p-3 shadow-[0_18px_55px_rgba(24,59,40,0.07)] lg:grid-cols-[1fr_220px_220px]">
              <div className="flex h-[52px] items-center gap-3 rounded-2xl bg-[#F4F9F2] px-5 ring-1 ring-[#D8E5D4]/70">
                <Search className="h-4 w-4 text-[#2D6741]" />
                <div className="h-3 w-56 max-w-full animate-pulse rounded-full bg-[#D8E5D4]" />
              </div>

              <div className="flex h-[52px] items-center gap-3 rounded-2xl bg-[#F4F9F2] px-5 ring-1 ring-[#D8E5D4]/70">
                <SlidersHorizontal className="h-4 w-4 text-[#2D6741]" />
                <div className="h-3 w-28 animate-pulse rounded-full bg-[#D8E5D4]" />
              </div>

              <div className="flex h-[52px] items-center gap-3 rounded-2xl bg-[#F4F9F2] px-5 ring-1 ring-[#D8E5D4]/70">
                <Sparkles className="h-4 w-4 text-[#DFA75A]" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-[#D8E5D4]" />
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductLoadingCard key={index} featured={index === 0} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadingTrustLine({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#183B28] shadow-sm">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

function ProductLoadingCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="relative grid h-52 place-items-center bg-[#F4F9F2] text-[#2D6741]">
        <div className="absolute left-4 top-4 h-6 w-24 animate-pulse rounded-full bg-white" />

        {featured ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <Leaf className="h-8 w-8 opacity-20" />
        )}
      </div>

      <div className="p-5">
        <div className="h-3 w-20 animate-pulse rounded-full bg-[#EAF5E7]" />
        <div className="mt-4 h-5 w-40 animate-pulse rounded-full bg-[#D8E5D4]" />
        <div className="mt-3 h-4 w-24 animate-pulse rounded-full bg-[#F4F9F2]" />
        <div className="mt-3 h-3 w-32 animate-pulse rounded-full bg-[#EAF5E7]" />

        <div className="mt-5 flex gap-3">
          <div className="h-11 flex-1 animate-pulse rounded-full bg-[#DFA75A]/35" />
          <div className="h-11 w-24 animate-pulse rounded-full bg-[#EAF5E7]" />
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoadingState />}>
      <MarketplaceShopPage />
    </Suspense>
  );
}
