import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("learner preference table persists one Australian specialization with own-user RLS", async () => {
  const sql = await readFile("supabase/migrations/20260924095500_training_learner_specialization_preference.sql", "utf8");

  assert.match(sql, /create table if not exists public\.training_learner_preferences/);
  assert.match(sql, /user_id uuid primary key references auth\.users\(id\)/);
  assert.match(sql, /australia_specialization text/);
  assert.match(sql, /tradie-operations/);
  assert.match(sql, /property-management/);
  assert.match(sql, /ndis-allied-health/);
  assert.match(sql, /mortgage-broking/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /auth\.uid\(\)\) = user_id/);
});

test("existing specialization activity is backfilled from the latest defining course", async () => {
  const sql = await readFile("supabase/migrations/20260924095500_training_learner_specialization_preference.sql", "utf8");

  assert.match(sql, /row_number\(\) over \(partition by user_id order by started_at desc\)/);
  assert.match(sql, /australian-trades-administration/);
  assert.match(sql, /servicem8-for-virtual-assistants/);
  assert.match(sql, /property-management-administration-australia/);
  assert.match(sql, /ndis-administration-fundamentals/);
  assert.match(sql, /australian-allied-health-administration/);
  assert.match(sql, /mortgage-broking-administration-australia/);
  assert.match(sql, /on conflict \(user_id\) do nothing/);
});

test("Start path saves the chosen specialization and starts the first unfinished course", async () => {
  const action = await readFile("src/app/actions/training.ts", "utf8");

  assert.match(action, /selectAustraliaSpecializationAction/);
  assert.match(action, /training_learner_preferences/);
  assert.match(action, /australia_specialization: specialization\.slug/);
  assert.match(action, /training_australia_specialization_select/);
  assert.match(action, /const next = pathCourses\.find/);
  assert.match(action, /source: "australia_specialization"/);
  assert.match(action, /redirect\(\`\/workspace\/training\/courses\/\$\{next\.slug\}\`\)/);
});

test("training dashboard loads and uses the persisted Australian path", async () => {
  const data = await readFile("src/lib/training.ts", "utf8");
  const page = await readFile("src/app/workspace/training/page.tsx", "utf8");

  assert.match(data, /TrainingLearnerPreferences/);
  assert.match(data, /training_learner_preferences/);
  assert.match(data, /australiaSpecialization/);
  assert.match(page, /learnerPreferences/);
  assert.match(page, /pathSelected/);
  assert.match(page, /Your path/);
  assert.match(page, /Switch path/);
  assert.match(page, /selectAustraliaSpecializationAction/);
});

test("Explore Courses excludes Australian courses instead of duplicating path content", async () => {
  const page = await readFile("src/app/workspace/training/page.tsx", "utf8");

  assert.match(page, /filter\(\(course\) => course\.country_focus !== "Australia"\)/);
  assert.doesNotMatch(page, /\["australia", "Australia"\]/);
  assert.doesNotMatch(page, /filter === "australia"/);
  assert.match(page, /Australian courses stay in the specialisation paths above/);
});

test("Australian path configuration is shared between learner UI and server action", async () => {
  const config = await readFile("src/lib/training-specializations.ts", "utf8");
  const page = await readFile("src/app/workspace/training/page.tsx", "utf8");
  const action = await readFile("src/app/actions/training.ts", "utf8");

  assert.match(config, /AUSTRALIA_SPECIALIZATIONS/);
  assert.match(config, /getAustraliaSpecialization/);
  assert.match(config, /isAustraliaSpecializationSlug/);
  assert.match(page, /@\/lib\/training-specializations/);
  assert.match(action, /@\/lib\/training-specializations/);
});

test("selected path gets visual emphasis without changing progress or certificates", async () => {
  const css = await readFile("src/app/workspace/training/training-home.css", "utf8");
  const sql = await readFile("supabase/migrations/20260924095500_training_learner_specialization_preference.sql", "utf8");

  assert.match(css, /\.training-specialization\.is-selected/);
  assert.doesNotMatch(sql, /training_lesson_progress/);
  assert.doesNotMatch(sql, /training_certificates/);
  assert.doesNotMatch(sql, /delete\s+from/i);
});
