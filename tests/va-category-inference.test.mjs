import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("VA profile save stores the primary plus inferred specialties in categories",async()=>{
  const profile=await read("src/app/actions/profile.ts");
  assert.match(profile,/inferCategoriesFromProfile/);
  assert.match(profile,/selectedPrimaryCategory/);
  assert.match(profile,/inferredCategories/);
  assert.match(profile,/selectedPrimaryCategory \|\| inferredPrimaryCategory \|\| inferredCategories\[0\] \|\| null/);
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
  assert.match(action,/inferCategoriesFromProfile/);
  assert.match(action,/primaryLocked/);
  assert.match(action,/primaryLocked = \["approved", "bench"\]\.includes\(stage\) && Boolean\(row\.primary_category\)/);
  assert.match(action,/approved/);
  assert.match(action,/bench/);
  assert.match(action,/\.\.\.inferred/);
  assert.match(action,/primary_category: resolvedPrimaryCategory/);
  assert.match(action,/categories: resolvedCategories/);
  assert.match(roles,/Auto-categorize/);
  assert.match(roles,/autoCategorizeUncategorizedVasAction/);
  assert.match(legacy,/redirect\("\/workspace\/recruiter\/roles#talent-coverage"\)/);
});

test("category inference weights strong profile evidence and avoids generic words",async()=>{
  const inference=await read("src/lib/category-inference.ts");
  assert.doesNotMatch(inference,/\["support",\s*\d+\]/);
  assert.doesNotMatch(inference,/\["content",\s*\d+\]/);
  assert.doesNotMatch(inference,/\["website",\s*\d+\]/);
  assert.match(inference,/category: "Administrative Support"[\s\S]*\["admin", 4\]/);
  assert.match(inference,/category: "SEO"[\s\S]*\["seo", 4\]/);
  assert.match(inference,/category: "Real Estate"[\s\S]*\["real estate", 4\]/);
  assert.match(inference,/headline: 10/);
  assert.match(inference,/skills: 6/);
  assert.match(inference,/industries: 5/);
  assert.match(inference,/tools: 4/);
  assert.match(inference,/bio: 2/);
  assert.match(inference,/declaredCategories: 10/);
  assert.match(inference,/roleScore/);
  assert.match(inference,/field.name !== "industries"/);
  assert.match(inference,/inferPrimaryCategoryFromProfile/);
  assert.match(inference,/MIN_CATEGORY_SCORE = 8/);
  assert.match(inference,/slice\(0, MAX_CATEGORIES\)/);
});

test("recruiter talent category filter supports multiple specialties with any or all semantics",async()=>{
  const filters=await read("src/lib/recruiter-talent-filters.ts");
  assert.match(filters,/stringValues\(filters\.category\)/);
  assert.match(filters,/category_match/);
  assert.match(filters,/primary_category\.eq/);
  assert.match(filters,/categories\.cs/);
  assert.match(filters,/query\.or\(categoryTerms\.join/);
  assert.match(filters,/query = query\.contains\("categories", categories\)/);
});


test("SEO, Admin, and Real Estate can coexist as three weighted specialties", async () => {
  const inference = await read("src/lib/category-inference.ts");
  assert.match(inference, /category: "SEO"/);
  assert.match(inference, /category: "Administrative Support"/);
  assert.match(inference, /category: "Real Estate"/);
  assert.match(inference, /MAX_CATEGORIES = 3/);
  assert.match(inference, /inferCategoryEvidence/);
  assert.match(inference, /inferCategoriesFromProfile/);
});


test("profile save treats user-selected specialties as declared evidence while bulk refresh uses profile evidence", async () => {
  const [profile, refresh] = await Promise.all([
    read("src/app/actions/profile.ts"),
    read("src/app/actions/va-categories.ts"),
  ]);

  assert.match(profile, /declaredCategories:/);
  assert.match(profile, /selectedPrimaryCategory/);
  assert.match(profile, /\.\.\.selectedCategories/);
  assert.match(refresh, /headline: row\.headline/);
  assert.match(refresh, /bio: row\.bio/);
  assert.match(refresh, /skills: row\.skills/);
  assert.match(refresh, /tools: row\.tools/);
  assert.match(refresh, /industries: row\.industries/);
  assert.doesNotMatch(refresh, /declaredCategories: row\.categories/);
  assert.match(refresh, /primaryLocked/);
  assert.match(refresh, /va_categories_recruiter_override/);
  assert.match(refresh, /recruiterOverrideIds/);
  assert.match(refresh, /inferredPrimary \|\| row\.primary_category \|\| inferred\[0\]/);
});
