import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Leaf,
  MapPin,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sprout,
  Star,
  Store,
} from 'lucide-react';

type ProduceItem = {
  name: string;
  image: string;
  badge: 'Available Now' | 'Limited' | 'Seasonal' | 'Ready Soon';
  priceRange?: string;
  description: string;
};

type FarmProfile = {
  slug: string;
  farmName: string;
  farmerName?: string;
  parish: string;
  heroImage: string;
  story: string;
  tags: string[];
  produce: ProduceItem[];
};

type FarmTrustItem = {
  title: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
};

type FarmReel = {
  title: string;
  caption: string;
  image: string;
};

const farms: FarmProfile[] = [
  {
    slug: 'green-vale-farms',
    farmName: 'Green Vale Farms',
    farmerName: 'Harvest Partner Grower',
    parish: 'St. Catherine',
    heroImage:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
    story:
      'A family-run Jamaican farm sharing seasonal vegetables, roots, and herbs through safe platform requests. Customers can explore the farm first, then view only this farm’s current harvests below.',
    tags: ['Vegetables', 'Roots', 'Herbs', 'Seasonal'],
    produce: [
      {
        name: 'Fresh Callaloo',
        image:
          'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=900&q=80',
        badge: 'Available Now',
        priceRange: 'JMD $300–$450',
        description:
          'Fresh leafy callaloo harvested in small batches and updated by the farm.',
      },
      {
        name: 'Jamaican Sweet Potato',
        image:
          'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=900&q=80',
        badge: 'Seasonal',
        priceRange: 'JMD $450–$650',
        description:
          'Seasonal roots available when the farm confirms harvest readiness.',
      },
      {
        name: 'Fresh Scallion',
        image:
          'https://images.unsplash.com/photo-1602769515559-e15133a7e992?auto=format&fit=crop&w=900&q=80',
        badge: 'Limited',
        priceRange: 'JMD $250–$400',
        description:
          'Small-batch scallion bunches. Send a platform request to check availability.',
      },
    ],
  },
  {
    slug: 'sunland-organics',
    farmName: 'Sunland Organics',
    farmerName: 'Local Organic Grower',
    parish: 'Clarendon',
    heroImage:
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80',
    story:
      'Organic-focused growers sharing fresh vegetables and farm updates directly through The Harvest Place Ja. Produce appears inside this farm profile only.',
    tags: ['Organic', 'Vegetables', 'Herbs', 'Farm Stories'],
    produce: [
      {
        name: 'Mixed Peppers',
        image:
          'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=900&q=80',
        badge: 'Available Now',
        priceRange: 'JMD $400–$700',
        description:
          'Bright pepper mix listed by the farm when harvest is confirmed.',
      },
      {
        name: 'Fresh Herbs Bundle',
        image:
          'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80',
        badge: 'Ready Soon',
        description:
          'Farm herb bundle coming soon. Join alerts to be notified when ready.',
      },
    ],
  },
  {
    slug: 'blue-mountain-harvests',
    farmName: 'Blue Mountain Harvests',
    farmerName: 'Mountain Farm Partner',
    parish: 'St. Andrew',
    heroImage:
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80',
    story:
      'A mountain-side farm profile built for seasonal discovery, harvest alerts, and safe request-first ordering.',
    tags: ['Seasonal', 'Herbs', 'Roots', 'Fresh Alerts'],
    produce: [
      {
        name: 'Fresh Thyme Bundle',
        image:
          'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80',
        badge: 'Limited',
        priceRange: 'JMD $180–$300',
        description:
          'Small herb bundles available when the farm confirms fresh cutting.',
      },
      {
        name: 'Farm Greens',
        image:
          'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=900&q=80',
        badge: 'Ready Soon',
        description:
          'Greens are growing now. Follow the farm for harvest alerts.',
      },
    ],
  },
];

const fallbackFarm: FarmProfile = {
  slug: 'jamaican-farm',
  farmName: 'Jamaican Farm Profile',
  farmerName: 'Local Grower',
  parish: 'Jamaica',
  heroImage:
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80',
  story:
    'This farm profile is ready for verified farm details, reels, current harvests, and safe platform requests. Customers must view the farm before seeing its harvest list.',
  tags: ['Vegetables', 'Roots', 'Herbs', 'Seasonal'],
  produce: [
    {
      name: 'Current Harvest Item',
      image:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
      badge: 'Available Now',
      description:
        'Available produce for this farm will appear here once the farmer updates their profile.',
    },
    {
      name: 'Seasonal Produce Update',
      image:
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80',
      badge: 'Ready Soon',
      description:
        'Customers can follow this farm and receive safe harvest alerts inside the platform.',
    },
  ],
};

