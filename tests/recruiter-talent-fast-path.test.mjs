import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Recruiter Talent replaces saved-view query fan-out with one summary read", async () => {
  const page = await read("src/app/workspace/recruiter/talent/page.tsx");
  const migration = await read("supabase/migrations/20260924173000_recruiter_talent_fast_path.sql");

  assert.match(page, /from\("recruiter_talent_summary"\)/);
  assert.doesNotMatch(page, /viewCountQueries/);
  assert.doesNotMatch(page, /viewCountResults/);
  assert.doesNotMatch(page, /SAVED_VIEWS\.map\(\(preset\) => \{[\s\S]*countQuery/);

  for (const column of [
    "all_count",
    "approval_ready_count",
    "approval_cleanup_count",
    "missing_photo_count",
    "approved_hidden_count",
    "bench_count",
    "stale_60_count",
    "available_count",
    "needs_review_count",
    "new_accounts_7d",
    "recent_zero_7d",
    "verified_recent_zero_7d",
  ]) {
    assert.ok(migration.includes(column), `Missing Talent summary field: ${column}`);
  }
});

test("Recruiter Talent consolidates row metadata and avoids full va_profiles reads", async () => {
  const page = await read("src/app/workspace/recruiter/talent/page.tsx");
  const migration = await read("supabase/migrations/20260924173000_recruiter_talent_fast_path.sql");

  assert.match(page, /from\("recruiter_talent_page_meta"\)/);
  assert.doesNotMatch(page, /from\("va_profiles"\)\.select\("\*"/);
  assert.doesNotMatch(page, /from\("public_va_directory"\)\.select/);
  assert.doesNotMatch(page, /from\("va_profile_reminders"\)\.select/);

  assert.match(migration, /create or replace view public\.recruiter_talent_page_meta/);
  assert.match(migration, /public_profile_consent_version/);
  assert.match(migration, /exists \([\s\S]*public\.public_va_directory/);
  assert.match(migration, /left join public\.va_profile_reminders/);
});

test("Recruiter Talent only selects table fields it renders", async () => {
  const page = await read("src/app/workspace/recruiter/talent/page.tsx");

  assert.match(
    page,
    /select\("user_id,full_name,avatar_url,headline,primary_category,categories,skills,availability_status,stage,completion_score,missing_items,directory_visible,years_experience,hourly_rate,last_activity_at,email_verified,account_created_at,account_status,classification_status,classification_evidence_count,classification_missing,registration_health,email_confirmed,last_sign_in_at,has_resume"/,
  );
  assert.doesNotMatch(page, /from\("recruiter_va_directory"\)[\s\S]{0,120}\.select\("\*"/);
});

test("Recruiter Talent fast-path views are service-role only", async () => {
  const migration = await read("supabase/migrations/20260924173000_recruiter_talent_fast_path.sql");

  assert.match(migration, /revoke all on public\.recruiter_talent_summary from public, anon, authenticated/);
  assert.match(migration, /grant select on public\.recruiter_talent_summary to service_role/);
  assert.match(migration, /revoke all on public\.recruiter_talent_page_meta from public, anon, authenticated/);
  assert.match(migration, /grant select on public\.recruiter_talent_page_meta to service_role/);
});

test("Recruiter Talent has a route loading state", async () => {
  const loading = await read("src/app/workspace/recruiter/talent/loading.tsx");
  assert.match(loading, /WorkspaceSkeleton/);
});


test("Recruiter Talent exposes multi-specialty chips, any/all matching, and match evidence", async () => {
  const [page, css, rows] = await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/workspace/recruiter-talent.css"),
    read("src/lib/workspace-rows.ts"),
  ]);

  assert.match(page, /VA_CATEGORIES\.map/);
  assert.match(page, /name="category" value=\{category\}/);
  assert.match(page, /name="category_match"/);
  assert.match(page, /Any selected/);
  assert.match(page, /All selected/);
  assert.match(page, /talent-specialty-chips/);
  assert.match(page, /Matched because/);
  assert.match(page, /matchEvidence\.join/);
  assert.match(rows, /categories: string\[\] \| null/);
  assert.match(rows, /skills: string\[\] \| null/);
  assert.match(css, /\.talent-category-options/);
  assert.match(css, /\.talent-specialty-chip\.primary/);
  assert.match(css, /\.talent-match-reason/);
});


test("recruiter candidate profile can correct primary and secondary specialties", async () => {
  const [page, action] = await Promise.all([
    read("src/app/workspace/recruiter/candidates/[id]/page.tsx"),
    read("src/app/actions/recruiter.ts"),
  ]);

  assert.match(page, /updateVaCategoriesAction/);
  assert.match(page, /name="primary_category"/);
  assert.match(page, /name="categories"/);
  assert.match(page, /Save specialties/);
  assert.match(action, /export async function updateVaCategoriesAction/);
  assert.match(action, /VA_CATEGORIES/);
  assert.match(action, /categories\.length > 3/);
  assert.match(action, /va_categories_recruiter_override/);
  assert.match(action, /previous_categories/);
});


test("Recruiter Talent separates incomplete profiles from the classified talent pool", async () => {
  const [page, filters, rows, migration, action, readiness] = await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/lib/recruiter-talent-filters.ts"),
    read("src/lib/workspace-rows.ts"),
    read("supabase/migrations/20260929061500_va_classification_readiness_queue.sql"),
    read("src/app/actions/recruiter-talent.ts"),
    read("src/lib/classification-readiness.ts"),
  ]);

  assert.match(page, /Incomplete profiles/);
  assert.match(page, /Ready to classify/);
  assert.match(page, /classification: "classified"/);
  assert.match(page, /Classification blocked/);
  assert.match(page, /Enough profile evidence to classify/);
  assert.match(filters, /classification_status/);
  assert.match(filters, /incomplete_profile/);
  assert.match(action, /filter_classification/);
  assert.match(rows, /classification_missing/);
  assert.match(rows, /classification_evidence_count/);
  assert.match(migration, /classification_incomplete_count/);
  assert.match(migration, /classification_ready_count/);
  assert.match(migration, /talent_pool_count/);
  assert.match(readiness, /CLASSIFICATION_MIN_SIGNALS = 2/);
  assert.match(readiness, /roleSignalCount >= 1/);
});


