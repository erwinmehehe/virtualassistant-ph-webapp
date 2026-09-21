import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("tracked sends use deterministic Resend idempotency keys and quota accounting", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /idempotencyKey\?: string/);
  assert.match(email, /config\.client\.emails\.send\(payload, \{ idempotencyKey:/);
  assert.match(email, /DAILY_RECIPIENT_LIMIT/);
  assert.match(email, /RESERVED_CRITICAL_RECIPIENTS/);
  assert.match(email, /recipient_count/);
  assert.match(email, /idempotency_key/);
  assert.match(email, /skip_reason/);
  assert.match(email, /automation/);
  assert.match(email, /recipient_count,status,provider_id/);
  assert.match(email, /"skipped_quota"/);
  assert.match(email, /priority: "critical"/);
});

test("suppression lookup failures do not silently fail open for non-critical mail", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /suppressionError/);
  assert.match(email, /suppression_lookup_failed/);
  assert.match(email, /const critical = options\?\.priority === "critical"/);
  assert.match(email, /critical email was allowed through and the outage was recorded/);
});

test("daily maintenance no longer runs discovery reminders", async () => {
  const maintenance = await read("src/app/api/cron/maintenance/route.ts");

  assert.doesNotMatch(maintenance, /runDiscoveryBookingReminders/);
  assert.doesNotMatch(maintenance, /sendDiscoveryReminderEmail/);
  assert.doesNotMatch(maintenance, /discoveryReminders:/);
});

test("dedicated discovery runner claims each reminder before sending", async () => {
  const route = await read("src/app/api/cron/discovery-reminders/route.ts");

  assert.match(route, /claimDiscoveryReminder/);
  assert.match(route, /releaseDiscoveryReminderClaim/);
  const claimIndex = route.indexOf("claimDiscoveryReminder");
  const sendIndex = route.indexOf("await sendDiscoveryReminderEmail");
  assert.ok(claimIndex >= 0 && sendIndex > claimIndex, "claim helper must be defined before send use");
  assert.match(route, /leadId: lead\.id/);
  assert.match(route, /RETRIABLE_EMAIL_REASONS/);
  assert.match(route, /"suppression_lookup_failed"/);
  assert.match(route, /"quota_lookup_failed"/);
  assert.match(route, /"daily_quota_reserved"/);
  assert.match(route, /RETRIABLE_EMAIL_REASONS\.has\(result\.reason\)/);
});

test("recruiter and admin workflow reminders stay in-app and get one daily digest", async () => {
  const [maintenance, email] = await Promise.all([
    read("src/app/api/cron/maintenance/route.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.match(maintenance, /email\?: boolean/);
  assert.match(maintenance, /if \(!args\.email\) return true/);
  assert.match(maintenance, /runStaffReminderDigest/);
  assert.match(email, /sendStaffDailyDigestEmail/);
});

test("email health shows recipient-based quota and prevented-send counters", async () => {
  const page = await read("src/app/workspace/admin/email-health/page.tsx");

  assert.match(page, /Recipient deliveries today/);
  assert.match(page, /Remaining daily allowance/);
  assert.match(page, /Prevented duplicate sends/);
  assert.match(page, /Suppressed sends/);
  assert.match(page, /Low-priority messages skipped/);
  assert.match(page, /recipient_count/);
  assert.match(page, /idempotency_key/);
  assert.match(page, /skip_reason/);
  assert.match(page, /automation/);
  assert.match(page, /event\.priority === "low"/);
});


test("recipient accounting preserves To + CC + BCC totals after delivery webhooks", async () => {
  const [email, webhook, page] = await Promise.all([
    read("src/lib/email.ts"),
    read("src/app/api/webhooks/resend/route.ts"),
    read("src/app/workspace/admin/email-health/page.tsx"),
  ]);

  assert.match(email, /const legacyCount = countRecipientAddresses\(row\.recipient\)/);
  assert.match(email, /structuredCount > 0 \|\| legacyCount === 0/);
  assert.doesNotMatch(webhook, /patch\.recipient_count\s*=\s*recipientCount/);
  assert.match(webhook, /Preserve the app-recorded To \+ CC \+ BCC recipient_count/);
  assert.match(page, /event\.recipient_count > 0 \|\| legacyCount === 0/);
});
