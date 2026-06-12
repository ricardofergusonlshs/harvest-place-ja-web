'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Card,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { ProductGrid } from '@/components/product/product-grid';
import { fetchProducts } from '@/lib/services';
import type { Product } from '@/lib/types';

const WEEKLY_IMAGE = '/elite/weekly-box-banner.png';
const HERO_FALLBACK = '/elite/hero-produce-box.png';

export default function WeeklyBoxPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const rows = await fetchProducts();
        if (!mounted) return;
        setProducts(rows);
      } catch {
        if (!mounted) return;
        setError('We could not load the weekly box products right now. Please refresh and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredProducts = useMemo(() => {
    return products.slice(0, 12);
  }, [products]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_48%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <WeeklyBoxHero />

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Plan
            title="Fresh Starter"
            price="From JMD $2,500"
            copy="A simple weekly box with greens, herbs, fruits, and everyday staples."
            href="/shop"
          />
          <Plan
            title="Family Market"
            price="From JMD $4,500"
            copy="A larger box designed for family meals, prep days, and shared cooking."
            href="/shop"
            featured
          />
          <Plan
            title="Vegan Pantry"
            price="From JMD $3,500"
            copy="Plant-based staples, roots, herbs, fruits, and seasonal farmer picks."
            href="/shop"
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_20px_60px_rgba(24,59,40,0.08)] sm:p-8">
            <Badge tone="green">How it works</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
              Build a box that fits your kitchen.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#5F6A62]">
              Choose your staples, add seasonal favorites, then checkout once. Your weekly box helps you keep fresh local produce ready without guessing what to buy.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Step number="1" title="Choose your box" text="Pick a plan or start from fresh products." />
              <Step number="2" title="Add favorites" text="Use My Box to collect the items you want." />
              <Step number="3" title="Checkout" text="Confirm your order and delivery details." />
            </div>
          </Card>

          <Card className="rounded-[28px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_20px_60px_rgba(24,59,40,0.12)] sm:p-8">
            <Badge tone="gold">Fresh benefits</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
              Why shoppers love weekly boxes.
            </h2>

            <div className="mt-6 grid gap-3">
              <Benefit title="Less planning" text="Your core produce is handled for the week." />
              <Benefit title="More local support" text="Every order helps support Jamaican farmers and suppliers." />
              <Benefit title="Flexible shopping" text="Add extra products whenever your kitchen needs more." />
            </div>
          </Card>
        </section>

        <section className="mt-10">
          <SectionHeader
            eyebrow="Box builder"
            title="Add fresh items to your weekly box"
            subtitle="Choose your favorite produce, add staples to My Box, then checkout when you are ready."
          />

          {error ? (
            <div className="mt-6 rounded-[24px] border border-[#DFA75A]/40 bg-[#FFF3D9] px-5 py-4 text-sm font-bold leading-6 text-[#8B5D18]">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            {loading ? (
              <LoadingState label="Loading fresh box items..." />
            ) : featuredProducts.length ? (
              <ProductGrid products={featuredProducts} />
            ) : (
              <Card className="rounded-[28px] border border-dashed border-[#D8E5D4] bg-white p-10 text-center">
                <Badge tone="green">Fresh start</Badge>
                <h3 className="mt-4 text-2xl font-black text-[#183B28]">
                  No weekly box items available yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#5F6A62]">
                  Products are being refreshed. Please check again soon or continue shopping all available produce.
                </p>
                <Link
                  href="/shop"
                  className="mt-6 inline-flex rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(45,103,65,0.24)] transition hover:bg-[#183B28]"
                >
                  Shop all produce
                </Link>
              </Card>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function WeeklyBoxHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] shadow-[0_30px_90px_rgba(24,59,40,0.22)]">
      <Image
        src={WEEKLY_IMAGE}
        alt="The Harvest Place Ja weekly farm box"
        fill
        priority
        className="object-cover object-center opacity-45"
        sizes="100vw"
        onError={(event) => {
          event.currentTarget.src = HERO_FALLBACK;
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,59,40,0.96)_0%,rgba(24,59,40,0.82)_44%,rgba(24,59,40,0.28)_100%)]" />

      <div className="relative z-10 grid min-h-[430px] items-center gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-10 lg:py-10">
        <div className="max-w-3xl">
          <Badge tone="gold">Weekly farm box</Badge>

          <h1 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Build your weekly farm box.
          </h1>

          <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/82">
            Fresh Jamaican produce, pantry staples, herbs, roots, fruits, and farmer picks packed into one simple weekly box.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="#box-items"
              className="rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] shadow-[0_14px_30px_rgba(255,243,217,0.18)] transition hover:bg-white"
            >
              Start building
            </Link>

            <Link
              href="/shop"
              className="rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
            >
              Shop produce
            </Link>
          </div>
        </div>

        <div className="hidden rounded-[28px] border border-white/14 bg-white/12 p-5 text-white shadow-2xl backdrop-blur-md lg:block">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#DFA75A]">
            Box includes
          </p>

          <div className="mt-4 grid gap-3">
            {['Vegetables', 'Roots', 'Herbs', 'Fruits', 'Farmer specials'].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/10 px-4 py-3"
              >
                <span className="text-sm font-black">{item}</span>
                <span className="rounded-full bg-[#FFF3D9] px-3 py-1 text-xs font-black text-[#183B28]">
                  Fresh
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Plan({
  title,
  price,
  copy,
  href,
  featured = false,
}: {
  title: string;
  price: string;
  copy: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[28px] border p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(24,59,40,0.12)] ${
        featured
          ? 'border-[#2D6741] bg-[#183B28] text-white'
          : 'border-[#D8E5D4] bg-white text-[#183B28]'
      }`}
    >
      <Badge tone={featured ? 'gold' : 'green'}>Weekly</Badge>

      <h3 className="mt-4 text-2xl font-black tracking-[-0.035em]">
        {title}
      </h3>

      <p className={`mt-2 text-lg font-black ${featured ? 'text-[#FFF3D9]' : 'text-[#2D6741]'}`}>
        {price}
      </p>

      <p className={`mt-3 text-sm font-semibold leading-6 ${featured ? 'text-white/78' : 'text-[#5F6A62]'}`}>
        {copy}
      </p>

      <Link
        href={href}
        className={`mt-5 inline-flex rounded-full px-5 py-3 text-sm font-black transition ${
          featured
            ? 'bg-[#FFF3D9] text-[#183B28] hover:bg-white'
            : 'bg-[#2D6741] text-white hover:bg-[#183B28]'
        }`}
      >
        Choose items
      </Link>
    </div>
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

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
      <h3 className="text-sm font-black text-white">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/72">{text}</p>
    </div>
  );
}