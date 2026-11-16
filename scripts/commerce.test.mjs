import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { products } from "@/data/products";
import { authorizedProducts } from "@/config/commerce";
import { siteConfig } from "@/config/site";
import { getCheckoutConfiguration, isProductApproved } from "@/lib/commerce-config";
import { normalizeCart, subtractPurchasedItems, toCartItem } from "@/lib/cart";
import { getCheckoutResult } from "@/lib/stripe-payment";
import { requestCheckout } from "@/lib/checkout-client";
import { CartProvider, useCart } from "@/components/cart-provider";
import { POST as checkout } from "@/app/api/checkout/route";
import { POST as webhook } from "@/app/api/stripe/webhook/route";

const product = products.find((item) => item.subcategory !== "Beds");
const bed = products.find((item) => item.subcategory === "Beds");
const origin = "https://nuvola-test.vercel.app";
const webhookSecret = "whsec_localfixture";
const stripe = new Stripe("sk_test_localfixture");
const sessions = Object.getPrototypeOf(stripe.checkout.sessions);
const originalEnv = { ...process.env };
const originalAuthorizedProducts = [...authorizedProducts];

beforeEach(() => {
  Object.assign(process.env, {
    NODE_ENV: "test",
    VERCEL: "1",
    VERCEL_ENV: "preview",
    VERCEL_URL: "nuvola-test.vercel.app",
    VERCEL_BRANCH_URL: "nuvola-test-branch.vercel.app",
    STRIPE_SECRET_KEY: "sk_test_localfixture",
    STRIPE_WEBHOOK_SECRET: webhookSecret,
  });
  // Fixture approvals exist only in this isolated process, never in production.
  authorizedProducts.splice(0, authorizedProducts.length, { slug: product.slug, unitAmount: Math.round(product.price * 100) });
  // A missed mock fails immediately instead of reaching any Stripe API.
  mock.method(sessions, "create", () => { throw new Error("Unexpected Stripe create"); });
  mock.method(sessions, "retrieve", () => { throw new Error("Unexpected Stripe retrieve"); });
  mock.method(console, "info", () => {});
  mock.method(console, "error", () => {});
});

afterEach(() => {
  mock.restoreAll();
  authorizedProducts.splice(0, authorizedProducts.length, ...originalAuthorizedProducts);
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
});

