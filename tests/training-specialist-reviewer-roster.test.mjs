import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20261004104000_training_specialist_reviewer_roster.sql";
const actionsPath = "src/app/actions/training-specialist-reviewers.ts";
const adminLibPath = "src/lib/training-admin.ts";
const queuePath = "src/app/workspace/admin/training/reviews/page.tsx";

test("specialist reviewer roster is admin-only and RLS protected", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.training_specialist_reviewers/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public\.training_specialist_reviewers from anon, authenticated, public/);
  assert.match(sql, /grant select, insert, update on public\.training_specialist_reviewers to service_role/);
  assert.match(sql, /Healthcare/);
  assert.match(sql, /Finance/);
  assert.match(sql, /Property/);
  assert.match(sql, /Software/);
});

test("reviewer roster server actions require admin and enforce domain eligibility", async () => {
  const action = await readFile(actionsPath, "utf8");

  assert.match(action, /requireRoleFast\("admin"\)/);
  assert.match(action, /training_specialist_reviewers/);
  assert.match(action, /getSpecialistReviewDomain/);
  assert.match(action, /reviewer\.domains\.includes\(domain\)/);
  assert.match(action, /This reviewer is not approved for the course specialist domain/);
  assert.match(action, /assignTrainingSpecialistReviewerAction/);
});

test("review queue loads the reusable roster and keeps invite sending explicit", async () => {
  const [adminLib, queue] = await Promise.all([
    readFile(adminLibPath, "utf8"),
    readFile(queuePath, "utf8"),
  ]);

  assert.match(adminLib, /getTrainingSpecialistReviewerRoster/);
  assert.match(adminLib, /training_specialist_reviewers/);
  assert.match(queue, /Specialist reviewer roster/);
  assert.match(queue, /Assign from roster/);
  assert.match(queue, /Only active reviewers approved for this domain appear here/);
  assert.match(queue, /Adding someone here does not send email or assign a course/);
  assert.match(queue, /Send secure review/);
  assert.match(queue, /matchedRosterReviewer\?\.email/);
});

test("roster assignment requires a due date but does not send the invite", async () => {
  const action = await readFile(actionsPath, "utf8");

  assert.match(action, /review_due_date/);
  assert.doesNotMatch(action, /sendTrainingSpecialistReviewInviteAction/);
  assert.doesNotMatch(action, /sendTrackedRawEmail/);
});
