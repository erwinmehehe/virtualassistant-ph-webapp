import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = "src/components/training-credentials.tsx";
const helperPath = "src/lib/training-credentials.ts";
const vaProfilePath = "src/app/workspace/va/profile/page.tsx";
const recruiterProfilePath = "src/app/workspace/recruiter/candidates/[id]/page.tsx";
const cssPath = "src/app/dashboard-premium.css";

test("verified training cards expose course evidence and public credential verification", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /Verified training/);
  assert.match(component, /Credential/);
  assert.match(component, /credential\.credentialCode/);
  assert.match(component, /\/training\/certificates\//);
  assert.match(component, /Verify credential/);
  assert.match(component, /target="_blank"/);
  assert.match(component, /Completed \{issuedLabel\(credential\.issuedAt\)\}/);
  assert.match(component, /durationLabel\(credential\.estimatedMinutes\)/);
  assert.match(component, /categoryLabel\(credential\.category\)/);
});

test("VA profile shows certificates in the main profile flow and explains automatic addition", async () => {
  const page = await readFile(vaProfilePath, "utf8");

  assert.match(page, /heading="Training & certificates"/);
  assert.match(page, /audience="self"/);
  assert.match(page, /selfService/);
  assert.match(page, /showEmpty/);

  const formEnd = page.indexOf("</form>");
  const training = page.indexOf('heading="Training & certificates"');
  const visibility = page.indexOf('id="visibility"');
  const sidebar = page.indexOf('<aside className="profile-editor-sidebar">');

  assert.ok(formEnd >= 0 && training > formEnd, "Training should sit outside the profile edit form");
  assert.ok(visibility > training, "Training should appear before public-profile privacy settings");
  assert.ok(sidebar > training, "Training should remain in the main profile column, not the sidebar");
});

test("recruiter candidate profile always exposes verified training evidence separately from experience", async () => {
  const page = await readFile(recruiterProfilePath, "utf8");

  assert.match(page, /heading="Verified training & certificates"/);
  assert.match(page, /audience="recruiter"/);
  assert.match(page, /showEmpty/);
  assert.match(page, /getTrainingCredentialsForUser\(id\)/);
});

test("credential helper only returns active certificates for published courses", async () => {
  const helper = await readFile(helperPath, "utf8");

  assert.match(helper, /from\("training_certificates"\)/);
  assert.match(helper, /\.is\("revoked_at", null\)/);
  assert.match(helper, /from\("training_courses"\)/);
  assert.match(helper, /\.eq\("status", "published"\)/);
});

test("training evidence copy does not imply employment or hiring eligibility", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /does not verify employment history, role experience, or hiring eligibility/);
  assert.match(component, /separate from work experience/);
  assert.match(component, /never required for recruiter approval or client selection/);
});

test("credential cards use colored course icons and collapse cleanly on mobile", async () => {
  const [component, css] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  for (const tone of [
    "indigo",
    "emerald",
    "rose",
    "cyan",
    "violet",
    "amber",
    "blue",
    "purple",
    "teal",
    "sky",
    "slate",
  ]) {
    assert.ok(css.includes(`.training-credential-tone-${tone}`), "Missing credential tone " + tone);
  }

  assert.match(component, /credentialVisual/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /training-credential-proof code/);
  assert.match(css, /overflow-wrap: anywhere/);
});
