'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';
import {
  Home,
  ShoppingBag,
  Package,
  ClipboardList,
  Headphones,
  User,
  LogOut,
  Send,
} from 'lucide-react';

import LiveChatWidget from '@/components/chat/live-chat-widget';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/shop', icon: ShoppingBag },
  { label: 'My Box', href: '/my-box', icon: Package },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
  { label: 'Support', href: '/support', icon: Headphones },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
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
              <User className="h-4 w-4" />
              {user ? userName : 'Account'}
            </Link>

            <Link
              href="/my-box"
              aria-label="My Box"
              className={[
                'inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D8E5D4] bg-white text-[#183B28] shadow-sm transition hover:bg-[#F4F9F2]',
                isActive('/my-box') ? 'bg-[#EAF5E7]' : '',
              ].join(' ')}
            >
              <Package className="h-5 w-5" />
            </Link>

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

      <MobileBottomNav pathname={pathname} />

      <Footer user={user} userName={userName} />

      <LiveChatWidget />
    </div>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D8E5D4] bg-[#FFFEFC]/95 px-2 py-2 shadow-[0_-10px_35px_rgba(24,59,40,0.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-black transition',
                active ? 'bg-[#EAF5E7] text-[#183B28]' : 'text-[#5F6A62]',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Footer({
  user,
  userName,
}: {
  user: unknown;
  userName: string;
}) {
  return (
    <footer className="border-t border-[#0F4A2F]/20 bg-[#073F2A] text-white">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="The Harvest Place Ja"
              className="h-14 w-14 rounded-2xl bg-white object-contain"
            />
            <div>
              <p className="font-serif text-2xl font-black">The Harvest Place Ja</p>
              <p className="text-sm font-black text-white/85">Fresh from our farm to your table.</p>
            </div>
          </div>

          <p className="mt-5 max-w-sm text-sm font-semibold leading-7 text-white/85">
            A clean Jamaican farm store for fresh produce, weekly boxes, safe requests, and Android app ordering.
          </p>

          <div className="mt-5 flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/35">
              <span className="text-sm font-black">f</span>
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/35">
              <span className="text-xs font-black">IG</span>
            </span>
          </div>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            ['Shop All', '/shop'],
            ["This Week's Harvest", '/shop'],
            ['Harvest Boxes', '/weekly-box'],
          ]}
        />

        <FooterColumn
          title="Account"
          links={[
            ['My Requests', '/account'],
            ['Orders', '/orders'],
            ['Account', '/account'],
            [user ? userName : 'Sign in', user ? '/account' : '/auth?redirect=/account'],
          ]}
        />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#DFA75A]">
            Stay fresh with us
          </p>
          <p className="mt-5 text-sm font-semibold leading-7 text-white/85">
            Get farm updates, new harvests, and exclusive deals.
          </p>

          <div className="mt-5 flex overflow-hidden rounded-full border border-white/20 bg-white/10 p-1">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-white outline-none placeholder:text-white/55"
            />
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-[#DFA75A] text-[#183B28]"
              aria-label="Subscribe"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-5 text-xs font-bold text-white/70 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 The Harvest Place Ja. All rights reserved.</p>
          <p>Premium farm store MVP • Jamaica 🌿</p>
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
    <div>
      <p className="text-xs font-black uppercase tracking-[0.32em] text-[#DFA75A]">
        {title}
      </p>

      <div className="mt-5 grid gap-3">
        {links.map(([label, href]) => (
          <Link
            key={`${title}-${href}-${label}`}
            href={href}
            className="text-sm font-black text-white transition hover:text-[#DFA75A]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
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
