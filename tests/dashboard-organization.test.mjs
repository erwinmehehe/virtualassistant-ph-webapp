import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const shell = read("src/components/app-shell.tsx");
const nav = read("src/components/app-nav-links.tsx");
const recruiter = read("src/app/workspace/recruiter/page.tsx");
const client = read("src/app/workspace/client/page.tsx");
const va = read("src/app/workspace/va/page.tsx");
const css = read("src/app/dashboard-premium.css");

test("workspace shell leaves the page-level h1 to route content", () => {
  assert.equal((shell.match(/<h1/g) || []).length, 0);
  for (const page of [client, va]) assert.equal((page.match(/<h1/g) || []).length, 1);
  assert.match(recruiter, /<DashHeader/);
});

test("desktop and mobile navigation use labelled groups", () => {
  for (const label of ["Hiring", "Collaboration", "Account", "Get ready", "Opportunities", "Client pipeline", "Talent operations", "Insights"]) {
    assert.match(nav, new RegExp(`label: "${label}"`));
  }
  assert.match(nav, /mobile-more-group/);
  assert.match(css, /max-height: min\(70vh/);
});

test("role dashboards share the organized dashboard surface", () => {
  assert.match(client, /dash-page role-overview client-overview/);
  assert.match(va, /dash-page role-overview va-overview/);
  assert.match(recruiter, /Today’s priority actions/);
  assert.match(recruiter, /Analytics and maintenance/);
  for (const page of [recruiter, client, va]) assert.match(page, /refreshed when this page opened/);
});

test("overview pages preserve useful loading and degraded states", () => {
  assert.match(client, /DashboardDegradedNotice/);
  assert.match(va, /DashboardDegradedNotice/);
  assert.match(va, /aria-busy="true"/);
  assert.match(recruiter, /aria-busy="true"/);
});
