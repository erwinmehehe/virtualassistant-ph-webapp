import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const smoke = read("scripts/authenticated-production-smoke.mjs");
const dashboards = {
  client: read("src/app/workspace/client/page.tsx"),
  va: read("src/app/workspace/va/page.tsx"),
  recruiter: read("src/app/workspace/recruiter/page.tsx"),
  admin: read("src/app/workspace/admin/today/page.tsx"),
};

const expected = {
  client: "Your hiring progress",
  va: "What should you do next?",
  recruiter: "Today’s work",
  admin: "Owner Command Center",
};

test("authenticated production smoke uses markers rendered by each current dashboard", () => {
  for (const [role, marker] of Object.entries(expected)) {
    assert.ok(smoke.includes(`marker: \"${marker}\"`), `smoke config is missing the ${role} marker`);
    assert.ok(dashboards[role].includes(marker), `${role} dashboard no longer renders smoke marker: ${marker}`);
  }
});

test("authenticated production smoke verifies role isolation for every workspace", () => {
  for (const path of ["/workspace/client", "/workspace/va", "/workspace/recruiter", "/workspace/admin/today"]) {
    assert.ok(smoke.includes(`path: \"${path}\"`), `smoke config is missing ${path}`);
  }
  assert.match(smoke, /cross-role request should redirect/);
  assert.match(smoke, /logged-out client workspace should redirect/i);
});


test("authenticated smoke checks the recruiter-to-client shortlist handoff without mutating production", () => {
  assert.match(smoke, /smokeClientHandoff/);
  assert.match(smoke, /\/workspace\/recruiter\/matching/);
  assert.match(smoke, /Preview client view/);
  assert.match(smoke, /\/workspace\/client\/candidates/);
  assert.match(smoke, /Client Hiring Room leaked recruiter-only UI/);
  assert.match(smoke, /Open recruiter scorecard/);
  assert.match(smoke, /match-meter/);
  assert.match(smoke, /% confidence/);
});
