import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (product_id: string) => void;
  setQty: (product_id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartCtx | null>(null);
const STORAGE_KEY = "eg_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => ({
    items,
    add: (item, qty = 1) => setItems((prev) => {
      const found = prev.find((i) => i.product_id === item.product_id);
      if (found) return prev.map((i) => i.product_id === item.product_id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...item, qty }];
    }),
    remove: (id) => setItems((prev) => prev.filter((i) => i.product_id !== id)),
    setQty: (id, qty) => setItems((prev) => qty <= 0 ? prev.filter((i) => i.product_id !== id) : prev.map((i) => i.product_id === id ? { ...i, qty } : i)),
    clear: () => setItems([]),
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function formatPKR(n: number) {
  return "PKR " + new Intl.NumberFormat("en-PK").format(Math.round(n));
}
