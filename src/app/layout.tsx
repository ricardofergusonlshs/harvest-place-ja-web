import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

import { AppProviders } from '@/components/providers/app-providers';
import { EliteShell } from '@/components/shell/site-shell';
import { APP_NAME } from '@/lib/config';

function getSiteUrl() {
  const fallbackUrl = 'http://localhost:3000';
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configuredUrl || fallbackUrl);
  } catch {
    return new URL(fallbackUrl);
  }
}

const siteUrl = getSiteUrl();

const description =
  'Shop fresh Jamaican farm produce, local staples, ready-soon harvests, and subscription savings from trusted farmers and market vendors.';

const ogImage = '/logo.png';

export const metadata: Metadata = {
  metadataBase: siteUrl,

  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },

  description,
  applicationName: APP_NAME,

  keywords: [
    'Jamaican farm market',
    'fresh produce Jamaica',
    'local farmers Jamaica',
    'farm delivery Jamaica',
    'organic produce Jamaica',
    'Caribbean marketplace',
    'fresh groceries',
    'subscribe and save groceries',
    'ready soon harvest',
    'The Harvest Place Ja',
  ],

  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  category: 'shopping',

  alternates: {
    canonical: '/',
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },

  openGraph: {
    type: 'website',
    locale: 'en_JM',
    url: '/',
    siteName: APP_NAME,
    title: APP_NAME,
    description:
      'A premium Jamaican farm marketplace for fresh produce, local staples, subscriptions, and upcoming harvest alerts.',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 1200,
        alt: `${APP_NAME} logo`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description,
    images: [ogImage],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },

  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },

  referrer: 'origin-when-cross-origin',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2D6741' },
    { media: '(prefers-color-scheme: dark)', color: '#183B28' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-JM" suppressHydrationWarning>
      <body className="min-h-screen bg-[#FAF8F0] text-[#1E2A21] antialiased selection:bg-[#DFA75A] selection:text-[#183B28]">
        <AppProviders>
          <EliteShell>{children}</EliteShell>
        </AppProviders>
      </body>
    </html>
  );
}