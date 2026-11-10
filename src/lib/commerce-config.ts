import type { Product } from "@/data/products";

export function getApprovedProductSlugs(): Set<string> {
  return new Set(
    (process.env.NUVOLA_APPROVED_PRODUCT_SLUGS ?? "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean),
  );
}

export function isProductApproved(product: Product): boolean {
  // The captured catalog has no selectable Queen/King variant.
  return product.subcategory !== "Beds" && getApprovedProductSlugs().has(product.slug);
}

export function getStripeConfiguration() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const match = secretKey?.match(/^(?:sk|rk)_(test|live)_[A-Za-z0-9]+$/);

  if (!secretKey || !match) return null;

  return { secretKey, livemode: match[1] === "live" };
}

export function getCheckoutConfiguration() {
  const stripe = getStripeConfiguration();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret?.startsWith("whsec_")) return null;

  // Test keys work locally and on previews. Live creation requires an explicit
  // opt-in and must never run in next dev or a Vercel preview/development deploy.
  if (stripe.livemode && (
    process.env.NODE_ENV !== "production" ||
    process.env.STRIPE_LIVE_CHECKOUT_ENABLED !== "true" ||
    (process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== "production")
  )) return null;

  try {
    const url = new URL(process.env.NUVOLA_SITE_URL ?? "");
    const localTest = !stripe.livemode &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

    if (
      (url.protocol !== "https:" && !localTest) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/"
    ) return null;

    return { ...stripe, siteOrigin: url.origin };
  } catch {
    return null;
  }
}
