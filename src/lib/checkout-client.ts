import type { PurchasedItem } from "@/lib/cart";

type CheckoutResponse = { url?: unknown; sessionId?: unknown; error?: unknown };

export async function requestCheckout(items: PurchasedItem[], requestId: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);

  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": requestId,
      },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    });
    const data: CheckoutResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Unable to initialize checkout.");
    }

    if (typeof data?.url !== "string" || typeof data.sessionId !== "string" ||
      !/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(data.sessionId)) {
      throw new Error("Invalid checkout response.");
    }

    const url = new URL(data.url);
    if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com" ||
      url.username || url.password || url.port) {
      throw new Error("Invalid checkout destination.");
    }

    return { url: url.href, sessionId: data.sessionId };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Checkout took too long to respond. Your bag is saved. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
