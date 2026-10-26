import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  hasMissingTrainingCertificateRecipient,
  normalizeTrainingCertificateName,
} from "../src/lib/training-certificate-identity.ts";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("legacy recipient detection accepts only empty, not malformed or already claimed, records", () => {
  assert.equal(hasMissingTrainingCertificateRecipient(null), true);
  assert.equal(hasMissingTrainingCertificateRecipient({}), true);
  assert.equal(hasMissingTrainingCertificateRecipient({ recipient_name: null, record_type: "completion" }), true);
  assert.equal(hasMissingTrainingCertificateRecipient({ recipient_name: "  " }), true);
  assert.equal(hasMissingTrainingCertificateRecipient({ recipient_name: "Recorded Learner" }), false);
  assert.equal(hasMissingTrainingCertificateRecipient({ recipient_name: "x" }), false);
  assert.equal(hasMissingTrainingCertificateRecipient({ recipient_name: 42 }), false);
  assert.equal(hasMissingTrainingCertificateRecipient({ recipient_name: false }), false);
  assert.equal(hasMissingTrainingCertificateRecipient("bad-metadata"), false);
  assert.equal(hasMissingTrainingCertificateRecipient([]), false);
  assert.equal(hasMissingTrainingCertificateRecipient(undefined), false);
  assert.equal(normalizeTrainingCertificateName("  Learner    Name  "), "Learner Name");
});

test("account owner repair requires verified sign-in, explicit consent and confirmed server identity", async () => {
  const action=await read("src/app/actions/training-certificate-identity.ts");
  const section=action.split("export async function addNameToUnnamedTrainingCertificateAction(formData: FormData) {")[1]
    ?.split("export async function correctIssuedTrainingCertificateNameAction")[0];
  assert.ok(section, "Dedicated legacy repair action is required");
  for (const fragment of [
    'requireAuthenticatedUserFast(accountPath)',
    "supabase.auth.getUser()",
    "user.id !== userId",
    "!user.email_confirmed_at",
    'publish_unnamed_certificate_consent',
    'enforceEmailAndIpRateLimit("training_unnamed_certificate_name"',
    "admin.auth.admin.getUserById(user.id)",
    "confirmedTrainingCertificateName(identity.user.app_metadata)",
    "hasMissingTrainingCertificateRecipient(certificate.metadata)",
    '.eq("user_id", user.id)',
    '.eq("credential_code", code)',
    '.eq("metadata", JSON.stringify(metadata))',
    '.is("revoked_at", null)',
    'revalidatePath("/training/certificates/"',
  ]) assert.ok(section.includes(fragment), "Missing authorization/safety clause: " + fragment);
  assert.match(section, /\.select\("id"\)\s*\.maybeSingle\(\)/);
  assert.match(section, /if \(updateError \|\| !updated\) accountStatus\("name_update_failed"\)/);
  assert.doesNotMatch(section, /user\.user_metadata|raw_user_meta_data|\.from\("profiles"\)/);
  assert.doesNotMatch(section, /issued_at\s*:|credential_code\s*:|completed_at\s*:|training_assessment_submissions/);
  assert.match(section, /recipient_name_source: "learner_confirmed_legacy_missing_name"/);
});

test("current recipient corrections remain support-only with verification and audit controls", async () => {
  const action=await read("src/app/actions/training-certificate-identity.ts");
  const section=action.split("export async function correctIssuedTrainingCertificateNameAction")[1];
  assert.match(section, /requireRoleFast\("admin"\)/);
  assert.match(section, /identity_verified/);
  assert.match(section, /case_reference_sha256/);
  assert.match(section, /recipient_name_corrections/);
  assert.match(section, /\.eq\("user_id", certificate.user_id\)/);
});

test("unnamed public certificate links to owner claim and disables premature print", async () => {
  const [page, account, css]=await Promise.all([
    read("src/app/training/certificates/[code]/page.tsx"),
    read("src/app/workspace/training/account/page.tsx"),
    read("src/app/training/certificates/[code]/certificate.css"),
  ]);
  assert.match(page, /Recipient name pending confirmation/);
  assert.match(page, /recipient name confirmation needed/i);
  assert.match(page, /\/workspace\/training\/account#certificate-name/);
  assert.match(page, /showPrint=\{Boolean\(credential\.recipientName\)\}/);
  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.doesNotMatch(page, /email|phone/i);
  assert.match(account, /addNameToUnnamedTrainingCertificateAction/);
  assert.match(account, /publish_unnamed_certificate_consent/);
  assert.match(account, /Confirm your name first/);
  assert.match(account, /name_added:/);
  assert.match(account, /Contact VAPH support|contact VAPH support/);
  assert.match(css, /\.credential-recipient-pending/);
});
