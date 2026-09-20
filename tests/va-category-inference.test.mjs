import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("VA profile save auto-infers specialty only when the VA leaves primary specialty blank",async()=>{
  const profile=await read("src/app/actions/profile.ts");
  assert.match(profile,/inferCategories/);
  assert.match(profile,/selectedPrimaryCategory/);
  assert.match(profile,/inferredCategories/);
  assert.match(profile,/selectedPrimaryCategory \|\| inferredCategories\[0\] \|\| null/);
  assert.match(profile,/primary_category: resolvedPrimaryCategory/);
});

test("recruiter bulk category repair only fills uncategorized pre-approval VAs",async()=>{
  const [action,page]=await Promise.all([
    read("src/app/actions/va-categories.ts"),
    read("src/app/workspace/recruiter/categories/page.tsx"),
  ]);
  assert.match(action,/autoCategorizeUncategorizedVasAction/);
  assert.match(action,/\.is\("primary_category", null\)/);
  assert.match(action,/inferCategories/);
  assert.match(action,/approved/);
  assert.match(action,/bench/);
  assert.match(action,/primary_category: inferred\[0\]/);
  assert.match(page,/Auto-categorize uncategorized/);
  assert.match(page,/autoCategorizeUncategorizedVasAction/);
});

test("category inference favors specific evidence instead of generic support/content words",async()=>{
  const inference=await read("src/lib/category-inference.ts");
  assert.doesNotMatch(inference,/\["Customer Service", \[[^\]]*"support"[,\]]/);
  assert.doesNotMatch(inference,/\["Marketing & Social Media", \[[^\]]*"content"[,\]]/);
  assert.doesNotMatch(inference,/\["Web & WordPress", \[[^\]]*"website"[,\]]/);
  assert.match(inference,/score: terms\.reduce/);
  assert.match(inference,/sort\(\(a, b\) => b\.score - a\.score/);
});
