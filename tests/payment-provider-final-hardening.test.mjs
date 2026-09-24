import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("PayMongo writes use stable idempotency keys", async () => {
  const [paymongo, actions] = await Promise.all([
    read("src/lib/paymongo.ts"),
    read("src/app/actions/payments.ts"),
  ]);

  assert.match(paymongo, /Idempotency-Key/);
  assert.match(paymongo, /idempotencyKey/);
  assert.match(actions, /payment-checkout-\$\{claim\.payment_id\}/);
  assert.match(actions, /payment-refund-\$\{paymentId\}/);
  assert.match(actions, /isPaymongoOutcomeUncertain/);
  assert.match(actions, /Do not reopen an uncertain refund/);
  assert.doesNotMatch(actions, /charged_amount_php\s*\?\?\s*payment\.amount_total/);
});

test("provider webhook claims are atomic and cover current PayMongo financial events", async () => {
  const [migration, webhook] = await Promise.all([
    read("supabase/migrations/20260925080000_payment_provider_dispute_completion.sql"),
    read("src/app/api/webhooks/paymongo/route.ts"),
  ]);

  assert.match(migration, /claim_payment_provider_event/);
  assert.match(migration, /for update/i);
  assert.match(migration, /processing_started_at/);
  assert.match(migration, /unique index if not exists payments_provider_dispute_unique_idx/i);
  assert.match(migration, /'chargeback'/);
  assert.match(migration, /open_payment_provider_dispute/);
  assert.match(migration, /resolve_payment_provider_dispute/);
  assert.match(migration, /provider_dispute_previous_status/);

  assert.match(webhook, /claim_payment_provider_event/);
  assert.match(webhook, /complete_payment_provider_event/);
  assert.match(webhook, /refund\.succeeded/);
  assert.match(webhook, /dispute\.created/);
  assert.match(webhook, /dispute\.resolved/);
  assert.match(webhook, /open_payment_provider_dispute/);
  assert.match(webhook, /resolve_payment_provider_dispute/);
  assert.match(webhook, /Unmatched PayMongo dispute/);
  assert.match(webhook, /PayMongo chargeback lost/);
});

test("daily maintenance repairs missed PayMongo webhook state", async () => {
  const [reconciliation, maintenance, paymongo] = await Promise.all([
    read("src/lib/payment-reconciliation.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
    read("src/lib/paymongo.ts"),
  ]);

  assert.match(reconciliation, /retrievePaymongoCheckoutSession/);
  assert.match(reconciliation, /retrievePaymongoPayment/);
  assert.match(reconciliation, /retrievePaymongoRefund/);
  assert.match(reconciliation, /mark_payment_paid_from_provider/);
  assert.match(reconciliation, /mark_payment_refunded_from_provider/);
  assert.match(reconciliation, /open_payment_provider_dispute/);
  assert.match(reconciliation, /reconciliation_required/);
  assert.match(maintenance, /reconcilePaymongoPayments/);
  assert.match(maintenance, /PayMongo reconciliation/);
  assert.match(paymongo, /\/checkout_sessions\/\$\{encodeURIComponent\(sessionId\)\}/);
  assert.match(paymongo, /\/payments\/\$\{encodeURIComponent\(paymentId\)\}/);
  assert.match(paymongo, /\/refunds\/\$\{encodeURIComponent\(refundId\)\}/);
});

test("payment dashboards expose terminal chargeback state", async () => {
  const [admin, client, va] = await Promise.all([
    read("src/app/workspace/admin/payments/page.tsx"),
    read("src/app/workspace/client/payments/page.tsx"),
    read("src/app/workspace/va/payments/page.tsx"),
  ]);

  for (const source of [admin, client, va]) assert.match(source, /chargeback/);
});

test("profiling compliance includes a DPIA and processing inventory", async () => {
  const [classification, dpia, inventory] = await Promise.all([
    read("docs/compliance/npc-dps-profiling-classification.md"),
    read("docs/compliance/DPIA_TALENT_MATCHING.md"),
    read("docs/compliance/DATA_PROCESSING_INVENTORY.md"),
  ]);

  assert.match(classification, /profiling/i);
  assert.match(classification, /NPCRS/);
  assert.match(dpia, /DPO approval\/sign-off/);
  assert.match(dpia, /human recruiter review remains mandatory/i);
  assert.match(dpia, /private resume/i);
  assert.match(inventory, /Talent semantic search/);
  assert.match(inventory, /refund\/dispute\/chargeback state/);
});
