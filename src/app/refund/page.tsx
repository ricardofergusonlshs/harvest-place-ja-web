import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  WalletCards,
} from 'lucide-react';
import { Badge, Card, SectionHeader } from '@/components/ui';

type PolicySection = {
  title: string;
  copy: string;
  icon: LucideIcon;
};

const policySections: PolicySection[] = [
  {
    title: 'Fresh produce',
    icon: ShoppingBag,
    copy:
      'Refunds, credits, or adjustments are reviewed based on order condition, fulfillment status, product freshness, delivery timing, and any documented support requests. Because produce is perishable, resolution eligibility may depend on how quickly the issue is reported.',
  },
  {
    title: 'Cancellations',
    icon: RotateCcw,
    copy:
      'Orders may be cancelled before fulfillment when supported by market operations. Once an order has been packed, dispatched, delivered, or picked up, cancellation requests may require support review and may not qualify for a full refund.',
  },
  {
    title: 'Support path',
    icon: HelpCircle,
    copy:
      'Customers should open a support ticket with the order number, product details, photos where relevant, a clear description of the issue, and the preferred resolution. This helps the support team review the case quickly and fairly.',
  },
];

const reviewFactors = [
  'Order status',
  'Product freshness',
  'Delivery or pickup timing',
  'Photos or supporting details',
  'Farmer or market fulfillment notes',
  'Previous support communication',
] as const;

const quickFacts = [
  {
    title: 'Best time to report',
    value: 'As soon as possible',
    text: 'Perishable items are easier to review when issues are reported quickly.',
    icon: Clock3,
  },
  {
    title: 'Helpful evidence',
    value: 'Photos + order details',
    text: 'Clear documentation helps support verify freshness, quantity, and condition.',
    icon: Camera,
  },
  {
    title: 'Possible outcomes',
    value: 'Refunds or credits',
    text: 'Approved resolutions may include refunds, store credit, replacement review, or adjustment.',
    icon: WalletCards,
  },
] as const;

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <PolicyHero />

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {quickFacts.map((fact) => {
            const Icon = fact.icon;

            return (
              <Card
                key={fact.title}
                className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#5F6A62]">
                  {fact.title}
                </p>

                <p className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
                  {fact.value}
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
                  {fact.text}
                </p>
              </Card>
            );
          })}
        </section>

        <Card className="mt-8 rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
          <div className="border-b border-[#D8E5D4] pb-6">
            <Badge tone="green">
              <FileText className="h-3 w-3" />
              Refund guidance
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#183B28]">
              How refund reviews work
            </h2>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#5F6A62]">
              We aim to make every review fair to both customers and local producers. Since fresh food quality can be affected by harvest, packing, delivery, storage, and timing, each request is evaluated using the details available for that specific order.
            </p>
          </div>

          <div className="mt-8 grid gap-5">
            {policySections.map((section, index) => (
              <PolicyStep
                key={section.title}
                section={section}
                index={index}
              />
            ))}
          </div>
        </Card>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
            <Badge tone="gold">
              <CheckCircle2 className="h-3 w-3" />
              Review factors
            </Badge>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
              What support may consider
            </h2>

            <ul className="mt-6 grid gap-3">
              {reviewFactors.map((factor) => (
                <li
                  key={factor}
                  className="flex items-center gap-3 rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-black text-[#183B28]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2D6741] text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {factor}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_24px_70px_rgba(24,59,40,0.16)] sm:p-8">
            <Badge tone="gold">
              <ShieldCheck className="h-3 w-3" />
              Need help?
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
              Open a support request
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/76">
              Include your order number, the affected item, what happened, and any photos that show the issue. The more complete the request, the faster the team can review it.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-white"
              >
                Contact support
              </Link>

              <Link
                href="/orders"
                className="inline-flex items-center justify-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
              >
                View orders
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
                  This policy is intended to explain how refund and cancellation requests are reviewed. Final resolution may depend on marketplace operations, farmer fulfillment status, payment processor rules, and the specific facts of the order.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function PolicyHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <SectionHeader
          eyebrow="Policy"
          title="Refund Policy"
          subtitle="Clear, fair, and produce-aware refund guidance for marketplace orders, cancellations, and support reviews."
        />

        <div className="rounded-3xl border border-white/12 bg-white/10 p-5 text-white backdrop-blur lg:max-w-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#DFA75A]">
            Policy status
          </p>

          <p className="mt-3 text-2xl font-black tracking-[-0.035em]">
            Customer-first review
          </p>

          <p className="mt-3 text-sm font-semibold leading-6 text-white/74">
            Every request is reviewed with care, using order records and customer-provided details to reach the fairest available outcome.
          </p>
        </div>
      </div>
    </section>
  );
}

function PolicyStep({
  section,
  index,
}: {
  section: PolicySection;
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