# The Harvest Place Ja — Web Conversion

A production-ready responsive website conversion of the uploaded Flutter/Supabase app. It keeps the existing Supabase database, tables, RPC names, storage bucket, customer/admin/farmer roles, and premium green/gold farm-market identity.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase Auth, Database, RPC, and Storage

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Environment variables

Move the values from the Flutter `lib/app/app_config.dart` into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Only use the public anon/publishable key in the browser. Do **not** add a service-role key to this app.

## Supabase Auth redirect URLs

Add these URLs in Supabase Auth settings:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/reset-password`
- Your deployed domain equivalents, for example `https://your-site.com/auth/callback` and `https://your-site.com/reset-password`

## Preserved Supabase resources

The app uses the existing tables and RPC functions from the Flutter code, including:

- `home_hero_slides`
- `notifications`
- `notification_preferences`
- `products`
- `customer_loyalty_points`
- `loyalty_transactions`
- `product_trace_records`
- `orders`
- `order_items`
- `customers`
- `order_confirmations`
- `product_ready_subscriptions`
- `customer_product_subscriptions`
- `farmer_profiles`
- `farmer_payouts`
- `coupons`
- `support_tickets`
- `product_reviews`
- `admin_users`

RPCs used:

- `secure_checkout`
- `secure_checkout_with_coupon`
- `award_loyalty_points`
- `reduce_stock_for_order`
- `validate_coupon_for_checkout`
- `admin_update_product`
- `admin_upsert_coupon`
- `admin_fetch_audit_logs`

Storage:

- `product-images`

## Feature map

Customer-facing routes include public landing, shop, product detail, cart/My Box, checkout, order tracking, loyalty/account, ready-soon alerts, weekly box, subscribe & save, vegan ingredient guide, notifications, support, reviews, trust center, security audit, and policy pages.

Admin route includes protected dashboard cards for overview, analytics, app health, launch checklist, hero slide management, products, orders, coupons, reviews, support, farmers, farmer payouts, and audit logs.

Farmer route includes onboarding/profile, approval state handling, farmer dashboard, product submission, product list, order summaries, and earnings.

## Notes

This code intentionally keeps privileged checks tied to Supabase RLS and the existing `admin_users` / `farmer_profiles` tables. Frontend checks improve UX, but protected writes still depend on Supabase policies and RPC security.
