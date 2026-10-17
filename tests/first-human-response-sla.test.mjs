import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("first human response reminder is bounded, staff-only and not an automated employer message", async () => {
  const source = await read("src/app/api/cron/maintenance/route.ts");
  const start = source.indexOf("async function runSalesCrmReminders(");
  const end = source.indexOf("async function runRecruiterNotificationHygiene(", start);
  assert.ok(start >= 0 && end > start);
  const handler = source.slice(start, end);
  assert.match(handler, /firstContactCutoff = new Date\(Date\.now\(\) - 2 \* 60 \* 60 \* 1000\)/);
  assert.match(handler, /\.eq\("lead_type", "client_hiring"\)\.eq\("crm_stage", "new"\)/);
  assert.match(handler, /\.is\("first_contact_at", null\)/);
  assert.match(handler, /\.gte\("created_at", daysAgo\(14\)\)\.limit\(300\)/);
  assert.match(handler, /\.eq\("account_status", "active"\)/);
  assert.match(handler, /\.from\("recruiter_tasks"\)\.select\("subject_id"\)/);
  assert.match(handler, /\.like\("title", "First human response overdue:%"\)/);
  assert.match(handler, /new Set\(\(oldTasks \|\| \[\]\)/);
  assert.match(handler, /if \(taskLookupError\)/);
  assert.match(handler, /\.insert\(newTasks\)/);
  assert.match(handler, /action: "sales_first_human_contact_due"/);
  assert.match(handler, /email: false/);
  assert.match(handler, /repeatDays: 1, maxReminders: 3/);
  assert.match(handler, /firstContactTasksCreated/);
  assert.match(handler, /firstContactReminders/);
  assert.ok(handler.indexOf('select("subject_id")') < handler.indexOf(".insert(newTasks)"),
    "must check existing tasks before creating new ones");
});

test("recording genuine contact closes only related overdue task and notice", async () => {
  const source = await read("src/app/actions/recruiter.ts");
  const from = source.indexOf("export async function recordLeadContactAction(formData: FormData)");
  const to = source.indexOf("export async function ", from + 20);
  assert.ok(from >= 0);
  const fn = source.slice(from, to < 0 ? undefined : to);
  assert.match(fn, /requireAnyRole\(\["recruiter", "admin"\]\)/);
  assert.match(fn, /if \(!lead\.first_contact_at\) patch\.first_contact_at/);
  assert.match(fn, /\.eq\("subject_type", "lead"\)/);
  assert.match(fn, /\.eq\("subject_id", leadId\)/);
  assert.match(fn, /\.like\("title", "First human response overdue:%"\)/);
  assert.match(fn, /status: "done", completed_at/);
  assert.match(fn, /\.eq\("href", `\/workspace\/recruiter\/crm\/\$\{leadId\}`\)/);
  assert.ok(fn.indexOf("if (updateError) throw updateError") < fn.indexOf("firstContactTaskError"),
    "only resolve reminders after CRM contact update succeeds");
});

test("duplicate open-role acceptance gives a safe customer action without logging token or PII", async () => {
  const source = await read("src/app/actions/proposals.ts");
  const from = source.indexOf("const { data: acceptanceData, error: acceptanceError }");
  assert.ok(from >= 0);
  const piece = source.slice(from, from + 1550);
  assert.match(piece, /acceptanceError\.code === "23505"/);
  assert.match(piece, /jobs_one_open_normalized_title_per_client_idx/);
  assert.match(piece, /Ask your recruiter to continue the existing role/);
  assert.match(piece, /No partial hiring state was saved/);
  assert.match(piece, /console\.error\("\[proposal\] Atomic acceptance failed", \{ code: acceptanceError\.code \}\)/);
  assert.doesNotMatch(piece, /console\.error\([^\n]*token/);
});
