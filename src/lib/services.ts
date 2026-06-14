'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { productImageStorageBucket } from '@/lib/config';
import { formatJmd } from '@/lib/format';
import { canAddToCart, effectivePrice, hasActiveDiscount, isCustomerVisible, isReadySoon, normalizeProduct, PRODUCT_COMPAT_SELECT, showAsDealOfDay } from '@/lib/product';
import type {
  AuditLogEntry,
  CartLine,
  Coupon,
  CouponValidationResult,
  CustomerProductSubscription,
  CustomerProfile,
  FarmNotification,
  FarmOrder,
  FarmerOrderSummary,
  FarmerPayout,
  FarmerProfile,
  HomeHeroSlide,
  JsonMap,
  LoyaltySummary,
  Product,
  ProductReview,
  ProductTraceRecord,
  SecureCartQuote,
  SupportTicket
} from '@/lib/types';

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

function mapRow(row: unknown): JsonMap {
  return row && typeof row === 'object' ? (row as JsonMap) : {};
}

function normalizeProductsForCustomer(data: unknown): Product[] {
  const products = rows<JsonMap>(data).map(normalizeProduct);
  const visible = products.filter(isCustomerVisible);

  // In local preview, some existing rows may not have every visibility/status
  // field used by the Flutter app. Show normalized rows rather than leaving the
  // shop empty forever, while still preferring approved/customer-visible rows.
  return visible.length ? visible : products.filter((product) => Boolean(product.id && product.name));
}


const SUPABASE_TIMEOUT_MS = 45000;

