import Stripe from "stripe";
import { getStripeConfiguration } from "@/lib/commerce-config";

export type PaymentStatus = "paid" | "pending" | "failed" | "unavailable";

export function isNuvolaSession(session: Stripe.Checkout.Session, livemode: boolean) {
  return session.livemode === livemode &&
    session.mode === "payment" &&
    session.metadata?.website === "nuvola-home" &&
    session.metadata?.checkout_mode === (livemode ? "live" : "test");
}

export function getPaymentStatus(session: Stripe.Checkout.Session): PaymentStatus {
  if (session.status === "complete" && session.payment_status === "paid") return "paid";

  const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
  if (session.status === "expired" || intent?.status === "canceled" ||
    (intent?.status === "requires_payment_method" && intent.last_payment_error)) return "failed";

  return session.status === "complete" || intent?.status === "processing" ? "pending" : "unavailable";
}

export async function getCheckoutResult(sessionId: string | undefined): Promise<PaymentStatus> {
  const configuration = getStripeConfiguration();
  if (!configuration || !sessionId || !/^cs_(?:test|live)_[A-Za-z0-9]{1,240}$/.test(sessionId) ||
    !sessionId.startsWith(configuration.livemode ? "cs_live_" : "cs_test_")) return "unavailable";

  try {
    const stripe = new Stripe(configuration.secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
    return isNuvolaSession(session, configuration.livemode) ? getPaymentStatus(session) : "unavailable";
  } catch {
    return "unavailable";
  }
}
