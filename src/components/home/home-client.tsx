'use client';

import { Suspense } from 'react';
import {
  Leaf,
  Loader2,
  ShoppingBasket,
  Sparkles,
  Sprout,
  Truck,
} from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { MarketplaceHomePage } from '@/components/marketplace/marketplace-ui';

export function HomeClient() {
  return (
    <Suspense fallback={<MarketplaceHomeFallback />}>
      <MarketplaceHomePage />
    </Suspense>
  );
}

function MarketplaceHomeFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-8 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-[1500px]">
        <Card className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_80px_rgba(24,59,40,0.10)] sm:p-8 lg:p-10">
          <div className="absolute right-[-100px] top-[-120px] h-80 w-80 rounded-full bg-[#EAF5E7] blur-3xl" />
          <div className="absolute bottom-[-130px] left-[-110px] h-80 w-80 rounded-full bg-[#FFF3D9] blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-center">
            <div>
              <Badge tone="green">
                <Sprout className="h-3 w-3" />
                Fresh marketplace
              </Badge>

              <div className="mt-6 h-16 max-w-3xl animate-pulse rounded-3xl bg-[#F4F9F2] sm:h-20" />

              <div className="mt-5 h-5 max-w-xl animate-pulse rounded-full bg-[#EAF5E7]" />
              <div className="mt-3 h-5 max-w-lg animate-pulse rounded-full bg-[#F4F9F2]" />

              <div className="mt-8 flex flex-wrap gap-3">
                <SkeletonPill icon={<ShoppingBasket className="h-4 w-4" />} text="Fresh produce" />
                <SkeletonPill icon={<Truck className="h-4 w-4" />} text="Local delivery" />
                <SkeletonPill icon={<Sparkles className="h-4 w-4" />} text="Weekly deals" />
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {['Farm fresh', 'Ready soon', 'Subscriptions'].map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#2D6741]">
                      <Leaf className="h-4 w-4" />
                    </div>

                    <div className="mt-4 h-3 w-24 animate-pulse rounded-full bg-[#D8E5D4]" />
                    <div className="mt-3 h-3 w-16 animate-pulse rounded-full bg-[#EAF5E7]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#D8E5D4] bg-[#F4F9F2] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-28 animate-pulse rounded-full bg-white" />
                  <div className="mt-3 h-7 w-44 animate-pulse rounded-2xl bg-white" />
                </div>

                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white text-[#2D6741] shadow-[0_18px_50px_rgba(24,59,40,0.08)]">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
              </div>

              <div className="mt-6 h-48 animate-pulse rounded-[28px] bg-white" />

              <div className="mt-4 grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-3xl bg-white"
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white shadow-[0_18px_50px_rgba(24,59,40,0.07)]"
            >
              <div className="h-44 animate-pulse bg-[#F4F9F2]" />

              <div className="p-5">
                <div className="h-3 w-20 animate-pulse rounded-full bg-[#EAF5E7]" />
                <div className="mt-4 h-5 w-36 animate-pulse rounded-full bg-[#D8E5D4]" />
                <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[#F4F9F2]" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-[#F4F9F2]" />

                <div className="mt-5 flex items-center justify-between">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-[#EAF5E7]" />
                  <div className="h-10 w-24 animate-pulse rounded-full bg-[#2D6741]/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function SkeletonPill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5 py-3 text-sm font-black text-[#5F6A62]">
      <span className="text-[#2D6741]">{icon}</span>
      {text}
    </div>
  );
}