async function withTimeout<T>(promise: PromiseLike<T>, label: string, timeoutMs = SUPABASE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out. Check Supabase URL, anon key, internet, and RLS policies.`)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function logSupabaseError(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  // Use debug instead of warn/error so Next.js dev overlay does not cover the UI.
  // Open DevTools Console and enable Verbose logs if you need to inspect these.
  if (typeof console !== 'undefined' && typeof console.debug === 'function') {
    console.debug(`[The Harvest Place Ja] ${label}:`, message);
  }
}

export function defaultHomeHeroSlides(): HomeHeroSlide[] {
  return [
    {
      position: 1,
      title: 'Fresh Jamaican harvests, packed with care',
      subtitle: 'Build your premium farm box from trusted local growers.',
      image_url: null,
      is_active: true
    },
    {
      position: 2,
      title: 'Elite freshness from farm to table',
      subtitle: 'Track origin, stock, delivery, and order updates in one polished market.',
      image_url: null,
      is_active: true
    },
    {
      position: 3,
      title: 'Weekly boxes, ready-soon alerts, and rewards',
      subtitle: 'Subscribe, save, earn loyalty points, and never miss the next harvest.',
      image_url: null,
      is_active: true
    }
  ];
}

export async function fetchHomeHeroSlides() {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('home_hero_slides')
        .select('id, position, image_url, title, subtitle, is_active, updated_at')
        .eq('is_active', true)
        .order('position', { ascending: true }),
      'home hero slides request'
    );

    if (error || !data?.length) return defaultHomeHeroSlides();
    return rows<HomeHeroSlide>(data).slice(0, 3);
  } catch (error) {
    logSupabaseError('Hero slides could not load; using default slides', error);
    return defaultHomeHeroSlides();
  }
}

export async function fetchProducts() {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(120),
      'products select(*) request'
    );

    if (error) throw error;
    return normalizeProductsForCustomer(data);
  } catch (orderedError) {
    logSupabaseError('Products ordered select failed; trying select(*) without created_at order', orderedError);
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select('*')
        .limit(120),
      'products select(*) no-order fallback request'
    );

    if (error) throw error;
    return normalizeProductsForCustomer(data);
  } catch (fallbackError) {
    logSupabaseError('Products could not load. Check products SELECT RLS policy, anon key, and readable rows', fallbackError);
    return [];
  }
}

export async function fetchAllProducts() {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(250),
      'admin all products select(*) request'
    );

    if (error) throw error;
    return rows<JsonMap>(data).map(normalizeProduct);
  } catch (orderedError) {
    logSupabaseError('Admin products ordered select failed; trying no-order fallback', orderedError);
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select('*')
        .limit(250),
      'admin all products no-order fallback request'
    );

    if (error) throw error;
    return rows<JsonMap>(data).map(normalizeProduct);
  } catch (fallbackError) {
    logSupabaseError('Admin products could not load', fallbackError);
    return [];
  }
}

export async function fetchProductById(id: string) {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select('*').eq('id', id).maybeSingle(),
      'product detail select(*) request'
    );

    if (error) throw error;
    return data ? normalizeProduct(mapRow(data)) : null;
  } catch (primaryError) {
    logSupabaseError('Product detail select(*) failed; trying compatible select fallback', primaryError);
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select(PRODUCT_COMPAT_SELECT).eq('id', id).maybeSingle(),
      'product detail compatible fallback request'
    );

    if (error) throw error;
    return data ? normalizeProduct(mapRow(data)) : null;
  } catch (fallbackError) {
    logSupabaseError('Product detail could not load', fallbackError);
    return null;
  }
}

export async function fetchReadySoonProducts() {
  const supabase = getSupabaseBrowserClient();

  function visibleReadySoonProducts(data: unknown) {
    return rows<JsonMap>(data)
      .map(normalizeProduct)
      .filter((product) => {
        const status = product.product_status.toLowerCase();
        const approved = product.approval_status.toLowerCase() === 'approved';
        const notHidden = status !== 'hidden' && status !== 'archived';

        return Boolean(product.id && product.name) && approved && notHidden && isReadySoon(product);
      })
      .sort((a, b) =>
        String(a.estimated_ready_date ?? '').localeCompare(
          String(b.estimated_ready_date ?? '')
        )
      );
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select('*')
        .or('ready_soon.eq.true,product_status.eq.ready_soon,product_status.eq.coming_soon')
        .order('estimated_ready_date', { ascending: true })
        .limit(80),
      'ready-soon products request'
    );

    if (error) throw error;
    return visibleReadySoonProducts(data);
  } catch (primaryError) {
    logSupabaseError('Ready-soon products filtered request failed; trying fallback product load', primaryError);
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select('*').limit(120),
      'ready-soon products fallback request'
    );

    if (error) throw error;
    return visibleReadySoonProducts(data);
  } catch (fallbackError) {
    logSupabaseError('Ready-soon products could not load', fallbackError);
    return [];
  }
}

export async function fetchDealOfTheDayProducts() {
  const products = await fetchProducts();

  return products
    .filter((product) => showAsDealOfDay(product) || hasActiveDiscount(product))
    .sort((a, b) => a.deal_rank - b.deal_rank)
    .slice(0, 12);
}

export async function fetchSecureCartQuote(lines: CartLine[]): Promise<SecureCartQuote> {
  const ids = lines.map((line) => line.product.id).filter(Boolean);
  if (!ids.length) return { lines: [], subtotal: 0 };

  const supabase = getSupabaseBrowserClient();

  let productRows: JsonMap[] = [];

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select('*').in('id', ids),
      'cart quote products select(*) request'
    );

    if (error) throw error;
    productRows = rows<JsonMap>(data);
  } catch (primaryError) {
    logSupabaseError('Cart quote select(*) failed; trying compatible select fallback', primaryError);

    const { data, error } = await withTimeout(
      supabase.from('products').select(PRODUCT_COMPAT_SELECT).in('id', ids),
      'cart quote products compatible fallback request'
    );

    if (error) throw error;
    productRows = rows<JsonMap>(data);
  }

  const products = new Map(productRows.map((row) => {
    const product = normalizeProduct(row);
    return [product.id, product] as const;
  }));

  const quoted = [];
  for (const line of lines) {
    const product = products.get(line.product.id);
    if (!product) return { lines: [], subtotal: 0, unavailableMessage: `${line.product.name} is no longer available.` };
    if (!canAddToCart(product)) return { lines: [], subtotal: 0, unavailableMessage: `${product.name} is not available right now.` };
    if (line.quantity > product.stock_quantity) return { lines: [], subtotal: 0, unavailableMessage: `Only ${product.stock_quantity} ${product.name} available. Please reduce quantity.` };
    const unitPrice = effectivePrice(product);
    quoted.push({ product, quantity: line.quantity, unit_price: unitPrice, line_total: unitPrice * line.quantity });
  }

  return { lines: quoted, subtotal: quoted.reduce((sum, line) => sum + line.line_total, 0) };
}

export async function validateCouponForCheckout(code: string, orderTotal: number) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return {
      valid: false,
      message: 'Enter a coupon code.',
      discount_amount: 0
    } as CouponValidationResult;
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await withTimeout(
    supabase.rpc('validate_coupon_for_checkout', {
      p_code: normalizedCode,
      p_order_total: orderTotal
    }),
    'coupon validation request'
  );

  if (error) throw error;
  return data as CouponValidationResult;
}

export async function secureCheckout(input: {
  cartLines: CartLine[];
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryZone?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  paymentMethod: 'cash_on_pickup' | 'bank_transfer' | 'card' | string;
  bankReference?: string;
  notes?: string;
  couponCode?: string;
}) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in before placing an order.');

  const quote = await fetchSecureCartQuote(input.cartLines);
  if (quote.unavailableMessage) throw new Error(quote.unavailableMessage);
  if (!quote.lines.length) throw new Error('Your box is empty.');

  const deliveryFee = input.fulfillmentType === 'delivery' ? 800 : 0;
  const requestedCoupon = input.couponCode?.trim().toUpperCase() || null;
  let discountAmount = 0;

  if (requestedCoupon) {
    const result = await validateCouponForCheckout(requestedCoupon, quote.subtotal + deliveryFee);
    if (!result.valid) throw new Error(result.message || 'Coupon is not valid.');
    discountAmount = result.discount_amount || 0;
  }

  const total = Math.max(0, quote.subtotal + deliveryFee - discountAmount);
  const customerPayload = {
    full_name: input.fullName,
    name: input.fullName,
    phone: input.phone,
    email: input.email ?? user.email,
    address: input.fulfillmentType === 'delivery' ? input.address || null : null,
    fulfillment_type: input.fulfillmentType,
    delivery_address: input.fulfillmentType === 'delivery' ? input.address || null : null,
    delivery_zone: input.fulfillmentType === 'delivery' ? input.deliveryZone || null : null,
    scheduled_date: input.scheduledDate || null,
    scheduled_time: input.scheduledTime || null,
    delivery_status: input.fulfillmentType === 'delivery' ? 'pending' : 'ready_for_pickup',
    subtotal: quote.subtotal,
    delivery_fee: deliveryFee,
    discount_code: requestedCoupon,
    discount_amount: discountAmount,
    total,
    payment_status: 'unpaid',
    bank_reference: input.bankReference || null
  };

  const notes = [
    input.notes,
    `Fulfillment: ${input.fulfillmentType}`,
    input.deliveryZone ? `Delivery zone: ${input.deliveryZone}` : null,
    input.address && input.fulfillmentType === 'delivery' ? `Delivery address: ${input.address}` : null,
    `Subtotal: ${formatJmd(quote.subtotal)}`,
    deliveryFee > 0 ? `Delivery fee: ${formatJmd(deliveryFee)}` : null,
    discountAmount > 0 ? `Discount: -${formatJmd(discountAmount)}` : null,
    `Total to pay: ${formatJmd(total)}`,
    input.bankReference ? `Bank reference: ${input.bankReference}` : null
  ].filter(Boolean).join('\n');

  const rpcName = requestedCoupon ? 'secure_checkout_with_coupon' : 'secure_checkout';
  const params: Record<string, unknown> = {
    p_customer: customerPayload,
    p_items: quote.lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
    p_payment_method: input.paymentMethod,
    p_notes: notes
  };
  if (requestedCoupon) params.p_coupon_code = requestedCoupon;

  const { data, error } = await withTimeout(
    supabase.rpc(rpcName, params),
    'secure checkout request'
  );

  if (error) throw error;
  const response = mapRow(data);
  const orderId = String(response.order_id ?? '');
  if (!orderId) throw new Error('Checkout completed, but no order ID was returned.');

  const { error: orderUpdateError } = await supabase.from('orders').update({
    fulfillment_type: input.fulfillmentType,
    delivery_address: input.fulfillmentType === 'delivery' ? input.address || null : null,
    delivery_zone: input.fulfillmentType === 'delivery' ? input.deliveryZone || null : null,
    scheduled_date: input.scheduledDate || null,
    scheduled_time: input.scheduledTime || null,
    delivery_status: input.fulfillmentType === 'delivery' ? 'pending' : 'ready_for_pickup',
    subtotal: quote.subtotal,
    delivery_fee: deliveryFee,
    discount_code: requestedCoupon,
    discount_amount: discountAmount,
    total,
    payment_status: 'unpaid',
    payment_method: input.paymentMethod,
    bank_reference: input.bankReference || null,
    notes
  }).eq('id', orderId);

  if (orderUpdateError) {
    logSupabaseError('Checkout completed but order metadata update failed', orderUpdateError);
  }

  return { orderId, total, quote };
}

export async function fetchOrders() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return [];

  const userId = user.id;
  const userEmail = user.email?.trim() || null;

  // Keep this select small and compatible with the Android app table.
  // If we select columns that do not exist in the production orders table,
  // Supabase returns an error and the website appears to have zero orders.
  const safeOrderSelect =
    'id, customer_id, order_status, fulfillment_type, subtotal, delivery_fee, created_at';

  function normalizeOrderRows(data: unknown): FarmOrder[] {
    return rows<JsonMap>(data).map((row) => {
      const subtotal = Number(row.subtotal ?? 0);
      const deliveryFee = Number(row.delivery_fee ?? 0);
      const discountAmount = Number(row.discount_amount ?? 0);
      const total = Number(row.total ?? subtotal + deliveryFee - discountAmount);
      const orderStatus = String(row.order_status ?? row.status ?? 'pending');

      return {
        ...row,
        status: row.status ?? orderStatus,
        order_status: orderStatus,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        total
      } as FarmOrder;
    });
  }

  try {
    const customerId = await currentCustomerIdForSignedInUser();

    if (customerId) {
      const { data, error } = await withTimeout(
        supabase
          .from('orders')
          .select(safeOrderSelect)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(100),
        'customer orders by customers.id request'
      );

      if (error) throw error;

      return normalizeOrderRows(data);
    }

    logSupabaseError(
      'Orders could not load',
      `No readable customers row found for signed-in user ${userId}${userEmail ? ` / ${userEmail}` : ''}.`
    );

    return [];
  } catch (customerIdError) {
    logSupabaseError('Primary customer_id order lookup failed', customerIdError);
  }

  // Last-resort fallbacks for older web-created order rows, only if those columns exist.
  if (userEmail) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('orders')
          .select(safeOrderSelect)
          .ilike('email', userEmail)
          .order('created_at', { ascending: false })
          .limit(100),
        'customer orders by email fallback request'
      );

      if (error) throw error;
      return normalizeOrderRows(data);
    } catch (emailLookupError) {
      logSupabaseError('Orders email fallback failed or orders.email does not exist', emailLookupError);
    }
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('orders')
        .select(safeOrderSelect)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      'customer orders by user_id fallback request'
    );

    if (error) throw error;
    return normalizeOrderRows(data);
  } catch (userIdLookupError) {
    logSupabaseError('Orders user_id fallback failed or orders.user_id does not exist', userIdLookupError);
  }

  return [];
}

export async function fetchOrderDetails(orderId: string) {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('orders')
        .select('id, customer_id, order_status, fulfillment_type, subtotal, delivery_fee, created_at, customers(full_name, phone, address), order_items(id, order_id, product_id, product_name, quantity, unit_price, line_total)')
        .eq('id', orderId)
        .maybeSingle(),
      'order detail compatible request'
    );

    if (error) throw error;

    if (!data) return null;

    const row = mapRow(data);
    const subtotal = Number(row.subtotal ?? 0);
    const deliveryFee = Number(row.delivery_fee ?? 0);
    const discountAmount = Number(row.discount_amount ?? 0);
    const total = Number(row.total ?? subtotal + deliveryFee - discountAmount);
    const orderStatus = String(row.order_status ?? row.status ?? 'pending');

    return {
      ...row,
      status: row.status ?? orderStatus,
      order_status: orderStatus,
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      total
    } as FarmOrder;
  } catch (primaryError) {
    logSupabaseError('Order detail compatible request failed; trying minimal fallback', primaryError);
  }

  const { data, error } = await withTimeout(
    supabase
      .from('orders')
      .select('id, customer_id, order_status, fulfillment_type, subtotal, delivery_fee, created_at')
      .eq('id', orderId)
      .maybeSingle(),
    'order detail minimal fallback request'
  );

  if (error) throw error;
  if (!data) return null;

  const row = mapRow(data);
  const subtotal = Number(row.subtotal ?? 0);
  const deliveryFee = Number(row.delivery_fee ?? 0);
  const orderStatus = String(row.order_status ?? 'pending');

  return {
    ...row,
    status: orderStatus,
    order_status: orderStatus,
    subtotal,
    delivery_fee: deliveryFee,
    discount_amount: 0,
    total: subtotal + deliveryFee
  } as FarmOrder;
}

export async function currentCustomerIdForSignedInUser() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userId = user.id;
  const userEmail = user.email?.trim() || null;

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('customers')
        .select('id, user_id, email, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'current customer lookup by user_id request'
    );

    if (error) throw error;
    if (data?.id) return String(data.id);
  } catch (userIdError) {
    logSupabaseError('Customer lookup by user_id failed', userIdError);
  }

  if (!userEmail) return null;

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('customers')
        .select('id, user_id, email, created_at')
        .ilike('email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'current customer lookup by email request'
    );

    if (error) throw error;
    if (!data?.id) return null;

    const customerId = String(data.id);

    // Best-effort link so future website/app reads match through user_id.
    if (!data.user_id) {
      const { error: linkError } = await supabase
        .from('customers')
        .update({ user_id: userId })
        .eq('id', customerId);

      if (linkError) {
        logSupabaseError('Customer user_id auto-link failed', linkError);
      }
    }

    return customerId;
  } catch (emailError) {
    logSupabaseError('Customer lookup by email failed', emailError);
    return null;
  }
}

export async function fetchCurrentCustomerProfile() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('customers')
        .select('id, full_name, phone, address, user_id, email')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'current customer profile by user_id request'
    );

    if (error) throw error;
    if (data) return data as CustomerProfile;
  } catch (userIdError) {
    logSupabaseError('Customer profile by user_id failed', userIdError);
  }

  if (!user.email) return null;

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('customers')
        .select('id, full_name, phone, address, user_id, email')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'current customer profile by email request'
    );

    if (error) throw error;
    return data as CustomerProfile | null;
  } catch (emailError) {
    logSupabaseError('Customer profile by email failed', emailError);
    return null;
  }
}

export async function saveCurrentCustomerProfile(profile: { full_name: string; phone: string; address?: string }) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first.');
  const payload = { full_name: profile.full_name, phone: profile.phone, address: profile.address || null, email: user.email, user_id: user.id };
  const { error } = await supabase.from('customers').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function fetchLoyaltySummary() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { points: 0, tier: 'Seedling' } as LoyaltySummary;
  const { data } = await supabase.from('customer_loyalty_points').select('points, lifetime_points, tier').eq('user_id', user.id).maybeSingle();
  return (data as LoyaltySummary | null) ?? { points: 0, tier: 'Seedling' };
}

export async function fetchFarmNotifications() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, read, is_read, order_id, user_id, user_email, created_at')
    .or(`user_id.eq.${user.id},user_email.ilike.${user.email ?? ''}`)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) return [];
  return rows<FarmNotification>(data);
}

export async function markNotificationsRead() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const update = { read: true, is_read: true };
  const { error } = await supabase.from('notifications').update(update).eq('user_id', user.id);

  if (!error) return;

  const { error: fallbackError } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id);

  if (!fallbackError || !user.email) return;

  await supabase
    .from('notifications')
    .update(update)
    .ilike('user_email', user.email);
}

export async function subscribeToProductReadyAlert(product: Product) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to get ready-soon alerts.');
  const { error } = await supabase.from('product_ready_subscriptions').insert({
    user_id: user.id,
    email: user.email,
    product_id: product.id,
    product_name: product.name,
    notified: false
  });
  if (error && !String(error.message).toLowerCase().includes('duplicate')) throw error;
}

export async function subscribeToSaveProduct(product: Product, quantity = 1, cadence = 'weekly') {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to subscribe and save.');
  const { error } = await supabase.from('customer_product_subscriptions').insert({
    user_id: user.id,
    email: user.email,
    product_id: product.id,
    product_name: product.name,
    quantity,
    cadence,
    status: 'active',
    subscribe_save_discount_percent: product.subscribe_save_discount_percent || 5
  });
  if (error) throw error;
}

export async function fetchCustomerProductSubscriptions() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('customer_product_subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return [];
  return rows<CustomerProductSubscription>(data);
}

export async function fetchTraceRecordsForProduct(productId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('product_trace_records').select('*').eq('product_id', productId).order('created_at', { ascending: false }).limit(20);
  if (error) return [];
  return rows<ProductTraceRecord>(data);
}

export async function createSupportTicket(ticket: { email: string; subject: string; message: string }) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payload = { ...ticket, user_id: user?.id ?? null, status: 'open' };
  const { error } = await supabase.from('support_tickets').insert(payload);
  if (!error) return;
  const { error: fallbackError } = await supabase.from('support_tickets').insert({ email: ticket.email, subject: ticket.subject, message: ticket.message, status: 'open' });
  if (fallbackError) throw fallbackError;
}

export async function fetchMySupportTickets() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('support_tickets').select('id, email, subject, message, status, admin_reply, created_at').or(`user_id.eq.${user.id},email.ilike.${user.email ?? ''}`).order('created_at', { ascending: false });
  if (error) return [];
  return rows<SupportTicket>(data);
}

export async function createProductReview(review: { product_id: string; product_name: string; rating: number; comment: string; customer_name?: string }) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to review this product.');
  const payload = {
    product_id: review.product_id,
    product_name: review.product_name,
    user_id: user.id,
    email: user.email,
    customer_name: review.customer_name || null,
    rating: review.rating,
    comment: review.comment
  };
  const { error } = await supabase.from('product_reviews').insert(payload);
  if (!error) return;
  const { error: fallbackError } = await supabase.from('product_reviews').insert({ product_id: review.product_id, user_id: user.id, email: user.email, rating: review.rating, comment: review.comment });
  if (fallbackError) throw fallbackError;
}

export async function fetchProductReviews(productId?: string) {
  const supabase = getSupabaseBrowserClient();
  async function run(select: string) {
    let query = supabase.from('product_reviews').select(select).order('created_at', { ascending: false }).limit(100);
    if (productId) query = query.eq('product_id', productId);
    const { data, error } = await query;
    if (error) throw error;
    return rows<ProductReview>(data);
  }
  try {
    return await run('id, product_id, product_name, user_id, customer_name, email, rating, comment, created_at, products(name)');
  } catch {
    try { return await run('id, product_id, product_name, user_id, email, rating, comment, created_at'); } catch { return []; }
  }
}

export async function isCurrentUserAdminFromDatabase() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    if (data) return true;
  } catch {}
  try {
    const { data } = await supabase.from('admin_users').select('id').eq('id', user.id).maybeSingle();
    if (data) return true;
  } catch {}
  if (user.email) {
    try {
      const { data } = await supabase.from('admin_users').select('email').ilike('email', user.email).maybeSingle();
      if (data) return true;
    } catch {}
  }
  return false;
}

export async function requireAdminAccess() {
  const allowed = await isCurrentUserAdminFromDatabase();
  if (!allowed) throw new Error('Admin permission required.');
}

export async function adminUpdateProduct(
  productId: string,
  payload: Record<string, unknown>
) {
  const supabase = getSupabaseBrowserClient();

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  delete cleanPayload.id;
  delete cleanPayload.created_at;
  delete cleanPayload.updated_at;
  delete cleanPayload.admin_note;

  const { data, error } = await supabase
    .from('products')
    .update(cleanPayload)
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Product could not be updated.');
  }

  return data;
}
export async function createProduct(payload: Partial<Product>) {
  await requireAdminAccess();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('products').insert({
    name: payload.name,
    description: payload.description || null,
    price: payload.price || 0,
    unit: payload.unit || 'each',
    image_url: payload.image_url || null,
    is_available: payload.is_available ?? true,
    stock_quantity: payload.stock_quantity ?? 0,
    category: payload.category || 'Vegetables',
    is_organic: payload.is_organic ?? false,
    is_local: payload.is_local ?? true,
    approval_status: payload.approval_status || 'approved',
    product_status: payload.product_status || 'available',
    ready_soon: payload.ready_soon ?? false,
    is_deal_of_day: payload.is_deal_of_day ?? false,
    subscribe_save_enabled: payload.subscribe_save_enabled ?? false
  });
  if (error) throw error;
}

export async function uploadProductImage(file: File, folder = 'products', adminOnly = true) {
  if (adminOnly) {
    await requireAdminAccess();
  }

  const supabase = getSupabaseBrowserClient();

  if (!adminOnly) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sign in before uploading images.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file.');
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Image is too large. Please upload an image under 5MB.');
  }

  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'jpg';

  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+/, '') || 'products';
  const path = `${safeFolder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;

  const { error } = await supabase.storage
    .from(productImageStorageBucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(productImageStorageBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchAdminOrders() {
  const allowed = await isCurrentUserAdminFromDatabase();
  if (!allowed) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_status, status, fulfillment_type, subtotal, delivery_fee, discount_amount, total, payment_status, payment_method, bank_reference, delivery_status, delivery_address, delivery_zone, scheduled_date, scheduled_time, notes, created_at, customers(full_name, phone, address), order_items(product_name, quantity, line_total)')
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) return [];
  return rows<FarmOrder>(data);
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdminAccess();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('orders').update({ order_status: status, status }).eq('id', orderId);
  if (error) throw error;
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
  await requireAdminAccess();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', orderId);
  if (error) throw error;
}

export async function fetchCoupons() {
  const allowed = await isCurrentUserAdminFromDatabase();
  if (!allowed) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('coupons').select('id, code, discount_type, discount_value, minimum_order, is_active').order('created_at', { ascending: false });
  if (error) return [];
  return rows<Coupon>(data);
}

export async function upsertCoupon(coupon: Partial<Coupon>) {
  await requireAdminAccess();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc('admin_upsert_coupon', {
    p_coupon_id: coupon.id ?? null,
    p_code: coupon.code?.trim().toUpperCase() ?? null,
    p_discount_type: coupon.discount_type ?? null,
    p_discount_value: coupon.discount_value ?? null,
    p_minimum_order: coupon.minimum_order ?? 0,
    p_is_active: coupon.is_active ?? true,
    p_starts_at: null,
    p_ends_at: null,
    p_usage_limit: null,
    p_description: 'Managed from web admin dashboard',
    p_admin_note: 'Coupon managed from web admin dashboard'
  });
  if (error) throw error;
}

export async function fetchAdminSupportTickets() {
  const allowed = await isCurrentUserAdminFromDatabase();
  if (!allowed) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('support_tickets').select('id, email, subject, message, status, admin_reply, created_at').order('created_at', { ascending: false }).limit(100);
  if (error) return [];
  return rows<SupportTicket>(data);
}

export async function updateSupportTicket(ticketId: string, update: { status: string; admin_reply?: string }) {
  await requireAdminAccess();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('support_tickets').update(update).eq('id', ticketId);
  if (error) throw error;
}

export async function fetchAdminAuditLogs() {
  const allowed = await isCurrentUserAdminFromDatabase();
  if (!allowed) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('admin_fetch_audit_logs', { p_limit: 60, p_action: null, p_table_name: null });
  if (error) return [];
  return rows<AuditLogEntry>(data);
}

export async function fetchCurrentFarmerProfile() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('farmer_profiles').select('id, user_id, email, farm_name, farmer_name, phone, parish, address, bio, verification_status, payout_method, payout_details, created_at').eq('user_id', user.id).maybeSingle();
  if (error) return null;
  return data as FarmerProfile | null;
}

export async function fetchFarmerProfiles() {
  const allowed = await isCurrentUserAdminFromDatabase();
  if (!allowed) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('farmer_profiles').select('id, user_id, email, farm_name, farmer_name, phone, parish, address, bio, verification_status, payout_method, payout_details, created_at').order('created_at', { ascending: false });
  if (error) return [];
  return rows<FarmerProfile>(data);
}

export async function saveFarmerProfile(profile: Omit<FarmerProfile, 'id' | 'user_id' | 'email' | 'verification_status' | 'created_at'>) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to submit your farmer profile.');
  const payload = { ...profile, user_id: user.id, email: user.email, verification_status: 'pending' };
  const existing = await fetchCurrentFarmerProfile();
  const { error } = existing?.id
    ? await supabase.from('farmer_profiles').update(payload).eq('id', existing.id)
    : await supabase.from('farmer_profiles').insert(payload);
  if (error) throw error;
}

export async function updateFarmerVerification(farmerId: string, status: string) {
  await requireAdminAccess();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('farmer_profiles').update({ verification_status: status }).eq('id', farmerId);
  if (error) throw error;
}

export async function fetchFarmerProducts(farmerId: string) {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select('*').eq('farmer_id', farmerId).order('created_at', { ascending: false }),
      'farmer products select(*) request'
    );

    if (error) throw error;
    return rows<JsonMap>(data).map(normalizeProduct);
  } catch (orderedError) {
    logSupabaseError('Farmer products ordered select failed; trying no-order fallback', orderedError);
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select('*').eq('farmer_id', farmerId),
      'farmer products no-order fallback request'
    );

    if (error) throw error;
    return rows<JsonMap>(data).map(normalizeProduct);
  } catch (fallbackError) {
    logSupabaseError('Farmer products could not load', fallbackError);
    return [];
  }
}

