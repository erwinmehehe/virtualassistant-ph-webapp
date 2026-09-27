import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("recruiter Talent uses the shared 80 percent approval threshold in copy",async()=>{
  const [page,policy]=await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/lib/public-visibility.ts"),
  ]);
  assert.match(policy,/APPROVAL_MIN_COMPLETION = 80/);
  assert.match(page,/Approve eligible \(\{APPROVAL_MIN_COMPLETION\}%\+\)/);
  assert.doesNotMatch(page,/Approve eligible \(60%\+\)/);
});

test("matching copy no longer calls overlap a required gate",async()=>{
  const table=await read("src/components/matching-candidate-table.tsx");
  assert.match(table,/Schedule overlap available/);
  assert.doesNotMatch(table,/Required overlap covered/);
});
