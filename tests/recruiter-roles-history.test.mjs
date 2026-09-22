import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter roles keeps closed history out of active saved views",async()=>{
  const page=await read("src/app/workspace/recruiter/roles/page.tsx");
  assert.match(page,/const open=jobs\.filter/);
  assert.match(page,/const history=jobs\.filter/);
  assert.match(page,/requestedView==="history"/);
  assert.match(page,/requestedView==="active"/);
  assert.match(page,/ROLE_VIEWS/);
  assert.match(page,/\["history", "History"\]/);
  assert.match(page,/viewCounts/);
  assert.match(page,/visibleJobs\.map/);
});
