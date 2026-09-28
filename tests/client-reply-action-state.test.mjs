import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client reply state is derived from inbound replies and later recruiter actions", async () => {
  const migration = await read("supabase/migrations/20260929072000_client_reply_action_state.sql");

  assert.match(migration, /create or replace view public\.recruiter_client_reply_state/);
  assert.match(migration, /client_contact_email/);
  assert.match(migration, /client_followup_sent/);
  assert.match(migration, /last_client_reply_at > a\.last_recruiter_response_at/);
  assert.match(migration, /then 'needs_action'/);
  assert.match(migration, /then 'awaiting_reply'/);
  assert.match(migration, /then 'handled'/);
  assert.match(migration, /grant select on public\.recruiter_client_reply_state to service_role/);
});

test("CRM Needs action includes fresh client replies and shows reply state in the next-step column", async () => {
  const [page, helper, css] = await Promise.all([
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/lib/client-reply-state.ts"),
    read("src/app/workspace/recruiter/crm/crm.module.css"),
  ]);

  assert.match(page, /recruiter_client_reply_state/);
  assert.match(page, /clientReplyNeedsAction\(replyStatus\)/);
  assert.match(page, /clientReplyStatusLabel\(replyStatus\)/);
  assert.match(page, /Client replied · needs action|replyNeedsAction/);
  assert.match(helper, /Client replied · needs action/);
  assert.match(helper, /Awaiting client reply/);
  assert.match(css, /\.replyNeedsAction/);
  assert.match(css, /\.replyAwaiting/);
});

test("client CRM record opens the reply action and shows the reply workflow state", async () => {
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

test("inbound Resend replies refresh recruiter CRM and produce a high-priority action notification", async () => {
  const webhook = await read("src/app/api/webhooks/resend/route.ts");

  assert.match(webhook, /Client replied · action needed/);
  assert.match(webhook, /priority: "high"/);
  assert.match(webhook, /revalidatePath\("\/workspace\/recruiter\/crm"\)/);
  assert.match(webhook, /revalidatePath\("\/workspace\/recruiter\/today"\)/);
});

test("Recruiter Today puts assigned client replies into the action queue", async () => {
  const today = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(today, /recruiter_client_reply_state/);
  assert.match(today, /reply_status", "needs_action"/);
  assert.match(today, /client_email_reply/);
  assert.match(today, /Reply to clients/);
  assert.match(today, /Reply to client/);
});
