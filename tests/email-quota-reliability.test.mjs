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
  assert.match(email, /"skipped_quota"/);
  assert.match(email, /priority: "critical"/);
});

test("suppression lookup failures do not silently fail open for non-critical mail", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /suppressionError/);
  assert.match(email, /suppression_lookup_failed/);
  assert.match(email, /options\?\.priority !== "critical"/);
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
  const sendIndex = route.indexOf("sendDiscoveryReminderEmail");
  assert.ok(claimIndex >= 0 && sendIndex > claimIndex, "claim helper must be defined before send use");
  assert.match(route, /leadId: lead\.id/);
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
});
