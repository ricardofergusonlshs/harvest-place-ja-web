import { Suspense } from 'react';
import { Leaf, Loader2, PackageSearch, Search, ShoppingBasket, Sparkles } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { MarketplaceShopPage } from '@/components/marketplace/marketplace-ui';

export const dynamic = 'force-dynamic';

function ShopLoadingState() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-8 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-[1500px]">
        <Card className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_80px_rgba(24,59,40,0.10)] sm:p-8 lg:p-10">
          <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-[#EAF5E7] blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-90px] h-72 w-72 rounded-full bg-[#FFF3D9] blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge tone="green">
                  <ShoppingBasket className="h-3 w-3" />
                  Fresh marketplace
                </Badge>

                <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#183B28] sm:text-5xl">
                  Loading fresh local produce...
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62] sm:text-base">
                  We are preparing the shop, product filters, fresh deals, and available farm items.
                </p>
              </div>

              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#EAF5E7] text-[#2D6741]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_240px_180px]">
              <div className="flex h-13 min-h-[52px] items-center gap-3 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5">
                <Search className="h-4 w-4 text-[#2D6741]" />
                <div className="h-3 w-56 animate-pulse rounded-full bg-[#D8E5D4]" />
              </div>

              <div className="flex h-13 min-h-[52px] items-center gap-3 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5">
                <PackageSearch className="h-4 w-4 text-[#2D6741]" />
                <div className="h-3 w-28 animate-pulse rounded-full bg-[#D8E5D4]" />
              </div>

              <div className="flex h-13 min-h-[52px] items-center gap-3 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5">
                <Sparkles className="h-4 w-4 text-[#2D6741]" />
                <div className="h-3 w-20 animate-pulse rounded-full bg-[#D8E5D4]" />
              </div>
            </div>

            <div className="mt-8 flex gap-3 overflow-hidden">
              {['Vegetables', 'Fruits', 'Roots', 'Herbs', 'Weekly Box'].map((item) => (
                <div
                  key={item}
                  className="shrink-0 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-[#2D6741]" />
                    <span className="text-sm font-black text-[#5F6A62]">
                      {item}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white shadow-[0_18px_50px_rgba(24,59,40,0.07)]"
                >
                  <div className="h-48 animate-pulse bg-[#F4F9F2]" />

                  <div className="p-5">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-[#EAF5E7]" />
                    <div className="mt-4 h-5 w-40 animate-pulse rounded-full bg-[#D8E5D4]" />
                    <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[#F4F9F2]" />
                    <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-[#F4F9F2]" />

                    <div className="mt-5 flex items-center justify-between">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-[#EAF5E7]" />
                      <div className="h-11 w-24 animate-pulse rounded-full bg-[#2D6741]/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
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