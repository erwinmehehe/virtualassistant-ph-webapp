import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const page = read("src/app/workspace/recruiter/today/page.tsx");
const action = read("src/app/actions/recruiter-cleanup.ts");
const closeAction = read("src/app/actions/close-lead.ts");
const migration = read("supabase/migrations/20260917004500_recruiter_cleanup_queue.sql");

test("My Day has a dedicated sales cleanup queue without duplicate lead work items", () => {
  assert.match(page, /recruiter_lead_cleanup_queue/);
  assert.match(page, /Sales cleanup/);
  assert.match(page, /LEAD_QUEUE_KINDS = new Set\(\["lead_first_contact", "lead_followup"\]\)/);
  assert.match(page, /\.filter\(\(item:any\)=>!LEAD_QUEUE_KINDS\.has\(String\(item\.kind\)\)\)/);
});

test("cleanup queue surfaces the required operational reasons", () => {
  for (const label of [
    "Missed first response",
    "Follow-up overdue",
    "No next step",
    "Stale 3 days",
    "Stale 7 days",
    "Ready to close"
  ]) assert.match(migration, new RegExp(label));
  assert.match(migration, /l\.lead_type = 'client_hiring'/);
  assert.match(migration, /and l\.owner_id = p_user_id/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /revoke execute on function public\.recruiter_lead_cleanup_queue\(uuid, integer\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.recruiter_lead_cleanup_queue\(uuid, integer\) to service_role/);
});

test("cleanup actions preserve history and support one-click resolution", () => {
  for (const actionName of ["send_followup", "follow_up_later"]) {
    assert.match(action, new RegExp(actionName));
  }
  for (const closeReason of ["No response", "Spam", "Not a fit"]) {
    assert.match(page, new RegExp(`value=\\"${closeReason}\\"`));
    assert.match(closeAction, new RegExp(`\\"${closeReason}\\"`));
  }
  assert.match(page, /action=\{closeLeadAction\}/);
  assert.match(action, /next_follow_up_at: new Date\(now\.getTime\(\) \+ 2 \* 86400000\)\.toISOString\(\)/);
  assert.match(action, /now\.getTime\(\) \+ 3 \* 86400000/);
  assert.match(closeAction, /lost_reason: rawReason/);
  assert.match(action, /writeRecruiterActivity/);
  assert.match(closeAction, /writeRecruiterActivity/);
  assert.match(action, /This lead belongs to another recruiter/);
  assert.match(closeAction, /This lead belongs to another recruiter/);
});

test("closed leads leave the active cleanup queue instead of being deleted", () => {
  assert.match(migration, /coalesce\(l\.crm_stage, 'new'\) in \(/);
  assert.doesNotMatch(closeAction, /\.delete\(/);
  assert.match(closeAction, /crm_stage: "lost"/);
  assert.match(closeAction, /next_follow_up_at: null/);
});
