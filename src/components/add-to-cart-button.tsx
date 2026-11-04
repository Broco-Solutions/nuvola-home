
"use client";

import Link from "next/link";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { CatalogProduct } from "@/data/products";

type AddToCartButtonProps = {
  product: CatalogProduct;
};

export function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const cartItem = items.find(
    (item) => item.slug === product.slug,
  );

  const quantity = cartItem?.quantity ?? 0;
  const atLimit = quantity >= 99;

  function handleAddToCart() {
    if (atLimit) return;

    addItem(product);
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
      <button
        type="button"
        className="button dark full-button"
        onClick={handleAddToCart}
        disabled={atLimit}
        style={{
          cursor: atLimit ? "not-allowed" : "pointer",
        }}
      >
        <ShoppingBag size={17} strokeWidth={1.5} />

        {atLimit
          ? "Maximum quantity in bag"
          : "Add to Bag"}
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
            Added to your bag
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
