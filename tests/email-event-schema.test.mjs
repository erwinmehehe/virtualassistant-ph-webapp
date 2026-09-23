import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("email event schema accepts every status emitted by the app", async () => {
  const [email, migration, webhook] = await Promise.all([
    read("src/lib/email.ts"),
    read("supabase/migrations/20260923123500_expand_outbound_email_event_statuses.sql"),
    read("src/app/api/webhooks/resend/route.ts"),
  ]);

  const appStatuses = [
    "sending",
    "sent",
    "failed",
    "suppressed",
    "skipped_quota",
    "suppression_unavailable",
    "duplicate_prevented",
  ];
  const webhookStatuses = ["delivered", "bounced", "complained", "suppressed"];

  for (const status of [...new Set([...appStatuses, ...webhookStatuses])]) {
    assert.match(migration, new RegExp(`'${status}'`), `migration must allow ${status}`);
  }

  assert.match(email, /type EmailEventStatus =/);
  assert.match(email, /status: "sending"/);
  assert.match(email, /"skipped_quota"/);
  assert.match(email, /"suppression_unavailable"/);
  assert.match(email, /"duplicate_prevented"/);
  assert.match(webhook, /"delivered" \| "bounced" \| "complained" \| "suppressed"/);
});
