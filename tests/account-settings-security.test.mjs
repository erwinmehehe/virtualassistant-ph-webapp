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
  assert.match(account, /requireSensitiveAal2\("\/workspace\/account\?tab=security"\)/);
});

test("session revocation calls own-session RPC instead of accepting a user id", async () => {
  const account = await read("src/app/actions/account-security.ts");
  assert.match(account, /rpc\("revoke_own_auth_session"/);
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
