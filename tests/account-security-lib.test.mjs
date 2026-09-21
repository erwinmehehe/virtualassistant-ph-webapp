import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("account security state derives identity and current session server-side", async () => {
  const source = await read("src/lib/account-security.ts");
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /auth\.getClaims\(\)/);
  assert.match(source, /claims.*session_id/s);
  assert.match(source, /rpc\("list_own_auth_sessions"\)/);
  assert.doesNotMatch(source, /getAccountSecurityState\([^)]*userId/);
});

test("security events derive sensitive request data server-side", async () => {
  const source = await read("src/lib/account-security.ts");
  assert.match(source, /await headers\(\)/);
  assert.match(source, /x-forwarded-for/);
  assert.match(source, /createAdminClient\(\)/);
  assert.doesNotMatch(source, /recordSecurityEvent\([^)]*userId/);
});

test("account security does not depend on MFA while TOTP is deferred", async () => {
  const source = await read("src/lib/account-security.ts");
  assert.doesNotMatch(source, /auth\.mfa\./);
  assert.doesNotMatch(source, /STAFF_MFA_ENFORCEMENT/);
  assert.doesNotMatch(source, /\/auth\/mfa/);
});