test("Recruiter Talent uses one unified search and explicit page selection", async () => {
  const [page, filters, select, css] = await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/lib/recruiter-talent-filters.ts"),
    read("src/components/recruiter-talent-selection-control.tsx"),
    read("src/app/workspace/recruiter-talent.css"),
  ]);

  assert.match(page, /Search name, role, specialty, skill, or tool/);
  assert.doesNotMatch(page, /<span>Skill<\/span><input name="skill"/);
  assert.match(page, /name="availability"/);
  assert.match(page, /RecruiterTalentSelectionControl/);
  assert.match(page, /id="recruiter-talent-bulk-form"/);
  assert.match(page, /filteredSelectionAllowed=\{total <= RECRUITER_BULK_LIMIT\}/);
  assert.match(select, /Select page/);
  assert.match(select, /No rows selected/);
  assert.match(filters, /skills\.cs/);
  assert.match(filters, /tools\.cs/);
  assert.match(filters, /industries\.cs/);
  assert.match(css, /\.talent-selection-control/);
});


test("Recruiter Talent keeps five primary saved views and hides actions until selection", async () => {
  const [page, select, css] = await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/components/recruiter-talent-selection-control.tsx"),
    read("src/app/workspace/recruiter-talent.css"),
  ]);

  assert.match(page, /PRIMARY_SAVED_VIEW_KEYS/);
  assert.match(page, /"all", "incomplete_profiles", "approval_ready", "available", "needs_review"/);
  assert.match(page, /More views/);
  assert.match(page, /secondarySavedViews/);
  assert.match(page, /bulk-action-controls/);
  assert.match(select, /Select all/);
  assert.match(select, /selection_scope/);
  assert.match(select, /dataset\.selectionActive/);
  assert.match(css, /\.bulk-action-controls/);
  assert.match(css, /data-selection-active="true"/);
});
