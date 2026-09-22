import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter approval remains separate from public publishing", async()=>{
  const [talent,action,visibility]=await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/actions/recruiter.ts"),
    read("src/lib/public-visibility.ts")
  ]);
  assert.match(talent,/Approval-ready/);
  assert.match(talent,/APPROVAL_MIN_COMPLETION/);
  assert.match(talent,/PUBLIC_VA_MIN_COMPLETION/);
  assert.match(action,/action === "approve" \|\| action === "approve_publish"/);
  assert.match(action,/rows\.filter\(isRowApprovable\)/);
  assert.match(action,/action === "approve_publish"/);
  assert.match(visibility,/APPROVAL_MIN_COMPLETION = 60/);
  assert.match(visibility,/PUBLIC_VA_MIN_COMPLETION = 80/);
  assert.match(visibility,/photo stays a[\s\S]*public-listing requirement, not an approval one/);
  assert.match(visibility,/current public profile consent/);
});

test("admin workspace has one canonical home", async()=>{
  const [adminPage,nav]=await Promise.all([
    read("src/app/workspace/admin/page.tsx"),
    read("src/components/app-nav-links.tsx"),
  ]);
  assert.match(adminPage,/redirect\("\/workspace\/admin\/today"\)/);
  assert.doesNotMatch(nav,/\["Overview", "\/workspace\/admin"/);
  assert.match(nav,/\["Today", "\/workspace\/admin\/today"/);
});

test("VA interview copy does not promise Zoom specifically", async()=>{
  const page=await read("src/app/workspace/va/page.tsx");
  assert.doesNotMatch(page,/Zoom link/);
  assert.match(page,/schedule, meeting link, and role details/);
});


test("client and VA mobile primary support destinations actually exist in navigation", async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  assert.match(nav,/\["Support", "\/workspace\/client\/support", LifeBuoy\]/);
  assert.match(nav,/\["Support", "\/workspace\/va\/support", LifeBuoy\]/);
  assert.match(nav,/client: \["\/workspace\/client", "\/workspace\/client\/jobs", "\/workspace\/client\/team", "\/workspace\/client\/support"\]/);
  assert.match(nav,/va: \["\/workspace\/va", "\/workspace\/va\/jobs", "\/workspace\/va\/workroom", "\/workspace\/va\/support"\]/);
});
