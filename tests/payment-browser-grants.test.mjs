import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("browser payment access stays read-only and VA payout view stays security-invoker", async () => {
  const [migration, paymentActions, clientPayments, vaPayments] = await Promise.all([
    read("supabase/migrations/20260923130000_harden_payment_browser_grants.sql"),
    read("src/app/actions/payments.ts"),
    read("src/app/workspace/client/payments/page.tsx"),
    read("src/app/workspace/va/payments/page.tsx"),
  ]);

  assert.match(migration, /revoke all on table public\.payments from anon, authenticated/i);
  assert.match(migration, /grant select on table public\.payments to authenticated/i);
  assert.match(migration, /alter view public\.va_payout_view set \(security_invoker = true\)/i);
  assert.match(migration, /revoke all on table public\.va_payout_view from anon, authenticated/i);
  assert.match(migration, /grant select on table public\.va_payout_view to authenticated/i);

  assert.match(clientPayments, /from\("payments"\)\.select/);
  assert.match(vaPayments, /from\("va_payout_view"\)\.select/);
  assert.match(paymentActions, /createAdminClient\(\)/);
  assert.doesNotMatch(clientPayments, /\.insert\(|\.update\(|\.delete\(/);
  assert.doesNotMatch(vaPayments, /\.insert\(|\.update\(|\.delete\(/);
});
