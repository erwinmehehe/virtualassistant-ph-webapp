import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter roles keeps closed history out of the active pipeline",async()=>{
  const page=await read("src/app/workspace/recruiter/roles/page.tsx");
  assert.match(page,/const open=jobs\.filter/);
  assert.match(page,/const history=jobs\.filter/);
  assert.match(page,/const visibleJobs=showHistory\?history:open/);
  assert.match(page,/view=history/);
  assert.match(page,/Active \(\{open\.length\}\)/);
  assert.match(page,/History \(\{history\.length\}\)/);
  assert.match(page,/visibleJobs\.map/);
});
