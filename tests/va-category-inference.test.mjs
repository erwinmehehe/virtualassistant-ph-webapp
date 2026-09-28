import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("VA profile save stores the primary plus inferred specialties in categories",async()=>{
  const profile=await read("src/app/actions/profile.ts");
  assert.match(profile,/inferCategories/);
  assert.match(profile,/selectedPrimaryCategory/);
  assert.match(profile,/inferredCategories/);
  assert.match(profile,/selectedPrimaryCategory \|\| inferredCategories\[0\] \|\| null/);
  assert.match(profile,/resolvedPrimaryCategory \? \[resolvedPrimaryCategory\] : \[\]/);
  assert.match(profile,/\.\.\.inferredCategories/);
  assert.match(profile,/primary_category: resolvedPrimaryCategory/);
  assert.match(profile,/categories: resolvedCategories/);
});

test("recruiter category refresh enriches multi-category profiles while preserving vetted primary specialty",async()=>{
  const [action,roles,legacy]=await Promise.all([
    read("src/app/actions/va-categories.ts"),
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/app/workspace/recruiter/categories/page.tsx"),
  ]);
  assert.match(action,/autoCategorizeUncategorizedVasAction/);
  assert.doesNotMatch(action,/\.is\("primary_category", null\)/);
  assert.match(action,/select\("user_id,headline,bio,primary_category,categories,skills,tools,industries"\)/);
  assert.match(action,/inferCategories/);
  assert.match(action,/primaryLocked/);
  assert.match(action,/approved/);
  assert.match(action,/bench/);
  assert.match(action,/\.\.\.inferred/);
  assert.match(action,/primary_category: resolvedPrimaryCategory/);
  assert.match(action,/categories: resolvedCategories/);
  assert.match(roles,/Auto-categorize/);
  assert.match(roles,/autoCategorizeUncategorizedVasAction/);
  assert.match(legacy,/redirect\("\/workspace\/recruiter\/roles#talent-coverage"\)/);
});

test("category inference recognizes explicit multi-role evidence without generic support/content words",async()=>{
  const inference=await read("src/lib/category-inference.ts");
  assert.doesNotMatch(inference,/\["Customer Service", \[[^\]]*"support"[,]?\]/);
  assert.doesNotMatch(inference,/\["Marketing & Social Media", \[[^\]]*"content"[,]?\]/);
  assert.doesNotMatch(inference,/\["Web & WordPress", \[[^\]]*"website"[,]?\]/);
  assert.match(inference,/\["Administrative Support", \[[^\]]*"admin"/);
  assert.match(inference,/\["SEO", \[[^\]]*"seo"/);
  assert.match(inference,/\["Real Estate", \[[^\]]*"real estate"/);
  assert.match(inference,/score: terms\.reduce/);
  assert.match(inference,/sort\(\(a, b\) => b\.score - a\.score/);
  assert.match(inference,/slice\(0, 3\)/);
});

test("recruiter talent category filter checks primary and categories array",async()=>{
  const filters=await read("src/lib/recruiter-talent-filters.ts");
  assert.match(filters,/primary_category\.eq/);
  assert.match(filters,/categories\.cs/);
  assert.match(filters,/query\.or/);
});
