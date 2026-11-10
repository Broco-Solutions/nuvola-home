import { getProductBySlug, type CatalogProduct } from "@/data/products";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  currency: "USD";
  image: string;
  quantity: number;
};

export type PurchasedItem = Pick<CartItem, "slug" | "quantity">;
export const MAX_CART_ITEMS = 50;
export const MAX_CART_QUANTITY = 99;

export function toCartItem(product: CatalogProduct, quantity: number): CartItem {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    currency: product.currency,
    image: product.images[0] ?? "",
    quantity,
  };
}

export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: CartItem[] = [];

  for (const entry of value.slice(0, MAX_CART_ITEMS)) {
    if (typeof entry !== "object" || entry === null ||
      typeof entry.slug !== "string" || seen.has(entry.slug) ||
      !Number.isInteger(entry.quantity) || entry.quantity < 1) continue;

    const product = getProductBySlug(entry.slug);
    if (!product) continue;
    seen.add(product.slug);
    // Local storage is untrusted and may contain stale prices or image URLs.
    items.push(toCartItem(product, Math.min(entry.quantity, MAX_CART_QUANTITY)));
  }

  return items;
}

export function subtractPurchasedItems(items: CartItem[], purchased: PurchasedItem[]): CartItem[] {
  const quantities = new Map(purchased.map((item) => [item.slug, item.quantity]));
  return items.flatMap((item) => {
    const quantity = item.quantity - (quantities.get(item.slug) ?? 0);
    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
}
