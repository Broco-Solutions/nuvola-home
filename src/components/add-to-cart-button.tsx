
"use client";

import Link from "next/link";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { useId, useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { CatalogProduct } from "@/data/products";
import { MAX_CART_ITEMS, MAX_CART_QUANTITY, getCartItemKey } from "@/lib/cart";
import { getProductSizes, isBedSize, isProductSizeValid, type BedSize } from "@/config/commerce";

type AddToCartButtonProps = {
  product: CatalogProduct;
};

export function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<BedSize>();
  const sizeId = useId();
  const sizes = getProductSizes(product.slug);
  const selectionReady = isProductSizeValid(product, selectedSize);

  const cartItem = items.find(
    (item) => getCartItemKey(item) === getCartItemKey({ slug: product.slug, size: selectedSize }),
  );

  const quantity = cartItem?.quantity ?? 0;
  const atLimit = quantity >= MAX_CART_QUANTITY;
  const bagFull = !cartItem && items.length >= MAX_CART_ITEMS;

  function handleAddToCart() {
    if (!selectionReady || atLimit || bagFull) return;

    addItem(product, selectedSize);
    setAdded(true);
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        width: "100%",
      }}
    >
      {product.subcategory === "Beds" && (
        <label htmlFor={sizeId} style={{ display: "grid", gap: 8, fontSize: 14 }}>
          Size
          <select
            id={sizeId}
            aria-label="Bed size"
            value={selectedSize ?? ""}
            onChange={(event) => {
              setSelectedSize(isBedSize(event.target.value) ? event.target.value : undefined);
              setAdded(false);
            }}
            style={{ padding: "12px", border: "1px solid #c8c3ba", background: "transparent", fontSize: 16, color: "inherit" }}
          >
            <option value="">Select Queen or King</option>
            {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      )}

      <button
        type="button"
        className="button dark full-button"
        onClick={handleAddToCart}
        disabled={!selectionReady || atLimit || bagFull}
        style={{
          cursor: !selectionReady || atLimit || bagFull ? "not-allowed" : "pointer",
        }}
      >
        <ShoppingBag size={17} strokeWidth={1.5} />

        {!selectionReady ? "Choose a size" : atLimit
          ? "Maximum quantity in bag"
          : bagFull ? "Shopping bag is full" : "Add to Bag"}
      </button>

      {added && (
        <div
          role="status"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 12,
            color: "#605d56",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <Check size={16} aria-hidden="true" />
            Added to your bag{selectedSize ? ` · ${selectedSize}` : ""}
          </span>

          <Link
            href="/cart"
            className="text-link"
          >
            View Bag
            <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
