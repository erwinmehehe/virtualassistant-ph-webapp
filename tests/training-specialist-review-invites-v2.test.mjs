import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("external specialist invites store only hashed, version-locked tokens", async () => {
  const migration = await source("supabase/migrations/20260923222000_training_specialist_review_invites.sql");

  assert.match(migration, /token_hash text not null unique/);
  assert.doesNotMatch(migration, /\braw_token\b|\bpublic_token\b/);
  assert.match(migration, /review_revision integer not null/);
  assert.match(migration, /assigned_revision integer not null/);
  assert.match(migration, /course_content_version integer not null/);
  assert.match(migration, /expires_at timestamptz not null/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.training_specialist_review_invites from anon, authenticated/);
  assert.match(migration, /grant all on public\.training_specialist_review_invites to service_role/);
  assert.match(migration, /where status in \('pending', 'opened'\)/);
});

test("external handoff activity extends the append-only specialist timeline", async () => {
  const migration = await source("supabase/migrations/20260923222000_training_specialist_review_invites.sql");

  for (const eventType of [
    "invite_sent",
    "invite_opened",
    "invite_revoked",
    "external_changes_requested",
    "external_approved",
  ]) {
    assert.ok(migration.includes(`'${eventType}'`), "Missing external audit event: " + eventType);
  }
});

test("secure invite uses the current assignment as reviewer source of truth", async () => {
  const action = await source("src/app/actions/training-specialist-invites.ts");

  assert.match(action, /randomBytes\(32\)\.toString\("base64url"\)/);
  assert.match(action, /hashSpecialistReviewToken\(rawToken\)/);
  assert.match(action, /assigned_reviewer_name/);
  assert.match(action, /assigned_reviewer_role/);
  assert.match(action, /review\.assigned_revision !== review\.review_revision/);
  assert.match(action, /Set a review due date before sending/);
  assert.match(action, /review_revision: review\.review_revision/);
  assert.match(action, /assigned_revision: review\.assigned_revision/);
  assert.match(action, /course_content_version: course\.content_version/);
  assert.match(action, /training_specialist_review_invite/);
  assert.match(action, /training-specialist-review-invite:\$\{invite\.id\}/);
});

test("token lookup rejects revoked expired and stale specialist reviews", async () => {
  const lib = await source("src/lib/training-specialist-invites.ts");

  assert.match(lib, /createHash\("sha256"\)/);
  assert.match(lib, /\.eq\("token_hash", tokenHash\)/);
  assert.match(lib, /inviteData\.status === "revoked"/);
  assert.match(lib, /new Date\(invite\.expires_at\)\.getTime\(\) <= Date\.now\(\)/);
  assert.match(lib, /courseData\.content_version === invite\.course_content_version/);
  assert.match(lib, /Number\(reviewData\.review_revision\) === invite\.review_revision/);
  assert.match(lib, /Number\(reviewData\.assigned_revision\) === invite\.assigned_revision/);
  assert.match(lib, /state: "stale"/);
});

test("external approval requires every checklist item and never auto-publishes", async () => {
  const action = await source("src/app/actions/training-specialist-invites.ts");

  assert.match(action, /definition\.items\.every\(\(item\) => checklist\[item\.id\]\)/);
  assert.match(action, /Complete every specialist review check before approving the course/);
  assert.match(action, /specialist_reviewed_by: invite\.reviewer_name/);
  assert.match(action, /specialist_reviewed_at: now/);
  assert.match(action, /status: "draft"/);
  assert.match(action, /eventType = approved \? "external_approved" : "external_changes_requested"/);
  assert.doesNotMatch(action, /status:\s*"published"/);
});

test("course edits and assignment refreshes revoke active external review links", async () => {
  const action = await source("src/app/actions/training-admin.ts");

  assert.match(action, /training_specialist_review_invites/);
  assert.match(action, /status: "revoked"/);
  assert.match(action, /\.in\("status", \["pending", "opened"\]\)/);
  assert.match(action, /assignTrainingSpecialistReviewerAction/);
  assert.match(action, /invalidateSpecialistReview/);
});

test("reviewer page is private and exposes actual lessons and assessment", async () => {
  const page = await source("src/app/training/review/[token]/page.tsx");

  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /Private specialist review/);
  assert.match(page, /Read the lessons and final assessment/);
  assert.match(page, /course\.modules\.map/);
  assert.match(page, /course\.assessments\.map/);
  assert.match(page, /Request changes/);
  assert.match(page, /Approve specialist review/);
  assert.match(page, /does not automatically publish the course/);
  assert.doesNotMatch(page, /reviewer_email|invite\.reviewer_email/);
});

test("all seven gated specialist courses have a visible review standard", async () => {
  const definitions = await source("src/lib/training-specialist-review.ts");

  for (const slug of [
    "real-estate-virtual-assistant",
    "medical-healthcare-virtual-assistant",
    "bookkeeping-administration",
    "payroll-administration",
    "ndis-administration-fundamentals",
    "property-management-administration-australia",
    "mortgage-broking-administration-australia",
  ]) {
    assert.ok(definitions.includes(`"${slug}"`), "Missing specialist checklist: " + slug);
  }
});

test("admin queue sends, tracks and revokes secure external reviews without replacing assignment history", async () => {
  const page = await source("src/app/workspace/admin/training/reviews/page.tsx");
  const admin = await source("src/lib/training-admin.ts");

  assert.match(page, /Reviewer assignment/);
  assert.match(page, /Reviewer email/);
  assert.match(page, /Send secure review/);
  assert.match(page, /Revoke secure link/);
  assert.match(page, /Reviewer opened|Opened/);
  assert.match(page, /Review history/);
  assert.match(page, /Outstanding issues/);
  assert.match(admin, /training_specialist_review_invites/);
  assert.match(admin, /latestInviteByCourse/);
  assert.match(admin, /assignmentCurrent/);
  assert.match(admin, /training_specialist_review_events/);
});
