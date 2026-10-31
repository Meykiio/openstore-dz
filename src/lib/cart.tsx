import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Cart line.
 *
 * The display fields are a snapshot taken when the item was added, so the cart
 * renders instantly and survives a product being unpublished. `unitPrice` here
 * is display only: the real price is recomputed from the catalogue by
 * `place_order()` when the order is placed, so a stale snapshot can never change
 * what the buyer is charged.
 */
export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string | null;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
};

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  /** Cart is per-browser; a shopper who clears storage loses only the list. */
  ready: boolean;
};

const CartContext = createContext<CartValue | null>(null);

const STORAGE_KEY = "openstore-cart-v1";
const MAX_LINES = 50;
/** Matches the database cap in validate_order_item(). */
export const MAX_PER_LINE = 20;

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Lines saved before the cap was lowered are clamped, not refused at checkout.
    return parsed
      .filter(isCartItem)
      .slice(0, MAX_LINES)
      .map((line) => ({ ...line, quantity: Math.min(line.quantity, MAX_PER_LINE) }));
  } catch {
    return [];
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.variantId === "string" &&
    typeof v.productId === "string" &&
    typeof v.name === "string" &&
    typeof v.unitPrice === "number" &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Read after mount only: localStorage does not exist on the server and a
  // pre-hydration read would mismatch.
  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((line) => line.variantId === item.variantId);
      if (existing) {
        return current.map((line) =>
          line.variantId === item.variantId
            ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_PER_LINE) }
            : line,
        );
      }
      return [...current, { ...item, quantity: Math.min(quantity, MAX_PER_LINE) }].slice(
        0,
        MAX_LINES,
      );
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((line) => line.variantId !== variantId)
        : current.map((line) =>
            line.variantId === variantId
              ? { ...line, quantity: Math.min(quantity, MAX_PER_LINE) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((current) => current.filter((line) => line.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartValue>(() => {
    const count = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
      remove,
      clear,
      ready,
    };
  }, [items, isOpen, openCart, closeCart, add, setQuantity, remove, clear, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