const farmTrustItems: FarmTrustItem[] = [
  {
    title: 'Safe platform requests',
    text: 'All produce requests, messages, and order discussions stay inside The Harvest Place Ja.',
    icon: ShieldCheck,
  },
  {
    title: 'Farm-managed harvests',
    text: 'Each farm controls and updates its own available produce. No mixed public product list is shown here.',
    icon: Sprout,
  },
  {
    title: 'Discovery first',
    text: 'Customers view the farm story first, then request specific items from that farm only.',
    icon: CheckCircle2,
  },
];

const farmReels: FarmReel[] = [
  {
    title: 'Farm story',
    caption: 'Meet the grower and learn what makes this farm unique.',
    image:
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Harvest update',
    caption: 'See what is fresh, limited, seasonal, or ready soon.',
    image:
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Safe request flow',
    caption: 'Request produce without phone numbers, WhatsApp, emails, or outside links.',
    image:
      'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=900&q=80',
  },
];

function readableFarmName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function badgeClasses(badge: ProduceItem['badge']) {
  if (badge === 'Available Now') return 'bg-[#EAF5E7] text-[#2D6741]';
  if (badge === 'Limited') return 'bg-[#FFF3D9] text-[#8B5D18]';
  if (badge === 'Seasonal') return 'bg-white text-[#183B28]';
  return 'bg-[#F2EEFF] text-[#6D5BD0]';
}

function makeRequestHref(farm: FarmProfile, item?: ProduceItem) {
  const params = new URLSearchParams();

  params.set('farm', farm.slug);

  if (item?.name) {
    params.set('item', item.name);
  }

  return `/account?${params.toString()}`;
}

export default async function FarmProfilePage({
  params,
}: {
  params: Promise<{ farmSlug: string }>;
}) {
  const { farmSlug } = await params;
  const matchedFarm = farms.find((farm) => farm.slug === farmSlug);
  const farm = matchedFarm || {
    ...fallbackFarm,
    slug: farmSlug,
    farmName: readableFarmName(farmSlug),
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#183B28]">
      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10">
        <FarmHero farm={farm} />
        <TrustStrip />
        <FarmStoryReels farm={farm} />
        <AvailableProduce farm={farm} />
        <RequestSafetyNotice />
      </section>
    </main>
  );
}

