
import type { Metadata } from "next";
import Link from "next/link";
import { getCheckoutResult } from "@/lib/stripe-payment";
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

type PageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const sessionId =
    typeof params.session_id === "string"
      ? params.session_id
      : undefined;

  const result = await getCheckoutResult(sessionId);

  const paid = result === "paid";
  const pending = result === "pending";
  const failed = result === "failed";

  const Icon = paid
    ? CheckCircle2
    : pending
      ? Clock3
      : AlertCircle;

  const title = paid
    ? "Payment received."
    : pending
      ? "Payment processing."
      : failed ? "Payment not completed." : "Unable to verify payment.";

  const description = paid
    ? "Your payment has been confirmed. Our team will follow up regarding your order."
    : pending
      ? "Your payment has not been confirmed yet. Please check its status before placing another order."
      : failed ? "This payment attempt was unsuccessful or has expired. Contact Nuvola Home if you need assistance."
        : "We could not verify this payment. Please contact Nuvola Home if you believe you were charged.";

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.emptyState}>
          {paid && sessionId && <ClearCartAfterPayment sessionId={sessionId} />}

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

          {pending && sessionId && (
            <a className={styles.continueLink} href={`/checkout/success?session_id=${encodeURIComponent(sessionId)}`}>
              Check payment status
            </a>
          )}

          <Link
            href={paid ? "/shop" : "/contact"}
            className={styles.primaryButton}
          >
            {paid
              ? "Continue Shopping"
              : "Contact Nuvola Home"}
            <ArrowRight size={18} />
          </Link>

          {!paid && !failed && (
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
