'use client';

import type { PropsWithChildren } from 'react';
import { AuthProvider } from '@/components/providers/auth-provider';
import { CartProvider } from '@/components/providers/cart-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}