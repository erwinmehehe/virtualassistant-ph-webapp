import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("overdue first human response creates bounded staff-only reminders for hiring leads", async () => {
  const source = await read("src/app/api/cron/maintenance/route.ts");
  assert.match(source, /const firstContactCutoff = new Date\(Date\.now\(\) - 2 \* 60 \* 60 \* 1000\)/);
  assert.match(source, /firstContactLeads/);
  assert.match(source, /\.eq\("lead_type", "client_hiring"\)\.eq\("crm_stage", "new"\)\.is\("first_contact_at", null\)/);
  assert.match(source, /\.gte\("created_at", daysAgo\(14\)\)\.limit\(300\)/);
  assert.match(source, /const recipients = lead\.owner_id \? \[lead\.owner_id\] : staffIds/);
  assert.match(source, /action: "sales_first_human_contact_due"/);
  assert.match(source, /maxReminders: 3/);
  assert.match(source, /firstContactReminders/);
  const block = source.split("action: \"sales_first_human_contact_due\"")[1].split("})) firstContactReminders")[0];
  assert.doesNotMatch(block, /email: true|sendTransactionalEventEmail|sms|twilio/i);
});

test("first-contact SLA creates one recruiter task and closes it only after CRM contact", async () => {
  const [maintenance, action] = await Promise.all([
    read("src/app/api/cron/maintenance/route.ts"),
    read("src/app/actions/recruiter.ts"),
  ]);
  assert.match(maintenance, /firstContactLeadIds/);
  assert.match(maintenance, /\.like\("title", "First human response overdue:%"\)/);
  assert.match(maintenance, /const alreadyAssigned = new Set/);
  assert.match(maintenance, /\.from\("recruiter_tasks"\)\.insert\(tasksToCreate\)/);
  assert.match(maintenance, /firstContactTasksCreated/);
  assert.match(maintenance, /priority: "urgent"/);
  assert.match(maintenance, /staffIds\.includes\(lead\.owner_id\)/);
  assert.match(action, /if \(updateError\) throw updateError;/);
  assert.match(action, /\.eq\("subject_id", leadId\)/);
  assert.match(action, /\.in\("status", \["todo", "in_progress"\]\)/);
  assert.match(action, /status: "done", completed_at: now\.toISOString\(\)/);
  assert.match(action, /First human response overdue:%/);
});

test("duplicate open employer role titles provide a clear recovery path without bypassing SQL uniqueness", async () => {
  const source = await read("src/app/actions/proposals.ts");
  assert.match(source, /jobs_one_open_normalized_title_per_client_idx/);
  assert.match(source, /acceptanceError\.code === "23505"/);
  assert.match(source, /Ask your recruiter to continue the existing role or send a revised proposal/);
  assert.match(source, /No partial hiring state was saved/);
});

test("training time and scroll progress never claim unsaved data was persisted", async () => {
  const [action, gate] = await Promise.all([
    read("src/app/actions/training.ts"),
    read("src/components/training-lesson-integrity-gate.tsx"),
  ]);
  assert.match(action, /const \{ error: engagementError \} = await admin\.from\("training_lesson_engagement"\)\.upsert/);
  assert.match(action, /if \(engagementError\) throw new Error/);
  assert.match(gate, /setReadingSyncError\(true\)/);
  assert.match(gate, /setReadingSyncError\(false\)/);
  assert.match(gate, /Reading progress is not syncing/);
  assert.match(gate, /ready = readingReady && timeReady && checkpointPassed && exerciseReady/);
});

test("graduate training accounts can opt into candidate setup without duplicate accounts", async () => {
  const [page, auth, bootstrap] = await Promise.all([
    read("src/app/workspace/training/page.tsx"),
    read("src/app/actions/auth.ts"),
    read("src/lib/profile-bootstrap.ts"),
  ]);
  assert.match(page, /!profile && completed\.length > 0/);
  assert.match(page, /form action=\{chooseOAuthRoleAction\}/);
  assert.match(page, /name="role" value="va"/);
  assert.match(page, /name="next" value="\/workspace\/va\/onboarding"/);
  assert.match(page, /Creating a profile does not guarantee recruiter approval, interviews, or employment/);
  assert.match(auth, /const \{ data, error \} = await supabase\.auth\.updateUser\(/);
  assert.match(bootstrap, /explicitRole !== "va" && explicitRole !== "client"/);
});

test("the existing end-to-end fixtures keep separate employer and recruiter access boundaries", async () => {
  const [fixture, router] = await Promise.all([
    read("e2e/auth-workspace.spec.ts"),
    read("src/lib/auth.ts"),
  ]);
  assert.match(fixture, /recruiter can enter recruiter workspace and is blocked from client workspace/);
  assert.match(fixture, /client can enter client workspace and is blocked from recruiter workspace/);
  assert.match(router, /if \(!session\.profile \|\| session\.profile\.role !== role\)/);
});
