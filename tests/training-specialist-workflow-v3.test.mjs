import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const queuePath = "src/app/workspace/admin/training/reviews/page.tsx";
const externalPath = "src/app/training/review/[token]/page.tsx";
const invitesLibPath = "src/lib/training-specialist-invites.ts";
const definitionsPath = "src/lib/training-specialist-review.ts";
const actionPath = "src/app/actions/training-admin.ts";
const policyPath = "supabase/migrations/20261004102500_restore_operational_training_specialist_reviews.sql";

test("specialist review dashboard exposes all operational queue states and filters", async () => {
  const queue = await readFile(queuePath, "utf8");

  for (const label of [
    "Needs reviewer",
    "Review assigned",
    "In review",
    "Changes requested",
    "Approved",
    "Overdue",
    "Healthcare",
    "Finance",
    "Property",
    "Software",
    "Assign specialist",
  ]) {
    assert.ok(queue.includes(label), "Missing queue UI: " + label);
  }
  assert.match(queue, /Published · specialist review pending/);
});

test("each specialist course has a course-specific reviewer standard", async () => {
  const definitions = await readFile(definitionsPath, "utf8");
  for (const slug of [
    "real-estate-virtual-assistant",
    "medical-healthcare-virtual-assistant",
    "bookkeeping-administration",
    "payroll-administration",
    "australian-allied-health-administration",
    "cliniko-for-virtual-assistants",
    "australian-bookkeeping-administration",
    "xero-workflows-for-virtual-assistants",
    "myob-workflows-for-virtual-assistants",
    "ndis-administration-fundamentals",
    "property-management-administration-australia",
    "mortgage-broking-administration-australia",
  ]) {
    assert.ok(definitions.includes('"' + slug + '"'), "Missing review standard: " + slug);
  }
  assert.match(definitions, /reviewerHint/);
  assert.match(definitions, /getSpecialistReviewDomain/);
  assert.match(definitions, /getSpecialistEvidenceRequirements/);
});

test("external reviewer experience includes evidence requirements, full course material, and prior corrections", async () => {
  const [page, lib] = await Promise.all([
    readFile(externalPath, "utf8"),
    readFile(invitesLibPath, "utf8"),
  ]);

  assert.match(page, /Evidence and source standard/);
  assert.match(page, /Previous corrections and decisions/);
  assert.match(page, /Read the lessons and final assessment/);
  assert.match(page, /Record your decision/);
  assert.match(page, /Request changes/);
  assert.match(page, /Approve specialist review/);
  assert.match(lib, /training_specialist_review_events/);
  assert.match(lib, /external_changes_requested/);
  assert.match(lib, /invalidated/);
});

test("assigning a specialist does not unpublish an already-live course", async () => {
  const actions = await readFile(actionPath, "utf8");
  const start = actions.indexOf("export async function assignTrainingSpecialistReviewerAction");
  const end = actions.indexOf("export async function saveTrainingSpecialistReviewAction", start);
  const assignment = actions.slice(start, end);

  assert.match(assignment, /specialist_reviewed_by: null/);
  assert.doesNotMatch(assignment, /status: "draft"/);
  assert.doesNotMatch(assignment, /published_at: null/);
});

test("external approval preserves publication while explicit changes requested can pull a course back to draft", async () => {
  const sql = await readFile(policyPath, "utf8");

  assert.match(sql, /status = case when p_decision = 'changes_requested' then 'draft' else status end/);
  assert.match(sql, /published_at = case when p_decision = 'changes_requested' then null else published_at end/);
  assert.match(sql, /specialist_reviewed_by = case when p_decision = 'approved'/);
  assert.match(sql, /revoke all on function public\.submit_external_training_specialist_review/);
  assert.match(sql, /grant execute on function public\.submit_external_training_specialist_review[\s\S]*to service_role/);
});
