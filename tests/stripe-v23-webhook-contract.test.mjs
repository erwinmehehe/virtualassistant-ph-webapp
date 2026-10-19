import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Stripe from "stripe";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const apiVersion = "2026-09-30.endive";
const testClient = new Stripe("sk_test_synthetic_signature_only", { apiVersion });
const syntheticSecret = "whsec_synthetic_signature_only";

function signedCheckoutEvent() {
  const payload = JSON.stringify({
    id: "evt_synthetic_stripe23",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_synthetic",
        object: "checkout.session",
        livemode: false,
        metadata: { payment_id: "00000000-0000-4000-8000-000000000001" },
        payment_intent: "pi_test_synthetic",
      },
    },
  });
  const header = testClient.webhooks.generateTestHeaderString({
    payload,
    secret: syntheticSecret,
    timestamp: Math.floor(Date.now() / 1000),
  });
  return { payload, header };
}

test("Stripe 23 SDK verifies a signed synthetic checkout event without a network request", () => {
  const { payload, header } = signedCheckoutEvent();
  const event = testClient.webhooks.constructEvent(payload, header, syntheticSecret);
  assert.equal(event.type, "checkout.session.completed");
  assert.equal(event.id, "evt_synthetic_stripe23");
  assert.equal(event.data.object.metadata.payment_id, "00000000-0000-4000-8000-000000000001");
  assert.equal(event.livemode, false);
});

test("Stripe 23 rejects tampered payloads and invalid signing secrets", () => {
  const { payload, header } = signedCheckoutEvent();
  assert.throws(
    () => testClient.webhooks.constructEvent(payload.replace("cs_test_synthetic", "cs_test_tampered"), header, syntheticSecret),
    /signature/i,
  );
  assert.throws(
    () => testClient.webhooks.constructEvent(payload, header, "whsec_invalid_secret"),
    /signature/i,
  );
});

test("Stripe 23 pin and webhook verifier preserve the atomic payment state machine", async () => {
  const [pkgSource, lockSource, stripeSource, route] = await Promise.all([
    read("package.json"),
    read("package-lock.json"),
    read("src/lib/stripe.ts"),
    read("src/app/api/webhooks/stripe/route.ts"),
  ]);
  const pkg = JSON.parse(pkgSource);
  const lock = JSON.parse(lockSource);
  assert.equal(pkg.dependencies.stripe, "^23.0.0");
  assert.equal(lock.packages["node_modules/stripe"].version, "23.0.0");
  assert.match(stripeSource, /apiVersion: "2026-09-30\.endive"/);
  assert.match(route, /readRequestText\(request, 1_048_576\)/);
  assert.match(route, /getStripe\(\)\.webhooks\.constructEvent\(body, signature, secret\)/);
  assert.match(route, /if \(event\.type !== "checkout\.session\.completed"\)/);
  assert.match(route, /claim_payment_provider_event/);
  assert.match(route, /claim\.claim_state === "processed" \|\| claim\.claim_state === "in_progress"/);
  assert.match(route, /transition_payment_state/);
  assert.match(route, /complete_payment_provider_event/);
});
