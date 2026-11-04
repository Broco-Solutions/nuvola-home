
import type { Metadata } from "next";
import Link from "next/link";
import Stripe from "stripe";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { ClearCartAfterPayment } from "@/components/clear-cart-after-payment";
import styles from "../../cart/cart.module.css";

export const metadata: Metadata = {
  title: "Payment Confirmation | Nuvola Home",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type CheckoutResult = {
  status: "paid" | "pending" | "unavailable";
  fulfillmentMode: "pickup" | "shipping" | null;
};

type PageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
};

async function getCheckoutResult(
  sessionId: string | undefined,
): Promise<CheckoutResult> {
  const fallback: CheckoutResult = {
    status: "unavailable",
    fulfillmentMode: null,
  };

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (
    !secretKey?.startsWith("sk_live_") ||
    !sessionId?.startsWith("cs_live_")
  ) {
    return fallback;
  }

  try {
    const stripe = new Stripe(secretKey);

    const session =
      await stripe.checkout.sessions.retrieve(sessionId);

    if (
      !session.livemode ||
      session.mode !== "payment" ||
      session.metadata?.website !== "nuvola-home" ||
      session.metadata?.checkout_mode !== "live"
    ) {
      return fallback;
    }

    const fulfillmentMode =
      session.metadata?.fulfillment_mode === "shipping"
        ? "shipping"
        : session.metadata?.fulfillment_mode === "pickup"
          ? "pickup"
          : null;

    if (
      session.status === "complete" &&
      session.payment_status === "paid"
    ) {
      return {
        status: "paid",
        fulfillmentMode,
      };
    }

    return {
      status: "pending",
      fulfillmentMode,
    };
  } catch {
    return fallback;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const sessionId =
    typeof params.session_id === "string"
      ? params.session_id
      : undefined;

  const result = await getCheckoutResult(sessionId);

  const paid = result.status === "paid";
  const pending = result.status === "pending";

  const Icon = paid
    ? CheckCircle2
    : pending
      ? Clock3
      : AlertCircle;

  const title = paid
    ? "Payment received."
    : pending
      ? "Payment processing."
      : "Unable to verify payment.";

  const description = paid
    ? result.fulfillmentMode === "pickup"
      ? "Your payment has been confirmed. Our team will coordinate collection of your furniture."
      : "Your payment has been confirmed. Our team will follow up regarding your order."
    : pending
      ? "Your payment has not been confirmed yet. Please check its status before placing another order."
      : "We could not verify this payment. Please contact Nuvola Home if you believe you were charged.";

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.emptyState}>
          {paid && <ClearCartAfterPayment />}

          <div className={styles.emptyIcon}>
            <Icon size={40} strokeWidth={1.2} />
          </div>

          <p className={styles.eyebrow}>
            {paid
              ? "PAYMENT CONFIRMED"
              : pending
                ? "PAYMENT STATUS"
                : "PAYMENT VERIFICATION"}
          </p>

          <h1
            style={{
              fontSize: "clamp(45px, 6vw, 72px)",
              fontWeight: 400,
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>

          <p>{description}</p>

          <Link
            href={paid ? "/shop" : "/contact"}
            className={styles.primaryButton}
          >
            {paid
              ? "Continue Shopping"
              : "Contact Nuvola Home"}
            <ArrowRight size={18} />
          </Link>

          {!paid && (
            <p>
              Please avoid submitting another payment
              until the previous attempt has been checked.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
