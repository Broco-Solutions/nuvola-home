
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (
    !secretKey?.startsWith("sk_live_") ||
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

  try {
    const rawBody = await request.text();

    const stripe = new Stripe(secretKey);

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

  if (!event.livemode) {
    return Response.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        session.metadata?.website !== "nuvola-home" ||
        session.metadata?.checkout_mode !== "live"
      ) {
        break;
      }

      if (session.payment_status === "paid") {
        console.info("NUVOLA_PAYMENT_CONFIRMED", {
          eventId: event.id,
          sessionId: session.id,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          currency: session.currency,
          fulfillmentMode:
            session.metadata?.fulfillment_mode,
        });
      } else {
        console.info("NUVOLA_PAYMENT_PENDING", {
          eventId: event.id,
          sessionId: session.id,
        });
      }

      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        session.metadata?.website === "nuvola-home" &&
        session.metadata?.checkout_mode === "live"
      ) {
        console.warn("NUVOLA_PAYMENT_FAILED", {
          eventId: event.id,
          sessionId: session.id,
        });
      }

      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
