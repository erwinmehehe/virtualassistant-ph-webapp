import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const page = source("src/app/workspace/recruiter/coverage/page.tsx");

test("coverage compares live demand against VAs who can actually be presented", () => {
  // Demand: open leads and open roles, not the whole history.
  assert.match(page, /OPEN_LEAD_STAGES = \["new", "contacted"/);
  assert.match(page, /OPEN_JOB_STATUSES = \["draft", "pending", "published"\]/);
  assert.match(page, /lead_type", "client_hiring"/);

  // Supply: benched AND complete AND available, because anything less cannot
  // be put in front of a client.
  assert.match(page, /\["approved", "bench"\]\.includes/);
  assert.match(page, /completion_score \|\| 0\) >= PUBLIC_VA_MIN_COMPLETION/);
  assert.match(page, /availability_status === "available"/);
  assert.match(page, /shortfall: Math\.max\(0, Math\.max\(open, open > 0 \? 3 : 0\) - available\.length\)/);
});

test("requests that match no category are surfaced rather than dropped", () => {
  // This is how a specialty nobody is tagged for, like dental billing,
  // becomes visible instead of being silently unmatchable.
  assert.match(page, /const unmapped = new Map<string, number>\(\)/);
  assert.match(page, /Requests with no matching specialty/);
});

test("coverage is reachable and recruiter-gated", () => {
  const nav = source("src/components/app-nav-links.tsx");
  assert.match(nav, /"Coverage", "\/workspace\/recruiter\/coverage"/);
  assert.match(page, /requireAnyRole\(\["recruiter", "admin"\]\)/);
});
