import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(path, "utf8");
}

test("public navigation uses one role-aware account login", async () => {
  const nav = await source("src/components/site-nav.tsx");
  assert.match(nav, /const ACCOUNT_LOGIN = "\/auth\/login"/);
  assert.match(nav, /className="va-nav-account-login" href=\{ACCOUNT_LOGIN\}>Log in/);
  assert.doesNotMatch(nav, /CLIENT_LOGIN|VA_LOGIN/);
  assert.doesNotMatch(nav, /Client Portal|VA log in/);
});

test("VA profile removes duplicate utility and resume upload rows", async () => {
  const page = await source("src/app/workspace/va/profile/page.tsx");
  assert.match(page, /<ResumeAutoFill formId="va-profile-form" hasSavedResume=\{Boolean\(va\?\.resume_path\)\}/);
  assert.doesNotMatch(page, /profile-utility-row/);
  assert.doesNotMatch(page, /notice version/);
  assert.doesNotMatch(page, /<input type="file" name="resume"/);
  assert.match(page, /profile-side-actions/);
  assert.match(page, /Professional links/);
});

test("resume picker attaches the chosen file to the main profile form", async () => {
  const component = await source("src/components/resume-autofill.tsx");
  assert.match(component, /new DataTransfer\(\)/);
  assert.match(component, /target\.files = transfer\.files/);
  assert.match(component, /form=\{formId\}/);
  assert.match(component, /name="resume"/);
  assert.match(component, /if \(file\) attachResumeToProfileForm\(file\)/);
});

test("resume autofill accepts generic browser MIME types by extension", async () => {
  const action = await source("src/app/actions/resume-autofill.ts");
  assert.match(action, /application\/octet-stream/);
  assert.match(action, /name\.endsWith\("\.pdf"\)/);
  assert.match(action, /name\.endsWith\("\.docx"\)/);
  assert.match(action, /DOC resume can still be saved/);
});

test("resume autofill has enough request body headroom", async () => {
  const config = await source("next.config.ts");
  assert.match(config, /bodySizeLimit:\s*"8mb"/);
});

test("profile completeness listens to the external resume input", async () => {
  const strength = await source("src/components/live-profile-strength.tsx");
  assert.match(strength, /form\.elements\.namedItem\("resume"\)/);
  assert.match(strength, /resumeInput\?\.addEventListener\("change", calculate\)/);
});

test("resume parser can fill a useful headline and summary without a Summary heading", async () => {
  const parsing = await source("src/lib/resume-parsing.ts");
  assert.match(parsing, /primary_category \? `\$\{primary_category\} Virtual Assistant` : null/);
  assert.match(parsing, /Many resumes start with a short professional paragraph/);
});
