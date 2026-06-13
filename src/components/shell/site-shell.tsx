'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Leaf, Menu, Package, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';

const APP_NAME = 'The Harvest Place Ja';
const FACEBOOK_URL = 'https://www.facebook.com/theharvestplaceja';
const INSTAGRAM_URL = 'https://www.instagram.com/theharvestplaceja';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/my-box', label: 'My Box' },
  { href: '/orders', label: 'Orders' },
  { href: '/support', label: 'Support' },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function authHref(path: string, signedIn: boolean) {
  return signedIn ? path : `/auth?redirect=${encodeURIComponent(path)}`;
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const signedIn = Boolean(user);

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="min-h-screen bg-[#FAF8F0] pb-20 text-[#183B28] md:pb-0">
      <header className="sticky top-0 z-50 border-b border-[#D8E5D4] bg-[#FFFEFC]/96 shadow-[0_10px_30px_rgba(24,59,40,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${APP_NAME} home`}>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-[#D8E5D4] bg-white shadow-sm">
              <Image src="/logo.png" alt={APP_NAME} fill sizes="48px" className="object-cover" priority />
            </div>
            <div className="min-w-0">
              <p className="truncate font-serif text-xl font-black leading-tight tracking-[-0.035em] text-[#183B28] sm:text-2xl">
                The Harvest Place Ja
              </p>
              <p className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-[#DFA75A] sm:block">
                Fresh from our farm to your table
              </p>
            </div>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 xl:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const href = item.href === '/my-box' || item.href === '/orders' ? authHref(item.href, signedIn) : item.href;

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={href}
                  className={cx(
                    'rounded-full px-4 py-2 text-sm font-black whitespace-nowrap transition',
                    isActive(pathname, item.href)
                      ? 'bg-[#EAF5E7] text-[#183B28]'
                      : 'text-[#5F6A62] hover:bg-[#F4F9F2] hover:text-[#183B28]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Link
              href={authHref('/account', signedIn)}
              className={cx(
                'inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-black transition whitespace-nowrap',
                isActive(pathname, '/account')
                  ? 'border-[#2D6741]/20 bg-[#EAF5E7] text-[#183B28]'
                  : 'border-[#D8E5D4] bg-white text-[#183B28] hover:bg-[#F4F9F2]'
              )}
            >
              <UserRound className="h-4 w-4" />
              Account
            </Link>
            {signedIn ? (
              <button type="button" onClick={handleSignOut} className="h-11 rounded-full border border-[#D8E5D4] bg-white px-5 text-sm font-black text-[#183B28] transition hover:bg-[#F4F9F2] whitespace-nowrap">
                Sign out
              </button>
            ) : (
              <Link href="/auth" className="h-11 rounded-full border border-[#D8E5D4] bg-white px-5 py-2.5 text-sm font-black text-[#183B28] transition hover:bg-[#F4F9F2] whitespace-nowrap">
                Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="ml-auto grid h-11 w-11 place-items-center rounded-full border border-[#D8E5D4] bg-white text-[#183B28] md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-[#D8E5D4] bg-[#FFFEFC] px-4 py-4 shadow-[0_24px_70px_rgba(24,59,40,0.14)] md:hidden">
            <nav className="grid gap-2" aria-label="Mobile menu">
              {navItems.map((item) => {
                const href = item.href === '/my-box' || item.href === '/orders' ? authHref(item.href, signedIn) : item.href;

                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cx(
                      'rounded-2xl border px-4 py-3 text-sm font-black',
                      isActive(pathname, item.href)
                        ? 'border-[#2D6741]/20 bg-[#EAF5E7] text-[#183B28]'
                        : 'border-[#D8E5D4] bg-white text-[#5F6A62]'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link href={authHref('/account', signedIn)} onClick={() => setOpen(false)} className="rounded-2xl border border-[#D8E5D4] bg-white px-4 py-3 text-sm font-black text-[#5F6A62]">
                Account
              </Link>
              {signedIn ? (
                <button type="button" onClick={handleSignOut} className="rounded-2xl border border-[#D8E5D4] px-4 py-3 text-sm font-black text-[#183B28]">
                  Sign out
                </button>
              ) : (
                <Link href="/auth" onClick={() => setOpen(false)} className="rounded-2xl border border-[#D8E5D4] px-4 py-3 text-center text-sm font-black text-[#183B28]">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        ) : null}
      </header>

      <main id="main-content" className="w-full">
        {children}
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.5rem] border border-[#D8E5D4] bg-white/96 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <BottomItem href="/" active={isActive(pathname, '/')} icon={<Home className="h-5 w-5" />} label="Home" />
        <BottomItem href="/shop" active={isActive(pathname, '/shop')} icon={<Leaf className="h-5 w-5" />} label="Shop" />
        <BottomItem href={authHref('/my-box', signedIn)} active={isActive(pathname, '/my-box')} icon={<Package className="h-5 w-5" />} label="My Box" badge={count} />
        <BottomItem href={authHref('/orders', signedIn)} active={isActive(pathname, '/orders')} icon={<ShoppingBag className="h-5 w-5" />} label="Orders" />
        <BottomItem href={authHref('/account', signedIn)} active={isActive(pathname, '/account')} icon={<UserRound className="h-5 w-5" />} label="Account" />
      </nav>

      <MarketplaceFooter />
    </div>
  );
}

function BottomItem({ href, icon, label, active, badge }: { href: string; icon: ReactNode; label: string; active?: boolean; badge?: number }) {
  return (
    <Link href={href} className={cx('relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition', active ? 'bg-[#EAF5E7] text-[#183B28]' : 'text-[#5F6A62] hover:bg-[#F4F9F2]')}>
      <span className="relative text-[#2D6741]">
        {icon}
        {badge ? <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#DFA75A] px-1 text-[10px] font-black text-[#183B28]">{badge > 99 ? '99+' : badge}</span> : null}
      </span>
      {label}
    </Link>
  );
}

function MarketplaceFooter() {
  return (
    <footer className="bg-[#0E2C1E] text-white">
      <section className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white">
              <Image src="/logo.png" alt={APP_NAME} fill sizes="48px" className="object-cover" />
            </div>
            <div>
              <p className="font-serif text-2xl font-black leading-none">The Harvest Place Ja</p>
              <p className="mt-1 text-sm font-semibold text-white/68">Fresh from our farm to your table.</p>
            </div>
          </Link>
          <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-white/68">
            A clean Jamaican farm store for fresh produce, weekly boxes, safe requests, and Android app ordering.
          </p>

          <div className="mt-5 flex items-center gap-3" aria-label="Social media links">
            <SocialIconLink href={FACEBOOK_URL} label="Facebook">
              <FacebookMark />
            </SocialIconLink>
            <SocialIconLink href={INSTAGRAM_URL} label="Instagram">
              <InstagramMark />
            </SocialIconLink>
          </div>
        </div>

        <FooterGroup title="Shop" links={[["/shop", "This Week's Harvest"], ['/my-box', 'Harvest Boxes']]} />
        <FooterGroup title="Account" links={[["/orders", 'My Requests'], ['/account', 'Account'], ['/auth', 'Sign in']]} />
        <FooterGroup title="Support" links={[["/support", 'Help & Support'], ['/privacy', 'Privacy'], ['/terms', 'Terms']]} />
      </section>

      <div className="border-t border-white/10 py-4">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 text-xs font-semibold text-white/55 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} The Harvest Place Ja. All rights reserved.</p>
          <p>Premium farm store MVP • Jamaica</p>
        </div>
      </div>
    </footer>
  );
}


function SocialIconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/18"
    >
      {children}
    </a>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M14.2 8.4V6.9c0-.7.2-1.1 1.2-1.1h1.5V3.2C16.2 3.1 15.4 3 14.5 3c-2.4 0-4 1.5-4 4.2v1.2H8v3h2.5V21h3.1v-9.6h2.6l.4-3h-3.0Z" />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M7.8 2.8h8.4a5 5 0 0 1 5 5v8.4a5 5 0 0 1-5 5H7.8a5 5 0 0 1-5-5V7.8a5 5 0 0 1 5-5Zm0 3a2 2 0 0 0-2 2v8.4a2 2 0 0 0 2 2h8.4a2 2 0 0 0 2-2V7.8a2 2 0 0 0-2-2H7.8Zm4.2 3a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Zm0 2.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm4.7-3.2a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z" />
    </svg>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#DFA75A]">{title}</h3>
      <ul className="mt-4 grid gap-2 text-sm font-semibold text-white/70">
        {links.map(([href, label]) => (
          <li key={`${href}-${label}`}>
            <Link href={href} className="transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SiteShell;
