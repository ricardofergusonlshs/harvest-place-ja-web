import { Suspense } from 'react';
import { Leaf, Loader2, Search, ShoppingBasket } from 'lucide-react';
import { MarketplaceShopPage } from '@/components/marketplace/marketplace-ui';

export const dynamic = 'force-dynamic';

function ShopLoadingState() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-5 py-8 text-[#183B28] sm:px-8 lg:px-10">
      <section className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_80px_rgba(24,59,40,0.10)] sm:p-8 lg:p-10">
          <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-[#EAF5E7] blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-90px] h-72 w-72 rounded-full bg-[#FFF3D9] blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DFA75A] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#183B28]">
              <ShoppingBasket className="h-3 w-3" />
              This Week's Harvest
            </div>

            <h1 className="mt-4 max-w-2xl font-serif text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#183B28] sm:text-5xl">
              Loading fresh shop items...
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62] sm:text-base">
              We are preparing the latest produce from The Harvest Place Ja.
            </p>

            <div className="mt-8 flex h-13 min-h-[52px] items-center gap-3 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5">
              <Search className="h-4 w-4 text-[#2D6741]" />
              <div className="h-3 w-56 animate-pulse rounded-full bg-[#D8E5D4]" />
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
                  <div className="grid h-48 place-items-center animate-pulse bg-[#F4F9F2] text-[#2D6741]">
                    {index === 0 ? <Loader2 className="h-8 w-8 animate-spin" /> : <Leaf className="h-8 w-8 opacity-20" />}
                  </div>
                  <div className="p-5">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-[#EAF5E7]" />
                    <div className="mt-4 h-5 w-40 animate-pulse rounded-full bg-[#D8E5D4]" />
                    <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[#F4F9F2]" />
                    <div className="mt-5 h-11 w-28 animate-pulse rounded-full bg-[#2D6741]/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoadingState />}>
      <MarketplaceShopPage />
    </Suspense>
  );
}
