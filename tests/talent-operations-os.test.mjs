import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const page = read("src/app/workspace/recruiter/bench/page.tsx");
const model = read("src/lib/talent-operations.ts");
const nav = read("src/components/app-nav-links.tsx");

test("Talent OS reuses the existing bench destination instead of adding navigation clutter", () => {
  assert.match(nav, /\["Talent", "\/workspace\/recruiter\/bench", UsersRound\]/);
  assert.doesNotMatch(nav, /\/workspace\/recruiter\/talent-operations/);
  assert.match(nav, /<Link prefetch=\{false\} href=\{href\}/);
});

test("client-ready status requires recorded operational evidence", () => {
  assert.match(model, /approved && input\.activePool && available && freshAvailability && setupVerified/);
  assert.match(model, /TALENT_AVAILABILITY_FRESH_DAYS = 30/);
  assert.match(page, /availability_confirmed_at,work_setup_verified_at/);
  assert.match(page, /Only approved pool members with availability confirmed/);
});

test("coverage recommends development before additional sourcing", () => {
  assert.match(model, /coverageNeed = Math\.max\(demand, target\)/);
  assert.match(model, /sourcingGap = Math\.max\(0, coverageNeed - ready - nearReady\)/);
  assert.match(model, /else if \(readyGap > 0\) status = "develop"/);
  assert.match(page, /Near-ready VAs are counted before recommending additional sourcing/);
});

test("Talent OS derives demand from live agency roles and existing talent records", () => {
  assert.match(page, /from\("jobs"\).*in\("status", \["pending", "published"\]\)/s);
  assert.match(page, /from\("bench_memberships"\)/);
  assert.match(page, /from\("va_vetting"\)/);
  assert.match(page, /from\("va_profiles"\)/);
  assert.match(page, /rpc\("recruiter_talent_health"\)/);
});

test("Talent OS answers sourcing, coverage, client-ready and development questions on one screen", () => {
  assert.match(page, /<h2>Source next<\/h2>/);
  assert.match(page, /<h2>Coverage by specialty<\/h2>/);
  assert.match(page, /<h2>Client-ready now<\/h2>/);
  assert.match(page, /<h2>Development queue<\/h2>/);
  assert.match(page, /<details className="card dashboard-section-card"/);
});

test("record-heavy Talent OS links remain click-to-load", () => {
  assert.match(page, /<Link prefetch=\{false\} href=\{`\/workspace\/recruiter\/candidates\/\$\{candidate\.vaId\}`\}/);
  assert.match(page, /<Link prefetch=\{false\} className="btn" href="\/workspace\/recruiter\/talent">/);
});
