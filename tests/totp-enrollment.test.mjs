import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("TOTP manager enrolls challenges verifies and never persists the secret", async () => {
  const source = await read("src/components/account-security/totp-manager.tsx");
  assert.match(source, /auth\.mfa\.enroll\(\{[\s\S]*factorType: "totp"/);
  assert.match(source, /auth\.mfa\.challenge\(/);
  assert.match(source, /auth\.mfa\.verify\(/);
  assert.match(source, /totp\.qr_code/);
  assert.match(source, /totp\.secret/);
  assert.match(source, /auth\.mfa\.unenroll\(\{ factorId: enrollment\.factorId \}\)/);
  assert.doesNotMatch(source, /localStorage\.setItem/);
  assert.doesNotMatch(source, /sessionStorage\.setItem/);
});

test("TOTP enrollment and verified enablement are confirmed by trusted server actions", async () => {
  const action = await read("src/app/actions/account-security.ts");
  assert.match(action, /confirmMfaEnrollmentStartedAction/);
  assert.match(action, /totp_enrollment_started/);
  assert.match(action, /confirmMfaEnabledAction/);
  assert.match(action, /getAuthenticatorAssuranceLevel\(\)/);
  assert.match(action, /currentLevel !== "aal2"/);
  assert.match(action, /totp_enabled/);
});

test("factor removal is server-mediated and requires higher assurance", async () => {
  const action = await read("src/app/actions/account-security.ts");
  assert.match(action, /removeTotpFactorAction/);
  assert.match(action, /requireSensitiveAal2/);
  assert.match(action, /auth\.mfa\.unenroll/);
  assert.match(action, /totp_factor_removed/);
});

test("Account Security renders the live TOTP manager instead of a placeholder", async () => {
  const page = await read("src/app/workspace/account/page.tsx");
  assert.match(page, /TotpManager/);
  assert.doesNotMatch(page, /Authenticator app setup controls are added in the next security step/);
});
