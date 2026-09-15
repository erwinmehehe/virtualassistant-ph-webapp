import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiter navigation exposes focused daily operations without a command palette", async () => {
  const nav = await read("src/components/app-nav-links.tsx");
  assert.match(nav, /\\["My Day", "\\/workspace\\/recruiter\\/today"/);\n  for (const removed of ["Agenda", "Tasks", "Notifications"]) assert.doesNotMatch(nav, new RegExp(`\\\\["${removed}"`));\n  assert.match(nav, /label: "Workspace"/);
  assert.doesNotMatch(nav, /Command palette|Cmd\+K|Ctrl\+K/);
});

test("recruiter badges include tasks and notifications without loading their full pages", async () => {
  const badges = await read("src/lib/workspace-badges.ts");
  assert.match(badges, /\/workspace\/recruiter\/notifications/);
  assert.match(badges, /Number\(raw\.notifications/);
  assert.match(badges, /\/workspace\/recruiter\/tasks/);
  assert.match(badges, /Number\(raw\.tasks/);
});

test("My Day uses one compact operational queue RPC", async () => {
  const [page, migration] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("supabase/migrations/20260914012339_recruiter_ops_core.sql")
  ]);
  assert.match(page, /recruiter_today_queue/);
  assert.match(page, /p_limit:20/);
  assert.match(page, /RecruiterTemplateComposer/);
  assert.match(page, /completeRecruiterTaskAction/);
  assert.match(migration, /create or replace function public\.recruiter_today_queue/);
  assert.match(migration, /limit greatest\(coalesce\(p_limit,20\),1\)/);
});

test("recruiter tasks are server-only and indexed for due work", async () => {
  const [core, policy, creatorIndex] = await Promise.all([
    read("supabase/migrations/20260914012339_recruiter_ops_core.sql"),
    read("supabase/migrations/20260914012408_recruiter_tasks_server_only_policy.sql"),
    read("supabase/migrations/20260914012516_recruiter_tasks_created_by_index.sql")
  ]);
  assert.match(core, /alter table public\.recruiter_tasks enable row level security/);
  assert.match(core, /recruiter_tasks_assignee_due_idx/);
  assert.match(core, /revoke all on table public\.recruiter_tasks from public, anon, authenticated/);
  assert.match(policy, /using \(false\)/);
  assert.match(creatorIndex, /recruiter_tasks_created_by_idx/);
});

test("communication templates send and schedule the next follow-up in one action", async () => {
  const [templates, composer, actions] = await Promise.all([
    read("src/lib/recruiter-communications.ts"),
    read("src/components/recruiter-template-composer.tsx"),
    read("src/app/actions/recruiter-ops.ts")
  ]);
  for (const id of ["first_response", "discovery_confirmation", "no_show", "proposal_followup", "shortlist_ready", "reactivation"]) assert.match(templates, new RegExp(`id: "${id}"`));
  assert.match(composer, /Send \+ schedule follow-up/);
  assert.match(actions, /sendRecruiterTemplateEmailAction/);
  assert.match(actions, /next_follow_up_at/);
  assert.match(actions, /sendStaffClientFollowupEmail/);
});

test("recruiter notifications support priority, snooze and done states", async () => {
  const [page, core, priority] = await Promise.all([
    read("src/app/workspace/recruiter/notifications/page.tsx"),
    read("supabase/migrations/20260914012339_recruiter_ops_core.sql"),
    read("supabase/migrations/20260914012906_recruiter_notification_priority.sql")
  ]);
  for (const action of ["markRecruiterNotificationReadAction", "snoozeRecruiterNotificationAction", "completeRecruiterNotificationAction", "setRecruiterNotificationPriorityAction"]) assert.match(page, new RegExp(action));
  assert.match(core, /snoozed_until/);
  assert.match(core, /done_at/);
  assert.match(priority, /notifications_recruiter_priority/);
});

test("agenda stays bounded to the current week", async () => {
  const page = await read("src/app/workspace/recruiter/agenda/page.tsx");
  assert.match(page, /\.gte\("discovery_scheduled_at",startIso\)\.lt\("discovery_scheduled_at",endIso\)/);
  assert.match(page, /\.gte\("due_at",startIso\)\.lt\("due_at",endIso\)/);
  assert.match(page, /Client:/);
  assert.match(page, /Recruiter:/);
  assert.match(page, /Join Zoom/);
});
