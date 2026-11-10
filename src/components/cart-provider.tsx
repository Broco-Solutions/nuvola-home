
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CatalogProduct } from "@/data/products";
import { normalizeCart, subtractPurchasedItems, toCartItem, MAX_CART_ITEMS, MAX_CART_QUANTITY, type CartItem, type PurchasedItem } from "@/lib/cart";
export type { CartItem } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: CatalogProduct) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  rememberCheckout: (sessionId: string, purchased: PurchasedItem[]) => void;
  completeCheckout: (sessionId: string) => void;
};

const STORAGE_KEY = "nuvola-cart-v1";
const CHECKOUT_STORAGE_KEY = "nuvola-checkout-";
const MAX_QUANTITY = MAX_CART_QUANTITY;
const MAX_ITEMS = MAX_CART_ITEMS;
const pendingCheckouts = new Map<string, PurchasedItem[]>();

const EMPTY_CART: CartItem[] = [];

let currentItems: CartItem[] = EMPTY_CART;
let initialized = false;

const listeners = new Set<() => void>();

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return EMPTY_CART;

    return normalizeCart(JSON.parse(saved));
  } catch {
    return EMPTY_CART;
  }
}

function initializeCart() {
  if (initialized || typeof window === "undefined") return;

  currentItems = readStoredCart();
  initialized = true;
}

function getSnapshot(): CartItem[] {
  initializeCart();
  return currentItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function handleStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;

  currentItems = readStoredCart();
  initialized = true;
  notifyListeners();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function saveCart(items: CartItem[]) {
  currentItems = items;
  initialized = true;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch {
      // The cart remains available in memory.
    }
  }

  notifyListeners();
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const value = useMemo<CartContextValue>(() => {
    return {
      items,

      count: items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),

      subtotal: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),

      addItem(product) {
        const current = getSnapshot();

        const existing = current.find(
          (item) => item.slug === product.slug,
        );

        if (existing) {
          saveCart(
            current.map((item) =>
              item.slug === product.slug
                ? {
                    ...item,
                    name: product.name,
                    price: product.price,
                    image: product.images[0] ?? "",
                    quantity: Math.min(
                      item.quantity + 1,
                      MAX_QUANTITY,
                    ),
                  }
                : item,
            ),
          );
          return;
        }

        if (current.length >= MAX_ITEMS) return;

        saveCart([
          ...current,
          toCartItem(product, 1),
        ]);
      },

      removeItem(slug) {
        saveCart(
          getSnapshot().filter(
            (item) => item.slug !== slug,
          ),
        );
      },

      updateQuantity(slug, quantity) {
        if (!Number.isFinite(quantity)) return;

        const normalized = Math.trunc(quantity);

        if (normalized <= 0) {
          saveCart(
            getSnapshot().filter(
              (item) => item.slug !== slug,
            ),
          );
          return;
        }

        saveCart(
          getSnapshot().map((item) =>
            item.slug === slug
              ? {
                  ...item,
                  quantity: Math.min(
                    normalized,
                    MAX_QUANTITY,
                  ),
                }
              : item,
          ),
        );
      },

      clearCart() {
        saveCart([]);
      },

      rememberCheckout(sessionId, purchased) {
        pendingCheckouts.set(sessionId, purchased);
        try {
          // Per-tab storage survives the Stripe redirect without mixing up
          // different checkouts in other tabs. No customer/payment data.
          window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY + sessionId, JSON.stringify(purchased));
        } catch {
          // Payment can proceed even if browser storage is unavailable.
        }
      },

      completeCheckout(sessionId) {
        let purchased = pendingCheckouts.get(sessionId);
        try {
          const stored = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY + sessionId);
          if (stored) purchased = normalizeCart(JSON.parse(stored));
          // Consume once: reloading an old success page must preserve new items.
          window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY + sessionId);
        } catch {
          // Without a matching checkout snapshot, preserve the cart.
        }
        pendingCheckouts.delete(sessionId);
        if (purchased) saveCart(subtractPurchasedItems(getSnapshot(), purchased));
      },
    };
  }, [items]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return context;
}
