import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("training learner journey remains connected from signup through verified hiring evidence", async () => {
  const [
    signup,
    confirm,
    trainingAction,
    completion,
    _adminAction,
    credentials,
    recruiterCandidate,
    clientCandidate,
    clientShortlist,
    clientHiringRoom,
    clientHiringRoomMigration,
    analyticsRoute,
    adminAnalytics,
  ] = await Promise.all([
    source("src/app/actions/training-auth.ts"),
    source("src/app/auth/confirm/route.ts"),
    source("src/app/actions/training.ts"),
    source("src/lib/training-completion.ts"),
    source("src/app/actions/training-admin.ts"),
    source("src/lib/training-credentials.ts"),
    source("src/app/workspace/recruiter/candidates/[id]/page.tsx"),
    source("src/app/workspace/client/candidates/[id]/page.tsx"),
    source("src/app/workspace/client/candidates/page.tsx"),
    source("src/lib/client-hiring-room.ts"),
    source("supabase/migrations/20260924172000_client_hiring_room_summary.sql"),
    source("src/app/api/analytics/route.ts"),
    source("src/app/workspace/admin/analytics/page.tsx"),
  ]);

  // Account creation and branded confirmation email.
  assert.match(signup, /account_type:\s*"training"/);
  assert.match(signup, /type:\s*"signup"/);
  assert.match(signup, /sendAccountConfirmationEmail/);
  assert.match(signup, /const next = trainingCourseDestination\(courseSlug\)/);
  assert.match(signup, /training_account_created/);

  // Confirmation is verified on the app domain and training accounts are not
  // forced into a VA/client role workspace.
  assert.match(confirm, /verifyOtp\(\{ token_hash: tokenHash, type \}\)/);
  assert.match(confirm, /isTrainingPath\(requestedNext\)/);
  assert.match(confirm, /"\/workspace\/training"/);

  // Learner course start, integrity-gated lesson completion and automatic final scoring.
  assert.match(trainingAction, /startTrainingCourseAction/);
  assert.match(trainingAction, /training_course_start/);
  assert.match(trainingAction, /recordTrainingLessonEngagementAction/);
  assert.match(trainingAction, /checkTrainingLessonCheckpointAction/);
  assert.match(trainingAction, /markTrainingLessonCompleteAction/);
  assert.match(trainingAction, /training_lesson_progress/);
  assert.match(trainingAction, /training_lesson_complete/);
  assert.match(trainingAction, /submitTrainingAssessmentAction/);
  assert.match(trainingAction, /failAssessmentSubmission\("lessons"\)/);
  assert.match(trainingAction, /training_assessment_submit/);
  assert.match(trainingAction, /source: "automatic"/);
  assert.match(trainingAction, /finalizeTrainingCourseIfEligible/);

  // A server-scored passing submission is the completion gate; no admin review is required.
  assert.match(trainingAction, /status: passed \? "reviewed" : "needs_revision"/);
  assert.match(completion, /training_assessment_submissions/);
  assert.match(completion, /status", "reviewed"/);
  assert.match(completion, /submission\.score/);
  assert.match(completion, /training_certificates/);
  assert.match(completion, /certificate_of_completion/);

  // Hiring evidence is certificate-backed only, never inferred from lesson progress.
  assert.match(credentials, /\.from\("training_certificates"\)/);
  assert.match(credentials, /\.is\("revoked_at", null\)/);
  assert.match(credentials, /\.eq\("status", "published"\)/);
  assert.doesNotMatch(credentials, /training_lesson_progress/);
  assert.match(recruiterCandidate, /getTrainingCredentialsForUser/);
  assert.match(clientCandidate, /getTrainingCredentialsForUser/);
  assert.match(clientShortlist, /trainingCredentialsByUser\(summary\.credentials \|\| \[\]\)/);
  assert.match(clientHiringRoomMigration, /from training_certificates tc/);
  assert.match(clientHiringRoomMigration, /where tc\.revoked_at is null/);
  assert.match(clientHiringRoomMigration, /c\.status='published'/);
  assert.match(clientHiringRoom, /credentialCode: row\.credential_code/);

  // Funnel events remain accepted and visible to admins.
  for (const eventName of [
    "training_landing_view",
    "training_account_click",
    "training_course_start",
    "training_lesson_complete",
    "training_assessment_submit",
    "training_course_complete",
  ]) {
    assert.match(analyticsRoute, new RegExp(eventName));
  }
  assert.match(analyticsRoute, /training_account_created/);
  assert.match(analyticsRoute, /training_email_confirmed/);
  assert.match(signup, /recordProductEvent\("training_account_created"/);
  assert.match(adminAnalytics, /Training engagement/);
  assert.match(adminAnalytics, /Assessment submissions|Training engagement/);
});

test("training signup and workspace remain intentionally separate from candidate onboarding", async () => {
  const signup = await source("src/app/actions/training-auth.ts");
  const trainingAuth = await source("src/lib/auth.ts");

  assert.doesNotMatch(signup, /va_profiles|va_vetting|applications|directory_visible/i);
  const trainingGuard = trainingAuth.match(/export async function requireAuthenticatedUserFast[\s\S]*?\n}\n/)?.[0] || "";
  assert.doesNotMatch(trainingGuard, /requireRoleFast\("va"\)/);
});

test("certificate issuance remains idempotent and cannot happen from lessons alone when an assessment is published", async () => {
  const completion = await source("src/lib/training-completion.ts");

  assert.match(completion, /existingCertificate/);
  assert.match(completion, /error\.code !== "23505"/);
  assert.match(completion, /publishedAssessments\.length/);
  assert.match(completion, /publishedAssessments\.every/);
  assert.match(completion, /return \{ completed: false, newlyCompleted: false, certificateIssued: false \}/);
});
