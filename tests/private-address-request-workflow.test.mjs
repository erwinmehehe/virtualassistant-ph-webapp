import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("VA home address is optional and no longer promoted as a profile blocker", async () => {
  const [action, dashboard, profile] = await Promise.all([
    read("src/app/actions/profile.ts"),
    read("src/app/workspace/va/page.tsx"),
    read("src/app/workspace/va/profile/page.tsx"),
  ]);
  assert.doesNotMatch(action, /if \(address\.length < 5/);
  assert.match(action, /if \(address &&/);
  assert.doesNotMatch(dashboard, /title:"Add your address"/);
  assert.match(profile, /Current home address/);
  assert.match(profile, /optional, private/);
  assert.doesNotMatch(profile.match(/name="address"[\s\S]{0,300}/)?.[0] || "", /required/);
});

test("recruiter UI cannot send private-address requests", async () => {
  const [action, talent, candidate] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/workspace/recruiter/candidates/[id]/page.tsx"),
  ]);
  assert.doesNotMatch(action, /requestVaPrivateAddressAction/);
  assert.doesNotMatch(action, /"request_address"/);
  assert.doesNotMatch(talent, /<option value="request_address">/);
  assert.doesNotMatch(candidate, /Request address/);
});
