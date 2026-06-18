'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import type { Product } from '@/lib/types';
import {
  addCloudCartItem,
  calculateCartSubtotal,
  clearCloudCartItems,
  clearGuestCartLines,
  fetchCloudCartLines,
  getGuestCartLines,
  mergeGuestCartIntoCloud,
  removeCloudCartItem,
  saveGuestCartLines,
  updateCloudCartQuantity,
  type CartLine,
} from '../../lib/cloud-cart';

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  syncing: boolean;
  error: string;
  isCloudCart: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function mergeLocalLine(lines: CartLine[], product: Product, quantity: number) {
  const productId = String(product.id || '');
  const safeQuantity = Math.max(1, Math.floor(Number(quantity || 1)));

  if (!productId) return lines;

  const exists = lines.some((line) => String(line.product.id) === productId);

  if (exists) {
    return lines.map((line) =>
      String(line.product.id) === productId
        ? { ...line, quantity: Number(line.quantity || 0) + safeQuantity }
        : line,
    );
  }

  return [...lines, { product, quantity: safeQuantity }];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const isCloudCart = Boolean(user);

  const loadCloudCart = useCallback(async () => {
    setSyncing(true);
    setError('');

    try {
      await mergeGuestCartIntoCloud('website');
      const cloudLines = await fetchCloudCartLines();
      setLines(cloudLines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cloud cart failed to load.');
      setLines(getGuestCartLines());
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  const loadGuestCart = useCallback(() => {
    setError('');
    setLines(getGuestCartLines());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);

    if (user) {
      void loadCloudCart();
      return;
    }

    loadGuestCart();
  }, [authLoading, user, loadCloudCart, loadGuestCart]);

  const count = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0),
    [lines],
  );

  const subtotal = useMemo(() => calculateCartSubtotal(lines), [lines]);

  const refreshCart = useCallback(async () => {
    if (user) {
      await loadCloudCart();
      return;
    }

    loadGuestCart();
  }, [user, loadCloudCart, loadGuestCart]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      const safeQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
      setError('');

      if (!user) {
        setLines((current) => {
          const next = mergeLocalLine(current, product, safeQuantity);
          saveGuestCartLines(next);
          return next;
        });
        return;
      }

      setLines((current) => mergeLocalLine(current, product, safeQuantity));
      setSyncing(true);

      try {
        await addCloudCartItem(product, safeQuantity, 'website');
        const cloudLines = await fetchCloudCartLines();
        setLines(cloudLines);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add item to your cloud cart.');
        await refreshCart();
      } finally {
        setSyncing(false);
      }
    },
    [user, refreshCart],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const cleanProductId = String(productId || '');
      const safeQuantity = Math.floor(Number(quantity || 0));

      if (!cleanProductId) return;

      setError('');

      if (!user) {
        setLines((current) => {
          const next =
            safeQuantity <= 0
              ? current.filter((line) => String(line.product.id) !== cleanProductId)
              : current.map((line) =>
                  String(line.product.id) === cleanProductId
                    ? { ...line, quantity: safeQuantity }
                    : line,
                );

          saveGuestCartLines(next);
          return next;
        });
        return;
      }

      setLines((current) =>
        safeQuantity <= 0
          ? current.filter((line) => String(line.product.id) !== cleanProductId)
          : current.map((line) =>
              String(line.product.id) === cleanProductId
                ? { ...line, quantity: safeQuantity }
                : line,
            ),
      );

      setSyncing(true);

      try {
        await updateCloudCartQuantity(cleanProductId, safeQuantity);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update your cloud cart.');
        await refreshCart();
      } finally {
        setSyncing(false);
      }
    },
    [user, refreshCart],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      await updateQuantity(productId, 0);
    },
    [updateQuantity],
  );

  const clearCart = useCallback(async () => {
    setError('');
    setLines([]);

    if (!user) {
      clearGuestCartLines();
      return;
    }

    setSyncing(true);

    try {
      await clearCloudCartItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear your cloud cart.');
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotal,
      loading,
      syncing,
      error,
      isCloudCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
    }),
    [
      lines,
      count,
      subtotal,
      loading,
      syncing,
      error,
      isCloudCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider.');
  }

  return context;
}
