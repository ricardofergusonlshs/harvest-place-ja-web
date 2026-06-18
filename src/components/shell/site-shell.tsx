'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import {
  House,
  Store,
  CalendarDays,
  ShoppingCart,
  ReceiptText,
  LifeBuoy,
  CircleUserRound,
  LogOut,
  Send,
} from 'lucide-react';

import LiveChatWidget from '@/components/chat/live-chat-widget';
import ReferralCapture from '@/components/referrals/referral-capture';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const navItems = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Shop', href: '/shop', icon: Store },
  { label: 'Plans', href: '/weekly-box', icon: CalendarDays },
  { label: 'My Box', href: '/my-box', icon: ShoppingCart },
  { label: 'Orders', href: '/orders', icon: ReceiptText },
  { label: 'Support', href: '/support', icon: LifeBuoy },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { count } = useCart();
  const [signingOut, setSigningOut] = useState(false);

  const userName = useMemo(() => getUserDisplayName(user), [user]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();

      if (typeof window !== 'undefined') {
        Object.keys(window.localStorage).forEach((key) => {
          if (key.startsWith('sb-')) window.localStorage.removeItem(key);
        });

        Object.keys(window.sessionStorage).forEach((key) => {
          if (key.startsWith('sb-')) window.sessionStorage.removeItem(key);
        });
      }

      router.refresh();
      router.push('/');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F0] text-[#183B28]">
      <header className="sticky top-0 z-40 border-b border-[#D8E5D4] bg-[#FFFEFC]/92 shadow-[0_10px_35px_rgba(24,59,40,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="The Harvest Place Ja"
              className="h-14 w-14 rounded-2xl object-contain shadow-sm"
            />

            <div className="min-w-0">
              <p className="truncate font-serif text-2xl font-black leading-tight text-[#183B28] sm:text-3xl">
                The Harvest Place Ja
              </p>
              <p className="mt-1 hidden text-[11px] font-black uppercase tracking-[0.32em] text-[#DFA75A] sm:block">
                Fresh from our farm to your table
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black transition',
                    active
                      ? 'bg-[#EAF5E7] text-[#183B28]'
                      : 'text-[#5F6A62] hover:bg-[#F4F9F2] hover:text-[#183B28]',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className={[
                'hidden items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:bg-[#F4F9F2] sm:inline-flex',
                isActive('/account') ? 'bg-[#EAF5E7] text-[#183B28]' : 'text-[#183B28]',
              ].join(' ')}
            >
              <CircleUserRound className="h-4 w-4" />
              {user ? userName : 'Account'}
            </Link>

            <CartAction count={count} active={isActive('/my-box')} />

            {!loading && user ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-4 py-3 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </span>
              </button>
            ) : null}

            {!loading && !user ? (
              <Link
                href="/auth?redirect=/account"
                className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-4 py-3 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-[#F4F9F2]"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="pb-20 lg:pb-0">{children}</main>

      <MobileBottomNav pathname={pathname} cartCount={count} />

      <Footer />

      <ReferralCapture />
      <LiveChatWidget />
    </div>
  );
}


function CartAction({ count, active }: { count: number; active: boolean }) {
  return (
    <Link
      href="/my-box"
      aria-label={`Cart${count > 0 ? `, ${count} item${count === 1 ? '' : 's'}` : ', empty'}`}
      className={[
        'relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D8E5D4] bg-white text-[#183B28] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F4F9F2]',
        active ? 'bg-[#EAF5E7]' : '',
      ].join(' ')}
    >
      <ShoppingCart className="h-5 w-5 text-[#2D6741]" />
      {count > 0 ? <CartBadge count={count} /> : null}
    </Link>
  );
}

function CartBadge({
  count,
  className = '',
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      className={[
        'absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#DFA75A] px-1 text-[10px] font-black leading-none text-[#183B28] shadow-sm ring-2 ring-white',
        className,
      ].join(' ')}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function MobileBottomNav({ pathname, cartCount }: { pathname: string; cartCount: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D8E5D4] bg-[#FFFEFC]/95 px-2 py-2 shadow-[0_-10px_35px_rgba(24,59,40,0.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[9px] font-black transition sm:text-[10px]',
                active ? 'bg-[#EAF5E7] text-[#183B28]' : 'text-[#5F6A62]',
              ].join(' ')}
            >
              <span className="relative">
                <Icon className="h-4 w-4" />
                {item.href === '/my-box' && cartCount > 0 ? (
                  <CartBadge count={cartCount} className="-right-2 -top-2 h-4 min-w-4 text-[9px]" />
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}



function Footer() {
  return (
    <footer className="border-t border-[#D8E5D4] bg-[#063F2A] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.75fr_0.75fr_1fr]">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="The Harvest Place Ja"
                className="h-14 w-14 rounded-2xl bg-white object-contain p-1 shadow-sm"
              />

              <div>
                <p className="font-serif text-2xl font-black leading-tight tracking-[-0.04em]">
                  The Harvest Place Ja
                </p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#DFA75A]">
                  Fresh • Local • Jamaican
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold leading-7 text-white/78">
              Fresh Jamaican produce, weekly boxes, pickup, and selected St. Elizabeth delivery.
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm font-semibold leading-6 text-white/76">
              <p className="font-black text-white">Location</p>
              <p className="mt-1">Meribah District / Malvern P.O., St. Elizabeth, Jamaica.</p>
              <p className="mt-2">
                Delivery: Santa Cruz, Junction, Black River, Malvern, Treasure Beach, and nearby areas.
              </p>
            </div>
          </section>

          <FooterColumn
            title="Shop"
            links={[
              ['Shop All', '/shop'],
              ['Weekly Plans', '/weekly-box'],
              ['My Box', '/my-box'],
              ['Orders', '/orders'],
            ]}
          />

          <FooterColumn
            title="Information"
            links={[
              ['Support', '/support'],
              ['Refer & Earn', '/refer-earn'],
              ['Ingredient Book', '/vegan-ingredient-book'],
              ['Privacy', '/privacy'],
              ['Terms', '/terms'],
              ['Refunds', '/refund'],
            ]}
          />

          <section className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">
              Stay fresh
            </p>

            <p className="mt-4 text-sm font-semibold leading-7 text-white/78">
              Get farm updates, new harvests, weekly box reminders, and delivery notices.
            </p>

            <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm font-semibold text-white/76">
              <p>
                Delivery fee: <span className="font-black text-[#FFF3D9]">JMD $1,000</span>
              </p>
              <p>
                Default schedule: <span className="font-black text-white">Friday at 4:00 PM</span>
              </p>
            </div>

            <form className="mt-4 flex overflow-hidden rounded-full border border-white/14 bg-white/10 p-1">
              <input
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-white outline-none placeholder:text-white/50"
              />
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-full bg-[#DFA75A] text-[#183B28] transition hover:bg-[#FFF3D9]"
                aria-label="Subscribe"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </section>
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs font-bold text-white/58 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 The Harvest Place Ja. All rights reserved.</p>
          <p>Premium farm store MVP • Jamaica 🇯🇲</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<[string, string]>;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#DFA75A]">
        {title}
      </p>

      <div className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <Link
            key={`${title}-${href}-${label}`}
            href={href}
            className="inline-flex text-sm font-black text-white/78 transition hover:translate-x-1 hover:text-white"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function getUserDisplayName(user: any) {
  if (!user) return 'Account';

  const metadata = user.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    metadata.username ||
    '';

  if (typeof fullName === 'string' && fullName.trim()) {
    return firstName(fullName);
  }

  if (typeof user.email === 'string' && user.email.trim()) {
    return firstName(user.email.split('@')[0]);
  }

  return 'Account';
}

function firstName(value: string) {
  const clean = value.replace(/[._-]+/g, ' ').trim();
  const first = clean.split(/\s+/)[0] || 'Account';

  return first.charAt(0).toUpperCase() + first.slice(1);
}

export const EliteShell = SiteShell;
export default SiteShell;


