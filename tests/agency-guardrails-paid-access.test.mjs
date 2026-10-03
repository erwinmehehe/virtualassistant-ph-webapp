import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("candidate identity and hiring actions require paid candidate access", async () => {
  const [access, jobs, matching, shortlist, paymentGuard] = await Promise.all([
    read("src/lib/candidate-access.ts"),
    read("src/app/actions/jobs.ts"),
    read("src/app/actions/matching.ts"),
    read("src/app/actions/client-shortlist.ts"),
    read("supabase/migrations/20261003031600_enforce_settled_payment_for_candidate_access.sql"),
  ]);

  assert.match(access, /return status === "paid"/);
  assert.doesNotMatch(access, /status === "paid" \|\| status === "comped"/);
  assert.match(jobs, /access_status: "locked"/);
  assert.doesNotMatch(jobs, /access_status: "comped"/);
  assert.doesNotMatch(matching, /ACCESS_STATUSES[^\n]*"comped"/);
  assert.match(shortlist, /candidateAccessUnlocked\(access\?\.access_status\)/);
  assert.match(shortlist, /Candidate access must be active before recording a shortlist decision/);
  assert.match(matching, /A settled VAPH payment ID is required/);
  assert.match(matching, /\.from\("payments"\)/);
  assert.match(matching, /\.in\("status", \["paid", "released"\]\)/);
  assert.match(paymentGuard, /before insert or update on public\.job_candidate_access/);
  assert.match(paymentGuard, /candidate access payment is not settled for this job and client/);
  assert.match(paymentGuard, /referenced_payment\.amount_total < new\.access_fee/);
});

test("current recruiter chats are scanned into a server-only moderation queue", async () => {
  const [migration, page, action] = await Promise.all([
    read("supabase/migrations/20261003025908_agency_guardrails_moderation_and_paid_candidate_access.sql"),
    read("src/app/workspace/admin/moderation/page.tsx"),
    read("src/app/actions/moderation.ts"),
  ]);

  assert.match(migration, /create table if not exists public\.message_flags/);
  assert.match(migration, /client_recruiter_messages/);
  assert.match(migration, /recruiter_va_messages/);
  assert.match(migration, /circumvention_language/);
  assert.match(migration, /external_payment/);
  assert.match(migration, /revoke all on public\.message_flags from public, anon, authenticated/);
  assert.match(page, /body_snapshot/);
  assert.match(page, /Client ↔ Recruiter/);
  assert.match(action, /profileBanError/);
  assert.match(action, /flagError/);
});

test("bulk experience shortcut cannot bypass normal VA vetting", async () => {
  const [adminAction, page] = await Promise.all([
    read("src/app/actions/admin.ts"),
    read("src/app/workspace/admin/vetting/page.tsx"),
  ]);

  assert.doesNotMatch(adminAction, /bulkApproveExperiencedVAsAction/);
  assert.doesNotMatch(adminAction, /Bulk-approved: 2\+ years experience/);
  assert.doesNotMatch(page, /Bulk-approve/);
  assert.doesNotMatch(page, /Skips the remaining skills test/);
});

test("PayMongo checkout never falls back to a guessed USD PHP rate", async () => {
  const paymongo = await read("src/lib/paymongo.ts");

  assert.doesNotMatch(paymongo, /FALLBACK_USD_PHP_RATE/);
  assert.doesNotMatch(paymongo, /const FALLBACK_USD_PHP_RATE = 58/);
  assert.match(paymongo, /USD\/PHP exchange rate is temporarily unavailable/);
  assert.match(paymongo, /Checkout is paused to avoid charging an estimated conversion rate/);
});

test("candidate access has a real VAPH invoice and PayMongo settlement path", async () => {
  const [matching, staff, webhook, clientPayments] = await Promise.all([
    read("src/app/actions/matching.ts"),
    read("src/components/staff-job-matching.tsx"),
    read("src/app/api/webhooks/paymongo/route.ts"),
    read("src/app/workspace/client/payments/page.tsx"),
  ]);

  assert.match(matching, /createCandidateAccessInvoiceAction/);
  assert.match(matching, /description:\s*`Candidate access · \${job\.title}`/);
  assert.match(matching, /access_status: "invoiced"/);
  assert.match(matching, /payment_reference: payment\.id/);
  assert.match(staff, /Create candidate access invoice/);
  assert.match(webhook, /unlockCandidateAccessAfterSettlement/);
  assert.match(webhook, /access_status: "paid"/);
  assert.match(webhook, /\.eq\("payment_reference", payment\.id\)/);
  assert.match(clientPayments, /createCheckoutSessionAction/);
});

test("stale interview and offer records cannot bypass the paid access entitlement", async () => {
  const [ops, resumeRoute, applications] = await Promise.all([
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/app/api/resume/[applicationId]/route.ts"),
    read("src/app/actions/applications.ts"),
  ]);

  assert.match(ops, /Candidate access payment is required before scheduling this interview/);
  assert.match(ops, /Candidate access payment is required before confirming this placement/);
  assert.match(ops, /candidateAccessUnlocked\(access\?\.access_status\)/);
  assert.match(ops, /candidateAccessUnlocked\(candidateAccess\?\.access_status\)/);
  assert.match(resumeRoute, /Clients are deliberately excluded/);
  assert.doesNotMatch(resumeRoute, /candidateAccessUnlocked/);
  assert.match(applications, /curatedAccess = Boolean\(released && candidateAccessUnlocked/);
});
