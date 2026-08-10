"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQuantity: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "fc-cart-v1";

/**
 * Client-side cart persisted to localStorage, so guests can browse and add
 * items before signing in to check out (orders require an account).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once. Persisting is gated on `hydrated` so the
  // initial effect run can never overwrite a stored cart with an empty one.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* corrupt cart — start fresh */
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full/unavailable */
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + qty, 99) }
            : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((productId: number, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(qty, 99) } : i
          )
    );
  }, []);

  const remove = useCallback(
    (productId: number) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
    []
  );
  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((n, i) => n + i.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, count, subtotal, add, setQuantity, remove, clear, open, setOpen }),
    [items, count, subtotal, add, setQuantity, remove, clear, open]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
