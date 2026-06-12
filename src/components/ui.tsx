'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  Loader2,
  PackageOpen,
  Sparkles,
} from 'lucide-react';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export function Button({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  onClick,
  disabled,
  isLoading,
  leftIcon,
  rightIcon,
  fullWidth,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const classes = cn(
    'group relative inline-flex items-center justify-center overflow-hidden rounded-full font-black tracking-tight',
    'transition-all duration-300 ease-out',
    'focus:outline-none focus:ring-4 focus:ring-farm-accent/30',
    'disabled:cursor-not-allowed disabled:opacity-60',
    'active:translate-y-0',
    fullWidth && 'w-full',

    size === 'sm' && 'gap-1.5 px-4 py-2 text-xs',
    size === 'md' && 'gap-2 px-5 py-3 text-sm',
    size === 'lg' && 'gap-2.5 px-7 py-4 text-base',

    variant === 'primary' &&
      cn(
        'bg-farm-primary text-white shadow-[0_18px_45px_rgba(36,94,56,0.28)]',
        'hover:-translate-y-0.5 hover:bg-farm-primaryDark hover:shadow-[0_24px_60px_rgba(36,94,56,0.34)]',
        'before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.25),transparent_45%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100'
      ),

    variant === 'secondary' &&
      cn(
        'border border-farm-border bg-white text-farm-primary shadow-[0_12px_35px_rgba(15,23,42,0.08)]',
        'hover:-translate-y-0.5 hover:border-farm-primary/35 hover:bg-farm-primarySoft hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]'
      ),

    variant === 'ghost' &&
      cn(
        'text-farm-primary',
        'hover:bg-farm-primarySoft hover:text-farm-primaryDark'
      ),

    variant === 'danger' &&
      cn(
        'bg-farm-danger text-white shadow-[0_18px_45px_rgba(220,38,38,0.2)]',
        'hover:-translate-y-0.5 hover:bg-farm-danger/90 hover:shadow-[0_24px_60px_rgba(220,38,38,0.28)]'
      ),

    variant === 'dark' &&
      cn(
        'bg-farm-primaryDark text-white shadow-[0_18px_45px_rgba(15,23,42,0.24)]',
        'hover:-translate-y-0.5 hover:bg-farm-primary hover:shadow-[0_24px_60px_rgba(15,23,42,0.3)]'
      ),

    className
  );

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
      ) : leftIcon ? (
        <span className="relative z-10 inline-flex shrink-0">{leftIcon}</span>
      ) : null}

      <span className="relative z-10">{children}</span>

      {!isLoading && rightIcon ? (
        <span className="relative z-10 inline-flex shrink-0 transition-transform duration-300 group-hover:translate-x-0.5">
          {rightIcon}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={isDisabled ? '#' : href}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
        className={cn(classes, isDisabled && 'pointer-events-none')}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interactive?: boolean;
};

export function Card({
  children,
  className,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5',
        'shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl',
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent',
        interactive &&
          'transition-all duration-300 hover:-translate-y-1 hover:border-farm-primary/20 hover:shadow-[0_28px_90px_rgba(15,23,42,0.13)]',
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PremiumCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      interactive
      className={cn(
        'bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(255,255,255,0.82)_45%,rgba(247,250,244,0.95))]',
        'after:absolute after:-right-16 after:-top-16 after:h-44 after:w-44 after:rounded-full after:bg-farm-accent/10 after:blur-3xl',
        className
      )}
    >
      {children}
    </Card>
  );
}

export type BadgeTone =
  | 'green'
  | 'gold'
  | 'cream'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'soft'
  | 'purple'
  | 'gray'
  | 'white'
  | 'success'
  | 'warning'
  | 'danger'
  | 'default'
  | 'info'
  | 'dark'
  | 'neutral'
  | (string & {});

const badgeToneClassName: Record<string, string> = {
  green: 'border-farm-primary/15 bg-farm-primarySoft text-farm-primary',
  gold: 'border-farm-accent/30 bg-farm-accentSoft text-farm-warning',
  cream: 'border-farm-accent/25 bg-[#FFF3D9] text-[#183B28]',
  red: 'border-farm-danger/20 bg-red-50 text-farm-danger',
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  soft: 'border-farm-primary/10 bg-[#EAF5E7] text-[#2D6741]',
  purple: 'border-purple-200 bg-purple-50 text-purple-700',
  gray: 'border-slate-200 bg-slate-50 text-slate-700',
  white: 'border-white/35 bg-white/15 text-white shadow-none backdrop-blur',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  default: 'border-farm-border bg-white text-farm-muted',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  dark: 'border-farm-primaryDark/20 bg-farm-primaryDark text-white',
  neutral: 'border-farm-border bg-white text-farm-muted'
};

export function Badge({
  children,
  tone = 'green',
  className,
  icon,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
}) {
  const toneClassName = badgeToneClassName[tone] || badgeToneClassName.green;

  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black shadow-sm',
        toneClassName,
        className
      )}
    >
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        'mb-7 flex flex-col gap-5',
        centered
          ? 'items-center text-center'
          : 'md:flex-row md:items-end md:justify-between'
      )}
    >
      <div className={cn(centered && 'flex max-w-3xl flex-col items-center')}>
        {eyebrow ? (
          <Badge
            tone="gold"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            className="mb-3 uppercase tracking-[0.22em]"
          >
            {eyebrow}
          </Badge>
        ) : null}

        <h2 className="max-w-4xl text-3xl font-black tracking-[-0.04em] text-farm-primaryDark md:text-5xl">
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-farm-muted md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <PremiumCard className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 grid h-20 w-20 place-items-center rounded-[1.75rem] bg-farm-primarySoft text-farm-primary shadow-[0_18px_45px_rgba(36,94,56,0.15)]">
        {icon ?? <PackageOpen className="h-9 w-9" />}
      </div>

      <Badge
        tone="green"
        icon={<Leaf className="h-3.5 w-3.5" />}
        className="mb-4"
      >
        Fresh start
      </Badge>

      <h3 className="text-2xl font-black tracking-tight text-farm-primaryDark">
        {title}
      </h3>

      <p className="mt-3 max-w-md text-sm leading-7 text-farm-muted">
        {subtitle}
      </p>

      {action ? <div className="mt-7">{action}</div> : null}
    </PremiumCard>
  );
}

