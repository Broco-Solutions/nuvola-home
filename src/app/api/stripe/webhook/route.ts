
import Stripe from "stripe";
import { getStripeConfiguration } from "@/lib/commerce-config";
import { getPaymentStatus, isNuvolaSession } from "@/lib/stripe-payment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuration = getStripeConfiguration();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("stripe-signature");

  if (
    !configuration ||
    !webhookSecret?.startsWith("whsec_")
  ) {
    return Response.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  }

  if (!signature) {
    return Response.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  const stripe = new Stripe(configuration.secretKey);

  try {
    const rawBody = await request.text();

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return Response.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  if (event.livemode !== configuration.livemode) {
    return Response.json({ received: true });
  }

  const handledEvents = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
  ];

  if (handledEvents.includes(event.type)) {
    const snapshot = event.data.object as Stripe.Checkout.Session;
    if (!isNuvolaSession(snapshot, configuration.livemode)) {
      return Response.json({ received: true });
    }

    try {
      // Events can be retried and delivered out of order. Stripe's persisted
      // session is the source of truth, including when the customer never returns.
      const session = await stripe.checkout.sessions.retrieve(snapshot.id, { expand: ["payment_intent"] });
      if (!isNuvolaSession(session, configuration.livemode)) {
        return Response.json({ received: true });
      }
      let status = getPaymentStatus(session);
      if (status !== "paid" && event.type === "checkout.session.async_payment_failed") status = "failed";

      // Observational only: no fulfillment or email side effects to duplicate on
      // retries. Orders/receipts are managed in Stripe Dashboard (see runbook).
      const label = status === "paid" ? "CONFIRMED" : status === "failed" ? "FAILED" : "PENDING";
      console.info(`NUVOLA_PAYMENT_${label}`, {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        livemode: session.livemode,
      });
    } catch {
      // Acknowledge only after verification succeeds, so Stripe will retry.
      console.error("NUVOLA_WEBHOOK_VERIFICATION_FAILED", { eventId: event.id });
      return Response.json({ error: "Unable to verify payment." }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
