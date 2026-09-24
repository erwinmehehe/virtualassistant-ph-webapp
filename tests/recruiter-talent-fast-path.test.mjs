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
    /select\("user_id,full_name,avatar_url,headline,primary_category,availability_status,stage,completion_score,missing_items,directory_visible,years_experience,hourly_rate,last_activity_at,email_verified,account_created_at,account_status"/,
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
