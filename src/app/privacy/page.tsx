import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Database,
  FileText,
  LockKeyhole,
  Mail,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Badge, Card, SectionHeader } from '@/components/ui';
import { APP_NAME } from '@/lib/config';

type PolicySection = {
  title: string;
  copy: string;
  icon: LucideIcon;
};

const sections: PolicySection[] = [
  {
    title: 'Information used',
    icon: UserRound,
    copy: 'Account details, profile information, orders, favorites, support requests, reviews, subscriptions, and alerts may be used to process orders and improve the customer experience.',
  },
  {
    title: 'Orders and customer activity',
    icon: PackageCheck,
    copy: 'Order details such as selected products, fulfillment type, delivery or pickup information, payment method, notes, and order status are used to complete and track customer purchases.',
  },
  {
    title: 'Supabase security',
    icon: Database,
    copy: 'Authentication and database access are handled through Supabase. Sensitive protected data should remain behind Row Level Security policies and secure server-side rules.',
  },
  {
    title: 'Notifications',
    icon: Bell,
    copy: 'Order updates, ready-soon alerts, support replies, and account messages may be shown in-app or through browser notification permissions where supported.',
  },
  {
    title: 'Local storage and preferences',
    icon: LockKeyhole,
    copy: 'The web app may store simple preferences on the device, such as cart items, saved coupons, favorites, and display choices, to make the shopping experience faster.',
  },
  {
    title: 'Customer choices',
    icon: ShieldCheck,
    copy: 'Customers may sign out, manage browser permissions, clear local browser data, or contact support about account, order, or privacy-related questions.',
  },
];

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
        <PolicyHero />

        <div className="mt-8">
          <SectionHeader
            eyebrow="Policy"
            title="Privacy Policy"
            subtitle={`This page explains how ${APP_NAME} handles customer information, orders, account activity, notifications, and security.`}
          />
        </div>

        <Card className="mt-6 rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
          <div className="grid gap-5">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <section
                  key={section.title}
                  className="rounded-[24px] border border-[#D8E5D4] bg-[#FFFEFC] p-5"
                >
                  <div className="flex gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-black tracking-[-0.03em] text-[#183B28]">
                        {section.title}
                      </h2>

                      <p className="mt-2 text-sm font-semibold leading-7 text-[#5F6A62]">
                        {section.copy}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </Card>

        <Card className="mt-6 rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_24px_70px_rgba(24,59,40,0.14)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge tone="gold">
                <Mail className="h-3 w-3" />
                Contact
              </Badge>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
                Questions about your information?
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/76">
                Contact support if you need help with your account, orders, notifications, or privacy-related requests.
              </p>
            </div>

            <Link
              href="/support"
              className="inline-flex w-fit rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-white"
            >
              Contact support
            </Link>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs font-semibold leading-6 text-[#5F6A62]">
          This policy page should be reviewed and adjusted to match the final business process, data practices, and legal requirements before public launch.
        </p>
      </section>
    </main>
  );
}

function PolicyHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10">
        <Badge tone="gold">
          <FileText className="h-3 w-3" />
          Trust and transparency
        </Badge>

        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
          Privacy information for your farm market account.
        </h1>

        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
          Learn how customer information, order details, notifications, and app preferences are used to support a secure shopping experience.
        </p>
      </div>
    </section>
  );
}