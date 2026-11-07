
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/data/products";
import styles from "./cart.module.css";

type CheckoutResponse = {
  url?: string;
  sessionId?: string;
  error?: string;
};

export default function CartPage() {
  const {
    items,
    count,
    subtotal,
    removeItem,
    updateQuantity,
    clearCart,
    rememberCheckout,
  } = useCart();

  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(
    null,
  );

  const isEmpty = items.length === 0;
  const checkoutRequest = useRef<{ cart: string; id: string } | null>(null);
  const checkoutInFlight = useRef(false);

  useEffect(() => {
    function resumeCart(event: PageTransitionEvent) {
      if (!event.persisted) return;
      checkoutInFlight.current = false;
      setProcessing(false);
    }
    window.addEventListener("pageshow", resumeCart);
    return () => window.removeEventListener("pageshow", resumeCart);
  }, []);

  async function handleCheckout() {
    if (checkoutInFlight.current || isEmpty) return;

    checkoutInFlight.current = true;
    setProcessing(true);
    setCheckoutError(null);

    try {
      const purchased = items.map(({ slug, quantity }) => ({ slug, quantity }));
      const body = JSON.stringify({ items: purchased });
      if (checkoutRequest.current?.cart !== body) {
        checkoutRequest.current = { cart: body, id: crypto.randomUUID() };
      }
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutRequest.current.id,
        },
        body,
      });

      const data: CheckoutResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Unable to initialize checkout.",
        );
      }

      if (typeof data.url !== "string" || typeof data.sessionId !== "string" ||
        !/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(data.sessionId)) {
        throw new Error("Invalid checkout response.");
      }

      const checkoutUrl = new URL(data.url);

      if (
        checkoutUrl.protocol !== "https:" ||
        checkoutUrl.hostname !== "checkout.stripe.com" ||
        checkoutUrl.username || checkoutUrl.password || checkoutUrl.port
      ) {
        throw new Error("Invalid checkout destination.");
      }

      rememberCheckout(data.sessionId, purchased);
      window.location.assign(checkoutUrl.href);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setProcessing(false);
      checkoutInFlight.current = false;
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span aria-current="page">Shopping Bag</span>
        </nav>

        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>YOUR SELECTION</p>
            <h1>
              Shopping Bag<span>.</span>
            </h1>
          </div>

          {!isEmpty && (
            <span className={styles.itemCount}>
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {isEmpty ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ShoppingBag size={38} strokeWidth={1.1} />
            </div>

            <h2>Your bag is empty.</h2>

            <p>
              Discover thoughtfully selected furniture
              designed to make every space feel like home.
            </p>

            <Link href="/shop" className={styles.primaryButton}>
              Explore Collection
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            <div className={styles.cartContent}>
              <div className={styles.itemsHeader}>
                <span>PRODUCT</span>
                <span>TOTAL</span>
              </div>

              <div className={styles.itemList}>
                {items.map((item) => (
                  <article className={styles.item} key={item.slug}>
                    <Link
                      href={`/products/${item.slug}`}
                      className={styles.imageLink}
                      aria-label={`View ${item.name}`}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={160}
                          height={160}
                          className={styles.productImage}
                        />
                      ) : (
                        <ShoppingBag size={32} strokeWidth={1.2} />
                      )}
                    </Link>

                    <div className={styles.itemDetails}>
                      <Link
                        href={`/products/${item.slug}`}
                        className={styles.productName}
                      >
                        {item.name}
                      </Link>

                      <span className={styles.unitPrice}>
                        {formatPrice(item.price, item.currency)}
                      </span>

                      <div className={styles.itemActions}>
                        <div
                          className={styles.quantityControl}
                          aria-label={`Quantity for ${item.name}`}
                        >
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                              updateQuantity(
                                item.slug,
                                item.quantity - 1,
                              )
                            }
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus size={15} />
                          </button>

                          <span aria-live="polite">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={
                              processing || item.quantity >= 99
                            }
                            onClick={() =>
                              updateQuantity(
                                item.slug,
                                item.quantity + 1,
                              )
                            }
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={processing}
                          className={styles.removeButton}
                          onClick={() => removeItem(item.slug)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={16} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.lineTotal}>
                      {formatPrice(
                        item.price * item.quantity,
                        item.currency,
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.cartFooter}>
                <Link href="/shop" className={styles.continueLink}>
                  <ArrowLeft size={17} />
                  Continue Shopping
                </Link>

                <button
                  type="button"
                  className={styles.clearButton}
                  disabled={processing}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to clear your shopping bag?",
                      )
                    ) {
                      clearCart();
                      setCheckoutError(null);
                    }
                  }}
                >
                  Clear Bag
                </button>
              </div>
            </div>

            <aside className={styles.summary}>
              <p className={styles.summaryEyebrow}>
                YOUR ORDER
              </p>

              <h2>Order Summary</h2>

              <div className={styles.summaryRow}>
                <span>
                  Subtotal ({count}{" "}
                  {count === 1 ? "item" : "items"})
                </span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.summaryTotal}>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <p className={styles.summaryNote}>
                Taxes are calculated during secure checkout.
                Final amounts will be shown before payment.
              </p>

              <button
                type="button"
                className={styles.checkoutButton}
                onClick={handleCheckout}
                disabled={processing}
                aria-busy={processing}
              >
                {processing
                  ? "Redirecting to Stripe..."
                  : "Secure Checkout"}

                {!processing && <ArrowRight size={18} />}
              </button>

              {checkoutError && (
                <p
                  role="alert"
                  className={styles.checkoutNotice}
                  style={{ color: "#9a3838" }}
                >
                  {checkoutError}
                </p>
              )}

              <p className={styles.checkoutNotice}>
                Payments are processed securely by Stripe.
              </p>

              <div className={styles.summaryHelp}>
                <p>Questions about your selection?</p>

                <Link href="/contact">
                  Contact Nuvola Home
                  <ArrowRight size={15} />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
