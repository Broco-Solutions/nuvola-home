
"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";

export function ClearCartAfterPayment() {
  const { clearCart } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;

    cleared.current = true;
    clearCart();
  }, [clearCart]);

  return null;
}