export async function createFarmerProduct(farmer: FarmerProfile, product: Partial<Product>) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Sign in before creating farmer products.');

  if (farmer.user_id && farmer.user_id !== user.id) {
    throw new Error('This farmer profile does not belong to the signed-in user.');
  }

  const { error } = await supabase.from('products').insert({
    name: product.name,
    description: product.description || null,
    price: product.price || 0,
    unit: product.unit || 'each',
    image_url: product.image_url || null,
    stock_quantity: product.stock_quantity ?? 0,
    is_available: (product.stock_quantity ?? 0) > 0,
    category: product.category || 'Vegetables',
    is_organic: product.is_organic ?? false,
    is_local: product.is_local ?? true,
    farmer_id: farmer.id,
    farmer_name: farmer.farmer_name,
    farm_name: farmer.farm_name,
    parish: farmer.parish,
    approval_status: 'pending',
    platform_commission_percent: 10,
    product_status: 'available'
  });
  if (error) throw error;
}

export async function fetchFarmerOrderSummaries(farmerId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('order_items').select('order_id, product_name, quantity, line_total, farmer_earning_amount, farmer_id, created_at').eq('farmer_id', farmerId).order('created_at', { ascending: false }).limit(80);
  if (error) return [];
  return rows<FarmerOrderSummary>(data);
}

export async function fetchFarmerPayouts(farmerId?: string) {
  const supabase = getSupabaseBrowserClient();
  let query = supabase.from('farmer_payouts').select('id, farmer_id, order_id, gross_amount, commission_amount, net_amount, payout_status, payout_method, payout_reference, released_at, created_at').order('created_at', { ascending: false });
  if (farmerId) query = query.eq('farmer_id', farmerId);
  const { data, error } = await query;
  if (error) return [];
  return rows<FarmerPayout>(data);
}


