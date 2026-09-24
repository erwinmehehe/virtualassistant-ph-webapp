import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("new certificates are private for public profile display by default", async () => {
  const completion = await read("src/lib/training-completion.ts");
  const helper = await read("src/lib/training-credentials.ts");

  assert.match(completion, /public_profile_visible: false/);
  assert.match(helper, /publicVisible: boolean/);
  assert.match(helper, /certificate\.metadata\?\.public_profile_visible === true/);
  assert.match(helper, /options\.publicOnly/);
  assert.match(helper, /if \(!certificateRows\.length\) return byUser/);
});

test("VA certificate visibility action is ownership-scoped and preserves metadata", async () => {
  const action = await read("src/app/actions/training-credentials.ts");

  assert.match(action, /requireRole\("va"\)/);
  assert.match(action, /\.eq\("id", certificateId\)/);
  assert.match(action, /\.eq\("user_id", user\.id\)/);
  assert.match(action, /\.is\("revoked_at", null\)/);
  assert.match(action, /\.\.\.metadata/);
  assert.match(action, /public_profile_visible: publicVisible/);
  assert.match(action, /currentPublicVisible === publicVisible/);
  assert.match(action, /training_certificate_profile_added/);
  assert.match(action, /training_certificate_profile_removed/);
  assert.match(action, /revalidatePath\("\/find-talent"\)/);
});

test("VA profile exposes per-certificate public visibility controls", async () => {
  const [component, page] = await Promise.all([
    read("src/components/training-credentials.tsx"),
    read("src/app/workspace/va/profile/page.tsx"),
  ]);

  assert.match(component, /updateTrainingCertificateVisibilityAction/);
  assert.match(component, /Public profile: shown/);
  assert.match(component, /Public profile: private/);
  assert.match(component, /Show publicly/);
  assert.match(component, /Hide publicly/);
  assert.match(component, /overall public-profile consent and listing are active/);
  assert.match(page, /Certificate can now appear on your public talent card/);
  assert.match(page, /Recruiters can still verify it internally/);
});

test("course completion offers profile opt-in without making it automatic", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx");

  assert.match(page, /Show on public profile/);
  assert.match(page, /training_certificate_profile_add/);
  assert.match(page, /course\.certificate && !course\.certificate\.publicVisible/);
  assert.match(page, /Shown on public profile/);
});

test("public talent directory only shows opted-in verified training", async () => {
  const page = await read("src/app/find-talent/page.tsx");

  assert.match(page, /getTrainingCredentialsForUsers/);
  assert.match(page, /\{ publicOnly: true \}/);
  assert.match(page, /Verified training/);
  assert.match(page, /credential\.credentialCode/);
  assert.match(page, /credential\.courseTitle/);
});

test("recruiter training views are tracked as evidence and do not change hiring eligibility", async () => {
  const [page, component] = await Promise.all([
    read("src/app/workspace/recruiter/candidates/[id]/page.tsx"),
    read("src/components/training-credentials.tsx"),
  ]);

  assert.match(page, /training_certificate_recruiter_view/);
  assert.match(page, /certificate_count:trainingCredentials\.length/);
  assert.match(component, /does not verify employment history, role experience, or hiring eligibility/);
  assert.match(component, /never required for recruiter approval or client selection/);
});

test("training analytics extends from certificate issue to public profile and recruiter view", async () => {
  const [training, analytics] = await Promise.all([
    read("src/lib/training.ts"),
    read("src/app/workspace/admin/analytics/page.tsx"),
  ]);

  assert.match(training, /training_certificate_issued/);
  assert.match(training, /training_certificate_profile_added/);
  assert.match(training, /training_certificate_recruiter_view/);
  assert.match(analytics, /Certificates issued/);
  assert.match(analytics, /Certificates added publicly/);
  assert.match(analytics, /Recruiter training views/);
});

test("certificate verification has mobile share and print support", async () => {
  const [page, actions, css] = await Promise.all([
    read("src/app/training/certificates/[code]/page.tsx"),
    read("src/components/training-certificate-actions.tsx"),
    read("src/app/training/certificates/[code]/certificate.css"),
  ]);

  assert.match(page, /TrainingCertificateActions/);
  assert.match(page, /showPrint/);
  assert.match(actions, /window\.print\(\)/);
  assert.match(actions, /training_certificate_print/);
  assert.match(actions, /training_certificate_share/);
  assert.match(css, /credential-print-actions/);
  assert.match(css, /@media print/);
  assert.match(css, /@media \(max-width: 430px\)/);
});
