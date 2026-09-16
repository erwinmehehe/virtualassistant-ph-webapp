import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const model = read("src/lib/talent-operations.ts");
const migration = read("supabase/migrations/20260916060000_agency_certified_shortlist_guard.sql");
const matching = read("src/app/actions/matching.ts");

test("Agency Certified uses the same deterministic evidence as Talent OS client-ready status", () => {
  assert.match(model, /export function isTalentAgencyCertified/);
  assert.match(model, /approved && input\.activePool && available && freshAvailability && setupVerified/);
  assert.match(model, /TALENT_AVAILABILITY_FRESH_DAYS = 30/);
  assert.match(model, /isTalentAgencyCertified\(input, nowMs, freshnessDays\)/);

  assert.match(migration, /p\.account_status = 'active'/);
  assert.match(migration, /vv\.stage in \('approved', 'bench'\)/);
  assert.match(migration, /from public\.bench_memberships bm[\s\S]*bm\.status = 'active'/);
  assert.match(migration, /v\.availability_status = 'available'/);
  assert.match(migration, /v\.availability_confirmed_at >= p_as_of - interval '30 days'/);
  assert.match(migration, /v\.work_setup_verified_at is not null/);
});

test("new client releases are blocked at the database boundary when certification is stale", () => {
  assert.match(migration, /create trigger job_shortlist_agency_certified_release_guard/);
  assert.match(migration, /before insert or update of shortlist_status on public\.job_shortlist_candidates/);
  assert.match(migration, /if new\.shortlist_status <> 'released' then/);
  assert.match(migration, /if not public\.is_va_agency_certified\(new\.va_id, now\(\)\) then/);
  assert.match(migration, /VA is not Agency Certified for client release/);
});

test("internal shortlist work and already-released client records stay intact", () => {
  assert.match(matching, /mode === "release" \? "released" : prior === "released" \? "released" : "proposed"/);
  assert.match(migration, /if new\.shortlist_status <> 'released' then[\s\S]*return new/);
  assert.match(migration, /if tg_op = 'UPDATE' and old\.shortlist_status = 'released' then[\s\S]*return new/);
});

test("Agency Certified helper is server-only", () => {
  assert.match(migration, /revoke execute on function public\.is_va_agency_certified\(uuid, timestamptz\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.is_va_agency_certified\(uuid, timestamptz\) to service_role/);
  assert.match(migration, /revoke execute on function public\.enforce_agency_certified_shortlist_release\(\) from public, anon, authenticated/);
});
