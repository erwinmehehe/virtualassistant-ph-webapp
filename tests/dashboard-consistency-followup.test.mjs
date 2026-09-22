import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter dashboard keeps approval separate from public publishing", async()=>{
  const page=await read("src/app/workspace/recruiter/page.tsx");
  const queueBlock=page.slice(page.indexOf("function RecruiterVettingQueue"),page.indexOf("function RecruiterRolesNeedingMatching"));
  assert.match(queueBlock,/name="bulk_action" value="approve"/);
  assert.doesNotMatch(queueBlock,/name="bulk_action" value="approve_publish"/);
  assert.match(queueBlock,/APPROVAL_MIN_COMPLETION/);
  assert.match(queueBlock,/approval-ready/);
  assert.match(page,/readiness=approval_ready/);
  assert.match(page,/Approval-ready profiles/);
  assert.match(page,/Public-ready profiles/);
  assert.match(page,/photo not required for recruiter approval/);
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
