'use client';
import LiveChatWidget from '@/components/chat/live-chat-widget';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Home,
  Leaf,
  ShoppingBag,
  Package,
  ClipboardList,
  Headphones,
  User,
  Send,
} from 'lucide-react';

import { APP_NAME } from '@/lib/config';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const LOGO_IMAGE = '/logo.png';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/shop', icon: ShoppingBag },
  { label: 'My Box', href: '/my-box', icon: Package },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
  { label: 'Support', href: '/support', icon: Headphones },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HeaderNav({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              'group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-all duration-300',
              active
                ? 'bg-[#EAF5E7] text-[#183B28] shadow-sm'
                : 'text-[#5F6A62] hover:bg-[#EAF5E7]/80 hover:text-[#183B28]'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5',
                active ? 'text-[#2D6741]' : 'text-[#5F6A62]'
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MarketplaceHeader({ pathname }: { pathname: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#D8E5D4]/80 bg-[#FFFDF7]/88 shadow-[0_18px_55px_rgba(24,59,40,0.08)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_14px_35px_rgba(24,59,40,0.14)] ring-1 ring-[#D8E5D4]">
            <Image
              src={LOGO_IMAGE}
              alt={`${APP_NAME} logo`}
              fill
              sizes="56px"
              className="object-contain p-1.5"
              priority
            />
          </span>

          <span className="min-w-0">
            <span className="block truncate font-serif text-2xl font-black leading-none tracking-[-0.04em] text-[#183B28] sm:text-3xl">
              {APP_NAME}
            </span>
            <span className="mt-1 hidden truncate text-[0.68rem] font-black uppercase tracking-[0.32em] text-[#DFA75A] sm:block">
              Fresh from our farm to your table
            </span>
          </span>
        </Link>

        <HeaderNav pathname={pathname} />

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/account"
            className="hidden items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#183B28] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2D6741]/35 hover:bg-[#EAF5E7] sm:inline-flex"
          >
            <User className="h-4 w-4" />
            Account
          </Link>

          <Link
            href="/my-box"
            aria-label="Open My Box"
            className="relative grid h-12 w-12 place-items-center rounded-full border border-[#D8E5D4] bg-white text-[#183B28] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2D6741]/35 hover:bg-[#EAF5E7]"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>

          <Link
            href="/auth"
            className="hidden rounded-full border border-[#D8E5D4] bg-white px-5 py-3 text-sm font-black text-[#183B28] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2D6741]/35 hover:bg-[#EAF5E7] sm:inline-flex"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D8E5D4] bg-[#FFFDF7]/95 px-2 py-2 shadow-[0_-18px_45px_rgba(24,59,40,0.12)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={`mobile-${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[0.68rem] font-black transition-all duration-300',
                active
                  ? 'bg-[#EAF5E7] text-[#2D6741]'
                  : 'text-[#5F6A62] hover:bg-[#EAF5E7]/70 hover:text-[#183B28]'
              )}
            >
              <Icon className="mb-1 h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MarketplaceFooter() {
  return (
    <footer className="mt-16 bg-[#0B3A25] text-white">
      <div className="mx-auto grid w-full max-w-[1500px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_1.1fr] lg:px-10">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="relative grid h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg">
              <Image
                src={LOGO_IMAGE}
                alt={`${APP_NAME} logo`}
                fill
                sizes="64px"
                className="object-contain p-1.5"
              />
            </span>
            <span>
              <span className="block font-serif text-2xl font-black tracking-[-0.03em]">
                {APP_NAME}
              </span>
              <span className="text-sm font-bold text-white/80">
                Fresh from our farm to your table.
              </span>
            </span>
          </Link>

          <p className="mt-6 max-w-sm text-sm font-semibold leading-7 text-white/78">
            A clean Jamaican farm store for fresh produce, weekly boxes, safe
            requests, and Android app ordering.
          </p>

          <div className="mt-6 flex gap-3">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/18 bg-white/10 transition hover:bg-white/18"
            >
             <span className="text-sm font-black">f</span>
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/18 bg-white/10 transition hover:bg-white/18"
            >
              <span className="text-xs font-black">IG</span>
            </a>
          </div>
        </div>

        <FooterGroup
          title="Shop"
          links={[
            ['Shop All', '/shop'],
            ["This Week's Harvest", '/#fresh-picks'],
            ['Harvest Boxes', '/weekly-box'],
          ]}
        />

        <FooterGroup
          title="Account"
          links={[
            ['My Requests', '/orders'],
            ['Orders', '/orders'],
            ['Account', '/account'],
            ['Sign in', '/auth'],
          ]}
        />

        <FooterGroup
          title="Support"
          links={[
            ['Help & Support', '/support'],
            ['Delivery & Pickup', '/support'],
            ['Privacy Policy', '/privacy'],
            ['Terms of Service', '/terms'],
          ]}
        />

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.32em] text-[#DFA75A]">
            Stay fresh with us
          </h3>
          <p className="mt-4 max-w-xs text-sm font-semibold leading-7 text-white/78">
            Get farm updates, new harvests, and exclusive deals.
          </p>

          <form className="mt-6 flex max-w-sm overflow-hidden rounded-full border border-white/25 bg-white/10 p-1">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-white placeholder:text-white/55 outline-none"
            />
            <button
              type="submit"
              aria-label="Join mailing list"
              className="grid h-11 w-11 place-items-center rounded-full bg-[#DFA75A] text-[#183B28] transition hover:bg-[#f0bd6f]"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 px-4 py-6 text-xs font-bold text-white/65 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>© 2026 The Harvest Place Ja. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            Premium farm store MVP • Jamaica{' '}
            <Leaf className="h-4 w-4 text-[#DFA75A]" />
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: Array<[string, string]>;
}) {
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-[0.32em] text-[#DFA75A]">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={`${title}-${href}-${label}`}>
            <Link
              href={href}
              className="text-sm font-bold text-white/78 transition hover:text-white"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';

  return (
    <div className="min-h-screen bg-[#FAF8F0] text-[#183B28]">
      <MarketplaceHeader pathname={pathname} />

      <main className="w-full pb-20 lg:pb-0">{children}</main>

      <LiveChatWidget />

      <MarketplaceFooter />
      <MobileBottomNav pathname={pathname} />
    </div>
  );
}

export const EliteShell = SiteShell;
export default SiteShell;