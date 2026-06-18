'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const REFERRAL_STORAGE_KEY = 'hpj_pending_referral_code';
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.harvestplaceja.myapp';

const FALLBACK_SITE_URL = 'https://theharvestplaceja.com';

export type ReferralSummary = {
  referral_code: string;
  referral_link: string;
  points: number;
  lifetime_points: number;
  referred_join_count: number;
  referred_order_count: number;
};

function getSiteOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL;
}

function friendlyReferralError(message: string) {
  const lower = message.toLowerCase();

  if (
    lower.includes('customer_rewards.referral_code') ||
    lower.includes('referral_code does not exist') ||
    lower.includes('customer_rewards') ||
    lower.includes('schema cache')
  ) {
    return 'Referral database setup needed. Run the Supabase referral database column fix SQL, then refresh this page.';
  }

  return message;
}

export function buildReferralLink(code: string) {
  const cleanCode = code.trim().toUpperCase();
  return `${getSiteOrigin()}?ref=${encodeURIComponent(cleanCode)}`;
}

export function makeReferralCode(userId: string, email?: string | null) {
  const base = userId.replace(/-/g, '').slice(0, 8).toUpperCase();

  if (base.length >= 8) return `HPJ${base}`;

  const emailPart = (email || 'CUSTOMER')
    .split('@')[0]
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 8)
    .toUpperCase();

  return `HPJ${emailPart || 'CUSTOMER'}`;
}

export function captureReferralCodeFromUrl() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('ref');

  if (!code?.trim()) return null;

  const cleanCode = code.trim().toUpperCase();
  window.localStorage.setItem(REFERRAL_STORAGE_KEY, cleanCode);

  return cleanCode;
}

export function getPendingReferralCode() {
  if (typeof window === 'undefined') return null;

  const code = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
  return code?.trim() ? code.trim().toUpperCase() : null;
}

export function clearPendingReferralCode() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
}

export async function ensureCustomerReferralProfile(): Promise<ReferralSummary> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Please sign in to use Refer & Earn.');
  }

  const selectFields =
    'referral_code, points, lifetime_points, referred_join_count, referred_order_count';

  const { data: existing, error: existingError } = await supabase
    .from('customer_rewards')
    .select(selectFields)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (existingError) throw new Error(friendlyReferralError(existingError.message));

  if (existing?.referral_code) {
    return {
      referral_code: existing.referral_code,
      referral_link: buildReferralLink(existing.referral_code),
      points: Number(existing.points || 0),
      lifetime_points: Number(existing.lifetime_points || 0),
      referred_join_count: Number(existing.referred_join_count || 0),
      referred_order_count: Number(existing.referred_order_count || 0),
    };
  }

  const baseCode = makeReferralCode(user.id, user.email);
  const attempts = [baseCode, `${baseCode}${Math.floor(10 + Math.random() * 89)}`];

  let lastError = '';

  for (const referralCode of attempts) {
    const { data, error } = await supabase
      .from('customer_rewards')
      .insert({
        customer_id: user.id,
        referral_code: referralCode,
        points: 0,
        lifetime_points: 0,
      })
      .select(selectFields)
      .single();

    if (!error && data?.referral_code) {
      return {
        referral_code: data.referral_code,
        referral_link: buildReferralLink(data.referral_code),
        points: Number(data.points || 0),
        lifetime_points: Number(data.lifetime_points || 0),
        referred_join_count: Number(data.referred_join_count || 0),
        referred_order_count: Number(data.referred_order_count || 0),
      };
    }

    lastError = friendlyReferralError(error?.message || 'Could not create referral code.');
  }

  throw new Error(lastError || 'Could not create referral code.');
}

export async function claimPendingReferralCode() {
  const pendingCode = getPendingReferralCode();
  if (!pendingCode) return null;

  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const mySummary = await ensureCustomerReferralProfile();

  if (mySummary.referral_code.toUpperCase() === pendingCode.toUpperCase()) {
    clearPendingReferralCode();
    return { ok: false, reason: 'self_referral_blocked' };
  }

  const { data, error } = await supabase.rpc('claim_referral_code', {
    p_referral_code: pendingCode,
  });

  if (error) {
    const message = friendlyReferralError(error.message);

    if (
      message.toLowerCase().includes('already') ||
      message.toLowerCase().includes('duplicate') ||
      message.toLowerCase().includes('self')
    ) {
      clearPendingReferralCode();
      return { ok: false, reason: message };
    }

    throw new Error(message);
  }

  clearPendingReferralCode();
  return data;
}

export async function getReferralSummary() {
  await claimPendingReferralCode().catch(() => null);
  return ensureCustomerReferralProfile();
}
