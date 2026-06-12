'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Headphones,
  Home,
  Languages,
  Leaf,
  MapPin,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Store,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';

const APP_NAME = 'The Harvest Place Ja';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/weekly-box', label: 'Weekly Boxes' },
  { href: '/ready-soon', label: 'Ready Soon' },
  { href: '/orders', label: 'Orders' },
  { href: '/account', label: 'Account' },
] as const;

const CATEGORY_LINKS = [
  { href: '/shop', label: 'All Categories', icon: Menu },
  { href: '/shop?category=Vegetables', label: 'Vegetables', icon: Leaf },
  { href: '/shop?category=Herbs', label: 'Herbs', icon: Sprout },
  { href: '/shop?category=Roots', label: 'Roots', icon: Package },
  { href: '/weekly-box', label: 'Weekly Boxes', icon: ShoppingBag },
  { href: '/ready-soon', label: 'Ready Soon', icon: Bell },
  { href: '/shop?category=Farmer%20Specials', label: 'Farmer Specials', icon: Store },
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';

  const base = href.split('?')[0];

  return pathname === base || pathname.startsWith(`${base}/`);
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const pathname = usePathname();
  const router = useRouter();

  const { count } = useCart();
  const { user, isAdmin, farmerProfile, signOut } = useAuth();

  const navItems = useMemo(() => {
    const items: Array<{ href: string; label: string }> = [...NAV_ITEMS];

    if (isAdmin) {
      items.push({ href: '/admin', label: 'Admin' });
    }

    items.push(
      farmerProfile
        ? { href: '/farmer', label: 'Farmer Hub' }
        : { href: '/farmer', label: 'Sell with us' }
    );

    return items;
  }, [farmerProfile, isAdmin]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const handleSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const query = search.trim();

      router.push(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
      setOpen(false);
    },
    [router, search]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.toLowerCase().includes('supabase')) {
            localStorage.removeItem(key);
          }
        });

        sessionStorage.clear();
      } catch {
        // Storage may be blocked in some browser contexts.
      }

      window.location.href = '/';
    }
  }, [signOut]);

  return (
    <div className="min-h-screen bg-[#F4F9F2] pb-24 text-[#1E2A21] md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#183B28] focus:px-5 focus:py-3 focus:text-sm focus:font-black focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-[#D8E5D4] bg-white/92 shadow-[0_14px_45px_rgba(24,59,40,0.08)] backdrop-blur-xl">
        <TopUtilityBar />

        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-controls="mobile-menu"
            aria-expanded={open}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#D8E5D4] bg-white text-[#2D6741] shadow-sm transition hover:bg-[#EAF5E7] md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <BrandLogo />

          <form
            onSubmit={handleSearch}
            role="search"
            className="hidden min-w-0 flex-1 items-center overflow-hidden rounded-full border border-[#D8E5D4] bg-white shadow-[0_12px_30px_rgba(24,59,40,0.06)] transition focus-within:border-[#2D6741]/50 focus-within:ring-4 focus-within:ring-[#2D6741]/10 lg:flex"
          >
            <Link
              href="/shop"
              className="hidden h-12 items-center gap-2 border-r border-[#D8E5D4] bg-[#FFFDF7] px-4 text-xs font-black text-[#183B28] transition hover:bg-[#F4F9F2] xl:inline-flex"
            >
              All Categories
              <ChevronDown className="h-4 w-4" />
            </Link>

            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <Search className="h-5 w-5 shrink-0 text-[#2D6741]" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search products"
                placeholder="Search fresh produce, herbs, boxes, farms..."
                className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#183B28] outline-none placeholder:text-[#5F6A62]/70"
              />
            </div>

            <button
              type="submit"
              className="m-1 inline-flex h-10 items-center justify-center rounded-full bg-[#183B28] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(24,59,40,0.24)] transition hover:bg-[#2D6741]"
            >
              Search
            </button>
          </form>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <HeaderAction
              href={user ? '/account' : '/auth'}
              label={user ? 'Account' : 'Sign in'}
              subLabel={user ? 'My Account' : 'Hello, sign in'}
              icon={<UserRound className="h-5 w-5" />}
            />

            <HeaderAction
              href="/orders"
              label="Orders"
              subLabel="Track & reorder"
              icon={<Truck className="h-5 w-5" />}
            />

            <CartAction count={count} />

            {user ? (
              <SignButton onClick={handleSignOut}>Sign out</SignButton>
            ) : (
              <SignButton href="/auth">Sign in</SignButton>
            )}
          </div>

          <Link
            href="/my-box"
            aria-label={`My Box${count ? `, ${count} items` : ''}`}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-[#D8E5D4] bg-white text-[#2D6741] shadow-sm transition hover:bg-[#EAF5E7] md:hidden"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 ? <CartBadge count={count} /> : null}
          </Link>
        </div>

        <div className="hidden border-t border-[#D8E5D4] bg-white/90 lg:block">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-6 py-2 lg:px-10">
            <nav className="flex items-center gap-1" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={isActive(pathname, item.href)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-5 text-xs font-black text-[#5F6A62]">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 transition hover:text-[#183B28]"
              >
                <Headphones className="h-4 w-4 text-[#2D6741]" />
                Help & Support
              </Link>

              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#2D6741]" />
                Deliver to: Kingston, Jamaica
              </span>
            </div>
          </div>
        </div>

        <div className="hidden border-t border-[#D8E5D4] bg-[#183B28] lg:block">
          <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-6 py-2 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORY_LINKS.map(({ href, label, icon: Icon }, index) => (
              <Link
                key={label}
                href={href}
                className={cx(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-white/88 transition hover:bg-white/10 hover:text-white',
                  index === 0 &&
                    'mr-1 bg-white text-[#183B28] hover:bg-[#FFF3D9] hover:text-[#183B28]'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {open ? (
          <MobileMenu
            id="mobile-menu"
            search={search}
            setSearch={setSearch}
            handleSearch={handleSearch}
            pathname={pathname}
            navItems={navItems}
            count={count}
            user={Boolean(user)}
            signOut={handleSignOut}
          />
        ) : null}
      </header>

      <main id="main-content" className="w-full">
        {children}
      </main>

      <MobileBottomNav count={count} pathname={pathname} />
      <MarketplaceFooter />
    </div>
  );
}

function TopUtilityBar() {
  return (
    <div className="hidden bg-[#183B28] text-white md:block">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-2 text-[11px] font-bold tracking-wide lg:px-10">
        <div className="flex items-center gap-8 text-white/88">
          <span className="inline-flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-[#DFA75A]" />
            Proudly Jamaican. 100% farm fresh.
          </span>

          <span className="inline-flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-[#DFA75A]" />
            Fresh from local farms
          </span>

          <span className="inline-flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-[#DFA75A]" />
            Delivering islandwide
          </span>
        </div>

        <div className="flex items-center gap-6 text-white/82">
          <Link href="/orders" className="inline-flex items-center gap-2 hover:text-white">
            <Truck className="h-3.5 w-3.5" />
            Track Order
          </Link>

          <Link href="/support" className="inline-flex items-center gap-2 hover:text-white">
            <Headphones className="h-3.5 w-3.5" />
            Help & Support
          </Link>

          <span className="inline-flex items-center gap-2">
            <Languages className="h-3.5 w-3.5" />
            EN / JA
          </span>
        </div>
      </div>
    </div>
  );
}

function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-3"
      aria-label={`${APP_NAME} home`}
    >
      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[#D8E5D4] bg-white shadow-sm ring-4 ring-white transition group-hover:scale-105 md:h-14 md:w-14">
        <Image
          src="/logo.png"
          alt={APP_NAME}
          fill
          className="object-cover"
          sizes="56px"
          priority
        />
      </div>

      <div className="hidden sm:block">
        <p
          className={cx(
            'text-lg font-black leading-tight tracking-tight md:text-xl',
            light ? 'text-white' : 'text-[#183B28]'
          )}
        >
          {APP_NAME}
        </p>

        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#DFA75A]">
          Elite Farm Market
        </p>
      </div>
    </Link>
  );
}

function HeaderAction({
  href,
  label,
  subLabel,
  icon,
}: {
  href: string;
  label: string;
  subLabel: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex h-12 items-center gap-3 rounded-full border border-transparent px-3 text-[#183B28] transition hover:border-[#D8E5D4] hover:bg-[#F4F9F2]"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full border border-[#D8E5D4] bg-white text-[#2D6741] shadow-sm transition group-hover:bg-[#EAF5E7]">
        {icon}
      </span>

      <span className="hidden xl:block">
        <span className="block text-[11px] font-bold leading-none text-[#5F6A62]">
          {subLabel}
        </span>

        <span className="mt-1 block text-sm font-black leading-none">
          {label}
        </span>
      </span>
    </Link>
  );
}

function CartAction({ count }: { count: number }) {
  return (
    <Link
      href="/my-box"
      className="relative inline-flex h-12 items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-4 text-sm font-black text-[#183B28] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#EAF5E7]"
    >
      <ShoppingBag className="h-5 w-5 text-[#2D6741]" />
      My Box
      {count > 0 ? <CartBadge count={count} /> : null}
    </Link>
  );
}

function CartBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#DFA75A] px-1 text-[10px] font-black text-[#183B28] shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SignButton({
  href,
  onClick,
  children,
}: {
  href?: string;
  onClick?: () => void | Promise<void>;
  children: ReactNode;
}) {
  const className =
    'inline-flex h-12 items-center justify-center rounded-full border border-[#D8E5D4] bg-[#FFF3D9] px-5 text-sm font-black text-[#183B28] shadow-sm transition hover:-translate-y-0.5 hover:border-[#DFA75A] hover:bg-white';

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        'relative rounded-full px-4 py-2 text-sm font-black transition',
        active
          ? 'bg-[#EAF5E7] text-[#183B28]'
          : 'text-[#5F6A62] hover:bg-[#F4F9F2] hover:text-[#183B28]',
        active &&
          'after:absolute after:inset-x-5 after:-bottom-2.5 after:h-1 after:rounded-full after:bg-[#2D6741]'
      )}
    >
      {children}
    </Link>
  );
}

function MobileMenu({
  id,
  search,
  setSearch,
  handleSearch,
  pathname,
  navItems,
  count,
  user,
  signOut,
}: {
  id: string;
  search: string;
  setSearch: (value: string) => void;
  handleSearch: (event: FormEvent<HTMLFormElement>) => void;
  pathname: string;
  navItems: Array<{ href: string; label: string }>;
  count: number;
  user: boolean;
  signOut: () => void | Promise<void>;
}) {
  return (
    <div
      id={id}
      className="fixed inset-x-0 top-[73px] z-50 max-h-[calc(100vh-73px)] overflow-y-auto border-t border-[#D8E5D4] bg-white/98 px-4 pb-8 pt-4 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl md:hidden"
    >
      <form
        onSubmit={handleSearch}
        className="mb-4 flex items-center rounded-full border border-[#D8E5D4] bg-[#F4F9F2] p-1"
        role="search"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
          <Search className="h-4 w-4 shrink-0 text-[#2D6741]" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products"
            placeholder="Search the market..."
            className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-[#183B28] outline-none placeholder:text-[#5F6A62]"
          />
        </div>

        <button
          type="submit"
          className="rounded-full bg-[#183B28] px-4 py-2.5 text-xs font-black text-white"
        >
          Go
        </button>
      </form>

      <div className="grid gap-2">
        {navItems.map((item) => (
          <MobileDrawerLink
            key={item.href}
            href={item.href}
            active={isActive(pathname, item.href)}
            icon={<Leaf className="h-4 w-4" />}
          >
            {item.label}
          </MobileDrawerLink>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <QuickAction href="/orders" icon={<Truck className="h-4 w-4" />}>
          Orders
        </QuickAction>

        <QuickAction href="/support" icon={<Headphones className="h-4 w-4" />}>
          Support
        </QuickAction>

        <QuickAction href="/ready-soon" icon={<Bell className="h-4 w-4" />}>
          Ready Soon
        </QuickAction>

        <QuickAction href="/trust-center" icon={<ShieldCheck className="h-4 w-4" />}>
          Trust
        </QuickAction>
      </div>

      <div className="mt-5 grid gap-2">
        <Link
          href="/my-box"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2D6741] px-5 py-3 text-sm font-black text-white"
        >
          <ShoppingBag className="h-4 w-4" />
          My Box ({count})
        </Link>

        {user ? (
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-[#D8E5D4] px-5 py-3 text-sm font-black text-[#183B28]"
          >
            Sign out
          </button>
        ) : (
          <Link
            href="/auth"
            className="rounded-full border border-[#D8E5D4] px-5 py-3 text-center text-sm font-black text-[#183B28]"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}

function MobileDrawerLink({
  href,
  children,
  active,
  icon,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-black transition',
        active
          ? 'border-[#2D6741]/20 bg-[#EAF5E7] text-[#183B28]'
          : 'border-[#D8E5D4] bg-white text-[#5F6A62] hover:bg-[#F4F9F2]'
      )}
    >
      <span className="inline-flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
          {icon}
        </span>
        {children}
      </span>

      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-2xl border border-[#D8E5D4] bg-white px-3 py-3 text-xs font-black text-[#183B28] shadow-sm"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </span>
      {children}
    </Link>
  );
}

function MobileBottomNav({
  count,
  pathname,
}: {
  count: number;
  pathname: string;
}) {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.5rem] border border-[#D8E5D4] bg-white/96 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <MobileNavItem
        href="/"
        icon={<Home className="h-5 w-5" />}
        label="Home"
        active={isActive(pathname, '/')}
      />

      <MobileNavItem
        href="/shop"
        icon={<Sprout className="h-5 w-5" />}
        label="Shop"
        active={isActive(pathname, '/shop')}
      />

      <MobileNavItem
        href="/my-box"
        icon={<ShoppingBag className="h-5 w-5" />}
        label={count ? `Box ${count}` : 'Box'}
        active={isActive(pathname, '/my-box')}
        badge={count}
      />

      <MobileNavItem
        href="/orders"
        icon={<Truck className="h-5 w-5" />}
        label="Orders"
        active={isActive(pathname, '/orders')}
      />

      <MobileNavItem
        href="/account"
        icon={<UserRound className="h-5 w-5" />}
        label="Account"
        active={isActive(pathname, '/account')}
      />
    </nav>
  );
}

function MobileNavItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cx(
        'relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition',
        active
          ? 'bg-[#EAF5E7] text-[#183B28]'
          : 'text-[#5F6A62] hover:bg-[#F4F9F2]'
      )}
    >
      <span className="relative text-[#2D6741]">
        {icon}
        {badge ? <CartBadge count={badge} /> : null}
      </span>

      {label}
    </Link>
  );
}

function MarketplaceFooter() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function submitNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = email.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (!valid) {
      setMessage('Enter a valid email address.');
      return;
    }

    try {
      const list = JSON.parse(localStorage.getItem('hpj_newsletter') || '[]') as string[];
      localStorage.setItem(
        'hpj_newsletter',
        JSON.stringify(Array.from(new Set([...list, value])))
      );
    } catch {
      // Ignore local storage issues.
    }

    setEmail('');
    setMessage('You’re subscribed to fresh market updates.');
  }

  return (
    <footer className="bg-[#183B28] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_420px_1fr] lg:items-center lg:px-10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#2D6741]">
              <Leaf className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-black">Stay Fresh. Stay Informed.</p>
              <p className="text-xs font-semibold text-white/62">
                Get exclusive offers, new arrivals, and farm updates.
              </p>
            </div>
          </div>

          <form
            onSubmit={submitNewsletter}
            className="flex rounded-full border border-white/15 bg-white/8 p-1"
          >
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email address"
              placeholder="Enter your email address"
              className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-white outline-none placeholder:text-white/45"
            />

            <button
              type="submit"
              className="rounded-full bg-[#DFA75A] px-5 text-sm font-black text-[#183B28]"
            >
              Subscribe
            </button>
          </form>

          <div className="flex items-center justify-start gap-3 lg:justify-end">
            <span className="text-xs font-black text-white/68">Need help?</span>

            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
            >
              <Headphones className="h-4 w-4" />
              Support
            </Link>
          </div>

          {message ? (
            <p className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white lg:col-span-3">
              {message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.2fr_repeat(4,1fr)] lg:px-10">
        <div>
          <BrandLogo light />

          <p className="mt-4 max-w-xs text-sm font-semibold leading-6 text-white/68">
            Premium Jamaican produce from trusted farms to your table.
          </p>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            ['/shop', 'All Products'],
            ['/weekly-box', 'Weekly Boxes'],
            ['/shop?sort=newest', 'New Arrivals'],
            ['/shop?tag=deals', 'Deals & Specials'],
          ]}
        />

        <FooterColumn
          title="Customer Care"
          links={[
            ['/orders', 'Track Order'],
            ['/trust-center', 'Delivery Info'],
            ['/refund', 'Returns & Refunds'],
            ['/support', 'Support'],
          ]}
        />

        <FooterColumn
          title="Company"
          links={[
            ['/farmer', 'Our Farmers'],
            ['/trust-center', 'Trust Center'],
            ['/vegan-ingredient-book', 'Vegan Ingredient Book'],
          ]}
        />

        <FooterColumn
          title="Account"
          links={[
            ['/account', 'My Account'],
            ['/orders', 'My Orders'],
            ['/my-box', 'My Box'],
          ]}
        />
      </section>

      <div className="border-t border-white/10 py-4">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 text-xs font-semibold text-white/55 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} The Harvest Place Ja. All rights reserved.</p>

          <div className="flex gap-5">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/trust-center">Security</Link>
          </div>
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
      <h3 className="text-sm font-black text-white">{title}</h3>

      <ul className="mt-3 space-y-2 text-sm font-semibold text-white/62">
        {links.map(([href, label]) => (
          <li key={`${href}-${label}`}>
            <Link href={href} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}