import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("sensitive account changes require current-password reauthentication", async () => {
  const [actions, page] = await Promise.all([
    read("src/app/actions/account-security.ts"),
    read("src/app/workspace/account/page.tsx"),
  ]);

  assert.match(actions, /async function verifySensitiveAccountPassword/);
  assert.match(actions, /signInWithPassword/);
  assert.match(actions, /persistSession:\s*false/);
  assert.match(actions, /autoRefreshToken:\s*false/);
  assert.match(actions, /signOut\(\{ scope: "local" \}\)/);
  assert.match(actions, /current_password/);
  assert.match(actions, /requestAccountEmailChangeAction/);
  assert.match(actions, /requestAccountDeletionAction/);
  assert.match(page, /name="current_password"/);
  assert.match(page, /Confirm current password/);
});

test("Account Center supports secure password change and suspicious-session containment", async () => {
  const [actions, page, sessions, security] = await Promise.all([
    read("src/app/actions/account-security.ts"),
    read("src/app/workspace/account/page.tsx"),
    read("src/components/account-security/session-list.tsx"),
    read("src/lib/account-security.ts"),
  ]);

  assert.match(actions, /changeAccountPasswordAction/);
  assert.match(actions, /current_password/);
  assert.match(actions, /new_password/);
  assert.match(actions, /confirm_password/);
  assert.match(actions, /reportUnknownSessionAction/);
  assert.match(actions, /signOut\(\{ scope: "others" \}\)/);
  assert.match(security, /session_reported/);
  assert.match(page, /Change password/);
  assert.match(sessions, /This wasn&apos;t me|This wasn't me/);
});

test("deletion requests can be cancelled by the user and reviewed by admins without hard deleting auth users", async () => {
  const [actions, prefs, adminPage, nav, migration] = await Promise.all([
    read("src/app/actions/account-security.ts"),
    read("src/lib/account-display-preferences.ts"),
    read("src/app/workspace/admin/account-deletion-requests/page.tsx"),
    read("src/components/app-nav-links.tsx"),
    read("supabase/migrations/20260921133000_account_security_hardening.sql"),
  ]);

  assert.match(actions, /cancelAccountDeletionRequestAction/);
  assert.match(actions, /reviewAccountDeletionRequestAction/);
  assert.doesNotMatch(actions, /deleteUser\(/);
  assert.match(prefs, /cancelled|reviewing|approved|rejected/);
  assert.match(adminPage, /Account deletion requests/);
  assert.match(adminPage, /reviewing/);
  assert.match(adminPage, /approved/);
  assert.match(adminPage, /rejected/);
  assert.match(nav, /\/workspace\/admin\/account-deletion-requests/);
  assert.match(migration, /drop constraint/);
  assert.match(migration, /pending.*cancelled.*reviewing.*approved.*rejected/s);
  assert.match(migration, /revoke update on public\.account_deletion_requests from authenticated/);
});

test("routine workflow state changes stay in-app instead of consuming Resend quota", async () => {
  const [matching, jobs, emailCapacity] = await Promise.all([
    read("src/app/actions/matching.ts"),
    read("src/app/actions/jobs.ts"),
    read("tests/email-capacity-protection.test.mjs"),
  ]);

  assert.doesNotMatch(matching, /sendVaMatchEmail/);
  assert.doesNotMatch(jobs, /sendTransactionalEventEmail/);
  assert.match(matching, /notifications/);
  assert.match(emailCapacity, /routine workflow state changes stay in-app/);
});

test("authenticated visual QA treats missing smoke credentials as a visible blocker rather than a pass", async () => {
  const workflow = await read(".github/workflows/dashboard-visual.yml");

  assert.match(workflow, /core\.setFailed|exit 1/);
  assert.doesNotMatch(workflow, /ready but skipped until the SMOKE_/);
});
