import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/app/api/cron/maintenance/route.ts", "utf8");

test("workflow reminders validate an active profile before writing", () => {
  const start = source.indexOf("async function sendWorkflowReminder");
  const end = source.indexOf("\nasync function runWorkflowReminders", start);
  assert.ok(start >= 0 && end > start, "sendWorkflowReminder must exist");
  const fn = source.slice(start, end);

  const profileLookup = fn.indexOf('.from("profiles")');
  const reminderWrite = fn.indexOf('.from("workflow_reminders")');
  const notificationWrite = fn.indexOf('.from("notifications")');

  assert.ok(profileLookup >= 0, "recipient profile must be checked");
  assert.match(fn, /\.select\("id,account_status"\)/);
  assert.match(fn, /recipient\.account_status !== "active"/);
  assert.ok(profileLookup < reminderWrite, "profile validation must happen before reminder writes");
  assert.ok(profileLookup < notificationWrite, "profile validation must happen before notification writes");
});

test("workflow reminder recipient foreign-key failures are not bypassed in schema", () => {
  assert.doesNotMatch(source, /workflow_reminders_recipient_id_fkey[\s\S]{0,200}(drop|disable)/i);
});
