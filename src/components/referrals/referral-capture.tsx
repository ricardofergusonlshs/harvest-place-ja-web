'use client';

import { useEffect } from 'react';

import {
  captureReferralCodeFromUrl,
  claimPendingReferralCode,
} from '@/lib/referrals';

export default function ReferralCapture() {
  useEffect(() => {
    captureReferralCodeFromUrl();

    void claimPendingReferralCode().catch((error) => {
      console.warn('Referral capture skipped:', error);
    });
  }, []);

  return null;
}
