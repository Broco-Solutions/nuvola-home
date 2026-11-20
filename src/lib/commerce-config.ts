import type { Product } from "@/data/products";
import { authorizedProducts, isBedSize } from "@/config/commerce";
import { siteConfig } from "@/config/site";

export function getApprovedProductSlugs(): Set<string> {
  return new Set(authorizedProducts.map((product) => product.slug));
}

export function isProductApproved(product: Product): boolean {
  return authorizedProducts.some((approved) =>
    approved.slug === product.slug && Number.isSafeInteger(approved.unitAmount) &&
    approved.unitAmount >= 50 && approved.unitAmount === Math.round(product.price * 100) &&
    (product.subcategory !== "Beds" || Boolean(approved.sizes?.length && approved.sizes.every(isBedSize))),
  );
}

export function getStripeConfiguration() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const match = secretKey?.match(/^(?:sk|rk)_(test|live)_[A-Za-z0-9]+$/);

  if (!secretKey || !match) return null;

  const livemode = match[1] === "live";
  if (livemode && (
    process.env.NODE_ENV !== "production" ||
    (process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== "production") ||
    (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "production")
  )) return null;

  return { secretKey, livemode };
}

function isTestOrigin(url: URL): boolean {
  if (process.env.NODE_ENV !== "production" && url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return true;

  // Trust deployment URLs supplied by Vercel, never an arbitrary Host/Origin.
  return url.protocol === "https:" && [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .some((host) => host && /^[a-z0-9-]+\.vercel\.app$/i.test(host) && url.host === host);
}

export function getCheckoutConfiguration(requestUrl?: string) {
  const stripe = getStripeConfiguration();
  if (!stripe) return null;

  let siteOrigin: string = siteConfig.url;
  if (!stripe.livemode && requestUrl) {
    try {
      const url = new URL(requestUrl);
      if (!url.username && !url.password && isTestOrigin(url)) siteOrigin = url.origin;
    } catch {
      return null;
    }
  }

  return { ...stripe, siteOrigin };
}
