import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function functionBody(source, name, nextName) {
  const start = source.indexOf(`export async function ${name}`);
  const end = nextName ? source.indexOf(`export async function ${nextName}`, start + 1) : source.length;
  assert.ok(start >= 0, `${name} must exist`);
  return source.slice(start, end >= 0 ? end : source.length);
}

test("bulk profile completion email is disabled", async () => {
  const cron = await read("src/app/api/cron/maintenance/route.ts");
  assert.doesNotMatch(cron, /sendProfileCompletionReminderEmail/);
  assert.doesNotMatch(cron, /runProfileNudges/);
});

test("automated email does not add archive or team BCC by default", async () => {
  const email = await read("src/lib/email.ts");
  assert.match(email, /options\?\.archive === true/);
  assert.match(email, /options\?\.teamCc === true/);

  const application = functionBody(email, "sendApplicationEmail", "sendLeadNotificationEmail");
  const publicBooking = functionBody(email, "sendPublicDiscoveryBookingEmail", "sendInternalDiscoveryBookingNotificationEmail");
  const reminder = functionBody(email, "sendDiscoveryReminderEmail", "sendLeadProposalEmail");
  assert.doesNotMatch(application, /bcc:/);
  assert.doesNotMatch(publicBooking, /bcc:/);
  assert.doesNotMatch(reminder, /bcc:/);
});

test("transactional workflow mail requires explicit archive and team copies", async () => {
  const email = await read("src/lib/email.ts");
  const transactional = functionBody(email, "sendTransactionalEventEmail", "sendProfileCompletionReminderEmail");
  assert.match(transactional, /archive: args\.archive === true/);
  assert.match(transactional, /teamCc: args\.teamCc === true/);
});

test("daily maintenance does not duplicate the dedicated discovery reminder scheduler", async () => {
  const cron = await read("src/app/api/cron/maintenance/route.ts");
  assert.doesNotMatch(cron, /runDiscoveryBookingReminders/);
  assert.doesNotMatch(cron, /sendDiscoveryReminderEmail/);
  assert.doesNotMatch(cron, /bookingManageUrl/);
  assert.doesNotMatch(cron, /formatDiscoverySlot/);
  assert.doesNotMatch(cron, /discoveryReminderResult/);
});

test("suppression lookup failures block non-critical mail", async () => {
  const email = await read("src/lib/email.ts");
  assert.match(email, /allowSuppressionLookupFailure\?: boolean/);
  assert.match(email, /suppressionError/);
  assert.match(email, /suppression_check_unavailable/);

  const confirmation = functionBody(email, "sendAccountConfirmationEmail", "sendPasswordRecoveryEmail");
  const recovery = functionBody(email, "sendPasswordRecoveryEmail", "sendSystemTestEmail");
  assert.match(confirmation, /allowSuppressionLookupFailure: true/);
  assert.match(recovery, /allowSuppressionLookupFailure: true/);
});
