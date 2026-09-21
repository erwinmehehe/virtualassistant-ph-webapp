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

test("sensitive AAL2 helper redirects to MFA instead of silently allowing an enrolled aal1 session", async () => {
  const source = await read("src/lib/account-security.ts");
  assert.match(source, /getAuthenticatorAssuranceLevel\(\)/);
  assert.match(source, /verifiedFactors\.length > 0/);
  assert.match(source, /currentLevel !== "aal2"/);
  assert.match(source, /\/auth\/mfa/);
});

test("safe account return paths reject external and protocol-relative destinations", async () => {
  const source = await read("src/lib/account-security.ts");
  assert.match(source, /!value\.startsWith\("\/"\)/);
  assert.match(source, /value\.startsWith\("\/\/"\)/);
  assert.match(source, /value\.includes\("\\\\"\)/);
});
