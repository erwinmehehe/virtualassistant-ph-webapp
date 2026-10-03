import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("VA profile no longer collects or requires a private home address", async () => {
  const [page, action, dashboard] = await Promise.all([
    read("src/app/workspace/va/profile/page.tsx"),
    read("src/app/actions/profile.ts"),
    read("src/app/workspace/va/page.tsx"),
  ]);

  assert.doesNotMatch(page, /name="address"/);
  assert.doesNotMatch(page, /Add your address/);
  assert.doesNotMatch(action, /formData\.get\("address"\)/);
  assert.doesNotMatch(action, /private_address_request/);
  assert.doesNotMatch(dashboard, /title:"Add your address"/);
});

test("recruiters cannot request private home addresses from the talent workflow", async () => {
  const [action, talent, candidate] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/workspace/recruiter/candidates/[id]/page.tsx"),
  ]);

  assert.doesNotMatch(action, /"request_address"/);
  assert.doesNotMatch(action, /private_address_request/);
  assert.doesNotMatch(talent, /Request address/);
  assert.doesNotMatch(candidate, /requestVaPrivateAddressAction/);
  assert.doesNotMatch(candidate, /Request address/);
});
