
"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";

export function ClearCartAfterPayment({ sessionId }: { sessionId: string }) {
  const { completeCheckout } = useCart();
  const cleared = useRef<string | null>(null);

  useEffect(() => {
    if (cleared.current === sessionId) return;

    cleared.current = sessionId;
    completeCheckout(sessionId);
  }, [completeCheckout, sessionId]);

  return null;
}
