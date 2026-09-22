import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("public jobs use a sanitized database surface instead of the raw jobs table", () => {
  const listing = read("src/app/jobs/page.tsx");
  const detail = read("src/app/jobs/[id]/page.tsx");
  const migration = read("supabase/migrations/20260922223206_add_safe_public_jobs_and_atomic_rate_limit.sql");

  assert.match(listing, /\.from\("public_jobs"\)/);
  assert.match(detail, /\.from\("public_jobs"\)/);
  assert.doesNotMatch(listing, /\.from\("jobs"\)/);
  assert.doesNotMatch(detail, /\.from\("jobs"\)/);
  assert.match(migration, /j\.status = 'published'/);
  assert.match(migration, /j\.moderation_status = 'clear'/);
  assert.match(migration, /j\.client_id is not null/);
  assert.doesNotMatch(migration, /recruiter_id|rejection_note|hiring_stage|requested_va_id/);
});

test("application snapshots never copy private resume or direct-contact paths", () => {
  for (const path of ["src/app/actions/applications.ts", "src/app/actions/va-interest.ts"]) {
    const source = read(path);
    assert.doesNotMatch(source, /resume_path:\s*va\.resume_path/);
    assert.doesNotMatch(source, /linkedin_url:\s*va\.linkedin_url/);
    assert.doesNotMatch(source, /portfolio_url:\s*va\.portfolio_url/);
  }
});

test("action rate limiting is atomic and unavailable to browser roles", () => {
  const limiter = read("src/lib/rate-limit.ts");
  const migration = read("supabase/migrations/20260922223206_add_safe_public_jobs_and_atomic_rate_limit.sql");

  assert.match(limiter, /\.rpc\("consume_action_rate_limit"/);
  assert.doesNotMatch(limiter, /\.from\("action_rate_limits"\)/);
  assert.match(migration, /on conflict \(action_key, subject_hash\)/);
  assert.match(migration, /revoke all on function public\.consume_action_rate_limit[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.consume_action_rate_limit[\s\S]*to service_role/);
});

test("expensive public forms are rate limited and Turnstile-ready", () => {
  const leads = read("src/app/actions/leads.ts");
  const hiring = read("src/components/hiring-brief-form.tsx");
  const booking = read("src/components/client-booking-form.tsx");
  const contact = read("src/app/contact/page.tsx");

  for (const key of ["public_role_brief", "public_contact", "public_discovery_booking"]) {
    assert.match(leads, new RegExp(`actionKey: "${key}"[\\s\\S]{0,220}requireTurnstile: true`));
  }
  for (const key of ["public_service_match", "public_industry_match"]) {
    assert.match(leads, new RegExp(`actionKey: "${key}"`));
  }
  assert.match(leads, /x-forwarded-for/);
  assert.match(hiring, /<TurnstileWidget \/>/);
  assert.match(booking, /<TurnstileWidget \/>/);
  assert.match(contact, /<TurnstileWidget \/>/);
});

test("resume uploads and browser security headers are hardened", () => {
  const profile = read("src/app/actions/profile.ts");
  const config = read("next.config.ts");

  assert.match(profile, /application\/pdf/);
  assert.match(profile, /application\/msword/);
  assert.match(profile, /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/);
  assert.doesNotMatch(profile, /application\/octet-stream/);
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /frame-ancestors 'self'/);
  assert.match(config, /https:\/\/challenges\.cloudflare\.com/);
});

test("public VA directory no longer exposes exact identity or activity timestamps", () => {
  const migration = read("supabase/migrations/20260922224112_remove_public_va_exact_activity_timestamps.sql");
  assert.match(migration, /null::timestamptz as identity_verified_at/);
  assert.match(migration, /null::timestamptz as last_active_at/);
  assert.doesNotMatch(migration, /\n\s*p\.identity_verified_at,/);
  assert.doesNotMatch(migration, /\n\s*p\.last_active_at,/);
});

test("Turnstile production configuration is documented without committing keys", () => {
  const env = read(".env.example");
  assert.match(env, /^NEXT_PUBLIC_TURNSTILE_SITE_KEY=$/m);
  assert.match(env, /^TURNSTILE_SECRET_KEY=$/m);
});
