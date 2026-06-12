export const APP_NAME = 'The Harvest Place Ja';

export const APP_TAGLINE = 'Elite Farm Market';

export const APP_DESCRIPTION =
  'Shop fresh Jamaican farm produce, local staples, ready-soon harvests, weekly boxes, and subscription savings from trusted farmers and vendors.';

export const DEFAULT_SITE_URL = 'http://localhost:3000';

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configuredUrl || DEFAULT_SITE_URL).toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const farmTheme = {
  background: '#F4F9F2',
  backgroundWarm: '#FAF8F0',

  card: '#FFFFFF',
  cardSoft: '#FFFEFC',

  primary: '#2D6741',
  primaryDark: '#183B28',
  primarySoft: '#EAF5E7',

  olive: '#5F7651',

  accent: '#DFA75A',
  accentSoft: '#FFF3D9',

  text: '#1E2A21',
  muted: '#5F6A62',
  border: '#D8E5D4',

  success: '#4F8A5B',
  warning: '#966012',
  danger: '#B44A3A',
} as const;

export const productImageStorageBucket = 'product-images';

export const appImages = {
  logo: '/logo.png',
  heroProduceBox: '/elite/hero-produce-box.png',
  weeklyBoxBanner: '/elite/weekly-box-banner.png',
  readySoonCard: '/elite/ready-soon-card.png',
  farmerStory: '/elite/farmer-story.png',
} as const;

export const appRoutes = {
  home: '/',
  shop: '/shop',
  auth: '/auth',
  account: '/account',
  orders: '/orders',
  myBox: '/my-box',
  weeklyBox: '/weekly-box',
  readySoon: '/ready-soon',
  subscribeSave: '/subscribe-save',
  farmer: '/farmer',
  admin: '/admin',
  support: '/support',
  trustCenter: '/trust-center',
  privacy: '/privacy',
  terms: '/terms',
  refund: '/refund',
  securityAudit: '/security-audit',
  veganIngredientBook: '/vegan-ingredient-book',
} as const;

export const navItems = [
  { href: appRoutes.home, label: 'Home' },
  { href: appRoutes.shop, label: 'Shop' },
  { href: appRoutes.readySoon, label: 'Ready Soon' },
  { href: appRoutes.weeklyBox, label: 'Weekly Box' },
  { href: appRoutes.orders, label: 'Orders' },
  { href: appRoutes.account, label: 'Account' },
] as const;

export const footerLinks = {
  shop: [
    { href: appRoutes.shop, label: 'All Products' },
    { href: appRoutes.weeklyBox, label: 'Weekly Boxes' },
    { href: `${appRoutes.shop}?sort=newest`, label: 'New Arrivals' },
    { href: `${appRoutes.shop}?tag=deals`, label: 'Deals & Specials' },
  ],
  customerCare: [
    { href: appRoutes.orders, label: 'Track Order' },
    { href: appRoutes.trustCenter, label: 'Delivery Info' },
    { href: appRoutes.refund, label: 'Returns & Refunds' },
    { href: appRoutes.support, label: 'Support' },
  ],
  company: [
    { href: appRoutes.farmer, label: 'Our Farmers' },
    { href: appRoutes.trustCenter, label: 'Trust Center' },
    { href: appRoutes.veganIngredientBook, label: 'Vegan Ingredient Book' },
  ],
  legal: [
    { href: appRoutes.privacy, label: 'Privacy' },
    { href: appRoutes.terms, label: 'Terms' },
    { href: appRoutes.securityAudit, label: 'Security' },
  ],
} as const;

export const deliveryConfig = {
  defaultZone: 'Kingston, Jamaica',
  pickupFee: 0,
  deliveryFee: 800,
  currency: 'JMD',
  locale: 'en-JM',
} as const;

export const productDefaults = {
  category: 'Vegetables',
  unit: 'each',
  platformCommissionPercent: 10,
  subscribeSaveDiscountPercent: 5,
  dealRank: 999,
  maxImageUploadMb: 5,
} as const;