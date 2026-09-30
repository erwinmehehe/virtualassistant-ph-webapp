import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage and hire use problem-first hiring intake modes", async () => {
  const [home, hire, form, leads, role] = await Promise.all([
    read("src/app/page.tsx"),
    read("src/app/hire/page.tsx"),
    read("src/components/hiring-brief-form.tsx"),
    read("src/app/actions/leads.ts"),
    read("src/lib/lead-role.ts"),
  ]);

  assert.match(home, /mode="homepage"/);
  assert.match(home, /Get my VA recommendation/);
  assert.match(hire, /mode="hire"/);
  assert.match(hire, /Get your hiring recommendation/);
  assert.match(form, /What&apos;s taking up your time right now\?/);
  assert.match(form, /You do not need to know the exact job title yet/);
  assert.match(form, /name="tools"/);
  assert.match(form, /name="timezone"/);
  assert.match(form, /name="start_time"/);
  assert.match(leads, /tools: z\.string\(\)\.trim\(\)\.max\(600\)\.optional\(\)/);
  assert.match(leads, /Tools \/ systems:/);
  assert.match(role, /required_tools: args\.tools \|\| \[\]/);
});

test("discovery workspace stores structured notes server-side and hands qualified calls to matching", async () => {
  const [page, action, migration, crm] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/discovery/page.tsx"),
    read("src/app/actions/discovery-workspace.ts"),
    read("supabase/migrations/20260930113000_discovery_sales_workspace.sql"),
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
  ]);

  for (const prompt of [
    "Why are you hiring now?",
    "What is taking up your time right now?",
    "What should this person own?",
    "What would success look like in 90 days?",
    "What could make this hire fail?",
    "Who decides and what happens next?",
  ]) assert.match(page, new RegExp(prompt.replace(/[?]/g, "\\?")));

  assert.match(page, /Qualified · Open matching/);
  assert.match(page, /Business problem understood/);
  assert.match(page, /Budget discussed/);
  assert.match(action, /lead_discovery_briefs/);
  assert.match(action, /crm_stage: stage/);
  assert.match(action, /required_skills/);
  assert.match(action, /required_tools/);
  assert.match(action, /\/workspace\/recruiter\/matching\/\$\{lead\.job_id\}/);
  assert.match(crm, /Discovery workspace/);

  assert.match(migration, /create table if not exists public\.lead_discovery_briefs/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.lead_discovery_briefs from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.lead_discovery_briefs to service_role/);
});

test("qualifying requires an actionable recommendation instead of a generic call note", async () => {
  const action = await read("src/app/actions/discovery-workspace.ts");
  assert.match(action, /recommended%20role/);
  assert.match(action, /ownership/);
  assert.match(action, /90-day/);
  assert.match(action, /discovery_workspace_qualified/);
  assert.match(action, /Discovery qualified and handed to matching/);
});