function FarmHero({ farm }: { farm: FarmProfile }) {
  return (
    <section className="overflow-hidden rounded-[36px] border border-[#D8E5D4] bg-white shadow-[0_28px_90px_rgba(24,59,40,0.12)]">
      <div className="relative min-h-[460px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${farm.heroImage})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,248,240,0.98)_0%,rgba(250,248,240,0.93)_42%,rgba(250,248,240,0.34)_100%)]" />

        <div className="relative z-10 max-w-4xl p-6 sm:p-8 lg:p-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-white/90 px-4 py-2 text-xs font-black text-[#2D6741] shadow-sm transition hover:bg-[#EAF5E7]"
          >
            ← Back to farm discovery
          </Link>

          <p className="mt-8 w-fit rounded-full bg-[#DFA75A] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#183B28]">
            Verified farm profile
          </p>

          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-[#183B28] sm:text-6xl lg:text-7xl">
            {farm.farmName}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-[#5F6A62]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm">
              <MapPin className="h-4 w-4 text-[#2D6741]" />
              {farm.parish}
            </span>

            {farm.farmerName ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm">
                <Leaf className="h-4 w-4 text-[#2D6741]" />
                {farm.farmerName}
              </span>
            ) : null}

            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm">
              <Store className="h-4 w-4 text-[#2D6741]" />
              Farm-first profile
            </span>
          </div>

          <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-[#455247]">
            {farm.story}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {farm.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#EAF5E7] px-4 py-2 text-xs font-black text-[#2D6741]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#available-produce"
              className="inline-flex items-center gap-2 rounded-full bg-[#2D6741] px-6 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(45,103,65,0.24)] transition hover:bg-[#183B28]"
            >
              View This Farm’s Produce
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              href={makeRequestHref(farm)}
              className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-6 py-3 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-[#F4F9F2]"
            >
              <MessageCircle className="h-4 w-4" />
              Message on Platform
            </Link>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-6 py-3 text-sm font-black text-[#8B5D18] shadow-sm transition hover:bg-[#F0D6A7]"
            >
              <Bell className="h-4 w-4" />
              Follow This Farm
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="mt-8 rounded-[30px] border border-[#D8E5D4] bg-white/95 p-5 shadow-[0_18px_55px_rgba(24,59,40,0.07)] sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        {farmTrustItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-[24px] border border-[#D8E5D4] bg-[#F4F9F2] p-5"
            >
              <Icon className="h-6 w-6 text-[#2D6741]" />
              <h2 className="mt-4 text-base font-black text-[#183B28]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
                {item.text}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FarmStoryReels({ farm }: { farm: FarmProfile }) {
  return (
    <section className="mt-10 rounded-[34px] border border-[#D8E5D4] bg-white p-5 shadow-[0_18px_55px_rgba(24,59,40,0.07)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">
            Farm stories
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.045em] text-[#183B28] sm:text-4xl">
            Watch updates from {farm.farmName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62]">
            Reels help customers learn the farm story before requesting produce. Add real video files later when the farm uploads them.
          </p>
        </div>

        <Link
          href={makeRequestHref(farm)}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-2 text-xs font-black text-[#2D6741] transition hover:bg-[#EAF5E7]"
        >
          Ask About Availability
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {farmReels.map((reel) => (
          <article
            key={reel.title}
            className="group relative min-h-[380px] overflow-hidden rounded-[30px] bg-[#183B28] shadow-[0_18px_50px_rgba(24,59,40,0.12)]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${reel.image})` }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#082618]/92 via-[#082618]/36 to-transparent" />
            <div className="absolute left-4 top-4 rounded-full border border-white/16 bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
              Reel preview
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-white/18 text-white backdrop-blur transition group-hover:scale-105">
                <PlayCircle className="h-8 w-8" />
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <h3 className="text-2xl font-black tracking-[-0.035em]">
                {reel.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/82">
                {reel.caption}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AvailableProduce({ farm }: { farm: FarmProfile }) {
  return (
    <section id="available-produce" className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">
            This farm’s harvest
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.045em] text-[#183B28] sm:text-4xl">
            Available produce from {farm.farmName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5F6A62]">
            These items belong to this farm profile only. Other farms’ produce is not mixed into this page.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {farm.produce.map((item) => (
          <ProduceCard key={item.name} farm={farm} item={item} />
        ))}
      </div>
    </section>
  );
}

function ProduceCard({ farm, item }: { farm: FarmProfile; item: ProduceItem }) {
  return (
    <article className="overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-white shadow-[0_16px_48px_rgba(24,59,40,0.07)] transition hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(24,59,40,0.12)]">
      <div className="relative h-52 bg-[#F4F9F2]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.image})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-black ${badgeClasses(item.badge)}`}
        >
          {item.badge}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-black tracking-[-0.03em] text-[#183B28]">
            {item.name}
          </h3>

          {item.priceRange ? (
            <span className="text-right text-xs font-black text-[#2D6741]">
              {item.priceRange}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#5F6A62]">
          {item.description}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link
            href={makeRequestHref(farm, item)}
            className="rounded-full bg-[#2D6741] px-4 py-3 text-center text-xs font-black text-white transition hover:bg-[#183B28]"
          >
            Request Item
          </Link>

          <button
            type="button"
            className="rounded-full border border-[#D8E5D4] bg-[#FFF3D9] px-4 py-3 text-xs font-black text-[#8B5D18] transition hover:bg-[#F0D6A7]"
          >
            Get Alert
          </button>
        </div>
      </div>
    </article>
  );
}

function RequestSafetyNotice() {
  return (
    <section className="mt-10 rounded-[30px] border border-[#F0D6A7] bg-[#FFF3D9] p-6 text-center shadow-[0_18px_55px_rgba(24,59,40,0.07)]">
      <Star className="mx-auto h-7 w-7 text-[#8B5D18]" />
      <h2 className="mt-3 text-2xl font-black text-[#183B28]">
        Keep requests inside the platform
      </h2>
      <p className="mx-auto mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5F6A62]">
        For safety, all produce requests, messages, and order discussions must stay inside The Harvest Place Ja.
      </p>

      <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
        <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#5F6A62]">
          No phone numbers
        </span>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#5F6A62]">
          No WhatsApp
        </span>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#5F6A62]">
          No email sharing
        </span>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#5F6A62]">
          No outside links
        </span>
      </div>
    </section>
  );
}
