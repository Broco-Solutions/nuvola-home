
import Stripe from "stripe";
import { getProductBySlug } from "@/data/products";
import { getCheckoutConfiguration, getApprovedProductSlugs } from "@/lib/commerce-config";
import { MAX_CART_ITEMS, MAX_CART_QUANTITY } from "@/lib/cart";

export const runtime = "nodejs";

const MAX_ITEMS = MAX_CART_ITEMS;
const MAX_QUANTITY = MAX_CART_QUANTITY;
const MAX_BODY_SIZE = 16_384;

type CartItemInput = {
  slug: string;
  quantity: number;
};

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isCartItem(value: unknown): value is CartItemInput {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.slug === "string" &&
    item.slug.length > 0 &&
    item.slug.length <= 128 &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= MAX_QUANTITY
  );
}

export async function POST(request: Request) {
  const configuration = getCheckoutConfiguration();
  if (!configuration) {
    return jsonError(
      "Online checkout is temporarily unavailable.",
      503,
    );
  }

  const { secretKey, siteOrigin, livemode } = configuration;

  // Browser requests must originate from the official site.
  if (request.headers.get("origin") !== siteOrigin) {
    return jsonError("Invalid request origin.", 403);
  }

  const contentType = request.headers.get("content-type");

  if (contentType?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return jsonError(
      "Content-Type must be application/json.",
      415,
    );
  }

  const contentLength = Number(
    request.headers.get("content-length") ?? "0",
  );

  if (
    !Number.isFinite(contentLength) ||
    contentLength < 0 ||
    contentLength > MAX_BODY_SIZE
  ) {
    return jsonError("Request is too large.", 413);
  }

  let payload: unknown;

  try {
    const rawBody = await request.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_SIZE) {
      return jsonError("Request is too large.", 413);
    }

    payload = JSON.parse(rawBody);
  } catch {
    return jsonError("Invalid JSON payload.", 400);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload) ||
    !("items" in payload)
  ) {
    return jsonError("Invalid cart.", 400);
  }

  const items = payload.items;

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > MAX_ITEMS
  ) {
    return jsonError("Invalid cart size.", 400);
  }

  const requestId = request.headers.get("idempotency-key");
  if (!requestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return jsonError("Invalid checkout request ID.", 400);
  }

  const approvedProducts = getApprovedProductSlugs();

  if (approvedProducts.size === 0) {
    return jsonError(
      "No products are currently approved for online purchase.",
      503,
    );
  }

  const seenProducts = new Set<string>();

  const lineItems:
    Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  let totalCents = 0;

  for (const item of items) {
    if (!isCartItem(item)) {
      return jsonError("Invalid cart item.", 400);
    }

    if (seenProducts.has(item.slug)) {
      return jsonError("Duplicate cart item.", 400);
    }

    seenProducts.add(item.slug);

    const product = getProductBySlug(item.slug);

    if (!product || !approvedProducts.has(item.slug)) {
      return jsonError(
        "One or more items are not available for online purchase.",
        400,
      );
    }

    // Bed size is not selectable in the current catalog.
    // Do not charge for an ambiguous Queen/King variant.
    if (product.subcategory === "Beds") {
      return jsonError(
        "Please contact the showroom to confirm bed size.",
        400,
      );
    }

    const unitAmount = Math.round(product.price * 100);

    if (
      !Number.isSafeInteger(unitAmount) ||
      unitAmount < 50
    ) {
      return jsonError(
        "Invalid product price configuration.",
        500,
      );
    }

    totalCents += unitAmount * item.quantity;

    if (!Number.isSafeInteger(totalCents) || totalCents > 99_999_999) {
      return jsonError("Invalid order amount.", 400);
    }

    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        tax_behavior: "exclusive",
        product_data: {
          name: product.name,
          description: product.shortDescription,
          metadata: {
            slug: product.slug,
          },
        },
      },
      quantity: item.quantity,
    });
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    ui_mode: "hosted_page",

    // This filters Stripe's dynamic methods; disabled/ineligible BNPL methods
    // are hidden by Stripe. Affirm and all other methods are excluded.
    allowed_payment_method_types: ["card", "klarna", "afterpay_clearpay"],

    line_items: lineItems,

    billing_address_collection: "required",
    phone_number_collection: {
      enabled: true,
    },
    customer_creation: "always",

    automatic_tax: {
      enabled: true,
    },

    success_url:
      `${siteOrigin}/checkout/success` +
      "?session_id={CHECKOUT_SESSION_ID}",

    cancel_url: `${siteOrigin}/cart`,

    metadata: {
      website: "nuvola-home",
      checkout_mode: livemode ? "live" : "test",
    },

    payment_intent_data: {
      metadata: {
        website: "nuvola-home",
        checkout_mode: livemode ? "live" : "test",
      },
    },
  };

  try {
    const stripe = new Stripe(secretKey);

    const session =
      await stripe.checkout.sessions.create(params, {
        idempotencyKey: `nuvola-checkout-${requestId}`,
      });

    if (!session.url || session.livemode !== livemode) {
      return jsonError(
        "Unable to initialize checkout.",
        502,
      );
    }

    return Response.json(
      { url: session.url, sessionId: session.id },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Nuvola checkout error:",
      error instanceof Stripe.errors.StripeError ? error.type : "Unknown Stripe error",
    );

    return jsonError(
      "We could not start checkout. Please try again later.",
      502,
    );
  }
}
