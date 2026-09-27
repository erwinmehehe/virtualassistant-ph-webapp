import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("staff can request missing role details only for linked client roles", async () => {
  const action = await read("src/app/actions/agency-role.ts");
  assert.match(action, /requestClientRoleDetailsAction/);
  assert.match(action, /requireAnyRole\(\["recruiter", "admin"\]\)/);
  assert.doesNotMatch(action, /job\.recruiter_id !== user\.id/);
  assert.doesNotMatch(action, /This role is assigned to another recruiter/);
  assert.match(action, /Link the client account before requesting missing details/);
  assert.match(action, /publicationMissingDetails\(job\)/);
  assert.match(action, /await admin\.from\("notifications"\)\.insert/);
  assert.doesNotMatch(action, /sendRoleDetailsRequestEmail/);
  assert.doesNotMatch(action, /role_details_email_warning/);
  assert.match(action, /email_sent: false/);
  assert.match(action, /email_reason: "client_email_shortlist_only"/);
  assert.match(action, /role_details_requested/);
});

test("role details email helper remains hard-disabled before shortlist", async () => {
  const email = await read("src/lib/email.ts");
  assert.match(email, /const CLIENT_PRE_SHORTLIST_EMAILS_ENABLED = false/);
  const start = email.indexOf("export async function sendRoleDetailsRequestEmail");
  assert.ok(start >= 0);
  const section = email.slice(start, start + 1200);
  assert.match(section, /client_email_deferred_until_shortlist/);
});

test("client completion flow only writes fields that are currently missing", async () => {
  const jobs = await read("src/app/actions/jobs.ts");
  const start = jobs.indexOf("export async function saveClientRoleReadinessDetailsAction");
  const end = jobs.indexOf("export async function closeJobAction", start);
  const block = jobs.slice(start, end);
  assert.match(block, /requireRole\("client"\)/);
  assert.match(block, /\.eq\("client_id", user\.id\)/);
  assert.match(block, /const missing = new Set\(publicationMissingDetails\(job\)\)/);
  assert.match(block, /if \(missing\.has\("start timing"\)\)/);
  assert.match(block, /if \(missing\.has\("budget"\)\)/);
  assert.match(block, /if \(job\.status === "closed"\)/);
  assert.doesNotMatch(block, /status:\s*"published"/);
});

test("client and admin workspaces retain the missing-details workflow without a recruiter repair form", async () => {
  const [client, recruiter, admin, form] = await Promise.all([
    read("src/app/workspace/client/jobs/[id]/page.tsx"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/app/workspace/admin/jobs/[id]/page.tsx"),
    read("src/components/role-readiness-form.tsx"),
  ]);
  assert.match(client, /saveClientRoleReadinessDetailsAction/);
  assert.match(client, /audience="client"/);
  assert.doesNotMatch(recruiter, /requestClientRoleDetailsAction|RoleReadinessForm|#role-readiness/);
  assert.match(admin, /requestClientRoleDetailsAction/);
  assert.match(form, /Request missing details from client/);
  assert.match(form, /Complete your hiring brief/);
});

test("missing-details requests stay in-app and never show an email failure warning", async () => {
  const [action, today, role] = await Promise.all([
    read("src/app/actions/agency-role.ts"),
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
  ]);
  assert.match(action, /await admin\.from\("notifications"\)\.insert/);
  assert.doesNotMatch(action, /admin\.auth\.admin\.getUserById/);
  assert.doesNotMatch(action, /sendRoleDetailsRequestEmail/);
  assert.doesNotMatch(today, /role_details_email_warning/);
  assert.doesNotMatch(role, /role_details_email_warning/);
  assert.match(today, /No client email was sent/);
  assert.doesNotMatch(role, /role_details_requested|No email was sent/);
});
