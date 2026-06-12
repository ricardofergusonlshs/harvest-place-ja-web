import type { JsonMap, Product } from '@/lib/types';
import { cleanHostedImageUrl, normalizeCategory } from '@/lib/format';

function isRecord(value: unknown): value is JsonMap {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function n(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function b(value: unknown, fallback = false) {
  if (value === null || value === undefined) return fallback;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') return value === 1;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    return ['true', '1', 'yes', 'y', 'active'].includes(normalized);
  }

  return fallback;
}

function s(value: unknown, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function nullableString(value: unknown) {
  const text = String(value ?? '').trim();
  return text || null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;

  const parsed = n(value, Number.NaN);

  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProductStatus(value: unknown) {
  const status = s(value, 'available').toLowerCase().replaceAll(' ', '_');

  if (status === 'ready-soon') return 'ready_soon';

  return status;
}

function normalizeApprovalStatus(value: unknown) {
  return s(value, 'approved').toLowerCase().replaceAll(' ', '_');
}

function positiveInteger(value: unknown, fallback = 0) {
  return Math.max(0, Math.trunc(n(value, fallback)));
}

function getDateTime(value: string | null | undefined) {
  if (!value) return null;

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : null;
}

function isDiscountWindowActive(product: Product) {
  const now = Date.now();

  const startsAt = getDateTime(product.discount_starts_at);
  const endsAt = getDateTime(product.discount_ends_at);

  if (startsAt !== null && now < startsAt) return false;
  if (endsAt !== null && now > endsAt) return false;

  return true;
}

export function normalizeProduct(row: JsonMap): Product {
  const categories = isRecord(row.categories) ? row.categories : {};

  const productStatus = normalizeProductStatus(row.product_status);
  const approvalStatus = normalizeApprovalStatus(row.approval_status);

  const readySoon =
    b(row.ready_soon) ||
    productStatus === 'ready_soon' ||
    productStatus === 'coming_soon';

  return {
    id: s(row.id),
    name: s(row.name, 'Product'),
    description: nullableString(row.description),

    price: Math.max(0, n(row.price)),
    unit: nullableString(row.unit),

    image_url: cleanHostedImageUrl(nullableString(row.image_url)),

    is_available:
      row.is_available === undefined || row.is_available === null
        ? true
        : b(row.is_available),

    stock_quantity: positiveInteger(row.stock_quantity),
    created_at: nullableString(row.created_at),

    category: normalizeCategory(
      row.category ??
        row.product_category ??
        row.category_name ??
        categories.name ??
        'Vegetables'
    ),

    is_organic: b(row.is_organic ?? row.organic),
    is_local:
      row.is_local === undefined || row.is_local === null
        ? true
        : b(row.is_local),

    harvest_date: nullableString(row.harvest_date),

    farmer_id: nullableString(row.farmer_id),
    farmer_name: nullableString(row.farmer_name),
    farm_name: nullableString(row.farm_name),
    parish: nullableString(row.parish),

    approval_status: approvalStatus,
    platform_commission_percent: Math.max(
      0,
      Math.min(100, n(row.platform_commission_percent, 10))
    ),

    original_price: nullableNumber(row.original_price),
    discount_price: nullableNumber(row.discount_price),
    discount_percent: nullableNumber(row.discount_percent),
    discount_label: nullableString(row.discount_label),
    discount_starts_at: nullableString(row.discount_starts_at),
    discount_ends_at: nullableString(row.discount_ends_at),
    is_discount_active: b(row.is_discount_active),

    product_status: productStatus,
    ready_soon: readySoon,
    estimated_ready_date: nullableString(row.estimated_ready_date),
    expected_stock_quantity:
      row.expected_stock_quantity === null ||
      row.expected_stock_quantity === undefined
        ? null
        : positiveInteger(row.expected_stock_quantity),

    is_deal_of_day: b(row.is_deal_of_day),
    deal_rank: positiveInteger(row.deal_rank, 999),

    subscribe_save_enabled: b(row.subscribe_save_enabled),
    subscribe_save_discount_percent: Math.max(
      0,
      Math.min(50, n(row.subscribe_save_discount_percent, 5))
    ),
  };
}

export function originalPrice(product: Product) {
  const base =
    product.original_price !== null &&
    product.original_price !== undefined &&
    product.original_price > 0
      ? product.original_price
      : product.price;

  return Math.max(base, 0);
}

export function effectivePrice(product: Product) {
  const original = originalPrice(product);

  if (!product.is_discount_active || !isDiscountWindowActive(product)) {
    return Math.max(product.price, 0);
  }

  let candidate = product.price;

  if (
    product.discount_price !== null &&
    product.discount_price !== undefined &&
    product.discount_price > 0
  ) {
    candidate = product.discount_price;
  } else if (
    product.discount_percent !== null &&
    product.discount_percent !== undefined &&
    product.discount_percent > 0
  ) {
    const percent = Math.max(0, Math.min(100, product.discount_percent));
    candidate = original * (1 - percent / 100);
  }

  return Math.max(0, Math.min(candidate, original));
}

export function hasActiveDiscount(product: Product) {
  if (!product.is_discount_active) return false;
  if (!isDiscountWindowActive(product)) return false;

  return effectivePrice(product) < originalPrice(product);
}

export function discountPercentDisplay(product: Product) {
  const original = originalPrice(product);
  const current = effectivePrice(product);

  if (!hasActiveDiscount(product) || original <= 0) return 0;

  return Math.max(0, Math.min(100, Math.round(((original - current) / original) * 100)));
}

export function isReadySoon(product: Product) {
  const status = product.product_status.toLowerCase();

  return product.ready_soon || status === 'ready_soon' || status === 'coming_soon';
}

export function isHidden(product: Product) {
  return product.product_status.toLowerCase() === 'hidden';
}

export function isArchived(product: Product) {
  return product.product_status.toLowerCase() === 'archived';
}

export function isApproved(product: Product) {
  return product.approval_status.toLowerCase() === 'approved';
}

export function isCustomerVisible(product: Product) {
  return isApproved(product) && !isHidden(product) && !isArchived(product) && !isReadySoon(product);
}

export function canAddToCart(product: Product) {
  return isCustomerVisible(product) && product.is_available && product.stock_quantity > 0;
}

export function isLowStock(product: Product) {
  return canAddToCart(product) && product.stock_quantity <= 5;
}

export function lowStockLabel(product: Product) {
  if (!isLowStock(product)) return '';

  return product.stock_quantity === 1
    ? 'Only 1 left'
    : `Only ${product.stock_quantity} left`;
}

export function showAsDealOfDay(product: Product) {
  const label = (product.discount_label ?? '').toLowerCase();

  return (
    hasActiveDiscount(product) &&
    (product.is_deal_of_day ||
      label.includes('deal of the day') ||
      label.includes('today') ||
      label.includes('daily deal'))
  );
}

export function subscribeSavePrice(product: Product) {
  const percent = Math.max(
    0,
    Math.min(50, product.subscribe_save_discount_percent || 5)
  );

  return Math.max(0, effectivePrice(product) * (1 - percent / 100));
}

export function productImageUrl(product: Product, fallback = '/logo.png') {
  return product.image_url || fallback;
}

export const PRODUCT_SELECT =
  'id, name, description, price, unit, image_url, is_available, stock_quantity, created_at, category, is_organic, is_local, harvest_date, farmer_id, farmer_name, farm_name, parish, approval_status, platform_commission_percent, original_price, discount_price, discount_percent, discount_label, discount_starts_at, discount_ends_at, is_discount_active, product_status, ready_soon, estimated_ready_date, expected_stock_quantity, is_deal_of_day, deal_rank, subscribe_save_enabled, subscribe_save_discount_percent';

export const PRODUCT_COMPAT_SELECT =
  'id, name, description, price, unit, image_url, is_available, stock_quantity, created_at';