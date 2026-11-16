import Stripe from "stripe";

export function createStripeClient(secretKey: string) {
  // Keep a slow Stripe request within the function budget, including one retry.
  // Stripe retries session creation with the caller's original idempotency key.
  return new Stripe(secretKey, { timeout: 10_000, maxNetworkRetries: 1 });
}
