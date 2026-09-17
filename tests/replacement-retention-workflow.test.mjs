import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260917172500_replacement_retention_workflow.sql", "utf8");
const actions = fs.readFileSync("src/app/actions/replacement-retention.ts", "utf8");
const page = fs.readFileSync("src/app/workspace/client-success/retention/page.tsx", "utf8");
const layout = fs.readFileSync("src/app/workspace/client-success/layout.tsx", "utf8");
const home = fs.readFileSync("src/app/page.tsx", "utf8");

test("homepage uses the approved worldwide hero trust line", () => {
  assert.match(home, /Vetted Filipino VAs for growing teams worldwide/);
  assert.doesNotMatch(home, /Virtual Assistant Philippines for AU, US &amp; UK teams/);
});

test("replacement workflow stores structured reason, SLA and guarantee review without inventing an SLA policy", () => {
  assert.match(migration, /replacement_reason text/);
  assert.match(migration, /replacement_sla_due_on date/);
  assert.match(migration, /guarantee_status text/);
  assert.match(actions, /Set the replacement SLA due date/);
  assert.match(actions, /GUARANTEE_STATUSES/);
  assert.doesNotMatch(actions, /72\s*\*\s*60|interval ['"]3 days|replacement_sla_hours/);
});

test("retention workflow records renewal and offboarding fields on the placement", () => {
  assert.match(migration, /renewal_date date/);
  assert.match(migration, /renewal_status text not null default 'not_set'/);
  assert.match(migration, /end_reason text/);
  assert.match(migration, /offboarding_notes text/);
  assert.match(actions, /savePlacementRetentionAction/);
  assert.match(actions, /room\.placement_stage === "ended" && !endReason/);
});

test("Client Success exposes a first-class retention and replacement workspace", () => {
  assert.match(layout, /\/workspace\/client-success\/retention/);
  assert.match(page, /Retention &amp; replacements/);
  assert.match(page, /Replacement queue/);
  assert.match(page, /SLA overdue/);
  assert.match(page, /Guarantee review/);
  assert.match(page, /Renewal &amp; offboarding register/);
  assert.match(page, /saveReplacementWorkflowAction/);
  assert.match(page, /savePlacementRetentionAction/);
});

test("replacement planning never automatically ends the active placement", () => {
  assert.match(actions, /placement_stage: "replacement"/);
  assert.doesNotMatch(actions, /status:\s*"completed"/);
  assert.doesNotMatch(actions, /placement_stage:\s*"ended"/);
});
