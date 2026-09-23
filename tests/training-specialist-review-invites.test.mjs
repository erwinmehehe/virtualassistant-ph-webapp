import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("specialist review invites store only hashed expiring tokens behind service-role access", async () => {
  const migration = await source("supabase/migrations/20260923221000_training_specialist_review_invites.sql");

  assert.match(migration, /token_hash text not null unique/);
  assert.doesNotMatch(migration, /\bpublic_token\b|\braw_token\b/);
  assert.match(migration, /course_content_version integer not null/);
  assert.match(migration, /expires_at timestamptz not null/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.training_specialist_review_invites from anon, authenticated/);
  assert.match(migration, /grant all on public\.training_specialist_review_invites to service_role/);
  assert.match(migration, /where status in \('pending', 'opened'\)/);
});

test("reviewer invite action creates a strong token, stores its hash, and sends one tracked email", async () => {
  const action = await source("src/app/actions/training-specialist-invites.ts");

  assert.match(action, /randomBytes\(32\)\.toString\("base64url"\)/);
  assert.match(action, /hashSpecialistReviewToken\(rawToken\)/);
  assert.match(action, /token_hash: tokenHash/);
  assert.match(action, /course_content_version: course\.content_version/);
  assert.match(action, /training_specialist_review_invite/);
  assert.match(action, /training-specialist-review-invite:\$\{invite\.id\}/);
  assert.match(action, /\/training\/review\/\$\{rawToken\}/);
  assert.match(action, /status: "revoked"/);
  assert.match(action, /Choose a future review due date/);
});

test("external specialist approval requires all configured review checks and does not auto-publish", async () => {
  const action = await source("src/app/actions/training-specialist-invites.ts");

  assert.match(action, /definition\.items\.every\(\(item\) => checklist\[item\.id\]\)/);
  assert.match(action, /Complete every specialist review check before approving the course/);
  assert.match(action, /specialist_reviewed_by: approved \? invite\.reviewer_name : null/);
  assert.match(action, /specialist_reviewed_at: approved \? now : null/);
  assert.match(action, /course\.content_version !== invite\.course_content_version/);
  assert.match(action, /course changed after the review was assigned/);
  assert.match(action, /status: "draft"/);
  assert.doesNotMatch(action, /status: "published"/);
});

test("external specialist review page is private, noindex, and shows the actual course material", async () => {
  const page = await source("src/app/training/review/[token]/page.tsx");

  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /Private specialist review/);
  assert.match(page, /Read the lessons and final assessment/);
  assert.match(page, /course\.modules\.map/);
  assert.match(page, /course\.assessments\.map/);
  assert.match(page, /Request changes/);
  assert.match(page, /Approve specialist review/);
  assert.match(page, /It does not automatically publish the course/);
});

test("all seven specialist-gated courses have a real checklist definition", async () => {
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
    assert.ok(definitions.includes(`"${slug}"`), "Missing specialist definition: " + slug);
  }

  assert.match(definitions, /Credit-assistance boundaries are explicit/);
  assert.match(definitions, /State and territory differences are handled correctly/);
  assert.match(definitions, /Participant privacy and consent handling are appropriate/);
});

test("admin specialist queue supports assignment, due dates, invite status, revoke, and reassign", async () => {
  const page = await source("src/app/workspace/admin/training/reviews/page.tsx");
  const admin = await source("src/lib/training-admin.ts");

  assert.match(page, /Assign a specialist reviewer/);
  assert.match(page, /reviewer_email/);
  assert.match(page, /due_date/);
  assert.match(page, /Send secure review/);
  assert.match(page, /Revoke invite/);
  assert.match(page, /Reviewer opened/);
  assert.match(admin, /training_specialist_review_invites/);
  assert.match(admin, /latestInviteByCourse/);
});

test("specialist invite token lookup hashes the URL token before querying storage", async () => {
  const lib = await source("src/lib/training-specialist-invites.ts");

  assert.match(lib, /createHash\("sha256"\)/);
  assert.match(lib, /\.eq\("token_hash", tokenHash\)/);
  assert.match(lib, /invite\.status === "revoked"/);
  assert.match(lib, /new Date\(invite\.expires_at\)\.getTime\(\) <= Date\.now\(\)/);
  assert.match(lib, /review_requirement", "specialist"/);
});


test("substantive course edits revoke any active external specialist link", async () => {
  const adminAction = await source("src/app/actions/training-admin.ts");

  assert.match(adminAction, /training_specialist_review_invites/);
  assert.match(adminAction, /\.in\("status", \["pending", "opened"\]\)/);
  assert.match(adminAction, /status: "revoked"/);
});

test("review queue surfaces correction notes as outstanding issues", async () => {
  const page = await source("src/app/workspace/admin/training/reviews/page.tsx");

  assert.match(page, /Outstanding issues/);
  assert.match(page, /review\?\.decision === "changes_requested"/);
});
