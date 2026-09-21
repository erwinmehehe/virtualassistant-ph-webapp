import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Account Center keeps editable personal profile controls and role-aware workspace shortcuts", async () => {
  const [page, actions] = await Promise.all([
    read("src/app/workspace/account/page.tsx"),
    read("src/app/actions/account-security.ts"),
  ]);

  assert.match(page, /account-settings-header/);
  assert.match(page, /Personal profile/);
  assert.match(page, /action=\{updateAccountProfileAction\}/);
  assert.match(page, /name="full_name"/);
  assert.match(page, /name="avatar"/);
  assert.match(page, /Email changes require a separate verified account flow/);
  assert.match(page, /Company profile/);
  assert.match(page, /Professional VA profile/);
  assert.match(page, /Recruiter workspace/);
  assert.match(page, /Admin workspace/);
  assert.doesNotMatch(page, /account-identity-hero/);

  assert.match(actions, /export async function updateAccountProfileAction/);
  assert.match(actions, /requireAnyRole\(\["admin", "recruiter", "client", "va"\]\)/);
  assert.match(actions, /avatar\.size > 3 \* 1024 \* 1024/);
  assert.match(actions, /image\/jpeg/);
  assert.match(actions, /image\/png/);
  assert.match(actions, /image\/webp/);
  assert.match(actions, /full_name: parsedName\.data/);
  assert.doesNotMatch(actions, /updateUser\(\{\s*email/);
});

test("Account Center exposes meaningful account and security state without TOTP", async () => {
  const page = await read("src/app/workspace/account/page.tsx");

  assert.match(page, /account-verified-badge/);
  assert.match(page, /active session/);
  assert.match(page, /Last sign-in/);
  assert.match(page, /Change password/);
  assert.match(page, /Where you're logged in/);
  assert.match(page, /Recent security activity/);
  assert.match(page, /profile_updated: "Personal profile updated"/);
  assert.doesNotMatch(page, /TOTP|Two-factor authentication|Authenticator app/);
});

test("Account Center session UI is information-rich and responsive", async () => {
  const [sessions, css] = await Promise.all([
    read("src/components/account-security/session-list.tsx"),
    read("src/app/workspace/account-center.css"),
  ]);

  assert.match(sessions, /account-session-card/);
  assert.match(sessions, /This device/);
  assert.match(sessions, /Location unavailable/);
  assert.match(sessions, /IP address/);
  assert.match(sessions, /Sign-in method/);
  assert.match(sessions, /Last activity/);
  assert.match(sessions, /Log out other devices/);
  assert.match(sessions, /Log out everywhere/);

  assert.match(css, /\.account-settings-shell \{/);
  assert.match(css, /\.account-settings-nav \{/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /overflow-x: auto/);
  assert.match(css, /\.account-session-meta \{/);
  assert.match(css, /grid-template-columns: 1fr/);
});
