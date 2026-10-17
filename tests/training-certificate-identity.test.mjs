import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("name confirmation is an explicit signed-in action rather than an email-derived guess", async () => {
  const [identity, action, signup, form] = await Promise.all([
    source("src/lib/training-certificate-identity.ts"),
    source("src/app/actions/training-certificate-identity.ts"),
    source("src/app/actions/training-auth.ts"),
    source("src/components/training-join-form.tsx"),
  ]);
  assert.match(identity, /certificate_name_confirmed_at/);
  assert.match(identity, /certificate_name/);
  assert.doesNotMatch(identity, /metadata\?\.email/);
  assert.match(action, /requireAuthenticatedUserFast/);
  assert.match(action, /auth\.getUser\(\)/);
  assert.match(action, /publish_name_consent/);
  assert.match(action, /updateUserById\(user\.id/);
  assert.match(signup, /certificate_name_confirmed_at/);
  assert.match(form, /certificate_name_confirmed/);
});

test("certificate issuance requires a confirmed identity but retains the old credential intact", async () => {
  const completion = await source("src/lib/training-completion.ts");
  assert.match(completion, /confirmedTrainingCertificateName/);
  assert.match(completion, /if \(!existingCertificate\)/);
  assert.match(completion, /if \(recipientName\)/);
  assert.match(completion, /recipient_name: recipientName/);
  assert.match(completion, /issued_at: completedAt/);
  const actions = await source("src/app/actions/training-certificate-identity.ts");
  const learnerOnly = actions.split("export async function correctIssuedTrainingCertificateNameAction")[0];
  assert.doesNotMatch(learnerOnly, /\.from\("training_certificates"\)\s*\.update/);
  assert.match(learnerOnly, /finalizeTrainingCourseIfEligible/);
  assert.match(learnerOnly, /completed_at/);
});

test("verified staff correction is scoped, audited and does not reissue certificates", async () => {
  const action = await source("src/app/actions/training-certificate-identity.ts");
  const adminOnly = action.split("export async function correctIssuedTrainingCertificateNameAction")[1];
  assert.match(adminOnly, /requireRoleFast\("admin"\)/);
  assert.match(adminOnly, /identity_verified/);
  assert.match(adminOnly, /case_reference/);
  assert.match(adminOnly, /recipient_name_corrections/);
  assert.match(adminOnly, /\.is\("revoked_at", null\)/);
  assert.doesNotMatch(adminOnly, /issued_at:\s*new Date|credential_code:\s*completionCredentialCode/);
  const page = await source("src/app/workspace/admin/training/certificate-corrections/page.tsx");
  assert.match(page, /requireRoleFast\("admin"\)/);
  assert.match(page, /account ownership/);
});

test("learner can edit name even for Google sign-in, and a delayed certificate has a completion CTA", async () => {
  const [account, dashboard, assessment, course] = await Promise.all([
    source("src/app/workspace/training/account/page.tsx"),
    source("src/app/workspace/training/page.tsx"),
    source("src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx"),
    source("src/app/workspace/training/courses/[slug]/page.tsx"),
  ]);
  assert.match(account, /Certificate recipient name/);
  assert.match(account, /confirmTrainingCertificateNameAction/);
  assert.match(account, /Google/);
  assert.match(dashboard, /Confirm your certificate name/);
  assert.match(assessment, /Confirm certificate name/);
  assert.match(course, /Confirm certificate name/);
});
