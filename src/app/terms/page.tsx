import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Gavel,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from 'lucide-react';
import { Badge, Card, SectionHeader } from '@/components/ui';
import { APP_NAME } from '@/lib/config';

type TermSection = {
  title: string;
  copy: string;
  icon: LucideIcon;
};

const sections: TermSection[] = [
  {
    title: 'Fresh market use',
    icon: ShoppingBag,
    copy:
      'Customers agree to provide accurate contact, payment, pickup, and delivery details. Product availability may change based on harvest, season, weather, and stock.',
  },
  {
    title: 'Orders and conduct',
    icon: PackageCheck,
    copy:
      'False orders, fraud, abuse, or attempts to disrupt the marketplace may result in cancelled orders or restricted account access.',
  },
  {
    title: 'Farm and admin operations',
    icon: Store,
    copy:
      'Farmers and admins must use their approved roles responsibly. Protected actions remain governed by Supabase Auth, Row Level Security, and database-side rules.',
  },
  {
    title: 'Payments and fulfillment',
    icon: Truck,
    copy:
      'Orders, pickup, delivery, payment status, and fulfillment timing may depend on market operations, farmer availability, product stock, and delivery scheduling.',
  },
  {
    title: 'Account responsibility',
    icon: UserRound,
    copy:
      'Customers are responsible for keeping their account details secure and for using accurate information when placing orders, contacting support, or managing subscriptions.',
  },
  {
    title: 'Service changes',
    icon: FileText,
    copy:
      'The marketplace may update features, product listings, delivery options, farmer tools, or policy pages as the service grows and operational needs change.',
  },
];

const customerResponsibilities = [
  'Use accurate contact and delivery information',
  'Review order details before checkout',
  'Report order issues through support',
  'Respect farmer, admin, and customer systems',
  'Avoid false, abusive, or fraudulent activity',
] as const;

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <TermsHero />

        <div className="mt-8">
          <SectionHeader
            eyebrow="Policy"
            title="Terms of Service"
            subtitle={`These terms explain how customers, farmers, and admins should use ${APP_NAME} responsibly.`}
          />
        </div>

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <QuickCard
            icon={ShieldCheck}
            title="Secure platform"
            text="Account access and protected actions should remain controlled through Supabase Auth, RLS, and secure database rules."
          />

          <QuickCard
            icon={PackageCheck}
            title="Order accuracy"
            text="Customers should check contact, delivery, pickup, payment, and item details before placing an order."
          />

          <QuickCard
            icon={CheckCircle2}
            title="Fair use"
            text="The marketplace should be used respectfully by customers, farmers, support users, and admins."
          />
        </section>

        <Card className="mt-8 rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
          <div className="border-b border-[#D8E5D4] pb-6">
            <Badge tone="green">
              <Gavel className="h-3 w-3" />
              Terms guidance
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
              Using the marketplace responsibly
            </h2>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#5F6A62]">
              These terms are designed to protect customers, farmers, admins, support workflows, and marketplace operations while keeping the shopping experience fair and reliable.
            </p>
          </div>

          <div className="mt-8 grid gap-5">
            {sections.map((section, index) => (
              <TermStep key={section.title} section={section} index={index} />
            ))}
          </div>
        </Card>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
            <Badge tone="gold">
              <CheckCircle2 className="h-3 w-3" />
              Customer responsibilities
            </Badge>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
              What customers should do
            </h2>

            <ul className="mt-6 grid gap-3">
              {customerResponsibilities.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-black text-[#183B28]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2D6741] text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_24px_70px_rgba(24,59,40,0.16)] sm:p-8">
            <Badge tone="gold">
              <LockKeyhole className="h-3 w-3" />
              Protected access
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
              Admin and farmer tools must stay protected.
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/76">
              Admin dashboards, farmer tools, order management, payouts, coupons, product approval, support replies, and protected actions should only be available to approved users with the correct role and permissions.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-white"
              >
                Contact support
              </Link>

              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
              >
                Continue shopping
              </Link>
            </div>
          </Card>
        </section>

        <Card className="mt-8 rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
          <div className="rounded-[24px] border border-[#DFA75A]/35 bg-[#FFF3D9] p-5">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#8B5D18]">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#183B28]">
                  Important note
                </h2>

                <p className="mt-2 text-sm font-semibold leading-7 text-[#5F6A62]">
                  This Terms of Service page should be reviewed and adjusted to match the final business process, payment handling, delivery operations, farmer agreements, and legal requirements before public launch.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function TermsHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge tone="gold">
            <Gavel className="h-3 w-3" />
            Terms and marketplace rules
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Clear terms for using the fresh market.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            Understand account use, orders, marketplace conduct, farmer tools, admin access, and protected platform operations.
          </p>
        </div>

        <div className="rounded-3xl border border-white/12 bg-white/10 p-5 text-white backdrop-blur lg:max-w-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#DFA75A]">
            Policy status
          </p>

          <p className="mt-3 text-2xl font-black tracking-[-0.035em]">
            Fair-use marketplace
          </p>

          <p className="mt-3 text-sm font-semibold leading-6 text-white/74">
            These terms support safe shopping, responsible farm operations, and protected admin workflows.
          </p>
        </div>
      </div>
    </section>
  );
}

function QuickCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#183B28]">
        {title}
      </h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
        {text}
      </p>
    </Card>
  );
}

function TermStep({
  section,
  index,
}: {
  section: TermSection;
  index: number;
}) {
  const Icon = section.icon;

  return (
    <section className="rounded-[26px] border border-[#D8E5D4] bg-[#FFFEFC] p-5">
      <div className="flex gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#2D6741] px-3 py-1 text-xs font-black text-white">
              {index + 1}
            </span>

            <h3 className="text-xl font-black text-[#183B28]">
              {section.title}
            </h3>
          </div>

          <p className="mt-3 text-sm font-semibold leading-7 text-[#5F6A62]">
            {section.copy}
          </p>
        </div>
      </div>
    </section>
  );
}