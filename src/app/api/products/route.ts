import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PRODUCT_COLUMNS = [
  'id',
  'name',
  'category',
  'description',
  'price',
  'unit',
  'image_url',
  'stock_quantity',
  'is_available',
  'approval_status',
  'product_status',
  'ready_soon',
  'is_local',
  'is_organic',
  'is_deal_of_day',
  'created_at',
].join(',');

function env(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing ${name}`);
  }

  return value.trim();
}

async function getProducts(strict: boolean) {
  const supabaseUrl = env('NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  const anonKey = env('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const url = new URL(`${supabaseUrl}/rest/v1/products`);

  url.searchParams.set('select', PRODUCT_COLUMNS);
  url.searchParams.set('order', 'created_at.desc');
  url.searchParams.set('limit', '150');

  if (strict) {
    url.searchParams.set('is_available', 'eq.true');
    url.searchParams.set('approval_status', 'eq.approved');
    url.searchParams.set('product_status', 'eq.available');
    url.searchParams.set('ready_soon', 'eq.false');
    url.searchParams.set('stock_quantity', 'gt.0');
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Products request failed with ${response.status}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const strictProducts = await getProducts(true);

    if (Array.isArray(strictProducts) && strictProducts.length > 0) {
      return NextResponse.json({
        products: strictProducts,
        source: 'strict',
      });
    }

    const fallbackProducts = await getProducts(false);

    return NextResponse.json({
      products: Array.isArray(fallbackProducts) ? fallbackProducts : [],
      source: 'fallback',
    });
  } catch (error) {
    console.error('API products route failed:', error);

    return NextResponse.json(
      {
        products: [],
        source: 'error',
        error: error instanceof Error ? error.message : 'Products could not load.',
      },
      { status: 200 },
    );
  }
}
