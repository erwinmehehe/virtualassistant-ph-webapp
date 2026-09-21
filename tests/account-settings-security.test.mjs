import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("all workspace roles expose shared Account settings", async () => {
  const nav = await read("src/components/app-nav-links.tsx");
  for (const role of ["client", "va", "recruiter", "admin"]) {
    const roleStart = nav.indexOf(`${role}: [`);
    assert.notEqual(roleStart, -1);
  }
  const matches = nav.match(/\["Account settings", "\/workspace\/account", Settings\]/g) || [];
  assert.equal(matches.length, 4);
});

test("ordinary logout is local while explicit controls cover others and global", async () => {
  const [auth, account] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/app/actions/account-security.ts"),
  ]);
  assert.match(auth, /signOut\(\{ scope: "local" \}\)/);
  assert.match(account, /signOut\(\{ scope: "others" \}\)/);
  assert.match(account, /signOut\(\{ scope: "global" \}\)/);
});

test("session revocation uses the server-only RPC and derives user identity on the server", async () => {
  const account = await read("src/app/actions/account-security.ts");
  assert.match(account, /admin\.rpc\("revoke_auth_session_for_user"/);\n  assert.match(account, /auth\.getUser\(\)/);\n  assert.match(account, /auth\.getClaims\(\)/);\n  assert.match(account, /target_user_id: user\.id/);
  assert.doesNotMatch(account, /formData\.get\("user_id"\)/);
  assert.match(account, /formData\.get\("session_id"\)/);
});

test("shared account page separates personal settings from agency settings and shows session activity", async () => {
  const page = await read("src/app/workspace/account/page.tsx");
  assert.match(page, /requireAnyRole/);
  assert.match(page, /Account settings/);
  assert.match(page, /Where you're logged in/);
  assert.match(page, /Recent security activity/);
  assert.match(page, /Sign-in methods/);
  assert.doesNotMatch(page, /updateMarketplaceSettingsAction/);
});


test("sidebar user card opens personal Account settings", async () => {
  const shell = await read("src/components/app-shell.tsx");
  assert.match(shell, /className="app-account-card"[\s\S]*href="\/workspace\/account"/);
  assert.match(shell, /aria-label="Open account settings"/);
});

test("Account Security stays session-focused while TOTP is deferred", async () => {
  const [page, actions] = await Promise.all([
    read("src/app/workspace/account/page.tsx"),
    read("src/app/actions/account-security.ts"),
  ]);
  assert.doesNotMatch(page, /TotpManager|Two-factor authentication|authenticator app/i);
  assert.doesNotMatch(actions, /auth\.mfa\.|Totp|Mfa/);
  assert.match(actions, /eventType: "session_revoked"/);
});
