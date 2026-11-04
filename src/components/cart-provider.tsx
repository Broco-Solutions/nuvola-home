
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CatalogProduct } from "@/data/products";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  currency: "USD";
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: CatalogProduct) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "nuvola-cart-v1";
const MAX_QUANTITY = 99;
const MAX_ITEMS = 50;

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

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return EMPTY_CART;

    const validItems: CartItem[] = [];
    const seenSlugs = new Set<string>();

    for (const entry of parsed.slice(0, MAX_ITEMS)) {
      if (typeof entry !== "object" || entry === null) continue;

      const item = entry as Record<string, unknown>;

      if (
        typeof item.slug !== "string" ||
        !item.slug ||
        typeof item.name !== "string" ||
        typeof item.price !== "number" ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        item.currency !== "USD" ||
        typeof item.image !== "string" ||
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        seenSlugs.has(item.slug)
      ) {
        continue;
      }

      seenSlugs.add(item.slug);

      validItems.push({
        slug: item.slug,
        name: item.name,
        price: item.price,
        currency: "USD",
        image: item.image,
        quantity: Math.max(
          1,
          Math.min(item.quantity, MAX_QUANTITY),
        ),
      });
    }

    return validItems;
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
          {
            slug: product.slug,
            name: product.name,
            price: product.price,
            currency: product.currency,
            image: product.images[0] ?? "",
            quantity: 1,
          },
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
