
import Stripe from "stripe";
import { getProductBySlug } from "@/data/products";

export const runtime = "nodejs";

const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;
const MAX_BODY_SIZE = 16_384;

type CartItemInput = {
  slug: string;
  quantity: number;
};

type FulfillmentMode = "pickup" | "shipping";

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
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= MAX_QUANTITY
  );
}

function getApprovedProducts(): Set<string> {
  return new Set(
    (process.env.NUVOLA_APPROVED_PRODUCT_SLUGS ?? "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean),
  );
}

function getFulfillmentMode(): FulfillmentMode | null {
  const mode = process.env.NUVOLA_FULFILLMENT_MODE;

  if (mode === "pickup" || mode === "shipping") {
    return mode;
  }

  return null;
}

export async function POST(request: Request) {
  // Never start real payments from a development server.
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.STRIPE_LIVE_CHECKOUT_ENABLED !== "true"
  ) {
    return jsonError(
      "Online checkout is temporarily unavailable.",
      503,
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (
    !secretKey?.startsWith("sk_live_") ||
    !webhookSecret?.startsWith("whsec_")
  ) {
    console.error("Stripe Live configuration is incomplete.");

    return jsonError(
      "Payment configuration is unavailable.",
      503,
    );
  }

  if (process.env.STRIPE_TAX_READY !== "true") {
    return jsonError(
      "Tax configuration is not ready.",
      503,
    );
  }

  const fulfillmentMode = getFulfillmentMode();

  if (!fulfillmentMode) {
    return jsonError(
      "Delivery or pickup must be configured.",
      503,
    );
  }

  const shippingRateId =
    process.env.NUVOLA_SHIPPING_RATE_ID?.trim();

  if (
    fulfillmentMode === "shipping" &&
    !shippingRateId?.startsWith("shr_")
  ) {
    return jsonError(
      "Shipping is not configured.",
      503,
    );
  }

  const siteUrl = process.env.NUVOLA_SITE_URL;

  let siteOrigin: string;

  try {
    if (!siteUrl) throw new Error("Missing URL");

    const parsed = new URL(siteUrl);

    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== "/"
    ) {
      throw new Error("Invalid production URL");
    }

    siteOrigin = parsed.origin;
  } catch {
    return jsonError(
      "Invalid production website configuration.",
      503,
    );
  }

  // Browser requests must originate from the official site.
  if (request.headers.get("origin") !== siteOrigin) {
    return jsonError("Invalid request origin.", 403);
  }

  const contentType = request.headers.get("content-type");

  if (!contentType?.startsWith("application/json")) {
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
    contentLength > MAX_BODY_SIZE
  ) {
    return jsonError("Request is too large.", 413);
  }

  let payload: unknown;

  try {
    const rawBody = await request.text();

    if (rawBody.length > MAX_BODY_SIZE) {
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

  const approvedProducts = getApprovedProducts();

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

    if (!Number.isSafeInteger(totalCents)) {
      return jsonError("Invalid order amount.", 400);
    }

    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
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

    // Only immediately confirmed card payments.
    allowed_payment_method_types: ["card"],

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
      checkout_mode: "live",
      fulfillment_mode: fulfillmentMode,
    },

    payment_intent_data: {
      metadata: {
        website: "nuvola-home",
        fulfillment_mode: fulfillmentMode,
      },
    },
  };

  if (fulfillmentMode === "shipping" && shippingRateId) {
    params.shipping_address_collection = {
      allowed_countries: ["US"],
    };

    params.shipping_options = [
      {
        shipping_rate: shippingRateId,
      },
    ];
  }

  try {
    const stripe = new Stripe(secretKey);

    const session =
      await stripe.checkout.sessions.create(params);

    if (!session.url || !session.livemode) {
      return jsonError(
        "Unable to initialize live checkout.",
        502,
      );
    }

    return Response.json(
      { url: session.url },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Nuvola checkout error:",
      error instanceof Error
        ? error.message
        : "Unknown Stripe error",
    );

    return jsonError(
      "We could not start checkout. Please try again later.",
      502,
    );
  }
}
