import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client reply state distinguishes inbound Resend replies from recruiter email logs", async () => {
  const migration = await read("supabase/migrations/20260929093000_client_reply_action_state.sql");

  assert.match(migration, /metadata->>'source'.*resend_inbound/s);
  assert.match(migration, /then 'needs_action'/);
  assert.match(migration, /then 'awaiting_reply'/);
  assert.match(migration, /then 'handled'/);
  assert.match(migration, /grant select on public\.recruiter_client_reply_state to service_role/);
});

test("exact client reply aliases are the default reply-to route", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /DEFAULT_CLIENT_REPLY_TO = "clients@replies\.virtualassistant\.com\.ph"/);
  assert.match(email, /lead-\$\{leadId\}@\$\{domain\}/);
  assert.match(email, /job-\$\{jobId\}@\$\{domain\}/);
  assert.match(email, /replyTo: configuredReplyToFor\(\{ leadId:/);
  assert.match(email, /replyTo: configuredReplyToFor\(\{ jobId:/);
});

test("CRM Needs action surfaces unread-style client reply indicators", async () => {
  const [page, helper, css] = await Promise.all([
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/lib/client-reply-state.ts"),
    read("src/app/workspace/recruiter/crm/crm.module.css"),
  ]);

  assert.match(page, /recruiter_client_reply_state/);
  assert.match(page, /clientReplyNeedsAction\(replyStatus\)/);
  assert.match(page, /replyDot/);
  assert.match(helper, /Client replied · needs action/);
  assert.match(helper, /Awaiting client reply/);
  assert.match(css, /\.replyNeedsAction/);
  assert.match(css, /\.replyDot/);
});

test("client CRM record opens reply action and shows reply workflow state", async () => {
  const [record, panel] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/components/client-engagement-panel.tsx"),
  ]);

  assert.match(record, /recruiter_client_reply_state/);
  assert.match(record, /open=\{replyStatus === "needs_action"\}/);
  assert.match(record, /Reply to client/);
  assert.match(record, /replyStatus=\{replyStatusLabel\}/);
  assert.match(panel, /Reply status/);
});

test("inbound replies refresh CRM and create high priority recruiter notifications", async () => {
  const webhook = await read("src/app/api/webhooks/resend/route.ts");

  assert.match(webhook, /Client replied · action needed/);
  assert.match(webhook, /priority: "high"/);
  assert.match(webhook, /revalidatePath\("\/workspace\/recruiter\/crm"\)/);
  assert.match(webhook, /revalidatePath\("\/workspace\/recruiter\/today"\)/);
});

test("Recruiter Today prioritizes assigned client replies", async () => {
  const today = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(today, /summary\.client_replies/);
  assert.match(today, /clientReplies/);
  assert.match(today, /client_email_reply/);
  assert.match(today, /Reply to clients/);
});
