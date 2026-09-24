import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("payment status changes are locked behind the database state machine", async () => {
  const [sql, actions, state] = await Promise.all([
    read("supabase/migrations/20260924193000_payment_state_machine_and_provider_reconciliation.sql"),
    read("src/app/actions/payments.ts"),
    read("src/lib/payment-state.ts"),
  ]);

  assert.match(sql, /for update/i);
  assert.match(sql, /payments_require_state_machine/i);
  assert.match(sql, /payment_status_transition_requires_rpc/i);
  assert.match(sql, /create or replace function public\.transition_payment_state/i);
  assert.match(sql, /grant execute on function public\.transition_payment_state[\s\S]*to service_role/i);
  assert.match(actions, /claim_payment_checkout/);
  assert.match(actions, /finalize_payment_checkout/);
  assert.match(actions, /transitionPaymentState/);
  assert.doesNotMatch(actions, /charged_amount_php \?\? payment\.amount_total/);
  assert.match(state, /payment_state_conflict:/);
});

test("PayMongo writes and webhooks are idempotent and reconcile reversals", async () => {
  const [paymongo, webhook, sql] = await Promise.all([
    read("src/lib/paymongo.ts"),
    read("src/app/api/webhooks/paymongo/route.ts"),
    read("supabase/migrations/20260924193000_payment_state_machine_and_provider_reconciliation.sql"),
  ]);

  assert.match(paymongo, /Idempotency-Key/);
  assert.match(paymongo, /payment-refund/);
  assert.match(webhook, /claimPaymongoEvent/);
  assert.match(webhook, /refund\.succeeded/);
  assert.match(webhook, /payment\.refunded/);
  assert.match(webhook, /dispute\.created/);
  assert.match(webhook, /dispute\.resolved/);
  assert.match(webhook, /chargeback/);
  assert.match(sql, /unique\(provider, event_id\)/i);
  assert.match(sql, /refund_pending/);
  assert.match(sql, /chargeback/);
});

test("refunds never substitute the USD ledger value for a PHP provider amount", async () => {
  const actions = await read("src/app/actions/payments.ts");
  assert.match(actions, /const chargedPhp = Number\(payment\.charged_amount_php\)/);
  assert.match(actions, /Refund blocked until the PayMongo payment and exact PHP charge are reconciled/);
  assert.doesNotMatch(actions, /Number\(payment\.charged_amount_php \?\? payment\.amount_total\)/);
});
