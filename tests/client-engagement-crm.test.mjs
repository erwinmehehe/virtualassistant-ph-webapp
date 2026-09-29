import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("clients can message the recruiter directly from a reviewed shortlist candidate", async () => {
  const [actions, page] = await Promise.all([
    read("src/app/actions/client-shortlist.ts"),
    read("src/app/workspace/client/candidates/page.tsx"),
  ]);

  assert.match(actions, /clientShortlistMessageAction/);
  assert.match(actions, /client_shortlist_message/);
  assert.match(actions, /Client sent shortlist feedback/);
  assert.match(page, /Message recruiter/);
  assert.match(page, /Send to recruiter/);
  assert.match(page, /Message sent to your recruiter/);
});

test("recruiter CRM shows the requested client engagement signals", async () => {
  const [record, panel, auth] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/components/client-engagement-panel.tsx"),
    read("src/lib/client-auth-activity.ts"),
  ]);

  for (const label of [
    "Last login",
    "Last VA viewed",
    "VAs viewed",
    "Shortlist opened",
    "Last shortlist activity",
    "Decision received",
    "Last email reply",
  ]) {
    assert.match(panel, new RegExp(label));
  }

  assert.match(record, /candidate_view/);
  assert.match(record, /candidate_viewed/);
  assert.match(record, /client_shortlist_viewed/);
  assert.match(record, /client_shortlist_message/);
  assert.match(record, /client_contact_email/);
  assert.match(record, /ClientEngagementPanel/);
  assert.match(auth, /getUserById/);
  assert.match(auth, /last_sign_in_at/);
});

test("recruiter can explicitly log inbound email replies", async () => {
  const record = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  assert.match(record, /Log client interaction or email reply/);
  assert.match(record, /<option value="email">Email reply<\/option>/);
});


test("recruiter pipeline surfaces client activity and unread work without opening each record", async () => {
  const [pipeline, migration, css] = await Promise.all([
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("supabase/migrations/20260929161000_recruiter_client_activity_snapshot.sql"),
    read("src/app/workspace/recruiter/crm/crm.module.css"),
  ]);

  assert.match(pipeline, /recruiter_client_activity_snapshot/);
  assert.match(pipeline, /Client activity/);
  assert.match(pipeline, /Login/);
  assert.match(pipeline, /VA views/);
  assert.match(pipeline, /Shortlist/);
  assert.match(pipeline, /Decision/);
  assert.match(pipeline, /Reply in chat/);
  assert.match(pipeline, /unread client message/);
  assert.match(pipeline, /unreadChat > 0 \|\| clientReplyNeedsAction/);

  assert.match(migration, /auth\.users/);
  assert.match(migration, /candidate_view/);
  assert.match(migration, /client_shortlist_viewed/);
  assert.match(migration, /client_shortlist_message/);
  assert.match(migration, /job_shortlist_candidates/);
  assert.match(migration, /client_recruiter_messages/);
  assert.match(migration, /m\.read_at is null/);
  assert.match(migration, /grant execute on function public\.recruiter_client_activity_snapshot\(uuid\[\]\) to service_role/);

  assert.match(css, /\.clientSignals/);
  assert.match(css, /\.signalUnread/);
});
