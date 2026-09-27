import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("legacy Work Readiness routes are retired without weakening role boundaries", async()=>{
  const [vaPage,recruiterPage,nav]=await Promise.all([
    read("src/app/workspace/va/work-readiness/page.tsx"),
    read("src/app/workspace/recruiter/work-readiness/page.tsx"),
    read("src/components/app-nav-links.tsx"),
  ]);

  assert.match(vaPage,/requireRoleFast\("va"\)/);
  assert.match(vaPage,/redirect\("\/workspace\/va\/profile"\)/);
  assert.match(recruiterPage,/requireRoleFast\("recruiter"\)/);
  assert.match(recruiterPage,/redirect\("\/workspace\/recruiter\/talent"\)/);
  assert.doesNotMatch(nav,/\["Work Readiness", "\/workspace\/va\/work-readiness"/);
  assert.doesNotMatch(nav,/\["Work Readiness", "\/workspace\/recruiter\/work-readiness"/);
});

test("recruiter mobile navigation exposes Account settings like the other roles", async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  const recruiterBlock=nav.slice(nav.indexOf("recruiter: ["),nav.indexOf("admin: ["));
  assert.match(recruiterBlock,/Account settings/);
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
