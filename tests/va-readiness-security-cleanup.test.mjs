import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("VA work readiness is a real focused page instead of a redirect", async()=>{
  const [page, profile, action, css]=await Promise.all([
    read("src/app/workspace/va/work-readiness/page.tsx"),
    read("src/app/workspace/va/profile/page.tsx"),
    read("src/app/actions/work-readiness.ts"),
    read("src/app/dashboard-premium.css"),
  ]);
  assert.doesNotMatch(page,/redirect\(/);
  assert.match(page,/Work readiness/);
  assert.match(page,/va-work-readiness-page/);
  assert.match(page,/va-readiness-check/);
  assert.match(page,/Call-ready headset/);
  assert.match(page,/Webcam ready/);
  assert.match(page,/Quiet workspace/);
  assert.doesNotMatch(profile,/id="work-readiness"/);
  assert.doesNotMatch(profile,/saveVaWorkSetupAction/);
  assert.match(action,/redirect\("\/workspace\/va\/work-readiness\?saved=1"\)/);
  assert.match(css,/\.va-readiness-check strong/);
  assert.match(css,/\.va-readiness-check small/);
});

test("recruiter sidebar omits Account settings while other role nav stays intact", async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  const recruiterBlock=nav.slice(nav.indexOf("recruiter: ["),nav.indexOf("admin: ["));
  assert.doesNotMatch(recruiterBlock,/Account settings/);
  assert.match(nav,/client:[\s\S]*Account settings/);
  assert.match(nav,/va:[\s\S]*Account settings/);
  assert.match(nav,/admin:[\s\S]*Account settings/);
});

test("successful login records security context without sending a new-login email", async()=>{
  const [security,email,accountPage]=await Promise.all([
    read("src/lib/account-security.ts"),
    read("src/lib/email.ts"),
    read("src/app/workspace/account/page.tsx"),
  ]);
  assert.match(security,/login_succeeded/);
  assert.match(security,/recognized/);
  assert.match(security,/baseline/);
  assert.doesNotMatch(security,/sendNewLoginSecurityEmail/);
  assert.doesNotMatch(security,/shouldAlert/);
  assert.doesNotMatch(email,/export async function sendNewLoginSecurityEmail/);
  assert.doesNotMatch(accountPage,/We email you when a successful sign-in/);
  assert.match(accountPage,/recorded in your security activity/i);
});

test("authenticated dashboard visual QA fails when smoke credentials are missing", async()=>{
  const workflow=await read(".github/workflows/dashboard-visual.yml");
  assert.match(workflow,/Authenticated dashboard QA is required/);
  assert.match(workflow,/exit 1/);
  assert.doesNotMatch(workflow,/ready but skipped until the SMOKE_/);
});

test("Account Center hardening requires reauthentication and supports suspicious-session containment", async()=>{
  const [actions,sessions]=await Promise.all([
    read("src/app/actions/account-security.ts"),
    read("src/components/account-security/session-list.tsx"),
  ]);
  assert.match(actions,/verifySensitiveAccountPassword/);
  assert.match(actions,/persistSession:\s*false/);
  assert.match(actions,/changeAccountPasswordAction/);
  assert.match(actions,/reportUnknownSessionAction/);
  assert.match(actions,/cancelAccountDeletionRequestAction/);
  assert.doesNotMatch(actions,/deleteUser\(/);
  assert.match(sessions,/This wasn&apos;t me|This wasn't me/);
});