export function LoadingState({
  label = 'Loading fresh harvest data...',
}: {
  label?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-farm-border bg-white/80 p-8 text-sm font-black text-farm-muted shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="flex items-center justify-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-farm-primarySoft text-farm-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function StatusChip({ status }: { status?: string | null }) {
  const text = (status ?? 'pending').replaceAll('_', ' ');
  const lower = text.toLowerCase();

  const isSuccess =
    lower.includes('approved') ||
    lower.includes('paid') ||
    lower.includes('completed') ||
    lower.includes('delivered') ||
    lower.includes('active') ||
    lower.includes('ready');

  const isDanger =
    lower.includes('cancel') ||
    lower.includes('failed') ||
    lower.includes('declined') ||
    lower.includes('refunded') ||
    lower.includes('expired') ||
    lower.includes('reject');

  const tone: BadgeTone = isSuccess ? 'green' : isDanger ? 'red' : 'gold';

  return (
    <Badge
      tone={tone}
      icon={isSuccess ? <CheckCircle2 className="h-3.5 w-3.5" /> : undefined}
    >
      {text.replace(/\b\w/g, (letter) => letter.toUpperCase())}
    </Badge>
  );
}

export function EliteLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center gap-2 text-sm font-black text-farm-primary transition-colors hover:text-farm-primaryDark',
        className
      )}
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

export function EliteShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(242,181,66,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(36,94,56,0.12),transparent_34%),linear-gradient(180deg,#fbfff7,#f6faf2)]',
        'text-farm-primaryDark',
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