function request(payload = { items: [{ slug: product.slug, quantity: 2 }] }, headers = {}) {
  return new Request(origin + "/api/checkout", {
    method: "POST",
    headers: { origin, "content-type": "application/json", "idempotency-key": randomUUID(), ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

function session(overrides = {}) {
  return {
    id: "cs_test_localfixture", object: "checkout.session", livemode: false,
    mode: "payment", status: "complete", payment_status: "paid",
    metadata: { website: "nuvola-home", checkout_mode: "test" },
    amount_total: product.price * 200, currency: "usd", payment_intent: null,
    ...overrides,
  };
}

function eventRequest(type, checkoutSession = session(), { signature, timestamp, eventLivemode } = {}) {
  const body = JSON.stringify({
    id: "evt_localfixture", object: "event", type,
    livemode: eventLivemode ?? checkoutSession.livemode, data: { object: checkoutSession },
  });
  return new Request(origin + "/api/stripe/webhook", {
    method: "POST", body,
    headers: { "stripe-signature": signature ?? stripe.webhooks.generateTestHeaderString({ payload: body, secret: webhookSecret, timestamp }) },
  });
}

test("STRIPE_SECRET_KEY is the only required application environment variable", () => {
  for (const name of ["STRIPE_WEBHOOK_SECRET", "NUVOLA_SITE_URL", "NUVOLA_APPROVED_PRODUCT_SLUGS", "STRIPE_LIVE_CHECKOUT_ENABLED"]) delete process.env[name];
  assert.equal(getCheckoutConfiguration().livemode, false);
  assert.equal(getCheckoutConfiguration().siteOrigin, siteConfig.url);
  process.env.STRIPE_SECRET_KEY = "rk_test_localfixture";
  assert.equal(getCheckoutConfiguration().livemode, false);
});

test("live keys work in production without an opt-in and are rejected in development/Preview", () => {
  process.env.STRIPE_SECRET_KEY = "sk_live_localfixture";
  assert.equal(getCheckoutConfiguration(), null);
  process.env.NODE_ENV = "production";
  assert.equal(getCheckoutConfiguration(), null);
  process.env.VERCEL_ENV = "production";
  assert.equal(getCheckoutConfiguration().livemode, true);
  assert.equal(getCheckoutConfiguration("https://attacker.example/api/checkout").siteOrigin, siteConfig.url);
  process.env.STRIPE_LIVE_CHECKOUT_ENABLED = "false";
  assert.equal(getCheckoutConfiguration().livemode, true);
  process.env.VERCEL_ENV = "development";
  assert.equal(getCheckoutConfiguration(), null);
  delete process.env.VERCEL_ENV;
  assert.equal(getCheckoutConfiguration(), null);
  delete process.env.VERCEL;
  assert.equal(getCheckoutConfiguration().livemode, true);
});

for (const url of ["https://user:pass@example.com", "https://example.com/path", "https://example.com?x=1", "https://example.com/#x", "http://example.com", "https://nuvola-test.vercel.app.attacker.example"]) {
  test(`does not trust unrecognized request origins: ${url}`, () => {
    process.env.NUVOLA_SITE_URL = url;
    assert.equal(getCheckoutConfiguration(url).siteOrigin, siteConfig.url);
  });
}

test("test redirects use only loopback or Vercel-supplied origins", () => {
  assert.equal(getCheckoutConfiguration("http://localhost:3000/api/checkout").siteOrigin, "http://localhost:3000");
  assert.equal(getCheckoutConfiguration(origin + "/api/checkout").siteOrigin, origin);
  assert.equal(getCheckoutConfiguration("https://nuvola-test-branch.vercel.app/api/checkout").siteOrigin, "https://nuvola-test-branch.vercel.app");
  assert.equal(getCheckoutConfiguration("https://another-project.vercel.app/api/checkout").siteOrigin, siteConfig.url);
  process.env.VERCEL_URL = "attacker.example";
  assert.equal(getCheckoutConfiguration("https://attacker.example/api/checkout").siteOrigin, siteConfig.url);
  process.env.STRIPE_SECRET_KEY = "sk_live_localfixture";
  assert.equal(getCheckoutConfiguration(), null);
});

test("coded approvals reject beds, price drift and environment-based authorization", async () => {
  assert.equal(isProductApproved(product), true);
  authorizedProducts.push({ slug: bed.slug, unitAmount: Math.round(bed.price * 100) });
  assert.equal(isProductApproved(bed), false);
  assert.equal((await checkout(request({ items: [{ slug: bed.slug, quantity: 1 }] }))).status, 400);
  const savedPrice = product.price;
  try {
    product.price += 1;
    assert.equal(isProductApproved(product), false);
    assert.equal((await checkout(request())).status, 400);
  } finally {
    product.price = savedPrice;
  }
  authorizedProducts.splice(0);
  process.env.NUVOLA_APPROVED_PRODUCT_SLUGS = products.map((item) => item.slug).join(",");
  assert.equal((await checkout(request())).status, 503);
  assert.equal(sessions.create.mock.callCount(), 0);
});

test("uses backend prices, cards, billing, Tax and idempotency without shipping", async () => {
  let parameters, options;
  mock.method(sessions, "create", async (params, opts) => {
    parameters = params; options = opts;
    return session({ url: "https://checkout.stripe.com/c/pay/cs_test_localfixture" });
  });
  const id = randomUUID();
  const response = await checkout(request({ items: [{ slug: product.slug, quantity: 2, price: 0.01, currency: "eur" }], shipping: 999 }, { "idempotency-key": id }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).sessionId, "cs_test_localfixture");
  assert.equal(parameters.line_items[0].price_data.unit_amount, Math.round(product.price * 100));
  assert.equal(parameters.line_items[0].price_data.currency, "usd");
  assert.equal(parameters.line_items[0].quantity, 2);
  assert.equal(parameters.line_items[0].price_data.tax_behavior, "exclusive");
  assert.deepEqual(parameters.allowed_payment_method_types, ["card"]);
  assert.equal(parameters.payment_method_types, undefined);
  assert.equal(parameters.shipping_address_collection, undefined);
  assert.equal(parameters.shipping_options, undefined);
  assert.equal(parameters.payment_intent_data.shipping, undefined);
  assert.equal(parameters.billing_address_collection, "required");
  assert.equal(parameters.automatic_tax.enabled, true);
  assert.equal(parameters.metadata.checkout_mode, "test");
  assert.equal(parameters.success_url, origin + "/checkout/success?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(parameters.cancel_url, origin + "/cart");
  assert.equal(options.idempotencyKey, `nuvola-checkout-${id}`);
});

test("production creates card sessions using only STRIPE_SECRET_KEY, without a webhook", async () => {
  Object.assign(process.env, { STRIPE_SECRET_KEY: "sk_live_localfixture", NODE_ENV: "production", VERCEL_ENV: "production" });
  for (const name of ["STRIPE_WEBHOOK_SECRET", "NUVOLA_SITE_URL", "NUVOLA_APPROVED_PRODUCT_SLUGS", "STRIPE_LIVE_CHECKOUT_ENABLED"]) delete process.env[name];
  let parameters;
  mock.method(sessions, "create", async (params) => {
    parameters = params;
    return session({ livemode: true, id: "cs_live_localfixture", url: "https://checkout.stripe.com/pay" });
  });
  const response = await checkout(new Request(siteConfig.url + "/api/checkout", {
    method: "POST", headers: { origin: siteConfig.url, "content-type": "application/json", "idempotency-key": randomUUID() },
    body: JSON.stringify({ items: [{ slug: product.slug, quantity: 1 }] }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(parameters.allowed_payment_method_types, ["card"]);
  assert.equal(parameters.automatic_tax.enabled, true);
  assert.equal(parameters.success_url, siteConfig.url + "/checkout/success?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(parameters.cancel_url, siteConfig.url + "/cart");
  assert.equal((await webhook(eventRequest("checkout.session.completed"))).status, 503);
});

test("a rejected Tax configuration never retries without automatic tax", async () => {
  mock.method(sessions, "create", async () => { throw new Stripe.errors.StripeInvalidRequestError({
    message: "Tax settings are incomplete", param: "automatic_tax[enabled]",
  }); });
  const response = await checkout(request());
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /tax settings/);
  assert.equal(sessions.create.mock.callCount(), 1);
  assert.equal(sessions.create.mock.calls[0].arguments[0].automatic_tax.enabled, true);
});

test("live credentials cannot be used for API confirmation or webhooks on Preview", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_live_localfixture";
  assert.equal(await getCheckoutResult("cs_live_localfixture"), "unavailable");
  assert.equal((await webhook(eventRequest("checkout.session.completed"))).status, 503);
  assert.equal(sessions.retrieve.mock.callCount(), 0);
});

test("Host and forwarded headers cannot change the trusted checkout redirect", async () => {
  let parameters;
  mock.method(sessions, "create", async (params) => {
    parameters = params;
    return session({ url: "https://checkout.stripe.com/pay" });
  });
  assert.equal((await checkout(request(undefined, { host: "attacker.example", "x-forwarded-host": "attacker.example" }))).status, 200);
  assert.equal(parameters.success_url, origin + "/checkout/success?session_id={CHECKOUT_SESSION_ID}");
});

test("missing or invalid API keys cannot create sessions", async () => {
  for (const value of ["", "invalid", "pk_live_notsecret"]) {
    process.env.STRIPE_SECRET_KEY = value;
    assert.equal((await checkout(request())).status, 503);
  }
  assert.equal(sessions.create.mock.callCount(), 0);
});

for (const [name, payload, headers, expected] of [
  ["cross-origin", undefined, { origin: "https://attacker.example" }, 403],
  ["invalid content type", undefined, { "content-type": "text/plain" }, 415],
  ["invalid JSON", "{", {}, 400],
  ["empty cart", { items: [] }, {}, 400],
  ["oversized cart", { items: Array(51).fill({ slug: product.slug, quantity: 1 }) }, {}, 400],
  ["duplicate products", { items: [{ slug: product.slug, quantity: 1 }, { slug: product.slug, quantity: 1 }] }, {}, 400],
  ["unknown product", { items: [{ slug: "unknown", quantity: 1 }] }, {}, 400],
  ["zero quantity", { items: [{ slug: product.slug, quantity: 0 }] }, {}, 400],
  ["fractional quantity", { items: [{ slug: product.slug, quantity: 1.5 }] }, {}, 400],
  ["excess quantity", { items: [{ slug: product.slug, quantity: 100 }] }, {}, 400],
  ["invalid request ID", undefined, { "idempotency-key": "bad-id" }, 400],
  ["excess content length", undefined, { "content-length": "20000" }, 413],
  ["excess UTF-8 body", JSON.stringify({ note: "á".repeat(9000) }), {}, 413],
]) {
  test(`checkout rejects ${name}`, async () => assert.equal((await checkout(request(payload, headers))).status, expected));
}

test("Stripe creation failure and mismatched mode cannot redirect a customer", async () => {
  assert.equal((await checkout(request())).status, 502);
  mock.method(sessions, "create", async () => session({ livemode: true, url: "https://checkout.stripe.com/x" }));
  assert.equal((await checkout(request())).status, 502);
});

test("checkout rejects a known but unapproved product and amounts above Stripe's limit", async () => {
  const other = products.find((item) => item.slug !== product.slug && item.subcategory !== "Beds");
  assert.equal((await checkout(request({ items: [{ slug: other.slug, quantity: 1 }] }))).status, 400);
  const approved = products.filter((item) => item.subcategory !== "Beds");
  authorizedProducts.splice(0, authorizedProducts.length, ...approved.map((item) => ({ slug: item.slug, unitAmount: Math.round(item.price * 100) })));
  assert.equal((await checkout(request({ items: approved.map((item) => ({ slug: item.slug, quantity: 99 })) }))).status, 400);
});

test("invalid catalog prices cannot create a Checkout Session", async () => {
  const saved = product.price;
  try {
    for (const price of [0.01, -1, Infinity, NaN]) {
      product.price = price;
      assert.equal((await checkout(request())).status, 500);
    }
    assert.equal(sessions.create.mock.callCount(), 0);
  } finally {
    product.price = saved;
  }
});

test("confirmation uses the verified session and handles paid, pending, expired and failed payments", async () => {
  for (const [overrides, expected] of [
    [{}, "paid"],
    [{ payment_status: "unpaid" }, "pending"],
    [{ status: "expired", payment_status: "unpaid" }, "failed"],
    [{ status: "open", payment_status: "unpaid" }, "unavailable"],
    [{ payment_status: "unpaid", payment_intent: { status: "requires_payment_method", last_payment_error: { code: "card_declined" } } }, "failed"],
    [{ metadata: { website: "another-site", checkout_mode: "test" } }, "unavailable"],
    [{ livemode: true }, "unavailable"],
  ]) {
    mock.method(sessions, "retrieve", async () => session(overrides));
    assert.equal(await getCheckoutResult("cs_test_localfixture"), expected);
  }
  assert.equal(await getCheckoutResult(undefined), "unavailable");
  assert.equal(await getCheckoutResult("cs_live_localfixture"), "unavailable");
  assert.equal(await getCheckoutResult("cs_test_bad?paid=true"), "unavailable");
});

test("confirmation verifies the real Stripe session without a webhook or legacy flags", async () => {
  Object.assign(process.env, { STRIPE_SECRET_KEY: "sk_live_localfixture", NODE_ENV: "production", VERCEL_ENV: "production" });
  delete process.env.STRIPE_WEBHOOK_SECRET;
  mock.method(sessions, "retrieve", async () => session({ id: "cs_live_localfixture", livemode: true, metadata: { website: "nuvola-home", checkout_mode: "live" } }));
  assert.equal(await getCheckoutResult("cs_live_localfixture"), "paid");
});

test("webhook rejects absent, forged, stale and tampered signatures", async () => {
  const missing = eventRequest("checkout.session.completed");
  missing.headers.delete("stripe-signature");
  assert.equal((await webhook(missing)).status, 400);
  assert.equal((await webhook(eventRequest("checkout.session.completed", session(), { signature: "forged" }))).status, 400);
  assert.equal((await webhook(eventRequest("checkout.session.completed", session(), { timestamp: 1 }))).status, 400);
  const valid = eventRequest("checkout.session.completed");
  const tampered = new Request(valid.url, { method: "POST", headers: valid.headers, body: (await valid.text()) + " " });
  assert.equal((await webhook(tampered)).status, 400);
});

test("signed webhook confirms test payments, retries, async success and stale failure without duplicate side effects", async () => {
  mock.method(sessions, "retrieve", async () => session());
  for (const type of ["checkout.session.completed", "checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"]) {
    assert.equal((await webhook(eventRequest(type))).status, 200);
    assert.equal(console.info.mock.calls.at(-1).arguments[0], "NUVOLA_PAYMENT_CONFIRMED");
  }
});

test("signed webhook distinguishes pending, failed and expired sessions", async () => {
  mock.method(sessions, "retrieve", async () => session({ payment_status: "unpaid" }));
  await webhook(eventRequest("checkout.session.completed"));
  assert.equal(console.info.mock.calls.at(-1).arguments[0], "NUVOLA_PAYMENT_PENDING");
  await webhook(eventRequest("checkout.session.async_payment_failed"));
  assert.equal(console.info.mock.calls.at(-1).arguments[0], "NUVOLA_PAYMENT_FAILED");
  mock.method(sessions, "retrieve", async () => session({ status: "expired", payment_status: "unpaid" }));
  await webhook(eventRequest("checkout.session.expired"));
  assert.equal(console.info.mock.calls.at(-1).arguments[0], "NUVOLA_PAYMENT_FAILED");
});

test("webhook ignores other sites/modes/events and retries Stripe retrieval failures", async () => {
  assert.equal((await webhook(eventRequest("checkout.session.completed", session({ livemode: true })))).status, 200);
  assert.equal((await webhook(eventRequest("checkout.session.completed", session({ metadata: {} })))).status, 200);
  assert.equal((await webhook(eventRequest("payment_intent.succeeded"))).status, 200);
  assert.equal(sessions.retrieve.mock.callCount(), 0);
  assert.equal((await webhook(eventRequest("checkout.session.completed"))).status, 500);
});

test("configured live webhooks verify payments in production", async () => {
  Object.assign(process.env, { STRIPE_SECRET_KEY: "sk_live_localfixture", NODE_ENV: "production", VERCEL_ENV: "production" });
  const paid = session({ id: "cs_live_localfixture", livemode: true, metadata: { website: "nuvola-home", checkout_mode: "live" } });
  mock.method(sessions, "retrieve", async () => paid);
  assert.equal((await webhook(eventRequest("checkout.session.completed", paid))).status, 200);
  assert.equal(console.info.mock.calls.at(-1).arguments[0], "NUVOLA_PAYMENT_CONFIRMED");
});

test("stored cart cannot override catalog prices, names, images or quantities", () => {
  assert.deepEqual(normalizeCart([
    { slug: product.slug, quantity: 1000, name: "forged", price: 0.01, image: "https://attacker.example/pixel" },
    { slug: product.slug, quantity: 1 }, { slug: "unknown", quantity: 1 },
    { slug: bed.slug, quantity: -1 }, null,
  ]), [toCartItem(product, 99)]);
  assert.deepEqual(normalizeCart({}), []);
});

test("payment removes purchased quantities while preserving later additions", () => {
  const current = [toCartItem(product, 3), toCartItem(bed, 1)];
  assert.deepEqual(subtractPurchasedItems(current, [{ slug: product.slug, quantity: 2 }]), [toCartItem(product, 1), toCartItem(bed, 1)]);
});

test("cart actions, checkout snapshots and repeated success visits preserve a new cart", () => {
  const storage = new Map();
  const sessionStorage = new Map();
  const adapter = (map) => ({ getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) });
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: adapter(storage), sessionStorage: adapter(sessionStorage) };
  try {
    let cart;
    function Probe() { cart = useCart(); return null; }
    renderToString(createElement(CartProvider, null, createElement(Probe)));
    cart.addItem(product);
    cart.updateQuantity(product.slug, 3);
    cart.rememberCheckout("cs_test_cart", [{ slug: product.slug, quantity: 2 }]);
    cart.completeCheckout("cs_test_cart");
    assert.equal(JSON.parse(storage.get("nuvola-cart-v1"))[0].quantity, 1);
    cart.addItem(product);
    cart.completeCheckout("cs_test_cart");
    assert.equal(JSON.parse(storage.get("nuvola-cart-v1"))[0].quantity, 2);
    cart.completeCheckout("cs_test_unrelated");
    assert.equal(JSON.parse(storage.get("nuvola-cart-v1"))[0].quantity, 2);
    cart.updateQuantity(product.slug, 500);
    assert.equal(JSON.parse(storage.get("nuvola-cart-v1"))[0].quantity, 99);
    cart.removeItem(product.slug);
    assert.deepEqual(JSON.parse(storage.get("nuvola-cart-v1")), []);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("a stalled checkout times out and the same request can be retried safely", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const attempts = [];
  mock.method(globalThis, "fetch", async (_url, options) => {
    attempts.push(options);
    if (attempts.length === 1) {
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    }
    return Response.json({ url: "https://checkout.stripe.com/c/pay/cs_test_retry", sessionId: "cs_test_retry" });
  });
  const items = [{ slug: product.slug, quantity: 2 }];
  const id = randomUUID();
  const timeout = assert.rejects(requestCheckout(items, id), /Your bag is saved. Please try again/);
  t.mock.timers.tick(35_000);
  await timeout;
  assert.equal(attempts[0].signal.aborted, true);
  assert.equal((await requestCheckout(items, id)).sessionId, "cs_test_retry");
  assert.equal(attempts[0].headers["Idempotency-Key"], id);
  assert.equal(attempts[1].headers["Idempotency-Key"], id);
  assert.equal(attempts[0].body, attempts[1].body);
});

test("checkout redirects reject malformed responses and unsafe destinations", async () => {
  for (const data of [
    null, [], {},
    { url: "https://checkout.stripe.com/pay", sessionId: "invalid" },
    ...[
      "http://checkout.stripe.com/pay",
      "https://attacker.example/pay",
      "https://checkout.stripe.com.attacker.example/pay",
      "https://user:pass@checkout.stripe.com/pay",
      "https://checkout.stripe.com:8443/pay",
    ].map((url) => ({ url, sessionId: "cs_test_redirect" })),
  ]) {
    mock.method(globalThis, "fetch", async () => Response.json(data));
    await assert.rejects(requestCheckout([], randomUUID()), /Invalid checkout/);
  }
});

test("checkout failures preserve useful errors and tolerate non-JSON responses", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ error: "Online checkout is temporarily unavailable." }, { status: 503 }));
  await assert.rejects(requestCheckout([], randomUUID()), /Online checkout is temporarily unavailable/);
  mock.method(globalThis, "fetch", async () => new Response("Gateway timeout", { status: 504 }));
  await assert.rejects(requestCheckout([], randomUUID()), /Unable to initialize checkout/);
});
