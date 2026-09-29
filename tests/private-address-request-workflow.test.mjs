import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("recruiters can request missing private addresses without changing VA stage", async () => {
  const [action, talent, candidate] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/workspace/recruiter/candidates/[id]/page.tsx"),
  ]);

  assert.match(action, /"request_address"/);
  assert.match(action, /type: "private_address_request"/);
  assert.match(action, /has_private_address !== true/);
  assert.match(action, /\.is\("done_at", null\)/);
  assert.match(action, /private_address_requested/);
  assert.doesNotMatch(
    action.match(/else if \(action === "request_address"\)[\s\S]*?else if \(action === "hide"\)/)?.[0] || "",
    /va_vetting[^\n]*update\(/
  );

  assert.match(talent, /<option value="request_address">Request private address<\/option>/);
  assert.match(candidate, /requestVaPrivateAddressAction/);
  assert.match(candidate, /Request private address/);
  assert.match(candidate, /Ask the VA to confirm the current address rather than guessing/);
});

test("saving a private address resolves outstanding address requests without logging the address value", async () => {
  const profile = await read("src/app/actions/profile.ts");

  assert.match(profile, /eq\("type", "private_address_request"\)/);
  assert.match(profile, /update\(\{ done_at: resolvedAt, read_at: resolvedAt, snoozed_until: null \}\)/);
  assert.match(profile, /private_address_provided/);
  assert.match(profile, /VA provided the requested private home address/);

  const activityBlock = profile.match(/action: "private_address_provided"[\s\S]{0,260}/)?.[0] || "";
  assert.doesNotMatch(activityBlock, /address,/);
  assert.doesNotMatch(activityBlock, /metadata/);
});

test("address requests point VAs directly to the private profile field", async () => {
  const [action, dashboard, profilePage] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/va/page.tsx"),
    read("src/app/workspace/va/profile/page.tsx"),
  ]);

  assert.match(action, /href: "\/workspace\/va\/profile#basics"/);
  assert.match(dashboard, /title:"Add your private address"/);
  assert.match(dashboard, /href:"\/workspace\/va\/profile#basics"/);
  assert.match(profilePage, /name="address"/);
  assert.match(profilePage, /never shown on your public profile/);
});
