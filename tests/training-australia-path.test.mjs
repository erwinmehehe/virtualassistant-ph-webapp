import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationFiles = [
  "supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql",
  "supabase/migrations/20260923062100_build_australian_allied_health.sql",
  "supabase/migrations/20260923062200_build_cliniko_va_training.sql",
  "supabase/migrations/20260923062300_build_australian_bookkeeping.sql",
  "supabase/migrations/20260923062400_build_xero_va_training.sql",
  "supabase/migrations/20260923062500_build_myob_va_training.sql",
  "supabase/migrations/20260923062600_build_ndis_admin_training.sql",
  "supabase/migrations/20260923062700_build_property_management_australia.sql",
  "supabase/migrations/20260923062800_build_mortgage_broking_australia.sql",
];

const expectedCourses = [
  ["australian-va-fundamentals", 1, 8, 184],
  ["australian-trades-administration", 2, 8, 240],
  ["servicem8-for-virtual-assistants", 3, 8, 208],
  ["australian-allied-health-administration", 4, 8, 240],
  ["cliniko-for-virtual-assistants", 5, 7, 182],
  ["australian-bookkeeping-administration", 6, 8, 240],
  ["xero-workflows-for-virtual-assistants", 7, 7, 182],
  ["myob-workflows-for-virtual-assistants", 8, 6, 180],
  ["ndis-administration-fundamentals", 9, 10, 300],
  ["property-management-administration-australia", 10, 8, 240],
  ["mortgage-broking-administration-australia", 11, 8, 240],
];

test("Australia learning path schema is optional and hiring-independent", async () => {
  const sql = await readFile("supabase/migrations/20260923060000_add_training_learning_paths.sql", "utf8");
  assert.match(sql, /training_learning_paths/);
  assert.match(sql, /training_learning_path_courses/);
  assert.match(sql, /is_optional boolean not null default true/);
  assert.match(sql, /'australia'/);
  assert.match(sql, /'draft'/);
  assert.doesNotMatch(sql, /va_vetting|applications|shortlist|directory_visible/i);
});

test("all eleven Australia courses and eighty-six lessons are authored", async () => {
  let all = "";
  for (const path of migrationFiles) all += "\n" + await readFile(path, "utf8");

  const courseInserts = all.match(/insert into public\.training_courses/g) || [];
  const lessonInserts = all.match(/insert into public\.training_lessons/g) || [];
  const assessmentInserts = all.match(/insert into public\.training_assessments/g) || [];
  assert.equal(courseInserts.length, 11);
  assert.equal(lessonInserts.length, 86);
  assert.equal(assessmentInserts.length, 11);

  for (const [slug, pathPosition, lessonCount, minutes] of expectedCourses) {
    assert.ok(all.includes(slug), "Missing Australia course: " + slug);
    assert.ok(minutes > 0 && lessonCount > 0 && pathPosition > 0);
  }

  const pathMappings = all.match(/insert into public\.training_learning_path_courses/g) || [];
  assert.equal(pathMappings.length, 11);
  const mappedPositions = [...all.matchAll(/\),\s*(\d+)\s*,\s*true\s*\)/g)]
    .map((match) => Number(match[1]))
    .sort((a, b) => a - b);
  assert.deepEqual(mappedPositions, [1,2,3,4,5,6,7,8,9,10,11]);

  const totalMinutes = expectedCourses.reduce((sum, item) => sum + item[3], 0);
  const totalLessons = expectedCourses.reduce((sum, item) => sum + item[2], 0);
  assert.equal(totalMinutes, 2436);
  assert.equal(totalLessons, 86);
});

test("Australia training remains completely draft and unpublished", async () => {
  let all = "";
  for (const path of migrationFiles) all += "\n" + await readFile(path, "utf8");

  assert.match(all, /'draft'/);
  assert.doesNotMatch(all, /status\s*=\s*'published'/i);
  assert.doesNotMatch(all, /is_published\s*=\s*true/i);
  assert.doesNotMatch(all, /,true,1,null,null,now\(\),now\(\)/i);
  assert.match(all, /is_published=false/);
  assert.match(all, /reviewed_by=null/);
  assert.match(all, /last_reviewed_at=null/);
});

test("software courses carry independent trademark and currency warnings", async () => {
  const serviceM8 = await readFile(migrationFiles[0], "utf8");
  const cliniko = await readFile(migrationFiles[2], "utf8");
  const xero = await readFile(migrationFiles[4], "utf8");
  const myob = await readFile(migrationFiles[5], "utf8");

  for (const [source, brand] of [[serviceM8,"ServiceM8"],[cliniko,"Cliniko"],[xero,"Xero"],[myob,"MYOB"]]) {
    assert.match(source, new RegExp("not affiliated with, certified by, or endorsed by " + brand, "i"));
    assert.match(source, /verify current official/i);
  }
});

test("regulated Australia courses state their professional boundaries", async () => {
  const health = await readFile(migrationFiles[1], "utf8");
  const bookkeeping = await readFile(migrationFiles[3], "utf8");
  const ndis = await readFile(migrationFiles[6], "utf8");
  const property = await readFile(migrationFiles[7], "utf8");
  const mortgage = await readFile(migrationFiles[8], "utf8");

  assert.match(health, /Do not give clinical advice/i);
  assert.match(bookkeeping, /not tax, BAS, accounting, payroll, or financial advice/i);
  assert.match(ndis, /not affiliated with, certified by, or endorsed by the NDIA or NDIS Quality and Safeguards Commission/i);
  assert.match(ndis, /1 July 2026/i);
  assert.match(property, /state and territory/i);
  assert.match(mortgage, /Do not recommend lenders or loan products/i);
  assert.match(mortgage, /credit assistance/i);
});

test("learner UI only exposes published paths and avoids duplicate course cards", async () => {
  const training = await readFile("src/lib/training.ts", "utf8");
  const page = await readFile("src/app/workspace/training/page.tsx", "utf8");

  assert.match(training, /from\("training_learning_paths"\)/);
  assert.match(training, /\.eq\("status", "published"\)/);
  assert.match(page, /const notStarted = courses\.filter/);
  assert.match(page, /filteredNotStarted/);
  assert.match(page, /Each course appears once/);
  assert.doesNotMatch(page, /paths\.map/);
});

test("admin surfaces optional learning paths without changing hiring rules", async () => {
  const page = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");
  assert.match(page, /Learning paths/);
  assert.match(page, /They never control hiring eligibility/);
  assert.match(page, /courseCount/);
});


test("learning path publication is admin-only and requires a published course", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  const admin = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");
  assert.match(action, /setTrainingLearningPathStatusAction/);
  assert.match(action, /requireRoleFast\("admin"\)/);
  assert.match(action, /Publish at least one reviewed course before publishing this learning path/);
  assert.match(action, /training_learning_path_courses/);
  assert.match(action, /\.eq\("status", "published"\)/);
  assert.match(admin, /Publish path/);
  assert.match(admin, /Return to draft/);
});


test("ServiceM8 metadata matches its eight twenty-six-minute lessons", async () => {
  const seed = await readFile("supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql", "utf8");
  const fix = await readFile("supabase/migrations/20260923062900_fix_servicem8_training_duration.sql", "utf8");
  assert.match(seed, /'servicem8-for-virtual-assistants'[\s\S]{0,700}\n\s*208,18,'draft'/);
  assert.match(fix, /estimated_minutes = 208/);
});
