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
import type { CartLine, Product } from '@/lib/types';
import { canAddToCart, effectivePrice } from '@/lib/product';

const CART_KEY = 'harvest-place-ja-cart-v1';

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function getProductId(product: Product) {
  return String(product.id);
}

function clampQuantity(product: Product, quantity: number) {
  const stockQuantity = Number(product.stock_quantity || 0);
  const safeQuantity = Math.max(1, Number(quantity || 1));

  if (stockQuantity <= 0) return 1;

  return Math.min(stockQuantity, safeQuantity);
}

function readStoredCart(): CartLine[] {
  try {
    const stored = window.localStorage.getItem(CART_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored) as CartLine[];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((line) => {
      return line?.product?.id && Number(line.quantity || 0) > 0;
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      // Local storage may be blocked in some browser modes.
    }
  }, [lines, hydrated]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    if (!canAddToCart(product)) return;

    setLines((current) => {
      const productId = getProductId(product);
      const found = current.find((line) => getProductId(line.product) === productId);

      if (found) {
        return current.map((line) => {
          if (getProductId(line.product) !== productId) return line;

          return {
            ...line,
            product,
            quantity: clampQuantity(product, line.quantity + quantity),
          };
        });
      }

      return [
        ...current,
        {
          product,
          quantity: clampQuantity(product, quantity),
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const safeProductId = String(productId);

    setLines((current) =>
      current.flatMap((line) => {
        if (getProductId(line.product) !== safeProductId) return [line];

        if (quantity <= 0) return [];

        return [
          {
            ...line,
            quantity: clampQuantity(line.product, quantity),
          },
        ];
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    const safeProductId = String(productId);

    setLines((current) =>
      current.filter((line) => getProductId(line.product) !== safeProductId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const count = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  }, [lines]);

  const subtotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      return sum + Number(effectivePrice(line.product) || 0) * Number(line.quantity || 0);
    }, 0);
  }, [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [lines, count, subtotal, addToCart, updateQuantity, removeFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}