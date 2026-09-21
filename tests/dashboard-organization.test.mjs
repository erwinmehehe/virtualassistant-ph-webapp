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

test("desktop and mobile navigation use simplified durable workspace groups", () => {
  assert.equal((nav.match(/label: "Workspace"/g) || []).length, 4);
  for (const label of [
    "Overview",
    "Hiring",
    "My Team",
    "Home",
    "Opportunities",
    "My Day",
    "Leads",
    "Roles",
    "Talent",
    "Client Success",
    "Finance",
    "Analytics",
    "Users",
    "Settings",
  ]) {
    assert.match(nav, new RegExp(`\\["${label}",`));
  }
  for (const removedGroup of ["Get recruiter-ready", "Recruiter opportunities", "Agency operations", "Talent operations", "Insights"]) {
    assert.doesNotMatch(nav, new RegExp(`label: "${removedGroup}"`));
  }
  assert.match(nav, /mobile-more-group/);
  assert.match(css, /max-height: min\(70vh/);
});

test("role dashboards share the organized dashboard surface", () => {
  assert.match(client, /dash-page role-overview client-overview/);
  assert.match(va, /dash-page role-overview va-overview/);
  assert.match(recruiter, /Next actions/);
  assert.match(recruiter, /recruiter_today_queue/);
  assert.match(recruiter, /Analytics and maintenance/);
  for (const page of [recruiter, client, va]) assert.match(page, /refreshed when this page opened/);
});

test("overview pages preserve useful loading and degraded states", () => {
  assert.match(client, /DashboardDegradedNotice/);
  assert.match(va, /DashboardDegradedNotice/);
  assert.match(va, /aria-busy="true"/);
  assert.match(recruiter, /aria-busy="true"/);
});


test("authenticated workspace shell does not promote the public site", () => {
  assert.doesNotMatch(shell, /Public site/);
  assert.doesNotMatch(shell, /app-topbar-public/);
  assert.doesNotMatch(shell, /ExternalLink/);
});

test("VA dashboard does not duplicate action verbs in profile guidance", () => {
  assert.doesNotMatch(va, /Add \$\{completion\.next\.label\}/);
  assert.match(va, /completion\.next\.label/);
});
