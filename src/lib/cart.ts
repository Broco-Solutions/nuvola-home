import { getProductBySlug, type CatalogProduct } from "@/data/products";
import { isBedSize, isProductSizeValid, type BedSize } from "@/config/commerce";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  currency: "USD";
  image: string;
  quantity: number;
  size?: BedSize;
};

export type PurchasedItem = Pick<CartItem, "slug" | "quantity" | "size">;
export const MAX_CART_ITEMS = 50;
export const MAX_CART_QUANTITY = 99;

export function hasUnsupportedVariant(value: object): boolean {
  return "variant" in value || "variantId" in value;
}

export function getCartItemKey(item: Pick<CartItem, "slug" | "size">): string {
  return item.size ? `${item.slug}::${item.size}` : item.slug;
}

export function toCartItem(product: CatalogProduct, quantity: number, size?: BedSize): CartItem {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    currency: product.currency,
    image: product.images[0] ?? "",
    quantity,
    ...(size ? { size } : {}),
  };
}

export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: CartItem[] = [];

  for (const entry of value.slice(0, MAX_CART_ITEMS)) {
    if (typeof entry !== "object" || entry === null ||
      typeof entry.slug !== "string" ||
      !Number.isInteger(entry.quantity) || entry.quantity < 1 || hasUnsupportedVariant(entry)) continue;

    const product = getProductBySlug(entry.slug);
    const size = entry.size;
    if ((size !== undefined && !isBedSize(size)) || !product || !isProductSizeValid(product, size)) continue;
    const key = getCartItemKey({ slug: product.slug, size });
    if (seen.has(key)) continue;
    seen.add(key);
    // Local storage is untrusted and may contain stale prices or image URLs.
    items.push(toCartItem(product, Math.min(entry.quantity, MAX_CART_QUANTITY), size));
  }

  return items;
}

export function subtractPurchasedItems(items: CartItem[], purchased: PurchasedItem[]): CartItem[] {
  const quantities = new Map(purchased.map((item) => [getCartItemKey(item), item.quantity]));
  return items.flatMap((item) => {
    const quantity = item.quantity - (quantities.get(getCartItemKey(item)) ?? 0);
    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
}
