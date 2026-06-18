'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { effectivePrice } from '@/lib/product';
import type { Product } from '@/lib/types';

export const GUEST_CART_STORAGE_KEY = 'hpj_guest_cart_v1';

/**
 * Add older cart keys here if your previous cart provider used a different localStorage key.
 * This lets existing guest carts migrate instead of disappearing.
 */
const LEGACY_GUEST_CART_KEYS = [
  'hpj_cart_v1',
  'harvest_place_ja_cart',
  'harvest-place-ja-cart',
  'cart',
];

export type CartLine = {
  product: Product;
  quantity: number;
};

type StoredGuestLine = {
  product: Product;
  quantity: number;
};

type CloudCartRow = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  unit_price: number | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  products?: Product | Product[] | null;
};

function asProduct(value: unknown): Product | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as Product) || null;
  return value as Product;
}

export function getGuestCartLines(): CartLine[] {
  if (typeof window === 'undefined') return [];

  const allKeys = [GUEST_CART_STORAGE_KEY, ...LEGACY_GUEST_CART_KEYS];

  for (const key of allKeys) {
    const raw = window.localStorage.getItem(key);

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as StoredGuestLine[] | { lines?: StoredGuestLine[] };
      const lines = Array.isArray(parsed) ? parsed : Array.isArray(parsed.lines) ? parsed.lines : [];

      if (!lines.length) continue;

      return normalizeCartLines(lines);
    } catch {
      // Keep searching other possible keys.
    }
  }

  return [];
}

export function saveGuestCartLines(lines: CartLine[]) {
  if (typeof window === 'undefined') return;

  const normalized = normalizeCartLines(lines);
  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(normalized));
}

export function clearGuestCartLines() {
  if (typeof window === 'undefined') return;

  [GUEST_CART_STORAGE_KEY, ...LEGACY_GUEST_CART_KEYS].forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function normalizeCartLines(lines: Array<Partial<CartLine> | StoredGuestLine>): CartLine[] {
  const map = new Map<string, CartLine>();

  for (const line of lines) {
    const product = line.product as Product | undefined;
    const productId = product?.id ? String(product.id) : '';

    if (!product || !productId) continue;

    const quantity = Math.max(1, Math.floor(Number(line.quantity || 1)));

    const existing = map.get(productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      map.set(productId, { product, quantity });
    }
  }

  return Array.from(map.values());
}

export function calculateCartSubtotal(lines: CartLine[]) {
  return lines.reduce((total, line) => {
    return total + Number(effectivePrice(line.product) || 0) * Number(line.quantity || 0);
  }, 0);
}

export async function fetchCloudCartLines(): Promise<CartLine[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('cart_items')
    .select(
      `
        id,
        user_id,
        product_id,
        quantity,
        unit_price,
        source,
        created_at,
        updated_at,
        products (*)
      `,
    )
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data || []) as CloudCartRow[];

  return rows
    .map((row) => {
      const product = asProduct(row.products);

      if (!product) return null;

      return {
        product,
        quantity: Math.max(1, Math.floor(Number(row.quantity || 1))),
      };
    })
    .filter(Boolean) as CartLine[];
}

export async function addCloudCartItem(product: Product, quantity = 1, source = 'website') {
  const supabase = getSupabaseBrowserClient();
  const productId = String(product.id || '');
  const safeQuantity = Math.max(1, Math.floor(Number(quantity || 1)));

  if (!productId) throw new Error('Product ID is missing.');

  const { error } = await supabase.rpc('add_to_cart', {
    p_product_id: productId,
    p_quantity: safeQuantity,
    p_unit_price: Number(effectivePrice(product) || product.price || 0),
    p_source: source,
  });

  if (error) throw new Error(error.message);
}

export async function updateCloudCartQuantity(productId: string, quantity: number) {
  const supabase = getSupabaseBrowserClient();
  const safeQuantity = Math.floor(Number(quantity || 0));

  if (!productId) return;

  if (safeQuantity <= 0) {
    await removeCloudCartItem(productId);
    return;
  }

  const { error } = await supabase
    .from('cart_items')
    .update({
      quantity: safeQuantity,
      source: 'website',
    })
    .eq('product_id', productId);

  if (error) throw new Error(error.message);
}

export async function removeCloudCartItem(productId: string) {
  const supabase = getSupabaseBrowserClient();

  if (!productId) return;

  const { error } = await supabase.from('cart_items').delete().eq('product_id', productId);

  if (error) throw new Error(error.message);
}

export async function clearCloudCartItems() {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.rpc('clear_my_cart');

  if (error) {
    // Fallback if the RPC was not installed yet.
    const fallback = await supabase.from('cart_items').delete().gte('quantity', 0);
    if (fallback.error) throw new Error(fallback.error.message);
  }
}

export async function mergeGuestCartIntoCloud(source = 'website') {
  const guestLines = getGuestCartLines();

  if (!guestLines.length) return false;

  for (const line of guestLines) {
    await addCloudCartItem(line.product, line.quantity, source);
  }

  clearGuestCartLines();

  return true;
}
