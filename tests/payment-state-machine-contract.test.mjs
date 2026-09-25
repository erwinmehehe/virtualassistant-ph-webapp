import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("payment lifecycle uses locked state transitions and provider reconciliation", async () => {
  const [migration, reconciliation, actions, webhook] = await Promise.all([
    read("supabase/migrations/20260924204000_payment_state_machine.sql"),
    read("supabase/migrations/20260924204100_payment_provider_reconciliation.sql"),
    read("src/app/actions/payments.ts"),
    read("src/app/api/webhooks/paymongo/route.ts"),
  ]);

  assert.match(migration, /for update/i);
  assert.match(migration, /create or replace function public\.transition_payment_state/i);
  assert.match(migration, /create or replace function public\.claim_payment_checkout/i);
  assert.match(migration, /provider_checkout_url/i);
  assert.match(migration, /unique\(provider, provider_event_id\)/i);
  assert.match(migration, /alter column platform_cut_percent set default 0/i);
  assert.match(migration, /revoke all on function public\.transition_payment_state[\s\S]*from public, anon, authenticated/i);

  assert.match(actions, /claim_payment_checkout/);
  assert.match(actions, /attach_payment_checkout/);
  assert.match(actions, /transition_payment_state/);
  assert.doesNotMatch(actions, /charged_amount_php\s*\?\?\s*payment\.amount_total/);
  assert.match(actions, /Refund blocked: the settled PHP charge amount is missing/);
  assert.match(actions, /refund_pending/);
  assert.match(actions, /PayMongo's refund webhook is the final source of truth/);

  assert.match(reconciliation, /mark_payment_refunded_from_provider/i);
  assert.match(reconciliation, /mark_payment_provider_disputed/i);
  assert.match(webhook, /payment\.refunded/);
  assert.match(webhook, /payment\.refund\.updated/);
  assert.match(webhook, /claim_payment_provider_event/);
  assert.match(webhook, /complete_payment_provider_event/);
  assert.match(webhook, /provider_event_id/);
  assert.match(webhook, /mark_payment_provider_disputed/);
});

test("payment dashboards recognize reconciliation states", async () => {
  const [admin, client, va] = await Promise.all([
    read("src/app/workspace/admin/payments/page.tsx"),
    read("src/app/workspace/client/payments/page.tsx"),
    read("src/app/workspace/va/payments/page.tsx"),
  ]);
  for (const source of [admin, client, va]) {
    assert.match(source, /checkout_pending/);
    assert.match(source, /provider_disputed/);
    assert.match(source, /refund_pending/);
  }
});
