import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("VA home address is not part of routine profile or onboarding UX", async () => {
  const [action, dashboard, profile, onboarding] = await Promise.all([
    read("src/app/actions/profile.ts"),
    read("src/app/workspace/va/page.tsx"),
    read("src/app/workspace/va/profile/page.tsx"),
    read("src/app/workspace/va/onboarding/page.tsx"),
  ]);
  assert.match(action, /formData\.has\("address"\)/);
  assert.doesNotMatch(dashboard, /title:"Add your address"/);
  assert.doesNotMatch(profile, /name="address"/);
  assert.doesNotMatch(profile, /Current home address/);
  assert.doesNotMatch(onboarding, /name="address"/);
  assert.doesNotMatch(onboarding, /Private address/);
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
