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
  assert.match(action, /admin\.auth\.admin\.getUserById\(job\.client_id\)/);
  assert.doesNotMatch(action, /\.select\("email,full_name"\)/);
  assert.match(action, /sendRoleDetailsRequestEmail/);
  assert.match(action, /email_sent: emailSent/);
  assert.match(action, /role_details_email_warning/);
  assert.match(action, /role_details_requested/);
});

test("role details request email is branded, reply-routed, preference-aware and daily-idempotent", async () => {
  const email = await read("src/lib/email.ts");
  assert.match(email, /sendRoleDetailsRequestEmail/);
  assert.match(email, /"role_details_request"/);
  assert.match(email, /role-details-request-\$\{args\.jobId\}-\$\{dateKey\}/);
  assert.match(email, /replyTo: configuredReplyTo\(\)/);
  assert.match(email, /Complete hiring brief/);
  assert.match(email, /\["client_followup", "lead_claim_nudge", "role_details_request"\]/);
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

test("client and staff workspaces expose the missing-details workflow", async () => {
  const [client, recruiter, admin, form] = await Promise.all([
    read("src/app/workspace/client/jobs/[id]/page.tsx"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/app/workspace/admin/jobs/[id]/page.tsx"),
    read("src/components/role-readiness-form.tsx"),
  ]);
  assert.match(client, /saveClientRoleReadinessDetailsAction/);
  assert.match(client, /audience="client"/);
  assert.match(recruiter, /requestClientRoleDetailsAction/);
  assert.match(admin, /requestClientRoleDetailsAction/);
  assert.match(form, /Request missing details from client/);
  assert.match(form, /Complete your hiring brief/);
});


test("missing profile email no longer blocks the client-details request", async () => {
  const [action, today, role] = await Promise.all([
    read("src/app/actions/agency-role.ts"),
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
  ]);
  assert.match(action, /const clientEmail = String\(authUser\?\.email \|\| ""\)\.trim\(\)/);
  assert.match(action, /await admin\.from\("notifications"\)\.insert/);
  assert.match(action, /emailWarning = true/);
  assert.match(today, /role_details_email_warning/);
  assert.match(role, /role_details_email_warning/);
});
