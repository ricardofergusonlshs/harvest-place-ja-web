import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2, ShoppingBasket, Sprout } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { HomeClient } from '@/components/home/home-client';
import { APP_NAME } from '@/lib/config';

function getSiteUrl() {
  const fallbackUrl = 'http://localhost:3000';
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configuredUrl || fallbackUrl);
  } catch {
    return new URL(fallbackUrl);
  }
}

const siteUrl = getSiteUrl();
const logoUrl = new URL('/logo.png', siteUrl).toString();

const pageTitle = `${APP_NAME} | Fresh Jamaican Farm Market`;

const pageDescription =
  'Shop fresh Jamaican produce, local farm staples, ready-soon harvests, subscriptions, and market goods from trusted farmers and vendors.';

export const metadata: Metadata = {
  metadataBase: siteUrl,

  title: {
    absolute: pageTitle,
  },

  description: pageDescription,

  alternates: {
    canonical: '/',
  },

  openGraph: {
    type: 'website',
    url: '/',
    siteName: APP_NAME,
    title: pageTitle,
    description:
      'Discover fresh produce, farm boxes, subscriptions, ready-soon harvests, and local Jamaican market goods.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 1200,
        alt: `${APP_NAME} logo`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description:
      'Fresh Jamaican produce, local staples, subscriptions, and upcoming harvest alerts.',
    images: ['/logo.png'],
  },

  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: APP_NAME,
  url: siteUrl.toString(),
  description:
    'A premium Jamaican farm marketplace for fresh produce, local staples, subscriptions, and upcoming harvest alerts.',
  publisher: {
    '@type': 'Organization',
    name: APP_NAME,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
    },
  },
};

function HomeLoadingState() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] px-4 py-8 text-[#1E2A21] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-[1500px]">
        <Card className="relative overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-white p-6 shadow-[0_24px_80px_rgba(24,59,40,0.10)] sm:p-8 lg:p-10">
          <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-[#EAF5E7] blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-90px] h-72 w-72 rounded-full bg-[#FFF3D9] blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <Badge tone="green">
                <Sprout className="h-3 w-3" />
                Fresh marketplace
              </Badge>

              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] text-[#183B28] sm:text-5xl lg:text-6xl">
                Loading fresh Jamaican farm goods...
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62] sm:text-base">
                Preparing the home page, fresh produce, weekly boxes, ready-soon
                harvests, and local market deals.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {['Fresh produce', 'Weekly boxes', 'Ready soon'].map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-5 py-3 text-sm font-black text-[#5F6A62]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#D8E5D4] bg-[#F4F9F2] p-6">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-[#2D6741] shadow-[0_18px_50px_rgba(24,59,40,0.08)]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>

              <div className="mt-6 grid gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-3xl bg-white p-4"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
                      <ShoppingBasket className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="h-4 w-3/4 animate-pulse rounded-full bg-[#D8E5D4]" />
                      <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-[#EAF5E7]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <Suspense fallback={<HomeLoadingState />}>
        <HomeClient />
      </Suspense>
    </>
  );
}