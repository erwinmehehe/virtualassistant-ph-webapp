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
  assert.match(identity, /appMetadata\?\.certificate_recipient_name_confirmed_at/);
  assert.match(identity, /appMetadata\?\.certificate_recipient_name/);
  assert.doesNotMatch(identity, /metadata\?\.certificate_name_confirmed_at/);
  assert.doesNotMatch(identity, /metadata\?\.email/);
  assert.match(action, /requireAuthenticatedUserFast/);
  assert.match(action, /auth\.getUser\(\)/);
  assert.match(action, /publish_name_consent/);
  assert.match(action, /updateUserById\(user\.id/);
  assert.match(action, /app_metadata:/);
  assert.match(action, /certificate_recipient_name_confirmed_at/);
  assert.doesNotMatch(signup, /certificate_name_confirmed_at/);
  assert.match(signup, /certificate_name: parsed\.data\.full_name/);
  assert.match(form, /certificate_name_confirmed/);
});

test("certificate issuance requires a confirmed identity but retains the old credential intact", async () => {
  const completion = await source("src/lib/training-completion.ts");
  assert.match(completion, /confirmedTrainingCertificateName\(learner\.user\.app_metadata\)/);
  assert.match(completion, /email_confirmed_at/);
  assert.doesNotMatch(completion, /confirmedTrainingCertificateName\(learner\?\.user\?\.user_metadata\)/);
  assert.match(completion, /if \(!existingCertificate\)/);
  assert.match(completion, /if \(recipientName\)/);
  assert.match(completion, /recipient_name: recipientName/);
  assert.match(completion, /issued_at: completedAt/);
  const actions = await source("src/app/actions/training-certificate-identity.ts");
  const confirmationOnly = actions.split("export async function addNameToUnnamedTrainingCertificateAction")[0];
  assert.doesNotMatch(confirmationOnly, /\.from\("training_certificates"\)\s*\.update/);
  assert.match(confirmationOnly, /finalizeTrainingCourseIfEligible/);
  assert.match(confirmationOnly, /completed_at/);
});

test("verified staff correction is scoped, audited and does not reissue certificates", async () => {
  const action = await source("src/app/actions/training-certificate-identity.ts");
  const adminOnly = action.split("export async function correctIssuedTrainingCertificateNameAction")[1];
  assert.match(adminOnly, /requireRoleFast\("admin"\)/);
  assert.match(adminOnly, /identity_verified/);
  assert.match(adminOnly, /case_reference_sha256/);
  assert.match(adminOnly, /createHash\("sha256"\)/);
  assert.doesNotMatch(adminOnly, /case_reference:\s*caseReference/);
  assert.match(adminOnly, /\.eq\("metadata", JSON\.stringify\(metadata\)\)/);
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

test("a user-editable profile/Google metadata name cannot authorize an issued public certificate", async () => {
  const { confirmedTrainingCertificateName } = await import("../src/lib/training-certificate-identity.ts");
  const spoofedClientMetadata = {
    full_name: "Forged Person",
    certificate_name: "Forged Person",
    certificate_name_confirmed_at: new Date().toISOString(),
  };
  assert.equal(confirmedTrainingCertificateName(spoofedClientMetadata), null);
  assert.equal(confirmedTrainingCertificateName({
    certificate_recipient_name: "Server-owned Person",
  }), null);
  assert.equal(confirmedTrainingCertificateName({
    certificate_recipient_name: "Server-owned Person",
    certificate_recipient_name_confirmed_at: "invalid-time",
  }), null);
  assert.equal(confirmedTrainingCertificateName({
    certificate_recipient_name: "Server-owned Person",
    certificate_recipient_name_confirmed_at: new Date().toISOString(),
  }), "Server-owned Person");
  const account = await source("src/app/workspace/training/account/page.tsx");
  assert.match(account, /confirmedTrainingCertificateName\(user\.app_metadata\)/);
  const issuance = await source("src/lib/training-completion.ts");
  assert.match(issuance, /confirmedTrainingCertificateName\(learner\.user\.app_metadata\)/);
});
